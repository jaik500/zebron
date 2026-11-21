import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseCardComponent } from '../components/course-card.component';
import { CourseService } from '../course.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { ProgressRingComponent } from '../components/progress-ring.component';
import {
  allLessons,
  COURSE_COVERS,
  courseContextFromRoute,
  courseLink,
  CourseCover,
  Course,
  CourseProgress,
  hasCertificate,
  isCourseComplete,
  progressId,
} from '../course.model';
import { CourseAssignment, CourseAssignmentService, isOverdue } from '../course-assignment.service';
import { CourseAccessService } from '../course-access.service';
import { CourseStore } from '../course.store';
import { MyNotesSummaryComponent } from '../annotations/my-notes-summary.component';
import { STATUS_LABELS, TrainingGroup, TrainingGroupService, groupStatus } from '../../training-groups/training-group.service';
import { MyAssignment, SUBMISSION_STATUS_LABELS, TrainingGroupAssignmentService } from '../../training-groups/training-group-assignment.service';
import { CareerPathService } from '../../careers/career-path.service';
import { CareerPlan } from '../../careers/career-path.model';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';
import { QuizService } from '../../test-center/services/quiz.service';
import { QuizResultLike, quizOverview, summarizeQuizzes, topicsToReview } from '../quiz-tracking';

/** A `quizResults` document, as quiz tracking reads it. */
function toQuizResult(id: string, data: Record<string, unknown>): QuizResultLike {
  const completedAt = data['completedAt'] as { toDate?: () => Date } | null | undefined;
  const topics = Array.isArray(data['topicPerformance']) ? (data['topicPerformance'] as Record<string, unknown>[]) : [];
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  const source = data['source'];
  return {
    id,
    quizId: text(data['quizId']),
    quizName: text(data['quizName']),
    scorePercentage: number(data['scorePercentage']),
    mode: data['mode'] === 'exam' ? 'exam' : 'practice',
    source: source === 'course' || source === 'certification' ? source : 'test-center',
    completedAt: typeof completedAt?.toDate === 'function' ? completedAt.toDate() : null,
    topicPerformance: topics.map((topic) => ({
      topicId: text(topic['topicId']),
      topicName: text(topic['topicName']),
      answeredQuestions: number(topic['answeredQuestions']),
      correctAnswers: number(topic['correctAnswers']),
    })),
    courseId: text(data['courseId']) || null,
    courseTitle: text(data['courseTitle']) || null,
  };
}

/** Minutes a week the streak card counts toward. */
const WEEKLY_GOAL_MINUTES = 60;

