import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';
import { downloadCsv } from '../../shared/csv-download';
import { CourseAssignmentService, TeamAssignmentRow, dueDateFromInput } from '../courses/course-assignment.service';
import { Course } from '../courses/course.model';
import { CourseService } from '../courses/course.service';
import { OrganizationContextStore } from '../organizations/stores/organization-context.store';
import { PartnerMemberService } from '../partner/services/partner-member.service';
import { GroupStaffOption, TrainingGroupFormComponent } from './training-group-form.component';
import { loadStaffOptions } from './training-groups.component';
import { TrainingGroupPdfService } from './training-group-pdf.service';
import {
  DELIVERY_MODES,
  ENROLLMENT_MODES,
  EnrollmentLogEntry,
  JoinRequest,
  REQUEST_STATUS_LABELS,
  ARCHIVE_AFTER_DAYS,
  ROLE_LABELS,
  STATUS_LABELS,
  TrainingGroup,
  TrainingGroupCourse,
  TrainingGroupMember,
  TrainingGroupService,
  TrainingGroupSummary,
  groupStatus,
  isArchived,
  isLocked,
} from './training-group.service';

/** The group course dialog: a new course, or changes to one already given. */
interface CourseDraft {
  existing: TrainingGroupCourse | null;
  courseId: string;
  lessonId: string;
  due: string;
  required: boolean;
  note: string;
}

interface CourseProgressCount {
  total: number;
  done: number;
  overdue: number;
}

interface AddCandidate {
  userId: string;
  name: string;
  email: string;
  role: string;
}

/**
 * One training group: its details, leads and instructors, and its members.
 *
 * - Owners and admins, and managers who lead the group: edit it, add and
 *   withdraw members. Owners and admins delete an empty group.
 * - Managers, and the group's leads and instructors: see the roster and
 *   export it.
 * - Courses: owners, admins and the group's manager leads assign courses to
 *   the whole group (manageTrainingGroupCourses); members see the list.
 * - Members: the group's details and its courses.
 *
 * Route: /partner/org/:organizationId/training-groups/:groupId
 */
