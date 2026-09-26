import { Injectable, inject } from '@angular/core';

import {
  OrganizationRole,
  PlatformRole,
  PLATFORM_ROLE_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
} from '../models/role.model';

import {
  Permission,
  PERMISSIONS,
} from '../models/permission.model';

import { OrganizationMembershipService } from './organization-membership.service';
import { UserAdminService } from './user-admin.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly membershipService = inject(
    OrganizationMembershipService,
  );

  private readonly userAdminService =
  inject(UserAdminService);

  /**
   * Get the permissions assigned to a platform role.
   */
  getPlatformPermissions(
    role: PlatformRole | undefined,
  ): Permission[] {
    if (!role) {
      return [];
    }

    return [
      ...(
        PLATFORM_ROLE_PERMISSIONS[role] ?? []
      ),
    ];
  }

  /**
 * Resolve the canonical platform role for a user.
 *
 * The role is loaded from the user's persisted
 * Firestore profile and is never accepted from
 * the caller as an authorization claim.
 */
async getPlatformRole(
  userId: string,
): Promise<PlatformRole | undefined> {
  const user =
    await this.userAdminService.getUser(userId);

  return user?.platformRole;
}

  /**
   * Get the permissions assigned to an organization role.
   */
  getOrganizationPermissionsForRole(
    role: OrganizationRole,
  ): Permission[] {
    return [
      ...(
        ORGANIZATION_ROLE_PERMISSIONS[role] ?? []
      ),
    ];
  }

  /**
   * Determine whether a platform role has a permission.
   */
  hasPlatformPermission(
    role: PlatformRole | undefined,
    permission: Permission,
  ): boolean {
    return this.getPlatformPermissions(role)
      .includes(permission);
  }

  /**
   * Determine whether an organization role has a permission.
   */
  hasOrganizationPermission(
    role: OrganizationRole,
    permission: Permission,
  ): boolean {
    return this.getOrganizationPermissionsForRole(role)
      .includes(permission);
  }

  /**
   * Resolve the active organization permissions
   * for a specific user.
   */
  async getOrganizationPermissions(
    userId: string,
    organizationId: string,
  ): Promise<Permission[]> {
    const membership =
      await this.membershipService
        .getMembershipForUserAndOrganization(
          userId,
          organizationId,
        );

    if (!membership || !membership.active) {
      return [];
    }

    return this.getOrganizationPermissionsForRole(
      membership.role as OrganizationRole,
    );
  }

  /**
   * Determine whether a user has a permission
   * through their active organization membership.
   */
  async hasOrganizationPermissionForUser(
    userId: string,
    organizationId: string,
    permission: Permission,
  ): Promise<boolean> {
    const permissions =
      await this.getOrganizationPermissions(
        userId,
        organizationId,
      );

    return permissions.includes(permission);
  }

  /**
   * Combine platform and organization permissions.
   *
   * Platform permissions apply globally.
   * Organization permissions apply within the
   * specified organization.
   */
  async getEffectivePermissions(
    userId: string,
    organizationId: string | undefined,
    platformRole: PlatformRole | undefined,
  ): Promise<Permission[]> {
    const permissions = new Set<Permission>();

    /**
     * Platform permissions.
     */
    for (const permission of this.getPlatformPermissions(
      platformRole,
    )) {
      permissions.add(permission);
    }

    /**
     * Organization permissions.
     */
    if (organizationId) {
      const organizationPermissions =
        await this.getOrganizationPermissions(
          userId,
          organizationId,
        );

      for (const permission of organizationPermissions) {
        permissions.add(permission);
      }
    }

    return [...permissions];
  }

  /**
   * Determine whether the user has an effective
   * permission through either platform authorization
   * or organization membership.
   */
  async hasEffectivePermission(
    userId: string,
    organizationId: string | undefined,
    platformRole: PlatformRole | undefined,
    permission: Permission,
  ): Promise<boolean> {
    const permissions =
      await this.getEffectivePermissions(
        userId,
        organizationId,
        platformRole,
      );

    return permissions.includes(permission);
  }

  /**
 * Resolve effective permissions for a user.
 *
 * Platform permissions come from the persisted
 * platformRole.
 *
 * Organization permissions come from the user's
 * active organization membership.
 */
async getEffectivePermissionsForUser(
  userId: string,
  organizationId?: string,
): Promise<Permission[]> {
  const platformRole =
    await this.getPlatformRole(userId);

  return this.getEffectivePermissions(
    userId,
    organizationId,
    platformRole,
  );
}

/**
 * Determine whether a user has an effective
 * permission without accepting the platform role
 * from the caller.
 */
async hasEffectivePermissionForUser(
  userId: string,
  organizationId: string | undefined,
  permission: Permission,
): Promise<boolean> {
  const permissions =
    await this.getEffectivePermissionsForUser(
      userId,
      organizationId,
    );

  return permissions.includes(permission);
}
}