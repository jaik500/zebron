import { Timestamp } from 'firebase/firestore';

export type CommunityNotificationType =
  | 'follow'
  | 'post_reaction'
  | 'comment'
  | 'comment_reaction'
  | 'reply'
  | 'mention'
  | 'moderation'
  | 'system';

export interface CommunityNotification {
  id: string;

  /**
   * User receiving the notification.
   */
  recipientId: string;

  /**
   * User who triggered the notification.
   * Null for system notifications.
   */
  actorId?: string | null;

  /**
   * Actor snapshot.
   *
   * Keeping these values in the notification means
   * the UI does not need another user lookup just
   * to display the notification.
   */
  actorDisplayName?: string;
  actorPhotoUrl?: string;

  /**
   * Notification classification.
   */
  type: CommunityNotificationType;

  /**
   * Human-readable notification message.
   */
  message: string;

  /**
   * Related Community content.
   */
  postId?: string | null;
  commentId?: string | null;

  /**
   * Optional destination route.
   */
  route?: string | null;

  /**
   * Read state.
   */
  read: boolean;

  createdAt?: Timestamp | null;
  readAt?: Timestamp | null;
}