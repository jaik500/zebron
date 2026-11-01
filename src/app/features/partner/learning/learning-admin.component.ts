import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { PartnerAccessService } from '../../../core/services/partner-access.service';
import { CourseService } from '../../courses/course.service';
import { Course } from '../../courses/course.model';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import { QuizService } from '../../test-center/services/quiz.service';
import { LiveSessionService, sessionEnd } from '../../live/live-session.service';

/**
 * Learning administration: one page with a card for each capability the
 * organization has (Courses, Test Center, Virtual Classroom), live counts
 * and links into their pages. Opened from the gear on the Learning card.
 *
 * Organizations with only the Test Center go straight to its settings.
 *
 * Route: /partner/org/:organizationId/learning/manage (staff and above).
 */
@Component({
  selector: 'app-learning-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'dashboard']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Dashboard' | t"
            [title]="'Dashboard' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-semibold">{{ 'Learning administration' | t }}</h1>
            <p class="text-sm text-white/85">{{ 'Courses and the Test Center work together: a course final exam is a Test Center quiz.' | t }}</p>
          </div>
          <a
            [routerLink]="['/partner/org', organizationId, 'courses']"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/40 px-3 text-sm font-semibold hover:bg-white/15"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">visibility</mat-icon>
            {{ 'View as learner' | t }}
          </a>
        </div>
      </header>

      <div class="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-2 lg:px-8" [class]="cardCount() === 3 ? 'xl:grid-cols-3' : ''">
        <!-- ================= COURSES ================= -->
        @if (hasCourses()) {
        <section class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="courses-card-title">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#007979]"><mat-icon aria-hidden="true">menu_book</mat-icon></span>
            <div>
              <h2 id="courses-card-title" class="text-lg font-semibold text-slate-900">{{ 'Courses' | t }}</h2>
              <p class="text-sm text-slate-500">{{ 'Lessons, video, final exams and certificates.' | t }}</p>
            </div>
          </div>

          <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-xs text-slate-500">{{ 'Published' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ loadingCourses() ? '–' : coursesBy('published') }}</dd>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-xs text-slate-500">{{ 'Drafts' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ loadingCourses() ? '–' : coursesBy('draft') }}</dd>
            </div>
            <div class="rounded-xl p-3" [class]="coursesBy('in_review') ? 'rounded-xl bg-amber-50 p-3' : 'rounded-xl bg-slate-50 p-3'">
              <dt class="text-xs text-slate-500">{{ 'In review' | t }}</dt>
              <dd class="text-2xl font-semibold" [class]="coursesBy('in_review') ? 'text-2xl font-semibold text-amber-800' : 'text-2xl font-semibold text-slate-900'">
                {{ loadingCourses() ? '–' : coursesBy('in_review') }}
              </dd>
            </div>
          </dl>

          @if (access.isManagerOrAbove() && coursesBy('in_review') > 0) {
            <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {{ (coursesBy('in_review') === 1 ? '{0} course is waiting for your review.' : '{0} courses are waiting for your review.') | t: [coursesBy('in_review')] }}
            </p>
          } @else if (!access.isManagerOrAbove()) {
            <p class="mt-3 text-xs text-slate-500">{{ 'You write drafts and submit them for review; a manager publishes them.' | t }}</p>
          }

          <div class="mt-auto flex flex-wrap gap-2 pt-4">
            <a [routerLink]="['/partner/org', organizationId, 'courses', 'manage']" class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ access.isManagerOrAbove() && coursesBy('in_review') ? 'rate_review' : 'edit_note' }}</mat-icon>
              {{ (access.isManagerOrAbove() && coursesBy('in_review') ? 'Review and manage' : 'Manage courses') | t }}
            </a>
            <a [routerLink]="['/partner/org', organizationId, 'courses', 'manage', 'new']" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
              {{ 'New course' | t }}
            </a>
            @if (access.isManagerOrAbove()) {
              <a [routerLink]="['/partner/org', organizationId, 'learning', 'progress']" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">insights</mat-icon>
                {{ 'Team progress' | t }}
              </a>
            }
          </div>
          @if (access.isManagerOrAbove()) {
            <p class="mt-3 text-xs text-slate-500">{{ 'Assign courses with due dates from Manage courses, then follow them in Team progress.' | t }}</p>
          }
        </section>

        }

        <!-- ================= TEST CENTER ================= -->
        @if (hasTestCenter()) {
        <section class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="test-center-card-title">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#007979]"><mat-icon aria-hidden="true">quiz</mat-icon></span>
            <div>
              <h2 id="test-center-card-title" class="text-lg font-semibold text-slate-900">{{ 'Test Center' | t }}</h2>
              <p class="text-sm text-slate-500">{{ 'Quizzes, question banks and results.' | t }}</p>
            </div>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-2 text-center">
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-xs text-slate-500">{{ 'Quizzes' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ loadingQuizzes() ? '–' : quizCount() }}</dd>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-xs text-slate-500">{{ 'Published questions' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ loadingQuizzes() ? '–' : questionCount() }}</dd>
            </div>
          </dl>

          <p class="mt-3 text-xs text-slate-500">{{ 'Staff add questions; managers review and publish them.' | t }}</p>

          <div class="mt-auto flex flex-wrap gap-2 pt-4">
            <a [routerLink]="['/partner/org', organizationId, 'test-center']" class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">settings</mat-icon>
              {{ 'Test Center settings' | t }}
            </a>
            <a [routerLink]="['/partner/org', organizationId, 'test-center', 'questions']" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">playlist_add</mat-icon>
              {{ 'Questions' | t }}
            </a>
            <a [routerLink]="['/partner/org', organizationId, 'test-center', 'learners']" class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">groups</mat-icon>
              {{ 'Learner results' | t }}
            </a>
          </div>
        </section>
        }

        <!-- ================= VIRTUAL CLASSROOM ================= -->
        @if (hasLive()) {
          <section class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="live-card-title">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#007979]"><mat-icon aria-hidden="true">video_camera_front</mat-icon></span>
              <div>
                <h2 id="live-card-title" class="text-lg font-semibold text-slate-900">{{ 'Virtual Classroom' | t }}</h2>
                <p class="text-sm text-slate-500">{{ 'Live sessions in Zoom, Google Meet, Teams or Jitsi.' | t }}</p>
              </div>
            </div>

            <dl class="mt-4 grid grid-cols-2 gap-2 text-center">
              <div class="rounded-xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-500">{{ 'Upcoming sessions' | t }}</dt>
                <dd class="text-2xl font-semibold text-slate-900">{{ loadingLive() ? '–' : upcomingSessions() }}</dd>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-500">{{ 'Registered' | t }}</dt>
                <dd class="text-2xl font-semibold text-slate-900">{{ loadingLive() ? '–' : upcomingRegistrations() }}</dd>
              </div>
            </dl>

            <p class="mt-3 text-xs text-slate-500">{{ 'Staff schedule sessions and mark attendance.' | t }}</p>

            <div class="mt-auto flex flex-wrap gap-2 pt-4">
              <a [routerLink]="['/partner/org', organizationId, 'live']" class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">event</mat-icon>
                {{ 'Schedule and manage' | t }}
              </a>
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class LearningAdminComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courses = inject(CourseService);
  private readonly quizzes = inject(QuizService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly access = inject(PartnerAccessService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  private readonly courseList = signal<Course[]>([]);
  protected readonly loadingCourses = signal(true);
  protected readonly quizCount = signal(0);
  protected readonly questionCount = signal(0);
  protected readonly loadingQuizzes = signal(true);

  private readonly live = inject(LiveSessionService);
  protected readonly hasCourses = signal(false);
  protected readonly hasTestCenter = signal(false);
  protected readonly hasLive = signal(false);
  protected readonly cardCount = computed(() => [this.hasCourses(), this.hasTestCenter(), this.hasLive()].filter(Boolean).length);
  protected readonly upcomingSessions = signal(0);
  protected readonly upcomingRegistrations = signal(0);
  protected readonly loadingLive = signal(true);

  private readonly counts = computed(() => {
    const counts: Record<string, number> = {};
    for (const course of this.courseList()) {
      counts[course.status] = (counts[course.status] ?? 0) + 1;
    }
    return counts;
  });

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.i18n.t('Learning administration'));

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Context errors are shown elsewhere; the counts still load below.
    }

    this.hasCourses.set(this.organizationStore.hasActiveApplication('courses'));
    this.hasTestCenter.set(this.organizationStore.hasActiveApplication('test-center'));
    this.hasLive.set(this.organizationStore.hasActiveApplication('virtual-classroom'));

    // Only the Test Center: its settings are the whole administration.
    if (!this.hasCourses() && !this.hasLive()) {
      await this.router.navigate(['/partner/org', this.organizationId, 'test-center'], { replaceUrl: true });
      return;
    }

    if (this.hasCourses()) {
      void this.loadCourses();
    }
    if (this.hasTestCenter()) {
      void this.loadQuizzes();
    }
    if (this.hasLive()) {
      void this.loadLive();
    }
  }

  protected coursesBy(status: string): number {
    return this.counts()[status] ?? 0;
  }

  private async loadCourses(): Promise<void> {
    try {
      this.courseList.set(await this.courses.listAll(this.organizationId));
    } catch (error) {
      this.logger.error('LearningAdminComponent', 'Could not count courses.', error);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  private async loadLive(): Promise<void> {
    try {
      const upcoming = (await this.live.list(this.organizationId)).filter(
        (session) => session.status === 'scheduled' && sessionEnd(session).getTime() >= Date.now(),
      );
      this.upcomingSessions.set(upcoming.length);
      this.upcomingRegistrations.set(upcoming.reduce((total, session) => total + session.registeredCount, 0));
    } catch (error) {
      this.logger.error('LearningAdminComponent', 'Could not count live sessions.', error);
    } finally {
      this.loadingLive.set(false);
    }
  }

  private async loadQuizzes(): Promise<void> {
    try {
      // The organization's own active quizzes.
      const quizzes = await this.quizzes.getAvailableQuizzes(this.organizationId);
      this.quizCount.set(quizzes.length);
      this.questionCount.set(quizzes.reduce((total, quiz) => total + (quiz.questionCount || 0), 0));
    } catch (error) {
      this.logger.error('LearningAdminComponent', 'Could not count quizzes.', error);
    } finally {
      this.loadingQuizzes.set(false);
    }
  }
}
