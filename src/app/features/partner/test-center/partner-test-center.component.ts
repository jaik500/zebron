import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, RouterModule } from '@angular/router';

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

interface ProgramForm {
  name: string;
  slug: string;
  description: string;
  active: boolean;
  /** Zebron quizzes linked to the program. */
  platformQuizIds: string[];
}

interface StructureGroup {
  key: string;
  name: string;
  program: TestProgram | null;
  quizzes: Quiz[];
  questionCount: number;
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
  course: { label: 'Course practice', icon: 'menu_book' },
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
        {{ 'Programs, quizzes and topics for your organization: the structure your questions go into.' | t }}
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
          {{ 'New program' | t }}
        </button>

        <button
          type="button"
          (click)="startNewCourse()"
          [disabled]="saving()"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <mat-icon>add</mat-icon>
          {{ 'New quiz' | t }}
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
          <span>{{ 'New program' | t }}</span>
        </button>

        <button
          type="button"
          mat-menu-item
          (click)="createTopic()"
          [disabled]="saving() || courses().length === 0"
        >
          <mat-icon>topic</mat-icon>
          <span>{{ 'New topic' | t }}</span>
        </button>

        <button
          type="button"
          mat-menu-item
          (click)="startNewCourse()"
          [disabled]="saving()"
        >
          <mat-icon>add</mat-icon>
          <span>{{ 'New quiz' | t }}</span>
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
          <!-- PROGRAM FORM -->
          <!-- ==================================================== -->

