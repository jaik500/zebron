import { Timestamp } from 'firebase/firestore';

/**
 * Represents a topic within a Test Center course.
 */
export interface TestTopic {
  id: string;

  /**
   * Organization that owns the topic.
   *
   * This is the tenant boundary for Partner Test Center.
   */
  organizationId: string;

  /**
   * Parent Test Center course.
   */
  courseId: string;

  name: string;

  slug: string;

  description?: string;

  /**
   * Controls topic ordering within the course.
   */
  sortOrder: number;

  /**
   * Cached number of questions belonging to the topic.
   */
  questionCount: number;

  active: boolean;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}