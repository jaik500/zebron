import { Timestamp } from 'firebase/firestore';

export type TestQuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export type TestQuestionType =
  | 'multiple-choice'
  | 'true-false';

export interface TestQuestionOption {
  id: string;

  text: string;
}

export interface TestQuestion {
  id: string;

  /**
   * Organization that owns this question.
   */
  organizationId: string;

  /**
   * Parent course.
   */
  courseId: string;

  /**
   * Parent topic.
   */
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

  status:
    | 'draft'
    | 'published'
    | 'archived';

  createdAt: Timestamp;

  updatedAt: Timestamp;
}