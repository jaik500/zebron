import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HotToastService } from '@ngxpert/hot-toast';

import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

import { TestCourse } from '../../../test-center/models/test-course.model';

import {
  TestQuestion,
  TestQuestionDifficulty,
  TestQuestionOption,
  TestQuestionStatus,
  TestQuestionType,
} from '../../../test-center/models/test-question.model';

import { TestTopic } from '../../../test-center/models/test-topic.model';

import { TestCourseService } from '../../../test-center/services/test-course.service';
import { TestQuestionService } from '../../../test-center/services/test-question.service';
import { TestTopicService } from '../../../test-center/services/test-topic.service';

// ============================================================
// FORM MODEL
// ============================================================

interface QuestionForm {
  courseId: string;
  topicId: string;
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
  status: TestQuestionStatus;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-partner-test-questions',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- ====================================================== -->
      <!-- HEADER -->
      <!-- ====================================================== -->

      <header class="border-b border-white/10 bg-[#032D42]">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-sm text-white/60">
                <a routerLink="/partner" class="hover:text-white"> Partner Portal </a>

                <span>/</span>

                <a
                  [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
                  class="hover:text-white"
                >
                  Test Center
                </a>

                <span>/</span>

                <span class="text-white/90"> Questions </span>
              </div>

              <h1 class="mt-2 text-2xl font-bold text-white">Manage Questions</h1>

              <p class="mt-1 text-sm text-white/70">
                Create questions for your organization's courses and move them through the review
                and publication workflow.
              </p>
            </div>

            <a
              mat-stroked-button
              [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
              class="!border-white/40 !text-white"
            >
              <mat-icon> arrow_back </mat-icon>

              Test Center
            </a>
          </div>
        </div>
      </header>

      <!-- ====================================================== -->
      <!-- MAIN -->
      <!-- ====================================================== -->

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- ==================================================== -->
        <!-- CONTEXT LOADING -->
        <!-- ==================================================== -->

        @if (context.loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <mat-icon class="!h-8 !w-8 !text-3xl text-gray-500"> sync </mat-icon>

            <p class="mt-3 text-sm text-gray-600">Loading your partner organization...</p>
          </section>
        } @else if (context.error()) {
          <!-- ================================================== -->
          <!-- CONTEXT ERROR -->
          <!-- ================================================== -->

          <section class="rounded-xl border border-red-200 bg-red-50 p-6">
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
          </section>
        } @else {
          <!-- ================================================== -->
          <!-- COURSE / TOPIC SELECTORS -->
          <!-- ================================================== -->

          <section class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div class="grid gap-4 md:grid-cols-2">
              <!-- COURSE -->

              <label class="block">
                <span class="text-sm font-medium text-gray-700"> Course </span>

                <select
                  [ngModel]="selectedCourseId()"
                  (ngModelChange)="onCourseChange($event)"
                  class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                >
                  <option value="">Select a course</option>

                  @for (course of courses(); track course.id) {
                    <option [value]="course.id">
                      {{ course.name }}
                    </option>
                  }
                </select>
              </label>

              <!-- TOPIC -->

              <label class="block">
                <span class="text-sm font-medium text-gray-700"> Topic </span>

                <select
                  [ngModel]="selectedTopicId()"
                  (ngModelChange)="onTopicChange($event)"
                  [disabled]="!selectedCourseId() || loadingTopics()"
                  class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 disabled:bg-gray-100"
                >
                  <option value="">Select a topic</option>

                  @for (topic of topics(); track topic.id) {
                    <option [value]="topic.id">
                      {{ topic.name }}
                    </option>
                  }
                </select>
              </label>
            </div>
          </section>

          <!-- ================================================== -->
          <!-- SELECTED COURSE / TOPIC -->
          <!-- ================================================== -->

          @if (selectedCourse(); as course) {
            <section class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ course.name }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ selectedTopic()?.name || 'Select a topic' }}
                  </h2>
                </div>

                <button
                  type="button"
                  (click)="startNewQuestion()"
                  [disabled]="!selectedTopicId() || !access.canManageQuestions()"
                  class="inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <mat-icon> add </mat-icon>

                  New Question
                </button>
              </div>
            </section>
          }

          <!-- ================================================== -->
          <!-- QUESTION FORM -->
          <!-- ================================================== -->

