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
  type TestCenterSetupState,
} from "./test-center-setup-transition";

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

type EntitlementOnboarding = Partial<TestCenterSetupState> & {
  steps?: unknown;
};

type TestCenterEntitlement = {
  applicationId?: string;
  organizationId?: string;
  status?: string;
  onboarding?: EntitlementOnboarding;
};

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

    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication is required.",
      );
    }

    const callerUid = request.auth.uid;
    const data = request.data as Partial<FirstCourseInput>;

    // ---------------------------------------------------------
    // Input validation
    // ---------------------------------------------------------

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

    const normalizedOrganizationId = organizationId.trim();
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      throw new HttpsError(
        "invalid-argument",
        "Course slug is invalid.",
      );
    }

    // ---------------------------------------------------------
    // Firestore references
    // ---------------------------------------------------------

    const organizationRef = db
      .collection("organizations")
      .doc(normalizedOrganizationId);

    const membershipRef = db
      .collection("organizationMemberships")
      .doc(`${callerUid}_${normalizedOrganizationId}`);

    const entitlementRef = organizationRef
      .collection("applications")
      .doc("test-center");

    // ---------------------------------------------------------
    // Transaction
    // ---------------------------------------------------------

    const result = await db.runTransaction(async (transaction) => {
      // Organization must exist.
      const organizationSnapshot =
        await transaction.get(organizationRef);

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Organization was not found.",
        );
      }

      // Membership must exist and be active.
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

      // Only owners and administrators may create the first course.
      if (
        membership.role !== "org_owner" &&
        membership.role !== "org_admin"
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only an organization owner or administrator can create the first course.",
        );
      }

      // -------------------------------------------------------
      // Test Center entitlement
      // -------------------------------------------------------

      const entitlementSnapshot =
        await transaction.get(entitlementRef);

      if (!entitlementSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The organization does not have a Test Center entitlement.",
        );
      }

      const entitlement =
        entitlementSnapshot.data() as TestCenterEntitlement;

      if (
        entitlement.applicationId !== undefined &&
        entitlement.applicationId !== "test-center"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The application entitlement is invalid.",
        );
      }

      if (
        entitlement.organizationId !== undefined &&
        entitlement.organizationId !== normalizedOrganizationId
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The application entitlement belongs to another organization.",
        );
      }

      // The entitlement can be selected while setup is in progress.
      // Do not require status === "active" here.
      const persistedOnboarding = entitlement.onboarding;

      if (
        !persistedOnboarding ||
        !Array.isArray(persistedOnboarding.steps)
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Test Center setup has not been initialized.",
        );
      }

      // Recalculate the current step from trusted configured steps
      // and persisted completed steps instead of trusting a stale
      // currentStep value.
      const setup = initializeTestCenterSetup(
        persistedOnboarding.steps,
        persistedOnboarding,
      );

      assertCurrentTestCenterSetupStep(
        setup,
        "first_course",
      );

      // -------------------------------------------------------
      // First program validation
      // -------------------------------------------------------

      const firstProgramId = setup.firstProgramId;

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

      if (
        program?.organizationId !== normalizedOrganizationId
      ) {
        throw new HttpsError(
          "permission-denied",
          "The first program does not belong to this organization.",
        );
      }

      // -------------------------------------------------------
      // Duplicate first-course protection
      // -------------------------------------------------------

      if (
        typeof setup.firstCourseId === "string" &&
        setup.firstCourseId.trim()
      ) {
        throw new HttpsError(
          "already-exists",
          "The organization already has a first course configured.",
        );
      }

      // -------------------------------------------------------
      // Course slug uniqueness within the organization
      // -------------------------------------------------------

      const existingCourseQuery = db
        .collection("testCourses")
        .where("organizationId", "==", normalizedOrganizationId)
        .where("slug", "==", normalizedSlug)
        .limit(1);

      const existingCourseSnapshot =
        await transaction.get(existingCourseQuery);

      if (!existingCourseSnapshot.empty) {
        throw new HttpsError(
          "already-exists",
          `A course with the slug "${normalizedSlug}" already exists in this organization.`,
        );
      }

      // -------------------------------------------------------
      // Create course
      // -------------------------------------------------------

      const courseRef = db
        .collection("testCourses")
        .doc();

      const now = FieldValue.serverTimestamp();

      const course = {
        organizationId: normalizedOrganizationId,
        scope: "organization",
        accessType: "organization-members",
        programId: firstProgramId,
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim(),
        provider:
          typeof provider === "string" && provider.trim()
            ? provider.trim()
            : null,
        type,
        certificationCode:
          typeof certificationCode === "string" &&
          certificationCode.trim()
            ? certificationCode.trim()
            : null,
        imageUrl:
          typeof imageUrl === "string" && imageUrl.trim()
            ? imageUrl.trim()
            : null,
        active,
        questionCount: 0,
        createdBy: callerUid,
        createdAt: now,
        updatedAt: now,
      };

      // -------------------------------------------------------
      // Advance Test Center setup
      // -------------------------------------------------------

      const transition = advanceTestCenterSetup(
        setup,
        "first_course",
      );

      const updatedOnboarding = {
        ...setup,
        steps: [...setup.steps],
        firstCourseId: courseRef.id,
        completedSteps: transition.completedSteps,
        currentStep: transition.currentStep,
        status: transition.status,
        startedAt: setup.startedAt ?? now,
        completedAt: transition.isComplete ? now : null,
        updatedAt: now,
      };

      // All transaction reads have completed before these writes.
      transaction.create(courseRef, course);

      transaction.update(entitlementRef, {
        onboarding: updatedOnboarding,
        updatedAt: now,
      });

      return {
        courseId: courseRef.id,
        organizationId: normalizedOrganizationId,
        programId: firstProgramId,
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim(),
        provider:
          typeof provider === "string" && provider.trim()
            ? provider.trim()
            : null,
        type,
        active,
        questionCount: 0,
        onboarding: updatedOnboarding,
        isComplete: transition.isComplete,
      };
    });

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------

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
        currentStep: result.onboarding.currentStep,
        completedSteps: result.onboarding.completedSteps,
        status: result.onboarding.status,
        isComplete: result.isComplete,
      },
    };
  },
);