import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { LessonMediaComponent } from '../components/lesson-media.component';
import { courseContextFromRoute, LessonBlock } from '../course.model';
import { CourseStore } from '../course.store';

/** A lesson block prepared for display. */
type ViewBlock =
  | { kind: 'text'; html: string }
  | { kind: 'tip'; html: string }
  | { kind: 'media'; mediaKind: 'video' | 'audio' | 'document'; url: string; start: number; label: string; caption: string }
  | { kind: 'image'; url: string; alt: string; caption: string }
  | { kind: 'check'; index: number; question: string; options: string[]; answer: number; explanation: string };

/**
 * The lesson player: course outline on the left (wide screens), the lesson
 * in a readable column, quick checks that must be answered correctly before
 * moving on, and Previous / Complete and continue at the bottom.
 */
@Component({
  selector: 'app-lesson-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, LessonMediaComponent],
  styles: [
    `
      :host ::ng-deep .lesson-prose { font-size: 1.0625rem; line-height: 1.75; color: #1e293b; }
      :host ::ng-deep .lesson-prose h2 { font-size: 1.3rem; font-weight: 700; margin: 1.75rem 0 0.5rem; color: #032d42; }
      :host ::ng-deep .lesson-prose h3 { font-size: 1.1rem; font-weight: 700; margin: 1.25rem 0 0.4rem; color: #032d42; }
      :host ::ng-deep .lesson-prose p { margin: 0 0 1rem; }
      :host ::ng-deep .lesson-prose ul { list-style: disc; margin: 0 0 1rem 1.4rem; }
      :host ::ng-deep .lesson-prose ol { list-style: decimal; margin: 0 0 1rem 1.4rem; }
      :host ::ng-deep .lesson-prose li { margin: 0.25rem 0; }
      :host ::ng-deep .lesson-prose a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .lesson-prose code { background: #f1f5f9; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.9em; }
      :host ::ng-deep .lesson-prose pre { background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
      :host ::ng-deep .lesson-prose pre code { background: transparent; padding: 0; color: inherit; }
      :host ::ng-deep .lesson-prose > :last-child { margin-bottom: 0; }
    `,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: store.course()?.title ?? 'Course', link: coursePath(), translate: !store.course() },
          { label: store.lesson()?.title ?? 'Lesson', translate: !store.lesson() }
        ]"
      />

      <div class="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[270px_1fr] lg:px-8">
        <!-- Outline (wide screens) -->
        <nav class="hidden self-start rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-20 lg:block" [attr.aria-label]="'Course outline' | t">
          @for (module of store.course()?.modules ?? []; track module.id; let moduleIndex = $index) {
            <p class="px-2 pb-1 pt-2 text-[12px] font-bold uppercase tracking-wide text-[#007979]">{{ 'Module {0}' | t: [moduleIndex + 1] }}</p>
            @for (item of module.lessons; track item.id) {
              <a
                [routerLink]="[coursePath(), 'lessons', item.id]"
                class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                [ngClass]="item.id === store.lesson()?.id ? 'bg-teal-50 font-semibold text-[#007979]' : 'text-slate-700 hover:bg-slate-50'"
                [attr.aria-current]="item.id === store.lesson()?.id ? 'page' : null"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  [ngClass]="store.completedIds().has(item.id) ? 'border-[#007979] bg-[#007979] text-white' : 'border-slate-200'"
                  aria-hidden="true"
                >
                  @if (store.completedIds().has(item.id)) {
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
                  }
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
              </a>
            }
          }
        </nav>

        <div class="min-w-0">
          <!-- Where you are -->
          <div class="sticky top-16 z-10 -mx-1 bg-slate-50/95 px-1 pb-3 pt-1 backdrop-blur">
            <div class="flex justify-between gap-2 text-xs text-slate-500">
              <span>
                @if (store.lessonIndex() >= 0) {
                  {{ 'Lesson {0} of {1}' | t: [store.lessonIndex() + 1, store.outline().length] }}
                  @if (store.lesson(); as lesson) {
                    · {{ lesson.minutes }} min
                  }
                }
              </span>
              <span>{{ '{percent}% of course' | t: { percent: coursePercent() } }}</span>
            </div>
            <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-all" [style.width.%]="coursePercent()"></div>
            </div>
          </div>

          @if (store.courseLoading() || store.lessonLoading()) {
            <div class="h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
          } @else if (store.courseError() || store.lessonError()) {
            <div class="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center" role="alert">
              <p class="text-slate-700">{{ (store.courseError() || store.lessonError())! | t }}</p>
              <a [routerLink]="coursePath()" class="mt-3 inline-block font-semibold text-[#007979] hover:underline">{{ 'Back to the course' | t }}</a>
            </div>
          } @else if (store.lesson(); as lesson) {
            <article class="max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
              @if (moduleTitle()) {
                <p class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ moduleTitle() }}</p>
              }
              <h1 class="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-[1.75rem]">{{ lesson.title }}</h1>

              <div class="mt-5 flex flex-col gap-5">
                @for (block of blocks(); track $index) {
                  @if (block.kind === 'text') {
                      <div class="lesson-prose" [innerHTML]="block.html"></div>
                  } @else if (block.kind === 'tip') {
                      <aside class="flex gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
                        <mat-icon class="shrink-0 text-amber-600" aria-hidden="true">lightbulb</mat-icon>
                        <div class="lesson-prose !text-[0.975rem] !text-amber-900" [innerHTML]="block.html"></div>
                      </aside>
                  } @else if (block.kind === 'media') {
                      <app-lesson-media
                        [kind]="block.mediaKind"
                        [url]="block.url"
                        [start]="block.start"
                        [label]="block.label"
                        [caption]="block.caption"
                      />
                  } @else if (block.kind === 'image') {
                      <figure>
                        <img [src]="block.url" [alt]="block.alt" class="w-full rounded-xl border border-slate-200" loading="lazy" />
                        @if (block.caption) {
                          <figcaption class="mt-2 text-sm text-slate-500">{{ block.caption }}</figcaption>
                        }
                      </figure>
                  } @else if (block.kind === 'check') {
                      <section class="rounded-xl border-2 border-teal-100 p-4 sm:p-5" [attr.aria-labelledby]="'check-' + block.index">
                        <h2 [id]="'check-' + block.index" class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <mat-icon class="text-[#007979]" aria-hidden="true">quiz</mat-icon>{{ 'Quick check' | t }}
                        </h2>
                        <p class="mt-2 text-slate-800">{{ block.question }}</p>
                        <div class="mt-3 flex flex-col gap-2">
                          @for (option of block.options; track $index; let optionIndex = $index) {
                            <button
                              type="button"
                              class="rounded-xl border px-3 py-2.5 text-left transition"
                              [ngClass]="optionClass(block.index, optionIndex, block.answer)"
                              [disabled]="isSolved(block.index)"
                              [attr.aria-pressed]="selected()[block.index] === optionIndex"
                              (click)="choose(block.index, optionIndex, block.answer)"
                            >
                              {{ option }}
                            </button>
                          }
                        </div>
                        <div class="mt-2 min-h-5 text-sm" aria-live="polite">
                          @if (selected()[block.index] !== undefined) {
                            @if (selected()[block.index] === block.answer) {
                              <p class="text-[#007979]">
                                <strong>{{ 'Correct.' | t }}</strong> {{ block.explanation }}
                              </p>
                            } @else {
                              <p class="text-rose-700">
                                <strong>{{ 'Not quite.' | t }}</strong> {{ 'Have another look and try again.' | t }}
                              </p>
                            }
                          }
                        </div>
                      </section>
                  }
                }
              </div>

              <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                @if (store.previousLesson(); as previous) {
                  <a
                    [routerLink]="[coursePath(), 'lessons', previous.id]"
                    class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <mat-icon aria-hidden="true">arrow_back</mat-icon>{{ 'Previous' | t }}
                  </a>
                } @else {
                  <span></span>
                }

                <button
                  type="button"
                  class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
                  [disabled]="!canContinue() || store.saving()"
                  (click)="complete()"
                >
                  {{ continueLabel() | t }}
                  <mat-icon aria-hidden="true">{{ store.nextLesson() ? 'arrow_forward' : 'flag' }}</mat-icon>
                </button>
              </div>
              @if (!canContinue()) {
                <p class="mt-2 text-right text-xs text-slate-500">{{ 'Answer the quick check to continue.' | t }}</p>
              } @else {
                <p class="mt-2 text-right text-xs text-slate-500">{{ 'Your progress is saved when you continue.' | t }}</p>
              }
            </article>
          }
        </div>
      </div>
    </main>
  `,
})
export class LessonPlayerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly courseId = signal(this.route.snapshot.paramMap.get('courseId') ?? '');

  /** Chosen option per quick check (by block index). */
  protected readonly selected = signal<Record<number, number>>({});
  /** First answer per quick check: right or wrong. */
  private readonly firstTry = signal<Record<number, boolean>>({});

  protected readonly coursePath = computed(() => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId()}`);

  protected readonly coursePercent = computed(() => this.store.courseProgress()?.percent ?? 0);

  protected readonly moduleTitle = computed(() => {
    const lesson = this.store.lesson();
    return this.store.course()?.modules.find((module) => module.lessons.some((item) => item.id === lesson?.id))?.title ?? '';
  });

  protected readonly blocks = computed<ViewBlock[]>(() => {
    return (this.store.lesson()?.blocks ?? []).map((block: LessonBlock, index): ViewBlock => {
      switch (block.type) {
        case 'text':
          return { kind: 'text', html: renderKnowledgeContent(block.text) };
        case 'tip':
          return { kind: 'tip', html: renderKnowledgeContent(block.text) };
        case 'video':
          return { kind: 'media', mediaKind: 'video', url: block.url, start: block.start ?? 0, label: '', caption: block.caption ?? '' };
        case 'audio':
          return { kind: 'media', mediaKind: 'audio', url: block.url, start: 0, label: '', caption: block.caption ?? '' };
        case 'document':
          return { kind: 'media', mediaKind: 'document', url: block.url, start: 0, label: block.title ?? '', caption: block.caption ?? '' };
        case 'image':
          return { kind: 'image', url: /^https:\/\//i.test(block.url) ? block.url : '', alt: block.alt, caption: block.caption ?? '' };
        case 'check':
          return {
            kind: 'check',
            index,
            question: block.question,
            options: block.options,
            answer: block.answer,
            explanation: block.explanation ?? '',
          };
      }
    });
  });

  private readonly checks = computed(() =>
    this.blocks().filter((block): block is Extract<ViewBlock, { kind: 'check' }> => block.kind === 'check'),
  );

  private readonly lessonDone = computed(() => {
    const lesson = this.store.lesson();
    return !!lesson && this.store.completedIds().has(lesson.id);
  });

  /** Every quick check answered correctly (or the lesson was already done). */
  protected readonly canContinue = computed(
    () => this.lessonDone() || this.checks().every((check) => this.selected()[check.index] === check.answer),
  );

  protected readonly continueLabel = computed(() => {
    if (this.store.nextLesson()) {
      return this.lessonDone() ? 'Next lesson' : 'Complete and continue';
    }
    return this.lessonDone() ? 'Course summary' : 'Finish course';
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly tabTitle = effect(() => {
    const title = this.store.lesson()?.title;
    if (title) {
      this.pageTitle.setDocumentTitle(title);
    }
  });

  constructor() {
    this.store.setContext(this.context);

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });

    // Next and Previous reuse this page: follow the lesson in the address.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const courseId = params.get('courseId') ?? '';
      const lessonId = params.get('lessonId') ?? '';
      this.courseId.set(courseId);
      this.selected.set({});
      this.firstTry.set({});
      void this.load(courseId, lessonId);
    });
  }

  private async load(courseId: string, lessonId: string): Promise<void> {
    await this.store.openCourse(courseId);
    await this.store.openLesson(lessonId);
    window.scrollTo({ top: 0 });
  }

  protected isSolved(index: number): boolean {
    const check = this.checks().find((item) => item.index === index);
    return !!check && this.selected()[index] === check.answer;
  }

  protected choose(index: number, option: number, answer: number): void {
    if (this.firstTry()[index] === undefined) {
      this.firstTry.update((current) => ({ ...current, [index]: option === answer }));
    }
    this.selected.update((current) => ({ ...current, [index]: option }));
  }

  protected optionClass(index: number, option: number, answer: number): string {
    const chosen = this.selected()[index];

    if (chosen === option) {
      return option === answer
        ? 'border-[#007979] bg-teal-50 font-semibold text-[#00605f]'
        : 'border-rose-300 bg-rose-50 text-rose-800';
    }

    return chosen === answer
      ? 'border-slate-200 text-slate-400'
      : 'border-slate-200 bg-white text-slate-800 hover:border-[#007979] hover:bg-teal-50/50';
  }

  protected async complete(): Promise<void> {
    if (!this.canContinue()) {
      return;
    }

    const checks = this.checks();
    const score = checks.length
      ? (checks.filter((check) => this.firstTry()[check.index] === true).length / checks.length) * 100
      : null;

    const alreadyCompleted = this.store.courseProgress()?.status === 'completed';

    try {
      const result = await this.store.completeLesson(score);
      if (!result) {
        return;
      }

      const next = this.store.nextLesson();

      if (result.courseCompleted && !next) {
        // The end of the course: the summary, with Take test when there is a final exam.
        if (!alreadyCompleted) {
          this.toast.success(this.i18n.t('All lessons done. Well done!'));
        }
        await this.router.navigate([this.coursePath(), 'summary']);
      } else if (next) {
        await this.router.navigate([this.coursePath(), 'lessons', next.id]);
      } else if (result.nextLessonId) {
        // The last lesson, with earlier lessons still to do.
        this.toast.info(this.i18n.t('A few lessons are still open. Here is the next one.'));
        await this.router.navigate([this.coursePath(), 'lessons', result.nextLessonId]);
      } else {
        await this.router.navigate([this.coursePath(), 'summary']);
      }
    } catch (error) {
      this.toast.error(this.i18n.t((error as Error).message || 'Your progress could not be saved. Try again.'));
    }
  }
}
