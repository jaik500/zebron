import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { HotToastService } from '@ngxpert/hot-toast';

import { TestCourse, TestCourseType } from '../../../features/test-center/models/test-course.model';

import { TestCourseService } from '../../../features/test-center/services/test-course.service';

import { TestProgram } from '../../../features/test-center/models/test-program.model';

import { TestProgramService } from '../../../features/test-center/services/test-program.service';

import { TestTopic } from '../../../features/test-center/models/test-topic.model';

import { TestTopicService } from '../../../features/test-center/services/test-topic.service';

import { PartnerOrganizationContextService } from '../../../core/services/partner-organization-context.service';

import { PartnerAccessService } from '../../../core/services/partner-access.service';

import { PageTitleService } from '../../../core/services/page-title.service';

import { TestQuestionService } from '../../../features/test-center/services/test-question.service';

// ============================================================
// FORM MODELS
// ============================================================

interface CourseForm {
  name: string;
  slug: string;
  description: string;
  provider: string;
  type: TestCourseType;
  certificationCode: string;
  programId: string;
  active: boolean;
}

interface TopicForm {
  courseId: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  questionCount: number;
  active: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-partner-test-center',
  standalone: true,
  imports: [FormsModule, RouterModule, MatButtonModule, MatIconModule, MatMenuModule, MatDivider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- ====================================================== -->
      <!-- HEADER -->
      <!-- ====================================================== -->

      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-sm text-white/60">
                <a routerLink="/partner" class="hover:text-white"> Partner Portal </a>

                <span>></span>

                <span class="text-white/90"> Test Center </span>
              </div>

              <p class="max-w-2xl text-sm text-white/70">
                Create and manage custom training and certification courses for your organization.
              </p>
            </div>

            <!-- ================================================= -->
            <!-- DESKTOP ACTIONS -->
            <!-- ================================================= -->

            @if (context.canManageCourses()) {
              <div class="hidden flex-wrap items-center justify-end gap-2 sm:flex">
                <button
                  type="button"
                  (click)="createProgram()"
                  [disabled]="saving()"
                  class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm transition hover:bg-[#E8F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <mat-icon>account_tree</mat-icon>
                  Create Program
                </button>

                <button
                  type="button"
                  (click)="createTopic()"
                  [disabled]="saving() || courses().length === 0"
                  class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm transition hover:bg-[#E8F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <mat-icon>topic</mat-icon>
                  Create Topic
                </button>

                <button
                  type="button"
                  (click)="startNewCourse()"
                  [disabled]="saving()"
                  class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <mat-icon>add</mat-icon>
                  Create Course
                </button>
              </div>
            }

            <!-- ================================================= -->
            <!-- MOBILE MENU -->
            <!-- ================================================= -->

            <button
              type="button"
              mat-icon-button
              [matMenuTriggerFor]="menu"
              aria-label="Partner portal menu"
              class="!text-white sm:hidden"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #menu="matMenu">
              <a mat-menu-item routerLink="/partner">
                <mat-icon>dashboard</mat-icon>
                <span>Partner Portal</span>
              </a>

              <a
                mat-menu-item
                [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
              >
                <mat-icon>quiz</mat-icon>
                <span>Test Center</span>
              </a>

              @if (context.canManageCourses()) {
                <mat-divider></mat-divider>

                <button type="button" mat-menu-item (click)="createProgram()" [disabled]="saving()">
                  <mat-icon>account_tree</mat-icon>
                  <span>Create Program</span>
                </button>

                <button
                  type="button"
                  mat-menu-item
                  (click)="createTopic()"
                  [disabled]="saving() || courses().length === 0"
                >
                  <mat-icon>topic</mat-icon>
                  <span>Create Topic</span>
                </button>

                <button
                  type="button"
                  mat-menu-item
                  (click)="startNewCourse()"
                  [disabled]="saving()"
                >
                  <mat-icon>add</mat-icon>
                  <span>Create Course</span>
                </button>
              }

              <mat-divider></mat-divider>

              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </a>
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- ======================================================== -->
      <!-- MAIN -->
      <!-- ======================================================== -->

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- ====================================================== -->
        <!-- CONTEXT LOADING -->
        <!-- ====================================================== -->

        @if (context.loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <mat-icon class="!h-8 !w-8 !text-3xl text-gray-500"> sync </mat-icon>

            <p class="mt-3 text-sm text-gray-600">Loading your partner organization...</p>
          </section>
        }

        <!-- ====================================================== -->
        <!-- CONTEXT ERROR -->
        <!-- ====================================================== -->

        @else if (context.error()) {
          <section class="rounded-xl border border-red-200 bg-red-50 p-6">
            <div class="flex gap-3">
              <mat-icon class="text-red-600"> error_outline </mat-icon>

              <div>
                <h2 class="font-semibold text-red-900">Partner access unavailable</h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ context.error() }}
                </p>

                <button
                  type="button"
                  (click)="initialize()"
                  class="mt-4 rounded-lg bg-[#032D42] px-4 py-2 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        }

        <!-- ====================================================== -->
        <!-- CONTENT -->
        <!-- ====================================================== -->

        @else {
          <!-- ==================================================== -->
          <!-- COURSE FORM -->
          <!-- ==================================================== -->

          @if (showForm()) {
            <section class="mb-8 rounded-xl border border-gray-200 bg-white p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingCourseId() ? 'Edit course' : 'New custom course' }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingCourseId() ? form.name : 'Create your course' }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    This course belongs exclusively to
                    {{ organizationName() }}.
                  </p>
                </div>

                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close course form"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <!-- ================================================= -->
              <!-- COURSE FORM -->
              <!-- ================================================= -->

              <div class="mt-6 grid gap-5 md:grid-cols-2">
                <!-- COURSE NAME -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Course name </span>

                  <input
                    [(ngModel)]="form.name"
                    (ngModelChange)="onNameChange()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="e.g. ServiceNow CSA Preparation"
                  />
                </label>

                <!-- PROGRAM -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Program </span>

                  <select
                    [(ngModel)]="form.programId"
                    class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="">Select a program</option>

                    @for (program of programs(); track program.id) {
                      <option [value]="program.id">
                        {{ program.name }}
                      </option>
                    }
                  </select>

                  @if (loadingPrograms()) {
                    <p class="mt-1 text-xs text-gray-500">Loading programs...</p>
                  } @else if (programs().length === 0) {
                    <p class="mt-1 text-xs text-amber-600">
                      Your organization does not have an active program yet. Create a program before
                      creating a course.
                    </p>
                  }
                </label>

                <!-- SLUG -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Slug </span>

                  <input
                    [(ngModel)]="form.slug"
                    [disabled]="!!editingCourseId()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 disabled:bg-gray-100"
                    placeholder="servicenow-csa-preparation"
                  />

                  @if (editingCourseId()) {
                    <p class="mt-1 text-xs text-gray-500">
                      Slugs cannot be changed after the course is created.
                    </p>
                  }
                </label>

                <!-- PROVIDER -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Provider </span>

                  <input
                    [(ngModel)]="form.provider"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="Your organization"
                  />
                </label>

                <!-- TYPE -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Course type </span>

                  <select
                    [(ngModel)]="form.type"
                    class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="certification">Certification</option>

                    <option value="course">Course</option>

                    <option value="subject">Subject</option>

                    <option value="skill">Skill</option>
                  </select>
                </label>

                <!-- CERTIFICATION CODE -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Certification code </span>

                  <input
                    [(ngModel)]="form.certificationCode"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="Optional"
                  />
                </label>

                <!-- DESCRIPTION -->

                <label class="block md:col-span-2">
                  <span class="text-sm font-medium text-gray-700"> Description </span>

                  <textarea
                    [(ngModel)]="form.description"
                    rows="4"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="Describe what learners will learn."
                  ></textarea>
                </label>

                <!-- ACTIVE -->

                <label class="flex items-center gap-3 self-end">
                  <input
                    type="checkbox"
                    [(ngModel)]="form.active"
                    class="h-4 w-4 rounded border-gray-300"
                  />

                  <span class="text-sm font-medium text-gray-700"> Course is active </span>
                </label>
              </div>

              <!-- ================================================= -->
              <!-- COURSE ACTIONS -->
              <!-- ================================================= -->

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  (click)="saveCourse()"
                  [disabled]="saving()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{ editingCourseId() ? 'Save Changes' : 'Create Course' }}
                  }
                </button>
              </div>
            </section>
          }

          <!-- ==================================================== -->
          <!-- TOPIC FORM -->
          <!-- ==================================================== -->

          @if (showTopicForm()) {
            <section
              id="topic-form"
              class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingTopicId() ? 'Edit topic' : 'New topic' }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingTopicId() ? topicForm.name : 'Create topic' }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    Topics organize the learning content within a Test Center course.
                  </p>
                </div>

                <button
                  type="button"
                  (click)="cancelTopicForm()"
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close topic form"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="mt-6 grid gap-5 md:grid-cols-2">
                <!-- COURSE -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Course </span>

                  <select
                    [(ngModel)]="topicForm.courseId"
                    (ngModelChange)="onTopicCourseChange()"
                    [disabled]="!!editingTopicId()"
                    class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 disabled:bg-gray-100"
                  >
                    <option value="">Select a course</option>

                    @for (course of activeCourses(); track course.id) {
                      <option [value]="course.id">
                        {{ course.name }}
                      </option>
                    }
                  </select>

                  @if (editingTopicId()) {
                    <p class="mt-1 text-xs text-gray-500">
                      A topic's parent course cannot be changed here.
                    </p>
                  }
                </label>

                <!-- NAME -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Topic name </span>

                  <input
                    [(ngModel)]="topicForm.name"
                    (ngModelChange)="onTopicNameChange()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="e.g. Platform Overview"
                  />
                </label>

                <!-- SLUG -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Slug </span>

                  <input
                    [(ngModel)]="topicForm.slug"
                    [disabled]="!!editingTopicId()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 disabled:bg-gray-100"
                    placeholder="platform-overview"
                  />

                  @if (editingTopicId()) {
                    <p class="mt-1 text-xs text-gray-500">
                      Slugs cannot be changed after the topic is created.
                    </p>
                  }
                </label>

                <!-- SORT ORDER -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Sort order </span>

                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="topicForm.sortOrder"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />

                  <p class="mt-1 text-xs text-gray-500">Lower numbers appear first.</p>
                </label>

                <!-- DESCRIPTION -->

                <label class="block md:col-span-2">
                  <span class="text-sm font-medium text-gray-700"> Description </span>

                  <textarea
                    [(ngModel)]="topicForm.description"
                    rows="4"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="Describe the content covered by this topic."
                  ></textarea>
                </label>

                <!-- ACTIVE -->

                <label class="flex items-center gap-3 self-end">
                  <input
                    type="checkbox"
                    [(ngModel)]="topicForm.active"
                    class="h-4 w-4 rounded border-gray-300"
                  />

                  <span class="text-sm font-medium text-gray-700"> Topic is active </span>
                </label>
              </div>

              <!-- TOPIC ACTIONS -->

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelTopicForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  (click)="saveTopic()"
                  [disabled]="savingTopic()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (savingTopic()) {
                    Saving...
                  } @else {
                    {{ editingTopicId() ? 'Save Changes' : 'Create Topic' }}
                  }
                </button>
              </div>
            </section>
          }

