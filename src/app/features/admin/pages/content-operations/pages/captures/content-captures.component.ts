import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';

import { PageTitleService } from '../../../../../../core/services/page-title.service';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import {
  ContentCapture,
  ContentCaptureStatus,
  ContentCaptureType,
} from '../../models/content-captures.model';

import { ContentMilestone } from '../../models/content-milestones.model';

import { ContentCaptureService } from '../../services/content-capture.service';
import { ContentMilestoneService } from '../../services/content-milestone.service';

@Component({
  selector: 'app-content-captures',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- =========================================================
           PAGE HEADER
      ========================================================== -->

      <header class="border-b border-slate-200 mt-15 bg-[#2a835f] ">
        <div class="mx-auto max-w-7xl px-6 py-2">

          <!-- Breadcrumbs -->

          <nav
            class="mb-1 flex flex-wrap items-center gap-2 text-sm text-slate-500"
            aria-label="Breadcrumb"
          >
            <a
              routerLink="/admin"
              class="transition hover:text-white text-white/80"
            >
              Admin Dashboard
            </a>

            <span>/</span>

            <a
              routerLink="/admin/content-operations"
              class="transition hover:text-white text-white/80"
            >
              Content & Operations
            </a>

            <span>/</span>

            <span class="font-medium text-white">
              Capture Moments
            </span>
          </nav>

          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>

              <!-- <div
                class="mb-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Figure Out With J
              </div> -->

             

              <p
                class=" max-w-3xl text-base leading-7 text-white"
              >
                Capture meaningful development moments that can later become
                YouTube episodes, Shorts, tutorials, social posts, screenshots,
                or documentation.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">

              <button
                type="button"
                (click)="openCreateForm()"
                class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <span class="mr-2 text-lg leading-none">+</span>
                New Capture
              </button>

              <a
                routerLink="/admin/content-operations/milestones"
                class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View Milestones
              </a>

            </div>
          </div>
        </div>
      </header>

      <!-- =========================================================
           MAIN CONTENT
      ========================================================== -->

      <main class="mx-auto max-w-7xl px-6 py-8">

        <!-- =======================================================
             ERROR
        ======================================================== -->

        @if (error()) {
          <section
            class="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <div class="flex items-start gap-3">

              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"
              >
                !
              </div>

              <div>
                <h2 class="font-semibold text-red-900">
                  Unable to load captures
                </h2>

                <p class="mt-1 text-sm leading-6 text-red-700">
                  {{ error() }}
                </p>

                <button
                  type="button"
                  (click)="loadData()"
                  class="mt-3 text-sm font-semibold text-red-800 underline"
                >
                  Try again
                </button>
              </div>

            </div>
          </section>
        }

        <!-- =======================================================
             INTRO
        ======================================================== -->

        <section
          class="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="grid gap-0 lg:grid-cols-[1.5fr_1fr]">

            <div class="p-6 sm:p-8">

              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 10.5 19.5 8.25v7.5l-3.75-2.25v1.125A2.625 2.625 0 0 1 13.125 17.25h-6A2.625 2.625 0 0 1 4.5 14.625v-5.25A2.625 2.625 0 0 1 7.125 6.75h6a2.625 2.625 0 0 1 2.625 2.625V10.5Z"
                  />
                </svg>
              </div>

              <h2 class="text-xl font-bold text-slate-900">
                Don't capture everything. Capture what matters.
              </h2>

              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                The goal is not to document every line of code or every small
                change. Capture moments that tell a story, demonstrate a
                solution, reveal a problem, or show meaningful progress.
              </p>

              <div class="mt-6 grid gap-3 sm:grid-cols-3">

                @for (
                  principle of capturePrinciples;
                  track principle.title
                ) {
                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div
                      class="mb-2 text-sm font-semibold text-slate-900"
                    >
                      {{ principle.title }}
                    </div>

                    <p class="text-xs leading-5 text-slate-600">
                      {{ principle.description }}
                    </p>
                  </div>
                }

              </div>
            </div>

            <div
              class="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0 sm:p-8"
            >
              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Capture Rule
              </div>

              <blockquote
                class="mt-3 border-l-4 border-slate-300 pl-4 text-lg font-semibold leading-7 text-slate-800"
              >
                “If this development moment would make a good story, tutorial,
                demo, or before-and-after, capture it.”
              </blockquote>

              <p class="mt-4 text-sm leading-6 text-slate-500">
                This keeps the content library useful without turning
                development into a constant recording session.
              </p>
            </div>

          </div>
        </section>

        <!-- =======================================================
             CURRENT CAPTURE OPPORTUNITY
        ======================================================== -->

        @if (currentMilestone()) {
          <section class="mb-8">

            <div
              class="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              <div
                class="border-b border-slate-200 px-6 py-5 sm:px-8"
              >
                <div
                  class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Current Capture Opportunity
                </div>

                <h2 class="mt-1 text-xl font-bold text-slate-900">
                  {{ currentMilestone()!.title }}
                </h2>

                @if (currentMilestone()!.feature) {
                  <p class="mt-1 text-sm text-slate-600">
                    {{ currentMilestone()!.feature }}
                  </p>
                }
              </div>

              <div
                class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
              >

                <div>

                  <h3 class="text-sm font-semibold text-slate-900">
                    What to capture
                  </h3>

                  <ul class="mt-3 space-y-3">

                    @for (
                      item of currentCaptureChecklist;
                      track item
                    ) {
                      <li
                        class="flex gap-3 text-sm text-slate-600"
                      >
                        <span
                          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white"
                        >
                          ✓
                        </span>

                        <span>{{ item }}</span>
                      </li>
                    }

                  </ul>
                </div>

                <div
                  class="rounded-xl border border-slate-200 bg-slate-50 p-5 lg:min-w-72"
                >

                  <div
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Potential Episode
                  </div>

                  <p
                    class="mt-2 text-sm font-semibold leading-6 text-slate-900"
                  >
                    {{
                      currentMilestone()!.potentialTitle ||
                      'No potential title recorded'
                    }}
                  </p>

                  <div class="mt-4">

                    <span
                      class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                    >
                      {{
                        milestoneCaptureCount(
                          currentMilestone()!.id
                        )
                      }}
                      captures
                    </span>

                  </div>

                </div>

              </div>
            </div>
          </section>
        }

        <!-- =======================================================
             CREATE / EDIT FORM
        ======================================================== -->

      @if (showForm()) {
  <section
    id="capture-form"
    class="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm"
  >

            <div
              class="border-b border-slate-200 px-6 py-5 sm:px-8"
            >
              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {{ editingCapture() ? 'Edit Capture' : 'New Capture' }}
              </div>

              <h2 class="mt-1 text-xl font-bold text-slate-900">
                {{
                  editingCapture()
                    ? 'Update development capture'
                    : 'Register a development capture'
                }}
              </h2>
            </div>

            <form
              class="space-y-6 p-6 sm:p-8"
              (submit)="saveCapture($event)"
            >

              <!-- Title / Type -->

              <div class="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    for="capture-title"
                    class="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Title
                  </label>

                  <input
                    id="capture-title"
                    type="text"
                    [value]="formTitle()"
                    (input)="setTitle($event)"
                    placeholder="Example: Milestones CRUD Workflow"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    for="capture-type"
                    class="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Capture Type
                  </label>

                  <select
                    id="capture-type"
                    [value]="formType()"
                    (change)="setType($event)"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="screenshot">
                      Screenshot
                    </option>

                    <option value="recording">
                      Screen Recording
                    </option>

                    <option value="before-after">
                      Before / After
                    </option>

                    <option value="demo">
                      Demo
                    </option>

                    <option value="note">
                      Development Note
                    </option>
                  </select>
                </div>

              </div>

              <!-- Milestone / Status -->

              <div class="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    for="capture-milestone"
                    class="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Milestone
                  </label>

                  <select
                    id="capture-milestone"
                    [value]="formMilestoneId()"
                    (change)="setMilestoneId($event)"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">
                      Select a milestone
                    </option>

                    @for (
                      milestone of milestones();
                      track milestone.id
                    ) {
                      <option [value]="milestone.id">
                        {{ milestone.title }}
                      </option>
                    }
                  </select>
                </div>

                <div>
                  <label
                    for="capture-status"
                    class="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>

                  <select
                    id="capture-status"
                    [value]="formStatus()"
                    (change)="setStatus($event)"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="captured">
                      Captured
                    </option>

                    <option value="reviewed">
                      Reviewed
                    </option>

                    <option value="used">
                      Used
                    </option>

                    <option value="archived">
                      Archived
                    </option>
                  </select>
                </div>

              </div>

              <!-- Description -->

              <div>
                <label
                  for="capture-description"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="capture-description"
                  rows="4"
                  [value]="formDescription()"
                  (input)="setDescription($event)"
                  placeholder="Describe what was captured and why it matters."
                  class="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                ></textarea>
              </div>

              <!-- Storage URL -->

              <div>
                <label
                  for="capture-storage"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  External Storage URL
                </label>

                <input
                  id="capture-storage"
                  type="url"
                  [value]="formStorageUrl()"
                  (input)="setStorageUrl($event)"
                  placeholder="https://drive.google.com/..."
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p class="mt-2 text-xs text-slate-500">
                  Store large media externally. Zebron stores the metadata
                  and link.
                </p>
              </div>

              <!-- Tags -->

              <div>
                <label
                  for="capture-tags"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tags
                </label>

                <input
                  id="capture-tags"
                  type="text"
                  [value]="formTags()"
                  (input)="setTags($event)"
                  placeholder="community, notifications, development"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p class="mt-2 text-xs text-slate-500">
                  Separate tags with commas.
                </p>
              </div>

              @if (formError()) {
                <div
                  class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {{ formError() }}
                </div>
              }

              <!-- Actions -->

              <div
                class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"
              >

                <button
                  type="button"
                  (click)="closeForm()"
                  class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="saving()"
                  class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{ editingCapture() ? 'Save Changes' : 'Create Capture' }}
                  }
                </button>

              </div>

            </form>
          </section>
        }

        <!-- =======================================================
             METRICS
        ======================================================== -->

        <section class="mb-8">

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Total Captures
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ captures().length }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Development evidence registered
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Screenshots
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByType('screenshot') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                UI and development visuals
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Recordings
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByType('recording') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Screen recordings and demos
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Ready to Use
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalReady() }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Reviewed or already used
              </div>
            </div>

          </div>
        </section>

        <!-- =======================================================
             FILTERS
        ======================================================== -->

        <section
          class="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >

          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Capture Library
              </div>

              <h2 class="mt-1 text-xl font-bold text-slate-900">
                Development Evidence
              </h2>
            </div>

            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="clearFilters()"
                class="text-sm font-semibold text-slate-700 underline"
              >
                Clear filters
              </button>
            }
          </div>

          <div class="grid gap-4 md:grid-cols-3">

            <div>
              <label
                for="capture-search"
                class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <input
                id="capture-search"
                type="search"
                [value]="searchQuery()"
                (input)="setSearch($event)"
                placeholder="Search captures..."
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                for="capture-type-filter"
                class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Type
              </label>

              <select
                id="capture-type-filter"
                [value]="typeFilter()"
                (change)="setTypeFilter($event)"
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  All Types
                </option>

                <option value="screenshot">
                  Screenshots
                </option>

                <option value="recording">
                  Recordings
                </option>

                <option value="before-after">
                  Before / After
                </option>

                <option value="demo">
                  Demos
                </option>

                <option value="note">
                  Notes
                </option>
              </select>
            </div>

            <div>
              <label
                for="capture-status-filter"
                class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="capture-status-filter"
                [value]="statusFilter()"
                (change)="setStatusFilter($event)"
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="captured">
                  Captured
                </option>

                <option value="reviewed">
                  Reviewed
                </option>

                <option value="used">
                  Used
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>
            </div>

          </div>
        </section>

        <!-- =======================================================
             LOADING
        ======================================================== -->

        @if (loading()) {
          <section
            class="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
          >
            <div
              class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"
            ></div>

            <p class="mt-4 text-sm text-slate-500">
              Loading captures...
            </p>
          </section>
        }

        <!-- =======================================================
             EMPTY STATE
        ======================================================== -->

        @if (!loading() && filteredCaptures().length === 0) {
          <section
            class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
          >

            <div
              class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="h-7 w-7"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 5h16v14H4z"
                />

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m8 15 2.5-3 2 2 2.5-3 3 4"
                />
              </svg>
            </div>

            <h2 class="mt-4 text-lg font-bold text-slate-900">
              No captures found
            </h2>

            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Register your first meaningful development screenshot,
              recording, demo, before-and-after, or note.
            </p>

            <button
              type="button"
              (click)="openCreateForm()"
              class="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Capture
            </button>

          </section>
        }

        <!-- =======================================================
             CAPTURE CARDS
        ======================================================== -->

        @if (!loading() && filteredCaptures().length > 0) {

          <section class="grid gap-4 lg:grid-cols-2">

            @for (
              capture of filteredCaptures();
              track capture.id
            ) {

              <article
                class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >

                <div
                  class="flex items-start justify-between gap-4"
                >

                  <div
                    class="flex min-w-0 items-start gap-3"
                  >

                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                    >

                      @switch (capture.type) {

                        @case ('screenshot') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="h-5 w-5"
                          >
                            <rect
                              width="18"
                              height="14"
                              x="3"
                              y="5"
                              rx="2"
                            />

                            <circle
                              cx="8.5"
                              cy="10.5"
                              r="1.5"
                            />

                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m21 15-4.5-4.5L7 20"
                            />
                          </svg>
                        }

                        @case ('recording') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="h-5 w-5"
                          >
                            <rect
                              width="14"
                              height="12"
                              x="3"
                              y="6"
                              rx="2"
                            />

                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m17 10 4-2v8l-4-2"
                            />
                          </svg>
                        }

                        @case ('before-after') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="h-5 w-5"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M4 5h6v14H4zM14 5h6v14h-6z"
                            />

                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M12 8v8"
                            />
                          </svg>
                        }

                        @case ('demo') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="h-5 w-5"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m8 5 11 7-11 7V5Z"
                            />
                          </svg>
                        }

                        @default {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="h-5 w-5"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75Z"
                            />

                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M8 8h8M8 12h8M8 16h5"
                            />
                          </svg>
                        }

                      }

                    </div>

                    <div class="min-w-0">

                      <h3
                        class="truncate text-sm font-bold text-slate-900"
                      >
                        {{ capture.title }}
                      </h3>

                      <p class="mt-1 text-xs text-slate-500">
                        {{ captureTypeLabel(capture.type) }}
                      </p>

                    </div>
                  </div>

                  <span
                    class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    [class.bg-slate-100]="capture.status === 'captured'"
                    [class.text-slate-700]="capture.status === 'captured'"
                    [class.bg-emerald-50]="capture.status === 'reviewed'"
                    [class.text-emerald-700]="capture.status === 'reviewed'"
                    [class.bg-blue-50]="capture.status === 'used'"
                    [class.text-blue-700]="capture.status === 'used'"
                    [class.bg-amber-50]="capture.status === 'archived'"
                    [class.text-amber-700]="capture.status === 'archived'"
                  >
                    {{ capture.status }}
                  </span>

                </div>

                @if (capture.description) {
                  <p
                    class="mt-4 text-sm leading-6 text-slate-600"
                  >
                    {{ capture.description }}
                  </p>
                }

                @if (capture.tags?.length) {
                  <div class="mt-4 flex flex-wrap gap-2">

                    @for (
                      tag of capture.tags ?? [];
                      track tag
                    ) {
                      <span
                        class="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                      >
                        #{{ tag }}
                      </span>
                    }

                  </div>
                }

                <div
                  class="mt-5 border-t border-slate-100 pt-4"
                >

                  <div
                    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <span class="text-xs text-slate-500">
                      Milestone:
                      <strong class="font-semibold text-slate-700">
                        {{ milestoneTitle(capture.milestoneId) }}
                      </strong>
                    </span>

                    @if (capture.storageUrl) {
                      <a
                        [href]="capture.storageUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Open Storage →
                      </a>
                    } @else {
                      <span class="text-xs text-slate-400">
                        Storage not configured
                      </span>
                    }

                  </div>

                  <div
                    class="mt-4 flex flex-wrap gap-2"
                  >

                    <button
                      type="button"
                      (click)="editCapture(capture)"
                      class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteCapture(capture)"
                      class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </article>

            }

          </section>
        }

        <!-- =======================================================
             WORKFLOW
        ======================================================== -->

        <section
          class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          <div
            class="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Recommended Workflow
          </div>

          <h2 class="mt-1 text-xl font-bold text-slate-900">
            From Development Moment to Content
          </h2>

          <div
            class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >

            @for (
              step of captureWorkflow;
              track step.number
            ) {

              <div class="relative">

                <div
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
                >
                  {{ step.number }}
                </div>

                <h3
                  class="mt-3 text-sm font-bold text-slate-900"
                >
                  {{ step.title }}
                </h3>

                <p
                  class="mt-1 text-xs leading-5 text-slate-500"
                >
                  {{ step.description }}
                </p>

              </div>

            }

          </div>
        </section>

        <!-- =======================================================
             STORAGE GUIDANCE
        ======================================================== -->

        <section
          class="mt-8 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8"
        >

          <div
            class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"
          >

            <div>

              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                External Storage
              </div>

              <h2 class="mt-1 text-xl font-bold">
                Keep large media outside Firestore.
              </h2>

              <p
                class="mt-3 max-w-3xl text-sm leading-6 text-slate-300"
              >
                Store large video, audio, image, and editing files in your
                external storage system. Use this page to register the capture,
                its milestone, purpose, status, and storage location.
              </p>

            </div>

            <div
              class="rounded-xl border border-slate-700 bg-slate-800 px-5 py-4"
            >

              <div class="text-xs text-slate-400">
                Recommended
              </div>

              <div class="mt-1 text-sm font-semibold">
                Google Drive / OneDrive
              </div>

              <div class="mt-1 text-xs text-slate-400">
                Metadata in Zebron • Media externally stored
              </div>

            </div>

          </div>
        </section>

      </main>

      <!-- =========================================================
           FOOTER
      ========================================================== -->

      <footer class="border-t border-slate-200 bg-white">

        <div
          class="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-slate-500"
        >
          Figure Out With J • Zebron Content & Operations
        </div>

      </footer>

    </div>
  `,
})
export class ContentCapturesComponent implements OnInit {
  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly captureService =
    inject(ContentCaptureService);

  private readonly milestoneService =
    inject(ContentMilestoneService);

  private readonly dialog =
    inject(MatDialog);

  // =========================================================
  // DATA
  // =========================================================

  readonly captures =
    signal<ContentCapture[]>([]);

  readonly milestones =
    signal<ContentMilestone[]>([]);

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly formError =
    signal<string | null>(null);

  // =========================================================
  // FORM STATE
  // =========================================================

  readonly showForm =
    signal(false);

  readonly editingCapture =
    signal<ContentCapture | null>(null);

  readonly formTitle =
    signal('');

  readonly formType =
    signal<ContentCaptureType>('screenshot');

  readonly formMilestoneId =
    signal('');

  readonly formDescription =
    signal('');

  readonly formStorageUrl =
    signal('');

  readonly formTags =
    signal('');

  readonly formStatus =
    signal<ContentCaptureStatus>('captured');

  // =========================================================
  // FILTER STATE
  // =========================================================

  readonly searchQuery =
    signal('');

  readonly typeFilter =
    signal<'all' | ContentCaptureType>('all');

  readonly statusFilter =
    signal<'all' | ContentCaptureStatus>('all');

  // =========================================================
  // CAPTURE PRINCIPLES
  // =========================================================

  readonly capturePrinciples = [
    {
      title: 'Tell a Story',
      description:
        'Capture moments that explain what happened, why it mattered, and what was learned.',
    },
    {
      title: 'Show the Proof',
      description:
        'Capture the actual application, UI, workflow, error, fix, or result whenever possible.',
    },
    {
      title: 'Make It Reusable',
      description:
        'A single capture should ideally be useful for videos, Shorts, tutorials, posts, or documentation.',
    },
  ];

  // =========================================================
  // CURRENT CAPTURE OPPORTUNITY
  // =========================================================

  readonly currentCaptureChecklist = [
    'Show the actual feature or workflow that was implemented.',
    'Capture meaningful before-and-after states when useful.',
    'Record important errors, fixes, or development breakthroughs.',
    'Capture screenshots without exposing sensitive information.',
    'Save the strongest footage for future YouTube or social content.',
  ];

  // =========================================================
  // WORKFLOW
  // =========================================================

  readonly captureWorkflow = [
    {
      number: 1,
      title: 'Build',
      description:
        'Develop the feature and solve the actual problem.',
    },
    {
      number: 2,
      title: 'Test',
      description:
        'Verify the workflow and capture meaningful errors or fixes.',
    },
    {
      number: 3,
      title: 'Capture',
      description:
        'Record the strongest screenshots, videos, demos, or notes.',
    },
    {
      number: 4,
      title: 'Register',
      description:
        'Associate captures with the relevant development milestone.',
    },
    {
      number: 5,
      title: 'Create',
      description:
        'Reuse the evidence when producing YouTube or social content.',
    },
  ];

  // =========================================================
  // COMPUTED DATA
  // =========================================================

  readonly filteredCaptures =
    computed(() => {
      const search =
        this.searchQuery()
          .trim()
          .toLowerCase();

      const type =
        this.typeFilter();

      const status =
        this.statusFilter();

      return this.captures().filter(
        (capture) => {
          const matchesSearch =
            !search ||
            capture.title
              .toLowerCase()
              .includes(search) ||
            capture.description
              ?.toLowerCase()
              .includes(search) ||
            capture.tags?.some((tag) =>
              tag.toLowerCase().includes(search),
            );

          const matchesType =
            type === 'all' ||
            capture.type === type;

          const matchesStatus =
            status === 'all' ||
            capture.status === status;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        },
      );
    });

  readonly totalReady =
    computed(() =>
      this.captures().filter(
        (capture) =>
          capture.status === 'reviewed' ||
          capture.status === 'used',
      ).length,
    );

  readonly hasActiveFilters =
    computed(
      () =>
        this.searchQuery().trim().length > 0 ||
        this.typeFilter() !== 'all' ||
        this.statusFilter() !== 'all',
    );

  // =========================================================
  // LIFECYCLE
  // =========================================================

  constructor() {
    this.pageTitleService.setTitle(
      'Capture Moments',
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  // =========================================================
  // DATA LOADING
  // =========================================================

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [
        captures,
        milestones,
      ] = await Promise.all([
        this.captureService.getCaptures(),
        this.milestoneService.getMilestones(),
      ]);

      this.captures.set(captures);
      this.milestones.set(milestones);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load content captures.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // FORM
  // =========================================================
openCreateForm(): void {
  this.editingCapture.set(null);

  this.formTitle.set('');
  this.formType.set('screenshot');
  this.formMilestoneId.set(
    this.currentMilestone()?.id ?? '',
  );
  this.formDescription.set('');
  this.formStorageUrl.set('');
  this.formTags.set('');
  this.formStatus.set('captured');

  this.formError.set(null);
  this.showForm.set(true);

  // Wait for Angular to render the form before scrolling to it.
  setTimeout(() => {
    document
      .getElementById('capture-form')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  });
}

  editCapture(
    capture: ContentCapture,
  ): void {
    this.editingCapture.set(capture);

    this.formTitle.set(
      capture.title,
    );

    this.formType.set(
      capture.type,
    );

    this.formMilestoneId.set(
      capture.milestoneId,
    );

    this.formDescription.set(
      capture.description ?? '',
    );

    this.formStorageUrl.set(
      capture.storageUrl ?? '',
    );

    this.formTags.set(
      capture.tags?.join(', ') ?? '',
    );

    this.formStatus.set(
      capture.status,
    );

    this.formError.set(null);
    this.showForm.set(true);

    setTimeout(() => {
  document
    .getElementById('capture-form')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
});
  }

  closeForm(): void {
    if (this.saving()) {
      return;
    }

    this.showForm.set(false);
    this.editingCapture.set(null);
    this.formError.set(null);
  }

  async saveCapture(
    event: Event,
  ): Promise<void> {
    event.preventDefault();

    const title =
      this.formTitle().trim();

    const milestoneId =
      this.formMilestoneId();

    if (!title) {
      this.formError.set(
        'Capture title is required.',
      );
      return;
    }

    if (!milestoneId) {
      this.formError.set(
        'Please select a milestone.',
      );
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const tags =
        this.formTags()
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

      const changes = {
        milestoneId,
        type: this.formType(),
        title,
        description:
          this.formDescription().trim(),
        storageUrl:
          this.formStorageUrl().trim(),
        tags,
        status: this.formStatus(),
      };

      const existing =
        this.editingCapture();

      if (existing) {
        await this.captureService.updateCapture(
          existing.id,
          changes,
        );
      } else {
        await this.captureService.createCapture({
          ...changes,
          capturedAt: null,
          usedInContentIds: [],
        });
      }

      await this.loadData();

      this.showForm.set(false);
      this.editingCapture.set(null);
    } catch (error) {
      this.formError.set(
        error instanceof Error
          ? error.message
          : 'Unable to save the capture.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async deleteCapture(
    capture: ContentCapture,
  ): Promise<void> {
    const dialogRef =
      this.dialog.open(
        ConfirmationDialogComponent,
        {
          width: '520px',
          maxWidth:
            'calc(100vw - 32px)',
          data: {
            title: 'Delete Capture',
            message:
              `Are you sure you want to delete "${capture.title}"?`,
            warning:
              'This removes the capture metadata from the Content & Operations system. It does not delete the externally stored media.',
            icon: 'delete_outline',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            destructive: true,
          } satisfies ConfirmationDialogData,
        },
      );

    const confirmed =
      await firstValueFrom(
        dialogRef.afterClosed(),
      );

    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.captureService.deleteCapture(
        capture.id,
      );

      await this.loadData();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to delete the capture.',
      );

      this.loading.set(false);
    }
  }

  // =========================================================
  // FILTERS
  // =========================================================

  setSearch(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchQuery.set(
      input.value,
    );
  }

  setTypeFilter(
    event: Event,
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.typeFilter.set(
      select.value as
        | 'all'
        | ContentCaptureType,
    );
  }

  setStatusFilter(
    event: Event,
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.statusFilter.set(
      select.value as
        | 'all'
        | ContentCaptureStatus,
    );
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.typeFilter.set('all');
    this.statusFilter.set('all');
  }

  // =========================================================
  // FORM INPUT HELPERS
  // =========================================================

  setTitle(
    event: Event,
  ): void {
    this.formTitle.set(
      this.getInputValue(event),
    );
  }

  setType(
    event: Event,
  ): void {
    this.formType.set(
      this.getInputValue(
        event,
      ) as ContentCaptureType,
    );
  }

  setMilestoneId(
    event: Event,
  ): void {
    this.formMilestoneId.set(
      this.getInputValue(event),
    );
  }

  setDescription(
    event: Event,
  ): void {
    this.formDescription.set(
      this.getInputValue(event),
    );
  }

  setStorageUrl(
    event: Event,
  ): void {
    this.formStorageUrl.set(
      this.getInputValue(event),
    );
  }

  setTags(
    event: Event,
  ): void {
    this.formTags.set(
      this.getInputValue(event),
    );
  }

  setStatus(
    event: Event,
  ): void {
    this.formStatus.set(
      this.getInputValue(
        event,
      ) as ContentCaptureStatus,
    );
  }

  private getInputValue(
    event: Event,
  ): string {
    const target =
      event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;

    return target.value;
  }

  // =========================================================
  // HELPERS
  // =========================================================

  totalByType(
    type: ContentCaptureType,
  ): number {
    return this.captures().filter(
      (capture) =>
        capture.type === type,
    ).length;
  }

  captureTypeLabel(
    type: ContentCaptureType,
  ): string {
    switch (type) {
      case 'screenshot':
        return 'Screenshot';

      case 'recording':
        return 'Screen Recording';

      case 'before-after':
        return 'Before / After';

      case 'demo':
        return 'Demo';

      case 'note':
        return 'Development Note';

      default:
        return 'Capture';
    }
  }

  milestoneTitle(
    milestoneId: string,
  ): string {
    const milestone =
      this.milestones().find(
        (item) =>
          item.id === milestoneId,
      );

    return (
      milestone?.title ??
      milestoneId
    );
  }

  milestoneCaptureCount(
    milestoneId: string,
  ): number {
    return this.captures().filter(
      (capture) =>
        capture.milestoneId ===
        milestoneId,
    ).length;
  }

  // =========================================================
  // CURRENT MILESTONE
  // =========================================================

  currentMilestone():
    ContentMilestone | null {
    const inProgress =
      this.milestones().find(
        (milestone) =>
          milestone.developmentStatus ===
            'in-progress' ||
          milestone.captureStatus ===
            'in-progress',
      );

    if (inProgress) {
      return inProgress;
    }

    const planned =
      this.milestones().find(
        (milestone) =>
          milestone.status === 'planned',
      );

    return (
      planned ??
      this.milestones()[0] ??
      null
    );
  }
}