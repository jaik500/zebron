import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;

  website?: string;
  phone?: string;
  email?: string;

  logoUrl?: string;

  locationId?: string;

  verified: boolean;
  active: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
