
import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firestore } from './firebase-config';
import { User } from '../models/user.model';
import { PlatformRole } from '../models/role.model';

/*
 * ================================================================
 * REQUEST / RESPONSE TYPES
 * ================================================================
 */

/**
 * Request used by the trusted createUser Cloud Function.
 *
 * platformRole is the canonical platform authorization field.
 *
 * role is retained temporarily for compatibility with existing
 * user records and the current migration.
 */
interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  platformRole?: PlatformRole;
  role?: 'user' | 'admin';
}

interface CreateUserResponse {
  success: boolean;
  uid: string;
  email: string;
  platformRole: PlatformRole;
}

/**
 * Request used by the trusted resetUserPassword Cloud Function.
 */
interface ResetUserPasswordRequest {
  uid: string;
}

interface ResetUserPasswordResponse {
  success: boolean;
  email: string;
  resetLink: string;
}

/**
 * Request used by the trusted updateUser Cloud Function.
 */
interface UpdateUserRequest {
  uid: string;
  profile: Record<string, unknown>;
}

interface UpdateUserResponse {
  success: boolean;
  uid: string;
}

/**
 * Request used by the trusted deleteUser Cloud Function.
 */
interface DeleteUserRequest {
  uid: string;
}

interface DeleteUserResponse {
  success: boolean;
  uid: string;
}

