import { Injectable, inject } from '@angular/core';

import { GroupRole } from '../models/group-role.model';
import { GroupRoleRepository } from '../repositories/group-role.repository';
import { FirestoreGroupRoleRepository } from '../repositories/firestore/firestore-group-role.repository';

@Injectable({ providedIn: 'root' })
export class GroupRoleService {
  private readonly repository: GroupRoleRepository =
    inject(FirestoreGroupRoleRepository);

  async getRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRole | null> {
    return this.repository.getRole(
      organizationId,
      groupId,
      roleId,
    );
  }

  async getRolesForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupRole[]> {
    return this.repository.getRolesForGroup(
      organizationId,
      groupId,
    );
  }

  async createRole(
    organizationId: string,
    groupId: string,
    role: Omit<GroupRole, 'id' | 'groupId'>,
  ): Promise<string> {
    return this.repository.createRole(
      organizationId,
      groupId,
      role,
    );
  }

  async updateRole(
    organizationId: string,
    groupId: string,
    roleId: string,
    changes: Partial<Omit<GroupRole, 'id' | 'groupId'>>,
  ): Promise<void> {
    return this.repository.updateRole(
      organizationId,
      groupId,
      roleId,
      changes,
    );
  }

  async deleteRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<void> {
    return this.repository.deleteRole(
      organizationId,
      groupId,
      roleId,
    );
  }
}
