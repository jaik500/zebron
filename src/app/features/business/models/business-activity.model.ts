import { Timestamp } from 'firebase/firestore';

/**
 * Business activity status.
 */
export type BusinessActivityStatus =
  | 'planned'
  | 'active'
  | 'inactive';

/**
 * Represents an operational business activity.
 *
 * Examples:
 *
 * - Technology Development
 * - Educational Programs
 * - Consulting
 * - Resource Platform
 * - Community Programs
 */
export interface BusinessActivity {
  id: string;

  businessId: string;

  name: string;

  category: string;

  description?: string;

  startDate?: Timestamp;

  endDate?: Timestamp;

  status: BusinessActivityStatus;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}