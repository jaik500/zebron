import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { LoggerService } from '../../../core/services/logger.service';
import { CourseContext, courseLink } from '../course.model';
import { CourseAnnotation, HIGHLIGHT_COLORS, HighlightColor, highlightOption } from './annotation.model';
import { AnnotationService } from './annotation.service';

type SummaryFilter = 'all' | HighlightColor | 'notes' | 'bookmarks';

/** Items shown before "Show all". */
const FIRST_PAGE = 6;

/**
 * My learning: the learner's highlights, notes and bookmarks from every
 * course, newest first, each linking to its place in the lesson.
 * Hidden until the learner has saved something.
 */
@Component({
  selector: 'app-my-notes-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    @if (loaded() && (items().length || removed())) {
      <section class="mt-8" aria-labelledby="my-notes-summary-title">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="my-notes-summary-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <mat-icon class="text-[#007979]" aria-hidden="true">sticky_note_2</mat-icon>
            {{ 'Highlights, notes and bookmarks' | t }}
          </h2>
          <span class="text-sm text-slate-500">{{ 'From all your courses. Only you can see them.' | t }}</span>
        </div>

        @if (removed(); as item) {
          <div class="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white" role="status" aria-live="polite">
            <span class="min-w-0 flex-1">{{ removedMessage(item) | t }}</span>
            <button
              #undoButton
              type="button"
              class="h-8 rounded-lg px-3 font-semibold text-teal-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              [disabled]="busy()"
              (click)="undo()"
            >
              {{ 'Undo' | t }}
            </button>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              [attr.aria-label]="'Dismiss' | t"
              (click)="removed.set(null)"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">close</mat-icon>
            </button>
          </div>
        }
        @if (removeError()) {
          <p class="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ removeError()! | t }}</p>
        }

        <!-- Filters -->
        <div class="mb-3 flex flex-wrap gap-1.5" role="group" [attr.aria-label]="'Show' | t">
          @for (chip of chips(); track chip.key) {
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-40"
              [style.background-color]="filter() === chip.key ? (chip.background ?? '#e6f4f4') : '#ffffff'"
              [style.border-color]="filter() === chip.key ? (chip.accent ?? '#007979') : '#e2e8f0'"
              [style.color]="chip.accent ?? '#334155'"
              [attr.aria-pressed]="filter() === chip.key"
              [disabled]="chip.count === 0 && chip.key !== 'all'"
              [title]="chip.label | t"
              (click)="setFilter(chip.key)"
            >
              @if (chip.icon) {
                <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ chip.icon }}</mat-icon>
              }
              <!-- Phones: icon and count only (the name stays for screen readers); "All" keeps its name. -->
              <span class="text-slate-800" [class]="chip.icon ? 'sr-only md:not-sr-only' : ''">{{ chip.label | t }}</span>
              <span class="tabular-nums text-slate-500">{{ chip.count }}</span>
            </button>
          }
        </div>

        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          @for (item of visible(); track item.id) {
            <li class="relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3">
              <button
                type="button"
                class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-50"
                [attr.aria-label]="removeLabel(item)"
                [title]="removeTitle(item) | t"
                [disabled]="busy()"
                (click)="remove(item)"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">close</mat-icon>
              </button>
              <div class="flex items-center gap-2 pr-9 text-xs font-semibold" [style.color]="accent(item)">
                <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ icon(item) }}</mat-icon>
                <span class="min-w-0 flex-1 truncate">{{ kindLabel(item) | t }}</span>
                @if (dateOf(item); as date) {
                  <span class="shrink-0 font-normal text-slate-500">{{ date }}</span>
                }
              </div>

              @if (item.quote) {
                <blockquote
                  class="mt-2 line-clamp-3 break-words border-l-4 py-0.5 pl-2 text-sm text-slate-800 [overflow-wrap:anywhere]"
                  [style.border-color]="accent(item)"
                  [style.background-color]="background(item)"
                >{{ item.quote }}</blockquote>
              }
              @if (item.note) {
                <p class="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
                  <mat-icon class="!h-4 !w-4 !align-[-3px] !text-[16px] !leading-none text-slate-400" aria-hidden="true">edit_note</mat-icon>
                  {{ item.note }}
                </p>
              }

              <div class="mt-auto flex min-w-0 flex-wrap items-end justify-between gap-2 pt-3">
                <p class="min-w-0 flex-1 text-xs text-slate-500">
                  <span class="block truncate font-semibold text-slate-700">{{ item.courseTitle || ('Course' | t) }}</span>
                  <span class="block truncate">{{ item.lessonTitle }}</span>
                </p>
                <a
                  [routerLink]="lessonLink(item)"
                  [queryParams]="item.kind === 'bookmark' ? null : { annotation: item.id }"
                  class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#007979] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                  [attr.aria-label]="linkLabel(item)"
                >
                  <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ item.kind === 'bookmark' ? 'menu_book' : 'my_location' }}</mat-icon>
                  {{ (item.kind === 'bookmark' ? 'Open lesson' : 'Show in lesson') | t }}
                </a>
              </div>
            </li>
          }
        </ul>

        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        @if (filtered().length > firstPage) {
          <button
            type="button"
            class="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#007979]"
            [attr.aria-expanded]="showAll()"
            (click)="showAll.set(!showAll())"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ showAll() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ (showAll() ? 'Show fewer' : 'Show all ({0})') | t: [filtered().length] }}
          </button>
        }
        @if (!confirmRemoval()) {
          <button
            type="button"
            class="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#007979]"
            [title]="'Show a warning before a highlight, note or bookmark is removed' | t"
            (click)="askAgain()"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">help_outline</mat-icon>
            {{ 'Ask before removing' | t }}
          </button>
        }
        </div>
        @if (preferenceMessage()) {
          <p class="mt-2 text-sm text-slate-600" role="status" aria-live="polite">{{ preferenceMessage()! | t }}</p>
        }
      </section>
    } @else if (failed()) {
      <p class="mt-8 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">
        {{ 'Your highlights and notes could not be loaded. Refresh the page to try again.' | t }}
      </p>
    }
  `,
})
export class MyNotesSummaryComponent {
  /** Where My learning is shown, so links stay in the right place. */
  readonly context = input.required<CourseContext>();
  /** On organization pages: the Zebron courses the organization offers (see courseLink). */
  readonly offeredZebron = input<ReadonlySet<string> | null>(null);

  private readonly service = inject(AnnotationService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly logger = inject(LoggerService);
  private readonly confirmation = inject(ConfirmationService);
  /** Ask before removing (off once the learner ticks "Don't ask me again"). */
  protected readonly confirmRemoval = this.service.confirmRemoval;
  protected readonly preferenceMessage = signal<string | null>(null);

  protected readonly firstPage = FIRST_PAGE;
  protected readonly items = signal<CourseAnnotation[]>([]);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);
  protected readonly filter = signal<SummaryFilter>('all');
  /** The item just removed, until Undo or the next removal. */
  protected readonly removed = signal<CourseAnnotation | null>(null);
  protected readonly removeError = signal<string | null>(null);
  protected readonly busy = signal(false);
  private readonly undoButton = viewChild<ElementRef<HTMLButtonElement>>('undoButton');
  private readonly injector = inject(Injector);
  protected readonly showAll = signal(false);

  protected readonly chips = computed(() => {
    const items = this.items();
    const count = (test: (item: CourseAnnotation) => boolean) => items.filter(test).length;
    return [
      { key: 'all' as SummaryFilter, label: 'All', icon: '', count: items.length, background: null, accent: null },
      ...HIGHLIGHT_COLORS.map((option) => ({
        key: option.color as SummaryFilter,
        label: option.label,
        icon: option.icon,
        count: count((item) => item.color === option.color),
        background: option.background,
        accent: option.accent,
      })),
      { key: 'notes' as SummaryFilter, label: 'Notes', icon: 'edit_note', count: count((item) => !!item.note), background: null, accent: null },
      { key: 'bookmarks' as SummaryFilter, label: 'Bookmarks', icon: 'bookmark', count: count((item) => item.kind === 'bookmark'), background: null, accent: null },
    ];
  });

  protected readonly filtered = computed(() => {
    const filter = this.filter();
    return this.items().filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'notes') return !!item.note;
      if (filter === 'bookmarks') return item.kind === 'bookmark';
      return item.color === filter;
    });
  });

  protected readonly visible = computed(() =>
    this.showAll() ? this.filtered() : this.filtered().slice(0, FIRST_PAGE),
  );

  constructor() {
    // Load when signed in (again if the person changes).
    effect(() => {
      const uid = this.auth.firebaseUser()?.uid ?? null;
      untracked(() => void this.load(uid));
    });
  }

  private async load(uid: string | null): Promise<void> {
    this.items.set([]);
    this.loaded.set(false);
    this.failed.set(false);
    if (!uid) return;
    try {
      this.items.set(await this.service.listRecent());
      this.loaded.set(true);
    } catch (error) {
      this.logger.error('MyNotesSummary', 'Could not load highlights and notes.', error);
      this.failed.set(true);
    }
  }

  /** Delete a highlight, note or bookmark (the × on its card). */
  protected async remove(item: CourseAnnotation): Promise<void> {
    if (this.busy()) return;
    this.removeError.set(null);
    this.preferenceMessage.set(null);

    if (this.confirmRemoval()) {
      const answer = await this.confirmation.confirmWithOption({
        title: this.confirmTitle(item),
        message: 'It is removed from the lesson, My notes and My learning. You can undo it straight after.',
        icon: 'delete',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        destructive: true,
        optionLabel: 'Don’t ask me again',
      });
      if (!answer.confirmed) return;
      if (answer.option) {
        try {
          await this.service.setConfirmRemoval(false);
          this.preferenceMessage.set('You won’t be asked again. Turn it back on with “Ask before removing”.');
        } catch (error) {
          this.logger.error('MyNotesSummary', 'Could not save the preference.', error);
        }
      }
    }

    this.busy.set(true);
    try {
      await this.service.remove(item.id);
      this.items.update((items) => items.filter((other) => other.id !== item.id));
      this.removed.set(item);
      // The card's button is gone: move focus to Undo.
      afterNextRender(() => this.undoButton()?.nativeElement.focus(), { injector: this.injector });
    } catch (error) {
      this.logger.error('MyNotesSummary', 'Could not remove the highlight or note.', error);
      this.removeError.set('Could not save. Check your connection and try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async undo(): Promise<void> {
    const item = this.removed();
    if (!item || this.busy()) return;
    this.busy.set(true);
    this.removeError.set(null);
    try {
      await this.service.restore(item);
      // Back in its place (newest first).
      this.items.update((items) =>
        [...items, item].sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)),
      );
      this.removed.set(null);
    } catch (error) {
      this.logger.error('MyNotesSummary', 'Could not put the highlight or note back.', error);
      this.removeError.set('Could not save. Check your connection and try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected confirmTitle(item: CourseAnnotation): string {
    if (item.kind === 'bookmark') return 'Remove this bookmark?';
    return item.color ? 'Remove this highlight?' : 'Remove this note?';
  }

  /** Bring the question back (the link shown after "Don't ask me again"). */
  protected async askAgain(): Promise<void> {
    try {
      await this.service.setConfirmRemoval(true);
      this.preferenceMessage.set('You’ll be asked before anything is removed.');
    } catch (error) {
      this.logger.error('MyNotesSummary', 'Could not save the preference.', error);
      this.removeError.set('Could not save. Check your connection and try again.');
    }
  }

  protected removedMessage(item: CourseAnnotation): string {
    if (item.kind === 'bookmark') return 'Bookmark removed.';
    return item.color ? 'Highlight removed.' : 'Note removed.';
  }

  protected removeTitle(item: CourseAnnotation): string {
    if (item.kind === 'bookmark') return 'Remove bookmark';
    return item.color ? 'Remove highlight' : 'Remove note';
  }

  /** Read out what will be removed, not just "Remove". */
  protected removeLabel(item: CourseAnnotation): string {
    const what = item.quote ? `“${item.quote.length > 60 ? item.quote.slice(0, 60) + '…' : item.quote}”` : item.lessonTitle;
    return `${this.i18n.t(this.removeTitle(item))}: ${what}`;
  }

  protected setFilter(filter: SummaryFilter): void {
    this.filter.set(filter);
    this.showAll.set(false);
  }

  /** The lesson, in the organization or on Zebron's pages as for the course itself. */
  protected lessonLink(item: CourseAnnotation): string {
    const course = courseLink({ courseId: item.courseId, organizationId: item.organizationId }, this.context(), this.offeredZebron());
    return `${course}/lessons/${encodeURIComponent(item.lessonId)}`;
  }

  protected linkLabel(item: CourseAnnotation): string {
    return this.i18n.t(item.kind === 'bookmark' ? 'Open {0}' : 'Show in {0}', [item.lessonTitle || this.i18n.t('lesson')]);
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

  protected dateOf(item: CourseAnnotation): string {
    const date = item.updatedAt?.toDate?.();
    if (!date) return '';
    try {
      return date.toLocaleDateString(this.i18n.language(), { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
}
