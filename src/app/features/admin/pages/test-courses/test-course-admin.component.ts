import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { TestCourse } from '../../../../features/test-center/models/test-course.model';

import { TestCourseService } from '../../../../features/test-center/services/test-course.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../../../core/services/auth.service';

// ============================================================
// FORM MODEL
// ============================================================

interface CourseForm {
  name: string;
  slug: string;
  description: string;
  provider: string;
  type: string;
  certificationCode: string;
  active: boolean;
}

@Component({
  selector: 'app-test-course-admin',

  standalone: true,

  imports: [FormsModule, RouterLink, MatIconModule, MatDividerModule, MatMenuModule],

  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->
    <!-- ============================================================
     PAGE HEADER
     ============================================================ -->

    <header class=" bg-[#032D42] shadow-md">
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

              <span class="text-white/90"> Courses </span>
            </div>

            <!-- Title -->

            <h1
              class="text-2xl
                 font-bold
                 tracking-tight
                 text-white
                 sm:text-3xl"
            >
              Test Center Courses
            </h1>

            <p
              class="mt-1 text-sm
                 text-white/65"
            >
              Create and manage the courses available in the Test Center.
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
              (click)="startNewCourse()"
              [disabled]="saving()"
              class="hidden
                 items-center
                 rounded-lg
                 bg-[#007979]
                 px-4 py-1.5
                 text-sm
                 font-semibold
                 text-white
                 shadow-sm
                 transition
                 hover:bg-teal-400
                 disabled:cursor-not-allowed
                 disabled:opacity-50
                 sm:inline-flex 
                 cursor-pointer"
            >
              <mat-icon class="mr-1"> add </mat-icon>

              Add Course
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

    <div
      class="min-h-screen bg-gray-50
             px-4 py-4
             sm:px-6
             lg:px-8"
    >
      <div class="mx-auto ">
        <!-- =====================================================
             MAIN GRID
             ===================================================== -->

        <div
          class="grid gap-4
                 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <!-- ===================================================
               COURSE FORM
               =================================================== -->

          @if (showForm()) {
            <section
              class="rounded-xl
                     border border-gray-200
                     bg-white
                     shadow-sm"
            >
              <!-- Form Header -->

              <div
                class="border-b
                       border-gray-200
                       px-5 py-4"
              >
                <div
                  class="flex items-center
                         justify-between
                         gap-4"
                >
                  <div>
                    <h2
                      class="text-base
                             font-semibold
                             text-gray-900"
                    >
                      {{ editingCourseId() ? 'Edit Course' : 'Create Course' }}
                    </h2>

                    <p
                      class="mt-1 text-xs
                             text-gray-500"
                    >
                      {{
                        editingCourseId()
                          ? 'Update the course information below.'
                          : 'Add a new course to the Test Center.'
                      }}
                    </p>
                  </div>

                  @if (editingCourseId()) {
                    <div
                      class="flex
           items-center
           gap-2"
                    >
                      <!-- Editing Status -->

                      <span
                        class="rounded-full
             bg-gray-100
             px-2.5 py-1
             text-xs
             font-medium
             text-gray-600"
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
             border-gray-300
             bg-white
             px-3 py-1.5
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
                        (click)="saveCourse()"
                        [disabled]="saving()"
                        class="rounded-lg
             bg-teal-600
             px-3 py-1.5
             text-xs
             font-semibold
             text-white
             shadow-sm
             transition
             hover:bg-teal-700
             disabled:cursor-not-allowed
             disabled:opacity-50"
                      >
                        @if (saving()) {
                          Saving...
                        } @else {
                          Update
                        }
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Form -->

              <div class="p-5">
                <div class="space-y-5">
                  <!-- =================================================
                       COURSE NAME / SLUG
                       ================================================= -->

                  <div
                    class="grid gap-4
                           md:grid-cols-2"
                  >
                    <!-- Course Name -->

                    <div>
                      <label
                        for="courseName"
                        class="mb-1.5 block
                               text-sm
                               font-medium
                               text-gray-700"
                      >
                        Course Name
                        <span class="text-red-500">*</span>
                      </label>

                      <input
                        id="courseName"
                        name="courseName"
                        type="text"
                        [(ngModel)]="form.name"
                        (ngModelChange)="onNameChange()"
                        placeholder="e.g. Cybersecurity Fundamentals"
                        autocomplete="off"
                        class="w-full
                               rounded-lg
                               border border-gray-300
                               bg-white
                               px-3 py-2.5
                               text-sm
                               text-gray-900
                               outline-none
                               transition
                               focus:border-teal-500
                               focus:ring-2
                               focus:ring-teal-100"
                      />
                    </div>

                    <!-- Slug -->

                    <div>
                      <label
                        for="courseSlug"
                        class="mb-1.5 block
                               text-sm
                               font-medium
                               text-gray-700"
                      >
                        URL Slug
                        <span class="text-red-500">*</span>
                      </label>

                      <input
                        id="courseSlug"
                        name="courseSlug"
                        type="text"
                        [(ngModel)]="form.slug"
                        [readonly]="!!editingCourseId()"
                        placeholder="cybersecurity-fundamentals"
                        autocomplete="off"
                        class="w-full
                               rounded-lg
                               border border-gray-300
                               bg-white
                               px-3 py-2.5
                               text-sm
                               text-gray-900
                               outline-none
                               transition
                               focus:border-teal-500
                               focus:ring-2
                               focus:ring-teal-100
                               read-only:bg-gray-100
                               read-only:text-gray-500"
                      />

                      <p
                        class="mt-1 text-xs
                               text-gray-500"
                      >
                        {{
                          editingCourseId()
                            ? 'The slug cannot be changed after creation.'
                            : 'Used in the course URL and as the course ID.'
                        }}
                      </p>
                    </div>
                  </div>

                  <!-- =================================================
                       TYPE / PROVIDER
                       ================================================= -->

                  <div
                    class="grid gap-4
                           md:grid-cols-2"
                  >
                    <!-- Type -->

                    <div>
                      <label
                        for="courseType"
                        class="mb-1.5 block
                               text-sm
                               font-medium
                               text-gray-700"
                      >
                        Course Type
                        <span class="text-red-500">*</span>
                      </label>

                      <select
                        id="courseType"
                        name="courseType"
                        [(ngModel)]="form.type"
                        class="w-full
                               rounded-lg
                               border border-gray-300
                               bg-white
                               px-3 py-2.5
                               text-sm
                               text-gray-900
                               outline-none
                               transition
                               focus:border-teal-500
                               focus:ring-2
                               focus:ring-teal-100"
                      >
                        <option value="">Select type</option>

                        <option value="certification">Certification</option>

                        <option value="assessment">Assessment</option>

                        <option value="practice">Practice</option>

                        <option value="training">Training</option>

                        <option value="other">Other</option>
                      </select>
                    </div>

                    <!-- Provider -->

                    <div>
                      <label
                        for="provider"
                        class="mb-1.5 block
                               text-sm
                               font-medium
                               text-gray-700"
                      >
                        Provider
                      </label>

                      <input
                        id="provider"
                        name="provider"
                        type="text"
                        [(ngModel)]="form.provider"
                        placeholder="e.g. Zebron"
                        class="w-full
                               rounded-lg
                               border border-gray-300
                               bg-white
                               px-3 py-2.5
                               text-sm
                               text-gray-900
                               outline-none
                               transition
                               focus:border-teal-500
                               focus:ring-2
                               focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <!-- =================================================
                       CERTIFICATION CODE
                       ================================================= -->

                  <div>
                    <label
                      for="certificationCode"
                      class="mb-1.5 block
                             text-sm
                             font-medium
                             text-gray-700"
                    >
                      Certification Code
                    </label>

                    <input
                      id="certificationCode"
                      name="certificationCode"
                      type="text"
                      [(ngModel)]="form.certificationCode"
                      placeholder="e.g. cybersecurity"
                      class="w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3 py-2.5
                             text-sm
                             text-gray-900
                             outline-none
                             transition
                             focus:border-teal-500
                             focus:ring-2
                             focus:ring-teal-100"
                    />

                    <p
                      class="mt-1 text-xs
                             text-gray-500"
                    >
                      Optional code used to identify the certification or exam.
                    </p>
                  </div>

                  <!-- =================================================
                       DESCRIPTION
                       ================================================= -->

                  <div>
                    <label
                      for="description"
                      class="mb-1.5 block
                             text-sm
                             font-medium
                             text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      [(ngModel)]="form.description"
                      rows="4"
                      placeholder="Describe what this course covers..."
                      class="w-full
                             resize-y
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3 py-2.5
                             text-sm
                             text-gray-900
                             outline-none
                             transition
                             focus:border-teal-500
                             focus:ring-2
                             focus:ring-teal-100"
                    ></textarea>
                  </div>

                  <!-- =================================================
                       ACTIVE STATUS
                       ================================================= -->

                  <div
                    class="rounded-lg
                           border
                           border-gray-200
                           bg-gray-50
                           p-4"
                  >
                    <label
                      class="flex cursor-pointer
                             items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        name="active"
                        [(ngModel)]="form.active"
                        class="mt-0.5
                               h-4 w-4
                               rounded
                               border-gray-300
                               text-teal-600
                               focus:ring-teal-500"
                      />

                      <span>
                        <span
                          class="block text-sm
                                 font-medium
                                 text-gray-800"
                        >
                          Active course
                        </span>

                        <span
                          class="mt-0.5 block
                                 text-xs
                                 text-gray-500"
                        >
                          Active courses are available to Test Center users.
                        </span>
                      </span>
                    </label>
                  </div>

                  <!-- =================================================
                       QUESTION COUNT
                       ================================================= -->

                  @if (editingCourseId()) {
                    <div
                      class="flex items-center
                             justify-between
                             rounded-lg
                             border
                             border-gray-200
                             bg-white
                             px-4 py-3"
                    >
                      <div>
                        <p
                          class="text-sm
                                 font-medium
                                 text-gray-700"
                        >
                          Questions
                        </p>

                        <p
                          class="text-xs
                                 text-gray-500"
                        >
                          Maintained automatically from the question bank.
                        </p>
                      </div>

                      <span
                        class="text-lg
                               font-bold
                               text-[#032D42]"
                      >
                        {{ editingCourseQuestionCount() }}
                      </span>
                    </div>
                  }

                  <!-- =================================================
                       ACTIONS
                       ================================================= -->

                  <div
                    class="flex flex-col-reverse
                           gap-3
                           border-t
                           border-gray-200
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
                             border-gray-300
                             px-5 py-2.5
                             text-sm
                             font-semibold
                             text-gray-700
                             transition
                             hover:bg-gray-50
                             disabled:cursor-not-allowed
                             disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      (click)="saveCourse()"
                      [disabled]="saving()"
                      class="rounded-lg
                             bg-teal-600
                             px-5 py-2.5
                             text-sm
                             font-semibold
                             text-white
                             transition
                             hover:bg-teal-700
                             disabled:cursor-not-allowed
                             disabled:opacity-50"
                    >
                      @if (saving()) {
                        Saving...
                      } @else {
                        {{ editingCourseId() ? 'Update Course' : 'Create Course' }}
                      }
                    </button>
                  </div>
                </div>
              </div>
            </section>
          } @else {
            <!-- ===================================================
                 EMPTY FORM STATE
                 =================================================== -->

            <section
              class="flex min-h-[420px]
                     items-center
                     justify-center
                     rounded-xl
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
                  class="mx-auto mb-4
                         flex h-14 w-14
                         items-center
                         justify-center
                         rounded-xl
                         bg-[#032D42]"
                >
                  <svg
                    class="h-7 w-7 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v13a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 18.5v-13z"
                    />

                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M8 11h8M8 15h5" />
                  </svg>
                </div>

                <h2
                  class="text-lg
                         font-semibold
                         text-gray-900"
                >
                  Course Management
                </h2>

                <p
                  class="mt-2 text-sm
                         leading-6
                         text-gray-500"
                >
                  Select an existing course to edit it, or create a new Test Center course.
                </p>

                <button
                  type="button"
                  (click)="startNewCourse()"
                  class="mt-5
                         rounded-lg
                         bg-teal-600
                         px-4 py-2.5
                         text-sm
                         font-semibold
                         text-white
                         transition
                         hover:bg-teal-700"
                >
                  + Create Course
                </button>
              </div>
            </section>
          }

          <!-- =====================================================
               COURSE DIRECTORY
               ===================================================== -->

          <section
            class="h-fit
                   overflow-hidden
                   rounded-xl
                   border
                   border-gray-200
                   bg-white
                   shadow-sm"
          >
            <!-- Directory Header -->

            <div
              class="border-b
                     border-gray-200
                     px-5 py-4"
            >
              <div
                class="flex items-center
                       justify-between"
              >
                <div>
                  <h2
                    class="text-base
                           font-semibold
                           text-gray-900"
                  >
                    Courses
                  </h2>

                  <p
                    class="mt-1 text-xs
                           text-gray-500"
                  >
                    {{ courses().length }}
                    {{ courses().length === 1 ? 'course' : 'courses' }}
                  </p>
                </div>

                @if (loadingCourses()) {
                  <span
                    class="text-xs
                           text-gray-500"
                  >
                    Loading...
                  </span>
                }
              </div>
            </div>

            <!-- Course List -->

            <div class="max-h-[650px] overflow-y-auto">
              @if (loadingCourses()) {
                <div
                  class="px-5 py-10
                         text-center
                         text-sm
                         text-gray-500"
                >
                  Loading courses...
                </div>
              } @else if (courses().length === 0) {
                <div
                  class="px-5 py-10
                         text-center"
                >
                  <p
                    class="text-sm
                           font-medium
                           text-gray-700"
                  >
                    No courses yet
                  </p>

                  <p
                    class="mt-1 text-xs
                           text-gray-500"
                  >
                    Create your first Test Center course.
                  </p>
                </div>
              } @else {
                <div
                  class="divide-y
                         divide-gray-100"
                >
                  @for (course of courses(); track course.id) {
                    <button
                      type="button"
                      (click)="editCourse(course)"
                      class="w-full
                             px-5 py-4
                             text-left
                             transition
                             hover:bg-gray-50"
                    >
                      <div
                        class="flex items-start
                               justify-between
                               gap-3"
                      >
                        <div
                          class="min-w-0
                                 flex-1"
                        >
                          <h3
                            class="truncate
                                   text-sm
                                   font-semibold
                                   text-gray-900"
                          >
                            {{ course.name }}
                          </h3>

                          <p
                            class="mt-1 truncate
                                   text-xs
                                   text-gray-500"
                          >
                            {{ course.slug }}
                          </p>

                          <div
                            class="mt-2
                                   flex flex-wrap
                                   items-center
                                   gap-2"
                          >
                            <span
                              class="rounded-full
                                     bg-gray-100
                                     px-2 py-0.5
                                     text-[11px]
                                     font-medium
                                     text-gray-600"
                            >
                              {{ course.type }}
                            </span>

                            <span
                              class="rounded-full
                                     px-2 py-0.5
                                     text-[11px]
                                     font-medium"
                              [class.bg-green-50]="course.active"
                              [class.text-green-700]="course.active"
                              [class.bg-gray-100]="!course.active"
                              [class.text-gray-500]="!course.active"
                            >
                              {{ course.active ? 'Active' : 'Inactive' }}
                            </span>
                          </div>
                        </div>

                        <div
                          class="shrink-0
                                 text-right"
                        >
                          <span
                            class="block text-sm
                                   font-bold
                                   text-[#032D42]"
                          >
                            {{ course.questionCount }}
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
          </section>
        </div>
      </div>
    </div>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCourseAdminComponent implements OnInit {
  // ============================================================
  // SERVICES
  // ============================================================

  private readonly courseService = inject(TestCourseService);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  // ============================================================
  // DATA
  // ============================================================

  protected readonly courses = signal<TestCourse[]>([]);

  // ============================================================
  // UI STATE
  // ============================================================

  protected readonly loadingCourses = signal(false);

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingCourseId = signal<string | null>(null);

  // ============================================================
  // FORM
  // ============================================================

  protected form: CourseForm = this.createEmptyForm();

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
  }

  // ============================================================
  // LOAD COURSES
  // ============================================================

  private async loadCourses(): Promise<void> {
    try {
      this.loadingCourses.set(true);

      const courses = await this.courseService.getAllCourses();

      this.courses.set(courses);
    } catch (error) {
      console.error('Failed to load Test Center courses:', error);

      this.toast.error('We could not load the Test Center courses.');
    } finally {
      this.loadingCourses.set(false);
    }
  }

  // ============================================================
  // CREATE FORM
  // ============================================================

  protected startNewCourse(): void {
    this.editingCourseId.set(null);

    this.form = this.createEmptyForm();

    this.showForm.set(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // EDIT COURSE
  // ============================================================

  protected editCourse(course: TestCourse): void {
    this.editingCourseId.set(course.id);

    this.form = {
      name: course.name ?? '',

      slug: course.slug ?? '',

      description: course.description ?? '',

      provider: course.provider ?? '',

      type: course.type ?? '',

      certificationCode: course.certificationCode ?? '',

      active: course.active ?? true,
    };

    this.showForm.set(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // NAME → SLUG
  // ============================================================

  /**
   * Automatically creates a URL-friendly slug
   * while creating a new course.
   *
   * Slugs are not changed after the course
   * has been created.
   */
  protected onNameChange(): void {
    if (this.editingCourseId()) {
      return;
    }

    this.form.slug = this.slugify(this.form.name);
  }

  // ============================================================
  // SAVE
  // ============================================================

  protected async saveCourse(): Promise<void> {
    const validationError = this.validateForm();

    if (validationError) {
      this.toast.error(validationError);

      return;
    }

    try {
      this.saving.set(true);

      const editingId = this.editingCourseId();

      if (editingId) {
        // -------------------------------------------------------
        // UPDATE
        // -------------------------------------------------------

        await this.courseService.updateCourse(editingId, {
          name: this.form.name,

          description: this.form.description,

          provider: this.form.provider,

          type: this.form.type,

          certificationCode: this.form.certificationCode,

          active: this.form.active,
        });

        this.toast.success('Course updated successfully.');
      } else {
        // -------------------------------------------------------
        // CREATE
        // -------------------------------------------------------

        await this.courseService.createCourse({
          name: this.form.name,

          slug: this.form.slug,

          description: this.form.description,

          provider: this.form.provider,

          type: this.form.type,

          certificationCode: this.form.certificationCode,

          active: this.form.active,
        });

        this.toast.success('Course created successfully.');
      }

      // Refresh directory.

      await this.loadCourses();

      // Close form.

      this.cancelForm();
    } catch (error) {
      console.error('Failed to save Test Center course:', error);

      const message =
        error instanceof Error ? error.message : 'We could not save the course. Please try again.';

      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  private validateForm(): string | null {
    if (!this.form.name.trim()) {
      return 'Course name is required.';
    }

    if (!this.form.slug.trim()) {
      return 'Course slug is required.';
    }

    if (!this.form.type.trim()) {
      return 'Course type is required.';
    }

    if (this.form.slug.trim().length < 3) {
      return 'Course slug must contain at least 3 characters.';
    }

    return null;
  }

  // ============================================================
  // CANCEL
  // ============================================================

  protected cancelForm(): void {
    this.showForm.set(false);

    this.editingCourseId.set(null);

    this.form = this.createEmptyForm();
  }

  // ============================================================
  // CURRENT QUESTION COUNT
  // ============================================================

  protected editingCourseQuestionCount(): number {
    const courseId = this.editingCourseId();

    if (!courseId) {
      return 0;
    }

    const course = this.courses().find((item) => item.id === courseId);

    return course?.questionCount ?? 0;
  }

  // ============================================================
  // FORM FACTORY
  // ============================================================

  private createEmptyForm(): CourseForm {
    return {
      name: '',

      slug: '',

      description: '',

      provider: 'Zebron',

      type: 'certification',

      certificationCode: '',

      active: true,
    };
  }

  // ============================================================
  // SLUG GENERATOR
  // ============================================================

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
