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
  requestedApplications: string[];
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
function normalizeRequestedApplications(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
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
          const existingOrganizationRef =
            db
              .collection("organizations")
              .doc(application.organizationId);

          const existingOrganization =
            await transaction.get(
              existingOrganizationRef,
            );

          if (existingOrganization.exists) {
            return {
              alreadyProvisioned: true,
              organizationId:
                application.organizationId,
              status: application.status,
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

        const requestedApplications =
          normalizeRequestedApplications(
            application.requestedApplications,
          );

        for (
          const applicationId
          of requestedApplications
        ) {
          const applicationRef =
            organizationRef
              .collection("applications")
              .doc(applicationId);

          transaction.set(
            applicationRef,
            {
              applicationId,

              organizationId,

              status:
                "selected" as OrganizationApplicationStatus,

              version: 1,

              /*
               * The application provisioning service will determine
               * the actual provisioning implementation later.
               */
              provisioningStrategy:
                "default",

              activatedAt: null,

              activatedBy: null,

              provisionedAt: null,

              configuration: {},

              provisioningError: null,

              updatedAt: now,
            },
          );
        }

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

            currentStep:
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
                "organization_profile",
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

    logger.info(
      "Organization provisioning completed.",
      {
        requestId,

        organizationId:
          result.organizationId,

        alreadyProvisioned:
          result.alreadyProvisioned,

        actorId:
          admin.uid,
      },
    );

    return {
      success: true,

      requestId,

      ...result,
    };
  },
);
