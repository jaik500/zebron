import { GroupMembership } from '../../models/group-membership.model';
import { GroupRole } from '../../models/group-role.model';
import { GroupRolePermission } from '../../models/group-role-permission.model';
import { GroupRoleAssignment } from '../../models/group-role-assignment.model';

export interface GroupMembershipRepository {
  /**
   * Get a group membership by ID.
   */
  getMembership(
    membershipId: string,
  ): Promise<GroupMembership | null>;

  /**
   * Get all memberships for a group.
   */
  getMembershipsForGroup(
    groupId: string,
  ): Promise<GroupMembership[]>;

  /**
   * Get all memberships for a user.
   */
  getMembershipsForUser(
    userId: string,
  ): Promise<GroupMembership[]>;

  /**
   * Get a user's membership within a specific group.
   */
  getMembershipForUserAndGroup(
    userId: string,
    groupId: string,
  ): Promise<GroupMembership | null>;

  /**
   * Create a group membership.
   */
  createMembership(
    membership: Omit<GroupMembership, 'id'>,
  ): Promise<string>;

  /**
   * Update a group membership.
   */
  updateMembership(
    membershipId: string,
    changes: Partial<Omit<GroupMembership, 'id'>>,
  ): Promise<void>;

  /**
   * Delete a group membership.
   */
  deleteMembership(
    membershipId: string,
  ): Promise<void>;

  /**
   * Get role assignments associated with
   * a group membership.
   */
  getRoleAssignmentsForMembership(
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]>;

  /**
   * Get a group role by ID.
   */
  getGroupRole(
    groupRoleId: string,
  ): Promise<GroupRole | null>;

  /**
   * Get permissions assigned to a group role.
   */
  getGroupRolePermissions(
    groupRoleId: string,
  ): Promise<GroupRolePermission[]>;
}