          <!-- ==================================================== -->
          <!-- PROGRAM FILTER -->
          <!-- ==================================================== -->

          <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="font-semibold text-gray-900">Test Center</h2>

                <p class="text-sm text-gray-500">
                  Manage your organization's programs, courses, and topics.
                </p>
              </div>

              <label class="block min-w-[220px]">
                <span class="sr-only"> Filter courses by program </span>

                <select
                  [ngModel]="selectedProgramId()"
                  (ngModelChange)="selectedProgramId.set($event)"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All Programs</option>

                  @for (program of programs(); track program.id) {
                    <option [value]="program.id">
                      {{ program.name }}
                    </option>
                  }
                </select>
              </label>
            </div>
          </section>

          <!-- ==================================================== -->
          <!-- COURSES -->
          <!-- ==================================================== -->

          <section class="mb-10">
            <div class="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Courses</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ filteredCourses().length }}
                  course{{ filteredCourses().length === 1 ? '' : 's' }}
                  shown.
                </p>
              </div>

              @if (loadingCourses()) {
                <span class="text-sm text-gray-500"> Loading... </span>
              }
            </div>

            @if (!loadingCourses() && filteredCourses().length === 0) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> menu_book </mat-icon>

                <h3 class="mt-3 font-semibold text-gray-900">No custom courses found</h3>

