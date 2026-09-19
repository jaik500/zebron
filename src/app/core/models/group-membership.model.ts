export interface GroupMembership {
  id: string;

  groupId: string;
  userId: string;

  active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
