import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
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
  | {
      kind: 'media';
      mediaKind: 'video' | 'audio' | 'document';
      url: string;
      start: number;
      label: string;
      caption: string;
    }
  | { kind: 'image'; url: string; alt: string; caption: string }
  | {
      kind: 'check';
      index: number;
      questions: {
        question: string;
        options: string[];
        answer: number;
        explanation?: string;
      }[];
    };
/**
 * The lesson player: course outline on the left (wide screens), the lesson
 * in a readable column, quick checks that must be answered correctly before
 * moving on, and Previous / Complete and continue at the bottom.
 */
@Component({
  selector: 'app-lesson-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterLink,
    MatIconModule,
    MatExpansionModule,
    TranslatePipe,
    CourseHeaderComponent,
    LessonMediaComponent,
  ],
  template: `
    <main class="mt-16 min-h-screen w-full min-w-0 overflow-x-clip bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          {
            label: store.course()?.title ?? 'Course',
            link: coursePath(),
            translate: !store.course(),
          },
          { label: store.lesson()?.title ?? 'Lesson', translate: !store.lesson() },
        ]"
      />

      <div class="mx-auto grid w-full min-w-0 max-w-[1720px] grid-cols-[minmax(0,1fr)] gap-4 px-3 py-5 sm:gap-5 sm:px-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:px-6 2xl:px-8">
        <!-- Outline (wide screens) -->
        <nav
          class="hidden self-start rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-20 lg:block"
          [attr.aria-label]="'Course outline' | t"
        >
          @for (
            module of store.course()?.modules ?? [];
            track module.id;
            let moduleIndex = $index
          ) {
            <p class="px-2 pb-1 pt-2 text-[12px] font-bold uppercase tracking-wide text-[#007979]">
              {{ 'Module {0}' | t: [moduleIndex + 1] }}
            </p>
            @for (item of module.lessons; track item.id) {
              <a
                [routerLink]="[coursePath(), 'lessons', item.id]"
                class="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm"
                [ngClass]="
                  item.id === store.lesson()?.id
                    ? 'bg-teal-50 font-semibold text-[#007979]'
                    : 'text-slate-700 hover:bg-slate-50'
                "
                [attr.aria-current]="item.id === store.lesson()?.id ? 'page' : null"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  [ngClass]="
                    store.completedIds().has(item.id)
                      ? 'border-[#007979] bg-[#007979] text-white'
                      : 'border-slate-200'
                  "
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

        <div class="w-full min-w-0">
          <!-- Where you are -->
          <div
            class="lesson-progress-sticky sticky top-16 z-10 -mx-1 bg-slate-50/95 px-2 pb-3 pt-1 backdrop-blur"
          >
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
              <div
                class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-all"
                [style.width.%]="coursePercent()"
              ></div>
            </div>
          </div>

          @if (store.courseLoading() || store.lessonLoading()) {
            <div
              class="h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200/70"
              aria-hidden="true"
            ></div>
          } @else if (store.courseError() || store.lessonError()) {
            <div
              class="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center"
              role="alert"
            >
              <p class="text-slate-700">{{ (store.courseError() || store.lessonError())! | t }}</p>
              <a
                [routerLink]="coursePath()"
                class="mt-3 inline-block font-semibold text-[#007979] hover:underline"
                >{{ 'Back to the course' | t }}</a
              >
            </div>
          } @else if (store.lesson(); as lesson) {
            <article class="w-full min-w-0 max-w-none overflow-hidden rounded-xl border border-slate-200 bg-white py-5">
              @if (moduleTitle()) {
                <p class="px-5 text-[11px] font-bold uppercase tracking-wide text-[#007979]">
                  {{ moduleTitle() }}
                </p>
              }
              <h1
                class="px-5 mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-[1.75rem]"
              >
                {{ lesson.title }}
              </h1>

              <div class="mt-5 w-full min-w-0">
                <mat-accordion class="block w-full min-w-0" [multi]="true">
                  @for (block of blocks(); track $index) {
                    <mat-expansion-panel
                      [attr.id]="'lesson-block-' + $index"
                      class="!mb-2 !w-full !min-w-0 !scroll-mt-32 !overflow-hidden !rounded-xl !border !border-slate-200 !bg-white !shadow-none"
                      [expanded]="expandedBlocks().has($index)"
                      (opened)="openBlock($index)"
                      (closed)="closeBlock($index)"
                    >
                      <mat-expansion-panel-header
                        class="!min-h-14 !w-full !bg-slate-100 !px-4 hover:!bg-slate-200 sm:!px-5"
                      >
                        <mat-panel-title class="!m-0 !min-w-0 !items-center">
                          <span class="truncate text-base font-bold text-slate-900 sm:text-lg"
                            >
                            @if (!expandedBlocks().has($index)) {
                              <span class="font-semibold text-slate-500">{{ 'Next:' | t }} </span>
                            }
                            {{ blockTitle(block, $index) }}
                          </span>
                        </mat-panel-title>
                      </mat-expansion-panel-header>

                      <div class="w-full min-w-0 px-3 pb-3 pt-4 sm:px-4">
                        @if (block.kind === 'text') {
                          <div
                            class="min-w-0 break-words [overflow-wrap:anywhere] text-[1.0625rem] leading-7 text-slate-800
                              [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900
                              [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900
                              [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc
                              [&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_li]:my-1
                              [&_a]:text-teal-700 [&_a]:underline
                              [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm
                              [&_pre]:mb-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-50
                              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
                              [&>*:last-child]:mb-0"
                            [innerHTML]="blockContentHtml(block, $index)"
                          ></div>
                        } @else if (block.kind === 'tip') {
                          <aside class="flex min-w-0 gap-3 rounded-xl bg-amber-50 p-3 text-amber-900 sm:p-4">
                            <mat-icon class="shrink-0 text-amber-600" aria-hidden="true"
                              >lightbulb</mat-icon
                            >
                            <div
                              class="min-w-0 break-words [overflow-wrap:anywhere] text-[0.975rem] leading-7 text-amber-900
                                [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-bold
                                [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:font-bold
                                [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:ml-6 [&_ul]:list-disc
                                [&_ol]:mb-3 [&_ol]:ml-6 [&_ol]:list-decimal
                                [&_a]:text-teal-800 [&_a]:underline
                                [&>*:last-child]:mb-0"
                              [innerHTML]="block.html"
                            ></div>
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
                            <img
                              [src]="block.url"
                              [alt]="block.alt"
                              class="w-full rounded-xl border border-slate-200"
                              loading="lazy"
                            />
                            @if (block.caption) {
                              <figcaption class="mt-2 text-sm text-slate-500">
                                {{ block.caption }}
                              </figcaption>
                            }
                          </figure>
                        } @else if (block.kind === 'check') {
                          <section
                            class="rounded-xl border-2 border-teal-100 p-4 sm:p-5"
                            [attr.aria-labelledby]="'check-' + block.index"
                          >
                            <h2
                              [id]="'check-' + block.index"
                              class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                            >
                              <mat-icon class="text-[#007979]" aria-hidden="true">quiz</mat-icon>
                              {{ 'Quick check' | t }}
                            </h2>

                            <div class="mt-4 space-y-6">
                              @for (
                                question of block.questions;
                                track $index;
                                let questionIndex = $index
                              ) {
                                <div class="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                  <p class="font-medium text-slate-800">
                                    <span
                                      class="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500"
                                    >
                                      {{ 'Question {0}' | t: [questionIndex + 1] }}
                                    </span>
                                    {{ question.question }}
                                  </p>

                                  <div class="mt-3 flex flex-col gap-2">
                                    @for (
                                      option of question.options;
                                      track $index;
                                      let optionIndex = $index
                                    ) {
                                      <button
                                        type="button"
                                        class="rounded-xl border px-3 py-2.5 text-left transition"
                                        [ngClass]="
                                          optionClass(
                                            checkAnswerKey(block.index, questionIndex),
                                            optionIndex,
                                            question.answer
                                          )
                                        "
                                        [disabled]="
                                          isSolved(
                                            checkAnswerKey(block.index, questionIndex),
                                            question.answer
                                          )
                                        "
                                        [attr.aria-pressed]="
                                          selected()[checkAnswerKey(block.index, questionIndex)] ===
                                          optionIndex
                                        "
                                        (click)="
                                          choose(
                                            checkAnswerKey(block.index, questionIndex),
                                            optionIndex,
                                            question.answer
                                          )
                                        "
                                      >
                                        {{ option }}
                                      </button>
                                    }
                                  </div>

                                  <div class="mt-2 min-h-5 text-sm" aria-live="polite">
                                    @if (
                                      selected()[checkAnswerKey(block.index, questionIndex)] !==
                                      undefined
                                    ) {
                                      @if (
                                        selected()[checkAnswerKey(block.index, questionIndex)] ===
                                        question.answer
                                      ) {
                                        <p class="text-[#007979]">
                                          <strong>{{ 'Correct.' | t }}</strong>
                                          {{ question.explanation }}
                                        </p>
                                      } @else {
                                        <p class="text-rose-700">
                                          <strong>{{ 'Not quite.' | t }}</strong>
                                          {{ 'Have another look and try again.' | t }}
                                        </p>
                                      }
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          </section>
                        }
                      </div>
                    </mat-expansion-panel>
                  }
                </mat-accordion>
              </div>

              <div
                class="mx-3 mt-8 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:mx-4"
              >
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
                  class="inline-flex h-11 max-w-full items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                  [disabled]="!canContinue() || store.saving()"
                  (click)="complete()"
                >
                  {{ continueLabel() | t }}
                  <mat-icon aria-hidden="true">{{
                    store.nextLesson() ? 'arrow_forward' : 'flag'
                  }}</mat-icon>
                </button>
              </div>
              @if (!canContinue()) {
                <p class="mt-2 mx-2 text-right text-xs text-slate-500">
                  {{ 'Answer the quick check to continue.' | t }}
                </p>
              } @else {
                <p class="mt-2 mx-2 text-right text-xs text-slate-500">
                  {{ 'Your progress is saved when you continue.' | t }}
                </p>
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
  protected readonly selected = signal<Record<string, number>>({});
  /** Expanded lesson sections. The first section opens when a lesson loads. */
  protected readonly expandedBlocks = signal<Set<number>>(new Set([0]));
  /** Temporarily highlights the section that has just received focus. */
  protected readonly focusedBlock = signal<number | null>(null);
  private focusHighlightTimer: number | undefined;
  /** First answer per quick check: right or wrong. */
  private readonly firstTry = signal<Record<string, boolean>>({});

  protected readonly coursePath = computed(
    () => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId()}`,
  );

  protected readonly coursePercent = computed(() => this.store.courseProgress()?.percent ?? 0);

  protected readonly moduleTitle = computed(() => {
    const lesson = this.store.lesson();
    return (
      this.store
        .course()
        ?.modules.find((module) => module.lessons.some((item) => item.id === lesson?.id))?.title ??
      ''
    );
  });

  protected readonly blocks = computed<ViewBlock[]>(() => {
    return (this.store.lesson()?.blocks ?? []).map((block: LessonBlock, index): ViewBlock => {
      switch (block.type) {
        case 'text':
          return { kind: 'text', html: renderKnowledgeContent(block.text) };
        case 'tip':
          return { kind: 'tip', html: renderKnowledgeContent(block.text) };
        case 'video':
          return {
            kind: 'media',
            mediaKind: 'video',
            url: block.url,
            start: block.start ?? 0,
            label: '',
            caption: block.caption ?? '',
          };
        case 'audio':
          return {
            kind: 'media',
            mediaKind: 'audio',
            url: block.url,
            start: 0,
            label: '',
            caption: block.caption ?? '',
          };
        case 'document':
          return {
            kind: 'media',
            mediaKind: 'document',
            url: block.url,
            start: 0,
            label: block.title ?? '',
            caption: block.caption ?? '',
          };
        case 'image':
          return {
            kind: 'image',
            url: /^https:\/\//i.test(block.url) ? block.url : '',
            alt: block.alt,
            caption: block.caption ?? '',
          };
        case 'check':
          return {
            kind: 'check',
            index,
            questions:
              'questions' in block && Array.isArray(block.questions) && block.questions.length
                ? block.questions
                : [
                    {
                      question: 'question' in block ? (block.question ?? '') : '',
                      options: 'options' in block ? (block.options ?? []) : [],
                      answer: 'answer' in block ? (block.answer ?? -1) : -1,
                      explanation: 'explanation' in block ? (block.explanation ?? '') : '',
                    },
                  ],
          };
      }
    });
  });

  private readonly checks = computed(() =>
    this.blocks().filter(
      (block): block is Extract<ViewBlock, { kind: 'check' }> => block.kind === 'check',
    ),
  );

  private readonly lessonDone = computed(() => {
    const lesson = this.store.lesson();
    return !!lesson && this.store.completedIds().has(lesson.id);
  });

  /** Every quick check answered correctly (or the lesson was already done). */
  protected readonly canContinue = computed(
    () =>
      this.lessonDone() ||
      this.checks().every((check) =>
        check.questions.every(
          (question, questionIndex) =>
            this.selected()[this.checkAnswerKey(check.index, questionIndex)] === question.answer,
        ),
      ),
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
      this.expandedBlocks.set(new Set([0]));
      void this.load(courseId, lessonId);
    });
  }

  private async load(courseId: string, lessonId: string): Promise<void> {
    await this.store.openCourse(courseId);
    await this.store.openLesson(lessonId);
    window.scrollTo({ top: 0 });
  }

  /** Add an index and move focus to a newly opened section after its panel animation. */
  protected openBlock(index: number): void {
    this.expandedBlocks.update((current) => new Set(current).add(index));

    // The first section is opened automatically when a lesson loads. Only
    // user-opened sections need the guided focus/scroll transition.
    if (index === 0) {
      return;
    }

    // Angular Material emits (opened) after the expansion animation completes.
    // Two animation frames let the browser settle the final panel geometry
    // before measuring and performing one deliberate scroll.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const panel = document.getElementById(`lesson-block-${index}`);
        if (!panel || !this.expandedBlocks().has(index)) {
          return;
        }

        const heading = panel.querySelector<HTMLElement>('.mat-expansion-panel-header');
        if (!heading) {
          return;
        }

        // Focus without allowing the browser to perform a second, implicit scroll.
        heading.focus({ preventScroll: true });

        const stickyProgress = document.querySelector<HTMLElement>('.lesson-progress-sticky');
        const stickyBottom = stickyProgress?.getBoundingClientRect().bottom ?? 112;
        const targetTop = window.scrollY + panel.getBoundingClientRect().top - stickyBottom - 16;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: reduceMotion ? 'auto' : 'smooth',
        });

        this.focusedBlock.set(index);
        if (this.focusHighlightTimer !== undefined) {
          window.clearTimeout(this.focusHighlightTimer);
        }
        this.focusHighlightTimer = window.setTimeout(() => {
          this.focusedBlock.set(null);
          this.focusHighlightTimer = undefined;
        }, 1400);
      });
    });
  }

  protected closeBlock(index: number): void {
    this.expandedBlocks.update((current) => {
      const next = new Set(current);
      next.delete(index);
      return next;
    });
  }

  /** Prefer a heading authored in the lesson content for the collapsed title. */
  protected blockTitle(block: ViewBlock, index: number): string {
    if (block.kind === 'text' || block.kind === 'tip') {
      const heading = block.html.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
      if (heading) {
        const title = heading
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&#39;|&apos;/gi, "'")
          .replace(/&quot;/gi, '"')
          .replace(/\\s+/g, ' ')
          .trim();
        if (title) {
          return title;
        }
      }
      return block.kind === 'tip' ? 'Key takeaway' : `Reading section ${index + 1}`;
    }

    if (block.kind === 'media') {
      return (
        block.label ||
        block.caption ||
        (block.mediaKind === 'video' ? 'Video' : block.mediaKind === 'audio' ? 'Audio' : 'Document')
      );
    }

    if (block.kind === 'image') {
      return block.caption || 'Image';
    }

    return 'Quick check';
  }

  /**
   * The first heading is already represented by the expansion-panel header.
   * Remove it from the expanded text only when it matches that header title.
   */
  protected blockContentHtml(block: Extract<ViewBlock, { kind: 'text' }>, index: number): string {
    const match = block.html.match(/^\s*(<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>)/i);
    if (!match) {
      return block.html;
    }

    const headingText = match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();

    const headerText = this.blockTitle(block, index).replace(/\s+/g, ' ').trim();
    return headingText.toLocaleLowerCase() === headerText.toLocaleLowerCase()
      ? block.html.slice(match[0].length)
      : block.html;
  }

  protected checkAnswerKey(blockIndex: number, questionIndex: number): string {
    return `${blockIndex}:${questionIndex}`;
  }

  protected isSolved(key: string, answer: number): boolean {
    return this.selected()[key] === answer;
  }

  protected choose(key: string, option: number, answer: number): void {
    if (this.firstTry()[key] === undefined) {
      this.firstTry.update((current) => ({ ...current, [key]: option === answer }));
    }
    this.selected.update((current) => ({ ...current, [key]: option }));
  }

  protected optionClass(key: string, option: number, answer: number): string {
    const chosen = this.selected()[key];

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

    const questions = this.checks().flatMap((check) =>
      check.questions.map((question, questionIndex) => ({
        key: this.checkAnswerKey(check.index, questionIndex),
      })),
    );
    const score = questions.length
      ? (questions.filter(({ key }) => this.firstTry()[key] === true).length / questions.length) *
        100
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
      this.toast.error(
        this.i18n.t((error as Error).message || 'Your progress could not be saved. Try again.'),
      );
    }
  }
}
