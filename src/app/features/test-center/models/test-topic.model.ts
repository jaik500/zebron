
import { Timestamp } from 'firebase/firestore';

/**
 * Ownership scope for Test Center topics.
 *
 * Platform topics belong to platform courses.
 * Organization topics belong to organization courses.
 */
export type TestTopicScope = 'platform' | 'organization';

/**
 * Represents a topic within a Test Center course.
 */
export interface TestTopic {
  id: string;

  /**
   * Content ownership scope.
   *
   * Optional for backward compatibility with existing
   * organization topics that do not yet contain scope.
   */
  scope?: TestTopicScope;

  /**
   * Owning organization.
   *
   * null for platform-owned topics.
   */
  organizationId: string | null;

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

