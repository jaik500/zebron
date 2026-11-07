import { TestQuestionDifficulty } from './test-question.model';

export interface TestQuestionResult {
  questionId: string;

  question: string;

  topicId: string;

  selectedAnswerId: string | null;

  correctAnswerId: string;

  isCorrect: boolean;

  explanation?: string;
}

export interface TestTopicPerformance {
  topicId: string;

  topicName: string;

  totalQuestions: number;

  answeredQuestions: number;

  correctAnswers: number;

  incorrectAnswers: number;

  percentage: number;
}

export interface TestResult {
  id: string;

  organizationId: string | null;

  userId: string;

  attemptId: string;

  quizId: string;

  quizName: string;

  totalQuestions: number;

  answeredQuestions: number;

  correctAnswers: number;

  incorrectAnswers: number;

  unansweredQuestions: number;

  scorePercentage: number;

  mode: 'practice' | 'exam';

  /** Who recorded it: the Test Center (browser for practice, server for exams), a course final exam or a certification exam. */
  source?: 'test-center' | 'course' | 'certification';

  /** Exam-only bank: right answers and explanations are not included. */
  examOnly?: boolean;

  difficulty: TestQuestionDifficulty | 'mixed';

  topicPerformance: TestTopicPerformance[];

  questionResults: TestQuestionResult[];

  completedAt: Date;
}