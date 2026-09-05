import { Timestamp } from 'firebase/firestore';

/**
 * Represents a topic within a Test Center course.
 */
export interface TestTopic {
  id: string;

  /**
   * Parent course.
   */
  courseId: string;

  name: string;

  slug: string;

  description?: string;

  /**
   * Controls topic ordering.
   */
  sortOrder: number;

  /**
   * Cached question count.
   */
  questionCount: number;

  active: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}