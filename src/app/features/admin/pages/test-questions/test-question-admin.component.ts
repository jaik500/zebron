import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { TestQuestionImportService } from '../../../test-center/services/test-question-import.service';

@Component({
  selector: 'app-test-question-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <!-- ============================================================
           PAGE HEADER
           ============================================================ -->
      <div class="mx-auto max-w-7xl">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <a routerLink="/admin" class="transition hover:text-teal-600"> Admin </a>

              <span>/</span>

              <a routerLink="/admin/test-center/topics" class="transition hover:text-teal-600">
                Test Center
              </a>

              <span>/</span>

              <span class="text-gray-700"> Questions </span>
            </div>

            <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Question Bank
            </h1>

            <p class="mt-1 text-sm text-gray-600">
              Create, edit, publish, and manage Test Center questions.
            </p>
          </div>

        <div class="flex flex-wrap items-center gap-2">

  <!-- ============================================================
       QUESTION BANK SELECTOR
       ============================================================ -->
            <!-- Question Bank -->
            <div>
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
                class="w-full rounded-lg border border-gray-300 bg-white
                       px-3 py-2.5 text-sm text-gray-900
                       outline-none transition
                       focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                       disabled:cursor-not-allowed disabled:opacity-50"
              >
                @for (bank of questionBanks; track bank.id) {
                  <option [value]="bank.id">
                    {{ bank.name }} — {{ bank.questions.length }} Questions
                  </option>
                }
              </select>

              @if (selectedImportBank()) {
                @for (bank of questionBanks; track bank.id) {
                  @if (bank.id === selectedImportBank()) {
                    @if (bank.description) {
                      <p class="mt-1.5 text-xs text-gray-500">
                        {{ bank.description }}
                      </p>
                    }
                  }
                }
              }
            </div>

  <!-- ============================================================
       IMPORT QUESTION BANK
       ============================================================ -->
  <button
    type="button"
    (click)="importQuestionBank()"
    [disabled]="!selectedCourseId() || importing()"
    class="inline-flex items-center justify-center rounded-lg
           border border-teal-200 bg-teal-50
           px-4 py-2.5 text-sm font-semibold text-teal-700
           transition hover:bg-teal-100
           disabled:cursor-not-allowed disabled:opacity-50"
  >
    @if (importing()) {
      <span>Importing...</span>
    } @else {
      <span>Import Question Bank</span>
    }
  </button>

  <!-- ============================================================
       ADD QUESTION
       ============================================================ -->
  <button
    type="button"
    (click)="startNewQuestion()"
    [disabled]="!selectedCourseId() || !selectedTopicId()"
    class="inline-flex items-center justify-center rounded-lg
           bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white
           shadow-sm transition hover:bg-teal-700
           disabled:cursor-not-allowed disabled:opacity-50"
  >
    + Add Question
  </button>

</div>
        </div>

        <!-- ============================================================
             COURSE / TOPIC FILTER
             ============================================================ -->
        <section class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900">Question Bank Selection</h2>

            <p class="mt-1 text-sm text-gray-500">
              Select a course and topic to manage its questions.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- Course -->
            <div>
              <label for="course" class="mb-1.5 block text-sm font-medium text-gray-700">
                Course <span class="text-red-500">*</span>
              </label>

              <select
                id="course"
                name="course"
                [ngModel]="selectedCourseId()"
                (ngModelChange)="onCourseChange($event)"
                class="w-full rounded-lg border border-gray-300 bg-white
                       px-3 py-2.5 text-sm text-gray-900
                       outline-none transition
                       focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">Select a course</option>

                @for (course of courses(); track course.id) {
                  <option [value]="course.id">
                    {{ course.name }}
                  </option>
                }
              </select>
            </div>

            <!-- Topic -->
            <div>
              <label for="topic" class="mb-1.5 block text-sm font-medium text-gray-700">
                Topic <span class="text-red-500">*</span>
              </label>

              <select
                id="topic"
                name="topic"
                [ngModel]="selectedTopicId()"
                (ngModelChange)="onTopicChange($event)"
                [disabled]="!selectedCourseId() || loadingTopics()"
                class="w-full rounded-lg border border-gray-300 bg-white
                       px-3 py-2.5 text-sm text-gray-900
                       outline-none transition
                       focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                       disabled:cursor-not-allowed disabled:bg-gray-100"
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
              <span class="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700">
                {{ selectedCourseName() }}
              </span>

              <span class="text-gray-400"> → </span>

              <span class="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                {{ selectedTopicName() }}
              </span>

              <span class="text-gray-500">
                {{ questions().length }}
                {{ questions().length === 1 ? 'question' : 'questions' }}
              </span>
            </div>
          }
        </section>

        <!-- ============================================================
             LOADING
             ============================================================ -->
        @if (loadingQuestions()) {
          <div class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div
              class="mx-auto h-8 w-8 animate-spin rounded-full
                     border-4 border-gray-200 border-t-teal-600"
            ></div>

            <p class="mt-3 text-sm text-gray-500">Loading questions...</p>
          </div>
        } @else if (!selectedCourseId() || !selectedTopicId()) {
          <!-- Empty selection state -->
          <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <span class="text-xl text-teal-600">?</span>
            </div>

            <h2 class="mt-4 text-base font-semibold text-gray-900">Select a course and topic</h2>

            <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Choose the course and topic above to view and manage its question bank.
            </p>
          </div>
        } @else if (questions().length === 0) {
          <!-- No questions -->
          <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
            >
              <span class="text-xl text-gray-500">?</span>
            </div>

            <h2 class="mt-4 text-base font-semibold text-gray-900">No questions yet</h2>

            <p class="mx-auto mt-1 max-w-md text-sm text-gray-500">
              This topic does not have any questions yet. Create the first question to populate the
              question bank.
            </p>

            <button
              type="button"
              (click)="startNewQuestion()"
              class="mt-5 rounded-lg bg-teal-600 px-4 py-2.5
                     text-sm font-semibold text-white
                     transition hover:bg-teal-700"
            >
              Add First Question
            </button>
          </div>
        } @else {
          <!-- ============================================================
               QUESTION LIST
               ============================================================ -->
          <div class="space-y-4">
            @for (question of questions(); track question.id; let i = $index) {
              <article
                class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                       transition hover:shadow-md"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Question {{ i + 1 }}
                      </span>

                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-medium"
                        [class.bg-green-50]="question.status === 'published'"
                        [class.text-green-700]="question.status === 'published'"
                        [class.bg-yellow-50]="question.status === 'draft'"
                        [class.text-yellow-700]="question.status === 'draft'"
                        [class.bg-gray-100]="question.status === 'archived'"
                        [class.text-gray-600]="question.status === 'archived'"
                      >
                        {{ question.status }}
                      </span>

                      <span
                        class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      >
                        {{ question.difficulty }}
                      </span>

                      <span
                        class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                      >
                        {{
                          question.type === 'multiple-choice' ? 'Multiple Choice' : 'True / False'
                        }}
                      </span>
                    </div>

                    <h3 class="text-base font-semibold leading-6 text-gray-900">
                      {{ question.question }}
                    </h3>

                    <!-- Options preview -->
                    <div class="mt-4 grid gap-2 sm:grid-cols-2">
                      @for (option of question.options; track option.id) {
                        <div
                          class="rounded-lg border px-3 py-2 text-sm"
                          [class.border-green-200]="option.id === question.correctAnswer"
                          [class.bg-green-50]="option.id === question.correctAnswer"
                          [class.text-green-800]="option.id === question.correctAnswer"
                          [class.border-gray-200]="option.id !== question.correctAnswer"
                          [class.bg-gray-50]="option.id !== question.correctAnswer"
                          [class.text-gray-700]="option.id !== question.correctAnswer"
                        >
                          <span class="font-medium">
                            {{ option.text }}
                          </span>

                          @if (option.id === question.correctAnswer) {
                            <span class="ml-1 text-xs font-semibold text-green-600">
                              ✓ Correct
                            </span>
                          }
                        </div>
                      }
                    </div>

                    <!-- Metadata -->
                    <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span> Source: {{ question.sourceType }} </span>

                      @if (question.tags.length > 0) {
                        <span> Tags: {{ question.tags.join(', ') }} </span>
                      }
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex shrink-0 gap-2">
                    <button
                      type="button"
                      (click)="editQuestion(question)"
                      class="rounded-lg border border-gray-300 px-3 py-2
                             text-sm font-medium text-gray-700
                             transition hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteQuestion(question)"
                      class="rounded-lg border border-red-200 px-3 py-2
                             text-sm font-medium text-red-600
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
          <section class="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
            <!-- Form header -->
            <div
              class="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ editingQuestionId() ? 'Edit Question' : 'Create Question' }}
                </h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ selectedCourseName() }}
                  <span class="mx-1">→</span>
                  {{ selectedTopicName() }}
                </p>
              </div>

              <button
                type="button"
                (click)="cancelForm()"
                class="text-sm font-medium text-gray-500 transition hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            <div class="space-y-6 p-5">
              <!-- ======================================================
                   QUESTION
                   ====================================================== -->
              <div>
                <label for="questionText" class="mb-1.5 block text-sm font-medium text-gray-700">
                  Question <span class="text-red-500">*</span>
                </label>

                <textarea
                  id="questionText"
                  name="questionText"
                  rows="4"
                  [(ngModel)]="form.question"
                  placeholder="Enter the question..."
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5
                         text-sm text-gray-900 outline-none transition
                         focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                ></textarea>
              </div>

              <!-- ======================================================
                   TYPE / DIFFICULTY / STATUS
                   ====================================================== -->
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label for="questionType" class="mb-1.5 block text-sm font-medium text-gray-700">
                    Question Type
                  </label>

                  <select
                    id="questionType"
                    name="questionType"
                    [(ngModel)]="form.type"
                    (ngModelChange)="onQuestionTypeChange()"
                    class="w-full rounded-lg border border-gray-300 bg-white
                           px-3 py-2.5 text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="multiple-choice">Multiple Choice</option>

                    <option value="true-false">True / False</option>
                  </select>
                </div>

                <div>
                  <label for="difficulty" class="mb-1.5 block text-sm font-medium text-gray-700">
                    Difficulty
                  </label>

                  <select
                    id="difficulty"
                    name="difficulty"
                    [(ngModel)]="form.difficulty"
                    class="w-full rounded-lg border border-gray-300 bg-white
                           px-3 py-2.5 text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label for="status" class="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    [(ngModel)]="form.status"
                    class="w-full rounded-lg border border-gray-300 bg-white
                           px-3 py-2.5 text-sm text-gray-900
                           outline-none transition
                           focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <!-- ======================================================
                   ANSWER OPTIONS
                   ====================================================== -->
              <div>
                <div class="mb-3 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900">Answer Options</h3>

                    <p class="mt-1 text-xs text-gray-500">Select the correct answer.</p>
                  </div>

                  @if (form.type === 'multiple-choice') {
                    <button
                      type="button"
                      (click)="addOption()"
                      class="rounded-lg border border-teal-200 px-3 py-2
                             text-xs font-semibold text-teal-700
                             transition hover:bg-teal-50"
                    >
                      + Add Option
                    </button>
                  }
                </div>

                <div class="space-y-3">
                  @for (option of form.options; track option.id; let i = $index) {
                    <div
                      class="flex items-start gap-3 rounded-lg border p-3"
                      [class.border-green-300]="form.correctAnswer === option.id"
                      [class.bg-green-50]="form.correctAnswer === option.id"
                      [class.border-gray-200]="form.correctAnswer !== option.id"
                    >
                      <!-- Correct answer radio -->
                      <div class="pt-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          [value]="option.id"
                          [(ngModel)]="form.correctAnswer"
                          [id]="'correct-' + option.id"
                          class="h-4 w-4 border-gray-300 text-teal-600
                                 focus:ring-teal-500"
                        />
                      </div>

                      <!-- Option letter -->
                      <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center
                               rounded-lg bg-gray-100 text-sm font-semibold text-gray-600"
                      >
                        {{ optionLetter(i) }}
                      </div>

                      <!-- Option text -->
                      <div class="min-w-0 flex-1">
                        <label [for]="'option-' + option.id" class="sr-only">
                          Option {{ optionLetter(i) }}
                        </label>

                        <input
                          [id]="'option-' + option.id"
                          [name]="'option-' + option.id"
                          type="text"
                          [(ngModel)]="option.text"
                          placeholder="Enter answer option..."
                          class="w-full rounded-lg border border-gray-300
                                 px-3 py-2 text-sm text-gray-900
                                 outline-none transition
                                 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />

                        @if (form.correctAnswer === option.id) {
                          <p class="mt-1 text-xs font-medium text-green-700">Correct answer</p>
                        }
                      </div>

                      <!-- Remove -->
                      @if (form.type === 'multiple-choice' && form.options.length > 2) {
                        <button
                          type="button"
                          (click)="removeOption(i)"
                          class="mt-1 rounded-md p-1.5 text-gray-400
                                 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- ======================================================
                   EXPLANATION / HINT
                   ====================================================== -->
              <div class="grid gap-5 md:grid-cols-2">
                <div>
                  <label for="explanation" class="mb-1.5 block text-sm font-medium text-gray-700">
                    Explanation
                  </label>

                  <textarea
                    id="explanation"
                    name="explanation"
                    rows="4"
                    [(ngModel)]="form.explanation"
                    placeholder="Explain why the correct answer is correct..."
                    class="w-full rounded-lg border border-gray-300 px-3 py-2.5
                           text-sm text-gray-900 outline-none transition
                           focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  ></textarea>
                </div>

                <div>
                  <label for="hint" class="mb-1.5 block text-sm font-medium text-gray-700">
                    Hint
                  </label>

                  <textarea
                    id="hint"
                    name="hint"
                    rows="4"
                    [(ngModel)]="form.hint"
                    placeholder="Optional answer-neutral hint..."
                    class="w-full rounded-lg border border-gray-300 px-3 py-2.5
                           text-sm text-gray-900 outline-none transition
                           focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  ></textarea>
                </div>
              </div>

              <!-- ======================================================
                   TAGS
                   ====================================================== -->
              <div>
                <label for="tags" class="mb-1.5 block text-sm font-medium text-gray-700">
                  Tags
                </label>

                <input
                  id="tags"
                  name="tags"
                  type="text"
                  [(ngModel)]="form.tagsText"
                  placeholder="e.g. cmdb, discovery, csdm"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5
                         text-sm text-gray-900 outline-none transition
                         focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />

                <p class="mt-1 text-xs text-gray-500">Separate multiple tags with commas.</p>
              </div>

              <!-- ======================================================
                   SOURCE
                   ====================================================== -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 class="mb-3 text-sm font-semibold text-gray-900">Content Source</h3>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label for="sourceType" class="mb-1.5 block text-sm font-medium text-gray-700">
                      Source Type
                    </label>

                    <select
                      id="sourceType"
                      name="sourceType"
                      [(ngModel)]="form.sourceType"
                      class="w-full rounded-lg border border-gray-300 bg-white
                             px-3 py-2.5 text-sm text-gray-900
                             outline-none transition
                             focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="original">Original</option>

                      <option value="licensed">Licensed</option>
                    </select>
                  </div>

                  <div>
                    <label
                      for="sourceReference"
                      class="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Source Reference
                    </label>

                    <input
                      id="sourceReference"
                      name="sourceReference"
                      type="text"
                      [(ngModel)]="form.sourceReference"
                      placeholder="Optional source/reference"
                      class="w-full rounded-lg border border-gray-300 bg-white
                             px-3 py-2.5 text-sm text-gray-900
                             outline-none transition
                             focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>
              </div>

              <!-- ======================================================
                   FORM ACTIONS
                   ====================================================== -->
              <div
                class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end"
              >
                <button
                  type="button"
                  (click)="cancelForm()"
                  [disabled]="saving()"
                  class="rounded-lg border border-gray-300 px-5 py-2.5
                         text-sm font-semibold text-gray-700
                         transition hover:bg-gray-50
                         disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  (click)="saveQuestion()"
                  [disabled]="saving()"
                  class="rounded-lg bg-teal-600 px-5 py-2.5
                         text-sm font-semibold text-white
                         transition hover:bg-teal-700
                         disabled:cursor-not-allowed disabled:opacity-50"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{ editingQuestionId() ? 'Update Question' : 'Create Question' }}
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
  private readonly courseService = inject(TestCourseService);

  private readonly topicService = inject(TestTopicService);

  private readonly questionService = inject(TestQuestionService);

  private readonly toast = inject(HotToastService);

  private readonly questionImportService = inject(TestQuestionImportService);

  // ============================================================
  // DATA
  // ============================================================

  protected readonly courses = signal<TestCourse[]>([]);

  protected readonly topics = signal<TestTopic[]>([]);

  protected readonly questions = signal<TestQuestion[]>([]);

  protected readonly importing = signal(false);

  // ============================================================
  // SELECTION
  // ============================================================

  protected readonly selectedCourseId = signal('');

  protected readonly selectedTopicId = signal('');

  // ============================================================
  // UI STATE
  // ============================================================

  protected readonly loadingCourses = signal(false);

  protected readonly loadingTopics = signal(false);

  protected readonly loadingQuestions = signal(false);
  /**
   * Currently selected question bank.
   */
  protected readonly selectedImportBank = signal('csa');

  /**
   * Available question banks.
   *
   * Exposed to the template from the central registry.
   */
  protected readonly questionBanks = TEST_QUESTION_BANKS;

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingQuestionId = signal<string | null>(null);

  // ============================================================
  // FORM MODEL
  // ============================================================

  protected form: QuestionForm = this.createEmptyForm();

  // ============================================================
  // COMPUTED-STYLE HELPERS
  // ============================================================

  protected selectedCourseName(): string {
    const course = this.courses().find((item) => item.id === this.selectedCourseId());

    return course?.name ?? '';
  }

  protected selectedTopicName(): string {
    const topic = this.topics().find((item) => item.id === this.selectedTopicId());

    return topic?.name ?? '';
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
  }

  // ============================================================
  // COURSE LOADING
  // ============================================================

  private async loadCourses(): Promise<void> {
    try {
      this.loadingCourses.set(true);

      const courses = await this.courseService.getActiveCourses();

      this.courses.set(courses);
    } catch (error) {
      console.error('Failed to load Test Center courses:', error);

      this.toast.error('We could not load the Test Center courses.');
    } finally {
      this.loadingCourses.set(false);
    }
  }

  // ============================================================
  // COURSE CHANGE
  // ============================================================

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);

    this.selectedTopicId.set('');

    this.topics.set([]);

    this.questions.set([]);

    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();

    if (!courseId) {
      return;
    }

    try {
      this.loadingTopics.set(true);

      const topics = await this.topicService.getAllTopics(courseId);

      this.topics.set(topics);
    } catch (error) {
      console.error('Failed to load Test Center topics:', error);

      this.toast.error('We could not load the topics for this course.');
    } finally {
      this.loadingTopics.set(false);
    }
  }

  private async refreshTopics(courseId: string): Promise<void> {
  this.loadingTopics.set(true);

  try {
    const topicList = await this.topicService.getAllTopics(courseId);

    this.topics.set(topicList);
  } catch (error) {
    console.error('Failed to refresh topics:', error);

    this.toast.error('Failed to refresh topics.');
  } finally {
    this.loadingTopics.set(false);
  }
}

  // ============================================================
  // TOPIC CHANGE
  // ============================================================

  async onTopicChange(topicId: string): Promise<void> {
    this.selectedTopicId.set(topicId);

    this.questions.set([]);

    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();

    if (!topicId) {
      return;
    }

    await this.loadQuestions();
  }

  // ============================================================
  // QUESTION LOADING
  // ============================================================

  private async loadQuestions(): Promise<void> {
    const topicId = this.selectedTopicId();

    if (!topicId) {
      return;
    }

    try {
      this.loadingQuestions.set(true);

      const questions = await this.questionService.getAllQuestionsForTopic(topicId);

      this.questions.set(questions);
    } catch (error) {
      console.error('Failed to load Test Center questions:', error);

      this.questions.set([]);

      this.toast.error('We could not load the questions for this topic.');
    } finally {
      this.loadingQuestions.set(false);
    }
  }

  // ============================================================
  // CREATE
  // ============================================================

  startNewQuestion(): void {
    if (!this.selectedCourseId() || !this.selectedTopicId()) {
      this.toast.error('Select a course and topic first.');

      return;
    }

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();

    this.showForm.set(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // EDIT
  // ============================================================

  editQuestion(question: TestQuestion): void {
    this.editingQuestionId.set(question.id);

    this.form = {
      question: question.question,

      type: question.type,

      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),

      correctAnswer: question.correctAnswer,

      explanation: question.explanation ?? '',

      hint: question.hint ?? '',

      difficulty: question.difficulty,

      tagsText: question.tags.join(', '),

      sourceType: question.sourceType,

      sourceReference: question.sourceReference ?? '',

      status: question.status,
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
    if (this.form.type === 'true-false') {
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

      if (this.form.correctAnswer !== 'true' && this.form.correctAnswer !== 'false') {
        this.form.correctAnswer = 'true';
      }

      return;
    }

    if (this.form.options.length < 2 || this.isTrueFalseOptions()) {
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

      this.form.correctAnswer = 'option-a';
    }
  }

  private isTrueFalseOptions(): boolean {
    return (
      this.form.options.length === 2 &&
      this.form.options[0]?.id === 'true' &&
      this.form.options[1]?.id === 'false'
    );
  }

  /**
 * Returns the currently selected question bank.
 */
private getSelectedQuestionBank() {
  return this.questionBanks.find(
    (bank) => bank.id === this.selectedImportBank(),
  );
}

  // ============================================================
  // OPTIONS
  // ============================================================

  addOption(): void {
    const nextIndex = this.form.options.length;

    const id = `option-${this.indexToLetter(nextIndex)}`;

    this.form.options.push({
      id,
      text: '',
    });
  }

  removeOption(index: number): void {
    if (this.form.options.length <= 2) {
      return;
    }

    const removed = this.form.options[index];

    this.form.options.splice(index, 1);

    if (removed && this.form.correctAnswer === removed.id) {
      this.form.correctAnswer = this.form.options[0]?.id ?? '';
    }
  }

  optionLetter(index: number): string {
    return this.indexToLetter(index).toUpperCase();
  }

  private indexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async saveQuestion(): Promise<void> {
    const validationError = this.validateForm();

    if (validationError) {
      this.toast.error(validationError);

      return;
    }

    const courseId = this.selectedCourseId();

    const topicId = this.selectedTopicId();

    if (!courseId || !topicId) {
      this.toast.error('Select a course and topic first.');

      return;
    }

    try {
      this.saving.set(true);

      const payload: Omit<TestQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId,

        topicId,

        question: this.form.question.trim(),

        type: this.form.type,

        options: this.form.options.map((option) => ({
          id: option.id,

          text: option.text.trim(),
        })),

        correctAnswer: this.form.correctAnswer,

        difficulty: this.form.difficulty,

        tags: this.parseTags(this.form.tagsText),

        sourceType: this.form.sourceType,

        status: this.form.status,
      };

      const explanation = this.form.explanation.trim();

      if (explanation) {
        payload.explanation = explanation;
      }

      const hint = this.form.hint.trim();

      if (hint) {
        payload.hint = hint;
      }

      const sourceReference = this.form.sourceReference.trim();

      if (sourceReference) {
        payload.sourceReference = sourceReference;
      }

      const questionId = this.editingQuestionId();

      if (questionId) {
        await this.questionService.updateQuestion(questionId, payload);

        this.toast.success('Question updated successfully.');
      } else {
        await this.questionService.createQuestion(payload);

        this.toast.success('Question created successfully.');
      }

      this.showForm.set(false);

      this.editingQuestionId.set(null);

      this.form = this.createEmptyForm();

      await this.loadQuestions();
    } catch (error) {
      console.error('Failed to save Test Center question:', error);

      this.toast.error('We could not save the question. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  private validateForm(): string | null {
    if (!this.form.question.trim()) {
      return 'Question text is required.';
    }

    const options = this.form.options;

    if (options.length < 2) {
      return 'At least two answer options are required.';
    }

    const emptyOption = options.some((option) => !option.text.trim());

    if (emptyOption) {
      return 'Every answer option must contain text.';
    }

    if (!this.form.correctAnswer) {
      return 'Select the correct answer.';
    }

    const correctOption = options.some((option) => option.id === this.form.correctAnswer);

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

  async deleteQuestion(question: TestQuestion): Promise<void> {
    const confirmed = window.confirm('Delete this question? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    try {
      await this.questionService.deleteQuestion(question.id);

      this.toast.success('Question deleted successfully.');

      await this.loadQuestions();
    } catch (error) {
      console.error('Failed to delete Test Center question:', error);

      this.toast.error('We could not delete the question. Please try again.');
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  cancelForm(): void {
    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();
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

      correctAnswer: 'option-a',

      explanation: '',

      hint: '',

      difficulty: 'medium',

      tagsText: '',

      sourceType: 'original',

      sourceReference: '',

      status: 'draft',
    };
  }

  // ============================================================
  // TAG PARSING
  // ============================================================

  private parseTags(value: string): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }

  // ============================================================
  // QUESTION BANK IMPORT
  // ============================================================

  /**
   * Import the selected question bank into the selected course.
   *
   * The component deliberately knows nothing about individual
   * question banks. It resolves the selected bank through the
   * central registry and delegates the actual import operation
   * to TestQuestionImportService.
   */
  protected async importQuestionBank(): Promise<void> {
    const courseId = this.selectedCourseId();

    if (!courseId) {
      this.toast.error(
        'Please select a course before importing a question bank.',
      );
      return;
    }

    const courseName = this.selectedCourseName();

    const bank = this.getSelectedQuestionBank();

    if (!bank) {
      this.toast.error(
        'The selected question bank could not be found.',
      );
      return;
    }

    const confirmed = window.confirm(
      `Import the ${bank.name} question bank into "${courseName}"?\n\n` +
        `This will process ${bank.questions.length} questions.\n\n` +
        `Topics will be created automatically if they do not already exist.\n\n` +
        `Existing questions with the same import ID will be updated.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      this.importing.set(true);

      const result =
        await this.questionImportService.importQuestionBank(
          courseId,
          bank.topics,
          bank.questions,
        );

      if (result.failed > 0) {
        this.toast.warning(
          `${bank.name} import completed with ` +
            `${result.failed} failed question(s).`,
        );
      } else {
        this.toast.success(
          `${bank.name} question bank imported successfully: ` +
            `${result.created} created, ` +
            `${result.updated} updated, ` +
            `${result.topicsCreated} topics created.`,
        );
      }

      /*
       * Refresh the course topics because the importer may have
       * created topics that did not previously exist.
       */
      await this.refreshTopics(courseId);

      /*
       * If the administrator already has a topic selected,
       * refresh its questions as well.
       */
      if (this.selectedTopicId()) {
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

      this.toast.error(message);
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

  sourceType: 'original' | 'licensed';

  sourceReference: string;

  status: 'draft' | 'published' | 'archived';
}