/** My learning: continue where you left off, weekly streak, courses in progress and suggestions. */
@Component({
  selector: 'app-my-learning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, CourseCardComponent, ProgressRingComponent, MyNotesSummaryComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
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
          <!-- Continue learning. Phones: a compact row (small cover with the ring beside the text). -->
          <section class="grid grid-cols-[4.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div class="relative flex items-center justify-center md:block md:min-h-36" [style.background]="coverOf(record)">
              <div class="md:hidden">
                <app-progress-ring [percent]="record.percent" [size]="48" color="#ffffff" trackColor="rgba(255,255,255,0.25)" />
              </div>
              <div class="absolute bottom-4 left-5 hidden md:block">
                <app-progress-ring [percent]="record.percent" [size]="68" color="#ffffff" trackColor="rgba(255,255,255,0.25)" />
              </div>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-1 p-3 md:gap-2 md:p-5">
              <span class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ 'Continue learning' | t }}</span>
              <h2 class="break-words text-base font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] md:text-xl">{{ record.courseTitle }}</h2>
              @if (nextLessonTitle(); as title) {
                <p class="flex min-w-0 items-start gap-1 text-xs text-slate-600 md:text-sm">
                  <mat-icon class="!h-4 !w-4 shrink-0 !text-[16px] text-[#007979] md:!h-[18px] md:!w-[18px] md:!text-[18px]" aria-hidden="true">play_circle</mat-icon>
                  <span class="min-w-0 truncate md:whitespace-normal md:break-words md:[overflow-wrap:anywhere]">{{ 'Next: {0}' | t: [title] }}</span>
                </p>
              }
              <p class="hidden text-xs text-slate-500 md:block">
                {{ '{0} of {1} lessons done' | t: [record.completedLessonIds.length, record.lessonCount] }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-1.5 md:gap-2">
                <a
                  [routerLink]="resumeLink()"
                  class="inline-flex h-8 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] md:h-10 md:px-4"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] md:!h-6 md:!w-6 md:!text-[24px]" aria-hidden="true">play_arrow</mat-icon>{{ 'Resume' | t }}
                </a>
                <a
                  [routerLink]="linkFor(record)"
                  class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:h-10 md:px-4"
                  [attr.aria-label]="'Course outline' | t"
                  [title]="'Course outline' | t"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] md:hidden" aria-hidden="true">list</mat-icon>
                  <span class="max-md:hidden">{{ 'Course outline' | t }}</span>
                </a>
                <button
                  type="button"
                  (click)="remove(record)"
                  class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:h-10 md:px-3"
                  [title]="'Remove from My learning. Your progress is kept.' | t"
                  [attr.aria-label]="'Remove' | t"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">remove_circle_outline</mat-icon>
                  <span class="max-md:hidden">{{ 'Remove' | t }}</span>
                </button>
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

        @if (showCareerCard() || signedIn()) {
          <!-- Career path and certificates, side by side (one column on phones) -->
          <div [class]="showCareerCard() && signedIn() ? 'mt-4 grid gap-3 md:grid-cols-2' : 'mt-4 grid gap-3'">
            @if (showCareerCard()) {
              <!-- Career path: the learner's own, or an invitation to pick one (Zebron Learning only) -->
              <section class="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:items-start" aria-labelledby="career-card-title">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007979]/10 text-[#007979]" aria-hidden="true">
                  <mat-icon>route</mat-icon>
                </span>
                <!-- Phones: icon and buttons only; titles stay for screen readers, descriptions are hidden. -->
                <div class="flex min-w-0 flex-1 flex-col md:gap-2">
                  @if (careerPlan(); as plan) {
                    <div>
                      <span class="hidden text-[11px] font-bold uppercase tracking-wide text-[#007979] md:inline">{{ 'Your career path' | t }}</span>
                      <h2 id="career-card-title" class="sr-only truncate text-base font-semibold text-slate-900 md:not-sr-only">{{ plan.pathTitle }}</h2>
                      <p class="hidden text-sm text-slate-600 md:block">{{ 'See where you stand, what to learn next and the jobs it leads to.' | t }}</p>
                    </div>
                    <div class="mt-auto flex flex-wrap gap-2">
                      <a
                        [routerLink]="['/courses/careers', plan.pathId]"
                        class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]"
                      >
                        {{ 'Open my path' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                      </a>
                      <a
                        routerLink="/courses/careers"
                        class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {{ 'All career paths' | t }}
                      </a>
                    </div>
                  } @else {
                    <div>
                      <h2 id="career-card-title" class="sr-only text-base font-semibold text-slate-900 md:not-sr-only">{{ 'Career paths' | t }}</h2>
                      <p class="hidden text-sm text-slate-600 md:block">{{ 'Not sure what to learn next? Pick a role and follow a roadmap of skills, courses and projects to get there.' | t }}</p>
                    </div>
                    <div class="mt-auto">
                      <a
                        routerLink="/courses/careers"
                        class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]"
                      >
                        {{ 'Explore career paths' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                      </a>
                    </div>
                  }
                </div>
              </section>
            }

            @if (signedIn()) {
              <!-- Certificates (was its own tab) -->
              <a
                [routerLink]="context.basePath + '/certificates'"
                class="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#007979]/40 hover:shadow-sm md:items-start"
              >
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600" aria-hidden="true">
                  <mat-icon>workspace_premium</mat-icon>
                </span>
                <span class="flex min-w-0 flex-1 flex-col md:gap-2">
                  <span>
                    <span class="hidden text-[11px] font-bold uppercase tracking-wide text-amber-700 md:block">{{ 'Certificates' | t }}</span>
                    <span class="sr-only text-base font-semibold text-slate-900 md:not-sr-only md:block">{{ 'My certificates' | t }}</span>
                    <!-- Descriptions are hidden on phones to keep the cards short. -->
                    <span class="hidden text-sm text-slate-600 md:block">
                      @if (certificateCount() === 0) {
                        {{ 'Pass the final exam of a course to earn a certificate you can share and others can verify.' | t }}
                      } @else if (certificateCount() === 1) {
                        {{ '1 certificate earned. View, download or share it.' | t }}
                      } @else {
                        {{ '{0} certificates earned. View, download or share them.' | t: [certificateCount()] }}
                      }
                    </span>
                  </span>
                  <span class="mt-auto inline-flex h-9 w-fit items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                    {{ 'View certificates' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                  </span>
                </span>
              </a>
            }
          </div>
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

        @if (signedIn() && myGroups().length) {
          <!-- Training groups (cohorts) this learner belongs to -->
          <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="my-groups-title">
            <h2 id="my-groups-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">groups</mat-icon>
              {{ (myGroups().length === 1 ? 'Your training group' : 'Your training groups') | t }}
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              @for (group of myGroups(); track group.id) {
                <li>
                  <a
                    [routerLink]="['/partner/org', group.organizationId, 'training-groups', group.id]"
                    class="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#007979]/40 hover:shadow-sm"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold text-slate-900">{{ group.name }}</span>
                      <span class="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span class="rounded-full px-1.5 font-semibold" [class]="groupBadge(group).classes">{{ groupBadge(group).label | t }}</span>
                        {{ groupDates(group) }}
                      </span>
                    </span>
                    <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">chevron_right</mat-icon>
                  </a>
                </li>
              }
            </ul>

            @if (openWork().length) {
              <!-- Assignments and projects still to do or waiting for review -->
              <h3 class="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">assignment</mat-icon>
                {{ 'Assignments and projects' | t }}
              </h3>
              <ul class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                @for (entry of openWork(); track entry.groupId + entry.assignment.id) {
                  <li>
                    <a
                      [routerLink]="['/partner/org', entry.organizationId, 'training-groups', entry.groupId]"
                      [queryParams]="{ assignment: entry.assignment.id }"
                      class="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50"
                    >
                      <mat-icon class="shrink-0 text-slate-500" aria-hidden="true">{{ entry.assignment.kind === 'project' ? 'rocket_launch' : 'assignment' }}</mat-icon>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-slate-900">{{ entry.assignment.title }}</span>
                        <span class="block truncate text-xs text-slate-500">
                          {{ entry.groupName }}
                          @if (entry.assignment.dueAt) {
                            ·
                            <span [class]="workOverdue(entry) ? 'font-semibold text-rose-700' : ''">{{ 'Due {0}' | t: [dueLabel(entry.assignment.dueAt)] }}</span>
                          }
                        </span>
                      </span>
                      <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="workBadge(entry).classes">{{ workBadge(entry).label | t }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </section>
        }

        @if (signedIn()) {
          <!-- Stats on one line, icons hidden on phones; the minutes card is hidden on phones -->
          <section
            [class]="quizzesAvailable() ? 'mt-4 grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-5' : 'mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4'"
            [attr.aria-label]="'Your learning this week' | t"
          >
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
            <div class="rounded-2xl border border-slate-200 bg-white p-2 text-center max-md:hidden sm:p-4">
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">schedule</mat-icon>
              <p class="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.weekMinutes() }}</p>
              <p class="text-[10px] text-slate-500 sm:text-xs">{{ 'of {0} min this week' | t: [weeklyGoal] }}</p>
            </div>
            <!-- Completed and Skills earned open a list below the stats -->
            <button
              type="button"
              class="rounded-2xl border bg-white p-2 text-center transition hover:border-[#007979]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:cursor-default disabled:hover:border-slate-200 sm:p-4"
              [style.border-color]="statPanel() === 'completed' ? '#007979' : '#e2e8f0'"
              [style.background-color]="statPanel() === 'completed' ? '#f0f9f9' : '#ffffff'"
              [attr.aria-expanded]="statPanel() === 'completed'"
              aria-controls="stat-panel"
              [disabled]="store.completed().length === 0"
              [title]="'Show completed courses' | t"
              (click)="toggleStatPanel('completed')"
            >
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">task_alt</mat-icon>
              <span class="block text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.completed().length }}</span>
              <span class="flex items-center justify-center text-[10px] text-slate-500 sm:text-xs">
                {{ 'Completed' | t }}
                @if (store.completed().length) {
                  <mat-icon class="max-sm:!hidden !h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ statPanel() === 'completed' ? 'expand_less' : 'expand_more' }}</mat-icon>
                }
              </span>
            </button>
            <button
              type="button"
              class="rounded-2xl border bg-white p-2 text-center transition hover:border-[#007979]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:cursor-default disabled:hover:border-slate-200 sm:p-4"
              [style.border-color]="statPanel() === 'skills' ? '#007979' : '#e2e8f0'"
              [style.background-color]="statPanel() === 'skills' ? '#f0f9f9' : '#ffffff'"
              [attr.aria-expanded]="statPanel() === 'skills'"
              aria-controls="stat-panel"
              [disabled]="store.skillsEarned() === 0"
              [title]="'Show skills earned' | t"
              (click)="toggleStatPanel('skills')"
            >
              <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">military_tech</mat-icon>
              <span class="block text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ store.skillsEarned() }}</span>
              <span class="flex items-center justify-center text-[10px] text-slate-500 sm:text-xs">
                {{ 'Skills earned' | t }}
                @if (store.skillsEarned()) {
                  <mat-icon class="max-sm:!hidden !h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ statPanel() === 'skills' ? 'expand_less' : 'expand_more' }}</mat-icon>
                }
              </span>
            </button>
            @if (quizzesAvailable()) {
              <button
                type="button"
                class="rounded-2xl border bg-white p-2 text-center transition hover:border-[#007979]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:cursor-default disabled:hover:border-slate-200 sm:p-4"
                [style.border-color]="statPanel() === 'quizzes' ? '#007979' : '#e2e8f0'"
                [style.background-color]="statPanel() === 'quizzes' ? '#f0f9f9' : '#ffffff'"
                [attr.aria-expanded]="statPanel() === 'quizzes'"
                aria-controls="stat-panel"
                [disabled]="quizOverview().attempts === 0"
                [title]="'Show your quizzes' | t"
                (click)="toggleStatPanel('quizzes')"
              >
                <mat-icon class="max-sm:!hidden text-[#007979]" aria-hidden="true">quiz</mat-icon>
                <span class="block text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{{ quizOverview().quizzes }}</span>
                <span class="flex items-center justify-center text-[10px] text-slate-500 sm:text-xs">
                  {{ 'Quizzes' | t }}
                  @if (quizOverview().attempts) {
                    <mat-icon class="max-sm:!hidden !h-4 !w-4 !text-[16px] !leading-none" aria-hidden="true">{{ statPanel() === 'quizzes' ? 'expand_less' : 'expand_more' }}</mat-icon>
                  }
                </span>
                @if (quizOverview().average !== null) {
                  <span class="block text-[10px] tabular-nums text-slate-400 sm:text-xs">{{ 'avg {0}%' | t: [quizOverview().average] }}</span>
                }
              </button>
            }
          </section>

          @if (statPanel(); as panel) {
            <section id="stat-panel" class="mt-2 rounded-2xl border border-[#007979]/30 bg-white p-4" [attr.aria-label]="(panel === 'skills' ? 'Skills earned' : panel === 'quizzes' ? 'Quizzes' : 'Completed courses') | t">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h2 class="font-semibold text-slate-900">
                  @if (panel === 'skills') {
                    {{ 'Skills you earned ({0})' | t: [earnedSkills().length] }}
                  } @else if (panel === 'quizzes') {
                    {{ 'Your quizzes ({0})' | t: [quizSummaries().length] }}
                  } @else {
                    {{ 'Courses you completed ({0})' | t: [store.completed().length] }}
                  }
                </h2>
                <button
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                  [attr.aria-label]="'Close' | t"
                  (click)="statPanel.set(null)"
                >
                  <mat-icon aria-hidden="true">close</mat-icon>
                </button>
              </div>

              @if (panel === 'skills') {
                <p class="mb-3 text-xs text-slate-500">{{ 'From the courses you completed. Tap a skill to see where you learned it.' | t }}</p>
                <ul class="flex flex-wrap gap-1.5">
                  @for (skill of earnedSkills(); track skill.name) {
                    <li>
                      <button
                        type="button"
                        class="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium text-[#00605f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                        [style.background-color]="openSkill() === skill.name ? '#ccebea' : '#f0f9f9'"
                        [style.border-color]="openSkill() === skill.name ? '#007979' : '#cfe9e8'"
                        [attr.aria-expanded]="openSkill() === skill.name"
                        (click)="openSkill.set(openSkill() === skill.name ? null : skill.name)"
                      >
                        {{ skill.name }}
                        @if (skill.courses.length > 1) {
                          <span class="tabular-nums text-slate-500">{{ skill.courses.length }}</span>
                        }
                      </button>
                    </li>
                  }
                </ul>
                @if (openSkillDetails(); as detail) {
                  <div class="mt-3 rounded-xl bg-slate-50 p-3">
                    <p class="text-xs font-semibold text-slate-700">{{ 'Learned in' | t }}</p>
                    <ul class="mt-1 flex flex-col gap-1">
                      @for (record of detail.courses; track record.id) {
                        <li>
                          <a [routerLink]="linkFor(record)" class="break-words text-sm font-medium text-[#007979] hover:underline [overflow-wrap:anywhere]">{{ record.courseTitle }}</a>
                        </li>
                      }
                    </ul>
                  </div>
                }
              } @else if (panel === 'quizzes') {
                <p class="mb-3 text-xs text-slate-500">
                  {{ (quizOverview().attempts === 1 ? '1 attempt' : '{0} attempts') | t: [quizOverview().attempts] }}
                  · {{ 'average score {0}%' | t: [quizOverview().average ?? 0] }}
                  · {{ (context.organizationId ? 'Results from this organization' : 'Results from Zebron') | t }}
                </p>

                <ul class="flex flex-col divide-y divide-slate-100">
                  @for (quiz of visibleQuizzes(); track quiz.quizId) {
                    <li class="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="flex flex-wrap items-center gap-1.5">
                          <span class="break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ quiz.quizName || ('Quiz' | t) }}</span>
                          @if (quiz.source === 'course') {
                            <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{{ 'Course exam' | t }}</span>
                          } @else if (quiz.source === 'certification') {
                            <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{{ 'Certification exam' | t }}</span>
                          } @else if (quiz.hasExam) {
                            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{{ 'Exam' | t }}</span>
                          }
                        </p>
                        <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                          <span>{{ 'Best {0}%' | t: [quiz.best] }}</span>
                          <span aria-hidden="true">·</span>
                          <span class="inline-flex items-center">
                            {{ 'Latest {0}%' | t: [quiz.latest] }}
                            @if (quiz.trend === 'up') {
                              <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none text-emerald-600" [attr.aria-label]="'Improving' | t">trending_up</mat-icon>
                            } @else if (quiz.trend === 'down') {
                              <mat-icon class="!h-4 !w-4 !text-[16px] !leading-none text-rose-600" [attr.aria-label]="'Dropping' | t">trending_down</mat-icon>
                            }
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{{ (quiz.attempts === 1 ? '1 attempt' : '{0} attempts') | t: [quiz.attempts] }}</span>
                          @if (quiz.lastTaken) {
                            <span aria-hidden="true">·</span>
                            <span>{{ shortDate(quiz.lastTaken) }}</span>
                          }
                        </p>
                      </div>
                      @if (quizPracticeLink(quiz.quizId); as link) {
                        <a
                          [routerLink]="link"
                          class="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50 sm:self-auto"
                        >
                          {{ 'Practice again' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                        </a>
                      } @else if (quiz.courseId) {
                        <a
                          [routerLink]="context.basePath + '/' + quiz.courseId"
                          class="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50 sm:self-auto"
                        >
                          {{ 'Open course' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                        </a>
                      }
                    </li>
                  }
                </ul>
                @if (quizSummaries().length > quizFirstPage) {
                  <button
                    type="button"
                    class="mt-2 text-sm font-semibold text-[#007979] hover:underline"
                    (click)="showAllQuizzes.set(!showAllQuizzes())"
                  >
                    {{ (showAllQuizzes() ? 'Show fewer' : 'Show all ({0})') | t: [quizSummaries().length] }}
                  </button>
                }

                @if (reviewTopics().length) {
                  <div class="mt-4 rounded-xl bg-amber-50/60 p-3">
                    <h3 class="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px] text-amber-600" aria-hidden="true">psychology_alt</mat-icon>
                      {{ 'Topics to review' | t }}
                    </h3>
                    <p class="mt-0.5 text-xs text-slate-500">{{ 'Your lowest-scoring topics across all attempts.' | t }}</p>
                    <ul class="mt-2 flex flex-col gap-1.5">
                      @for (topic of reviewTopics(); track topic.quizId + topic.topicId) {
                        <li class="flex items-center gap-3">
                          <span class="min-w-0 flex-1">
                            <span class="block break-words text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">{{ topic.topicName }}</span>
                            <span class="block truncate text-xs text-slate-500">{{ topic.quizName }} · {{ '{0} of {1} right' | t: [topic.correct, topic.answered] }}</span>
                          </span>
                          <span class="shrink-0 text-sm font-bold tabular-nums" [style.color]="topic.percentage < 50 ? '#be123c' : '#b45309'">{{ topic.percentage }}%</span>
                          @if (quizPracticeLink(topic.quizId); as link) {
                            <a
                              [routerLink]="link"
                              class="shrink-0 text-xs font-semibold text-[#007979] hover:underline"
                              [attr.aria-label]="'Practice {0}' | t: [topic.topicName]"
                            >
                              {{ 'Practice' | t }}
                            </a>
                          }
                        </li>
                      }
                    </ul>
                  </div>
                }
              } @else {
                <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  @for (record of completedSorted(); track record.id) {
                    <li>
                      <a [routerLink]="linkFor(record)" class="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 p-2.5 transition hover:border-[#007979] hover:bg-teal-50/40">
                        <span class="mt-0.5 h-10 w-10 shrink-0 rounded-lg" [style.background]="coverOf(record)" aria-hidden="true"></span>
                        <span class="min-w-0 flex-1">
                          <span class="block break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">{{ record.courseTitle }}</span>
                          @if (record.completedAt) {
                            <span class="block text-xs text-slate-500">{{ 'Completed {0}' | t: [shortDate(record.completedAt.toDate())] }}</span>
                          }
                          @if (record.skills.length) {
                            <span class="mt-1 flex flex-wrap gap-1">
                              @for (skill of record.skills.slice(0, 4); track skill) {
                                <span class="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-[#00605f]">{{ skill }}</span>
                              }
                              @if (record.skills.length > 4) {
                                <span class="px-1 text-[11px] text-slate-500">+{{ record.skills.length - 4 }}</span>
                              }
                            </span>
                          }
                        </span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </section>
          }

          @if (otherInProgress().length) {
            <div class="mb-3 mt-8 flex items-baseline justify-between gap-3">
              <h2 class="text-lg font-semibold text-slate-900">{{ 'In progress' | t }}</h2>
              <span class="text-sm text-slate-500">{{ 'Pick up where you left off' | t }}</span>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (record of otherInProgress(); track record.id) {
                <div class="relative">
                <a
                  [routerLink]="linkFor(record)"
                  class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 pr-11 transition hover:shadow-md"
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
                <button
                  type="button"
                  (click)="remove(record)"
                  class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  [attr.aria-label]="'Remove {0} from My learning' | t: [record.courseTitle]"
                  [title]="'Remove from My learning. Your progress is kept.' | t"
                >
                  <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
                </button>
                </div>
              }
            </div>
          }

          @if (lastRemoved(); as removedRecord) {
            <div class="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white" role="status" aria-live="polite">
              <span class="min-w-0 flex-1">{{ '{0} was removed from My learning.' | t: [removedRecord.courseTitle] }}</span>
              <button type="button" (click)="restore(removedRecord)" class="font-semibold text-teal-200 underline">{{ 'Undo' | t }}</button>
            </div>
          }
          @if (removeError()) {
            <p class="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ removeError()! | t }}</p>
          }

          @if (store.removed().length) {
            <div class="mt-4">
              <button
                type="button"
                (click)="showRemoved.set(!showRemoved())"
                class="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#007979]"
                [attr.aria-expanded]="showRemoved()"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ showRemoved() ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ 'Removed courses ({0})' | t: [store.removed().length] }}
              </button>
              @if (showRemoved()) {
                <ul class="mt-2 flex flex-col gap-2">
                  @for (record of store.removed(); track record.id) {
                    <li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <span class="h-10 w-10 shrink-0 rounded-lg opacity-60" [style.background]="coverOf(record)" aria-hidden="true"></span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-slate-700">{{ record.courseTitle }}</span>
                        <span class="block text-xs text-slate-500">{{ '{percent}% complete' | t: { percent: record.percent } }}</span>
                      </span>
                      <button type="button" (click)="restore(record)" class="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-[#007979] hover:bg-teal-50">
                        {{ 'Put back' | t }}
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>
          }

          <!-- Highlights, notes and bookmarks from every course (features/courses/annotations) -->
          <app-my-notes-summary [context]="context" [offeredZebron]="offeredZebron()" />
        }

        <div class="mb-3 mt-8 flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ 'Recommended for you' | t }}</h2>
          <a [routerLink]="context.basePath + '/catalog'" class="text-sm font-semibold text-[#007979] hover:underline">{{ 'See all courses' | t }}</a>
        </div>

        @if (store.catalogLoading() && !store.catalog().length) {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (store.catalogError()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ store.catalogError()! | t }}</p>
        } @else if (store.recommended().length) {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (course of store.recommended(); track course.id + (course.organizationId ?? '')) {
              <div class="relative">
                <app-course-card [course]="course" [link]="context.basePath + '/' + course.id" />
                @if (signedIn()) {
                  <!-- Sits on the cover, over the card link (a separate button, not inside the link) -->
                  <button
                    type="button"
                    (click)="dismissRecommendation(course)"
                    class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007979]/50"
                    [attr.aria-label]="'Not interested in {0}' | t: [course.title]"
                    [title]="'Not interested' | t"
                  >
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">close</mat-icon>
                  </button>
                }
              </div>
            }
          </div>
        } @else if (store.catalogLoaded()) {
          <p class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {{ store.catalog().length ? ('No more recommendations. Browse the catalog for more courses.' | t) : ('No courses are published yet. Check back soon.' | t) }}
          </p>
        }

        @if (lastDismissed(); as dismissed) {
          <div class="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white" role="status" aria-live="polite">
            <span class="min-w-0 flex-1">{{ '{0} was removed from your recommendations.' | t: [dismissed.title] }}</span>
            <button type="button" (click)="restoreRecommendation(dismissed)" class="font-semibold text-teal-200 underline">{{ 'Undo' | t }}</button>
          </div>
        }
        @if (dismissError()) {
          <p class="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ dismissError()! | t }}</p>
        }

        @if (signedIn() && store.dismissedRecommendations().length) {
          <div class="mt-4">
            <button
              type="button"
              (click)="showDismissed.set(!showDismissed())"
              class="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#007979]"
              [attr.aria-expanded]="showDismissed()"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ showDismissed() ? 'expand_less' : 'expand_more' }}</mat-icon>
              {{ 'Hidden recommendations ({0})' | t: [store.dismissedRecommendations().length] }}
            </button>
            @if (showDismissed()) {
              <ul class="mt-2 flex flex-col gap-2">
                @for (course of store.dismissedRecommendations(); track course.id + (course.organizationId ?? '')) {
                  <li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span class="h-10 w-10 shrink-0 rounded-lg opacity-60" [style.background]="coverName(course.cover)" aria-hidden="true"></span>
                    <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{{ course.title }}</span>
                    <button type="button" (click)="restoreRecommendation(course)" class="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-[#007979] hover:bg-teal-50">
                      {{ 'Show again' | t }}
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
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
      return `${courseLink(record, this.context, this.offeredZebron())}/summary`;
    }

    const lesson = this.nextLesson();
    return lesson ? `${courseLink(record, this.context, this.offeredZebron())}/lessons/${lesson.id}` : courseLink(record, this.context, this.offeredZebron());
  });

  protected readonly otherInProgress = computed(() => this.store.inProgress().slice(1));

  // ---------- Removing courses from My learning ----------
  protected readonly lastRemoved = signal<CourseProgress | null>(null);
  protected readonly removeError = signal<string | null>(null);
  protected readonly showRemoved = signal(false);

  /** Hide an unfinished course. Progress is kept; continuing the course brings it back. */
  protected async remove(record: CourseProgress): Promise<void> {
    this.removeError.set(null);
    try {
      await this.store.hideCourse(record.id);
      this.lastRemoved.set(record);
    } catch (error) {
      this.removeError.set((error as Error).message);
    }
  }

  // ---------- Dismissing recommendations (same hidden list as removed courses) ----------
  protected readonly lastDismissed = signal<Course | null>(null);
  protected readonly dismissError = signal<string | null>(null);
  protected readonly showDismissed = signal(false);

  protected async dismissRecommendation(course: Course): Promise<void> {
    this.dismissError.set(null);
    try {
      await this.store.hideCourse(progressId(course));
      this.lastDismissed.set(course);
    } catch (error) {
      this.dismissError.set((error as Error).message);
    }
  }

  protected async restoreRecommendation(course: Course): Promise<void> {
    this.dismissError.set(null);
    try {
      await this.store.unhideCourse(progressId(course));
      if (this.lastDismissed() === course) {
        this.lastDismissed.set(null);
      }
    } catch (error) {
      this.dismissError.set((error as Error).message);
    }
  }

  protected async restore(record: CourseProgress): Promise<void> {
    this.removeError.set(null);
    try {
      await this.store.unhideCourse(record.id);
      if (this.lastRemoved()?.id === record.id) {
        this.lastRemoved.set(null);
      }
    } catch (error) {
      this.removeError.set((error as Error).message);
    }
  }

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

  // Zebron courses this organization offers (null on Zebron's pages, or until loaded).
  private readonly offeredCourseService = inject(CourseService);
  protected readonly offeredZebron = signal<Set<string> | null>(null);

  private loadOfferedZebron(): void {
    const organizationId = this.context.organizationId;
    if (!organizationId) return;
    this.offeredCourseService
      .getEnabledPlatformCourseIds(organizationId)
      .then((ids) => this.offeredZebron.set(ids))
      .catch(() => this.offeredZebron.set(new Set()));
  }

  constructor() {
    this.loadOfferedZebron();
    this.store.setContext(this.context);
    void this.store.loadCatalog();

    // Progress belongs to the signed-in learner: reload when that changes.
    effect(() => {
      const user = this.auth.firebaseUser();
      untracked(() => {
        void this.store.loadProgress();
        void this.loadAssignments(user?.uid ?? null);
        void this.loadMyGroups(user?.uid ?? null);
        void this.loadCareerPlan(user?.uid ?? null);
        void this.loadQuizResults(user?.uid ?? null);
      });
    });
  }

  /** Courses whose final exam is passed (same rule as the Certificates page). No extra reads. */
  protected readonly certificateCount = computed(
    () => this.store.completed().filter((record) => hasCertificate(record, this.store.exams()[record.id])).length,
  );

  // ---------- Career path (Zebron Learning only; replaces the Career paths tab) ----------
  private readonly careers = inject(CareerPathService);
  /** The learner's most recently updated career plan, if any. */
  protected readonly careerPlan = signal<CareerPlan | null>(null);
  protected readonly showCareerCard = computed(() => this.context.basePath === '/courses');

  private async loadCareerPlan(userId: string | null): Promise<void> {
    if (!userId || this.context.basePath !== '/courses') {
      this.careerPlan.set(null);
      return;
    }
    try {
      this.careerPlan.set((await this.careers.listPlans(userId))[0] ?? null);
    } catch {
      this.careerPlan.set(null);
    }
  }

  // ---------- Training groups (organization pages) ----------
  private readonly trainingGroups = inject(TrainingGroupService);
  protected readonly myGroups = signal<TrainingGroup[]>([]);

  /** The learner's own groups; none without Training Groups (or on Zebron's pages). */
  private async loadMyGroups(userId: string | null): Promise<void> {
    const organizationId = this.context.organizationId;
    if (!organizationId || !userId) {
      this.myGroups.set([]);
      return;
    }
    try {
      this.myGroups.set(
        (await this.trainingGroups.listMine(organizationId, userId)).filter((group) => group.manualStatus !== 'cancelled'),
      );
    } catch {
      this.myGroups.set([]);
    }
    await this.loadMyWork(organizationId, userId);
  }

  // ---------- Assignments and projects in the learner's groups ----------
  private readonly groupAssignments = inject(TrainingGroupAssignmentService);
  private readonly myWork = signal<MyAssignment[]>([]);
  /** Not complete yet: to hand in, waiting for review, or sent back. Soonest due first. */
  protected readonly openWork = computed(() =>
    this.myWork()
      .filter((entry) => entry.submission?.status !== 'complete')
      .sort((a, b) => (a.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 8),
  );

  private async loadMyWork(organizationId: string, userId: string): Promise<void> {
    const groups = this.myGroups();
    if (!groups.length) {
      this.myWork.set([]);
      return;
    }
    try {
      this.myWork.set(await this.groupAssignments.listMineAcrossGroups(organizationId, userId, groups));
    } catch {
      this.myWork.set([]);
    }
  }

  protected workBadge(entry: MyAssignment): { label: string; classes: string } {
    return SUBMISSION_STATUS_LABELS[entry.submission?.status ?? 'not_submitted'];
  }

  protected workOverdue(entry: MyAssignment): boolean {
    return !entry.submission && !!entry.assignment.dueAt && entry.assignment.dueAt.getTime() < Date.now();
  }

  protected dueLabel(date: Date): string {
    return date.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  protected groupBadge(group: TrainingGroup): { label: string; classes: string } {
    return STATUS_LABELS[groupStatus(group)];
  }

  protected groupDates(group: TrainingGroup): string {
    const format = (date: Date) => date.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!group.startDate && !group.endDate) {
      return '';
    }
    return `${group.startDate ? format(group.startDate) : '…'} – ${group.endDate ? format(group.endDate) : '…'}`;
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

  // ---------- Completed and Skills earned: click a stat to list them ----------
  protected readonly statPanel = signal<'completed' | 'skills' | 'quizzes' | null>(null);
  protected readonly openSkill = signal<string | null>(null);

  protected toggleStatPanel(panel: 'completed' | 'skills' | 'quizzes'): void {
    this.statPanel.update((open) => (open === panel ? null : panel));
    this.openSkill.set(null);
  }

  /** Completed courses, most recently completed first. */
  protected readonly completedSorted = computed(() =>
    [...this.store.completed()].sort(
      (a, b) => (b.completedAt?.toMillis() ?? b.updatedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? a.updatedAt?.toMillis() ?? 0),
    ),
  );

  /** Every skill from a completed course (the same set the Skills earned count uses), A to Z, with the courses that taught it. */
  protected readonly earnedSkills = computed(() => {
    const bySkill = new Map<string, CourseProgress[]>();
    for (const record of this.completedSorted()) {
      for (const skill of new Set(record.skills)) {
        bySkill.set(skill, [...(bySkill.get(skill) ?? []), record]);
      }
    }
    return [...bySkill.entries()]
      .map(([name, courses]) => ({ name, courses }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  });

  protected readonly openSkillDetails = computed(() => {
    const name = this.openSkill();
    return name ? this.earnedSkills().find((skill) => skill.name === name) ?? null : null;
  });

  protected shortDate(date: Date): string {
    return date.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- Quizzes: the learner's own results here (quiz-tracking.ts) ----------
  // On an organization's pages only that organization's results; on /courses only Zebron's.
  private readonly quizService = inject(QuizService);
  private readonly logger = inject(LoggerService);
  private readonly quizResults = signal<QuizResultLike[]>([]);
  /** False when results can't be read here (for example the organization has no Test Center). */
  protected readonly quizzesAvailable = signal(false);
  private readonly practiceSlugs = signal<Map<string, string>>(new Map());
  protected readonly showAllQuizzes = signal(false);
  protected readonly quizFirstPage = 8;

  protected readonly quizOverview = computed(() => quizOverview(this.quizResults()));
  protected readonly quizSummaries = computed(() => summarizeQuizzes(this.quizResults()));
  protected readonly visibleQuizzes = computed(() =>
    this.showAllQuizzes() ? this.quizSummaries() : this.quizSummaries().slice(0, this.quizFirstPage),
  );
  protected readonly reviewTopics = computed(() => topicsToReview(this.quizResults()));

  /** The quiz's page in this Test Center, when the learner can practise it here (not exam-only quizzes). */
  protected quizPracticeLink(quizId: string): string | null {
    const slug = this.practiceSlugs().get(quizId);
    if (!slug) return null;
    const organizationId = this.context.organizationId;
    const base = organizationId ? `/partner/org/${organizationId}/learn/test-center` : '/test-center';
    return `${base}/quiz-details/${encodeURIComponent(slug)}`;
  }

  private async loadQuizResults(userId: string | null): Promise<void> {
    this.quizResults.set([]);
    this.practiceSlugs.set(new Map());
    this.quizzesAvailable.set(false);
    if (!userId) return;
    const organizationId = this.context.organizationId;
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, 'quizResults'),
          where('userId', '==', userId),
          where('organizationId', '==', organizationId),
          limit(1000),
        ),
      );
      if (this.auth.firebaseUser()?.uid !== userId) return;
      this.quizResults.set(snapshot.docs.map((item) => toQuizResult(item.id, item.data())));
      this.quizzesAvailable.set(true);
    } catch (error) {
      // No Test Center here, or results can't be read: the card stays hidden.
      this.logger.error('MyLearning', 'Could not load quiz results.', error);
      return;
    }
    try {
      const quizzes = await this.quizService.getQuizzesForLearners(organizationId);
      this.practiceSlugs.set(
        new Map(quizzes.filter((quiz) => !quiz.examOnly && quiz.slug).map((quiz) => [quiz.id, quiz.slug])),
      );
    } catch {
      // Practice links are extra; the list still shows.
    }
  }

  protected linkFor(record: CourseProgress): string {
    return courseLink(record, this.context, this.offeredZebron());
  }

  protected coverOf(record: CourseProgress): string {
    return COURSE_COVERS[record.cover] ?? COURSE_COVERS.teal;
  }

  protected search(query: string): void {
    this.store.setQuery(query);
    void this.router.navigate([this.context.basePath, 'catalog']);
  }
}
