import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { Injectable, inject } from '@angular/core';
import { Firestore } from 'firebase/firestore';

import {
  GroupMembership,
} from '../../models/group-membership.model';

import {
  GroupRole,
} from '../../models/group-role.model';

import {
  GroupRolePermission,
} from '../../models/group-role-permission.model';

import {
  GroupRoleAssignment,
} from '../../models/group-role-assignment.model';

import {
  GroupMembershipRepository,
} from './group-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreGroupMembershipRepository
  implements GroupMembershipRepository
{
  private readonly firestore = inject(Firestore);

  private readonly membershipCollection =
    'groupMemberships';

  private readonly assignmentCollection =
    'groupRoleAssignments';

  private readonly roleCollection =
    'groupRoles';

  private readonly permissionCollection =
    'groupRolePermissions';

  /**
   * Deterministic GroupMembership document ID.
   *
   * Format:
   *   {userId}_{groupId}
   */
  private membershipId(
    userId: string,
    groupId: string,
  ): string {
    return `${userId}_${groupId}`;
  }

  private membershipCollectionRef() {
    return collection(
      this.firestore,
      this.membershipCollection,
    );
  }

  private assignmentCollectionRef() {
    return collection(
      this.firestore,
      this.assignmentCollection,
    );
  }

  private roleCollectionRef() {
    return collection(
      this.firestore,
      this.roleCollection,
    );
  }

  private permissionCollectionRef() {
    return collection(
      this.firestore,
      this.permissionCollection,
    );
  }

  async getMembership(
    membershipId: string,
  ): Promise<GroupMembership | null> {
    const snapshot = await getDoc(
      doc(
        this.firestore,
        this.membershipCollection,
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

  async getMembershipsForGroup(
    groupId: string,
  ): Promise<GroupMembership[]> {
    const snapshot = await getDocs(
      query(
        this.membershipCollectionRef(),
        where('groupId', '==', groupId),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as GroupMembership[];
  }

  async getMembershipsForUser(
    userId: string,
  ): Promise<GroupMembership[]> {
    const snapshot = await getDocs(
      query(
        this.membershipCollectionRef(),
        where('userId', '==', userId),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as GroupMembership[];
  }

  async getMembershipForUserAndGroup(
    userId: string,
    groupId: string,
  ): Promise<GroupMembership | null> {
    const membershipId = this.membershipId(
      userId,
      groupId,
    );

    return this.getMembership(membershipId);
  }

  async createMembership(
    membership: Omit<GroupMembership, 'id'>,
  ): Promise<string> {
    const id = this.membershipId(
      membership.userId,
      membership.groupId,
    );

    const reference = doc(
      this.firestore,
      this.membershipCollection,
      id,
    );

    await setDoc(reference, membership);

    return id;
  }

  async updateMembership(
    membershipId: string,
    changes: Partial<Omit<GroupMembership, 'id'>>,
  ): Promise<void> {
    const reference = doc(
      this.firestore,
      this.membershipCollection,
      membershipId,
    );

    await updateDoc(reference, changes);
  }

  async deleteMembership(
    membershipId: string,
  ): Promise<void> {
    const reference = doc(
      this.firestore,
      this.membershipCollection,
      membershipId,
    );

    await deleteDoc(reference);
  }

  async getRoleAssignmentsForMembership(
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]> {
    const snapshot = await getDocs(
      query(
        this.assignmentCollectionRef(),
        where(
          'groupMembershipId',
          '==',
          groupMembershipId,
        ),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as GroupRoleAssignment[];
  }

  async getGroupRole(
    groupRoleId: string,
  ): Promise<GroupRole | null> {
    const snapshot = await getDoc(
      doc(
        this.firestore,
        this.roleCollection,
        groupRoleId,
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as GroupRole;
  }

  async getGroupRolePermissions(
    groupRoleId: string,
  ): Promise<GroupRolePermission[]> {
    const snapshot = await getDocs(
      query(
        this.permissionCollectionRef(),
        where(
          'groupRoleId',
          '==',
          groupRoleId,
        ),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as GroupRolePermission[];
  }
}