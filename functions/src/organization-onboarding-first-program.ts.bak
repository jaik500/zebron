import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const db = getFirestore();

type FirstProgramInput = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
};

/**
 * Validates a string input and enforces a trimmed length range.
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
 * Converts a user-provided program slug into a stable
 * Firestore-safe normalized slug.
 */
function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const completeOrganizationFirstProgram = onCall(
  async (request) => {
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

    const data = request.data as Partial<FirstProgramInput>;

    const organizationId = data.organizationId;
    const name = data.name;
    const slug = data.slug;
    const description = data.description;

    if (!isValidString(organizationId, 1, 128)) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (!isValidString(name, 2, 100)) {
      throw new HttpsError(
        "invalid-argument",
        "Program name must be between 2 and 100 characters.",
      );
    }

    if (!isValidString(slug, 2, 100)) {
      throw new HttpsError(
        "invalid-argument",
        "Program slug must be between 2 and 100 characters.",
      );
    }

    if (!isValidString(description, 1, 1000)) {
      throw new HttpsError(
        "invalid-argument",
        "Program description must be between 1 and 1000 characters.",
      );
    }

    const normalizedSlug = normalizeSlug(slug);

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
         * --------------------------------------------------------------
         * ORGANIZATION
         * --------------------------------------------------------------
         */

        const organizationRef = db
          .collection("organizations")
          .doc(organizationId);

        const organizationSnapshot = await transaction.get(
          organizationRef,
        );

        if (!organizationSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "Organization was not found.",
          );
        }

        /*
         * --------------------------------------------------------------
         * MEMBERSHIP
         * --------------------------------------------------------------
         */

        const membershipRef = db
          .collection("organizationMemberships")
          .doc(`${callerUid}_${organizationId}`);

        const membershipSnapshot = await transaction.get(
          membershipRef,
        );

        if (!membershipSnapshot.exists) {
          throw new HttpsError(
            "permission-denied",
            "You are not a member of this organization.",
          );
        }

        const membership = membershipSnapshot.data();

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
            "can complete onboarding.",
          );
        }

        /*
         * --------------------------------------------------------------
         * ONBOARDING STATE
         * --------------------------------------------------------------
         */

        const onboardingRef = db
          .collection("organizationOnboarding")
          .doc(organizationId);

        const onboardingSnapshot = await transaction.get(
          onboardingRef,
        );

        if (!onboardingSnapshot.exists) {
          throw new HttpsError(
            "failed-precondition",
            "Organization onboarding has not been initialized.",
          );
        }

        const onboarding = onboardingSnapshot.data();

        if (onboarding?.status !== "in_progress") {
          throw new HttpsError(
            "failed-precondition",
            "Organization onboarding is not in progress.",
          );
        }

        if (onboarding?.currentStep !== "first_program") {
          throw new HttpsError(
            "failed-precondition",
            "The current onboarding step is " +
            `"${onboarding?.currentStep ?? "unknown"}", ` +
            "not \"first_program\".",
          );
        }

        /*
         * --------------------------------------------------------------
         * PREVENT DUPLICATE FIRST PROGRAM
         * --------------------------------------------------------------
         */

        const existingProgramId = onboarding?.firstProgramId;

        if (
          typeof existingProgramId === "string" &&
          existingProgramId.length > 0
        ) {
          throw new HttpsError(
            "already-exists",
            "The organization already has a first program configured.",
          );
        }

        /*
         * --------------------------------------------------------------
         * PROGRAM DOCUMENT
         *
         * Program slugs are the stable document IDs.
         * This matches TestProgramService.
         * --------------------------------------------------------------
         */

        const programRef = db
          .collection("testPrograms")
          .doc(normalizedSlug);

        /*
         * The slug must be globally unique for the testPrograms
         * collection because it is being used as the document ID.
         */

        const existingProgramSnapshot = await transaction.get(
          programRef,
        );

        if (existingProgramSnapshot.exists) {
          throw new HttpsError(
            "already-exists",
            `A test program with slug "${normalizedSlug}" already exists.`,
          );
        }

        /*
         * --------------------------------------------------------------
         * CREATE PROGRAM
         * --------------------------------------------------------------
         */

        const now = FieldValue.serverTimestamp();

        transaction.create(
          programRef,
          {
            organizationId,
            name: name.trim(),
            slug: normalizedSlug,
            description: description.trim(),
            active: true,
            courseCount: 0,
            createdBy: callerUid,
            createdAt: now,
            updatedAt: now,
          },
        );

        /*
         * --------------------------------------------------------------
         * ADVANCE ONBOARDING
         * --------------------------------------------------------------
         */

        const existingCompletedSteps = Array.isArray(
          onboarding?.completedSteps,
        ) ?
          onboarding.completedSteps.filter(
            (step: unknown): step is string =>
              typeof step === "string",
          ) :
          [];

        const completedSteps = Array.from(
          new Set([
            ...existingCompletedSteps,
            "first_program",
          ]),
        );

        transaction.update(
          onboardingRef,
          {
            firstProgramId: programRef.id,
            completedSteps,
            currentStep: "courses",
            status: "in_progress",
            completedAt: null,
            updatedAt: now,
          },
        );

        return {
          programId: programRef.id,
          organizationId,
          name: name.trim(),
          slug: normalizedSlug,
          description: description.trim(),
          active: true,
          courseCount: 0,
          currentStep: "courses",
          completedSteps,
        };
      },
    );

    return {
      success: true,
      program: {
        id: result.programId,
        organizationId: result.organizationId,
        name: result.name,
        slug: result.slug,
        description: result.description,
        active: result.active,
        courseCount: result.courseCount,
      },
      onboarding: {
        firstProgramId: result.programId,
        currentStep: result.currentStep,
        completedSteps: result.completedSteps,
        status: "in_progress",
      },
    };
  },
);
