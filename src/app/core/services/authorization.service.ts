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
import { GroupRoleService } from './group-role.service';
import { GroupRoleAssignmentService } from './group-role-assignment.service';
import { GroupRolePermissionService } from './group-role-permission.service';
import { UserAdminService } from './user-admin.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  // ============================================================
  // DEPENDENCIES
  // ============================================================

  private readonly membershipService =
    inject(MembershipService);

  private readonly groupService =
    inject(GroupService);

  private readonly groupMembershipService =
    inject(GroupMembershipService);

  private readonly groupRoleService =
    inject(GroupRoleService);

  private readonly groupRoleAssignmentService =
    inject(GroupRoleAssignmentService);

  private readonly groupRolePermissionService =
    inject(GroupRolePermissionService);

  private readonly userAdminService =
    inject(UserAdminService);

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

  /**
   * Get all permissions granted by a platform role.
   */
  getPlatformPermissions(
    role: PlatformRole | null | undefined,
  ): PermissionType[] {
    if (!role) {
      return [];
    }

    return [
      ...(PLATFORM_ROLE_PERMISSIONS[role] ?? []),
    ];
  }

  /**
   * Resolve a user's current platform role.
   *
   * Platform role is stored on the user profile.
   */
  async getPlatformRole(
    userId: string,
  ): Promise<PlatformRole | undefined> {
    const user =
      await this.userAdminService.getUser(
        userId,
      );

    return user?.platformRole;
  }

  // ============================================================
  // ORGANIZATION AUTHORIZATION
  // ============================================================

  /**
   * Check whether an organization role grants
   * a permission.
   *
   * Canonical organization roles:
   *
   * org_owner
   * org_admin
   * org_manager
   * org_staff
   * org_member
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
   * Get all permissions granted by an organization role.
   */
  getOrganizationPermissionsForRole(
    role: OrganizationRole | null | undefined,
  ): PermissionType[] {
    if (!role) {
      return [];
    }

    return [
      ...(ORGANIZATION_ROLE_PERMISSIONS[role] ?? []),
    ];
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

    if (
      !membership ||
      !membership.active
    ) {
      return [];
    }

    const permissions =
      new Set<PermissionType>();

    const role: OrganizationRole =
      membership.role;

    const rolePermissions =
      ORGANIZATION_ROLE_PERMISSIONS[role] ?? [];

    for (
      const permission of rolePermissions
    ) {
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

    return permissions.includes(
      permission,
    );
  }

  // ============================================================
  // GROUP MEMBERSHIPS
  // ============================================================

  /**
   * Get the active groups that a user belongs to
   * within an organization.
   *
   * Group membership alone is not sufficient.
   *
   * The following must all be true:
   *
   * 1. User has an active group membership.
   * 2. Group exists.
   * 3. Group is active.
   * 4. Group belongs to the requested organization.
   */
  async getUserGroups(
    userId: string,
    organizationId: string,
  ): Promise<Group[]> {
    const memberships =
      await this.groupMembershipService
        .getMembershipsForUser(
          organizationId,
          userId,
        );

    const groups: Group[] = [];

    for (
      const membership of memberships
    ) {
      if (!membership.active) {
        continue;
      }

      const group =
        await this.groupService.getGroup(
          organizationId,
          membership.groupId,
        );

      if (
        !group ||
        !group.active ||
        group.organizationId !==
          organizationId
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
   * through one specific group.
   *
   * Authorization chain:
   *
   * User
   *   ↓
   * Organization Membership
   *   ↓
   * Group Membership
   *   ↓
   * Group
   *   ↓
   * Group Role Assignment
   *   ↓
   * Group Role
   *   ↓
   * Group Role Permission
   *   ↓
   * Permission
   */
  async getGroupPermissions(
    userId: string,
    organizationId: string,
    groupId: string,
  ): Promise<PermissionType[]> {
    // ----------------------------------------------------------
    // ORGANIZATION MEMBERSHIP
    // ----------------------------------------------------------

    /*
     * A group permission must never bypass the
     * organization membership boundary.
     */
    const organizationMembership =
      await this.membershipService
        .getMembershipForUserAndOrganization(
          userId,
          organizationId,
        );

    if (
      !organizationMembership ||
      !organizationMembership.active
    ) {
      return [];
    }

    // ----------------------------------------------------------
    // GROUP MEMBERSHIP
    // ----------------------------------------------------------

   const groupMembership =
  await this.groupMembershipService
    .getMembershipForUserAndGroup(
      organizationId,
      groupId,
      userId,
    );

    if (
      !groupMembership ||
      !groupMembership.active
    ) {
      return [];
    }

    // ----------------------------------------------------------
    // GROUP
    // ----------------------------------------------------------

    const group =
      await this.groupService.getGroup(
        organizationId,
        groupId,
      );

    if (
      !group ||
      !group.active ||
      group.organizationId !==
        organizationId
    ) {
      return [];
    }

    const permissions =
      new Set<PermissionType>();

    // ----------------------------------------------------------
    // ROLE ASSIGNMENTS
    // ----------------------------------------------------------

    const assignments =
      await this.groupRoleAssignmentService
        .getAssignmentsForMembership(
          organizationId,
          groupId,
          groupMembership.id,
        );

    for (
      const assignment of assignments
    ) {
      if (!assignment.active) {
        continue;
      }

      // --------------------------------------------------------
      // GROUP ROLE
      // --------------------------------------------------------

      const role =
        await this.groupRoleService.getRole(
          organizationId,
          groupId,
          assignment.groupRoleId,
        );

      if (
        !role ||
        !role.active ||
        role.groupId !== groupId
      ) {
        continue;
      }

      // --------------------------------------------------------
      // ROLE PERMISSIONS
      // --------------------------------------------------------

      const rolePermissions =
        await this.groupRolePermissionService
          .getPermissionsForRole(
            organizationId,
            groupId,
            role.id,
          );

      for (
        const rolePermission of rolePermissions
      ) {
        if (
          !rolePermission.active
        ) {
          continue;
        }

        /*
         * The new GroupRolePermission model stores
         * the canonical Permission directly.
         *
         * Do NOT use the old permissionId property.
         */
        permissions.add(
          rolePermission.permission,
        );
      }
    }

    return Array.from(permissions);
  }

  /**
   * Determine whether a user has a permission
   * through one specific group.
   */
  async hasGroupPermissionForUser(
    userId: string,
    organizationId: string,
    groupId: string,
    permission: PermissionType,
  ): Promise<boolean> {
    const permissions =
      await this.getGroupPermissions(
        userId,
        organizationId,
        groupId,
      );

    return permissions.includes(
      permission,
    );
  }

  /**
   * Resolve all permissions granted to a user
   * through all active groups in an organization.
   */
  async getGroupPermissionsForUser(
    userId: string,
    organizationId: string,
  ): Promise<PermissionType[]> {
    const groups =
      await this.getUserGroups(
        userId,
        organizationId,
      );

    const permissions =
      new Set<PermissionType>();

    for (const group of groups) {
      const groupPermissions =
        await this.getGroupPermissions(
          userId,
          organizationId,
          group.id,
        );

      for (
        const permission of groupPermissions
      ) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  }

  /**
   * Determine whether a user has a permission
   * through any active group in an organization.
   */
  async hasGroupPermissionForUserInOrganization(
    userId: string,
    organizationId: string,
    permission: PermissionType,
  ): Promise<boolean> {
    const permissions =
      await this.getGroupPermissionsForUser(
        userId,
        organizationId,
      );

    return permissions.includes(
      permission,
    );
  }

  // ============================================================
  // EFFECTIVE AUTHORIZATION
  // ============================================================

  /**
   * Resolve the complete effective permission set.
   *
   * Effective permissions are the union of:
   *
   * Platform Role Permissions
   * +
   * Organization Role Permissions
   * +
   * Group Role Permissions
   *
   * Group permissions can never create:
   *
   * - platform roles
   * - organization membership
   * - organization roles
   *
   * They only contribute Permission values.
   */
  async getEffectivePermissions(
    userId: string,
    organizationId?: string,
    platformRole?: PlatformRole,
  ): Promise<PermissionType[]> {
    const permissions =
      new Set<PermissionType>();

    // ----------------------------------------------------------
    // PLATFORM ROLE
    // ----------------------------------------------------------

    if (platformRole) {
      const platformPermissions =
        PLATFORM_ROLE_PERMISSIONS[
          platformRole
        ] ?? [];

      for (
        const permission of platformPermissions
      ) {
        permissions.add(permission);
      }
    }

    // ----------------------------------------------------------
    // ORGANIZATION + GROUP PERMISSIONS
    // ----------------------------------------------------------

    if (organizationId) {
      const organizationPermissions =
        await this.getOrganizationPermissions(
          userId,
          organizationId,
        );

      for (
        const permission of organizationPermissions
      ) {
        permissions.add(permission);
      }

      const groupPermissions =
        await this.getGroupPermissionsForUser(
          userId,
          organizationId,
        );

      for (
        const permission of groupPermissions
      ) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  }

  /**
   * Resolve effective permissions using the
   * user's stored platform role.
   */
  async getEffectivePermissionsForUser(
    userId: string,
    organizationId?: string,
  ): Promise<PermissionType[]> {
    const platformRole =
      await this.getPlatformRole(
        userId,
      );

    return this.getEffectivePermissions(
      userId,
      organizationId,
      platformRole,
    );
  }

  /**
   * Determine whether a user has an effective
   * permission.
   */
  async hasEffectivePermission(
    userId: string,
    organizationId: string | undefined,
    permission: PermissionType,
    platformRole?: PlatformRole,
  ): Promise<boolean> {
    const permissions =
      await this.getEffectivePermissions(
        userId,
        organizationId,
        platformRole,
      );

    return permissions.includes(
      permission,
    );
  }

  /**
   * Determine whether a user has an effective
   * permission using the user's stored platform role.
   */
  async hasEffectivePermissionForUser(
    userId: string,
    organizationId: string | undefined,
    permission: PermissionType,
  ): Promise<boolean> {
    const permissions =
      await this.getEffectivePermissionsForUser(
        userId,
        organizationId,
      );

    return permissions.includes(
      permission,
    );
  }
}