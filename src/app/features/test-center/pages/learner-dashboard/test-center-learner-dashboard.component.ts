import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TestCenterLearnersService } from '../../services/test-center-learners.service';
import {
  LearnerDashboard,
  LearnerCourseProgress,
  LearnerAssessmentSummary,
} from '../../models/test-center-learner.model';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-test-center-learner-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,CommonModule, DatePipe, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 mt-15">
      <div class="mx-auto max-w-7xl space-y-6">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-slate-500">
          <a routerLink="/test-center" class="transition hover:text-blue-600"> {{ 'Test Center' | t }} </a>

          <span>/</span>

          <a routerLink="/test-center/learners" class="transition hover:text-blue-600">
            {{ 'Learners' | t }}
          </a>

          <span>/</span>

          <span class="font-medium text-slate-800"> {{ 'Learning Dashboard' | t }} </span>
        </nav>

        <!-- Loading -->

        @if (loading) {
          <section class="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div
              class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
            ></div>

            <p class="mt-4 text-sm font-medium text-slate-600">{{ 'Loading learner dashboard...' | t }}</p>
          </section>
        }

        <!-- Error -->

        @if (!loading && errorMessage) {
          <section class="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
            >
              <span class="text-xl">!</span>
            </div>

            <h2 class="mt-4 text-lg font-semibold text-slate-900">
              {{ 'Unable to load learner dashboard' | t }}
            </h2>

            <p class="mt-2 text-sm text-slate-600">
              {{ errorMessage | t }}
            </p>

            <button
              type="button"
              (click)="loadDashboard()"
              class="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {{ 'Try again' | t }}
            </button>

            <a
              routerLink="/test-center/learners"
              class="ml-3 inline-flex rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {{ 'Back to learners' | t }}
            </a>
          </section>
        }

        <!-- Dashboard -->

        @if (!loading && !errorMessage && dashboard) {
          <ng-container>
            <!-- Header -->
            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500"></div>

              <div class="p-6 sm:p-8">
                <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700"
                    >
                      {{ getInitials(dashboard.learner.name) }}
                    </div>

                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        {{ 'Learner Dashboard' | t }}
                      </p>

                      <h1
                        class="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                      >
                        {{ dashboard.learner.name }}
                      </h1>

                      <p class="mt-1 break-all text-sm text-slate-500">
                        {{ dashboard.learner.email || ('No email available' | t) }}
                      </p>

                      <div class="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                          [ngClass]="getStatusClasses(dashboard.learner.status)"
                        >
                          {{ getStatusLabel(dashboard.learner.status) | t }}
                        </span>

                        <span
                          class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {{ 'Organization Member' | t }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    routerLink="/test-center/learners"
                    class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <span aria-hidden="true">←</span>
                    {{ 'Back to learners' | t }}
                  </a>
                </div>
              </div>
            </section>

            <!-- Summary Cards -->
            <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-500">{{ 'Assessments Taken' | t }}</p>

                    <p class="mt-1 text-2xl font-bold text-blue-700">
                      {{ dashboard.learner.assessmentCount }}
                    </p>
                  </div>

                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"
                  >
                    <span class="text-xl">▤</span>
                  </div>
                </div>

                <p class="mt-3 text-xs text-slate-500">{{ 'Recorded assessment attempts' | t }}</p>
              </article>

              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-500">{{ 'Average Score' | t }}</p>

                    <p class="mt-3 text-3xl font-bold text-slate-900">
                      {{
                        dashboard.learner.averageScore !== null
                          ? (dashboard.learner.averageScore | number: '1.0-1') + '%'
                          : '—'
                      }}
                    </p>
                  </div>

                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
                  >
                    <span class="text-xl">↗</span>
                  </div>
                </div>

                <p class="mt-3 text-xs text-slate-500">{{ 'Across assessments with recorded scores' | t }}</p>
              </article>

              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-500">{{ 'Courses Enrolled' | t }}</p>

                    <p class="mt-3 text-3xl font-bold text-slate-900">
                      {{ dashboard.learner.enrolledQuizIds.length }}
                    </p>
                  </div>

                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"
                  >
                    <span class="text-xl">▦</span>
                  </div>
                </div>

                <p class="mt-3 text-xs text-slate-500">{{ 'Courses confirmed by enrollment data' | t }}</p>
              </article>

              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-500">{{ 'Courses Completed' | t }}</p>

                    <p class="mt-3 text-3xl font-bold text-slate-900">
                      {{ dashboard.learner.completedQuizIds.length }}
                    </p>
                  </div>

                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                  >
                    <span class="text-xl">✓</span>
                  </div>
                </div>

                <p class="mt-3 text-xs text-slate-500">{{ 'Courses with confirmed completion' | t }}</p>
              </article>
            </section>

            <!-- Learning Activity and Course Progress -->
            <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <!-- Assessment History -->
              <div
                class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2"
              >
                <div
                  class="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 class="text-lg font-bold text-slate-900">{{ 'Assessment History' | t }}</h2>

                    <p class="mt-1 text-sm text-slate-500">
                      {{ 'A record of this learner\\u0027s assessment activity.' | t }}
                    </p>
                  </div>

                  <span
                    class="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {{ '{0} records' | t: [dashboard.assessments.length] }}
                  </span>
                </div>

                <div *ngIf="dashboard.assessments.length === 0" class="px-6 py-14 text-center">
                  <div
                    class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400"
                  >
                    ▤
                  </div>

                  <h3 class="mt-4 font-semibold text-slate-900">{{ 'No assessment activity yet' | t }}</h3>

                  <p class="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    {{ 'Assessment results will appear here after the learner completes an assessment that is recorded in the system.' | t }}
                  </p>
                </div>

                <div *ngIf="dashboard.assessments.length > 0" class="divide-y divide-slate-100">
                  <article
                    *ngFor="let assessment of dashboard.assessments; trackBy: trackAssessment"
                    class="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div class="flex min-w-0 items-start gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
                      >
                        <span class="text-lg">▤</span>
                      </div>

                      <div class="min-w-0">
                        <h3 class="break-words font-semibold text-slate-900">
                          {{ assessment.quizName || ('Assessment' | t) }}
                        </h3>

                        <p class="mt-1 text-sm text-slate-500">
                          {{
                            assessment.completedAt
                              ? (assessment.completedAt | date: 'medium')
                              : 'Date unavailable'
                          }}
                        </p>

                        <p *ngIf="assessment.quizName" class="mt-1 text-xs text-slate-500">
                          {{ 'Course: {0}' | t: [assessment.quizName] }}
                        </p>
                      </div>
                    </div>

                    <div class="flex shrink-0 items-center gap-4 sm:justify-end">
                      <div class="text-left sm:text-right">
                        <p class="text-xl font-bold text-slate-900">
                          {{
                            assessment.scorePercentage !== null &&
                            assessment.scorePercentage !== undefined
                              ? (assessment.scorePercentage | number: '1.0-1') + '%'
                              : '—'
                          }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                          {{
                            assessment.correctAnswers !== null &&
                            assessment.correctAnswers !== undefined
                              ? assessment.correctAnswers + ' correct'
                              : ('Score details unavailable' | t)
                          }}
                        </p>
                      </div>

                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="getAssessmentClasses(assessment)"
                      >
                        {{ getAssessmentLabel(assessment) | t }}
                      </span>
                    </div>
                  </article>
                </div>
              </div>

              <!-- Learner Overview -->
              <aside class="space-y-6">
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900">{{ 'Learner Overview' | t }}</h2>

                  <p class="mt-1 text-sm text-slate-500">{{ 'Membership and activity details.' | t }}</p>

                  <dl class="mt-6 space-y-5">
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {{ 'Full Name' | t }}
                      </dt>

                      <dd class="mt-1 break-words text-sm font-medium text-slate-800">
                        {{ dashboard.learner.name }}
                      </dd>
                    </div>

                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {{ 'Email Address' | t }}
                      </dt>

                      <dd class="mt-1 break-all text-sm font-medium text-slate-800">
                        {{ dashboard.learner.email || ('Not provided' | t) }}
                      </dd>
                    </div>

                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {{ 'Membership Status' | t }}
                      </dt>

                      <dd class="mt-1 text-sm font-medium text-slate-800">
                        {{ getStatusLabel(dashboard.learner.status) | t }}
                      </dd>
                    </div>

                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {{ 'Last Assessment' | t }}
                      </dt>

                      <dd class="mt-1 text-sm font-medium text-slate-800">
                        {{
                          dashboard.learner.lastAssessmentAt
                            ? (dashboard.learner.lastAssessmentAt | date: 'mediumDate')
                            : 'No assessment recorded'
                        }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <!-- Learning Summary -->
                <section
                  class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6"
                >
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-blue-700 shadow-sm"
                  >
                    ↗
                  </div>

                  <h2 class="mt-4 text-lg font-bold text-slate-900">{{ 'Learning Activity' | t }}</h2>

                  <p class="mt-2 text-sm leading-6 text-slate-600">
                    {{ 'This overview reflects recorded assessment activity. Course enrollment and completion counts depend on confirmed course enrollment and completion data.' | t }}
                  </p>

                  <div class="mt-5 rounded-xl border border-white bg-white/80 p-4">
                    <p class="text-xs font-medium text-slate-500">{{ 'Recorded assessment attempts' | t }}</p>

                    <p class="mt-1 text-2xl font-bold text-blue-700">
                      {{ dashboard.learner.assessmentCount }}
                    </p>
                  </div>
                </section>
              </aside>
            </section>

            <!-- Course Progress -->
            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 px-6 py-5">
                <h2 class="text-lg font-bold text-slate-900">{{ 'Course Progress' | t }}</h2>

                <p class="mt-1 text-sm text-slate-500">
                  {{ 'Courses and learning progress available for this learner.' | t }}
                </p>
              </div>

              <div *ngIf="dashboard.courses.length === 0" class="px-6 py-14 text-center">
                <div
                  class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-500"
                >
                  ▦
                </div>

                <h3 class="mt-4 font-semibold text-slate-900">{{ 'No course progress available' | t }}</h3>

                <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {{ 'Course activity will appear here when the learner\\u0027s enrollment and progress records are available.' | t }}
                </p>
              </div>

              <div
                *ngIf="dashboard.courses.length > 0"
                class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
              >
                <article
                  *ngFor="let course of dashboard.courses; trackBy: trackCourse"
                  class="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"
                    >
                      <span class="text-xl">▦</span>
                    </div>

                    <span
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {{ course.status || ('In progress' | t) }}
                    </span>
                  </div>

                  <h3 class="mt-4 break-words font-bold text-slate-900">
                    {{ course.quizName }}
                  </h3>

                  <p class="mt-2 text-sm text-slate-500">
                    {{ '{0} recorded assessment{1}' | t: [course.assessmentCount, (course.assessmentCount === 1 ? '' : 's')] }}
                  </p>

                  <div class="mt-4">
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-xs font-medium text-slate-500"> {{ 'Average score' | t }} </span>

                      <span class="text-xs font-bold text-slate-700">
                        {{ getCourseActivityPercent(course) }}%
                      </span>
                    </div>

                    <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-blue-600 transition-all"
                        [style.width.%]="getCourseActivityPercent(course)"
                      ></div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <!-- Footer -->
            <footer
              class="flex flex-col gap-3 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{{ 'Zebron Test Center · Learner Performance' | t }}</p>

              <a
                routerLink="/test-center/learners"
                class="font-semibold text-blue-600 hover:text-blue-800"
              >
                {{ 'Return to learner directory →' | t }}
              </a>
            </footer>
          </ng-container>
        }
      </div>
    </main>
  `,
  styles: [],
})
export class TestCenterLearnerDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly learnersService = inject(TestCenterLearnersService);

  dashboard: LearnerDashboard | null = null;

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const userId = params.get('userId');

      if (!userId) {
        this.loading = false;
        this.errorMessage = 'A learner user ID was not provided.';
        return;
      }

      this.loadDashboard(userId);
    });
  }

  loadDashboard(userId?: string): void {
    const resolvedUserId = userId ?? this.route.snapshot.paramMap.get('userId');
    const organizationId = this.getOrganizationIdFromRoute();

    if (!resolvedUserId) {
      this.loading = false;
      this.errorMessage = 'A learner user ID was not provided.';
      return;
    }

    if (!organizationId) {
      this.loading = false;
      this.errorMessage =
        'An organization ID was not provided by the current route. Ensure the Test Center route exposes organizationId or pass it as a query parameter.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.learnersService.getLearnerDashboard(organizationId, resolvedUserId).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.loading = false;

        if (!dashboard) {
          this.errorMessage = 'The learner could not be found in the current organization.';
        }
      },
      error: (error: unknown) => {
        console.error('Failed to load learner dashboard:', error);

        this.dashboard = null;
        this.loading = false;
        this.errorMessage =
          'The dashboard could not be loaded. Check your organization access and Firestore permissions, then try again.';
      },
    });
  }

  /**
   * Resolve the organization ID from this route or one of its parent routes.
   * Query-param support is included for route configurations that do not place
   * organizationId directly in the path.
   */
  private getOrganizationIdFromRoute(): string | null {
    let currentRoute: ActivatedRoute | null = this.route;

    while (currentRoute) {
      const organizationId = currentRoute.snapshot.paramMap.get('organizationId');

      if (organizationId) {
        return organizationId;
      }

      currentRoute = currentRoute.parent;
    }

    return this.route.snapshot.queryParamMap.get('organizationId');
  }

  getInitials(name: string | null | undefined): string {
    if (!name?.trim()) {
      return 'L';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'not-started':
        return 'Not Started';
      default:
        return 'Unknown';
    }
  }

  getStatusClasses(status: string | null | undefined): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      case 'not-started':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getAssessmentLabel(assessment: LearnerAssessmentSummary): string {
    if (assessment.scorePercentage === null || assessment.scorePercentage === undefined) {
      return 'Recorded';
    }

    return assessment.scorePercentage >= 70 ? 'Passed' : 'Review';
  }

  getAssessmentClasses(assessment: LearnerAssessmentSummary): string {
    if (assessment.scorePercentage === null || assessment.scorePercentage === undefined) {
      return 'bg-slate-100 text-slate-600';
    }

    return assessment.scorePercentage >= 70
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';
  }

  getCourseActivityPercent(course: LearnerCourseProgress): number {
    const score = course.averageScore;

    if (score === null || score === undefined || !Number.isFinite(score)) {
      return 0;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  trackAssessment(index: number, assessment: LearnerAssessmentSummary): string {
    return assessment.id || String(index);
  }

  trackCourse(index: number, course: LearnerCourseProgress): string {
    return course.quizId || String(index);
  }
}
