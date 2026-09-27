import { Group } from '../models/group.model';

export interface GroupRepository {
  getGroup(
    organizationId: string,
    groupId: string,
  ): Promise<Group | null>;

  getGroupsForOrganization(
    organizationId: string,
  ): Promise<Group[]>;

  getGroupBySlug(
    organizationId: string,
    slug: string,
  ): Promise<Group | null>;

  createGroup(
    group: Omit<Group, 'id'>,
  ): Promise<string>;

  updateGroup(
    organizationId: string,
    groupId: string,
    changes: Partial<Omit<Group, 'id' | 'organizationId'>>,
  ): Promise<void>;

  deleteGroup(
    organizationId: string,
    groupId: string,
  ): Promise<void>;
}
