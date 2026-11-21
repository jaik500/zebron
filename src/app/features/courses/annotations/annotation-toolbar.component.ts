import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  Injector,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { Lesson } from '../course.model';
import { ANNOTATION_LIMITS, CourseAnnotation, HIGHLIGHT_COLORS, HighlightColor, HighlightColorOption } from './annotation.model';
import { TextAnchor, anchor, offsetOf, textOf } from './annotation-anchoring';
import { AnnotationService } from './annotation.service';

interface PendingSelection {
  blockIndex: number;
  anchor: TextAnchor;
  range: Range;
}

interface Position {
  top: number;
  left: number;
}

const TOOLBAR_WIDTH = 360;
const NOTE_WIDTH = 320;
const GAP = 10;
/** Keep clear of the fixed global header. */
const TOP_LIMIT = 72;

/**
 * The floating bar for highlighting, notes and copying in lesson text.
 *
 * - Select text in a lesson section: pick a colour, add a note, or copy.
 * - Click a highlight: change its colour, edit its note, copy or remove it.
 *
 * Only text inside [zbHighlightLayer] sections counts (never quick checks,
 * exams or code exercises). Everything is also reachable from My notes.
 */
@Component({
  selector: 'app-annotation-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe],
  host: {
    '(document:selectionchange)': 'onSelectionChange()',
    '(document:keydown.escape)': 'close()',
    '(window:resize)': 'reposition()',
  },
  template: `
    @if (mode() !== 'closed' && position(); as pos) {
      <div
        #panel
        class="fixed z-[1000] max-w-[calc(100vw-20px)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
        [style.top.px]="pos.top"
        [style.left.px]="pos.left"
        [style.width.px]="mode() === 'note' ? noteWidth : toolbarWidth"
        [attr.role]="mode() === 'note' ? 'dialog' : 'toolbar'"
        [attr.aria-label]="(mode() === 'note' ? 'Note' : 'Highlight and notes') | t"
        (pointerdown)="onPointerDown($event)"
      >
        @if (mode() === 'note') {
          <form class="flex flex-col gap-2" (submit)="$event.preventDefault(); saveNote()">
            @if (quotePreview()) {
              <p class="line-clamp-2 border-l-2 border-[#007979] pl-2 text-xs italic text-slate-600">{{ quotePreview() }}</p>
            }
            <label for="zb-annotation-note" class="text-xs font-semibold text-slate-700">{{ 'Your note' | t }}</label>
            <textarea
              #noteField
              id="zb-annotation-note"
              rows="4"
              class="w-full resize-y rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
              [maxLength]="noteLimit"
              [value]="noteText()"
              (input)="noteText.set(noteField.value)"
              (keydown.control.enter)="saveNote()"
              (keydown.meta.enter)="saveNote()"
            ></textarea>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] text-slate-500">{{ noteText().length }}/{{ noteLimit }}</span>
              <div class="flex gap-2">
                <button type="button" class="h-8 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100" (click)="cancelNote()">
                  {{ 'Cancel' | t }}
                </button>
                <button
                  type="submit"
                  class="h-8 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                  [disabled]="saving()"
                >
                  {{ 'Save note' | t }}
                </button>
              </div>
            </div>
          </form>
        } @else {
          @if (tooLong()) {
            <p class="mb-2 px-1 text-xs text-rose-700">{{ 'Select a shorter passage (up to 1,000 characters).' | t }}</p>
          }
          <div class="flex flex-wrap items-center gap-1">
            @for (option of colors; track option.color) {
              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] focus-visible:ring-offset-1 disabled:opacity-40 disabled:hover:scale-100"
                [style.background-color]="option.background"
                [style.border-color]="currentColor() === option.color ? '#0f172a' : option.accent"
                [style.color]="option.accent"
                [attr.aria-label]="colorLabel(option)"
                [attr.aria-pressed]="mode() === 'edit' ? currentColor() === option.color : null"
                [title]="colorLabel(option)"
                [disabled]="tooLong() || saving()"
                (click)="highlight(option.color)"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">{{ currentColor() === option.color ? 'check' : option.icon }}</mat-icon>
              </button>
            }
            <span class="mx-1 h-6 w-px bg-slate-200" aria-hidden="true"></span>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-40"
              [attr.aria-label]="(editing()?.note ? 'Edit note' : 'Add a note') | t"
              [title]="(editing()?.note ? 'Edit note' : 'Add a note') | t"
              [disabled]="tooLong() || saving()"
              (click)="openNote()"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">edit_note</mat-icon>
            </button>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
              [attr.aria-label]="'Copy' | t"
              [title]="'Copy' | t"
              (click)="copy()"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">content_copy</mat-icon>
            </button>
            @if (mode() === 'edit') {
              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-40"
                [attr.aria-label]="'Remove' | t"
                [title]="'Remove' | t"
                [disabled]="saving()"
                (click)="remove()"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">delete</mat-icon>
              </button>
            }
            <button
              type="button"
              class="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
              [attr.aria-label]="'Close' | t"
              [title]="'Close (Esc)' | t"
              (click)="dismiss()"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">close</mat-icon>
            </button>
          </div>
          @if (mode() === 'edit' && editing(); as item) {
            <p class="mt-2 px-1 text-xs font-semibold text-slate-600">{{ editingLabel() | t }}</p>
            @if (item.note) {
              <p class="mt-1 line-clamp-3 whitespace-pre-wrap break-words px-1 text-sm text-slate-700">{{ item.note }}</p>
            }
          }
        }
      </div>
    }
  `,
})
export class AnnotationToolbarComponent {
  /** The lesson article: selections outside it are ignored. */
  readonly root = input<HTMLElement | null>(null);
  readonly lesson = input<Lesson | null>(null);

