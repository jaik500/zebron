import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
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

  /**
   * Public Community profiles are stored separately from private
   * account documents.
   *
   * Document IDs must match the corresponding Firebase Auth UIDs.
   */
  private readonly profilesCollection = 'communityProfiles';

  // =============================================================
  // GET USER BY ID
  // =============================================================

  /**
   * Retrieve a member's public Community profile.
   *
   * This method deliberately does not read from the private
   * /users collection.
   */
  async getUserById(
    userId: string,
  ): Promise<CommunityUser | null> {

    const id = userId.trim();

    if (!id) {
      return null;
    }

    const profileRef = doc(
      firestore,
      this.profilesCollection,
      id,
    );

    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapUser(
      snapshot.id,
      snapshot.data(),
    );
  }


  // =============================================================
  // GET MULTIPLE USERS BY ID
  // =============================================================

  /**
   * Retrieve multiple public Community profiles.
   *
   * Duplicate IDs are removed before requests are issued.
   * Requests execute concurrently.
   */
  async getUsersByIds(
    userIds: string[],
  ): Promise<CommunityUser[]> {

    const uniqueIds = [
      ...new Set(
        userIds
          .filter(
            (userId): userId is string =>
              typeof userId === 'string',
          )
          .map(
            (userId) => userId.trim(),
          )
          .filter(Boolean),
      ),
    ];

    if (uniqueIds.length === 0) {
      return [];
    }

    const profiles = await Promise.all(
      uniqueIds.map(
        (userId) => this.getUserById(userId),
      ),
    );

    return profiles.filter(
      (profile): profile is CommunityUser =>
        profile !== null,
    );
  }


  // =============================================================
  // GET COMMUNITY USERS
  // =============================================================

  /**
   * Retrieve public profiles for Community member discovery.
   *
   * This method returns only documents from the dedicated public
   * profile collection.
   *
   * Note:
   * Firestore does not guarantee a particular order without an
   * explicit ordering clause. This initial implementation uses
   * a bounded query and does not implement pagination.
   */
  async getCommunityUsers(
    maxUsers: number = 50,
  ): Promise<CommunityUser[]> {

    const normalizedLimit = Math.max(
      1,
      Math.min(
        Math.floor(maxUsers),
        100,
      ),
    );

    const profilesRef = collection(
      firestore,
      this.profilesCollection,
    );

    const profilesQuery = query(
      profilesRef,
      limit(normalizedLimit),
    );

    const snapshot = await getDocs(
      profilesQuery,
    );

    return snapshot.docs.map(
      (profileDoc) =>
        this.mapUser(
          profileDoc.id,
          profileDoc.data(),
        ),
    );
  }


  // =============================================================
  // MAP PUBLIC COMMUNITY PROFILE
  // =============================================================

  /**
   * Convert a public Community profile document into the
   * CommunityUser model.
   *
   * Only explicitly approved public profile fields are mapped.
   *
   * In particular, this method never reads or exposes a user's
   * platform authorization role.
   */
  private mapUser(
    id: string,
    data: Record<string, unknown>,
  ): CommunityUser {

    return {
      id,

      displayName:
        this.readString(data, 'displayName') ||
        'Zebron User',

      firstName:
        this.readOptionalString(data, 'firstName'),

      lastName:
        this.readOptionalString(data, 'lastName'),

      preferredName:
        this.readOptionalString(data, 'preferredName'),

      photoUrl:
        this.readOptionalString(data, 'photoUrl'),

      bio:
        this.readOptionalString(data, 'bio'),

      website:
        this.readOptionalString(data, 'website'),

      countryOfOrigin:
        this.readOptionalString(data, 'countryOfOrigin'),

      currentCountry:
        this.readOptionalString(data, 'currentCountry'),

      city:
        this.readOptionalString(data, 'city'),

      state:
        this.readOptionalString(data, 'state'),

      createdAt:
        this.readTimestamp(data, 'createdAt'),

      updatedAt:
        this.readTimestamp(data, 'updatedAt'),
    };
  }


  // =============================================================
  // READ STRING
  // =============================================================

  /**
   * Read a string field with a safe fallback.
   */
  private readString(
    data: Record<string, unknown>,
    field: string,
  ): string {

    const value = data[field];

    return typeof value === 'string'
      ? value.trim()
      : '';
  }


  // =============================================================
  // READ OPTIONAL STRING
  // =============================================================

  /**
   * Read an optional string field.
   */
  private readOptionalString(
    data: Record<string, unknown>,
    field: string,
  ): string | undefined {

    const value = data[field];

    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();

    return normalized || undefined;
  }


  // =============================================================
  // READ TIMESTAMP
  // =============================================================

  /**
   * Read a Firestore timestamp without assuming the field exists.
   */
  private readTimestamp(
    data: Record<string, unknown>,
    field: string,
  ): Timestamp | null {

    const value = data[field];

    return value instanceof Timestamp
      ? value
      : null;
  }

}