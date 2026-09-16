import { Timestamp } from 'firebase/firestore';

export type ChatMessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'deleted';

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file';

export interface ChatAttachment {
  name: string;
  url: string;
  storagePath: string;
  contentType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: ChatMessageType;
  attachment?: ChatAttachment | null;
  status: ChatMessageStatus;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  readBy: string[];
}

export interface SendChatMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  type?: ChatMessageType;
  attachment?: ChatAttachment | null;
}