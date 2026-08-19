import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}