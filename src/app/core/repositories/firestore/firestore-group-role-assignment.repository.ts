import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { GroupRoleAssignment } from '../../models/group-role-assignment.model';
import { GroupRoleAssignmentRepository } from '../group-role-assignment.repository';

@Injectable({ providedIn: 'root' })
export class FirestoreGroupRoleAssignmentRepository
  implements GroupRoleAssignmentRepository {
  private readonly firestore = inject(Firestore);

  private assignmentsCollection(
    organizationId: string,
    groupId: string,
  ) {
    return collection(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roleAssignments',
    );
  }

  private assignmentDocument(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ) {
    return doc(
      this.firestore,
      'organizations',
      organizationId,
      'groups',
      groupId,
      'roleAssignments',
      assignmentId,
    );
  }

  async getAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<GroupRoleAssignment | null> {
    const snapshot = await getDoc(
      this.assignmentDocument(
        organizationId,
        groupId,
        assignmentId,
      ),
    );

    return snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as GroupRoleAssignment)
      : null;
  }

  async getAssignmentsForMembership(
    organizationId: string,
    groupId: string,
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]> {
    const snapshot = await getDocs(
      query(
        this.assignmentsCollection(organizationId, groupId),
        where('groupMembershipId', '==', groupMembershipId),
      ),
    );

    return snapshot.docs.map(
      (item) =>
        ({ id: item.id, ...item.data() }) as GroupRoleAssignment,
    );
  }

  async getAssignmentsForRole(
    organizationId: string,
    groupId: string,
    groupRoleId: string,
  ): Promise<GroupRoleAssignment[]> {
    const snapshot = await getDocs(
      query(
        this.assignmentsCollection(organizationId, groupId),
        where('groupRoleId', '==', groupRoleId),
      ),
    );

    return snapshot.docs.map(
      (item) =>
        ({ id: item.id, ...item.data() }) as GroupRoleAssignment,
    );
  }

  async createAssignment(
    organizationId: string,
    groupId: string,
    assignment: Omit<GroupRoleAssignment, 'id'>,
  ): Promise<string> {
    const reference = await addDoc(
      this.assignmentsCollection(organizationId, groupId),
      assignment,
    );

    return reference.id;
  }

  async updateAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
    changes: Partial<Omit<GroupRoleAssignment, 'id'>>,
  ): Promise<void> {
    await updateDoc(
      this.assignmentDocument(
        organizationId,
        groupId,
        assignmentId,
      ),
      changes,
    );
  }

  async deleteAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<void> {
    await deleteDoc(
      this.assignmentDocument(
        organizationId,
        groupId,
        assignmentId,
      ),
    );
  }
}
