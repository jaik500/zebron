import {
  HttpsError,
  onCall,
  CallableRequest,
} from "firebase-functions/v2/https";

import * as logger from "firebase-functions/logger";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

import {
  resolveOrganizationLifecycleStatus,
  resolveOrganizationLifecycleTransition,
  type OrganizationLifecycleAction,
  type OrganizationLifecycleStatus,
  type OrganizationLifecycleState,
} from "./organization-lifecycle-policy";

import {
  getApplicationProvisioningPolicy,
} from "./application-provisioning-policy";

import {
  provisionOrganizationApplications,
} from "./application-provisioning";

import "./firebase-admin";

/**
 * Payload accepted by the lifecycle callable functions.
 */
interface OrganizationLifecycleRequest {
  organizationId: string;
  reason: string;
}

/**
 * Organization fields used by lifecycle management.
 *
 * Fields read from Firestore are intentionally typed as unknown
 * where their stored values must be validated at runtime.
 */
interface OrganizationLifecycleDocument {
  status?: unknown;
  active?: boolean;
  previousStatus?: unknown;
  preArchiveStatus?: unknown;
}

/**
 * Access the initialized Firestore instance.
 *
 * Firebase Admin must be initialized by the Cloud Functions
 * entry point before these callables execute.
 */
const db = getFirestore();

/**
 * Resolve the caller's platform administrator privileges.
 *
 * Supported authorization:
 * - platformRole === "platform-admin"
 * - Legacy role === "admin", when platformRole is absent.
 *
 * A non-admin platform role does not grant lifecycle access.
 */
async function requirePlatformAdmin(
  request: CallableRequest,
): Promise<string> {
  if (!request.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must sign in before managing organizations.",
    );
  }

  const uid = request.auth.uid;

  const profileSnapshot = await db
    .collection("users")
    .doc(uid)
    .get();

  if (!profileSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "Administrator profile could not be found.",
    );
  }

  const profile = profileSnapshot.data() ?? {};

  const hasPlatformRole =
    Object.prototype.hasOwnProperty.call(
      profile,
      "platformRole",
    );

  const isPlatformAdmin =
    profile["platformRole"] === "platform-admin" ||
    (
      !hasPlatformRole &&
      profile["role"] === "admin"
    );

  if (!isPlatformAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only platform administrators may manage organizations.",
    );
  }

  return uid;
}

/**
 * Validate a lifecycle request.
 */
function validateRequest(
  data: OrganizationLifecycleRequest | undefined,
): {
  organizationId: string;
  reason: string;
} {
  const organizationId =
    typeof data?.organizationId === "string"
      ? data.organizationId.trim()
      : "";

  const reason =
    typeof data?.reason === "string"
      ? data.reason.trim()
      : "";

  if (!organizationId) {
    throw new HttpsError(
      "invalid-argument",
      "organizationId is required.",
    );
  }

  if (!reason) {
    throw new HttpsError(
      "invalid-argument",
      "A reason is required for this lifecycle operation.",
    );
  }

  if (reason.length > 1000) {
    throw new HttpsError(
      "invalid-argument",
      "The reason must not exceed 1000 characters.",
    );
  }

  return {
    organizationId,
    reason,
  };
}

/**
 * Resolve a saved lifecycle status.
 *
 * The lifecycle policy accepts unknown values for status
 * resolution and validates explicitly supplied values.
 */
function resolveSavedStatus(
  value: unknown,
  fieldName: string,
): OrganizationLifecycleStatus {
  try {
    return resolveOrganizationLifecycleStatus(value, true);
  } catch {
    throw new HttpsError(
      "failed-precondition",
      `The saved ${fieldName} is not a supported organization lifecycle status.`,
    );
  }
}

/**
 * Resolve the current organization status.
 *
 * New records should use the status field.
 * Legacy records may have only the active boolean.
 *
 * Legacy compatibility:
 * - active === false resolves to suspended.
 * - Otherwise, a missing status resolves to active.
 */
function resolveCurrentStatus(
  organization: OrganizationLifecycleDocument,
): OrganizationLifecycleStatus {
  try {
    return resolveOrganizationLifecycleStatus(
      organization.status,
      organization.active,
    );
  } catch {
    throw new HttpsError(
      "failed-precondition",
      `Unsupported organization lifecycle status: ${String(organization.status)}.`,
    );
  }
}

/**
 * Apply a validated lifecycle transition.
 *
 * The policy module determines whether the transition is
 * allowed and calculates the resulting lifecycle status.
 *
 * Firestore transactions prevent concurrent administrators
 * from silently overwriting one another's lifecycle decisions.
 *
 * Archiving retains the organization document and its data.
 */
