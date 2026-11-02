import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { HotToastService } from '@ngxpert/hot-toast';

import { PageTitleService } from '../../../../core/services/page-title.service';
import { Quiz, QuizType } from '../../../test-center/models/quiz.model';
import { TestProgram } from '../../../test-center/models/test-program.model';
import { TestTopic } from '../../../test-center/models/test-topic.model';
import { CourseService } from '../../../courses/course.service';
import { TestProgramService } from '../../../test-center/services/test-program.service';
import { QuizService } from '../../../test-center/services/quiz.service';
import { TestQuestionService } from '../../../test-center/services/test-question.service';
import { TestTopicService } from '../../../test-center/services/test-topic.service';

interface QuizForm {
  name: string;
  slug: string;
  description: string;
  provider: string;
  type: QuizType;
  certificationCode: string;
  active: boolean;
  /** Zebron program ID; '' for no program. */
  programId: string;
}

interface ProgramForm {
  name: string;
  description: string;
  active: boolean;
}

interface TopicForm {
  quizId: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

const QUIZ_TYPES: ReadonlyArray<{ value: QuizType; label: string; icon: string }> = [
  { value: 'certification', label: 'Certification', icon: 'workspace_premium' },
  { value: 'course', label: 'Course practice', icon: 'menu_book' },
  { value: 'subject', label: 'Subject', icon: 'category' },
  { value: 'skill', label: 'Skill', icon: 'build' },
];

/**
 * Zebron Test Center (platform admins): the structure of Zebron's own,
 * public quizzes — Program → Quiz → Topic → Question. Zebron programs live
 * in testPrograms with scope 'platform' and are also the Program list of
 * Zebron's learning courses.
 *
 * Organizations build their own Program → Quiz → Topic structure in their
 * Test Center and can link these Zebron quizzes to their programs.
 * Questions are edited on /admin/test-center/questions.
 */
@Component({
  selector: 'app-test-center-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
  ],
  template: `
    <div class="mt-16 min-h-screen bg-gray-50">
      <!-- HEADER -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] shadow-md">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <nav class="flex flex-wrap items-center gap-2 text-sm text-white/65" aria-label="Breadcrumb">
              <a routerLink="/admin" class="transition hover:text-white">Admin</a>
              <span>/</span>
              <span class="text-white/90">Test Center</span>
            </nav>
            <h1 class="mt-1 text-xl font-semibold text-white">Zebron Test Center</h1>
            <p class="hidden max-w-2xl text-sm text-white/70 sm:block">
              Zebron's public quizzes and their topics. Every signed-in learner can practise them, and organizations can link them to their programs.
            </p>
          </div>

          <div class="hidden shrink-0 items-center gap-2 sm:flex">
            <a
              routerLink="/admin/test-center/questions"
              class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <mat-icon>quiz</mat-icon>
              Questions
            </a>
            <button
              type="button"
              (click)="startNewProgram()"
              class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <mat-icon>account_tree</mat-icon>
              New program
            </button>
            <button
              type="button"
              (click)="startNewQuiz()"
              class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#007979] shadow-sm hover:bg-[#E8F5F5]"
            >
              <mat-icon>add</mat-icon>
              New quiz
            </button>
          </div>

          <button type="button" mat-icon-button [matMenuTriggerFor]="headerMenu" aria-label="Test Center actions" class="!text-white sm:hidden">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #headerMenu="matMenu">
            <button mat-menu-item type="button" (click)="startNewProgram()"><mat-icon>account_tree</mat-icon><span>New program</span></button>
            <button mat-menu-item type="button" (click)="startNewQuiz()"><mat-icon>add</mat-icon><span>New quiz</span></button>
            <button mat-menu-item type="button" (click)="createProgramsFromCourses()" [disabled]="importingPrograms()"><mat-icon>playlist_add</mat-icon><span>Create programs from courses</span></button>
            <a mat-menu-item routerLink="/admin/test-center/questions"><mat-icon>quiz</mat-icon><span>Questions</span></a>
            <a mat-menu-item routerLink="/test-center"><mat-icon>visibility</mat-icon><span>Learner view</span></a>
            <a mat-menu-item routerLink="/admin"><mat-icon>dashboard</mat-icon><span>Admin</span></a>
          </mat-menu>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- PROGRAM FORM -->
        @if (showProgramForm()) {
          <section id="program-form" class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6">
            <div class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ editingProgramId() ? 'Edit program' : 'New program' }}</p>
                <h2 class="mt-1 text-xl font-bold text-gray-900">{{ editingProgramId() ? programForm.name : 'Create a Zebron program' }}</h2>
                <p class="mt-1 text-sm text-gray-500">A program groups Zebron quizzes and courses into a learning path. Courses pick it in the course builder's Program list.</p>
              </div>
              <button type="button" (click)="cancelProgramForm()" class="rounded-lg p-2 text-gray-500 hover:bg-green-100/70 hover:text-gray-700" aria-label="Close">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Program name</mat-label>
                <input matInput [(ngModel)]="programForm.name" placeholder="e.g. Cybersecurity Program" />
                @if (editingProgramId()) {
                  <mat-hint>Renaming doesn't change courses that already use the old name.</mat-hint>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput rows="3" [(ngModel)]="programForm.description"></textarea>
              </mat-form-field>
              <div class="pb-5">
                <mat-checkbox [(ngModel)]="programForm.active" color="primary">Program is active</mat-checkbox>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" (click)="cancelProgramForm()" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              <button
                type="button"
                (click)="saveProgram()"
                [disabled]="saving()"
                class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : editingProgramId() ? 'Save changes' : 'Create program' }}
              </button>
            </div>
          </section>
        }

        <!-- PROGRAMS -->
        <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4" aria-labelledby="programs-title">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="programs-title" class="font-bold text-gray-900">Zebron programs</h2>
              <p class="text-sm text-gray-500">Used by Zebron quizzes here and by the Program list in the course builder.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="createProgramsFromCourses()"
                [disabled]="importingPrograms()"
                class="inline-flex h-9 items-center gap-1 rounded-lg border border-[#007979] bg-white px-3 text-xs font-semibold text-[#007979] hover:bg-[#E8F5F5] disabled:opacity-50"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">playlist_add</mat-icon>
                {{ importingPrograms() ? 'Creating...' : 'Create from courses' }}
              </button>
              <button type="button" (click)="startNewProgram()" class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-xs font-semibold text-white hover:bg-teal-700">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
                Program
              </button>
            </div>
          </div>
          @if (programs().length) {
            <div class="mt-3 flex flex-wrap gap-2">
              @for (program of programs(); track program.id) {
                <button
                  type="button"
                  (click)="editProgram(program)"
                  class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
                  [class]="program.active ? 'border-[#007979]/30 bg-[#E5F4F4] text-[#007979] hover:bg-[#d3eeee]' : 'border-gray-200 bg-gray-100 text-gray-500'"
                  [attr.aria-label]="'Edit ' + program.name"
                >
                  {{ program.name }}
                  <span class="font-normal opacity-70">· {{ quizzesInProgram(program.id) }}</span>
                  @if (!program.active) {
                    <span class="font-normal">· inactive</span>
                  }
                </button>
              }
            </div>
          } @else if (!loading()) {
            <p class="mt-3 text-sm text-gray-500">No Zebron programs yet. Create one, or use "Create from courses" to add every Program name used by Zebron's courses.</p>
          }
        </section>

        <!-- QUIZ FORM -->
        @if (showQuizForm()) {
          <section id="quiz-form" class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6">
            <div class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ editingQuizId() ? 'Edit quiz' : 'New quiz' }}</p>
                <h2 class="mt-1 text-xl font-bold text-gray-900">{{ editingQuizId() ? quizForm.name : 'Create a Zebron quiz' }}</h2>
                <p class="mt-1 text-sm text-gray-500">A quiz is a bank of practice questions, grouped into topics. Zebron quizzes are public to every signed-in learner.</p>
              </div>
              <button type="button" (click)="cancelQuizForm()" class="rounded-lg p-2 text-gray-500 hover:bg-green-100/70 hover:text-gray-700" aria-label="Close">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Quiz name</mat-label>
                <input matInput [(ngModel)]="quizForm.name" (ngModelChange)="onQuizNameChange()" placeholder="e.g. ServiceNow CSA Preparation" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Slug</mat-label>
                <input matInput [(ngModel)]="quizForm.slug" [disabled]="!!editingQuizId()" placeholder="servicenow-csa-preparation" />
                @if (editingQuizId()) {
                  <mat-hint>Slugs cannot be changed after the quiz is created.</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Quiz type</mat-label>
                <mat-select [(ngModel)]="quizForm.type">
                  @for (type of quizTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Program (optional)</mat-label>
                <mat-select [(ngModel)]="quizForm.programId">
                  <mat-option value="">No program</mat-option>
                  @for (program of programs(); track program.id) {
                    @if (program.active || program.id === quizForm.programId) {
                      <mat-option [value]="program.id">{{ program.name }}</mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Provider</mat-label>
                <input matInput [(ngModel)]="quizForm.provider" placeholder="e.g. ServiceNow" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Certification code</mat-label>
                <input matInput [(ngModel)]="quizForm.certificationCode" placeholder="Optional" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Description</mat-label>
                <textarea matInput rows="4" [(ngModel)]="quizForm.description" placeholder="Describe what learners will practise."></textarea>
              </mat-form-field>

              <div class="pb-5 md:col-span-2">
                <mat-checkbox [(ngModel)]="quizForm.active" color="primary">Quiz is active</mat-checkbox>
                <p class="ml-10 text-xs text-gray-500">Inactive quizzes are hidden from learners and from the organizations' program lists.</p>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" (click)="cancelQuizForm()" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              <button
                type="button"
                (click)="saveQuiz()"
                [disabled]="saving()"
                class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : editingQuizId() ? 'Save changes' : 'Create quiz' }}
              </button>
            </div>
          </section>
        }

        <!-- TOPIC FORM -->
        @if (showTopicForm()) {
          <section id="topic-form" class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6">
            <div class="flex items-start justify-between gap-4 rounded-lg border border-green-100 bg-green-50/70 p-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ editingTopicId() ? 'Edit topic' : 'New topic' }}</p>
                <h2 class="mt-1 text-xl font-bold text-gray-900">{{ editingTopicId() ? topicForm.name : 'Create topic' }}</h2>
                <p class="mt-1 text-sm text-gray-500">Topics are sections inside a quiz. Learners can practise one topic or the whole quiz.</p>
              </div>
              <button type="button" (click)="cancelTopicForm()" class="rounded-lg p-2 text-gray-500 hover:bg-green-100/70 hover:text-gray-700" aria-label="Close topic form">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Quiz</mat-label>
                <mat-select [(ngModel)]="topicForm.quizId" (ngModelChange)="onTopicQuizChange()" [disabled]="!!editingTopicId()">
                  @for (quiz of activeQuizzes(); track quiz.id) {
                    <mat-option [value]="quiz.id">{{ quiz.name }}</mat-option>
                  }
                </mat-select>
                @if (editingTopicId()) {
                  <mat-hint>A topic's quiz cannot be changed.</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Topic name</mat-label>
                <input matInput [(ngModel)]="topicForm.name" (ngModelChange)="onTopicNameChange()" placeholder="e.g. Platform Overview" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Slug</mat-label>
                <input matInput [(ngModel)]="topicForm.slug" [disabled]="!!editingTopicId()" placeholder="platform-overview" />
                @if (editingTopicId()) {
                  <mat-hint>Slugs cannot be changed after the topic is created.</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Sort order</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="topicForm.sortOrder" />
                <mat-hint>Lower numbers appear first.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Description</mat-label>
                <textarea matInput rows="3" [(ngModel)]="topicForm.description" placeholder="Describe the content covered by this topic."></textarea>
              </mat-form-field>

              <div class="pb-5 md:col-span-2">
                <mat-checkbox [(ngModel)]="topicForm.active" color="primary">Topic is active</mat-checkbox>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" (click)="cancelTopicForm()" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              <button
                type="button"
                (click)="saveTopic()"
                [disabled]="saving()"
                class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : editingTopicId() ? 'Save changes' : 'Create topic' }}
              </button>
            </div>
          </section>
        }

        <!-- STRUCTURE: QUIZ → TOPIC -->
        <section aria-labelledby="structure-title">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="structure-title" class="text-xl font-bold text-gray-900">Structure</h2>
              <p class="mt-1 text-sm text-gray-500">Quiz → Topic → Question. Questions go into topics; add and edit them on the Questions page.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <label class="inline-flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="showInactive()" (change)="showInactive.set($any($event.target).checked)" />
                Show inactive
              </label>
              <button type="button" (click)="expandAll()" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">Expand all</button>
              <button type="button" (click)="collapseAll()" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">Collapse all</button>
            </div>
          </div>

          @if (loading()) {
            <div class="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading Zebron quizzes...</div>
          } @else if (!visibleQuizzes().length) {
            <div class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <mat-icon class="!h-10 !w-10 !text-4xl text-[#007979]" aria-hidden="true">quiz</mat-icon>
              <p class="mt-2 font-semibold text-gray-900">{{ quizzes().length ? 'No active quizzes' : 'No Zebron quizzes yet' }}</p>
              <p class="mt-1 text-sm text-gray-500">Create a quiz, add topics to it, then add questions.</p>
              <button type="button" (click)="startNewQuiz()" class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                <mat-icon>add</mat-icon>
                New quiz
              </button>
            </div>
          } @else {
            <ul class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              @for (quiz of visibleQuizzes(); track quiz.id) {
                @let quizTopics = topicsFor(quiz.id);
                <li>
                  <!-- QUIZ -->
                  <div class="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      (click)="toggle(quiz.id)"
                      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                      [attr.aria-expanded]="expanded().has(quiz.id)"
                      [attr.aria-label]="(expanded().has(quiz.id) ? 'Collapse ' : 'Expand ') + quiz.name"
                    >
                      <mat-icon>{{ expanded().has(quiz.id) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                    </button>
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      [class]="quiz.active ? 'bg-[#E5F4F4] text-[#007979]' : 'bg-gray-100 text-gray-400'"
                      aria-hidden="true"
                    >
                      <mat-icon class="!h-5 !w-5 !text-[20px]">{{ typeIcon(quiz.type) }}</mat-icon>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="flex flex-wrap items-center gap-2">
                        <span class="truncate font-semibold text-gray-900">{{ quiz.name }}</span>
                        <span class="text-[11px] font-semibold uppercase tracking-wide text-[#007979]">{{ typeLabel(quiz.type) }}</span>
                        @if (!quiz.active) {
                          <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Inactive</span>
                        }
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ quizTopics.length }} {{ quizTopics.length === 1 ? 'topic' : 'topics' }} · {{ questionCounts().get(quiz.id) ?? 0 }} questions
                        @if (quiz.provider) {
                          · {{ quiz.provider }}
                        }
                        @if (programName(quiz.programId); as name) {
                          · <span class="font-semibold text-[#007979]">{{ name }}</span>
                        }
                      </p>
                    </div>
                    <a
                      routerLink="/admin/test-center/questions"
                      [queryParams]="{ quizId: quiz.id }"
                      class="hidden h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-xs font-semibold text-white hover:bg-teal-700 sm:inline-flex"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">quiz</mat-icon>
                      Questions
                    </a>
                    <button
                      type="button"
                      (click)="startNewTopic(quiz)"
                      [disabled]="!quiz.active"
                      class="hidden h-9 items-center gap-1 rounded-lg border border-[#007979] bg-white px-3 text-xs font-semibold text-[#007979] hover:bg-[#E8F5F5] disabled:opacity-50 sm:inline-flex"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
                      Topic
                    </button>
                    <button type="button" [matMenuTriggerFor]="quizMenu" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#032D42]" [attr.aria-label]="'Actions for ' + quiz.name">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #quizMenu="matMenu" xPosition="before">
                      <button mat-menu-item type="button" (click)="editQuiz(quiz)"><mat-icon>edit</mat-icon><span>Edit quiz</span></button>
                      <button mat-menu-item type="button" (click)="startNewTopic(quiz)" [disabled]="!quiz.active"><mat-icon>topic</mat-icon><span>Add topic</span></button>
                      <a mat-menu-item routerLink="/admin/test-center/questions" [queryParams]="{ quizId: quiz.id }"><mat-icon>quiz</mat-icon><span>Manage questions</span></a>
                      <a mat-menu-item [routerLink]="['/test-center/quiz-details', quiz.slug]"><mat-icon>visibility</mat-icon><span>View as learner</span></a>
                    </mat-menu>
                  </div>

                  <!-- TOPICS -->
                  @if (expanded().has(quiz.id)) {
                    @if (!quizTopics.length) {
                      <p class="px-4 pb-3 text-sm text-gray-500 sm:pl-24">
                        No topics yet.
                        @if (quiz.active) {
                          <button type="button" (click)="startNewTopic(quiz)" class="font-semibold text-[#007979] hover:underline">Add a topic</button>
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
                                  <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Inactive</span>
                                }
                              </p>
                              <p class="text-xs text-gray-500">{{ topic.questionCount }} questions</p>
                            </div>
                            <button type="button" (click)="moveTopic(topic, -1)" [disabled]="first || reordering()" class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42] disabled:opacity-30" [attr.aria-label]="'Move ' + topic.name + ' up'">
                              <mat-icon class="!text-lg">arrow_upward</mat-icon>
                            </button>
                            <button type="button" (click)="moveTopic(topic, 1)" [disabled]="last || reordering()" class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42] disabled:opacity-30" [attr.aria-label]="'Move ' + topic.name + ' down'">
                              <mat-icon class="!text-lg">arrow_downward</mat-icon>
                            </button>
                            <button type="button" (click)="editTopic(topic)" class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#032D42]" [attr.aria-label]="'Edit ' + topic.name">
                              <mat-icon class="!text-lg">edit</mat-icon>
                            </button>
                            @if (topic.questionCount === 0) {
                              <button type="button" (click)="deleteTopic(topic)" class="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-red-600" [attr.aria-label]="'Delete ' + topic.name">
                                <mat-icon class="!text-lg">delete</mat-icon>
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
        </section>
      </main>
    </div>
  `,
})
export class TestCenterAdminComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly topicService = inject(TestTopicService);
  private readonly questionService = inject(TestQuestionService);
  private readonly programService = inject(TestProgramService);
  private readonly courseService = inject(CourseService);
  private readonly toast = inject(HotToastService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly route = inject(ActivatedRoute);

  protected readonly quizTypes = QUIZ_TYPES;

  /** Zebron quizzes (scope 'platform'), inactive ones included. */
  protected readonly quizzes = signal<Quiz[]>([]);
  protected readonly topics = signal<TestTopic[]>([]);
  /** Zebron programs (testPrograms with scope 'platform'), inactive ones included. */
  protected readonly programs = signal<TestProgram[]>([]);
  protected readonly importingPrograms = signal(false);

  protected readonly showProgramForm = signal(false);
  protected readonly editingProgramId = signal<string | null>(null);
  protected programForm: ProgramForm = { name: '', description: '', active: true };
  /** Questions per quiz, every status. */
  protected readonly questionCounts = signal<Map<string, number>>(new Map());
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly reordering = signal(false);

  protected readonly showInactive = signal(false);
  /** Quizzes are closed by default; this holds the open ones. */
  protected readonly expanded = signal<Set<string>>(new Set());

  protected readonly showQuizForm = signal(false);
  protected readonly editingQuizId = signal<string | null>(null);
  protected quizForm: QuizForm = this.emptyQuizForm();

  protected readonly showTopicForm = signal(false);
  protected readonly editingTopicId = signal<string | null>(null);
  protected topicForm: TopicForm = this.emptyTopicForm();

  protected readonly activeQuizzes = computed(() => this.quizzes().filter((quiz) => quiz.active));
  protected readonly visibleQuizzes = computed(() => (this.showInactive() ? this.quizzes() : this.activeQuizzes()));

  ngOnInit(): void {
    this.pageTitle.setTitle('Test Center');
    void this.load().then(() => {
      // Opened from the course builder's "New program" button.
      if (this.route.snapshot.queryParamMap.has('newProgram')) {
        this.startNewProgram();
      }
    });
  }

  // ============================================================
  // LOADING
  // ============================================================

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const all = await this.quizService.getAllQuizzesForAdmin();
      this.quizzes.set(all.filter((quiz) => quiz.scope === 'platform'));
      await Promise.all([this.loadTopics(), this.loadQuestionCounts(), this.loadPrograms()]);
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to load the Zebron quizzes.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTopics(): Promise<void> {
    const groups = await Promise.all(this.quizzes().map((quiz) => this.topicService.getTopicsForManagement(null, quiz.id)));
    const withCounts = await Promise.all(
      groups.flat().map(async (topic) => ({
        ...topic,
        questionCount: await this.questionService.getQuestionCountForTopic(null, topic.quizId, topic.id),
      })),
    );
    this.topics.set(withCounts);
  }

  private async loadPrograms(): Promise<void> {
    this.programs.set(await this.programService.getPlatformPrograms());
  }

  private async loadQuestionCounts(): Promise<void> {
    const counts = await Promise.all(
      this.quizzes().map(async (quiz) => [quiz.id, await this.questionService.getQuestionCountForCourse(null, quiz.id)] as const),
    );
    this.questionCounts.set(new Map(counts));
  }

  // ============================================================
  // TREE
  // ============================================================

  protected topicsFor(quizId: string): TestTopic[] {
    const showInactive = this.showInactive();
    return this.topics()
      .filter((topic) => topic.quizId === quizId && (showInactive || topic.active))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  protected toggle(quizId: string): void {
    const next = new Set(this.expanded());
    if (next.has(quizId)) {
      next.delete(quizId);
    } else {
      next.add(quizId);
    }
    this.expanded.set(next);
  }

  protected collapseAll(): void {
    this.expanded.set(new Set());
  }

  protected expandAll(): void {
    this.expanded.set(new Set(this.quizzes().map((quiz) => quiz.id)));
  }

  protected typeLabel(type: QuizType | undefined): string {
    return QUIZ_TYPES.find((item) => item.value === type)?.label ?? 'Quiz';
  }

  protected typeIcon(type: QuizType | undefined): string {
    return QUIZ_TYPES.find((item) => item.value === type)?.icon ?? 'quiz';
  }

  protected programName(programId: string | null | undefined): string {
    return programId ? (this.programs().find((program) => program.id === programId)?.name ?? '') : '';
  }

  protected quizzesInProgram(programId: string): string {
    const count = this.quizzes().filter((quiz) => quiz.programId === programId).length;
    return count === 1 ? '1 quiz' : `${count} quizzes`;
  }

  // ============================================================
  // PROGRAMS
  // ============================================================

  protected startNewProgram(): void {
    this.editingProgramId.set(null);
    this.programForm = { name: '', description: '', active: true };
    this.showQuizForm.set(false);
    this.showTopicForm.set(false);
    this.showProgramForm.set(true);
    this.scrollTo('program-form');
  }

  protected editProgram(program: TestProgram): void {
    this.editingProgramId.set(program.id);
    this.programForm = { name: program.name ?? '', description: program.description ?? '', active: program.active === true };
    this.showQuizForm.set(false);
    this.showTopicForm.set(false);
    this.showProgramForm.set(true);
    this.scrollTo('program-form');
  }

  protected cancelProgramForm(): void {
    this.showProgramForm.set(false);
    this.editingProgramId.set(null);
  }

  protected async saveProgram(): Promise<void> {
    if (this.saving()) {
      return;
    }
    const name = this.programForm.name.trim();
    if (!name) {
      this.toast.error('Program name is required.');
      return;
    }
    const editingId = this.editingProgramId();
    if (this.programs().some((program) => program.id !== editingId && program.name.trim().toLowerCase() === name.toLowerCase())) {
      this.toast.error('A Zebron program with this name already exists.');
      return;
    }

    try {
      this.saving.set(true);
      if (editingId) {
        await this.programService.updatePlatformProgram(editingId, {
          name,
          description: this.programForm.description,
          active: this.programForm.active,
        });
        this.toast.success('Program updated.');
      } else {
        const result = await this.programService.createPlatformProgram({
          name,
          description: this.programForm.description,
          active: this.programForm.active,
        });
        if (result.created) {
          this.toast.success('Program created.');
        } else {
          this.toast.error('A Zebron program with this name already exists.');
          return;
        }
      }
      this.cancelProgramForm();
      await this.loadPrograms();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to save the program.');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * One Zebron program for every Program name used by Zebron's learning
   * courses. Safe to run again: names that already have a program are skipped.
   */
  protected async createProgramsFromCourses(): Promise<void> {
    if (this.importingPrograms()) {
      return;
    }

    try {
      this.importingPrograms.set(true);
      const courses = await this.courseService.listAll(null);
      const names = new Map<string, string>();
      for (const course of courses) {
        const name = (course.program ?? '').trim();
        if (name && !names.has(name.toLowerCase())) {
          names.set(name.toLowerCase(), name);
        }
      }

      const existing = new Set(this.programs().map((program) => program.name.trim().toLowerCase()));
      const missing = [...names.entries()].filter(([key]) => !existing.has(key)).map(([, name]) => name);

      if (!names.size) {
        this.toast.info('None of Zebron\'s courses has a Program yet.');
        return;
      }
      if (!missing.length) {
        this.toast.info(`All ${names.size} course programs already exist.`);
        return;
      }
      if (!window.confirm(`Create ${missing.length} Zebron program(s)?\n\n${missing.join('\n')}`)) {
        return;
      }

      let created = 0;
      for (const name of missing) {
        const result = await this.programService.createPlatformProgram({ name });
        if (result.created) {
          created++;
        }
      }
      await this.loadPrograms();
      this.toast.success(`Created ${created} program(s) from courses.`);
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to create programs from courses.');
    } finally {
      this.importingPrograms.set(false);
    }
  }

  // ============================================================
  // QUIZZES
  // ============================================================

  protected startNewQuiz(): void {
    this.editingQuizId.set(null);
    this.quizForm = this.emptyQuizForm();
    this.showTopicForm.set(false);
    this.showProgramForm.set(false);
    this.showQuizForm.set(true);
    this.scrollTo('quiz-form');
  }

  protected editQuiz(quiz: Quiz): void {
    this.editingQuizId.set(quiz.id);
    this.quizForm = {
      name: quiz.name ?? '',
      slug: quiz.slug ?? '',
      description: quiz.description ?? '',
      provider: quiz.provider ?? '',
      type: quiz.type ?? 'course',
      certificationCode: quiz.certificationCode ?? '',
      active: quiz.active === true,
      programId: quiz.programId ?? '',
    };
    this.showTopicForm.set(false);
    this.showProgramForm.set(false);
    this.showQuizForm.set(true);
    this.scrollTo('quiz-form');
  }

  protected onQuizNameChange(): void {
    if (!this.editingQuizId()) {
      this.quizForm.slug = this.slugify(this.quizForm.name);
    }
  }

  protected cancelQuizForm(): void {
    this.showQuizForm.set(false);
    this.editingQuizId.set(null);
    this.quizForm = this.emptyQuizForm();
  }

  protected async saveQuiz(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const name = this.quizForm.name.trim();
    const slug = this.slugify(this.quizForm.slug || name);
    if (!name) {
      this.toast.error('Quiz name is required.');
      return;
    }
    if (slug.length < 3) {
      this.toast.error('Quiz slug must contain at least 3 characters.');
      return;
    }

    const details = {
      name,
      description: this.quizForm.description,
      provider: this.quizForm.provider,
      type: this.quizForm.type,
      certificationCode: this.quizForm.certificationCode,
      active: this.quizForm.active,
      programId: this.quizForm.programId || null,
    };

    try {
      this.saving.set(true);
      const editingId = this.editingQuizId();
      if (editingId) {
        await this.quizService.updatePlatformQuiz(editingId, details);
        this.toast.success('Quiz updated.');
      } else {
        await this.quizService.createPlatformQuiz({ ...details, slug });
        this.toast.success('Quiz created.');
      }
      this.cancelQuizForm();
      await this.load();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to save the quiz.');
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // TOPICS
  // ============================================================

  protected startNewTopic(quiz: Quiz): void {
    if (!quiz.active) {
      this.toast.error('Topics can only be added to active quizzes.');
      return;
    }
    this.editingTopicId.set(null);
    this.topicForm = { ...this.emptyTopicForm(), quizId: quiz.id, sortOrder: this.nextSortOrder(quiz.id) };
    this.showQuizForm.set(false);
    this.showTopicForm.set(true);
    this.scrollTo('topic-form');
  }

  protected editTopic(topic: TestTopic): void {
    this.editingTopicId.set(topic.id);
    this.topicForm = {
      quizId: topic.quizId,
      name: topic.name ?? '',
      slug: topic.slug ?? '',
      description: topic.description ?? '',
      sortOrder: Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0,
      active: topic.active === true,
    };
    this.showQuizForm.set(false);
    this.showTopicForm.set(true);
    this.scrollTo('topic-form');
  }

  protected onTopicNameChange(): void {
    if (!this.editingTopicId()) {
      this.topicForm.slug = this.slugify(this.topicForm.name);
    }
  }

  protected onTopicQuizChange(): void {
    if (!this.editingTopicId()) {
      this.topicForm.sortOrder = this.nextSortOrder(this.topicForm.quizId);
    }
  }

  protected cancelTopicForm(): void {
    this.showTopicForm.set(false);
    this.editingTopicId.set(null);
    this.topicForm = this.emptyTopicForm();
  }

  protected async saveTopic(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const quizId = this.topicForm.quizId;
    const name = this.topicForm.name.trim();
    const slug = this.slugify(this.topicForm.slug || name);
    const sortOrder = Number(this.topicForm.sortOrder);

    if (!this.quizzes().some((quiz) => quiz.id === quizId)) {
      this.toast.error('Choose a Zebron quiz.');
      return;
    }
    if (!name) {
      this.toast.error('Topic name is required.');
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
      this.saving.set(true);
      const editingId = this.editingTopicId();
      if (editingId) {
        await this.topicService.updateTopic(null, editingId, {
          name,
          description: this.topicForm.description.trim(),
          sortOrder,
          active: this.topicForm.active,
        });
        this.toast.success('Topic updated.');
      } else {
        await this.topicService.createTopic(null, {
          scope: 'platform',
          organizationId: null,
          quizId,
          name,
          slug,
          description: this.topicForm.description.trim(),
          sortOrder,
          questionCount: 0,
          active: this.topicForm.active,
        });
        this.toast.success('Topic created.');
      }
      this.cancelTopicForm();
      await this.loadTopics();
      this.expanded.set(new Set([...this.expanded(), quizId]));
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to save the topic.');
    } finally {
      this.saving.set(false);
    }
  }

  /** Only empty topics can be deleted; deactivate a topic that has questions. */
  protected async deleteTopic(topic: TestTopic): Promise<void> {
    if (topic.questionCount > 0 || !window.confirm(`Delete the topic "${topic.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await this.topicService.deleteTopic(null, topic.id);
      this.topics.set(this.topics().filter((item) => item.id !== topic.id));
      this.toast.success('Topic deleted.');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Unable to delete the topic.');
    }
  }

  /** Move a topic up or down; the quiz's topics are renumbered 0, 1, 2… */
  protected async moveTopic(topic: TestTopic, direction: -1 | 1): Promise<void> {
    if (this.reordering()) {
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
    const changed = ordered.map((item, position) => ({ item, position })).filter(({ item, position }) => item.sortOrder !== position);

    const previous = this.topics();
    const order = new Map(ordered.map((item, position) => [item.id, position]));
    this.topics.set(previous.map((item) => (order.has(item.id) ? { ...item, sortOrder: order.get(item.id)! } : item)));

    try {
      this.reordering.set(true);
      await Promise.all(changed.map(({ item, position }) => this.topicService.updateTopic(null, item.id, { sortOrder: position })));
    } catch (error) {
      this.topics.set(previous);
      this.toast.error(error instanceof Error ? error.message : 'Unable to reorder the topics.');
    } finally {
      this.reordering.set(false);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private nextSortOrder(quizId: string): number {
    const orders = this.topics()
      .filter((topic) => topic.quizId === quizId)
      .map((topic) => (Number.isFinite(topic.sortOrder) ? topic.sortOrder : 0));
    return orders.length ? Math.max(...orders) + 1 : 0;
  }

  private slugify(value: string): string {
    return (value ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private scrollTo(id: string): void {
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  private emptyQuizForm(): QuizForm {
    return { name: '', slug: '', description: '', provider: '', type: 'course', certificationCode: '', active: true, programId: '' };
  }

  private emptyTopicForm(): TopicForm {
    return { quizId: '', name: '', slug: '', description: '', sortOrder: 0, active: true };
  }
}
