import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../../../core/services/auth.service';

import { LoggerService } from '../../../../../core/services/logger.service';

import { CommunityTopic } from '../../../../../features/community/models/community-topic.model';

import {
  CommunityTopicService,
  CreateCommunityTopicInput,
} from '../../../../../features/community/services/community-topic.service';

@Component({
  selector: 'app-community-topics-admin',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 mt-12">

      <!-- ===================================================== -->
      <!-- PAGE CONTAINER -->
      <!-- ===================================================== -->

      <div class="mx-auto max-w-7xl">

        <!-- =================================================== -->
        <!-- HEADER -->
        <!-- =================================================== -->

        <div
          class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >

          <div>
            <div class="flex items-center gap-3">

              <!-- ICON -->
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F4]"
              >
                <mat-icon class="!text-[#007979]">
                  settings
                </mat-icon>
              </div>

              <!-- TITLE -->
              <div>

                <h1
                  class="text-2xl font-bold text-[#032D42]"
                >
                  Community Topics
                </h1>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  Manage the topics available throughout the Community.
                </p>

              </div>
            </div>
          </div>

          <!-- ADD TOPIC -->
          <button
            mat-flat-button
            type="button"
            class="!rounded-xl !bg-[#007979] !px-5 !py-2 !text-white"
            (click)="startCreate()"
          >

            <mat-icon>
              add
            </mat-icon>

            Add Topic

          </button>

        </div>


        <!-- =================================================== -->
        <!-- ERROR MESSAGE -->
        <!-- =================================================== -->

        @if (errorMessage) {

          <div
            class="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >

            <mat-icon class="!text-red-600">
              error_outline
            </mat-icon>

            <div class="flex-1">
              {{ errorMessage }}
            </div>

            <button
              mat-icon-button
              type="button"
              (click)="dismissError()"
              aria-label="Dismiss error"
            >
              <mat-icon>
                close
              </mat-icon>
            </button>

          </div>

        }


        <!-- =================================================== -->
        <!-- CREATE / EDIT FORM -->
        <!-- =================================================== -->

        @if (showForm) {

          <section
            class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >

            <!-- FORM HEADER -->
            <div
              class="mb-5 flex items-center justify-between"
            >

              <div>

                <h2
                  class="text-lg font-semibold text-[#032D42]"
                >
                  {{ editingTopic ? 'Edit Topic' : 'Create Topic' }}
                </h2>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  Configure the topic information and display order.
                </p>

              </div>

              <button
                mat-icon-button
                type="button"
                (click)="cancelForm()"
                aria-label="Close topic form"
              >
                <mat-icon>
                  close
                </mat-icon>
              </button>

            </div>


            <!-- FORM FIELDS -->
            <div
              class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >

              <!-- ============================================= -->
              <!-- TOPIC NAME -->
              <!-- ============================================= -->

              <mat-form-field
                appearance="outline"
                class="w-full"
              >

                <mat-label>
                  Topic Name
                </mat-label>

                <input
                  matInput
                  [(ngModel)]="form.name"
                  (ngModelChange)="onTopicNameChange()"
                  placeholder="e.g. Immigration"
                  autocomplete="off"
                />

              </mat-form-field>


              <!-- ============================================= -->
              <!-- SLUG -->
              <!-- ============================================= -->

              <mat-form-field
                appearance="outline"
                class="w-full"
              >

                <mat-label>
                  Slug
                </mat-label>

                <input
                  matInput
                  [(ngModel)]="form.slug"
                  (ngModelChange)="onSlugChange()"
                  placeholder="immigration"
                  autocomplete="off"
                />

                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  matTooltip="Regenerate slug from topic name"
                  (click)="regenerateSlug()"
                  aria-label="Regenerate slug from topic name"
                >

                  <mat-icon>
                    refresh
                  </mat-icon>

                </button>

                <mat-hint>
                  Generated automatically, but you can customize it.
                </mat-hint>

              </mat-form-field>


              <!-- ============================================= -->
              <!-- DESCRIPTION -->
              <!-- ============================================= -->

              <mat-form-field
                appearance="outline"
                class="w-full md:col-span-2"
              >

                <mat-label>
                  Description
                </mat-label>

                <textarea
                  matInput
                  rows="3"
                  [(ngModel)]="form.description"
                  placeholder="Describe what members can discuss in this topic."
                ></textarea>

              </mat-form-field>


              <!-- ============================================= -->
              <!-- ICON -->
              <!-- ============================================= -->

              <mat-form-field
                appearance="outline"
                class="w-full"
              >

                <mat-label>
                  Icon / Emoji
                </mat-label>

                <input
                  matInput
                  [(ngModel)]="form.icon"
                  placeholder="🌍"
                />

              </mat-form-field>


              <!-- ============================================= -->
              <!-- SORT ORDER -->
              <!-- ============================================= -->

              <mat-form-field
                appearance="outline"
                class="w-full"
              >

                <mat-label>
                  Sort Order
                </mat-label>

                <input
                  matInput
                  type="number"
                  [(ngModel)]="form.sortOrder"
                  min="0"
                />

              </mat-form-field>

            </div>


            <!-- =============================================== -->
            <!-- ACTIVE -->
            <!-- =============================================== -->

            <div class="mt-2">

              <mat-slide-toggle
                [(ngModel)]="form.active"
              >
                Active
              </mat-slide-toggle>

            </div>


            <!-- =============================================== -->
            <!-- FORM ACTIONS -->
            <!-- =============================================== -->

            <div
              class="mt-6 flex justify-end gap-3"
            >

              <button
                mat-stroked-button
                type="button"
                class="!rounded-xl"
                (click)="cancelForm()"
              >
                Cancel
              </button>


              <button
                mat-flat-button
                type="button"
                class="!rounded-xl !bg-[#007979] !text-white"
                [disabled]="saving"
                (click)="saveTopic()"
              >

                <mat-icon>
                  {{ saving ? 'hourglass_top' : 'save' }}
                </mat-icon>

                {{ saving ? 'Saving...' : 'Save Topic' }}

              </button>

            </div>

          </section>

        }


        <!-- =================================================== -->
        <!-- TOPICS LIST -->
        <!-- =================================================== -->

        <section
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          <!-- LIST HEADER -->
          <div
            class="flex items-center justify-between border-b border-slate-200 px-5 py-4"
          >

            <div>

              <h2
                class="font-semibold text-[#032D42]"
              >
                Topics
              </h2>

              <p
                class="text-sm text-slate-500"
              >
                {{ topics.length }}
                {{ topics.length === 1 ? 'topic' : 'topics' }}
              </p>

            </div>


            <!-- REFRESH -->
            <button
              mat-icon-button
              type="button"
              matTooltip="Refresh topics"
              (click)="loadTopics()"
              [disabled]="loading"
              aria-label="Refresh topics"
            >

              <mat-icon>
                refresh
              </mat-icon>

            </button>

          </div>


          <!-- ================================================= -->
          <!-- LOADING -->
          <!-- ================================================= -->

          @if (loading) {

            <div
              class="flex items-center justify-center p-12"
            >

              <mat-icon
                class="animate-spin !text-[#007979]"
              >
                sync
              </mat-icon>

            </div>

          }


          <!-- ================================================= -->
          <!-- EMPTY -->
          <!-- ================================================= -->

          @else if (topics.length === 0) {

            <div
              class="p-12 text-center"
            >

              <mat-icon
                class="!h-12 !w-12 !text-[48px] !text-slate-300"
              >
                forum
              </mat-icon>


              <h3
                class="mt-4 font-semibold text-[#032D42]"
              >
                No topics yet
              </h3>


              <p
                class="mt-1 text-sm text-slate-500"
              >
                Create the first Community topic to get started.
              </p>


              <button
                mat-stroked-button
                type="button"
                class="mt-5 !rounded-xl"
                (click)="startCreate()"
              >

                <mat-icon>
                  add
                </mat-icon>

                Create Topic

              </button>

            </div>

          }


          <!-- ================================================= -->
          <!-- TOPICS -->
          <!-- ================================================= -->

          @else {

            <!-- ================================================= -->
            <!-- DESKTOP TABLE -->
            <!-- ================================================= -->

            <div
              class="hidden overflow-x-auto md:block"
            >

              <table
                class="w-full"
              >

                <thead>

                  <tr
                    class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >

                    <th
                      class="px-5 py-3"
                    >
                      Topic
                    </th>


                    <th
                      class="px-5 py-3"
                    >
                      Slug
                    </th>


                    <th
                      class="px-5 py-3 text-center"
                    >
                      Posts
                    </th>


                    <th
                      class="px-5 py-3 text-center"
                    >
                      Order
                    </th>


                    <th
                      class="px-5 py-3 text-center"
                    >
                      Status
                    </th>


                    <th
                      class="px-5 py-3 text-right"
                    >
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  @for (
                    topic of topics;
                    track topic.id
                  ) {

                    <tr
                      class="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <!-- ===================================== -->
                      <!-- TOPIC -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4"
                      >

                        <div
                          class="flex items-center gap-3"
                        >

                          @if (topic.icon) {

                            <span
                              class="text-xl"
                              aria-hidden="true"
                            >
                              {{ topic.icon }}
                            </span>

                          } @else {

                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F4]"
                            >

                              <mat-icon
                                class="!text-[#007979]"
                              >
                                forum
                              </mat-icon>

                            </div>

                          }


                          <div>

                            <div
                              class="font-medium text-[#032D42]"
                            >
                              {{ topic.name }}
                            </div>


                            @if (topic.description) {

                              <div
                                class="max-w-md truncate text-xs text-slate-500"
                              >
                                {{ topic.description }}
                              </div>

                            }

                          </div>

                        </div>

                      </td>


                      <!-- ===================================== -->
                      <!-- SLUG -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4 text-sm text-slate-600"
                      >
                        {{ topic.slug }}
                      </td>


                      <!-- ===================================== -->
                      <!-- POSTS -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4 text-center text-sm text-slate-600"
                      >
                        {{ topic.postCount ?? 0 }}
                      </td>


                      <!-- ===================================== -->
                      <!-- SORT ORDER -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4 text-center text-sm text-slate-600"
                      >
                        {{ topic.sortOrder }}
                      </td>


                      <!-- ===================================== -->
                      <!-- STATUS -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4 text-center"
                      >

                        <button
                          mat-button
                          type="button"
                          class="!rounded-full"
                          (click)="toggleActive(topic)"
                        >

                          <span
                            class="rounded-full px-3 py-1 text-xs font-semibold"
                            [class.bg-emerald-100]="topic.active"
                            [class.text-emerald-700]="topic.active"
                            [class.bg-slate-100]="!topic.active"
                            [class.text-slate-600]="!topic.active"
                          >
                            {{ topic.active ? 'Active' : 'Inactive' }}
                          </span>

                        </button>

                      </td>


                      <!-- ===================================== -->
                      <!-- ACTIONS -->
                      <!-- ===================================== -->

                      <td
                        class="px-5 py-4"
                      >

                        <div
                          class="flex justify-end gap-1"
                        >

                          <button
                            mat-icon-button
                            type="button"
                            matTooltip="Edit topic"
                            (click)="startEdit(topic)"
                            aria-label="Edit topic"
                          >

                            <mat-icon>
                              edit
                            </mat-icon>

                          </button>


                          <button
                            mat-icon-button
                            type="button"
                            matTooltip="Delete topic"
                            class="!text-red-600"
                            (click)="deleteTopic(topic)"
                            aria-label="Delete topic"
                          >

                            <mat-icon>
                              delete
                            </mat-icon>

                          </button>

                        </div>

                      </td>

                    </tr>

                  }

                </tbody>

              </table>

            </div>


            <!-- ================================================= -->
            <!-- MOBILE -->
            <!-- ================================================= -->

            <div
              class="divide-y divide-slate-100 md:hidden"
            >

              @for (
                topic of topics;
                track topic.id
              ) {

                <div
                  class="p-4"
                >

                  <div
                    class="flex items-start gap-3"
                  >

                    @if (topic.icon) {

                      <span
                        class="pt-1 text-xl"
                      >
                        {{ topic.icon }}
                      </span>

                    } @else {

                      <mat-icon
                        class="!text-[#007979]"
                      >
                        forum
                      </mat-icon>

                    }


                    <div
                      class="min-w-0 flex-1"
                    >

                      <div
                        class="font-semibold text-[#032D42]"
                      >
                        {{ topic.name }}
                      </div>


                      <div
                        class="mt-1 text-xs text-slate-500"
                      >
                        {{ topic.slug }}
                      </div>


                      @if (topic.description) {

                        <p
                          class="mt-2 text-sm text-slate-600"
                        >
                          {{ topic.description }}
                        </p>

                      }


                      <div
                        class="mt-3 flex flex-wrap items-center gap-2 text-xs"
                      >

                        <span
                          class="rounded-full bg-slate-100 px-2.5 py-1"
                        >
                          {{ topic.postCount ?? 0 }} posts
                        </span>


                        <span
                          class="rounded-full bg-slate-100 px-2.5 py-1"
                        >
                          Order {{ topic.sortOrder }}
                        </span>


                        <span
                          class="rounded-full px-2.5 py-1"
                          [class.bg-emerald-100]="topic.active"
                          [class.text-emerald-700]="topic.active"
                          [class.bg-slate-100]="!topic.active"
                          [class.text-slate-600]="!topic.active"
                        >
                          {{ topic.active ? 'Active' : 'Inactive' }}
                        </span>

                      </div>

                    </div>

                  </div>


                  <!-- MOBILE ACTIONS -->

                  <div
                    class="mt-3 flex justify-end gap-2"
                  >

                    <button
                      mat-stroked-button
                      type="button"
                      class="!rounded-xl"
                      (click)="startEdit(topic)"
                    >

                      <mat-icon>
                        edit
                      </mat-icon>

                      Edit

                    </button>


                    <button
                      mat-stroked-button
                      type="button"
                      class="!rounded-xl !text-red-600"
                      (click)="deleteTopic(topic)"
                    >

                      <mat-icon>
                        delete
                      </mat-icon>

                      Delete

                    </button>

                  </div>

                </div>

              }

            </div>

          }

        </section>

      </div>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityTopicsAdminComponent
  implements OnInit {

  // ============================================================
  // SERVICES
  // ============================================================

  private readonly topicService =
    inject(CommunityTopicService);

  private readonly logger =
    inject(LoggerService);

  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);

  readonly authService =
    inject(AuthService);


  // ============================================================
  // STATE
  // ============================================================

  topics: CommunityTopic[] = [];

  loading = false;

  saving = false;

  errorMessage: string | null = null;

  showForm = false;

  editingTopic: CommunityTopic | null = null;


  /**
   * Tracks whether the administrator has manually
   * modified the slug during topic creation.
   *
   * Once manually edited, changing the topic name
   * will no longer overwrite the custom slug.
   */
  private slugManuallyEdited = false;


  // ============================================================
  // FORM
  // ============================================================

  form: CreateCommunityTopicInput = {
    name: '',
    slug: '',
    description: '',
    icon: '',
    imageUrl: '',
    sortOrder: 0,
    active: true,
  };


  // ============================================================
  // LIFECYCLE
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.loadTopics();
  }


  // ============================================================
  // LOAD TOPICS
  // ============================================================

  async loadTopics(): Promise<void> {
    this.loading = true;

    this.errorMessage = null;

    /*
     * Because this component uses OnPush and the data
     * is loaded asynchronously, explicitly mark the view
     * for checking.
     */
    this.changeDetectorRef.markForCheck();

    const startedAt =
      performance.now();

    try {

      const serviceStartedAt =
        performance.now();

      const topics =
        await this.topicService.getAllTopics();

      const serviceElapsed =
        performance.now() -
        serviceStartedAt;

      this.topics =
        topics;

      const totalElapsed =
        performance.now() -
        startedAt;

      /*
       * Temporary performance diagnostics.
       *
       * Remove these once the administration page
       * has been fully validated.
       */
      console.log(
        '[CommunityTopicsAdmin] Topics loaded:',
        this.topics.length,
      );

      console.log(
        '[CommunityTopicsAdmin] Firestore/service time:',
        `${serviceElapsed.toFixed(0)} ms`,
      );

      console.log(
        '[CommunityTopicsAdmin] Total load time:',
        `${totalElapsed.toFixed(0)} ms`,
      );

    } catch (error) {

      this.logger.error(
        'CommunityTopicsAdminComponent',
        'Failed to load Community topics.',
        {
          error,
        },
      );

      this.errorMessage =
        'Unable to load Community topics.';

    } finally {

      this.loading = false;

      this.changeDetectorRef.markForCheck();

    }
  }


  // ============================================================
  // CREATE
  // ============================================================

  startCreate(): void {
    this.editingTopic = null;

    this.slugManuallyEdited = false;

    const nextSortOrder =
      this.topics.length > 0
        ? Math.max(
            ...this.topics.map(
              (topic) =>
                topic.sortOrder ?? 0,
            ),
          ) + 1
        : 0;

    this.form = {
      name: '',
      slug: '',
      description: '',
      icon: '',
      imageUrl: '',
      sortOrder: nextSortOrder,
      active: true,
    };

    this.errorMessage = null;

    this.showForm = true;

    this.changeDetectorRef.markForCheck();
  }


  // ============================================================
  // EDIT
  // ============================================================

  startEdit(
    topic: CommunityTopic,
  ): void {

    this.editingTopic =
      topic;

    /*
     * Existing topics should preserve their current slug.
     *
     * The administrator can edit the slug manually.
     */
    this.slugManuallyEdited =
      true;

    this.form = {
      name:
        topic.name,

      slug:
        topic.slug,

      description:
        topic.description ?? '',

      icon:
        topic.icon ?? '',

      imageUrl:
        topic.imageUrl ?? '',

      sortOrder:
        topic.sortOrder ?? 0,

      active:
        topic.active,
    };

    this.errorMessage = null;

    this.showForm = true;

    this.changeDetectorRef.markForCheck();
  }


  // ============================================================
  // CANCEL
  // ============================================================

  cancelForm(): void {

    this.showForm = false;

    this.editingTopic = null;

    this.slugManuallyEdited = false;

    this.errorMessage = null;

    this.changeDetectorRef.markForCheck();
  }


  // ============================================================
  // SAVE
  // ============================================================

  async saveTopic(): Promise<void> {

    this.errorMessage = null;

    const name =
      this.form.name.trim();

    const slug =
      this.form.slug.trim();

    // ----------------------------------------------------------
    // NAME VALIDATION
    // ----------------------------------------------------------

    if (!name) {

      this.errorMessage =
        'Topic name is required.';

      return;
    }


    // ----------------------------------------------------------
    // SLUG VALIDATION
    // ----------------------------------------------------------

    if (!slug) {

      this.errorMessage =
        'Topic slug is required.';

      return;
    }


    this.saving = true;

    this.changeDetectorRef.markForCheck();

    try {

      /*
       * Normalize the values before passing them
       * to the service.
       */
      const topicInput:
        CreateCommunityTopicInput = {

        name,

        slug,

        description:
          this.form.description?.trim() ?? '',

        icon:
          this.form.icon?.trim() ?? '',

        imageUrl:
          this.form.imageUrl?.trim() ?? '',

        sortOrder:
          Number(this.form.sortOrder) || 0,

        active:
          this.form.active,
      };


      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (this.editingTopic) {

        await this.topicService.updateTopic(
          this.editingTopic.id,
          topicInput,
        );

      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      else {

        await this.topicService.createTopic(
          topicInput,
        );

      }


      // --------------------------------------------------------
      // RESET FORM
      // --------------------------------------------------------

      this.showForm = false;

      this.editingTopic = null;

      this.slugManuallyEdited = false;


      // --------------------------------------------------------
      // REFRESH TOPICS
      // --------------------------------------------------------

      await this.loadTopics();

    } catch (error) {

      this.logger.error(
        'CommunityTopicsAdminComponent',
        'Failed to save Community topic.',
        {
          error,
        },
      );

      this.errorMessage =
        'Unable to save the Community topic.';

    } finally {

      this.saving = false;

      this.changeDetectorRef.markForCheck();

    }
  }


  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================

  async toggleActive(
    topic: CommunityTopic,
  ): Promise<void> {

    this.errorMessage = null;

    const nextActive =
      !topic.active;

    try {

      await this.topicService.setTopicActive(
        topic.id,
        nextActive,
      );

      /*
       * Update the local record immediately so the UI
       * responds without another Firestore read.
       */
      topic.active =
        nextActive;

      this.changeDetectorRef.markForCheck();

    } catch (error) {

      this.logger.error(
        'CommunityTopicsAdminComponent',
        'Failed to change Community topic status.',
        {
          topicId:
            topic.id,

          error,
        },
      );

      this.errorMessage =
        'Unable to change the topic status.';

      this.changeDetectorRef.markForCheck();
    }
  }


  // ============================================================
  // DELETE
  // ============================================================

  async deleteTopic(
    topic: CommunityTopic,
  ): Promise<void> {

    /*
     * Topics with posts should not be deleted because
     * existing Community posts may reference the topic.
     *
     * Deactivation is the safer lifecycle operation.
     */
    if (
      (topic.postCount ?? 0) > 0
    ) {

      this.errorMessage =
        `“${topic.name}” has existing posts. Deactivate the topic instead of deleting it.`;

      this.changeDetectorRef.markForCheck();

      return;
    }


    const confirmed =
      window.confirm(
        `Delete the topic “${topic.name}”? This cannot be undone.`,
      );


    if (!confirmed) {
      return;
    }


    try {

      await this.topicService.deleteTopic(
        topic.id,
      );


      /*
       * Remove the deleted topic from the local
       * collection immediately.
       */
      this.topics =
        this.topics.filter(
          (item) =>
            item.id !== topic.id,
        );

      this.changeDetectorRef.markForCheck();

    } catch (error) {

      this.logger.error(
        'CommunityTopicsAdminComponent',
        'Failed to delete Community topic.',
        {
          topicId:
            topic.id,

          error,
        },
      );

      this.errorMessage =
        'Unable to delete the Community topic.';

      this.changeDetectorRef.markForCheck();
    }
  }


  // ============================================================
  // TOPIC NAME → SLUG
  // ============================================================

  onTopicNameChange(): void {

    /*
     * During creation:
     *
     *   Topic Name → automatically generates slug
     *
     * Once the administrator manually edits the slug,
     * changing the topic name will no longer overwrite it.
     *
     * During editing, an existing slug is always preserved
     * unless the administrator changes it.
     */
    if (
      !this.editingTopic &&
      !this.slugManuallyEdited
    ) {

      this.form.slug =
        this.generateSlug(
          this.form.name,
        );

      this.changeDetectorRef.markForCheck();
    }
  }


  // ============================================================
  // MANUAL SLUG CHANGE
  // ============================================================

  onSlugChange(): void {

    /*
     * The administrator has explicitly taken control
     * of the slug.
     */
    this.slugManuallyEdited =
      true;
  }


  // ============================================================
  // REGENERATE SLUG
  // ============================================================

  regenerateSlug(): void {

    this.form.slug =
      this.generateSlug(
        this.form.name,
      );

    /*
     * Regeneration returns control to the automatic
     * name → slug behavior during creation.
     */
    this.slugManuallyEdited =
      false;

    this.changeDetectorRef.markForCheck();
  }


  // ============================================================
  // SLUG GENERATION
  // ============================================================

  private generateSlug(
    value: string,
  ): string {

    return value
      .trim()
      .toLowerCase()

      /*
       * Remove punctuation and special characters.
       */
      .replace(
        /[^a-z0-9\s-]/g,
        '',
      )

      /*
       * Convert whitespace into hyphens.
       */
      .replace(
        /\s+/g,
        '-',
      )

      /*
       * Prevent duplicate hyphens.
       */
      .replace(
        /-+/g,
        '-',
      )

      /*
       * Remove leading/trailing hyphens.
       */
      .replace(
        /^-|-$/g,
        '');
  }


  // ============================================================
  // DISMISS ERROR
  // ============================================================

  dismissError(): void {

    this.errorMessage = null;

    this.changeDetectorRef.markForCheck();
  }
}