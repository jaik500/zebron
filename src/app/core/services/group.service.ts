import { Injectable, inject } from '@angular/core';

import { Group } from '../models/group.model';
import { GroupRepository } from '../repositories/group.repository';
import { FirestoreGroupRepository } from '../repositories/firestore/firestore-group.repository';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly repository: GroupRepository =
    inject(FirestoreGroupRepository);

  async getGroup(
    organizationId: string,
    groupId: string,
  ): Promise<Group | null> {
    return this.repository.getGroup(organizationId, groupId);
  }

  async getGroupsForOrganization(
    organizationId: string,
  ): Promise<Group[]> {
    return this.repository.getGroupsForOrganization(organizationId);
  }

  async getGroupBySlug(
    organizationId: string,
    slug: string,
  ): Promise<Group | null> {
    return this.repository.getGroupBySlug(organizationId, slug);
  }

  async createGroup(group: Omit<Group, 'id'>): Promise<string> {
    return this.repository.createGroup(group);
  }

  async updateGroup(
    organizationId: string,
    groupId: string,
    changes: Partial<Omit<Group, 'id' | 'organizationId'>>,
  ): Promise<void> {
    return this.repository.updateGroup(
      organizationId,
      groupId,
      changes,
    );
  }

  async deleteGroup(
    organizationId: string,
    groupId: string,
  ): Promise<void> {
    return this.repository.deleteGroup(organizationId, groupId);
  }
}
