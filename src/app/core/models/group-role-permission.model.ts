export interface GroupRolePermission {
  id: string;

  /**
   * Role receiving the permission.
   */
  groupRoleId: string;

  /**
   * Permission being granted.
   */
  permissionId: string;

  /**
   * Whether this permission assignment is active.
   */
  active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}