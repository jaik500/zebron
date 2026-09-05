import { Injectable, computed, inject, signal } from '@angular/core';

import { TestCourse } from '../models/test-course.model';
import { TestTopic } from '../models/test-topic.model';
import { TestQuestion } from '../models/test-question.model';
import { TestQuestionResult, TestResult, TestTopicPerformance } from '../models/test-result.model';

import { TestTopicService } from '../services/test-topic.service';
import { TestQuestionService } from '../services/test-question.service';

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

  // =====================================================
  // COURSE
  // =====================================================

  /**
   * Currently selected Test Center course.
   */
  readonly course = signal<TestCourse | null>(null);

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
   * This is calculated from testQuestions rather than
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
readonly testCompleted = computed(
  () => this.completedResult() !== null,
);

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
   * Number of questions available
   * across selected topics.
   */
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
  setCourse(course: TestCourse): void {
    this.course.set(course);
  }

  // =====================================================
  // TOPICS
  // =====================================================

  /**
   * Load active topics for a course.
   *
   * The component does not access TestTopicService
   * directly. TestStore handles the data retrieval
   * and owns the resulting state.
   */
  async loadTopics(courseId: string): Promise<void> {
    try {
      this.loading.set(true);

      this.error.set('');

      const topics = await this.topicService.getActiveTopics(courseId);

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
toggleTopic(
  topicId: string,
): void {
  this.selectedTopicIds.update(
    (selected: string[]) => {
      if (selected.includes(topicId)) {
        return selected.filter(
          (id) => id !== topicId,
        );
      }

      return [
        ...selected,
        topicId,
      ];
    },
  );

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
   * Replace the questions for the active test.
   *
   * We will replace `any[]` with TestQuestion[]
   * once the final question model is established.
   */
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
   */
  resetTest(): void {
    this.course.set(null);

    this.topics.set([]);

    this.selectedTopicIds.set([]);

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

  /**
 * Calculates the final result for the current test session.
 *
 * The result is calculated entirely from the questions loaded
 * into the current TestStore session and the answers selected
 * by the user.
 */
completeTest(): TestResult | null {
  const course = this.course();

  const questions = this.questions();

  const answers = this.selectedAnswers();

  if (!course || questions.length === 0) {
    return null;
  }


  /*
   * ----------------------------------------------------------
   * QUESTION RESULTS
   * ----------------------------------------------------------
   */

  const questionResults = questions.map(
    (question): TestQuestionResult => {
      const selectedAnswerId =
        answers[question.id] ?? null;

      const isCorrect =
        selectedAnswerId !== null &&
        selectedAnswerId === question.correctAnswer;

      return {
        questionId: question.id,

        question: question.question,

        topicId: question.topicId,

        selectedAnswerId,

        correctAnswerId: question.correctAnswer,

        isCorrect,

        explanation: question.explanation,
      };
    },
  );


  /*
   * ----------------------------------------------------------
   * OVERALL SCORE
   * ----------------------------------------------------------
   */

  const totalQuestions =
    questionResults.length;

  const answeredQuestions =
    questionResults.filter(
      result => result.selectedAnswerId !== null,
    ).length;

  const correctAnswers =
    questionResults.filter(
      result => result.isCorrect,
    ).length;

  const incorrectAnswers =
    questionResults.filter(
      result =>
        result.selectedAnswerId !== null &&
        !result.isCorrect,
    ).length;

  const unansweredQuestions =
    totalQuestions - answeredQuestions;


  const scorePercentage =
    totalQuestions > 0
      ? Math.round(
          (correctAnswers / totalQuestions) * 100,
        )
      : 0;


  /*
   * ----------------------------------------------------------
   * TOPIC PERFORMANCE
   * ----------------------------------------------------------
   */

  const topicPerformance: TestTopicPerformance[] =
    this.topics()
      .map(topic => {
        const topicResults =
          questionResults.filter(
            result =>
              result.topicId === topic.id,
          );


        if (topicResults.length === 0) {
          return null;
        }


        const topicAnswered =
          topicResults.filter(
            result =>
              result.selectedAnswerId !== null,
          ).length;


        const topicCorrect =
          topicResults.filter(
            result =>
              result.isCorrect,
          ).length;


        const topicIncorrect =
          topicResults.filter(
            result =>
              result.selectedAnswerId !== null &&
              !result.isCorrect,
          ).length;


        const topicPercentage =
          topicResults.length > 0
            ? Math.round(
                (topicCorrect / topicResults.length) *
                  100,
              )
            : 0;


        return {
          topicId: topic.id,

          topicName: topic.name,

          totalQuestions:
            topicResults.length,

          answeredQuestions:
            topicAnswered,

          correctAnswers:
            topicCorrect,

          incorrectAnswers:
            topicIncorrect,

          percentage:
            topicPercentage,
        };
      })
      .filter(
        (
          topic,
        ): topic is TestTopicPerformance =>
          topic !== null,
      );


  /*
   * ----------------------------------------------------------
   * FINAL RESULT
   * ----------------------------------------------------------
   */

  const result: TestResult = {
    courseId: course.id,

    courseName: course.name,

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


  /*
   * Store the completed result so the Results page
   * can display it after route navigation.
   */
  this.completedResult.set(result);


  return result;
}

  /**
   * Load published questions for the
   * current test configuration.
   *
   * The component does not access
   * TestQuestionService directly.
   *
   * TestStore owns the question state.
   */
  /**
 * Load published questions for the
 * current test configuration.
 *
 * The TestStore owns the question state and
 * enforces the requested question count.
 *
 * Example:
 *
 * Available questions = 25
 * Requested questions = 10
 * Questions loaded    = 10
 */
async loadQuestions(): Promise<boolean> {
  const currentCourse = this.course();

  if (!currentCourse) {
    this.questions.set([]);

    this.error.set(
      'Please select a course before starting the test.',
    );

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


    /*
     * ----------------------------------------------------------
     * LOAD ALL ELIGIBLE QUESTIONS
     * ----------------------------------------------------------
     *
     * The question service determines which published
     * questions match the selected course, topics,
     * and difficulty.
     */
    const questions =
      await this.questionService.getQuestionsForTest(
        currentCourse.id,
        this.selectedTopicIds(),
        this.difficulty(),
      );


    /*
     * ----------------------------------------------------------
     * NO QUESTIONS AVAILABLE
     * ----------------------------------------------------------
     */

    if (questions.length === 0) {
      this.questions.set([]);

      this.currentQuestionIndex.set(0);

      this.selectedAnswers.set({});

      this.error.set(
        'No published questions are available for the selected topics and difficulty.',
      );

      return false;
    }


    /*
     * ----------------------------------------------------------
     * DETERMINE REQUESTED QUESTION COUNT
     * ----------------------------------------------------------
     */

    const requestedCount =
      Math.max(
        1,
        Math.floor(this.questionCount()),
      );


    /*
     * ----------------------------------------------------------
     * RANDOMIZE QUESTION ORDER
     * ----------------------------------------------------------
     *
     * If randomization is enabled, shuffle the complete
     * eligible question set before selecting the requested
     * number of questions.
     *
     * This prevents the same first N questions from being
     * selected every time.
     */
    const orderedQuestions =
      this.randomizeQuestions()
        ? this.shuffle(questions)
        : [...questions];


    /*
     * ----------------------------------------------------------
     * ENFORCE QUESTION COUNT
     * ----------------------------------------------------------
     *
     * The actual test can never contain more questions
     * than the requested question count.
     *
     * If fewer questions are available than requested,
     * all available questions are used.
     *
     * Example:
     *
     * Requested = 10
     * Available = 25
     * Loaded    = 10
     *
     * Requested = 10
     * Available = 7
     * Loaded    = 7
     */
    const selectedQuestions =
      orderedQuestions.slice(
        0,
        Math.min(
          requestedCount,
          orderedQuestions.length,
        ),
      );


    /*
     * ----------------------------------------------------------
     * STORE THE ACTUAL TEST QUESTIONS
     * ----------------------------------------------------------
     */

    this.questions.set(selectedQuestions);

    this.currentQuestionIndex.set(0);

    this.selectedAnswers.set({});


    /*
     * ----------------------------------------------------------
     * OPTIONAL DIAGNOSTIC LOG
     * ----------------------------------------------------------
     *
     * Useful during development to confirm that the
     * requested count is actually being enforced.
     */
    console.log(
      'Test Center questions loaded:',
      {
        requested: requestedCount,
        available: questions.length,
        loaded: selectedQuestions.length,
        randomized: this.randomizeQuestions(),
      },
    );


    return true;

  } catch (error) {

    console.error(
      'Failed to load Test Center questions:',
      error,
    );

    this.questions.set([]);

    this.currentQuestionIndex.set(0);

    this.selectedAnswers.set({});

    this.error.set(
      'We could not load questions for this test.',
    );

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
      const count = await this.questionService.getPublishedQuestionCount(course.id, topicIds);

      this.availableQuestionCount.set(count);
    } catch (error) {
      console.error('Failed to load available Test Center question count:', error);

      this.availableQuestionCount.set(0);
    }
  }
}
