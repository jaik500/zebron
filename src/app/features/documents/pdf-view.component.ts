import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

import { TranslatePipe } from '../../core/i18n/translate.pipe';

/**
 * Shows a PDF with pdf.js (pdfjs-dist), loaded only when a PDF is opened.
 * Pages are drawn when they come near the screen, with a selectable text
 * layer on top so text can be copied and read by screen readers. The PDF's
 * own scripts never run (no pdf.js scripting sandbox is loaded; XFA is off).
 *
 * The worker, character maps, standard fonts and image decoders are served
 * from /pdfjs/ (angular.json copies them from node_modules/pdfjs-dist).
 */
const WORKER_SRC = '/pdfjs/pdf.worker.min.mjs';
const RENDER_MARGIN = '1200px 0px';

interface PageSlot {
  number: number;
  element: HTMLDivElement;
  rendered: number; // the scale it was rendered at, 0 = not rendered
  task: RenderTask | null;
}

@Component({
  selector: 'app-pdf-view',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (status() === 'loading') {
      <p class="py-16 text-center text-sm opacity-70" role="status">{{ 'Opening the PDF...' | t }}</p>
    } @else if (status() === 'error') {
      <p class="py-16 text-center text-sm" role="alert">{{ 'This PDF could not be opened. It may be damaged or protected with a password.' | t }}</p>
    }
    <div #pages class="zb-pdf-pages mx-auto flex w-max min-w-full flex-col items-center gap-3"></div>
  `,
  styles: `
    .zb-pdf-page {
      position: relative;
      background: #fff;
      box-shadow: 0 1px 3px rgb(15 23 42 / 0.25);
      --scale-round-x: 1px;
      --scale-round-y: 1px;
      flex: none;
    }
    app-pdf-view { display: block; overflow-x: auto; }
    .zb-pdf-page canvas { display: block; }
    .zb-pdf-page .zb-pdf-number {
      position: absolute; right: 6px; bottom: 4px; font: 11px sans-serif; color: #64748b; pointer-events: none;
    }
    /* Text layer (from pdfjs-dist/web/pdf_viewer.css, trimmed). */
    .zb-pdf-page .textLayer {
      position: absolute; text-align: initial; inset: 0; overflow: clip; opacity: 1; line-height: 1;
      text-size-adjust: none; forced-color-adjust: none; transform-origin: 0 0; z-index: 0;
      --min-font-size: 1;
      --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
      --min-font-size-inv: calc(1 / var(--min-font-size));
    }
    .zb-pdf-page .textLayer :is(span, br) {
      color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; user-select: text;
    }
    .zb-pdf-page .textLayer > :not(.markedContent),
    .zb-pdf-page .textLayer .markedContent span:not(.markedContent) {
      z-index: 1; --font-height: 0; font-size: calc(var(--text-scale-factor) * var(--font-height));
      --scale-x: 1; --rotate: 0deg;
      transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
    }
    .zb-pdf-page .textLayer .markedContent { display: contents; }
    .zb-pdf-page .textLayer ::selection { background: rgb(0 121 121 / 0.3); color: transparent; }
    .zb-pdf-page .textLayer br::selection { background: transparent; }
    .zb-pdf-page .textLayer .endOfContent { display: block; position: absolute; inset: 100% 0 0; z-index: 0; cursor: default; user-select: none; }
  `,
})
export class PdfViewComponent {
  /** The PDF file. */
  readonly data = input.required<ArrayBuffer>();
  /** 1 = the page fits the width of the reading area. */
  readonly zoom = input(1);
  /** Page to show first (1-based). */
  readonly startPage = input(1);
  /** CSS filter for reading themes (sepia, dark). */
  readonly pageFilter = input('none');

  readonly pageChange = output<{ page: number; total: number }>();

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  private readonly pagesRef = viewChild.required<ElementRef<HTMLDivElement>>('pages');
  private readonly host = inject(ElementRef<HTMLElement>);

  private pdfjs: typeof import('pdfjs-dist') | null = null;
  private loadingTask: PDFDocumentLoadingTask | null = null;
  private pdf: PDFDocumentProxy | null = null;
  private slots: PageSlot[] = [];
  private pageSize = { width: 612, height: 792 };
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private currentPage = 1;
  private scrollFrame = 0;
  private destroyed = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.host.nativeElement);
      window.addEventListener('scroll', this.onScroll, { passive: true });
    });

    effect(() => {
      const data = this.data();
      untracked(() => void this.open(data));
    });

    // Zoom changes redraw the pages at the new size and keep the same page in view.
    effect(() => {
      this.zoom();
      untracked(() => this.layout(true));
    });

    effect(() => {
      const filter = this.pageFilter();
      untracked(() => this.slots.forEach((slot) => (slot.element.style.filter = filter)));
    });

    destroyRef.onDestroy(() => {
      this.destroyed = true;
      window.removeEventListener('scroll', this.onScroll);
      cancelAnimationFrame(this.scrollFrame);
      this.observer?.disconnect();
      this.resizeObserver?.disconnect();
      this.slots.forEach((slot) => slot.task?.cancel());
      void this.loadingTask?.destroy();
    });
  }

  /** Scroll to a page (1-based). */
  goToPage(page: number): void {
    const slot = this.slots[Math.min(Math.max(1, Math.round(page)), this.slots.length) - 1];
    if (!slot) return;
    const top = slot.element.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top: Math.max(0, top) });
    this.currentPage = slot.number;
    this.pageChange.emit({ page: slot.number, total: this.slots.length });
  }

  private async open(data: ArrayBuffer): Promise<void> {
    this.status.set('loading');
    try {
      this.pdfjs ??= await import('pdfjs-dist');
      this.pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
      // pdf.js hands the bytes to its worker, so give it a copy. XFA forms stay off;
      // pdf.js 6 never evaluates code from the file.
      void this.loadingTask?.destroy();
      this.loadingTask = this.pdfjs.getDocument({
        data: new Uint8Array(data.slice(0)),
        enableXfa: false,
        // Fonts, character maps (Asian scripts) and image decoders, copied by angular.json.
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
      });
      this.pdf = await this.loadingTask.promise;
      if (this.destroyed) return;
      const first = await this.pdf.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      this.pageSize = { width: viewport.width, height: viewport.height };
      this.buildSlots(this.pdf.numPages);
      this.status.set('ready');
      this.layout(false);
      requestAnimationFrame(() => this.goToPage(this.startPage()));
    } catch {
      this.status.set('error');
    }
  }

  private buildSlots(count: number): void {
    const container = this.pagesRef().nativeElement;
    container.replaceChildren();
    this.observer?.disconnect();
    this.observer = new IntersectionObserver((entries) => this.onVisible(entries), { rootMargin: RENDER_MARGIN });
    this.slots = Array.from({ length: count }, (_, index) => {
      const element = document.createElement('div');
      element.className = 'zb-pdf-page';
      element.dataset['page'] = String(index + 1);
      element.setAttribute('role', 'region');
      element.setAttribute('aria-label', `Page ${index + 1}`);
      element.style.filter = this.pageFilter();
      const number = document.createElement('span');
      number.className = 'zb-pdf-number';
      number.textContent = String(index + 1);
      element.appendChild(number);
      container.appendChild(element);
      this.observer!.observe(element);
      return { number: index + 1, element, rendered: 0, task: null };
    });
  }

  private scale(): number {
    const available = Math.max(200, this.width || this.host.nativeElement.clientWidth || 800);
    return (available / this.pageSize.width) * this.zoom();
  }

  /** Size every page placeholder for the current width and zoom; redraw pages on screen. */
  private layout(keepPage: boolean): void {
    if (!this.slots.length) return;
    const page = this.currentPage;
    const scale = this.scale();
    for (const slot of this.slots) {
      if (slot.rendered && Math.abs(slot.rendered - scale) < 0.01) continue;
      slot.task?.cancel();
      slot.task = null;
      slot.rendered = 0;
      slot.element.querySelectorAll('canvas, .textLayer').forEach((node) => node.remove());
      slot.element.style.width = `${Math.floor(this.pageSize.width * scale)}px`;
      slot.element.style.height = `${Math.floor(this.pageSize.height * scale)}px`;
    }
    // Re-observe so pages already on screen are drawn again.
    this.slots.forEach((slot) => {
      this.observer?.unobserve(slot.element);
      this.observer?.observe(slot.element);
    });
    if (keepPage) requestAnimationFrame(() => this.goToPage(page));
  }

  private onResize(): void {
    const width = this.host.nativeElement.clientWidth;
    if (Math.abs(width - this.width) < 8) return;
    this.width = width;
    this.layout(true);
  }

  private onVisible(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const slot = this.slots[Number((entry.target as HTMLElement).dataset['page']) - 1];
      if (slot && !slot.rendered && !slot.task) void this.render(slot);
    }
  }

  private async render(slot: PageSlot): Promise<void> {
    if (!this.pdf || !this.pdfjs) return;
    const scale = this.scale();
    let page: PDFPageProxy;
    try {
      page = await this.pdf.getPage(slot.number);
    } catch {
      return;
    }
    const viewport = page.getViewport({ scale });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    canvas.setAttribute('aria-hidden', 'true');

    // Pages can differ in size from the first one.
    slot.element.style.width = canvas.style.width;
    slot.element.style.height = canvas.style.height;
    slot.element.style.setProperty('--scale-factor', String(scale));
    slot.element.style.setProperty('--total-scale-factor', String(scale));

    const task = page.render({
      canvas,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    });
    slot.task = task;
    try {
      await task.promise;
    } catch {
      slot.task = null;
      return; // cancelled (zoom or resize): drawn again later
    }
    slot.task = null;
    if (this.destroyed) return;
    slot.element.querySelectorAll('canvas, .textLayer').forEach((node) => node.remove());
    slot.element.prepend(canvas);
    slot.rendered = scale;

    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    slot.element.appendChild(textLayer);
    try {
      await new this.pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textLayer, viewport }).render();
    } catch {
      // Text selection is extra; the page is already drawn.
    }
  }

  private readonly onScroll = (): void => {
    cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = requestAnimationFrame(() => {
      const line = window.innerHeight * 0.35;
      const visible = this.slots.find((slot) => slot.element.getBoundingClientRect().bottom > line);
      if (visible && visible.number !== this.currentPage) {
        this.currentPage = visible.number;
        this.pageChange.emit({ page: visible.number, total: this.slots.length });
      }
    });
  };
}
