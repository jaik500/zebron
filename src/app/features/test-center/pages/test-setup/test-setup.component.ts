import { Component, computed, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TestMode, TestStore } from '../../store/test.store';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { learnerBaseRoute, useLearningHeaderTitle } from '../../learner-route';

@Component({
  selector: 'app-test-setup',

  standalone: true,

  imports: [
    TranslatePipe,RouterLink, MatIconModule, MatCheckboxModule],

  template: `
    <main class="mt-16 min-h-screen bg-gray-50">
      <!-- Page header -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <a
            [routerLink]="backLink()"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            [attr.aria-label]="'Back to quiz' | t"
            [title]="'Back to quiz' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-semibold leading-tight sm:text-lg">
              {{ hasCourse() ? courseName() : ('Test setup' | t) }}
            </h1>
            @if (hasCourse()) {
              <p class="mt-0.5 truncate text-xs text-white/80">
                {{ 'Test setup' | t }}
                <span aria-hidden="true">·</span>
                {{ '{0} topic{1}' | t: [selectedTopicCount(), (selectedTopicCount() === 1 ? '' : 's')] }}
                <span aria-hidden="true">·</span>
                {{ '{0} questions available' | t: [availableQuestions()] }}
              </p>
            }
          </div>
        </div>
      </header>

      <section class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        @if (!hasCourse()) {
          <div
            class="mt-6
                   rounded-xl
                   border
                   border-amber-200
                   bg-amber-50
                   p-6"
          >
            <div
              class="flex
                     items-start
                     gap-3"
            >
              <mat-icon class="!text-amber-600" aria-hidden="true"> info </mat-icon>

              <div>
                <h1
                  class="text-base
                         font-bold
                         text-gray-900"
                >
                  {{ 'No test selected' | t }}
                </h1>

                <p
                  class="mt-1
                         text-sm
                         text-gray-600"
                >
                  {{ 'Choose a course and topics before configuring your practice test.' | t }}
                </p>

                <a
                  [routerLink]="[baseRoute, 'quizzes']"
                  class="mt-4
                         inline-flex
                         rounded-lg
                         bg-[#007979]
                         px-4
                         py-2
                         text-sm
                         font-semibold
                         text-white
                         hover:bg-[#006666]"
                >
                  {{ 'Browse Test Center' | t }}
                </a>
              </div>
            </div>
          </div>
        } @else {
          <!-- ===============================================
               SETUP
               =============================================== -->

          <div
            class="grid
                   gap-6
                   lg:grid-cols-[1fr_280px]"
          >
            <div class="space-y-5">
              <!-- =========================================
                   QUESTION COUNT
                   ========================================= -->

              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <div>
                  <h2
                    class="text-base
                           font-bold
                           text-[#032D42]"
                  >
                    {{ 'Number of questions' | t }}
                  </h2>

                  <p
                    class="mt-1
                           text-xs
                           text-gray-500"
                  >
                    {{ 'Choose how many questions you want in this test.' | t }}
                  </p>
                </div>

                <div
                  class="mt-4
                         grid
                         grid-cols-4
                         gap-2"
                >
                  @for (count of questionCounts; track count) {
                    <button
                      type="button"
                      class="rounded-lg
                             border
                             px-3
                             py-2.5
                             text-sm
                             font-semibold
                             transition"
                      [class.border-[#007979]]="questionCount() === count"
                      [class.bg-[#E5F4F4]]="questionCount() === count"
                      [class.text-[#007979]]="questionCount() === count"
                      [class.border-gray-200]="questionCount() !== count"
                      [class.bg-white]="questionCount() !== count"
                      [class.text-gray-700]="questionCount() !== count"
                      [class.hover:border-[#12BFC3]]="questionCount() !== count"
                      (click)="setQuestionCount(count)"
                    >
                      {{ count }}
                    </button>
                  }
                </div>

                @if (availableQuestions() < questionCount()) {
                  <p
                    class="mt-3
                           text-xs
                           text-amber-600"
                  >
                    {{ 'Only {0} questions are currently available for the selected topics.' | t: [availableQuestions()] }}
                  </p>
                }
              </section>

              <!-- =========================================
                   DIFFICULTY
                   ========================================= -->

              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <h2
                  class="text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ 'Difficulty' | t }}
                </h2>

                <p
                  class="mt-1
                         text-xs
                         text-gray-500"
                >
                  {{ 'Choose the difficulty of your questions.' | t }}
                </p>

                <div
                  class="mt-4
                         grid
                         gap-2
                         sm:grid-cols-4"
                >
                  @for (level of difficultyOptions; track level.value) {
                    <button
                      type="button"
                      class="rounded-lg
                             border
                             px-3
                             py-3
                             text-left
                             transition"
                      [class.border-[#007979]]="difficulty() === level.value"
                      [class.bg-[#E5F4F4]]="difficulty() === level.value"
                      [class.border-gray-200]="difficulty() !== level.value"
                      [class.bg-white]="difficulty() !== level.value"
                      [class.hover:border-[#12BFC3]]="difficulty() !== level.value"
                      (click)="setDifficulty(level.value)"
                    >
                      <span
                        class="block
                               text-sm
                               font-semibold
                               text-[#032D42]"
                      >
                        {{ level.label | t }}
                      </span>

                      <span
                        class="mt-0.5
                               block
                               text-[11px]
                               leading-4
                               text-gray-500"
                      >
                        {{ level.description | t }}
                      </span>
                    </button>
                  }
                </div>
              </section>

              <!-- =========================================
                   MODE
                   ========================================= -->

              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <h2
                  class="text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ 'Test mode' | t }}
                </h2>

                <p
                  class="mt-1
                         text-xs
                         text-gray-500"
                >
                  {{ 'Choose how you want to take the test.' | t }}
                </p>

                <div
                  class="mt-4
                         grid
                         gap-3
                         sm:grid-cols-2"
                >
                  <!-- Practice -->

                  <button
                    type="button"
                    class="rounded-xl
                           border
                           p-4
                           text-left
                           transition"
                    [class.border-[#007979]]="mode() === 'practice'"
                    [class.bg-[#E5F4F4]]="mode() === 'practice'"
                    [class.border-gray-200]="mode() !== 'practice'"
                    [class.bg-white]="mode() !== 'practice'"
                    (click)="setMode('practice')"
                  >
                    <div
                      class="flex
                             items-center
                             gap-3"
                    >
                      <div
                        class="flex
                               h-9
                               w-9
                               items-center
                               justify-center
                               rounded-lg
                               bg-[#E5F4F4]
                               text-[#007979]"
                      >
                        <mat-icon aria-hidden="true"> school </mat-icon>
                      </div>

                      <div>
                        <h3
                          class="text-sm
                                 font-bold
                                 text-[#032D42]"
                        >
                          {{ 'Practice' | t }}
                        </h3>

                        <p
                          class="text-[11px]
                                 text-gray-500"
                        >
                          {{ 'Learn as you go' | t }}
                        </p>
                      </div>
                    </div>

                    <p
                      class="mt-3
                             text-xs
                             leading-5
                             text-gray-600"
                    >
                      {{ 'See whether your answer is correct and review the explanation immediately.' | t }}
                    </p>
                  </button>

                  <!-- Exam -->

                  <button
                    type="button"
                    class="rounded-xl
                           border
                           p-4
                           text-left
                           transition"
                    [class.border-[#007979]]="mode() === 'exam'"
                    [class.bg-[#E5F4F4]]="mode() === 'exam'"
                    [class.border-gray-200]="mode() !== 'exam'"
                    [class.bg-white]="mode() !== 'exam'"
                    (click)="setMode('exam')"
                  >
                    <div
                      class="flex
                             items-center
                             gap-3"
                    >
                      <div
                        class="flex
                               h-9
                               w-9
                               items-center
                               justify-center
                               rounded-lg
                               bg-[#E5F4F4]
                               text-[#007979]"
                      >
                        <mat-icon aria-hidden="true"> timer </mat-icon>
                      </div>

                      <div>
                        <h3
                          class="text-sm
                                 font-bold
                                 text-[#032D42]"
                        >
                          {{ 'Exam simulation' | t }}
                        </h3>

                        <p
                          class="text-[11px]
                                 text-gray-500"
                        >
                          {{ 'Test yourself' | t }}
                        </p>
                      </div>
                    </div>

                    <p
                      class="mt-3
                             text-xs
                             leading-5
                             text-gray-600"
                    >
                      {{ 'Complete the test without seeing answers until you finish.' | t }}
                    </p>
                  </button>
                </div>
              </section>

              <!-- =========================================
                   OPTIONS
                   ========================================= -->

              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <h2
                  class="text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ 'Test options' | t }}
                </h2>

                <div class="mt-4 space-y-3">
                  <!-- Random questions -->

                  <mat-checkbox
                    class="zb-checkbox--top"
                    [checked]="randomizeQuestions()"
                    (change)="setRandomizeQuestions($event.checked)"
                  >
                    <span class="block text-sm font-semibold text-[#032D42]">{{ 'Randomize questions' | t }}</span>
                    <span class="block text-xs text-gray-500">{{ 'Change the order each time you start a test.' | t }}</span>
                  </mat-checkbox>

                  <!-- Random answers -->

                  <mat-checkbox
                    class="zb-checkbox--top"
                    [checked]="randomizeAnswers()"
                    (change)="setRandomizeAnswers($event.checked)"
                  >
                    <span class="block text-sm font-semibold text-[#032D42]">{{ 'Randomize answers' | t }}</span>
                    <span class="block text-xs text-gray-500">{{ 'Shuffle the answer choices.' | t }}</span>
                  </mat-checkbox>
                </div>
              </section>
            </div>

            <!-- =============================================
                 SUMMARY
                 ============================================= -->

            <aside>
              <div
                class="sticky
                       top-4
                       rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <div
                  class="flex
                         h-10
                         w-10
                         items-center
                         justify-center
                         rounded-lg
                         bg-[#E5F4F4]
                         text-[#007979]"
                >
                  <mat-icon aria-hidden="true"> quiz </mat-icon>
                </div>

                <h2
                  class="mt-3
                         text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ 'Ready to practice?' | t }}
                </h2>

                <dl
                  class="mt-4
                         space-y-3"
                >
                  <div
                    class="flex
                           justify-between
                           gap-4"
                  >
                    <dt class="text-xs text-gray-500">{{ 'Questions' | t }}</dt>

                    <dd
                      class="text-xs
                             font-bold
                             text-[#032D42]"
                    >
                      {{ selectedQuestionCount() }}
                    </dd>
                  </div>

                  <div
                    class="flex
                           justify-between
                           gap-4"
                  >
                    <dt class="text-xs text-gray-500">{{ 'Difficulty' | t }}</dt>

                    <dd
                      class="text-xs
                             font-bold
                             capitalize
                             text-[#032D42]"
                    >
                      {{ difficulty() | t }}
                    </dd>
                  </div>

                  <div
                    class="flex
                           justify-between
                           gap-4"
                  >
                    <dt class="text-xs text-gray-500">{{ 'Mode' | t }}</dt>

                    <dd
                      class="text-xs
                             font-bold
                             text-[#032D42]"
                    >
                      {{ mode() === 'practice' ? ('Practice' | t) : ('Exam' | t) }}
                    </dd>
                  </div>
                </dl>

                <div
                  class="my-4
                         border-t
                         border-gray-100"
                ></div>

                <button
                  type="button"
                  class="w-full
                         rounded-lg
                         bg-[#007979]
                         px-4
                         py-3
                         text-sm
                         font-bold
                         text-white
                         shadow-sm
                         transition
                         hover:bg-[#006666]
                         disabled:cursor-not-allowed
                         disabled:bg-gray-300"
                  [disabled]="!canStart()"
                  (click)="startTest()"
                >
                  {{ 'Start Test →' | t }}
                </button>

                @if (!canStart()) {
                  <p
                    class="mt-2
                           text-center
                           text-[11px]
                           text-gray-500"
                  >
                    {{ 'Select a valid number of questions to continue.' | t }}
                  </p>
                }
              </div>
            </aside>
          </div>
        }
      </section>
    </main>
  `,

  styles: [],
})
export class TestSetupComponent implements OnInit {
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  /** '/test-center' or the organization's learner route. */
  readonly baseRoute = learnerBaseRoute(this.route);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly testStore = inject(TestStore);

