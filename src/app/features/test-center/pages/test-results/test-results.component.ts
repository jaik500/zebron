import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ProgressRingComponent } from '../../../courses/components/progress-ring.component';
import { learnerBaseRoute, useLearningHeaderTitle } from '../../learner-route';
import { answerText } from '../../models/question-answers';
import { TestStore } from '../../store/test.store';

/** Topics under this score are suggested for more practice. */
const WEAK_TOPIC = 70;

/**
 * Test Center results, in the same style as course exam results: a score
 * ring, a bar per topic, one-click practice of weak topics, and a review
 * of every answer with the right one and why.
 */
@Component({
  selector: 'app-test-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, ProgressRingComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2 sm:px-6">
          <a
            [routerLink]="[baseRoute, 'quizzes']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Back to quizzes' | t"
            [title]="'Back to quizzes' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <nav class="flex min-w-0 flex-1 items-center gap-1 text-sm" [attr.aria-label]="'Breadcrumb' | t">
            <a [routerLink]="[baseRoute, 'quizzes']" class="hidden shrink-0 text-white/80 hover:text-white hover:underline sm:inline">{{ 'Test Center' | t }}</a>
            <mat-icon class="!hidden !h-4 !w-4 shrink-0 !text-base text-white/60 sm:!inline-block" aria-hidden="true">chevron_right</mat-icon>
            <span class="truncate font-semibold">{{ 'Results' | t }}{{ course()?.name ? ' · ' + course()!.name : '' }}</span>
          </nav>
        </div>
      </header>

      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        @if (result(); as outcome) {
          <!-- Score -->
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div class="flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left" [ngClass]="toneBackground()">
              <app-progress-ring [percent]="outcome.scorePercentage" [size]="112" [color]="toneColor()" />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  {{ (outcome.mode === 'exam' ? 'Exam mode' : 'Practice mode') | t }}
                </p>
                <h1 class="mt-1 text-2xl font-bold text-slate-900">{{ performanceLabel() | t }}</h1>
                <p class="mt-1 text-slate-700">{{ '{0} of {1} correct' | t: [outcome.correctAnswers, outcome.totalQuestions] }}</p>
                @if (outcome.unansweredQuestions) {
                  <p class="mt-1 text-sm text-slate-500">{{ '{0} not answered' | t: [outcome.unansweredQuestions] }}</p>
                }
              </div>
            </div>

            <!-- Next steps -->
            <div class="flex flex-wrap gap-2 border-t border-slate-100 p-4">
              @if (weakTopics().length) {
                <button
                  type="button"
                  class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                  [disabled]="testStore.loading()"
                  (click)="practiseWeakTopics()"
                >
                  <mat-icon aria-hidden="true">fitness_center</mat-icon>
                  {{ (weakTopics().length === 1 ? 'Practise your weak topic' : 'Practise your {0} weak topics') | t: [weakTopics().length] }}
                </button>
              }
              <button
                type="button"
                class="inline-flex h-11 items-center gap-1 rounded-lg px-5 font-semibold"
                [ngClass]="weakTopics().length ? 'border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#007979] text-white hover:bg-[#006666]'"
                (click)="takeAnotherTest()"
              >
                <mat-icon aria-hidden="true">replay</mat-icon>{{ 'Practise again' | t }}
              </button>
              <a
                [routerLink]="[baseRoute, 'quizzes']"
                class="inline-flex h-11 items-center gap-1 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <mat-icon aria-hidden="true">apps</mat-icon>{{ 'Other quizzes' | t }}
              </a>
            </div>
            @if (testStore.error(); as error) {
              <p class="mx-4 mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{{ error | t }}</p>
            }
          </section>

          <!-- By topic -->
          @if (outcome.topicPerformance.length) {
            <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'By topic' | t }}</h2>
              <ul class="mt-3 flex flex-col gap-3">
                @for (topic of outcome.topicPerformance; track topic.topicId) {
                  <li>
                    <div class="flex justify-between gap-3 text-sm">
                      <span class="text-slate-800">
                        {{ topic.topicName }}
                        @if (topic.percentage < weakLimit) {
                          <span class="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{{ 'Practise' | t }}</span>
                        }
                      </span>
                      <span class="shrink-0 tabular-nums text-slate-500">{{ topic.correctAnswers }}/{{ topic.totalQuestions }} · {{ topic.percentage }}%</span>
                    </div>
                    <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        class="h-full rounded-full"
                        [ngClass]="topic.percentage >= weakLimit ? 'bg-emerald-500' : 'bg-amber-500'"
                        [style.width.%]="topic.percentage"
                      ></div>
                    </div>
                  </li>
                }
              </ul>
            </section>
          }

          <!-- Review -->
          <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'Review your answers' | t }}</h2>
              <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-sm" role="group">
                @for (option of reviewFilters; track option.key) {
                  <button
                    type="button"
                    class="rounded-md px-3 py-1"
                    [ngClass]="reviewFilter() === option.key ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-600'"
                    [attr.aria-pressed]="reviewFilter() === option.key"
                    (click)="reviewFilter.set(option.key)"
                  >
                    {{ option.label | t }}
                  </button>
                }
              </div>
            </div>

            <ol class="mt-4 flex flex-col gap-3">
              @for (item of reviewItems(); track item.questionId) {
                <li class="rounded-xl border p-4" [ngClass]="item.isCorrect ? 'border-emerald-200' : 'border-rose-200'">
                  <div class="flex items-start gap-2">
                    <mat-icon class="shrink-0" [ngClass]="item.isCorrect ? 'text-emerald-600' : 'text-rose-600'" aria-hidden="true">
                      {{ item.isCorrect ? 'check_circle' : item.selectedAnswerId ? 'cancel' : 'remove_circle_outline' }}
                    </mat-icon>
                    <p class="font-medium text-slate-900">{{ item.question }}</p>
                  </div>
                  <dl class="mt-2 grid gap-1 pl-8 text-sm">
                    <div class="flex flex-wrap gap-1">
                      <dt class="text-slate-500">{{ 'Your answer:' | t }}</dt>
                      <dd [ngClass]="item.isCorrect ? 'text-emerald-800' : 'text-rose-800'">{{ answerLabel(item.questionId, item.selectedAnswerId) | t }}</dd>
                    </div>
                    @if (!item.isCorrect && item.correctAnswerId) {
                      <div class="flex flex-wrap gap-1">
                        <dt class="text-slate-500">{{ 'Right answer:' | t }}</dt>
                        <dd class="font-semibold text-emerald-800">{{ answerLabel(item.questionId, item.correctAnswerId) }}</dd>
                      </div>
                    } @else if (!item.isCorrect && result()?.examOnly) {
                      <dd class="text-xs text-slate-500">{{ 'The right answers to this exam are kept private.' | t }}</dd>
                    }
                    @if (item.explanation) {
                      <dd class="mt-1 rounded-lg bg-slate-50 p-2 text-slate-700">{{ item.explanation }}</dd>
                    }
                  </dl>
                </li>
              } @empty {
                <li class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{{ 'Nothing to review here. Well done!' | t }}</li>
              }
            </ol>
          </section>
        } @else {
          <div class="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">insights</mat-icon>
            <h1 class="mt-2 text-lg font-semibold text-slate-900">{{ 'No results to show' | t }}</h1>
            <p class="mt-1 text-sm text-slate-600">{{ 'Finish a quiz to see your score and review your answers.' | t }}</p>
            <a
              [routerLink]="[baseRoute, 'quizzes']"
              class="mt-4 inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              {{ 'Browse quizzes' | t }}
            </a>
          </div>
        }
      </div>
    </main>
  `,
})
export class TestResultsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** '/test-center' or the organization's learner route. */
  readonly baseRoute = learnerBaseRoute(this.route);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  protected readonly testStore = inject(TestStore);
  protected readonly result = this.testStore.completedResult;
  protected readonly course = this.testStore.course;
  protected readonly weakLimit = WEAK_TOPIC;

  protected readonly reviewFilters = [
    { key: 'wrong' as const, label: 'To review' },
    { key: 'all' as const, label: 'All' },
  ];
  protected readonly reviewFilter = signal<'wrong' | 'all'>('wrong');

  protected readonly reviewItems = computed(() => {
    const items = this.result()?.questionResults ?? [];
    const withExplanation = items.map((item) => ({
      ...item,
      correctAnswerId: item.correctAnswerId,
      explanation: item.explanation || this.testStore.questions().find((question) => question.id === item.questionId)?.explanation || '',
    }));
    return this.reviewFilter() === 'all' ? withExplanation : withExplanation.filter((item) => !item.isCorrect);
  });

  protected readonly weakTopics = computed(() =>
    (this.result()?.topicPerformance ?? []).filter((topic) => topic.totalQuestions > 0 && topic.percentage < WEAK_TOPIC),
  );

  protected readonly toneColor = computed(() => {
    const score = this.result()?.scorePercentage ?? 0;
    return score >= 80 ? '#047857' : score >= 60 ? '#007979' : '#b45309';
  });

  protected readonly toneBackground = computed(() => {
    const score = this.result()?.scorePercentage ?? 0;
    return score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-teal-50/60' : 'bg-amber-50';
  });

  protected performanceLabel(): string {
    const score = this.result()?.scorePercentage ?? 0;

    if (score >= 90) {
      return 'Excellent work!';
    }
    if (score >= 80) {
      return 'Strong result';
    }
    if (score >= 70) {
      return 'Good result';
    }
    if (score >= 60) {
      return 'Getting there';
    }
    return 'Keep practising';
  }

  protected answerLabel(questionId: string, answerId: string | null): string {
    if (!answerId) {
      return 'Not answered';
    }

    const question = this.testStore.questions().find((item) => item.id === questionId);
    // Every answer type in words: options, several options, text, numbers, order.
    return question ? answerText(question, answerId) || answerId : answerId;
  }

  /** Back to the quiz's details page to set up another round. */
  protected takeAnotherTest(): void {
    this.testStore.setQuestions([]);

    const slug = this.course()?.slug ?? null;
    void this.router.navigate(slug ? [this.baseRoute, 'quiz-details', slug] : [this.baseRoute, 'quizzes']);
  }

  /** Start a new round straight away, on the topics scored under the target. */
  protected async practiseWeakTopics(): Promise<void> {
    const topicIds = this.weakTopics().map((topic) => topic.topicId);
    if (!topicIds.length) {
      return;
    }

    this.testStore.setTopics(topicIds);
    if (await this.testStore.loadQuestions()) {
      await this.router.navigate([this.baseRoute, 'practice']);
    }
  }
}
