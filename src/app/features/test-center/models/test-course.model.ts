import { Timestamp } from 'firebase/firestore';

/**
 * Represents a course, certification, subject, or
 * other learning area available in the Zebron Test Center.
 */
export interface TestCourse {
  id: string;

  /**
   * Display name.
   * Example: ServiceNow Certified System Administrator
   */
  name: string;

  /**
   * URL-friendly identifier.
   */
  slug: string;

  /**
   * Short description shown on course cards.
   */
  description: string;

  /**
   * Organization or vendor.
   * Example: ServiceNow, AWS, CompTIA.
   */
  provider?: string;

  /**
   * General classification of the course.
   */
  type:
    | 'certification'
    | 'course'
    | 'subject'
    | 'skill';

  /**
   * Optional certification code.
   * Example: CSA.
   */
  certificationCode?: string;

  /**
   * Optional image/icon.
   */
  imageUrl?: string;

  /**
   * Controls whether the course is visible.
   */
  active: boolean;

  /**
   * Cached question count for display.
   */
  questionCount: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}