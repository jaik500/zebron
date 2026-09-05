import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';

import { TestQuestionOption } from '../../models/test-question.model';

import { TestStore } from '../../store/test.store';

@Component({
  selector: 'app-test-practice',

  standalone: true,

  imports: [CommonModule, RouterLink],

  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- =====================================================
           HEADER
           ===================================================== -->

      <!-- =====================================================
     HEADER
     ===================================================== -->

      <header
        class="border-b border-[#0D343A]
         bg-[#123F46] text-white"
      >
        <div
          class="mx-auto max-w-5xl px-3 py-3
           sm:px-4 sm:py-3"
        >
          <div
            class="flex items-center
             justify-between gap-3"
          >
            <!-- Course -->
            <div class="min-w-0">
              <p
                class="text-[11px] font-medium uppercase
                 tracking-wide text-[#B8D5D7]"
              >
                Test Center
              </p>

              @if (course(); as currentCourse) {
                <h1
                  class="truncate text-base font-bold
                   text-white sm:text-lg"
                >
                  {{ currentCourse.name }}
                </h1>
              } @else {
                <h1
                  class="text-base font-bold
                   text-white sm:text-lg"
                >
                  Practice Test
                </h1>
              }
            </div>

            <!-- Test mode -->
            <div
              class="shrink-0 rounded-full
               border border-white/10
               bg-white/10
               px-2.5 py-1
               text-[11px] font-semibold
               text-[#E5F3F4]"
            >
              {{ modeLabel() }}
            </div>
          </div>
        </div>
      </header>

      <!-- =====================================================
           MAIN
           ===================================================== -->

      <section
        class="mx-auto max-w-5xl px-3 py-4
               sm:px-4 sm:py-5 lg:px-5"
      >
        <!-- ===================================================
             NO TEST
             =================================================== -->

        @if (!hasQuestions()) {
          <div
            class="rounded-xl border border-gray-200
                   bg-white p-6 text-center
                   shadow-sm"
          >
            <div
              class="mx-auto flex h-11 w-11
                     items-center justify-center
                     rounded-full bg-gray-100
                     text-lg"
            >
              !
            </div>

            <h2
              class="mt-3 text-lg font-bold
                     text-gray-900"
            >
              No active test
            </h2>

            <p
              class="mx-auto mt-2 max-w-md
                     text-sm leading-6 text-gray-600"
            >
              There are no questions loaded for the current test session.
            </p>

            <a
              routerLink="/test-center"
              class="mt-5 inline-flex items-center
                     rounded-lg bg-gray-900
                     px-4 py-2 text-sm
                     font-semibold text-white
                     transition hover:bg-gray-800"
            >
              Return to Test Center
            </a>
          </div>
        }

        <!-- ===================================================
             ACTIVE TEST
             =================================================== -->

        @else if (currentQuestion(); as question) {
          <div class="space-y-3">
            <!-- =================================================
                 PROGRESS
                 ================================================= -->

           <!-- =================================================
     PROGRESS
     ================================================= -->

<section
  class="rounded-xl border border-gray-200
         bg-white p-3 shadow-sm"
>

  <!-- Top information row -->
  <div
    class="flex items-center
           justify-between gap-3"
  >

    <!-- Question -->
    <div class="shrink-0">

      <p
        class="text-[11px] font-medium
               text-gray-500"
      >
        Question
      </p>

      <p
        class="text-sm font-bold
               text-gray-900"
      >
        {{ questionNumber() }}
        of
        {{ totalQuestions() }}
      </p>

    </div>


    <!-- Difficulty + question type -->
    <div
      class="flex min-w-0 flex-1
             items-center justify-center
             gap-1.5"
    >

      <span
        class="rounded-full
               bg-gray-100 px-2.5 py-0.5
               text-[11px] font-medium
               text-gray-600"
      >
        {{ difficultyLabel(question.difficulty) }}
      </span>

      @if (question.type === 'true-false') {

        <span
          class="rounded-full
                 bg-gray-100 px-2.5 py-0.5
                 text-[11px] font-medium
                 text-gray-600"
        >
          True / False
        </span>

      } @else {

        <span
          class="rounded-full
                 bg-gray-100 px-2.5 py-0.5
                 text-[11px] font-medium
                 text-gray-600"
        >
          Multiple Choice
        </span>

      }

    </div>


    <!-- Progress -->
    <div class="shrink-0 text-right">

      <p
        class="text-[11px] font-medium
               text-gray-500"
      >
        Progress
      </p>

      <p
        class="text-sm font-bold
               text-gray-900"
      >
        {{ progress() }}%
      </p>

    </div>

  </div>


  <!-- Progress bar -->
  <div
    class="mt-2 h-1.5 overflow-hidden
           rounded-full bg-gray-200"
    role="progressbar"
    [attr.aria-valuenow]="progress()"
    aria-valuemin="0"
    aria-valuemax="100"
  >

    <div
      class="h-full rounded-full
             bg-[#007979]
             transition-all duration-300"
      [style.width.%]="progress()"
    ></div>

  </div>


  <!-- Answer summary -->
  <div
    class="mt-2 flex flex-wrap
           items-center gap-x-3
           gap-y-1 text-[11px]
           text-gray-500"
  >

    <span>
      Answered:
      <strong class="text-gray-700">
        {{ answeredCount() }}
      </strong>
    </span>

    <span>
      Remaining:
      <strong class="text-gray-700">
        {{ remainingCount() }}
      </strong>
    </span>

  </div>

</section>

            <!-- =================================================
                 QUESTION CARD
                 ================================================= -->

            <section
              class="rounded-xl border
                     border-gray-200 bg-white
                     shadow-sm"
            >
              <div class="p-4 sm:p-5">
                <!-- Topic / difficulty -->
              
              

                <!-- Question -->
                <h2
                  class="text-lg font-bold
                         leading-7 text-gray-900
                         sm:text-xl sm:leading-7"
                >
                  {{ question.question }}
                </h2>

                <!-- Hint -->
                @if (question.hint) {
                  <details
                    class="mt-4 rounded-lg
                           border border-gray-200
                           bg-gray-50"
                  >
                    <summary
                      class="cursor-pointer
                             px-3 py-2 text-xs
                             font-semibold
                             text-gray-700"
                    >
                      Show hint
                    </summary>

                    <p
                      class="border-t
                             border-gray-200
                             px-3 py-2 text-sm
                             leading-5 text-gray-600"
                    >
                      {{ question.hint }}
                    </p>
                  </details>
                }

                <!-- =================================================
                     ANSWER OPTIONS
                     ================================================= -->

                <div
                  class="mt-4 space-y-1"
                  role="radiogroup"
                  [attr.aria-label]="'Answer choices for question ' + questionNumber()"
                >
                  @for (option of question.options; track option.id; let optionIndex = $index) {
                    <button
                      type="button"
                      role="radio"
                      [attr.aria-checked]="isSelected(option.id)"
                      (click)="selectAnswer(option.id)"
                      class="group flex w-full
                             items-center gap-3
                             rounded-lg border
                             px-3 py-2.5
                             text-left transition"
                      [class.border-[#007979]]="isSelected(option.id)"
                      [class.bg-[#007979]/5]="isSelected(option.id)"
                      [class.border-gray-200]="!isSelected(option.id)"
                      [class.hover:border-gray-400]="!isSelected(option.id)"
                    >
                      <!-- Letter -->
                      <span
                        class="flex h-8 w-8
                               shrink-0 items-center
                               justify-center
                               rounded-full border
                               text-xs font-bold"
                        [class.border-[#007979]]="isSelected(option.id)"
                        [class.bg-[#007979]]="isSelected(option.id)"
                        [class.text-white]="isSelected(option.id)"
                        [class.border-gray-300]="!isSelected(option.id)"
                        [class.text-gray-600]="!isSelected(option.id)"
                      >
                        {{ optionLetter(optionIndex) }}
                      </span>

                      <!-- Answer text -->
                      <span
                        class="text-sm leading-5
                               text-gray-800
                               sm:text-[15px]
                               sm:leading-6"
                      >
                        {{ option.text }}
                      </span>
                    </button>
                  }
                </div>

                <!-- Explanation is intentionally NOT shown
                     until an answer has been submitted. -->
              </div>

              <!-- =================================================
                   NAVIGATION
                   ================================================= -->

              <div
                class="flex flex-col gap-2
                       border-t border-gray-200
                       p-3 sm:flex-row
                       sm:items-center
                       sm:justify-between
                       sm:p-4"
              >
                <!-- Previous -->
                <button
                  type="button"
                  (click)="previousQuestion()"
                  [disabled]="isFirstQuestion()"
                  class="inline-flex
                         items-center justify-center
                         rounded-lg border
                         border-gray-300
                         px-4 py-2 text-sm
                         font-semibold text-gray-700
                         transition hover:bg-gray-50
                         disabled:cursor-not-allowed
                         disabled:opacity-40"
                >
                  ← Previous
                </button>

                <!-- Status -->
                <div
                  class="order-first text-center
                         text-[11px] text-gray-500
                         sm:order-none"
                >
                  @if (isLastQuestion()) {
                    Last question
                  } @else {
                    Select an answer and continue
                  }
                </div>

                <!-- Next -->
                <button
                  type="button"
                  (click)="nextQuestion()"
                  [disabled]="!hasSelectedAnswer()"
                  class="inline-flex
                         items-center justify-center
                         rounded-lg bg-gray-900
                         px-4 py-2 text-sm
                         font-semibold text-white
                         transition hover:bg-gray-800
                         disabled:cursor-not-allowed
                         disabled:opacity-40"
                >
                  @if (isLastQuestion()) {
                    Finish Test
                  } @else {
                    Next →
                  }
                </button>
              </div>
            </section>
          </div>
        }
      </section>
    </main>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPracticeComponent {
  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private readonly router = inject(Router);

  readonly testStore = inject(TestStore);

  // =====================================================
  // STORE STATE
  // =====================================================

  readonly course = this.testStore.course;

  readonly currentQuestion = this.testStore.currentQuestion;

  readonly currentQuestionIndex = this.testStore.currentQuestionIndex;

  readonly totalQuestions = this.testStore.totalQuestions;

  readonly answeredCount = this.testStore.answeredCount;

  readonly remainingCount = this.testStore.remainingCount;

  readonly selectedAnswers = this.testStore.selectedAnswers;

  readonly mode = this.testStore.mode;

  // =====================================================
  // DERIVED STATE
  // =====================================================

  readonly hasQuestions = computed(() => this.totalQuestions() > 0);

  readonly questionNumber = computed(() => this.currentQuestionIndex() + 1);

  readonly progress = computed(() => {
    const total = this.totalQuestions();

    if (total === 0) {
      return 0;
    }

    return Math.round(((this.currentQuestionIndex() + 1) / total) * 100);
  });

  // =====================================================
  // MODE
  // =====================================================

  modeLabel(): string {
    return this.mode() === 'exam' ? 'Exam Mode' : 'Practice Mode';
  }

  // =====================================================
  // DIFFICULTY
  // =====================================================

  difficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'Easy';

      case 'medium':
        return 'Medium';

      case 'hard':
        return 'Hard';

      default:
        return difficulty;
    }
  }

  // =====================================================
  // ANSWER SELECTION
  // =====================================================

  selectAnswer(answerId: string): void {
    const question = this.currentQuestion();

    if (!question) {
      return;
    }

    this.testStore.selectAnswer(question.id, answerId);
  }

  isSelected(answerId: string): boolean {
    const question = this.currentQuestion();

    if (!question) {
      return false;
    }

    return this.selectedAnswers()[question.id] === answerId;
  }

  hasSelectedAnswer(): boolean {
    const question = this.currentQuestion();

    if (!question) {
      return false;
    }

    return Boolean(this.selectedAnswers()[question.id]);
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  previousQuestion(): void {
    this.testStore.previousQuestion();
  }

  nextQuestion(): void {
    if (!this.hasSelectedAnswer()) {
      return;
    }

    if (this.isLastQuestion()) {
      this.finishTest();

      return;
    }

    this.testStore.nextQuestion();
  }

  isFirstQuestion(): boolean {
    return this.currentQuestionIndex() === 0;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex() === this.totalQuestions() - 1;
  }

  // =====================================================
  // FINISH
  // =====================================================

  private finishTest(): void {
  const result = this.testStore.completeTest();

  if (!result) {
    console.error('Unable to complete Test Center session.');
    return;
  }

  void this.router.navigate(['/test-center/results']);
}

  // =====================================================
  // OPTION LETTER
  // =====================================================

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
