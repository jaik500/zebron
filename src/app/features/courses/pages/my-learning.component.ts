import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseCardComponent } from '../components/course-card.component';
import { CourseHeaderComponent } from '../components/course-header.component';
import { ProgressRingComponent } from '../components/progress-ring.component';
import {
  allLessons,
  COURSE_COVERS,
  courseContextFromRoute,
  courseLink,
  CourseCover,
  CourseProgress,
  isCourseComplete,
  progressId,
} from '../course.model';
import { CourseAssignment, CourseAssignmentService, isOverdue } from '../course-assignment.service';
import { CourseAccessService } from '../course-access.service';
import { CourseStore } from '../course.store';

/** Minutes a week the streak card counts toward. */
const WEEKLY_GOAL_MINUTES = 60;

/** My learning: continue where you left off, weekly streak, courses in progress and suggestions. */
@Component({
  selector: 'app-my-learning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, CourseCardComponent, ProgressRingComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning' }, { label: 'My learning' }]"
        [activeTab]="'learning'"
        [canManage]="canManage()"
        [showSearch]="true"
        [query]="store.query()"
        (queryChange)="search($event)"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (!signedIn()) {
          <section class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#007979]">
              <mat-icon aria-hidden="true">school</mat-icon>
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-semibold text-slate-900">{{ 'Learn new skills at your own pace' | t }}</h2>
              <p class="text-sm text-slate-600">{{ 'Sign in to save your progress, keep a streak and earn certificates.' | t }}</p>
            </div>
            <a
              routerLink="/login"
              [queryParams]="{ returnUrl: context.basePath }"
              class="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">login</mat-icon>{{ 'Sign in' | t }}
            </a>
          </section>
        } @else if (store.continueRecord(); as record) {
          <!-- Continue learning -->
          <section class="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[1.1fr_1fr]">
            <div class="relative min-h-36" [style.background]="coverOf(record)">
              <div class="absolute bottom-4 left-5">
                <app-progress-ring [percent]="record.percent" [size]="68" color="#ffffff" trackColor="rgba(255,255,255,0.25)" />
              </div>
            </div>
            <div class="flex flex-col justify-center gap-2 p-5">
              <span class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ 'Continue learning' | t }}</span>
              <h2 class="text-xl font-semibold leading-snug text-slate-900">{{ record.courseTitle }}</h2>
              @if (nextLessonTitle(); as title) {
                <p class="flex items-center gap-1 text-sm text-slate-600">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] text-[#007979]" aria-hidden="true">play_circle</mat-icon>
                  {{ 'Next: {0}' | t: [title] }}
                </p>
              }
              <p class="text-xs text-slate-500">
                {{ '{0} of {1} lessons done' | t: [record.completedLessonIds.length, record.lessonCount] }}
              </p>
              <div class="mt-1 flex flex-wrap gap-2">
                <a
                  [routerLink]="resumeLink()"
                  class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
                >
                  <mat-icon aria-hidden="true">play_arrow</mat-icon>{{ 'Resume' | t }}
                </a>
                <a
                  [routerLink]="linkFor(record)"
                  class="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {{ 'Course outline' | t }}
                </a>
              </div>
            </div>
          </section>
        } @else if (store.progressLoaded()) {
          <section class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">rocket_launch</mat-icon>
            <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'Start your first course' | t }}</h2>
            <p class="mx-auto mt-1 max-w-md text-sm text-slate-600">
              {{ 'Short lessons, quick checks and a certificate at the end. Pick a course below to begin.' | t }}
            </p>
          </section>
        }

        @if (signedIn() && assigned().length) {
          <!-- Assigned by the organization -->
          <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="assigned-title">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="assigned-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <mat-icon class="text-[#007979]" aria-hidden="true">assignment_ind</mat-icon>
                {{ 'Assigned to you' | t }}
              </h2>
              @if (assignedOpenCount()) {
                <span class="text-sm text-slate-500">{{ '{0} to do' | t: [assignedOpenCount()] }}</span>
              } @else {
                <span class="text-sm font-semibold text-emerald-700">{{ 'All done. Well done!' | t }}</span>
              }
            </div>
            <ul class="mt-3 flex flex-col gap-2">
              @for (item of assigned(); track item.assignment.id) {
                <li>
                  <a
                    [routerLink]="item.link"
                    class="flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-sm"
                    [class]="item.overdue ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'"
                  >
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white" [style.background]="coverName(item.assignment.cover)" aria-hidden="true">
                      <mat-icon>{{ item.done ? 'task_alt' : item.assignment.lessonId ? 'play_lesson' : 'menu_book' }}</mat-icon>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-semibold text-slate-900">{{ item.assignment.lessonTitle || item.assignment.courseTitle }}</span>
                      <span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        @if (item.assignment.lessonTitle) {
                          <span class="truncate">{{ 'Lesson in {0}' | t: [item.assignment.courseTitle] }}</span>
                        }
                        @if (item.assignment.required) {
                          <span class="rounded-full bg-[#007979]/10 px-2 py-0.5 font-semibold text-[#007979]">{{ 'Required' | t }}</span>
                        }
                        @if (item.done) {
                          <span class="font-semibold text-emerald-700">{{ 'Done' | t }}</span>
                        } @else if (item.overdue) {
                          <span class="font-semibold text-rose-700">{{ 'Overdue: was due {0}' | t: [item.due] }}</span>
                        } @else if (item.due) {
                          <span>{{ 'Due {0}' | t: [item.due] }}</span>
                        }
                        @if (!item.done && item.percent > 0 && !item.assignment.lessonId) {
                          <span>{{ '{percent}% complete' | t: { percent: item.percent } }}</span>
                        }
                      </span>
                      @if (item.assignment.note && !item.done) {
                        <span class="mt-1 block truncate text-xs italic text-slate-500">“{{ item.assignment.note }}” · {{ item.assignment.assignedByName }}</span>
                      }
                    </span>
                    <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">chevron_right</mat-icon>
                  </a>
                </li>
              }
            </ul>
          </section>
        }

        @if (signedIn()) {
          <!-- Stats: four on one line, icons hidden on phones -->
          <section class="mt-4 grid grid-cols-4 gap-2 sm:gap-3" [attr.aria-label]="'Your learning this week' | t">
            <div class="rounded-2xl border border-slate-200 bg-white p-2 text-center sm:p-4">
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">local_fire_department</mat-icon>
              <p class="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.streakWeeks() }}</p>
              <p class="text-[10px] text-slate-500 sm:text-xs">{{ 'Week streak' | t }}</p>
              <div class="mt-1 flex justify-center gap-0.5 sm:gap-1" aria-hidden="true">
                @for (active of store.weekDays(); track $index) {
                  <span class="h-1.5 w-1.5 rounded-sm sm:h-2.5 sm:w-2.5" [class]="active ? 'bg-[#007979]' : 'bg-slate-200'"></span>
                }
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-2 text-center sm:p-4">
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">schedule</mat-icon>
              <p class="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.weekMinutes() }}</p>
              <p class="text-[10px] text-slate-500 sm:text-xs">{{ 'of {0} min this week' | t: [weeklyGoal] }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-2 text-center sm:p-4">
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">task_alt</mat-icon>
              <p class="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.completed().length }}</p>
              <p class="text-[10px] text-slate-500 sm:text-xs">{{ 'Completed' | t }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-2 text-center sm:p-4">
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">military_tech</mat-icon>
              <p class="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.skillsEarned() }}</p>
              <p class="text-[10px] text-slate-500 sm:text-xs">{{ 'Skills earned' | t }}</p>
            </div>
          </section>

          @if (otherInProgress().length) {
            <div class="mb-3 mt-8 flex items-baseline justify-between gap-3">
              <h2 class="text-lg font-semibold text-slate-900">{{ 'In progress' | t }}</h2>
              <span class="text-sm text-slate-500">{{ 'Pick up where you left off' | t }}</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (record of otherInProgress(); track record.id) {
                <a
                  [routerLink]="linkFor(record)"
                  class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:shadow-md"
                >
                  <span class="h-14 w-14 shrink-0 rounded-xl" [style.background]="coverOf(record)" aria-hidden="true"></span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold text-slate-900">{{ record.courseTitle }}</span>
                    <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <span class="block h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f]" [style.width.%]="record.percent"></span>
                    </span>
                    <span class="mt-1 block text-xs text-slate-500">{{ '{percent}% complete' | t: { percent: record.percent } }}</span>
                  </span>
                </a>
              }
            </div>
          }
        }

        <div class="mb-3 mt-8 flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ 'Recommended for you' | t }}</h2>
          <a [routerLink]="context.basePath + '/catalog'" class="text-sm font-semibold text-[#007979] hover:underline">{{ 'See all courses' | t }}</a>
        </div>

        @if (store.catalogLoading() && !store.catalog().length) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (store.catalogError()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ store.catalogError()! | t }}</p>
        } @else if (store.recommended().length) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (course of store.recommended(); track course.id + (course.organizationId ?? '')) {
              <app-course-card [course]="course" [link]="context.basePath + '/' + course.id" />
            }
          </div>
        } @else if (store.catalogLoaded()) {
          <p class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {{ store.catalog().length ? ('You have started every course. Well done!' | t) : ('No courses are published yet. Check back soon.' | t) }}
          </p>
        }
      </div>
    </main>
  `,
})
export class MyLearningComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly access = inject(CourseAccessService);
  protected readonly canManage = computed(() => this.access.canManage(this.context));
  protected readonly weeklyGoal = WEEKLY_GOAL_MINUTES;

  protected readonly signedIn = computed(() => this.auth.firebaseUser() !== null);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  /** The catalog course behind the Continue card, when it is in this catalog. */
  private readonly continueCourse = computed(() => {
    const record = this.store.continueRecord();
    return record
      ? this.store.catalog().find((course) => progressId(course) === record.id) ?? null
      : null;
  });

  private readonly nextLesson = computed(() => {
    const record = this.store.continueRecord();
    const done = new Set(record?.completedLessonIds ?? []);
    return allLessons(this.continueCourse()).find((lesson) => !done.has(lesson.id)) ?? null;
  });

  /** Lessons done, final exam still to pass. */
  private readonly examNext = computed(() => {
    const record = this.store.continueRecord();
    return !!record && record.status === 'completed' && record.finalExam;
  });

  protected readonly nextLessonTitle = computed(() =>
    this.examNext() ? this.i18n.t('Final exam') : this.nextLesson()?.title ?? null,
  );

  protected readonly resumeLink = computed(() => {
    const record = this.store.continueRecord();
    if (!record) {
      return this.context.basePath;
    }

    if (this.examNext()) {
      return `${courseLink(record, this.context)}/summary`;
    }

    const lesson = this.nextLesson();
    return lesson ? `${courseLink(record, this.context)}/lessons/${lesson.id}` : courseLink(record, this.context);
  });

  protected readonly otherInProgress = computed(() => this.store.inProgress().slice(1));

  // ---------- Assigned by the organization ----------
  private readonly assignmentService = inject(CourseAssignmentService);
  private readonly assignments = signal<CourseAssignment[]>([]);

  /** Not done first, soonest due first; done ones last. */
  protected readonly assigned = computed(() => {
    const locale = this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US';
    const progress = this.store.progressById();
    const exams = this.store.exams();
    const now = Date.now();

    return this.assignments()
      .map((assignment) => {
        const id = `${assignment.organizationId}__${assignment.courseId}`;
        const record = progress.get(id) ?? null;
        const done = assignment.lessonId
          ? !!record?.completedLessonIds.includes(assignment.lessonId)
          : isCourseComplete(record, exams[id]);
        const base = `/partner/org/${encodeURIComponent(assignment.organizationId)}/courses/${encodeURIComponent(assignment.courseId)}`;

        return {
          assignment,
          done,
          percent: record?.percent ?? 0,
          overdue: isOverdue(assignment.dueAt, done, now),
          due: assignment.dueAt ? assignment.dueAt.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : '',
          link: assignment.lessonId ? `${base}/lessons/${encodeURIComponent(assignment.lessonId)}` : base,
        };
      })
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          (a.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
          a.assignment.courseTitle.localeCompare(b.assignment.courseTitle),
      );
  });

  protected readonly assignedOpenCount = computed(() => this.assigned().filter((item) => !item.done).length);

  constructor() {
    this.store.setContext(this.context);
    void this.store.loadCatalog();

    // Progress belongs to the signed-in learner: reload when that changes.
    effect(() => {
      const user = this.auth.firebaseUser();
      untracked(() => {
        void this.store.loadProgress();
        void this.loadAssignments(user?.uid ?? null);
      });
    });
  }

  /** Courses or lessons the organization asked this learner to take. */
  private async loadAssignments(userId: string | null): Promise<void> {
    const organizationId = this.context.organizationId;
    if (!organizationId || !userId) {
      this.assignments.set([]);
      return;
    }

    try {
      this.assignments.set(await this.assignmentService.listMine(organizationId, userId));
    } catch {
      // Optional: My learning still works without them.
      this.assignments.set([]);
    }
  }

  protected coverName(cover: string): string {
    return COURSE_COVERS[cover as CourseCover] ?? COURSE_COVERS.teal;
  }

  protected linkFor(record: CourseProgress): string {
    return courseLink(record, this.context);
  }

  protected coverOf(record: CourseProgress): string {
    return COURSE_COVERS[record.cover] ?? COURSE_COVERS.teal;
  }

  protected search(query: string): void {
    this.store.setQuery(query);
    void this.router.navigate([this.context.basePath, 'catalog']);
  }
}
