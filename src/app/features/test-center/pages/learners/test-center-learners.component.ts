import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TestCenterLearnersService } from '../../services/test-center-learners.service';
import { TestCenterLearner } from '../../models/test-center-learner.model';

import { OrganizationContextService } from '../../../../core/services/organization-context.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-test-center-learners',
  standalone: true,
  imports: [
    TranslatePipe,
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

  <main class="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-8">

      <!-- Page Header -->
      <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            {{ 'Test Center' | t }}
          </span>

          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {{ 'Learners' | t }}
          </h1>

          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {{ 'Monitor learner activity, assessment performance, and learning progress.' | t }}
          </p>
        </div>

        <div class="inline-flex w-fit max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"></span>

          <div class="min-w-0">
            <p class="text-xs text-slate-500">{{ 'Current organization' | t }}</p>
            <p class="truncate text-sm font-semibold text-slate-800">
              {{ organizationId() || ('Select an organization' | t) }}
            </p>
          </div>
        </div>
      </header>

      <!-- Summary Cards -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">{{ 'Total learners' | t }}</p>
              <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {{ learners().length }}
              </p>
            </div>

            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M17 20h5v-2a4 4 0 0 0-5-3.87M9 20H2v-2a4 4 0 0 1 7.75-1.35M16 20v-2a4 4 0 0 0-8 0v2m8-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5-3a4 4 0 0 1 0 8" />
              </svg>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-400">
            {{ 'Active organization memberships' | t }}
          </p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">{{ 'Started learning' | t }}</p>
              <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {{ startedCount() }}
              </p>
            </div>

            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M9 12.75 11.25 15 15 9.75M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3Z" />
              </svg>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-400">
            {{ 'Learners with assessment activity' | t }}
          </p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:col-span-2 xl:col-span-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">
                {{ 'Average assessment score' | t }}
              </p>

              <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {{
                  organizationAverage() === null
                    ? '—'
                    : organizationAverage() + '%'
                }}
              </p>
            </div>

            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" />
              </svg>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-400">
            {{ 'Based on available learner averages' | t }}
          </p>
        </article>

      </section>

      <!-- Learner Directory -->
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div class="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              {{ 'Organization members' | t }}
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              {{ 'Expand a learner to review their assessment overview.' | t }}
            </p>
          </div>

          <span class="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            {{ '{0} learners' | t: [filteredLearners().length] }}
          </span>
        </div>

        <!-- Search and Filters -->
        <div class="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:px-6">

          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Search learners' | t }}</mat-label>
            <mat-icon matPrefix class="ml-3 mr-1 !text-[#007979]" aria-hidden="true">search</mat-icon>
            <input matInput
              type="search"
              [placeholder]="'Search by name or email...' | t"
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Filter learners' | t }}</mat-label>
            <mat-select
            [attr.aria-label]="'Filter learners' | t"
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
          >
            <mat-option value="all">{{ 'All learners' | t }}</mat-option>
            <mat-option value="active">{{ 'Has assessment activity' | t }}</mat-option>
            <mat-option value="not-started">{{ 'Not started' | t }}</mat-option>
            <mat-option value="inactive">{{ 'Inactive membership' | t }}</mat-option>
          </mat-select>
          </mat-form-field>

        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-16">
            <div class="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>

            <p class="text-sm font-medium text-slate-500">
              {{ 'Loading learners...' | t }}
            </p>
          </div>
        }

        <!-- Error -->
        @else if (error()) {
          <div class="flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 8v4m0 4h.01M10.3 3.86 1.82 18.5A2 2 0 0 0 3.55 21h16.9a2 2 0 0 0 1.73-2.5L13.7 3.86a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h3 class="mt-4 font-semibold text-slate-900">
              {{ 'Unable to load learners' | t }}
            </h3>

            <p class="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {{ error() | t }}
            </p>

            <button
              type="button"
              class="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              (click)="loadLearners()"
            >
              {{ 'Try again' | t }}
            </button>
          </div>
        }

        <!-- Empty State -->
        @else if (!filteredLearners().length) {
          <div class="flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg class="h-7 w-7" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke-width="1.8" />
                <path stroke-linecap="round" stroke-width="1.8"
                  d="m16 16 4 4" />
              </svg>
            </div>

            <h3 class="mt-4 font-semibold text-slate-900">
              {{ 'No learners found' | t }}
            </h3>

            <p class="mt-2 text-sm text-slate-500">
              {{ 'Try another search or change the selected filter.' | t }}
            </p>
          </div>
        }

        <!-- Learner Rows -->
        @else {
          <div class="divide-y divide-slate-100">

            @for (learner of filteredLearners(); track learner.userId) {
              <article
                class="transition-colors"
                [class.bg-indigo-50]="expandedUserId() === learner.userId"
              >

                <button
                  type="button"
                  class="group flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:flex-nowrap sm:px-6"
                  [attr.aria-expanded]="expandedUserId() === learner.userId"
                  [attr.aria-label]="'Toggle details for ' + learner.name"
                  (click)="toggleLearner(learner.userId)"
                >

                  <!-- Avatar -->
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200/60">
                    @if (learner.photoURL) {
                      <img
                        class="h-full w-full object-cover"
                        [src]="learner.photoURL"
                        [alt]="learner.name"
                      />
                    } @else {
                      {{ initials(learner.name) }}
                    }
                  </span>

                  <!-- Identity -->
                  <span class="flex min-w-0 flex-1 flex-col gap-1">
                    <span class="truncate text-sm font-semibold text-slate-900">
                      {{ learner.name }}
                    </span>

                    <span class="truncate text-xs text-slate-500">
                      {{ learner.email || ('No email available' | t) }}
                    </span>
                  </span>

                  <!-- Role -->
                  <span class="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 md:inline-flex">
                    {{ formatRole(learner.role) | t }}
                  </span>

                  <!-- Status -->
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold"
                    [class.bg-emerald-50]="learner.status === 'active'"
                    [class.text-emerald-700]="learner.status === 'active'"
                    [class.bg-rose-50]="learner.status === 'inactive'"
                    [class.text-rose-700]="learner.status === 'inactive'"
                    [class.bg-amber-50]="learner.status === 'not-started'"
                    [class.text-amber-700]="learner.status === 'not-started'"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      [class.bg-emerald-500]="learner.status === 'active'"
                      [class.bg-rose-500]="learner.status === 'inactive'"
                      [class.bg-amber-500]="learner.status === 'not-started'"
                    ></span>

                    {{ statusLabel(learner.status) | t }}
                  </span>

                  <!-- Latest Score -->
                  <span class="flex min-w-20 flex-col gap-1 text-right">
                    <span class="text-sm font-bold text-slate-900">
                      {{
                        learner.latestScore === null
                          ? '—'
                          : learner.latestScore + '%'
                      }}
                    </span>

                    <span class="text-[11px] text-slate-400">
                      {{ 'Latest score' | t }}
                    </span>
                  </span>

                  <!-- Expand -->
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-500 transition group-hover:border-indigo-200 group-hover:text-indigo-600">
                    {{ expandedUserId() === learner.userId ? '−' : '+' }}
                  </span>

                </button>

                <!-- Expanded Learner Details -->
                @if (expandedUserId() === learner.userId) {
                  <div class="border-t border-indigo-100 bg-indigo-50/40 px-5 py-5 sm:px-6">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">

                      <div class="rounded-xl border border-white bg-white p-4 shadow-sm">
                        <p class="text-xs font-medium text-slate-500">
                          {{ 'Assessments completed' | t }}
                        </p>

                        <p class="mt-2 text-2xl font-bold text-slate-900">
                          {{ learner.assessmentCount }}
                        </p>
                      </div>

                      <div class="rounded-xl border border-white bg-white p-4 shadow-sm">
                        <p class="text-xs font-medium text-slate-500">
                          {{ 'Average score' | t }}
                        </p>

                        <p class="mt-2 text-2xl font-bold text-slate-900">
                          {{
                            learner.averageScore === null
                              ? '—'
                              : learner.averageScore + '%'
                          }}
                        </p>
                      </div>

                      <div class="rounded-xl border border-white bg-white p-4 shadow-sm">
                        <p class="text-xs font-medium text-slate-500">
                          {{ 'Last assessment' | t }}
                        </p>

                        <p class="mt-2 text-base font-bold text-slate-900">
                          {{
                            learner.lastAssessmentAt
                              ? (learner.lastAssessmentAt | date:'mediumDate')
                              : 'No activity yet'
                          }}
                        </p>
                      </div>

                    </div>

                    <div class="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p class="text-sm font-semibold text-slate-800">
                          {{ '{0}\\u0027s learning activity' | t: [learner.name] }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                          {{ 'Review assessment history and course activity.' | t }}
                        </p>
                      </div>

                      <a
                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        [routerLink]="[
                          '/test-center/learners',
                          learner.userId
                        ]"
                      >
                        {{ 'View learning dashboard' | t }}
                        <svg class="h-4 w-4" fill="none"
                          stroke="currentColor" viewBox="0 0 24 24"
                          aria-hidden="true">
                          <path stroke-linecap="round"
                            stroke-linejoin="round" stroke-width="2"
                            d="M5 12h14m-7-7 7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                }

              </article>
            }

          </div>
        }

        <!-- Directory Footer -->
        @if (!loading() && !error() && filteredLearners().length) {
          <footer class="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              {{ 'Showing {0} of {1} learners' | t: [filteredLearners().length, learners().length] }}
            </span>

            <span>
              {{ 'Learner information is restricted by organization permissions.' | t }}
            </span>
          </footer>
        }

      </section>

    </div>
  </main>
`,
styles: []
})
export class TestCenterLearnersComponent {
  private readonly learnersService =
    inject(TestCenterLearnersService);

  private readonly organizationContext =
    inject(OrganizationContextService);

  readonly organizationId = computed(
    () => this.organizationContext.organizationId()
  );

  readonly learners = signal<TestCenterLearner[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly expandedUserId = signal<string | null>(null);

  readonly filteredLearners = computed(() => {
    const search = this.search()
      .trim()
      .toLowerCase();

    const status = this.statusFilter();

    return this.learners()
      .filter(learner => {
        const matchesSearch =
          !search ||
          learner.name.toLowerCase().includes(search) ||
          learner.email.toLowerCase().includes(search);

        const matchesStatus =
          status === 'all' ||
          (status === 'active' &&
            learner.status === 'active') ||
          learner.status === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly startedCount = computed(
    () => this.learners().filter(
      learner => learner.assessmentCount > 0
    ).length
  );

  readonly organizationAverage = computed(() => {
    const scores = this.learners()
      .map(learner => learner.averageScore)
      .filter((score): score is number => score !== null);

    if (!scores.length) {
      return null;
    }

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length
    );
  });

  constructor() {
    this.loadLearners();
  }

  loadLearners(): void {
    const organizationId = this.organizationId();

    if (!organizationId) {
      this.learners.set([]);
      this.error.set(
        'Select an organization to view its learners.'
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.learnersService
      .getLearners(organizationId)
      .subscribe({
        next: learners => {
          this.learners.set(learners);
          this.loading.set(false);
        },
        error: error => {
          console.error(
            '[TestCenterLearners] Failed to load learners',
            error
          );

          this.error.set(
            'You may not have permission to view these learners, or the data could not be loaded.'
          );

          this.loading.set(false);
        }
      });
  }

  toggleLearner(userId: string): void {
    this.expandedUserId.update(current =>
      current === userId ? null : userId
    );
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  formatRole(role: string): string {
    return role
      .replace(/^org_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character =>
        character.toUpperCase()
      );
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Learning';
      case 'not-started':
        return 'Not started';
      case 'inactive':
        return 'Inactive';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }
}