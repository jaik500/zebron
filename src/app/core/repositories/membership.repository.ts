import {
  OrganizationMembership,
} from '../models/organization-membership.model';

export interface MembershipRepository {

  getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null>;

  getMembershipsForUser(
    userId: string,
  ): Promise<OrganizationMembership[]>;

  getMembershipsForOrganization(
    organizationId: string,
  ): Promise<OrganizationMembership[]>;

  getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null>;

  createMembership(
    membership: Omit<
      OrganizationMembership,
      'id'
    >,
  ): Promise<string>;

  updateMembership(
    membershipId: string,
    changes: Partial<
      Omit<
        OrganizationMembership,
        'id'
      >
    >,
  ): Promise<void>;

  deleteMembership(
    membershipId: string,
  ): Promise<void>;
}