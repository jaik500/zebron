export interface GroupRoleAssignment {
  id: string;
  groupMembershipId: string;
  groupRoleId: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}