import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { AnnotationToolbarComponent } from '../courses/annotations/annotation-toolbar.component';
import { AnnotationStore, highlightOption } from '../courses/annotations/annotation.model';
import { textOf } from '../courses/annotations/annotation-anchoring';
import { HighlightLayerDirective } from '../courses/annotations/highlight-layer.directive';
import { HighlightPainter } from '../courses/annotations/highlight-painter.service';
import { renderKnowledgeContent } from '../partner/knowledge/knowledge-content.util';
import { useLearningHeaderTitle } from '../test-center/learner-route';
import { DocumentAnnotation, DocumentAnnotationStore } from './document-annotation.store';
import { DocumentQuizDialogComponent, DocumentQuizData } from './document-quiz-dialog.component';
import { QUIZ_TEXT_MAX, quizSection } from './document-quiz-section';
import { DocumentService, ReadingPosition, UserDocument } from './document.service';
import { EpubBook, EpubError, EpubTocEntry, openEpub } from './epub-book';
import { OfflineDocumentsService } from './offline-documents.service';
import { PdfViewComponent } from './pdf-view.component';
import { sanitizeReaderHtml } from './reader-html';
import { SentenceRange, blockBreaks, rangeFor, speechLanguage, splitSentences } from './reader-speech';

type ReaderTheme = 'light' | 'sepia' | 'dark';
type SidePanel = 'contents' | 'highlights' | null;

interface ReaderSettings {
  theme: ReaderTheme;
  /** Text size for EPUB, Word, text and markdown, in percent. */
  textSize: number;
  /** PDF zoom, 1 = fit width. */
  zoom: number;
  /** Read aloud speed. */
  rate: number;
}

const SETTINGS_KEY = 'zebron:reader:settings';
const DEFAULT_SETTINGS: ReaderSettings = { theme: 'light', textSize: 100, zoom: 1, rate: 1 };
const TEXT_SIZES = [80, 90, 100, 112, 125, 140, 160];
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const RATES = [0.75, 1, 1.25, 1.5, 2];
const SAVE_DELAY_MS = 1500;
/** Height of the site header plus the reader toolbar. */
const TOP_OFFSET = 128;
const READ_ALOUD_HIGHLIGHT = 'zb-read-aloud';

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
      rate: RATES.includes(stored.rate ?? 0) ? stored.rate! : DEFAULT_SETTINGS.rate,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Read aloud: what is being read now. */
interface ReadingRun {
  /** Increases on every start or stop, so callbacks from an old run are ignored. */
  token: number;
  /** HTML formats: the element read. PDF: null (the page's text is read). */
  root: HTMLElement | null;
  text: string;
  sentences: SentenceRange[];
  index: number;
  /** PDF page being read (1-based); 0 for other formats. */
  page: number;
}

/**
 * Reads one of the person's documents (/courses/documents/:documentId):
 * PDF (pdf.js), EPUB (epub-book.ts), Word (mammoth), plain text and
 * markdown. Remembers the page or chapter and scroll position, and the
 * reading theme, text size, zoom and read aloud speed (this browser).
 *
 * Highlights and notes use the lesson toolbar and painter
 * (features/courses/annotations) with DocumentAnnotationStore. Read aloud
 * uses the browser's voices (reader-speech.ts).
 */