  private readonly service = inject(AnnotationService);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);

  protected readonly colors = HIGHLIGHT_COLORS;
  protected readonly toolbarWidth = TOOLBAR_WIDTH;
  protected readonly noteWidth = NOTE_WIDTH;
  protected readonly noteLimit = ANNOTATION_LIMITS.note;

  protected readonly mode = signal<'closed' | 'select' | 'edit' | 'note'>('closed');
  protected readonly position = signal<Position | null>(null);
  protected readonly noteText = signal('');
  protected readonly saving = signal(false);
  protected readonly tooLong = signal(false);

  private readonly pending = signal<PendingSelection | null>(null);
  private readonly editingId = signal<string | null>(null);
  /** The highlight being changed (kept live: another tab may change it). */
  protected readonly editing = computed(() => {
    const id = this.editingId();
    return id ? (this.service.annotations().find((item) => item.id === id) ?? null) : null;
  });
  protected readonly currentColor = computed<HighlightColor | null>(() =>
    this.mode() === 'edit' ? (this.editing()?.color ?? null) : null,
  );
  protected readonly editingLabel = computed(() => {
    const option = HIGHLIGHT_COLORS.find((item) => item.color === this.editing()?.color);
    return option ? option.label : 'Note';
  });
  protected readonly quotePreview = computed(() => this.pending()?.anchor.quote ?? this.editing()?.quote ?? '');

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly noteField = viewChild<ElementRef<HTMLTextAreaElement>>('noteField');

  /** A pointer press inside the toolbar: the selection collapsing is not a reason to close. */
  private interacting = false;
  private selectionFrame = 0;
  /** The element the edit toolbar points at. */
  private anchorElement: HTMLElement | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Clicking a highlight opens it for editing.
    effect((onCleanup) => {
      const root = this.root();
      if (!root) return;
      const onClick = (event: MouseEvent) => this.onRootClick(event);
      root.addEventListener('click', onClick);
      onCleanup(() => root.removeEventListener('click', onClick));
    });

    // The lesson may scroll inside its own container (full screen): follow it.
    const onScroll = () => this.reposition();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      if (this.selectionFrame) cancelAnimationFrame(this.selectionFrame);
    });

    // A new lesson closes the toolbar.
    effect(() => {
      this.lesson();
      this.reset();
    });

    // Close when the highlight being edited is removed (here or elsewhere).
    effect(() => {
      if (this.mode() === 'edit' && this.editingId() && !this.editing()) this.reset();
    });
  }

  protected colorLabel(option: HighlightColorOption): string {
    return this.i18n.t('Highlight: {0}', [this.i18n.t(option.label)]);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.interacting = true;
    // Keep the text selected while a button is pressed with a mouse.
    if (event.pointerType === 'mouse' && !(event.target as HTMLElement).closest('textarea')) {
      event.preventDefault();
    }
    setTimeout(() => (this.interacting = false), 400);
  }

  // ------------------------------------------------------------------
  // Selection
  // ------------------------------------------------------------------

  protected onSelectionChange(): void {
    if (this.selectionFrame) cancelAnimationFrame(this.selectionFrame);
    this.selectionFrame = requestAnimationFrame(() => {
      this.selectionFrame = 0;
      this.readSelection();
    });
  }

  private readSelection(): void {
    if (this.mode() === 'note' || this.interacting) return;

    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (this.mode() === 'select') this.reset();
      return;
    }

    const range = selection.getRangeAt(0);
    const root = this.root();
    const section = sectionOf(range.startContainer);
    if (!root || !section || section !== sectionOf(range.endContainer) || !root.contains(section) || !this.service.available()) {
      if (this.mode() === 'select') this.reset();
      return;
    }

    const text = textOf(section);
    let start = offsetOf(section, range.startContainer, range.startOffset);
    let end = offsetOf(section, range.endContainer, range.endOffset);
    // Ignore spaces and line breaks at either end of the selection.
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end <= start) {
      if (this.mode() === 'select') this.reset();
      return;
    }

    const blockIndex = Number(section.getAttribute('data-block-index') ?? -1);
    this.tooLong.set(end - start > ANNOTATION_LIMITS.quote);
    this.pending.set({ blockIndex, anchor: anchor(text, start, end), range: range.cloneRange() });
    this.editingId.set(null);
    this.anchorElement = null;
    this.mode.set('select');
    this.reposition();
  }

  private onRootClick(event: MouseEvent): void {
    const mark = (event.target as HTMLElement | null)?.closest<HTMLElement>('mark[data-annotation-id]');
    const selection = document.getSelection();
    if (!mark || (selection && !selection.isCollapsed)) return;
    this.openForEditing(mark.getAttribute('data-annotation-id') ?? '', mark);
  }

  /** Open a highlight for editing (also used by My notes). */
  openForEditing(id: string, element: HTMLElement): void {
    if (!id) return;
    this.pending.set(null);
    this.tooLong.set(false);
    this.editingId.set(id);
    this.anchorElement = element;
    this.mode.set('edit');
    this.reposition();
  }

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  protected async highlight(color: HighlightColor): Promise<void> {
    const lesson = this.lesson();
    const pending = this.pending();
    const editing = this.editing();
    if (!lesson) return;

    await this.run(async () => {
      if (this.mode() === 'select' && pending) {
        await this.service.add(lesson, pending.blockIndex, pending.anchor, color);
        document.getSelection()?.removeAllRanges();
        this.reset();
      } else if (this.mode() === 'edit' && editing && editing.color !== color) {
        await this.service.setColor(editing.id, color);
      }
    });
  }

  protected openNote(): void {
    this.noteText.set(this.editing()?.note ?? '');
    this.mode.set('note');
    this.reposition();
    afterNextRender(() => this.noteField()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancelNote(): void {
    if (this.editing()) {
      this.mode.set('edit');
      this.reposition();
    } else {
      this.reset();
    }
  }

  protected async saveNote(): Promise<void> {
    const lesson = this.lesson();
    const pending = this.pending();
    const editing = this.editing();
    const note = this.noteText().trim();

    await this.run(async () => {
      if (editing) {
        await this.service.setNote(editing.id, note);
        this.toast.success(this.i18n.t(note ? 'Note saved.' : 'Note removed.'));
      } else if (pending && lesson && note) {
        await this.service.add(lesson, pending.blockIndex, pending.anchor, null, note);
        document.getSelection()?.removeAllRanges();
        this.toast.success(this.i18n.t('Note saved.'));
      }
      this.reset();
    });
  }

  protected async copy(): Promise<void> {
    const text = this.pending()?.anchor.quote ?? this.editing()?.quote ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success(this.i18n.t('Copied.'));
    } catch {
      // Older browsers or no permission: the browser's own copy still works.
      this.toast.error(this.i18n.t('Could not copy. Press Ctrl+C (Cmd+C on a Mac) instead.'));
    }
  }

  protected async remove(): Promise<void> {
    const editing = this.editing();
    if (!editing) return;
    await this.run(async () => {
      await this.service.remove(editing.id);
      this.toast.success(this.i18n.t(editing.color ? 'Highlight removed.' : 'Note removed.'));
      this.reset();
    });
  }

  /** The close button: hide the toolbar and clear a fresh selection. */
  protected dismiss(): void {
    if (this.mode() === 'select') document.getSelection()?.removeAllRanges();
    this.reset();
  }

  close(): void {
    if (this.mode() === 'note' && this.editing()) {
      this.cancelNote();
      return;
    }
    this.reset();
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      await action();
    } catch (error) {
      this.logger.error('AnnotationToolbar', 'Could not save the highlight or note.', error);
      this.toast.error(this.i18n.t('Could not save. Check your connection and try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  private reset(): void {
    this.mode.set('closed');
    this.position.set(null);
    this.pending.set(null);
    this.editingId.set(null);
    this.anchorElement = null;
    this.noteText.set('');
    this.tooLong.set(false);
  }

  // ------------------------------------------------------------------
  // Position
  // ------------------------------------------------------------------

  protected reposition(): void {
    if (this.mode() === 'closed') return;
    const target = this.anchorElement?.isConnected
      ? this.anchorElement.getBoundingClientRect()
      : this.pending()?.range.getBoundingClientRect();
    if (!target || (target.width === 0 && target.height === 0)) {
      this.reset();
      return;
    }

    const width = Math.min(this.mode() === 'note' ? NOTE_WIDTH : TOOLBAR_WIDTH, document.documentElement.clientWidth - 2 * GAP);
    const height = this.panel()?.nativeElement.offsetHeight || (this.mode() === 'note' ? 210 : 56);
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    // On touch screens the phone's own copy menu sits above the selection: go below it.
    const preferBelow = window.matchMedia?.('(pointer: coarse)').matches ?? false;

    let top = preferBelow ? target.bottom + GAP : target.top - height - GAP;
    if (!preferBelow && top < TOP_LIMIT) top = target.bottom + GAP;
    if (preferBelow && top + height > viewportHeight - GAP) top = Math.max(TOP_LIMIT, target.top - height - GAP);
    top = Math.min(Math.max(top, TOP_LIMIT), Math.max(TOP_LIMIT, viewportHeight - height - GAP));

    const left = Math.min(
      Math.max(GAP, target.left + target.width / 2 - width / 2),
      Math.max(GAP, viewportWidth - width - GAP),
    );

    this.position.set({ top, left });
  }
}

function sectionOf(node: Node): HTMLElement | null {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  return element?.closest<HTMLElement>('[data-annotation-section]') ?? null;
}
