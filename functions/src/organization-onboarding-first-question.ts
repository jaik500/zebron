import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

type FirstQuestionOption = {
  id: string;
  text: string;
};

type FirstQuestionInput = {
  organizationId: string;
  question: string;
  options: FirstQuestionOption[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
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

function validateOptions(
  options: unknown,
): options is FirstQuestionOption[] {
  if (!Array.isArray(options) || options.length !== 4) {
    return false;
  }

  return options.every(
    (option) =>
      option &&
      typeof option === "object" &&
      typeof option.id === "string" &&
      typeof option.text === "string" &&
      option.id.trim().length > 0 &&
      option.text.trim().length > 0,
  );
}

export const completeOrganizationFirstQuestion = onCall(
  {
    invoker: "public",
    cors: true,
  },
  async (request) => {
    const db = getFirestore();

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication is required.",
      );
    }

    const data = request.data as Partial<FirstQuestionInput>;

    const organizationId = data.organizationId;
    const question = data.question;
    const options = data.options;
    const correctAnswer = data.correctAnswer;
    const difficulty = data.difficulty;
    const explanation = data.explanation;

    if (!isValidString(organizationId, 1, 128)) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (!isValidString(question, 2, 5000)) {
      throw new HttpsError(
        "invalid-argument",
        "Question text must be between 2 and 5000 characters.",
      );
    }

    if (!validateOptions(options)) {
      throw new HttpsError(
        "invalid-argument",
        "Exactly four answer options are required.",
      );
    }

    if (!isValidString(correctAnswer, 1, 50)) {
      throw new HttpsError(
        "invalid-argument",
        "A correct answer is required.",
      );
    }

    const validOptionIds = new Set(
      options.map((option) => option.id.trim()),
    );

    if (!validOptionIds.has(correctAnswer.trim())) {
      throw new HttpsError(
        "invalid-argument",
        "The selected correct answer is invalid.",
      );
    }

    if (
      difficulty !== "easy" &&
      difficulty !== "medium" &&
      difficulty !== "hard"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid question difficulty is required.",
      );
    }

    if (
      explanation !== undefined &&
      !isValidString(explanation, 1, 5000)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Question explanation cannot exceed 5000 characters.",
      );
    }

    const callerUid = request.auth.uid;

    const onboardingRef = db
      .collection("organizationOnboarding")
      .doc(organizationId.trim());

    const membershipRef = db
      .collection("organizationMemberships")
      .doc(`${callerUid}_${organizationId.trim()}`);

    const result = await db.runTransaction(async (transaction) => {
      /*
       * --------------------------------------------------------------
       * MEMBERSHIP
       * --------------------------------------------------------------
       */

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

      if (
        membership.role !== "org_owner" &&
        membership.role !== "org_admin"
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only an organization owner or administrator can complete onboarding.",
        );
      }

      /*
       * --------------------------------------------------------------
       * ONBOARDING
       * --------------------------------------------------------------
       */

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

      if (onboarding?.currentStep !== "first_question") {
        throw new HttpsError(
          "failed-precondition",
          `The current onboarding step is "${onboarding?.currentStep ?? "unknown"}", not "first_question".`,
        );
      }

      const firstCourseId = onboarding?.firstCourseId;
      const firstTopicId = onboarding?.firstTopicId;

      if (
        typeof firstCourseId !== "string" ||
        !firstCourseId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The first course has not been configured.",
        );
      }

      if (
        typeof firstTopicId !== "string" ||
        !firstTopicId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The first topic has not been configured.",
        );
      }

      if (onboarding?.firstQuestionId) {
        throw new HttpsError(
          "already-exists",
          "The organization already has a first question configured.",
        );
      }

      /*
       * --------------------------------------------------------------
       * COURSE
       * --------------------------------------------------------------
       */

      const courseRef = db
        .collection("testCourses")
        .doc(firstCourseId);

      const courseSnapshot =
        await transaction.get(courseRef);

      if (!courseSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The first course could not be found.",
        );
      }

      const course = courseSnapshot.data();

      if (course?.organizationId !== organizationId.trim()) {
        throw new HttpsError(
          "permission-denied",
          "The first course does not belong to this organization.",
        );
      }

      /*
       * --------------------------------------------------------------
       * TOPIC
       * --------------------------------------------------------------
       */

      const topicRef = db
        .collection("testTopics")
        .doc(firstTopicId);

      const topicSnapshot =
        await transaction.get(topicRef);

      if (!topicSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The first topic could not be found.",
        );
      }

      const topic = topicSnapshot.data();

      if (topic?.courseId !== firstCourseId) {
        throw new HttpsError(
          "failed-precondition",
          "The first topic does not belong to the first course.",
        );
      }

      /*
       * --------------------------------------------------------------
       * CREATE QUESTION
       * --------------------------------------------------------------
       */

      const questionRef =
        db.collection("testQuestions").doc();

      const now = FieldValue.serverTimestamp();

      const normalizedOptions = options.map((option) => ({
        id: option.id.trim(),
        text: option.text.trim(),
      }));

      transaction.create(
        questionRef,
        {
          organizationId: organizationId.trim(),
          courseId: firstCourseId,
          topicId: firstTopicId,

          question: question.trim(),

          type: "multiple-choice",

          options: normalizedOptions,

          correctAnswer: correctAnswer.trim(),

          explanation:
            typeof explanation === "string" &&
            explanation.trim()
              ? explanation.trim()
              : null,

          difficulty,

          tags: [],

          sourceType: "original",

          status: "published",

          createdAt: now,
          updatedAt: now,
        },
      );

      /*
       * --------------------------------------------------------------
       * UPDATE COUNTS
       * --------------------------------------------------------------
       */

      transaction.update(courseRef, {
        questionCount: FieldValue.increment(1),
        updatedAt: now,
      });

      transaction.update(topicRef, {
        questionCount: FieldValue.increment(1),
        updatedAt: now,
      });

      /*
       * --------------------------------------------------------------
       * COMPLETE ONBOARDING
       * --------------------------------------------------------------
       */

      const existingCompletedSteps =
        Array.isArray(onboarding?.completedSteps)
          ? onboarding.completedSteps.filter(
              (step: unknown): step is string =>
                typeof step === "string",
            )
          : [];

      const completedSteps = Array.from(
        new Set([
          ...existingCompletedSteps,
          "first_question",
        ]),
      );

      transaction.update(onboardingRef, {
        firstQuestionId: questionRef.id,
        completedSteps,
        currentStep: "first_question",
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });

      return {
        questionId: questionRef.id,
        organizationId: organizationId.trim(),
        courseId: firstCourseId,
        topicId: firstTopicId,
        question: question.trim(),
        options: normalizedOptions,
        correctAnswer: correctAnswer.trim(),
        difficulty,
        explanation:
          typeof explanation === "string" &&
          explanation.trim()
            ? explanation.trim()
            : null,
        completedSteps,
      };
    });

    return {
      success: true,

      organizationId: result.organizationId,

      question: {
        id: result.questionId,
        organizationId: result.organizationId,
        courseId: result.courseId,
        topicId: result.topicId,
        question: result.question,
        type: "multiple-choice",
        options: result.options,
        correctAnswer: result.correctAnswer,
        difficulty: result.difficulty,
        explanation: result.explanation,
        tags: [],
        sourceType: "original",
        status: "published",
      },

      onboarding: {
        firstQuestionId: result.questionId,
        currentStep: "first_question",
        completedSteps: result.completedSteps,
        status: "completed",
      },
    };
  },
);