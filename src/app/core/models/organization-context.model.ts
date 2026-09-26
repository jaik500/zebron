import { Organization } from './organization.model';

/**
 * Represents the organization currently selected in the application context.
 *
 * This model is intentionally separate from Organization so the application
 * can distinguish between:
 * - the complete organization record
 * - the organization currently being used as the tenant context
 */
export interface OrganizationContext {
  /**
   * Organization identifier used to scope tenant-owned data.
   */
  organizationId: string;

  /**
   * Display name of the current organization.
   */
  organizationName: string;

  /**
   * The complete organization record, when available.
   */
  organization: Organization;

  /**
   * Whether the current organization is active.
   */
  active: boolean;
}
