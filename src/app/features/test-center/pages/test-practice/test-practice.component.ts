import { ChangeDetectionStrategy, Component, computed, HostListener, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { learnerBaseRoute, useLearningHeaderTitle } from '../../learner-route';
import {
  ANSWER_SEPARATOR,
  answerText,
  correctAnswerValue,
  correctOrder,
  correctSet,
  isAnswered,
  isAnswerCorrect,
  isSingleClick as singleClick,
  splitAnswer,
} from '../../models/question-answers';
import { TestQuestion } from '../../models/test-question.model';
import { TestStore } from '../../store/test.store';

/**
 * Taking a Test Center quiz, in the same style as course exams:
 * a progress bar that stays in view, one question at a time with
 * lettered answers, and a question map.
 *
 *   Practice mode  the answer is checked as soon as it is chosen, with the
 *                  explanation; the first choice is the one that counts.
 *   Exam mode      no feedback until the end; answers can be changed,
 *                  questions skipped and flagged for review. The questions
 *                  come from the server without answers, and the server
 *                  grades and records the result (TestStore.finishTest).
 *
 * Keyboard: A–F or 1–6 choose an answer, arrow keys move between questions.
 */
@Component({
  selector: 'app-test-practice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe],
  styles: [
    `
      .order-btn { display: inline-flex; height: 2rem; width: 2rem; align-items: center; justify-content: center; border-radius: 0.5rem; color: #64748b; }
      .order-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
      .order-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    `,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <!-- Page header: exit and breadcrumbs left, mode right -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 sm:px-6">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white"
            (click)="exit()"
            [attr.aria-label]="'Leave the test' | t"
            [title]="'Leave the test' | t"
          >
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
          <nav class="flex min-w-0 flex-1 items-center gap-1 text-sm" [attr.aria-label]="'Breadcrumb' | t">
            <span class="hidden shrink-0 text-white/80 sm:inline">{{ 'Learning' | t }}</span>
            <mat-icon class="!hidden !h-4 !w-4 shrink-0 !text-base text-white/60 sm:!inline-block" aria-hidden="true">chevron_right</mat-icon>
            <span class="hidden shrink-0 text-white/80 sm:inline">{{ 'Test Center' | t }}</span>
            <mat-icon class="!hidden !h-4 !w-4 shrink-0 !text-base text-white/60 sm:!inline-block" aria-hidden="true">chevron_right</mat-icon>
            <span class="truncate font-semibold">{{ course()?.name || ('Practice test' | t) }}</span>
          </nav>
          <span class="shrink-0 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <mat-icon class="!h-3.5 !w-3.5 align-[-2px] !text-[14px]" aria-hidden="true">{{ isExam() ? 'assignment' : 'school' }}</mat-icon>
            {{ (isExam() ? 'Exam mode' : 'Practice mode') | t }}
          </span>
        </div>
      </header>

      <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        @if (!hasQuestions()) {
          <div class="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">quiz</mat-icon>
            <h1 class="mt-2 text-lg font-semibold text-slate-900">{{ 'No test in progress' | t }}</h1>
            <p class="mt-1 text-sm text-slate-600">{{ 'Choose a quiz and press Start to begin.' | t }}</p>
            <a
              [routerLink]="[baseRoute, 'quizzes']"
              class="mt-4 inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              <mat-icon aria-hidden="true">search</mat-icon>{{ 'Browse quizzes' | t }}
            </a>
          </div>
        } @else if (currentQuestion(); as question) {
          <div class="grid gap-5 lg:grid-cols-[1fr_250px]">
            <div class="min-w-0">
              <!-- Where you are -->
              <div class="sticky top-16 z-10 -mx-1 bg-slate-50/95 px-1 pb-3 pt-1 backdrop-blur">
                <div class="flex items-center justify-between gap-2 text-sm text-slate-600">
                  <span>{{ 'Question {0} of {1}' | t: [questionNumber(), totalQuestions()] }}</span>
                  <span>
                    {{ '{0} answered' | t: [answeredCount()] }}
                    @if (!isExam()) {
                      · {{ '{0} correct' | t: [correctSoFar()] }}
                    }
                  </span>
                </div>
                <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" [attr.aria-valuenow]="answeredPercent()" aria-valuemin="0" aria-valuemax="100">
                  <div class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-all" [style.width.%]="answeredPercent()"></div>
                </div>
              </div>

              @if (testStore.error(); as error) {
                <p class="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{{ error | t }}</p>
              }

              <article class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wide text-[#007979]">{{ 'Question {0}' | t: [questionNumber()] }}</span>
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{{ difficultyLabel(question.difficulty) | t }}</span>
                  @if (question.type === 'true-false') {
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{{ 'True or false' | t }}</span>
                  }
                  <button
                    type="button"
                    class="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition"
                    [ngClass]="isFlagged(question.id) ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'"
                    [attr.aria-pressed]="isFlagged(question.id)"
                    (click)="toggleFlag(question.id)"
                  >
                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">{{ isFlagged(question.id) ? 'flag' : 'outlined_flag' }}</mat-icon>
                    {{ (isFlagged(question.id) ? 'Flagged' : 'Flag for review') | t }}
                  </button>
                </div>

                <h1 class="mt-3 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{{ question.question }}</h1>

                @if (!isExam() && question.hint && !isLocked(question)) {
                  <details class="mt-3 rounded-lg border border-amber-200 bg-amber-50 text-sm">
                    <summary class="cursor-pointer px-3 py-2 font-semibold text-amber-900">{{ 'Show a hint' | t }}</summary>
                    <p class="border-t border-amber-200 px-3 py-2 text-amber-900">{{ question.hint }}</p>
                  </details>
                }

                <!-- Answers: the input depends on the question type -->
                @switch (question.type) {
                  @case ('short-text') {
                    <label class="mt-5 block">
                      <span class="sr-only">{{ 'Your answer' | t }}</span>
                      <input
                        type="text"
                        class="h-12 w-full rounded-xl border px-4 text-base outline-none transition focus:ring-2 focus:ring-teal-100"
                        [ngClass]="inputBorder(question)"
                        [value]="answerOf(question.id)"
                        [disabled]="isLocked(question)"
                        [placeholder]="'Type your answer' | t"
                        autocomplete="off"
                        (input)="setAnswer(question.id, $any($event.target).value)"
                        (keydown.enter)="checkAnswer(question)"
                      />
                    </label>
                  }
                  @case ('numeric') {
                    <label class="mt-5 block max-w-xs">
                      <span class="sr-only">{{ 'Your answer' | t }}</span>
                      <input
                        type="text"
                        inputmode="decimal"
                        class="h-12 w-full rounded-xl border px-4 text-base tabular-nums outline-none transition focus:ring-2 focus:ring-teal-100"
                        [ngClass]="inputBorder(question)"
                        [value]="answerOf(question.id)"
                        [disabled]="isLocked(question)"
                        [placeholder]="'Type a number' | t"
                        autocomplete="off"
                        (input)="setAnswer(question.id, $any($event.target).value)"
                        (keydown.enter)="checkAnswer(question)"
                      />
                    </label>
                  }
                  @case ('ordering') {
                    <p class="mt-4 text-sm text-slate-500">{{ 'Use the arrows to put these in the right order.' | t }}</p>
                    <ol class="mt-2 flex flex-col gap-2">
                      @for (optionId of orderFor(question); track optionId; let position = $index; let first = $first; let last = $last) {
                        <li
                          class="flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5"
                          [ngClass]="orderItemBorder(question, optionId, position)"
                        >
                          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600">{{ position + 1 }}</span>
                          <span class="flex-1 text-slate-800">{{ optionText(question, optionId) }}</span>
                          @if (!isLocked(question)) {
                            <button type="button" class="order-btn" [disabled]="first" (click)="moveItem(question, position, -1)" [attr.aria-label]="'Move up' | t">
                              <mat-icon>arrow_upward</mat-icon>
                            </button>
                            <button type="button" class="order-btn" [disabled]="last" (click)="moveItem(question, position, 1)" [attr.aria-label]="'Move down' | t">
                              <mat-icon>arrow_downward</mat-icon>
                            </button>
                          }
                        </li>
                      }
                    </ol>
                  }
                  @default {
                    <!-- Multiple choice, true/false (one click) and multiple answers (checkboxes) -->
                    @if (question.type === 'multiple-select') {
                      <p class="mt-4 text-sm text-slate-500">{{ 'Select all that apply.' | t }}</p>
                    }
                    <div
                      class="flex flex-col gap-2"
                      [ngClass]="question.type === 'multiple-select' ? 'mt-2' : 'mt-5'"
                      [attr.role]="question.type === 'multiple-select' ? 'group' : 'radiogroup'"
                      [attr.aria-label]="'Answers' | t"
                    >
                      @for (option of question.options; track option.id; let optionIndex = $index) {
                        <button
                          type="button"
                          [attr.role]="question.type === 'multiple-select' ? 'checkbox' : 'radio'"
                          class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-default"
                          [ngClass]="optionClass(question, option.id)"
                          [attr.aria-checked]="isChosen(question.id, option.id)"
                          [disabled]="isLocked(question)"
                          (click)="chooseOption(question, option.id)"
                        >
                          <span
                            class="flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-bold"
                            [ngClass]="[letterClass(question, option.id), question.type === 'multiple-select' ? 'rounded-md' : 'rounded-full']"
                            aria-hidden="true"
                          >
                            @if (question.type === 'multiple-select' && isChosen(question.id, option.id)) {
                              <mat-icon class="!h-4 !w-4 !text-base">check</mat-icon>
                            } @else {
                              {{ optionLetter(optionIndex) }}
                            }
                          </span>
                          <span class="flex-1">{{ option.text }}</span>
                          @if (isLocked(question) && isRightOption(question, option.id)) {
                            <mat-icon class="shrink-0 text-emerald-600" aria-hidden="true">check_circle</mat-icon>
                          } @else if (isLocked(question) && isChosen(question.id, option.id)) {
                            <mat-icon class="shrink-0 text-rose-600" aria-hidden="true">cancel</mat-icon>
                          }
                        </button>
                      }
                    </div>
                  }
                }

                <!-- Check answer (practice, for answers that are not a single click) -->
                @if (!isExam() && !singleClick(question) && !isLocked(question)) {
                  <button
                    type="button"
                    class="mt-4 inline-flex h-10 items-center gap-1 rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50 disabled:opacity-40"
                    [disabled]="question.type !== 'ordering' && !hasSelectedAnswer()"
                    (click)="checkAnswer(question)"
                  >
                    <mat-icon aria-hidden="true">done</mat-icon>{{ 'Check answer' | t }}
                  </button>
                }
                @if (isExam() && question.type === 'ordering' && !hasSelectedAnswer()) {
                  <button
                    type="button"
                    class="mt-4 inline-flex h-10 items-center gap-1 rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50"
                    (click)="checkAnswer(question)"
                  >
                    <mat-icon aria-hidden="true">done</mat-icon>{{ 'Use this order' | t }}
                  </button>
                }

                <!-- Practice feedback -->
                @if (isLocked(question)) {
                  <div
                    class="mt-4 rounded-xl p-4 text-sm"
                    [ngClass]="isRight(question) ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'"
                    aria-live="polite"
                  >
                    <p class="font-semibold">{{ (isRight(question) ? 'Correct!' : 'Not quite.') | t }}</p>
                    @if (!isRight(question) && !singleClick(question) && question.type !== 'multiple-select') {
                      <p class="mt-1">{{ 'Right answer:' | t }} <strong>{{ rightAnswerText(question) }}</strong></p>
                    }
                    @if (question.explanation) {
                      <p class="mt-1">{{ question.explanation }}</p>
                    }
                  </div>
                }

                <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    [disabled]="isFirstQuestion()"
                    (click)="previousQuestion()"
                  >
                    <mat-icon aria-hidden="true">arrow_back</mat-icon>{{ 'Previous' | t }}
                  </button>

                  @if (!isLastQuestion()) {
                    <button
                      type="button"
                      class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                      [disabled]="!canGoNext()"
                      (click)="nextQuestion()"
                    >
                      {{ (isExam() && !hasSelectedAnswer() ? 'Skip' : 'Next') | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                      [disabled]="testStore.loading()"
                      (click)="finish()"
                    >
                      {{ (testStore.loading() ? 'Saving...' : 'Finish and see results') | t }}<mat-icon aria-hidden="true">flag</mat-icon>
                    </button>
                  }
                </div>
                <p class="mt-3 hidden text-right text-xs text-slate-400 sm:block">{{ 'Tip: press A–D to answer, arrow keys to move.' | t }}</p>
              </article>
            </div>

            <!-- Question map -->
            <aside class="self-start rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20" [attr.aria-label]="'Questions' | t">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Questions' | t }}</p>
              <div class="flex flex-wrap gap-1.5">
                @for (item of testStore.questions(); track item.id; let questionIndex = $index) {
                  <button
                    type="button"
                    class="relative h-9 w-9 rounded-lg text-sm font-semibold transition"
                    [ngClass]="mapClass(questionIndex, item)"
                    [attr.aria-label]="('Question {0}' | t: [questionIndex + 1])"
                    [attr.aria-current]="questionIndex === currentQuestionIndex() ? 'step' : null"
                    (click)="testStore.goToQuestion(questionIndex)"
                  >
                    {{ questionIndex + 1 }}
                    @if (isFlagged(item.id)) {
                      <span class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true"></span>
                    }
                  </button>
                }
              </div>
              <ul class="mt-3 space-y-1 text-xs text-slate-500">
                <li class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-teal-100"></span>{{ (isExam() ? 'Answered' : 'Correct') | t }}</li>
                @if (!isExam()) {
                  <li class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-rose-100"></span>{{ 'Incorrect' | t }}</li>
                }
                <li class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-amber-500"></span>{{ 'Flagged' | t }}</li>
              </ul>
              <button
                type="button"
                class="mt-4 w-full rounded-lg border border-[#007979] py-2 text-sm font-semibold text-[#007979] hover:bg-teal-50 disabled:opacity-50"
                [disabled]="testStore.loading()"
                (click)="finish()"
              >
                {{ 'Finish' | t }}
              </button>
            </aside>
          </div>
        }
      </div>
    </main>
  `,
})
export class TestPracticeComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  /** '/test-center' or the organization's learner route. */
  readonly baseRoute = learnerBaseRoute(this.route);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  readonly testStore = inject(TestStore);

  readonly course = this.testStore.course;
  readonly currentQuestion = this.testStore.currentQuestion;
  readonly currentQuestionIndex = this.testStore.currentQuestionIndex;
  readonly totalQuestions = this.testStore.totalQuestions;
  readonly answeredCount = this.testStore.answeredCount;
  readonly selectedAnswers = this.testStore.selectedAnswers;
  readonly mode = this.testStore.mode;

  /** Questions flagged for review (this session only). */
  private readonly flagged = signal<ReadonlySet<string>>(new Set());

  readonly isExam = computed(() => this.mode() === 'exam');
  readonly hasQuestions = computed(() => this.totalQuestions() > 0);
  readonly questionNumber = computed(() => this.currentQuestionIndex() + 1);

  readonly answeredPercent = computed(() => {
    const total = this.totalQuestions();
    return total ? Math.round((this.answeredCount() / total) * 100) : 0;
  });

  readonly correctSoFar = computed(() => {
    const answers = this.selectedAnswers();
    return this.testStore.questions().filter((question) => isAnswerCorrect(question, answers[question.id])).length;
  });

  // ---------- keyboard ----------

  @HostListener('window:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (!this.hasQuestions() || event.ctrlKey || event.metaKey || event.altKey || target?.closest('input, textarea, select')) {
      return;
    }

    const question = this.currentQuestion();
    const key = event.key.toUpperCase();
    const index = /^[A-F]$/.test(key) ? key.charCodeAt(0) - 65 : /^[1-6]$/.test(key) ? Number(key) - 1 : -1;
    const choosable = question && (singleClick(question.type) || question.type === 'multiple-select');

    if (question && choosable && index >= 0 && index < question.options.length) {
      event.preventDefault();
      this.chooseOption(question, question.options[index].id);
    } else if (event.key === 'ArrowRight' && !this.isLastQuestion()) {
      this.nextQuestion();
    } else if (event.key === 'ArrowLeft' && !this.isFirstQuestion()) {
      this.previousQuestion();
    }
  }

  /** Warn before closing the tab in the middle of a test. */
  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasQuestions() && this.answeredCount() > 0 && !this.testStore.testCompleted()) {
      event.preventDefault();
    }
  }

  // ---------- labels ----------

  difficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return labels[difficulty] ?? difficulty;
  }

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // ---------- answers (every type: models/question-answers.ts) ----------

  /** Practice questions already checked (types that are not a single click). */
  private readonly checked = signal<ReadonlySet<string>>(new Set());

  /** Starting order for ordering questions, shuffled once per question. */
  private readonly startOrders = new Map<string, string[]>();

  protected singleClick(question: TestQuestion): boolean {
    return singleClick(question.type);
  }

  answerOf(questionId: string): string {
    return this.selectedAnswers()[questionId] ?? '';
  }

  /** Practice mode shows feedback once a question is answered (single click) or checked. */
  isLocked(question: TestQuestion): boolean {
    if (this.isExam()) {
      return false;
    }
    return singleClick(question.type) ? isAnswered(this.answerOf(question.id)) : this.checked().has(question.id);
  }

  isRight(question: TestQuestion): boolean {
    return isAnswerCorrect(question, this.answerOf(question.id));
  }

  rightAnswerText(question: TestQuestion): string {
    return answerText(question, correctAnswerValue(question));
  }

  hasSelectedAnswer(): boolean {
    const question = this.currentQuestion();
    return !!question && isAnswered(this.answerOf(question.id));
  }

  /** Practice: Next once the question is answered and (if needed) checked. */
  canGoNext(): boolean {
    const question = this.currentQuestion();
    return !!question && (this.isExam() || this.isLocked(question));
  }

  setAnswer(questionId: string, value: string): void {
    this.testStore.selectAnswer(questionId, value);
  }

  isChosen(questionId: string, optionId: string): boolean {
    return splitAnswer(this.answerOf(questionId)).includes(optionId);
  }

  isRightOption(question: TestQuestion, optionId: string): boolean {
    return question.type === 'multiple-select' ? correctSet(question).includes(optionId) : optionId === question.correctAnswer;
  }

  chooseOption(question: TestQuestion, optionId: string): void {
    if (this.isLocked(question)) {
      return;
    }

    if (question.type === 'multiple-select') {
      const chosen = new Set(splitAnswer(this.answerOf(question.id)));
      if (chosen.has(optionId)) {
        chosen.delete(optionId);
      } else {
        chosen.add(optionId);
      }
      this.setAnswer(question.id, [...chosen].sort().join(ANSWER_SEPARATOR));
      return;
    }

    this.setAnswer(question.id, optionId);
  }

  /** Practice: show feedback. Ordering: also records the order on screen. */
  checkAnswer(question: TestQuestion): void {
    if (question.type === 'ordering' && !isAnswered(this.answerOf(question.id))) {
      this.setAnswer(question.id, this.orderFor(question).join(ANSWER_SEPARATOR));
    }
    if (this.isExam() || !isAnswered(this.answerOf(question.id))) {
      return;
    }
    this.checked.update((current) => new Set(current).add(question.id));
  }

  // ----- ordering -----

  orderFor(question: TestQuestion): string[] {
    const answer = splitAnswer(this.answerOf(question.id));
    if (answer.length) {
      return answer;
    }

    let start = this.startOrders.get(question.id);
    if (!start) {
      const ids = question.options.map((option) => option.id);
      start = [...ids];
      // Shuffle until it differs from the right order (when there is more than one item).
      for (let tries = 0; tries < 5 && start.join() === correctOrder(question).join() && ids.length > 1; tries += 1) {
        start.sort(() => Math.random() - 0.5);
      }
      this.startOrders.set(question.id, start);
    }
    return start;
  }

  optionText(question: TestQuestion, optionId: string): string {
    return question.options.find((option) => option.id === optionId)?.text ?? '';
  }

  moveItem(question: TestQuestion, position: number, delta: number): void {
    const order = [...this.orderFor(question)];
    const target = position + delta;
    if (target < 0 || target >= order.length) {
      return;
    }
    [order[position], order[target]] = [order[target], order[position]];
    this.setAnswer(question.id, order.join(ANSWER_SEPARATOR));
  }

  orderItemBorder(question: TestQuestion, optionId: string, position: number): string {
    if (!this.isLocked(question)) {
      return 'border-slate-200';
    }
    return correctOrder(question)[position] === optionId ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-rose-500 ring-1 ring-rose-500';
  }

  inputBorder(question: TestQuestion): string {
    if (!this.isLocked(question)) {
      return 'border-slate-300 bg-white focus:border-[#007979]';
    }
    return this.isRight(question) ? 'border-emerald-500 bg-white ring-1 ring-emerald-500' : 'border-rose-500 bg-white ring-1 ring-rose-500';
  }

  // ----- option styles (right and wrong on the border only) -----

  optionClass(question: TestQuestion, optionId: string): string {
    const chosen = this.isChosen(question.id, optionId);

    if (this.isLocked(question)) {
      if (this.isRightOption(question, optionId)) {
        return 'border-emerald-500 bg-white font-semibold text-slate-900 ring-1 ring-emerald-500';
      }
      return chosen ? 'border-rose-500 bg-white text-slate-900 ring-1 ring-rose-500' : 'border-slate-200 bg-white text-slate-500';
    }

    return chosen
      ? 'border-[#007979] bg-teal-50 font-semibold text-[#00605f]'
      : 'border-slate-200 bg-white text-slate-800 hover:border-[#007979]';
  }

  letterClass(question: TestQuestion, optionId: string): string {
    const chosen = this.isChosen(question.id, optionId);

    if (this.isLocked(question)) {
      if (this.isRightOption(question, optionId)) {
        return 'border-emerald-500 text-emerald-700';
      }
      return chosen ? 'border-rose-500 text-rose-700' : 'border-slate-200 text-slate-400';
    }

    return chosen ? 'border-[#007979] bg-[#007979] text-white' : 'border-slate-300 text-slate-500';
  }

  mapClass(index: number, question: TestQuestion): string {
    if (index === this.currentQuestionIndex()) {
      return 'bg-[#032d42] text-white';
    }

    const answer = this.answerOf(question.id);
    if (!isAnswered(answer)) {
      return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    }

    if (this.isExam() || !this.isLocked(question) || isAnswerCorrect(question, answer)) {
      return 'bg-teal-100 text-[#00605f] hover:bg-teal-200';
    }

    return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
  }


  // ---------- flags ----------

  isFlagged(questionId: string): boolean {
    return this.flagged().has(questionId);
  }

  toggleFlag(questionId: string): void {
    this.flagged.update((current) => {
      const next = new Set(current);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }

  // ---------- navigation ----------

  previousQuestion(): void {
    this.testStore.previousQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextQuestion(): void {
    // Practice: answer (and check) first. Exam: skipping is allowed.
    if (!this.canGoNext()) {
      return;
    }
    this.testStore.nextQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isFirstQuestion(): boolean {
    return this.currentQuestionIndex() === 0;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex() === this.totalQuestions() - 1;
  }

  exit(): void {
    if (this.answeredCount() > 0 && !window.confirm(this.i18n.t('Leave this test? Your answers will not be saved.'))) {
      return;
    }
    this.testStore.setQuestions([]);
    void this.router.navigate([this.baseRoute, 'quizzes']);
  }

  // ---------- finish ----------

  async finish(): Promise<void> {
    if (this.testStore.loading()) {
      return;
    }

    const unanswered = this.totalQuestions() - this.answeredCount();
    const flagged = this.flagged().size;

    if (unanswered > 0 && !window.confirm(this.i18n.t('{0} questions are not answered yet. Finish anyway?', [unanswered]))) {
      return;
    }

    if (unanswered === 0 && flagged > 0 && !window.confirm(this.i18n.t('{0} questions are flagged for review. Finish anyway?', [flagged]))) {
      return;
    }

    try {
      const result = await this.testStore.finishTest();
      if (!result) {
        return;
      }
      await this.router.navigate([this.baseRoute, 'results']);
    } catch (error) {
      console.error('Failed to save Test Center result:', error);
      this.testStore.setError('Your result could not be saved. Please try again before leaving this page.');
    }
  }
}
