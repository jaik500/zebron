import { Timestamp } from 'firebase/firestore';


// ================================================================
// COMMENT STATUS
// ================================================================

export type CommunityCommentStatus =
  | 'published'
  | 'deleted'
  | 'hidden';


// ================================================================
// COMMENT AUTHOR
// ================================================================

export interface CommunityCommentAuthor {
  id: string;
  displayName: string;
  photoUrl?: string | null;
}


// ================================================================
// COMMUNITY COMMENT
// ================================================================

export interface CommunityComment {

  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * ID of the post this comment belongs to.
   */
  postId: string;

  /**
   * Null for a top-level comment.
   *
   * Contains the parent comment ID for replies.
   */
  parentCommentId: string | null;

  /**
   * User who created the comment.
   */
  authorId: string;

  /**
   * Denormalized author information used
   * for efficient rendering.
   */
  author: CommunityCommentAuthor;

  /**
   * Comment body.
   *
   * For deleted comments, this should be
   * empty and should never be rendered.
   */
  content: string;

  /**
   * Aggregate reaction counts.
   *
   * Example:
   *
   * {
   *   like: 4,
   *   love: 2
   * }
   */
  reactionCounts: Record<string, number>;

  /**
   * Current authenticated user's reaction.
   *
   * This is hydrated by CommunityCommentStore
   * and is not necessarily persisted on the
   * comment document.
   */
  currentUserReaction?: string | null;

  /**
   * Comment lifecycle status.
   */
  status: CommunityCommentStatus;

  /**
   * Creation timestamp.
   */
  createdAt?: Timestamp;

  /**
   * Last update timestamp.
   */
  updatedAt?: Timestamp;

  /**
   * Indicates that the comment was soft-deleted.
   *
   * This is derived from status and is optional
   * for backwards compatibility.
   */
  deletedAt?: Timestamp | null;
}