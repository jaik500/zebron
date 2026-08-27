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

  cost?: CostInformation;

  tags: string[];

  status: ResourceStatus;

  verified: boolean;
  featured: boolean;

  createdBy: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  lastVerifiedAt?: Timestamp;
}