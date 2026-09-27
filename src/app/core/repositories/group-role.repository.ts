import { GroupRole } from '../models/group-role.model';

export interface GroupRoleRepository {
  getRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRole | null>;

  getRolesForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupRole[]>;

  createRole(
    organizationId: string,
    groupId: string,
    role: Omit<GroupRole, 'id' | 'groupId'>,
  ): Promise<string>;

  updateRole(
    organizationId: string,
    groupId: string,
    roleId: string,
    changes: Partial<Omit<GroupRole, 'id' | 'groupId'>>,
  ): Promise<void>;

  deleteRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<void>;
}
