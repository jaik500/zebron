import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;

    /**
   * Official business or registration number.
   */
  companyNumber?: string;

  /**
   * Normalized organization name used for
   * case-insensitive matching.
   */
  normalizedName?: string;
  
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
