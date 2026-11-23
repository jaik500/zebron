import { Timestamp } from 'firebase/firestore';
import { Availability } from './availability.model';



export type ResourceStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'archived';

export interface CostInformation {
  free: boolean;
  description?: string;
}

export interface Resource {
  id: string;

  name: string;
  slug: string;
  description: string;

  categoryId: string;
  organizationId?: string;

  resourceType: string;

  website?: string;
  phone?: string;
  email?: string;

  locationId?: string;
  availability?: Availability;

  online: boolean;

  /** Events only: local date and time, "YYYY-MM-DDTHH:mm". */
  eventStart?: string;
  eventEnd?: string;

  cost?: CostInformation;

  tags: string[];

  status: ResourceStatus;

  verified: boolean;
  featured: boolean;

  createdBy: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  lastVerifiedAt?: Timestamp;

  // ---- How to get help (all optional; shown on the resource page) ----

  /** Who can use it: "Montgomery County residents with low income". */
  eligibility?: string;
  /** What to bring or have ready, one item per line. */
  documentsNeeded?: string;
  /** Steps to apply or get started. */
  howToApply?: string;
  /** Direct link to the application form (shown as "Apply"). */
  applyUrl?: string;
  /** Languages spoken or offered: ["English", "Spanish"]. */
  languages?: string[];
  /** Who it serves geographically: "Prince George's County", "Maryland", "Anywhere (online)". */
  serviceArea?: string;
  /** Where Zebron confirmed these details (official page). Shown with the verification date. */
  sourceUrl?: string;
}