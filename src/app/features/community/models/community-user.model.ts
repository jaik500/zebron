import { Timestamp } from 'firebase/firestore';

export interface CommunityUser {
  id: string;

  // =========================================================
  // Identity
  // =========================================================

  displayName: string;

  firstName?: string;

  lastName?: string;

  preferredName?: string;

  photoUrl?: string;

  // =========================================================
  // Profile
  // =========================================================

  bio?: string;

  website?: string;

  // =========================================================
  // Location
  // =========================================================

  countryOfOrigin?: string;

  currentCountry?: string;

  city?: string;

  state?: string;

  // =========================================================
  // Account
  // =========================================================

  role?: 'user' | 'admin';

  // =========================================================
  // Timestamps
  // =========================================================

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}

