import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';

import { TestStore } from '../../store/test.store';

@Component({
  selector: 'app-test-results',

  standalone: true,

  imports: [CommonModule, RouterLink],

  template: `
    <main class="min-h-screen bg-slate-50">
      <!-- HEADER -->
      <header
        class="border-b border-[#032D42]
         bg-[#032D42] text-white"
      >
        <div
          class="mx-auto max-w-6xl px-4 py-2
           sm:px-6 lg:px-8"
        >
          <div
            class="flex flex-col gap-2
             sm:flex-row sm:items-center
             sm:justify-between"
          >
            <div>
              <p class="text-sm font-medium text-white/70">Test Center</p>

              <h1 class="text-2xl font-bold text-white">Test Results</h1>
            </div>

            @if (course(); as selectedCourse) {
              <p
                class="text-sm font-medium
                 text-white/80"
              >
                {{ selectedCourse.name }}
              </p>
            }
          </div>
        </div>
      </header>

      <!-- CONTENT -->
      <section
        class="mx-auto max-w-6xl px-4 py-4
               sm:px-6 lg:px-8"
      >
        @if (!result()) {
          <!-- EMPTY STATE -->
          <div
            class="rounded-2xl border
                   border-slate-200 bg-white
                   p-8 text-center shadow-sm"
          >
            <h2 class="text-xl font-bold text-slate-900">No completed test</h2>

            <p
              class="mx-auto mt-2 max-w-md
                     text-sm text-slate-600"
            >
              There is no completed Test Center session available to display.
            </p>

            <a
              routerLink="/test-center"
              class="mt-6 inline-flex rounded-lg
                     bg-[#007979] px-5 py-2.5
                     text-sm font-semibold text-white
                     hover:bg-[#006666]"
            >
              Back to Test Center
            </a>
          </div>
        } @else if (result(); as completedResult) {
          <!-- SCORE SUMMARY -->
          <div
            class="grid gap-4
                   lg:grid-cols-[1fr_2fr]"
          >
            <article
              class="rounded-2xl border
                     border-slate-200 bg-white
                     p-6 shadow-sm"
            >
              <p
                class="text-sm font-medium
                       text-slate-500"
              >
                Your Score
              </p>

              <p
                class="mt-3 text-6xl font-bold
                       tracking-tight text-[#007979]"
              >
                {{ completedResult.scorePercentage }}%
              </p>

              <p
                class="mt-3 text-lg font-semibold
                       text-slate-900"
              >
                {{ performanceLabel() }}
              </p>

              <p class="mt-2 text-sm text-slate-600">
                {{ completedResult.correctAnswers }}
                of
                {{ completedResult.totalQuestions }}
                questions correct.
              </p>
            </article>

            <!-- STATISTICS -->
            <article
              class="rounded-2xl border
                     border-slate-200 bg-white
                     p-6 shadow-sm"
            >
              <div
                class="grid grid-cols-2 gap-4
                       sm:grid-cols-4"
              >
                <div class="rounded-xl bg-emerald-50 p-4">
                  <p
                    class="text-xs font-medium
                           uppercase text-emerald-700"
                  >
                    Correct
                  </p>

                  <p
                    class="mt-1 text-2xl font-bold
                           text-emerald-800"
                  >
                    {{ completedResult.correctAnswers }}
                  </p>
                </div>

                <div class="rounded-xl bg-red-50 p-4">
                  <p
                    class="text-xs font-medium
                           uppercase text-red-700"
                  >
                    Incorrect
                  </p>

                  <p
                    class="mt-1 text-2xl font-bold
                           text-red-800"
                  >
                    {{ completedResult.incorrectAnswers }}
                  </p>
                </div>

                <div class="rounded-xl bg-amber-50 p-4">
                  <p
                    class="text-xs font-medium
                           uppercase text-amber-700"
                  >
                    Unanswered
                  </p>

                  <p
                    class="mt-1 text-2xl font-bold
                           text-amber-800"
                  >
                    {{ completedResult.unansweredQuestions }}
                  </p>
                </div>

                <div class="rounded-xl bg-slate-100 p-4">
                  <p
                    class="text-xs font-medium
                           uppercase text-slate-600"
                  >
                    Answered
                  </p>

                  <p
                    class="mt-1 text-2xl font-bold
                           text-slate-900"
                  >
                    {{ completedResult.answeredQuestions }}
                  </p>
                </div>
              </div>

              <div
                class="mt-6 border-t
                       border-slate-200 pt-5"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    class="rounded-full bg-slate-100
                           px-3 py-1 text-xs font-medium
                           text-slate-700"
                  >
                    {{ completedResult.mode | titlecase }}
                  </span>

                  <span
                    class="rounded-full bg-slate-100
                           px-3 py-1 text-xs font-medium
                           text-slate-700"
                  >
                    {{ completedResult.difficulty | titlecase }}
                  </span>
                </div>
              </div>
            </article>
          </div>

          <!-- TOPIC PERFORMANCE -->
          @if (completedResult.topicPerformance.length) {
            <section
              class="mt-6 rounded-2xl border
                     border-slate-200 bg-white
                     p-6 shadow-sm"
            >
              <h2
                class="text-lg font-bold
                       text-slate-900"
              >
                Performance by Topic
              </h2>

              <p class="mt-1 text-sm text-slate-600">
                See how you performed across the topics covered by this test.
              </p>

              <div class="mt-6 space-y-5">
                @for (topic of completedResult.topicPerformance; track topic.topicId) {
                  <div>
                    <div
                      class="flex items-center
                             justify-between gap-4"
                    >
                      <div>
                        <p
                          class="text-sm font-semibold
                                 text-slate-900"
                        >
                          {{ topic.topicName }}
                        </p>

                        <p
                          class="mt-1 text-xs
                                 text-slate-500"
                        >
                          {{ topic.correctAnswers }}
                          correct of
                          {{ topic.totalQuestions }}
                        </p>
                      </div>

                      <span
                        class="text-sm font-bold
                               text-slate-900"
                      >
                        {{ topic.percentage }}%
                      </span>
                    </div>

                    <div
                      class="mt-2 h-2 overflow-hidden
                             rounded-full bg-slate-100"
                    >
                      <div
                        class="h-full rounded-full
                               bg-[#007979]"
                        [style.width.%]="topic.percentage"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- REVIEW -->
          <section
            class="mt-6 rounded-2xl border
                   border-slate-200 bg-white
                   p-6 shadow-sm"
          >
            <button
              type="button"
              class="flex w-full items-center
                     justify-between text-left"
              (click)="showReview.set(!showReview())"
            >
              <div>
                <h2
                  class="text-lg font-bold
                         text-slate-900"
                >
                  Review Answers
                </h2>

                <p
                  class="mt-1 text-sm
                         text-slate-600"
                >
                  Review each question and see the correct answer.
                </p>
              </div>

              <span
                class="text-sm font-semibold
                       text-[#007979]"
              >
                {{ showReview() ? 'Hide' : 'Show' }}
              </span>
            </button>

            @if (showReview()) {
              <div
                class="mt-6 space-y-5
                       border-t border-slate-200
                       pt-6"
              >
                @for (
                  question of completedResult.questionResults;
                  track question.questionId;
                  let index = $index
                ) {
                  <article
                    class="rounded-xl border p-5"
                    [class.border-emerald-200]="question.isCorrect"
                    [class.bg-emerald-50]="question.isCorrect"
                    [class.border-red-200]="
                      !question.isCorrect && question.selectedAnswerId !== null
                    "
                    [class.bg-red-50]="!question.isCorrect && question.selectedAnswerId !== null"
                    [class.border-amber-200]="question.selectedAnswerId === null"
                    [class.bg-amber-50]="question.selectedAnswerId === null"
                  >
                    <div
                      class="flex items-start
                             justify-between gap-4"
                    >
                      <div>
                        <p
                          class="text-xs font-semibold
                                 uppercase tracking-wide
                                 text-slate-500"
                        >
                          Question {{ index + 1 }}
                        </p>

                        <h3
                          class="mt-2 text-sm font-semibold
                                 text-slate-900"
                        >
                          {{ question.question }}
                        </h3>
                      </div>

                      @if (question.isCorrect) {
                        <span
                          class="shrink-0 rounded-full
                                 bg-emerald-100 px-3 py-1
                                 text-xs font-bold
                                 text-emerald-700"
                        >
                          Correct
                        </span>
                      } @else if (question.selectedAnswerId === null) {
                        <span
                          class="shrink-0 rounded-full
                                 bg-amber-100 px-3 py-1
                                 text-xs font-bold
                                 text-amber-700"
                        >
                          Unanswered
                        </span>
                      } @else {
                        <span
                          class="shrink-0 rounded-full
                                 bg-red-100 px-3 py-1
                                 text-xs font-bold
                                 text-red-700"
                        >
                          Incorrect
                        </span>
                      }
                    </div>

                    <div
                      class="mt-4 grid gap-3
                             sm:grid-cols-2"
                    >
                      <div
                        class="rounded-lg
                          bg-white/70 p-3"
                      >
                        <p
                          class="text-xs font-medium
                            text-slate-500"
                        >
                          Your Answer
                        </p>

                        <p
                          class="mt-1 text-sm font-semibold
                            text-slate-900"
                        >
                          {{ answerLabel(question.questionId, question.selectedAnswerId) }}
                        </p>
                      </div>

                      <div
                        class="rounded-lg
                          bg-white/70 p-3"
                      >
                        <p
                          class="text-xs font-medium
                            text-slate-500"
                        >
                          Correct Answer
                        </p>

                        <p
                          class="mt-1 text-sm font-semibold
                            text-slate-900"
                        >
                          {{ answerLabel(question.questionId, question.correctAnswerId) }}
                        </p>
                      </div>
                    </div>

                    @if (question.explanation) {
                      <div
                        class="mt-4 rounded-lg
                               bg-white/70 p-4"
                      >
                        <p
                          class="text-xs font-semibold
                                 uppercase tracking-wide
                                 text-slate-500"
                        >
                          Explanation
                        </p>

                        <p
                          class="mt-1 text-sm leading-6
                                 text-slate-700"
                        >
                          {{ question.explanation }}
                        </p>
                      </div>
                    }
                  </article>
                }
              </div>
            }
          </section>

          <!-- ACTIONS -->
          <div
            class="mt-6 flex flex-col-reverse
                   gap-3 sm:flex-row
                   sm:justify-end"
          >
            <button
              type="button"
              class="rounded-lg border
                     border-slate-300 bg-white
                     px-5 py-2.5 text-sm
                     font-semibold text-slate-700
                     hover:bg-slate-50"
              (click)="takeAnotherTest()"
            >
              Take Another Test
            </button>

            @if (courseSlug()) {
              <a
                [routerLink]="['/test-center/courses', courseSlug()]"
                class="rounded-lg bg-[#007979]
                       px-5 py-2.5 text-center
                       text-sm font-semibold
                       text-white hover:bg-[#006666]"
              >
                Back to Course
              </a>
            }
          </div>
        }
      </section>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResultsComponent {
  private readonly router = inject(Router);

  protected readonly testStore = inject(TestStore);

  protected readonly result = this.testStore.completedResult;

  protected readonly course = this.testStore.course;

  protected readonly showReview = signal(false);

  protected performanceLabel(): string {
    const score = this.result()?.scorePercentage ?? 0;

    if (score >= 90) {
      return 'Excellent performance';
    }

    if (score >= 80) {
      return 'Strong performance';
    }

    if (score >= 70) {
      return 'Good performance';
    }

    if (score >= 60) {
      return 'Needs improvement';
    }

    return 'Keep practicing';
  }

  protected answerLabel(questionId: string, answerId: string | null): string {
    if (!answerId) {
      return 'Not answered';
    }

    const question = this.testStore.questions().find((item) => item.id === questionId);

    if (!question) {
      return answerId;
    }

    const option = question.options.find((option) => option.id === answerId);

    return option?.text ?? answerId;
  }

  protected courseSlug(): string | null {
    return this.course()?.slug ?? null;
  }

  protected takeAnotherTest(): void {
    this.testStore.setQuestions([]);

    const slug = this.courseSlug();

    if (!slug) {
      void this.router.navigate(['/test-center']);

      return;
    }

    void this.router.navigate(['/test-center/courses', slug]);
  }
}
