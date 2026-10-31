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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { MatDialog } from '@angular/material/dialog';

import { HotToastService } from '@ngxpert/hot-toast';

import {
  TestCenterImportDialogComponent,
  TestCenterImportDialogData,
  TestCenterImportDialogResult,
} from './test-center-import-dialog.component';

import { Quiz, QuizType } from '../../../features/test-center/models/quiz.model';

import { QuizService } from '../../../features/test-center/services/quiz.service';

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
  type: QuizType;
  certificationCode: string;
  programId: string;
  active: boolean;
}

interface TopicForm {
  quizId: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  questionCount: number;
  active: boolean;
}

// ============================================================
// COURSE TYPE PRESENTATION
// ============================================================

const COURSE_TYPE_META: Record<string, { label: string; icon: string }> = {
  certification: { label: 'Certification', icon: 'workspace_premium' },
  course: { label: 'Course', icon: 'menu_book' },
  subject: { label: 'Subject', icon: 'category' },
  skill: { label: 'Skill', icon: 'build' },
};

// ============================================================
// COMPONENT
// ============================================================

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-partner-test-center',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatDivider,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- ====================================================== -->
      <!-- HEADER -->
      <!-- ====================================================== -->

      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
       <div class="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
  <div class="flex items-center justify-between gap-4">
    <!-- HEADER TITLE AND BREADCRUMBS -->
    <div class="min-w-0 flex-1  sm:text-left">
      <div
        class="flex translate-y-1 items-center  gap-2 text-sm text-white/60 sm:translate-y-0 sm:justify-start"
      >
        <a routerLink="/partner" class="hover:text-white">
          {{ 'Partner Portal' | t }}
        </a>

        <span>&gt;</span>

        <span class="text-white/90">{{ 'Test Center' | t }}</span>
      </div>

      <p class="mt-1 hidden max-w-2xl text-sm text-white/70 sm:block">
        {{ 'Create and manage custom training and certification courses for your organization.' | t }}
      </p>
    </div>

    <!-- DESKTOP ACTIONS -->
    @if (context.canManageCourses()) {
      <div class="hidden flex-wrap items-center justify-end gap-2 sm:flex">
        <button
          type="button"
          (click)="openImport()"
          [disabled]="saving()"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/60 bg-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <mat-icon>upload_file</mat-icon>
          {{ 'Import' | t }}
        </button>

        <button
          type="button"
          (click)="createProgram()"
          [disabled]="saving()"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm transition hover:bg-[#E8F5F5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <mat-icon>account_tree</mat-icon>
          {{ 'Create Program' | t }}
        </button>

        <button
          type="button"
          (click)="createTopic()"
          [disabled]="saving() || courses().length === 0"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm transition hover:bg-[#E8F5F5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <mat-icon>topic</mat-icon>
          {{ 'Create Topic' | t }}
        </button>

        <button
          type="button"
          (click)="startNewCourse()"
          [disabled]="saving()"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <mat-icon>add</mat-icon>
          {{ 'Create Course' | t }}
        </button>
      </div>
    }

    <!-- MOBILE MENU -->
    <button
      type="button"
      mat-icon-button
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'Partner portal menu' | t"
      class="!text-white sm:hidden"
    >
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      <a mat-menu-item routerLink="/partner">
        <mat-icon>dashboard</mat-icon>
        <span>{{ 'Partner Portal' | t }}</span>
      </a>

      <a
        mat-menu-item
        [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
      >
        <mat-icon>quiz</mat-icon>
        <span>{{ 'Test Center' | t }}</span>
      </a>

      @if (context.canManageCourses()) {
        <mat-divider></mat-divider>

        <button
          type="button"
          mat-menu-item
          (click)="createProgram()"
          [disabled]="saving()"
        >
          <mat-icon>account_tree</mat-icon>
          <span>{{ 'Create Program' | t }}</span>
        </button>

        <button
          type="button"
          mat-menu-item
          (click)="createTopic()"
          [disabled]="saving() || courses().length === 0"
        >
          <mat-icon>topic</mat-icon>
          <span>{{ 'Create Topic' | t }}</span>
        </button>

        <button
          type="button"
          mat-menu-item
          (click)="startNewCourse()"
          [disabled]="saving()"
        >
          <mat-icon>add</mat-icon>
          <span>{{ 'Create Course' | t }}</span>
        </button>

        <button
          type="button"
          mat-menu-item
          (click)="openImport()"
          [disabled]="saving()"
        >
          <mat-icon>upload_file</mat-icon>
          <span>{{ 'Import Questions' | t }}</span>
        </button>
      }

      <mat-divider></mat-divider>

      <a mat-menu-item routerLink="/profile">
        <mat-icon>person</mat-icon>
        <span>{{ 'Profile' | t }}</span>
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

            <p class="mt-3 text-sm text-gray-600">{{ 'Loading your partner organization...' | t }}</p>
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
                <h2 class="font-semibold text-red-900">{{ 'Partner access unavailable' | t }}</h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ context.error() | t }}
                </p>

                <button
                  type="button"
                  (click)="initialize()"
                  class="mt-4 rounded-lg bg-[#032D42] px-4 py-2 text-sm font-semibold text-white"
                >
                  {{ 'Try again' | t }}
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
              <div
                class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4"
              >
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingQuizId() ? ('Edit course' | t) : ('New custom course' | t) }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingQuizId() ? form.name : ('Create your course' | t) }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'This course belongs exclusively to {0}.' | t: [organizationName()] }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-100/70 hover:text-gray-700"
                  [attr.aria-label]="'Close course form' | t"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <!-- ================================================= -->
              <!-- COURSE FORM -->
              <!-- ================================================= -->

              <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2">
                <!-- COURSE NAME -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Course name' | t }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="form.name"
                    (ngModelChange)="onNameChange()"
                    [placeholder]="'e.g. ServiceNow CSA Preparation' | t"
                  />
                </mat-form-field>

                <!-- PROGRAM -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Program' | t }}</mat-label>
                  <mat-select [(ngModel)]="form.programId">
                    <mat-option value="">{{ 'Select a program' | t }}</mat-option>
                    @for (program of programs(); track program.id) {
                      <mat-option [value]="program.id">{{ program.name }}</mat-option>
                    }
                  </mat-select>
                  @if (loadingPrograms()) {
                    <mat-hint>{{ 'Loading programs...' | t }}</mat-hint>
                  } @else if (programs().length === 0) {
                    <mat-hint class="!text-amber-700">
                      {{ 'Your organization does not have an active program yet. Create a program before creating a course.' | t }}
                    </mat-hint>
                  }
                </mat-form-field>

                <!-- SLUG -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Slug' | t }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="form.slug"
                    [disabled]="!!editingQuizId()"
                    [placeholder]="'servicenow-csa-preparation' | t"
                  />
                  @if (editingQuizId()) {
                    <mat-hint>{{ 'Slugs cannot be changed after the course is created.' | t }}</mat-hint>
                  }
                </mat-form-field>

                <!-- PROVIDER -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Provider' | t }}</mat-label>
                  <input matInput [(ngModel)]="form.provider" [placeholder]="'Your organization' | t" />
                </mat-form-field>

                <!-- TYPE -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Course type' | t }}</mat-label>
                  <mat-select [(ngModel)]="form.type">
                    <mat-option value="certification">{{ 'Certification' | t }}</mat-option>
                    <mat-option value="course">{{ 'Course' | t }}</mat-option>
                    <mat-option value="subject">{{ 'Subject' | t }}</mat-option>
                    <mat-option value="skill">{{ 'Skill' | t }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- CERTIFICATION CODE -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Certification code' | t }}</mat-label>
                  <input matInput [(ngModel)]="form.certificationCode" [placeholder]="'Optional' | t" />
                </mat-form-field>

                <!-- DESCRIPTION -->
                <mat-form-field appearance="outline" class="w-full md:col-span-2">
                  <mat-label>{{ 'Description' | t }}</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="form.description"
                    rows="4"
                    [placeholder]="'Describe what learners will learn.' | t"
                  ></textarea>
                </mat-form-field>

                <!-- ACTIVE -->
                <div class="flex items-center gap-3 pb-5 md:col-span-2">
                  <mat-checkbox [(ngModel)]="form.active" color="primary">
                    {{ 'Course is active' | t }}
                  </mat-checkbox>
                </div>
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
                  {{ 'Cancel' | t }}
                </button>

                <button
                  type="button"
                  (click)="saveCourse()"
                  [disabled]="saving()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (saving()) {
                    {{ 'Saving...' | t }}
                  } @else {
                    {{ editingQuizId() ? ('Save Changes' | t) : ('Create Course' | t) }}
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
              <div class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingTopicId() ? ('Edit topic' | t) : ('New topic' | t) }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingTopicId() ? topicForm.name : ('Create topic' | t) }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'Topics organize the learning content within a Test Center course.' | t }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="cancelTopicForm()"
                  class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-100/70 hover:text-gray-700"
                  [attr.aria-label]="'Close topic form' | t"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2">
                <!-- COURSE -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Course' | t }}</mat-label>
                  <mat-select
                    [(ngModel)]="topicForm.quizId"
                    (ngModelChange)="onTopicCourseChange()"
                    [disabled]="!!editingTopicId()"
                  >
                    <mat-option value="">{{ 'Select a course' | t }}</mat-option>
                    @for (course of activeCourses(); track course.id) {
                      <mat-option [value]="course.id">{{ course.name }}</mat-option>
                    }
                  </mat-select>
                  @if (editingTopicId()) {
                    <mat-hint>{{ 'A topic\\u0027s parent course cannot be changed here.' | t }}</mat-hint>
                  }
                </mat-form-field>

                <!-- NAME -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Topic name' | t }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="topicForm.name"
                    (ngModelChange)="onTopicNameChange()"
                    [placeholder]="'e.g. Platform Overview' | t"
                  />
                </mat-form-field>

                <!-- SLUG -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Slug' | t }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="topicForm.slug"
                    [disabled]="!!editingTopicId()"
                    [placeholder]="'platform-overview' | t"
                  />
                  @if (editingTopicId()) {
                    <mat-hint>{{ 'Slugs cannot be changed after the topic is created.' | t }}</mat-hint>
                  }
                </mat-form-field>

                <!-- SORT ORDER -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Sort order' | t }}</mat-label>
                  <input matInput type="number" min="0" [(ngModel)]="topicForm.sortOrder" />
                  <mat-hint>{{ 'Lower numbers appear first.' | t }}</mat-hint>
                </mat-form-field>

                <!-- DESCRIPTION -->
                <mat-form-field appearance="outline" class="w-full md:col-span-2">
                  <mat-label>{{ 'Description' | t }}</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="topicForm.description"
                    rows="4"
                    [placeholder]="'Describe the content covered by this topic.' | t"
                  ></textarea>
                </mat-form-field>

                <!-- ACTIVE -->
                <div class="flex items-center gap-3 pb-5 md:col-span-2">
                  <mat-checkbox [(ngModel)]="topicForm.active" color="primary">
                    {{ 'Topic is active' | t }}
                  </mat-checkbox>
                </div>
              </div>

              <!-- TOPIC ACTIONS -->

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelTopicForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  {{ 'Cancel' | t }}
                </button>

                <button
                  type="button"
                  (click)="saveTopic()"
                  [disabled]="savingTopic()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (savingTopic()) {
                    {{ 'Saving...' | t }}
                  } @else {
                    {{ editingTopicId() ? ('Save Changes' | t) : ('Create Topic' | t) }}
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
                <h2 class="font-semibold text-gray-900">{{ 'Test Center' | t }}</h2>

                <p class="text-sm text-gray-500">
                  {{ 'Manage your organization\\u0027s programs, courses, and topics.' | t }}
                </p>
              </div>

              <mat-form-field appearance="outline" class="w-full sm:min-w-[240px] sm:max-w-xs">
                <mat-label>{{ 'Filter courses by program' | t }}</mat-label>
                <mat-select
                  [ngModel]="selectedProgramId()"
                  (ngModelChange)="selectedProgramId.set($event)"
                >
                  <mat-option value="all">{{ 'All Programs' | t }}</mat-option>
                  @for (program of programs(); track program.id) {
                    <mat-option [value]="program.id">{{ program.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </section>

          <!-- ==================================================== -->
          <!-- COURSES -->
          <!-- ==================================================== -->

          <section class="mb-10">
            <div class="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ 'Courses' | t }}</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ '{0} course{1} shown.' | t: [filteredCourses().length, (filteredCourses().length === 1 ? '' : 's')] }}
                </p>
              </div>

              @if (loadingCourses()) {
                <span class="text-sm text-gray-500"> {{ 'Loading...' | t }} </span>
              }
            </div>

            @if (!loadingCourses() && filteredCourses().length === 0) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> menu_book </mat-icon>

                <h3 class="mt-3 font-semibold text-gray-900">{{ 'No custom courses found' | t }}</h3>

                <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {{ 'Create a program first, then create a course and add topics to build the learner experience.' | t }}
                </p>

                @if (context.canManageCourses()) {
                  <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      (click)="createProgram()"
                      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979]"
                    >
                      <mat-icon>account_tree</mat-icon>
                      {{ 'Create Program' | t }}
                    </button>

                    <button
                      type="button"
                      (click)="startNewCourse()"
                      [disabled]="programs().length === 0"
                      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <mat-icon>add</mat-icon>
                      {{ 'Create Course' | t }}
                    </button>
                  </div>
                }
              </div>
            } @else if (!loadingCourses()) {
              <div class="grid gap-4 lg:grid-cols-2">
                @for (course of filteredCourses(); track course.id) {
                  @let topics = getTopicsForCourse(course.id);

                  <article
                    class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <!-- STATUS ACCENT -->

                    <div
                      [class]="course.active ? 'h-1.5 bg-[#007979]' : 'h-1.5 bg-gray-300'"
                      aria-hidden="true"
                    ></div>

                    <div class="flex-1 p-5">
                      <!-- COURSE HEADER -->

                      <div class="flex items-start gap-4">
                        <div
                          [class]="
                            course.active
                              ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F4] text-[#007979]'
                              : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400'
                          "
                        >
                          <mat-icon aria-hidden="true">{{
                            getCourseTypeIcon(course.type)
                          }}</mat-icon>
                        </div>

                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p
                              class="text-xs font-semibold uppercase tracking-wider text-[#007979]"
                            >
                              {{ getCourseTypeLabel(course.type) | t }}
                            </p>

                            <span
                              class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
                              [class.bg-green-50]="course.active"
                              [class.text-green-700]="course.active"
                              [class.bg-gray-100]="!course.active"
                              [class.text-gray-600]="!course.active"
                            >
                              <span
                                class="h-1.5 w-1.5 rounded-full"
                                [class.bg-green-500]="course.active"
                                [class.bg-gray-400]="!course.active"
                              ></span>

                              {{ course.active ? ('Active' | t) : ('Inactive' | t) }}
                            </span>
                          </div>

                          <h3 class="mt-1 break-words text-lg font-bold leading-snug text-gray-900">
                            {{ course.name }}
                          </h3>
                        </div>

                        @if (context.canManageCourses()) {
                          <button
                            type="button"
                            (click)="editCourse(course)"
                            class="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#032D42]"
                            [attr.aria-label]="'Edit ' + course.name"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
                        }
                      </div>

                      <!-- COMPACT COURSE DETAILS -->
                      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <!-- PROGRAM -->
                        @if (course.programId) {
                          <div class="flex min-w-0 items-center gap-1.5">
                            <mat-icon class="!h-4 !w-4 !text-base text-[#007979]">
                              account_tree
                            </mat-icon>

                            <span class="truncate font-medium text-[#007979]">
                              {{ getProgramName(course.programId) }}
                            </span>
                          </div>
                        }

                        <!-- PROVIDER -->
                        <div class="flex items-center gap-1.5">
                          <span class="text-gray-500">{{ 'Provider:' | t }}</span>
                          <span class="font-medium text-gray-900">
                            {{ course.provider || '—' }}
                          </span>
                        </div>

                        <!-- QUESTION COUNT -->
                        <div class="flex items-center gap-1.5">
                          <span class="text-gray-500">{{ 'Questions:' | t }}</span>
                          <span class="font-semibold text-gray-900">
                            {{ course.questionCount }}
                          </span>
                        </div>
                      </div>

                      <!-- DESCRIPTION -->

                      <p
                        class="mt-3 line-clamp-2 text-sm leading-6 text-gray-600"
                        [attr.title]="course.description"
                      >
                        {{ course.description || ('No description.' | t) }}
                      </p>

                      <!-- COURSE TOPICS -->

                      <details class="group mt-4 rounded-xl border border-gray-100">
                        <summary
                          class="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 [&::-webkit-details-marker]:hidden"
                        >
                          <span>{{ 'View topics | {0}' | t: [topics.length] }} </span>

                          <mat-icon
                            class="!h-5 !w-5 !text-xl text-gray-400 transition-transform group-open:rotate-180"
                            aria-hidden="true"
                          >
                            expand_more
                          </mat-icon>
                        </summary>

                        <div class="border-t border-gray-100 px-3 py-2">
                          @if (topics.length === 0) {
                            <p class="px-1 py-2 text-xs text-gray-500">
                              {{ 'No topics have been created for this course yet.' | t }}
                            </p>
                          } @else {
                            <ul class="space-y-1">
                              @for (topic of topics; track topic.id) {
                                <li
                                  class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                                >
                                  <span
                                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5F4F4] text-xs font-bold text-[#007979]"
                                  >
                                    {{ topic.sortOrder + 1 }}
                                  </span>

                                  <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-medium text-gray-900">
                                      {{ topic.name }}
                                    </p>

                                    <p class="text-xs text-gray-500">
                                      {{ '{0} question{1}' | t: [topic.questionCount, (topic.questionCount === 1 ? '' : 's')] }}
                                    </p>
                                  </div>

                                  @if (!topic.active) {
                                    <span
                                      class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                                    >
                                      {{ 'Inactive' | t }}
                                    </span>
                                  }

                                  @if (context.canManageCourses()) {
                                    <button
                                      type="button"
                                      (click)="editTopic(topic)"
                                      class="rounded-lg p-1.5 text-gray-500 transition hover:bg-white hover:text-[#032D42]"
                                      [attr.aria-label]="'Edit topic ' + topic.name"
                                    >
                                      <mat-icon class="!text-lg"> edit </mat-icon>
                                    </button>
                                  }
                                </li>
                              }
                            </ul>
                          }
                        </div>
                      </details>
                    </div>

                    <!-- COURSE ACTIONS -->

                    <div
                      class="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-2"
                    >
                      <a
                        [routerLink]="[
                          '/partner/org',
                          context.organizationId(),
                          'test-center',
                          'questions',
                        ]"
                        [queryParams]="{ quizId: course.id }"
                        class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                      >
                        <mat-icon class="!h-5 !w-5 !text-xl" aria-hidden="true"> quiz </mat-icon>

                        {{ 'Manage Questions' | t }}
                      </a>

                      <button
                        type="button"
                        (click)="createTopicForCourse(course)"
                        [disabled]="!context.canManageCourses() || !course.active"
                        class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm transition hover:bg-[#E8F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <mat-icon class="!h-5 !w-5 !text-xl" aria-hidden="true"> topic </mat-icon>

                        {{ 'Add Topic' | t }}
                      </button>
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
                <h2 class="text-xl font-bold text-gray-900">{{ 'Topics' | t }}</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ selectedProgramId() === 'all'
                      ? ('{0} topic{1} across your organization\\u0027s courses.' | t: [filteredTopics().length, filteredTopics().length === 1 ? '' : 's'])
                      : ('{0} topic{1} in {2}.' | t: [filteredTopics().length, filteredTopics().length === 1 ? '' : 's', selectedProgramName()]) }}
                </p>
              </div>

              @if (loadingTopics()) {
                <span class="text-sm text-gray-500"> {{ 'Loading...' | t }} </span>
              }
            </div>

            @if (!loadingTopics() && filteredTopics().length === 0) {
              <div class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> topic </mat-icon>

                <h3 class="mt-3 font-semibold text-gray-900">{{ 'No topics yet' | t }}</h3>

                <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {{ 'Create topics inside your courses to organize questions and learning content.' | t }}
                </p>

                @if (context.canManageCourses() && activeCourses().length > 0) {
                  <button
                    type="button"
                    (click)="createTopic()"
                    class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-md font-semibold text-white"
                  >
                    <mat-icon>topic</mat-icon>
                    {{ 'Create Topic' | t }}
                  </button>
                }
              </div>
            } @else if (!loadingTopics()) {
              <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div class="divide-y divide-gray-100">
                  @for (topic of filteredTopics(); track topic.id) {
                    <div
                      class="flex flex-row items-center justify-between gap-3 px-4 py-3 transition-colors duration-200  sm:gap-4 sm:px-4 sm:py-2 hover:bg-green-100"
                    >
                      <div class="min-w-0 flex-1">
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
                            {{ topic.active ? ('Active' | t) : ('Inactive' | t) }}
                          </span>
                        </div>

                        <p class="mt-1 text-sm text-gray-500">
                          {{ getCourseName(topic.quizId) }}
                        </p>

                        @if (topic.description) {
                          <p class=" text-sm text-gray-400">
                            {{ topic.description | t }}
                          </p>
                        }
                      </div>

                      <div class="flex shrink-0 items-center gap-3 sm:gap-4">
                        <div class="shrink-0 text-right">
                          <p class="text-sm text-gray-500">{{ 'Questions' | t }}</p>

                          <p class="font-semibold text-gray-900">
                            {{ topic.questionCount }}
                          </p>
                        </div>

                        @if (context.canManageCourses()) {
                          <button
                            type="button"
                            (click)="editTopic(topic)"
                            class="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                            [attr.aria-label]="'Edit topic' | t"
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

  private readonly quizService = inject(QuizService);

  private readonly testProgramService = inject(TestProgramService);

  private readonly topicService = inject(TestTopicService);

  private readonly questionService = inject(TestQuestionService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  private readonly dialog = inject(MatDialog);

  private readonly pageTitleService = inject(PageTitleService);

  // ============================================================
  // COURSE STATE
  // ============================================================

  protected readonly courses = signal<Quiz[]>([]);

  protected readonly loadingCourses = signal(false);

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingQuizId = signal<string | null>(null);

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

  /**
   * Filter the topic directory by the selected program.
   *
   * Topics belong to courses, and each course belongs to a program.
   * Resolve the selected program through the parent course so the
   * directory stays consistent with the course cards above.
   */
  protected readonly filteredTopics = computed(() => {
    const selectedProgramId = this.selectedProgramId();

    if (selectedProgramId === 'all') {
      return this.topics();
    }

    const matchingQuizIds = new Set(
      this.courses()
        .filter((course) => course.programId === selectedProgramId)
        .map((course) => course.id),
    );

    return this.topics().filter((topic) => matchingQuizIds.has(topic.quizId));
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

  /** Import programs, courses, topics and questions from CSV or JSON. */
  protected openImport(): void {
    const organizationId = this.context.organizationId();

    if (!organizationId || !this.context.canManageCourses()) {
      return;
    }

    this.dialog
      .open<
        TestCenterImportDialogComponent,
        TestCenterImportDialogData,
        TestCenterImportDialogResult
      >(TestCenterImportDialogComponent, {
        data: {
          organizationId,
          programs: this.programs(),
          courses: this.courses(),
        },
        width: '760px',
        maxWidth: '95vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.toast.success(
          `Imported ${result.questionsCreated} new and ${result.questionsUpdated} updated question${
            result.questionsCreated + result.questionsUpdated === 1 ? '' : 's'
          }.`,
        );

        void this.initialize();
      });
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

      const organizationCourses = await this.quizService.getAllQuizzes(organizationId);

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
            topic.quizId,
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

    this.editingQuizId.set(null);

    this.form = this.createEmptyForm();

    this.form.programId = this.programs()[0]?.id ?? '';

    // Close the topic form before opening the course form.
    this.showTopicForm.set(false);
    this.editingTopicId.set(null);

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

    this.topicForm.quizId = firstCourse.id;

    this.topicForm.sortOrder = this.getNextSortOrder(firstCourse.id);

    // Close the course form before opening the topic form.
    this.showForm.set(false);
    this.editingQuizId.set(null);

    this.showTopicForm.set(true);

    setTimeout(() => {
      document.getElementById('topic-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  protected createTopicForCourse(course: Quiz): void {
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

    this.topicForm.quizId = course.id;

    this.topicForm.sortOrder = this.getNextSortOrder(course.id);

    // Close the course form before opening the topic form.
    this.showForm.set(false);
    this.editingQuizId.set(null);

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

  protected editCourse(course: Quiz): void {
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to edit organization courses.');

      return;
    }

    this.editingQuizId.set(course.id);

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

    // Close the topic form before editing a course.
    this.showTopicForm.set(false);
    this.editingTopicId.set(null);

    this.showForm.set(true);
  }

  // ============================================================
  // EDIT TOPIC
  // ============================================================

  protected editTopic(topic: TestTopic): void {
    // Guard the action even though the button is hidden for unauthorized users.
    if (!this.context.canManageCourses()) {
      this.toast.error('You do not have permission to edit Test Center topics.');
      return;
    }

    if (!topic?.id) {
      this.toast.error('The selected topic could not be identified.');
      return;
    }

    // Populate the existing form before opening it so the form is ready to edit.
    this.topicForm = {
      quizId: topic.quizId ?? '',
      name: topic.name ?? '',
      slug: topic.slug ?? '',
      description: topic.description ?? '',
      sortOrder: Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0,
      questionCount: topic.questionCount ?? 0,
      active: topic.active === true,
    };

    // Close the course form before editing a topic.
    this.showForm.set(false);
    this.editingQuizId.set(null);

    this.editingTopicId.set(topic.id);
    this.showTopicForm.set(true);

    // Wait for Angular to render the conditional form, then bring it into view.
    setTimeout(() => {
      const formElement = document.getElementById('topic-form');
      if (!formElement) {
        console.warn('[Test Center] Topic form was opened, but #topic-form was not rendered.');
        return;
      }

      formElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  // ============================================================
  // COURSE NAME → SLUG
  // ============================================================

  protected onNameChange(): void {
    if (this.editingQuizId()) {
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

    this.topicForm.sortOrder = this.getNextSortOrder(this.topicForm.quizId);
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

      const editingId = this.editingQuizId();

      if (editingId) {
        await this.quizService.updateQuiz(organizationId, editingId, {
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
        await this.quizService.createQuiz(organizationId, {
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

    const quizId = this.topicForm.quizId.trim();

    const name = this.topicForm.name.trim();

    const slug = this.topicForm.slug.trim();

    const description = this.topicForm.description.trim();

    const sortOrder = Number(this.topicForm.sortOrder);

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!quizId) {
      this.toast.error('Course is required.');

      return;
    }

    const selectedCourse = this.courses().find((course) => course.id === quizId);

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
          quizId,
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
          quizId,
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

    this.editingQuizId.set(null);

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
      quizId: '',

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

  private getNextSortOrder(quizId: string): number {
    const courseTopics = this.topics().filter((topic) => topic.quizId === quizId);

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

  protected getCourseName(quizId: string): string {
    return this.courses().find((course) => course.id === quizId)?.name ?? 'Unknown course';
  }

  // ============================================================
  // GET TOPICS FOR COURSE
  // ============================================================

  protected getTopicsForCourse(quizId: string): TestTopic[] {
    return this.topics()
      .filter((topic) => topic.quizId === quizId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ============================================================
  // COURSE TYPE LABEL / ICON
  // ============================================================

  protected getCourseTypeLabel(type: QuizType | undefined): string {
    return (COURSE_TYPE_META[type ?? 'course'] ?? COURSE_TYPE_META['course']).label;
  }

  protected getCourseTypeIcon(type: QuizType | undefined): string {
    return (COURSE_TYPE_META[type ?? 'course'] ?? COURSE_TYPE_META['course']).icon;
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
