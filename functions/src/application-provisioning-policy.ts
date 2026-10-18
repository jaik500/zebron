/**
 * Trusted application provisioning policies.
 *
 * These policies run exclusively in the Firebase Cloud Functions backend.
 * They must not be imported from or controlled by the browser.
 *
 * All current applications support automatic provisioning when:
 * - The application has been requested by the organization.
 * - Its entitlement exists under the organization.
 * - Its policy is enabled.
 * - Its required dependencies are active for that organization.
 *
 * Application-specific onboarding remains separate from core
 * organization onboarding.
 */

export type ApplicationProvisioningStrategy =
  | "none"
  | "default"
  | "custom";

export interface ApplicationProvisioningPolicy {
  applicationId: string;
  provisioningStrategy: ApplicationProvisioningStrategy;
  autoProvision: boolean;
  enabled: boolean;
  dependencies: readonly string[];
}

/**
 * The backend's trusted application provisioning catalog.
 *
 * Policy responsibilities:
 *
 * - enabled:
 *   Whether the application is available for provisioning.
 *
 * - autoProvision:
 *   Whether the application is automatically processed after
 *   core organization onboarding completes.
 *
 * - provisioningStrategy:
 *   How the application is initialized.
 *
 * - dependencies:
 *   Applications that must already be active for this organization
 *   before the application can be provisioned.
 *
 * IMPORTANT:
 *
 * Automatic provisioning does not grant an organization access
 * to every application in this catalog.
 *
 * Only existing, tenant-scoped application entitlements are processed.
 *
 * Application-specific setup workflows are separate from this policy.
 */
export const APPLICATION_PROVISIONING_POLICIES = {
  /**
   * Foundational organization application.
   */
  core: {
    applicationId: "core",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: [],
  },

  /**
   * Community application.
   */
  community: {
    applicationId: "community",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Test Center application.
   *
   * Uses the shared provisioning lifecycle.
   * Test Center program, course, topic, and question setup
   * remains application-specific.
   */
  "test-center": {
    applicationId: "test-center",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Knowledge application.
   */
  knowledge: {
    applicationId: "knowledge",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Configuration application.
   */
  configuration: {
    applicationId: "configuration",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Business Operations application.
   *
   * Uses the shared provisioning lifecycle.
   */
  "business-operations": {
    applicationId: "business-operations",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Cyber Range application.
   *
   * Automatically processed when requested, subject to its
   * dependencies being active for the same organization.
   */
  "cyber-range": {
    applicationId: "cyber-range",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: [
      "core",
      "test-center",
      "knowledge",
    ],
  },

  /**
   * Resources application.
   */
  resources: {
    applicationId: "resources",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Jobs and Training application.
   */
  "jobs-training": {
    applicationId: "jobs-training",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Tax Pay Calculator application.
   */
  "tax-pay": {
    applicationId: "tax-pay",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Content application.
   */
  content: {
    applicationId: "content",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

  /**
   * Mailbox application.
   */
  mailbox: {
    applicationId: "mailbox",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },
} as const satisfies Record<
  string,
  ApplicationProvisioningPolicy
>;

/**
 * Resolve an application's trusted provisioning policy.
 *
 * Returns undefined when an application is not registered.
 */
export function getApplicationProvisioningPolicy(
  applicationId: string,
): ApplicationProvisioningPolicy | undefined {
  return APPLICATION_PROVISIONING_POLICIES[
    applicationId as keyof typeof APPLICATION_PROVISIONING_POLICIES
  ];
}