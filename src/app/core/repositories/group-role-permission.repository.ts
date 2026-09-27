import { GroupRolePermission } from '../models/group-role-permission.model';

export interface GroupRolePermissionRepository {
  /**
   * Get a permission assignment by ID.
   *
   * The ID identifies the GroupRolePermission document.
   * It is not a reference to a separate permission entity.
   */
  getPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<GroupRolePermission | null>;

  /**
   * Get all permission assignments for a group role.
   */
  getPermissionsForRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRolePermission[]>;

  /**
   * Create a permission assignment for a group role.
   */
  createPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    permission: Omit<GroupRolePermission, 'id' | 'groupRoleId'>,
  ): Promise<string>;

  /**
   * Update a permission assignment.
   */
  updatePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
    changes: Partial<Omit<GroupRolePermission, 'id' | 'groupRoleId'>>,
  ): Promise<void>;

  /**
   * Delete a permission assignment.
   */
  deletePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<void>;
}