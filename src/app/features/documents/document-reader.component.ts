import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { renderKnowledgeContent } from '../partner/knowledge/knowledge-content.util';
import { useLearningHeaderTitle } from '../test-center/learner-route';
import { DocumentService, ReadingPosition, UserDocument } from './document.service';
import { EpubBook, EpubError, EpubTocEntry, openEpub } from './epub-book';
import { PdfViewComponent } from './pdf-view.component';
import { sanitizeReaderHtml } from './reader-html';

type ReaderTheme = 'light' | 'sepia' | 'dark';

interface ReaderSettings {
  theme: ReaderTheme;
  /** Text size for EPUB, Word, text and markdown, in percent. */
  textSize: number;
  /** PDF zoom, 1 = fit width. */
  zoom: number;
}

const SETTINGS_KEY = 'zebron:reader:settings';
const DEFAULT_SETTINGS: ReaderSettings = { theme: 'light', textSize: 100, zoom: 1 };
const TEXT_SIZES = [80, 90, 100, 112, 125, 140, 160];
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const SAVE_DELAY_MS = 1500;

const THEMES: Record<ReaderTheme, { background: string; text: string; pdfFilter: string; label: string; icon: string }> = {
  light: { background: '#ffffff', text: '#0f172a', pdfFilter: 'none', label: 'Light', icon: 'light_mode' },
  sepia: { background: '#f6efe2', text: '#3b2f20', pdfFilter: 'sepia(0.35)', label: 'Sepia', icon: 'menu_book' },
  dark: { background: '#111827', text: '#e5e7eb', pdfFilter: 'invert(0.9) hue-rotate(180deg)', label: 'Dark', icon: 'dark_mode' },
};

