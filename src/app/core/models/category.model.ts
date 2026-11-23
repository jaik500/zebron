import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  /**
   * How often its resources should be checked again, in days. Empty or
   * null = the default for the kind of category (see resource-review.ts).
   */
  reviewIntervalDays?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}