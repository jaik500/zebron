import { Timestamp } from 'firebase/firestore';

/**
 * Categories used to organize Zebron Community content.
 *
 * Categories can be managed by administrators so
 * the Community area can evolve without requiring
 * code changes.
 */
export interface CommunityCategory {
  id: string;

  /**
   * Category display information.
   */
  name: string;
  slug: string;
  description?: string;

  /**
   * Optional icon identifier.
   *
   * This can later be mapped to an Angular Material
   * icon or another icon system used by Zebron.
   */
  icon?: string;

  /**
   * Category availability and display order.
   */
  active: boolean;
  sortOrder: number;

  /**
   * Firestore timestamps.
   */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}