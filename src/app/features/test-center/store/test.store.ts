import { Injectable, computed, inject, signal } from '@angular/core';
 
import { Quiz } from '../models/quiz.model';
import { TestTopic } from '../models/test-topic.model';
import { TestQuestion } from '../models/test-question.model';
import { TestQuestionResult, TestResult, TestTopicPerformance } from '../models/test-result.model';
 
import { TestTopicService } from '../services/test-topic.service';
import { TestQuestionService } from '../services/test-question.service';
 
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { TestResultService } from '../services/test-result.service';
 
// =====================================================
// TEST MODE
// =====================================================
 
export type TestMode = 'practice' | 'exam';
 
// =====================================================
// DIFFICULTY
// =====================================================
 
export type TestDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
 
@Injectable({
  providedIn: 'root',
})
export class TestStore {
  // =====================================================
  // SERVICES
  // =====================================================
 
  private readonly topicService = inject(TestTopicService);
 
  private readonly questionService = inject(TestQuestionService);
 
  private readonly authService = inject(AuthService);
 
  private readonly organizationContext = inject(OrganizationContextService);
 
  private readonly testResultService = inject(TestResultService);
 
  // =====================================================
  // ORGANIZATION
  // =====================================================
 
  /**
   * Organization ID taken from the URL by the page that started the quiz.
   *
   * The organization route param lives on a parent route, so
   * OrganizationContextService can be empty on Test Center pages.
   * Pages call setOrganizationId() when they open, and that value
   * takes priority.
   *
   * This is intentionally NOT cleared by resetTest(): the setup,
   * practice and results pages come after quiz-details and need it.
   * Quiz-details sets it again every time it opens.
   */
  private readonly organizationOverride = signal<string | null>(null);
 
  /**
   * Current Test Center organization.
   *
   * The selected organization is the tenant boundary for
   * all Test Center reads and writes.
   */
  readonly organizationId = computed(
    () =>
      this.organizationOverride() ??
      this.organizationContext.organizationId(),
  );
 
  /**
   * Set (or clear) the organization for the current Test Center session.
   */
  setOrganizationId(organizationId: string | null): void {
    this.organizationOverride.set(organizationId?.trim() || null);
  }
 
  // =====================================================
  // COURSE
  // =====================================================
 
  /**
   * Currently selected Test Center course.
   */
  readonly course = signal<Quiz | null>(null);
 
  // =====================================================
  // TOPICS
  // =====================================================
 
  /**
   * Topics available for the selected course.
   */
  readonly topics = signal<TestTopic[]>([]);
 
  /**
   * Topics selected by the user.
   */
  readonly selectedTopicIds = signal<string[]>([]);
 
  /**
   * Actual number of published questions available
   * for the currently selected topics.
   *
   * This is calculated from quizQuestions rather than
   * relying on the cached questionCount fields.
   */
  readonly availableQuestionCount = signal(0);
 
  // =====================================================
  // QUESTIONS
  // =====================================================
 
  /**
   * Questions loaded for the current test.
   */
  readonly questions = signal<TestQuestion[]>([]);
 
  /**
   * Current question index.
   */
  readonly currentQuestionIndex = signal(0);
 
  // =====================================================
  // ANSWERS
  // =====================================================
 
  /**
   * Answers selected by the user.
   *
   * Key   = question ID
   * Value = selected answer ID
   */
  readonly selectedAnswers = signal<Record<string, string>>({});
 
  // =====================================================
  // TEST CONFIGURATION
  // =====================================================
 
  /**
   * Number of questions requested.
   */
  readonly questionCount = signal(20);
 
  /**
   * Selected difficulty.
   */
  readonly difficulty = signal<TestDifficulty>('mixed');
 
  /**
   * Test mode.
   */
  readonly mode = signal<TestMode>('practice');
 
  /**
   * Randomize question order.
   */
  readonly randomizeQuestions = signal(true);
 
  /**
   * Randomize answer choices.
   */
  readonly randomizeAnswers = signal(true);
 
  /**
   * Result generated when the current test is completed.
   *
   * This is intentionally kept in the TestStore for now so that
   * the Results page can consume the result after navigation.
   */
  readonly completedResult = signal<TestResult | null>(null);
 
  /**
   * Indicates whether the current test has been completed.
   */
  readonly testCompleted = computed(() => this.completedResult() !== null);
 
  // =====================================================
  // LOADING / ERROR
  // =====================================================
 
  readonly loading = signal(false);
 
  readonly error = signal('');
 
  // =====================================================
  // DERIVED STATE
  // =====================================================
 
  /**
   * Currently displayed question.
   */
  readonly currentQuestion = computed(() => {
    const questions = this.questions();
 
    const index = this.currentQuestionIndex();
 
    return questions[index] ?? null;
  });
 
