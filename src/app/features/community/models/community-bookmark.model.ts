import { Timestamp } from 'firebase/firestore';

export interface CommunityBookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt?: Timestamp;
}