  // =====================================================
  // QUESTION COUNTS
  // =====================================================

  readonly questionCounts = [10, 20, 50, 100];

  // =====================================================
  // DIFFICULTY OPTIONS
  // =====================================================

  readonly difficultyOptions = [
    {
      value: 'easy' as const,
      label: 'Easy',
      description: 'Build your foundation',
    },
    {
      value: 'medium' as const,
      label: 'Medium',
      description: 'Test your knowledge',
    },
    {
      value: 'hard' as const,
      label: 'Hard',
      description: 'Challenge yourself',
    },
    {
      value: 'mixed' as const,
      label: 'Mixed',
      description: 'A balanced test',
    },
  ];

  // =====================================================
  // STORE STATE
  // =====================================================

  readonly course = this.testStore.course;

  readonly selectedTopicIds = this.testStore.selectedTopicIds;

  readonly questionCount = this.testStore.questionCount;

  readonly difficulty = this.testStore.difficulty;

  readonly mode = this.testStore.mode;

  readonly randomizeQuestions = this.testStore.randomizeQuestions;

  readonly randomizeAnswers = this.testStore.randomizeAnswers;

  // =====================================================
  // DERIVED STATE
  // =====================================================

  readonly hasCourse = computed(() => this.course() !== null && this.selectedTopicIds().length > 0);

