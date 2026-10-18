import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

import {
  advanceTestCenterSetup,
  assertCurrentTestCenterSetupStep,
  initializeTestCenterSetup,
  TEST_CENTER_SETUP_STEPS,
  type TestCenterSetupState,
} from "./test-center-setup-transition";

type FirstProgramInput = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
};

/**
 * Test Center onboarding stored on:
 *
 * organizations/{organizationId}/applications/test-center
 */
type TestCenterEntitlementOnboarding = {
  steps?: unknown;
  currentStep?: unknown;
  completedSteps?: unknown;
  status?: unknown;

  firstProgramId?: unknown;
  firstCourseId?: unknown;
  firstTopicId?: unknown;
  firstQuestionId?: unknown;

  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
};

/**
 * Legacy organization onboarding data.
 *
 * This document is read only for migration compatibility.
 * New Test Center progress is never written here.
 */
type LegacyOrganizationOnboarding = {
  currentStep?: unknown;
  completedSteps?: unknown;
  requiredSteps?: unknown;
  status?: unknown;

  firstProgramId?: unknown;
  firstCourseId?: unknown;
  firstTopicId?: unknown;
  firstQuestionId?: unknown;

  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
};

/**
 * Validates a string and enforces its trimmed length.
 */
function isValidString(
  value: unknown,
  minLength = 1,
  maxLength = 200,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength
  );
}

/**
 * Normalizes a program slug.
 *
 * Examples:
 * "Cyber Security" -> "cyber-security"
 * " AWS Cloud "    -> "aws-cloud"
 */
function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns a normalized resource ID or null.
 */
function normalizeResourceId(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return value.trim();
}

/**
 * Initializes Test Center setup using the application's entitlement.
 *
 * Legacy progress is used only when the entitlement has no recorded
 * completed steps. The configured workflow always comes from the
 * entitlement or the trusted server-side Test Center workflow.
 *
 * The four core organization onboarding steps are not used to define
 * the Test Center workflow.
 */
function buildTestCenterSetupState(
  entitlementOnboarding:
    | TestCenterEntitlementOnboarding
    | undefined,
  legacyOnboarding:
    | LegacyOrganizationOnboarding
    | undefined,
): TestCenterSetupState {
  const entitlementState =
    entitlementOnboarding ?? {};

  const legacyState =
    legacyOnboarding ?? {};

  /*
   * Use the workflow persisted on the entitlement.
   *
   * If this is an older entitlement without configured steps,
   * fall back to the trusted Test Center workflow.
   */
  const configuredSteps =
    Array.isArray(entitlementState.steps)
      ? entitlementState.steps
      : [...TEST_CENTER_SETUP_STEPS];

  /*
   * Prefer the entitlement's completed steps.
   *
   * Recover legacy progress only when the entitlement has no
   * completed steps recorded.
   */
  const entitlementCompletedSteps =
    Array.isArray(entitlementState.completedSteps)
      ? entitlementState.completedSteps
      : [];

  const legacyCompletedSteps =
    Array.isArray(legacyState.completedSteps)
      ? legacyState.completedSteps
      : [];

  const completedSteps =
    entitlementCompletedSteps.length > 0
      ? entitlementCompletedSteps
      : legacyCompletedSteps;

  /*
   * Prefer values already stored on the entitlement.
   * Legacy resource IDs provide migration compatibility.
   */
  const existingState: Partial<TestCenterSetupState> = {
    completedSteps,

    firstProgramId:
      normalizeResourceId(
        entitlementState.firstProgramId,
      ) ??
      normalizeResourceId(
        legacyState.firstProgramId,
      ),

    firstCourseId:
      normalizeResourceId(
        entitlementState.firstCourseId,
      ) ??
      normalizeResourceId(
        legacyState.firstCourseId,
      ),

    firstTopicId:
      normalizeResourceId(
        entitlementState.firstTopicId,
      ) ??
      normalizeResourceId(
        legacyState.firstTopicId,
      ),

    firstQuestionId:
      normalizeResourceId(
        entitlementState.firstQuestionId,
      ) ??
      normalizeResourceId(
        legacyState.firstQuestionId,
      ),

    startedAt:
      entitlementState.startedAt ??
      legacyState.startedAt,

    completedAt:
      entitlementState.completedAt ??
      legacyState.completedAt,

    updatedAt:
      entitlementState.updatedAt ??
      legacyState.updatedAt,
  };

  /*
   * Recalculate currentStep and status from the configured workflow
   * and completed steps instead of trusting potentially stale state.
   */
  return initializeTestCenterSetup(
    configuredSteps,
    existingState,
  );
}

