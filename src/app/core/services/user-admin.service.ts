import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { firestore } from './firebase-config';
import { User } from '../models/user.model';
import { PlatformRole } from '../models/role.model';

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;

  /**
   * Canonical platform authorization role.
   */
  platformRole?: PlatformRole;

  /**
   * Legacy role retained temporarily for migration.
   */
  role?: 'user' | 'admin';
}

interface CreateUserResponse {
  success: boolean;
  uid: string;
  email: string;
  platformRole: PlatformRole;
}

interface ResetUserPasswordRequest {
  uid: string;
}

interface ResetUserPasswordResponse {
  success: boolean;
  email: string;
  resetLink: string;
}

interface UpdateUserRequest {
  uid: string;
  profile: Record<string, unknown>;
}

interface UpdateUserResponse {
  success: boolean;
  uid: string;
}

interface DeleteUserRequest {
  uid: string;
}

interface DeleteUserResponse {
  success: boolean;
  uid: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  /**
   * Firestore users collection.
   *
   * This service currently uses Firestore directly
   * for read-only user listing.
   *
   * User mutations are handled by trusted
   * Firebase Functions.
   */
  private readonly usersCollection = collection(firestore, 'users');

  /**
   * Firebase Functions instance.
   *
   * The Functions backend is deployed in the
   * same Firebase project as the Angular app.
   */
  private readonly functions = getFunctions();

  async getUser(userId: string): Promise<User | null> {
    const normalizedId = userId.trim();

    if (!normalizedId) {
      return null;
    }

    const userSnapshot = await getDoc(doc(firestore, 'users', normalizedId));

    if (!userSnapshot.exists()) {
      return null;
    }

    return {
      id: userSnapshot.id,
      ...userSnapshot.data(),
    } as User;
  }

  /**
   * Get all Zebron users from Firestore.
   *
   * Users are ordered by display name.
   */
  async getUsers(): Promise<User[]> {
    try {
      const usersQuery = query(this.usersCollection, orderBy('displayName', 'asc'));

      const snapshot = await getDocs(usersQuery);

      return snapshot.docs.map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data(),
      })) as User[];
    } catch (error) {
      console.error('Failed to load users:', error);

      throw error;
    }
  }

  /**
   * Create a new Firebase Authentication
   * account and corresponding Firestore profile.
   *
   * The actual account creation happens
   * inside the trusted Firebase Function.
   */
  async createUser(user: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const createUserFunction = httpsCallable<CreateUserRequest, CreateUserResponse>(
        this.functions,
        'createUser',
      );

      const result = await createUserFunction(user);

      return result.data;
    } catch (error) {
      console.error('Failed to create user:', error);

      throw error;
    }
  }

  /**
   * Generate a secure password-reset link
   * for a user.
   *
   * The request is handled by the trusted
   * Firebase Function, which verifies that
   * the current caller is an administrator.
   */
  async resetUserPassword(userId: string): Promise<ResetUserPasswordResponse> {
    try {
      const resetUserPasswordFunction = httpsCallable<
        ResetUserPasswordRequest,
        ResetUserPasswordResponse
      >(this.functions, 'resetUserPassword');

      const result = await resetUserPasswordFunction({
        uid: userId,
      });

      return result.data;
    } catch (error) {
      console.error('Failed to reset user password:', error);

      throw error;
    }
  }

  /**
   * Update an existing user's profile.
   *
   * The mutation is handled by the trusted
   * Firebase Function.
   *
   * The backend:
   *
   * - verifies administrator authorization
   * - validates the target user
   * - prevents protected fields from being changed
   * - applies updatedAt server-side
   */
  async updateUser(userId: string, profile: Partial<User>): Promise<void> {
    try {
      const updateUserFunction = httpsCallable<UpdateUserRequest, UpdateUserResponse>(
        this.functions,
        'updateUser',
      );

      await updateUserFunction({
        uid: userId,
        profile: profile as Record<string, unknown>,
      });
    } catch (error) {
      console.error('Failed to update user:', error);

      throw error;
    }
  }

  /**
   * Delete a user.
   *
   * The trusted Firebase Function removes:
   *
   * 1. The Firebase Authentication account.
   * 2. The corresponding Firestore profile.
   *
   * The backend also prevents administrators
   * from deleting their own account.
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const deleteUserFunction = httpsCallable<DeleteUserRequest, DeleteUserResponse>(
        this.functions,
        'deleteUser',
      );

      await deleteUserFunction({
        uid: userId,
      });
    } catch (error) {
      console.error('Failed to delete user:', error);

      throw error;
    }
  }
}