  readonly courseName = computed(() => this.course()?.name ?? '');

  /** Back to the quiz the topics were chosen on, or to the quiz list. */
  readonly backLink = computed(() => {
    const slug = this.course()?.slug;

    return slug
      ? [this.baseRoute, 'quiz-details', slug]
      : [this.baseRoute, 'quizzes'];
  });

  readonly selectedTopicCount = computed(() => this.selectedTopicIds().length);

  readonly availableQuestions =
  this.testStore.selectedTopicQuestionCount;

  readonly selectedQuestionCount = computed(() =>
  Math.min(
    this.questionCount(),
    this.availableQuestions(),
  ),
);

  readonly canStart = computed(
    () =>
      this.hasCourse() &&
      this.availableQuestions() > 0 &&
      this.questionCount() > 0 &&
      this.questionCount() <= this.availableQuestions(),
  );

 ngOnInit(): void {
  // Refresh from the actual published question bank
  // when the setup page opens.
  void this.testStore.refreshAvailableQuestionCount();
}

  // =====================================================
  // CONFIGURATION
  // =====================================================

  setQuestionCount(count: number): void {
    this.testStore.setQuestionCount(count);
  }

  setDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): void {
    this.testStore.setDifficulty(difficulty);
  }

  setMode(mode: TestMode): void {
    this.testStore.setMode(mode);
  }

  setRandomizeQuestions(value: boolean): void {
    this.testStore.setRandomizeQuestions(value);
  }

  setRandomizeAnswers(value: boolean): void {
    this.testStore.setRandomizeAnswers(value);
  }

  // =====================================================
  // START TEST
  // =====================================================

  /**
 * Start the configured Test Center session.
 *
 * Questions are loaded before navigating to Practice.
 */
async startTest(): Promise<void> {

  if (!this.canStart()) {
    return;
  }

  this.testStore.clearError();

  const questionsLoaded =
    await this.testStore.loadQuestions();

  if (!questionsLoaded) {
    return;
  }

  this.router.navigate([this.baseRoute, 'practice']);
}
}
