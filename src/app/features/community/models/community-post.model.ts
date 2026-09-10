import { Timestamp } from 'firebase/firestore';

export type CommunityPostStatus = 'published' | 'draft' | 'hidden' | 'deleted';

export type CommunityModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

export interface CommunityPost {
  id: string;

  /**
   * User who created the post.
   */
  authorId: string;

  /**
   * Small denormalized snapshot used to render
   * the feed without repeatedly loading the user.
   */
  author: CommunityPostAuthor;

  /**
   * Topic associated with the post.
   */
  topicId: string;

  /**
   * Topic name is denormalized for convenient display.
   */
  topicName?: string;

  title: string;

  content: string;

  /**
   * Optional uploaded media.
   */
  mediaUrls?: string[];

  /**
   * Optional hashtags/tags.
   */
  tags?: string[];

  status: CommunityPostStatus;

  moderationStatus: CommunityModerationStatus;

  /**
   * Aggregated reaction counts.
   *
   * Example:
   * {
   *   like: 12,
   *   love: 4
   * }
   */
  reactionCounts: Record<string, number>;

  commentCount: number;

  viewCount: number;

  /**
   * IDs are kept separately from counts so the
   * current user's interaction can be tracked later.
   */
  bookmarkedByCurrentUser?: boolean;

  currentUserReaction?: string | null;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommunityPostAuthor {
  id: string;
  displayName: string;
  photoUrl?: string;

  firstName?: string;
  lastName?: string;
  preferredName?: string;

  bio?: string;

  countryOfOrigin?: string;
  currentCountry?: string;
  city?: string;
  state?: string;
  website?: string;
}