@Component({
  selector: 'app-document-reader',
  imports: [RouterLink, MatIconModule, TranslatePipe, PdfViewComponent, HighlightLayerDirective, AnnotationToolbarComponent],
  providers: [HighlightPainter, DocumentAnnotationStore, { provide: AnnotationStore, useExisting: DocumentAnnotationStore }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <main class="mt-16 min-h-screen pb-24" [style.background]="theme().background" [style.color]="theme().text">
      <!-- Toolbar -->
      <div class="sticky top-16 z-20 border-b border-black/10 backdrop-blur" [style.background]="theme().background + 'ee'">
        <div class="mx-auto flex max-w-6xl items-center gap-0.5 px-2 py-1.5 sm:gap-2 sm:px-4">
          <a
            routerLink="/courses/documents"
            class="zb-reader-tool"
            [attr.aria-label]="'Back to My documents' | t"
            [title]="'Back to My documents' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="flex items-center gap-1 text-sm font-semibold sm:text-base">
              <span class="truncate">{{ document()?.title ?? ('Document' | t) }}</span>
              @if (document() && offline.isKept(document()!.id)) {
                <mat-icon class="!h-4 !w-4 shrink-0 !text-[16px] text-[#007979]" [attr.aria-label]="'Kept on this device' | t" [title]="'Kept on this device' | t">offline_pin</mat-icon>
              }
            </h1>
            @if (positionLabel()) {
              <p class="truncate text-xs opacity-70" aria-live="polite">{{ positionLabel() }}</p>
            }
          </div>

          @if (state() === 'ready' && document(); as current) {
            @if (book()) {
              <button
                type="button"
                class="zb-reader-tool"
                [attr.aria-expanded]="panel() === 'contents'"
                aria-controls="reader-panel"
                [attr.aria-label]="'Contents' | t"
                [title]="'Contents' | t"
                (click)="togglePanel('contents')"
              >
                <mat-icon aria-hidden="true">toc</mat-icon>
              </button>
            }
            <button
              type="button"
              class="zb-reader-tool relative"
              [attr.aria-expanded]="panel() === 'highlights'"
              aria-controls="reader-panel"
              [attr.aria-label]="'Highlights and notes ({0})' | t: [highlights().length]"
              [title]="'Highlights and notes' | t"
              (click)="togglePanel('highlights')"
            >
              <mat-icon aria-hidden="true">border_color</mat-icon>
              @if (highlights().length) {
                <span class="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#007979] px-1 text-center text-[10px] font-bold leading-4 text-white" aria-hidden="true">{{ highlights().length }}</span>
              }
            </button>
            @if (speechSupported()) {
              <button
                type="button"
                class="zb-reader-tool"
                [attr.aria-label]="(speaking() === 'idle' ? 'Read aloud' : 'Stop reading aloud') | t"
                [title]="(speaking() === 'idle' ? 'Read aloud' : 'Stop reading aloud') | t"
                (click)="speaking() === 'idle' ? startReading() : stopReading()"
              >
                <mat-icon aria-hidden="true">{{ speaking() === 'idle' ? 'headphones' : 'stop_circle' }}</mat-icon>
              </button>
            }
            <button
              type="button"
              class="zb-reader-tool"
              [disabled]="!offline.online() || preparingQuiz()"
              [attr.aria-label]="(offline.online() ? 'Quiz me on this part' : 'Quizzes need a connection') | t"
              [title]="(offline.online() ? 'Quiz me on this part' : 'Quizzes need a connection') | t"
              (click)="openQuiz(current)"
            >
              <mat-icon aria-hidden="true">quiz</mat-icon>
            </button>
            <div class="flex shrink-0 items-center" role="group" [attr.aria-label]="(current.format === 'pdf' ? 'Zoom' : 'Text size') | t">
              <button type="button" class="zb-reader-tool max-sm:!hidden" [disabled]="!canShrink()" [attr.aria-label]="(current.format === 'pdf' ? 'Zoom out' : 'Smaller text') | t" (click)="resize(-1)">
                <mat-icon aria-hidden="true">{{ current.format === 'pdf' ? 'zoom_out' : 'text_decrease' }}</mat-icon>
              </button>
              <button
                type="button"
                class="zb-reader-tool"
                [attr.aria-label]="(current.format === 'pdf' ? 'Zoom in' : 'Larger text') | t"
                (click)="cycleSize()"
              >
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
            <button type="button" class="zb-reader-tool max-sm:!hidden" [attr.aria-label]="'Download' | t" [title]="'Download' | t" (click)="download(current)">
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
        <div class="mx-auto flex max-w-6xl gap-6 px-2 py-4 sm:px-4" [class.zb-reader-dark]="settings().theme === 'dark'">
          <!-- Side panel: contents (EPUB) or highlights. A column on wide screens, over the text on phones. -->
          @if (panel()) {
            <aside
              id="reader-panel"
              class="fixed inset-x-0 bottom-0 top-[7.5rem] z-30 overflow-y-auto border-t border-black/10 p-4 shadow-lg lg:sticky lg:top-32 lg:z-auto lg:max-h-[calc(100vh-9rem)] lg:w-72 lg:shrink-0 lg:self-start lg:border-0 lg:p-0 lg:shadow-none"
              [style.background]="theme().background"
              [attr.aria-label]="(panel() === 'contents' ? 'Contents' : 'Highlights and notes') | t"
            >
              <div class="mb-2 flex items-center justify-between gap-2 lg:hidden">
                <h2 class="font-semibold">{{ (panel() === 'contents' ? 'Contents' : 'Highlights and notes') | t }}</h2>
                <button type="button" class="zb-reader-tool" [attr.aria-label]="'Close' | t" (click)="panel.set(null)">
                  <mat-icon aria-hidden="true">close</mat-icon>
                </button>
              </div>

              @if (panel() === 'contents' && book(); as epub) {
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
              } @else if (panel() === 'highlights') {
                @if (!highlights().length) {
                  <p class="text-sm opacity-75">{{ 'Select text to highlight it in one of four colours or add a note. Your highlights and notes appear here.' | t }}</p>
                } @else {
                  <ul class="flex flex-col gap-2">
                    @for (item of highlights(); track item.id) {
                      <li>
                        <button
                          type="button"
                          class="w-full rounded-lg border border-black/10 p-2.5 text-left hover:bg-black/5"
                          [style.border-left-color]="accentOf(item)"
                          [style.border-left-width.px]="4"
                          (click)="jumpTo(item)"
                        >
                          <span class="flex items-center justify-between gap-2 text-[11px] font-semibold opacity-75">
                            <span>{{ colorLabel(item) | t }}</span>
                            <span>{{ placeLabel(item) }}</span>
                          </span>
                          <span class="mt-1 line-clamp-3 block text-sm leading-snug">“{{ item.quote }}”</span>
                          @if (item.note) {
                            <span class="mt-1 line-clamp-3 block whitespace-pre-wrap text-xs opacity-80">{{ item.note }}</span>
                          }
                        </button>
                      </li>
                    }
                  </ul>
                }
              }
            </aside>
          }

          <div #readingRoot class="min-w-0 flex-1">
            @if (current.format === 'pdf' && pdfData(); as data) {
              <app-pdf-view
                [data]="data"
                [zoom]="settings().zoom"
                [startPage]="current.position.page ?? 1"
                [pageFilter]="theme().pdfFilter"
                (pageChange)="onPdfPage($event)"
                (textLayerReady)="painter.register($event.element, $event.blockIndex)"
                (textLayerRemoved)="painter.unregister($event)"
              />
            } @else if (current.format === 'txt') {
              <pre
                #content
                class="zb-reader-content zb-reader-plain px-2"
                zbHighlightLayer
                [zbBlockIndex]="0"
                [zbHtml]="text()"
                [style.font-size.%]="settings().textSize"
              >{{ text() }}</pre>
            } @else {
              <article
                #content
                class="zb-reader-content px-2"
                zbHighlightLayer
                [zbBlockIndex]="book() ? chapter() : 0"
                [zbHtml]="html()"
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

          <!-- Select text to highlight, add a note or copy (the same toolbar as lessons). -->
          <app-annotation-toolbar [root]="readingRoot" />
        </div>

        <!-- Read aloud player -->
        @if (speaking() !== 'idle') {
          <div
            class="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-max max-w-[calc(100vw-1rem)] items-center gap-1 rounded-full border border-black/10 px-2 py-1 shadow-lg"
            [style.background]="theme().background"
            role="region"
            [attr.aria-label]="'Read aloud' | t"
          >
            <button type="button" class="zb-reader-tool" [attr.aria-label]="'Previous sentence' | t" (click)="skip(-1)">
              <mat-icon aria-hidden="true">skip_previous</mat-icon>
            </button>
            <button
              type="button"
              class="zb-reader-tool zb-reader-play"
              [attr.aria-label]="(speaking() === 'playing' ? 'Pause' : 'Resume') | t"
              (click)="speaking() === 'playing' ? pauseReading() : resumeReading()"
            >
              <mat-icon aria-hidden="true">{{ speaking() === 'playing' ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>
            <button type="button" class="zb-reader-tool" [attr.aria-label]="'Next sentence' | t" (click)="skip(1)">
              <mat-icon aria-hidden="true">skip_next</mat-icon>
            </button>
            <button
              type="button"
              class="h-10 min-w-12 rounded-lg px-2 text-sm font-semibold tabular-nums hover:bg-black/5"
              [attr.aria-label]="'Reading speed {0}×. Change' | t: [settings().rate]"
              (click)="nextRate()"
            >
              {{ settings().rate }}×
            </button>
            <button type="button" class="zb-reader-tool" [attr.aria-label]="'Stop reading aloud' | t" (click)="stopReading()">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
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
    .zb-reader-play { height: 2.75rem; width: 2.75rem; border-radius: 9999px; background: #007979; color: #fff; }
    .zb-reader-play:hover:not(:disabled) { background: #006666; }
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
    /* Highlights in the dark theme: dark text on the light highlight colours. */
    .zb-reader-dark .zb-reader-content mark[data-annotation-id] { color: #0f172a !important; }
    /* The sentence being read aloud (CSS Custom Highlight API). */
    ::highlight(zb-read-aloud) { background-color: rgb(0 121 121 / 0.28); }
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
  protected readonly painter = inject(HighlightPainter);
  private readonly annotationStore = inject(DocumentAnnotationStore);
  protected readonly offline = inject(OfflineDocumentsService);
  private readonly dialog = inject(MatDialog);

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
  protected readonly panel = signal<SidePanel>(null);
  private readonly pdfPage = signal({ page: 1, total: 0 });
  private readonly scroll = signal(0);

  protected readonly highlights = computed(() => this.annotationStore.annotations() as readonly DocumentAnnotation[]);
  protected readonly speechSupported = signal(false);
  protected readonly speaking = signal<'idle' | 'playing' | 'paused'>('idle');

  private readonly contentRef = viewChild<ElementRef<HTMLElement>>('content');
  private readonly pdfView = viewChild(PdfViewComponent);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private scrollFrame = 0;
  private reading: ReadingRun = { token: 0, root: null, text: '', sentences: [], index: 0, page: 0 };

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

    // The painter draws this document's highlights wherever its text is shown,
    // and a document kept on this device keeps its highlights up to date there.
    effect(() => {
      const items = this.annotationStore.annotations() as readonly DocumentAnnotation[];
      untracked(() => {
        this.painter.setAnnotations([...items]);
        const current = this.document();
        const uid = this.auth.firebaseUser()?.uid;
        if (current && uid && this.state() === 'ready' && this.offline.online()) void this.offline.update(uid, current, items);
      });
    });

    afterNextRender(() => {
      this.settings.set(loadSettings());
      this.speechSupported.set('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
      window.addEventListener('scroll', this.onScroll, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      void this.open(this.route.snapshot.paramMap.get('documentId') ?? '');
    });
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('visibilitychange', this.onVisibility);
      cancelAnimationFrame(this.scrollFrame);
      this.stopReading();
      this.flushSave();
      this.book()?.dispose();
    });
  }

  private async open(documentId: string): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      this.state.set('missing');
      return;
    }

    // A copy kept on this device opens without downloading (and without a connection).
    await this.offline.refresh(uid);
    const kept = await this.offline.load(uid, documentId);

    let current: UserDocument | null = null;
    let fetched = false;
    if (this.offline.online()) {
      try {
        current = await this.documents.get(documentId);
        fetched = true;
      } catch (error) {
        if (!kept) this.logger.error('DocumentReader', 'Could not load the document details.', error);
      }
    }
    if (fetched && !current) {
      // Deleted on another device: remove the kept copy too.
      if (kept) await this.offline.remove(uid, documentId);
      this.state.set('missing');
      return;
    }
    current ??= kept?.document ?? null;
    if (!current) {
      if (!this.offline.online()) this.errorMessage.set('You are offline. Documents you keep on this device can be read without a connection.');
      this.state.set('error');
      return;
    }
    this.document.set(current);
    this.pageTitle.setDocumentTitle(`${current.title} | Zebron`);
    this.annotationStore.open(current.id, current.title, kept?.annotations ?? []);

    let data: ArrayBuffer;
    if (kept) {
      data = kept.bytes;
      if (fetched) void this.offline.update(uid, current);
    } else {
      try {
        data = await this.documents.bytes(current);
      } catch (error) {
        this.logger.error('DocumentReader', 'Could not download the file.', error);
        this.errorMessage.set(
          this.offline.online()
            ? 'The file could not be downloaded. Check your connection and try again.'
            : 'You are offline. Documents you keep on this device can be read without a connection.',
        );
        this.state.set('error');
        return;
      }
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
    if (window.matchMedia('(min-width: 1024px)').matches && this.book()) this.panel.set('contents');
    void this.documents.markOpened(current.id).catch(() => undefined);
  }

  // ---------- Side panel ----------

  protected togglePanel(panel: Exclude<SidePanel, null>): void {
    this.panel.set(this.panel() === panel ? null : panel);
  }

  private closePanelOnPhones(): void {
    if (!window.matchMedia('(min-width: 1024px)').matches) this.panel.set(null);
  }

  protected colorLabel(item: DocumentAnnotation): string {
    return highlightOption(item.color)?.label ?? 'Note';
  }

  protected accentOf(item: DocumentAnnotation): string {
    return highlightOption(item.color)?.accent ?? '#007979';
  }

  protected placeLabel(item: DocumentAnnotation): string {
    if (this.document()?.format === 'pdf') return this.i18n.t('Page {0}', [item.blockIndex + 1]);
    if (this.book()) return this.i18n.t('Chapter {0}', [item.blockIndex + 1]);
    return '';
  }

  /** Go to a highlight: its page or chapter first, then the highlight itself. */
  protected async jumpTo(item: DocumentAnnotation): Promise<void> {
    this.closePanelOnPhones();
    if (this.document()?.format === 'pdf') {
      this.pdfView()?.goToPage(item.blockIndex + 1);
    } else if (this.book() && item.blockIndex !== this.chapter()) {
      await this.openChapter(item.blockIndex, 0);
    }
    // The page or chapter may still be drawing: try a few times.
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const mark = this.painter.marks(item.id)[0];
      if (mark) {
        mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        mark.animate([{ outline: '3px solid #007979' }, { outline: '3px solid transparent' }], { duration: 1400 });
        return;
      }
    }
  }

  // ---------- EPUB chapters ----------

  protected async openChapter(index: number, scroll: number, save = true): Promise<void> {
    const epub = this.book();
    if (!epub || index < 0 || index >= epub.chapters.length) return;
    if (save) this.stopReading();
    this.chapter.set(index);
    this.html.set(await epub.chapterHtml(index));
    this.restoreScroll(scroll);
    if (save) this.scheduleSave();
  }

  protected openFromToc(entry: EpubTocEntry): void {
    this.closePanelOnPhones();
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

  // ---------- Quiz me on this part (document-quiz-dialog.component.ts) ----------

  protected readonly preparingQuiz = signal(false);

  /** Collects the text being read (chapter, pages, or the part around the reader) and opens the quiz. */
  protected async openQuiz(current: UserDocument): Promise<void> {
    if (this.preparingQuiz()) return;
    this.preparingQuiz.set(true);
    try {
      const section = await this.quizSource(current);
      if (!section) return;
      this.dialog.open<DocumentQuizDialogComponent, DocumentQuizData>(DocumentQuizDialogComponent, {
        data: { documentId: current.id, documentTitle: current.title, ...section },
        width: '640px',
        maxHeight: '90vh',
        autoFocus: 'dialog',
      });
    } catch (error) {
      this.logger.error('DocumentReader', 'Could not prepare the quiz.', error);
    } finally {
      this.preparingQuiz.set(false);
    }
  }

  private async quizSource(current: UserDocument): Promise<{ section: string; text: string } | null> {
    if (current.format === 'pdf') {
      // From the current page on, up to 8 pages or about half the limit (a chapter's worth).
      const view = this.pdfView();
      if (!view) return null;
      const first = view.page();
      const total = view.pageCount();
      let text = '';
      let last = first;
      for (let page = first; page <= total && page < first + 8; page++) {
        text += ' ' + (await view.pageText(page));
        last = page;
        if (text.length >= QUIZ_TEXT_MAX / 2) break;
      }
      return {
        section: first === last ? this.i18n.t('Page {0}', [first]) : this.i18n.t('Pages {0}–{1}', [first, last]),
        text: quizSection(text, 0).text,
      };
    }
    const root = this.contentRef()?.nativeElement;
    if (!root) return null;
    const { text, partial } = quizSection(textOf(root), this.scroll());
    const epub = this.book();
    if (epub) {
      const entry = epub.toc.find((item) => item.chapterIndex === this.chapter());
      const name = entry?.title?.trim() || this.i18n.t('Chapter {0}', [this.chapter() + 1]);
      return { section: partial ? this.i18n.t('{0} (the part you are reading)', [name]) : name, text };
    }
    return { section: this.i18n.t(partial ? 'The part you are reading' : 'The whole document'), text };
  }

  // ---------- Read aloud ----------

  /** Start reading from the first sentence on screen (or the current PDF page). */
  protected startReading(): void {
    if (!this.speechSupported()) return;
    this.stopReading();
    const token = this.reading.token + 1;
    if (this.document()?.format === 'pdf') {
      const page = this.pdfView()?.page() ?? 1;
      this.reading = { token, root: null, text: '', sentences: [], index: 0, page };
      this.speaking.set('playing');
      void this.readPdfPage(page, token);
      return;
    }
    const root = this.contentRef()?.nativeElement;
    if (!root) return;
    const text = textOf(root);
    const sentences = splitSentences(text, this.i18n.language(), blockBreaks(root));
    this.reading = { token, root, text, sentences, index: this.firstVisibleSentence(root, sentences), page: 0 };
    this.speakCurrent(token);
  }

  private async readPdfPage(page: number, token: number): Promise<void> {
    const view = this.pdfView();
    if (!view || token !== this.reading.token) return;
    if (page > view.pageCount()) {
      this.stopReading();
      return;
    }
    if (page !== view.page()) view.goToPage(page);
    const text = await view.pageText(page);
    if (token !== this.reading.token) return;
    this.reading = { ...this.reading, text, sentences: splitSentences(text, this.i18n.language()), index: 0, page };
    if (!this.reading.sentences.length) {
      void this.readPdfPage(page + 1, token);
      return;
    }
    this.speakCurrent(token);
  }

  private speakCurrent(token: number): void {
    const run = this.reading;
    if (token !== run.token) return;
    const sentence = run.sentences[run.index];
    if (!sentence) {
      this.finishedContent(token);
      return;
    }
    this.highlightSentence(sentence);
    const utterance = new SpeechSynthesisUtterance(run.text.slice(sentence.start, sentence.end));
    utterance.lang = speechLanguage(this.i18n.language());
    utterance.rate = this.settings().rate;
    utterance.onend = () => {
      if (token !== this.reading.token || this.speaking() !== 'playing') return;
      this.reading.index++;
      this.speakCurrent(token);
    };
    utterance.onerror = (event) => {
      if (token !== this.reading.token || event.error === 'interrupted' || event.error === 'canceled') return;
      this.logger.error('DocumentReader', 'Read aloud stopped.', event.error);
      this.stopReading();
    };
    this.speaking.set('playing');
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  /** End of the page or chapter: go on to the next one, or stop at the end. */
  private finishedContent(token: number): void {
    if (this.document()?.format === 'pdf') {
      void this.readPdfPage(this.reading.page + 1, token);
      return;
    }
    const epub = this.book();
    if (epub && this.chapter() < epub.chapters.length - 1) {
      const next = this.chapter() + 1;
      this.chapter.set(next);
      void epub.chapterHtml(next).then((html) => {
        if (token !== this.reading.token) return;
        this.html.set(html);
        this.scheduleSave();
        window.scrollTo({ top: 0 });
        // Wait for the chapter to be shown, then read it from the start.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const root = this.contentRef()?.nativeElement;
            if (!root || token !== this.reading.token) return;
            const text = textOf(root);
            this.reading = { ...this.reading, root, text, sentences: splitSentences(text, this.i18n.language(), blockBreaks(root)), index: 0 };
            this.speakCurrent(token);
          }),
        );
      });
      return;
    }
    this.stopReading();
  }

  protected pauseReading(): void {
    this.speaking.set('paused');
    speechSynthesis.cancel();
  }

  protected resumeReading(): void {
    this.speakCurrent(this.reading.token);
  }

  protected skip(step: 1 | -1): void {
    const run = this.reading;
    run.index = Math.min(Math.max(0, run.index + step), Math.max(0, run.sentences.length - 1));
    if (this.speaking() === 'playing') this.speakCurrent(run.token);
    else this.highlightSentence(run.sentences[run.index]);
  }

  protected stopReading(): void {
    this.reading = { ...this.reading, token: this.reading.token + 1 };
    if (this.speaking() !== 'idle' && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    this.speaking.set('idle');
    this.clearSentenceHighlight();
  }

  protected nextRate(): void {
    const rate = RATES[(RATES.indexOf(this.settings().rate) + 1) % RATES.length];
    this.updateSettings({ rate });
    if (this.speaking() === 'playing') this.speakCurrent(this.reading.token);
  }

  private firstVisibleSentence(root: HTMLElement, sentences: SentenceRange[]): number {
    // Binary search for the first sentence below the toolbar.
    let low = 0;
    let high = sentences.length - 1;
    let found = 0;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const rect = rangeFor(root, sentences[middle].start, sentences[middle].end)?.getBoundingClientRect();
      if (rect && rect.bottom > TOP_OFFSET) {
        found = middle;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }
    return found;
  }

  private highlightSentence(sentence: SentenceRange | undefined): void {
    const root = this.reading.root;
    if (!root || !sentence) return; // PDF: the page follows along instead
    const range = rangeFor(root, sentence.start, sentence.end);
    if (!range) return;
    const highlights = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    const HighlightClass = (window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
    if (highlights && HighlightClass) highlights.set(READ_ALOUD_HIGHLIGHT, new HighlightClass(range));
    const rect = range.getBoundingClientRect();
    if (rect.top < TOP_OFFSET || rect.bottom > window.innerHeight - 96) {
      window.scrollBy({ top: rect.top - TOP_OFFSET - window.innerHeight * 0.25, behavior: 'smooth' });
    }
  }

  private clearSentenceHighlight(): void {
    (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.delete(READ_ALOUD_HIGHLIGHT);
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
    // The kept copy remembers the place too, so it reopens there even offline.
    const updated: UserDocument = { ...current, position, progress: Math.round(Math.min(100, Math.max(0, progress))) };
    this.document.set(updated);
    const uid = this.auth.firebaseUser()?.uid;
    if (uid) void this.offline.update(uid, updated);
    // Offline, Firestore holds the change and sends it when the connection is back (while Zebron stays open).
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

  /** The larger-text (zoom in) button steps up; on phones, where it is the only one, it goes back to the smallest after the largest. */
  protected cycleSize(): void {
    if (this.canGrow()) {
      this.resize(1);
    } else if (this.document()?.format === 'pdf') {
      this.updateSettings({ zoom: ZOOMS[0] });
    } else {
      this.updateSettings({ textSize: TEXT_SIZES[0] });
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
