import { Timestamp } from 'firebase/firestore';

export type CommunityReactionType =
  | 'like'
  | 'love'
  | 'laugh'
  | 'celebrate'
  | 'support'
  | 'helpful';

export interface CommunityReaction {
  id: string;

  postId: string;

  userId: string;

  type: CommunityReactionType;

  createdAt?: Timestamp;
}