import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { TestCourse } from '../../../../features/test-center/models/test-course.model';

import {
  TestQuestion,
  TestQuestionDifficulty,
  TestQuestionOption,
  TestQuestionType,
} from '../../../../features/test-center/models/test-question.model';

import { TestTopic } from '../../../../features/test-center/models/test-topic.model';

import { TestCourseService } from '../../../../features/test-center/services/test-course.service';
import { TestQuestionService } from '../../../../features/test-center/services/test-question.service';
import { TestTopicService } from '../../../../features/test-center/services/test-topic.service';

import { TEST_QUESTION_BANKS } from '../../../test-center/data/question-bank-registry';

import {
  TestQuestionImportRecord,
  TestQuestionImportTopic,
} from '../../../test-center/models/test-question-import.model';

import { TestQuestionImportService } from '../../../test-center/services/test-question-import.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-test-question-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 mt-10">
      <div class="mx-auto max-w-7xl">

        <!-- ============================================================
             PAGE HEADER
             ============================================================ -->

        <div
          class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <a
                routerLink="/admin"
                class="transition hover:text-teal-600"
              >
                Admin
              </a>

              <span>/</span>

              <a
                routerLink="/admin/test-center/topics"
                class="transition hover:text-teal-600"
              >
                Test Center
              </a>

              <span>/</span>

              <span class="text-gray-700">
                Questions
              </span>
            </div>


            <p class="mt-1 text-sm text-gray-600">
              Create, edit, publish, and manage Test Center questions. Version 1.0.0
            </p>

          </div>

          <!-- ============================================================
               HEADER ACTIONS
               ============================================================ -->

          <div class="flex flex-wrap items-center gap-2">

            <!-- ==========================================================
                 QUESTION BANK TOGGLE
                 Hidden by default.
                 ========================================================== -->

            <button
              type="button"
              (click)="toggleQuestionBankSelector()"
              [attr.aria-expanded]="showQuestionBankSelector()"
              aria-controls="questionBankSelectorPanel"
              class="inline-flex items-center justify-center gap-2
                     rounded-lg border border-gray-300
                     bg-white px-4 py-2.5
                     text-sm font-semibold text-gray-700
                     transition hover:bg-gray-50"
            >
              <span>
                {{ showQuestionBankSelector()
                  ? 'Hide Question Bank'
                  : 'Show Question Bank' }}
              </span>

              <span
                aria-hidden="true"
                class="text-xs"
              >
                {{ showQuestionBankSelector() ? '▲' : '▼' }}
              </span>
            </button>

            <!-- ==========================================================
                 BROWSER JSON UPLOAD
                 This remains visible independently of the toggle.
                 ========================================================== -->

            <input
              #questionBankFileInput
              type="file"
              accept=".json,application/json"
              class="hidden"
              (change)="onQuestionBankFileSelected($event)"
            />

            <button
              type="button"
              (click)="questionBankFileInput.click()"
              [disabled]="!selectedCourseId() || importing()"
              class="inline-flex items-center justify-center
                     rounded-lg border border-teal-200
                     bg-teal-50 px-4 py-2.5
                     text-sm font-semibold text-teal-700
                     transition hover:bg-teal-100
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >
              @if (importing()) {
                <span>Importing...</span>
              } @else {
                <span>Upload Question Bank</span>
              }
            </button>

            <!-- ==========================================================
                 ADD QUESTION
                 ========================================================== -->

            <button
              type="button"
              (click)="startNewQuestion()"
              [disabled]="!selectedCourseId() || !selectedTopicId()"
              class="inline-flex items-center justify-center
                     rounded-lg bg-teal-600
                     px-4 py-2.5
                     text-sm font-semibold text-white
                     shadow-sm transition hover:bg-teal-700
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >
              + Add Question
            </button>
          </div>
        </div>

        <!-- ============================================================
             REGISTERED QUESTION BANK SELECTOR
             Hidden by default.
             Contains BOTH the dropdown and the registered-bank import
             button.
             ============================================================ -->

        @if (showQuestionBankSelector()) {
          <section
            id="questionBankSelectorPanel"
            class="mb-6 rounded-xl border border-teal-100
                   bg-teal-50/40 p-5 shadow-sm"
          >
            <div
              class="flex flex-col gap-4
                     lg:flex-row lg:items-end lg:justify-between"
            >
              <div class="min-w-0 flex-1">
                <div class="mb-3">
                  <h2 class="text-base font-semibold text-gray-900">
                    Registered Question Bank
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    Select a predefined question bank when you want to
                    import or update a registered bank.
                  </p>
                </div>

                <label
                  for="importBank"
                  class="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Question Bank
                </label>

                <select
                  id="importBank"
                  name="importBank"
                  [ngModel]="selectedImportBank()"
                  (ngModelChange)="selectedImportBank.set($event)"
                  [disabled]="importing()"
                  class="w-full rounded-lg border border-gray-300
                         bg-white px-3 py-2.5
                         text-sm text-gray-900
                         outline-none transition
                         focus:border-teal-500
                         focus:ring-2 focus:ring-teal-100
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  @for (bank of questionBanks; track bank.id) {
                    <option [value]="bank.id">
                      {{ bank.name }} — {{ bank.questions.length }} Questions
                    </option>
                  }
                </select>

                @if (selectedImportBankDescription()) {
                  <p class="mt-2 text-xs text-gray-500">
                    {{ selectedImportBankDescription() }}
                  </p>
                }
              </div>

              <!-- ========================================================
                   REGISTERED BANK IMPORT BUTTON
                   ======================================================== -->

              <div class="shrink-0">
                <button
                  type="button"
                  (click)="importQuestionBank()"
                  [disabled]="!selectedCourseId() || importing()"
                  class="inline-flex w-full items-center
                         justify-center rounded-lg
                         border border-teal-200
                         bg-white px-4 py-2.5
                         text-sm font-semibold text-teal-700
                         transition hover:bg-teal-100
                         lg:w-auto
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  @if (importing()) {
                    <span>Importing...</span>
                  } @else {
                    <span>Import Question Bank</span>
                  }
                </button>
              </div>
            </div>
          </section>
        }

        <!-- ============================================================
             PENDING BROWSER UPLOAD PREVIEW
             ============================================================ -->

        @if (pendingQuestionBank(); as pending) {
          <section
            class="mb-6 rounded-xl border border-amber-200
                   bg-amber-50 p-5 shadow-sm"
          >
            <div
              class="flex flex-col gap-4
                     lg:flex-row lg:items-start lg:justify-between"
            >
              <div>
                <h2 class="text-base font-semibold text-gray-900">
                  Review Uploaded Question Bank
                </h2>

                <p class="mt-1 text-sm text-gray-600">
                  The file has been validated in the browser.
                  Firestore has not been modified yet.
                </p>
              </div>

              <span
                class="inline-flex w-fit rounded-full
                       bg-green-100 px-3 py-1
                       text-xs font-semibold text-green-700"
              >
                Validation Passed
              </span>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <div class="rounded-lg bg-white p-4">
                <p class="text-xs font-medium text-gray-500">
                  File
                </p>

                <p
                  class="mt-1 break-all text-sm font-semibold
                         text-gray-900"
                >
                  {{ pending.fileName }}
                </p>
              </div>

              <div class="rounded-lg bg-white p-4">
                <p class="text-xs font-medium text-gray-500">
                  Course
                </p>

                <p class="mt-1 text-sm font-semibold text-gray-900">
                  {{ selectedCourseName() }}
                </p>
              </div>

              <div class="rounded-lg bg-white p-4">
                <p class="text-xs font-medium text-gray-500">
                  Questions
                </p>

                <p class="mt-1 text-lg font-bold text-gray-900">
                  {{ pending.records.length }}
                </p>
              </div>

              <div class="rounded-lg bg-white p-4">
                <p class="text-xs font-medium text-gray-500">
                  Topics
                </p>

                <p class="mt-1 text-lg font-bold text-gray-900">
                  {{ pending.topics.length }}
                </p>
              </div>
            </div>

            <!-- Status breakdown -->

            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span
                class="rounded-full bg-green-100 px-3 py-1
                       font-medium text-green-700"
              >
                Published: {{ uploadedPublishedCount() }}
              </span>

              <span
                class="rounded-full bg-yellow-100 px-3 py-1
                       font-medium text-yellow-700"
              >
                Draft: {{ uploadedDraftCount() }}
              </span>

              <span
                class="rounded-full bg-gray-200 px-3 py-1
                       font-medium text-gray-700"
              >
                Archived: {{ uploadedArchivedCount() }}
              </span>

              <span
                class="rounded-full bg-green-100 px-3 py-1
                       font-medium text-green-700"
              >
                Easy: {{ uploadedEasyCount() }}
              </span>

              <span
                class="rounded-full bg-blue-100 px-3 py-1
                       font-medium text-blue-700"
              >
                Medium: {{ uploadedMediumCount() }}
              </span>

              <span
                class="rounded-full bg-red-100 px-3 py-1
                       font-medium text-red-700"
              >
                Hard: {{ uploadedHardCount() }}
              </span>
            </div>

            <!-- Import behavior -->

            <div
              class="mt-5 rounded-lg border border-amber-200
                     bg-white p-4"
            >
              <h3 class="text-sm font-semibold text-gray-900">
                Import Details
              </h3>

              <ul class="mt-2 space-y-1 text-sm text-gray-600">
                <li>
                  • Existing matching topics will be reused.
                </li>

                <li>
                  • Missing topics will be created automatically.
                </li>

                <li>
                  • Questions will be linked to the selected course.
                </li>

                <li>
                  • Questions with the same seedId will be updated
                    rather than duplicated.
                </li>

                <li>
                  • Firestore has not been modified yet.
                </li>
              </ul>
            </div>

            <!-- Preview actions -->

            <div
              class="mt-5 flex flex-col-reverse gap-3
                     sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="cancelUploadedQuestionBank()"
                [disabled]="importing()"
                class="rounded-lg border border-gray-300
                       bg-white px-5 py-2.5
                       text-sm font-semibold text-gray-700
                       transition hover:bg-gray-50
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="confirmUploadedQuestionBank()"
                [disabled]="importing() || !selectedCourseId()"
                class="rounded-lg bg-teal-600
                       px-5 py-2.5
                       text-sm font-semibold text-white
                       transition hover:bg-teal-700
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (importing()) {
                  Importing...
                } @else {
                  Review & Import
                }
              </button>
            </div>
          </section>
        }

        <!-- ============================================================
             COURSE / TOPIC FILTER
             ============================================================ -->

        <section
          class="mb-6 rounded-xl border border-gray-200
                 bg-white p-5 shadow-sm"
        >
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900">
              Question Management
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Select a course and topic to manage its questions.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">

            <!-- Course -->

            <div>
              <label
                for="course"
                class="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Course <span class="text-red-500">*</span>
              </label>

              <select
                id="course"
                name="course"
                [ngModel]="selectedCourseId()"
                (ngModelChange)="onCourseChange($event)"
                class="w-full rounded-lg border border-gray-300
                       bg-white px-3 py-2.5
                       text-sm text-gray-900
                       outline-none transition
                       focus:border-teal-500
                       focus:ring-2 focus:ring-teal-100"
              >
                <option value="">
                  Select a course
                </option>

                @for (course of courses(); track course.id) {
                  <option [value]="course.id">
                    {{ course.name }}
                  </option>
                }
              </select>
            </div>

            <!-- Topic -->

            <div>
              <label
                for="topic"
                class="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Topic <span class="text-red-500">*</span>
              </label>

              <select
                id="topic"
                name="topic"
                [ngModel]="selectedTopicId()"
                (ngModelChange)="onTopicChange($event)"
                [disabled]="!selectedCourseId() || loadingTopics()"
                class="w-full rounded-lg border border-gray-300
                       bg-white px-3 py-2.5
                       text-sm text-gray-900
                       outline-none transition
                       focus:border-teal-500
                       focus:ring-2 focus:ring-teal-100
                       disabled:cursor-not-allowed
                       disabled:bg-gray-100"
              >
                <option value="">
                  @if (loadingTopics()) {
                    Loading topics...
                  } @else if (!selectedCourseId()) {
                    Select a course first
                  } @else {
                    Select a topic
                  }
                </option>

                @for (topic of topics(); track topic.id) {
                  <option [value]="topic.id">
                    {{ topic.name }}
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- Selection summary -->

          @if (selectedCourseId() && selectedTopicId()) {
            <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">

              <span
                class="rounded-full bg-teal-50 px-3 py-1
                       font-medium text-teal-700"
              >
                {{ selectedCourseName() }}
              </span>

              <span class="text-gray-400">
                →
              </span>

              <span
                class="rounded-full bg-gray-100 px-3 py-1
                       font-medium text-gray-700"
              >
                {{ selectedTopicName() }}
              </span>

              <span class="text-gray-500">
                {{ questions().length }}
                {{ questions().length === 1
                  ? 'question'
                  : 'questions' }}
              </span>
            </div>
          }
        </section>

        <!-- ============================================================
             LOADING
             ============================================================ -->

        @if (loadingQuestions()) {
          <div
            class="rounded-xl border border-gray-200
                   bg-white p-10 text-center shadow-sm"
          >
            <div
              class="mx-auto h-8 w-8 animate-spin rounded-full
                     border-4 border-gray-200
                     border-t-teal-600"
            ></div>

            <p class="mt-3 text-sm text-gray-500">
              Loading questions...
            </p>
          </div>
        }

        <!-- ============================================================
             EMPTY SELECTION
             ============================================================ -->

        @else if (!selectedCourseId() || !selectedTopicId()) {
          <div
            class="rounded-xl border border-dashed
                   border-gray-300 bg-white p-10 text-center"
          >
            <div
              class="mx-auto flex h-12 w-12 items-center
                     justify-center rounded-full bg-teal-50"
            >
              <span class="text-xl text-teal-600">
                ?
              </span>
            </div>

            <h2
              class="mt-4 text-base font-semibold text-gray-900"
            >
              Select a course and topic
            </h2>

            <p
              class="mx-auto mt-1 max-w-md
                     text-sm text-gray-500"
            >
              Choose the course and topic above to view
              and manage its question bank.
            </p>
          </div>
        }

        <!-- ============================================================
             NO QUESTIONS
             ============================================================ -->

        @else if (questions().length === 0) {
          <div
            class="rounded-xl border border-dashed
                   border-gray-300 bg-white p-10 text-center"
          >
            <div
              class="mx-auto flex h-12 w-12 items-center
                     justify-center rounded-full bg-gray-100"
            >
              <span class="text-xl text-gray-500">
                ?
              </span>
            </div>

            <h2
              class="mt-4 text-base font-semibold text-gray-900"
            >
              No questions yet
            </h2>

            <p
              class="mx-auto mt-1 max-w-md
                     text-sm text-gray-500"
            >
              This topic does not have any questions yet.
              Create the first question to populate the
              question bank.
            </p>

            <button
              type="button"
              (click)="startNewQuestion()"
              class="mt-5 rounded-lg bg-teal-600
                     px-4 py-2.5
                     text-sm font-semibold text-white
                     transition hover:bg-teal-700"
            >
              Add First Question
            </button>
          </div>
        }

        <!-- ============================================================
             QUESTION LIST
             ============================================================ -->

        @else {
          <div class="space-y-4">

            @for (
              question of questions();
              track question.id;
              let i = $index
            ) {
              <article
                class="rounded-xl border border-gray-200
                       bg-white p-5 shadow-sm
                       transition hover:shadow-md"
              >
                <div
                  class="flex flex-col gap-4
                         lg:flex-row lg:items-start
                         lg:justify-between"
                >
                  <div class="min-w-0 flex-1">

                    <!-- Metadata -->

                    <div
                      class="mb-2 flex flex-wrap
                             items-center gap-2"
                    >
                      <span
                        class="text-xs font-semibold
                               uppercase tracking-wide
                               text-gray-400"
                      >
                        Question {{ i + 1 }}
                      </span>

                      <span
                        class="rounded-full px-2.5 py-1
                               text-xs font-medium"
                        [class.bg-green-50]="
                          question.status === 'published'
                        "
                        [class.text-green-700]="
                          question.status === 'published'
                        "
                        [class.bg-yellow-50]="
                          question.status === 'draft'
                        "
                        [class.text-yellow-700]="
                          question.status === 'draft'
                        "
                        [class.bg-gray-100]="
                          question.status === 'archived'
                        "
                        [class.text-gray-600]="
                          question.status === 'archived'
                        "
                      >
                        {{ question.status }}
                      </span>

                      <span
                        class="rounded-full bg-blue-50
                               px-2.5 py-1
                               text-xs font-medium
                               text-blue-700"
                      >
                        {{ question.difficulty }}
                      </span>

                      <span
                        class="rounded-full bg-gray-100
                               px-2.5 py-1
                               text-xs font-medium
                               text-gray-600"
                      >
                        {{
                          question.type === 'multiple-choice'
                            ? 'Multiple Choice'
                            : 'True / False'
                        }}
                      </span>
                    </div>

                    <!-- Question -->

                    <h3
                      class="text-base font-semibold
                             leading-6 text-gray-900"
                    >
                      {{ question.question }}
                    </h3>

                    <!-- Options -->

                    <div
                      class="mt-4 grid gap-2 sm:grid-cols-2"
                    >
                      @for (
                        option of question.options;
                        track option.id
                      ) {
                        <div
                          class="rounded-lg border
                                 px-3 py-2 text-sm"
                          [class.border-green-200]="
                            option.id === question.correctAnswer
                          "
                          [class.bg-green-50]="
                            option.id === question.correctAnswer
                          "
                          [class.text-green-800]="
                            option.id === question.correctAnswer
                          "
                          [class.border-gray-200]="
                            option.id !== question.correctAnswer
                          "
                          [class.bg-gray-50]="
                            option.id !== question.correctAnswer
                          "
                          [class.text-gray-700]="
                            option.id !== question.correctAnswer
                          "
                        >
                          <span class="font-medium">
                            {{ option.text }}
                          </span>

                          @if (
                            option.id === question.correctAnswer
                          ) {
                            <span
                              class="ml-1 text-xs
                                     font-semibold
                                     text-green-600"
                            >
                              ✓ Correct
                            </span>
                          }
                        </div>
                      }
                    </div>

                    <!-- Metadata -->

                    <div
                      class="mt-4 flex flex-wrap
                             gap-x-4 gap-y-2
                             text-xs text-gray-500"
                    >
                      <span>
                        Source: {{ question.sourceType }}
                      </span>

                      @if (question.tags.length > 0) {
                        <span>
                          Tags: {{ question.tags.join(', ') }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Actions -->

                  <div class="flex shrink-0 gap-2">
                    <button
                      type="button"
                      (click)="editQuestion(question)"
                      class="rounded-lg border
                             border-gray-300
                             px-3 py-2
                             text-sm font-medium
                             text-gray-700
                             transition hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteQuestion(question)"
                      class="rounded-lg border
                             border-red-200
                             px-3 py-2
                             text-sm font-medium
                             text-red-600
                             transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
        }

        <!-- ============================================================
             QUESTION FORM
             ============================================================ -->

        @if (showForm()) {
          <section
            class="mt-8 rounded-xl border
                   border-gray-200 bg-white shadow-sm"
          >
            <!-- Form header -->

            <div
              class="flex flex-col gap-3
                     border-b border-gray-200 p-5
                     sm:flex-row sm:items-center
                     sm:justify-between"
            >
              <div>
                <h2
                  class="text-lg font-semibold text-gray-900"
                >
                  {{
                    editingQuestionId()
                      ? 'Edit Question'
                      : 'Create Question'
                  }}
                </h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ selectedCourseName() }}

                  <span class="mx-1">
                    →
                  </span>

                  {{ selectedTopicName() }}
                </p>
              </div>

              <button
                type="button"
                (click)="cancelForm()"
                class="text-sm font-medium
                       text-gray-500
                       transition hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            <div class="space-y-6 p-5">

              <!-- Question -->

              <div>
                <label
                  for="questionText"
                  class="mb-1.5 block
                         text-sm font-medium
                         text-gray-700"
                >
                  Question
                  <span class="text-red-500">*</span>
                </label>

                <textarea
                  id="questionText"
                  name="questionText"
                  rows="4"
                  [(ngModel)]="form.question"
                  placeholder="Enter the question..."
                  class="w-full rounded-lg
                         border border-gray-300
                         px-3 py-2.5
                         text-sm text-gray-900
                         outline-none transition
                         focus:border-teal-500
                         focus:ring-2
                         focus:ring-teal-100"
                ></textarea>
              </div>

              <!-- Type / Difficulty / Status -->

              <div class="grid gap-4 md:grid-cols-3">

                <div>
                  <label
                    for="questionType"
                    class="mb-1.5 block
                           text-sm font-medium
                           text-gray-700"
                  >
                    Question Type
                  </label>

                  <select
                    id="questionType"
                    name="questionType"
                    [(ngModel)]="form.type"
                    (ngModelChange)="onQuestionTypeChange()"
                    class="w-full rounded-lg
                           border border-gray-300
                           bg-white px-3 py-2.5
                           text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500
                           focus:ring-2
                           focus:ring-teal-100"
                  >
                    <option value="multiple-choice">
                      Multiple Choice
                    </option>

                    <option value="true-false">
                      True / False
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    for="difficulty"
                    class="mb-1.5 block
                           text-sm font-medium
                           text-gray-700"
                  >
                    Difficulty
                  </label>

                  <select
                    id="difficulty"
                    name="difficulty"
                    [(ngModel)]="form.difficulty"
                    class="w-full rounded-lg
                           border border-gray-300
                           bg-white px-3 py-2.5
                           text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500
                           focus:ring-2
                           focus:ring-teal-100"
                  >
                    <option value="easy">
                      Easy
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="hard">
                      Hard
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    for="status"
                    class="mb-1.5 block
                           text-sm font-medium
                           text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    [(ngModel)]="form.status"
                    class="w-full rounded-lg
                           border border-gray-300
                           bg-white px-3 py-2.5
                           text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500
                           focus:ring-2
                           focus:ring-teal-100"
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="published">
                      Published
                    </option>

                    <option value="archived">
                      Archived
                    </option>
                  </select>
                </div>
              </div>

              <!-- Answer Options -->

              <div>
                <div
                  class="mb-3 flex items-center
                         justify-between"
                >
                  <div>
                    <h3
                      class="text-sm font-semibold
                             text-gray-900"
                    >
                      Answer Options
                    </h3>

                    <p
                      class="mt-1 text-xs
                             text-gray-500"
                    >
                      Select the correct answer.
                    </p>
                  </div>

                  @if (form.type === 'multiple-choice') {
                    <button
                      type="button"
                      (click)="addOption()"
                      class="rounded-lg border
                             border-teal-200
                             px-3 py-2
                             text-xs font-semibold
                             text-teal-700
                             transition hover:bg-teal-50"
                    >
                      + Add Option
                    </button>
                  }
                </div>

                <div class="space-y-3">
                  @for (
                    option of form.options;
                    track option.id;
                    let i = $index
                  ) {
                    <div
                      class="flex items-start gap-3
                             rounded-lg border p-3"
                      [class.border-green-300]="
                        form.correctAnswer === option.id
                      "
                      [class.bg-green-50]="
                        form.correctAnswer === option.id
                      "
                      [class.border-gray-200]="
                        form.correctAnswer !== option.id
                      "
                    >
                      <!-- Radio -->

                      <div class="pt-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          [value]="option.id"
                          [(ngModel)]="form.correctAnswer"
                          [id]="'correct-' + option.id"
                          class="h-4 w-4
                                 border-gray-300
                                 text-teal-600
                                 focus:ring-teal-500"
                        />
                      </div>

                      <!-- Letter -->

                      <div
                        class="flex h-9 w-9 shrink-0
                               items-center
                               justify-center
                               rounded-lg bg-gray-100
                               text-sm font-semibold
                               text-gray-600"
                      >
                        {{ optionLetter(i) }}
                      </div>

                      <!-- Text -->

                      <div class="min-w-0 flex-1">
                        <label
                          [for]="'option-' + option.id"
                          class="sr-only"
                        >
                          Option {{ optionLetter(i) }}
                        </label>

                        <input
                          [id]="'option-' + option.id"
                          [name]="'option-' + option.id"
                          type="text"
                          [(ngModel)]="option.text"
                          placeholder="Enter answer option..."
                          class="w-full rounded-lg
                                 border border-gray-300
                                 px-3 py-2
                                 text-sm text-gray-900
                                 outline-none transition
                                 focus:border-teal-500
                                 focus:ring-2
                                 focus:ring-teal-100"
                        />

                        @if (
                          form.correctAnswer === option.id
                        ) {
                          <p
                            class="mt-1 text-xs
                                   font-medium
                                   text-green-700"
                          >
                            Correct answer
                          </p>
                        }
                      </div>

                      <!-- Remove -->

                      @if (
                        form.type === 'multiple-choice' &&
                        form.options.length > 2
                      ) {
                        <button
                          type="button"
                          (click)="removeOption(i)"
                          class="mt-1 rounded-md
                                 p-1.5
                                 text-gray-400
                                 transition
                                 hover:bg-red-50
                                 hover:text-red-600"
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Explanation / Hint -->

              <div class="grid gap-5 md:grid-cols-2">

                <div>
                  <label
                    for="explanation"
                    class="mb-1.5 block
                           text-sm font-medium
                           text-gray-700"
                  >
                    Explanation
                  </label>

                  <textarea
                    id="explanation"
                    name="explanation"
                    rows="4"
                    [(ngModel)]="form.explanation"
                    placeholder="Explain why the correct answer is correct..."
                    class="w-full rounded-lg
                           border border-gray-300
                           px-3 py-2.5
                           text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500
                           focus:ring-2
                           focus:ring-teal-100"
                  ></textarea>
                </div>

                <div>
                  <label
                    for="hint"
                    class="mb-1.5 block
                           text-sm font-medium
                           text-gray-700"
                  >
                    Hint
                  </label>

                  <textarea
                    id="hint"
                    name="hint"
                    rows="4"
                    [(ngModel)]="form.hint"
                    placeholder="Optional answer-neutral hint..."
                    class="w-full rounded-lg
                           border border-gray-300
                           px-3 py-2.5
                           text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500
                           focus:ring-2
                           focus:ring-teal-100"
                  ></textarea>
                </div>
              </div>

              <!-- Tags -->

              <div>
                <label
                  for="tags"
                  class="mb-1.5 block
                         text-sm font-medium
                         text-gray-700"
                >
                  Tags
                </label>

                <input
                  id="tags"
                  name="tags"
                  type="text"
                  [(ngModel)]="form.tagsText"
                  placeholder="e.g. cmdb, discovery, csdm"
                  class="w-full rounded-lg
                         border border-gray-300
                         px-3 py-2.5
                         text-sm text-gray-900
                         outline-none transition
                         focus:border-teal-500
                         focus:ring-2
                         focus:ring-teal-100"
                />

                <p class="mt-1 text-xs text-gray-500">
                  Separate multiple tags with commas.
                </p>
              </div>

              <!-- Source -->

              <div
                class="rounded-lg border
                       border-gray-200
                       bg-gray-50 p-4"
              >
                <h3
                  class="mb-3 text-sm
                         font-semibold text-gray-900"
                >
                  Content Source
                </h3>

                <div class="grid gap-4 md:grid-cols-2">

                  <div>
                    <label
                      for="sourceType"
                      class="mb-1.5 block
                             text-sm font-medium
                             text-gray-700"
                    >
                      Source Type
                    </label>

                    <select
                      id="sourceType"
                      name="sourceType"
                      [(ngModel)]="form.sourceType"
                      class="w-full rounded-lg
                             border border-gray-300
                             bg-white px-3 py-2.5
                             text-sm text-gray-900
                             outline-none transition
                             focus:border-teal-500
                             focus:ring-2
                             focus:ring-teal-100"
                    >
                      <option value="original">
                        Original
                      </option>

                      <option value="licensed">
                        Licensed
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      for="sourceReference"
                      class="mb-1.5 block
                             text-sm font-medium
                             text-gray-700"
                    >
                      Source Reference
                    </label>

                    <input
                      id="sourceReference"
                      name="sourceReference"
                      type="text"
                      [(ngModel)]="form.sourceReference"
                      placeholder="Optional source/reference"
                      class="w-full rounded-lg
                             border border-gray-300
                             bg-white px-3 py-2.5
                             text-sm text-gray-900
                             outline-none transition
                             focus:border-teal-500
                             focus:ring-2
                             focus:ring-teal-100"
                    />
                  </div>
                </div>
              </div>

              <!-- Form Actions -->

              <div
                class="flex flex-col-reverse gap-3
                       border-t border-gray-200
                       pt-5
                       sm:flex-row
                       sm:justify-end"
              >
                <button
                  type="button"
                  (click)="cancelForm()"
                  [disabled]="saving()"
                  class="rounded-lg border
                         border-gray-300
                         px-5 py-2.5
                         text-sm font-semibold
                         text-gray-700
                         transition hover:bg-gray-50
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  (click)="saveQuestion()"
                  [disabled]="saving()"
                  class="rounded-lg bg-teal-600
                         px-5 py-2.5
                         text-sm font-semibold
                         text-white
                         transition hover:bg-teal-700
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{
                      editingQuestionId()
                        ? 'Update Question'
                        : 'Create Question'
                    }}
                  }
                </button>
              </div>
            </div>
          </section>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestQuestionAdminComponent implements OnInit {
  // ============================================================
  // SERVICES
  // ============================================================

  private readonly courseService =
    inject(TestCourseService);

  private readonly topicService =
    inject(TestTopicService);

  private readonly questionService =
    inject(TestQuestionService);

  private readonly toast =
    inject(HotToastService);

  private readonly questionImportService =
    inject(TestQuestionImportService);

  // ============================================================
  // DATA
  // ============================================================

  protected readonly courses =
    signal<TestCourse[]>([]);

  protected readonly topics =
    signal<TestTopic[]>([]);

  protected readonly questions =
    signal<TestQuestion[]>([]);

  // ============================================================
  // LOADING STATE
  // ============================================================

  protected readonly importing =
    signal(false);

  protected readonly loadingCourses =
    signal(false);

  protected readonly loadingTopics =
    signal(false);

  protected readonly loadingQuestions =
    signal(false);

  protected readonly saving =
    signal(false);

    private readonly pageTitleService = inject(PageTitleService);

  // ============================================================
  // SELECTION
  // ============================================================

  protected readonly selectedCourseId =
    signal('');

  protected readonly selectedTopicId =
    signal('');

  // ============================================================
  // REGISTERED QUESTION BANK
  // ============================================================

  /**
   * Controls visibility of the registered question-bank
   * selector.
   *
   * Default is false so the selector is hidden until
   * the administrator needs it.
   */
  protected readonly showQuestionBankSelector =
    signal(false);

  /**
   * Currently selected registered question bank.
   */
  protected readonly selectedImportBank =
    signal('csa');

  /**
   * Registered question banks.
   */
  protected readonly questionBanks =
    TEST_QUESTION_BANKS;

  // ============================================================
  // BROWSER UPLOAD STATE
  // ============================================================

  /**
   * Stores a validated question bank temporarily.
   *
   * Nothing is written to Firestore until the administrator
   * explicitly confirms the import.
   */
  protected readonly pendingQuestionBank =
    signal<{
      fileName: string;
      records: TestQuestionImportRecord[];
      topics: TestQuestionImportTopic[];
    } | null>(null);

  // ============================================================
  // FORM STATE
  // ============================================================

  protected readonly showForm =
    signal(false);

  protected readonly editingQuestionId =
    signal<string | null>(null);

  protected form: QuestionForm =
    this.createEmptyForm();

  // ============================================================
  // COMPUTED-STYLE HELPERS
  // ============================================================

  protected selectedCourseName(): string {
    const course =
      this.courses().find(
        (item) =>
          item.id === this.selectedCourseId(),
      );

    return course?.name ?? '';
  }

  protected selectedTopicName(): string {
    const topic =
      this.topics().find(
        (item) =>
          item.id === this.selectedTopicId(),
      );

    return topic?.name ?? '';
  }

  protected selectedImportBankDescription(): string {
    const bank =
      this.questionBanks.find(
        (item) =>
          item.id === this.selectedImportBank(),
      );

    return bank?.description ?? '';
  }

  // ============================================================
  // QUESTION BANK TOGGLE
  // ============================================================

  protected toggleQuestionBankSelector(): void {
    this.showQuestionBankSelector.update(
      (visible) => !visible,
    );
  }

  // ============================================================
  // UPLOADED QUESTION BANK COUNTS
  // ============================================================

  private pendingRecords(): TestQuestionImportRecord[] {
    return (
      this.pendingQuestionBank()?.records ?? []
    );
  }

  protected uploadedPublishedCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.status === 'published',
    ).length;
  }

  protected uploadedDraftCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.status === 'draft',
    ).length;
  }

  protected uploadedArchivedCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.status === 'archived',
    ).length;
  }

  protected uploadedEasyCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.difficulty === 'easy',
    ).length;
  }

  protected uploadedMediumCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.difficulty === 'medium',
    ).length;
  }

  protected uploadedHardCount(): number {
    return this.pendingRecords().filter(
      (record) =>
        record.difficulty === 'hard',
    ).length;
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
     this.pageTitleService.setTitle('Question Bank');
  }

  // ============================================================
  // COURSE LOADING
  // ============================================================

  private async loadCourses(): Promise<void> {
    try {
      this.loadingCourses.set(true);

      const courses =
        await this.courseService.getActiveCourses();

      this.courses.set(courses);
    } catch (error) {
      console.error(
        'Failed to load Test Center courses:',
        error,
      );

      this.toast.error(
        'We could not load the Test Center courses.',
      );
    } finally {
      this.loadingCourses.set(false);
    }
  }

  // ============================================================
  // COURSE CHANGE
  // ============================================================

  async onCourseChange(
    courseId: string,
  ): Promise<void> {
    this.selectedCourseId.set(courseId);

    this.selectedTopicId.set('');

    this.topics.set([]);

    this.questions.set([]);

    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form =
      this.createEmptyForm();

    /*
     * A pending upload belongs to the course that was
     * selected when the file was validated.
     *
     * Clear it when changing courses to prevent importing
     * a file into the wrong course.
     */
    this.pendingQuestionBank.set(null);

    if (!courseId) {
      return;
    }

    try {
      this.loadingTopics.set(true);

      const topics =
        await this.topicService.getAllTopics(
          courseId,
        );

      this.topics.set(topics);
    } catch (error) {
      console.error(
        'Failed to load Test Center topics:',
        error,
      );

      this.toast.error(
        'We could not load the topics for this course.',
      );
    } finally {
      this.loadingTopics.set(false);
    }
  }

  // ============================================================
  // TOPIC CHANGE
  // ============================================================

  async onTopicChange(
    topicId: string,
  ): Promise<void> {
    this.selectedTopicId.set(topicId);

    this.questions.set([]);

    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form =
      this.createEmptyForm();

    if (!topicId) {
      return;
    }

    await this.loadQuestions();
  }

  // ============================================================
  // QUESTION LOADING
  // ============================================================

  private async loadQuestions(): Promise<void> {
    const topicId =
      this.selectedTopicId();

    if (!topicId) {
      return;
    }

    try {
      this.loadingQuestions.set(true);

      const questions =
        await this.questionService
          .getAllQuestionsForTopic(
            topicId,
          );

      this.questions.set(questions);
    } catch (error) {
      console.error(
        'Failed to load Test Center questions:',
        error,
      );

      this.questions.set([]);

      this.toast.error(
        'We could not load the questions for this topic.',
      );
    } finally {
      this.loadingQuestions.set(false);
    }
  }

  // ============================================================
  // REFRESH TOPICS
  // ============================================================

  private async refreshTopics(
    courseId: string,
  ): Promise<void> {
    try {
      const topics =
        await this.topicService.getAllTopics(
          courseId,
        );

      this.topics.set(topics);
    } catch (error) {
      console.error(
        'Failed to refresh Test Center topics:',
        error,
      );
    }
  }

  // ============================================================
  // CREATE
  // ============================================================

  startNewQuestion(): void {
    if (
      !this.selectedCourseId() ||
      !this.selectedTopicId()
    ) {
      this.toast.error(
        'Select a course and topic first.',
      );

      return;
    }

    this.editingQuestionId.set(null);

    this.form =
      this.createEmptyForm();

    this.showForm.set(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // EDIT
  // ============================================================

  editQuestion(
    question: TestQuestion,
  ): void {
    this.editingQuestionId.set(
      question.id,
    );

    this.form = {
      question: question.question,

      type: question.type,

      options:
        question.options.map(
          (option) => ({
            id: option.id,
            text: option.text,
          }),
        ),

      correctAnswer:
        question.correctAnswer,

      explanation:
        question.explanation ?? '',

      hint:
        question.hint ?? '',

      difficulty:
        question.difficulty,

      tagsText:
        question.tags.join(', '),

      sourceType:
        question.sourceType,

      sourceReference:
        question.sourceReference ?? '',

      status:
        question.status,
    };

    this.showForm.set(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // QUESTION TYPE
  // ============================================================

  onQuestionTypeChange(): void {
    if (
      this.form.type ===
      'true-false'
    ) {
      this.form.options = [
        {
          id: 'true',
          text: 'True',
        },
        {
          id: 'false',
          text: 'False',
        },
      ];

      if (
        this.form.correctAnswer !== 'true' &&
        this.form.correctAnswer !== 'false'
      ) {
        this.form.correctAnswer =
          'true';
      }

      return;
    }

    if (
      this.form.options.length < 2 ||
      this.isTrueFalseOptions()
    ) {
      this.form.options = [
        {
          id: 'option-a',
          text: '',
        },
        {
          id: 'option-b',
          text: '',
        },
        {
          id: 'option-c',
          text: '',
        },
        {
          id: 'option-d',
          text: '',
        },
      ];

      this.form.correctAnswer =
        'option-a';
    }
  }

  private isTrueFalseOptions(): boolean {
    return (
      this.form.options.length === 2 &&
      this.form.options[0]?.id === 'true' &&
      this.form.options[1]?.id === 'false'
    );
  }

  // ============================================================
  // REGISTERED QUESTION BANK
  // ============================================================

  private getSelectedQuestionBank() {
    return this.questionBanks.find(
      (bank) =>
        bank.id === this.selectedImportBank(),
    );
  }

  // ============================================================
  // OPTIONS
  // ============================================================

  addOption(): void {
    const nextIndex =
      this.form.options.length;

    const id =
      `option-${this.indexToLetter(nextIndex)}`;

    this.form.options.push({
      id,
      text: '',
    });
  }

  removeOption(
    index: number,
  ): void {
    if (
      this.form.options.length <= 2
    ) {
      return;
    }

    const removed =
      this.form.options[index];

    this.form.options.splice(index, 1);

    if (
      removed &&
      this.form.correctAnswer ===
        removed.id
    ) {
      this.form.correctAnswer =
        this.form.options[0]?.id ?? '';
    }
  }

  optionLetter(
    index: number,
  ): string {
    return this.indexToLetter(
      index,
    ).toUpperCase();
  }

  private indexToLetter(
    index: number,
  ): string {
    return String.fromCharCode(
      97 + index,
    );
  }

  // ============================================================
  // SAVE QUESTION
  // ============================================================

  async saveQuestion(): Promise<void> {
    const validationError =
      this.validateForm();

    if (validationError) {
      this.toast.error(
        validationError,
      );

      return;
    }

    const courseId =
      this.selectedCourseId();

    const topicId =
      this.selectedTopicId();

    if (!courseId || !topicId) {
      this.toast.error(
        'Select a course and topic first.',
      );

      return;
    }

    try {
      this.saving.set(true);

      const payload:
        Omit<
          TestQuestion,
          'id' |
          'createdAt' |
          'updatedAt'
        > = {
        courseId,

        topicId,

        question:
          this.form.question.trim(),

        type:
          this.form.type,

        options:
          this.form.options.map(
            (option) => ({
              id: option.id,
              text: option.text.trim(),
            }),
          ),

        correctAnswer:
          this.form.correctAnswer,

        difficulty:
          this.form.difficulty,

        tags:
          this.parseTags(
            this.form.tagsText,
          ),

        sourceType:
          this.form.sourceType,

        status:
          this.form.status,
      };

      const explanation =
        this.form.explanation.trim();

      if (explanation) {
        payload.explanation =
          explanation;
      }

      const hint =
        this.form.hint.trim();

      if (hint) {
        payload.hint =
          hint;
      }

      const sourceReference =
        this.form.sourceReference.trim();

      if (sourceReference) {
        payload.sourceReference =
          sourceReference;
      }

      const questionId =
        this.editingQuestionId();

      if (questionId) {
        await this.questionService
          .updateQuestion(
            questionId,
            payload,
          );

        this.toast.success(
          'Question updated successfully.',
        );
      } else {
        await this.questionService
          .createQuestion(
            payload,
          );

        this.toast.success(
          'Question created successfully.',
        );
      }

      this.showForm.set(false);

      this.editingQuestionId.set(
        null,
      );

      this.form =
        this.createEmptyForm();

      await this.loadQuestions();
    } catch (error) {
      console.error(
        'Failed to save Test Center question:',
        error,
      );

      this.toast.error(
        'We could not save the question. Please try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  private validateForm(): string | null {
    if (
      !this.form.question.trim()
    ) {
      return 'Question text is required.';
    }

    const options =
      this.form.options;

    if (options.length < 2) {
      return 'At least two answer options are required.';
    }

    const emptyOption =
      options.some(
        (option) =>
          !option.text.trim(),
      );

    if (emptyOption) {
      return 'Every answer option must contain text.';
    }

    if (
      !this.form.correctAnswer
    ) {
      return 'Select the correct answer.';
    }

    const correctOption =
      options.some(
        (option) =>
          option.id ===
          this.form.correctAnswer,
      );

    if (!correctOption) {
      return 'The selected correct answer is invalid.';
    }

    if (!this.form.difficulty) {
      return 'Select a difficulty.';
    }

    if (!this.form.sourceType) {
      return 'Select a source type.';
    }

    if (!this.form.status) {
      return 'Select a question status.';
    }

    return null;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteQuestion(
    question: TestQuestion,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        'Delete this question? This action cannot be undone.',
      );

    if (!confirmed) {
      return;
    }

    try {
      await this.questionService
        .deleteQuestion(
          question.id,
        );

      this.toast.success(
        'Question deleted successfully.',
      );

      await this.loadQuestions();
    } catch (error) {
      console.error(
        'Failed to delete Test Center question:',
        error,
      );

      this.toast.error(
        'We could not delete the question. Please try again.',
      );
    }
  }

  // ============================================================
  // CANCEL FORM
  // ============================================================

  cancelForm(): void {
    this.showForm.set(false);

    this.editingQuestionId.set(
      null,
    );

    this.form =
      this.createEmptyForm();
  }

  // ============================================================
  // FORM FACTORY
  // ============================================================

  private createEmptyForm(): QuestionForm {
    return {
      question: '',

      type: 'multiple-choice',

      options: [
        {
          id: 'option-a',
          text: '',
        },
        {
          id: 'option-b',
          text: '',
        },
        {
          id: 'option-c',
          text: '',
        },
        {
          id: 'option-d',
          text: '',
        },
      ],

      correctAnswer:
        'option-a',

      explanation: '',

      hint: '',

      difficulty:
        'medium',

      tagsText: '',

      sourceType:
        'original',

      sourceReference: '',

      status:
        'draft',
    };
  }

  // ============================================================
  // TAG PARSING
  // ============================================================

  private parseTags(
    value: string,
  ): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map(
            (tag) =>
              tag.trim().toLowerCase(),
          )
          .filter(Boolean),
      ),
    ];
  }

  // ============================================================
  // BROWSER QUESTION BANK UPLOAD
  // ============================================================

  protected async onQuestionBankFileSelected(
    event: Event,
  ): Promise<void> {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    try {
      /*
       * We use importing here to disable the upload
       * controls while the file is being read and
       * validated.
       *
       * No Firestore operation happens in this method.
       */
      this.importing.set(true);

      if (
        !file.name
          .toLowerCase()
          .endsWith('.json')
      ) {
        throw new Error(
          'Please select a JSON question-bank file.',
        );
      }

      const fileText =
        await file.text();

      let parsed: unknown;

      try {
        parsed =
          JSON.parse(fileText);
      } catch {
        throw new Error(
          'The selected file contains invalid JSON.',
        );
      }

      const records =
        this.validateUploadedQuestionBank(
          parsed,
        );

      const topics =
        this.buildUploadedTopicDefinitions(
          records,
        );

      this.pendingQuestionBank.set({
        fileName:
          file.name,

        records,

        topics,
      });

      this.toast.success(
        `Question bank validated successfully: ${records.length} questions.`,
      );
    } catch (error) {
      console.error(
        'Failed to validate uploaded question bank:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'We could not validate the question bank.';

      this.pendingQuestionBank.set(
        null,
      );

      this.toast.error(
        message,
      );
    } finally {
      this.importing.set(false);

      /*
       * Allow the same file to be selected again.
       */
      input.value = '';
    }
  }

  // ============================================================
  // UPLOADED BANK VALIDATION
  // ============================================================

  private validateUploadedQuestionBank(
    value: unknown,
  ): TestQuestionImportRecord[] {
    if (!Array.isArray(value)) {
      throw new Error(
        'The question bank must contain a top-level JSON array.',
      );
    }

    if (value.length === 0) {
      throw new Error(
        'The question bank is empty.',
      );
    }

    const errors: string[] = [];

    const seedIds =
      new Set<string>();

    const records:
      TestQuestionImportRecord[] = [];

    for (
      let index = 0;
      index < value.length;
      index++
    ) {
      const raw =
        value[index];

      const label =
        `Question ${index + 1}`;

      if (
        !this.isRecord(
          raw,
        )
      ) {
        errors.push(
          `${label}: record must be a JSON object.`,
        );

        if (errors.length >= 50) {
          break;
        }

        continue;
      }

      const seedId =
        this.readString(
          raw,
          'seedId',
        );

      const topicKey =
        this.readString(
          raw,
          'topicKey',
        );

      const question =
        this.readString(
          raw,
          'question',
        );

      const type =
        this.readString(
          raw,
          'type',
        );

      const correctAnswer =
        this.readString(
          raw,
          'correctAnswer',
        );

      const difficulty =
        this.readString(
          raw,
          'difficulty',
        );

      const sourceType =
        this.readString(
          raw,
          'sourceType',
        );

      const status =
        this.readString(
          raw,
          'status',
        );

      /*
       * seedId
       */

      if (!seedId) {
        errors.push(
          `${label}: seedId is required.`,
        );
      } else if (
        seedIds.has(seedId)
      ) {
        errors.push(
          `${seedId}: duplicate seedId.`,
        );
      } else {
        seedIds.add(seedId);
      }

      /*
       * topicKey
       */

      if (!topicKey) {
        errors.push(
          `${label}: topicKey is required.`,
        );
      }

      /*
       * question
       */

      if (!question) {
        errors.push(
          `${label}: question text is required.`,
        );
      }

      /*
       * type
       */

      if (
        type !==
          'multiple-choice' &&
        type !==
          'true-false'
      ) {
        errors.push(
          `${label}: type must be multiple-choice or true-false.`,
        );
      }

      /*
       * options
       */

      const rawOptions =
        raw['options'];

      let validOptions =
        false;

      if (
        !Array.isArray(
          rawOptions,
        ) ||
        rawOptions.length < 2
      ) {
        errors.push(
          `${label}: at least two options are required.`,
        );
      } else {
        const optionIds =
          new Set<string>();

        const options:
          {
            id: string;
            text: string;
          }[] = [];

        for (
          let optionIndex = 0;
          optionIndex <
            rawOptions.length;
          optionIndex++
        ) {
          const rawOption =
            rawOptions[
              optionIndex
            ];

          if (
            !this.isRecord(
              rawOption,
            )
          ) {
            errors.push(
              `${label}: option ${optionIndex + 1} must be an object.`,
            );

            continue;
          }

          const id =
            this.readString(
              rawOption,
              'id',
            );

          const text =
            this.readString(
              rawOption,
              'text',
            );

          if (!id) {
            errors.push(
              `${label}: option ${optionIndex + 1} is missing id.`,
            );
          }

          if (!text) {
            errors.push(
              `${label}: option ${optionIndex + 1} is missing text.`,
            );
          }

          if (
            id &&
            optionIds.has(id)
          ) {
            errors.push(
              `${label}: duplicate option id "${id}".`,
            );
          }

          if (id) {
            optionIds.add(id);
          }

          options.push({
            id,
            text,
          });
        }

        if (
          correctAnswer &&
          !optionIds.has(
            correctAnswer,
          )
        ) {
          errors.push(
            `${label}: correctAnswer "${correctAnswer}" does not match an option id.`,
          );
        }

        if (
          options.length >= 2 &&
          options.every(
            (option) =>
              !!option.id &&
              !!option.text,
          )
        ) {
          validOptions = true;
        }
      }

      /*
       * correctAnswer
       */

      if (!correctAnswer) {
        errors.push(
          `${label}: correctAnswer is required.`,
        );
      }

      /*
       * difficulty
       */

      if (
        difficulty !== 'easy' &&
        difficulty !== 'medium' &&
        difficulty !== 'hard'
      ) {
        errors.push(
          `${label}: difficulty must be easy, medium, or hard.`,
        );
      }

      /*
       * tags
       */

      const rawTags =
        raw['tags'];

      let validTags =
        true;

      if (
        !Array.isArray(
          rawTags,
        )
      ) {
        errors.push(
          `${label}: tags must be an array of strings.`,
        );

        validTags = false;
      } else if (
        rawTags.some(
          (tag) =>
            typeof tag !==
            'string',
        )
      ) {
        errors.push(
          `${label}: every tag must be a string.`,
        );

        validTags = false;
      }

      /*
       * sourceType
       */

      if (
        sourceType !==
          'original' &&
        sourceType !==
          'licensed'
      ) {
        errors.push(
          `${label}: sourceType must be original or licensed.`,
        );
      }

      /*
       * status
       */

      if (
        status !== 'draft' &&
        status !== 'published' &&
        status !== 'archived'
      ) {
        errors.push(
          `${label}: status must be draft, published, or archived.`,
        );
      }

      /*
       * Stop collecting detailed validation errors
       * after 50.
       */

      if (
        errors.length >= 50
      ) {
        break;
      }

      /*
       * Only add the record when the fields necessary
       * for the importer are valid.
       *
       * The importer itself performs a second validation
       * before writing to Firestore.
       */

      if (
        seedId &&
        topicKey &&
        question &&
        correctAnswer &&
        validOptions &&
        validTags &&
        (
          type ===
            'multiple-choice' ||
          type ===
            'true-false'
        ) &&
        (
          difficulty ===
            'easy' ||
          difficulty ===
            'medium' ||
          difficulty ===
            'hard'
        ) &&
        (
          sourceType ===
            'original' ||
          sourceType ===
            'licensed'
        ) &&
        (
          status ===
            'draft' ||
          status ===
            'published' ||
          status ===
            'archived'
        )
      ) {
        const options =
          raw['options'] as {
            id: string;
            text: string;
          }[];

        const tags =
          raw['tags'] as string[];

        const record: TestQuestionImportRecord =
          {
            seedId,

            topicKey,

            question,

            type:
              type as TestQuestionType,

            options:

              options.map(
                (option) => ({
                  id: option.id,
                  text: option.text,
                }),
              ),

            correctAnswer,

            explanation:
              this.optionalString(
                raw,
                'explanation',
              ),

            hint:
              this.optionalString(
                raw,
                'hint',
              ),

            difficulty:
              difficulty as TestQuestionDifficulty,

            tags:
              tags
                .map(
                  (tag) =>
                    tag.trim().toLowerCase(),
                )
                .filter(Boolean),

            sourceType:
              sourceType as
                | 'original'
                | 'licensed',

            sourceReference:
              this.optionalString(
                raw,
                'sourceReference',
              ),

            status:
              status as
                | 'draft'
                | 'published'
                | 'archived',
          };

        records.push(
          record,
        );
      }
    }

    if (
      errors.length > 0
    ) {
      const displayErrors =
        errors.slice(0, 50);

      throw new Error(
        [
          'Question bank validation failed:',
          '',
          ...displayErrors,
          '',
          errors.length >= 50
            ? 'Validation stopped after 50 errors.'
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }

    if (
      records.length !==
      value.length
    ) {
      throw new Error(
        'The question bank contains one or more invalid records.',
      );
    }

    return records;
  }

  // ============================================================
  // TOPIC DEFINITIONS FOR UPLOADED BANK
  // ============================================================

  private buildUploadedTopicDefinitions(
    records:
      readonly TestQuestionImportRecord[],
  ): TestQuestionImportTopic[] {
    const definitions =
      new Map<
        string,
        TestQuestionImportTopic
      >();

    for (const record of records) {
      const key =
        record.topicKey.trim();

      if (!key) {
        continue;
      }

      if (
        definitions.has(key)
      ) {
        continue;
      }

      /*
       * First attempt to match an existing topic in the
       * currently selected course.
       */

      const existing =
        this.topics().find(
          (topic) =>
            topic.slug
              ?.trim()
              .toLowerCase() ===
              key.toLowerCase() ||
            topic.name
              ?.trim()
              .toLowerCase() ===
              key.toLowerCase(),
        );

      if (existing) {
        definitions.set(
          key,
          {
            key,
            name:
              existing.name,
            slug:
              existing.slug,
            description:
              existing.description,
          },
        );

        continue;
      }

      /*
       * Otherwise derive a human-readable name and slug
       * from the uploaded topic key.
       */

      const name =
        this.topicKeyToName(
          key,
        );

      const slug =
        this.normalizeSlug(
          key,
        );

      definitions.set(
        key,
        {
          key,
          name,
          slug,
        },
      );
    }

    return [
      ...definitions.values(),
    ];
  }

  // ============================================================
  // TOPIC NAME HELPERS
  // ============================================================

  private topicKeyToName(
    value: string,
  ): string {
    return value
      .replace(
        /[-_]+/g,
        ' ',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      );
  }

  private normalizeSlug(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '');
  }

  // ============================================================
  // TYPE HELPERS
  // ============================================================

  private isRecord(
    value: unknown,
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value ===
        'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }

  private readString(
    record:
      Record<string, unknown>,
    key: string,
  ): string {
    const value =
      record[key];

    return typeof value ===
      'string'
      ? value.trim()
      : '';
  }

  private optionalString(
    record:
      Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value =
      this.readString(
        record,
        key,
      );

    return value || undefined;
  }

  // ============================================================
  // CONFIRM UPLOADED QUESTION BANK
  // ============================================================

  protected async confirmUploadedQuestionBank(): Promise<void> {
    const pending =
      this.pendingQuestionBank();

    const courseId =
      this.selectedCourseId();

    if (!pending) {
      this.toast.error(
        'There is no uploaded question bank waiting for import.',
      );

      return;
    }

    if (!courseId) {
      this.toast.error(
        'Please select a course before importing the question bank.',
      );

      return;
    }

    if (this.importing()) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          'Import this question bank?',
          '',
          `File: ${pending.fileName}`,
          `Course: ${this.selectedCourseName()}`,
          `Questions: ${pending.records.length}`,
          `Topics: ${pending.topics.length}`,
          `Published: ${this.uploadedPublishedCount()}`,
          `Draft: ${this.uploadedDraftCount()}`,
          `Archived: ${this.uploadedArchivedCount()}`,
          '',
          'Existing matching topics will be reused.',
          'Missing topics will be created automatically.',
          'Questions with the same seedId will be updated rather than duplicated.',
          '',
          'Continue?',
        ].join('\n'),
      );

    if (!confirmed) {
      return;
    }

    try {
      this.importing.set(true);

      const result =
        await this.questionImportService
          .importQuestionBank(
            courseId,
            pending.topics,
            pending.records,
          );

      if (
        result.failed > 0
      ) {
        this.toast.warning(
          `Question bank import completed with ${result.failed} failed question(s).`,
        );
      } else {
        this.toast.success(
          `Question bank imported successfully. ` +
            `${result.created} created. ` +
            `${result.updated} updated. ` +
            `${result.topicsCreated} topics created. ` +
            `${result.topicsExisting} topics reused.`,
        );
      }

      /*
       * Refresh topics because the importer may have created
       * new topics.
       */

      await this.refreshTopics(
        courseId,
      );

      /*
       * Refresh the currently selected topic if one exists.
       */

      if (
        this.selectedTopicId()
      ) {
        await this.loadQuestions();
      }

      /*
       * Clear the pending upload only after the import
       * operation has completed.
       */

      this.pendingQuestionBank.set(
        null,
      );
    } catch (error) {
      console.error(
        'Failed to import uploaded question bank:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'We could not import the uploaded question bank.';

      this.toast.error(
        message,
      );
    } finally {
      this.importing.set(false);
    }
  }

  // ============================================================
  // CANCEL UPLOADED QUESTION BANK
  // ============================================================

  protected cancelUploadedQuestionBank(): void {
    if (this.importing()) {
      return;
    }

    this.pendingQuestionBank.set(
      null,
    );

    this.toast.info(
      'Uploaded question bank discarded.',
    );
  }

  // ============================================================
  // REGISTERED QUESTION BANK IMPORT
  // ============================================================

  protected async importQuestionBank(): Promise<void> {
    const courseId =
      this.selectedCourseId();

    if (!courseId) {
      this.toast.error(
        'Please select a course before importing a question bank.',
      );

      return;
    }

    if (this.importing()) {
      return;
    }

    const courseName =
      this.selectedCourseName();

    const bank =
      this.getSelectedQuestionBank();

    if (!bank) {
      this.toast.error(
        'The selected question bank could not be found.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        [
          `Import the ${bank.name} question bank into "${courseName}"?`,
          '',
          `This will process ${bank.questions.length} questions.`,
          '',
          'Topics will be created automatically if they do not already exist.',
          '',
          'Existing questions with the same import ID will be updated.',
        ].join('\n'),
      );

    if (!confirmed) {
      return;
    }

    try {
      this.importing.set(true);

      const result =
        await this.questionImportService
          .importQuestionBank(
            courseId,
            bank.topics,
            bank.questions,
          );

      if (
        result.failed > 0
      ) {
        this.toast.warning(
          `${bank.name} import completed with ${result.failed} failed question(s).`,
        );
      } else {
        this.toast.success(
          `${bank.name} question bank imported successfully: ` +
            `${result.created} created, ` +
            `${result.updated} updated, ` +
            `${result.topicsCreated} topics created, ` +
            `${result.topicsExisting} topics reused.`,
        );
      }

      /*
       * Refresh topics because the registered bank may have
       * created new topics.
       */

      await this.refreshTopics(
        courseId,
      );

      /*
       * Refresh the current topic if one is selected.
       */

      if (
        this.selectedTopicId()
      ) {
        await this.loadQuestions();
      }
    } catch (error) {
      console.error(
        `Failed to import ${bank.name} question bank:`,
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : `Unable to import the ${bank.name} question bank.`;

      this.toast.error(
        message,
      );
    } finally {
      this.importing.set(false);
    }
  }
}

// ================================================================
// LOCAL FORM MODEL
// ================================================================

interface QuestionForm {
  question: string;

  type: TestQuestionType;

  options: TestQuestionOption[];

  correctAnswer: string;

  explanation: string;

  hint: string;

  difficulty: TestQuestionDifficulty;

  tagsText: string;

  sourceType:
    | 'original'
    | 'licensed';

  sourceReference: string;

  status:
    | 'draft'
    | 'published'
    | 'archived';
}