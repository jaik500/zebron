import type {
  OrganizationMembership as CoreOrganizationMembership,
  OrganizationMembershipRole,
} from '../../../core/models/organization-membership.model';

export type { OrganizationMembershipRole };

export interface OrganizationMembership
  extends CoreOrganizationMembership {
  /**
   * Denormalized user information.
   *
   * These fields allow the Partner Portal to search and display
   * organization members without querying the protected users
   * collection.
   */
  displayName?: string;
  email?: string;

  /**
   * Optional metadata for the organization directory.
   */
  title?: string;
  phoneNumber?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
}