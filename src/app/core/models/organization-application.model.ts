import {
  ApplicationProvisioningStrategy,
} from './application-definition.model';

export type OrganizationApplicationStatus =
  | 'available'
  | 'selected'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'deactivated'
  | 'failed';

export interface OrganizationApplication {
  /**
   * Application identifier.
   */
  applicationId: string;

  /**
   * Owning organization.
   */
  organizationId: string;

  /**
   * Current lifecycle state.
   */
  status: OrganizationApplicationStatus;

  /**
   * Provisioned application version.
   */
  version: number;

  /**
   * Provisioning strategy used.
   */
  provisioningStrategy: ApplicationProvisioningStrategy;

  /**
   * Timestamp when activation occurred.
   */
  activatedAt?: unknown;

  /**
   * User/platform actor who activated it.
   */
  activatedBy?: string;

  /**
   * Timestamp when provisioning completed.
   */
  provisionedAt?: unknown;

  /**
   * Optional application-specific configuration.
   */
  configuration?: Record<string, unknown>;

  /**
   * Last provisioning error.
   */
  provisioningError?: string;

  /**
   * Last lifecycle update.
   */
  updatedAt?: unknown;
}