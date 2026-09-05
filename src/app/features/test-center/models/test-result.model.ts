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
  courseId: string;

  courseName: string;

  totalQuestions: number;

  answeredQuestions: number;

  correctAnswers: number;

  incorrectAnswers: number;

  unansweredQuestions: number;

  scorePercentage: number;

  mode: 'practice' | 'exam';

  difficulty: TestQuestionDifficulty | 'mixed';

  topicPerformance: TestTopicPerformance[];

  questionResults: TestQuestionResult[];

  completedAt: Date;
}