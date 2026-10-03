import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

type FirstCourseInput = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  provider?: string;
  type: "certification" | "course" | "subject" | "skill";
  certificationCode?: string;
  imageUrl?: string;
  active: boolean;
};

/**
 * Validates that a value is a string within the specified length range.
 *
 * @param value Value to validate.
 * @param minLength Minimum allowed string length.
 * @param maxLength Maximum allowed string length.
 * @returns True when the value is a string within the specified length range.
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
 * Normalizes a course slug for consistent storage and lookup.
 *
 * @param value Slug value to normalize.
 * @returns Normalized lowercase slug containing only alphanumeric characters
 * and hyphens.
 */
function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const completeOrganizationFirstCourse = onCall(
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

    const data = request.data as Partial<FirstCourseInput>;

    const organizationId = data.organizationId;
    const name = data.name;
    const slug = data.slug;
    const description = data.description;
    const provider = data.provider;
    const type = data.type;
    const certificationCode = data.certificationCode;
    const imageUrl = data.imageUrl;
    const active = data.active;

    if (!isValidString(organizationId, 1, 128)) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (!isValidString(name, 2, 150)) {
      throw new HttpsError(
        "invalid-argument",
        "Course name must be between 2 and 150 characters.",
      );
    }

    if (!isValidString(slug, 2, 150)) {
      throw new HttpsError(
        "invalid-argument",
        "Course slug must be between 2 and 150 characters.",
      );
    }

    if (!isValidString(description, 1, 2000)) {
      throw new HttpsError(
        "invalid-argument",
        "Course description must be between 1 and 2000 characters.",
      );
    }

    if (
      type !== "certification" &&
      type !== "course" &&
      type !== "subject" &&
      type !== "skill"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Course type is invalid.",
      );
    }

    if (typeof active !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Course active status is required.",
      );
    }

    if (
      provider !== undefined &&
      provider !== null &&
      !isValidString(provider, 1, 200)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Course provider must be between 1 and 200 characters.",
      );
    }

    if (
      certificationCode !== undefined &&
      certificationCode !== null &&
      !isValidString(certificationCode, 1, 150)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Certification code must be between 1 and 150 characters.",
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      !isValidString(imageUrl, 1, 1000)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Course image URL is invalid.",
      );
    }

    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      throw new HttpsError(
        "invalid-argument",
        "Course slug is invalid.",
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

        const organizationSnapshot =
          await transaction.get(organizationRef);

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

        const membershipSnapshot =
          await transaction.get(membershipRef);

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

        const onboardingSnapshot =
          await transaction.get(onboardingRef);

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

        if (onboarding?.currentStep !== "first_course") {
          throw new HttpsError(
            "failed-precondition",
            "The current onboarding step is " +
            `"${onboarding?.currentStep ?? "unknown"}", ` +
            "not \"first_course\".",
          );
        }

        /*
         * --------------------------------------------------------------
         * FIRST PROGRAM
         * --------------------------------------------------------------
         */

        const firstProgramId = onboarding?.firstProgramId;

        if (
          typeof firstProgramId !== "string" ||
          !firstProgramId.trim()
        ) {
          throw new HttpsError(
            "failed-precondition",
            "The first program has not been configured.",
          );
        }

        const programRef = db
          .collection("testPrograms")
          .doc(firstProgramId);

        const programSnapshot =
          await transaction.get(programRef);

        if (!programSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "The first program could not be found.",
          );
        }

        const program = programSnapshot.data();

        if (program?.organizationId !== organizationId) {
          throw new HttpsError(
            "permission-denied",
            "The first program does not belong to this organization.",
          );
        }

        /*
         * --------------------------------------------------------------
         * PREVENT DUPLICATE FIRST COURSE
         * --------------------------------------------------------------
         */

        const existingCourseId = onboarding?.firstCourseId;

        if (
          typeof existingCourseId === "string" &&
          existingCourseId.length > 0
        ) {
          throw new HttpsError(
            "already-exists",
            "The organization already has a first course configured.",
          );
        }

        /*
         * --------------------------------------------------------------
         * COURSE DOCUMENT
         * --------------------------------------------------------------
         */

        const courseRef = db
          .collection("testCourses")
          .doc();

        /*
         * The course slug must be unique within the organization.
         */

        const existingCourseQuery = db
          .collection("testCourses")
          .where(
            "organizationId",
            "==",
            organizationId,
          )
          .where(
            "slug",
            "==",
            normalizedSlug,
          )
          .limit(1);

        const existingCourseSnapshot =
          await transaction.get(existingCourseQuery);

        if (!existingCourseSnapshot.empty) {
          throw new HttpsError(
            "already-exists",
            `A course with the slug "${normalizedSlug}" ` +
            "already exists in this organization.",
          );
        }

        /*
         * --------------------------------------------------------------
         * CREATE COURSE
         * --------------------------------------------------------------
         */

        const now = FieldValue.serverTimestamp();

        transaction.create(
          courseRef,
          {
            organizationId,
            scope: "organization",
            accessType: "organization-members",
            programId: firstProgramId,
            name: name.trim(),
            slug: normalizedSlug,
            description: description.trim(),
            provider:
              typeof provider === "string" &&
              provider.trim() ?
                provider.trim() :
                null,
            type,
            certificationCode:
              typeof certificationCode === "string" &&
              certificationCode.trim() ?
                certificationCode.trim() :
                null,
            imageUrl:
              typeof imageUrl === "string" &&
              imageUrl.trim() ?
                imageUrl.trim() :
                null,
            active,
            questionCount: 0,
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

        const existingCompletedSteps =
          Array.isArray(onboarding?.completedSteps) ?
            onboarding.completedSteps.filter(
              (step: unknown): step is string =>
                typeof step === "string",
            ) :
            [];

        const completedSteps = Array.from(
          new Set([
            ...existingCompletedSteps,
            "first_course",
          ]),
        );

        transaction.update(
          onboardingRef,
          {
            firstCourseId: courseRef.id,
            completedSteps,
            currentStep: "first_topic",
            status: "in_progress",
            completedAt: null,
            updatedAt: now,
          },
        );

        return {
          courseId: courseRef.id,
          organizationId,
          programId: firstProgramId,
          name: name.trim(),
          slug: normalizedSlug,
          description: description.trim(),
          provider:
            typeof provider === "string" &&
            provider.trim() ?
              provider.trim() :
              null,
          type,
          active,
          questionCount: 0,
          currentStep: "first_topic",
          completedSteps,
        };
      },
    );

    return {
      success: true,
      course: {
        id: result.courseId,
        organizationId: result.organizationId,
        programId: result.programId,
        name: result.name,
        slug: result.slug,
        description: result.description,
        provider: result.provider,
        type: result.type,
        active: result.active,
        questionCount: result.questionCount,
      },
      onboarding: {
        firstCourseId: result.courseId,
        currentStep: result.currentStep,
        completedSteps: result.completedSteps,
        status: "in_progress",
      },
    };
  },
);
