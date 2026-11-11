import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import {
  AdminBackLinkComponent,
  AdminLayoutSwitchComponent,
  adminViewState,
} from '../../shared/admin-view';

import { JobFormComponent } from './job-form/job-form.component';
import { JobImportComponent } from './job-import.component';
import { JobProvidersComponent } from './components/job-providers/job-providers.component';

import { AuthService } from '../../../../core/services/auth.service';

import {
  Job,
  isJobExpired,
  isJobOpen,
  jobExpiresAtMillis,
} from '../../../../core/models/job.model';

/** The stored expiry, else the rule (deadline + 5 days, or posted + 60 days). */
function jobExpiresAtMillisOf(job: Job): number | null {
  return job.expiresAt?.toMillis() ?? jobExpiresAtMillis(job);
}

import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { HotToastService } from '@ngxpert/hot-toast';
import { JobStore } from '../../../jobs/stores/job.store';
import { PageTitleService } from '../../../../core/services/page-title.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-job-admin',

  standalone: true,

  imports: [
    NgTemplateOutlet,
    MatIconModule,
    AdminLayoutSwitchComponent,
    AdminBackLinkComponent,
    JobFormComponent,
    JobImportComponent,
    JobProvidersComponent,
    RouterLink,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
  ],

  template: `
    <main class="mt-16 min-h-screen bg-gray-50 mt-16">
      <h1 class="sr-only">Job management</h1>

      <div class="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <!-- =====================================================
             JOB MANAGEMENT NAVIGATION
        ====================================================== -->

        <section class="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          <nav class="flex flex-wrap items-center gap-2" aria-label="Job management sections">
            <button
              type="button"
              (click)="setActiveTab('jobs')"
              [attr.aria-current]="activeTab() === 'jobs' ? 'page' : null"
              [class]="
                'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ' +
                (activeTab() === 'jobs'
                  ? 'bg-[#007979] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100')
              "
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]"> work </mat-icon>
              All Jobs

              <span
                class="rounded-full px-2 py-0.5 text-xs"
                [class]="
                  activeTab() === 'jobs' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                "
              >
                {{ jobs().length }}
              </span>
            </button>

            <button
              type="button"
              (click)="setActiveTab('providers')"
              [attr.aria-current]="activeTab() === 'providers' ? 'page' : null"
              [class]="
                'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ' +
                (activeTab() === 'providers'
                  ? 'bg-[#007979] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100')
              "
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]"> cloud_sync </mat-icon>

              Job Providers

              <span
                class="rounded-full px-2 py-0.5 text-xs"
                [class]="
                  activeTab() === 'providers'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                External
              </span>
            </button>

            <!-- Push action controls to the far right on desktop -->
            <span class="hidden flex-1 sm:block"></span>

            <div class="hidden sm:block">
              <app-admin-layout-switch [state]="viewState" />
            </div>

            <span class="flex-1 sm:hidden"></span>

            <button
              type="button"
              (click)="importOpen.set(!importOpen())"
              [attr.aria-expanded]="importOpen()"
              class="hidden h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-[#007979] hover:text-[#007979] sm:inline-flex"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true"> upload_file </mat-icon>

              Import CSV
            </button>

            <!-- Add job -->

            <a
              href="/admin/jobs/new"
              (click)="startCreate($event)"
              class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666]"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true"> add </mat-icon>

              <span>Add job</span>
            </a>

            <!-- More options -->

            <button
              mat-icon-button
              type="button"
              [matMenuTriggerFor]="pageMenu"
              aria-label="More options"
              class="!text-gray-600"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #pageMenu="matMenu" xPosition="before">
              <!-- View options -->
              <div
                class="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Display
              </div>

              <button mat-menu-item type="button" (click)="viewState.setLayout('list')">
                <mat-icon>
                  {{ viewState.layout() === 'list' ? 'radio_button_checked' : 'view_list' }}
                </mat-icon>
                <span>List view</span>
              </button>

              <button mat-menu-item type="button" (click)="viewState.setLayout('cards')">
                <mat-icon>
                  {{ viewState.layout() === 'cards' ? 'radio_button_checked' : 'grid_view' }}
                </mat-icon>
                <span>Cards view</span>
              </button>

              <button mat-menu-item type="button" (click)="viewState.setLayout('split')">
                <mat-icon>
                  {{ viewState.layout() === 'split' ? 'radio_button_checked' : 'vertical_split' }}
                </mat-icon>
                <span>Split view</span>
              </button>

              <mat-divider></mat-divider>

              <!-- Job management -->
              <button mat-menu-item type="button" (click)="importOpen.set(true)">
                <mat-icon>upload_file</mat-icon>
                <span>Import jobs (CSV)</span>
              </button>

              <a mat-menu-item routerLink="/jobs" target="_blank">
                <mat-icon>open_in_new</mat-icon>
                <span>View the job board</span>
              </a>

              <mat-divider></mat-divider>

              <!-- Administration -->
              <a mat-menu-item routerLink="/admin">
                <mat-icon>dashboard</mat-icon>
                <span>Admin dashboard</span>
              </a>

              <a mat-menu-item routerLink="/admin/resources">
                <mat-icon>library_books</mat-icon>
                <span>Resources</span>
              </a>

              <a mat-menu-item routerLink="/admin/categories">
                <mat-icon>category</mat-icon>
                <span>Categories</span>
              </a>

              <a mat-menu-item routerLink="/admin/organizations">
                <mat-icon>business</mat-icon>
                <span>Organizations</span>
              </a>

              <a mat-menu-item routerLink="/admin/contact">
                <mat-icon>contact_mail</mat-icon>
                <span>Contact messages</span>
              </a>

              <mat-divider></mat-divider>

              <button mat-menu-item type="button" (click)="signOut()">
                <mat-icon class="!text-red-600">logout</mat-icon>
                <span class="text-red-600">Sign out</span>
              </button>
            </mat-menu>
          </nav>
        </section>

        <!-- =====================================================
             JOB PROVIDERS
        ====================================================== -->

        @if (activeTab() === 'providers') {
          <section class="space-y-4">
            <div>
              <h2 class="text-xl font-bold text-[#032D42]">Job Provider Management</h2>

              <p class="mt-1 text-sm text-gray-500">
                Monitor external job sources, API connections, and job synchronization.
              </p>
            </div>

            <app-job-providers />
          </section>
        }

        <!-- =====================================================
             EXISTING JOB MANAGEMENT
        ====================================================== -->

        @if (activeTab() === 'jobs') {
          <!-- ================= Toolbar ================= -->

          <section class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Mobile search -->

              <button
                type="button"
                (click)="toggleMobileSearch(searchBox)"
                [attr.aria-expanded]="searchShown()"
                aria-controls="admin-job-search"
                [attr.aria-label]="searchShown() ? 'Hide search' : 'Search jobs'"
                [class]="
                  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition sm:hidden ' +
                  (searchShown()
                    ? 'border-[#007979] bg-[#007979]/10 text-[#007979]'
                    : 'border-gray-200 text-gray-600')
                "
              >
                <mat-icon aria-hidden="true">search</mat-icon>
              </button>

              <!-- Search -->

              <div
                id="admin-job-search"
                class="relative order-last min-w-0 basis-full sm:order-none sm:block sm:flex-1 sm:basis-56"
                [class.hidden]="!searchShown()"
              >
                <mat-icon
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-gray-400"
                  aria-hidden="true"
                >
                  search
                </mat-icon>

                <input
                  #searchBox
                  type="search"
                  [value]="searchTerm()"
                  (input)="setSearchTerm($any($event.target).value)"
                  (keydown.escape)="clearSearch()"
                  placeholder="Search title, employer, skill, place…"
                  aria-label="Search jobs"
                  class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007979] focus:ring-4 focus:ring-[#007979]/15"
                />
              </div>

              <span class="flex-1 sm:hidden"></span>

              <!-- ================= Other filters ================= -->

              <div class="mt-2 flex flex-wrap items-center gap-2">
                <div class="flex min-w-0 basis-full items-center gap-2 sm:basis-auto">
                  <label class="sr-only" for="job-type-filter"> Job type </label>

                  <select
                    id="job-type-filter"
                    (change)="setEmploymentTypeFilter($any($event.target).value)"
                    [class]="pill(employmentTypeFilter()) + ' min-w-0 flex-1 sm:flex-none'"
                  >
                    <option value="" [selected]="!employmentTypeFilter()">Any job type</option>

                    <option value="full-time" [selected]="employmentTypeFilter() === 'full-time'">
                      Full-time
                    </option>

                    <option value="part-time" [selected]="employmentTypeFilter() === 'part-time'">
                      Part-time
                    </option>

                    <option value="contract" [selected]="employmentTypeFilter() === 'contract'">
                      Contract
                    </option>

                    <option value="internship" [selected]="employmentTypeFilter() === 'internship'">
                      Internship
                    </option>

                    <option value="temporary" [selected]="employmentTypeFilter() === 'temporary'">
                      Temporary
                    </option>
                  </select>

                  <label class="sr-only" for="job-featured-filter"> Featured </label>

                  <select
                    id="job-featured-filter"
                    (change)="setFeaturedFilter($any($event.target).value)"
                    [class]="pill(featuredFilter()) + ' min-w-0 flex-1 sm:flex-none'"
                  >
                    <option value="" [selected]="!featuredFilter()">Featured or not</option>

                    <option value="featured" [selected]="featuredFilter() === 'featured'">
                      Featured only
                    </option>

                    <option value="not-featured" [selected]="featuredFilter() === 'not-featured'">
                      Not featured
                    </option>
                  </select>

                  <label class="sr-only" for="job-location-filter"> Location </label>

                  <input
                    id="job-location-filter"
                    type="search"
                    [value]="locationFilter()"
                    (input)="setLocationFilter($any($event.target).value)"
                    placeholder="City"
                    [class]="
                      pill(locationFilter()) +
                      ' min-w-0 flex-1 !pr-3 placeholder:text-gray-400 sm:w-44 sm:flex-none'
                    "
                  />
                </div>

                @if (hasActiveFilters()) {
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true"> close </mat-icon>

                    Clear all
                  </button>
                }
              </div>

              <!-- Add job -->

              <!-- More options -->
            </div>

            <!-- ================= Status chips ================= -->

            <div
              class="mt-3 flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter by status"
            >
              @for (chip of statusChips(); track chip.key) {
                <button
                  type="button"
                  (click)="toggleStatus(chip.key)"
                  [attr.aria-pressed]="statusFilter() === chip.key"
                  [class]="
                    'h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition sm:inline-flex ' +
                    (chip.key === '' ||
                    (chip.extra && !moreStatuses() && statusFilter() !== chip.key)
                      ? 'hidden '
                      : 'inline-flex ') +
                    (statusFilter() === chip.key
                      ? 'border-[#007979] bg-[#007979] font-semibold text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300')
                  "
                >
                  <span class="sm:hidden">{{ chip.short }}</span>
                  <span class="hidden sm:inline">{{ chip.label }}</span>

                  <span [class]="statusFilter() === chip.key ? 'text-white/85' : 'text-gray-400'">
                    {{ chip.count }}
                  </span>
                </button>
              }

              <button
                type="button"
                (click)="moreStatuses.set(!moreStatuses())"
                [attr.aria-expanded]="moreStatuses()"
                class="inline-flex h-8 items-center gap-0.5 rounded-full px-2.5 text-sm font-medium text-[#007979] hover:bg-[#007979]/10 sm:hidden"
              >
                {{ moreStatuses() ? 'Less' : 'More' }}

                <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">
                  {{ moreStatuses() ? 'expand_less' : 'expand_more' }}
                </mat-icon>
              </button>

              <span class="ml-auto text-sm text-gray-500" aria-live="polite">
                {{ filteredJobs().length }} of {{ jobs().length }} jobs
              </span>
            </div>
          </section>

          <!-- ================= CSV Import ================= -->

          @if (importOpen()) {
            <app-job-import
              [existingJobs]="jobs()"
              (imported)="loadJobs()"
              (closed)="importOpen.set(false)"
            />
          }

          <!-- ================= Main Content ================= -->

          <div
            [class]="viewState.layout() === 'split' ? 'grid items-start gap-4 lg:grid-cols-3' : ''"
          >
            <!-- ================= Form ================= -->

            @if (viewState.showForm()) {
              <div [class]="viewState.layout() === 'split' ? 'min-w-0 lg:col-span-2' : 'min-w-0'">
                @if (viewState.layout() !== 'split') {
                  <app-admin-back-link label="Back to jobs" (back)="closeForm()" />
                }

                <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  @for (key of formKeys(); track key) {
                    <app-job-form
                      [embedded]="true"
                      [editJobId]="editingJobId()"
                      [copyFromJobId]="copyingJobId()"
                      (saved)="onFormSaved()"
                      (cancelled)="closeForm()"
                    />
                  }
                </div>
              </div>
            }

            <!-- ================= Job List ================= -->

            @if (viewState.showList()) {
              <div
                [class]="
                  viewState.layout() === 'split'
                    ? 'min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto'
                    : 'min-w-0'
                "
              >
                @if (loading() && !jobs().length) {
                  <div
                    class="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-12 text-sm text-gray-600 shadow-sm"
                  >
                    <span
                      class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#007979]"
                    ></span>

                    Loading jobs…
                  </div>
                } @else if (error()) {
                  <div
                    class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                    role="alert"
                  >
                    {{ error() }}

                    <button type="button" (click)="loadJobs()" class="ml-2 font-semibold underline">
                      Try again
                    </button>
                  </div>
                } @else if (!filteredJobs().length) {
                  <div
                    class="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm"
                  >
                    <mat-icon class="!h-10 !w-10 !text-[40px] text-gray-300" aria-hidden="true">
                      work_off
                    </mat-icon>

                    <h2 class="mt-2 text-base font-semibold text-[#032D42]">
                      {{ jobs().length ? 'No jobs match' : 'No jobs yet' }}
                    </h2>

                    <p class="mt-1 text-sm text-gray-500">
                      {{
                        jobs().length
                          ? 'Try another search or clear the filters.'
                          : 'Add a job, or import several from a CSV file.'
                      }}
                    </p>

                    <div class="mt-4 flex justify-center gap-2">
                      @if (hasActiveFilters()) {
                        <button
                          type="button"
                          (click)="clearFilters()"
                          class="h-9 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:border-[#007979]"
                        >
                          Clear filters
                        </button>
                      }

                      <a
                        href="/admin/jobs/new"
                        (click)="startCreate($event)"
                        class="inline-flex h-9 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]"
                      >
                        Add job
                      </a>
                    </div>
                  </div>
                } @else if (viewState.layout() === 'cards') {
                  <!-- ================= Cards ================= -->

                  <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    @for (job of filteredJobs(); track job.id) {
                      <li
                        class="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div class="flex items-start gap-2">
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-1.5">
                              <span [class]="statusClasses(job.status)">
                                {{ formatStatus(job.status) }}
                              </span>

                              @if (job.featured) {
                                <span
                                  class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                                >
                                  Featured
                                </span>
                              }
                            </div>

                            <a
                              [href]="'/admin/jobs/' + job.id + '/edit'"
                              (click)="openEdit($event, job.id)"
                              class="mt-1.5 line-clamp-2 block text-[15px] font-semibold leading-snug text-[#032D42] hover:text-[#007979]"
                            >
                              {{ job.title }}
                            </a>

                            <p class="mt-0.5 truncate text-sm text-gray-600">
                              {{ job.organizationName }}
                            </p>
                          </div>

                          <ng-container *ngTemplateOutlet="rowMenu; context: { $implicit: job }" />
                        </div>

                        <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                          <div>
                            <dt class="text-gray-500">Where</dt>
                            <dd class="truncate text-gray-800">
                              {{ formatLocation(job) }} ·
                              {{ formatWorkArrangement(job.workArrangement) }}
                            </dd>
                          </div>

                          <div>
                            <dt class="text-gray-500">Type</dt>
                            <dd class="text-gray-800">
                              {{ formatEmploymentType(job.employmentType) }}
                            </dd>
                          </div>

                          <div>
                            <dt class="text-gray-500">Pay</dt>
                            <dd class="truncate text-gray-800">
                              {{ formatPay(job) }}
                            </dd>
                          </div>

                          <div>
                            <dt class="text-gray-500">Deadline</dt>
                            <dd class="text-gray-800">
                              {{ formatDeadline(job) }}
                            </dd>
                          </div>
                        </dl>

                        @if (expiryNote(job); as note) {
                          <p class="mt-auto pt-3 text-xs text-gray-500">
                            {{ note }}
                          </p>
                        }
                      </li>
                    }
                  </ul>
                } @else {
                  <!-- ================= List / Split ================= -->

                  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    @if (viewState.layout() !== 'split') {
                      <div
                        class="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid"
                      >
                        <span>Job</span>
                        <span>Where</span>
                        <span>Type and pay</span>
                        <span>Status</span>
                        <span class="sr-only">Actions</span>
                      </div>
                    }

                    <ul class="divide-y divide-gray-100">
                      @for (job of filteredJobs(); track job.id) {
                        <li
                          [class]="
                            'items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50 ' +
                            (viewState.layout() === 'split'
                              ? 'flex'
                              : 'flex md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_40px]') +
                            (editingJobId() === job.id ? ' bg-[#007979]/5' : '')
                          "
                        >
                          <div class="min-w-0 flex-1">
                            <a
                              [href]="'/admin/jobs/' + job.id + '/edit'"
                              (click)="openEdit($event, job.id)"
                              class="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-[#032D42] hover:text-[#007979]"
                            >
                              <span class="truncate">
                                {{ job.title }}
                              </span>

                              @if (job.featured) {
                                <mat-icon
                                  class="!h-4 !w-4 shrink-0 !text-base text-amber-500"
                                  aria-label="Featured"
                                >
                                  star
                                </mat-icon>
                              }
                            </a>

                            <p class="truncate text-xs text-gray-500">
                              {{ job.organizationName }}

                              @if (viewState.layout() === 'split') {
                                · {{ formatStatus(job.status) }}
                              }
                            </p>

                            @if (viewState.layout() !== 'split') {
                              <p class="truncate text-xs text-gray-500 md:hidden">
                                {{ formatStatus(job.status) }} · {{ formatLocation(job) }} ·
                                {{ formatEmploymentType(job.employmentType) }}
                              </p>
                            }
                          </div>

                          @if (viewState.layout() !== 'split') {
                            <div class="hidden min-w-0 text-sm md:block">
                              <p class="truncate text-gray-800">
                                {{ formatLocation(job) }}
                              </p>

                              <p class="truncate text-xs text-gray-500">
                                {{ formatWorkArrangement(job.workArrangement) }}
                              </p>
                            </div>

                            <div class="hidden min-w-0 text-sm md:block">
                              <p class="truncate text-gray-800">
                                {{ formatEmploymentType(job.employmentType) }}
                              </p>

                              <p class="truncate text-xs text-gray-500">
                                {{ formatPay(job) }}
                              </p>
                            </div>

                            <div class="hidden min-w-0 md:block">
                              <span [class]="statusClasses(job.status)">
                                {{ formatStatus(job.status) }}
                              </span>

                              @if (expiryNote(job); as note) {
                                <p class="mt-0.5 truncate text-xs text-gray-500" [title]="note">
                                  {{ note }}
                                </p>
                              }
                            </div>
                          }

                          <ng-container *ngTemplateOutlet="rowMenu; context: { $implicit: job }" />
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- ================= Shared Row Actions ================= -->

      <ng-template #rowMenu let-job>
        <button
          mat-icon-button
          type="button"
          [matMenuTriggerFor]="jobMenu"
          [attr.aria-label]="'Actions for ' + job.title"
          class="!h-9 !w-9 shrink-0 !p-1.5 !text-gray-500"
        >
          <mat-icon>more_vert</mat-icon>
        </button>

        <mat-menu #jobMenu="matMenu" xPosition="before">
          <a
            mat-menu-item
            [href]="'/admin/jobs/' + job.id + '/edit'"
            (click)="openEdit($event, job.id)"
          >
            <mat-icon>edit</mat-icon>
            <span>Edit</span>
          </a>

          <a
            mat-menu-item
            [href]="'/admin/jobs/new?copy=' + job.id"
            (click)="openCopy($event, job.id)"
          >
            <mat-icon>content_copy</mat-icon>
            <span>Copy as new job</span>
          </a>

          @if (job.status === 'active') {
            <a mat-menu-item [routerLink]="['/jobs', job.id]" target="_blank">
              <mat-icon>open_in_new</mat-icon>
              <span>View on the job board</span>
            </a>
          }

          <mat-divider></mat-divider>

          <button mat-menu-item type="button" (click)="deleteJob(job)">
            <mat-icon class="!text-red-600">delete</mat-icon>
            <span class="text-red-600">Delete</span>
          </button>
        </mat-menu>
      </ng-template>
    </main>
  `,
})
export class JobAdminComponent implements OnInit {
  // =========================================================
  // Services
  // =========================================================

