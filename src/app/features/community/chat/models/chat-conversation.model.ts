import { Timestamp } from 'firebase/firestore';

export type ChatConversationType =
  | 'direct'
  | 'group';

export interface ChatConversation {
  id: string;

  type: ChatConversationType;

  /**
   * Firebase user IDs participating in the conversation.
   */
  participantIds: string[];

  /**
   * Participant display information used by the UI.
   */
  participantInfo: ChatParticipant[];

  /**
   * Latest message preview.
   */
  lastMessage: string;

  /**
   * User ID of the sender of the latest message.
   */
  lastMessageSenderId: string;

  /**
   * Timestamp of the latest message.
   */
  lastMessageAt: Timestamp | null;

  /**
   * Conversation creation timestamp.
   */
  createdAt: Timestamp | null;

  /**
   * Conversation update timestamp.
   */
  updatedAt: Timestamp | null;

  /**
   * Number of unread messages for each participant.
   *
   * Example:
   *
   * {
   *   "userA": 0,
   *   "userB": 3
   * }
   *
   * This allows the Community header to determine how many
   * conversations contain unread messages without loading
   * every message from every conversation.
   */
  unreadCounts?: Record<string, number>;
}


/**
 * Lightweight participant information used by chat.
 */
export interface ChatParticipant {
  userId: string;

  displayName: string;

  photoUrl?: string;
}