@Component({
  selector: 'app-training-group-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatIconModule, TranslatePipe, TrainingGroupFormComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 sm:flex-wrap sm:gap-3 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'training-groups']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Training Groups' | t"
            [title]="'Training Groups' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-white/75">{{ 'Cohort' | t }}</p>
            <h1 class="truncate text-xl font-semibold">{{ group()?.name ?? ('Training group' | t) }}</h1>
          </div>
          @if (group() && canSeeRoster()) {
            <button
              type="button"
              (click)="downloadPdf()"
              [disabled]="pdfBusy()"
              [attr.aria-label]="(pdfBusy() ? 'Preparing…' : 'Download PDF') | t"
              [title]="'Download PDF' | t"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white text-sm sm:w-auto sm:px-3 font-semibold text-[#007979] hover:bg-white/90 disabled:opacity-60"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">picture_as_pdf</mat-icon>
              <span class="hidden sm:inline">{{ (pdfBusy() ? 'Preparing…' : 'Download PDF') | t }}</span>
            </button>
          }
          @if (group() && canEdit() && (!locked() || access.isAdmin())) {
            <button
              type="button"
              (click)="openEdit()"
              [attr.aria-label]="'Edit' | t"
              [title]="'Edit' | t"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/40 text-sm sm:w-auto sm:px-3 font-semibold text-white hover:bg-white/15"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">edit</mat-icon>
              <span class="hidden sm:inline">{{ 'Edit' | t }}</span>
            </button>
          }
        </div>
      </header>

      <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ error() | t }}</p>
        }
        @if (notice()) {
          <p class="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800" role="status">{{ notice()!.text | t: notice()!.args }}</p>
        }

        @if (loading()) {
          <div class="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-hidden="true"></div>
        } @else if (!group()) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p class="font-semibold text-slate-900">{{ 'This training group is not available.' | t }}</p>
            <a [routerLink]="['/partner/org', organizationId, 'training-groups']" class="mt-3 inline-block text-sm font-semibold text-[#007979] underline">{{ 'Back to Training Groups' | t }}</a>
          </div>
        } @else {
          @let current = group()!;
          <!-- Details -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="status().classes">{{ status().label | t }}</span>
              @if (current.programName) {
                <span class="text-sm text-slate-600">{{ current.programName }}</span>
              }
            </div>
            @if (current.description) {
              <p class="mt-3 whitespace-pre-line text-sm text-slate-700">{{ current.description }}</p>
            }
            <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt class="text-xs text-slate-500">{{ 'Dates' | t }}</dt>
                <dd class="font-medium text-slate-900">
                  @if (current.startDate || current.endDate) {
                    {{ current.startDate ? (current.startDate | date: 'mediumDate') : '…' }} – {{ current.endDate ? (current.endDate | date: 'mediumDate') : '…' }}
                  } @else {
                    {{ 'Not set' | t }}
                  }
                </dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">{{ 'Delivery' | t }}</dt>
                <dd class="font-medium text-slate-900">{{ delivery().label | t }}{{ current.location ? ' · ' + current.location : '' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">{{ 'Members' | t }}</dt>
                <dd class="font-medium text-slate-900">
                  {{ current.memberCount }}{{ current.capacity ? ' / ' + current.capacity : '' }}
                  @if (current.capacity && current.memberCount >= current.capacity) {
                    <span class="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">{{ 'Full' | t }}</span>
                  }
                </dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">{{ 'Leads · Instructors' | t }}</dt>
                <dd class="font-medium text-slate-900">
                  {{ namesOf(current.leadIds) || '—' }} · {{ namesOf(current.instructorIds) || '—' }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Ended: locked (and archived after a while) until an admin reopens it -->
          @if (locked()) {
            <div class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900" role="status">
              <mat-icon aria-hidden="true">lock</mat-icon>
              <span class="min-w-0 flex-1">
                {{ (archived() ? 'This group ended and is archived: it no longer appears in group filters or on My learning. Members and courses cannot change.' : 'This group ended and is locked: members and courses cannot change. It will be archived {0} days after the end date.') | t: [archiveDays] }}
              </span>
              @if (access.isAdmin()) {
                <button type="button" (click)="setReopened(true)" [disabled]="busy()" class="h-9 rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50">{{ 'Reopen' | t }}</button>
              }
            </div>
          } @else if (current.reopened && status().label === 'Completed') {
            <div class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              <mat-icon aria-hidden="true">lock_open</mat-icon>
              <span class="min-w-0 flex-1">{{ 'This group ended but was reopened, so members and courses can change.' | t }}</span>
              @if (access.isAdmin()) {
                <button type="button" (click)="setReopened(false)" [disabled]="busy()" class="h-9 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">{{ 'Lock again' | t }}</button>
              }
            </div>
          }

          <!-- Completion summary -->
          @if (canSeeRoster() && (summary() || status().label === 'Completed')) {
            <section class="mt-5 rounded-2xl border border-slate-200 bg-white" aria-labelledby="summary-title">
              <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <h2 id="summary-title" class="text-base font-semibold text-slate-900">{{ 'Completion summary' | t }}</h2>
                @if (summary()?.generatedAt; as at) {
                  <span class="text-xs text-slate-500">{{ 'Built {0}' | t: [at | date: 'medium'] }}</span>
                }
                <span class="ml-auto flex gap-2">
                  @if (summary()) {
                    <button type="button" (click)="exportSummary()" class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>
                      {{ 'CSV' | t }}
                    </button>
                  }
                  <button type="button" (click)="refreshSummary()" [disabled]="summaryBusy()" class="inline-flex h-9 items-center gap-1 rounded-lg border border-[#007979] px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50 disabled:opacity-50">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">refresh</mat-icon>
                    {{ (summaryBusy() ? 'Building…' : summary() ? 'Rebuild' : 'Build now') | t }}
                  </button>
                </span>
              </div>
              @if (summary(); as report) {
                <div class="px-5 py-4">
                  <p class="text-sm text-slate-700">
                    {{ '{0} of {1} members finished every group course.' | t: [report.finishedAll, report.memberCount] }}
                    @if (report.truncated) {
                      <span class="text-xs text-slate-500">{{ '(The first 2,000 members are listed.)' | t }}</span>
                    }
                  </p>
                  @if (report.courses.length) {
                    <ul class="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                      @for (course of report.courses; track course.key) {
                        <li class="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                          <span class="min-w-0 flex-1 truncate font-medium text-slate-900">{{ course.courseTitle }}{{ course.lessonTitle ? ' · ' + course.lessonTitle : '' }}</span>
                          <span class="rounded-full bg-emerald-100 px-2 text-xs font-semibold text-emerald-800">{{ '{0} done' | t: [course.done] }}</span>
                          <span class="rounded-full bg-sky-100 px-2 text-xs font-semibold text-sky-800">{{ '{0} in progress' | t: [course.inProgress] }}</span>
                          <span class="rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700">{{ '{0} not started' | t: [course.notStarted] }}</span>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="mt-2 text-sm text-slate-500">{{ 'No courses were assigned to this group.' | t }}</p>
                  }
                </div>
              } @else {
                <p class="px-5 py-4 text-sm text-slate-600">{{ 'The summary is built automatically the day after the group ends. Build it now to see it straight away.' | t }}</p>
              }
            </section>
          }

          <!-- Courses given to the whole group -->
          @if (hasCourses() && (courses().length || canManageMembers())) {
            <section class="mt-5 rounded-2xl border border-slate-200 bg-white" aria-labelledby="group-courses-title">
              <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <h2 id="group-courses-title" class="text-base font-semibold text-slate-900">{{ 'Courses' | t }}</h2>
                <span class="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{{ courses().length }}</span>
                @if (canManageMembers() && !locked() && status().label !== 'Cancelled') {
                  <button type="button" (click)="openCourse(null)" class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">assignment_add</mat-icon>
                    {{ 'Assign a course' | t }}
                  </button>
                }
              </div>
              @if (coursesLoading()) {
                <p class="px-5 py-4 text-sm text-slate-500">{{ 'Loading courses…' | t }}</p>
              } @else if (!courses().length) {
                <p class="px-5 py-6 text-center text-sm text-slate-600">{{ 'No courses yet. Courses you assign here go to everyone in the group, including people who join later.' | t }}</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (item of courses(); track item.key) {
                    <li class="flex items-center gap-3 px-5 py-3 sm:flex-wrap">
                      <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">{{ item.lessonId ? 'article' : 'school' }}</mat-icon>
                      <span class="min-w-0 flex-1">
                        <a [routerLink]="['/partner/org', organizationId, 'courses', item.courseId]" class="block truncate text-sm font-semibold text-slate-900 hover:text-[#007979] hover:underline">{{ item.courseTitle }}</a>
                        <span class="block truncate text-xs text-slate-500">
                          {{ item.lessonTitle ? ('Lesson: {0}' | t: [item.lessonTitle]) : ('Whole course' | t) }}
                          <span class="hidden sm:inline">
                            @if (item.dueAt) { · {{ 'Due {0}' | t: [item.dueAt | date: 'mediumDate'] }} }
                            @if (item.required) { · {{ 'Required' | t }} }
                          </span>
                        </span>
                        @if (item.note) {
                          <span class="mt-0.5 block truncate text-xs italic text-slate-500">“{{ item.note }}”</span>
                        }
                      </span>
                      @if (progressFor(item); as count) {
                        <span class="hidden text-xs text-slate-600 sm:inline">
                          {{ '{0} of {1} done' | t: [count.done, count.total] }}
                          @if (count.overdue) {
                            <span class="ml-1 rounded-full bg-rose-100 px-1.5 font-semibold text-rose-800">{{ '{0} overdue' | t: [count.overdue] }}</span>
                          }
                        </span>
                      }
                      @if (canManageMembers() && !locked()) {
                        <span class="flex shrink-0 gap-1">
                          <button type="button" (click)="openCourse(item)" [disabled]="busy()" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 sm:w-auto sm:px-2" [attr.aria-label]="'Change {0}' | t: [item.courseTitle]" [title]="'Change' | t">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] sm:!hidden" aria-hidden="true">edit</mat-icon>
                            <span class="hidden sm:inline">{{ 'Change' | t }}</span>
                          </button>
                          <button type="button" (click)="removeCourse.set(item)" [disabled]="busy()" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 sm:w-auto sm:px-2" [attr.aria-label]="'Remove {0} from the group' | t: [item.courseTitle]" [title]="'Remove' | t">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] sm:!hidden" aria-hidden="true">delete</mat-icon>
                            <span class="hidden sm:inline">{{ 'Remove' | t }}</span>
                          </button>
                        </span>
                      }
                    </li>
                  }
                </ul>
              }
            </section>
          }

          <!-- Enrollment: requests, applications, waitlist (staff) -->
          @if (canSeeRoster() && current.enrollmentMode !== 'invite') {
            <section class="mt-5 rounded-2xl border border-slate-200 bg-white" aria-labelledby="enrollment-title">
              <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <h2 id="enrollment-title" class="text-base font-semibold text-slate-900">{{ 'Enrollment' | t }}</h2>
                <span class="rounded-full bg-teal-50 px-2 text-xs font-semibold text-[#006666]">{{ enrollmentModeLabel(current.enrollmentMode) | t }}</span>
                @if (current.pendingRequests) {
                  <span class="rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-900">{{ '{0} to review' | t: [current.pendingRequests] }}</span>
                }
                @if (current.waitlistCount) {
                  <span class="rounded-full bg-sky-100 px-2 text-xs font-semibold text-sky-900">{{ '{0} waiting' | t: [current.waitlistCount] }}</span>
                }
                <button type="button" (click)="copyJoinLink()" class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">link</mat-icon>
                  {{ 'Copy join link' | t }}
                </button>
              </div>
              <div class="px-5 py-3 text-xs text-slate-500">
                @if (current.enrollmentOpensAt || current.enrollmentClosesAt) {
                  {{ 'Open from {0} to {1}.' | t: [current.enrollmentOpensAt ? (current.enrollmentOpensAt | date: 'mediumDate') : '…', current.enrollmentClosesAt ? (current.enrollmentClosesAt | date: 'mediumDate') : '…'] }}
                }
                {{ (current.enrollmentMode === 'application' ? 'Share the link with prospective learners. Approved applicants receive an organization invitation and join the group when they accept it.' : 'Members can ask to join from Training Groups or with the link.') | t }}
              </div>

              @if (requestsLoading()) {
                <p class="px-5 pb-4 text-sm text-slate-500">{{ 'Loading requests…' | t }}</p>
              } @else {
                <div class="border-t border-slate-100 px-5 py-3">
                  <h3 class="text-sm font-semibold text-slate-900">{{ 'To review' | t }} ({{ pendingRequests().length }})</h3>
                  @for (entry of pendingRequests(); track entry.userId) {
                    <article class="mt-3 rounded-xl border border-slate-200 p-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-semibold text-slate-900">{{ entry.name }}</span>
                        @if (entry.email) { <span class="text-xs text-slate-500">{{ entry.email }}</span> }
                        <span class="rounded-full px-2 text-[11px] font-semibold" [class]="entry.isOrganizationMember ? 'bg-emerald-100 text-emerald-900' : 'bg-violet-100 text-violet-900'">{{ (entry.isOrganizationMember ? 'Member' : 'New to the organization') | t }}</span>
                        @if (entry.createdAt) { <span class="text-xs text-slate-500">{{ entry.createdAt | date: 'medium' }}</span> }
                      </div>
                      @for (item of entry.answers; track $index) {
                        <p class="mt-2 text-xs font-semibold text-slate-600">{{ item.question }}</p>
                        <p class="whitespace-pre-line text-sm text-slate-800">{{ item.answer || '—' }}</p>
                      }
                      @if (canManageMembers() && !locked()) {
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                          <input type="text" maxlength="500" class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" [placeholder]="'Note to the applicant (optional)' | t" [value]="noteFor(entry.userId)" (input)="setDecisionNote(entry.userId, $any($event.target).value)" />
                          <button type="button" (click)="decide(entry, 'approve')" [disabled]="busy()" class="h-9 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">{{ 'Approve' | t }}</button>
                          <button type="button" (click)="decide(entry, 'decline')" [disabled]="busy()" class="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">{{ 'Decline' | t }}</button>
                        </div>
                      }
                    </article>
                  } @empty {
                    <p class="mt-1 text-sm text-slate-500">{{ 'Nothing to review.' | t }}</p>
                  }
                </div>

                @if (waitlist().length) {
                  <div class="border-t border-slate-100 px-5 py-3">
                    <h3 class="text-sm font-semibold text-slate-900">{{ 'Waitlist' | t }} ({{ waitlist().length }})</h3>
                    <ol class="mt-2 space-y-1 text-sm">
                      @for (entry of waitlist(); track entry.userId; let position = $index) {
                        <li class="flex flex-wrap items-center gap-2">
                          <span class="w-6 text-right font-semibold text-slate-500">{{ position + 1 }}.</span>
                          <span class="text-slate-900">{{ entry.name }}</span>
                          @if (!entry.isOrganizationMember) { <span class="text-xs text-slate-500">{{ 'will be invited' | t }}</span> }
                          @if (canManageMembers() && !locked()) {
                            <button type="button" (click)="decide(entry, 'decline')" [disabled]="busy()" class="ml-auto h-8 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700">{{ 'Remove' | t }}</button>
                          }
                        </li>
                      }
                    </ol>
                    <p class="mt-1 text-xs text-slate-500">{{ 'People move up automatically, in this order, when someone is withdrawn.' | t }}</p>
                  </div>
                }

                @if (otherRequests().length) {
                  <details class="border-t border-slate-100 px-5 py-3">
                    <summary class="cursor-pointer text-sm font-semibold text-slate-900">{{ 'Earlier requests' | t }} ({{ otherRequests().length }})</summary>
                    <ul class="mt-2 divide-y divide-slate-100 text-sm">
                      @for (entry of otherRequests(); track entry.userId) {
                        <li class="flex flex-wrap items-center gap-2 py-1.5">
                          <span class="text-slate-900">{{ entry.name }}</span>
                          <span class="rounded-full px-2 text-[11px] font-semibold" [class]="requestBadge(entry).classes">{{ requestBadge(entry).label | t }}</span>
                          @if (entry.decidedAt) { <span class="text-xs text-slate-500">{{ entry.decidedAt | date: 'mediumDate' }}</span> }
                        </li>
                      }
                    </ul>
                  </details>
                }

                @if (enrollmentLog().length) {
                  <details class="border-t border-slate-100 px-5 py-3">
                    <summary class="cursor-pointer text-sm font-semibold text-slate-900">{{ 'Enrollment activity' | t }}</summary>
                    <ul class="mt-2 space-y-1 text-xs text-slate-600">
                      @for (item of enrollmentLog(); track item.id) {
                        <li>
                          <span class="text-slate-500">{{ item.at ? (item.at | date: 'short') : '' }}</span> ·
                          <span class="font-semibold text-slate-800">{{ item.userName }}</span>
                          {{ logLabel(item.action) | t }}
                          @if (item.actorName && item.actorName !== item.userName) { · {{ 'by {0}' | t: [item.actorName] }} }
                          @if (item.note) { <span class="italic">“{{ item.note }}”</span> }
                        </li>
                      }
                    </ul>
                  </details>
                }
              }
            </section>
          }

          <!-- Members -->
          @if (canSeeRoster()) {
            <section class="mt-5 rounded-2xl border border-slate-200 bg-white" aria-labelledby="members-title">
              <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <h2 id="members-title" class="text-base font-semibold text-slate-900">{{ 'Members' | t }}</h2>
                <span class="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{{ members().length }}</span>
                <input
                  type="search"
                  class="ml-auto h-9 w-full rounded-lg border border-slate-300 px-3 text-sm sm:w-56"
                  [placeholder]="'Search members' | t"
                  [value]="memberQuery()"
                  (input)="memberQuery.set($any($event.target).value)"
                />
                @if (members().length) {
                  <button type="button" (click)="exportCsv()" class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>
                    {{ 'CSV' | t }}
                  </button>
                }
                @if (canManageMembers() && !locked() && status().label !== 'Cancelled') {
                  <button type="button" (click)="openAdd()" class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">person_add</mat-icon>
                    {{ 'Add members' | t }}
                  </button>
                }
              </div>

              @if (membersLoading()) {
                <p class="px-5 py-4 text-sm text-slate-500">{{ 'Loading members…' | t }}</p>
              } @else if (!members().length) {
                <p class="px-5 py-6 text-center text-sm text-slate-600">{{ 'No members yet.' | t }}</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (member of shownMembers(); track member.userId) {
                    <li class="flex items-center gap-3 px-5 py-2.5">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-[#006666]" aria-hidden="true">{{ initials(member.name) }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium text-slate-900">{{ member.name }}</span>
                        <span class="block truncate text-xs text-slate-500">
                          {{ member.email ?? '' }}{{ member.enrolledAt ? ' · ' + ('Added {0}' | t: [member.enrolledAt | date: 'mediumDate']) : '' }}
                        </span>
                      </span>
                      @if (canManageMembers() && !locked()) {
                        <button
                          type="button"
                          (click)="withdraw(member)"
                          [disabled]="busy()"
                          class="h-8 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          [attr.aria-label]="'Withdraw {0}' | t: [member.name]"
                        >
                          {{ 'Withdraw' | t }}
                        </button>
                      }
                    </li>
                  }
                </ul>
              }
            </section>
          }

          @if (canDelete()) {
            <div class="mt-6 text-right">
              @if (current.memberCount === 0) {
                <button type="button" (click)="confirmDelete.set(true)" class="text-sm font-semibold text-rose-700 hover:underline">{{ 'Delete this group' | t }}</button>
              } @else {
                <p class="text-xs text-slate-500">{{ 'To delete this group, withdraw its members first.' | t }}</p>
              }
            </div>
          }
        }
      </div>

      <!-- Add members -->
      @if (adding()) {
        <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="adding.set(false)">
          <section
            class="flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            (click)="$event.stopPropagation()"
            (keydown.escape)="adding.set(false)"
          >
            <header class="flex items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3 text-white">
              <div class="min-w-0">
                <h2 id="add-title" class="flex items-center gap-2 text-lg font-semibold">
                  <mat-icon aria-hidden="true">person_add</mat-icon>
                  {{ 'Add members' | t }}
                </h2>
                <p class="truncate text-xs text-white/80">{{ group()?.name }}</p>
              </div>
              <button type="button" (click)="adding.set(false)" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
                <mat-icon>close</mat-icon>
              </button>
            </header>
            <div class="border-b border-slate-200 px-5 py-3">
              <input
                type="search"
                class="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                [placeholder]="'Search by name, email or role' | t"
                [value]="candidateQuery()"
                (input)="candidateQuery.set($any($event.target).value)"
              />
              @if (group()?.capacity) {
                <p class="mt-1 text-xs text-slate-500">{{ '{0} places left.' | t: [placesLeft()] }}</p>
              }
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              @if (candidatesLoading()) {
                <p class="py-3 text-sm text-slate-500">{{ 'Loading people…' | t }}</p>
              } @else if (!shownCandidates().length) {
                <p class="py-3 text-sm text-slate-500">{{ 'Everyone who matches is already in this group.' | t }}</p>
              } @else {
                <ul>
                  @for (person of shownCandidates(); track person.userId) {
                    <li>
                      <label class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                        <input type="checkbox" class="h-4 w-4 shrink-0 accent-[#007979]" [checked]="selected().has(person.userId)" (change)="toggleCandidate(person.userId)" />
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-[#006666]" aria-hidden="true">{{ initials(person.name) }}</span>
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-medium text-slate-900">{{ person.name }}</span>
                          @if (person.email && person.email !== person.name) {
                            <span class="block truncate text-xs text-slate-500">{{ person.email }}</span>
                          }
                        </span>
                        @if (person.role !== 'org_member') {
                          <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{{ roleLabel(person.role) | t }}</span>
                        }
                      </label>
                    </li>
                  }
                </ul>
              }
            </div>
            @if (addError()) {
              <p class="mx-5 mb-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700" role="alert">{{ addError()! | t }}</p>
            }
            <footer class="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
              <span class="text-xs text-slate-500">{{ '{0} selected' | t: [selected().size] }}</span>
              <div class="flex gap-2">
                <button type="button" (click)="adding.set(false)" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Cancel' | t }}</button>
                <button
                  type="button"
                  (click)="addSelected()"
                  [disabled]="!selected().size || busy()"
                  class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ (busy() ? 'Adding…' : 'Add') | t }}
                </button>
              </div>
            </footer>
          </section>
        </div>
      }

      <!-- Assign or change a group course -->
      @if (courseDraft(); as draft) {
        <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="courseDraft.set(null)">
          <section
            class="flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-course-title"
            (click)="$event.stopPropagation()"
            (keydown.escape)="courseDraft.set(null)"
          >
            <header class="flex items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3 text-white">
              <div class="min-w-0">
                <h2 id="group-course-title" class="flex items-center gap-2 text-lg font-semibold">
                  <mat-icon aria-hidden="true">assignment_add</mat-icon>
                  {{ (draft.existing ? 'Change course' : 'Assign a course') | t }}
                </h2>
                <p class="truncate text-xs text-white/80">{{ group()?.name }}</p>
              </div>
              <button type="button" (click)="courseDraft.set(null)" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
                <mat-icon>close</mat-icon>
              </button>
            </header>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              @if (draft.existing) {
                <p class="text-sm font-semibold text-slate-900">
                  {{ draft.existing.courseTitle }}
                  <span class="block text-xs font-normal text-slate-500">{{ draft.existing.lessonTitle ? ('Lesson: {0}' | t: [draft.existing.lessonTitle]) : ('Whole course' | t) }}</span>
                </p>
              } @else {
                <label class="block text-sm">
                  <span class="font-medium text-slate-700">{{ 'Course' | t }}</span>
                  <select
                    class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    [value]="draft.courseId"
                    (change)="patchCourse({ courseId: $any($event.target).value, lessonId: '' })"
                  >
                    <option value="">{{ (catalogLoading() ? 'Loading courses…' : 'Choose a published course') | t }}</option>
                    @for (course of catalog(); track course.id) {
                      <option [value]="course.id">{{ course.title }}</option>
                    }
                  </select>
                  @if (!catalogLoading() && !catalog().length) {
                    <span class="mt-1 block text-xs text-slate-500">{{ 'Your organization has no published courses yet.' | t }}</span>
                  }
                </label>
                @if (chosenCourse(); as course) {
                  <label class="block text-sm">
                    <span class="font-medium text-slate-700">{{ 'What to take' | t }}</span>
                    <select
                      class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      [value]="draft.lessonId"
                      (change)="patchCourse({ lessonId: $any($event.target).value })"
                    >
                      <option value="">{{ 'The whole course' | t }}</option>
                      @for (module of course.modules; track module.id) {
                        <optgroup [label]="module.title">
                          @for (lesson of module.lessons; track lesson.id) {
                            <option [value]="lesson.id">{{ lesson.title }}</option>
                          }
                        </optgroup>
                      }
                    </select>
                    @if (draft.lessonId) {
                      <span class="mt-1 block text-xs text-slate-500">{{ 'A single lesson has no final exam or certificate.' | t }}</span>
                    }
                  </label>
                }
              }
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block text-sm">
                  <span class="font-medium text-slate-700">{{ 'Due date (optional)' | t }}</span>
                  <input type="date" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" [value]="draft.due" (input)="patchCourse({ due: $any($event.target).value })" />
                </label>
                <label class="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                  <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="draft.required" (change)="patchCourse({ required: $any($event.target).checked })" />
                  {{ 'Required' | t }}
                </label>
              </div>
              <label class="block text-sm">
                <span class="font-medium text-slate-700">{{ 'Note to learners (optional)' | t }}</span>
                <input type="text" maxlength="500" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" [value]="draft.note" (input)="patchCourse({ note: $any($event.target).value })" />
              </label>
              <p class="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {{ (draft.existing ? 'Changes apply to everyone who got this course from the group.' : 'Everyone in the group gets this course under Assigned to you, and so will people who join later. People who already have it keep their own assignment.') | t }}
              </p>
            </div>
            @if (courseError()) {
              <p class="mx-5 mb-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700" role="alert">{{ courseError()! | t }}</p>
            }
            <footer class="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" (click)="courseDraft.set(null)" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Cancel' | t }}</button>
              <button
                type="button"
                (click)="saveCourse()"
                [disabled]="busy() || (!draft.existing && !draft.courseId)"
                class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ (busy() ? 'Saving…' : draft.existing ? 'Save changes' : 'Assign to the group') | t }}
              </button>
            </footer>
          </section>
        </div>
      }

      @if (removeCourse(); as item) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" (click)="removeCourse.set(null)">
          <section class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="remove-course-title" (click)="$event.stopPropagation()">
            <h2 id="remove-course-title" class="text-lg font-semibold text-slate-900">{{ 'Remove this course from the group?' | t }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ '"{0}" will leave Assigned to you for members who have not finished it. Their progress is kept.' | t: [item.courseTitle] }}</p>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="removeCourse.set(null)" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Cancel' | t }}</button>
              <button type="button" (click)="confirmRemoveCourse(item)" [disabled]="busy()" class="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{{ 'Remove course' | t }}</button>
            </div>
          </section>
        </div>
      }

      <!-- Delete -->
      @if (confirmDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" (click)="confirmDelete.set(false)">
          <section class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-group-title" (click)="$event.stopPropagation()">
            <h2 id="delete-group-title" class="text-lg font-semibold text-slate-900">{{ 'Delete this group?' | t }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ '"{0}" will be deleted. This cannot be undone.' | t: [group()?.name ?? ''] }}</p>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="confirmDelete.set(false)" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Cancel' | t }}</button>
              <button type="button" (click)="deleteGroup()" class="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">{{ 'Delete group' | t }}</button>
            </div>
          </section>
        </div>
      }

      @if (editing(); as draft) {
        <app-training-group-form
          [group]="draft"
          [staff]="staffOptions()"
          [saving]="saving()"
          [error]="formError()"
          [currentUserId]="userId()"
          [mustLead]="!access.isAdmin()"
          (saved)="save($event)"
          (cancelled)="editing.set(null)"
        />
      }
    </main>
  `,
})
export class TrainingGroupDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TrainingGroupService);
  private readonly memberService = inject(PartnerMemberService);
  private readonly auth = inject(AuthService);
  protected readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  private readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';

  protected readonly group = signal<TrainingGroup | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal<{ text: string; args: unknown[] } | null>(null);
  protected readonly busy = signal(false);

  protected readonly members = signal<TrainingGroupMember[]>([]);
  protected readonly membersLoading = signal(false);
  protected readonly memberQuery = signal('');

  protected readonly staffOptions = signal<GroupStaffOption[]>([]);
  protected readonly editing = signal<TrainingGroup | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);

  protected readonly adding = signal(false);
  private readonly candidates = signal<AddCandidate[]>([]);
  protected readonly candidatesLoading = signal(false);
  protected readonly candidateQuery = signal('');
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly addError = signal<string | null>(null);

  // ---------- Group courses ----------
  private readonly courseService = inject(CourseService);
  private readonly assignmentService = inject(CourseAssignmentService);
  protected readonly hasCourses = computed(() => this.organizationStore.hasActiveApplication('courses'));
  protected readonly courses = signal<TrainingGroupCourse[]>([]);
  protected readonly coursesLoading = signal(false);
  protected readonly catalog = signal<Course[]>([]);
  protected readonly catalogLoading = signal(false);
  protected readonly courseDraft = signal<CourseDraft | null>(null);
  protected readonly courseError = signal<string | null>(null);
  protected readonly removeCourse = signal<TrainingGroupCourse | null>(null);
  /** Team progress rows (managers only); null when not available. */
  private readonly progressRows = signal<TeamAssignmentRow[] | null>(null);
  protected readonly chosenCourse = computed(() => this.catalog().find((course) => course.id === this.courseDraft()?.courseId) ?? null);

  protected readonly userId = computed(() => this.auth.firebaseUser()?.uid ?? '');
  private readonly isLead = computed(() => !!this.group()?.leadIds.includes(this.userId()));
  private readonly isInstructor = computed(() => !!this.group()?.instructorIds.includes(this.userId()));

  /** Same rules as firestore.rules and manageTrainingGroupMembers. */
  protected readonly canEdit = computed(() => this.access.isAdmin() || (this.access.isManagerOrAbove() && this.isLead()));
  protected readonly canManageMembers = this.canEdit;
  protected readonly canDelete = computed(() => this.access.isAdmin());
  protected readonly canSeeRoster = computed(
    () => this.access.isManagerOrAbove() || (this.access.isStaffOrAbove() && (this.isLead() || this.isInstructor())),
  );

  protected readonly locked = computed(() => !!this.group() && isLocked(this.group()!));
  protected readonly archived = computed(() => !!this.group() && isArchived(this.group()!));
  protected readonly archiveDays = ARCHIVE_AFTER_DAYS;
  protected readonly summary = signal<TrainingGroupSummary | null>(null);
  protected readonly summaryBusy = signal(false);

  protected readonly status = computed(() => STATUS_LABELS[groupStatus(this.group() ?? { manualStatus: null, startDate: null, endDate: null })]);
  protected readonly delivery = computed(
    () => DELIVERY_MODES.find((mode) => mode.value === this.group()?.deliveryMode) ?? DELIVERY_MODES[0],
  );
  protected readonly placesLeft = computed(() => {
    const group = this.group();
    return group?.capacity ? Math.max(0, group.capacity - group.memberCount - this.selected().size) : 0;
  });

  protected readonly shownMembers = computed(() => {
    const term = this.memberQuery().trim().toLowerCase();
    return this.members().filter((member) => !term || `${member.name} ${member.email ?? ''}`.toLowerCase().includes(term));
  });

  protected readonly shownCandidates = computed(() => {
    const inGroup = new Set(this.members().map((member) => member.userId));
    const term = this.candidateQuery().trim().toLowerCase();
    return this.candidates()
      .filter((person) => !inGroup.has(person.userId))
      .filter((person) => !term || `${person.name} ${person.email} ${this.roleLabel(person.role)}`.toLowerCase().includes(term));
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Context errors are shown elsewhere.
    }

    try {
      const group = await this.service.get(this.organizationId, this.groupId);
      this.group.set(group);
      this.pageTitle.setDocumentTitle(group?.name ?? this.i18n.t('Training Groups'));
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load the training group.', error);
    } finally {
      this.loading.set(false);
    }

    if (this.group() && this.access.isStaffOrAbove()) {
      this.staffOptions.set(await loadStaffOptions(this.memberService, this.organizationId, this.logger, this.service));
    }
    if (this.group() && this.canSeeRoster()) {
      await this.loadMembers();
      void this.loadSummary();
      void this.loadRequests();
    }
    if (this.group() && this.hasCourses()) {
      await this.loadCourses();
    }
  }

  private async loadSummary(): Promise<void> {
    try {
      this.summary.set(await this.service.getSummary(this.organizationId, this.groupId));
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load the completion summary.', error);
    }
  }

  protected async refreshSummary(): Promise<void> {
    this.summaryBusy.set(true);
    this.error.set('');
    try {
      await this.service.refreshSummary(this.organizationId, this.groupId);
      await this.loadSummary();
      this.notice.set({ text: 'Completion summary updated.', args: [] });
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not build the completion summary.', error);
      this.error.set(errorMessage(error, 'The summary could not be built. Try again.'));
    } finally {
      this.summaryBusy.set(false);
    }
  }

  protected exportSummary(): void {
    const report = this.summary();
    if (!report) return;
    const t = (text: string) => this.i18n.t(text);
    const label = { completed: t('Completed'), in_progress: t('In progress'), not_started: t('Not started') };
    downloadCsv(`${this.group()?.name ?? 'training-group'}-completion`, [
      [t('Name'), t('Email'), t('Finished all'), ...report.courses.map((course) => (course.lessonTitle ? `${course.courseTitle} · ${course.lessonTitle}` : course.courseTitle))],
      ...report.members.map((member) => [
        member.name,
        member.email ?? '',
        member.finishedAll ? t('Yes') : t('No'),
        ...report.courses.map((course) => {
          const status = member.status[course.key] ?? 'not_started';
          const when = member.completedAt[course.key];
          return when ? `${label[status]} (${new Date(when).toLocaleDateString()})` : label[status];
        }),
      ]),
    ]);
  }

  // ---------- Cohort report (PDF) ----------
  private readonly pdf = inject(TrainingGroupPdfService);
  protected readonly pdfBusy = signal(false);

  /**
   * One PDF with everything about the cohort. Progress comes from the
   * completion summary; while the group is still open it is rebuilt first
   * so the report is current.
   */
  protected async downloadPdf(): Promise<void> {
    const group = this.group();
    if (!group) return;
    this.pdfBusy.set(true);
    this.error.set('');
    try {
      if (this.courses().length && (!this.summary() || !this.locked())) {
        try {
          await this.service.refreshSummary(this.organizationId, this.groupId);
          await this.loadSummary();
        } catch (error) {
          // Use the last summary (or none) rather than no report.
          this.logger.error('TrainingGroupDetailComponent', 'Could not refresh the summary for the PDF.', error);
        }
      }
      this.pdf.download({
        organizationName: this.organizationStore.selectedOrganizationName() || '',
        group,
        statusLabel: this.i18n.t(this.status().label),
        locked: this.locked(),
        archived: this.archived(),
        deliveryLabel: this.i18n.t(this.delivery().label),
        leadNames: this.namesOf(group.leadIds),
        instructorNames: this.namesOf(group.instructorIds),
        courses: this.courses(),
        members: this.members(),
        summary: this.summary(),
      });
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not create the PDF.', error);
      this.error.set('The PDF could not be created. Try again.');
    } finally {
      this.pdfBusy.set(false);
    }
  }

  /** Owners and admins: reopen an ended group, or lock it again. */
  protected async setReopened(reopened: boolean): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.service.setReopened(this.organizationId, this.groupId, reopened, this.userId());
      this.group.update((group) => (group ? { ...group, reopened } : group));
      this.notice.set({ text: reopened ? 'The group was reopened.' : 'The group is locked again.', args: [] });
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not change the lock.', error);
      this.error.set('The group could not be changed. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  private async loadCourses(): Promise<void> {
    this.coursesLoading.set(true);
    try {
      this.courses.set(await this.service.listCourses(this.organizationId, this.groupId));
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load the group courses.', error);
    } finally {
      this.coursesLoading.set(false);
    }
    void this.loadProgress();
  }

  /** "3 of 12 done" per course, from Team progress (managers and above). */
  private async loadProgress(): Promise<void> {
    if (!this.courses().length || !this.access.isManagerOrAbove()) {
      return;
    }
    try {
      this.progressRows.set((await this.assignmentService.teamProgress(this.organizationId)).assignments);
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Team progress is not available.', error);
      this.progressRows.set(null);
    }
  }

  protected progressFor(item: TrainingGroupCourse): CourseProgressCount | null {
    const rows = this.progressRows();
    if (!rows) {
      return null;
    }
    const inGroup = new Set(this.members().map((member) => member.userId));
    const now = Date.now();
    const mine = rows.filter((row) => inGroup.has(row.userId) && row.courseId === item.courseId && row.lessonId === item.lessonId);
    return {
      total: mine.length,
      done: mine.filter((row) => row.status === 'completed').length,
      overdue: mine.filter((row) => row.status !== 'completed' && row.dueAt !== null && row.dueAt < now).length,
    };
  }

  protected async openCourse(item: TrainingGroupCourse | null): Promise<void> {
    this.courseError.set(null);
    this.courseDraft.set({
      existing: item,
      courseId: item?.courseId ?? '',
      lessonId: item?.lessonId ?? '',
      due: item?.dueAt ? toDateInput(item.dueAt) : '',
      required: item?.required ?? true,
      note: item?.note ?? '',
    });
    if (item || this.catalog().length) {
      return;
    }
    this.catalogLoading.set(true);
    try {
      const courses = await this.courseService.listPublished(this.organizationId);
      this.catalog.set([...courses].sort((a, b) => a.title.localeCompare(b.title)));
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load courses.', error);
      this.courseError.set('Courses could not be loaded. Try again.');
    } finally {
      this.catalogLoading.set(false);
    }
  }

  protected patchCourse(change: Partial<CourseDraft>): void {
    this.courseDraft.update((draft) => (draft ? { ...draft, ...change } : draft));
  }

  protected async saveCourse(): Promise<void> {
    const draft = this.courseDraft();
    if (!draft || (!draft.existing && !draft.courseId)) {
      return;
    }
    const dueAt = dueDateFromInput(draft.due)?.getTime() ?? null;
    this.busy.set(true);
    this.courseError.set(null);
    try {
      await this.service.changeCourse(this.organizationId, this.groupId, {
        action: draft.existing ? 'update' : 'assign',
        courseId: draft.existing?.courseId ?? draft.courseId,
        lessonId: draft.existing ? draft.existing.lessonId : draft.lessonId || null,
        dueAt,
        required: draft.required,
        note: draft.note.trim(),
      });
      this.courseDraft.set(null);
      this.notice.set({ text: draft.existing ? 'Course updated for the group.' : 'Course assigned to the group.', args: [] });
      await this.loadCourses();
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not save the group course.', error);
      this.courseError.set(errorMessage(error, 'The course could not be saved. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async confirmRemoveCourse(item: TrainingGroupCourse): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.service.changeCourse(this.organizationId, this.groupId, { action: 'remove', courseId: item.courseId, lessonId: item.lessonId });
      this.removeCourse.set(null);
      this.courses.set(this.courses().filter((course) => course.key !== item.key));
      this.notice.set({ text: '"{0}" was removed from the group.', args: [item.courseTitle] });
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not remove the group course.', error);
      this.removeCourse.set(null);
      this.error.set(errorMessage(error, 'The course could not be removed. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  // ---------- Enrollment ----------
  protected readonly requests = signal<JoinRequest[]>([]);
  protected readonly enrollmentLog = signal<EnrollmentLogEntry[]>([]);
  protected readonly requestsLoading = signal(false);
  protected readonly decisionNotes = signal<Record<string, string>>({});
  protected readonly pendingRequests = computed(() =>
    this.requests().filter((entry) => entry.status === 'pending').sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)),
  );
  protected readonly waitlist = computed(() =>
    this.requests().filter((entry) => entry.status === 'waitlisted').sort((a, b) => (a.waitlistedAt?.getTime() ?? 0) - (b.waitlistedAt?.getTime() ?? 0)),
  );
  protected readonly otherRequests = computed(() =>
    this.requests().filter((entry) => entry.status !== 'pending' && entry.status !== 'waitlisted').sort((a, b) => (b.decidedAt?.getTime() ?? 0) - (a.decidedAt?.getTime() ?? 0)),
  );

  private async loadRequests(): Promise<void> {
    if (this.group()?.enrollmentMode === 'invite') {
      return;
    }
    this.requestsLoading.set(true);
    try {
      const [requests, log] = await Promise.all([
        this.service.listRequests(this.organizationId, this.groupId),
        this.service.listEnrollmentLog(this.organizationId, this.groupId),
      ]);
      this.requests.set(requests);
      this.enrollmentLog.set(log);
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load enrollment requests.', error);
    } finally {
      this.requestsLoading.set(false);
    }
  }

  protected noteFor(userId: string): string {
    return this.decisionNotes()[userId] ?? '';
  }

  protected setDecisionNote(userId: string, note: string): void {
    this.decisionNotes.update((notes) => ({ ...notes, [userId]: note }));
  }

  protected async decide(entry: JoinRequest, decision: 'approve' | 'decline'): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const status = await this.service.decideRequest(this.organizationId, this.groupId, entry.userId, decision, this.decisionNotes()[entry.userId] ?? '');
      const messages: Record<string, string> = {
        enrolled: '{0} was added to the group.',
        invited: '{0} was invited to the organization and will join the group on accepting.',
        waitlisted: 'The group is full: {0} is on the waitlist.',
        declined: 'The request from {0} was declined.',
      };
      this.notice.set({ text: messages[status] ?? 'Done.', args: [entry.name] });
      await Promise.all([this.reloadGroup(), this.loadRequests(), status === 'enrolled' ? this.loadMembers() : Promise.resolve()]);
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not decide the request.', error);
      this.error.set(errorMessage(error, 'The request could not be updated. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  /** Refresh counters (member count, pending, waitlist) after a server change. */
  private async reloadGroup(): Promise<void> {
    const group = await this.service.get(this.organizationId, this.groupId);
    if (group) {
      this.group.set(group);
    }
  }

  protected async copyJoinLink(): Promise<void> {
    const link = `${window.location.origin}/join/${this.organizationId}/${this.groupId}`;
    try {
      await navigator.clipboard.writeText(link);
      this.notice.set({ text: 'Join link copied: {0}', args: [link] });
    } catch {
      this.notice.set({ text: 'Join link: {0}', args: [link] });
    }
  }

  protected enrollmentModeLabel(mode: string): string {
    return ENROLLMENT_MODES.find((option) => option.value === mode)?.label ?? mode;
  }

  protected requestBadge(entry: JoinRequest): { label: string; classes: string } {
    return REQUEST_STATUS_LABELS[entry.status] ?? REQUEST_STATUS_LABELS.pending;
  }

  protected logLabel(action: string): string {
    const labels: Record<string, string> = {
      requested: 'asked to join',
      applied: 'applied',
      approved: 'was approved and added',
      enrolled: 'joined the group',
      invited: 'was approved and invited to the organization',
      waitlisted: 'was put on the waitlist',
      promoted: 'moved up from the waitlist',
      declined: 'was declined',
      withdrawn: 'withdrew',
    };
    return labels[action] ?? action;
  }

  private async loadMembers(): Promise<void> {
    this.membersLoading.set(true);
    try {
      const members = await this.service.listMembers(this.organizationId, this.groupId);
      this.members.set(members);
      // Members added before names were recorded show as "Member": fill them in from the directory.
      if (members.some((member) => !this.hasRealName(member)) && this.canManageMembers()) {
        void this.fillMemberNames();
      }
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load the members.', error);
      this.error.set('The members could not be loaded. Try again.');
    } finally {
      this.membersLoading.set(false);
    }
  }

  private hasRealName(member: TrainingGroupMember): boolean {
    return Boolean(member.name) && member.name !== 'Member' && member.name !== member.email;
  }

  private async fillMemberNames(): Promise<void> {
    try {
      const people = new Map((await this.service.loadDirectory(this.organizationId)).map((person) => [person.userId, person]));
      this.members.update((members) =>
        members
          .map((member) => {
            const person = people.get(member.userId);
            if (!person || this.hasRealName(member)) {
              return member;
            }
            return { ...member, name: person.name, email: member.email || person.email || null };
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not look up member names.', error);
    }
  }

  protected namesOf(ids: string[]): string {
    const names = new Map(this.staffOptions().map((person) => [person.userId, person.name]));
    return ids.map((id) => names.get(id) ?? (id === this.userId() ? this.i18n.t('You') : '')).filter(Boolean).join(', ');
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? 'Member';
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected openEdit(): void {
    this.formError.set(null);
    this.editing.set(this.group());
  }

  protected async save(group: TrainingGroup): Promise<void> {
    this.saving.set(true);
    this.formError.set(null);
    try {
      await this.service.save(group, this.userId());
      this.group.set(group);
      this.editing.set(null);
      this.notice.set({ text: 'Changes saved.', args: [] });
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not save the training group.', error);
      this.formError.set('The group could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async openAdd(): Promise<void> {
    this.selected.set(new Set());
    this.candidateQuery.set('');
    this.addError.set(null);
    this.adding.set(true);
    if (this.candidates().length) {
      return;
    }
    this.candidatesLoading.set(true);
    try {
      // The member directory has names and emails; memberships alone often don't.
      const people = await this.service.loadDirectory(this.organizationId);
      this.candidates.set(
        people
          .filter((person) => person.active)
          .map((person) => ({ userId: person.userId, name: person.name, email: person.email, role: person.role })),
      );
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not load people.', error);
      this.addError.set('People could not be loaded. Try again.');
    } finally {
      this.candidatesLoading.set(false);
    }
  }

  protected toggleCandidate(userId: string): void {
    const next = new Set(this.selected());
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    this.selected.set(next);
  }

  protected async addSelected(): Promise<void> {
    const ids = [...this.selected()];
    if (!ids.length) return;
    this.busy.set(true);
    this.addError.set(null);
    try {
      const result = await this.service.changeMembers(this.organizationId, this.groupId, 'add', ids);
      this.group.update((group) => (group ? { ...group, memberCount: result.memberCount } : group));
      this.adding.set(false);
      this.notice.set({ text: result.changed === 1 ? '1 person added.' : '{0} people added.', args: [result.changed] });
      await this.loadMembers();
      void this.loadProgress();
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not add members.', error);
      this.addError.set(errorMessage(error, 'The members could not be added. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async withdraw(member: TrainingGroupMember): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.service.changeMembers(this.organizationId, this.groupId, 'remove', [member.userId]);
      this.group.update((group) => (group ? { ...group, memberCount: result.memberCount } : group));
      this.members.set(this.members().filter((item) => item.userId !== member.userId));
      this.notice.set({ text: '{0} was withdrawn from the group.', args: [member.name] });
      // A place opened: the waitlist may have moved up.
      if (this.waitlist().length) {
        await Promise.all([this.reloadGroup(), this.loadRequests(), this.loadMembers()]);
      }
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not withdraw the member.', error);
      this.error.set(errorMessage(error, 'The member could not be withdrawn. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected exportCsv(): void {
    const t = (text: string) => this.i18n.t(text);
    downloadCsv(`${this.group()?.name ?? 'training-group'}-members`, [
      [t('Group'), t('Name'), t('Email'), t('Added')],
      ...this.members().map((member) => [this.group()?.name ?? '', member.name, member.email ?? '', member.enrolledAt]),
    ]);
  }

  protected async deleteGroup(): Promise<void> {
    this.confirmDelete.set(false);
    try {
      await this.service.delete(this.organizationId, this.groupId);
      await this.router.navigate(['/partner/org', this.organizationId, 'training-groups']);
    } catch (error) {
      this.logger.error('TrainingGroupDetailComponent', 'Could not delete the group.', error);
      this.error.set('The group could not be deleted. Try again.');
    }
  }
}

/** The server's message for capacity and permission errors, otherwise a fallback. */
function errorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as { message?: string })?.message ?? '';
  return /resource-exhausted|permission-denied|failed-precondition|invalid-argument|already-exists|not-found|internal/.test(code) && message && message.toLowerCase() !== 'internal' ? message : fallback;
}

/** A date as a date input value (YYYY-MM-DD), local time. */
function toDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
