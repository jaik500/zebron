import { GroupRoleAssignment } from '../models/group-role-assignment.model';

export interface GroupRoleAssignmentRepository {
  getAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<GroupRoleAssignment | null>;

  getAssignmentsForMembership(
    organizationId: string,
    groupId: string,
    groupMembershipId: string,
  ): Promise<GroupRoleAssignment[]>;

  getAssignmentsForRole(
    organizationId: string,
    groupId: string,
    groupRoleId: string,
  ): Promise<GroupRoleAssignment[]>;

  createAssignment(
    organizationId: string,
    groupId: string,
    assignment: Omit<GroupRoleAssignment, 'id'>,
  ): Promise<string>;

  updateAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
    changes: Partial<Omit<GroupRoleAssignment, 'id'>>,
  ): Promise<void>;

  deleteAssignment(
    organizationId: string,
    groupId: string,
    assignmentId: string,
  ): Promise<void>;
}