          @if (showProgramForm()) {
            <section id="program-form" class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6">
              <div class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingProgramId() ? ('Edit program' | t) : ('New program' | t) }}
                  </p>
                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingProgramId() ? programForm.name : ('Create a program' | t) }}
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'A program groups related quizzes, for example a bootcamp or a department.' | t }}
                  </p>
                </div>
                <button
                  type="button"
                  (click)="cancelProgramForm()"
                  class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-100/70 hover:text-gray-700"
                  [attr.aria-label]="'Close' | t"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Program name' | t }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="programForm.name"
                    (ngModelChange)="onProgramNameChange()"
                    [placeholder]="'e.g. Cybersecurity Bootcamp' | t"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Slug' | t }}</mat-label>
                  <input matInput [(ngModel)]="programForm.slug" [disabled]="!!editingProgramId()" />
                  @if (editingProgramId()) {
                    <mat-hint>{{ 'Slugs cannot be changed after the program is created.' | t }}</mat-hint>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full md:col-span-2">
                  <mat-label>{{ 'Description' | t }}</mat-label>
                  <textarea matInput rows="3" [(ngModel)]="programForm.description"></textarea>
                </mat-form-field>

                <!-- Zebron quizzes: shared platform quizzes this organization uses in the program -->
                <mat-form-field appearance="outline" class="w-full md:col-span-2">
                  <mat-label>{{ 'Zebron quizzes in this program' | t }}</mat-label>
                  <mat-select multiple [(ngModel)]="programForm.platformQuizIds">
                    @for (quiz of zebronQuizzes(); track quiz.id) {
                      <mat-option [value]="quiz.id">{{ quiz.name }} · {{ '{0} questions' | t: [quiz.questionCount] }}</mat-option>
                    }
                    @if (!zebronQuizzes().length) {
                      <mat-option disabled>{{ (loadingZebronQuizzes() ? 'Loading quizzes...' : 'No Zebron quizzes are available yet.') | t }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>{{ 'Optional. Their topics are offered for courses in this program. Zebron quizzes stay shared and unchanged.' | t }}</mat-hint>
                </mat-form-field>

                <div class="flex items-center gap-3 pb-5 md:col-span-2">
                  <mat-checkbox [(ngModel)]="programForm.active" color="primary">
                    {{ 'Program is active' | t }}
                  </mat-checkbox>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelProgramForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  {{ 'Cancel' | t }}
                </button>
                <button
                  type="button"
                  (click)="saveProgram()"
                  [disabled]="savingProgram()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (savingProgram()) {
                    {{ 'Saving...' | t }}
                  } @else {
                    {{ editingProgramId() ? ('Save Changes' | t) : ('Create program' | t) }}
                  }
                </button>
              </div>
            </section>
          }

          <!-- ==================================================== -->
          <!-- QUIZ FORM -->
          <!-- ==================================================== -->

          @if (showForm()) {
            <section id="quiz-form" class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6">
              <div
                class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4"
              >
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingQuizId() ? ('Edit quiz' | t) : ('New quiz' | t) }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingQuizId() ? form.name : ('Create a quiz' | t) }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'A quiz is a bank of practice questions, grouped into topics. It belongs only to {0}.' | t: [organizationName()] }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-100/70 hover:text-gray-700"
                  [attr.aria-label]="'Close' | t"
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
                  <mat-label>{{ 'Quiz name' | t }}</mat-label>
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
                      {{ 'Your organization does not have an active program yet. Create a program before creating a quiz.' | t }}
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
                    <mat-hint>{{ 'Slugs cannot be changed after the quiz is created.' | t }}</mat-hint>
                  }
                </mat-form-field>

                <!-- PROVIDER -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Provider' | t }}</mat-label>
                  <input matInput [(ngModel)]="form.provider" [placeholder]="'Your organization' | t" />
                </mat-form-field>

                <!-- TYPE -->
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Quiz type' | t }}</mat-label>
                  <mat-select [(ngModel)]="form.type">
                    <mat-option value="certification">{{ 'Certification' | t }}</mat-option>
                    <mat-option value="course">{{ 'Course practice' | t }}</mat-option>
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
                    {{ 'Quiz is active' | t }}
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
                    {{ editingQuizId() ? ('Save Changes' | t) : ('Create quiz' | t) }}
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
                    {{ 'Topics are sections inside a quiz. Learners can practise one topic or the whole quiz.' | t }}
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
                  <mat-label>{{ 'Quiz' | t }}</mat-label>
                  <mat-select
                    [(ngModel)]="topicForm.quizId"
                    (ngModelChange)="onTopicCourseChange()"
                    [disabled]="!!editingTopicId()"
                  >
                    <mat-option value="">{{ 'Select a quiz' | t }}</mat-option>
                    @for (course of activeCourses(); track course.id) {
                      <mat-option [value]="course.id">{{ course.name }}</mat-option>
                    }
                  </mat-select>
                  @if (editingTopicId()) {
                    <mat-hint>{{ 'A topic\\u0027s quiz cannot be changed here.' | t }}</mat-hint>
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
          <!-- STRUCTURE: PROGRAM → QUIZ → TOPIC -->
          <!-- ==================================================== -->

          <section aria-labelledby="structure-title">
            <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="structure-title" class="text-xl font-bold text-gray-900">{{ 'Structure' | t }}</h2>
                <p class="mt-1 text-sm text-gray-500">
                  {{ 'Program → Quiz → Topic → Question. Create them here; the question, import and final exam lists only pick from them.' | t }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label class="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="showInactive()" (change)="showInactive.set($any($event.target).checked)" />
                  {{ 'Show inactive' | t }}
                </label>
                <button type="button" (click)="expandAll()" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  {{ 'Expand all' | t }}
                </button>
                <button type="button" (click)="collapseAll()" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  {{ 'Collapse all' | t }}
                </button>
              </div>
            </div>

            @if (loadingCourses() || loadingPrograms() || loadingTopics()) {
              <div class="space-y-3" aria-hidden="true">
                @for (item of [1, 2, 3]; track item) {
                  <div class="h-16 animate-pulse rounded-xl bg-gray-200/70"></div>
                }
              </div>
            } @else if (!structure().length) {
              <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400">account_tree</mat-icon>
                <h3 class="mt-3 font-semibold text-gray-900">{{ 'Nothing here yet' | t }}</h3>
                <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {{ 'Start with a program, add a quiz to it, then topics. Questions go into topics.' | t }}
                </p>
                @if (context.canManageCourses()) {
                  <button
                    type="button"
                    (click)="createProgram()"
                    class="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <mat-icon>account_tree</mat-icon>
                    {{ 'New program' | t }}
                  </button>
                }
              </div>
            } @else {
              <ul class="space-y-3">
                @for (group of structure(); track group.key) {
                  <li class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <!-- PROGRAM -->
                    <div class="flex items-center gap-3 bg-gray-50/80 px-4 py-3">
                      <button
                        type="button"
                        (click)="toggleProgram(group.key)"
                        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/70"
                        [attr.aria-expanded]="!collapsedPrograms().has(group.key)"
                        [attr.aria-label]="(collapsedPrograms().has(group.key) ? 'Expand {0}' : 'Collapse {0}') | t: [group.name]"
                      >
                        <mat-icon>{{ collapsedPrograms().has(group.key) ? 'chevron_right' : 'expand_more' }}</mat-icon>
                      </button>
                      <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">account_tree</mat-icon>
                      <div class="min-w-0 flex-1">
                        <p class="flex flex-wrap items-center gap-2">
                          <span class="truncate font-semibold text-gray-900">{{ group.program ? group.name : ('No program' | t) }}</span>
                          @if (group.program && !group.program.active) {
                            <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{{ 'Inactive' | t }}</span>
                          }
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ (group.quizzes.length === 1 ? '{0} quiz' : '{0} quizzes') | t: [group.quizzes.length] }}
                          · {{ '{0} questions' | t: [group.questionCount] }}
                        </p>
                      </div>
                      @if (context.canManageCourses() && group.program; as program) {
                        <button
                          type="button"
                          (click)="startNewCourseInProgram(program)"
                          [disabled]="!program.active"
                          class="hidden h-9 items-center gap-1 rounded-lg border border-[#007979] bg-white px-3 text-xs font-semibold text-[#007979] hover:bg-[#E8F5F5] disabled:opacity-50 sm:inline-flex"
                        >
                          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
                          {{ 'Quiz' | t }}
                        </button>
                        <button
                          type="button"
                          (click)="editProgram(program)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-200/70 hover:text-[#032D42]"
                          [attr.aria-label]="'Edit {0}' | t: [program.name]"
                        >
                          <mat-icon>edit</mat-icon>
                        </button>
                      }
                    </div>

                    @if (!collapsedPrograms().has(group.key)) {
                      @let linkedQuizzes = linkedZebronQuizzes(group.program);
                      @if (!group.quizzes.length && !linkedQuizzes.length) {
                        <p class="border-t border-gray-100 px-4 py-3 pl-14 text-sm text-gray-500">{{ 'No quizzes in this program yet.' | t }}</p>
                      }
                      @if (linkedQuizzes.length) {
                        <div class="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3 text-sm sm:pl-14">
                          <span class="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">link</mat-icon>
                            {{ 'Linked Zebron quizzes' | t }}
                          </span>
                          @for (quiz of linkedQuizzes; track quiz.id) {
                            <span class="rounded-full border border-[#007979]/30 bg-[#E5F4F4] px-2.5 py-0.5 text-xs font-semibold text-[#007979]">{{ quiz.name }}</span>
                          }
                        </div>
                      }
                      <ul class="divide-y divide-gray-100 border-t border-gray-100">
                        @for (quiz of group.quizzes; track quiz.id) {
                          @let quizTopics = topicsFor(quiz.id);
                          <li>
                            <!-- QUIZ -->
                            <div class="flex items-center gap-3 px-4 py-3 sm:pl-10">
                              <button
                                type="button"
                                (click)="toggleQuiz(quiz.id)"
                                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                                [attr.aria-expanded]="expandedQuizzes().has(quiz.id)"
                                [attr.aria-label]="(expandedQuizzes().has(quiz.id) ? 'Collapse {0}' : 'Expand {0}') | t: [quiz.name]"
                              >
                                <mat-icon>{{ expandedQuizzes().has(quiz.id) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                              </button>
                              <span
                                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                [class]="quiz.active ? 'bg-[#E5F4F4] text-[#007979]' : 'bg-gray-100 text-gray-400'"
                                aria-hidden="true"
                              >
                                <mat-icon class="!h-5 !w-5 !text-[20px]">{{ getCourseTypeIcon(quiz.type) }}</mat-icon>
                              </span>
                              <div class="min-w-0 flex-1">
                                <p class="flex flex-wrap items-center gap-2">
                                  <span class="truncate font-semibold text-gray-900">{{ quiz.name }}</span>
                                  <span class="text-[11px] font-semibold uppercase tracking-wide text-[#007979]">{{ getCourseTypeLabel(quiz.type) | t }}</span>
                                  @if (!quiz.active) {
                                    <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{{ 'Inactive' | t }}</span>
                                  }
                                </p>
                                <p class="text-xs text-gray-500">
                                  {{ (quizTopics.length === 1 ? '{0} topic' : '{0} topics') | t: [quizTopics.length] }}
                                  · {{ '{0} questions' | t: [quiz.questionCount] }}
                                  @if (quiz.provider) {
                                    · {{ quiz.provider }}
                                  }
                                </p>
                              </div>
                              <a
                                [routerLink]="['/partner/org', context.organizationId(), 'test-center', 'questions']"
                                [queryParams]="{ quizId: quiz.id }"
                                class="hidden h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-xs font-semibold text-white hover:bg-teal-700 sm:inline-flex"
                              >
                                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">quiz</mat-icon>
                                {{ 'Questions' | t }}
                              </a>
                              @if (context.canManageCourses()) {
                                <button
                                  type="button"
                                  (click)="createTopicForCourse(quiz)"
                                  [disabled]="!quiz.active"
                                  class="hidden h-9 items-center gap-1 rounded-lg border border-[#007979] bg-white px-3 text-xs font-semibold text-[#007979] hover:bg-[#E8F5F5] disabled:opacity-50 sm:inline-flex"
                                >
                                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
                                  {{ 'Topic' | t }}
                                </button>
                                <button
                                  type="button"
                                  [matMenuTriggerFor]="quizMenu"
                                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#032D42]"
                                  [attr.aria-label]="'Actions for {0}' | t: [quiz.name]"
                                >
                                  <mat-icon>more_vert</mat-icon>
                                </button>
                                <mat-menu #quizMenu="matMenu" xPosition="before">
                                  <button mat-menu-item type="button" (click)="editCourse(quiz)">
                                    <mat-icon>edit</mat-icon><span>{{ 'Edit quiz' | t }}</span>
                                  </button>
                                  <button mat-menu-item type="button" (click)="createTopicForCourse(quiz)" [disabled]="!quiz.active">
                                    <mat-icon>topic</mat-icon><span>{{ 'Add topic' | t }}</span>
                                  </button>
                                  <a mat-menu-item [routerLink]="['/partner/org', context.organizationId(), 'test-center', 'questions']" [queryParams]="{ quizId: quiz.id }">
                                    <mat-icon>quiz</mat-icon><span>{{ 'Manage questions' | t }}</span>
                                  </a>
                                </mat-menu>
                              }
                            </div>

                            @if (expandedQuizzes().has(quiz.id)) {
                              <!-- TOPICS -->
                              @if (!quizTopics.length) {
                                <p class="px-4 pb-3 text-sm text-gray-500 sm:pl-24">
                                  {{ 'No topics yet.' | t }}
                                  @if (context.canManageCourses() && quiz.active) {
                                    <button type="button" (click)="createTopicForCourse(quiz)" class="font-semibold text-[#007979] hover:underline">{{ 'Add a topic' | t }}</button>
                                  }
                                </p>
                              } @else {
                                <ol class="pb-2 sm:pl-20">
                                  @for (topic of quizTopics; track topic.id; let first = $first, last = $last, index = $index) {
                                    <li class="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-gray-50">
                                      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5F4F4] text-xs font-bold text-[#007979]">{{ index + 1 }}</span>
                                      <div class="min-w-0 flex-1">
                                        <p class="flex flex-wrap items-center gap-2">
                                          <span class="truncate text-sm font-medium text-gray-900">{{ topic.name }}</span>
                                          @if (!topic.active) {
                                            <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{{ 'Inactive' | t }}</span>
                                          }
                                        </p>
                                        <p class="text-xs text-gray-500">{{ '{0} questions' | t: [topic.questionCount] }}</p>
                                      </div>
                                      @if (context.canManageCourses()) {
                                        <button
                                          type="button"
                                          (click)="moveTopic(topic, -1)"
                                          [disabled]="first || reordering()"
                                          class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42] disabled:opacity-30"
                                          [attr.aria-label]="'Move {0} up' | t: [topic.name]"
                                        >
                                          <mat-icon class="!text-lg">arrow_upward</mat-icon>
                                        </button>
                                        <button
                                          type="button"
                                          (click)="moveTopic(topic, 1)"
                                          [disabled]="last || reordering()"
                                          class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42] disabled:opacity-30"
                                          [attr.aria-label]="'Move {0} down' | t: [topic.name]"
                                        >
                                          <mat-icon class="!text-lg">arrow_downward</mat-icon>
                                        </button>
                                        <button
                                          type="button"
                                          (click)="editTopic(topic)"
                                          class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42]"
                                          [attr.aria-label]="'Edit {0}' | t: [topic.name]"
                                        >
                                          <mat-icon class="!text-lg">edit</mat-icon>
                                        </button>
                                      }
                                    </li>
                                  }
                                </ol>
                              }
                            }
                          </li>
                        }
                      </ul>
                    }
                  </li>
                }
              </ul>
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

  private readonly route = inject(ActivatedRoute);

  private readonly topicService = inject(TestTopicService);

  private readonly questionService = inject(TestQuestionService);

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

  /** Every program, inactive ones included (the Structure tree shows them). */
  protected readonly allPrograms = signal<TestProgram[]>([]);

  /** Active programs: the only ones a quiz can be put in. */
  protected readonly programs = computed(() => this.allPrograms().filter((program) => program.active));

  protected readonly loadingPrograms = signal(false);

  protected readonly showProgramForm = signal(false);

  protected readonly editingProgramId = signal<string | null>(null);

  protected readonly savingProgram = signal(false);

  protected programForm: ProgramForm = this.createEmptyProgramForm();

  /** Active public Zebron quizzes an organization can link to its programs. */
  protected readonly zebronQuizzes = signal<Quiz[]>([]);

  protected readonly loadingZebronQuizzes = signal(false);

  // ============================================================
  // STRUCTURE TREE STATE
  // ============================================================

  protected readonly showInactive = signal(false);

  /** Programs are open by default; this holds the closed ones. */
  protected readonly collapsedPrograms = signal<Set<string>>(new Set());

  /** Quizzes are closed by default; this holds the open ones. */
  protected readonly expandedQuizzes = signal<Set<string>>(new Set());

  protected readonly reordering = signal(false);

  /** Program → quizzes, with quizzes whose program is missing under "No program". */
  protected readonly structure = computed((): StructureGroup[] => {
    const showInactive = this.showInactive();
    const quizzes = this.courses()
      .filter((quiz) => showInactive || quiz.active)
      .sort((a, b) => a.name.localeCompare(b.name));
    const programs = this.allPrograms()
      .filter((program) => showInactive || program.active)
      .sort((a, b) => a.name.localeCompare(b.name));
    const known = new Set(this.allPrograms().map((program) => program.id));

    const groups: StructureGroup[] = programs.map((program) => {
      const inProgram = quizzes.filter((quiz) => quiz.programId === program.id);
      return {
        key: program.id,
        name: program.name,
        program,
        quizzes: inProgram,
        questionCount: inProgram.reduce((total, quiz) => total + (quiz.questionCount || 0), 0),
      };
    });

    const orphans = quizzes.filter((quiz) => !quiz.programId || !known.has(quiz.programId));
    if (orphans.length) {
      groups.push({
        key: '__none__',
        name: '',
        program: null,
        quizzes: orphans,
        questionCount: orphans.reduce((total, quiz) => total + (quiz.questionCount || 0), 0),
      });
    }

    return groups;
  });

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

    // Opened from the course builder's "New program" button.
    if (this.route.snapshot.queryParamMap.has('newProgram') && this.access.canManagePrograms()) {
      this.createProgram();
    }

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
        this.allPrograms.set([]);
        this.topics.set([]);

        return;
      }

      /*
       * Courses must finish loading before topics are loaded
       * because topics are resolved through their parent courses.
       */
      await Promise.all([this.loadCourses(), this.loadPrograms(organizationId), this.loadZebronQuizzes()]);

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
        error instanceof Error ? error.message : 'We could not load your quizzes.';

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
      const programs = await this.testProgramService.getOrganizationPrograms(organizationId);

      this.allPrograms.set(programs);
    } catch (error) {
      this.allPrograms.set([]);

      const message =
        error instanceof Error ? error.message : 'Unable to load organization programs.';

      this.toast.error(message);
    } finally {
      this.loadingPrograms.set(false);
    }
  }

  // ============================================================
  // LOAD ZEBRON QUIZZES
  // ============================================================

  private async loadZebronQuizzes(): Promise<void> {
    this.loadingZebronQuizzes.set(true);

    try {
      const quizzes = await this.quizService.getAvailableQuizzes(null);
      this.zebronQuizzes.set([...quizzes].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      // Linking Zebron quizzes is optional; the rest of the page still works.
      this.zebronQuizzes.set([]);
    } finally {
      this.loadingZebronQuizzes.set(false);
    }
  }

  /** Zebron quizzes linked to a program, in name order; IDs that no longer resolve are skipped. */
  protected linkedZebronQuizzes(program: TestProgram | null): Quiz[] {
    const ids = program?.platformQuizIds ?? [];
    return ids.length ? this.zebronQuizzes().filter((quiz) => ids.includes(quiz.id)) : [];
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
        courses.map((course) => this.topicService.getTopicsForManagement(organizationId, course.id)),
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
      this.toast.error('You do not have permission to manage quizzes.');

      return;
    }

    if (!this.context.organizationId()) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    if (this.programs().length === 0) {
      this.toast.error('Create an active program before creating a quiz.');

      return;
    }

    this.editingQuizId.set(null);

    this.form = this.createEmptyForm();

    this.form.programId = this.programs()[0]?.id ?? '';

    // Close the other forms before opening the quiz form.
    this.showTopicForm.set(false);
    this.showProgramForm.set(false);
    this.editingTopicId.set(null);

    this.showForm.set(true);
    this.scrollTo('quiz-form');
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

    this.editingProgramId.set(null);
    this.programForm = this.createEmptyProgramForm();
    this.showForm.set(false);
    this.showTopicForm.set(false);
    this.showProgramForm.set(true);
    this.scrollTo('program-form');
  }

  protected editProgram(program: TestProgram): void {
    if (!this.access.canManagePrograms()) {
      this.toast.error('You do not have permission to manage programs.');
      return;
    }

    this.editingProgramId.set(program.id);
    this.programForm = {
      name: program.name ?? '',
      slug: program.slug ?? program.id,
      description: program.description ?? '',
      active: program.active === true,
      platformQuizIds: [...(program.platformQuizIds ?? [])],
    };
    this.showForm.set(false);
    this.showTopicForm.set(false);
    this.showProgramForm.set(true);
    this.scrollTo('program-form');
  }

  protected onProgramNameChange(): void {
    if (!this.editingProgramId()) {
      this.programForm.slug = this.slugify(this.programForm.name);
    }
  }

  protected cancelProgramForm(): void {
    this.showProgramForm.set(false);
    this.editingProgramId.set(null);
    this.programForm = this.createEmptyProgramForm();
  }

  protected async saveProgram(): Promise<void> {
    if (this.savingProgram()) {
      return;
    }

    const organizationId = this.context.organizationId();
    if (!organizationId || !this.access.canManagePrograms()) {
      this.toast.error('You do not have permission to manage programs.');
      return;
    }

    const name = this.programForm.name.trim();
    const slug = this.slugify(this.programForm.slug || name);

    if (!name) {
      this.toast.error('Program name is required.');
      return;
    }
    if (slug.length < 3) {
      this.toast.error('Program slug must contain at least 3 characters.');
      return;
    }

    try {
      this.savingProgram.set(true);
      const editingId = this.editingProgramId();

      if (editingId) {
        await this.testProgramService.updateProgram(organizationId, editingId, {
          name,
          description: this.programForm.description.trim(),
          active: this.programForm.active,
          platformQuizIds: this.programForm.platformQuizIds,
        });
        this.toast.success('Program updated.');
      } else {
        if (this.allPrograms().some((program) => program.id === slug || program.slug === slug)) {
          this.toast.error('A program with this slug already exists. Choose another name or slug.');
          return;
        }
        await this.testProgramService.createProgram(organizationId, {
          name,
          slug,
          description: this.programForm.description.trim(),
          active: this.programForm.active,
          platformQuizIds: this.programForm.platformQuizIds,
        });
        this.toast.success('Program created.');
      }

      this.cancelProgramForm();
      await this.loadPrograms(organizationId);
    } catch (error) {
      // Program IDs are their slug; another organization may already use it.
      const message =
        error instanceof Error && /permission/i.test(error.message)
          ? 'This slug is already taken. Choose a different slug.'
          : error instanceof Error
            ? error.message
            : 'Unable to save the program.';
      this.toast.error(message);
    } finally {
      this.savingProgram.set(false);
    }
  }

  /** New quiz with the program already chosen (from the program row). */
  protected startNewCourseInProgram(program: TestProgram): void {
    this.startNewCourse();
    if (this.showForm()) {
      this.form.programId = program.id;
    }
  }

  // ============================================================
  // STRUCTURE TREE
  // ============================================================

  protected toggleProgram(key: string): void {
    const next = new Set(this.collapsedPrograms());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.collapsedPrograms.set(next);
  }

  protected toggleQuiz(quizId: string): void {
    const next = new Set(this.expandedQuizzes());
    if (next.has(quizId)) {
      next.delete(quizId);
    } else {
      next.add(quizId);
    }
    this.expandedQuizzes.set(next);
  }

  protected expandAll(): void {
    this.collapsedPrograms.set(new Set());
    this.expandedQuizzes.set(new Set(this.courses().map((quiz) => quiz.id)));
  }

  protected collapseAll(): void {
    this.expandedQuizzes.set(new Set());
    this.collapsedPrograms.set(new Set(this.structure().map((group) => group.key)));
  }

  /** Topics of a quiz in learner order (inactive ones only when shown). */
  protected topicsFor(quizId: string): TestTopic[] {
    const showInactive = this.showInactive();
    return this.topics()
      .filter((topic) => topic.quizId === quizId && (showInactive || topic.active))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  /** Move a topic up or down; the quiz's topics are renumbered 0, 1, 2… */
  protected async moveTopic(topic: TestTopic, direction: -1 | 1): Promise<void> {
    const organizationId = this.context.organizationId();
    if (!organizationId || !this.context.canManageCourses() || this.reordering()) {
      return;
    }

    const ordered = this.topics()
      .filter((item) => item.quizId === topic.quizId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const index = ordered.findIndex((item) => item.id === topic.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) {
      return;
    }

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const changed = ordered
      .map((item, position) => ({ item, position }))
      .filter(({ item, position }) => item.sortOrder !== position);

    const previous = this.topics();
    const order = new Map(ordered.map((item, position) => [item.id, position]));
    this.topics.set(previous.map((item) => (order.has(item.id) ? { ...item, sortOrder: order.get(item.id)! } : item)));

    try {
      this.reordering.set(true);
      await Promise.all(
        changed.map(({ item, position }) => this.topicService.updateTopic(organizationId, item.id, { sortOrder: position })),
      );
    } catch (error) {
      this.topics.set(previous);
      this.toast.error(error instanceof Error ? error.message : 'Unable to reorder the topics.');
    } finally {
      this.reordering.set(false);
    }
  }

  private scrollTo(id: string): void {
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  private createEmptyProgramForm(): ProgramForm {
    return { name: '', slug: '', description: '', active: true, platformQuizIds: [] };
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
      this.toast.error('Create an active quiz before creating a topic.');

      return;
    }

    this.editingTopicId.set(null);

    this.topicForm = this.createEmptyTopicForm();

    const firstCourse = activeCourses[0];

    this.topicForm.quizId = firstCourse.id;

    this.topicForm.sortOrder = this.getNextSortOrder(firstCourse.id);

    // Close the other forms before opening the topic form.
    this.showForm.set(false);
    this.showProgramForm.set(false);
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
      this.toast.error('Topics can only be created for active quizzes.');

      return;
    }

    this.editingTopicId.set(null);

    this.topicForm = this.createEmptyTopicForm();

    this.topicForm.quizId = course.id;

    this.topicForm.sortOrder = this.getNextSortOrder(course.id);

    // Close the other forms before opening the topic form.
    this.showForm.set(false);
    this.showProgramForm.set(false);
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
      this.toast.error('You do not have permission to edit quizzes.');

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

    // Close the other forms before editing a quiz.
    this.showTopicForm.set(false);
    this.showProgramForm.set(false);
    this.editingTopicId.set(null);

    this.showForm.set(true);
    this.scrollTo('quiz-form');
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

    // Close the other forms before editing a topic.
    this.showForm.set(false);
    this.showProgramForm.set(false);
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
      this.toast.error('You do not have permission to manage quizzes.');

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

        this.toast.success('Quiz updated.');
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

        this.toast.success('Quiz created.');
      }

      this.cancelForm();

      await this.loadCourses();

      await this.loadTopics();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the quiz.';

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
      this.toast.error('Quiz is required.');

      return;
    }

    const selectedCourse = this.courses().find((course) => course.id === quizId);

    if (!selectedCourse) {
      this.toast.error('The selected quiz does not belong to your organization.');

      return;
    }

    if (!selectedCourse.active) {
      this.toast.error('Topics can only be added to active quizzes.');

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

      this.expandedQuizzes.set(new Set([...this.expandedQuizzes(), quizId]));
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
      return 'Quiz name is required.';
    }

    if (!this.form.slug.trim()) {
      return 'Quiz slug is required.';
    }

    if (this.form.slug.trim().length < 3) {
      return 'Quiz slug must contain at least 3 characters.';
    }

    if (!this.form.type) {
      return 'Quiz type is required.';
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
    return this.courses().find((course) => course.id === quizId)?.name ?? 'Unknown quiz';
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
