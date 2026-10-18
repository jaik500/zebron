import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

import {
  provisionOrganizationApplications,
  type ApplicationProvisioningResult,
} from "./application-provisioning";

import {
  logger,
} from "firebase-functions";

const db = getFirestore();

/** Canonical core onboarding workflow. Application setup is separate. */
const CORE_ORGANIZATION_ONBOARDING_STEPS = [
  "organization_profile",
  "owner_profile",
  "invite_members",
  "configuration",
] as const;




/**
 * Supported default organization member roles.
 */
type OrganizationDefaultMemberRole =
  | "org_member"
  | "org_staff"
  | "org_manager";


/**
 * Fully validated organization configuration.
 *
 * This interface is intentionally applied only after
 * the incoming callable data has passed validation.
 */
interface OrganizationConfigurationInput {
  allowSelfRegistration: boolean;
  defaultMemberRole: OrganizationDefaultMemberRole;
  adminNotifications: boolean;
  primaryColor: string;
  secondaryColor: string;
}


/**
 * Validate a six-digit hexadecimal color.
 *
 * Examples:
 *
 *   #007979
 *   #032D42
 *   #FFFFFF
 */
function isValidHexColor(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(
      value,
    )
  );
}


/**
 * Validate a required boolean value.
 */
function requireBoolean(
  value: unknown,
  fieldName: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be a boolean.`,
    );
  }
}

/**
 * Validate default organization member role.
 */
function requireDefaultMemberRole(
  value: unknown,
): asserts value is OrganizationDefaultMemberRole {
  if (
    value !== "org_member" &&
    value !== "org_staff" &&
    value !== "org_manager"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid default member role.",
    );
  }
}


/**
 * Complete Step 4 of organization onboarding.
 *
 * Current step:
 *
 *   configuration
 *
 * Configuration is the final step of core organization onboarding.
 * Application-specific setup is handled by application entitlements.
 *
 * The backend owns:
 *
 * - authorization
 * - configuration validation
 * - settings persistence
 * - onboarding progression
 */
export const completeOrganizationConfiguration =
  onCall(
    async (request) => {
      /**
       * --------------------------------------------------
       * Authentication
       * --------------------------------------------------
       */

      if (!request.auth?.uid) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in.",
        );
      }

      const callerUid =
        request.auth.uid;


      /**
       * --------------------------------------------------
       * Request data
       * --------------------------------------------------
       */

      const data =
        request.data as {
          organizationId?: unknown;
          configuration?: unknown;
        };


      /**
       * --------------------------------------------------
       * Organization ID validation
       * --------------------------------------------------
       */

      if (
        typeof data.organizationId !==
          "string" ||
        !data.organizationId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Organization ID is required.",
        );
      }

      const organizationId =
        data.organizationId.trim();


      /**
       * --------------------------------------------------
       * Configuration object validation
       * --------------------------------------------------
       */

      if (
        !data.configuration ||
        typeof data.configuration !==
          "object" ||
        Array.isArray(
          data.configuration,
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Organization configuration is required.",
        );
      }

      /**
       * Treat the incoming callable payload as
       * untrusted data until validation completes.
       */
      const rawConfiguration =
        data.configuration as Record<
          string,
          unknown
        >;


      /**
       * --------------------------------------------------
       * Boolean validation
       * --------------------------------------------------
       */

      requireBoolean(
        rawConfiguration[
          "allowSelfRegistration"
        ],
        "allowSelfRegistration",
      );

      requireBoolean(
        rawConfiguration[
          "adminNotifications"
        ],
        "adminNotifications",
      );


      /**
       * --------------------------------------------------
       * Default member role validation
       * --------------------------------------------------
       */

      const defaultMemberRole =
        rawConfiguration[
          "defaultMemberRole"
        ];

      requireDefaultMemberRole(
        defaultMemberRole,
      );


      /**
       * --------------------------------------------------
       * Branding validation
       * --------------------------------------------------
       */

      const primaryColor =
        rawConfiguration[
          "primaryColor"
        ];

      const secondaryColor =
        rawConfiguration[
          "secondaryColor"
        ];

      if (
        !isValidHexColor(
          primaryColor,
        ) ||
        !isValidHexColor(
          secondaryColor,
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Brand colors must be valid six-digit hexadecimal colors.",
        );
      }


      /**
       * --------------------------------------------------
       * Build strongly typed configuration
       * --------------------------------------------------
       *
       * At this point all values have passed validation.
       *
       * This is what makes OrganizationConfigurationInput
       * actually used.
       */

    const configuration: OrganizationConfigurationInput = {
  allowSelfRegistration:
    rawConfiguration["allowSelfRegistration"] as boolean,

  defaultMemberRole,

  adminNotifications:
    rawConfiguration["adminNotifications"] as boolean,

  primaryColor,
  secondaryColor,
};

      /**
       * --------------------------------------------------
       * Firestore references
       * --------------------------------------------------
       */

      const organizationRef =
        db
          .collection(
            "organizations",
          )
          .doc(
            organizationId,
          );

      const membershipRef =
        db
          .collection(
            "organizationMemberships",
          )
          .doc(
            `${callerUid}_${organizationId}`,
          );

      const onboardingRef =
        db
          .collection(
            "organizationOnboarding",
          )
          .doc(
            organizationId,
          );

      const settingsRef =
        db
          .collection(
            "organizationSettings",
          )
          .doc(
            organizationId,
          );


      /**
       * Organization IDs created by organization-provisioning.ts use
       * the deterministic format `org_${requestId}`. Keep this lookup
       * optional for legacy organizations that don't follow that format.
       */
      const applicationRequestId = organizationId.startsWith("org_")
        ? organizationId.slice("org_".length)
        : null;

      const applicationRequestRef = applicationRequestId
        ? db
            .collection("organizationApplicationRequests")
            .doc(applicationRequestId)
        : null;


      /**
       * --------------------------------------------------
       * Transaction
       * --------------------------------------------------
       */

      const result =
        await db.runTransaction(
          async (transaction) => {
            /**
             * Read all authorization/state documents
             * before making any writes.
             */
            const [
              organizationSnapshot,
              membershipSnapshot,
              onboardingSnapshot,
              applicationRequestSnapshot,
            ] = await Promise.all([
              transaction.get(organizationRef),
              transaction.get(membershipRef),
              transaction.get(onboardingRef),
              applicationRequestRef
                ? transaction.get(applicationRequestRef)
                : Promise.resolve(null),
            ]);


            /**
             * --------------------------------------------
             * Organization
             * --------------------------------------------
             */

            if (
              !organizationSnapshot.exists
            ) {
              throw new HttpsError(
                "not-found",
                "Organization not found.",
              );
            }


            /**
             * --------------------------------------------
             * Membership
             * --------------------------------------------
             */

            if (
              !membershipSnapshot.exists
            ) {
              throw new HttpsError(
                "permission-denied",
                "You are not a member of this organization.",
              );
            }

            const membership =
              membershipSnapshot.data() ?? {};

            if (membership["active"] === false) {
              throw new HttpsError(
                "permission-denied",
                "Your organization membership is inactive.",
              );
            }

            const role =
              membership["role"];


            /**
             * Only organization owners and
             * administrators can configure the
             * organization.
             */
            if (
              role !== "org_owner" &&
              role !== "org_admin"
            ) {
              throw new HttpsError(
                "permission-denied",
                "Only an organization owner or administrator can configure it.",
              );
            }


            /**
             * --------------------------------------------
             * Onboarding
             * --------------------------------------------
             */

            if (
              !onboardingSnapshot.exists
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding record was not found.",
              );
            }


            /**
             * --------------------------------------------
             * Onboarding state
             * --------------------------------------------
             *
             * Core onboarding has exactly four steps.
             * Configuration is always the final step; legacy application
             * setup steps are deliberately ignored.
             */

            const onboarding = onboardingSnapshot.data() ?? {};
            const onboardingStatus = onboarding["status"];
            const isAlreadyCompleted = onboardingStatus === "completed";

            const completedBefore = Array.isArray(onboarding["completedSteps"])
              ? onboarding["completedSteps"] as string[]
              : [];

            const requiredStepsBefore = Array.isArray(onboarding["requiredSteps"])
              ? onboarding["requiredSteps"] as string[]
              : [...CORE_ORGANIZATION_ONBOARDING_STEPS];

            /**
             * Allow configuration edits after onboarding has completed.
             * For an initial submission, onboarding must still be in progress.
             */
            if (!isAlreadyCompleted && onboardingStatus !== "in_progress") {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding is not in progress.",
              );
            }

            /**
             * Initial submission must reach Configuration.
             * Completed onboarding can be edited without reopening the workflow.
             */
            if (
              !isAlreadyCompleted &&
              onboarding["currentStep"] !== "configuration" &&
              !completedBefore.includes("configuration")
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding must reach Configuration before it can be completed.",
              );
            }

            const transition = {
              currentStep: isAlreadyCompleted
                ? (typeof onboarding["currentStep"] === "string"
                    ? onboarding["currentStep"]
                    : "configuration")
                : "configuration",
              completedSteps: isAlreadyCompleted
                ? completedBefore
                : [...CORE_ORGANIZATION_ONBOARDING_STEPS],
              requiredSteps: isAlreadyCompleted
                ? requiredStepsBefore
                : [...CORE_ORGANIZATION_ONBOARDING_STEPS],
              status: "completed" as const,
              isComplete: true,
            };

            /**
             * One server timestamp is shared
             * across the transaction.
             */
            const now =
              FieldValue.serverTimestamp();


            /**
             * --------------------------------------------
             * Organization settings
             * --------------------------------------------
             *
             * merge:true is intentional.
             *
             * This preserves configuration values that
             * may have been initialized during
             * organization provisioning.
             *
             * createdAt is intentionally NOT changed.
             */

            transaction.set(
              settingsRef,
              {
                organizationId,

                allowSelfRegistration:
                  configuration
                    .allowSelfRegistration,

                defaultMemberRole:
                  configuration
                    .defaultMemberRole,

                adminNotifications:
                  configuration
                    .adminNotifications,

                primaryColor:
                  configuration
                    .primaryColor,

                secondaryColor:
                  configuration
                    .secondaryColor,

                updatedAt: now,
              },
              {
                merge: true,
              },
            );


            /**
             * --------------------------------------------
             * Advance onboarding
             * --------------------------------------------
             *
             * Persist the canonical four-step workflow and complete it.
             * Application-specific setup is tracked separately.
             */

          if (!isAlreadyCompleted) {
  transaction.update(
    onboardingRef,
    {
      requiredSteps: transition.requiredSteps,
      completedSteps: transition.completedSteps,
      currentStep: transition.currentStep,
      status: transition.status,
      completedAt: now,
      updatedAt: now,
    },
  );

  /**
   * Activate the organization when its initial core onboarding
   * completes. Only transition organizations that are still in
   * onboarding; never overwrite suspended, archived, or other states.
   */
  const organization =
    organizationSnapshot.data() ?? {};

  if (organization["status"] === "onboarding") {
    transaction.update(
      organizationRef,
      {
        status: "active",
        active: true,
        updatedAt: now,
      },
    );
  }
}

            /**
             * Keep the organization application request lifecycle in sync
             * with completion of core organization onboarding. This does not
             * activate any individual application entitlement.
             *
             * Only transition an associated request that is still onboarding.
             * Rejected/cancelled requests and other lifecycle states are left
             * unchanged. Missing request documents are tolerated for legacy
             * organizations and isolated callable tests.
             */
            if (
              applicationRequestRef &&
              applicationRequestSnapshot?.exists
            ) {
              const applicationRequest =
                applicationRequestSnapshot.data() ?? {};

              if (
                applicationRequest["organizationId"] === organizationId &&
                applicationRequest["status"] === "onboarding"
              ) {
                transaction.update(applicationRequestRef, {
                  status: "active",
                  updatedAt: now,
                });
              }
            }

            /**
             * --------------------------------------------
             * Return authoritative state
             * --------------------------------------------
             */

            return {
              organizationId,

              currentStep:
                transition.currentStep,

              completedSteps:
                transition.completedSteps,

              status:
                transition.status,

              isComplete:
                transition.isComplete,

              // Only the initial completion triggers automatic provisioning.
              newlyCompleted: !isAlreadyCompleted,
            };
          },
        );


      /**
       * --------------------------------------------------
       * Application provisioning
       * --------------------------------------------------
       *
       * Run only after the initial core onboarding transaction commits.
       * Configuration edits must not start another automatic provisioning
       * run. Each application result is independent of core onboarding.
       */
      const {
        newlyCompleted,
        ...onboardingResult
      } = result;

      let provisioningResults: ApplicationProvisioningResult[] = [];
      let provisioningError: string | null = null;

      if (newlyCompleted) {
        try {
          provisioningResults =
            await provisionOrganizationApplications(
              db,
              organizationId,
              callerUid,
              {
                mode: "automatic",
              },
            );
        } catch (error) {
          provisioningError =
            error instanceof Error
              ? error.message
              : "Application provisioning could not be started.";

          logger.error(
            "Organization onboarding completed, but automatic application provisioning could not be started.",
            {
              organizationId,
              actorId: callerUid,
              error: provisioningError,
            },
          );
        }
      }

      /**
       * --------------------------------------------------
       * Logging
       * --------------------------------------------------
       */

      logger.info(
        "Organization configuration saved.",
        {
          organizationId,
          actorId: callerUid,
          nextStep: onboardingResult.currentStep,
          newlyCompleted,
          provisioningResultCount: provisioningResults.length,
        },
      );

      /**
       * --------------------------------------------------
       * Response
       * --------------------------------------------------
       *
       * Core onboarding remains successful even if an individual
       * application fails to provision. Provisioning outcomes are returned
       * separately so the frontend can display their status.
       */
      return {
        success: true,
        ...onboardingResult,
        provisioningResults,
        provisioningError,
      };
    },
  );
