import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { HotToastService } from '@ngxpert/hot-toast';

import { TestCourse } from '../../../../features/test-center/models/test-course.model';
import { TestTopic } from '../../../../features/test-center/models/test-topic.model';

import { TestCourseService } from '../../../../features/test-center/services/test-course.service';
import { TestTopicService } from '../../../../features/test-center/services/test-topic.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-test-topic-admin',
  standalone: true,

  imports: [FormsModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule],

  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- ============================================================
     PAGE HEADER
     ============================================================ -->

      <header class="bg-[#032D42] shadow-md">
        <div
          class="mx-auto max-w-7xl
           px-4 py-2
           sm:px-6
           lg:px-8"
        >
          <div
            class="flex items-start
             justify-between
             gap-4"
          >
            <!-- ======================================================
           HEADER CONTENT / BREADCRUMB
           ====================================================== -->

            <div class="min-w-0">
              <!-- Current Breadcrumb -->

              <div
                class="mb-2 flex flex-wrap
                 items-center gap-2
                 text-sm text-white/65"
              >
                <a
                  routerLink="/admin"
                  class="transition
                   hover:text-white"
                >
                  Admin
                </a>

                <span>/</span>

                <a
                  routerLink="/admin/test-center"
                  class="transition
                   hover:text-white"
                >
                  Test Center
                </a>

                <span>/</span>

                <span class="text-white/90"> Topics </span>
              </div>

              <!-- Title -->

              <h1
                class="text-2xl
                 font-bold
                 tracking-tight
                 text-white
                 sm:text-3xl"
              >
                Test Center Topics
              </h1>

              <p
                class="mt-1 text-sm
                 text-white/65"
              >
                Create and manage topics for Test Center courses.
              </p>
            </div>

            <!-- ======================================================
           HEADER ACTIONS
           ====================================================== -->

            <div
              class="flex shrink-0
               items-center gap-2"
            >
              <!-- Add Course -->

              <button
                type="button"
                (click)="startNewTopic()"
                class="rounded-lg
                     bg-[#007979]
                     px-4
                     py-1.5
                     text-sm
                     font-semibold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-teal-400
                     cursor-pointer"
              >
                + Add Topic
              </button>

              <!-- ====================================================
             THREE-DOT MENU
             ==================================================== -->

              <button
                mat-icon-button
                [matMenuTriggerFor]="courseHeaderMenu"
                aria-label="Test Center navigation"
                class="!text-white"
              >
                <mat-icon> more_vert </mat-icon>
              </button>

              <!-- ====================================================
             MATERIAL MENU
             ==================================================== -->

              <mat-menu #courseHeaderMenu="matMenu" xPosition="before">
                <!-- Home -->

                <a mat-menu-item routerLink="/admin">
                  <mat-icon> home </mat-icon>

                  <span> Home </span>
                </a>

                <!-- Test Center -->

                <a mat-menu-item routerLink="/test-center">
                  <mat-icon> school </mat-icon>

                  <span> Test Center </span>
                </a>

                <mat-divider></mat-divider>

                <!-- Test Center Administration -->

                <div
                  class="px-4 py-2
                   text-[10px]
                   font-semibold
                   uppercase
                   tracking-wider
                   text-gray-500"
                >
                  Test Center
                </div>

                <!-- Courses -->

                <a mat-menu-item routerLink="/admin/test-center/courses">
                  <mat-icon> menu_book </mat-icon>

                  <span> Courses </span>
                </a>

                <!-- Topics -->

                <a mat-menu-item routerLink="/admin/test-center/topics">
                  <mat-icon> account_tree </mat-icon>

                  <span> Topics </span>
                </a>

                <!-- Question Bank -->

                <a mat-menu-item routerLink="/admin/test-center/questions">
                  <mat-icon> quiz </mat-icon>

                  <span> Question Bank </span>
                </a>

                <mat-divider></mat-divider>

                <!-- Sign Out -->

                <button mat-menu-item type="button" (click)="signOut()">
                  <mat-icon> logout </mat-icon>

                  <span> Sign Out </span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>
      </header>

      <!-- ============================================================
     CONTENT
     ============================================================ -->

      <section
        class="mx-auto
         max-w-7xl
         px-4
         py-3
         sm:px-6
         lg:px-8"
      >
        <!-- ==========================================================
       TWO-COLUMN TOPIC MANAGEMENT
       ========================================================== -->

        <div
          class="grid
           grid-cols-1
           gap-6
           lg:grid-cols-[minmax(0,1fr)_380px]"
        >
          <!-- ========================================================
         LEFT: TOPIC FORM
         ======================================================== -->

          <div class="min-w-0">
            @if (showForm()) {
              <div
                class="rounded-2xl
                 border
                 border-gray-200
                 bg-white
                 p-6
                 shadow-sm"
              >
                <!-- ==================================================
               FORM HEADER
               ================================================== -->

                <div
                  class="mb-6
                   flex
                   items-start
                   justify-between
                   gap-4"
                >
                  <div>
                    <h2
                      class="text-lg
                       font-bold
                       text-[#032D42]"
                    >
                      {{ editingId() ? 'Edit Topic' : 'Add Topic' }}
                    </h2>

                    <p
                      class="mt-1
                       text-sm
                       text-gray-500"
                    >
                      {{
                        editingId()
                          ? 'Update the topic information below.'
                          : 'Create a new topic for a Test Center course.'
                      }}
                    </p>
                  </div>

                  <!-- Editing Actions -->

                  @if (editingId()) {
                    <div
                      class="flex
                       shrink-0
                       items-center
                       gap-2"
                    >
                      <span
                        class="hidden
                         rounded-full
                         bg-gray-100
                         px-2.5
                         py-1
                         text-xs
                         font-medium
                         text-gray-600
                         sm:inline-flex"
                      >
                        Editing
                      </span>

                      <!-- Cancel -->

                      <button
                        type="button"
                        (click)="cancelForm()"
                        [disabled]="saving()"
                        class="rounded-lg
                         border
                         border-gray-200
                         bg-white
                         px-3
                         py-2
                         text-xs
                         font-semibold
                         text-gray-700
                         transition
                         hover:bg-gray-50
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <!-- Update -->

                      <button
                        type="button"
                        (click)="saveTopic()"
                        [disabled]="saving()"
                        class="rounded-lg
                         bg-[#007979]
                         px-3
                         py-2
                         text-xs
                         font-semibold
                         text-white
                         shadow-sm
                         transition
                         hover:bg-[#006666]
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                      >
                        {{ saving() ? 'Saving...' : 'Update' }}
                      </button>
                    </div>
                  }
                </div>

                <!-- ==================================================
               TOPIC FORM
               ================================================== -->

                <form (ngSubmit)="saveTopic()" novalidate class="space-y-5">
                  <!-- Course -->

                  <div>
                    <label
                      for="course"
                      class="block
                       text-sm
                       font-semibold
                       text-[#032D42]"
                    >
                      Course
                      <span class="text-red-500">*</span>
                    </label>

                    <select
                      id="course"
                      name="courseId"
                      [(ngModel)]="form.courseId"
                      [disabled]="!!editingId()"
                      class="mt-1.5
                       block
                       w-full
                       rounded-lg
                       border
                       border-gray-200
                       bg-white
                       px-3.5
                       py-2.5
                       text-sm
                       text-gray-800
                       focus:border-[#007979]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/20
                       disabled:bg-gray-100"
                    >
                      <option value="">Select a course</option>

                      @for (course of courses(); track course.id) {
                        <option [value]="course.id">
                          {{ course.name }}
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Topic Name -->

                  <div>
                    <label
                      for="topic-name"
                      class="block
                       text-sm
                       font-semibold
                       text-[#032D42]"
                    >
                      Topic Name
                      <span class="text-red-500">*</span>
                    </label>

                    <input
                      id="topic-name"
                      name="name"
                      type="text"
                      [(ngModel)]="form.name"
                      (ngModelChange)="onNameChange($event)"
                      autocomplete="off"
                      class="mt-1.5
                       block
                       w-full
                       rounded-lg
                       border
                       border-gray-200
                       bg-white
                       px-3.5
                       py-2.5
                       text-sm
                       text-gray-800
                       focus:border-[#007979]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/20"
                    />
                  </div>

                  <!-- Slug -->

                  <div>
                    <label
                      for="topic-slug"
                      class="block
                       text-sm
                       font-semibold
                       text-[#032D42]"
                    >
                      Slug
                    </label>

                    <input
                      id="topic-slug"
                      name="slug"
                      type="text"
                      [(ngModel)]="form.slug"
                      readonly
                      class="mt-1.5
                       block
                       w-full
                       rounded-lg
                       border
                       border-gray-200
                       bg-gray-50
                       px-3.5
                       py-2.5
                       text-sm
                       text-gray-600
                       focus:outline-none"
                    />
                  </div>

                  <!-- Description -->

                  <div>
                    <label
                      for="topic-description"
                      class="block
                       text-sm
                       font-semibold
                       text-[#032D42]"
                    >
                      Description
                    </label>

                    <textarea
                      id="topic-description"
                      name="description"
                      rows="4"
                      [(ngModel)]="form.description"
                      class="mt-1.5
                       block
                       w-full
                       rounded-lg
                       border
                       border-gray-200
                       bg-white
                       px-3.5
                       py-2.5
                       text-sm
                       text-gray-800
                       focus:border-[#007979]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/20"
                    ></textarea>
                  </div>

                  <!-- =================================================
     SORT ORDER / ACTIVE
     ================================================= -->

                  <div
                    class="grid
         grid-cols-1
         gap-5
         sm:grid-cols-2"
                  >
                    <!-- Sort Order -->

                    <div>
                      <label
                        for="topic-sort-order"
                        class="block
             text-sm
             font-semibold
             text-[#032D42]"
                      >
                        Sort Order
                      </label>

                      <input
                        id="topic-sort-order"
                        name="sortOrder"
                        type="number"
                        min="0"
                        step="1"
                        [(ngModel)]="form.sortOrder"
                        class="mt-1.5
             block
             w-full
             rounded-lg
             border
             border-gray-200
             bg-white
             px-3.5
             py-2.5
             text-sm
             text-gray-800
             focus:border-[#007979]
             focus:outline-none
             focus:ring-2
             focus:ring-[#007979]/20"
                      />

                      <p
                        class="mt-1
             text-xs
             text-gray-500"
                      >
                        Controls the display order of topics.
                      </p>
                    </div>

                    <!-- Active -->

                    <div
                      class="flex
           items-center
           rounded-lg
           border
           border-gray-200
           bg-gray-50
           px-4"
                    >
                      <label
                        class="flex
             cursor-pointer
             items-center
             gap-3"
                      >
                        <input
                          type="checkbox"
                          name="active"
                          [(ngModel)]="form.active"
                          class="h-4
               w-4
               rounded
               border-gray-300
               text-[#007979]
               focus:ring-[#007979]"
                        />

                        <span>
                          <span
                            class="block
                 text-sm
                 font-semibold
                 text-[#032D42]"
                          >
                            Active
                          </span>

                          <span
                            class="block
                 text-xs
                 text-gray-500"
                          >
                            Available to Test Center users
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <!-- ==================================================
                 BOTTOM ACTIONS
                 ================================================== -->

                  <div
                    class="flex
                     flex-col-reverse
                     gap-3
                     border-t
                     border-gray-100
                     pt-5
                     sm:flex-row
                     sm:justify-end"
                  >
                    <button
                      type="button"
                      (click)="cancelForm()"
                      [disabled]="saving()"
                      class="rounded-lg
                       border
                       border-gray-200
                       bg-white
                       px-4
                       py-2.5
                       text-sm
                       font-semibold
                       text-gray-700
                       hover:bg-gray-50
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      [disabled]="saving()"
                      class="rounded-lg
                       bg-[#007979]
                       px-5
                       py-2.5
                       text-sm
                       font-semibold
                       text-white
                       hover:bg-[#006666]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
                    >
                      {{ saving() ? 'Saving...' : editingId() ? 'Update Topic' : 'Create Topic' }}
                    </button>
                  </div>
                </form>
              </div>
            } @else {
              <!-- ====================================================
             EMPTY FORM STATE
             ==================================================== -->

              <section
                class="flex
                 min-h-[420px]
                 items-center
                 justify-center
                 rounded-2xl
                 border
                 border-gray-200
                 bg-white
                 shadow-sm"
              >
                <div
                  class="max-w-md
                   px-6
                   text-center"
                >
                  <div
                    class="mx-auto
                     mb-4
                     flex
                     h-14
                     w-14
                     items-center
                     justify-center
                     rounded-xl
                     bg-[#032D42]"
                  >
                    <mat-icon
                      class="!h-7
                       !w-7
                       !text-2xl
                       !leading-7
                       text-white"
                    >
                      account_tree
                    </mat-icon>
                  </div>

                  <h2
                    class="text-lg
                     font-semibold
                     text-gray-900"
                  >
                    Topic Management
                  </h2>

                  <p
                    class="mt-2
                     text-sm
                     leading-6
                     text-gray-500"
                  >
                    Select an existing topic to edit it, or create a new topic for a Test Center
                    course.
                  </p>

                  <button
                    type="button"
                    (click)="startNewTopic()"
                    class="mt-5
                     rounded-lg
                     bg-[#007979]
                     px-4
                     py-2.5
                     text-sm
                     font-semibold
                     text-white
                     transition
                     hover:bg-[#006666]"
                  >
                    + Add Topic
                  </button>
                </div>
              </section>
            }
          </div>

          <!-- ========================================================
         RIGHT: EXISTING TOPICS
         ======================================================== -->

          <aside
            class="h-fit
             overflow-hidden
             rounded-2xl
             border
             border-gray-200
             bg-white
             shadow-sm
             lg:sticky
             lg:top-6"
          >
            <!-- ======================================================
           LIST HEADER
           ====================================================== -->

            <div
              class="border-b
               border-gray-100
               px-5
               py-4"
            >
              <div
                class="flex
                 items-center
                 justify-between
                 gap-3"
              >
                <div>
                  <h2
                    class="font-bold
                     text-[#032D42]"
                  >
                    Existing Topics
                  </h2>

                  <p
                    class="mt-1
                     text-xs
                     text-gray-500"
                  >
                    {{ topics().length }}
                    {{ topics().length === 1 ? 'topic' : 'topics' }}
                  </p>
                </div>

                @if (loading()) {
                  <span
                    class="text-xs
                     text-gray-500"
                  >
                    Loading...
                  </span>
                }
              </div>
            </div>

            <!-- ======================================================
           TOPIC RECORDS
           ====================================================== -->

            <div
              class="max-h-[calc(100vh-180px)]
               overflow-y-auto"
            >
              @if (loading()) {
                <div
                  class="px-5
                   py-10
                   text-center
                   text-sm
                   text-gray-500"
                >
                  Loading topics...
                </div>

              } @else if (topics().length === 0) {
                <div
                  class="px-5
                   py-10
                   text-center"
                >
                  <div
                    class="mx-auto
                     mb-3
                     flex
                     h-10
                     w-10
                     items-center
                     justify-center
                     rounded-lg
                     bg-gray-100"
                  >
                    <mat-icon class="text-gray-500"> account_tree </mat-icon>
                  </div>

                  <p
                    class="text-sm
                     font-medium
                     text-gray-700"
                  >
                    No topics yet
                  </p>

                  <p
                    class="mt-1
                     text-xs
                     leading-5
                     text-gray-500"
                  >
                    Create your first topic using the Add Topic button.
                  </p>
                </div>

              } @else {
                <div
                  class="divide-y
                   divide-gray-100"
                >
                  @for (topic of topics(); track topic.id) {
                    <!-- ==================================================
                   TOPIC RECORD
                   ================================================== -->

                    <button
                      type="button"
                      (click)="editTopic(topic)"
                      class="w-full
                       px-5
                       py-4
                       text-left
                       transition
                       hover:bg-gray-50
                       focus:bg-gray-50
                       focus:outline-none"
                      [class.bg-teal-50]="editingId() === topic.id"
                    >
                      <div
                        class="flex
                         items-start
                         justify-between
                         gap-3"
                      >
                        <!-- Topic Information -->

                        <div
                          class="min-w-0
                           flex-1"
                        >
                          <div
                            class="flex
                             items-start
                             gap-2"
                          >
                            <h3
                              class="truncate
                               text-sm
                               font-semibold
                               text-[#032D42]"
                            >
                              {{ topic.name }}
                            </h3>
                          </div>

                          <!-- Course -->

                          <p
                            class="mt-1
                             truncate
                             text-xs
                             font-medium
                             text-gray-500"
                          >
                            {{ getCourseName(topic.courseId) }}
                          </p>

                          <!-- Slug -->

                          <p
                            class="mt-0.5
                             truncate
                             text-[11px]
                             text-gray-400"
                          >
                            {{ topic.slug }}
                          </p>

                          <!-- Status / Metadata -->

                          <div
                            class="mt-2
                             flex
                             flex-wrap
                             items-center
                             gap-2"
                          >
                            <span
                              class="rounded-full
                               px-2
                               py-0.5
                               text-[10px]
                               font-medium"
                              [class.bg-green-100]="topic.active"
                              [class.text-green-700]="topic.active"
                              [class.bg-gray-100]="!topic.active"
                              [class.text-gray-600]="!topic.active"
                            >
                              {{ topic.active ? 'Active' : 'Inactive' }}
                            </span>

                            <span
                              class="text-[10px]
                               text-gray-400"
                            >
                              Order {{ topic.sortOrder }}
                            </span>
                          </div>
                        </div>

                        <!-- Question Count -->

                        <div
                          class="shrink-0
                           text-right"
                        >
                          <span
                            class="block
                             text-base
                             font-bold
                             text-[#032D42]"
                          >
                            {{ topic.questionCount }}
                          </span>

                          <span
                            class="text-[10px]
                             text-gray-500"
                          >
                            questions
                          </span>
                        </div>
                      </div>
                    </button>
                  }
                </div>
              }
            </div>
          </aside>
        </div>
      </section>
    </main>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestTopicAdminComponent implements OnInit {
  // =========================================================
  // SERVICES
  // =========================================================

  private readonly courseService = inject(TestCourseService);

  private readonly topicService = inject(TestTopicService);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  // =========================================================
  // STATE
  // =========================================================

  protected readonly courses = signal<TestCourse[]>([]);

  protected readonly topics = signal<TestTopic[]>([]);

  protected readonly loading = signal(true);

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingId = signal<string | null>(null);

  // =========================================================
  // FORM
  // =========================================================

  protected form: {
    courseId: string;
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    questionCount: number;
    active: boolean;
  } = this.emptyForm();

  // =========================================================
  // INITIALIZATION
  // =========================================================

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadCourses(), this.loadTopics()]);
  }

  // =========================================================
  // LOAD COURSES
  // =========================================================

  private async loadCourses(): Promise<void> {
    try {
      const courses = await this.courseService.getActiveCourses();

      this.courses.set(courses);
    } catch (error) {
      console.error('Failed to load Test Center courses:', error);

      this.toast.error('Unable to load courses.');
    }
  }

  // =========================================================
  // LOAD TOPICS
  // =========================================================

  private async loadTopics(): Promise<void> {
    this.loading.set(true);

    try {
      /*
       * Load topics for every active course.
       *
       * Courses remain the source of truth for the
       * available course relationships.
       */
      const courses = this.courses();

      if (courses.length === 0) {
        this.topics.set([]);

        return;
      }

      const topicGroups = await Promise.all(
        courses.map((course) => this.topicService.getAllTopics(course.id)),
      );

      const topics = topicGroups.flat().sort((a, b) => a.sortOrder - b.sortOrder);

      this.topics.set(topics);
    } catch (error) {
      console.error('Failed to load Test Center topics:', error);

      this.toast.error('Unable to load topics.');

      this.topics.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // NEW TOPIC
  // =========================================================

  protected startNewTopic(): void {
    const nextSortOrder = this.getNextSortOrder();

    this.form = this.emptyForm();

    this.form.sortOrder = nextSortOrder;

    this.editingId.set(null);

    this.showForm.set(true);
  }

  // =========================================================
  // EDIT TOPIC
  // =========================================================

  protected editTopic(topic: TestTopic): void {
    this.form = {
      courseId: topic.courseId,

      name: topic.name,

      slug: topic.slug,

      description: topic.description ?? '',

      sortOrder: topic.sortOrder,

      questionCount: topic.questionCount ?? 0,

      active: topic.active,
    };

    this.editingId.set(topic.id);

    this.showForm.set(true);
  }

  // =========================================================
  // NAME / SLUG
  // =========================================================

  protected onNameChange(name: string): void {
    if (this.editingId()) {
      return;
    }

    this.form.slug = this.generateSlug(name);
  }

  private generateSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // =========================================================
  // NEXT SORT ORDER
  // =========================================================

  private getNextSortOrder(): number {
    if (this.topics().length === 0) {
      return 0;
    }

    return (
      Math.max(
        ...this.topics().map((topic) => (Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0)),
      ) + 1
    );
  }

  // =========================================================
  // SAVE
  // =========================================================

  protected async saveTopic(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const courseId = this.form.courseId.trim();

    const name = this.form.name.trim();

    const slug = this.form.slug.trim();

    const description = this.form.description.trim();

    const sortOrder = Number(this.form.sortOrder);

    // -------------------------------------------------------
    // Required validation
    // -------------------------------------------------------

    if (!courseId) {
      this.toast.error('Course is required.');

      return;
    }

    if (!name) {
      this.toast.error('Topic name is required.');

      return;
    }

    if (!slug) {
      this.toast.error('Topic slug is required.');

      return;
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      this.toast.error('Sort order must be 0 or greater.');

      return;
    }

    this.saving.set(true);

    try {
      const editingId = this.editingId();

      if (editingId) {
        await this.topicService.updateTopic(editingId, {
          courseId,

          name,

          slug,

          description,

          sortOrder,

          active: this.form.active,
        });

        this.toast.success('Topic updated successfully.');
      } else {
        await this.topicService.createTopic({
          courseId,

          name,

          slug,

          description,

          sortOrder,

          questionCount: 0,

          active: this.form.active,
        });

        this.toast.success('Topic created successfully.');
      }

      this.cancelForm();

      await this.loadTopics();
    } catch (error) {
      console.error('Failed to save Test Center topic:', error);

      this.toast.error('Unable to save topic.');
    } finally {
      this.saving.set(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  protected async deleteTopic(topic: TestTopic): Promise<void> {
    const confirmed = window.confirm(`Delete the topic "${topic.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.topicService.deleteTopic(topic.id);

      this.toast.success('Topic deleted successfully.');

      await this.loadTopics();
    } catch (error) {
      console.error('Failed to delete Test Center topic:', error);

      this.toast.error('Unable to delete topic.');
    }
  }

  // =========================================================
  // COURSE NAME
  // =========================================================

  protected getCourseName(courseId: string): string {
    return this.courses().find((course) => course.id === courseId)?.name ?? 'Unknown course';
  }

  // =========================================================
  // CANCEL
  // =========================================================

  protected cancelForm(): void {
    this.form = this.emptyForm();

    this.editingId.set(null);

    this.showForm.set(false);
  }

  // =========================================================
  // EMPTY FORM
  // =========================================================

  private emptyForm() {
    return {
      courseId: '',

      name: '',

      slug: '',

      description: '',

      sortOrder: 0,

      questionCount: 0,

      active: true,
    };
  }

  protected async signOut(): Promise<void> {
    try {
      await this.authService.logout();

      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Unable to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    }
  }
}
