import { Timestamp } from 'firebase/firestore';

/**
 * Defines the type of media or evidence captured
 * during the development of a content milestone.
 */
export type ContentCaptureType =
  | 'screenshot'
  | 'recording'
  | 'before-after'
  | 'note'
  | 'demo';

/**
 * Defines the lifecycle status of a capture.
 */
export type ContentCaptureStatus =
  | 'captured'
  | 'reviewed'
  | 'used'
  | 'archived';

/**
 * Represents development evidence captured
 * for a Content & Operations milestone.
 */
export interface ContentCapture {
  id: string;

  /**
   * The milestone this capture belongs to.
   */
  milestoneId: string;

  /**
   * Type of development evidence captured.
   */
  type: ContentCaptureType;

  /**
   * Human-readable capture title.
   */
  title: string;

  /**
   * Optional explanation of what was captured
   * and why it matters.
   */
  description?: string;

  /**
   * External location where the actual media
   * is stored.
   */
  storageUrl?: string;

  /**
   * When the capture was made.
   */
  capturedAt?: Timestamp | null;

  /**
   * Searchable tags.
   */
  tags?: string[];

  /**
   * Content items that use this capture.
   */
  usedInContentIds?: string[];

  /**
   * Current capture lifecycle status.
   */
  status: ContentCaptureStatus;

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}