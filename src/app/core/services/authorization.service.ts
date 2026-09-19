import { Injectable, inject } from '@angular/core';

import {
  ORGANIZATION_ROLE_PERMISSIONS,
  OrganizationRole,
  PlatformRole,
  PLATFORM_ROLE_PERMISSIONS,
} from '../models/role.model';

import { Permission as PermissionType } from '../models/permission.model';
import { Group } from '../models/group.model';

import { MembershipService } from './membership.service';
import { GroupMembershipService } from './group-membership.service';
import { GroupService } from './group.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly membershipService =
    inject(MembershipService);

  private readonly groupMembershipService =
    inject(GroupMembershipService);

  private readonly groupService =
    inject(GroupService);

  // ============================================================
  // PLATFORM AUTHORIZATION
  // ============================================================

  /**
   * Check whether a platform role grants a permission.
   */
  hasPlatformPermission(
    role: PlatformRole | null | undefined,
    permission: PermissionType,
  ): boolean {
    if (!role) {
      return false;
    }

    return (
      PLATFORM_ROLE_PERMISSIONS[role]?.includes(
        permission,
      ) ?? false
    );
  }

  // ============================================================
  // ORGANIZATION AUTHORIZATION
  // ============================================================

  /**
   * Check whether an organization role grants
   * a permission.
   */
  hasOrganizationPermission(
    role: OrganizationRole | null | undefined,
    permission: PermissionType,
  ): boolean {
    if (!role) {
      return false;
    }

    return (
      ORGANIZATION_ROLE_PERMISSIONS[role]?.includes(
        permission,
      ) ?? false
    );
  }

  /**
   * Resolve the permissions granted by a user's
   * active organization membership.
   */
  async getOrganizationPermissions(
    userId: string,
    organizationId: string,
  ): Promise<PermissionType[]> {
    const membership =
      await this.membershipService
        .getMembershipForUserAndOrganization(
          userId,
          organizationId,
        );

    if (!membership || !membership.active) {
      return [];
    }

    const permissions =
      new Set<PermissionType>();

    const rolePermissions =
      ORGANIZATION_ROLE_PERMISSIONS[
        membership.role
      ] ?? [];

    for (const permission of rolePermissions) {
      permissions.add(permission);
    }

    return Array.from(permissions);
  }

  /**
   * Determine whether a user has an
   * organization-level permission.
   */
  async hasOrganizationPermissionForUser(
    userId: string,
    organizationId: string,
    permission: PermissionType,
  ): Promise<boolean> {
    const permissions =
      await this.getOrganizationPermissions(
        userId,
        organizationId,
      );

    return permissions.includes(permission);
  }

  // ============================================================
  // GROUP MEMBERSHIPS
  // ============================================================

  /**
   * Get the active groups that a user belongs to
   * within an organization.
   *
   * Group membership alone is not sufficient.
   * The group itself must also be active and belong
   * to the requested organization.
   */
  async getUserGroups(
    userId: string,
    organizationId: string,
  ): Promise<Group[]> {
    const memberships =
      await this.groupMembershipService
        .getMembershipsForUser(userId);

    const groups: Group[] = [];

    for (const membership of memberships) {
      if (!membership.active) {
        continue;
      }

      const group =
        await this.groupService.getGroup(
          membership.groupId,
        );

      if (
        !group ||
        !group.active ||
        group.organizationId !== organizationId
      ) {
        continue;
      }

      groups.push(group);
    }

    return groups;
  }

  // ============================================================
  // GROUP AUTHORIZATION
  // ============================================================

  /**
   * Resolve all permissions granted to a user
   * through their active group roles.
   *
   * Authorization chain:
   *
   * User
   *   ↓
   * GroupMembership
   *   ↓
   * GroupRoleAssignment
   *   ↓
   * GroupRole
   *   ↓
   * GroupRolePermission
   *   ↓
   * Permission
   */
  async getGroupPermissions(
    userId: string,
    groupId: string,
  ): Promise<PermissionType[]> {
    /**
     * Verify that the user has an active membership
     * in the requested group.
     */
    const membership =
      await this.groupMembershipService
        .getMembershipForUserAndGroup(
          userId,
          groupId,
        );

    if (!membership || !membership.active) {
      return [];
    }

    /**
     * Verify that the group itself exists and is active.
     */
    const group =
      await this.groupService.getGroup(groupId);

    if (!group || !group.active) {
      return [];
    }

    const assignments =
      await this.groupMembershipService
        .getRoleAssignmentsForMembership(
          membership.id,
        );

    const permissions =
      new Set<PermissionType>();

    for (const assignment of assignments) {
      /**
       * Ignore inactive role assignments.
       */
      if (!assignment.active) {
        continue;
      }

      const role =
        await this.groupMembershipService
          .getGroupRole(
            assignment.groupRoleId,
          );

      /**
       * Ignore missing or inactive roles.
       */
      if (!role || !role.active) {
        continue;
      }

      /**
       * Defense-in-depth:
       *
       * A role must belong to the same group as
       * the membership being evaluated.
       */
      if (role.groupId !== groupId) {
        continue;
      }

      const rolePermissions =
        await this.groupMembershipService
          .getGroupRolePermissions(
            role.id,
          );

      for (const rolePermission of rolePermissions) {
        /**
         * Ignore inactive permission assignments.
         */
        if (!rolePermission.active) {
          continue;
        }

        /**
         * Permission IDs are stable permission keys,
         * for example:
         *
         * users.view
         * users.manage
         * tax-rules.view
         */
        permissions.add(
          rolePermission.permissionId as PermissionType,
        );
      }
    }

    return Array.from(permissions);
  }

  /**
   * Determine whether a user has a specific
   * permission through a group.
   */
  async hasGroupPermissionForUser(
    userId: string,
    groupId: string,
    permission: PermissionType,
  ): Promise<boolean> {
    const permissions =
      await this.getGroupPermissions(
        userId,
        groupId,
      );

    return permissions.includes(permission);
  }
}