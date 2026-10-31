import { Timestamp } from 'firebase/firestore';

/**
 * A quiz: a bank of questions, grouped into topics, that learners practise
 * with. (Not to be confused with learning Courses.)
 *
 * Stored in the Firestore collection `quizzes`. Topics, questions,
 * attempts and results refer to it with a `quizId` field.
 */

export type QuizType =
  | 'certification'
  | 'course'
  | 'subject'
  | 'skill';

export type QuizScope =
  | 'platform'
  | 'organization';

export type QuizAccessType =
  | 'public'
  | 'organization-members';

export interface Quiz {
  id: string;

  organizationId: string | null;

  scope: QuizScope;

  accessType: QuizAccessType;

  /**
   * Program that owns/organizes the course.
   *
   * Organization courses require a program.
   * Platform courses use null.
   */
  programId: string | null;

  name: string;

  slug: string;

  description: string;

  provider?: string;

  type: QuizType;

  certificationCode?: string;

  imageUrl?: string;

  active: boolean;

  questionCount: number;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}
