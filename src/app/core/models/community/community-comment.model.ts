import { Timestamp } from 'firebase/firestore';

/**
 * A comment/reply attached to a community post.
 */
export interface CommunityComment {
  id: string;

  /**
   * Parent community post.
   */
  postId: string;

  /**
   * Comment author identity.
   */
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;

  /**
   * Comment body.
   */
  content: string;

  /**
   * Basic moderation state.
   */
  status: 'published' | 'hidden' | 'deleted';

  /**
   * Number of likes/reactions.
   */
  likeCount: number;

  /**
   * Firestore timestamps.
   */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}