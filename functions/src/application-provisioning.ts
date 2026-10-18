import {
  FieldValue,
  type Firestore,
} from "firebase-admin/firestore";

import {
  getApplicationProvisioningPolicy,
  type ApplicationProvisioningPolicy,
  type ApplicationProvisioningStrategy,
} from "./application-provisioning-policy";

import * as logger from "firebase-functions/logger";

/**
 * Application entitlement lifecycle.
 */
type OrganizationApplicationStatus =
  | "available"
  | "selected"
  | "provisioning"
  | "active"
  | "suspended"
  | "deactivated"
  | "failed";

/**
 * Supported provisioning execution modes.
 *
 * automatic:
 *   Processes applications whose trusted policy enables autoProvision.
 *
 * requested:
 *   Processes an explicitly requested application, subject to its
 *   trusted provisioning policy.
 */
export type ApplicationProvisioningMode =
  | "automatic"
  | "requested";

/**
 * A tenant-scoped application entitlement.
 */
interface OrganizationApplication {
  applicationId: string;
  organizationId: string;
  status: OrganizationApplicationStatus;
  version: number;
  provisioningStrategy: ApplicationProvisioningStrategy;
  activatedAt?: unknown;
  activatedBy?: string | null;
  provisionedAt?: unknown;
  configuration?: Record<string, unknown>;
  provisioningError?: string | null;
  updatedAt?: unknown;
}

/**
 * Result for one application.
 */
export interface ApplicationProvisioningResult {
  applicationId: string;
  status:
    | "active"
    | "blocked"
    | "skipped"
    | "failed";
  reason?: string;
}

/**
 * Context supplied to an application-specific provisioning handler.
 */
export interface ApplicationProvisioningContext {
  db: Firestore;
  organizationId: string;
  applicationId: string;
  actorUid: string;
  entitlement: OrganizationApplication;
  entitlementRef: FirebaseFirestore.DocumentReference;
  policy: ApplicationProvisioningPolicy;
}

/**
 * A custom provisioning handler initializes application-specific
 * configuration before the shared framework activates the entitlement.
 *
 * A handler must not activate the entitlement itself. The shared
 * framework owns the lifecycle transition and activation timestamps.
 */
export type CustomApplicationProvisioner = (
  context: ApplicationProvisioningContext,
) => Promise<Record<string, unknown>>;

/**
 * Registered custom provisioning implementations.
 *
 * Add application-specific initialization here when an application
 * genuinely requires custom provisioning behavior.
 *
 * Do not register an empty handler merely to make an application active.
 */
const CUSTOM_APPLICATION_PROVISIONERS: Readonly<
  Record<string, CustomApplicationProvisioner>
> = {};

/**
 * Resolve the custom handler for an application.
 */
function getCustomProvisioner(
  applicationId: string,
): CustomApplicationProvisioner | undefined {
  return CUSTOM_APPLICATION_PROVISIONERS[applicationId];
}

/**
 * Check whether an application can be automatically provisioned.
 */
function canAutomaticallyProvision(
  policy: ApplicationProvisioningPolicy,
): boolean {
  return (
    policy.enabled &&
    policy.autoProvision &&
    policy.provisioningStrategy !== "none"
  );
}

/**
 * Determine whether an entitlement may be provisioned.
 */
function isProvisionableStatus(
  status: OrganizationApplicationStatus,
): boolean {
  return (
    status === "selected" ||
    status === "failed"
  );
}

/**
 * Initialize application configuration using the registered strategy.
 *
 * Default:
 *   Preserves existing configuration.
 *
 * Custom:
 *   Requires a registered custom provisioning handler.
 *
 * None:
 *   Cannot be provisioned.
 */
async function initializeApplication(
  context: ApplicationProvisioningContext,
): Promise<Record<string, unknown>> {
  const {
    policy,
    entitlement,
  } = context;

  switch (policy.provisioningStrategy) {
    case "default":
      return {
        ...(entitlement.configuration ?? {}),
      };

    case "custom": {
      const provisioner = getCustomProvisioner(
        policy.applicationId,
      );

      if (!provisioner) {
        throw new Error(
          `No custom provisioning handler is registered for application "${policy.applicationId}".`,
        );
      }

      return provisioner(context);
    }

    case "none":
      throw new Error(
        `Application "${policy.applicationId}" does not support provisioning.`,
      );

    default: {
      const unsupportedStrategy: never =
        policy.provisioningStrategy;

      throw new Error(
        `Unsupported provisioning strategy: ${unsupportedStrategy}`,
      );
    }
  }
}

/**
 * Transition a selected or failed entitlement into provisioning.
 *
 * This transaction prevents concurrent invocations from claiming an
 * entitlement that is already being provisioned or has become active.
 */
