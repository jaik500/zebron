import { Permission } from './permission.model';

export interface GroupRolePermission {
  id: string;
  groupRoleId: string;
  permission: Permission;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
