import { OrganizationMembership } from '../../models/organization-membership.model';

export abstract class OrganizationMembershipRepository {
  abstract getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null>;

  abstract getMembershipsForUser(
    userId: string,
  ): Promise<OrganizationMembership[]>;

  abstract getMembershipsForOrganization(
    organizationId: string,
  ): Promise<OrganizationMembership[]>;

  abstract getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null>;

  abstract createMembership(
    membership: Omit<OrganizationMembership, 'id'>,
  ): Promise<string>;

  abstract updateMembership(
    membershipId: string,
    changes: Partial<
      Omit<OrganizationMembership, 'id'>
    >,
  ): Promise<void>;

  abstract deleteMembership(
    membershipId: string,
  ): Promise<void>;
}