import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

import {
  logger,
} from "firebase-functions";

const db = getFirestore();


/**
 * Supported organization course visibility values.
 */
type OrganizationCourseVisibility =
  | "all"
  | "members"
  | "admins";


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
  testCenterEnabled: boolean;
  allowMemberTesting: boolean;

  courseVisibility:
    OrganizationCourseVisibility;

  allowSelfRegistration: boolean;

  defaultMemberRole:
    OrganizationDefaultMemberRole;

  adminNotifications: boolean;
  testResultNotifications: boolean;

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
 * Validate course visibility.
 */
function requireCourseVisibility(
  value: unknown,
): asserts value is OrganizationCourseVisibility {
  if (
    value !== "all" &&
    value !== "members" &&
    value !== "admins"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid course visibility.",
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
 * Next step:
 *
 *   first_program
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
          "testCenterEnabled"
        ],
        "testCenterEnabled",
      );

      requireBoolean(
        rawConfiguration[
          "allowMemberTesting"
        ],
        "allowMemberTesting",
      );

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

      requireBoolean(
        rawConfiguration[
          "testResultNotifications"
        ],
        "testResultNotifications",
      );


      /**
       * --------------------------------------------------
       * Course visibility validation
       * --------------------------------------------------
       */

      const courseVisibility =
        rawConfiguration[
          "courseVisibility"
        ];

      requireCourseVisibility(
        courseVisibility,
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

      const configuration:
        OrganizationConfigurationInput = {
          testCenterEnabled:
            rawConfiguration[
              "testCenterEnabled"
            ] as boolean,

          allowMemberTesting:
            rawConfiguration[
              "allowMemberTesting"
            ] as boolean,

          courseVisibility,

          allowSelfRegistration:
            rawConfiguration[
              "allowSelfRegistration"
            ] as boolean,

          defaultMemberRole,

          adminNotifications:
            rawConfiguration[
              "adminNotifications"
            ] as boolean,

          testResultNotifications:
            rawConfiguration[
              "testResultNotifications"
            ] as boolean,

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
            ] = await Promise.all([
              transaction.get(
                organizationRef,
              ),

              transaction.get(
                membershipRef,
              ),

              transaction.get(
                onboardingRef,
              ),
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

            const onboarding =
              onboardingSnapshot.data() ?? {};


            /**
             * --------------------------------------------
             * Onboarding status
             * --------------------------------------------
             */

            if (
              onboarding["status"] !==
              "in_progress"
            ) {
              throw new HttpsError(
                "failed-precondition",
                "The organization onboarding process is not active.",
              );
            }


            /**
             * --------------------------------------------
             * Current onboarding step
             * --------------------------------------------
             */

            if (
              onboarding["currentStep"] !==
              "configuration"
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Configuration is not the current onboarding step.",
              );
            }


            /**
             * --------------------------------------------
             * Completed steps
             * --------------------------------------------
             */

            const completedSteps =
              Array.isArray(
                onboarding[
                  "completedSteps"
                ],
              ) ?
                onboarding[
                  "completedSteps"
                ].filter(
                  (
                    step,
                  ): step is string =>
                    typeof step ===
                      "string",
                ) :
                [];


            const nextCompletedSteps =
              Array.from(
                new Set([
                  ...completedSteps,
                  "configuration",
                ]),
              );


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

                testCenterEnabled:
                  configuration
                    .testCenterEnabled,

                allowMemberTesting:
                  configuration
                    .allowMemberTesting,

                courseVisibility:
                  configuration
                    .courseVisibility,

                allowSelfRegistration:
                  configuration
                    .allowSelfRegistration,

                defaultMemberRole:
                  configuration
                    .defaultMemberRole,

                adminNotifications:
                  configuration
                    .adminNotifications,

                testResultNotifications:
                  configuration
                    .testResultNotifications,

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
             */

            transaction.update(
              onboardingRef,
              {
                completedSteps:
                  nextCompletedSteps,

                currentStep:
                  "first_program",

                status:
                  "in_progress",

                completedAt:
                  null,

                updatedAt:
                  now,
              },
            );


            /**
             * --------------------------------------------
             * Return authoritative state
             * --------------------------------------------
             */

            return {
              organizationId,

              currentStep:
                "first_program",

              completedSteps:
                nextCompletedSteps,
            };
          },
        );


      /**
       * --------------------------------------------------
       * Logging
       * --------------------------------------------------
       */

      logger.info(
        "Organization configuration completed.",
        {
          organizationId,
          actorId: callerUid,
          nextStep:
            result.currentStep,
        },
      );


      /**
       * --------------------------------------------------
       * Response
       * --------------------------------------------------
       */

      return {
        success: true,
        ...result,
      };
    },
  );
