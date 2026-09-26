import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  OrganizationMembershipRole,
  OrganizationMembership,
} from '../models/organization-membership.model';

@Injectable({
  providedIn: 'root',
})
export class PartnerMemberService {
  private readonly collectionRef = collection(
    firestore,
    'organizationMemberships',
  );

  /**
   * Load all active members for one organization.
   *
   * This query is explicitly tenant scoped.
   */
  async getActiveMembers(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    const normalizedOrganizationId =
      organizationId.trim();

    if (!normalizedOrganizationId) {
      return [];
    }

    const membersQuery = query(
      this.collectionRef,
      where(
        'organizationId',
        '==',
        normalizedOrganizationId,
      ),
      where(
        'active',
        '==',
        true,
      ),
    );

    const snapshot =
      await getDocs(membersQuery);

    return snapshot.docs
      .map((entry) =>
        this.mapMembership(
          entry.id,
          entry.data(),
        ),
      )
      .sort((a, b) =>
        this.displayName(a).localeCompare(
          this.displayName(b),
        ),
      );
  }

  /**
   * Load all members, including inactive members,
   * for the current organization.
   */
  async getMembers(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    const normalizedOrganizationId =
      organizationId.trim();

    if (!normalizedOrganizationId) {
      return [];
    }

    const membersQuery = query(
      this.collectionRef,
      where(
        'organizationId',
        '==',
        normalizedOrganizationId,
      ),
    );

    const snapshot =
      await getDocs(membersQuery);

    return snapshot.docs
      .map((entry) =>
        this.mapMembership(
          entry.id,
          entry.data(),
        ),
      )
      .sort((a, b) =>
        this.displayName(a).localeCompare(
          this.displayName(b),
        ),
      );
  }

  /**
   * Get one membership by its deterministic ID.
   */
  async getMember(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const normalizedUserId =
      userId.trim();

    const normalizedOrganizationId =
      organizationId.trim();

    if (
      !normalizedUserId ||
      !normalizedOrganizationId
    ) {
      return null;
    }

    const membershipId =
      `${normalizedUserId}_${normalizedOrganizationId}`;

    const snapshot =
      await getDoc(
        doc(
          firestore,
          'organizationMemberships',
          membershipId,
        ),
      );

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapMembership(
      snapshot.id,
      snapshot.data(),
    );
  }

  /**
   * Update organization-directory information.
   *
   * The organizationId and userId are intentionally not
   * changeable through this method.
   */
  async updateMember(
    membershipId: string,
    changes: Partial<
      Pick<
        OrganizationMembership,
        | 'role'
        | 'active'
        | 'displayName'
        | 'email'
        | 'title'
        | 'phoneNumber'
      >
    >,
  ): Promise<void> {
    const normalizedMembershipId =
      membershipId.trim();

    if (!normalizedMembershipId) {
      throw new Error(
        'A membership ID is required.',
      );
    }

    const update: Record<
      string,
      unknown
    > = {};

    if (
      changes.role !== undefined
    ) {
      update['role'] =
        changes.role;
    }

    if (
      changes.active !== undefined
    ) {
      update['active'] =
        changes.active;
    }

    if (
      changes.displayName !== undefined
    ) {
      update['displayName'] =
        changes.displayName.trim();
    }

    if (
      changes.email !== undefined
    ) {
      update['email'] =
        changes.email.trim().toLowerCase();
    }

    if (
      changes.title !== undefined
    ) {
      update['title'] =
        changes.title.trim();
    }

    if (
      changes.phoneNumber !== undefined
    ) {
      update['phoneNumber'] =
        changes.phoneNumber.trim();
    }

    if (
      Object.keys(update).length === 0
    ) {
      return;
    }

    update['updatedAt'] =
      new Date();

    await updateDoc(
      doc(
        firestore,
        'organizationMemberships',
        normalizedMembershipId,
      ),
      update,
    );
  }

  searchMembers(
    members: OrganizationMembership[],
    searchTerm: string,
  ): OrganizationMembership[] {
    const term =
      searchTerm.trim().toLowerCase();

    if (!term) {
      return members;
    }

    return members.filter(
      (member) => {
        const searchableText = [
          member.displayName ?? '',
          member.email ?? '',
          member.userId,
          member.id,
          member.role,
          member.title ?? '',
          member.phoneNumber ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(term);
      },
    );
  }

  displayName(
    member: OrganizationMembership,
  ): string {
    return (
      member.displayName?.trim() ||
      member.email?.trim() ||
      member.userId
    );
  }

  roleLabel(
    role: OrganizationMembershipRole,
  ): string {
    switch (role) {
      case 'org_owner':
        return 'Owner';

      case 'org_admin':
        return 'Administrator';

      case 'org_manager':
        return 'Manager';

        case 'org_staff':
          return 'Staff';

      case 'org_member':
        return 'Member';

      default:
        return role;
    }
  }

  private mapMembership(
    id: string,
    data: Record<string, unknown>,
  ): OrganizationMembership {
    return {
      id,

      userId:
        typeof data['userId'] === 'string'
          ? data['userId']
          : '',

      organizationId:
        typeof data['organizationId'] === 'string'
          ? data['organizationId']
          : '',

      role:
        this.normalizeRole(
          data['role'],
        ),

      active:
        data['active'] === true,

      displayName:
        typeof data['displayName'] === 'string'
          ? data['displayName']
          : undefined,

      email:
        typeof data['email'] === 'string'
          ? data['email']
          : undefined,

      title:
        typeof data['title'] === 'string'
          ? data['title']
          : undefined,

      phoneNumber:
        typeof data['phoneNumber'] === 'string'
          ? data['phoneNumber']
          : undefined,

      createdAt:
        data['createdAt'],

      updatedAt:
        data['updatedAt'],
    };
  }

private normalizeRole(
  value: unknown,
): OrganizationMembershipRole {
  switch (value) {
    case 'owner':
      return 'org_owner';

    case 'admin':
      return 'org_admin';

    case 'manager':
      return 'org_manager';

    case 'staff':
      return 'org_staff';

    default:
      return 'org_member';
  }
}
}