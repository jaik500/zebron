export interface GroupRole {
  id: string;

  /**
   * Group this role belongs to.
   */
  groupId: string;

  /**
   * Role name.
   * Example: "Instructor", "Content Editor".
   */
  name: string;

  /**
   * Optional description.
   */
  description?: string;

  /**
   * Controls whether the role is active.
   */
  active: boolean;

  /**
   * System-managed roles should not be freely
   * deleted or modified by organization admins.
   */
  systemManaged: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}