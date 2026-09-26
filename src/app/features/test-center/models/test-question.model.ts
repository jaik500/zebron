import { Timestamp } from 'firebase/firestore';

export type TestQuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export type TestQuestionType =
  | 'multiple-choice'
  | 'true-false';

export type TestQuestionStatus =
  | 'draft'
  | 'staff_submitted'
  | 'manager_review'
  | 'rejected'
  | 'approved'
  | 'published'
  | 'archived';

export interface TestQuestionOption {
  id: string;
  text: string;
}

export interface TestQuestion {
  id: string;

  organizationId: string;

  courseId: string;

  topicId: string;

  subtopicId?: string;

  question: string;

  type: TestQuestionType;

  options: TestQuestionOption[];

  correctAnswer: string;

  explanation?: string;

  hint?: string;

  difficulty: TestQuestionDifficulty;

  tags: string[];

  sourceType: 'original' | 'licensed';

  sourceReference?: string;

  status: TestQuestionStatus;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}
