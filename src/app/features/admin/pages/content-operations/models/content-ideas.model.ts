import { Timestamp } from 'firebase/firestore';

export type ContentIdeaPriority =
  | 'low'
  | 'medium'
  | 'high';

export type ContentIdeaStatus =
  | 'idea'
  | 'selected'
  | 'planned'
  | 'in-production'
  | 'published'
  | 'archived';

export type ContentIdeaType =
  | 'video'
  | 'short'
  | 'post'
  | 'article'
  | 'tutorial';

export type ContentIdeaPlatform =
  | 'youtube'
  | 'youtube-short'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'website'
  | 'other';

export interface ContentIdea {
  id: string;

  // --------------------------------------------------
  // Basic information
  // --------------------------------------------------

  title: string;
  description?: string;

  // --------------------------------------------------
  // Content planning
  // --------------------------------------------------

  type: ContentIdeaType;
  platform: ContentIdeaPlatform;
  category?: string;

  // --------------------------------------------------
  // Workflow
  // --------------------------------------------------

  priority: ContentIdeaPriority;
  status: ContentIdeaStatus;

  // --------------------------------------------------
  // Relationships
  // --------------------------------------------------

  milestoneId?: string;

  /**
   * Captures/evidence that support this idea.
   *
   * Examples:
   * - development recording
   * - screenshot
   * - demo
   * - before/after
   * - milestone note
   */
  captureIds?: string[];

  /**
   * The production content created from this idea.
   */
  contentId?: string;

  // --------------------------------------------------
  // Creative development
  // --------------------------------------------------

  notes?: string;
  potentialHook?: string;
  potentialTitle?: string;

  // --------------------------------------------------
  // Audit timestamps
  // --------------------------------------------------

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}