import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

type FirstTopicInput = {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
};

/**
 * Validates that a value is a string within the requested length range.
 *
 * @param value Value to validate.
 * @param minLength Minimum allowed length.
 * @param maxLength Maximum allowed length.
 * @returns True when the value is a valid string in the requested range.
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
 * Normalizes a topic slug for consistent storage and comparison.
 *
 * @param value Slug value to normalize.
 * @returns Normalized lowercase slug.
 */
function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const completeOrganizationFirstTopic = onCall(
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

    const callerUid = request.auth.uid;
    const data = request.data as Partial<FirstTopicInput>;

    const organizationId = data.organizationId;
    const name = data.name;
    const slug = data.slug;
    const description = data.description;
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

    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      throw new HttpsError(
        "invalid-argument",
        "Topic slug is invalid.",
      );
    }

    const result = await db.runTransaction(
      async (transaction) => {
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

        if (role !== "org_owner" && role !== "org_admin") {
          throw new HttpsError(
            "permission-denied",
            "Only an organization owner or administrator can complete " +
    "onboarding.",
          );
        }

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

        if (onboarding?.currentStep !== "first_topic") {
          throw new HttpsError(
            "failed-precondition",
            "The current onboarding step is " +
            `"${onboarding?.currentStep ?? "unknown"}", ` +
            "not \"first_topic\".",
          );
        }

        const firstCourseId = onboarding?.firstCourseId;

        if (
          typeof firstCourseId !== "string" ||
          !firstCourseId.trim()
        ) {
          throw new HttpsError(
            "failed-precondition",
            "The first course has not been configured.",
          );
        }

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

        if (course?.organizationId !== organizationId) {
          throw new HttpsError(
            "permission-denied",
            "The first course does not belong to this organization.",
          );
        }

        const existingTopicId = onboarding?.firstTopicId;

        if (
          typeof existingTopicId === "string" &&
          existingTopicId.length > 0
        ) {
          throw new HttpsError(
            "already-exists",
            "The organization already has a first topic configured.",
          );
        }

        const existingTopicQuery = db
          .collection("testTopics")
          .where("courseId", "==", firstCourseId)
          .where("slug", "==", normalizedSlug)
          .limit(1);

        const existingTopicSnapshot =
          await transaction.get(existingTopicQuery);

        if (!existingTopicSnapshot.empty) {
          const duplicateTopicMessage =
    `A topic with the slug "${normalizedSlug}" already exists ` +
    "in this course.";

          throw new HttpsError(
            "already-exists",
            duplicateTopicMessage,
          );
        }

        const existingTopicsQuery = db
          .collection("testTopics")
          .where("courseId", "==", firstCourseId);

        const existingTopicsSnapshot =
          await transaction.get(existingTopicsQuery);

        let nextSortOrder = 0;

        for (const topicDocument of existingTopicsSnapshot.docs) {
          const topicSortOrder = topicDocument.data().sortOrder;

          if (
            typeof topicSortOrder === "number" &&
            Number.isFinite(topicSortOrder)
          ) {
            nextSortOrder = Math.max(
              nextSortOrder,
              topicSortOrder + 1,
            );
          }
        }

        const topicRef = db
          .collection("testTopics")
          .doc();

        const now = FieldValue.serverTimestamp();

        transaction.create(
          topicRef,
          {
            organizationId,
            courseId: firstCourseId,
            name: name.trim(),
            slug: normalizedSlug,
            description:
              typeof description === "string" &&
              description.trim() ?
                description.trim() :
                null,
            sortOrder: nextSortOrder,
            questionCount: 0,
            active,
            createdBy: callerUid,
            createdAt: now,
            updatedAt: now,
          },
        );

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
            "first_topic",
          ]),
        );

        transaction.update(
          onboardingRef,
          {
            firstTopicId: topicRef.id,
            completedSteps,
            currentStep: "first_question",
            status: "in_progress",
            completedAt: null,
            updatedAt: now,
          },
        );

        return {
          topicId: topicRef.id,
          organizationId,
          courseId: firstCourseId,
          name: name.trim(),
          slug: normalizedSlug,
          description:
            typeof description === "string" &&
            description.trim() ?
              description.trim() :
              null,
          sortOrder: nextSortOrder,
          questionCount: 0,
          active,
          currentStep: "first_question" as const,
          completedSteps,
        };
      },
    );

    return {
      success: true,
      topic: {
        id: result.topicId,
        organizationId: result.organizationId,
        courseId: result.courseId,
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
        status: "in_progress" as const,
      },
    };
  },
);
