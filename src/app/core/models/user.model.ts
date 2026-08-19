import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;

  email: string;
  displayName: string;

  photoURL?: string;

  role: UserRole;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}