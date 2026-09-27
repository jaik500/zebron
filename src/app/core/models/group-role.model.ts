export interface GroupRole {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  active: boolean;
  systemManaged: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}