import { Timestamp } from 'firebase/firestore';

export interface ResourceType {
  id?: string;

  name: string;
  slug: string;
  description?: string;

  active: boolean;
  sortOrder: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
