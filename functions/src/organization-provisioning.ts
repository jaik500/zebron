/* eslint-disable max-len */

import {
  HttpsError,
  onCall,
  CallableRequest,
} from "firebase-functions/v2/https";

import * as logger from "firebase-functions/logger";

import {
  FieldValue,
  Firestore,
  getFirestore,
} from "firebase-admin/firestore";

import {
  getApplicationProvisioningPolicy,
} from "./application-provisioning-policy";

import {
  provisionOrganizationApplications,
} from "./application-provisioning";

import {randomUUID} from "node:crypto";

/*
 * ================================================================
 * TYPES
 * ================================================================
 */

type OrganizationApplicationRequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "provisioning"
  | "onboarding"
  | "active"
  | "cancelled";

type OrganizationStatus =
  | "pending"
  | "provisioning"
  | "onboarding"
  | "active"
  | "suspended"
  | "archived";

type OrganizationApplicationStatus =
  | "available"
  | "selected"
  | "provisioning"
  | "active"
  | "suspended"
  | "deactivated"
  | "failed";

type OrganizationOnboardingStep =
  | "organization_profile"
  | "owner_profile"
  | "invite_members"
  | "configuration";

interface RequestedApplicationDefinition {
  applicationId?: unknown;
}

type RequestedApplicationInput =
  | string
  | RequestedApplicationDefinition;

interface OrganizationApplicationRequest {
  id: string;
  applicantUserId: string;
  organizationName: string;
  organizationSlug?: string;
  organizationType?: string;
  companyNumber?: string;
  website?: string;
  description?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  requestedApplications: RequestedApplicationInput[];
  status: OrganizationApplicationRequestStatus;
  submittedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  rejectionReason?: string;
  approvedAt?: unknown;
  organizationId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/*
 * ================================================================
 * ADMIN AUTHORIZATION
 * ================================================================
 */

/**
 * Require the caller to be a platform administrator.
 *
 * The frontend and Firestore security model recognize:
 *
 *   role: "admin"
 *
 * and:
 *
 *   platformRole: "platform-admin"
 *
 * Keep both supported here so the trusted backend remains
 * consistent with the platform authorization model.
 */
async function requirePlatformAdmin(
  request: CallableRequest<unknown>,
  db: Firestore,
): Promise<{
  uid: string;
  email?: string;
}> {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in as a platform administrator.",
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

  const isPlatformAdmin =
    profile["role"] === "admin" ||
    profile["platformRole"] === "platform-admin";

  if (!isPlatformAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only platform administrators may provision organizations.",
    );
  }

  return {
    uid,
    email:
      typeof profile["email"] === "string" ?
        profile["email"] :
        request.auth.token.email,
  };
}

/*
 * ================================================================
 * VALIDATION HELPERS
 * ================================================================
 */

/**
 * Validates and returns a required non-empty string.
 *
 * @param value The value to validate.
 * @param fieldName The field name used in the validation error.
 * @returns The trimmed string value.
 * @throws HttpsError When the value is missing or not a string.
 */
