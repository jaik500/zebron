import { Timestamp } from 'firebase/firestore';

/**
 * Compliance requirement category.
 */
export type BusinessComplianceCategory =
  | 'statutory'
  | 'tax'
  | 'license'
  | 'permit'
  | 'employment'
  | 'insurance'
  | 'governance'
  | 'other';

/**
 * Jurisdiction where the requirement applies.
 */
export type BusinessComplianceJurisdiction =
  | 'federal'
  | 'state'
  | 'county'
  | 'city'
  | 'other';

/**
 * Compliance tracking status.
 */
export type BusinessComplianceStatus =
  | 'current'
  | 'upcoming'
  | 'action_required'
  | 'overdue'
  | 'expired'
  | 'not_applicable';

/**
 * Represents a compliance obligation being tracked
 * by the Zebron administrator.
 *
 * This is a tracking record and not a legal-advice engine.
 */
export interface BusinessComplianceRequirement {
  id: string;

  businessId: string;

  name: string;

  category: BusinessComplianceCategory;

  jurisdiction: BusinessComplianceJurisdiction;

  authority?: string;

  dueDate?: Timestamp;

  renewalDate?: Timestamp;

  status: BusinessComplianceStatus;

  notes?: string;

  /**
   * Optional supporting document.
   */
  documentId?: string;

  /**
   * Date the requirement was completed/filed.
   */
  completedDate?: Timestamp;

  createdAt: Timestamp;

  updatedAt: Timestamp;

  automaticMonitoring?: boolean;
}