import { Timestamp } from 'firebase/firestore';

/**
 * Reasons a community member can report content.
 */
export type CommunityReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'inappropriate'
  | 'scam'
  | 'other';

/**
 * Moderation lifecycle for a report.
 */
export type CommunityReportStatus =
  | 'pending'
  | 'reviewed'
  | 'resolved'
  | 'dismissed';

/**
 * Report submitted against a post or comment.
 */
export interface CommunityReport {
  id: string;

  /**
   * At least one of these should be populated.
   */
  postId?: string;
  commentId?: string;

  /**
   * User who submitted the report.
   */
  reportedBy: string;

  /**
   * Report details.
   */
  reason: CommunityReportReason;
  description?: string;

  /**
   * Moderation status.
   */
  status: CommunityReportStatus;

  /**
   * Firestore timestamps.
   */
  createdAt: Timestamp;
  resolvedAt?: Timestamp;

  /**
   * Administrator who resolved the report.
   */
  resolvedBy?: string;
}