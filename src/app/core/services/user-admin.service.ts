import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firestore } from './firebase-config';
import { User } from '../models/user.model';

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';

  firstName?: string;
  lastName?: string;
  preferredName?: string;
  phone?: string;

  countryOfOrigin?: string;
  currentCountry?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  preferredLanguage?: string;

  bio?: string;
  website?: string;
}

interface CreateUserResponse {
  success: boolean;
  uid: string;
  email: string;
  role: 'user' | 'admin';
}

interface ResetUserPasswordRequest {
  uid: string;
}

interface ResetUserPasswordResponse {
  success: boolean;
  email: string;
  resetLink: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {

  /**
   * Firestore users collection.
   */
  private readonly usersCollection =
    collection(firestore, 'users');

  /**
   * Firebase Functions instance.
   *
   * The Functions backend is deployed in the
   * same Firebase project as the Angular app.
   */
  private readonly functions =
    getFunctions();


  /**
   * Get all Zebron users from Firestore.
   *
   * Users are ordered by display name.
   */
  async getUsers(): Promise<User[]> {
    try {

      const usersQuery =
        query(
          this.usersCollection,
          orderBy(
            'displayName',
            'asc'
          )
        );

      const snapshot =
        await getDocs(usersQuery);

      return snapshot.docs.map(
        (userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        })
      ) as User[];

    } catch (error) {

      console.error(
        'Failed to load users:',
        error
      );

      throw error;
    }
  }


  /**
   * Create a new Firebase Authentication
   * account and corresponding Firestore profile.
   *
   * IMPORTANT:
   * The actual account creation happens
   * inside the trusted Firebase Function.
   */
  async createUser(
    user: CreateUserRequest
  ): Promise<CreateUserResponse> {

    try {

      const createUserFunction =
        httpsCallable<
          CreateUserRequest,
          CreateUserResponse
        >(
          this.functions,
          'createUser'
        );

      const result =
        await createUserFunction(user);

      return result.data;

    } catch (error) {

      console.error(
        'Failed to create user:',
        error
      );

      throw error;
    }
  }

  /**
 * Generate a secure password-reset link for a user.
 *
 * The request is handled by the trusted Firebase Function,
 * which verifies that the current caller is an administrator.
 */
async resetUserPassword(
  userId: string
): Promise<ResetUserPasswordResponse> {

  try {

    const resetUserPasswordFunction =
      httpsCallable<
        ResetUserPasswordRequest,
        ResetUserPasswordResponse
      >(
        this.functions,
        'resetUserPassword'
      );

    const result =
      await resetUserPasswordFunction({
        uid: userId,
      });

    return result.data;

  } catch (error) {

    console.error(
      'Failed to reset user password:',
      error
    );

    throw error;
  }
}


  /**
   * Update an existing user's Firestore profile.
   *
   * Firebase Authentication account management
   * will be handled separately where required.
   */
  async updateUser(
    userId: string,
    profile: Partial<User>
  ): Promise<void> {

    try {

      const userRef =
        doc(
          firestore,
          'users',
          userId
        );

      await updateDoc(
        userRef,
        {
          ...profile,

          updatedAt:
            serverTimestamp(),
        }
      );

    } catch (error) {

      console.error(
        'Failed to update user:',
        error
      );

      throw error;
    }
  }


  /**
   * Delete a user's Firestore profile.
   *
   * NOTE:
   * This currently does NOT delete the
   * Firebase Authentication account.
   *
   * We will replace this with the secure
   * admin delete function after Create User
   * is working.
   */
  async deleteUser(
    userId: string
  ): Promise<void> {

    try {

      const userRef =
        doc(
          firestore,
          'users',
          userId
        );

      await deleteDoc(userRef);

    } catch (error) {

      console.error(
        'Failed to delete user profile:',
        error
      );

      throw error;
    }
  }
}