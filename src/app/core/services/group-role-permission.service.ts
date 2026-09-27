import { Injectable, inject } from '@angular/core';

import { GroupRolePermission } from '../models/group-role-permission.model';
import { GroupRolePermissionRepository } from '../repositories/group-role-permission.repository';
import { FirestoreGroupRolePermissionRepository } from '../repositories/firestore/firestore-group-role-permission.repository';

@Injectable({ providedIn: 'root' })
export class GroupRolePermissionService {
  private readonly repository: GroupRolePermissionRepository =
    inject(FirestoreGroupRolePermissionRepository);

  async getPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<GroupRolePermission | null> {
    return this.repository.getPermission(
      organizationId,
      groupId,
      roleId,
      groupRolePermissionId,
    );
  }

  async getPermissionsForRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRolePermission[]> {
    return this.repository.getPermissionsForRole(
      organizationId,
      groupId,
      roleId,
    );
  }

  async createPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    permission: Omit<GroupRolePermission, 'id' | 'groupRoleId'>,
  ): Promise<string> {
    return this.repository.createPermission(
      organizationId,
      groupId,
      roleId,
      permission,
    );
  }

  async updatePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
    changes: Partial<Omit<GroupRolePermission, 'id' | 'groupRoleId'>>,
  ): Promise<void> {
    return this.repository.updatePermission(
      organizationId,
      groupId,
      roleId,
      groupRolePermissionId,
      changes,
    );
  }

  async deletePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<void> {
    return this.repository.deletePermission(
      organizationId,
      groupId,
      roleId,
      groupRolePermissionId,
    );
  }
}