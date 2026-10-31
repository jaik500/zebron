import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { TestDifficulty, TestMode, TestStore } from '../../store/test.store';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TestQuestionService } from '../../services/test-question.service';
import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { learnerBaseRoute } from '../../learner-route';

@Component({
  selector: 'app-quiz-details',

  standalone: true,

  imports: [
    TranslatePipe,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],

  template: `
    <main class="min-h-screen bg-gray-50 mt-16">
      <!-- ===================================================
           HEADER
           =================================================== -->

   

      <!-- ===================================================
           LOADING QUIZ DETAILS
           =================================================== -->

      @if (loading()) {
        <section class="mx-auto max-w-5xl px-5 py-8 text-center sm:px-6 lg:px-8">
          <div
            class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5F4F4] border-t-[#007979]"
            [attr.aria-label]="'Loading' | t"
          ></div>

          <p class="mt-3 text-sm text-gray-500">{{ 'Loading quiz details...' | t }}</p>
        </section>
      }

      <!-- ===================================================
           QUIZ DETAILS ERROR
           =================================================== -->

      @if (!loading() && error()) {
        <section class="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <div
              class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600"
            >
              <mat-icon aria-hidden="true"> error_outline </mat-icon>
            </div>

            <h1 class="mt-3 text-lg font-bold text-gray-900">{{ 'Quiz not found' | t }}</h1>

            <p class="mt-1 text-sm text-gray-600">
              {{ error() | t }}
            </p>

            <a
              [routerLink]="learnerBaseRoute()"
              class="mt-4 inline-flex rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#006666]"
            >
              {{ 'Back to Test Center' | t }}
            </a>
          </div>
        </section>
      }

      <!-- ===================================================
           QUIZ DETAILS CONTENT
           =================================================== -->

      @if (!loading() && !error() && course()) {
        <!-- ================================================
             QUIZ DETAILS HERO
             ================================================ -->

        <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
          <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-1 sm:px-6 lg:px-8">
            <!-- Back to the quiz list -->
            <a
              [routerLink]="[learnerBaseRoute(), 'quizzes']"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              [attr.aria-label]="'Back to quiz list' | t"
              [title]="'Back to quiz list' | t"
            >
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
            </a>

            <!-- Title, details and description -->
            <div class="min-w-0 flex-1">
              <h1 class="truncate text-base font-semibold leading-tight sm:text-lg">
                {{ course()!.name }}
              </h1>

              <div class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-white/80">
                <span class="shrink-0 rounded bg-white/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white">
                  {{ course()!.type | t }}
                </span>
                @if (course()!.certificationCode) {
                  <span class="shrink-0 font-semibold text-white">{{ course()!.certificationCode }}</span>
                }
                @if (course()!.provider) {
                  <span class="truncate">
                    <span aria-hidden="true">·</span> {{ course()!.provider }}
                  </span>
                }
              </div>

              @if (course()!.description) {
                <p class="mt-1 hidden max-w-3xl truncate text-xs text-white/70 sm:block" [title]="course()!.description | t">
                  {{ course()!.description | t }}
                </p>
              }
            </div>

            <!-- Question count -->
            <div class="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-center">
              <p class="text-lg font-bold leading-none">
                {{ courseQuestionCount() ?? course()!.questionCount }}
              </p>
              <p class="mt-0.5 text-[12px] text-white/80">{{ 'questions' | t }}</p>
            </div>
          </div>
        </header>

        <!-- ================================================
             TOPIC SELECTION
             ================================================ -->

        <section class="mx-auto max-w-5xl px-5 py-7 sm:px-6 lg:px-8">
          <div class="grid gap-7 lg:grid-cols-[1fr_280px]">
            <!-- ============================================
                 TOPICS
                 ============================================ -->

            <div>
              <div>
                <h2 class="text-xl font-bold text-[#032D42]">{{ 'Choose quiz topics' | t }}</h2>

                <p class="mt-1 text-sm text-gray-600">
                  {{ 'You can select one or several topics.' | t }}
                </p>
              </div>

              <!-- SELECT ALL -->
              @if (topics().length > 0) {
                <div
                  class="mt-4 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p class="text-sm font-semibold text-[#032D42]">{{ 'Select all topics' | t }}</p>

                    <p class="text-xs text-gray-500">{{ 'Include every topic in this quiz.' | t }}</p>
                  </div>

                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-[#007979] px-3 py-1.5 text-xs font-semibold text-[#007979] transition hover:bg-[#E5F4F4]"
                    (click)="toggleAllTopics()"
                  >
                    {{ allTopicsSelected() ? ('Clear all' | t) : ('Select all' | t) }}
                  </button>
                </div>
              }

              <!-- TOPIC LOADING -->
              @if (topicsLoading()) {
                <div class="mt-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <div
                    class="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-[#E5F4F4] border-t-[#007979]"
                    [attr.aria-label]="'Loading topics' | t"
                  ></div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Loading topics...' | t }}</p>
                </div>
              }

              <!-- TOPIC ERROR -->
              @if (!topicsLoading() && topicsError()) {
                <div
                  class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {{ topicsError() | t }}
                </div>
              }

              <!-- TOPIC LIST -->
              @if (!topicsLoading() && !topicsError() && topics().length > 0) {
                <div class="mt-4 space-y-2.5">
                  @for (topic of topics(); track topic.id) {
                    <button
                      type="button"
                      class="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200"
                      [class.border-[#12BFC3]]="isSelected(topic.id)"
                      [class.bg-[#E5F4F4]]="isSelected(topic.id)"
                      [class.border-gray-200]="!isSelected(topic.id)"
                      [class.bg-white]="!isSelected(topic.id)"
                      [class.hover:border-[#12BFC3]]="!isSelected(topic.id)"
                      [class.hover:bg-[#E5F4F4]]="!isSelected(topic.id)"
                      (click)="toggleTopic(topic.id)"
                    >
                      <!-- Selection indicator -->
                      <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
                        [class.border-[#007979]]="isSelected(topic.id)"
                        [class.bg-[#007979]]="isSelected(topic.id)"
                        [class.border-gray-300]="!isSelected(topic.id)"
                      >
                        @if (isSelected(topic.id)) {
                          <mat-icon
                            class="!h-4 !w-4 !text-base !leading-4 !text-white"
                            aria-hidden="true"
                          >
                            check
                          </mat-icon>
                        }
                      </span>

                      <!-- Topic -->
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-bold text-[#032D42]">
                          {{ topic.name }}
                        </span>

                        @if (topic.description) {
                          <span class="mt-0.5 block text-xs leading-5 text-gray-600">
                            {{ topic.description | t }}
                          </span>
                        }
                      </span>

                      <!-- Question count -->
                      <span class="shrink-0 text-sm font-medium text-gray-500">
                        {{ '{0} questions' | t: [topicQuestionCountFor(topic)] }}
                      </span>
                    </button>
                  }
                </div>
              }

              <!-- NO TOPICS -->
              @if (!topicsLoading() && !topicsError() && topics().length === 0) {
                <div
                  class="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center"
                >
                  <div
                    class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E5F4F4] text-[#007979]"
                  >
                    <mat-icon aria-hidden="true"> topic </mat-icon>
                  </div>

                  <h3 class="mt-3 text-sm font-bold text-[#032D42]">
                    {{ 'Quiz topics are not available yet' | t }}
                  </h3>

                  <p class="mt-1 text-xs text-gray-600">
                    {{ 'Topics for this quiz haven\\u0027t been published yet.' | t }}
                  </p>
                </div>
              }
            </div>

            <!-- ============================================
                 PRACTICE SUMMARY
                 ============================================ -->

            <aside>
              <div class="sticky top-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
                  >
                    <mat-icon aria-hidden="true"> quiz </mat-icon>
                  </div>
                  <h2 class="text-base font-bold text-[#032D42]">{{ 'Quiz setup' | t }}</h2>
                </div>

                <dl class="mt-3 grid grid-cols-2 gap-2">
                  <div class="rounded-lg bg-gray-50 px-3 py-2">
                    <dt class="text-[11px] text-gray-500">{{ 'Topics' | t }}</dt>
                    <dd class="text-base font-bold text-[#032D42]">{{ selectedTopicCount() }}</dd>
                  </div>
                  <div class="rounded-lg bg-gray-50 px-3 py-2">
                    <dt class="text-[11px] text-gray-500">{{ 'No. of questions' | t }}</dt>
                    <dd class="text-base font-bold text-[#032D42]">{{ selectedQuestionCount() }}</dd>
                  </div>
                </dl>

                <!-- Test settings -->
                <div class="mt-5 flex flex-col gap-4">
                  <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-field--dense" subscriptSizing="dynamic">
                    <mat-label>{{ 'Number of questions' | t }}</mat-label>
                    <mat-select
                      [value]="effectiveQuestionCount()"
                      (selectionChange)="testStore.setQuestionCount($event.value)"
                      [disabled]="selectedQuestionCount() === 0"
                    >
                      @for (count of questionCountChoices(); track count) {
                        <mat-option [value]="count">
                          {{ count === selectedQuestionCount() ? ('All ({0})' | t: [count]) : count }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-field--dense" subscriptSizing="dynamic">
                    <mat-label>{{ 'Difficulty' | t }}</mat-label>
                    <mat-select [value]="difficulty()" (selectionChange)="testStore.setDifficulty($event.value)">
                      @for (level of difficultyOptions; track level.value) {
                        <mat-option [value]="level.value">{{ level.label | t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-field--dense" subscriptSizing="dynamic">
                    <mat-label>{{ 'Test mode' | t }}</mat-label>
                    <mat-select [value]="mode()" (selectionChange)="testStore.setMode($event.value)">
                      @for (option of modeOptions; track option.value) {
                        <mat-option [value]="option.value">{{ option.label | t }}</mat-option>
                      }
                    </mat-select>
                    <mat-hint>{{ (mode() === 'practice' ? 'Instant feedback' : 'Feedback at the end') | t }}</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-field--dense" subscriptSizing="dynamic">
                    <mat-label>{{ 'Test options' | t }}</mat-label>
                    <mat-select
                      multiple
                      [value]="selectedOptions()"
                      (selectionChange)="setTestOptions($event.value)"
                      [placeholder]="'None' | t"
                    >
                      <mat-select-trigger>
                        {{ optionsSummary() | t: [selectedOptions().length] }}
                      </mat-select-trigger>
                      <mat-option value="questions">{{ 'Randomize questions' | t }}</mat-option>
                      <mat-option value="answers">{{ 'Randomize answers' | t }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <button
                  type="button"
                  class="mt-4 w-full rounded-lg bg-[#007979] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:bg-gray-300"
                  [disabled]="!canStart() || starting()"
                  (click)="startQuiz()"
                >
                  @if (starting()) {
                    {{ 'Starting...' | t }}
                  } @else {
                    {{ (mode() === 'exam' ? 'Start exam' : 'Start practice') | t }} →
                  }
                </button>

                @if (selectedTopicCount() === 0) {
                  <p class="mt-2 text-center text-[11px] text-gray-500">
                    {{ 'Select at least one topic' | t }}
                  </p>
                } @else if (selectedQuestionCount() === 0) {
                  <p class="mt-2 text-center text-[11px] text-amber-600">
                    {{ 'Only {0} questions are currently available for the selected topics.' | t: [0] }}
                  </p>
                }
              </div>
            </aside>
          </div>
        </section>
      }
    </main>
  `,

  styles: [],
})
export class QuizDetailsComponent implements OnInit {
  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly quizService = inject(QuizService);