  private readonly router = inject(Router);

  private readonly jobStore = inject(JobStore);

  private readonly authService = inject(AuthService);

  private readonly toast = inject(HotToastService);

  private readonly pageTitleService = inject(PageTitleService);

  // =========================================================
  // Main Navigation
  // =========================================================

  protected readonly activeTab = signal<'jobs' | 'providers'>('jobs');

  protected setActiveTab(tab: 'jobs' | 'providers'): void {
    this.activeTab.set(tab);
  }

  // =========================================================
  // Job State
  // =========================================================

  protected readonly jobs = this.jobStore.jobs;

  protected readonly loading = this.jobStore.loading;

  protected readonly error = this.jobStore.error;

  // =========================================================
  // Search / Filter State
  // =========================================================

  protected readonly searchTerm = signal('');

  protected readonly viewState = adminViewState('jobs');

  // =========================================================
  // Create / Edit
  // =========================================================

  protected readonly editingJobId = signal<string | null>(null);

  private readonly formKey = signal(0);

  protected readonly formKeys = computed(() => [this.formKey()]);

  protected expiryNote(job: Job): string {
    if (job.closedReason === 'expired') {
      return 'Closed automatically';
    }

    if (job.status !== 'active') {
      return '';
    }

    const expires = jobExpiresAtMillisOf(job);

    if (expires === null) {
      return '';
    }

    if (isJobExpired(job)) {
      return 'Past its closing date (hidden; closes tonight)';
    }

    return `Closes ${new Date(expires).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }

  // =========================================================
  // Mobile Search
  // =========================================================

  private readonly mobileSearch = signal(false);

  protected readonly searchShown = computed(
    () => this.mobileSearch() || this.searchTerm().trim() !== '',
  );

  protected toggleMobileSearch(input: HTMLInputElement): void {
    if (this.searchShown()) {
      this.mobileSearch.set(false);
      this.clearSearch();
      return;
    }

    this.mobileSearch.set(true);

    setTimeout(() => input.focus());
  }

  // =========================================================
  // Status Filters
  // =========================================================

  protected readonly moreStatuses = signal(false);

  protected toggleStatus(key: string): void {
    this.setStatusFilter(this.statusFilter() === key ? '' : key);
  }

  protected readonly statusChips = computed(() => {
    const jobs = this.jobs();

    const week = 7 * 24 * 60 * 60 * 1000;

    const now = Date.now();

    return [
      {
        key: '',
        label: 'All',
        short: 'All',
        count: jobs.length,
        extra: false,
      },

      {
        key: 'draft',
        label: 'Drafts',
        short: 'Drafts',
        count: jobs.filter((job) => job.status === 'draft').length,
        extra: false,
      },

      {
        key: 'active',
        label: 'Active',
        short: 'Active',
        count: jobs.filter((job) => job.status === 'active').length,
        extra: false,
      },

      {
        extra: false,
        key: 'expiring',
        label: 'Expiring in 7 days',
        short: 'Expiring',
        count: jobs.filter((job) => {
          const expires = jobExpiresAtMillisOf(job);
          return isJobOpen(job) && expires !== null && expires - now <= week;
        }).length,
      },

      {
        key: 'closed',
        label: 'Closed',
        short: 'Closed',
        count: jobs.filter((job) => job.status === 'closed').length,
        extra: true,
      },

      {
        extra: true,
        key: 'expired',
        label: 'Closed automatically',
        short: 'Auto-closed',
        count: jobs.filter(
          (job) => job.closedReason === 'expired' || (job.status === 'active' && isJobExpired(job)),
        ).length,
      },
    ];
  });

  protected pill(value: string): string {
    return (
      'h-8 rounded-full border py-0 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (value
        ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]'
        : 'border-gray-300 bg-white text-gray-700')
    );
  }

  // =========================================================
  // Import / Copy
  // =========================================================

  protected readonly importOpen = signal(false);

  protected readonly copyingJobId = signal<string | null>(null);

  protected openCopy(event: Event, jobId: string | undefined): void {
    event.preventDefault();

    if (!jobId) {
      return;
    }

    this.editingJobId.set(null);
    this.copyingJobId.set(jobId);

    this.formKey.update((key) => key + 1);

    this.viewState.openForm();
  }

  protected startCreate(event?: Event): void {
    event?.preventDefault();

    this.copyingJobId.set(null);
    this.editingJobId.set(null);

    this.formKey.update((key) => key + 1);

    this.viewState.openForm();
  }

  protected openEdit(event: Event, jobId: string | undefined): void {
    event.preventDefault();

    if (!jobId) {
      return;
    }

    this.copyingJobId.set(null);
    this.editingJobId.set(jobId);

    this.formKey.update((key) => key + 1);

    this.viewState.openForm();
  }

  protected closeForm(): void {
    this.copyingJobId.set(null);
    this.editingJobId.set(null);

    this.formKey.update((key) => key + 1);

    this.viewState.backToList();
  }

  protected async onFormSaved(): Promise<void> {
    this.closeForm();

    await this.loadJobs();
  }

  // =========================================================
  // Job Helpers
  // =========================================================

  protected skillsOf(job: Job): string[] {
    return Array.isArray(job.skills) ? job.skills : [];
  }

  protected formatWorkArrangement(value: Job['workArrangement'] | undefined): string {
    switch (value) {
      case 'on-site':
        return 'On-site';

      case 'hybrid':
        return 'Hybrid';

      case 'remote':
        return 'Remote';

      default:
        return 'Not specified';
    }
  }

  protected formatPay(job: Job): string {
    const pay = job.compensation;

    if (!pay || (pay.min == null && pay.max == null)) {
      return 'Not listed';
    }

    const money = (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: pay.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(value);

    const range =
      pay.min != null && pay.max != null
        ? `${money(pay.min)} – ${money(pay.max)}`
        : money((pay.min ?? pay.max) as number);

    return pay.period ? `${range} / ${pay.period}` : range;
  }

  protected formatDeadline(job: Job): string {
    const deadline = job.applicationDeadline;

    if (!deadline) {
      return 'Open';
    }

    const date =
      typeof (deadline as { toDate?: () => Date }).toDate === 'function'
        ? (deadline as { toDate: () => Date }).toDate()
        : new Date(deadline as unknown as string);

    return Number.isNaN(date.getTime())
      ? 'Open'
      : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  }

  // =========================================================
  // Filters
  // =========================================================

  protected readonly jobFilter = signal('');

  protected readonly organizationFilter = signal('');

  protected readonly employmentTypeFilter = signal('');

  protected readonly locationFilter = signal('');

  protected readonly statusFilter = signal('');

  protected readonly featuredFilter = signal('');

  // =========================================================
  // Filtered Jobs
  // =========================================================

  protected readonly filteredJobs = computed(() => {
    const jobs = this.jobs();

    const search = this.searchTerm().trim().toLowerCase();

    const jobFilter = this.jobFilter().trim().toLowerCase();

    const organizationFilter = this.organizationFilter().trim().toLowerCase();

    const employmentTypeFilter = this.employmentTypeFilter().trim().toLowerCase();

    const locationFilter = this.locationFilter().trim().toLowerCase();

    const statusFilter = this.statusFilter().trim().toLowerCase();

    const featuredFilter = this.featuredFilter().trim().toLowerCase();

    return jobs.filter((job) => {
      // Global Search

      if (search) {
        const searchableText = [
          job.title,
          job.organizationName,
          job.description,
          job.categoryName,
          job.location?.city,
          job.location?.state,
          job.location?.country,

          ...(job.skills ?? []),
          ...(job.tags ?? []),

          job.employmentType,
          job.workArrangement,
          job.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      // Job

      if (jobFilter && !job.title.toLowerCase().includes(jobFilter)) {
        return false;
      }

      // Organization

      if (organizationFilter && !job.organizationName.toLowerCase().includes(organizationFilter)) {
        return false;
      }

      // Employment Type

      if (employmentTypeFilter && job.employmentType !== employmentTypeFilter) {
        return false;
      }

      // Location

      if (locationFilter) {
        const location = [
          job.location?.city,
          job.location?.state,
          job.location?.country,
          job.workArrangement,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!location.includes(locationFilter)) {
          return false;
        }
      }

      // Status

      if (statusFilter === 'expiring') {
        const expires = jobExpiresAtMillisOf(job);

        if (!isJobOpen(job) || expires === null || expires - Date.now() > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
      } else if (statusFilter === 'expired') {
        if (job.closedReason !== 'expired' && !(job.status === 'active' && isJobExpired(job))) {
          return false;
        }
      } else if (statusFilter && job.status !== statusFilter) {
        return false;
      }

      // Featured

      if (featuredFilter === 'featured' && !job.featured) {
        return false;
      }

      if (featuredFilter === 'not-featured' && job.featured) {
        return false;
      }

      return true;
    });
  });

  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    this.pageTitleService.setTitle('Job Management');

    void this.loadJobs();
  }

  // =========================================================
  // Load Jobs
  // =========================================================

  protected async loadJobs(): Promise<void> {
    await this.jobStore.loadJobs();

    if (this.jobStore.error()) {
      this.toast.error(this.jobStore.error() ?? 'Unable to load jobs. Please try again.');
    }
  }

  // =========================================================
  // Search
  // =========================================================

  protected setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  // =========================================================
  // Filters
  // =========================================================

  protected setJobFilter(value: string): void {
    this.jobFilter.set(value);
  }

  protected setOrganizationFilter(value: string): void {
    this.organizationFilter.set(value);
  }

  protected setEmploymentTypeFilter(value: string): void {
    this.employmentTypeFilter.set(value);
  }

  protected setLocationFilter(value: string): void {
    this.locationFilter.set(value);
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  protected setFeaturedFilter(value: string): void {
    this.featuredFilter.set(value);
  }

  // =========================================================
  // Clear Filters
  // =========================================================

  protected clearFilters(): void {
    this.searchTerm.set('');

    this.jobFilter.set('');

    this.organizationFilter.set('');

    this.employmentTypeFilter.set('');

    this.locationFilter.set('');

    this.statusFilter.set('');

    this.featuredFilter.set('');
  }

  // =========================================================
  // Active Filters
  // =========================================================

  protected hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm().trim() ||
      this.jobFilter().trim() ||
      this.organizationFilter().trim() ||
      this.employmentTypeFilter().trim() ||
      this.locationFilter().trim() ||
      this.statusFilter().trim() ||
      this.featuredFilter().trim(),
    );
  }

  // =========================================================
  // Delete Job
  // =========================================================

  protected async deleteJob(job: Job): Promise<void> {
    if (!job.id) {
      this.toast.error('Unable to delete this job because its ID is missing.');

      return;
    }

    const confirmed = window.confirm(`Delete "${job.title}"?\n\nThis action cannot be undone.`);

    if (!confirmed) {
      this.toast.info('Job deletion cancelled.');

      return;
    }

    try {
      this.toast.info('Deleting job...');

      await this.jobStore.deleteJob(job.id);

      this.toast.success('Job deleted successfully.');
    } catch (error) {
      console.error('Failed to delete job:', error);

      this.toast.error('Unable to delete the job. Please try again.');
    }
  }

  // =========================================================
  // Status Counts
  // =========================================================

  protected activeCount(): number {
    return this.jobs().filter((job) => job.status === 'active').length;
  }

  protected draftCount(): number {
    return this.jobs().filter((job) => job.status === 'draft').length;
  }

  protected closedCount(): number {
    return this.jobs().filter((job) => job.status === 'closed').length;
  }

  // =========================================================
  // Display Helpers
  // =========================================================

  protected formatEmploymentType(value: Job['employmentType']): string {
    const labels: Record<Job['employmentType'], string> = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      contract: 'Contract',
      internship: 'Internship',
      temporary: 'Temporary',
    };

    return labels[value];
  }

  protected formatStatus(value: Job['status']): string {
    const labels: Record<Job['status'], string> = {
      draft: 'Draft',
      active: 'Active',
      closed: 'Closed',
    };

    return labels[value];
  }

  protected statusClasses(value: Job['status']): string {
    if (value === 'active') {
      return `
        inline-flex
        rounded-full
        bg-green-100
        px-2.5 py-1
        text-xs
        font-semibold
        text-green-700
      `;
    }

    if (value === 'draft') {
      return `
        inline-flex
        rounded-full
        bg-yellow-100
        px-2.5 py-1
        text-xs
        font-semibold
        text-yellow-700
      `;
    }

    return `
      inline-flex
      rounded-full
      bg-gray-100
      px-2.5 py-1
      text-xs
      font-semibold
      text-gray-600
    `;
  }

  protected formatLocation(job: Job): string {
    const city = job.location?.city?.trim();

    const state = job.location?.state?.trim();

    if (city && state) {
      return `${city}, ${state}`;
    }

    if (city) {
      return city;
    }

    if (state) {
      return state;
    }

    if (job.workArrangement === 'remote') {
      return 'Remote';
    }

    return 'Not specified';
  }

  protected truncate(value: string | undefined, maxLength: number): string {
    if (!value) {
      return '';
    }

    const text = value.trim();

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength).trimEnd() + '...';
  }

  // =========================================================
  // Sign Out
  // =========================================================

  protected async signOut(): Promise<void> {
    try {
      await this.authService.logout();

      this.toast.success('You have been signed out.');

      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Failed to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    }
  }
}
