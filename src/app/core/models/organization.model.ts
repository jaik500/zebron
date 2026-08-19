import { Timestamp } from 'firebase/firestore';
import { Location } from './location.model';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;

  website?: string;
  phone?: string;
  email?: string;

  logoUrl?: string;

  location?: Location;

  verified: boolean;
  active: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}