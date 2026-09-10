import { Timestamp } from 'firebase/firestore';

/**
 * Represents a user-to-user following relationship.
 *
 * Firestore collection:
 * userFollows/{followId}
 *
 * The document ID is deterministic:
 * {followerId}_{followingId}
 */
export interface CommunityFollow {
  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * User who initiated the follow.
   */
  followerId: string;

  /**
   * User being followed.
   */
  followingId: string;

  /**
   * When the relationship was created.
   */
  createdAt?: Timestamp | null;
}