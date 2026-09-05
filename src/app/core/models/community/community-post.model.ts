import { Timestamp } from 'firebase/firestore';

/**
 * Supported types of content that can be published
 * in the Zebron Community.
 *
 * Student/member content:
 * - discussion
 * - question
 *
 * Official/admin content:
 * - announcement
 * - news
 * - event
 * - opportunity
 * - notice
 */
export type CommunityPostType =
  | 'discussion'
  | 'question'
  | 'announcement'
  | 'news'
  | 'event'
  | 'opportunity'
  | 'notice';

/**
 * Publication lifecycle for a community post.
 */
export type CommunityPostStatus =
  | 'draft'
  | 'published'
  | 'archived';

/**
 * Community post model.
 *
 * This model supports both member-generated content
 * and official administrator content.
 */
export interface CommunityPost {
  id: string;

  title: string;
  content: string;

  /**
   * Author identity.
   *
   * authorId is the authoritative reference to the
   * Zebron user.
   *
   * authorName and authorPhotoUrl are snapshots used
   * for efficient rendering.
   */
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;

  /**
   * Type of community content.
   */
  postType: CommunityPostType;

  /**
   * Optional community category.
   */
  categoryId?: string;

  /**
   * Administrative visibility controls.
   */
  featured: boolean;
  pinned: boolean;
  important: boolean;

  /**
   * Publication status.
   */
  status: CommunityPostStatus;

  /**
   * Determines whether members can comment.
   */
  allowComments: boolean;

  /**
   * Engagement counters.
   */
  viewCount: number;
  likeCount: number;
  commentCount: number;

  /**
   * Search/filter metadata.
   */
  tags: string[];

  /**
   * Firestore timestamps.
   */
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}