  private readonly organizationContext = inject(OrganizationContextService);

  protected readonly testStore = inject(TestStore);

  private readonly questionService = inject(TestQuestionService);

  private readonly partnerOrganizationContext = inject(PartnerOrganizationContextService);

  private readonly pageTitleService = inject(PageTitleService);

  /**
   * Dynamic titles: the global header shows "<Organization> Learning"
   * (same as the quiz list) and the browser tab shows the quiz name.
   * Effects, so both update once the organization and quiz load.
   */
  /** Platform pages (/test-center/...) have no organizationId in the route. */
  private readonly isOrganizationRoute = this.route.snapshot.pathFromRoot.some(
    (snapshot) => snapshot.paramMap.has('organizationId'),
  );

  private readonly headerTitle = effect(() => {
    const organizationName = this.isOrganizationRoute
      ? this.partnerOrganizationContext.organization()?.name?.trim() ||
        this.organizationContext.organizationName().trim() ||
        'Organization'
      : 'Zebron';

    this.pageTitleService.setTitle(`${organizationName} Learning`);
  });

  private readonly tabTitle = effect(() => {
    const quizName = this.course()?.name?.trim();

    if (quizName) {
      this.pageTitleService.setDocumentTitle(quizName);
    }
  });

  // =====================================================
  // QUIZ DETAILS STATE
  // =====================================================

