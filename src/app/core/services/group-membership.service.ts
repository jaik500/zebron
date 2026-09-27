import { Injectable, inject } from '@angular/core';

import { GroupMembership } from '../models/group-membership.model';
import { GroupMembershipRepository } from '../repositories/group-membership.repository';
import { FirestoreGroupMembershipRepository } from '../repositories/firestore/firestore-group-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class GroupMembershipService {
  private readonly repository: GroupMembershipRepository =
    inject(FirestoreGroupMembershipRepository);

  async getMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<GroupMembership | null> {
    return this.repository.getMembership(
      organizationId,
      groupId,
      membershipId,
    );
  }

  async getMembershipsForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupMembership[]> {
    return this.repository.getMembershipsForGroup(
      organizationId,
      groupId,
    );
  }

  async getMembershipsForUser(
    organizationId: string,
    userId: string,
  ): Promise<GroupMembership[]> {
    return this.repository.getMembershipsForUser(
      organizationId,
      userId,
    );
  }

  async getMembershipForUserAndGroup(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<GroupMembership | null> {
    return this.repository.getMembershipForUserAndGroup(
      organizationId,
      groupId,
      userId,
    );
  }

  async createMembership(
    organizationId: string,
    groupId: string,
    membership: Omit<
      GroupMembership,
      'id' | 'groupId'
    >,
  ): Promise<string> {
    return this.repository.createMembership(
      organizationId,
      groupId,
      membership,
    );
  }

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
    return this.repository.updateMembership(
      organizationId,
      groupId,
      membershipId,
      changes,
    );
  }

  async deleteMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<void> {
    return this.repository.deleteMembership(
      organizationId,
      groupId,
      membershipId,
    );
  }

  async isGroupMember(
    organizationId: string,
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const membership =
      await this.getMembershipForUserAndGroup(
        organizationId,
        groupId,
        userId,
      );

    return membership?.active === true;
  }

  async deactivateMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<void> {
    return this.updateMembership(
      organizationId,
      groupId,
      membershipId,
      {
        active: false,
      },
    );
  }

  async activateMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<void> {
    return this.updateMembership(
      organizationId,
      groupId,
      membershipId,
      {
        active: true,
      },
    );
  }
}