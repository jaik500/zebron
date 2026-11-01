import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import {
  CourseAssignmentService,
  TeamAssignmentRow,
  TeamLearningProgress,
  TeamMemberRow,
} from '../../courses/course-assignment.service';

type Tab = 'assignments' | 'people';
type StatusFilter = 'all' | 'open' | 'overdue' | 'not_started' | 'in_progress' | 'completed';

const ROLE_LABELS: Record<string, string> = {
  org_member: 'Member',
  org_staff: 'Staff',
  org_manager: 'Manager',
  org_admin: 'Administrator',
  org_owner: 'Owner',
};

/**
 * Team progress for managers: assignment status with due dates, and per
 * person what they started, completed and passed in the organization's
 * courses. Data comes from getTeamLearningProgress (learner progress is
 * private to each learner otherwise). Download as CSV.
 *
 * Route: /partner/org/:organizationId/learning/progress (managers and above).
 */
@Component({
  selector: 'app-team-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'learning', 'manage']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Learning administration' | t"
            [title]="'Learning administration' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-semibold">{{ 'Team progress' | t }}</h1>
            <p class="text-sm text-white/85">{{ 'Assignments, completions and certificates in your courses.' | t }}</p>
          </div>
          <button
            type="button"
            (click)="downloadCsv()"
            [disabled]="!data()"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/40 px-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>
            {{ 'Download CSV' | t }}
          </button>
        </div>
      </header>

      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="grid gap-3 sm:grid-cols-4" aria-hidden="true">
            @for (item of [1, 2, 3, 4]; track item) {
              <div class="h-20 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
        } @else if (data(); as report) {
          <!-- Summary -->
          <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <dt class="text-xs text-slate-500">{{ 'Assignments' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ report.assignments.length }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <dt class="text-xs text-slate-500">{{ 'Completed' | t }}</dt>
              <dd class="text-2xl font-semibold text-emerald-700">{{ summary().completed }}</dd>
            </div>
            <div class="rounded-2xl border p-4" [class]="summary().overdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'">
              <dt class="text-xs text-slate-500">{{ 'Overdue' | t }}</dt>
              <dd class="text-2xl font-semibold" [class]="summary().overdue ? 'text-rose-700' : 'text-slate-900'">{{ summary().overdue }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <dt class="text-xs text-slate-500">{{ 'Certificates earned' | t }}</dt>
              <dd class="text-2xl font-semibold text-slate-900">{{ summary().certificates }}</dd>
            </div>
          </dl>

          <!-- Tabs and filters -->
          <div class="mt-6 flex flex-wrap items-center gap-2">
            <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="tab() === 'assignments'"
                (click)="tab.set('assignments')"
                class="h-8 rounded-md px-3 text-sm font-semibold"
                [class]="tab() === 'assignments' ? 'bg-[#007979] text-white' : 'text-slate-600 hover:bg-slate-50'"
              >
                {{ 'Assignments' | t }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="tab() === 'people'"
                (click)="tab.set('people')"
                class="h-8 rounded-md px-3 text-sm font-semibold"
                [class]="tab() === 'people' ? 'bg-[#007979] text-white' : 'text-slate-600 hover:bg-slate-50'"
              >
                {{ 'People' | t }}
              </button>
            </div>

            <input
              type="search"
              class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs"
              [placeholder]="'Search people' | t"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />

            @if (tab() === 'assignments') {
              <select
                class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                [value]="courseFilter()"
                (change)="courseFilter.set($any($event.target).value)"
                [attr.aria-label]="'Course' | t"
              >
                <option value="">{{ 'All courses' | t }}</option>
                @for (course of courseOptions(); track course.id) {
                  <option [value]="course.id">{{ course.title }}</option>
                }
              </select>
              <select
                class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                [value]="statusFilter()"
                (change)="statusFilter.set($any($event.target).value)"
                [attr.aria-label]="'Status' | t"
              >
                <option value="all">{{ 'All statuses' | t }}</option>
                <option value="open">{{ 'Not done yet' | t }}</option>
                <option value="overdue">{{ 'Overdue' | t }}</option>
                <option value="not_started">{{ 'Not started' | t }}</option>
                <option value="in_progress">{{ 'In progress' | t }}</option>
                <option value="completed">{{ 'Completed' | t }}</option>
              </select>
            }
          </div>

          @if (tab() === 'assignments') {
            @if (!report.assignments.length) {
              <div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">assignment_ind</mat-icon>
                <p class="mt-2 font-semibold text-slate-900">{{ 'No assignments yet' | t }}</p>
                <p class="mt-1 text-sm text-slate-600">{{ 'Assign a course from Manage courses: choose people, a due date and whether it is required.' | t }}</p>
                <a
                  [routerLink]="['/partner/org', organizationId, 'courses', 'manage']"
                  class="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
                >
                  {{ 'Manage courses' | t }}
                </a>
              </div>
            } @else if (!shownAssignments().length) {
              <p class="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'Nothing matches these filters.' | t }}</p>
            } @else {
              <div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table class="w-full min-w-[640px] text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3 font-semibold">{{ 'Person' | t }}</th>
                      <th class="px-4 py-3 font-semibold">{{ 'Course or lesson' | t }}</th>
                      <th class="px-4 py-3 font-semibold">{{ 'Due' | t }}</th>
                      <th class="px-4 py-3 font-semibold">{{ 'Status' | t }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of shownAssignments(); track row.id) {
                      <tr [class]="isRowOverdue(row) ? 'bg-rose-50/50' : ''">
                        <td class="px-4 py-3 font-medium text-slate-900">{{ row.userName }}</td>
                        <td class="px-4 py-3">
                          <span class="block text-slate-900">{{ row.lessonTitle || row.courseTitle }}</span>
                          <span class="block text-xs text-slate-500">
                            {{ row.lessonTitle ? ('Lesson in {0}' | t: [row.courseTitle]) : ('Whole course' | t) }}
                            @if (row.required) {
                              · {{ 'Required' | t }}
                            }
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap" [class]="isRowOverdue(row) ? 'font-semibold text-rose-700' : 'text-slate-600'">
                          {{ row.dueAt ? dateLabel(row.dueAt) : '–' }}
                        </td>
                        <td class="px-4 py-3">
                          <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusClasses(row)">
                            {{ statusLabel(row) | t }}
                          </span>
                          @if (row.status === 'in_progress' && !row.lessonId) {
                            <span class="ml-1 text-xs text-slate-500">{{ row.percent }}%</span>
                          }
                          @if (row.completedAt) {
                            <span class="block text-xs text-slate-500">{{ dateLabel(row.completedAt) }}</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          } @else {
            @if (!shownMembers().length) {
              <p class="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'Nothing matches these filters.' | t }}</p>
            } @else {
              <div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table class="w-full min-w-[720px] text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3 font-semibold">{{ 'Person' | t }}</th>
                      <th class="px-4 py-3 text-right font-semibold">{{ 'Started' | t }}</th>
                      <th class="px-4 py-3 text-right font-semibold">{{ 'Completed' | t }}</th>
                      <th class="px-4 py-3 text-right font-semibold">{{ 'Certificates' | t }}</th>
                      <th class="px-4 py-3 text-right font-semibold">{{ 'Assignments done' | t }}</th>
                      <th class="px-4 py-3 font-semibold">{{ 'Last activity' | t }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (member of shownMembers(); track member.userId) {
                      <tr>
                        <td class="px-4 py-3">
                          <span class="block font-medium text-slate-900">{{ member.name }}</span>
                          <span class="block text-xs text-slate-500">{{ roleLabel(member.role) | t }}@if (member.email) { · {{ member.email }} }</span>
                        </td>
                        <td class="px-4 py-3 text-right tabular-nums">{{ member.coursesStarted }}</td>
                        <td class="px-4 py-3 text-right tabular-nums">{{ member.coursesCompleted }}</td>
                        <td class="px-4 py-3 text-right tabular-nums">{{ member.certificates }}</td>
                        <td class="px-4 py-3 text-right tabular-nums">
                          @if (member.assigned) {
                            {{ member.assignedDone }} / {{ member.assigned }}
                            @if (member.overdue) {
                              <span class="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">{{ '{0} overdue' | t: [member.overdue] }}</span>
                            }
                          } @else {
                            <span class="text-slate-400">–</span>
                          }
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ member.lastActivity ? dateLabel(member.lastActivity) : ('Not yet' | t) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }

          <p class="mt-3 text-xs text-slate-500">{{ 'Updated {0}.' | t: [timeLabel(report.generatedAt)] }}</p>
        }
      </div>
    </main>
  `,
})
export class TeamProgressComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CourseAssignmentService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly data = signal<TeamLearningProgress | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly tab = signal<Tab>('assignments');
  protected readonly query = signal('');
  protected readonly courseFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  private readonly locale = computed(() => (this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'));

  /** Courses that have assignments, plus published ones. */
  protected readonly courseOptions = computed(() => {
    const report = this.data();
    if (!report) {
      return [];
    }
    const byId = new Map(report.courses.map((course) => [course.id, course.title]));
    for (const row of report.assignments) {
      if (!byId.has(row.courseId)) {
        byId.set(row.courseId, row.courseTitle);
      }
    }
    return [...byId].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  });

  protected readonly summary = computed(() => {
    const report = this.data();
    const rows = report?.assignments ?? [];
    return {
      completed: rows.filter((row) => row.status === 'completed').length,
      overdue: rows.filter((row) => this.isRowOverdue(row)).length,
      certificates: (report?.members ?? []).reduce((total, member) => total + member.certificates, 0),
    };
  });

  protected readonly shownAssignments = computed(() => {
    const term = this.query().trim().toLowerCase();
    const course = this.courseFilter();
    const status = this.statusFilter();

    return (this.data()?.assignments ?? [])
      .filter((row) => !term || row.userName.toLowerCase().includes(term))
      .filter((row) => !course || row.courseId === course)
      .filter((row) => {
        switch (status) {
          case 'open':
            return row.status !== 'completed';
          case 'overdue':
            return this.isRowOverdue(row);
          case 'all':
            return true;
          default:
            return row.status === status;
        }
      })
      .sort(
        (a, b) =>
          Number(b.status !== 'completed') - Number(a.status !== 'completed') ||
          (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER) ||
          a.userName.localeCompare(b.userName),
      );
  });

  protected readonly shownMembers = computed(() => {
    const term = this.query().trim().toLowerCase();
    return (this.data()?.members ?? []).filter(
      (member) => !term || `${member.name} ${member.email ?? ''}`.toLowerCase().includes(term),
    );
  });

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.i18n.t('Team progress'));

    try {
      this.data.set(await this.service.teamProgress(this.organizationId));
    } catch (error) {
      this.logger.error('TeamProgressComponent', 'Could not load team progress.', error);
      this.error.set('Team progress could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected isRowOverdue(row: TeamAssignmentRow): boolean {
    return row.status !== 'completed' && row.dueAt !== null && row.dueAt < (this.data()?.generatedAt ?? Date.now());
  }

  protected statusLabel(row: TeamAssignmentRow): string {
    if (this.isRowOverdue(row)) {
      return 'Overdue';
    }
    return row.status === 'completed' ? 'Completed' : row.status === 'in_progress' ? 'In progress' : 'Not started';
  }

  protected statusClasses(row: TeamAssignmentRow): string {
    if (this.isRowOverdue(row)) {
      return 'bg-rose-100 text-rose-800';
    }
    return row.status === 'completed'
      ? 'bg-emerald-100 text-emerald-800'
      : row.status === 'in_progress'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? 'Member';
  }

  protected dateLabel(value: number): string {
    return new Date(value).toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected timeLabel(value: number): string {
    return new Date(value).toLocaleString(this.locale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  /** The current tab, with its filters, as a CSV file. */
  protected downloadCsv(): void {
    const t = (text: string) => this.i18n.t(text);
    const iso = (value: number | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
    let rows: (string | number)[][];

    if (this.tab() === 'assignments') {
      rows = [
        [t('Person'), t('Course'), t('Lesson'), t('Required'), t('Due'), t('Status'), t('Percent'), t('Completed')],
        ...this.shownAssignments().map((row) => [
          row.userName,
          row.courseTitle,
          row.lessonTitle ?? '',
          row.required ? t('Yes') : t('No'),
          iso(row.dueAt),
          t(this.statusLabel(row)),
          row.percent,
          iso(row.completedAt),
        ]),
      ];
    } else {
      rows = [
        [t('Person'), t('Email'), t('Role'), t('Started'), t('Completed'), t('Certificates'), t('Exams passed'), t('Assignments'), t('Assignments done'), t('Overdue'), t('Last activity')],
        ...this.shownMembers().map((member: TeamMemberRow) => [
          member.name,
          member.email ?? '',
          t(this.roleLabel(member.role)),
          member.coursesStarted,
          member.coursesCompleted,
          member.certificates,
          member.examsPassed,
          member.assigned,
          member.assignedDone,
          member.overdue,
          iso(member.lastActivity),
        ]),
      ];
    }

    const csv = rows
      .map((row) => row.map((cell) => {
        const value = String(cell);
        // Quote, and keep spreadsheet apps from running a cell as a formula.
        const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
        return `"${safe.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-progress-${this.tab()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