  /**
   * Number of loaded questions.
   */
  readonly totalQuestions = computed(() => this.questions().length);
 
  /**
   * Number of answered questions.
   */
  readonly answeredCount = computed(() => Object.keys(this.selectedAnswers()).length);
 
  /**
   * Number of unanswered questions.
   */
  readonly remainingCount = computed(() =>
    Math.max(0, this.totalQuestions() - this.answeredCount()),
  );
 
  /**
   * Current progress percentage.
   */
  readonly progress = computed(() => {
    const total = this.totalQuestions();
 
    if (total === 0) {
      return 0;
    }
 
    return ((this.currentQuestionIndex() + 1) / total) * 100;
  });
 
  /**
   * Number of actual published questions available
   * across the selected topics.
   *
   * The TestQuestion collection is the source of truth.
   */
  readonly selectedTopicQuestionCount = computed(() => this.availableQuestionCount());
 
  // =====================================================
  // COURSE
  // =====================================================
 
  /**
   * Set the active course.
   */
  setCourse(course: Quiz): void {
    this.course.set(course);
  }
 
  // =====================================================
  // TOPICS
  // =====================================================
 
  /**
   * Load active topics for the selected course.
   *
   * Platform courses are loaded without an organization (null).
   * Organization courses require an organization ID.
   *
   * setCourse() must be called before this so the course scope is known.
   */
  async loadTopics(
    quizId: string,
    organizationIdOverride?: string | null,
  ): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');
 
      const course = this.course();
      const isPlatform = course?.scope === 'platform';
 
      const organizationId = isPlatform
        ? null
        : organizationIdOverride?.trim() || this.organizationId();
 
      if (!isPlatform && !organizationId) {
        this.error.set(
          'Please select an organization before loading Test Center topics.',
        );
        this.topics.set([]);
        return;
      }
 
      const topics = await this.topicService.getActiveTopics(
        organizationId,
        quizId,
      );
 
