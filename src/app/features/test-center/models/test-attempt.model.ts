import { Timestamp } from 'firebase/firestore';

export interface TestQuestionResult {
  questionId: string;

  selectedAnswer: string;

  correct: boolean;

  timeSpent?: number;
}

export interface TestAttempt {
  id: string;

  /**
   * Organization in which the test was taken.
   */
  organizationId: string | null;

  /**
   * User who completed the test.
   */
  userId: string;

  quizId: string;

  topicIds: string[];

  questionCount: number;

  correctCount: number;

  score: number;

  mode: 'practice' | 'exam';

  results?: TestQuestionResult[];

  startedAt: Timestamp;

  completedAt?: Timestamp;
}