function loadSettings(): ReaderSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<ReaderSettings>;
    return {
      theme: stored.theme && stored.theme in THEMES ? stored.theme : DEFAULT_SETTINGS.theme,
      textSize: TEXT_SIZES.includes(stored.textSize ?? 0) ? stored.textSize! : DEFAULT_SETTINGS.textSize,
      zoom: ZOOMS.includes(stored.zoom ?? 0) ? stored.zoom! : DEFAULT_SETTINGS.zoom,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Reads one of the person's documents (/courses/documents/:documentId):
 * PDF (pdf.js), EPUB (epub-book.ts), Word (mammoth), plain text and
 * markdown. Remembers the page or chapter and scroll position, and the
 * reading theme, text size and zoom (this browser).
 */
@Component({
  selector: 'app-document-reader',
  imports: [RouterLink, MatIconModule, TranslatePipe, PdfViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <main class="mt-16 min-h-screen" [style.background]="theme().background" [style.color]="theme().text">
      <!-- Toolbar -->
      <div class="sticky top-16 z-20 border-b border-black/10 backdrop-blur" [style.background]="theme().background + 'ee'">
        <div class="mx-auto flex max-w-6xl items-center gap-1 px-2 py-1.5 sm:gap-2 sm:px-4">
          <a
            routerLink="/courses/documents"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-black/5"
            [attr.aria-label]="'Back to My documents' | t"
            [title]="'Back to My documents' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-sm font-semibold sm:text-base">{{ document()?.title ?? ('Document' | t) }}</h1>
            @if (positionLabel()) {
              <p class="truncate text-xs opacity-70" aria-live="polite">{{ positionLabel() }}</p>
            }
          </div>

          @if (book(); as epub) {
            <button
              type="button"
              class="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm hover:bg-black/5"
              [attr.aria-expanded]="tocOpen()"
              aria-controls="reader-toc"
              (click)="tocOpen.set(!tocOpen())"
            >
              <mat-icon aria-hidden="true">toc</mat-icon><span class="max-sm:hidden">{{ 'Contents' | t }}</span>
            </button>
          }

          @if (document(); as current) {
            <div class="flex shrink-0 items-center" role="group" [attr.aria-label]="(current.format === 'pdf' ? 'Zoom' : 'Text size') | t">
              <button type="button" class="zb-reader-tool" [disabled]="!canShrink()" [attr.aria-label]="(current.format === 'pdf' ? 'Zoom out' : 'Smaller text') | t" (click)="resize(-1)">
                <mat-icon aria-hidden="true">{{ current.format === 'pdf' ? 'zoom_out' : 'text_decrease' }}</mat-icon>
              </button>
              <span class="w-11 text-center text-xs tabular-nums max-sm:hidden" aria-hidden="true">{{ current.format === 'pdf' ? settings().zoom * 100 : settings().textSize }}%</span>
              <button type="button" class="zb-reader-tool" [disabled]="!canGrow()" [attr.aria-label]="(current.format === 'pdf' ? 'Zoom in' : 'Larger text') | t" (click)="resize(1)">
                <mat-icon aria-hidden="true">{{ current.format === 'pdf' ? 'zoom_in' : 'text_increase' }}</mat-icon>
              </button>
            </div>
            <button
              type="button"
              class="zb-reader-tool"
              [attr.aria-label]="'Reading theme: {0}. Change' | t: [theme().label | t]"
              [title]="'Reading theme' | t"
              (click)="nextTheme()"
            >
              <mat-icon aria-hidden="true">{{ theme().icon }}</mat-icon>
            </button>
            <button type="button" class="zb-reader-tool" [attr.aria-label]="'Download' | t" [title]="'Download' | t" (click)="download(current)">
              <mat-icon aria-hidden="true">download</mat-icon>
            </button>
          }
        </div>
      </div>

      @if (state() === 'loading') {
        <p class="py-20 text-center text-sm opacity-70" role="status">{{ 'Opening your document...' | t }}</p>
      } @else if (state() === 'missing') {
        <div class="mx-auto max-w-md px-4 py-20 text-center" role="alert">
          <p class="font-semibold">{{ 'This document is not in your documents.' | t }}</p>
          <a routerLink="/courses/documents" class="mt-3 inline-block font-semibold text-[#007979] hover:underline">{{ 'Back to My documents' | t }}</a>
        </div>
      } @else if (state() === 'error') {
        <div class="mx-auto max-w-md px-4 py-20 text-center" role="alert">
          <p class="font-semibold">{{ errorMessage() | t }}</p>
          @if (document(); as current) {
            <button type="button" class="mt-3 font-semibold text-[#007979] hover:underline" (click)="download(current)">{{ 'Download the file instead' | t }}</button>
          }
        </div>
      }

      @if (state() === 'ready' && document(); as current) {
        @if (current.format === 'pdf' && pdfData(); as data) {
          <div class="px-2 py-4 sm:px-4">
            <app-pdf-view
              [data]="data"
              [zoom]="settings().zoom"
              [startPage]="current.position.page ?? 1"
              [pageFilter]="theme().pdfFilter"
              (pageChange)="onPdfPage($event)"
            />
          </div>
        } @else {
          <div class="mx-auto flex max-w-6xl gap-6 px-4 py-6">
            @if (book(); as epub) {
              <!-- Contents: a column on wide screens, a panel over the text on phones -->
              @if (tocOpen()) {
                <nav
                  id="reader-toc"
                  class="fixed inset-x-0 bottom-0 top-[7.5rem] z-30 overflow-y-auto border-t border-black/10 p-4 shadow-lg lg:static lg:inset-auto lg:z-auto lg:max-h-[calc(100vh-9rem)] lg:w-64 lg:shrink-0 lg:self-start lg:border-0 lg:p-0 lg:shadow-none lg:sticky lg:top-32"
                  [style.background]="theme().background"
                  [attr.aria-label]="'Contents' | t"
                >
                  <ol class="space-y-0.5 text-sm">
                    @for (entry of epub.toc; track $index) {
                      <li>
                        <button
                          type="button"
                          class="w-full rounded-md px-2 py-1.5 text-left hover:bg-black/5"
                          [style.padding-left.rem]="0.5 + entry.depth * 0.9"
                          [class.font-semibold]="entry.chapterIndex === chapter()"
                          [attr.aria-current]="entry.chapterIndex === chapter() ? 'true' : null"
                          (click)="openFromToc(entry)"
                        >
                          {{ entry.title }}
                        </button>
                      </li>
                    }
                  </ol>
                </nav>
              }
            }

            <div class="min-w-0 flex-1">
              @if (current.format === 'txt') {
                <pre #content class="zb-reader-content zb-reader-plain" [style.font-size.%]="settings().textSize">{{ text() }}</pre>
              } @else {
                <article
                  #content
                  class="zb-reader-content"
                  [style.font-size.%]="settings().textSize"
                  [innerHTML]="html()"
                  (click)="onContentClick($event)"
                ></article>
              }

              @if (book(); as epub) {
                <nav class="mx-auto mt-10 flex max-w-[70ch] items-center justify-between gap-3 border-t border-black/10 pt-4" [attr.aria-label]="'Chapters' | t">
                  <button type="button" class="zb-reader-step" [disabled]="chapter() === 0" (click)="openChapter(chapter() - 1, 0)">
                    <mat-icon aria-hidden="true">chevron_left</mat-icon>{{ 'Previous' | t }}
                  </button>
                  <span class="text-xs opacity-70">{{ 'Chapter {0} of {1}' | t: [chapter() + 1, epub.chapters.length] }}</span>
                  <button type="button" class="zb-reader-step" [disabled]="chapter() >= epub.chapters.length - 1" (click)="openChapter(chapter() + 1, 0)">
                    {{ 'Next' | t }}<mat-icon aria-hidden="true">chevron_right</mat-icon>
                  </button>
                </nav>
              }
            </div>
          </div>
        }
      }
    </main>
  `,
  styles: `
    .zb-reader-tool {
      display: inline-flex; height: 2.5rem; width: 2.5rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 0.5rem;
    }
    .zb-reader-tool:hover:not(:disabled) { background: rgb(0 0 0 / 0.05); }
    .zb-reader-tool:disabled { opacity: 0.35; }
    .zb-reader-tool:focus-visible, .zb-reader-step:focus-visible { outline: 2px solid #007979; outline-offset: 2px; }
    .zb-reader-step {
      display: inline-flex; min-height: 2.5rem; align-items: center; gap: 0.25rem; border-radius: 0.5rem; padding: 0 0.75rem; font-size: 0.875rem; font-weight: 600;
      border: 1px solid rgb(0 0 0 / 0.15);
    }
    .zb-reader-step:disabled { opacity: 0.35; }
    .zb-reader-content {
      margin: 0 auto; max-width: 70ch; font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif; line-height: 1.7;
      overflow-wrap: anywhere;
    }
    .zb-reader-content.zb-reader-plain { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; white-space: pre-wrap; font-size: 0.95em; line-height: 1.6; }
    .zb-reader-content h1, .zb-reader-content h2, .zb-reader-content h3, .zb-reader-content h4 {
      font-family: system-ui, sans-serif; font-weight: 700; line-height: 1.3; margin: 1.6em 0 0.6em;
    }
    .zb-reader-content h1 { font-size: 1.75em; } .zb-reader-content h2 { font-size: 1.4em; } .zb-reader-content h3 { font-size: 1.2em; }
    .zb-reader-content p { margin: 0 0 1em; }
    .zb-reader-content ul, .zb-reader-content ol { margin: 0 0 1em; padding-left: 1.6em; }
    .zb-reader-content ul { list-style: disc; } .zb-reader-content ol { list-style: decimal; }
    .zb-reader-content blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid currentColor; opacity: 0.85; }
    .zb-reader-content img { display: block; max-width: 100%; height: auto; margin: 1em auto; }
    .zb-reader-content a { color: #007979; text-decoration: underline; }
    .zb-reader-content table { border-collapse: collapse; margin: 1em 0; display: block; overflow-x: auto; max-width: 100%; }
    .zb-reader-content th, .zb-reader-content td { border: 1px solid rgb(0 0 0 / 0.2); padding: 0.3em 0.6em; text-align: left; vertical-align: top; }
    .zb-reader-content pre, .zb-reader-content code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.9em; }
    .zb-reader-content pre { white-space: pre-wrap; padding: 0.8em; border-radius: 0.5rem; background: rgb(0 0 0 / 0.05); }
    .zb-reader-content hr { margin: 2em 0; border: 0; border-top: 1px solid rgb(0 0 0 / 0.2); }
  `,
})
export class DocumentReaderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(DocumentService);
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly headerTitle = useLearningHeaderTitle(this.route);

  protected readonly document = signal<UserDocument | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
  protected readonly errorMessage = signal('This document could not be opened.');
  protected readonly settings = signal<ReaderSettings>(DEFAULT_SETTINGS);
  protected readonly theme = computed(() => THEMES[this.settings().theme]);

  protected readonly pdfData = signal<ArrayBuffer | null>(null);
  protected readonly html = signal('');
  protected readonly text = signal('');
  protected readonly book = signal<EpubBook | null>(null);
  protected readonly chapter = signal(0);
  protected readonly tocOpen = signal(false);
  private readonly pdfPage = signal({ page: 1, total: 0 });
  private readonly scroll = signal(0);

  private readonly contentRef = viewChild<ElementRef<HTMLElement>>('content');

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private scrollFrame = 0;

  protected readonly positionLabel = computed(() => {
    const current = this.document();
    if (!current || this.state() !== 'ready') return '';
    if (current.format === 'pdf') {
      const { page, total } = this.pdfPage();
      return total ? this.i18n.t('Page {0} of {1}', [page, total]) : '';
    }
    const epub = this.book();
    if (epub) return this.i18n.t('Chapter {0} of {1}', [this.chapter() + 1, epub.chapters.length]);
    return this.i18n.t('{0}% read', [Math.round(this.scroll() * 100)]);
  });

  protected readonly canShrink = computed(() =>
    this.document()?.format === 'pdf' ? this.settings().zoom > ZOOMS[0] : this.settings().textSize > TEXT_SIZES[0],
  );
  protected readonly canGrow = computed(() =>
    this.document()?.format === 'pdf'
      ? this.settings().zoom < ZOOMS[ZOOMS.length - 1]
      : this.settings().textSize < TEXT_SIZES[TEXT_SIZES.length - 1],
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.settings.set(loadSettings());
      this.tocOpen.set(window.matchMedia('(min-width: 1024px)').matches);
      window.addEventListener('scroll', this.onScroll, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      void this.open(this.route.snapshot.paramMap.get('documentId') ?? '');
    });
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('visibilitychange', this.onVisibility);
      cancelAnimationFrame(this.scrollFrame);
      this.flushSave();
      this.book()?.dispose();
    });
  }

  private async open(documentId: string): Promise<void> {
    if (!this.auth.firebaseUser()) {
      this.state.set('missing');
      return;
    }
    let current: UserDocument | null;
    try {
      current = await this.documents.get(documentId);
    } catch (error) {
      this.logger.error('DocumentReader', 'Could not load the document details.', error);
      this.state.set('error');
      return;
    }
    if (!current) {
      this.state.set('missing');
      return;
    }
    this.document.set(current);
    this.pageTitle.setDocumentTitle(`${current.title} | Zebron`);

    let data: ArrayBuffer;
    try {
      data = await this.documents.bytes(current);
    } catch (error) {
      this.logger.error('DocumentReader', 'Could not download the file.', error);
      this.errorMessage.set('The file could not be downloaded. Check your connection and try again.');
      this.state.set('error');
      return;
    }

    try {
      switch (current.format) {
        case 'pdf':
          this.pdfData.set(data);
          this.pdfPage.set({ page: current.position.page ?? 1, total: 0 });
          break;
        case 'epub': {
          const JSZip = (await import('jszip')).default;
          const epub = await openEpub(data, JSZip);
          this.book.set(epub);
          const start = Math.min(current.position.chapter ?? 0, epub.chapters.length - 1);
          await this.openChapter(start, current.position.scroll ?? 0, false);
          break;
        }
        case 'docx': {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: data });
          this.html.set(sanitizeReaderHtml(result.value));
          this.restoreScroll(current.position.scroll ?? 0);
          break;
        }
        case 'md':
          this.html.set(sanitizeReaderHtml(renderKnowledgeContent(new TextDecoder().decode(data))));
          this.restoreScroll(current.position.scroll ?? 0);
          break;
        case 'txt':
          this.text.set(new TextDecoder().decode(data));
          this.restoreScroll(current.position.scroll ?? 0);
          break;
      }
    } catch (error) {
      this.logger.error('DocumentReader', 'Could not read the file.', error);
      this.errorMessage.set(error instanceof EpubError ? error.message : 'This file could not be read. It may be damaged.');
      this.state.set('error');
      return;
    }
    this.state.set('ready');
    void this.documents.markOpened(current.id).catch(() => undefined);
  }

  // ---------- EPUB chapters ----------

  protected async openChapter(index: number, scroll: number, save = true): Promise<void> {
    const epub = this.book();
    if (!epub || index < 0 || index >= epub.chapters.length) return;
    this.chapter.set(index);
    this.html.set(await epub.chapterHtml(index));
    this.restoreScroll(scroll);
    if (save) this.scheduleSave();
  }

  protected openFromToc(entry: EpubTocEntry): void {
    if (!window.matchMedia('(min-width: 1024px)').matches) this.tocOpen.set(false);
    void this.openChapter(entry.chapterIndex, 0);
  }

  /** Links to other chapters ("#zb-ch-3") open that chapter. */
  protected onContentClick(event: MouseEvent): void {
    const link = (event.target as HTMLElement | null)?.closest('a');
    const href = link?.getAttribute('href') ?? '';
    const match = /^#zb-ch-(\d+)$/.exec(href);
    if (match) {
      event.preventDefault();
      void this.openChapter(Number(match[1]), 0);
    }
  }

  // ---------- Position ----------

  protected onPdfPage(change: { page: number; total: number }): void {
    this.pdfPage.set(change);
    this.scheduleSave();
  }

  private restoreScroll(fraction: number): void {
    // Wait for the new content to be laid out.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const element = this.contentRef()?.nativeElement;
        if (!element) return;
        const top = element.getBoundingClientRect().top + window.scrollY;
        const range = Math.max(0, element.scrollHeight - window.innerHeight * 0.6);
        window.scrollTo({ top: fraction > 0 ? top - 140 + range * fraction : 0 });
        this.scroll.set(fraction);
      }),
    );
  }

  private readonly onScroll = (): void => {
    if (this.document()?.format === 'pdf') return;
    cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = requestAnimationFrame(() => {
      const element = this.contentRef()?.nativeElement;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - 140;
      const range = Math.max(1, element.scrollHeight - window.innerHeight * 0.6);
      const fraction = Math.min(1, Math.max(0, (window.scrollY - top) / range));
      if (Math.abs(fraction - this.scroll()) > 0.005) {
        this.scroll.set(fraction);
        this.scheduleSave();
      }
    });
  };

  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'hidden') this.flushSave();
  };

  private scheduleSave(): void {
    this.dirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushSave(), SAVE_DELAY_MS);
  }

  private flushSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const current = this.document();
    if (!this.dirty || !current || this.state() !== 'ready') return;
    this.dirty = false;

    let position: ReadingPosition;
    let progress: number;
    if (current.format === 'pdf') {
      const { page, total } = this.pdfPage();
      position = { page };
      progress = total ? (page / total) * 100 : 0;
    } else if (this.book()) {
      const chapters = this.book()!.chapters.length;
      position = { chapter: this.chapter(), scroll: this.scroll() };
      progress = ((this.chapter() + this.scroll()) / chapters) * 100;
    } else {
      position = { scroll: this.scroll() };
      progress = this.scroll() * 100;
    }
    this.documents.savePosition(current.id, position, progress).catch((error) => {
      this.logger.error('DocumentReader', 'Could not save the reading position.', error);
    });
  }

  // ---------- Settings ----------

  private updateSettings(change: Partial<ReaderSettings>): void {
    this.settings.update((settings) => ({ ...settings, ...change }));
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings()));
    } catch {
      // Private browsing: settings last for this visit only.
    }
  }

  protected resize(step: 1 | -1): void {
    const settings = this.settings();
    if (this.document()?.format === 'pdf') {
      const index = ZOOMS.indexOf(settings.zoom);
      this.updateSettings({ zoom: ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, index + step))] });
    } else {
      const index = TEXT_SIZES.indexOf(settings.textSize);
      this.updateSettings({ textSize: TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, index + step))] });
    }
  }

  protected nextTheme(): void {
    const order: ReaderTheme[] = ['light', 'sepia', 'dark'];
    this.updateSettings({ theme: order[(order.indexOf(this.settings().theme) + 1) % order.length] });
  }

  protected async download(current: UserDocument): Promise<void> {
    try {
      window.open(await this.documents.downloadUrl(current), '_blank', 'noopener');
    } catch (error) {
      this.logger.error('DocumentReader', 'Could not get the download link.', error);
    }
  }

  /** Left and right arrows move between EPUB chapters (not while typing). */
  protected onKey(event: KeyboardEvent): void {
    const epub = this.book();
    const target = event.target as HTMLElement | null;
    if (!epub || event.altKey || event.ctrlKey || event.metaKey || target?.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'ArrowRight' && this.chapter() < epub.chapters.length - 1) {
      event.preventDefault();
      void this.openChapter(this.chapter() + 1, 0);
    } else if (event.key === 'ArrowLeft' && this.chapter() > 0) {
      event.preventDefault();
      void this.openChapter(this.chapter() - 1, 0);
    }
  }
}
