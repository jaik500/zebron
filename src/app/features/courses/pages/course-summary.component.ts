import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
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
import {
  averageScore,
  Course,
  COURSE_COVERS,
  COURSE_LEVEL_LABELS,
  courseContextFromRoute,
  formatMinutes,
  hasCertificate,
  isCourseComplete,
  progressId,
} from '../course.model';
import { CourseStore } from '../course.store';
import { BootcampMatch, CourseLike, CourseState, matchBootcamps, nextInProgram, similarCourses } from '../next-steps';
import { BootcampService } from '../../bootcamps/bootcamp.service';
import { formatLabel, scheduleLabel } from '../../bootcamps/bootcamp.model';
import { ResourceService } from '../../../core/services/resource.service';
import { Resource } from '../../../core/models/resource.model';
import { LoggerService } from '../../../core/services/logger.service';

/** A bootcamp program to suggest, with its provider. */
interface BootcampSuggestion {
  match: BootcampMatch;
  provider: Resource;
}

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

      <div class="mx-auto px-4 py-6 sm:px-6" [class.max-w-4xl]="!showAside()" [class.max-w-6xl]="showAside()">
        @if (store.courseLoading() || !store.progressLoaded()) {
          <div class="h-96 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (store.course(); as course) {
          <div [class]="showAside() ? 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start' : ''">
          <div class="min-w-0">
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

          <!-- Next in the program (once the course is finished) -->
          @if (programStep(); as step) {
            <section class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="next-in-program-title">
              @if (step.next; as next) {
                <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span class="h-16 w-16 shrink-0 rounded-xl" [style.background]="coverOf(next)" aria-hidden="true"></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-wide text-[#007979]">{{ 'Next in {0}' | t: [step.program] }}</p>
                    <h2 id="next-in-program-title" class="mt-1 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ next.title }}</h2>
                    <p class="mt-0.5 text-sm text-slate-600">
                      {{ 'Course {0} of {1}' | t: [step.position, step.total] }} · {{ levelLabel(next.level) | t }}
                      @if (stateOf(next) === 'in_progress') {
                        · <span class="font-semibold text-[#007979]">{{ 'In progress' | t }}</span>
                      }
                    </p>
                  </div>
                  <a
                    [routerLink]="courseLinkOf(next)"
                    class="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]"
                  >
                    {{ (stateOf(next) === 'in_progress' ? 'Continue next course' : 'Start next course') | t }}
                    <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                  </a>
                </div>
                <div class="h-1.5 bg-slate-100" role="progressbar" [attr.aria-label]="'{0} of {1} courses done' | t: [step.completed, step.total]" [attr.aria-valuenow]="step.completed" aria-valuemin="0" [attr.aria-valuemax]="step.total">
                  <div class="h-full bg-gradient-to-r from-[#007979] to-[#2a835f]" [style.width.%]="(step.completed / step.total) * 100"></div>
                </div>
              } @else {
                <div class="flex items-center gap-4 p-5">
                  <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600" aria-hidden="true">
                    <mat-icon>emoji_events</mat-icon>
                  </span>
                  <div class="min-w-0">
                    <h2 id="next-in-program-title" class="font-semibold text-slate-900">{{ 'You finished the {0}!' | t: [step.program] }}</h2>
                    <p class="text-sm text-slate-600">{{ 'All {0} courses done. Look for your next program in the catalog.' | t: [step.total] }}</p>
                  </div>
                </div>
              }
            </section>
          }

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
          </div>

          <!-- Side column: similar courses and bootcamps (once the course is finished) -->
          @if (showAside()) {
            <aside class="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20" [attr.aria-label]="'What to learn next' | t">
              @if (similar().length) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="keep-learning-title">
                  <h2 id="keep-learning-title" class="flex items-center gap-2 font-semibold text-slate-900">
                    <mat-icon class="text-[#007979]" aria-hidden="true">auto_stories</mat-icon>
                    {{ 'Keep learning' | t }}
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">{{ 'Courses like this one' | t }}</p>
                  <ul class="mt-3 flex flex-col gap-2">
                    @for (item of similar(); track item.course.id + (item.course.organizationId ?? '')) {
                      <li>
                        <a
                          [routerLink]="courseLinkOf(item.course)"
                          class="flex items-start gap-3 rounded-xl border border-slate-200 p-2.5 transition hover:border-[#007979] hover:bg-teal-50/40"
                        >
                          <span class="mt-0.5 h-10 w-10 shrink-0 rounded-lg" [style.background]="coverOf(item.course)" aria-hidden="true"></span>
                          <span class="min-w-0 flex-1">
                            <span class="block break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">{{ item.course.title }}</span>
                            <span class="mt-0.5 block text-xs text-slate-500">
                              {{ levelLabel(item.course.level) | t }}
                              @if (item.state === 'in_progress') {
                                · <span class="font-semibold text-[#007979]">{{ 'In progress' | t }}</span>
                              }
                            </span>
                            @if (item.sharedSkills.length) {
                              <span class="mt-1 flex flex-wrap gap-1">
                                @for (skill of item.sharedSkills.slice(0, 3); track skill) {
                                  <span class="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-[#00605f]">{{ skill }}</span>
                                }
                              </span>
                            }
                          </span>
                        </a>
                      </li>
                    }
                  </ul>
                  <a [routerLink]="context.basePath + '/catalog'" class="mt-3 inline-block text-sm font-semibold text-[#007979] hover:underline">
                    {{ 'See all courses' | t }}
                  </a>
                </section>
              }

              @if (bootcamps().length) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="bootcamps-next-title">
                  <h2 id="bootcamps-next-title" class="flex items-center gap-2 font-semibold text-slate-900">
                    <mat-icon class="text-[#007979]" aria-hidden="true">rocket_launch</mat-icon>
                    {{ 'Go further with a bootcamp' | t }}
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">{{ 'Bootcamps that teach the same skills' | t }}</p>
                  <ul class="mt-3 flex flex-col gap-2">
                    @for (item of bootcamps(); track item.match.resourceId) {
                      <li>
                        <a
                          [routerLink]="['/resources', item.provider.slug]"
                          class="block rounded-xl border border-slate-200 p-3 transition hover:border-[#007979] hover:bg-teal-50/40"
                        >
                          <span class="flex items-start justify-between gap-2">
                            <span class="min-w-0">
                              <span class="block break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">{{ item.match.program.title }}</span>
                              <span class="block truncate text-xs text-slate-600">{{ item.provider.name }}</span>
                            </span>
                            @if (item.match.program.recommended) {
                              <span class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{{ 'Zebron pick' | t }}</span>
                            }
                          </span>
                          <span class="mt-1.5 block text-xs text-slate-500">{{ bootcampFacts(item.match) }}</span>
                          @if (item.match.nextStart) {
                            <span class="mt-0.5 block text-xs text-slate-500">{{ 'Next start: {0}' | t: [dateLabel(item.match.nextStart)] }}</span>
                          }
                        </a>
                      </li>
                    }
                  </ul>
                  <p class="mt-3 text-[11px] leading-4 text-slate-500">
                    {{ 'Bootcamps are run by other organizations. Check costs, dates and requirements with them before you apply.' | t }}
                  </p>
                  <a routerLink="/bootcamps" class="mt-2 inline-block text-sm font-semibold text-[#007979] hover:underline">
                    {{ 'See all bootcamps' | t }}
                  </a>
                </section>
              }
            </aside>
          }
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

  // ------------------------------------------------------------------
  // What to learn next (features/courses/next-steps.ts)
  // ------------------------------------------------------------------
  private readonly bootcampService = inject(BootcampService);
  private readonly resourceService = inject(ResourceService);
  private readonly logger = inject(LoggerService);

  /** Finished: every lesson, and the final exam when the course has one. */
  protected readonly finished = computed(() => {
    const course = this.store.course();
    return !!course && (course.finalExam ? this.certificate() : this.lessonsDone());
  });

  /** Where the learner is with any course in the catalog. */
  protected readonly stateOf = (course: CourseLike): CourseState => {
    const id = progressId(course);
    const record = this.store.progressById().get(id);
    if (!record) return null;
    return isCourseComplete(record, this.store.exams()[id]) ? 'completed' : 'in_progress';
  };

  protected readonly programStep = computed(() => {
    const course = this.store.course();
    return this.finished() && course ? nextInProgram(course, this.store.catalog(), this.stateOf) : null;
  });

  protected readonly similar = computed(() => {
    const course = this.store.course();
    if (!this.finished() || !course) return [];
    const next = this.programStep()?.next;
    return similarCourses(course, this.store.catalog(), this.stateOf, { limit: 4, exclude: next ? [next] : [] });
  });

  /** Bootcamps are suggested on Zebron's own course pages only, never on an organization's. */
  protected readonly bootcamps = signal<BootcampSuggestion[]>([]);
  private bootcampsFor: string | null = null;

  protected readonly showAside = computed(() => this.similar().length > 0 || this.bootcamps().length > 0);

  protected courseLinkOf(course: Pick<Course, 'id'>): string {
    return `${this.context.basePath}/${encodeURIComponent(course.id)}`;
  }

  protected coverOf(course: Pick<Course, 'cover'>): string {
    return COURSE_COVERS[course.cover] ?? COURSE_COVERS.teal;
  }

  protected levelLabel(level: Course['level']): string {
    return COURSE_LEVEL_LABELS[level] ?? '';
  }

  /** "Online · Part-time · 12 weeks · Free" */
  protected bootcampFacts(match: BootcampMatch): string {
    const program = match.program;
    const parts = [this.i18n.t(formatLabel(program.format)), this.i18n.t(scheduleLabel(program.schedule))];
    if (program.durationWeeks) parts.push(this.i18n.t('{0} weeks', [program.durationWeeks]));
    if (program.tuition === 0) parts.push(this.i18n.t('Free'));
    else if (program.tuition) {
      parts.push(program.tuition.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));
    }
    return parts.join(' · ');
  }

  protected dateLabel(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return Number.isNaN(value.getTime())
      ? date
      : value.toLocaleDateString(this.i18n.language(), { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private async loadBootcamps(course: Course): Promise<void> {
    try {
      const all = await this.bootcampService.listAll();
      const matches = matchBootcamps(course, all, { limit: 5 });
      // Only bootcamps whose page is published; at most three.
      const providers = await Promise.all(
        matches.map((match) => this.resourceService.getResourceById(match.resourceId).catch(() => null)),
      );
      const suggestions = matches
        .map((match, index) => ({ match, provider: providers[index] }))
        .filter((item): item is BootcampSuggestion => item.provider?.status === 'published' && !!item.provider.slug)
        .slice(0, 3);
      if (this.bootcampsFor === progressId(course)) this.bootcamps.set(suggestions);
    } catch (error) {
      // Suggestions are extra: the summary works without them.
      this.logger.error('CourseSummary', 'Could not load bootcamp suggestions.', error);
    }
  }

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
    // The catalog gives the next course in the program and similar courses.
    void this.store.loadCatalog();

    // Bootcamps that teach the same skills: Zebron's pages only, once the course is finished.
    effect(() => {
      const course = this.store.course();
      if (!course || !this.finished() || this.context.organizationId !== null) return;
      const key = progressId(course);
      if (this.bootcampsFor === key) return;
      this.bootcampsFor = key;
      untracked(() => void this.loadBootcamps(course));
    });

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
