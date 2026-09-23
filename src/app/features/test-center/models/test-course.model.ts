import { Timestamp } from 'firebase/firestore';

export type TestCourseType =
  | 'certification'
  | 'course'
  | 'subject'
  | 'skill';

export interface TestCourse {
  id: string;

  /**
   * Organization that owns this course.
   */
  organizationId: string;

  name: string;

  slug: string;

  description: string;

  provider?: string;

  type: TestCourseType;

  certificationCode?: string;

  imageUrl?: string;

  active: boolean;

  questionCount: number;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}