import { Timestamp } from 'firebase/firestore';

/**
 * Categories used to organize development/content milestones.
 */
export type ContentMilestoneCategory =
  | 'development'
  | 'community'
  | 'learning'
  | 'platform'
  | 'content'
  | 'other';

/**
 * Overall milestone lifecycle status.
 */
export type ContentMilestoneStatus =
  | 'planned'
  | 'in-progress'
  | 'complete'
  | 'archived';

/**
 * Development implementation status.
 */
export type DevelopmentStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete';

/**
 * Testing status.
 */
export type TestingStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete';

/**
 * Figure Out With J capture status.
 */
export type CaptureStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete';

/**
 * Content production/publication status.
 */
export type ContentStatus =
  | 'not-started'
  | 'in-production'
  | 'published';

/**
 * Represents a major Zebron development milestone
 * and its potential content opportunity for
 * Figure Out With J.
 */
export interface ContentMilestone {
  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * Name of the milestone.
   *
   * Example:
   * "Community Notifications"
   */
  title: string;

  /**
   * Detailed description of the milestone.
   */
  description?: string;

  /**
   * The Zebron feature or functionality
   * represented by this milestone.
   *
   * Example:
   * "Real-time user notifications"
   */
  feature?: string;

  /**
   * Potential Figure Out With J content title
   * associated with this milestone.
   *
   * Example:
   * "I Just Built Notifications Into My App — Here's How"
   */
  potentialTitle?: string;

  /**
   * Milestone category.
   */
  category: ContentMilestoneCategory;

  /**
   * Overall milestone lifecycle status.
   */
  status: ContentMilestoneStatus;

  /**
   * Technical development progress.
   */
  developmentStatus: DevelopmentStatus;

  /**
   * Testing progress.
   */
  testingStatus: TestingStatus;

  /**
   * Figure Out With J capture progress.
   */
  captureStatus: CaptureStatus;

  /**
   * Content production/publication progress.
   */
  contentStatus: ContentStatus;

  /**
   * Development and content-production notes.
   */
  notes?: string;

  /**
   * External folder containing milestone assets.
   *
   * Examples:
   * - Screenshots
   * - Screen recordings
   * - Before/after captures
   * - Editing files
   * - Production assets
   */
  externalFolderUrl?: string;

  /**
   * IDs of content items associated with
   * this milestone.
   */
  contentIds?: string[];

  /**
   * IDs of capture records associated with
   * this milestone.
   */
  captureIds?: string[];

  /**
   * Timestamp when the milestone was created.
   */
  createdAt?: Timestamp | null;

  /**
   * Timestamp when the milestone was last updated.
   */
  updatedAt?: Timestamp | null;

  /**
   * Optional target completion date.
   */
  targetDate?: Timestamp | null;

  /**
   * Optional date the milestone was completed.
   */
  completedAt?: Timestamp | null;
}