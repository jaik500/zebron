import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import {
  advanceTestCenterSetup,
  assertCurrentTestCenterSetupStep,
  initializeTestCenterSetup,
  TEST_CENTER_SETUP_STEPS,
  type TestCenterSetupState,
} from "./test-center-setup-transition";

type FirstTopicInput = {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
};

type TestCenterEntitlementOnboarding = {
  steps?: unknown;
  currentStep?: unknown;
  completedSteps?: unknown;
  status?: unknown;
  firstProgramId?: unknown;
  firstQuizId?: unknown;
  firstTopicId?: unknown;
  firstQuestionId?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
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

function normalizeResourceId(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

/**
 * Builds Test Center setup state exclusively from the application's
 * entitlement. Core organization onboarding is not read or modified.
 */
function buildTestCenterSetupState(
  onboarding: TestCenterEntitlementOnboarding | undefined,
): TestCenterSetupState {
  const state = onboarding ?? {};
  const steps = Array.isArray(state.steps)
    ? state.steps
    : [...TEST_CENTER_SETUP_STEPS];

  return initializeTestCenterSetup(steps, {
    completedSteps: Array.isArray(state.completedSteps)
      ? state.completedSteps
      : [],
    firstProgramId: normalizeResourceId(state.firstProgramId),
    firstQuizId: normalizeResourceId(state.firstQuizId),
    firstTopicId: normalizeResourceId(state.firstTopicId),
    firstQuestionId: normalizeResourceId(state.firstQuestionId),
    ...(state.startedAt !== undefined ? { startedAt: state.startedAt } : {}),
    ...(state.completedAt !== undefined ? { completedAt: state.completedAt } : {}),
    ...(state.updatedAt !== undefined ? { updatedAt: state.updatedAt } : {}),
  });
}

/**
 * Creates the first topic for the organization's selected Test Center
 * application. Test Center setup is persisted only in:
 *
 * organizations/{organizationId}/applications/test-center
 *
 * organizationOnboarding/{organizationId} remains independent and is
 * intentionally not read or written by this callable.
 */
export const completeOrganizationFirstTopic = onCall(
  {
    invoker: "public",
    cors: true,
  },
  async (request) => {
    const db = getFirestore();

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const callerUid = request.auth.uid;
    const data = request.data as Partial<FirstTopicInput>;
    const organizationId = data.organizationId;
    const name = data.name;
    const slug = data.slug;
    const description = data.description;
    const active = data.active;

    if (!isValidString(organizationId, 1, 128)) {
      throw new HttpsError("invalid-argument", "organizationId is required.");
    }

    if (!isValidString(name, 2, 150)) {
      throw new HttpsError(
        "invalid-argument",
        "Topic name must be between 2 and 150 characters.",
      );
    }

    if (!isValidString(slug, 2, 150)) {
      throw new HttpsError(
        "invalid-argument",
        "Topic slug must be between 2 and 150 characters.",
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      !isValidString(description, 0, 2000)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Topic description cannot exceed 2000 characters.",
      );
    }

    if (typeof active !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Topic active status is required.",
      );
    }

    const normalizedOrganizationId = organizationId.trim();
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      throw new HttpsError("invalid-argument", "Topic slug is invalid.");
    }

    const result = await db.runTransaction(async (transaction) => {
      const organizationRef = db
        .collection("organizations")
        .doc(normalizedOrganizationId);

      const membershipRef = db
        .collection("organizationMemberships")
        .doc(`${callerUid}_${normalizedOrganizationId}`);

      const entitlementRef = organizationRef
        .collection("applications")
        .doc("test-center");

      const organizationSnapshot = await transaction.get(organizationRef);

      if (!organizationSnapshot.exists) {
        throw new HttpsError("not-found", "Organization was not found.");
      }

      const membershipSnapshot = await transaction.get(membershipRef);

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

      if (membership.role !== "org_owner" && membership.role !== "org_admin") {
        throw new HttpsError(
          "permission-denied",
          "Only an organization owner or administrator can complete onboarding.",
        );
      }

      const entitlementSnapshot = await transaction.get(entitlementRef);

      if (!entitlementSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "The organization has not selected the Test Center application.",
        );
      }

      const entitlement = entitlementSnapshot.data() ?? {};
      if (
        entitlement.status === "suspended" ||
        entitlement.status === "deactivated" ||
        entitlement.status === "failed"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The Test Center application is not available for setup.",
        );
      }

      const persistedOnboarding =
        entitlement.onboarding as TestCenterEntitlementOnboarding | undefined;

      if (!persistedOnboarding || typeof persistedOnboarding !== "object") {
        throw new HttpsError(
          "failed-precondition",
          "Test Center setup has not been initialized.",
        );
      }

      const setup = buildTestCenterSetupState(persistedOnboarding);

      assertCurrentTestCenterSetupStep(setup, "first_topic");

      const firstQuizId = setup.firstQuizId;
      if (!firstQuizId) {
        throw new HttpsError(
          "failed-precondition",
          "The first course has not been configured.",
        );
      }

      if (setup.firstTopicId) {
        throw new HttpsError(
          "already-exists",
          "The organization already has a first topic configured.",
        );
      }

      const courseRef = db.collection("quizzes").doc(firstQuizId);
      const courseSnapshot = await transaction.get(courseRef);

      if (!courseSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The first course could not be found.",
        );
      }

      if (courseSnapshot.data()?.organizationId !== normalizedOrganizationId) {
        throw new HttpsError(
          "permission-denied",
          "The first course does not belong to this organization.",
        );
      }

      const duplicateQuery = db
        .collection("quizTopics")
        .where("quizId", "==", firstQuizId)
        .where("slug", "==", normalizedSlug)
        .limit(1);

      const duplicateSnapshot = await transaction.get(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        throw new HttpsError(
          "already-exists",
          `A topic with the slug "${normalizedSlug}" already exists in this course.`,
        );
      }

      const existingTopicsQuery = db
        .collection("quizTopics")
        .where("quizId", "==", firstQuizId);

      const existingTopicsSnapshot = await transaction.get(existingTopicsQuery);
      let nextSortOrder = 0;

      for (const topicDocument of existingTopicsSnapshot.docs) {
        const sortOrder = topicDocument.data().sortOrder;
        if (typeof sortOrder === "number" && Number.isFinite(sortOrder)) {
          nextSortOrder = Math.max(nextSortOrder, sortOrder + 1);
        }
      }

      const topicRef = db.collection("quizTopics").doc();
      const now = FieldValue.serverTimestamp();
      const cleanDescription =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;

      const transition = advanceTestCenterSetup(setup, "first_topic");

      transaction.create(topicRef, {
        organizationId: normalizedOrganizationId,
        quizId: firstQuizId,
        name: name.trim(),
        slug: normalizedSlug,
        description: cleanDescription,
        sortOrder: nextSortOrder,
        questionCount: 0,
        active,
        createdBy: callerUid,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(entitlementRef, {
        "onboarding.firstTopicId": topicRef.id,
        "onboarding.completedSteps": transition.completedSteps,
        "onboarding.currentStep": transition.currentStep,
        "onboarding.status": transition.status,
        "onboarding.completedAt": transition.isComplete ? now : null,
        "onboarding.updatedAt": now,
        updatedAt: now,
      });

      return {
        topicId: topicRef.id,
        organizationId: normalizedOrganizationId,
        quizId: firstQuizId,
        name: name.trim(),
        slug: normalizedSlug,
        description: cleanDescription,
        sortOrder: nextSortOrder,
        questionCount: 0,
        active,
        currentStep: transition.currentStep,
        completedSteps: transition.completedSteps,
        status: transition.status,
        isComplete: transition.isComplete,
      };
    });

    return {
      success: true,
      topic: {
        id: result.topicId,
        organizationId: result.organizationId,
        quizId: result.quizId,
        name: result.name,
        slug: result.slug,
        description: result.description,
        sortOrder: result.sortOrder,
        questionCount: result.questionCount,
        active: result.active,
      },
      onboarding: {
        firstTopicId: result.topicId,
        currentStep: result.currentStep,
        completedSteps: result.completedSteps,
        status: result.status,
        isComplete: result.isComplete,
      },
    };
  },
);
