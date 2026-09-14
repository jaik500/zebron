
import { Timestamp } from 'firebase/firestore';


// ============================================================
// POST STATUS
// ============================================================

export type CommunityPostStatus =
  | 'published'
  | 'draft'
  | 'hidden'
  | 'deleted';


// ============================================================
// MODERATION STATUS
// ============================================================

export type CommunityModerationStatus =
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'rejected';


// ============================================================
// COMMUNITY POST
// ============================================================

export interface CommunityPost {

  id: string;


  // ==========================================================
  // AUTHOR
  // ==========================================================

  /**
   * User who created the post.
   */
  authorId: string;

  /**
   * Small denormalized snapshot used to render
   * the feed without repeatedly loading the user.
   */
  author: CommunityPostAuthor;


  // ==========================================================
  // TOPIC
  // ==========================================================

  /**
   * Topic associated with the post.
   */
  topicId: string;

  /**
   * Topic name is denormalized for convenient display.
   */
  topicName?: string;


  // ==========================================================
  // CONTENT
  // ==========================================================

  title: string;

  content: string;


  // ==========================================================
  // MEDIA
  // ==========================================================

  /**
   * Optional uploaded media.
   */
  mediaUrls?: string[];


  // ==========================================================
  // TAGS
  // ==========================================================

  /**
   * Optional hashtags/tags.
   */
  tags?: string[];


  // ==========================================================
  // STATUS
  // ==========================================================

  status: CommunityPostStatus;

  moderationStatus: CommunityModerationStatus;


  // ==========================================================
  // ENGAGEMENT
  // ==========================================================

  /**
   * Aggregated reaction counts.
   *
   * Example:
   *
   * {
   *   like: 12,
   *   love: 4
   * }
   */
  reactionCounts: Record<string, number>;

  /**
   * Number of comments associated with the post.
   */
  commentCount: number;

  /**
   * Number of times the post has been viewed.
   */
  viewCount: number;

/**
 * Denormalized score used to rank posts in the Trending feed.
 *
 * Optional during migration because existing Firestore
 * posts may not have this field yet.
 */
trendingScore?: number;

  // ==========================================================
  // CURRENT USER STATE
  // ==========================================================

  /**
   * Indicates whether the current user has bookmarked
   * the post.
   */
  bookmarkedByCurrentUser?: boolean;

  /**
   * Reaction selected by the current user, if any.
   */
  currentUserReaction?: string | null;


  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  createdAt?: Timestamp;

  updatedAt?: Timestamp;
}


// ============================================================
// COMMUNITY POST AUTHOR
// ============================================================

export interface CommunityPostAuthor {

  id: string;

  displayName: string;

  photoUrl?: string;


  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  firstName?: string;

  lastName?: string;

  preferredName?: string;


  // ----------------------------------------------------------
  // PROFILE
  // ----------------------------------------------------------

  bio?: string;


  // ----------------------------------------------------------
  // LOCATION
  // ----------------------------------------------------------

  countryOfOrigin?: string;

  currentCountry?: string;

  city?: string;

  state?: string;


  // ----------------------------------------------------------
  // WEBSITE
  // ----------------------------------------------------------

  website?: string;
}

