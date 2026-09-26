import { Timestamp } from 'firebase/firestore';

export type TestCourseType =
  | 'certification'
  | 'course'
  | 'subject'
  | 'skill';

export type TestCourseScope =
  | 'platform'
  | 'organization';

export type TestCourseAccessType =
  | 'public'
  | 'organization-members';

export interface TestCourse {
  id: string;

  organizationId: string | null;

  scope: TestCourseScope;

  accessType: TestCourseAccessType;

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

  type: TestCourseType;

  certificationCode?: string;

  imageUrl?: string;

  active: boolean;

  questionCount: number;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}
