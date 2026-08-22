

export interface User {
  id: string;

  email: string;

  displayName: string;

  role: 'user' | 'admin';

  // Optional personal information.
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  phone?: string;

  // Optional location information.
  countryOfOrigin?: string;
  currentCountry?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  // Optional preferences.
  preferredLanguage?: string;

  // Optional profile information.
  bio?: string;
  website?: string;
  photoUrl?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
}