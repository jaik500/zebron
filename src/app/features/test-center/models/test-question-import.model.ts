import {
  TestQuestionDifficulty,
  TestQuestionType,
} from './test-question.model';

/**
 * Metadata describing a topic supplied by a question bank.
 *
 * The importer uses this metadata only when the topic does
 * not already exist for the selected course.
 */
export interface TestQuestionImportTopic {
  /**
   * Stable semantic key used by the question bank.
   *
   * Example:
   * platform
   */
  readonly key: string;

  /**
   * Human-readable topic name.
   */
  readonly name: string;

  /**
   * Firestore-friendly topic slug.
   */
  readonly slug: string;

  /**
   * Optional topic description.
   */
  readonly description?: string;
}

export interface TestQuestionImportOption {
  readonly id: string;
  readonly text: string;
}

export interface TestQuestionImportRecord {
  /**
   * Stable identifier inside the question bank.
   *
   * Example:
   * csa-001
   */
  readonly seedId: string;

  /**
   * Stable semantic topic key.
   *
   * This is NOT a Firestore document ID.
   */
  readonly topicKey: string;

  readonly question: string;

  readonly type: TestQuestionType;

  readonly options: readonly TestQuestionImportOption[];

  readonly correctAnswer: string;

  readonly explanation?: string;

  readonly hint?: string;

  readonly difficulty: TestQuestionDifficulty;

  readonly tags: readonly string[];

  readonly sourceType:
    | 'original'
    | 'licensed';

  readonly sourceReference?: string;

  readonly status:
    | 'draft'
    | 'published'
    | 'archived';
}

export interface TestQuestionImportResult {
  total: number;
  created: number;
  updated: number;
  topicsCreated: number;
  topicsExisting: number;
  failed: number;
  errors: string[];
}