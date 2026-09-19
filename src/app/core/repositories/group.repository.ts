import { Group } from '../models/group.model';

export interface GroupRepository {
  getGroup(
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
    groupId: string,
    changes: Partial<Omit<Group, 'id'>>,
  ): Promise<void>;

  deleteGroup(
    groupId: string,
  ): Promise<void>;
}