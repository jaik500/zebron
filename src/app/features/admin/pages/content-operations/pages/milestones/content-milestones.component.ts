import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { RouterLink } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { PageTitleService } from '../../../../../../core/services/page-title.service';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { ContentMilestone } from '../../models/content-milestones.model';

import { ContentMilestoneService } from '../../services/content-milestone.service';

@Component({
  selector: 'app-content-milestones',
  standalone: true,
  imports: [
    RouterLink,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 mt-15">

      <!-- =========================================================
           HEADER
           ========================================================= -->
      <header class="bg-[#2a835f] px-4 sm:px-6 lg:px-18">

        <div
          class="flex items-center justify-between gap-3"
        >

          <!-- Breadcrumbs -->
          <div
            class="flex min-w-0 items-center gap-2
                   overflow-hidden text-sm"
          >

            <a
              routerLink="/admin"
              class="shrink-0 text-white/80
                     transition hover:text-white"
            >
              Admin
            </a>

            <span class="shrink-0 text-white/60">
              /
            </span>

            <a
              routerLink="/admin/content-operations"
              class="shrink-0 text-white/80
                     transition hover:text-white"
            >
              Content & Operations
            </a>

            <span class="shrink-0 text-white/60">
              /
            </span>

            <span class="truncate text-white">
              Milestones
            </span>

          </div>

          <!-- New Milestone -->
          <button
            type="button"
            (click)="showCreateForm()"
            class="inline-flex shrink-0
                   items-center justify-center
                   gap-2 rounded-lg
                   bg-white/15
                   px-3 py-1
                   text-sm font-semibold
                   text-white
                   transition
                   hover:bg-white/25
                   sm:px-4 sm:py-2.5"
          >
            <span class="text-lg leading-none">
              +
            </span>

            <span class="hidden sm:inline">
              New Milestone
            </span>

            <span class="sm:hidden">
              New
            </span>
          </button>

        </div>

        <p
          class="hidden max-w-2xl
                 text-sm text-white sm:block"
        >
          Track meaningful Zebron development achievements
          and connect them to Figure Out With J content.
        </p>

      </header>

      <!-- =========================================================
           MAIN
           ========================================================= -->
      <main
        class="mx-auto w-full max-w-7xl
               px-4 py-8
               sm:px-6
               lg:px-8"
      >

        <!-- =======================================================
             METRICS
             ======================================================= -->
        <section
          class="mb-8 grid gap-4
                 sm:grid-cols-2
                 lg:grid-cols-4"
        >

          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Total Milestones
            </p>

            <p
              class="mt-2 text-3xl font-bold
                     text-slate-900"
            >
              {{ totalMilestones() }}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Planned
            </p>

            <p
              class="mt-2 text-3xl font-bold
                     text-slate-900"
            >
              {{ plannedCount() }}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              In Progress
            </p>

            <p
              class="mt-2 text-3xl font-bold
                     text-slate-900"
            >
              {{ inProgressCount() }}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Complete
            </p>

            <p
              class="mt-2 text-3xl font-bold
                     text-slate-900"
            >
              {{ completeCount() }}
            </p>
          </div>

        </section>

        <!-- =======================================================
             CREATE / EDIT FORM
             ======================================================= -->
        @if (showForm()) {

          <section
            class="mb-8 rounded-2xl
                   border border-slate-200
                   bg-white p-6 shadow-sm"
          >

            <div
              class="mb-6 flex items-start
                     justify-between gap-4"
            >

              <div>
                <h2
                  class="text-lg font-semibold
                         text-slate-900"
                >
                  {{
                    editingMilestone()
                      ? 'Edit Milestone'
                      : 'Create Milestone'
                  }}
                </h2>

                <p
                  class="mt-1 text-sm
                         text-slate-500"
                >
                  Define a meaningful development
                  achievement for Zebron.
                </p>
              </div>

              <button
                type="button"
                (click)="cancelForm()"
                class="text-sm font-medium
                       text-slate-500
                       transition
                       hover:text-slate-900"
              >
                Cancel
              </button>

            </div>

            @if (formError()) {
              <div
                class="mb-5 rounded-xl
                       border border-red-200
                       bg-red-50 p-4
                       text-sm text-red-700"
              >
                {{ formError() }}
              </div>
            }

            <div
              class="grid gap-5 md:grid-cols-2"
            >

              <!-- Title -->
              <div class="md:col-span-2">
                <label
                  for="milestone-title"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Milestone Title
                </label>

                <input
                  id="milestone-title"
                  type="text"
                  [value]="formTitle()"
                  (input)="
                    formTitle.set(
                      getInputValue($event)
                    )
                  "
                  placeholder="Community Notifications"
                  class="w-full rounded-xl
                         border border-slate-300
                         px-4 py-3 text-sm
                         outline-none transition
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                />
              </div>

              <!-- Feature -->
              <div>
                <label
                  for="milestone-feature"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Feature
                </label>

                <input
                  id="milestone-feature"
                  type="text"
                  [value]="formFeature()"
                  (input)="
                    formFeature.set(
                      getInputValue($event)
                    )
                  "
                  placeholder="Community notification system"
                  class="w-full rounded-xl
                         border border-slate-300
                         px-4 py-3 text-sm
                         outline-none transition
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                />
              </div>

              <!-- Category -->
              <div>
                <label
                  for="milestone-category"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Category
                </label>

                <select
                  id="milestone-category"
                  [value]="formCategory()"
                  (change)="setCategory($event)"
                  class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="development">
                    Development
                  </option>

                  <option value="community">
                    Community
                  </option>

                  <option value="learning">
                    Learning
                  </option>

                  <option value="platform">
                    Platform
                  </option>

                  <option value="content">
                    Content
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <!-- Status -->
              <div>
                <label
                  for="milestone-status"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Status
                </label>

                <select
                  id="milestone-status"
                  [value]="formStatus()"
                  (change)="setStatus($event)"
                  class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="planned">
                    Planned
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="complete">
                    Complete
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>

              <!-- Development -->
              <div>
                <label
                  for="development-status"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Development
                </label>

                <select
                  id="development-status"
                  [value]="formDevelopmentStatus()"
                 (change)="setDevelopmentStatus($event)"
                  class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="not-started">
                    Not Started
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="complete">
                    Complete
                  </option>
                </select>
              </div>

              <!-- Testing -->
              <div>
                <label
                  for="testing-status"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Testing
                </label>

                <select
                  id="testing-status"
                  [value]="formTestingStatus()"
               (change)="setTestingStatus($event)"
                  class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="not-started">
                    Not Started
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="complete">
                    Complete
                  </option>
                </select>
              </div>

              <!-- Capture -->
              <div>
                <label
                  for="capture-status"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Capture
                </label>

                <select
                  id="capture-status"
                  [value]="formCaptureStatus()"
                  (change)="setCaptureStatus($event)"
                  class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="not-started">
                    Not Started
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="complete">
                    Complete
                  </option>
                </select>
              </div>

              <!-- Content -->
              <div>
                <label
                  for="content-status"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Content
                </label>

                <select
                  id="content-status"
                  [value]="formContentStatus()"
                 (change)="setContentStatus($event)"
                         class="w-full rounded-xl
                         border border-slate-300
                         bg-white px-4 py-3
                         text-sm outline-none
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                >
                  <option value="not-started">
                    Not Started
                  </option>

                  <option value="in-production">
                    In Production
                  </option>

                  <option value="published">
                    Published
                  </option>
                </select>
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label
                  for="milestone-description"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="milestone-description"
                  rows="4"
                  [value]="formDescription()"
                  (input)="
                    formDescription.set(
                      getInputValue($event)
                    )
                  "
                  placeholder="Describe what was accomplished and why it matters."
                  class="w-full rounded-xl
                         border border-slate-300
                         px-4 py-3 text-sm
                         outline-none transition
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                ></textarea>
              </div>

              <!-- Potential Title -->
              <div>
                <label
                  for="potential-title"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  Potential Content Title
                </label>

                <input
                  id="potential-title"
                  type="text"
                  [value]="formPotentialTitle()"
                  (input)="
                    formPotentialTitle.set(
                      getInputValue($event)
                    )
                  "
                  placeholder="How I Built a Notification System From Scratch"
                  class="w-full rounded-xl
                         border border-slate-300
                         px-4 py-3 text-sm
                         outline-none transition
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                />
              </div>

              <!-- External Folder -->
              <div>
                <label
                  for="external-folder"
                  class="mb-2 block text-sm
                         font-medium text-slate-700"
                >
                  External Assets Folder
                </label>

                <input
                  id="external-folder"
                  type="url"
                  [value]="formExternalFolderUrl()"
                  (input)="
                    formExternalFolderUrl.set(
                      getInputValue($event)
                    )
                  "
                  placeholder="https://drive.google.com/..."
                  class="w-full rounded-xl
                         border border-slate-300
                         px-4 py-3 text-sm
                         outline-none transition
                         focus:border-slate-500
                         focus:ring-2
                         focus:ring-slate-200"
                />
              </div>

            </div>

            <!-- Form Actions -->
            <div
              class="mt-6 flex flex-wrap
                     justify-end gap-3
                     border-t border-slate-100
                     pt-5"
            >

              <button
                type="button"
                (click)="cancelForm()"
                class="rounded-lg
                       border border-slate-300
                       bg-white px-4 py-2.5
                       text-sm font-medium
                       text-slate-700
                       transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="saveMilestone()"
                [disabled]="saving()"
                class="rounded-lg
                       bg-slate-900 px-5 py-2.5
                       text-sm font-semibold
                       text-white
                       transition hover:bg-slate-800
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (saving()) {
                  Saving...
                } @else {
                  {{
                    editingMilestone()
                      ? 'Update Milestone'
                      : 'Create Milestone'
                  }}
                }
              </button>

            </div>

          </section>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->
        @if (error()) {
          <div
            class="mb-6 rounded-2xl
                   border border-red-200
                   bg-red-50 p-5"
          >
            <p
              class="text-sm font-medium
                     text-red-800"
            >
              {{ error() }}
            </p>

            <button
              type="button"
              (click)="loadMilestones()"
              class="mt-3 text-sm font-semibold
                     text-red-900 hover:underline"
            >
              Try Again
            </button>
          </div>
        }

        <!-- =======================================================
             LOADING
             ======================================================= -->
        @if (loading()) {

          <div
            class="rounded-2xl
                   border border-slate-200
                   bg-white p-10 text-center
                   shadow-sm"
          >
            <p class="text-sm text-slate-500">
              Loading milestones...
            </p>
          </div>

        } @else {

          <!-- =====================================================
               MILESTONE LIST
               ===================================================== -->
          @if (milestones().length > 0) {

            <div class="grid gap-5 lg:grid-cols-2">

              @for (
                milestone of milestones();
                track milestone.id
              ) {

                <article
                  class="rounded-2xl
                         border border-slate-200
                         bg-white p-6
                         shadow-sm
                         transition
                         hover:shadow-md"
                >

                  <!-- Header -->
                  <div
                    class="flex items-start
                           justify-between gap-4"
                  >

                    <div class="min-w-0">

                      <div
                        class="mb-3 flex flex-wrap
                               items-center gap-2"
                      >

                        <span
                          class="rounded-full
                                 bg-slate-100
                                 px-3 py-1
                                 text-xs font-semibold
                                 text-slate-700"
                        >
                          {{ formatCategory(
                            milestone.category
                          ) }}
                        </span>

                        <span
                          class="rounded-full
                                 px-3 py-1
                                 text-xs font-semibold"
                          [class.bg-amber-100]="
                            milestone.status === 'planned'
                          "
                          [class.text-amber-700]="
                            milestone.status === 'planned'
                          "
                          [class.bg-blue-100]="
                            milestone.status === 'in-progress'
                          "
                          [class.text-blue-700]="
                            milestone.status === 'in-progress'
                          "
                          [class.bg-emerald-100]="
                            milestone.status === 'complete'
                          "
                          [class.text-emerald-700]="
                            milestone.status === 'complete'
                          "
                          [class.bg-slate-100]="
                            milestone.status === 'archived'
                          "
                          [class.text-slate-600]="
                            milestone.status === 'archived'
                          "
                        >
                          {{ formatStatus(
                            milestone.status
                          ) }}
                        </span>

                      </div>

                      <h2
                        class="text-xl font-semibold
                               text-slate-900"
                      >
                        {{ milestone.title }}
                      </h2>

                    </div>

                  </div>

                  <!-- Feature -->
                  <div class="mt-4">

                    <p
                      class="text-xs font-semibold
                             uppercase tracking-wide
                             text-slate-400"
                    >
                      Feature
                    </p>

                    <p
                      class="mt-1 text-sm
                             font-medium
                             text-slate-700"
                    >
                      {{ milestone.feature }}
                    </p>

                  </div>

                  <!-- Description -->
                  @if (milestone.description) {

                    <p
                      class="mt-4 text-sm
                             leading-6
                             text-slate-600"
                    >
                      {{ milestone.description }}
                    </p>

                  }

                  <!-- Progress -->
                  <div
                    class="mt-5 grid
                           grid-cols-2 gap-3
                           sm:grid-cols-4"
                  >

                    <div
                      class="rounded-xl
                             bg-slate-50 p-3"
                    >
                      <p
                        class="text-xs
                               text-slate-500"
                      >
                        Development
                      </p>

                      <p
                        class="mt-1 text-xs
                               font-semibold
                               text-slate-800"
                      >
                        {{
                          formatProgressStatus(
                            milestone.developmentStatus
                          )
                        }}
                      </p>
                    </div>

                    <div
                      class="rounded-xl
                             bg-slate-50 p-3"
                    >
                      <p
                        class="text-xs
                               text-slate-500"
                      >
                        Testing
                      </p>

                      <p
                        class="mt-1 text-xs
                               font-semibold
                               text-slate-800"
                      >
                        {{
                          formatProgressStatus(
                            milestone.testingStatus
                          )
                        }}
                      </p>
                    </div>

                    <div
                      class="rounded-xl
                             bg-slate-50 p-3"
                    >
                      <p
                        class="text-xs
                               text-slate-500"
                      >
                        Capture
                      </p>

                      <p
                        class="mt-1 text-xs
                               font-semibold
                               text-slate-800"
                      >
                        {{
                          formatProgressStatus(
                            milestone.captureStatus
                          )
                        }}
                      </p>
                    </div>

                    <div
                      class="rounded-xl
                             bg-slate-50 p-3"
                    >
                      <p
                        class="text-xs
                               text-slate-500"
                      >
                        Content
                      </p>

                      <p
                        class="mt-1 text-xs
                               font-semibold
                               text-slate-800"
                      >
                        {{
                          formatContentStatus(
                            milestone.contentStatus
                          )
                        }}
                      </p>
                    </div>

                  </div>

                  <!-- Potential Content -->
                  @if (milestone.potentialTitle) {

                    <div
                      class="mt-5 rounded-xl
                             border border-[#007979]/15
                             bg-[#007979]/5
                             p-4"
                    >

                      <p
                        class="text-xs font-semibold
                               uppercase
                               tracking-wide
                               text-[#007979]"
                      >
                        Potential Figure Out With J Content
                      </p>

                      <p
                        class="mt-1 text-sm
                               font-semibold
                               text-slate-800"
                      >
                        {{ milestone.potentialTitle }}
                      </p>

                    </div>

                  }

                  <!-- Actions -->
                  <div
                    class="mt-6 flex flex-wrap
                           items-center gap-3
                           border-t border-slate-100
                           pt-5"
                  >

                    <button
                      type="button"
                      (click)="editMilestone(milestone)"
                      class="inline-flex items-center
                             justify-center
                             rounded-lg
                             bg-slate-900
                             px-4 py-2.5
                             text-sm font-semibold
                             text-white
                             transition
                             hover:bg-slate-800"
                    >
                      Edit
                    </button>

                    @if (milestone.externalFolderUrl) {

                      <a
                        [href]="milestone.externalFolderUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex
                               items-center
                               justify-center
                               rounded-lg
                               border border-slate-300
                               bg-white
                               px-4 py-2.5
                               text-sm font-medium
                               text-slate-700
                               transition
                               hover:bg-slate-50"
                      >
                        Open Assets
                      </a>

                    }

                    <button
                      type="button"
                      (click)="deleteMilestone(milestone)"
                      [disabled]="saving()"
                      class="inline-flex
                             items-center
                             justify-center
                             rounded-lg
                             border border-red-200
                             bg-white
                             px-4 py-2.5
                             text-sm font-semibold
                             text-red-600
                             transition
                             hover:bg-red-50
                             disabled:cursor-not-allowed
                             disabled:opacity-50"
                    >
                      Delete
                    </button>

                  </div>

                </article>

              }

            </div>

          } @else {

            <!-- Empty -->
            <div
              class="rounded-2xl
                     border border-dashed
                     border-slate-300
                     bg-white p-12
                     text-center"
            >

              <div
                class="mx-auto flex h-14 w-14
                       items-center
                       justify-center
                       rounded-full
                       bg-slate-100
                       text-2xl"
              >
                🏗️
              </div>

              <h2
                class="mt-5 text-lg font-semibold
                       text-slate-900"
              >
                No milestones yet
              </h2>

              <p
                class="mx-auto mt-2 max-w-md
                       text-sm leading-6
                       text-slate-500"
              >
                Create milestones for meaningful Zebron
                development achievements that can later
                become Figure Out With J content.
              </p>

              <button
                type="button"
                (click)="showCreateForm()"
                class="mt-5 rounded-lg
                       bg-slate-900
                       px-4 py-2.5
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-slate-800"
              >
                Create First Milestone
              </button>

            </div>

          }

        }

      </main>

    </div>
  `,
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ContentMilestonesComponent
  implements OnInit
{
  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly milestoneService =
    inject(ContentMilestoneService);

  private readonly dialog =
    inject(MatDialog);

  // =========================================================
  // State
  // =========================================================

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

  readonly showForm =
    signal(false);

  readonly editingMilestone =
    signal<ContentMilestone | null>(null);

  // =========================================================
  // Form State
  // =========================================================

  readonly formTitle =
    signal('');

  readonly formDescription =
    signal('');

  readonly formFeature =
    signal('');

  readonly formCategory =
    signal<ContentMilestone['category']>(
      'development',
    );

  readonly formStatus =
    signal<ContentMilestone['status']>(
      'planned',
    );

  readonly formDevelopmentStatus =
    signal<
      ContentMilestone['developmentStatus']
    >('not-started');

  readonly formTestingStatus =
    signal<
      ContentMilestone['testingStatus']
    >('not-started');

  readonly formCaptureStatus =
    signal<
      ContentMilestone['captureStatus']
    >('not-started');

  readonly formContentStatus =
    signal<
      ContentMilestone['contentStatus']
    >('not-started');

  readonly formPotentialTitle =
    signal('');

  readonly formExternalFolderUrl =
    signal('');

  // =========================================================
  // Metrics
  // =========================================================

  readonly totalMilestones =
    computed(
      () => this.milestones().length,
    );

  readonly plannedCount =
    computed(
      () =>
        this.milestones().filter(
          (milestone) =>
            milestone.status === 'planned',
        ).length,
    );

  readonly inProgressCount =
    computed(
      () =>
        this.milestones().filter(
          (milestone) =>
            milestone.status === 'in-progress',
        ).length,
    );

  readonly completeCount =
    computed(
      () =>
        this.milestones().filter(
          (milestone) =>
            milestone.status === 'complete',
        ).length,
    );

  constructor() {
    this.pageTitleService.setTitle(
      'Milestones',
    );
  }

  // =========================================================
  // Lifecycle
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadMilestones();
  }

  // =========================================================
  // Load
  // =========================================================

  async loadMilestones(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const milestones =
        await this.milestoneService.getMilestones();

      this.milestones.set(
        milestones,
      );
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load milestones.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // Form
  // =========================================================

  showCreateForm(): void {
    this.resetForm();

    this.editingMilestone.set(null);

    this.showForm.set(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  editMilestone(
    milestone: ContentMilestone,
  ): void {
    this.editingMilestone.set(
      milestone,
    );

    this.formTitle.set(
      milestone.title,
    );

    this.formDescription.set(
      milestone.description ?? '',
    );

   this.formFeature.set(
  milestone.feature ?? '',
);
    this.formCategory.set(
      milestone.category,
    );

    this.formStatus.set(
      milestone.status,
    );

    this.formDevelopmentStatus.set(
      milestone.developmentStatus,
    );

    this.formTestingStatus.set(
      milestone.testingStatus,
    );

    this.formCaptureStatus.set(
      milestone.captureStatus,
    );

    this.formContentStatus.set(
      milestone.contentStatus,
    );

    this.formPotentialTitle.set(
      milestone.potentialTitle ?? '',
    );

    this.formExternalFolderUrl.set(
      milestone.externalFolderUrl ?? '',
    );

    this.formError.set(null);

    this.showForm.set(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  cancelForm(): void {
    this.showForm.set(false);

    this.editingMilestone.set(null);

    this.formError.set(null);

    this.resetForm();
  }

  resetForm(): void {
    this.formTitle.set('');

    this.formDescription.set('');

    this.formFeature.set('');

    this.formCategory.set(
      'development',
    );

    this.formStatus.set(
      'planned',
    );

    this.formDevelopmentStatus.set(
      'not-started',
    );

    this.formTestingStatus.set(
      'not-started',
    );

    this.formCaptureStatus.set(
      'not-started',
    );

    this.formContentStatus.set(
      'not-started',
    );

    this.formPotentialTitle.set('');

    this.formExternalFolderUrl.set('');
  }

  // =========================================================
  // Save
  // =========================================================

  async saveMilestone(): Promise<void> {
    this.formError.set(null);

    const title =
      this.formTitle().trim();

    const feature =
      this.formFeature().trim();

    if (!title) {
      this.formError.set(
        'Milestone title is required.',
      );

      return;
    }

    if (!feature) {
      this.formError.set(
        'Feature is required.',
      );

      return;
    }

    this.saving.set(true);

    try {
      const milestoneData = {
        title,

        description:
          this.formDescription().trim(),

        feature,

        category:
          this.formCategory(),

        status:
          this.formStatus(),

        developmentStatus:
          this.formDevelopmentStatus(),

        testingStatus:
          this.formTestingStatus(),

        captureStatus:
          this.formCaptureStatus(),

        contentStatus:
          this.formContentStatus(),

        potentialTitle:
          this.formPotentialTitle().trim(),

        externalFolderUrl:
          this.formExternalFolderUrl().trim(),
      };

      const existing =
        this.editingMilestone();

      if (existing) {
        await this.milestoneService.updateMilestone(
          existing.id,
          milestoneData,
        );
      } else {
        await this.milestoneService.createMilestone(
          milestoneData,
        );
      }

      this.cancelForm();

      await this.loadMilestones();
    } catch (error) {
      this.formError.set(
        error instanceof Error
          ? error.message
          : 'Unable to save milestone.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // =========================================================
  // Delete
  // =========================================================

  async deleteMilestone(
    milestone: ContentMilestone,
  ): Promise<void> {
    const dialogData:
      ConfirmationDialogData = {
      title: 'Delete Milestone',

      message:
        `Are you sure you want to delete "${milestone.title}"?`,

      warning:
        'This permanently removes the milestone from the Content & Operations system.',

      icon:
        'delete_outline',

      confirmText:
        'Delete',

      cancelText:
        'Cancel',

      destructive:
        true,
    };

    const dialogRef =
      this.dialog.open(
        ConfirmationDialogComponent,
        {
          width: '520px',

          maxWidth:
            'calc(100vw - 32px)',

          data:
            dialogData,
        },
      );

    const confirmed =
      await firstValueFrom(
        dialogRef.afterClosed(),
      );

    if (!confirmed) {
      return;
    }

    this.saving.set(true);

    this.error.set(null);

    try {
      await this.milestoneService.deleteMilestone(
        milestone.id,
      );

      await this.loadMilestones();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to delete milestone.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // =========================================================
  // Helpers
  // =========================================================

  getInputValue(
    event: Event,
  ): string {
    return (
      event.target as
        HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    ).value;
  }

   setDevelopmentStatus(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'not-started' ||
      value === 'in-progress' ||
      value === 'complete'
    ) {
      this.formDevelopmentStatus.set(value);
    }
  }

  setTestingStatus(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'not-started' ||
      value === 'in-progress' ||
      value === 'complete'
    ) {
      this.formTestingStatus.set(value);
    }
  }

  setCaptureStatus(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'not-started' ||
      value === 'in-progress' ||
      value === 'complete'
    ) {
      this.formCaptureStatus.set(value);
    }
  }

  setContentStatus(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'not-started' ||
      value === 'in-production' ||
      value === 'published'
    ) {
      this.formContentStatus.set(value);
    }
  }

    setCategory(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'development' ||
      value === 'community' ||
      value === 'learning' ||
      value === 'platform' ||
      value === 'content' ||
      value === 'other'
    ) {
      this.formCategory.set(value);
    }
  }

  setStatus(event: Event): void {
    const value = this.getInputValue(event);

    if (
      value === 'planned' ||
      value === 'in-progress' ||
      value === 'complete' ||
      value === 'archived'
    ) {
      this.formStatus.set(value);
    }
  }

  formatCategory(
    category: ContentMilestone['category'],
  ): string {
    const labels: Record<
      ContentMilestone['category'],
      string
    > = {
      development: 'Development',
      community: 'Community',
      learning: 'Learning',
      platform: 'Platform',
      content: 'Content',
      other: 'Other',
    };

    return labels[category];
  }

  formatStatus(
    status: ContentMilestone['status'],
  ): string {
    const labels: Record<
      ContentMilestone['status'],
      string
    > = {
      planned: 'Planned',
      'in-progress': 'In Progress',
      complete: 'Complete',
      archived: 'Archived',
    };

    return labels[status];
  }

  formatProgressStatus(
    status:
      ContentMilestone['developmentStatus'],
  ): string {
    const labels: Record<
      ContentMilestone['developmentStatus'],
      string
    > = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      complete: 'Complete',
    };

    return labels[status];
  }

  formatContentStatus(
    status:
      ContentMilestone['contentStatus'],
  ): string {
    const labels: Record<
      ContentMilestone['contentStatus'],
      string
    > = {
      'not-started': 'Not Started',
      'in-production': 'In Production',
      published: 'Published',
    };

    return labels[status];
  }
}