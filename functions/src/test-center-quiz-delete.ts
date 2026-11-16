/* eslint-disable max-len */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Delete a Test Center quiz with its topics and questions.
 *
 *   { quizId, action: 'check' | 'delete' }
 *
 * - check: what would go (topics, questions), how many learner results
 *   exist (they are kept: they carry the quiz name), and the courses that
 *   use the quiz as their final exam.
 * - delete: refused while any course (draft or published) uses the quiz
 *   as its final exam; otherwise deletes quizQuestions, quizTopics and the
 *   quiz, and unlinks a Zebron quiz from organizations' programs
 *   (testPrograms.platformQuizIds).
 *
 * Who: platform administrators (any quiz); for an organization's quiz,
 * its active managers, admins and owners while it has the Test Center.
 */

const REGION = "us-central1";
const BATCH = 400;
const MAX_BLOCKERS = 10;

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

interface CourseUse {
  courseId: string;
  title: string;
  status: string;
  organizationId: string | null;
}

export const deleteTestCenterQuiz = onCall({ region: REGION, timeoutSeconds: 300, memory: "512MiB" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to delete a quiz.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const quizId = clean(data.quizId);
  const action = data.action === "delete" ? "delete" : "check";
  if (!quizId || quizId.includes("/")) {
    throw new HttpsError("invalid-argument", "A quiz is required.");
  }

  const db = getFirestore();
  const quizRef = db.doc(`quizzes/${quizId}`);
  const [quiz, isAdmin] = await Promise.all([quizRef.get(), isPlatformAdministrator(request)]);
  if (!quiz.exists) {
    throw new HttpsError("not-found", "This quiz no longer exists.");
  }

  const organizationId = clean(quiz.get("organizationId")) || null;

  // ---------- Who may delete it ----------
  if (!isAdmin) {
    if (!organizationId) {
      throw new HttpsError("permission-denied", "Only Zebron administrators can delete Zebron quizzes.");
    }
    const [membership, entitlement] = await Promise.all([
      db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
      db.doc(`organizations/${organizationId}/applications/test-center`).get(),
    ]);
    const rank = membership.get("active") === true ? ROLE_RANK[clean(membership.get("role"))] ?? 0 : 0;
    if (rank < 3) {
      throw new HttpsError("permission-denied", "Only managers, administrators and owners can delete quizzes.");
    }
    if (entitlement.get("status") !== "active") {
      throw new HttpsError("failed-precondition", "This organization does not have the Test Center.");
    }
  }

  // ---------- What it touches ----------
  const [topics, questions, results, courses, programs] = await Promise.all([
    db.collection("quizTopics").where("quizId", "==", quizId).get(),
    db.collection("quizQuestions").where("quizId", "==", quizId).get(),
    db.collection("quizResults").where("quizId", "==", quizId).count().get(),
    coursesUsing(quizId, organizationId),
    organizationId ?
      Promise.resolve(null) :
      db.collection("testPrograms").where("platformQuizIds", "array-contains", quizId).get(),
  ]);

  const summary = {
    quizName: clean(quiz.get("name")) || "Quiz",
    topics: topics.size,
    questions: questions.size,
    results: results.data().count,
    linkedOrganizations: programs ? new Set(programs.docs.map((program) => clean(program.get("organizationId")))).size : 0,
    courses: courses.slice(0, MAX_BLOCKERS),
    blocked: courses.length > 0,
  };

  if (action === "check") {
    return summary;
  }

  if (summary.blocked) {
    throw new HttpsError(
      "failed-precondition",
      `This quiz is the final exam of ${courses.length === 1 ? "a course" : `${courses.length} courses`} (${courses.slice(0, 3).map((course) => course.title).join(", ")}). Choose another exam for ${courses.length === 1 ? "it" : "them"} first.`,
    );
  }

  // ---------- Delete ----------
  const refs = [...questions.docs, ...topics.docs].map((document) => document.ref);
  for (let index = 0; index < refs.length; index += BATCH) {
    const batch = db.batch();
    refs.slice(index, index + BATCH).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  if (programs?.size) {
    for (let index = 0; index < programs.docs.length; index += BATCH) {
      const batch = db.batch();
      programs.docs.slice(index, index + BATCH).forEach((program) =>
        batch.update(program.ref, { platformQuizIds: FieldValue.arrayRemove(quizId), updatedAt: FieldValue.serverTimestamp() }),
      );
      await batch.commit();
    }
  }

  await quizRef.delete();

  logger.info("Test Center quiz deleted.", {
    quizId,
    organizationId,
    by: uid,
    topics: summary.topics,
    questions: summary.questions,
    resultsKept: summary.results,
    unlinkedPrograms: programs?.size ?? 0,
  });

  return { ...summary, deleted: true };
});

/**
 * Courses whose final exam is this quiz. An organization's quiz can only be
 * used by that organization's courses; a Zebron quiz by Zebron's courses
 * and by any organization's courses.
 */
async function coursesUsing(quizId: string, organizationId: string | null): Promise<CourseUse[]> {
  const db = getFirestore();
  const owners: (string | null)[] = organizationId ?
    [organizationId] :
    [null, ...(await db.collection("organizations").select().get()).docs.map((document) => document.id)];

  const found: CourseUse[] = [];
  for (let index = 0; index < owners.length; index += 20) {
    const snapshots = await Promise.all(
      owners.slice(index, index + 20).map((owner) => {
        const collection = owner ? db.collection(`organizations/${owner}/courses`) : db.collection("courses");
        return collection.where("finalExam.quizId", "==", quizId).get().then((snapshot) => ({ owner, snapshot }));
      }),
    );
    for (const { owner, snapshot } of snapshots) {
      snapshot.docs.forEach((document) => found.push({
        courseId: document.id,
        title: clean(document.get("title")) || document.id,
        status: clean(document.get("status")) || "draft",
        organizationId: owner,
      }));
    }
  }
  return found;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
