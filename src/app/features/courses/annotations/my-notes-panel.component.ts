import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  Injector,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { CourseOutlineLesson } from '../course.model';
import {
  ANNOTATION_LIMITS,
  CourseAnnotation,
  HIGHLIGHT_COLORS,
  HighlightColor,
  highlightOption,
} from './annotation.model';
import { AnnotationService } from './annotation.service';

type NotesFilter = 'all' | HighlightColor | 'notes' | 'bookmarks';

interface LessonGroup {
  lessonId: string;
  title: string;
  items: CourseAnnotation[];
}

/**
 * My notes: everything the learner highlighted, noted and bookmarked in
 * the course, grouped by lesson in course order, with filters by colour,
 * notes and bookmarks. Opens from the lesson player.
 */
@Component({
  selector: 'app-my-notes-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe],
  host: {
    '(document:keydown.escape)': 'open() && closed.emit()',
  },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[940] bg-slate-900/30" aria-hidden="true" (click)="closed.emit()"></div>
      <aside
        class="fixed inset-y-0 right-0 z-[950] flex w-full max-w-full flex-col bg-white shadow-2xl sm:w-[400px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zb-my-notes-title"
      >
        <header class="flex items-center gap-2 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-4 py-3 text-white">
          <mat-icon aria-hidden="true">sticky_note_2</mat-icon>
          <div class="min-w-0 flex-1">
            <h2 id="zb-my-notes-title" class="text-base font-semibold">{{ 'My notes' | t }}</h2>
            <p class="truncate text-xs text-white/80">{{ courseTitle() }}</p>
          </div>
          <button
            #closeButton
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            [attr.aria-label]="'Close' | t"
            (click)="closed.emit()"
          >
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </header>

        <!-- Filters -->
        <div class="flex flex-wrap gap-1.5 border-b border-slate-200 px-3 py-2.5" role="group" [attr.aria-label]="'Show' | t">
          @for (chip of chips(); track chip.key) {
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-40"
              [style.background-color]="filter() === chip.key ? (chip.background ?? '#e6f4f4') : '#ffffff'"
              [style.border-color]="filter() === chip.key ? (chip.accent ?? '#007979') : '#e2e8f0'"
              [style.color]="chip.accent ?? '#334155'"
              [attr.aria-pressed]="filter() === chip.key"
              [disabled]="chip.count === 0 && chip.key !== 'all'"
              (click)="filter.set(chip.key)"
            >
              @if (chip.icon) {
                <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ chip.icon }}</mat-icon>
              }
              <span class="text-slate-800">{{ chip.label | t }}</span>
              <span class="tabular-nums text-slate-500">{{ chip.count }}</span>
            </button>
          }
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          @if (!loaded()) {
            <p class="p-4 text-center text-sm text-slate-500">{{ 'Loading…' | t }}</p>
          } @else if (!total()) {
            <div class="mx-2 mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
              <p class="font-semibold text-slate-800">{{ 'Nothing saved yet' | t }}</p>
              <p class="mt-2">{{ 'Select text in a lesson to highlight it, add a note or copy it. Use the bookmark button to save a lesson.' | t }}</p>
              <ul class="mt-3 space-y-1.5">
                @for (option of colors; track option.color) {
                  <li class="flex items-center gap-2">
                    <span class="flex h-6 w-6 items-center justify-center rounded-full border-2" [style.background-color]="option.background" [style.border-color]="option.accent" [style.color]="option.accent">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none" aria-hidden="true">{{ option.icon }}</mat-icon>
                    </span>
                    {{ option.label | t }}
                  </li>
                }
              </ul>
            </div>
          } @else if (!groups().length) {
            <p class="p-4 text-center text-sm text-slate-500">{{ 'Nothing here with this filter.' | t }}</p>
          }

          @for (group of groups(); track group.lessonId) {
            <section class="mb-4">
              <h3 class="mb-2 flex items-center gap-1 px-1 text-xs font-bold uppercase tracking-wide text-[#007979]">
                <span class="min-w-0 flex-1 truncate">{{ group.title }}</span>
                @if (group.lessonId === currentLessonId()) {
                  <span class="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] normal-case tracking-normal text-[#007979]">{{ 'This lesson' | t }}</span>
                }
              </h3>
              <ul class="space-y-2">
                @for (item of group.items; track item.id) {
                  <li class="rounded-xl border border-slate-200 bg-white p-3">
                    <div class="flex items-center gap-2 text-xs font-semibold" [style.color]="accent(item)">
                      <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ icon(item) }}</mat-icon>
                      <span>{{ kindLabel(item) | t }}</span>
                    </div>

                    @if (item.quote) {
                      <blockquote
                        class="mt-2 line-clamp-4 border-l-4 py-0.5 pl-2 text-sm text-slate-800"
                        [style.border-color]="accent(item)"
                        [style.background-color]="background(item)"
                      >{{ item.quote }}</blockquote>
                    }
                    @if (missing().has(item.id) && item.lessonId === currentLessonId()) {
                      <p class="mt-1 flex items-center gap-1 text-xs text-amber-700">
                        <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">info</mat-icon>
                        {{ 'This passage changed in the lesson, so it is no longer highlighted there.' | t }}
                      </p>
                    }

                    @if (editingId() === item.id) {
                      <label class="mt-2 block text-xs font-semibold text-slate-700" [for]="'zb-note-' + item.id">{{ 'Your note' | t }}</label>
                      <textarea
                        #noteEditor
                        rows="3"
                        class="mt-1 w-full resize-y rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                        [id]="'zb-note-' + item.id"
                        [maxLength]="noteLimit"
                        [value]="draft()"
                        (input)="draft.set(noteEditor.value)"
                      ></textarea>
                      <div class="mt-1 flex justify-end gap-2">
                        <button type="button" class="h-8 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100" (click)="editingId.set(null)">{{ 'Cancel' | t }}</button>
                        <button type="button" class="h-8 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50" [disabled]="busy()" (click)="saveNote(item)">{{ 'Save note' | t }}</button>
                      </div>
                    } @else if (item.note) {
                      <p class="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{{ item.note }}</p>
                    }

                    @if (item.kind !== 'bookmark' && editingId() !== item.id) {
                      <div class="mt-2 flex flex-wrap items-center gap-1" role="group" [attr.aria-label]="'Colour' | t">
                        @for (option of colors; track option.color) {
                          <button
                            type="button"
                            class="flex h-7 w-7 items-center justify-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-50"
                            [style.background-color]="option.background"
                            [style.border-color]="item.color === option.color ? '#0f172a' : option.accent"
                            [style.color]="option.accent"
                            [attr.aria-label]="colorLabel(option.label)"
                            [attr.aria-pressed]="item.color === option.color"
                            [title]="colorLabel(option.label)"
                            [disabled]="busy()"
                            (click)="setColor(item, option.color)"
                          >
                            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none" aria-hidden="true">{{ item.color === option.color ? 'check' : option.icon }}</mat-icon>
                          </button>
                        }
                      </div>
                    }

                    @if (editingId() !== item.id) {
                      <div class="mt-2 flex flex-wrap gap-1 text-sm">
                        <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-[#007979] hover:bg-teal-50" (click)="goTo.emit({ lessonId: item.lessonId, annotationId: item.kind === 'bookmark' ? null : item.id })">
                          <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ item.kind === 'bookmark' ? 'menu_book' : 'my_location' }}</mat-icon>
                          {{ (item.kind === 'bookmark' ? 'Open lesson' : 'Show in lesson') | t }}
                        </button>
                        @if (item.kind !== 'bookmark') {
                          <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-slate-700 hover:bg-slate-100" (click)="editNote(item)">
                            <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">edit_note</mat-icon>
                            {{ (item.note ? 'Edit note' : 'Add a note') | t }}
                          </button>
                        }
                        <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50" [disabled]="busy()" (click)="remove(item)">
                          <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">delete</mat-icon>
                          {{ 'Remove' | t }}
                        </button>
                      </div>
                    }
                  </li>
                }
              </ul>
            </section>
          }
        </div>

        <p class="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">
          {{ 'Only you can see your highlights, notes and bookmarks.' | t }}
        </p>
      </aside>
    }
  `,
})
export class MyNotesPanelComponent {
  readonly open = input(false);
  readonly courseTitle = input('');
  /** Lessons in course order. */
  readonly outline = input<CourseOutlineLesson[]>([]);
  readonly currentLessonId = input<string | null>(null);
  /** Annotations whose words are no longer in the open lesson. */
  readonly missing = input<ReadonlySet<string>>(new Set());

  readonly closed = output<void>();
  readonly goTo = output<{ lessonId: string; annotationId: string | null }>();

  private readonly service = inject(AnnotationService);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);

  protected readonly colors = HIGHLIGHT_COLORS;
  protected readonly noteLimit = ANNOTATION_LIMITS.note;
  protected readonly loaded = this.service.loaded;

  protected readonly filter = signal<NotesFilter>('all');
  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly busy = signal(false);

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly noteEditor = viewChild<ElementRef<HTMLTextAreaElement>>('noteEditor');

  protected readonly total = computed(() => this.service.annotations().length);

  protected readonly chips = computed(() => {
    const items = this.service.annotations();
    const count = (test: (item: CourseAnnotation) => boolean) => items.filter(test).length;
    return [
      { key: 'all' as NotesFilter, label: 'All', icon: '', count: items.length, background: null, accent: null },
      ...HIGHLIGHT_COLORS.map((option) => ({
        key: option.color as NotesFilter,
        label: option.label,
        icon: option.icon,
        count: count((item) => item.color === option.color),
        background: option.background,
        accent: option.accent,
      })),
      { key: 'notes' as NotesFilter, label: 'Notes', icon: 'edit_note', count: count((item) => !!item.note), background: null, accent: null },
      { key: 'bookmarks' as NotesFilter, label: 'Bookmarks', icon: 'bookmark', count: count((item) => item.kind === 'bookmark'), background: null, accent: null },
    ];
  });

  protected readonly groups = computed<LessonGroup[]>(() => {
    const filter = this.filter();
    const items = this.service.annotations().filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'notes') return !!item.note;
      if (filter === 'bookmarks') return item.kind === 'bookmark';
      return item.color === filter;
    });

    const order = new Map(this.outline().map((lesson, index) => [lesson.id, index]));
    const byLesson = new Map<string, CourseAnnotation[]>();
    for (const item of items) {
      const list = byLesson.get(item.lessonId) ?? [];
      list.push(item);
      byLesson.set(item.lessonId, list);
    }

    return Array.from(byLesson.entries())
      .map(([lessonId, list]) => ({
        lessonId,
        title: this.outline().find((lesson) => lesson.id === lessonId)?.title ?? list[0].lessonTitle,
        // Bookmark first, then in reading order, then oldest first.
        items: [...list].sort(
          (a, b) =>
            (a.kind === 'bookmark' ? -1 : 0) - (b.kind === 'bookmark' ? -1 : 0) ||
            a.blockIndex - b.blockIndex ||
            (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0),
        ),
      }))
      .sort((a, b) => (order.get(a.lessonId) ?? 1e6) - (order.get(b.lessonId) ?? 1e6));
  });

  constructor() {
    // Move focus into the panel when it opens.
    effect(() => {
      if (this.open()) {
        afterNextRender(() => this.closeButton()?.nativeElement.focus(), { injector: this.injector });
      } else {
        this.editingId.set(null);
      }
    });
  }

  protected colorLabel(label: string): string {
    return this.i18n.t('Highlight: {0}', [this.i18n.t(label)]);
  }

  protected kindLabel(item: CourseAnnotation): string {
    if (item.kind === 'bookmark') return 'Bookmarked lesson';
    return highlightOption(item.color)?.label ?? 'Note';
  }

  protected icon(item: CourseAnnotation): string {
    if (item.kind === 'bookmark') return 'bookmark';
    return highlightOption(item.color)?.icon ?? 'edit_note';
  }

  protected accent(item: CourseAnnotation): string {
    return highlightOption(item.color)?.accent ?? '#007979';
  }

  protected background(item: CourseAnnotation): string {
    return highlightOption(item.color)?.background ?? '#f0fdfa';
  }

  protected editNote(item: CourseAnnotation): void {
    this.draft.set(item.note);
    this.editingId.set(item.id);
    afterNextRender(() => this.noteEditor()?.nativeElement.focus(), { injector: this.injector });
  }

  protected async saveNote(item: CourseAnnotation): Promise<void> {
    await this.run(async () => {
      const note = this.draft().trim();
      if (!note && item.kind === 'note') {
        // A note without words is nothing: remove it.
        await this.service.remove(item.id);
        this.toast.success(this.i18n.t('Note removed.'));
      } else {
        await this.service.setNote(item.id, note);
        this.toast.success(this.i18n.t(note ? 'Note saved.' : 'Note removed.'));
      }
      this.editingId.set(null);
    });
  }

  protected async setColor(item: CourseAnnotation, color: HighlightColor): Promise<void> {
    if (item.color === color) return;
    await this.run(() => this.service.setColor(item.id, color));
  }

  protected async remove(item: CourseAnnotation): Promise<void> {
    await this.run(async () => {
      await this.service.remove(item.id);
      this.toast.success(
        this.i18n.t(item.kind === 'bookmark' ? 'Bookmark removed.' : item.color ? 'Highlight removed.' : 'Note removed.'),
      );
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await action();
    } catch (error) {
      this.logger.error('MyNotesPanel', 'Could not change the highlight or note.', error);
      this.toast.error(this.i18n.t('Could not save. Check your connection and try again.'));
    } finally {
      this.busy.set(false);
    }
  }
}
