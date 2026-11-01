
import { Timestamp } from 'firebase/firestore';

/**
 * Ownership scope for Test Center questions.
 */
export type TestQuestionScope = 'platform' | 'organization';

export type TestQuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export type TestQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'multiple-select'
  | 'short-text'
  | 'numeric'
  | 'ordering';

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

  /**
   * Content ownership scope.
   *
   * Optional for backward compatibility with existing
   * organization questions.
   */
  scope?: TestQuestionScope;

  /**
   * Owning organization.
   *
   * null for platform-owned questions.
   */
  organizationId: string | null;

  quizId: string;

  topicId: string;

  subtopicId?: string;

  question: string;

  type: TestQuestionType;

  options: TestQuestionOption[];

  /**
   * multiple-choice / true-false: the right option id. Other types keep a
   * readable copy of the answer here (see models/question-answers.ts).
   */
  correctAnswer: string;

  /** multiple-select: every right option id. */
  correctAnswers?: string[];

  /** short-text: accepted answers (case, accents and extra spaces ignored). */
  acceptedAnswers?: string[];

  /** numeric: the answer and the allowed margin either side. */
  numericAnswer?: number | null;
  numericTolerance?: number | null;

  /** ordering: option ids in the right order (options may be shuffled). */
  correctOrder?: string[];

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

