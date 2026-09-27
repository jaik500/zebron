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

import { GroupRole } from '../../models/group-role.model';
import { GroupRoleRepository } from '../group-role.repository';

@Injectable({ providedIn: 'root' })
export class FirestoreGroupRoleRepository implements GroupRoleRepository {
  private readonly firestore = inject(Firestore);

  private rolesCollection(
    organizationId: string,
    groupId: string,
  ) {
    return collection(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roles',
    );
  }

  private roleDocument(
    organizationId: string,
    groupId: string,
    roleId: string,
  ) {
    return doc(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roles',
      roleId,
    );
  }

  async getRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupRole | null> {
    const snapshot = await getDoc(
      this.roleDocument(organizationId, groupId, roleId),
    );

    return snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as GroupRole)
      : null;
  }

  async getRolesForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupRole[]> {
    const snapshot = await getDocs(
      this.rolesCollection(organizationId, groupId),
    );

    return snapshot.docs.map(
      (item) => ({ id: item.id, ...item.data() }) as GroupRole,
    );
  }

  async createRole(
    organizationId: string,
    groupId: string,
    role: Omit<GroupRole, 'id' | 'groupId'>,
  ): Promise<string> {
    const reference = await addDoc(
      this.rolesCollection(organizationId, groupId),
      { ...role, groupId },
    );

    return reference.id;
  }

  async updateRole(
    organizationId: string,
    groupId: string,
    roleId: string,
    changes: Partial<Omit<GroupRole, 'id' | 'groupId'>>,
  ): Promise<void> {
    await updateDoc(
      this.roleDocument(organizationId, groupId, roleId),
      changes,
    );
  }

  async deleteRole(
    organizationId: string,
    groupId: string,
    roleId: string,
  ): Promise<void> {
    await deleteDoc(
      this.roleDocument(organizationId, groupId, roleId),
    );
  }
}
