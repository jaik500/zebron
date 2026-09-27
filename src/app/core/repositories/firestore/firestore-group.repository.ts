
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
export class FirestoreGroupRepository implements GroupRepository {
  private readonly firestore = inject(Firestore);

  /**
   * Organization-scoped groups collection.
   *
   * Firestore path:
   * organizations/{organizationId}/groups
   */
  private groupsCollection(organizationId: string) {
    return collection(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
    );
  }

  /**
   * Organization-scoped group document.
   *
   * Firestore path:
   * organizations/{organizationId}/groups/{groupId}
   */
  private groupDocument(
    organizationId: string,
    groupId: string,
  ) {
    return doc(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
    );
  }

  /**
   * Get a single group within an organization.
   *
   * The organization ID is part of the Firestore path,
   * so a group can never accidentally be loaded from
   * another organization.
   */
  async getGroup(
    organizationId: string,
    groupId: string,
  ): Promise<Group | null> {
    const snapshot = await getDoc(
      this.groupDocument(
        organizationId,
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
   * Get active groups for an organization.
   *
   * IMPORTANT:
   * Normal organization members are only permitted by
   * Firestore rules to query groups with:
   *
   *   where('active', '==', true)
   *
   * Keeping that constraint here ensures the repository
   * remains compatible with the security rules.
   */
  async getGroupsForOrganization(
    organizationId: string,
  ): Promise<Group[]> {
    const groupsQuery = query(
      this.groupsCollection(organizationId),
      where('active', '==', true),
    );

    const snapshot = await getDocs(groupsQuery);

    return snapshot.docs.map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as Group,
    );
  }

  /**
   * Find an active group by slug within an organization.
   *
   * The active constraint is intentional. Without it,
   * a normal organization member's query would violate
   * the Firestore list rule.
   */
  async getGroupBySlug(
    organizationId: string,
    slug: string,
  ): Promise<Group | null> {
    const groupsQuery = query(
      this.groupsCollection(organizationId),
      where('slug', '==', slug),
      where('active', '==', true),
    );

    const snapshot = await getDocs(groupsQuery);

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
   * Create an organization-managed group.
   *
   * The organization ID comes from the Group itself and
   * determines where the document is stored.
   *
   * Firestore rules additionally prevent:
   * - regular members from creating groups
   * - creation of system-managed groups by organization admins
   * - creating a group under a different organization
   */
  async createGroup(
    group: Omit<Group, 'id'>,
  ): Promise<string> {
    const reference = await addDoc(
      this.groupsCollection(
        group.organizationId,
      ),
      group,
    );

    return reference.id;
  }

  /**
   * Update an existing organization-managed group.
   *
   * organizationId is intentionally excluded from changes
   * so application code cannot move a group between tenants.
   */
  async updateGroup(
    organizationId: string,
    groupId: string,
    changes: Partial<
      Omit<Group, 'id' | 'organizationId'>
    >,
  ): Promise<void> {
    await updateDoc(
      this.groupDocument(
        organizationId,
        groupId,
      ),
      changes,
    );
  }

  /**
   * Delete an organization-managed group.
   *
   * Firestore rules determine whether the caller is
   * allowed to delete the group and prevent deletion
   * of system-managed groups by organization admins.
   */
  async deleteGroup(
    organizationId: string,
    groupId: string,
  ): Promise<void> {
    await deleteDoc(
      this.groupDocument(
        organizationId,
        groupId,
      ),
    );
  }
}

