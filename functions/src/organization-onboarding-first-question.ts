import { onCall, HttpsError } from "firebase-functions/v2/https";
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

type FirstQuestionOption = {
  text: string;
  isCorrect: boolean;
};

type FirstQuestionInput = {
  organizationId: string;
  courseId?: string;
  topicId?: string;
  question: string;
  explanation?: string;
  options: FirstQuestionOption[];
  active: boolean;
};

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

function normalizeResourceId(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function validateOptions(
  options: unknown,
): options is FirstQuestionOption[] {
  if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
    return false;
  }

  return options.every(
    (option) =>
      option !== null &&
      typeof option === "object" &&
      isValidString(option.text, 1, 1000) &&
      typeof option.isCorrect === "boolean",
  );
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
    firstCourseId: normalizeResourceId(state.firstCourseId),
    firstTopicId: normalizeResourceId(state.firstTopicId),
    firstQuestionId: normalizeResourceId(state.firstQuestionId),
    ...(state.startedAt !== undefined ? { startedAt: state.startedAt } : {}),
    ...(state.completedAt !== undefined ? { completedAt: state.completedAt } : {}),
    ...(state.updatedAt !== undefined ? { updatedAt: state.updatedAt } : {}),
  });
}

/**
 * Creates the first question for an organization's selected Test Center
 * application. Test Center setup progress is persisted only under:
 *
 * organizations/{organizationId}/applications/test-center
 *
 * organizationOnboarding/{organizationId} is intentionally not read or
 * written by this callable.
 */
export const completeOrganizationFirstQuestion = onCall(
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
    const data = request.data as Partial<FirstQuestionInput>;
    const organizationId = data.organizationId;
    const courseId = data.courseId;
    const topicId = data.topicId;
    const question = data.question;
    const explanation = data.explanation;
    const options = data.options;
    const active = data.active;

    if (!isValidString(organizationId, 1, 128)) {
      throw new HttpsError("invalid-argument", "organizationId is required.");
    }

    if (courseId !== undefined && !isValidString(courseId, 1, 128)) {
      throw new HttpsError("invalid-argument", "courseId must be a valid string.");
    }

    if (topicId !== undefined && !isValidString(topicId, 1, 128)) {
      throw new HttpsError("invalid-argument", "topicId must be a valid string.");
    }

    if (!isValidString(question, 5, 5000)) {
      throw new HttpsError(
        "invalid-argument",
        "Question must be between 5 and 5000 characters.",
      );
    }

    if (!validateOptions(options)) {
      throw new HttpsError(
        "invalid-argument",
        "Between two and ten valid answer options are required.",
      );
    }

    if (options.filter((option) => option.isCorrect).length !== 1) {
      throw new HttpsError(
        "invalid-argument",
        "Exactly one answer option must be marked correct.",
      );
    }

    if (typeof active !== "boolean") {
      throw new HttpsError("invalid-argument", "Question active status is required.");
    }

    if (
      explanation !== undefined &&
      explanation !== null &&
      (
        typeof explanation !== "string" ||
        (
          explanation.trim().length > 0 &&
          !isValidString(explanation, 1, 5000)
        )
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Question explanation cannot exceed 5000 characters.",
      );
    }

    const normalizedOrganizationId = organizationId.trim();
    const normalizedQuestion = question.trim();
    const normalizedExplanation =
      typeof explanation === "string" && explanation.trim()
        ? explanation.trim()
        : null;
    const normalizedOptions = options.map((option) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    }));

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
      assertCurrentTestCenterSetupStep(setup, "first_question");

      const firstCourseId = setup.firstCourseId;
      const firstTopicId = setup.firstTopicId;

      if (!firstCourseId) {
        throw new HttpsError(
          "failed-precondition",
          "The first course has not been configured.",
        );
      }

      if (!firstTopicId) {
        throw new HttpsError(
          "failed-precondition",
          "The first topic has not been configured.",
        );
      }

      if (setup.firstQuestionId) {
        throw new HttpsError(
          "already-exists",
          "The organization already has a first question configured.",
        );
      }

      if (courseId !== undefined && courseId.trim() !== firstCourseId) {
        throw new HttpsError(
          "failed-precondition",
          "The supplied courseId does not match the configured first course.",
        );
      }

      if (topicId !== undefined && topicId.trim() !== firstTopicId) {
        throw new HttpsError(
          "failed-precondition",
          "The supplied topicId does not match the configured first topic.",
        );
      }

      const courseRef = db.collection("testCourses").doc(firstCourseId);
      const topicRef = db.collection("testTopics").doc(firstTopicId);

      const courseSnapshot = await transaction.get(courseRef);
      if (!courseSnapshot.exists) {
        throw new HttpsError("not-found", "The first course could not be found.");
      }

      const course = courseSnapshot.data();
      if (course?.organizationId !== normalizedOrganizationId) {
        throw new HttpsError(
          "permission-denied",
          "The first course does not belong to this organization.",
        );
      }

      const topicSnapshot = await transaction.get(topicRef);
      if (!topicSnapshot.exists) {
        throw new HttpsError("not-found", "The first topic could not be found.");
      }

      const topic = topicSnapshot.data();
      if (topic?.organizationId !== undefined &&
          topic.organizationId !== normalizedOrganizationId) {
        throw new HttpsError(
          "permission-denied",
          "The first topic does not belong to this organization.",
        );
      }

      if (topic?.courseId !== firstCourseId) {
        throw new HttpsError(
          "failed-precondition",
          "The first topic does not belong to the first course.",
        );
      }

      const questionRef = db.collection("testQuestions").doc();
      const now = FieldValue.serverTimestamp();

      transaction.create(questionRef, {
        organizationId: normalizedOrganizationId,
        courseId: firstCourseId,
        topicId: firstTopicId,
        question: normalizedQuestion,
        explanation: normalizedExplanation,
        options: normalizedOptions,
        type: "multiple-choice",
        active,
        tags: [],
        sourceType: "original",
        createdBy: callerUid,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(courseRef, {
        questionCount: FieldValue.increment(1),
        updatedAt: now,
      });

      transaction.update(topicRef, {
        questionCount: FieldValue.increment(1),
        updatedAt: now,
      });

      const transition = advanceTestCenterSetup(setup, "first_question");

      transaction.update(entitlementRef, {
        onboarding: {
          ...setup,
          firstQuestionId: questionRef.id,
          completedSteps: transition.completedSteps,
          currentStep: transition.currentStep,
          status: transition.status,
          startedAt: setup.startedAt ?? now,
          completedAt: transition.isComplete ? now : null,
          updatedAt: now,
        },
        updatedAt: now,
      });

      return {
        questionId: questionRef.id,
        organizationId: normalizedOrganizationId,
        courseId: firstCourseId,
        topicId: firstTopicId,
        question: normalizedQuestion,
        explanation: normalizedExplanation,
        options: normalizedOptions,
        active,
        firstQuestionId: questionRef.id,
        currentStep: transition.currentStep,
        completedSteps: transition.completedSteps,
        status: transition.status,
        isComplete: transition.isComplete,
      };
    });

    return {
      success: true,
      question: {
        id: result.questionId,
        organizationId: result.organizationId,
        courseId: result.courseId,
        topicId: result.topicId,
        question: result.question,
        explanation: result.explanation,
        options: result.options,
        active: result.active,
      },
      onboarding: {
        firstQuestionId: result.firstQuestionId,
        currentStep: result.currentStep,
        completedSteps: result.completedSteps,
        status: result.status,
        isComplete: result.isComplete,
      },
    };
  },
);
