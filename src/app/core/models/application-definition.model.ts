import { Permission } from "./permission.model";

export type ApplicationCategory =
  | 'platform'
  | 'content'
  | 'community'
  | 'learning'
  | 'workforce'
  | 'business'
  | 'security'
  | 'utility';

export type ApplicationAvailability =
  | 'available'
  | 'coming_soon'
  | 'internal'
  | 'deprecated';

export type ApplicationProvisioningStrategy =
  | 'none'
  | 'default'
  | 'custom';

export interface ApplicationDefinition {
  /**
   * Stable application identifier.
   *
   * Examples:
   * - community
   * - test-center
   * - cyber-range
   */
  id: string;

  /**
   * Stable application key used throughout Zebron.
   */
  key: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Application description.
   */
  description: string;

  /**
   * Administrative category.
   */
  category: ApplicationCategory;

  /**
   * Application icon.
   */
  icon?: string;

  /**
   * Primary application route.
   */
  route: string;

  /**
   * Whether the application is currently available
   * in the platform catalog.
   */
  availability: ApplicationAvailability;

  /**
   * Whether the application requires an organization
   * context to operate.
   */
  requiresOrganization: boolean;

  /**
   * Whether an organization must request approval
   * before the application can be activated.
   */
  requiresApproval: boolean;

  /**
   * Whether the application can be automatically
   * provisioned after activation.
   */
  autoProvision: boolean;

  /**
   * Provisioning implementation.
   */
  provisioningStrategy: ApplicationProvisioningStrategy;

  /**
   * Other Zebron applications required by this application.
   */
  dependencies: string[];

  /**
   * Permissions used by the application.
   */
  permissions: Permission[];

  /**
   * Optional feature keys associated with the application.
   */
  features: string[];

  /**
   * Implementation manifest key.
   *
   * This connects the application catalog to the
   * existing implementation/readiness architecture.
   */
  implementationKey?: string;

  /**
   * Current application definition version.
   */
  version: number;

  /**
   * Whether this definition is enabled.
   */
  enabled: boolean;
}