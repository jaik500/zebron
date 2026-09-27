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

import { GroupMembership } from '../../models/group-membership.model';
import { GroupMembershipRepository } from '../group-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreGroupMembershipRepository
  implements GroupMembershipRepository
{
  private readonly firestore = inject(Firestore);

  /**
   * Organization-scoped group membership collection.
   *
   * /organizations/{organizationId}/groups/{groupId}/members
   */
  private membershipsCollection(
    organizationId: string,
    groupId: string,
  ) {
    return collection(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'members',
    );
  }

  /**
   * Organization-scoped group membership document.
   *
   * /organizations/{organizationId}/groups/{groupId}/members/{membershipId}
   */
  private membershipDocument(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ) {
    return doc(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'members',
      membershipId,
    );
  }

  /**
   * Get one membership by ID.
   */
  async getMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<GroupMembership | null> {
    const snapshot = await getDoc(
      this.membershipDocument(
        organizationId,
        groupId,
        membershipId,
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as GroupMembership;
  }

  /**
   * Get all memberships for a specific group.
   *
   * This operation is intended for organization/group
   * administrators. Normal members should use the
   * user-specific methods instead.
   */
  async getMembershipsForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupMembership[]> {
    const snapshot = await getDocs(
      this.membershipsCollection(
        organizationId,
        groupId,
      ),
    );

    return snapshot.docs.map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as GroupMembership,
    );
  }

  /**
   * Get the active memberships for a user within
   * an organization.
   *
   * Firestore does not allow us to perform an
   * unrestricted cross-group membership query here.
   *
   * Therefore:
   *
   * 1. Load only active groups in the organization.
   * 2. Query each group's members collection.
   * 3. Restrict membership records to the requested user.
   * 4. Restrict membership records to active memberships.
   */
  async getMembershipsForUser(
    organizationId: string,
    userId: string,
  ): Promise<GroupMembership[]> {
    const groupsSnapshot = await getDocs(
      query(
        collection(
          this.firestore,
          'organizations',
          organizationId,
          'groups',
        ),
        where('active', '==', true),
      ),
    );

    const memberships: GroupMembership[] = [];

    for (const group of groupsSnapshot.docs) {
      const membersSnapshot = await getDocs(
        query(
          this.membershipsCollection(
            organizationId,
            group.id,
          ),
          where('userId', '==', userId),
          where('active', '==', true),
        ),
      );

      memberships.push(
        ...membersSnapshot.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as GroupMembership,
        ),
      );
    }

    return memberships;
  }

  /**
   * Get a user's membership in a specific group.
   */
  async getMembershipForUserAndGroup(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<GroupMembership | null> {
    const snapshot = await getDocs(
      query(
        this.membershipsCollection(
          organizationId,
          groupId,
        ),
        where('userId', '==', userId),
      ),
    );

    const item = snapshot.docs[0];

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      ...item.data(),
    } as GroupMembership;
  }

  /**
   * Create a membership inside the specified group.
   *
   * groupId is deliberately taken from the method
   * parameter rather than trusting the caller's object.
   */
  async createMembership(
    organizationId: string,
    groupId: string,
    membership: Omit<GroupMembership, 'id' | 'groupId'>,
  ): Promise<string> {
    const reference = await addDoc(
      this.membershipsCollection(
        organizationId,
        groupId,
      ),
      {
        ...membership,
        groupId,
      },
    );

    return reference.id;
  }

  /**
   * Update mutable membership properties.
   *
   * groupId and userId are intentionally excluded
   * because the Firestore rules treat the group and
   * user identity as immutable membership ownership.
   */
  async updateMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
    changes: Partial<
      Omit<
        GroupMembership,
        'id' | 'groupId' | 'userId'
      >
    >,
  ): Promise<void> {
    await updateDoc(
      this.membershipDocument(
        organizationId,
        groupId,
        membershipId,
      ),
      changes,
    );
  }

  /**
   * Delete a membership from the specified group.
   */
  async deleteMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<void> {
    await deleteDoc(
      this.membershipDocument(
        organizationId,
        groupId,
        membershipId,
      ),
    );
  }
}