async function transitionOrganization(
  request: CallableRequest<OrganizationLifecycleRequest>,
  action: OrganizationLifecycleAction,
): Promise<{
  success: boolean;
  organizationId: string;
  previousStatus: OrganizationLifecycleStatus;
  status: OrganizationLifecycleStatus;
}> {
  const actorUid = await requirePlatformAdmin(request);

  const {
    organizationId,
    reason,
  } = validateRequest(request.data);

  const organizationRef = db
    .collection("organizations")
    .doc(organizationId);

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(organizationRef);

    if (!snapshot.exists) {
      throw new HttpsError(
        "not-found",
        "The requested organization does not exist.",
      );
    }

    const organization =
      snapshot.data() as OrganizationLifecycleDocument;

    const currentStatus = resolveCurrentStatus(organization);

    /**
     * Validate saved states only when the relevant action
     * requires them. Missing values retain legacy defaults.
     */
    let previousStatus: OrganizationLifecycleStatus | undefined;
    let preArchiveStatus: OrganizationLifecycleStatus | undefined;

    if (
      action === "reactivate" &&
      organization.previousStatus !== undefined
    ) {
      previousStatus = resolveSavedStatus(
        organization.previousStatus,
        "previous status",
      );
    }

    if (
      action === "restore" &&
      organization.preArchiveStatus !== undefined
    ) {
      preArchiveStatus = resolveSavedStatus(
        organization.preArchiveStatus,
        "pre-archive status",
      );
    }

    const lifecycleState: OrganizationLifecycleState = {
      status: currentStatus,
      ...(previousStatus !== undefined
        ? { previousStatus }
        : {}),
      ...(preArchiveStatus !== undefined
        ? { preArchiveStatus }
        : {}),
    };

    let transition: {
      previousStatus: OrganizationLifecycleStatus;
      status: OrganizationLifecycleStatus;
    };

    try {
      transition = resolveOrganizationLifecycleTransition(
        action,
        lifecycleState,
      );
    } catch (error) {
      /**
       * Translate policy errors into callable errors.
       * Do not expose arbitrary internal exceptions to clients.
       */
      const message =
        error instanceof Error
          ? error.message
          : "The requested lifecycle transition is not allowed.";

      throw new HttpsError(
        "failed-precondition",
        message,
      );
    }

    const nextStatus = transition.status;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lifecycleUpdatedAt: FieldValue.serverTimestamp(),
      lifecycleUpdatedBy: actorUid,
      lifecycleReason: reason,
      status: nextStatus,
    };

    switch (action) {
      /**
       * Suspend an active or onboarding organization.
       */
      case "suspend": {
        updates["previousStatus"] = currentStatus;
        updates["suspendedAt"] = FieldValue.serverTimestamp();
        updates["suspendedBy"] = actorUid;
        updates["suspensionReason"] = reason;
        updates["active"] = false;

        break;
      }

      /**
       * Reactivate a suspended organization.
       *
       * The policy restores the previous active/onboarding
       * status, defaulting legacy records to active.
       */
      case "reactivate": {
        updates["reactivatedAt"] = FieldValue.serverTimestamp();
        updates["reactivatedBy"] = actorUid;
        updates["active"] = nextStatus === "active";

        updates["previousStatus"] = FieldValue.delete();
        updates["suspensionReason"] = FieldValue.delete();

        break;
      }

      /**
       * Archive an active or onboarding organization.
       *
       * Archiving retains the organization document.
       */
      case "archive": {
        updates["preArchiveStatus"] = currentStatus;
        updates["archivedAt"] = FieldValue.serverTimestamp();
        updates["archivedBy"] = actorUid;
        updates["archiveReason"] = reason;
        updates["active"] = false;

        break;
      }

      /**
       * Restore an archived organization.
       *
       * The policy restores the saved active/onboarding
       * status, defaulting legacy records to active.
       */
      case "restore": {
        updates["restoredAt"] = FieldValue.serverTimestamp();
        updates["restoredBy"] = actorUid;
        updates["active"] = nextStatus === "active";

        updates["preArchiveStatus"] = FieldValue.delete();
        updates["archiveReason"] = FieldValue.delete();

        break;
      }
    }

    transaction.update(organizationRef, updates);

    return {
      success: true,
      organizationId,
      previousStatus: currentStatus,
      status: nextStatus,
    };
  });

  logger.info(
    "Organization lifecycle transition completed.",
    {
      organizationId,
      action,
      actorUid,
      previousStatus: result.previousStatus,
      status: result.status,
    },
  );

  return result;
}

/**
 * Temporarily suspend an organization.
 *
 * Callable name: suspendOrganization
 * Region: us-central1
 */
