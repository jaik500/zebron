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
  ContentIdea,
  ContentIdeaPlatform,
  ContentIdeaPriority,
  ContentIdeaStatus,
  ContentIdeaType,
} from '../../models/content-ideas.model';

import { ContentMilestone } from '../../models/content-milestones.model';
import { ContentCapture } from '../../models/content-captures.model';

import { ContentIdeaService } from '../../services/content-idea.service';
import { ContentMilestoneService } from '../../services/content-milestone.service';
import { ContentCaptureService } from '../../services/content-capture.service';

@Component({
  selector: 'app-content-ideas',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- =========================================================
           PAGE HEADER
      ========================================================== -->

      <header class="mt-15 border-b border-slate-200 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-6 py-2">

          <!-- Breadcrumbs -->

          <nav
            class="mb-1 flex flex-wrap items-center gap-2 text-sm text-slate-500"
            aria-label="Breadcrumb"
          >
            <a
              routerLink="/admin"
              class="text-white/80 transition hover:text-white"
            >
              Admin Dashboard
            </a>

            <span class="text-white/60">/</span>

            <a
              routerLink="/admin/content-operations"
              class="text-white/80 transition hover:text-white"
            >
              Content & Operations
            </a>

            <span class="text-white/60">/</span>

            <span class="font-medium text-white">
              Content Ideas
            </span>
          </nav>

          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p class="max-w-3xl text-base leading-7 text-white">
                Capture content ideas before they become production work.
                Turn development experiences, lessons, solutions, and
                discoveries into reusable content.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">

              <button
                type="button"
                (click)="openCreateForm()"
                class="inline-flex shrink-0 items-center justify-center
                  rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold
                  text-white shadow-sm transition hover:bg-slate-800"
              >
                <span class="mr-2 text-lg leading-none">+</span>
                New Idea
              </button>

              <a
                routerLink="/admin/content-operations/milestones"
                class="inline-flex shrink-0 items-center justify-center
                  rounded-lg border border-slate-300 bg-white px-4 py-2.5
                  text-sm font-semibold text-slate-700 shadow-sm transition
                  hover:bg-slate-50"
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
                class="flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-full bg-red-100 text-red-700"
              >
                !
              </div>

              <div>
                <h2 class="font-semibold text-red-900">
                  Unable to load content ideas
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
          class="mb-8 overflow-hidden rounded-2xl border border-slate-200
            bg-white shadow-sm"
        >
          <div class="grid gap-0 lg:grid-cols-[1.5fr_1fr]">

            <div class="p-6 sm:p-8">

              <div
                class="mb-4 flex h-11 w-11 items-center justify-center
                  rounded-xl bg-slate-900 text-white"
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
                    d="M12 3v18M3 12h18"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"
                  />
                </svg>
              </div>

              <h2 class="text-xl font-bold text-slate-900">
                Ideas become content when you capture them early.
              </h2>

              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Keep promising ideas in one place so they do not get lost
                between development, learning, work, and everyday life.
              </p>

              <div class="mt-6 grid gap-3 sm:grid-cols-3">

                @for (principle of ideaPrinciples; track principle.title) {
                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div class="mb-2 text-sm font-semibold text-slate-900">
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
              class="border-t border-slate-200 bg-slate-50 p-6 sm:p-8
                lg:border-l lg:border-t-0"
            >
              <div
                class="text-xs font-semibold uppercase tracking-wide
                  text-slate-500"
              >
                Content Rule
              </div>

              <blockquote
                class="mt-3 border-l-4 border-slate-300 pl-4 text-lg
                  font-semibold leading-7 text-slate-800"
              >
                “If you learned something useful, solved a real problem,
                or figured something out, there may be a story in it.”
              </blockquote>

              <p class="mt-4 text-sm leading-6 text-slate-500">
                Ideas can later become videos, Shorts, tutorials, articles,
                social posts, or documentation.
              </p>
            </div>

          </div>
        </section>

        <!-- =======================================================
             CREATE / EDIT FORM
        ======================================================== -->

        @if (showForm()) {
          <section
            id="idea-form"
            class="mb-8 rounded-2xl border border-slate-200
              bg-white shadow-sm"
          >

            <div class="border-b border-slate-200 px-6 py-5 sm:px-8">

              <div
                class="text-xs font-semibold uppercase tracking-wide
                  text-slate-500"
              >
                {{ editingIdea() ? 'Edit Idea' : 'New Content Idea' }}
              </div>

              <h2 class="mt-1 text-xl font-bold text-slate-900">
                {{
                  editingIdea()
                    ? 'Update content idea'
                    : 'Register a new content idea'
                }}
              </h2>

            </div>

            <form
              class="space-y-6 p-6 sm:p-8"
              (submit)="saveIdea($event)"
            >

              <!-- Title / Type -->

              <div class="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    for="idea-title"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Idea Title
                  </label>

                  <input
                    id="idea-title"
                    type="text"
                    [value]="formTitle()"
                    (input)="setTitle($event)"
                    placeholder="Example: How I Built Community Notifications"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none transition
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    for="idea-type"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Content Type
                  </label>

                  <select
                    id="idea-type"
                    [value]="formType()"
                    (change)="setType($event)"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  >
                    <option value="video">Video</option>
                    <option value="short">Short</option>
                    <option value="post">Social Post</option>
                    <option value="article">Article</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>

              </div>

              <!-- Platform / Priority -->

              <div class="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    for="idea-platform"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Platform
                  </label>

                  <select
                    id="idea-platform"
                    [value]="formPlatform()"
                    (change)="setPlatform($event)"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="youtube-short">YouTube Short</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    for="idea-priority"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="idea-priority"
                    [value]="formPriority()"
                    (change)="setPriority($event)"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

              </div>

              <!-- Status / Milestone -->

              <div class="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    for="idea-status"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Status
                  </label>

                  <select
                    id="idea-status"
                    [value]="formStatus()"
                    (change)="setStatus($event)"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  >
                    <option value="idea">Idea</option>
                    <option value="selected">Selected</option>
                    <option value="planned">Planned</option>
                    <option value="in-production">In Production</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label
                    for="idea-milestone"
                    class="mb-2 block text-sm font-semibold
                      text-slate-700"
                  >
                    Milestone
                  </label>

                  <select
                    id="idea-milestone"
                    [value]="formMilestoneId()"
                    (change)="setMilestoneId($event)"
                    class="w-full rounded-xl border border-slate-300
                      bg-white px-4 py-3 text-sm outline-none
                      focus:border-slate-500 focus:ring-2
                      focus:ring-slate-200"
                  >
                    <option value="">No milestone</option>

                    @for (milestone of milestones(); track milestone.id) {
                      <option [value]="milestone.id">
                        {{ milestone.title }}
                      </option>
                    }

                  </select>
                </div>

              </div>

              <!-- ===================================================
                   DEVELOPMENT EVIDENCE
              ==================================================== -->

              <div class="space-y-4">

                <div>
                  <h3 class="text-sm font-semibold text-slate-900">
                    Development Evidence
                  </h3>

                  <p class="mt-1 text-xs leading-5 text-slate-500">
                    Select the development captures that provide evidence
                    for this content idea.
                  </p>
                </div>

                @if (captures().length > 0) {

                  <div
                    class="rounded-xl border border-slate-200
                      bg-slate-50 p-4"
                  >

                    <div class="space-y-3">

                      @for (capture of captures(); track capture.id) {

                        <label
                          class="flex cursor-pointer items-start gap-3
                            rounded-xl border border-slate-200 bg-white p-4
                            transition hover:border-slate-300"
                        >

                          <input
                            type="checkbox"
                            [checked]="isCaptureSelected(capture.id)"
                            (change)="toggleCapture(capture.id)"
                            class="mt-1 h-4 w-4 rounded border-slate-300
                              text-[#2a835f] focus:ring-[#2a835f]"
                          />

                          <div class="min-w-0 flex-1">

                            <div
                              class="flex flex-col gap-1 sm:flex-row
                                sm:items-center sm:justify-between"
                            >
                              <span
                                class="text-sm font-semibold
                                  text-slate-800"
                              >
                                {{ capture.title }}
                              </span>

                              <span
                                class="w-fit rounded-full bg-slate-100
                                  px-2 py-1 text-[11px] font-medium
                                  text-slate-600"
                              >
                                {{ capture.type }}
                              </span>
                            </div>

                            @if (capture.description) {
                              <p
                                class="mt-1 text-xs leading-5
                                  text-slate-500"
                              >
                                {{ capture.description }}
                              </p>
                            }

                            @if (capture.milestoneId) {
                              <p
                                class="mt-2 text-[11px] text-slate-400"
                              >
                                Milestone:
                                {{ milestoneTitle(capture.milestoneId) }}
                              </p>
                            }

                            @if (capture.status) {
                              <p
                                class="mt-1 text-[11px] text-slate-400"
                              >
                                Status:
                                {{ capture.status }}
                              </p>
                            }

                          </div>

                        </label>

                      }

                    </div>

                  </div>

                } @else {

                  <div
                    class="rounded-xl border border-dashed
                      border-slate-300 bg-slate-50 p-5"
                  >
                    <p class="text-sm font-medium text-slate-700">
                      No development captures available.
                    </p>

                    <p
                      class="mt-1 text-xs leading-5 text-slate-500"
                    >
                      Create a capture first, then return here to connect
                      it to this content idea.
                    </p>

                    <a
                      routerLink="/admin/content-operations/captures"
                      class="mt-3 inline-flex text-sm font-semibold
                        text-[#2a835f] underline"
                    >
                      Manage Captures
                    </a>
                  </div>

                }

                @if (selectedCaptureIds().length > 0) {

                  <div
                    class="rounded-xl border border-emerald-200
                      bg-emerald-50 p-4"
                  >
                    <div
                      class="text-xs font-semibold uppercase
                        tracking-wide text-emerald-700"
                    >
                      Selected Evidence
                    </div>

                    <p class="mt-1 text-sm text-emerald-800">
                      {{ selectedCaptureIds().length }}
                      capture{{
                        selectedCaptureIds().length === 1 ? '' : 's'
                      }}
                      connected to this idea.
                    </p>
                  </div>

                }

              </div>

              <!-- Category -->

              <div>
                <label
                  for="idea-category"
                  class="mb-2 block text-sm font-semibold
                    text-slate-700"
                >
                  Category
                </label>

                <input
                  id="idea-category"
                  type="text"
                  [value]="formCategory()"
                  (input)="setCategory($event)"
                  placeholder="Example: Community, AI, Development"
                  class="w-full rounded-xl border border-slate-300
                    bg-white px-4 py-3 text-sm outline-none transition
                    focus:border-slate-500 focus:ring-2
                    focus:ring-slate-200"
                />
              </div>

              <!-- Potential Title -->

              <div>
                <label
                  for="idea-potential-title"
                  class="mb-2 block text-sm font-semibold
                    text-slate-700"
                >
                  Potential Title
                </label>

                <input
                  id="idea-potential-title"
                  type="text"
                  [value]="formPotentialTitle()"
                  (input)="setPotentialTitle($event)"
                  placeholder="Example: I Built a Notification System From Scratch"
                  class="w-full rounded-xl border border-slate-300
                    bg-white px-4 py-3 text-sm outline-none transition
                    focus:border-slate-500 focus:ring-2
                    focus:ring-slate-200"
                />
              </div>

              <!-- Hook -->

              <div>
                <label
                  for="idea-hook"
                  class="mb-2 block text-sm font-semibold
                    text-slate-700"
                >
                  Potential Hook
                </label>

                <textarea
                  id="idea-hook"
                  rows="3"
                  [value]="formPotentialHook()"
                  (input)="setPotentialHook($event)"
                  placeholder="What would make someone want to watch, read, or click?"
                  class="w-full resize-y rounded-xl border
                    border-slate-300 bg-white px-4 py-3 text-sm
                    outline-none focus:border-slate-500
                    focus:ring-2 focus:ring-slate-200"
                ></textarea>
              </div>

              <!-- Description -->

              <div>
                <label
                  for="idea-description"
                  class="mb-2 block text-sm font-semibold
                    text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="idea-description"
                  rows="4"
                  [value]="formDescription()"
                  (input)="setDescription($event)"
                  placeholder="Describe the idea and why it could be useful."
                  class="w-full resize-y rounded-xl border
                    border-slate-300 bg-white px-4 py-3 text-sm
                    outline-none focus:border-slate-500
                    focus:ring-2 focus:ring-slate-200"
                ></textarea>
              </div>

              <!-- Notes -->

              <div>
                <label
                  for="idea-notes"
                  class="mb-2 block text-sm font-semibold
                    text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="idea-notes"
                  rows="4"
                  [value]="formNotes()"
                  (input)="setNotes($event)"
                  placeholder="Add production notes, research ideas, examples, or follow-up thoughts."
                  class="w-full resize-y rounded-xl border
                    border-slate-300 bg-white px-4 py-3 text-sm
                    outline-none focus:border-slate-500
                    focus:ring-2 focus:ring-slate-200"
                ></textarea>
              </div>

              @if (formError()) {
                <div
                  class="rounded-xl border border-red-200 bg-red-50
                    px-4 py-3 text-sm text-red-700"
                >
                  {{ formError() }}
                </div>
              }

              <!-- Actions -->

              <div
                class="flex flex-col-reverse gap-3 border-t
                  border-slate-100 pt-6 sm:flex-row sm:justify-end"
              >

                <button
                  type="button"
                  (click)="closeForm()"
                  class="inline-flex items-center justify-center
                    rounded-lg border border-slate-300 bg-white
                    px-5 py-2.5 text-sm font-semibold text-slate-700
                    transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="saving()"
                  class="inline-flex items-center justify-center
                    rounded-lg bg-slate-900 px-5 py-2.5 text-sm
                    font-semibold text-white transition hover:bg-slate-800
                    disabled:cursor-not-allowed disabled:opacity-60"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{ editingIdea() ? 'Save Changes' : 'Create Idea' }}
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

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <div
              class="rounded-2xl border border-slate-200 bg-white
                p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Total Ideas
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ ideas().length }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Content opportunities
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white
                p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                High Priority
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByPriority('high') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Ideas worth prioritizing
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white
                p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Selected
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByStatus('selected') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Chosen for development
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white
                p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                In Production
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByStatus('in-production') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Currently being produced
              </div>
            </div>

            <div
              class="rounded-2xl border border-slate-200 bg-white
                p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Published
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ totalByStatus('published') }}
              </div>

              <div class="mt-2 text-xs text-slate-500">
                Completed content
              </div>
            </div>

          </div>

        </section>

        <!-- =======================================================
             FILTERS
        ======================================================== -->

        <section
          class="mb-8 rounded-2xl border border-slate-200
            bg-white p-5 shadow-sm sm:p-6"
        >

          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row
              sm:items-end sm:justify-between"
          >
            <div>
              <div
                class="text-xs font-semibold uppercase tracking-wide
                  text-slate-500"
              >
                Idea Library
              </div>

              <h2 class="mt-1 text-xl font-bold text-slate-900">
                Content Opportunities
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

          <div class="grid gap-4 md:grid-cols-4">

            <!-- Search -->

            <div>
              <label
                for="idea-search"
                class="mb-2 block text-xs font-semibold
                  uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <input
                id="idea-search"
                type="search"
                [value]="searchQuery()"
                (input)="setSearch($event)"
                placeholder="Search ideas..."
                class="w-full rounded-xl border border-slate-300
                  bg-white px-4 py-3 text-sm outline-none
                  focus:border-slate-500 focus:ring-2
                  focus:ring-slate-200"
              />
            </div>

            <!-- Status -->

            <div>
              <label
                for="idea-status-filter"
                class="mb-2 block text-xs font-semibold
                  uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="idea-status-filter"
                [value]="statusFilter()"
                (change)="setStatusFilter($event)"
                class="w-full rounded-xl border border-slate-300
                  bg-white px-4 py-3 text-sm outline-none
                  focus:border-slate-500 focus:ring-2
                  focus:ring-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="idea">Idea</option>
                <option value="selected">Selected</option>
                <option value="planned">Planned</option>
                <option value="in-production">In Production</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <!-- Priority -->

            <div>
              <label
                for="idea-priority-filter"
                class="mb-2 block text-xs font-semibold
                  uppercase tracking-wide text-slate-500"
              >
                Priority
              </label>

              <select
                id="idea-priority-filter"
                [value]="priorityFilter()"
                (change)="setPriorityFilter($event)"
                class="w-full rounded-xl border border-slate-300
                  bg-white px-4 py-3 text-sm outline-none
                  focus:border-slate-500 focus:ring-2
                  focus:ring-slate-200"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <!-- Type -->

            <div>
              <label
                for="idea-type-filter"
                class="mb-2 block text-xs font-semibold
                  uppercase tracking-wide text-slate-500"
              >
                Type
              </label>

              <select
                id="idea-type-filter"
                [value]="typeFilter()"
                (change)="setTypeFilter($event)"
                class="w-full rounded-xl border border-slate-300
                  bg-white px-4 py-3 text-sm outline-none
                  focus:border-slate-500 focus:ring-2
                  focus:ring-slate-200"
              >
                <option value="all">All Types</option>
                <option value="video">Video</option>
                <option value="short">Short</option>
                <option value="post">Social Post</option>
                <option value="article">Article</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

          </div>
        </section>

        <!-- =======================================================
             LOADING
        ======================================================== -->

        @if (loading()) {
          <section
            class="rounded-2xl border border-slate-200 bg-white
              p-10 text-center shadow-sm"
          >
            <div
              class="mx-auto h-8 w-8 animate-spin rounded-full
                border-4 border-slate-200 border-t-slate-800"
            ></div>

            <p class="mt-4 text-sm text-slate-500">
              Loading content ideas...
            </p>
          </section>
        }

        <!-- =======================================================
             EMPTY STATE
        ======================================================== -->

        @if (!loading() && filteredIdeas().length === 0) {

          <section
            class="rounded-2xl border border-dashed border-slate-300
              bg-white p-10 text-center"
          >

            <div
              class="mx-auto flex h-14 w-14 items-center justify-center
                rounded-2xl bg-slate-100 text-slate-600"
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
                  d="M12 3v18M3 12h18"
                />
              </svg>
            </div>

            <h2 class="mt-4 text-lg font-bold text-slate-900">
              No content ideas found
            </h2>

            <p
              class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500"
            >
              Capture your next useful idea before it gets forgotten.
            </p>

            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="clearFilters()"
                class="mt-5 mr-2 inline-flex items-center justify-center
                  rounded-lg border border-slate-300 bg-white px-5 py-2.5
                  text-sm font-semibold text-slate-700 transition
                  hover:bg-slate-50"
              >
                Clear Filters
              </button>
            }

            <button
              type="button"
              (click)="openCreateForm()"
              class="mt-5 inline-flex items-center justify-center
                rounded-lg bg-slate-900 px-5 py-2.5 text-sm
                font-semibold text-white transition hover:bg-slate-800"
            >
              Create Idea
            </button>

          </section>
        }

        <!-- =======================================================
             IDEA CARDS
        ======================================================== -->

        @if (!loading() && filteredIdeas().length > 0) {

          <section class="grid gap-4 lg:grid-cols-2">

            @for (idea of filteredIdeas(); track idea.id) {

              <article
                class="rounded-2xl border border-slate-200 bg-white
                  p-5 shadow-sm transition hover:border-slate-300"
              >

                <div class="flex items-start justify-between gap-4">

                  <div class="min-w-0">

                    <div class="mb-2 flex flex-wrap gap-2">

                      <!-- Priority -->

                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class.bg-red-50]="idea.priority === 'high'"
                        [class.text-red-700]="idea.priority === 'high'"
                        [class.bg-amber-50]="idea.priority === 'medium'"
                        [class.text-amber-700]="idea.priority === 'medium'"
                        [class.bg-slate-100]="idea.priority === 'low'"
                        [class.text-slate-600]="idea.priority === 'low'"
                      >
                        {{ priorityLabel(idea.priority) }} Priority
                      </span>

                      <!-- Type -->

                      <span
                        class="rounded-full bg-slate-100 px-2.5 py-1
                          text-xs font-semibold text-slate-600"
                      >
                        {{ typeLabel(idea.type) }}
                      </span>

                    </div>

                    <h3 class="text-base font-bold text-slate-900">
                      {{ idea.title }}
                    </h3>

                    <p class="mt-1 text-xs text-slate-500">
                      {{ platformLabel(idea.platform) }}

                      @if (idea.category) {
                        • {{ idea.category }}
                      }
                    </p>

                  </div>

                  <!-- Status -->

                  <span
                    class="shrink-0 rounded-full px-2.5 py-1
                      text-xs font-semibold"
                    [class.bg-slate-100]="idea.status === 'idea'"
                    [class.text-slate-700]="idea.status === 'idea'"
                    [class.bg-purple-50]="idea.status === 'selected'"
                    [class.text-purple-700]="idea.status === 'selected'"
                    [class.bg-blue-50]="idea.status === 'planned'"
                    [class.text-blue-700]="idea.status === 'planned'"
                    [class.bg-amber-50]="idea.status === 'in-production'"
                    [class.text-amber-700]="idea.status === 'in-production'"
                    [class.bg-emerald-50]="idea.status === 'published'"
                    [class.text-emerald-700]="idea.status === 'published'"
                    [class.bg-slate-50]="idea.status === 'archived'"
                    [class.text-slate-500]="idea.status === 'archived'"
                  >
                    {{ statusLabel(idea.status) }}
                  </span>

                </div>

                <!-- Description -->

                @if (idea.description) {
                  <p class="mt-4 text-sm leading-6 text-slate-600">
                    {{ idea.description }}
                  </p>
                }

                <!-- Potential Title -->

                @if (idea.potentialTitle) {
                  <div
                    class="mt-4 rounded-xl border border-slate-200
                      bg-slate-50 p-4"
                  >
                    <div
                      class="text-xs font-semibold uppercase
                        tracking-wide text-slate-500"
                    >
                      Potential Title
                    </div>

                    <p
                      class="mt-1 text-sm font-semibold leading-6
                        text-slate-900"
                    >
                      {{ idea.potentialTitle }}
                    </p>
                  </div>
                }

                <!-- Potential Hook -->

                @if (idea.potentialHook) {
                  <div class="mt-4">

                    <div
                      class="text-xs font-semibold uppercase
                        tracking-wide text-slate-500"
                    >
                      Potential Hook
                    </div>

                    <p class="mt-1 text-sm leading-6 text-slate-600">
                      {{ idea.potentialHook }}
                    </p>

                  </div>
                }

                <!-- Development Evidence Summary -->

                @if ((idea.captureIds?.length ?? 0) > 0) {

                  <div
                    class="mt-4 rounded-xl border border-emerald-200
                      bg-emerald-50 p-4"
                  >

                    <div
                      class="flex items-center justify-between gap-3"
                    >

                      <div>

                        <div
                          class="text-xs font-semibold uppercase
                            tracking-wide text-emerald-700"
                        >
                          Development Evidence
                        </div>

                        <p class="mt-1 text-sm text-emerald-800">
                          {{ idea.captureIds?.length ?? 0 }}
                          capture{{
                            (idea.captureIds?.length ?? 0) === 1
                              ? ''
                              : 's'
                          }}
                          connected
                        </p>

                      </div>

                      <span
                        class="flex h-9 w-9 items-center justify-center
                          rounded-full bg-white text-lg shadow-sm"
                      >
                        📸
                      </span>

                    </div>

                  </div>

                }

                <!-- Footer -->

                <div class="mt-5 border-t border-slate-100 pt-4">

                  <div
                    class="flex flex-col gap-3 sm:flex-row
                      sm:items-center sm:justify-between"
                  >

                    <span class="text-xs text-slate-500">
                      Milestone:

                      <strong class="font-semibold text-slate-700">
                        {{ milestoneTitle(idea.milestoneId) }}
                      </strong>
                    </span>

                    <span class="text-xs text-slate-400">
                      {{ platformLabel(idea.platform) }}
                    </span>

                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">

                    <button
                      type="button"
                      (click)="editIdea(idea)"
                      class="inline-flex items-center justify-center
                        rounded-lg border border-slate-300 bg-white
                        px-3 py-2 text-xs font-semibold text-slate-700
                        transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteIdea(idea)"
                      class="inline-flex items-center justify-center
                        rounded-lg border border-red-200 bg-white
                        px-3 py-2 text-xs font-semibold text-red-700
                        transition hover:bg-red-50"
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
          class="mt-8 rounded-2xl border border-slate-200 bg-white
            p-6 shadow-sm sm:p-8"
        >

          <div
            class="text-xs font-semibold uppercase tracking-wide
              text-slate-500"
          >
            Recommended Workflow
          </div>

          <h2 class="mt-1 text-xl font-bold text-slate-900">
            From Idea to Published Content
          </h2>

          <div
            class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
          >

            @for (step of ideaWorkflow; track step.number) {

              <div>

                <div
                  class="flex h-9 w-9 items-center justify-center
                    rounded-full bg-slate-900 text-sm font-bold text-white"
                >
                  {{ step.number }}
                </div>

                <h3 class="mt-3 text-sm font-bold text-slate-900">
                  {{ step.title }}
                </h3>

                <p class="mt-1 text-xs leading-5 text-slate-500">
                  {{ step.description }}
                </p>

              </div>

            }

          </div>

        </section>

      </main>

      <!-- =========================================================
           FOOTER
      ========================================================== -->

      <footer class="border-t border-slate-200 bg-white">

        <div
          class="mx-auto max-w-7xl px-6 py-6 text-center
            text-xs text-slate-500"
        >
          Figure Out With J • Zebron Content & Operations
        </div>

      </footer>

    </div>
  `,
})
export class ContentIdeasComponent implements OnInit {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly ideaService =
    inject(ContentIdeaService);

  private readonly milestoneService =
    inject(ContentMilestoneService);

  private readonly captureService =
    inject(ContentCaptureService);

  private readonly dialog =
    inject(MatDialog);

  // =========================================================
  // DATA
  // =========================================================

  readonly ideas =
    signal<ContentIdea[]>([]);

  readonly milestones =
    signal<ContentMilestone[]>([]);

  /**
   * All development captures available to associate
   * with a content idea.
   */
  readonly captures =
    signal<ContentCapture[]>([]);

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

  readonly editingIdea =
    signal<ContentIdea | null>(null);

  readonly formTitle =
    signal('');

  readonly formType =
    signal<ContentIdeaType>('video');

  readonly formPlatform =
    signal<ContentIdeaPlatform>('youtube');

  readonly formCategory =
    signal('');

  readonly formPriority =
    signal<ContentIdeaPriority>('medium');

  readonly formStatus =
    signal<ContentIdeaStatus>('idea');

  readonly formMilestoneId =
    signal('');

  readonly formDescription =
    signal('');

  readonly formNotes =
    signal('');

  readonly formPotentialHook =
    signal('');

  readonly formPotentialTitle =
    signal('');

  /**
   * Capture IDs selected for the current content idea.
   */
  readonly selectedCaptureIds =
    signal<string[]>([]);

  // =========================================================
  // FILTER STATE
  // =========================================================

  readonly searchQuery =
    signal('');

  readonly statusFilter =
    signal<'all' | ContentIdeaStatus>('all');

  readonly priorityFilter =
    signal<'all' | ContentIdeaPriority>('all');

  readonly typeFilter =
    signal<'all' | ContentIdeaType>('all');

  // =========================================================
  // CONTENT PRINCIPLES
  // =========================================================

  readonly ideaPrinciples = [
    {
      title: 'Capture Early',
      description:
        'Record the idea while the problem, discovery, or lesson is still fresh.',
    },
    {
      title: 'Make It Useful',
      description:
        'Focus on ideas that can teach, demonstrate, explain, or help someone solve a real problem.',
    },
    {
      title: 'Reuse It',
      description:
        'A strong idea can become a video, Short, tutorial, article, post, or documentation.',
    },
  ];

  // =========================================================
  // WORKFLOW
  // =========================================================

  readonly ideaWorkflow = [
    {
      number: 1,
      title: 'Capture',
      description:
        'Write down the idea before it gets forgotten.',
    },
    {
      number: 2,
      title: 'Evaluate',
      description:
        'Decide whether the idea is useful and worth producing.',
    },
    {
      number: 3,
      title: 'Select',
      description:
        'Move strong ideas into the selected stage.',
    },
    {
      number: 4,
      title: 'Plan',
      description:
        'Define the format, platform, hook, and production approach.',
    },
    {
      number: 5,
      title: 'Produce',
      description:
        'Turn the idea into actual content.',
    },
    {
      number: 6,
      title: 'Publish',
      description:
        'Release the finished content and connect it to the idea.',
    },
  ];

  // =========================================================
  // COMPUTED DATA
  // =========================================================

  readonly filteredIdeas = computed(() => {

    const search =
      this.searchQuery()
        .trim()
        .toLowerCase();

    const status =
      this.statusFilter();

    const priority =
      this.priorityFilter();

    const type =
      this.typeFilter();

    return this.ideas().filter((idea) => {

      const title =
        idea.title?.toLowerCase() ?? '';

      const description =
        idea.description?.toLowerCase() ?? '';

      const category =
        idea.category?.toLowerCase() ?? '';

      const potentialTitle =
        idea.potentialTitle?.toLowerCase() ?? '';

      const potentialHook =
        idea.potentialHook?.toLowerCase() ?? '';

      const matchesSearch =
        !search ||
        title.includes(search) ||
        description.includes(search) ||
        category.includes(search) ||
        potentialTitle.includes(search) ||
        potentialHook.includes(search);

      const matchesStatus =
        status === 'all' ||
        idea.status === status;

      const matchesPriority =
        priority === 'all' ||
        idea.priority === priority;

      const matchesType =
        type === 'all' ||
        idea.type === type;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesType
      );
    });
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.statusFilter() !== 'all' ||
      this.priorityFilter() !== 'all' ||
      this.typeFilter() !== 'all',
  );

  // =========================================================
  // LIFECYCLE
  // =========================================================

  constructor() {
    this.pageTitleService.setTitle(
      'Content Ideas',
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
        ideas,
        milestones,
        captures,
      ] = await Promise.all([
        this.ideaService.getIdeas(),
        this.milestoneService.getMilestones(),
        this.captureService.getCaptures(),
      ]);

      this.ideas.set(ideas);
      this.milestones.set(milestones);
      this.captures.set(captures);

    } catch (error) {

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load content ideas.',
      );

    } finally {

      this.loading.set(false);

    }
  }

  // =========================================================
  // FORM
  // =========================================================

  openCreateForm(): void {

    this.editingIdea.set(null);

    this.formTitle.set('');
    this.formType.set('video');
    this.formPlatform.set('youtube');
    this.formCategory.set('');
    this.formPriority.set('medium');
    this.formStatus.set('idea');

    this.formMilestoneId.set(
      this.currentMilestone()?.id ?? '',
    );

    this.formDescription.set('');
    this.formNotes.set('');
    this.formPotentialHook.set('');
    this.formPotentialTitle.set('');

    /**
     * Reset development evidence.
     */
    this.selectedCaptureIds.set([]);

    this.formError.set(null);
    this.showForm.set(true);

    this.scrollToForm();
  }

  editIdea(idea: ContentIdea): void {

    this.editingIdea.set(idea);

    this.formTitle.set(
      idea.title,
    );

    this.formType.set(
      idea.type,
    );

    this.formPlatform.set(
      idea.platform,
    );

    this.formCategory.set(
      idea.category ?? '',
    );

    this.formPriority.set(
      idea.priority,
    );

    this.formStatus.set(
      idea.status,
    );

    this.formMilestoneId.set(
      idea.milestoneId ?? '',
    );

    this.formDescription.set(
      idea.description ?? '',
    );

    this.formNotes.set(
      idea.notes ?? '',
    );

    this.formPotentialHook.set(
      idea.potentialHook ?? '',
    );

    this.formPotentialTitle.set(
      idea.potentialTitle ?? '',
    );

    /**
     * Restore previously connected development captures.
     */
    this.selectedCaptureIds.set(
      idea.captureIds ?? [],
    );

    this.formError.set(null);
    this.showForm.set(true);

    this.scrollToForm();
  }

  closeForm(): void {

    if (this.saving()) {
      return;
    }

    this.showForm.set(false);
    this.editingIdea.set(null);
    this.formError.set(null);
    this.selectedCaptureIds.set([]);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async saveIdea(
    event: Event,
  ): Promise<void> {

    event.preventDefault();

    const title =
      this.formTitle().trim();

    if (!title) {

      this.formError.set(
        'Idea title is required.',
      );

      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {

      /**
       * Explicitly type the payload so the component
       * remains aligned with ContentIdeaService.
       */
      const changes: Omit<
        ContentIdea,
        'id' | 'createdAt' | 'updatedAt'
      > = {

        title,

        description:
          this.formDescription().trim(),

        type:
          this.formType(),

        platform:
          this.formPlatform(),

        category:
          this.formCategory().trim(),

        priority:
          this.formPriority(),

        status:
          this.formStatus(),

        milestoneId:
          this.formMilestoneId(),

        captureIds:
          this.selectedCaptureIds(),

        notes:
          this.formNotes().trim(),

        potentialHook:
          this.formPotentialHook().trim(),

        potentialTitle:
          this.formPotentialTitle().trim(),
      };

      const existing =
        this.editingIdea();

      if (existing) {

        await this.ideaService.updateIdea(
          existing.id,
          changes,
        );

      } else {

        await this.ideaService.createIdea(
          changes,
        );
      }

      await this.loadData();

      this.showForm.set(false);
      this.editingIdea.set(null);
      this.selectedCaptureIds.set([]);

    } catch (error) {

      this.formError.set(
        error instanceof Error
          ? error.message
          : 'Unable to save the content idea.',
      );

    } finally {

      this.saving.set(false);

    }
  }

  // =========================================================
  // DEVELOPMENT EVIDENCE
  // =========================================================

  /**
   * Determines whether a capture is currently selected.
   */
  isCaptureSelected(
    captureId: string,
  ): boolean {

    return this
      .selectedCaptureIds()
      .includes(captureId);
  }

  /**
   * Selects or removes a development capture
   * from the current content idea.
   */
  toggleCapture(
    captureId: string,
  ): void {

    const current =
      this.selectedCaptureIds();

    if (current.includes(captureId)) {

      this.selectedCaptureIds.set(
        current.filter(
          (id) => id !== captureId,
        ),
      );

      return;
    }

    this.selectedCaptureIds.set([
      ...current,
      captureId,
    ]);
  }

  // =========================================================
  // DELETE
  // =========================================================

  async deleteIdea(
    idea: ContentIdea,
  ): Promise<void> {

    const dialogRef =
      this.dialog.open(
        ConfirmationDialogComponent,
        {
          width: '520px',

          maxWidth:
            'calc(100vw - 32px)',

          data: {
            title:
              'Delete Content Idea',

            message:
              `Are you sure you want to delete "${idea.title}"?`,

            warning:
              'This permanently removes the idea from the Content & Operations system.',

            icon:
              'delete_outline',

            confirmText:
              'Delete',

            cancelText:
              'Cancel',

            destructive:
              true,
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

      await this.ideaService.deleteIdea(
        idea.id,
      );

      await this.loadData();

    } catch (error) {

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to delete the content idea.',
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

    this.searchQuery.set(
      this.getInputValue(event),
    );
  }

  setStatusFilter(
    event: Event,
  ): void {

    this.statusFilter.set(
      this.getInputValue(event) as
        'all' | ContentIdeaStatus,
    );
  }

  setPriorityFilter(
    event: Event,
  ): void {

    this.priorityFilter.set(
      this.getInputValue(event) as
        'all' | ContentIdeaPriority,
    );
  }

  setTypeFilter(
    event: Event,
  ): void {

    this.typeFilter.set(
      this.getInputValue(event) as
        'all' | ContentIdeaType,
    );
  }

  clearFilters(): void {

    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.typeFilter.set('all');
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
      this.getInputValue(event) as
        ContentIdeaType,
    );
  }

  setPlatform(
    event: Event,
  ): void {

    this.formPlatform.set(
      this.getInputValue(event) as
        ContentIdeaPlatform,
    );
  }

  setCategory(
    event: Event,
  ): void {

    this.formCategory.set(
      this.getInputValue(event),
    );
  }

  setPriority(
    event: Event,
  ): void {

    this.formPriority.set(
      this.getInputValue(event) as
        ContentIdeaPriority,
    );
  }

  setStatus(
    event: Event,
  ): void {

    this.formStatus.set(
      this.getInputValue(event) as
        ContentIdeaStatus,
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

  setNotes(
    event: Event,
  ): void {

    this.formNotes.set(
      this.getInputValue(event),
    );
  }

  setPotentialHook(
    event: Event,
  ): void {

    this.formPotentialHook.set(
      this.getInputValue(event),
    );
  }

  setPotentialTitle(
    event: Event,
  ): void {

    this.formPotentialTitle.set(
      this.getInputValue(event),
    );
  }

  /**
   * Safely retrieves a value from an input,
   * select, or textarea event.
   */
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

  totalByPriority(
    priority: ContentIdeaPriority,
  ): number {

    return this
      .ideas()
      .filter(
        (idea) =>
          idea.priority === priority,
      )
      .length;
  }

  totalByStatus(
    status: ContentIdeaStatus,
  ): number {

    return this
      .ideas()
      .filter(
        (idea) =>
          idea.status === status,
      )
      .length;
  }

  priorityLabel(
    priority: ContentIdeaPriority,
  ): string {

    switch (priority) {

      case 'high':
        return 'High';

      case 'medium':
        return 'Medium';

      case 'low':
        return 'Low';

      default:
        return 'Priority';
    }
  }

  statusLabel(
    status: ContentIdeaStatus,
  ): string {

    switch (status) {

      case 'idea':
        return 'Idea';

      case 'selected':
        return 'Selected';

      case 'planned':
        return 'Planned';

      case 'in-production':
        return 'In Production';

      case 'published':
        return 'Published';

      case 'archived':
        return 'Archived';

      default:
        return 'Status';
    }
  }

  typeLabel(
    type: ContentIdeaType,
  ): string {

    switch (type) {

      case 'video':
        return 'Video';

      case 'short':
        return 'Short';

      case 'post':
        return 'Social Post';

      case 'article':
        return 'Article';

      case 'tutorial':
        return 'Tutorial';

      default:
        return 'Content';
    }
  }

  platformLabel(
    platform: ContentIdeaPlatform,
  ): string {

    switch (platform) {

      case 'youtube':
        return 'YouTube';

      case 'youtube-short':
        return 'YouTube Short';

      case 'instagram':
        return 'Instagram';

      case 'tiktok':
        return 'TikTok';

      case 'linkedin':
        return 'LinkedIn';

      case 'website':
        return 'Website';

      case 'other':
        return 'Other';

      default:
        return 'Platform';
    }
  }

  milestoneTitle(
    milestoneId?: string,
  ): string {

    if (!milestoneId) {
      return 'None';
    }

    const milestone =
      this
        .milestones()
        .find(
          (item) =>
            item.id === milestoneId,
        );

    return (
      milestone?.title ??
      milestoneId
    );
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

  // =========================================================
  // FORM FOCUS
  // =========================================================

  private scrollToForm(): void {

    setTimeout(() => {

      document
        .getElementById('idea-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

    });
  }
}