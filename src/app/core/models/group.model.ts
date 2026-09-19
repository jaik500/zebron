export interface Group {
  id: string;

  /**
   * Organization that owns this group.
   * Groups are always tenant-scoped.
   */
  organizationId: string;

  /**
   * Human-readable group name.
   * Example: "Instructors", "Finance", "Students".
   */
  name: string;

  /**
   * URL/query-friendly identifier.
   * Example: "instructors", "finance", "students".
   */
  slug: string;

  /**
   * Optional description of the group's purpose.
   */
  description?: string;

  /**
   * Controls whether the group is currently usable.
   */
  active: boolean;

  /**
   * Indicates whether this is a system-defined group.
   *
   * System groups should not be freely deleted or renamed
   * by normal organization administrators.
   */
  systemManaged: boolean;

  /**
   * Optional group metadata for future extensibility.
   *
   * Keep this provider-neutral. Do not put Firebase-specific
   * types here.
   */
  metadata?: Record<string, string>;

  createdAt?: Date;
  updatedAt?: Date;
}
