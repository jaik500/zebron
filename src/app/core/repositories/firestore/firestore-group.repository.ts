import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { Group } from '../../models/group.model';

import { GroupRepository } from '../group.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreGroupRepository
  implements GroupRepository
{
  private readonly firestore = inject(Firestore);

  /**
   * Firestore collection containing groups.
   */
  private readonly groupsCollection = 'groups';

  // ============================================================
  // GROUPS
  // ============================================================

  /**
   * Get a group by ID.
   */
  async getGroup(
    groupId: string,
  ): Promise<Group | null> {
    const snapshot = await getDoc(
      doc(
        this.firestore,
        this.groupsCollection,
        groupId,
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Group;
  }

  /**
   * Get all groups belonging to an organization.
   */
  async getGroupsForOrganization(
    organizationId: string,
  ): Promise<Group[]> {
    const snapshot = await getDocs(
      query(
        collection(
          this.firestore,
          this.groupsCollection,
        ),
        where(
          'organizationId',
          '==',
          organizationId,
        ),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Group[];
  }

  /**
   * Get a group by its organization-scoped slug.
   */
  async getGroupBySlug(
    organizationId: string,
    slug: string,
  ): Promise<Group | null> {
    const snapshot = await getDocs(
      query(
        collection(
          this.firestore,
          this.groupsCollection,
        ),
        where(
          'organizationId',
          '==',
          organizationId,
        ),
        where(
          'slug',
          '==',
          slug,
        ),
      ),
    );

    const item = snapshot.docs[0];

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      ...item.data(),
    } as Group;
  }

  /**
   * Create a group.
   */
  async createGroup(
    group: Omit<Group, 'id'>,
  ): Promise<string> {
    const reference = await addDoc(
      collection(
        this.firestore,
        this.groupsCollection,
      ),
      group,
    );

    return reference.id;
  }

  /**
   * Update a group.
   */
  async updateGroup(
    groupId: string,
    changes: Partial<Omit<Group, 'id'>>,
  ): Promise<void> {
    await updateDoc(
      doc(
        this.firestore,
        this.groupsCollection,
        groupId,
      ),
      changes,
    );
  }

  /**
   * Delete a group.
   */
  async deleteGroup(
    groupId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        this.firestore,
        this.groupsCollection,
        groupId,
      ),
    );
  }
}