                <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  Create a program first, then create a course and add topics to build the learner
                  experience.
                </p>

                @if (context.canManageCourses()) {
                  <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      (click)="createProgram()"
                      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979]"
                    >
                      <mat-icon>account_tree</mat-icon>
                      Create Program
                    </button>

                    <button
                      type="button"
                      (click)="startNewCourse()"
                      [disabled]="programs().length === 0"
                      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <mat-icon>add</mat-icon>
                      Create Course
                    </button>
                  </div>
                }
              </div>
            } @else if (!loadingCourses()) {
              <div class="grid gap-4 lg:grid-cols-2">
                @for (course of filteredCourses(); track course.id) {
                  <article
                    class="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h3 class="truncate text-lg font-bold text-gray-900">
                            {{ course.name }}
                          </h3>

                          <span
                            class="rounded-full px-2 py-0.5 text-xs font-semibold"
                            [class.bg-green-100]="course.active"
                            [class.text-green-700]="course.active"
                            [class.bg-gray-100]="!course.active"
                            [class.text-gray-600]="!course.active"
                          >
                            {{ course.active ? 'Active' : 'Inactive' }}
                          </span>
                        </div>

                        <p class="mt-2 text-sm text-gray-500">
                          {{ course.description || 'No description.' }}
                        </p>

                        @if (course.programId) {
                          <div class="mt-3">
                            <span
                              class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#007979]"
                            >
                              <mat-icon class="!h-4 !w-4 !text-base"> account_tree </mat-icon>

                              {{ getProgramName(course.programId) }}
                            </span>
                          </div>
                        }
                      </div>

                      @if (context.canManageCourses()) {
                        <button
                          type="button"
                          (click)="editCourse(course)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          aria-label="Edit course"
                        >
                          <mat-icon>edit</mat-icon>
                        </button>
                      }
                    </div>

                    <!-- COURSE DETAILS -->

                    <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div class="rounded-lg bg-gray-50 p-3">
                        <p class="text-xs text-gray-500">Provider</p>

                        <p class="mt-1 font-medium text-gray-900">
                          {{ course.provider || '—' }}
                        </p>
                      </div>

                      <div class="rounded-lg bg-gray-50 p-3">
                        <p class="text-xs text-gray-500">Questions</p>

                        <p class="mt-1 font-medium text-gray-900">
                          {{ course.questionCount }}
                        </p>
                      </div>
                    </div>

                    <!-- COURSE ACTIONS -->

                    <div class="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      <a
                        mat-stroked-button
                        [routerLink]="[
                          '/partner/org',
                          context.organizationId(),
                          'test-center',
                          'questions',
                        ]"
                        [queryParams]="{
                          courseId: course.id,
                        }"
                      >
                        <mat-icon> quiz </mat-icon>

                        Manage Questions
                      </a>

                      <button
                        type="button"
                        mat-stroked-button
                        (click)="createTopicForCourse(course)"
                        [disabled]="!context.canManageCourses() || !course.active"
                      >
                        <mat-icon>topic</mat-icon>
                        Add Topic
                      </button>
                    </div>

                    <!-- COURSE TOPICS -->

                    <div class="mt-4 border-t border-gray-100 pt-4">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-gray-900">Topics</h4>

                        <span class="text-xs text-gray-500">
                          {{ getTopicsForCourse(course.id).length }}
                        </span>
                      </div>

                      @if (getTopicsForCourse(course.id).length === 0) {
                        <p class="mt-2 text-xs text-gray-500">
                          No topics have been created for this course yet.
                        </p>
                      } @else {
                        <div class="mt-3 space-y-2">
                          @for (topic of getTopicsForCourse(course.id); track topic.id) {
                            <div
                              class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="text-xs font-semibold text-gray-400">
                                    {{ topic.sortOrder + 1 }}
                                  </span>

                                  <span class="truncate text-sm font-medium text-gray-900">
                                    {{ topic.name }}
                                  </span>

                                  @if (!topic.active) {
                                    <span
                                      class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                                    >
                                      Inactive
                                    </span>
                                  }
                                </div>

                                <p class="mt-0.5 text-xs text-gray-500">
                                  {{ topic.questionCount }} questions
                                </p>
                              </div>

                              @if (context.canManageCourses()) {
                                <button
                                  type="button"
                                  (click)="editTopic(topic)"
                                  class="rounded-lg p-1.5 text-gray-500 hover:bg-white"
                                  aria-label="Edit topic"
                                >
                                  <mat-icon class="!text-lg"> edit </mat-icon>
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </section>

          <!-- ==================================================== -->
          <!-- TOPIC DIRECTORY -->
          <!-- ==================================================== -->

          <section>
            <div class="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Topics</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ topics().length }}
                  topic{{ topics().length === 1 ? '' : 's' }}
                  across your organization's courses.
                </p>
              </div>

              @if (loadingTopics()) {
                <span class="text-sm text-gray-500"> Loading... </span>
              }
            </div>

            @if (!loadingTopics() && topics().length === 0) {
              <div class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> topic </mat-icon>

                <h3 class="mt-3 font-semibold text-gray-900">No topics yet</h3>

                <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  Create topics inside your courses to organize questions and learning content.
                </p>

                @if (context.canManageCourses() && activeCourses().length > 0) {
                  <button
                    type="button"
                    (click)="createTopic()"
                    class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <mat-icon>topic</mat-icon>
                    Create Topic
                  </button>
                }
              </div>
            } @else if (!loadingTopics()) {
              <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div class="divide-y divide-gray-100">
                  @for (topic of topics(); track topic.id) {
                    <div
                      class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h3 class="font-semibold text-gray-900">
                            {{ topic.name }}
                          </h3>

                          <span
                            class="rounded-full px-2 py-0.5 text-xs font-semibold"
                            [class.bg-green-100]="topic.active"
                            [class.text-green-700]="topic.active"
                            [class.bg-gray-100]="!topic.active"
                            [class.text-gray-600]="!topic.active"
                          >
                            {{ topic.active ? 'Active' : 'Inactive' }}
                          </span>
                        </div>

                        <p class="mt-1 text-sm text-gray-500">
                          {{ getCourseName(topic.courseId) }}
                        </p>

                        @if (topic.description) {
                          <p class="mt-1 text-xs text-gray-400">
                            {{ topic.description }}
                          </p>
                        }
                      </div>

                      <div class="flex items-center gap-4">
                        <div class="text-right">
                          <p class="text-xs text-gray-500">Questions</p>

                          <p class="font-semibold text-gray-900">
                            {{ topic.questionCount }}
                          </p>
                        </div>

                        @if (context.canManageCourses()) {
                          <button
                            type="button"
                            (click)="editTopic(topic)"
                            class="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                            aria-label="Edit topic"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class PartnerTestCenterComponent implements OnInit {
  // ============================================================
  // SERVICES
  // ============================================================

  protected readonly context = inject(PartnerOrganizationContextService);

  private readonly access = inject(PartnerAccessService);

  private readonly courseService = inject(TestCourseService);

  private readonly testProgramService = inject(TestProgramService);

  private readonly topicService = inject(TestTopicService);

  private readonly questionService = inject(TestQuestionService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  private readonly pageTitleService = inject(PageTitleService);

  // ============================================================
  // COURSE STATE
  // ============================================================

  protected readonly courses = signal<TestCourse[]>([]);

  protected readonly loadingCourses = signal(false);

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingCourseId = signal<string | null>(null);

  // ============================================================
  // PROGRAM STATE
  // ============================================================

  protected readonly programs = signal<TestProgram[]>([]);

  protected readonly loadingPrograms = signal(false);

  protected readonly selectedProgramId = signal('all');

  // ============================================================
  // TOPIC STATE
  // ============================================================

  protected readonly topics = signal<TestTopic[]>([]);

  protected readonly loadingTopics = signal(false);

  protected readonly savingTopic = signal(false);

  protected readonly showTopicForm = signal(false);

  protected readonly editingTopicId = signal<string | null>(null);

  // ============================================================
  // COMPUTED STATE
  // ============================================================

  protected readonly organizationName = computed(
    () => this.context.organization()?.name ?? 'Partner',
  );

  protected readonly activeCourses = computed(() =>
    this.courses().filter((course) => course.active === true),
  );

  protected readonly filteredCourses = computed(() => {
    const selectedProgramId = this.selectedProgramId();

    if (selectedProgramId === 'all') {
      return this.courses();
    }

    return this.courses().filter((course) => course.programId === selectedProgramId);
  });

  protected readonly selectedProgramName = computed(() => {
    const selectedId = this.selectedProgramId();

    if (selectedId === 'all') {
      return 'All Programs';
    }

    return this.programs().find((program) => program.id === selectedId)?.name ?? 'All Programs';
  });

  // ============================================================
  // FORMS
  // ============================================================

  protected form: CourseForm = this.createEmptyForm();

  protected topicForm: TopicForm = this.createEmptyTopicForm();

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.initialize();

    this.pageTitleService.setTitle(`${this.organizationName()} Test Center`);
  }

  protected async initialize(): Promise<void> {
    try {
      await this.context.initialize();

      const organizationId = this.context.organizationId();

      if (!organizationId) {
        this.courses.set([]);
        this.programs.set([]);
        this.topics.set([]);

        return;
      }

      /*
       * Courses must finish loading before topics are loaded
       * because topics are resolved through their parent courses.
       */
      await Promise.all([this.loadCourses(), this.loadPrograms(organizationId)]);

      await this.loadTopics();
    } catch {
      /*
       * PartnerOrganizationContextService owns
       * the user-facing context error state.
       */
    }
  }

  // ============================================================
  // LOAD COURSES
  // ============================================================

  private async loadCourses(): Promise<void> {
    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.courses.set([]);
      return;
    }

    try {
      this.loadingCourses.set(true);

      const organizationCourses = await this.courseService.getAllCourses(organizationId);

      const courses = organizationCourses.filter(
        (course) => course.scope === 'organization' && course.organizationId === organizationId,
      );

      const coursesWithCounts = await Promise.all(
        courses.map(async (course) => {
          const questionCount = await this.questionService.getQuestionCountForCourse(
            organizationId,
            course.id,
          );

          return {
            ...course,
            questionCount,
          };
        }),
      );

      this.courses.set(coursesWithCounts);
    } catch (error) {
      this.courses.set([]);

      const message =
        error instanceof Error ? error.message : 'We could not load your organization courses.';

      this.toast.error(message);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  // ============================================================
  // LOAD PROGRAMS
  // ============================================================

  private async loadPrograms(organizationId: string): Promise<void> {
    this.loadingPrograms.set(true);

    try {
      const programs = await this.testProgramService.getActiveOrganizationPrograms(organizationId);

      this.programs.set(programs);
    } catch (error) {
      this.programs.set([]);

      const message =
        error instanceof Error ? error.message : 'Unable to load organization programs.';

      this.toast.error(message);
    } finally {
      this.loadingPrograms.set(false);
    }
  }

  // ============================================================
  // LOAD TOPICS
  // ============================================================

  private async loadTopics(): Promise<void> {
    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.topics.set([]);
      return;
    }

    const courses = this.courses();

    if (courses.length === 0) {
      this.topics.set([]);
      return;
    }

    try {
      this.loadingTopics.set(true);

      const topicGroups = await Promise.all(
        courses.map((course) => this.topicService.getAllTopics(organizationId, course.id)),
      );

      const topics = topicGroups.flat().sort((a, b) => a.sortOrder - b.sortOrder);

      const topicsWithCounts = await Promise.all(
        topics.map(async (topic) => {
          const questionCount = await this.questionService.getQuestionCountForTopic(
            organizationId,
            topic.courseId,
            topic.id,
          );

          return {
            ...topic,
            questionCount,
          };
        }),
      );

      this.topics.set(topicsWithCounts);
    } catch (error) {
      this.topics.set([]);

      const message =
        error instanceof Error ? error.message : 'We could not load your organization topics.';

      this.toast.error(message);
    } finally {
      this.loadingTopics.set(false);
    }
  }

  // ============================================================
  // CREATE COURSE
  // ============================================================

  protected startNewCourse(): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to manage organization courses.');

      return;
    }

    if (!this.context.organizationId()) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    if (this.programs().length === 0) {
      this.toast.error('Create an active program before creating a course.');

      return;
    }

    this.editingCourseId.set(null);

    this.form = this.createEmptyForm();

    this.form.programId = this.programs()[0]?.id ?? '';

    this.showForm.set(true);
  }

  // ============================================================
  // CREATE PROGRAM
  // ============================================================

  protected createProgram(): void {
    if (!this.access.canManagePrograms()) {
      this.toast.error('You do not have permission to manage programs.');

      return;
    }

    if (!this.context.organizationId()) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    this.router.navigate(['/partner/org', this.context.organizationId(), 'programs']);
  }

  // ============================================================
  // CREATE TOPIC
  // ============================================================

  protected createTopic(): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to manage Test Center topics.');

      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    const activeCourses = this.activeCourses();

    if (activeCourses.length === 0) {
      this.toast.error('Create an active course before creating a topic.');

      return;
    }

    this.editingTopicId.set(null);

    this.topicForm = this.createEmptyTopicForm();

    const firstCourse = activeCourses[0];

    this.topicForm.courseId = firstCourse.id;

    this.topicForm.sortOrder = this.getNextSortOrder(firstCourse.id);

    this.showTopicForm.set(true);

    setTimeout(() => {
      document.getElementById('topic-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  protected createTopicForCourse(course: TestCourse): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to manage Test Center topics.');

      return;
    }

    if (!course.active) {
      this.toast.error('Topics can only be created for active courses.');

      return;
    }

    this.editingTopicId.set(null);

    this.topicForm = this.createEmptyTopicForm();

    this.topicForm.courseId = course.id;

    this.topicForm.sortOrder = this.getNextSortOrder(course.id);

    this.showTopicForm.set(true);

    setTimeout(() => {
      document.getElementById('topic-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  // ============================================================
  // EDIT COURSE
  // ============================================================

  protected editCourse(course: TestCourse): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to edit organization courses.');

      return;
    }

    this.editingCourseId.set(course.id);

    this.form = {
      name: course.name ?? '',

      slug: course.slug ?? '',

      description: course.description ?? '',

      provider: course.provider ?? '',

      type: course.type ?? 'course',

      certificationCode: course.certificationCode ?? '',

      programId: course.programId ?? '',

      active: course.active === true,
    };

    this.showForm.set(true);
  }

  // ============================================================
  // EDIT TOPIC
  // ============================================================

  protected editTopic(topic: TestTopic): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to edit Test Center topics.');

      return;
    }

    this.topicForm = {
      courseId: topic.courseId,

      name: topic.name ?? '',

      slug: topic.slug ?? '',

      description: topic.description ?? '',

      sortOrder: Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0,

      questionCount: topic.questionCount ?? 0,

      active: topic.active === true,
    };

    this.editingTopicId.set(topic.id);

    this.showTopicForm.set(true);
  }

  // ============================================================
  // COURSE NAME → SLUG
  // ============================================================

  protected onNameChange(): void {
    if (this.editingCourseId()) {
      return;
    }

    this.form.slug = this.slugify(this.form.name);
  }

  // ============================================================
  // TOPIC NAME → SLUG
  // ============================================================

  protected onTopicNameChange(): void {
    if (this.editingTopicId()) {
      return;
    }

    this.topicForm.slug = this.slugify(this.topicForm.name);
  }

  // ============================================================
  // TOPIC COURSE CHANGE
  // ============================================================

  protected onTopicCourseChange(): void {
    if (this.editingTopicId()) {
      return;
    }

    this.topicForm.sortOrder = this.getNextSortOrder(this.topicForm.courseId);
  }

  // ============================================================
  // SAVE COURSE
  // ============================================================

  protected async saveCourse(): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to manage organization courses.');

      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    const validationError = this.validateCourseForm();

    if (validationError) {
      this.toast.error(validationError);

      return;
    }

    try {
      this.saving.set(true);

      const editingId = this.editingCourseId();

      if (editingId) {
        await this.courseService.updateCourse(organizationId, editingId, {
          programId: this.form.programId.trim(),

          name: this.form.name.trim(),

          description: this.form.description.trim(),

          provider: this.form.provider.trim(),

          type: this.form.type,

          certificationCode: this.form.certificationCode.trim(),

          active: this.form.active,
        });

        this.toast.success('Course updated successfully.');
      } else {
        await this.courseService.createCourse(organizationId, {
          name: this.form.name.trim(),

          slug: this.form.slug.trim(),

          description: this.form.description.trim(),

          provider: this.form.provider.trim(),

          type: this.form.type,

          certificationCode: this.form.certificationCode.trim(),

          programId: this.form.programId.trim(),

          active: this.form.active,
        });

        this.toast.success('Custom course created successfully.');
      }

      this.cancelForm();

      await this.loadCourses();

      await this.loadTopics();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the course.';

      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // SAVE TOPIC
  // ============================================================

  protected async saveTopic(): Promise<void> {
    if (this.savingTopic()) {
      return;
    }

    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to manage Test Center topics.');

      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    const courseId = this.topicForm.courseId.trim();

    const name = this.topicForm.name.trim();

    const slug = this.topicForm.slug.trim();

    const description = this.topicForm.description.trim();

    const sortOrder = Number(this.topicForm.sortOrder);

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!courseId) {
      this.toast.error('Course is required.');

      return;
    }

    const selectedCourse = this.courses().find((course) => course.id === courseId);

    if (!selectedCourse) {
      this.toast.error('The selected course does not belong to your organization.');

      return;
    }

    if (!selectedCourse.active) {
      this.toast.error('Topics can only be assigned to active courses.');

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

    if (slug.length < 3) {
      this.toast.error('Topic slug must contain at least 3 characters.');

      return;
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      this.toast.error('Sort order must be 0 or greater.');

      return;
    }

    try {
      this.savingTopic.set(true);

      const editingId = this.editingTopicId();

      if (editingId) {
        await this.topicService.updateTopic(organizationId, editingId, {
          courseId,
          name,
          slug,
          description,
          sortOrder,
          active: this.topicForm.active,
        });

        this.toast.success('Topic updated successfully.');
      } else {
        await this.topicService.createTopic(organizationId, {
          organizationId,
          courseId,
          name,
          slug,
          description,
          sortOrder,
          questionCount: 0,
          active: this.topicForm.active,
        });

        this.toast.success('Topic created successfully.');
      }

      this.cancelTopicForm();

      await this.loadTopics();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the topic.';

      this.toast.error(message);
    } finally {
      this.savingTopic.set(false);
    }
  }

  // ============================================================
  // CANCEL COURSE FORM
  // ============================================================

  protected cancelForm(): void {
    this.showForm.set(false);

    this.editingCourseId.set(null);

    this.form = this.createEmptyForm();
  }

  // ============================================================
  // CANCEL TOPIC FORM
  // ============================================================

  protected cancelTopicForm(): void {
    this.showTopicForm.set(false);

    this.editingTopicId.set(null);

    this.topicForm = this.createEmptyTopicForm();
  }

  // ============================================================
  // VALIDATE COURSE
  // ============================================================

  private validateCourseForm(): string | null {
    if (!this.form.name.trim()) {
      return 'Course name is required.';
    }

    if (!this.form.slug.trim()) {
      return 'Course slug is required.';
    }

    if (this.form.slug.trim().length < 3) {
      return 'Course slug must contain at least 3 characters.';
    }

    if (!this.form.type) {
      return 'Course type is required.';
    }

    if (!this.form.programId.trim()) {
      return 'Program is required.';
    }

    const programExists = this.programs().some(
      (program) => program.id === this.form.programId.trim(),
    );

    if (!programExists) {
      return 'Select a valid program belonging to your organization.';
    }

    return null;
  }

  // ============================================================
  // EMPTY COURSE FORM
  // ============================================================

  private createEmptyForm(): CourseForm {
    return {
      name: '',

      slug: '',

      description: '',

      provider: '',

      type: 'course',

      certificationCode: '',

      programId: '',

      active: true,
    };
  }

  // ============================================================
  // EMPTY TOPIC FORM
  // ============================================================

  private createEmptyTopicForm(): TopicForm {
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

  // ============================================================
  // GET NEXT TOPIC SORT ORDER
  // ============================================================

  private getNextSortOrder(courseId: string): number {
    const courseTopics = this.topics().filter((topic) => topic.courseId === courseId);

    if (courseTopics.length === 0) {
      return 0;
    }

    return (
      Math.max(
        ...courseTopics.map((topic) => (Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0)),
      ) + 1
    );
  }

  // ============================================================
  // GET PROGRAM NAME
  // ============================================================

  protected getProgramName(programId: string | null): string {
    if (!programId) {
      return 'Program';
    }

    return this.programs().find((program) => program.id === programId)?.name ?? 'Program';
  }

  // ============================================================
  // GET COURSE NAME
  // ============================================================

  protected getCourseName(courseId: string): string {
    return this.courses().find((course) => course.id === courseId)?.name ?? 'Unknown course';
  }

  // ============================================================
  // GET TOPICS FOR COURSE
  // ============================================================

  protected getTopicsForCourse(courseId: string): TestTopic[] {
    return this.topics()
      .filter((topic) => topic.courseId === courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ============================================================
  // SLUGIFY
  // ============================================================

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
