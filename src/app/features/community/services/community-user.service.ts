import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  query,
  Timestamp,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { CommunityUser } from '../models/community-user.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityUserService {

  // =============================================================
  // Get user by ID
  // =============================================================

  /**
   * Retrieve a user's public Community profile.
   *
   * Community should only expose profile information that is
   * appropriate for other community members to see.
   */
  async getUserById(
    userId: string,
  ): Promise<CommunityUser | null> {

    if (!userId) {
      return null;
    }

    const userRef =
      doc(
        firestore,
        'users',
        userId,
      );

    const snapshot =
      await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data =
      snapshot.data();

    return this.mapUser(
      snapshot.id,
      data,
    );
  }


  // =============================================================
  // Get multiple users
  // =============================================================

  /**
   * Retrieve multiple Community users.
   *
   * Promise.all is used so the requests execute concurrently
   * instead of sequentially.
   *
   * Duplicate IDs are removed before querying Firestore.
   */
  async getUsersByIds(
    userIds: string[],
  ): Promise<CommunityUser[]> {

    const uniqueIds =
      [
        ...new Set(
          userIds.filter(Boolean),
        ),
      ];

    if (uniqueIds.length === 0) {
      return [];
    }

    const users =
      await Promise.all(
        uniqueIds.map(
          (userId) =>
            this.getUserById(userId),
        ),
      );

    return users.filter(
      (
        user,
      ): user is CommunityUser =>
        user !== null,
    );
  }


  // =============================================================
  // Get Community users
  // =============================================================

  /**
   * Retrieve users that can be displayed in the
   * Community member discovery experience.
   *
   * This is intentionally limited to a reasonable number of
   * users for the initial discovery experience.
   *
   * Search/filtering can then be performed client-side.
   */
  async getCommunityUsers(
    maxUsers: number = 50,
  ): Promise<CommunityUser[]> {

    const usersRef =
      collection(
        firestore,
        'users',
      );

    const usersQuery =
      query(
        usersRef,
        limit(maxUsers),
      );

    const snapshot =
      await getDocs(usersQuery);

    return snapshot.docs
      .map(
        (userDoc) =>
          this.mapUser(
            userDoc.id,
            userDoc.data(),
          ),
      );
  }


  // =============================================================
  // Map Firestore user
  // =============================================================

  /**
   * Convert a Firestore user document into the public
   * CommunityUser model.
   *
   * Keep this mapping centralized so all Community user
   * retrieval methods expose the same public fields.
   */
  private mapUser(
    id: string,
    data: Record<string, unknown>,
  ): CommunityUser {

    return {
      id,

      displayName:
        (data['displayName'] as string) ||
        'Zebron User',

      firstName:
        data['firstName'] as string | undefined,

      lastName:
        data['lastName'] as string | undefined,

      preferredName:
        data['preferredName'] as string | undefined,

      photoUrl:
        data['photoUrl'] as string | undefined,

      bio:
        data['bio'] as string | undefined,

      website:
        data['website'] as string | undefined,

      countryOfOrigin:
        data['countryOfOrigin'] as string | undefined,

      role:
        data['role'] as
          | 'user'
          | 'admin'
          | undefined,

      currentCountry:
        data['currentCountry'] as string | undefined,

      city:
        data['city'] as string | undefined,

      state:
        data['state'] as string | undefined,

      createdAt:
        (data['createdAt'] as Timestamp | null | undefined) ??
        null,

      updatedAt:
        (data['updatedAt'] as Timestamp | null | undefined) ??
        null,
    };
  }
}