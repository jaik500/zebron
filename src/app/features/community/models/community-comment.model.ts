import { Timestamp } from 'firebase/firestore';

export type CommunityCommentStatus =
  | 'published'
  | 'hidden'
  | 'deleted';

export interface CommunityComment {
  id: string;
  postId: string;
  parentCommentId?: string | null;

  authorId: string;

  author: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };

  content: string;

  /**
   * Aggregate reaction counts.
   *
   * Example:
   * {
   *   like: 3
   * }
   */
  reactionCounts: Record<string, number>;

  /**
   * Reaction made by the currently authenticated user.
   *
   * This is viewer-specific state and should not be
   * persisted inside the comment document.
   */
  currentUserReaction?: string | null;

  status: CommunityCommentStatus;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}