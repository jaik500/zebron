import { Timestamp } from 'firebase/firestore';

export interface CommunityTopic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;

  /**
   * Controls whether the topic is visible to users.
   */
  active: boolean;

  /**
   * Controls the order in which topics appear.
   */
  sortOrder: number;

  /**
   * Denormalized count for display purposes.
   */
  postCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}