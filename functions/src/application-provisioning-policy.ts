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
   * Courses: a Learning capability. Course final exams run on Test
   * Center quizzes, so Test Center must be active first.
   */
  courses: {
    applicationId: "courses",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core", "test-center"],
  },

  /**
   * Knowledge application.
   */
  // On demand: organizations get the blog only after requesting it.
  blog: {
    applicationId: "blog",
    provisioningStrategy: "default",
    autoProvision: true,
    enabled: true,
    dependencies: ["core"],
  },

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
   * Mailbox application (on demand: only organizations that request it).
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

/**
 * Learning is the parent application for Courses and Test Center. It has
 * no entitlement of its own: it counts as active while either capability
 * is active. Requesting it, or Courses, also requests what it needs.
 *
 * - learning    -> test-center, courses
 * - courses     -> test-center, courses
 * - test-center -> test-center only
 */
export const APPLICATION_BUNDLES: Readonly<Record<string, readonly string[]>> = {
  learning: ["test-center", "courses"],
  courses: ["test-center", "courses"],
};

/** Application ids a request for this id provisions, dependencies first. */
export function expandApplicationRequest(
  applicationId: string,
): string[] {
  return [...(APPLICATION_BUNDLES[applicationId] ?? [applicationId])];
}

/** Whether an id can be requested: a provisioning policy or a bundle. */
export function isRequestableApplication(
  applicationId: string,
): boolean {
  return applicationId in APPLICATION_PROVISIONING_POLICIES
    || applicationId in APPLICATION_BUNDLES;
}