  readonly course = signal<Quiz | null>(null);

  readonly loading = signal(true);

  readonly error = signal('');

  /** Real published-question counts. null until loaded. */
  readonly courseQuestionCount = signal<number | null>(null);

  readonly topicQuestionCounts = signal<Record<string, number>>({});

  // =====================================================
  // TEST STORE STATE
  // =====================================================

  /** Topics are owned by TestStore. */
  readonly topics = this.testStore.topics;

  /** Selected topics are also owned by TestStore. */
  readonly selectedTopics = this.testStore.selectedTopicIds;

  /** Topic loading/error state is owned by TestStore. */
  readonly topicsLoading = this.testStore.loading;

  readonly topicsError = this.testStore.error;

  // =====================================================
  // DERIVED STATE
  // =====================================================

  readonly selectedTopicCount = computed(() => this.selectedTopics().length);

  readonly selectedQuestionCount = this.testStore.selectedTopicQuestionCount;

  readonly allTopicsSelected = computed(() => {
    const topics = this.topics();

    const selected = this.selectedTopics();

    return topics.length > 0 && topics.every((topic) => selected.includes(topic.id));
  });

  /**
   * The organization ID is on the parent route
   * (partner/org/:organizationId/learn/test-center), so this checks
   * the current route, then the parent, then the organization context.
   */
  private resolveOrganizationId(): string | null {
    return (
      this.route.snapshot.paramMap.get('organizationId') ??
      this.route.parent?.snapshot.paramMap.get('organizationId') ??
      this.organizationContext.organizationId() ??
      null
    );
  }

