import { Timestamp } from 'firebase/firestore';

/**
 * Lifecycle of a request to create a new
 * Zebron organization.
 *
 * This is NOT the same thing as OrganizationApplication.
 *
 * OrganizationApplication:
 *   tenant application entitlement
 *
 * OrganizationApplicationRequest:
 *   request to create/provision a tenant
 */
export type OrganizationApplicationRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'provisioning'
  | 'onboarding'
  | 'active'
  | 'cancelled';

export interface OrganizationApplicationRequest {
  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * Zebron user submitting the request.
   */
  applicantUserId: string;

  // ============================================================
  // ORGANIZATION INFORMATION
  // ============================================================

  organizationName: string;

  organizationSlug?: string;

  organizationType?: string;

  companyNumber?: string;

  website?: string;

  description?: string;

  // ============================================================
  // PRIMARY CONTACT
  // ============================================================

  contactName: string;

  contactEmail: string;

  contactPhone?: string;

  // ============================================================
  // LOCATION
  // ============================================================

  country?: string;

  state?: string;

  city?: string;

  // ============================================================
  // REQUESTED PLATFORM APPLICATIONS
  // ============================================================

  /**
   * Application keys selected by the applicant.
   *
   * These are requests only.
   *
   * They do not directly activate applications.
   */
  requestedApplications: string[];

  // ============================================================
  // LIFECYCLE
  // ============================================================

  status: OrganizationApplicationRequestStatus;

  submittedAt?: Timestamp;

  reviewedAt?: Timestamp;

  reviewedBy?: string;

  rejectionReason?: string;

  approvedAt?: Timestamp;

  /**
   * Populated after trusted provisioning creates
   * the organization.
   */
  organizationId?: string;

  // ============================================================
  // AUDIT / TIMESTAMPS
  // ============================================================

  createdAt: Timestamp;

  updatedAt: Timestamp;
}