/*
 * ================================================================
 * SERVICE
 * ================================================================
 */

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  /**
   * Firestore users collection.
   *
   * This service uses Firestore directly for read-only
   * user retrieval.
   *
   * User mutations are handled by trusted Firebase Functions.
   */
  private readonly usersCollection =
    collection(
      firestore,
      'users',
    );

  /**
   * Firebase Functions instance.
   *
   * The Functions backend is deployed in the same
   * Firebase project as the Angular application.
   */
  private readonly functions =
    getFunctions();

  // ==============================================================
  // GET USER
  // ==============================================================

  /**
   * Get a single Zebron user by ID.
   *
   * @param userId Firebase Authentication / Firestore user ID.
   * @returns The user profile or null when not found.
   */
  async getUser(
    userId: string,
  ): Promise<User | null> {
    const normalizedId =
      userId.trim();

    if (!normalizedId) {
      return null;
    }

    try {
      const userSnapshot =
        await getDoc(
          doc(
            firestore,
            'users',
            normalizedId,
          ),
        );

      if (!userSnapshot.exists()) {
        return null;
      }

      return {
        id: userSnapshot.id,
        ...userSnapshot.data(),
      } as User;
    } catch (error) {
      console.error(
        'Failed to load user:',
        error,
      );

      throw error;
    }
  }

  // ==============================================================
  // GET USERS
  // ==============================================================

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
            'asc',
          ),
        );

      const snapshot =
        await getDocs(
          usersQuery,
        );

      return snapshot.docs.map(
        (userDoc) =>
          ({
            id: userDoc.id,
            ...userDoc.data(),
          }) as User,
      );
    } catch (error) {
      console.error(
        'Failed to load users:',
        error,
      );

      throw error;
    }
  }

  // ==============================================================
  // CREATE USER
  // ==============================================================

  /**
   * Create a new Firebase Authentication account and
   * corresponding Firestore profile.
   *
   * The actual account creation happens inside the
   * trusted Firebase Function.
   *
   * Platform authorization is supplied through platformRole.
   *
   * Normal application registration should NOT call this method
   * to create a platform administrator. This method is intended
   * for the administrative user-management workflow.
   */
  async createUser(
    user: CreateUserRequest,
  ): Promise<CreateUserResponse> {
    try {
      const createUserFunction =
        httpsCallable<
          CreateUserRequest,
          CreateUserResponse
        >(
          this.functions,
          'createUser',
        );

      const result =
        await createUserFunction(
          user,
        );

      return result.data;
    } catch (error) {
      console.error(
        'Failed to create user:',
        error,
      );

      throw error;
    }
  }

  // ==============================================================
  // CREATE NORMAL USER
  // ==============================================================

  /**
   * Create a normal platform user.
   *
   * This convenience method prevents callers from accidentally
   * creating a platform administrator through the normal
   * user-creation path.
   */
  async createStandardUser(
  email: string,
  password: string,
  displayName: string,
): Promise<CreateUserResponse> {
  return this.createUser({
    email,
    password,
    displayName,
    role: 'user',
  });
}

  // ==============================================================
  // CREATE PLATFORM ADMIN
  // ==============================================================

  /**
   * Create a platform administrator.
   *
   * The trusted backend must independently verify that the
   * current caller is authorized to create platform administrators.
   *
   * This method does not grant privileges by itself; it merely
   * requests the trusted backend to create the specified role.
   */
  async createPlatformAdmin(
    user: {
      email: string;
      password: string;
      displayName: string;
    },
  ): Promise<CreateUserResponse> {
    return this.createUser({
      email:
        user.email.trim().toLowerCase(),

      password:
        user.password,

      displayName:
        user.displayName.trim(),

      platformRole:
        'platform-admin',

      role:
        'admin',
    });
  }

  // ==============================================================
  // RESET PASSWORD
  // ==============================================================

  /**
   * Generate a secure password-reset link for a user.
   *
   * The request is handled by the trusted Firebase Function,
   * which verifies administrator authorization.
   */
  async resetUserPassword(
    userId: string,
  ): Promise<ResetUserPasswordResponse> {
    const normalizedId =
      userId.trim();

    if (!normalizedId) {
      throw new Error(
        'User ID is required.',
      );
    }

    try {
      const resetUserPasswordFunction =
        httpsCallable<
          ResetUserPasswordRequest,
          ResetUserPasswordResponse
        >(
          this.functions,
          'resetUserPassword',
        );

      const result =
        await resetUserPasswordFunction({
          uid: normalizedId,
        });

      return result.data;
    } catch (error) {
      console.error(
        'Failed to reset user password:',
        error,
      );

      throw error;
    }
  }

  // ==============================================================
  // UPDATE USER
  // ==============================================================

  /**
   * Update an existing user's profile.
   *
   * The mutation is handled by the trusted Firebase Function.
   *
   * The backend is responsible for:
   *
   * - verifying administrator authorization
   * - validating the target user
   * - validating platformRole changes
   * - protecting privileged fields
   * - applying updatedAt server-side
   */
  async updateUser(
    userId: string,
    profile: Partial<User>,
  ): Promise<void> {
    const normalizedId =
      userId.trim();

    if (!normalizedId) {
      throw new Error(
        'User ID is required.',
      );
    }

    try {
      const updateUserFunction =
        httpsCallable<
          UpdateUserRequest,
          UpdateUserResponse
        >(
          this.functions,
          'updateUser',
        );

      await updateUserFunction({
        uid: normalizedId,

        profile:
          profile as Record<
            string,
            unknown
          >,
      });
    } catch (error) {
      console.error(
        'Failed to update user:',
        error,
      );

      throw error;
    }
  }

  // ==============================================================
  // UPDATE PLATFORM ROLE
  // ==============================================================

  /**
   * Update a user's canonical platform role.
   *
   * This must be handled by the trusted updateUser Cloud Function.
   *
   * The client never writes platformRole directly to Firestore.
   */
  async updatePlatformRole(
    userId: string,
    platformRole: PlatformRole,
  ): Promise<void> {
    const normalizedId =
      userId.trim();

    if (!normalizedId) {
      throw new Error(
        'User ID is required.',
      );
    }

    await this.updateUser(
      normalizedId,
      {
        platformRole,
      },
    );
  }

  // ==============================================================
  // DELETE USER
  // ==============================================================

  /**
   * Delete a user.
   *
   * The trusted Firebase Function removes:
   *
   * 1. The Firebase Authentication account.
   * 2. The corresponding Firestore profile.
   *
   * The backend also prevents administrators from deleting
   * their own account.
   */
  async deleteUser(
    userId: string,
  ): Promise<void> {
    const normalizedId =
      userId.trim();

    if (!normalizedId) {
      throw new Error(
        'User ID is required.',
      );
    }

    try {
      const deleteUserFunction =
        httpsCallable<
          DeleteUserRequest,
          DeleteUserResponse
        >(
          this.functions,
          'deleteUser',
        );

      await deleteUserFunction({
        uid: normalizedId,
      });
    } catch (error) {
      console.error(
        'Failed to delete user:',
        error,
      );

      throw error;
    }
  }
}