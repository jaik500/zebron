import { Timestamp } from 'firebase/firestore';

export type CommunityCommentStatus =
  | 'published'
  | 'hidden'
  | 'deleted';

export interface CommunityComment {
  id: string;

  postId: string;

  /**
   * null means this is a top-level comment.
   */
  parentCommentId?: string | null;

  authorId: string;

  author: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };

  content: string;

  reactionCounts: Record<string, number>;

  status: CommunityCommentStatus;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}