      this.topics.set(topics);
    } catch (error) {
      console.error('Failed to load Test Center topics:', error);
 
      this.error.set('We could not load the topics for this course.');
      this.topics.set([]);
    } finally {
      this.loading.set(false);
    }
  }
 
  /**
   * Replace the selected topic IDs.
   */
  setTopics(topicIds: string[]): void {
    this.selectedTopicIds.set([...topicIds]);
 
    void this.refreshAvailableQuestionCount();
  }
 
  /**
   * Toggle a single topic and refresh the
   * actual published question count.
   */
  toggleTopic(topicId: string): void {
    this.selectedTopicIds.update((selected: string[]) => {
      if (selected.includes(topicId)) {
        return selected.filter((id) => id !== topicId);
      }
 
      return [...selected, topicId];
    });
 
    void this.refreshAvailableQuestionCount();
  }
 
  /**
   * Clear selected topics.
   */
  clearTopics(): void {
    this.selectedTopicIds.set([]);
    this.availableQuestionCount.set(0);
  }
 
  // =====================================================
  // TEST CONFIGURATION
  // =====================================================
 
  setQuestionCount(count: number): void {
    this.questionCount.set(count);
  }
 
  setDifficulty(difficulty: TestDifficulty): void {
    this.difficulty.set(difficulty);
  }
 
  setMode(mode: TestMode): void {
    this.mode.set(mode);
  }
 
  setRandomizeQuestions(value: boolean): void {
    this.randomizeQuestions.set(value);
  }
 
  setRandomizeAnswers(value: boolean): void {
    this.randomizeAnswers.set(value);
  }
 
  // =====================================================
  // QUESTIONS
  // =====================================================
 
  /**
   * Sets the questions for the current test session.
   *
   * Starting a new question set also clears:
   * - current question position
   * - selected answers
   * - previous test results
   */
  setQuestions(questions: TestQuestion[]): void {
    this.questions.set(questions);
 
    this.currentQuestionIndex.set(0);
 
    this.selectedAnswers.set({});
 
    this.completedResult.set(null);
  }
 
  // =====================================================
  // ANSWERS
  // =====================================================
 
  /**
   * Select an answer for a question.
   */
  selectAnswer(questionId: string, answerId: string): void {
    this.selectedAnswers.update((answers: Record<string, string>) => ({
      ...answers,
      [questionId]: answerId,
    }));
  }
 
  /**
   * Get the selected answer for a question.
   */
  getSelectedAnswer(questionId: string): string | null {
    return this.selectedAnswers()[questionId] ?? null;
  }
 
  // =====================================================
  // QUESTION NAVIGATION
  // =====================================================
 
  nextQuestion(): void {
    this.currentQuestionIndex.update((index: number) => {
      const lastIndex = this.questions().length - 1;
 
      return Math.min(index + 1, Math.max(lastIndex, 0));
    });
  }
 
  previousQuestion(): void {
    this.currentQuestionIndex.update((index: number) => Math.max(index - 1, 0));
  }
 
  goToQuestion(index: number): void {
    const maxIndex = Math.max(this.questions().length - 1, 0);
 
    this.currentQuestionIndex.set(Math.min(Math.max(index, 0), maxIndex));
  }
 
  // =====================================================
  // ERROR STATE
  // =====================================================
 
  setError(message: string): void {
    this.error.set(message);
  }
 
  clearError(): void {
    this.error.set('');
  }
 
  // =====================================================
  // RESET
  // =====================================================
 
  /**
   * Completely reset the active test session.
   *
   * The organization override is intentionally kept (see
   * organizationOverride above).
   */
  resetTest(): void {
    this.course.set(null);
 
    this.topics.set([]);
 
    this.selectedTopicIds.set([]);
 
    this.availableQuestionCount.set(0);
 
    this.questions.set([]);
 
    this.currentQuestionIndex.set(0);
 
    this.selectedAnswers.set({});
 
    this.completedResult.set(null);
 
    this.questionCount.set(20);
 
    this.difficulty.set('mixed');
 
    this.mode.set('practice');
 
    this.randomizeQuestions.set(true);
 
    this.randomizeAnswers.set(true);
 
    this.loading.set(false);
 
    this.error.set('');
  }
 
  // =====================================================
  // COMPLETE TEST
  // =====================================================
 
  /**
   * Calculate the result for the active test session.
   *
   * This method only calculates and prepares the result.
   * Persistence is handled by saveCompletedTest().
   */
  completeTest(): TestResult | null {
    const course = this.course();
    const questions = this.questions();
    const answers = this.selectedAnswers();
 
    if (!course || questions.length === 0) {
      this.error.set('There is no active test to complete.');
      return null;
    }
 
    const currentUser = this.authService.user();
 
    if (!currentUser?.id) {
      this.error.set('You must be signed in to complete this test.');
      return null;
    }
 
    const organizationId = this.organizationId();
 
    if (course.scope === 'organization' && !organizationId) {
      this.error.set(
        'Select the organization that owns this course before completing the test.',
      );
      return null;
    }
 
    const questionResults: TestQuestionResult[] = questions.map((question) => {
      const selectedAnswerId = answers[question.id] ?? null;
 
      return {
        questionId: question.id,
        question: question.question,
        topicId: question.topicId,
        selectedAnswerId,
        correctAnswerId: question.correctAnswer,
        isCorrect:
          selectedAnswerId !== null &&
          selectedAnswerId === question.correctAnswer,
        explanation: question.explanation,
      };
    });
 
    const totalQuestions = questionResults.length;
 
    const answeredQuestions = questionResults.filter(
      (result) => result.selectedAnswerId !== null,
    ).length;
 
    const correctAnswers = questionResults.filter(
      (result) => result.isCorrect,
    ).length;
 
    const incorrectAnswers = questionResults.filter(
      (result) => result.selectedAnswerId !== null && !result.isCorrect,
    ).length;
 
    const unansweredQuestions = totalQuestions - answeredQuestions;
 
    const scorePercentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
 
    const topicPerformance: TestTopicPerformance[] = this.topics()
      .map((topic) => {
        const topicResults = questionResults.filter(
          (result) => result.topicId === topic.id,
        );
 
        if (topicResults.length === 0) {
          return null;
        }
 
        const topicAnswered = topicResults.filter(
          (result) => result.selectedAnswerId !== null,
        ).length;
 
        const topicCorrect = topicResults.filter(
          (result) => result.isCorrect,
        ).length;
 
        const topicIncorrect = topicResults.filter(
          (result) => result.selectedAnswerId !== null && !result.isCorrect,
        ).length;
 
        return {
          topicId: topic.id,
          topicName: topic.name,
          totalQuestions: topicResults.length,
          answeredQuestions: topicAnswered,
          correctAnswers: topicCorrect,
          incorrectAnswers: topicIncorrect,
          percentage: Math.round((topicCorrect / topicResults.length) * 100),
        };
      })
      .filter((topic): topic is TestTopicPerformance => topic !== null);
 
    const attemptId = crypto.randomUUID();
 
    const result: TestResult = {
      id: crypto.randomUUID(),
      organizationId: course.scope === 'platform' ? null : organizationId,
      userId: currentUser.id,
      attemptId,
      quizId: course.id,
      quizName: course.name,
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      scorePercentage,
      mode: this.mode(),
      difficulty: this.difficulty(),
      topicPerformance,
      questionResults,
      completedAt: new Date(),
    };
 
    this.completedResult.set(result);
    this.error.set('');
 
    return result;
  }
 
  /**
   * Save the completed test before navigating to results.
   */
  async saveCompletedTest(result: TestResult): Promise<void> {
    const course = this.course();
 
    if (!course) {
      throw new Error('The completed test course is no longer available.');
    }
 
    await this.testResultService.saveCompletedTest({
      result,
      scope: course.scope,
      topicIds: this.selectedTopicIds(),
    });
  }
 
  // =====================================================
  // LOAD QUESTIONS
  // =====================================================
 
  /**
   * Load published questions for the current test configuration.
   *
   * Question order and answer order are randomized here,
   * at the TestStore/session layer.
   *
   * IMPORTANT:
   * The option IDs are never changed.
   *
   * Example:
   *
   * Original:
   *   a = correct
   *   b
   *   c
   *   d
   *
   * Randomized:
   *   c
   *   a = correct
   *   d
   *   b
   *
   * The UI displays A/B/C/D based on array position,
   * while correctness continues to use the stable option ID.
   */
  async loadQuestions(): Promise<boolean> {
    const currentCourse = this.course();
 
    if (!currentCourse) {
      this.questions.set([]);
      this.error.set('Please select a course before starting the test.');
      return false;
    }
 
    if (this.selectedTopicIds().length === 0) {
      this.questions.set([]);
      this.error.set(
        'Please select at least one topic before starting the test.',
      );
      return false;
    }
 
    try {
      this.loading.set(true);
      this.error.set('');
 
      const organizationId = this.organizationId();
 
      if (currentCourse.scope === 'organization' && !organizationId) {
        this.questions.set([]);
        this.error.set('Please select an organization before starting the test.');
        return false;
      }
 
      const loadedQuestions = await this.questionService.getQuestionsForTest(
        currentCourse.scope === 'platform' ? null : organizationId,
        currentCourse.id,
        this.selectedTopicIds(),
        this.difficulty(),
        currentCourse.scope,
      );
 
      if (loadedQuestions.length === 0) {
        this.questions.set([]);
        this.currentQuestionIndex.set(0);
        this.selectedAnswers.set({});
 
        this.error.set(
          'No published questions are available for the selected topics and difficulty.',
        );
 
        return false;
      }
 
      /*
       * ANSWER RANDOMIZATION
       *
       * Create new question objects so we never mutate the
       * Firestore result or the original option arrays.
       */
      let questions = loadedQuestions.map((question) => ({
        ...question,
        options: this.randomizeAnswers()
          ? this.shuffle(question.options)
          : [...question.options],
      }));
 
      /*
       * QUESTION RANDOMIZATION
       */
      if (this.randomizeQuestions()) {
        questions = this.shuffle(questions);
      }
 
      /*
       * QUESTION COUNT
       *
       * Respect the number selected in Test Setup.
       */
      questions = questions.slice(
        0,
        Math.min(this.questionCount(), questions.length),
      );
 
      this.questions.set(questions);
      this.currentQuestionIndex.set(0);
      this.selectedAnswers.set({});
      this.completedResult.set(null);
 
      return true;
    } catch (error) {
      console.error('Failed to load Test Center questions:', error);
 
      this.questions.set([]);
      this.currentQuestionIndex.set(0);
      this.selectedAnswers.set({});
 
      this.error.set('We could not load questions for this test.');
 
      return false;
    } finally {
      this.loading.set(false);
    }
  }
 
  /**
   * Return a shuffled copy of an array.
   *
   * The original array is never mutated.
   */
  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
 
    for (let index = result.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
 
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
 
    return result;
  }
 
  // =====================================================
  // AVAILABLE QUESTION COUNT
  // =====================================================
 
  /**
   * Refresh the number of published questions available
   * for the currently selected topics.
   */
  async refreshAvailableQuestionCount(): Promise<void> {
    const course = this.course();
    const topicIds = this.selectedTopicIds();
 
    if (!course || topicIds.length === 0) {
      this.availableQuestionCount.set(0);
      return;
    }
 
    try {
      const organizationId = this.organizationId();
 
      if (course.scope === 'organization' && !organizationId) {
        this.availableQuestionCount.set(0);
        return;
      }
 
      const count = await this.questionService.getPublishedQuestionCount(
        course.scope === 'platform' ? null : organizationId,
        course.id,
        topicIds,
        course.scope,
      );
 
      this.availableQuestionCount.set(count);
    } catch (error) {
      console.error('Failed to load available Test Center question count:', error);
 
      this.availableQuestionCount.set(0);
    }
  }
}
 