  readonly organizationId = computed(() => this.resolveOrganizationId());

  /**
   * Links stay in the section the page was opened from. Uses the route
   * only, so a platform quiz never links into a selected organization.
   */
  readonly learnerBaseRoute = computed(() => learnerBaseRoute(this.route));

  backToCourses(): void {
    void this.router.navigate([this.learnerBaseRoute()]);
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('The quiz could not be identified.');
      this.loading.set(false);
      return;
    }

    // Resolve the organization once, before anything else runs.
    const organizationId = this.resolveOrganizationId();

    // The store must know the organization BEFORE topics or questions load,
    // otherwise its own organizationId() can be empty on this route.
    this.testStore.setOrganizationId(organizationId);

    // Start from a clean selection so topics from a previous course
    // don't carry over into this quiz.
    this.testStore.clearTopics();

    try {
      this.loading.set(true);
      this.error.set('');

      if (!organizationId) {
        this.error.set('Please select an organization before loading Test Center topics.');
        return;
      }

      const course = await this.quizService.getQuizBySlug(organizationId, slug);

      if (!course) {
        this.error.set('The requested quiz could not be found.');
        return;
      }

      this.course.set(course);
      this.testStore.setCourse(course);

      // Pass the organization ID from the URL directly to the store.
      await this.testStore.loadTopics(course.id, organizationId);
      await this.loadQuestionCounts(course, organizationId); // add
    } catch (error) {
      console.error('Failed to load quiz details:', error);

      this.error.set('We could not load these quiz details right now.');
    } finally {
      this.loading.set(false);
    }
  }

  // =====================================================
  // TOPIC SELECTION
  // =====================================================

  toggleTopic(topicId: string): void {
    this.testStore.toggleTopic(topicId);
  }

  isSelected(topicId: string): boolean {
    return this.selectedTopics().includes(topicId);
  }

  toggleAllTopics(): void {
    if (this.allTopicsSelected()) {
      this.testStore.setTopics([]);

      return;
    }

    this.testStore.setTopics(this.topics().map((topic) => topic.id));
  }

  // =====================================================
  // TEST SETTINGS (same options as the Test Setup page)
  // =====================================================

  readonly difficulty = this.testStore.difficulty;

  readonly mode = this.testStore.mode;

  readonly randomizeQuestions = this.testStore.randomizeQuestions;

  readonly randomizeAnswers = this.testStore.randomizeAnswers;

  readonly starting = signal(false);

  /** Test options as one multi-select: 'questions' and/or 'answers'. */
  readonly selectedOptions = computed(() => [
    ...(this.randomizeQuestions() ? ['questions'] : []),
    ...(this.randomizeAnswers() ? ['answers'] : []),
  ]);

  readonly optionsSummary = computed(() => {
    const options = this.selectedOptions();

    if (options.length === 2) {
      return 'Randomize questions and answers';
    }
    if (options.length === 0) {
      return 'In order';
    }
    return options[0] === 'questions' ? 'Randomize questions' : 'Randomize answers';
  });

  setTestOptions(options: string[]): void {
    this.testStore.setRandomizeQuestions(options.includes('questions'));
    this.testStore.setRandomizeAnswers(options.includes('answers'));
  }

  private readonly standardCounts = [10, 20, 50, 100];

  readonly difficultyOptions: { value: TestDifficulty; label: string }[] = [
    { value: 'mixed', label: 'Mixed' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  readonly modeOptions: { value: TestMode; label: string }[] = [
    { value: 'practice', label: 'Practice' },
    { value: 'exam', label: 'Exam simulation' },
  ];

  /**
   * 10/20/50/100 below what's available, then always "All (n)", so a
   * quiz with a single question can still be taken.
   */
  readonly questionCountChoices = computed(() => {
    const available = this.selectedQuestionCount();

    if (available === 0) {
      return [];
    }

    return [
      ...this.standardCounts.filter((count) => count < available),
      available,
    ];
  });

  /** The chosen count, capped at the questions available. */
  readonly effectiveQuestionCount = computed(() =>
    Math.min(this.testStore.questionCount(), this.selectedQuestionCount()),
  );

  readonly canStart = computed(
    () =>
      this.course() !== null &&
      this.selectedTopicCount() > 0 &&
      this.effectiveQuestionCount() > 0,
  );

  // =====================================================
  // START
  // =====================================================

  /** Load the questions and go straight to the practice page. */
  async startQuiz(): Promise<void> {
    const course = this.course();
    const topics = this.selectedTopics();

    if (!course || topics.length === 0 || !this.canStart() || this.starting()) {
      return;
    }

    this.starting.set(true);

    try {
      this.testStore.setCourse(course);
      this.testStore.setQuestionCount(this.effectiveQuestionCount());
      this.testStore.clearError();

      const questionsLoaded = await this.testStore.loadQuestions();

      if (questionsLoaded) {
        await this.router.navigate([this.learnerBaseRoute(), 'practice']);
      }
    } finally {
      this.starting.set(false);
    }
  }

  /** Live count when available, cached field as a fallback. */
  topicQuestionCountFor(topic: { id: string; questionCount: number }): number {
    if (this.courseQuestionCount() === null) {
      return topic.questionCount ?? 0;
    }

    return this.topicQuestionCounts()[topic.id] ?? 0;
  }

  private async loadQuestionCounts(
    course: Quiz,
    organizationId: string | null,
  ): Promise<void> {
    const isPlatform = course.scope === 'platform';
    const ownerId = isPlatform ? null : organizationId;

    if (!isPlatform && !ownerId) {
      return;
    }

    try {
      const questions = await this.questionService.getQuestionsForTest(
        ownerId,
        course.id,
        [],
        'mixed',
        isPlatform ? 'platform' : 'organization',
      );

      const byTopic: Record<string, number> = {};

      for (const question of questions) {
        byTopic[question.topicId] = (byTopic[question.topicId] ?? 0) + 1;
      }

      this.topicQuestionCounts.set(byTopic);
      this.courseQuestionCount.set(questions.length);
    } catch (error) {
      // Keep the cached numbers if the live count can't be loaded.
      console.warn('Unable to load live question counts:', error);
    }
  }
}