function requireNonEmptyString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} is required.`,
    );
  }

  return value.trim();
}

/**
 * Normalizes a value into a URL-safe organization slug.
 *
 * @param value The value to normalize.
 * @returns The normalized slug.
 */
function normalizeSlug(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Creates the organization slug using the requested slug when provided,
 * otherwise deriving it from the organization name.
 *
 * @param name The organization name.
 * @param requestedSlug Optional requested organization slug.
 * @returns The normalized organization slug.
 */
function createOrganizationSlug(
  name: string,
  requestedSlug?: string,
): string {
  const baseSlug = normalizeSlug(
    requestedSlug || name,
  );

  if (baseSlug) {
    return baseSlug;
  }

  return `organization-${randomUUID().slice(0, 8)}`;
}

/**
 * Organization application IDs are controlled by the application
 * catalog. Do not allow arbitrary objects to be injected into the
 * organization entitlement collection.
 */
const BASE_ORGANIZATION_ONBOARDING_STEPS: OrganizationOnboardingStep[] = [
  "organization_profile",
  "owner_profile",
  "invite_members",
  "configuration",
];

/**
 * Application provisioning is independent of organization onboarding.
 *
 * The organization provisioner creates one entitlement for each
 * requested application. Application-specific setup and resource
 * creation belong to the application itself, not this workflow.
 */
interface NormalizedRequestedApplication {
  applicationId: string;
}

/**
 * Normalize requested application IDs from trusted request data.
 *
 * Supports legacy requests such as ["test-center"] and the newer
 * application-aware request shape. Any client-provided onboarding
 * metadata is intentionally ignored.
 */
function normalizeRequestedApplicationDefinitions(
  value: unknown,
): NormalizedRequestedApplication[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const applicationIds = new Set<string>();

  for (const item of value as RequestedApplicationInput[]) {
    let applicationId = "";

    if (typeof item === "string") {
      applicationId = item.trim().toLowerCase();
    } else if (item && typeof item === "object") {
      applicationId =
        typeof item.applicationId === "string" ?
          item.applicationId.trim().toLowerCase() :
          "";
    }

    if (applicationId) {
      applicationIds.add(applicationId);
    }
  }

  return Array.from(applicationIds).map((applicationId) => ({
    applicationId,
  }));
}

/**
 * Organization onboarding is always the four core organization steps.
 *
 * Application-specific setup is tracked on each application entitlement
 * and must not extend the mandatory organization onboarding workflow.
 * The parameter remains to preserve existing provisioning call sites.
 */
function buildRequiredOnboardingSteps(): OrganizationOnboardingStep[] {
  return [...BASE_ORGANIZATION_ONBOARDING_STEPS];
}

/*
 * ================================================================
 * AUDIT HELPERS
 * ================================================================
 */

/**
 * The existing Zebron AuditService writes to auditLogs.
 *
 * Cloud Functions cannot inject the Angular AuditService, so the
 * trusted backend writes the same persistent audit shape directly.
 */
function createAuditRecord(
  db: Firestore,
  transaction: FirebaseFirestore.Transaction,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    actorEmail?: string;
    metadata?: Record<string, unknown>;
    reason?: string;
  },
): void {
  const auditRef = db
    .collection("auditLogs")
    .doc();

  transaction.set(
    auditRef,
    {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      actorName: null,
      actorEmail: input.actorEmail ?? null,
      actorType: "user",
      outcome: "success",
      source: "backend",
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
      before: null,
      after: null,
      createdAt: FieldValue.serverTimestamp(),
    },
  );
}

/*
 * ================================================================
 * PROVISION ORGANIZATION
 * ================================================================
 */

/**
 * Provision an approved organization application.
 *
 * Lifecycle:
 *
 *   approved
 *       |
 *       v
 *   provisioning
 *       |
 *       v
 *   organization created
 *       |
 *       v
 *   owner membership created
 *       |
 *       v
 *   application entitlements created
 *       |
 *       v
 *   onboarding created
 *       |
 *       v
 *   application request -> onboarding
 *
 * The entire provisioning operation is transactional.
 *
 * The callable is intentionally platform-admin-only.
 */
export const provisionOrganization = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    /*
     * Firestore is intentionally initialized inside the callable.
     *
     * Do not move this to module scope. Firebase Admin must already
     * be initialized by the functions entry point before this code
     * executes.
     */
    const db = getFirestore();

    const admin = await requirePlatformAdmin(
      request,
      db,
    );

    const data =
      request.data as
        | {
            requestId?: unknown;
          }
        | undefined;

    const requestId =
      requireNonEmptyString(
        data?.requestId,
        "requestId",
      );

    const requestRef = db
      .collection("organizationApplicationRequests")
      .doc(requestId);

    /*
     * --------------------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------------------
     */

    const result = await db.runTransaction(
      async (transaction) => {
        const requestSnapshot =
          await transaction.get(requestRef);

        if (!requestSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "The organization application could not be found.",
          );
        }

        const application =
          requestSnapshot.data() as OrganizationApplicationRequest;

        /*
         * ------------------------------------------------------------
         * IDEMPOTENCY
         * ------------------------------------------------------------
         *
         * If this application was already provisioned, return the
         * existing organization instead of creating another tenant.
         */

if (
  application.organizationId &&
  (
    application.status === "onboarding" ||
    application.status === "active"
  )
) {
  const organizationId = application.organizationId;

  const existingOrganizationRef = db
    .collection("organizations")
    .doc(organizationId);

  const existingOrganization = await transaction.get(
    existingOrganizationRef,
  );

  if (existingOrganization.exists) {
    const applicationsRef = existingOrganizationRef
      .collection("applications");

    const coreRef = applicationsRef.doc("core");

    /*
     * Resolve the requested applications before performing writes.
     */
    const requestedDefinitions =
      normalizeRequestedApplicationDefinitions(
        application.requestedApplications,
      );

    const requestedEntitlements = requestedDefinitions
      .filter(({ applicationId }) => applicationId !== "core")
      .map(({ applicationId }) => {
        const policy =
          getApplicationProvisioningPolicy(applicationId);

        if (!policy || !policy.enabled) {
          throw new HttpsError(
            "failed-precondition",
            `Requested application "${applicationId}" is not enabled or configured.`,
          );
        }

        return {
          applicationId,
          policy,
          ref: applicationsRef.doc(applicationId),
        };
      });

    const corePolicy = getApplicationProvisioningPolicy("core");

    if (!corePolicy || !corePolicy.enabled) {
      throw new HttpsError(
        "failed-precondition",
        "The foundational Core application is not enabled or configured.",
      );
    }

    /*
     * Read every entitlement before performing any writes.
     */
    const coreSnapshot = await transaction.get(coreRef);

    const requestedSnapshots = await Promise.all(
      requestedEntitlements.map(({ ref }) =>
        transaction.get(ref),
      ),
    );

    /*
     * Restore only missing entitlement records.
     * Existing records and their statuses/configuration are preserved.
     */
    if (!coreSnapshot.exists) {
      transaction.set(coreRef, {
        applicationId: "core",
        organizationId,
        status: "selected" as OrganizationApplicationStatus,
        version: 1,
        provisioningStrategy: corePolicy.provisioningStrategy,
        activatedAt: null,
        activatedBy: null,
        provisionedAt: null,
        configuration: {},
        provisioningError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    requestedEntitlements.forEach(
      ({ applicationId, policy, ref }, index) => {
        if (requestedSnapshots[index].exists) {
          return;
        }

        transaction.set(ref, {
          applicationId,
          organizationId,
          status: "selected" as OrganizationApplicationStatus,
          version: 1,
          provisioningStrategy: policy.provisioningStrategy,
          activatedAt: null,
          activatedBy: null,
          provisionedAt: null,
          configuration: {},
          provisioningError: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      },
    );

    return {
  alreadyProvisioned: true,
  organizationId,
  status: application.status,
  requestedApplications: requestedDefinitions.map(
    ({ applicationId }) => applicationId,
  ),
};
  }
}

        /*
         * ------------------------------------------------------------
         * STATUS VALIDATION
         * ------------------------------------------------------------
         */

        if (application.status !== "approved") {
          throw new HttpsError(
            "failed-precondition",
            `Only approved organization applications can be provisioned. Current status: ${application.status}.`,
          );
        }

        const applicantUserId =
          requireNonEmptyString(
            application.applicantUserId,
            "applicantUserId",
          );

        const organizationName =
          requireNonEmptyString(
            application.organizationName,
            "organizationName",
          );

        /*
         * Validate the application contact even though contactName
         * is not currently stored on the Organization model.
         */
        requireNonEmptyString(
          application.contactName,
          "contactName",
        );

        const contactEmail =
          requireNonEmptyString(
            application.contactEmail,
            "contactEmail",
          );

        /*
         * ------------------------------------------------------------
         * ORGANIZATION ID
         * ------------------------------------------------------------
         *
         * Use a deterministic ID derived from the application ID.
         *
         * This makes retries safe and prevents duplicate organizations
         * if the callable is invoked more than once.
         */

        const organizationId =
          `org_${requestId}`;

        const organizationRef =
          db
            .collection("organizations")
            .doc(organizationId);

        const membershipId =
          `${applicantUserId}_${organizationId}`;

        const membershipRef =
          db
            .collection("organizationMemberships")
            .doc(membershipId);

        const onboardingRef =
          db
            .collection("organizationOnboarding")
            .doc(organizationId);

        /*
         * ------------------------------------------------------------
         * CHECK FOR PARTIAL PREVIOUS PROVISIONING
         * ------------------------------------------------------------
         */

        const existingOrganization =
          await transaction.get(
            organizationRef,
          );

        const existingMembership =
          await transaction.get(
            membershipRef,
          );

        const existingOnboarding =
          await transaction.get(
            onboardingRef,
          );

        /*
         * If the organization already exists but the request still
         * says approved, we do not silently overwrite it.
         */

        if (existingOrganization.exists) {
          throw new HttpsError(
            "already-exists",
            "An organization already exists for this application.",
          );
        }

        if (existingMembership.exists) {
          throw new HttpsError(
            "already-exists",
            "An organization membership already exists for this application.",
          );
        }

        if (existingOnboarding.exists) {
          throw new HttpsError(
            "already-exists",
            "An onboarding record already exists for this organization.",
          );
        }

        /*
         * ------------------------------------------------------------
         * ORGANIZATION
         * ------------------------------------------------------------
         */

        const now = FieldValue.serverTimestamp();

        const slug =
          createOrganizationSlug(
            organizationName,
            application.organizationSlug,
          );

        transaction.set(
          organizationRef,
          {
            id: organizationId,

            name: organizationName,

            companyNumber:
              application.companyNumber ?? null,

            normalizedName:
              organizationName
                .trim()
                .toLowerCase(),

            slug,

            description:
              application.description ?? null,

            website:
              application.website ?? null,

            phone:
              application.contactPhone ?? null,

            email:
              contactEmail,

            logoUrl: null,

            locationId: null,

            status:
              "onboarding" as OrganizationStatus,

            ownerUserId:
              applicantUserId,

            approvedAt:
              application.approvedAt ?? now,

            activatedAt: null,

            verified: true,

            active: true,

            createdAt: now,

            updatedAt: now,
          },
        );

        /*
         * ------------------------------------------------------------
         * OWNER MEMBERSHIP
         * ------------------------------------------------------------
         *
         * The applicant becomes the initial organization owner.
         *
         * This is the only place in the onboarding flow where the
         * initial org_owner membership is created.
         */

        transaction.set(
          membershipRef,
          {
            id: membershipId,

            userId:
              applicantUserId,

            organizationId,

            role:
              "org_owner",

            active: true,

            createdAt: now,

            updatedAt: now,
          },
        );

        /*
 * ------------------------------------------------------------
 * FOUNDATIONAL CORE ENTITLEMENT
 * ------------------------------------------------------------
 *
 * Every organization requires the core platform entitlement.
 * This is foundational infrastructure, not an optional
 * application selected by the organization.
 *
 * Optional application entitlements are created separately
 * from the approved list of requested applications.
 */

const corePolicy = getApplicationProvisioningPolicy("core");

if (!corePolicy || !corePolicy.enabled) {
  throw new HttpsError(
    "failed-precondition",
    "The foundational core application is not enabled or configured.",
  );
}

/*
 * FOUNDATIONAL CORE ENTITLEMENT
 *
 * Every organization must have a Core entitlement.
 * Create it in the same transaction as the organization.
 *
 * Firestore transaction atomicity ensures that Core and the
 * organization are committed together or neither is committed.
 */
const coreApplicationRef = organizationRef
  .collection("applications")
  .doc("core");

transaction.create(coreApplicationRef, {
  applicationId: "core",
  organizationId,
  status: "selected" as OrganizationApplicationStatus,
  version: 1,
  provisioningStrategy: corePolicy.provisioningStrategy,
  activatedAt: null,
  activatedBy: null,
  provisionedAt: null,
  configuration: {},
  provisioningError: null,
  updatedAt: now,
});

        /*
         * ------------------------------------------------------------
         * APPLICATION ENTITLEMENTS
         * ------------------------------------------------------------
         *
         * The organization application request contains the
         * applications requested during signup.
         *
         * Those become tenant-scoped application entitlement records.
         *
         * These are intentionally separate from the organization
         * creation request.
         */

        const requestedApplicationDefinitions =
          normalizeRequestedApplicationDefinitions(
            application.requestedApplications,
          );

for (const requestedApplication of requestedApplicationDefinitions) {
  const applicationId = requestedApplication.applicationId;

  /*
   * Core is created separately as a foundational entitlement
   * for every organization. Do not create it a second time.
   */
  if (applicationId === "core") {
    continue;
  }

  const policy = getApplicationProvisioningPolicy(applicationId);

  if (!policy) {
    throw new HttpsError(
      "invalid-argument",
      `Unsupported application: ${applicationId}`,
    );
  }

  if (!policy.enabled) {
    throw new HttpsError(
      "failed-precondition",
      `Application is not currently enabled: ${applicationId}`,
    );
  }

  const applicationRef = organizationRef
    .collection("applications")
    .doc(applicationId);

  transaction.set(applicationRef, {
    applicationId,
    organizationId,
    status: "selected" as OrganizationApplicationStatus,
    version: 1,
    provisioningStrategy: policy.provisioningStrategy,
    activatedAt: null,
    activatedBy: null,
    provisionedAt: null,
    configuration: {},
    provisioningError: null,
    updatedAt: now,
  });
}

        const requestedApplications =
          requestedApplicationDefinitions.map(
            (item) => item.applicationId,
          );

        const requiredSteps = buildRequiredOnboardingSteps();

        /*
         * ------------------------------------------------------------
         * ONBOARDING
         * ------------------------------------------------------------
         */

        transaction.set(
          onboardingRef,
          {
            id: organizationId,

            organizationId,

            ownerUserId:
              applicantUserId,

            status:
              "in_progress",

            /*
             * Core organization onboarding is application-agnostic
             * and always consists of the four required organization
             * setup steps.
             */
            requiredSteps,

            currentStep:
              requiredSteps[0] ??
              "organization_profile",

            completedSteps: [],

            startedAt: now,

            completedAt: null,

            createdAt: now,

            updatedAt: now,
          },
        );

        /*
         * ------------------------------------------------------------
         * AUDIT
         * ------------------------------------------------------------
         */

        createAuditRecord(
          db,
          transaction,
          {
            action:
              "ORGANIZATION_PROVISIONING_STARTED",

            entityType:
              "organizationApplicationRequest",

            entityId:
              requestId,

            actorId:
              admin.uid,

            actorEmail:
              admin.email,

            metadata: {
              organizationId,

              applicantUserId,
            },
          },
        );

        createAuditRecord(
          db,
          transaction,
          {
            action:
              "ORGANIZATION_PROVISIONED",

            entityType:
              "organization",

            entityId:
              organizationId,

            actorId:
              admin.uid,

            actorEmail:
              admin.email,

            metadata: {
              organizationApplicationRequestId:
                requestId,

              organizationName,

              organizationSlug:
                slug,

              requestedApplications,
            },
          },
        );

        createAuditRecord(
          db,
          transaction,
          {
            action:
              "ORGANIZATION_OWNER_CREATED",

            entityType:
              "organizationMembership",

            entityId:
              membershipId,

            actorId:
              admin.uid,

            actorEmail:
              admin.email,

            metadata: {
              organizationId,

              ownerUserId:
                applicantUserId,

              role:
                "org_owner",
            },
          },
        );

        createAuditRecord(
          db,
          transaction,
          {
            action:
              "ORGANIZATION_ONBOARDING_STARTED",

            entityType:
              "organizationOnboarding",

            entityId:
              organizationId,

            actorId:
              admin.uid,

            actorEmail:
              admin.email,

            metadata: {
              organizationId,

              ownerUserId:
                applicantUserId,

              firstStep:
                requiredSteps[0] ??
                "organization_profile",

              requiredSteps,
            },
          },
        );

        /*
         * ------------------------------------------------------------
         * APPLICATION REQUEST
         * ------------------------------------------------------------
         *
         * The application request moves from approved to onboarding.
         *
         * Approval and activation remain separate concepts.
         */

        transaction.update(
          requestRef,
          {
            status:
              "onboarding" as OrganizationApplicationRequestStatus,

            organizationId,

            updatedAt: now,
          },
        );

        return {
          alreadyProvisioned: false,

          organizationId,

          organizationName,

          ownerUserId:
            applicantUserId,

          requestedApplications,
        };
      },
    );

/*
 * ------------------------------------------------------------
 * ORGANIZATION PROVISIONING RESULT
 * ------------------------------------------------------------
 *
 * This callable creates the organization and its requested
 * application entitlements.
 *
 * Application activation happens after core organization
 * onboarding completes. Do not invoke the shared application
 * provisioning engine here.
 *
 * Idempotent recovery must restore missing records without
 * changing existing application statuses or configuration.
 */

const organizationId = result.organizationId;

const organizationSnapshot = await db
  .collection("organizations")
  .doc(organizationId)
  .get();

if (!organizationSnapshot.exists) {
  throw new HttpsError(
    "internal",
    "The organization was not created successfully.",
  );
}

logger.info(
  "Organization provisioning completed.",
  {
    requestId,
    organizationId,
    alreadyProvisioned: result.alreadyProvisioned,
    actorId: admin.uid,
    requestedApplications: result.requestedApplications ?? [],
    applicationActivationDeferred: true,
  },
);

return {
  success: true,
  requestId,
  ...result,
  provisioningResults: [],
};

/*
 * Do not automatically provision every existing entitlement here.
 *
 * Organization recovery must not change unrelated application
 * statuses or attempt custom provisioning for applications that
 * have no registered provisioning handler.
 *
 * Entitlement creation and application provisioning are separate
 * lifecycle operations.
 */
/*
 * --------------------------------------------------------------
 * APPLICATION PROVISIONING
 * --------------------------------------------------------------
 *
 * Always process the foundational Core entitlement and the
 * applications explicitly requested by this organization.
 *
 * Do not automatically provision unrelated entitlements.
 * Organization onboarding remains a separate lifecycle.
 */

const requestedApplicationIds = [
  ...new Set([
    "core",
    ...(result.requestedApplications ?? []),
  ]),
];

const provisioningResults =
  await provisionOrganizationApplications(
    db,
    organizationId,
    admin.uid,
    {
      mode: "requested",
      applicationIds: requestedApplicationIds,
    },
  );

logger.info(
  "Organization provisioning completed.",
  {
    requestId,
    organizationId,
    alreadyProvisioned: result.alreadyProvisioned,
    actorId: admin.uid,
    provisioningResults,
  },
);

return {
  success: true,
  requestId,
  ...result,
  provisioningResults,
};
  },
  //
  
);