async function claimApplicationForProvisioning(
  context: ApplicationProvisioningContext,
): Promise<OrganizationApplication | undefined> {
  return context.db.runTransaction(
    async (transaction) => {
      const snapshot = await transaction.get(
        context.entitlementRef,
      );

      if (!snapshot.exists) {
        return undefined;
      }

      const current = snapshot.data() as
        | OrganizationApplication
        | undefined;

      if (!current) {
        return undefined;
      }

      if (!isProvisionableStatus(current.status)) {
        return undefined;
      }

      transaction.update(
        context.entitlementRef,
        {
          status: "provisioning",
          provisioningError: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
      );

      return {
        ...current,
        status: "provisioning",
      };
    },
  );
}

/**
 * Mark a successfully initialized entitlement active.
 *
 * The transaction checks the current lifecycle state so that an
 * application suspended or deactivated during initialization cannot
 * accidentally be reactivated.
 */
async function activateApplication(
  context: ApplicationProvisioningContext,
  configuration: Record<string, unknown>,
): Promise<boolean> {
  return context.db.runTransaction(
    async (transaction) => {
      const snapshot = await transaction.get(
        context.entitlementRef,
      );

      if (!snapshot.exists) {
        return false;
      }

      const current = snapshot.data() as
        | OrganizationApplication
        | undefined;

      if (
        !current ||
        current.status !== "provisioning"
      ) {
        return false;
      }

      transaction.update(
        context.entitlementRef,
        {
          status: "active",
          configuration,
          activatedAt: FieldValue.serverTimestamp(),
          activatedBy: context.actorUid,
          provisionedAt: FieldValue.serverTimestamp(),
          provisioningError: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
      );

      return true;
    },
  );
}

/**
 * Record a provisioning failure without activating the application.
 */
async function recordProvisioningFailure(
  context: ApplicationProvisioningContext,
  error: unknown,
): Promise<void> {
  const message =
    error instanceof Error
      ? error.message
      : "An unknown provisioning error occurred.";

  await context.db.runTransaction(
    async (transaction) => {
      const snapshot = await transaction.get(
        context.entitlementRef,
      );

      if (!snapshot.exists) {
        return;
      }

      const current = snapshot.data() as
        | OrganizationApplication
        | undefined;

      /*
       * Only the provisioning execution that still owns this
       * lifecycle state may record its failure.
       */
      if (
        !current ||
        current.status !== "provisioning"
      ) {
        return;
      }

      transaction.update(
        context.entitlementRef,
        {
          status: "failed",
          provisioningError: message.slice(0, 1000),
          updatedAt: FieldValue.serverTimestamp(),
        },
      );
    },
  );
}

/**
 * Require every trusted policy dependency to be active for this same
 * organization before provisioning an application. A dependency from
 * another organization can never satisfy this check.
 */
async function getDependencyBlockReason(
  db: Firestore,
  organizationId: string,
  policy: ApplicationProvisioningPolicy,
): Promise<string | undefined> {
  const applicationsRef = db
    .collection("organizations")
    .doc(organizationId)
    .collection("applications");

  for (const dependencyId of policy.dependencies) {
    const dependencySnapshot = await applicationsRef
      .doc(dependencyId)
      .get();

    if (!dependencySnapshot.exists) {
      return `Required dependency \"${dependencyId}\" is missing from this organization.`;
    }

    const dependency = dependencySnapshot.data() as
      | { status?: unknown }
      | undefined;

    if (dependency?.status !== "active") {
      const currentStatus =
        typeof dependency?.status === "string"
          ? dependency.status
          : "unknown";

      return `Required dependency \"${dependencyId}\" is not active (current status: ${currentStatus}).`;
    }
  }

  return undefined;
}

/**
 * Calculate policy dependency depth so foundational applications are
 * attempted before their dependents during a provisioning pass.
 * The visiting set prevents malformed cyclic policy data from recursing
 * indefinitely; actual dependency activation is still enforced separately.
 */
function getApplicationDependencyDepth(
  applicationId: string,
  visiting: ReadonlySet<string> = new Set<string>(),
): number {
  if (visiting.has(applicationId)) {
    return 0;
  }

  const policy = getApplicationProvisioningPolicy(applicationId);

  if (!policy || policy.dependencies.length === 0) {
    return 0;
  }

  const nextVisiting = new Set(visiting);
  nextVisiting.add(applicationId);

  return 1 + Math.max(
    ...policy.dependencies.map((dependencyId) =>
      getApplicationDependencyDepth(dependencyId, nextVisiting),
    ),
  );
}

/**
 * Provision one organization application using the shared lifecycle.
 *
 * This function never creates an entitlement. The entitlement must
 * already exist under organizations/{organizationId}/applications.
 */
async function provisionOneApplication(
  db: Firestore,
  organizationId: string,
  applicationId: string,
  actorUid: string,
): Promise<ApplicationProvisioningResult> {
  const policy =
    getApplicationProvisioningPolicy(applicationId);

  if (!policy) {
    return {
      applicationId,
      status: "failed",
      reason: "Application is not registered.",
    };
  }

  if (!policy.enabled) {
    return {
      applicationId,
      status: "skipped",
      reason: "Application is disabled.",
    };
  }

  if (policy.provisioningStrategy === "none") {
    return {
      applicationId,
      status: "skipped",
      reason: "Application does not support provisioning.",
    };
  }

  const organizationRef = db
    .collection("organizations")
    .doc(organizationId);

  const entitlementRef = organizationRef
    .collection("applications")
    .doc(applicationId);

  const initialSnapshot = await entitlementRef.get();

  if (!initialSnapshot.exists) {
    return {
      applicationId,
      status: "skipped",
      reason: "The organization has not requested this application.",
    };
  }

  const initialEntitlement =
    initialSnapshot.data() as OrganizationApplication;

  /*
   * The policy is authoritative. Never trust the strategy stored
   * in an entitlement document to override the backend policy.
   */
  if (
    initialEntitlement.provisioningStrategy !==
    policy.provisioningStrategy
  ) {
    logger.warn(
      "Application entitlement strategy differs from trusted policy.",
      {
        organizationId,
        applicationId,
        entitlementStrategy:
          initialEntitlement.provisioningStrategy,
        trustedStrategy:
          policy.provisioningStrategy,
      },
    );
  }

  if (initialEntitlement.status === "active") {
    return {
      applicationId,
      status: "active",
      reason: "Application is already active.",
    };
  }

  const dependencyBlockReason = await getDependencyBlockReason(
    db,
    organizationId,
    policy,
  );

  if (dependencyBlockReason) {
    return {
      applicationId,
      status: "blocked",
      reason: dependencyBlockReason,
    };
  }

  const context: ApplicationProvisioningContext = {
    db,
    organizationId,
    applicationId,
    actorUid,
    entitlement: initialEntitlement,
    entitlementRef,
    policy,
  };

  const claimedEntitlement =
    await claimApplicationForProvisioning(context);

  if (!claimedEntitlement) {
    return {
      applicationId,
      status: "skipped",
      reason:
        "Application is not eligible for a new provisioning attempt.",
    };
  }

  context.entitlement = claimedEntitlement;

  try {
    const configuration =
      await initializeApplication(context);

    const activated =
      await activateApplication(
        context,
        configuration,
      );

    if (!activated) {
      return {
        applicationId,
        status: "skipped",
        reason:
          "The entitlement changed state before activation.",
      };
    }

    logger.info(
      "Organization application provisioned.",
      {
        organizationId,
        applicationId,
        strategy: policy.provisioningStrategy,
        actorUid,
      },
    );

    return {
      applicationId,
      status: "active",
    };
  } catch (error) {
    await recordProvisioningFailure(
      context,
      error,
    );

    logger.error(
      "Organization application provisioning failed.",
      {
        organizationId,
        applicationId,
        strategy: policy.provisioningStrategy,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    return {
      applicationId,
      status: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "An unknown provisioning error occurred.",
    };
  }
}

/**
 * Provision applications belonging to an organization.
 *
 * automatic:
 *   Processes only applications whose trusted policy enables automatic
 *   provisioning. Community is eligible when requested.
 *
 * requested:
 *   Attempts provisioning for the specified application IDs, provided
 *   each application is registered, enabled, and supports provisioning.
 *
 * Repeated calls do not regress active entitlements. Failed applications
 * can be retried by invoking requested mode again. Dependencies are checked
 * within the same organization, and eligible foundational applications are
 * attempted before dependent applications. Applications whose dependencies
 * are not active are reported as blocked and are not claimed or mutated.
 */
export async function provisionOrganizationApplications(
  db: Firestore,
  organizationId: string,
  actorUid: string,
  options: {
    mode: ApplicationProvisioningMode;
    applicationIds?: readonly string[];
  },
): Promise<ApplicationProvisioningResult[]> {
  const organizationRef = db
    .collection("organizations")
    .doc(organizationId);

  const organizationSnapshot =
    await organizationRef.get();

  if (!organizationSnapshot.exists) {
    throw new Error(
      `Organization "${organizationId}" does not exist.`,
    );
  }

  const applicationsSnapshot =
    await organizationRef
      .collection("applications")
      .get();

  const requestedIds =
    options.applicationIds
      ? new Set(options.applicationIds)
      : undefined;

  const results: ApplicationProvisioningResult[] = [];

  const orderedDocuments = [...applicationsSnapshot.docs].sort(
    (left, right) => {
      const depthDifference =
        getApplicationDependencyDepth(left.id) -
        getApplicationDependencyDepth(right.id);

      return depthDifference !== 0
        ? depthDifference
        : left.id.localeCompare(right.id);
    },
  );

  for (const document of orderedDocuments) {
    const applicationId = document.id;

    const policy =
      getApplicationProvisioningPolicy(applicationId);

    if (!policy) {
      results.push({
        applicationId,
        status: "skipped",
        reason: "Application is not registered.",
      });

      continue;
    }

    if (
      options.mode === "automatic" &&
      !canAutomaticallyProvision(policy)
    ) {
      results.push({
        applicationId,
        status: "skipped",
        reason:
          "Application policy does not allow automatic provisioning.",
      });

      continue;
    }

    if (
      options.mode === "requested" &&
      (!requestedIds ||
        !requestedIds.has(applicationId))
    ) {
      continue;
    }

    const result =
      await provisionOneApplication(
        db,
        organizationId,
        applicationId,
        actorUid,
      );

    results.push(result);
  }

  return results;
}