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
   * User who completed the test.
   */
  userId: string;

  courseId: string;

  topicIds: string[];

  questionCount: number;

  correctCount: number;

  score: number;

  mode: 'practice' | 'exam';

  results?: TestQuestionResult[];

  startedAt: Timestamp;

  completedAt?: Timestamp;
}