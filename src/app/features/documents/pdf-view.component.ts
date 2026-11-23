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
import { ReaderLinkService, createLinkService, hasFillableFields, renderFormLayer } from './pdf-forms';

/**
 * Shows a PDF with pdf.js (pdfjs-dist), loaded only when a PDF is opened.
 * Pages are drawn when they come near the screen, with a selectable text
 * layer on top so text can be copied and read by screen readers. The PDF's
 * own scripts never run (no pdf.js scripting sandbox is loaded; XFA is off).
 *
 * Fillable forms: form fields are drawn as real inputs on top of the page
 * (pdf-forms.ts); what the person types is kept in the document's
 * annotationStorage and filledBytes() returns the PDF with the answers in it.
 * Links in the PDF work too (web links open in a new tab).
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
    /* Highlights (features/courses/annotations) are drawn in the text layer; the layer
       multiplies onto the page so the printed text under a highlight stays visible
       (a blend on the mark alone stays inside pdf.js's span stacking contexts). */
    .zb-pdf-page .textLayer { mix-blend-mode: multiply; }
    .zb-pdf-page .textLayer mark { color: transparent !important; }
    .zb-pdf-page .textLayer .endOfContent { display: block; position: absolute; inset: 100% 0 0; z-index: 0; cursor: default; user-select: none; }
    /* Form fields and links (pdfjs-dist/web/pdf_viewer.css .annotationLayer, trimmed). */
    .zb-pdf-page .annotationLayer {
      position: absolute; top: 0; left: 0; pointer-events: none; transform-origin: 0 0; z-index: 1;
      color-scheme: only light;
      --zb-field-background: rgb(0 121 121 / 0.1);
    }
    .zb-pdf-page .annotationLayer section {
      position: absolute; text-align: initial; pointer-events: auto; box-sizing: border-box; transform-origin: 0 0; user-select: none;
    }
    .zb-pdf-page .annotationLayer .hasOwnCanvas:not(.sandboxModified) :is(input, textarea) { display: none; }
    .zb-pdf-page .textLayer.selecting ~ .annotationLayer section { pointer-events: none; }
    .zb-pdf-page .annotationLayer :is(.linkAnnotation, .buttonWidgetAnnotation.pushButton) > a {
      position: absolute; font-size: 1em; top: 0; left: 0; width: 100%; height: 100%;
    }
    .zb-pdf-page .annotationLayer :is(.linkAnnotation, .buttonWidgetAnnotation.pushButton) > a:hover { background-color: rgb(255 255 0 / 0.2); }
    .zb-pdf-page .annotationLayer .textWidgetAnnotation :is(input, textarea),
    .zb-pdf-page .annotationLayer .choiceWidgetAnnotation select,
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) input {
      background: var(--zb-field-background); border: 2px solid transparent; box-sizing: border-box;
      font: calc(9px * var(--total-scale-factor)) sans-serif; height: 100%; margin: 0; vertical-align: top; width: 100%; color: #000;
    }
    .zb-pdf-page .annotationLayer .textWidgetAnnotation textarea { resize: none; }
    .zb-pdf-page .annotationLayer :is(.textWidgetAnnotation :is(input, textarea), .choiceWidgetAnnotation select)[disabled],
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) input[disabled] {
      background: none; border: 2px solid transparent; cursor: not-allowed;
    }
    .zb-pdf-page .annotationLayer .textWidgetAnnotation :is(input, textarea):hover,
    .zb-pdf-page .annotationLayer .choiceWidgetAnnotation select:hover,
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) input:hover {
      border: 2px solid #007979; border-radius: 2px;
    }
    .zb-pdf-page .annotationLayer .textWidgetAnnotation :is(input, textarea):focus,
    .zb-pdf-page .annotationLayer .choiceWidgetAnnotation select:focus,
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) input:focus {
      background: none; border: 2px solid #007979; border-radius: 2px; outline: 2px solid rgb(0 121 121 / 0.3); outline-offset: 1px;
    }
    .zb-pdf-page .annotationLayer :is(input, textarea, select):required { outline: 1.5px solid #e11d48; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) input { appearance: none; cursor: pointer; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation.radioButton input { border-radius: 50%; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation.checkBox input:checked {
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8.5l3.2 3L13 4.5' fill='none' stroke='%230f172a' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 85% no-repeat, var(--zb-field-background);
    }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation.radioButton input:checked {
      background: radial-gradient(circle, #0f172a 0 32%, transparent 36%), var(--zb-field-background);
    }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) [data-canvas-name="checked"] { display: none; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) [data-canvas-name="checked"]:has(~ input:checked) { display: block; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton) [data-canvas-name="unchecked"]:has(~ input:checked) { display: none; }
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton):has([data-canvas-name="checked"]) input:checked,
    .zb-pdf-page .annotationLayer .buttonWidgetAnnotation:is(.checkBox, .radioButton):has([data-canvas-name="unchecked"]) input:not(:checked) { background: none; }
    .zb-pdf-page .annotationLayer .textWidgetAnnotation input.comb {
      --comb-width: 0px; --comb-letter-spacing: calc(var(--comb-width) - 1ch);
      font-family: monospace; letter-spacing: var(--comb-letter-spacing); overflow-x: hidden; padding: 0;
      text-indent: calc(var(--comb-offset, 0) * var(--comb-width) + var(--comb-letter-spacing) / 2);
    }
    .zb-pdf-page .annotationLayer .annotationContent { position: absolute; width: 100%; height: 100%; pointer-events: none; }
    .zb-pdf-page .annotationLayer section:has(div.annotationContent) canvas.annotationContent { display: none; }
    .zb-pdf-page .annotationLayer .overlaidText { position: absolute; top: 0; left: 0; width: 0; height: 0; display: inline-block; overflow: hidden; }
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
  /** A page's text layer is ready: highlights can be drawn in it (blockIndex = page - 1). */
  readonly textLayerReady = output<{ element: HTMLElement; blockIndex: number }>();
  /** A page's text layer was removed (zoom or resize): stop drawing in it. */
  readonly textLayerRemoved = output<HTMLElement>();
  /** The PDF has form fields that can be filled in (emitted once it is open). */
  readonly formDetected = output<boolean>();
  /** A form field was changed. */
  readonly formChanged = output<void>();

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
  private readonly linkService: ReaderLinkService = createLinkService(() => this.pdf, {
    goTo: (page) => this.goToPage(page),
    current: () => this.currentPage,
    count: () => this.slots.length,
  });

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
      // pdf.js calls this when a form field changes after the last save.
      (this.pdf.annotationStorage as unknown as { onSetModified: (() => void) | null }).onSetModified = () => this.formChanged.emit();
      const pdf = this.pdf;
      void hasFillableFields(pdf).then((hasForm) => {
        if (!this.destroyed && this.pdf === pdf) this.formDetected.emit(hasForm);
      });
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
      this.removeLayers(slot);
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

    // Form fields are left off the canvas: the form layer shows them as inputs.
    const annotationCanvasMap = new Map<string, HTMLCanvasElement>();
    const task = page.render({
      canvas,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
      annotationMode: this.pdfjs.AnnotationMode.ENABLE_FORMS,
      annotationCanvasMap,
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
    this.removeLayers(slot);
    slot.element.prepend(canvas);
    slot.rendered = scale;

    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    // A highlight section for the toolbar and painter (features/courses/annotations).
    textLayer.setAttribute('data-annotation-section', '');
    textLayer.setAttribute('data-block-index', String(slot.number - 1));
    slot.element.appendChild(textLayer);
    try {
      await new this.pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textLayer, viewport }).render();
      if (textLayer.isConnected) this.textLayerReady.emit({ element: textLayer, blockIndex: slot.number - 1 });
    } catch {
      // Text selection is extra; the page is already drawn.
    }

    // Form fields and links, above the text layer.
    if (!textLayer.isConnected || !this.pdf) return;
    try {
      await renderFormLayer({
        pdfjs: this.pdfjs,
        pdf: this.pdf,
        page,
        viewport,
        container: slot.element,
        linkService: this.linkService,
        annotationCanvasMap,
        // The page was redrawn meanwhile (zoom or resize): don't add a second layer.
        isCurrent: () => textLayer.isConnected,
      });
    } catch {
      // The page still reads without its fields.
    }
  }

  private removeLayers(slot: PageSlot): void {
    slot.element.querySelectorAll<HTMLElement>(':scope > canvas, .textLayer, .annotationLayer').forEach((node) => {
      if (node.classList.contains('textLayer')) this.textLayerRemoved.emit(node);
      node.remove();
    });
  }

  /** The PDF with what the person typed in its form fields. */
  async filledBytes(): Promise<Uint8Array> {
    if (!this.pdf) throw new Error('The PDF is not open.');
    // Fields keep their values in annotationStorage; leave the field being typed in so it is stored.
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('.annotationLayer')) active.blur();
    return this.pdf.saveDocument();
  }

  /** Number of pages (0 until the PDF is open). */
  pageCount(): number {
    return this.slots.length;
  }

  /** The current page (1-based). */
  page(): number {
    return this.currentPage;
  }

  /** A page's text, for read aloud: lines end with a line break. */
  async pageText(pageNumber: number): Promise<string> {
    if (!this.pdf || pageNumber < 1 || pageNumber > this.pdf.numPages) return '';
    const content = await (await this.pdf.getPage(pageNumber)).getTextContent();
    return content.items
      .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
      .join('')
      .replace(/[ \t]+\n/g, '\n');
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
