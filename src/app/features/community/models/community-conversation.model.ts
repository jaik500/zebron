import { Timestamp } from 'firebase/firestore';

export interface CommunityConversation {
  id: string;

  /**
   * A direct conversation contains exactly two user IDs.
   */
  participantIds: string[];

  createdAt: Timestamp | null;

  updatedAt: Timestamp | null;

  /**
   * Conversation preview metadata.
   *
   * These fields will eventually be maintained by a trusted
   * server-side function rather than the browser.
   */
  lastMessage: string | null;

  lastMessageAt: Timestamp | null;

  lastMessageSenderId: string | null;
}