import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { ProgressRingComponent } from '../components/progress-ring.component';
import { averageScore, COURSE_COVERS, courseContextFromRoute, formatMinutes, hasCertificate } from '../course.model';
import { CourseStore } from '../course.store';

/**
 * The end of a course: what the learner covered (modules, time, quick
 * check score, outcomes and skills) and the way forward: Take the test
 * when the course has a final exam, the certificate once it is passed.
 */
@Component({
  selector: 'app-course-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, ProgressRingComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: store.course()?.title ?? 'Course', link: coursePath(), translate: !store.course() },
          { label: 'Summary' }
        ]"
      />

      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        @if (store.courseLoading() || !store.progressLoaded()) {
          <div class="h-96 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (store.course(); as course) {
          <!-- Headline -->
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div class="flex flex-col items-center gap-3 px-6 py-8 text-center text-white sm:flex-row sm:text-left" [style.background]="cover()">
              <app-progress-ring [percent]="percent()" [size]="96" color="#ffffff" trackColor="rgba(255,255,255,0.25)" />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/80">{{ 'Course summary' | t }}</p>
                <h1 class="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{{ course.title }}</h1>
                <p class="mt-1 text-white/90">
                  {{ (lessonsDone() ? 'You finished every lesson. Great work!' : 'Here is where you are in the course.') | t }}
                </p>
              </div>
            </div>

            <!-- Numbers -->
            <div class="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
              <div class="p-4 text-center">
                <p class="text-2xl font-bold tabular-nums text-slate-900">{{ doneCount() }}/{{ course.lessonCount }}</p>
                <p class="text-xs text-slate-500">{{ 'Lessons done' | t }}</p>
              </div>
              <div class="p-4 text-center">
                <p class="text-2xl font-bold tabular-nums text-slate-900">{{ course.modules.length }}</p>
                <p class="text-xs text-slate-500">{{ (course.modules.length === 1 ? 'Module' : 'Modules') | t }}</p>
              </div>
              <div class="p-4 text-center">
                <p class="text-2xl font-bold tabular-nums text-slate-900">{{ duration() }}</p>
                <p class="text-xs text-slate-500">{{ 'Of learning' | t }}</p>
              </div>
              <div class="p-4 text-center">
                <p class="text-2xl font-bold tabular-nums text-slate-900">{{ checkScore() === null ? '—' : checkScore() + '%' }}</p>
                <p class="text-xs text-slate-500">{{ 'Quick checks, first try' | t }}</p>
              </div>
            </div>
          </section>

          <!-- Next step -->
          <section class="mt-4 flex flex-col gap-4 rounded-2xl border-2 border-teal-100 bg-white p-5 sm:flex-row sm:items-center">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#007979]" aria-hidden="true">
              <mat-icon>{{ certificate() ? 'workspace_premium' : course.finalExam ? 'assignment' : 'flag' }}</mat-icon>
            </span>
            <div class="min-w-0 flex-1">
              @if (certificate()) {
                <h2 class="font-semibold text-slate-900">{{ 'You passed the final exam' | t }}</h2>
                <p class="text-sm text-slate-600">{{ 'Your certificate is ready to view, print or add to LinkedIn.' | t }}</p>
              } @else if (course.finalExam; as exam) {
                <h2 class="font-semibold text-slate-900">{{ 'Next: the final test' | t }}</h2>
                <p class="text-sm text-slate-600">
                  {{ '{0} questions · pass mark {1}%' | t: [exam.questionCount, exam.passMark] }}
                  @if (exam.timeLimitMinutes) {
                    · {{ '{0} min' | t: [exam.timeLimitMinutes] }}
                  }
                  · {{ 'Passing it earns your certificate.' | t }}
                </p>
                @if (!lessonsDone()) {
                  <p class="mt-1 text-sm text-amber-800">{{ 'Finish the remaining lessons to unlock the test.' | t }}</p>
                }
              } @else {
                <h2 class="font-semibold text-slate-900">{{ 'Course complete' | t }}</h2>
                <p class="text-sm text-slate-600">{{ 'This course has no final test. Keep going with another course.' | t }}</p>
              }
            </div>

            @if (certificate()) {
              <a
                [routerLink]="[coursePath(), 'certificate']"
                class="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]"
              >
                <mat-icon aria-hidden="true">workspace_premium</mat-icon>{{ 'View certificate' | t }}
              </a>
            } @else if (course.finalExam) {
              <a
                [routerLink]="lessonsDone() ? [coursePath(), 'exam'] : [coursePath()]"
                class="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg px-5 font-semibold text-white"
                [class]="lessonsDone() ? 'bg-[#007979] hover:bg-[#006666]' : 'bg-slate-400'"
              >
                {{ (lessonsDone() ? 'Take test' : 'Back to the lessons') | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
              </a>
            } @else {
              <a
                [routerLink]="context.basePath + '/catalog'"
                class="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]"
              >
                {{ 'Find your next course' | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
              </a>
            }
          </section>

          <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- What you learned -->
            @if (course.outcomes.length) {
              <section class="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'What you learned' | t }}</h2>
                <ul class="mt-3 flex flex-col gap-2">
                  @for (outcome of course.outcomes; track $index) {
                    <li class="flex gap-2 text-slate-700">
                      <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">check_circle</mat-icon>
                      <span>{{ outcome }}</span>
                    </li>
                  }
                </ul>
                @if (course.skills.length) {
                  <div class="mt-4 flex flex-wrap gap-1">
                    @for (skill of course.skills; track skill) {
                      <span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-[#007979]">{{ skill }}</span>
                    }
                  </div>
                }
              </section>
            }

            <!-- Modules recap -->
            <section class="rounded-2xl border border-slate-200 bg-white p-5" [ngClass]="{ 'md:col-span-2': !course.outcomes.length }">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'What you covered' | t }}</h2>
              <ul class="mt-3 flex flex-col gap-3">
                @for (module of course.modules; track module.id; let moduleIndex = $index) {
                  <li>
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-semibold text-slate-900">{{ moduleIndex + 1 }}. {{ module.title }}</span>
                      <span class="shrink-0 text-xs tabular-nums text-slate-500">{{ moduleDone(module.lessons) }}/{{ module.lessons.length }}</span>
                    </div>
                    <ul class="mt-1 flex flex-col gap-0.5 pl-4">
                      @for (lesson of module.lessons; track lesson.id) {
                        <li class="flex items-center gap-2 text-sm">
                          <mat-icon
                            class="!h-4 !w-4 shrink-0 !text-base"
                            [class]="store.completedIds().has(lesson.id) ? 'text-[#007979]' : 'text-slate-300'"
                            aria-hidden="true"
                          >
                            {{ store.completedIds().has(lesson.id) ? 'check_circle' : 'radio_button_unchecked' }}
                          </mat-icon>
                          <a [routerLink]="[coursePath(), 'lessons', lesson.id]" class="truncate text-slate-700 hover:text-[#007979] hover:underline">
                            {{ lesson.title }}
                          </a>
                        </li>
                      }
                    </ul>
                  </li>
                }
              </ul>
            </section>
          </div>
        } @else {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center" role="alert">
            <p class="text-slate-700">{{ (store.courseError() ?? 'This course is not available.') | t }}</p>
          </div>
        }
      </div>
    </main>
  `,
})
export class CourseSummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly courseId = this.route.snapshot.paramMap.get('courseId') ?? '';

  protected readonly coursePath = computed(() => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId}`);
  protected readonly progress = computed(() => this.store.courseProgress());
  protected readonly doneCount = computed(() => this.store.completedIds().size);
  protected readonly lessonsDone = computed(() => this.progress()?.status === 'completed');
  protected readonly percent = computed(() => this.progress()?.percent ?? 0);
  protected readonly checkScore = computed(() => averageScore(this.progress()?.checkScores ?? {}));
  protected readonly certificate = computed(() => hasCertificate(this.progress(), this.store.courseExam()));
  protected readonly cover = computed(() => COURSE_COVERS[this.store.course()?.cover ?? 'navy']);

  /** Minutes of the lessons completed. */
  protected readonly duration = computed(() => {
    const done = this.store.completedIds();
    const minutes = this.store.outline().filter((lesson) => done.has(lesson.id)).reduce((total: number, lesson: { minutes: number }) => total + lesson.minutes, 0);
    return formatMinutes(minutes);
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly tabTitle = effect(() => {
    const title = this.store.course()?.title;
    if (title) {
      this.pageTitle.setDocumentTitle(`${this.i18n.t('Course summary')} · ${title}`);
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
