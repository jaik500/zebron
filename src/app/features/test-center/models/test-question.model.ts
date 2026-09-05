import { Timestamp } from 'firebase/firestore';

export type TestQuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export type TestQuestionType =
  | 'multiple-choice'
  | 'true-false';

/**
 * An individual answer choice.
 */
export interface TestQuestionOption {
  id: string;

  text: string;
}

/**
 * Represents a question in the Test Center.
 */
export interface TestQuestion {
  id: string;

  courseId: string;

  topicId: string;

  subtopicId?: string;

  question: string;

  type: TestQuestionType;

  options: TestQuestionOption[];

  /**
   * ID of the correct option.
   */
  correctAnswer: string;

  /**
   * Explanation displayed after an answer
   * is submitted in Practice Mode.
   */
  explanation?: string;

  /**
   * Optional answer-neutral hint.
   */
  hint?: string;

  difficulty: TestQuestionDifficulty;

  tags: string[];

  /**
   * Indicates how the question was sourced.
   *
   * original = created by Zebron/content authors
   * licensed = content legally licensed for use
   */
  sourceType: 'original' | 'licensed';

  sourceReference?: string;

  status:
    | 'draft'
    | 'published'
    | 'archived';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}