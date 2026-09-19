import { Injectable, inject } from '@angular/core';

import {
  GroupMembership,

} from '../models/group-membership.model';

import { GroupRole } from '../models/group-role.model';
import { GroupRolePermission } from '../models/group-role-permission.model';
import { GroupRoleAssignment } from '../models/group-role-assignment.model';
import { GroupMembershipRepository } from '../repositories/firestore/group-membership.repository';
import { FirestoreGroupMembershipRepository } from '../repositories/firestore/firestore-group-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class GroupMembershipService {
  private readonly repository: GroupMembershipRepository =
    inject(FirestoreGroupMembershipRepository);

  async getMembership(
    membershipId: string,
  ): Promise<GroupMembership | null> {
    return this.repository.getMembership(membershipId);
  }

  async getMembershipsForGroup(
    groupId: string,
  ): Promise<GroupMembership[]> {
    return this.repository.getMembershipsForGroup(groupId);
  }

  async getMembershipsForUser(
    userId: string,
  ): Promise<GroupMembership[]> {
    return this.repository.getMembershipsForUser(userId);
  }

  async getMembershipForUserAndGroup(
    userId: string,
    groupId: string,
  ): Promise<GroupMembership | null> {
    return this.repository.getMembershipForUserAndGroup(
      userId,
      groupId,
    );
  }

  async createMembership(
    membership: Omit<GroupMembership, 'id'>,
  ): Promise<string> {
    return this.repository.createMembership(membership);
  }

  async updateMembership(
    membershipId: string,
    changes: Partial<Omit<GroupMembership, 'id'>>,
  ): Promise<void> {
    return this.repository.updateMembership(
      membershipId,
      changes,
    );
  }

  async deleteMembership(
    membershipId: string,
  ): Promise<void> {
    return this.repository.deleteMembership(
      membershipId,
    );
  }

  /**
   * Determine whether a user is an active member
   * of a group.
   */
  async isGroupMember(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const membership =
      await this.getMembershipForUserAndGroup(
        userId,
        groupId,
      );

    return membership?.active === true;
  }

  /**
   * Get role assignments for a group membership.
   */
  async getRoleAssignmentsForMembership(
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]> {
    return this.repository.getRoleAssignmentsForMembership(
      groupMembershipId,
    );
  }

  /**
   * Get a group role by ID.
   */
  async getGroupRole(
    groupRoleId: string,
  ): Promise<GroupRole | null> {
    return this.repository.getGroupRole(
      groupRoleId,
    );
  }

  /**
   * Get permissions assigned to a group role.
   */
  async getGroupRolePermissions(
    groupRoleId: string,
  ): Promise<GroupRolePermission[]> {
    return this.repository.getGroupRolePermissions(
      groupRoleId,
    );
  }

  /**
   * Deactivate a membership.
   */
  async deactivateMembership(
    membershipId: string,
  ): Promise<void> {
    return this.updateMembership(
      membershipId,
      {
        active: false,
      },
    );
  }

  /**
   * Reactivate a membership.
   */
  async activateMembership(
    membershipId: string,
  ): Promise<void> {
    return this.updateMembership(
      membershipId,
      {
        active: true,
      },
    );
  }
}