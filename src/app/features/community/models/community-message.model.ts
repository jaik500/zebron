import { Timestamp } from 'firebase/firestore';

export interface CommunityMessage {
  id: string;

  conversationId: string;

  senderId: string;

  content: string;

  createdAt: Timestamp | null;

  /**
   * User IDs that have read this message.
   *
   * The sender is automatically added when the message is created.
   */
  readBy: string[];
}

export interface CreateCommunityMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
}