          @if (showForm()) {
            <section
              id="question-form"
              class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingQuestionId() ? 'Edit question' : 'New question' }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingQuestionId() ? 'Edit Question' : 'Create Question' }}
                  </h2>
                </div>

                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close question form"
                >
                  <mat-icon> close </mat-icon>
                </button>
              </div>

              <div class="mt-6 space-y-5">
                <!-- QUESTION -->

                <label class="block">
                  <span class="text-sm font-medium text-gray-700"> Question </span>

                  <textarea
                    [(ngModel)]="form.question"
                    rows="5"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    placeholder="Enter the question text."
                  ></textarea>
                </label>

                <!-- TYPE / DIFFICULTY / SOURCE -->

                <div class="grid gap-5 md:grid-cols-3">
                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Type </span>

                    <select
                      [(ngModel)]="form.type"
                      (ngModelChange)="onTypeChange()"
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >
                      <option value="multiple-choice">Multiple Choice</option>

                      <option value="true-false">True / False</option>
                    </select>
                  </label>

                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Difficulty </span>

                    <select
                      [(ngModel)]="form.difficulty"
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >
                      <option value="easy">Easy</option>

                      <option value="medium">Medium</option>

                      <option value="hard">Hard</option>
                    </select>
                  </label>

                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Source </span>

                    <select
                      [(ngModel)]="form.sourceType"
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >
                      <option value="original">Original</option>

                      <option value="licensed">Licensed</option>
                    </select>
                  </label>
                </div>

                <!-- ANSWER OPTIONS -->

                <div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-medium text-gray-700"> Answer options </span>

                    @if (form.type === 'multiple-choice') {
                      <button
                        type="button"
                        (click)="addOption()"
                        class="text-sm font-semibold text-[#007979]"
                      >
                        + Add option
                      </button>
                    }
                  </div>

                  <div class="mt-3 space-y-3">
                    @for (option of form.options; track option.id) {
                      <div class="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          [value]="option.id"
                          [(ngModel)]="form.correctAnswer"
                          class="h-4 w-4"
                        />

                        <input
                          [(ngModel)]="option.text"
                          class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5"
                          [placeholder]="'Answer option ' + ($index + 1)"
                        />

                        @if (form.type === 'multiple-choice' && form.options.length > 2) {
                          <button
                            type="button"
                            (click)="removeOption(option.id)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            aria-label="Remove option"
                          >
                            <mat-icon> delete </mat-icon>
                          </button>
                        }
                      </div>
                    }
                  </div>

                  <p class="mt-2 text-xs text-gray-500">
                    Select the radio button for the correct answer.
                  </p>
                </div>

                <!-- EXPLANATION / HINT -->

                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Explanation </span>

                    <textarea
                      [(ngModel)]="form.explanation"
                      rows="4"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      placeholder="Explain why the answer is correct."
                    ></textarea>
                  </label>

                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Hint </span>

                    <textarea
                      [(ngModel)]="form.hint"
                      rows="4"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      placeholder="Optional answer-neutral hint."
                    ></textarea>
                  </label>
                </div>

                <!-- TAGS / SOURCE REFERENCE -->

                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Tags </span>

                    <input
                      [(ngModel)]="form.tagsText"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      placeholder="cmdb, discovery, itil"
                    />

                    <p class="mt-1 text-xs text-gray-500">Separate tags with commas.</p>
                  </label>

                  <label class="block">
                    <span class="text-sm font-medium text-gray-700"> Source reference </span>

                    <input
                      [(ngModel)]="form.sourceReference"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      placeholder="Optional source or license reference"
                    />
                  </label>
                </div>
              </div>

              <!-- FORM ACTIONS -->

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                @if (!editingQuestionId() || form.status !== 'rejected') {
                  <button
                    type="button"
                    (click)="saveDraft()"
                    [disabled]="saving()"
                    class="rounded-lg border border-[#007979] px-5 py-2.5 text-sm font-semibold text-[#007979] disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                }

                <button
                  type="button"
                  (click)="saveAndSubmit()"
                  [disabled]="saving()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Save &amp; Submit
                </button>
              </div>
            </section>
          }

          <!-- ================================================== -->
          <!-- QUESTIONS -->
          <!-- ================================================== -->

          <section>
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Questions</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ questions().length }}
                  question{{ questions().length === 1 ? '' : 's' }}
                </p>
              </div>
            </div>

            @if (loadingQuestions()) {
              <div class="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p class="text-sm text-gray-500">Loading questions...</p>
              </div>
            } @else if (!selectedTopicId()) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> topic </mat-icon>

                <p class="mt-3 font-semibold text-gray-900">Select a topic</p>

                <p class="mt-1 text-sm text-gray-500">
                  Choose a course and topic to manage its questions.
                </p>
              </div>
            } @else if (questions().length === 0) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> quiz </mat-icon>

                <p class="mt-3 font-semibold text-gray-900">No questions yet</p>

                <p class="mt-1 text-sm text-gray-500">Create the first question for this topic.</p>

                @if (access.canManageQuestions()) {
                  <button
                    type="button"
                    (click)="startNewQuestion()"
                    class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <mat-icon> add </mat-icon>

                    Create Question
                  </button>
                }
              </div>
            } @else {
              <div class="space-y-3">
                @for (question of questions(); track question.id) {
                  <article class="rounded-xl border border-gray-200 bg-white p-5">
                    <!-- QUESTION HEADER -->

                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span
                            class="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
                          >
                            {{ statusLabel(question.status) }}
                          </span>

                          <span
                            class="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-[#007979]"
                          >
                            {{ question.difficulty }}
                          </span>

                          <span class="text-xs text-gray-400">
                            {{
                              question.type === 'multiple-choice'
                                ? 'Multiple Choice'
                                : 'True / False'
                            }}
                          </span>
                        </div>

                        <p class="mt-3 text-sm font-medium leading-6 text-gray-900">
                          {{ question.question }}
                        </p>

                        <p class="mt-2 text-xs text-gray-500">
                          {{ question.options.length }}
                          answer options
                        </p>
                      </div>

                      <button
                        type="button"
                        (click)="editQuestion(question)"
                        [disabled]="!canEditQuestion(question)"
                        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Edit question"
                      >
                        <mat-icon> edit </mat-icon>
                      </button>
                    </div>

                    <!-- QUESTION ACTIONS -->

                    <div class="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      @if (canEditQuestion(question)) {
                        <button
                          type="button"
                          (click)="editQuestion(question)"
                          class="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
                        >
                          Edit
                        </button>
                      }

                      @if (canSubmit(question)) {
                        <button
                          type="button"
                          (click)="submitForReview(question)"
                          class="rounded-lg bg-[#032D42] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Submit for Review
                        </button>
                      }

                      @if (canStartReview(question)) {
                        <button
                          type="button"
                          (click)="startReview(question)"
                          class="rounded-lg bg-[#007979] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Start Review
                        </button>
                      }

                      @if (canReturn(question)) {
                        <button
                          type="button"
                          (click)="returnQuestion(question)"
                          class="rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          Return
                        </button>
                      }

                      @if (canApprove(question)) {
                        <button
                          type="button"
                          (click)="approveQuestion(question)"
                          class="rounded-lg bg-[#007979] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Approve
                        </button>
                      }

                      @if (canPublish(question)) {
                        <button
                          type="button"
                          (click)="publishQuestion(question)"
                          class="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Publish
                        </button>
                      }

                      @if (canDeleteQuestion(question)) {
                        <button
                          type="button"
                          (click)="deleteQuestion(question)"
                          class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class PartnerTestQuestionsComponent implements OnInit {
  // ============================================================
  // SERVICES
  // ============================================================

  protected readonly context = inject(PartnerOrganizationContextService);

  protected readonly access = inject(PartnerAccessService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly courseService = inject(TestCourseService);

  private readonly topicService = inject(TestTopicService);

  private readonly questionService = inject(TestQuestionService);

  private readonly toast = inject(HotToastService);

  private readonly pageTitleService = inject(PageTitleService);

  // ============================================================
  // STATE
  // ============================================================

  protected readonly courses = signal<TestCourse[]>([]);

  protected readonly topics = signal<TestTopic[]>([]);

  protected readonly questions = signal<TestQuestion[]>([]);

  protected readonly loadingTopics = signal(false);

  protected readonly loadingQuestions = signal(false);

  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);

  protected readonly editingQuestionId = signal<string | null>(null);

  protected readonly selectedCourseId = signal('');

  protected readonly selectedTopicId = signal('');

  // ============================================================
  // FORM
  // ============================================================

  protected form: QuestionForm = this.createEmptyForm();

  // ============================================================
  // COMPUTED
  // ============================================================

  protected readonly selectedCourse = computed(
    () => this.courses().find((course) => course.id === this.selectedCourseId()) ?? null,
  );

  protected readonly selectedTopic = computed(
    () => this.topics().find((topic) => topic.id === this.selectedTopicId()) ?? null,
  );

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.initialize();
  }

  protected async initialize(): Promise<void> {
    try {
      await this.context.initialize();

      const organizationId = this.context.organizationId();

      if (!organizationId) {
        return;
      }

      const courses = await this.courseService.getAllCourses(organizationId);

      this.courses.set(
        courses.filter(
          (course) =>
            course.scope === 'organization' &&
            course.organizationId === organizationId &&
            course.active === true,
        ),
      );

      const courseId = this.route.snapshot.queryParamMap.get('courseId') ?? '';

      if (courseId && this.courses().some((course) => course.id === courseId)) {
        await this.onCourseChange(courseId);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load Test Center questions.';

      this.toast.error(message);
    }

    this.pageTitleService.setTitle('Partner | Test Center Questions');
  }

  // ============================================================
  // COURSE CHANGE
  // ============================================================

  protected async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);

    this.selectedTopicId.set('');

    this.topics.set([]);

    this.questions.set([]);

    this.cancelForm();

    if (!courseId) {
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          courseId: null,
          topicId: null,
        },
        queryParamsHandling: 'merge',
      });

      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      return;
    }

    try {
      this.loadingTopics.set(true);

      const topics = await this.topicService.getAllTopics(organizationId, courseId);

      this.topics.set(topics.filter((topic) => topic.active === true));

      const topicId = this.route.snapshot.queryParamMap.get('topicId') ?? '';

      if (topicId && this.topics().some((topic) => topic.id === topicId)) {
        await this.onTopicChange(topicId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load Test Center topics.';

      this.toast.error(message);
    } finally {
      this.loadingTopics.set(false);
    }
  }

  // ============================================================
  // TOPIC CHANGE
  // ============================================================

  protected async onTopicChange(topicId: string): Promise<void> {
    this.selectedTopicId.set(topicId);

    this.questions.set([]);

    this.cancelForm();

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        courseId: this.selectedCourseId(),
        topicId: topicId || null,
      },
      queryParamsHandling: 'merge',
    });

    if (!topicId) {
      return;
    }

    await this.loadQuestions();
  }

  // ============================================================
  // LOAD QUESTIONS
  // ============================================================

  private async loadQuestions(): Promise<void> {
    const organizationId = this.context.organizationId();

    const topicId = this.selectedTopicId();

    if (!organizationId || !topicId) {
      return;
    }

    try {
      this.loadingQuestions.set(true);

      const questions = await this.questionService.getAllQuestionsForTopic(organizationId, topicId);

      this.questions.set(questions);
    } catch (error) {
      this.questions.set([]);

      const message = error instanceof Error ? error.message : 'Unable to load questions.';

      this.toast.error(message);
    } finally {
      this.loadingQuestions.set(false);
    }
  }

  // ============================================================
  // CREATE QUESTION
  // ============================================================

  protected startNewQuestion(): void {
    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    if (!this.access.canManageQuestions()) {
      this.toast.error('You do not have permission to manage questions.');

      return;
    }

    const courseId = this.selectedCourseId();

    const topicId = this.selectedTopicId();

    if (!courseId) {
      this.toast.error('Select a course first.');

      return;
    }

    if (!topicId) {
      this.toast.error('Select a topic first.');

      return;
    }

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();

    this.form.courseId = courseId;

    this.form.topicId = topicId;

    this.showForm.set(true);

    setTimeout(() => {
      document.getElementById('question-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  // ============================================================
  // EDIT QUESTION
  // ============================================================

  protected editQuestion(question: TestQuestion): void {
    if (!this.canEditQuestion(question)) {
      this.toast.error('This question cannot be edited in its current workflow state.');

      return;
    }

    this.editingQuestionId.set(question.id);

    this.form = {
      courseId: question.courseId,

      topicId: question.topicId,

      question: question.question ?? '',

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

    setTimeout(() => {
      document.getElementById('question-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  // ============================================================
  // CANCEL FORM
  // ============================================================

  protected cancelForm(): void {
    this.showForm.set(false);

    this.editingQuestionId.set(null);

    this.form = this.createEmptyForm();
  }

  // ============================================================
  // SAVE DRAFT
  // ============================================================

  protected async saveDraft(): Promise<void> {
    await this.saveQuestion('draft');
  }

  // ============================================================
  // SAVE + SUBMIT
  // ============================================================

  protected async saveAndSubmit(): Promise<void> {
    await this.saveQuestion('staff_submitted');
  }

  // ============================================================
  // SAVE QUESTION
  // ============================================================

  private async saveQuestion(status: TestQuestionStatus): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (!this.access.canManageQuestions()) {
      this.toast.error('You do not have permission to manage questions.');

      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.toast.error('No partner organization is selected.');

      return;
    }

    const validationError = this.validateForm();

    if (validationError) {
      this.toast.error(validationError);

      return;
    }

    try {
      this.saving.set(true);

      const payload: Omit<TestQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId,

        courseId: this.form.courseId,

        topicId: this.form.topicId,

        question: this.form.question.trim(),

        type: this.form.type,

        options: this.form.options.map((option) => ({
          id: option.id,
          text: option.text.trim(),
        })),

        correctAnswer: this.form.correctAnswer,

        explanation: this.form.explanation.trim(),

        hint: this.form.hint.trim(),

        difficulty: this.form.difficulty,

        tags: this.parseTags(this.form.tagsText),

        sourceType: this.form.sourceType,

        sourceReference: this.form.sourceReference.trim(),

        status,
      };

      const questionId = this.editingQuestionId();

      if (questionId && this.form.status === 'rejected' && status === 'draft') {
        this.toast.error('A returned question must be submitted for review after it is updated.');
        return;
      }

      if (questionId) {
        await this.questionService.updateQuestion(organizationId, questionId, {
          courseId: payload.courseId,

          topicId: payload.topicId,

          question: payload.question,

          type: payload.type,

          options: payload.options,

          correctAnswer: payload.correctAnswer,

          explanation: payload.explanation,

          hint: payload.hint,

          difficulty: payload.difficulty,

          tags: payload.tags,

          sourceType: payload.sourceType,

          sourceReference: payload.sourceReference,

          status: payload.status,
        });

        this.toast.success(
          status === 'staff_submitted' ? 'Question submitted for review.' : 'Question draft saved.',
        );
      } else {
        await this.questionService.createQuestion(organizationId, payload);

        this.toast.success(
          status === 'staff_submitted' ? 'Question submitted for review.' : 'Question draft saved.',
        );
      }

      this.cancelForm();

      await this.loadQuestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the question.';

      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // SUBMIT FOR REVIEW
  // ============================================================

  protected async submitForReview(question: TestQuestion): Promise<void> {
    if (!this.access.canSubmitQuestionsForReview()) {
      return;
    }

    await this.runAction(
      () =>
        this.questionService.submitQuestionForReview(this.context.organizationId()!, question.id),

      'Question submitted for manager review.',
    );
  }

  // ============================================================
  // START REVIEW
  // ============================================================

  protected async startReview(question: TestQuestion): Promise<void> {
    if (!this.access.canReviewQuestions()) {
      return;
    }

    await this.runAction(
      () => this.questionService.startQuestionReview(this.context.organizationId()!, question.id),

      'Question moved into manager review.',
    );
  }

  // ============================================================
  // RETURN QUESTION
  // ============================================================

  protected async returnQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canRejectQuestions()) {
      return;
    }

    await this.runAction(
      () => this.questionService.returnQuestion(this.context.organizationId()!, question.id),

      'Question returned to staff.',
    );
  }

  // ============================================================
  // APPROVE QUESTION
  // ============================================================

  protected async approveQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canApproveQuestions()) {
      return;
    }

    await this.runAction(
      () => this.questionService.approveQuestion(this.context.organizationId()!, question.id),

      'Question approved.',
    );
  }

  // ============================================================
  // PUBLISH QUESTION
  // ============================================================

  protected async publishQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canPublishQuestions()) {
      return;
    }

    await this.runAction(
      () => this.questionService.publishQuestion(this.context.organizationId()!, question.id),

      'Question published.',
    );
  }

  // ============================================================
  // GENERIC WORKFLOW ACTION
  // ============================================================

  private async runAction(action: () => Promise<void>, successMessage: string): Promise<void> {
    try {
      await action();

      this.toast.success(successMessage);

      await this.loadQuestions();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The question action could not be completed.';

      this.toast.error(message);
    }
  }

  // ============================================================
  // DELETE QUESTION
  // ============================================================

  protected async deleteQuestion(question: TestQuestion): Promise<void> {
    if (!this.canDeleteQuestion(question)) {
      return;
    }

    if (!window.confirm('Delete this question? This action cannot be undone.')) {
      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      return;
    }

    try {
      await this.questionService.deleteQuestion(organizationId, question.id);

      this.toast.success('Question deleted successfully.');

      await this.loadQuestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete the question.';

      this.toast.error(message);
    }
  }

  // ============================================================
  // QUESTION PERMISSIONS
  // ============================================================

  protected canEditQuestion(question: TestQuestion): boolean {
    if (!this.access.canManageQuestions()) {
      return false;
    }

    return question.status === 'draft' || question.status === 'rejected';
  }

  protected canSubmit(question: TestQuestion): boolean {
    return (
      this.access.canSubmitQuestionsForReview() &&
      (question.status === 'draft' || question.status === 'rejected')
    );
  }

  protected canStartReview(question: TestQuestion): boolean {
    return this.access.canReviewQuestions() && question.status === 'staff_submitted';
  }

  protected canReturn(question: TestQuestion): boolean {
    return this.access.canRejectQuestions() && question.status === 'manager_review';
  }

  protected canApprove(question: TestQuestion): boolean {
    return this.access.canApproveQuestions() && question.status === 'manager_review';
  }

  protected canPublish(question: TestQuestion): boolean {
    return this.access.canPublishQuestions() && question.status === 'approved';
  }

  protected canDeleteQuestion(question: TestQuestion): boolean {
    return this.access.canReviewQuestions() && question.status !== 'published';
  }

  // ============================================================
  // STATUS LABEL
  // ============================================================

  protected statusLabel(status: TestQuestionStatus): string {
    switch (status) {
      case 'staff_submitted':
        return 'Submitted';

      case 'manager_review':
        return 'Manager Review';

      case 'rejected':
        return 'Returned';

      case 'approved':
        return 'Approved';

      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // ============================================================
  // QUESTION TYPE
  // ============================================================

  protected onTypeChange(): void {
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
        this.form.correctAnswer = '';
      }
    } else if (this.form.options.length < 2) {
      this.form.options = [
        {
          id: 'option-a',
          text: '',
        },
        {
          id: 'option-b',
          text: '',
        },
      ];

      this.form.correctAnswer = '';
    }
  }

  // ============================================================
  // ADD OPTION
  // ============================================================

  protected addOption(): void {
    if (this.form.options.length >= 6) {
      return;
    }

    this.form.options.push({
      id: `option-${Date.now()}`,
      text: '',
    });
  }

  // ============================================================
  // REMOVE OPTION
  // ============================================================

  protected removeOption(optionId: string): void {
    if (this.form.options.length <= 2) {
      return;
    }

    this.form.options = this.form.options.filter((option) => option.id !== optionId);

    if (this.form.correctAnswer === optionId) {
      this.form.correctAnswer = '';
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  private validateForm(): string | null {
    if (!this.form.courseId) {
      return 'Course is required.';
    }

    if (!this.form.topicId) {
      return 'Topic is required.';
    }

    if (!this.form.question.trim()) {
      return 'Question text is required.';
    }

    if (this.form.options.length < 2) {
      return 'At least two answer options are required.';
    }

    if (this.form.options.some((option) => !option.text.trim())) {
      return 'Every answer option must contain text.';
    }

    if (!this.form.correctAnswer) {
      return 'Select the correct answer.';
    }

    if (!this.form.options.some((option) => option.id === this.form.correctAnswer)) {
      return 'The selected correct answer is invalid.';
    }

    return null;
  }

  // ============================================================
  // TAG PARSING
  // ============================================================

  private parseTags(value: string): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
  }

  // ============================================================
  // EMPTY FORM
  // ============================================================

  private createEmptyForm(): QuestionForm {
    return {
      courseId: '',
      topicId: '',

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
      ],

      correctAnswer: '',

      explanation: '',

      hint: '',

      difficulty: 'medium',

      tagsText: '',

      sourceType: 'original',

      sourceReference: '',

      status: 'draft',
    };
  }
}