export const suspendOrganization = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    return transitionOrganization(request, "suspend");
  },
);

/**
 * Reactivate a suspended organization.
 *
 * Callable name: reactivateOrganization
 * Region: us-central1
 */
export const reactivateOrganization = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    return transitionOrganization(request, "reactivate");
  },
);

/**
 * Archive an organization while retaining its data.
 *
 * Callable name: archiveOrganization
 * Region: us-central1
 */
export const archiveOrganization = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    return transitionOrganization(request, "archive");
  },
);

/**
 * Restore an archived organization.
 *
 * Callable name: restoreOrganization
 * Region: us-central1
 */
export const restoreOrganization = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    return transitionOrganization(request, "restore");
  },
);

/**
 * Repair an organization application request whose status was not
 * advanced after the organization's core onboarding was completed.
 *
 * Safety constraints:
 * - Requires a platform administrator.
 * - Requires the request and its organization to exist.
 * - Requires the deterministic organization ID relationship.
 * - Requires completed core onboarding.
 * - Transitions only onboarding -> active.
 * - Does not modify organization records, onboarding records,
 *   or application entitlements.
 *
 * Callable name: repairOrganizationApplicationRequestStatus
 * Region: us-central1
 */
export const repairOrganizationApplicationRequestStatus = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const actorUid = await requirePlatformAdmin(request);

    const requestId = request.data?.requestId;

    if (
      typeof requestId !== "string" ||
      requestId.trim().length === 0 ||
      requestId !== requestId.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid application request ID is required.",
      );
    }

    const requestRef = db
      .collection("organizationApplicationRequests")
      .doc(requestId);

    const result = await db.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef);

      if (!requestSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization application request was not found.",
        );
      }

      const applicationRequest = requestSnapshot.data() ?? {};
      const organizationId = applicationRequest["organizationId"];

      if (
        typeof organizationId !== "string" ||
        organizationId !== `org_${requestId}`
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The application request does not match the expected organization ID.",
        );
      }

      const organizationRef = db
        .collection("organizations")
        .doc(organizationId);

      const onboardingRef = db
        .collection("organizationOnboarding")
        .doc(organizationId);

      const [organizationSnapshot, onboardingSnapshot] =
        await Promise.all([
          transaction.get(organizationRef),
          transaction.get(onboardingRef),
        ]);

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The associated organization does not exist.",
        );
      }

      if (!onboardingSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The organization's onboarding record does not exist.",
        );
      }

      const onboarding = onboardingSnapshot.data() ?? {};

      if (onboarding["status"] !== "completed") {
        throw new HttpsError(
          "failed-precondition",
          "The organization's core onboarding is not completed.",
        );
      }

      const currentStatus = applicationRequest["status"];

      // Safe to retry: the desired state has already been reached.
      if (currentStatus === "active") {
        return {
          success: true,
          repaired: false,
          requestId,
          organizationId,
          previousStatus: "active",
          status: "active",
        };
      }

      // Never reactivate cancelled, rejected, or unexpected requests.
      if (currentStatus !== "onboarding") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot repair an application request with status "${String(currentStatus)}".`,
        );
      }

      const now = FieldValue.serverTimestamp();

      transaction.update(requestRef, {
        status: "active",
        updatedAt: now,
      });

      return {
        success: true,
        repaired: true,
        requestId,
        organizationId,
        previousStatus: "onboarding",
        status: "active",
      };
    });

    if (result.repaired) {
      logger.info(
        "Organization application request status repaired.",
        {
          actorUid,
          requestId: result.requestId,
          organizationId: result.organizationId,
          previousStatus: result.previousStatus,
          status: result.status,
        },
      );
    } else {
      logger.info(
        "Organization application request already active; no repair needed.",
        {
          actorUid,
          requestId: result.requestId,
          organizationId: result.organizationId,
        },
      );
    }

    return result;
  },
);

/**
 * Recover application provisioning for an organization whose core
 * onboarding is already complete.
 *
 * This callable is intended for controlled administrative recovery.
 *
 * Safety constraints:
 * - Requires platform-administrator authorization.
 * - Requires the deterministic request-to-organization relationship.
 * - Requires completed core onboarding.
 * - Requires an active application request.
 * - Requires Community to appear in the request's requestedApplications.
 * - Creates the foundational core entitlement only if it is missing.
 * - Uses the trusted backend provisioning policies.
 * - Provisions only core and community.
 * - Does not modify unrelated application entitlements.
 *
 * Callable name: repairOrganizationApplicationProvisioning
 * Region: us-central1
 */
export const repairOrganizationApplicationProvisioning = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const actorUid = await requirePlatformAdmin(request);

    const requestId = request.data?.requestId;

    if (
      typeof requestId !== "string" ||
      requestId.trim().length === 0 ||
      requestId !== requestId.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid application request ID is required.",
      );
    }

    const organizationId = `org_${requestId}`;

    const requestRef = db
      .collection("organizationApplicationRequests")
      .doc(requestId);

    const organizationRef = db
      .collection("organizations")
      .doc(organizationId);

    const onboardingRef = db
      .collection("organizationOnboarding")
      .doc(organizationId);

    const applicationsRef = organizationRef
      .collection("applications");

    const coreRef = applicationsRef.doc("core");
    const communityRef = applicationsRef.doc("community");

    /*
     * ------------------------------------------------------------
     * Validate recovery eligibility and repair the missing core
     * entitlement.
     * ------------------------------------------------------------
     *
     * Existing core entitlements are never overwritten. The shared
     * provisioning engine owns their lifecycle transitions.
     */
    await db.runTransaction(async (transaction) => {
      const [
        requestSnapshot,
        organizationSnapshot,
        onboardingSnapshot,
        coreSnapshot,
        communitySnapshot,
      ] = await Promise.all([
        transaction.get(requestRef),
        transaction.get(organizationRef),
        transaction.get(onboardingRef),
        transaction.get(coreRef),
        transaction.get(communityRef),
      ]);

      if (!requestSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization application request was not found.",
        );
      }

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The associated organization does not exist.",
        );
      }

      if (!onboardingSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The organization's onboarding record does not exist.",
        );
      }

      const applicationRequest = requestSnapshot.data() ?? {};
      const onboarding = onboardingSnapshot.data() ?? {};

      if (applicationRequest["organizationId"] !== organizationId) {
        throw new HttpsError(
          "failed-precondition",
          "The application request does not match its organization.",
        );
      }

      if (onboarding["status"] !== "completed") {
        throw new HttpsError(
          "failed-precondition",
          "The organization's core onboarding is not completed.",
        );
      }

      if (applicationRequest["status"] !== "active") {
        throw new HttpsError(
          "failed-precondition",
          "The application request must be active before provisioning recovery.",
        );
      }

      const requestedApplications =
        applicationRequest["requestedApplications"];

      if (
        !Array.isArray(requestedApplications) ||
        !requestedApplications.includes("community")
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The organization application request does not include Community.",
        );
      }

      if (!communitySnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The Community entitlement is missing. This recovery will not create optional application entitlements.",
        );
      }

      const community = communitySnapshot.data() ?? {};

      if (
        community["organizationId"] !== organizationId ||
        community["applicationId"] !== "community"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The Community entitlement does not match the expected organization.",
        );
      }

      const corePolicy = getApplicationProvisioningPolicy("core");

      if (!corePolicy || !corePolicy.enabled) {
        throw new HttpsError(
          "failed-precondition",
          "The foundational core application is not enabled or configured.",
        );
      }

      if (!coreSnapshot.exists) {
        transaction.create(coreRef, {
          applicationId: "core",
          organizationId,
          status: "selected",
          version: 1,
          provisioningStrategy: corePolicy.provisioningStrategy,
          activatedAt: null,
          activatedBy: null,
          provisionedAt: null,
          configuration: {},
          provisioningError: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const core = coreSnapshot.data() ?? {};

        if (
          core["organizationId"] !== organizationId ||
          core["applicationId"] !== "core"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "The core entitlement does not match the expected organization.",
          );
        }
      }
    });

    /*
     * ------------------------------------------------------------
     * Provision foundational core first, then Community.
     * ------------------------------------------------------------
     *
     * Dependency ordering is enforced by the shared provisioning
     * engine. Test Center and all other applications are excluded.
     */
    const provisioningResults =
      await provisionOrganizationApplications(
        db,
        organizationId,
        actorUid,
        {
          mode: "requested",
          applicationIds: ["core", "community"],
        },
      );

    const coreResult = provisioningResults.find(
      (result) => result.applicationId === "core",
    );

    const communityResult = provisioningResults.find(
      (result) => result.applicationId === "community",
    );

    logger.info(
      "Organization application provisioning recovery completed.",
      {
        actorUid,
        requestId,
        organizationId,
        provisioningResults,
      },
    );

    /*
     * Do not report successful recovery unless both entitlements
     * reached the active state.
     */
    if (
      coreResult?.status !== "active" ||
      communityResult?.status !== "active"
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Provisioning recovery did not activate both core and Community. Inspect the returned provisioning diagnostics and entitlement records.",
        {
          organizationId,
          provisioningResults,
        },
      );
    }

    return {
      success: true,
      requestId,
      organizationId,
      activatedApplications: ["core", "community"],
      provisioningResults,
    };
  },
);