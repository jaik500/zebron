import { Timestamp } from 'firebase/firestore';

export interface TestTopic {
  id: string;

  /**
   * Organization that owns this topic.
   */
  organizationId: string;

  /**
   * Parent Test Center course.
   */
  courseId: string;

  name: string;

  slug: string;

  description?: string;

  sortOrder: number;

  questionCount: number;

  active: boolean;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}