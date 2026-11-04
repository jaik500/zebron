import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { ProgressRingComponent } from '../components/progress-ring.component';
import { COURSE_COVERS, COURSE_LEVEL_LABELS, courseContextFromRoute, formatMinutes, hasCertificate, isCourseComplete } from '../course.model';
import { CourseStore } from '../course.store';

/** A course: what you will learn, your progress, and the modules and lessons. */
@Component({
  selector: 'app-course-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, ProgressRingComponent],
  styles: [
    `
      :host ::ng-deep .course-prose p { margin: 0 0 0.75rem; }
      :host ::ng-deep .course-prose ul { list-style: disc; margin: 0 0 0.75rem 1.25rem; }
      :host ::ng-deep .course-prose ol { list-style: decimal; margin: 0 0 0.75rem 1.25rem; }
      :host ::ng-deep .course-prose a { color: #007979; text-decoration: underline; }
    `,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="context.basePath + '/catalog'"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: 'Catalog', link: context.basePath + '/catalog' },
          { label: store.course()?.title ?? 'Course', translate: !store.course() }
        ]"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (store.courseLoading()) {
          <div class="grid gap-5 lg:grid-cols-[1fr_320px]" aria-hidden="true">
            <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
          </div>
        } @else if (store.courseError()) {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center" role="alert">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">menu_book</mat-icon>
            <p class="mt-2 text-slate-700">{{ store.courseError()! | t }}</p>
            <a [routerLink]="context.basePath + '/catalog'" class="mt-3 inline-block font-semibold text-[#007979] hover:underline">
              {{ 'Browse courses' | t }}
            </a>
          </div>
        } @else if (store.course(); as course) {
          <div class="grid gap-5 lg:grid-cols-[1fr_320px]">
            <!-- About the course -->
            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div class="h-20" [style.background]="cover()" aria-hidden="true"></div>
              <div class="p-5 sm:p-6">
                <p class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">
                  {{ course.topic }}{{ course.topic && course.providerName ? ' · ' : '' }}{{ course.providerName }}
                </p>
                <h1 class="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{{ course.title }}</h1>
                @if (course.summary) {
                  <p class="mt-2 text-base text-slate-600">{{ course.summary }}</p>
                }
                <p class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span>{{ levelLabel() | t }}</span>
                  <span>· {{ duration() }}</span>
                  <span>· {{ course.lessonCount }} {{ (course.lessonCount === 1 ? 'lesson' : 'lessons') | t }}</span>
                  @if (checkCount()) {
                    <span>· {{ (checkCount() === 1 ? '{0} quick check' : '{0} quick checks') | t: [checkCount()] }}</span>
                  }
                  @if (course.finalExam) {
                    <span>· {{ 'Final exam and certificate' | t }}</span>
                  }
                </p>

                @if (course.outcomes.length) {
                  <h2 class="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'What you will learn' | t }}</h2>
                  <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                    @for (outcome of course.outcomes; track $index) {
                      <li class="flex gap-2 text-slate-700">
                        <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">check_circle</mat-icon>
                        <span>{{ outcome }}</span>
                      </li>
                    }
                  </ul>
                }

                @if (course.description) {
                  <div class="course-prose mt-5 text-slate-700" [innerHTML]="descriptionHtml()"></div>
                }
              </div>
            </section>

            <!-- Your progress -->
            <aside class="flex flex-col gap-4 self-start rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
              <div class="flex items-center gap-4">
                <app-progress-ring [percent]="progress()?.percent ?? 0" [size]="72" />
                <div>
                  <p class="font-semibold text-slate-900">{{ statusLabel() | t }}</p>
                  <p class="text-sm text-slate-500">{{ '{0} of {1} lessons done' | t: [doneCount(), course.lessonCount] }}</p>
                </div>
              </div>

              @if (!signedIn()) {
                <a
                  routerLink="/login"
                  [queryParams]="{ returnUrl: coursePath() }"
                  class="inline-flex h-11 items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 font-semibold text-white hover:bg-[#006666]"
                >
                  <mat-icon aria-hidden="true">login</mat-icon>{{ 'Sign in to start' | t }}
                </a>
              } @else if (examNext()) {
                <a
                  [routerLink]="[coursePath(), 'exam']"
                  class="inline-flex h-11 items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 font-semibold text-white hover:bg-[#006666]"
                >
                  <mat-icon aria-hidden="true">assignment</mat-icon>{{ 'Take the final exam' | t }}
                </a>
              } @else if (store.resumeLesson(); as lesson) {
                <a
                  [routerLink]="[coursePath(), 'lessons', lesson.id]"
                  class="inline-flex h-11 items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 font-semibold text-white hover:bg-[#006666]"
                >
                  <mat-icon aria-hidden="true">{{ completed() ? 'replay' : 'play_arrow' }}</mat-icon>
                  {{ (completed() ? 'Review the course' : doneCount() ? 'Resume' : 'Start course') | t }}
                </a>
              }

              @if (lessonsDone()) {
                <a
                  [routerLink]="[coursePath(), 'summary']"
                  class="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">summarize</mat-icon>
                  {{ 'Course summary' | t }}
                </a>
              }

              @if (certificate()) {
                <a
                  [routerLink]="[coursePath(), 'certificate']"
                  class="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">workspace_premium</mat-icon>
                  {{ 'View certificate' | t }}
                </a>
              }

              @if (course.skills.length) {
                <div>
                  <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Skills' | t }}</p>
                  <div class="flex flex-wrap gap-1">
                    @for (skill of course.skills; track skill) {
                      <span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-[#007979]">{{ skill }}</span>
                    }
                  </div>
                </div>
              }
            </aside>
          </div>

          <!-- Modules and lessons -->
          <h2 class="mb-3 mt-8 text-lg font-semibold text-slate-900">{{ 'Course content' | t }}</h2>
          <div class="flex flex-col gap-3">
            @for (module of course.modules; track module.id; let moduleIndex = $index) {
              <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <header class="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 class="font-semibold text-slate-900">
                    <span class="text-slate-500">{{ 'Module {0}' | t: [moduleIndex + 1] }} ·</span> {{ module.title }}
                  </h3>
                  <span class="shrink-0 text-xs text-slate-500">{{ moduleDone(module.lessons) }}/{{ module.lessons.length }}</span>
                </header>
                @for (lesson of module.lessons; track lesson.id) {
                  <a
                    [routerLink]="signedIn() ? [coursePath(), 'lessons', lesson.id] : null"
                    class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                    [ngClass]="signedIn() ? 'hover:bg-teal-50' : 'cursor-default'"
                  >
                    <span
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
                      [ngClass]="
                        store.completedIds().has(lesson.id)
                          ? 'border-[#007979] bg-[#007979] text-white'
                          : lesson.id === store.resumeLesson()?.id && signedIn()
                            ? 'border-[#007979] text-[#007979]'
                            : 'border-slate-200 text-slate-300'
                      "
                      aria-hidden="true"
                    >
                      @if (store.completedIds().has(lesson.id)) {
                        <mat-icon class="!flex !h-4 !w-4 items-center justify-center !text-base !leading-none">check</mat-icon>
                      } @else if (lesson.id === store.resumeLesson()?.id && signedIn()) {
                        <mat-icon class="!flex !h-4 !w-4 translate-x-[0.5px] items-center justify-center !text-base !leading-none">play_arrow</mat-icon>
                      }
                    </span>
                    <span class="min-w-0 flex-1 text-slate-800">
                      {{ lesson.title }}
                      @if (store.completedIds().has(lesson.id)) {
                        <span class="sr-only">({{ 'done' | t }})</span>
                      }
                    </span>
                    <span class="shrink-0 text-xs text-slate-500">
                      {{ lesson.minutes }} min
                      @if (lesson.hasCheck) {
                        · {{ 'quick check' | t }}
                      }
                    </span>
                  </a>
                }
              </section>
            }

            <!-- Final exam -->
            @if (course.finalExam; as exam) {
              <section class="overflow-hidden rounded-2xl border-2" [ngClass]="examPassed() ? 'border-emerald-200 bg-emerald-50/40' : 'border-teal-100 bg-white'">
                <div class="flex flex-wrap items-center gap-4 p-4">
                  <span
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    [ngClass]="examPassed() ? 'bg-emerald-100 text-emerald-700' : lessonsDone() ? 'bg-teal-50 text-[#007979]' : 'bg-slate-100 text-slate-400'"
                    aria-hidden="true"
                  >
                    <mat-icon>{{ examPassed() ? 'verified' : lessonsDone() ? 'assignment' : 'lock' }}</mat-icon>
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-semibold text-slate-900">{{ 'Final exam' | t }}</h3>
                    <p class="text-sm text-slate-600">
                      {{ '{0} questions · pass mark {1}%' | t: [exam.questionCount, exam.passMark] }}
                      @if (exam.timeLimitMinutes) {
                        · {{ '{0} min' | t: [exam.timeLimitMinutes] }}
                      }
                      @if (exam.maxAttempts) {
                        · {{ (exam.maxAttempts === 1 ? '1 attempt' : '{0} attempts') | t: [exam.maxAttempts] }}
                      }
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      @if (examPassed()) {
                        {{ 'Passed with {0}%. Your certificate is ready.' | t: [store.courseExam()?.passScore ?? store.courseExam()?.bestScore ?? 0] }}
                      } @else if (!lessonsDone()) {
                        {{ 'Unlocks when every lesson is done. Passing it earns the certificate.' | t }}
                      } @else if (store.courseExam()?.attempts) {
                        {{ 'Best score so far: {0}%' | t: [store.courseExam()?.bestScore ?? 0] }}
                      } @else {
                        {{ 'Ready when you are. Passing it earns the certificate.' | t }}
                      }
                    </p>
                  </div>
                  @if (signedIn() && lessonsDone() && !examPassed()) {
                    <a
                      [routerLink]="[coursePath(), 'exam']"
                      class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
                    >
                      {{ 'Start' | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
                    </a>
                  } @else if (examPassed()) {
                    <a
                      [routerLink]="[coursePath(), 'certificate']"
                      class="inline-flex h-10 items-center gap-1 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                    >
                      <mat-icon aria-hidden="true">workspace_premium</mat-icon>{{ 'Certificate' | t }}
                    </a>
                  }
                </div>
              </section>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class CoursePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly courseId = this.route.snapshot.paramMap.get('courseId') ?? '';

  protected readonly signedIn = computed(() => this.auth.firebaseUser() !== null);
  protected readonly coursePath = computed(() => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId}`);
  protected readonly progress = computed(() => this.store.courseProgress());
  protected readonly doneCount = computed(() => this.store.completedIds().size);
  /** Every lesson done. */
  protected readonly lessonsDone = computed(() => this.progress()?.status === 'completed');
  protected readonly examPassed = computed(() => this.store.courseExam()?.passed === true);
  protected readonly examNext = computed(() => !!this.store.course()?.finalExam && this.lessonsDone() && !this.examPassed());
  /** Lessons done and, when there is one, the final exam passed. */
  protected readonly completed = computed(() => isCourseComplete(this.progress(), this.store.courseExam()));
  protected readonly certificate = computed(() => hasCertificate(this.progress(), this.store.courseExam()));
  protected readonly cover = computed(() => COURSE_COVERS[this.store.course()?.cover ?? 'teal']);
  protected readonly levelLabel = computed(() => COURSE_LEVEL_LABELS[this.store.course()?.level ?? 'all']);
  protected readonly duration = computed(() => formatMinutes(this.store.course()?.estimatedMinutes ?? 0));
  protected readonly checkCount = computed(() => this.store.outline().filter((lesson) => lesson.hasCheck).length);
  protected readonly descriptionHtml = computed(() => renderKnowledgeContent(this.store.course()?.description ?? ''));

  protected readonly statusLabel = computed(() =>
    this.completed() ? 'Completed' : this.examNext() ? 'Final exam next' : this.doneCount() ? 'In progress' : 'Not started',
  );

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly tabTitle = effect(() => {
    const title = this.store.course()?.title;
    if (title) {
      this.pageTitle.setDocumentTitle(title);
    }
  });

  constructor() {
    this.store.setContext(this.context);
    void this.store.openCourse(this.courseId);

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });
  }

  protected moduleDone(lessons: { id: string }[]): number {
    const done = this.store.completedIds();
    return lessons.filter((lesson) => done.has(lesson.id)).length;
  }
}
