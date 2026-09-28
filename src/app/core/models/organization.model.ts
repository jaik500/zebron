import { Timestamp } from 'firebase/firestore';

/**
 * Organization lifecycle.
 *
 * pending:
 *   Organization record exists but has not entered provisioning.
 *
 * provisioning:
 *   Trusted backend is creating the tenant's required records.
 *
 * onboarding:
 *   Tenant has been provisioned and the owner is completing setup.
 *
 * active:
 *   Tenant has completed onboarding and can operate normally.
 *
 * suspended:
 *   Tenant exists but normal tenant operations are temporarily disabled.
 *
 * archived:
 *   Tenant is permanently inactive but its data is retained.
 */
export type OrganizationStatus =
  | 'pending'
  | 'provisioning'
  | 'onboarding'
  | 'active'
  | 'suspended'
  | 'archived';

export interface Organization {
  id: string;
  name: string;

  /**
   * Official business or registration number.
   */
  companyNumber?: string;

  /**
   * Normalized organization name used for
   * case-insensitive matching.
   */
  normalizedName?: string;

  slug: string;

  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  locationId?: string;

  /**
   * New organization lifecycle state.
   */
  status?: OrganizationStatus;

  /**
   * Initial organization owner.
   *
   * This is intentionally separate from the
   * platform administrator role.
   */
  ownerUserId?: string;

  /**
   * Platform approval timestamp.
   */
  approvedAt?: Timestamp;

  /**
   * Timestamp when the organization became active.
   */
  activatedAt?: Timestamp;

  /**
   * Existing fields retained for backward compatibility.
   *
   * New onboarding logic should use `status`.
   */
  verified: boolean;
  active: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}