/**
 * Creates the first Test Center program for an organization.
 *
 * Authoritative Test Center setup state:
 *
 * organizations/{organizationId}/applications/test-center
 *
 * Core organization onboarding remains independent:
 *
 * organizationOnboarding/{organizationId}
 *
 * Only an active organization owner or administrator can execute
 * this callable.
 *
 * The Test Center entitlement may be "selected" because application
 * setup can happen before the application becomes active.
 */
export const completeOrganizationFirstProgram = onCall(
  {
    invoker: "public",
    cors: true,
  },
  async (request) => {
    const db = getFirestore();

    /*
     * ----------------------------------------------------------------------
     * AUTHENTICATION
     * ----------------------------------------------------------------------
     */

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication is required.",
      );
    }

    const callerUid = request.auth.uid;

    /*
     * ----------------------------------------------------------------------
     * INPUT VALIDATION
     * ----------------------------------------------------------------------
     */

    const data =
      request.data as Partial<FirstProgramInput>;

    const organizationId = data.organizationId;
    const name = data.name;
    const slug = data.slug;
    const description = data.description;

    if (
      !isValidString(
        organizationId,
        1,
        128,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (
      !isValidString(
        name,
        2,
        100,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Program name must be between 2 and 100 characters.",
      );
    }

    if (
      !isValidString(
        slug,
        2,
        100,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Program slug must be between 2 and 100 characters.",
      );
    }

    if (
      !isValidString(
        description,
        1,
        1000,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Program description must be between 1 and 1000 characters.",
      );
    }

    const normalizedOrganizationId =
      organizationId.trim();

    const normalizedSlug =
      normalizeSlug(slug);

    if (!normalizedSlug) {
      throw new HttpsError(
        "invalid-argument",
        "Program slug is invalid.",
      );
    }

    /*
     * ----------------------------------------------------------------------
     * TRANSACTION
     * ----------------------------------------------------------------------
     */

    const result = await db.runTransaction(
      async (transaction) => {
        /*
         * ------------------------------------------------------------------
         * ORGANIZATION
         * ------------------------------------------------------------------
         */

        const organizationRef = db
          .collection("organizations")
          .doc(normalizedOrganizationId);

        const organizationSnapshot =
          await transaction.get(organizationRef);

        if (!organizationSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "Organization was not found.",
          );
        }

        /*
         * ------------------------------------------------------------------
         * MEMBERSHIP
         * ------------------------------------------------------------------
         */

        const membershipRef = db
          .collection("organizationMemberships")
          .doc(
            `${callerUid}_${normalizedOrganizationId}`,
          );

        const membershipSnapshot =
          await transaction.get(membershipRef);

        if (!membershipSnapshot.exists) {
          throw new HttpsError(
            "permission-denied",
            "You are not a member of this organization.",
          );
        }

        const membership =
          membershipSnapshot.data();

        if (membership?.active !== true) {
          throw new HttpsError(
            "permission-denied",
            "Your organization membership is not active.",
          );
        }

        const role = membership.role;

        if (
          role !== "org_owner" &&
          role !== "org_admin"
        ) {
          throw new HttpsError(
            "permission-denied",
            "Only an organization owner or administrator " +
              "can complete Test Center setup.",
          );
        }

        /*
         * ------------------------------------------------------------------
         * TEST CENTER ENTITLEMENT
         * ------------------------------------------------------------------
         *
         * Test Center must have been provisioned for this organization.
         *
         * Do not require status === "active": an organization may need
         * to complete application setup before activation.
         * ------------------------------------------------------------------
         */

        const testCenterEntitlementRef =
          organizationRef
            .collection("applications")
            .doc("test-center");

        const testCenterEntitlementSnapshot =
          await transaction.get(
            testCenterEntitlementRef,
          );

        if (!testCenterEntitlementSnapshot.exists) {
          throw new HttpsError(
            "failed-precondition",
            "Test Center has not been provisioned for this organization.",
          );
        }

        const testCenterEntitlement =
          testCenterEntitlementSnapshot.data();

        /*
         * ------------------------------------------------------------------
         * LEGACY ONBOARDING STATE
         * ------------------------------------------------------------------
         *
         * Read legacy data only for migration compatibility.
         *
         * This callable never writes Test Center progress to the
         * organization onboarding document.
         * ------------------------------------------------------------------
         */

        const legacyOnboardingRef = db
          .collection("organizationOnboarding")
          .doc(normalizedOrganizationId);

        const legacyOnboardingSnapshot =
          await transaction.get(
            legacyOnboardingRef,
          );

        const legacyOnboarding =
          legacyOnboardingSnapshot.exists
            ? legacyOnboardingSnapshot.data() as
                LegacyOrganizationOnboarding
            : undefined;

        /*
         * ------------------------------------------------------------------
         * INITIALIZE TEST CENTER SETUP
         * ------------------------------------------------------------------
         */

        const entitlementOnboarding =
          testCenterEntitlement?.onboarding as
            | TestCenterEntitlementOnboarding
            | undefined;

        const testCenterSetup =
          buildTestCenterSetupState(
            entitlementOnboarding,
            legacyOnboarding,
          );

        /*
         * ------------------------------------------------------------------
         * PREVENT DUPLICATE FIRST PROGRAM
         * ------------------------------------------------------------------
         *
         * Check the recorded resource ID before validating the current
         * step. This ensures that existing setup is reported as a
         * duplicate rather than as an invalid current step.
         * ------------------------------------------------------------------
         */

        const existingProgramId =
          normalizeResourceId(
            testCenterSetup.firstProgramId,
          );

        if (existingProgramId) {
          throw new HttpsError(
            "already-exists",
            "The organization already has a first program configured.",
          );
        }

        /*
         * ------------------------------------------------------------------
         * VALIDATE CURRENT TEST CENTER STEP
         * ------------------------------------------------------------------
         *
         * This validates the application's workflow independently of
         * the four core organization onboarding steps.
         * ------------------------------------------------------------------
         */

        assertCurrentTestCenterSetupStep(
          testCenterSetup,
          "first_program",
        );

        /*
         * ------------------------------------------------------------------
         * CHECK PROGRAM SLUG UNIQUENESS
         * ------------------------------------------------------------------
         *
         * Program slugs are used as document IDs, matching the existing
         * TestProgramService convention.
         *
         * Since the document ID is global, the slug must be globally
         * unique across testPrograms.
         * ------------------------------------------------------------------
         */

        const programRef = db
          .collection("testPrograms")
          .doc(normalizedSlug);

        const existingProgramSnapshot =
          await transaction.get(programRef);

        if (existingProgramSnapshot.exists) {
          throw new HttpsError(
            "already-exists",
            `A test program with slug "${normalizedSlug}" already exists.`,
          );
        }

        /*
         * ------------------------------------------------------------------
         * CREATE PROGRAM
         * ------------------------------------------------------------------
         */

        const now =
          FieldValue.serverTimestamp();

        transaction.create(
          programRef,
          {
            organizationId:
              normalizedOrganizationId,

            name:
              name.trim(),

            slug:
              normalizedSlug,

            description:
              description.trim(),

            active:
              true,

            courseCount:
              0,

            createdBy:
              callerUid,

            createdAt:
              now,

            updatedAt:
              now,
          },
        );

        /*
         * ------------------------------------------------------------------
         * ADVANCE TEST CENTER SETUP
         * ------------------------------------------------------------------
         *
         * After first_program, the next configured Test Center step
         * should normally be first_course.
         *
         * Only the Test Center entitlement's onboarding state advances.
         * ------------------------------------------------------------------
         */

        const transition =
          advanceTestCenterSetup(
            testCenterSetup,
            "first_program",
          );

        /*
         * ------------------------------------------------------------------
         * UPDATE TEST CENTER ENTITLEMENT
         * ------------------------------------------------------------------
         *
         * Preserve other entitlement fields.
         *
         * Do not update organizationOnboarding here.
         * ------------------------------------------------------------------
         */

        transaction.update(
          testCenterEntitlementRef,
          {
            onboarding: {
              ...testCenterSetup,

              firstProgramId:
                programRef.id,

              completedSteps:
                transition.completedSteps,

              currentStep:
                transition.currentStep,

              status:
                transition.status,

              startedAt:
                testCenterSetup.startedAt ?? now,

              completedAt:
                transition.isComplete
                  ? now
                  : null,

              updatedAt:
                now,
            },

            updatedAt:
              now,
          },
        );

        /*
         * ------------------------------------------------------------------
         * TRANSACTION RESULT
         * ------------------------------------------------------------------
         */

        return {
          programId:
            programRef.id,

          organizationId:
            normalizedOrganizationId,

          name:
            name.trim(),

          slug:
            normalizedSlug,

          description:
            description.trim(),

          active:
            true,

          courseCount:
            0,

          firstProgramId:
            programRef.id,

          currentStep:
            transition.currentStep,

          completedSteps:
            transition.completedSteps,

          status:
            transition.status,

          isComplete:
            transition.isComplete,
        };
      },
    );

    /*
     * ----------------------------------------------------------------------
     * RESPONSE
     * ----------------------------------------------------------------------
     */

    return {
      success: true,

      program: {
        id:
          result.programId,

        organizationId:
          result.organizationId,

        name:
          result.name,

        slug:
          result.slug,

        description:
          result.description,

        active:
          result.active,

        courseCount:
          result.courseCount,
      },

      onboarding: {
        firstProgramId:
          result.firstProgramId,

        currentStep:
          result.currentStep,

        completedSteps:
          result.completedSteps,

        status:
          result.status,

        isComplete:
          result.isComplete,
      },
    };
  },
);