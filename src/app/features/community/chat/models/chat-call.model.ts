import { Timestamp } from 'firebase/firestore';

export type ChatCallType = 'voice' | 'video';

export type ChatCallStatus =
  | 'ringing'
  | 'accepted'
  | 'connected'
  | 'declined'
  | 'missed'
  | 'ended';

export interface ChatCall {
  id: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  type: ChatCallType;
  status: ChatCallStatus;
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
