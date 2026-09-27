import { Injectable, inject } from '@angular/core';

import { GroupRoleAssignment } from '../models/group-role-assignment.model';
import { GroupRoleAssignmentRepository } from '../repositories/group-role-assignment.repository';
import { FirestoreGroupRoleAssignmentRepository } from '../repositories/firestore/firestore-group-role-assignment.repository';

@Injectable({ providedIn: 'root' })
export class GroupRoleAssignmentService {
  private readonly repository: GroupRoleAssignmentRepository =
    inject(FirestoreGroupRoleAssignmentRepository);

  async getAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<GroupRoleAssignment | null> {
    return this.repository.getAssignment(
      organizationId,
      groupId,
      assignmentId,
    );
  }

  async getAssignmentsForMembership(
    organizationId: string,
    groupId: string,
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]> {
    return this.repository.getAssignmentsForMembership(
      organizationId,
      groupId,
      groupMembershipId,
    );
  }

  async getAssignmentsForRole(
    organizationId: string,
    groupId: string,
    groupRoleId: string,
  ): Promise<GroupRoleAssignment[]> {
    return this.repository.getAssignmentsForRole(
      organizationId,
      groupId,
      groupRoleId,
    );
  }

  async createAssignment(
    organizationId: string,
    groupId: string,
    assignment: Omit<GroupRoleAssignment, 'id'>,
  ): Promise<string> {
    return this.repository.createAssignment(
      organizationId,
      groupId,
      assignment,
    );
  }

  async updateAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
    changes: Partial<Omit<GroupRoleAssignment, 'id'>>,
  ): Promise<void> {
    return this.repository.updateAssignment(
      organizationId,
      groupId,
      assignmentId,
      changes,
    );
  }

  async deleteAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<void> {
    return this.repository.deleteAssignment(
      organizationId,
      groupId,
      assignmentId,
    );
  }
}
