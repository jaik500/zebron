import { InjectionToken } from '@angular/core';

import { GroupMembership } from '../models/group-membership.model';

export interface GroupMembershipRepository {
  getMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<GroupMembership | null>;

  getMembershipsForGroup(
    organizationId: string,
    groupId: string,
  ): Promise<GroupMembership[]>;

  getMembershipsForUser(
    organizationId: string,
    userId: string,
  ): Promise<GroupMembership[]>;

  getMembershipForUserAndGroup(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<GroupMembership | null>;

  createMembership(
    organizationId: string,
    groupId: string,
    membership: Omit<
      GroupMembership,
      'id' | 'groupId'
    >,
  ): Promise<string>;

  updateMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
    changes: Partial<
      Omit<
        GroupMembership,
        'id' | 'groupId' | 'userId'
      >
    >,
  ): Promise<void>;

  deleteMembership(
    organizationId: string,
    groupId: string,
    membershipId: string,
  ): Promise<void>;
}

export const GROUP_MEMBERSHIP_REPOSITORY =
  new InjectionToken<GroupMembershipRepository>(
    'GroupMembershipRepository',
  );