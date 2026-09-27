import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { GroupRolePermission } from '../../models/group-role-permission.model';
import { GroupRolePermissionRepository } from '../group-role-permission.repository';

@Injectable({ providedIn: 'root' })
export class FirestoreGroupRolePermissionRepository
  implements GroupRolePermissionRepository {
  private readonly firestore = inject(Firestore);

  private permissionsCollection(
    organizationId: string,
    groupId: string,
    roleId: string,
  ) {
    return collection(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roles',
      roleId,
      'permissions',
    );
  }

  private permissionDocument(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ) {
    return doc(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roles',
      roleId,
      'permissions',
      groupRolePermissionId,
    );
  }

  async getPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<GroupRolePermission | null> {
    const snapshot = await getDoc(
      this.permissionDocument(
        organizationId,
        groupId,
        roleId,
        groupRolePermissionId,
      ),
    );

    return snapshot.exists()
      ? ({
          id: snapshot.id,
          ...snapshot.data(),
        } as GroupRolePermission)
      : null;
  }

  async getPermissionsForRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRolePermission[]> {
    const snapshot = await getDocs(
      this.permissionsCollection(
        organizationId,
        groupId,
        roleId,
      ),
    );

    return snapshot.docs.map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as GroupRolePermission,
    );
  }

  async createPermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    permission: Omit<GroupRolePermission, 'id' | 'groupRoleId'>,
  ): Promise<string> {
    const reference = await addDoc(
      this.permissionsCollection(
        organizationId,
        groupId,
        roleId,
      ),
      {
        ...permission,
        groupRoleId: roleId,
      },
    );

    return reference.id;
  }

  async updatePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
    changes: Partial<Omit<GroupRolePermission, 'id' | 'groupRoleId'>>,
  ): Promise<void> {
    await updateDoc(
      this.permissionDocument(
        organizationId,
        groupId,
        roleId,
        groupRolePermissionId,
      ),
      changes,
    );
  }

  async deletePermission(
    organizationId: string,
    groupId: string,
    roleId: string,
    groupRolePermissionId: string,
  ): Promise<void> {
    await deleteDoc(
      this.permissionDocument(
        organizationId,
        groupId,
        roleId,
        groupRolePermissionId,
      ),
    );
  }
}