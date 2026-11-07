/* eslint-disable max-len */
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { strings, text } from "./exam-engine";
import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Lesson completion, recorded on the server.
 *
 *   completeCourseLesson({ organizationId, courseId, lessonId, checkScore, day })
 *
 * Learners cannot write users/{uid}/courseProgress themselves (rules deny
 * it), so completion figures, the final-exam gate (course-exams.ts), team
 * progress and dashboards rest on records this function wrote after
 * checking that:
 * - the learner may open the course (published, or a preview by platform
 *   administrators and organization staff and above; for organization
 *   courses an active membership and an active Courses app);
 * - the lesson is in the course's current outline.
 *
 * Percent and status are worked out here from the outline. The first
 * score of a lesson's quick checks is kept; minutes are added to the
 * learner's day only the first time a lesson is completed.
 */

const REGION = "us-central1";
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_DAYS = 60;

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

interface OutlineLesson {
  id: string;
  minutes: number;
}

function outlineOf(course: FirebaseFirestore.DocumentData): OutlineLesson[] {
  return (Array.isArray(course.modules) ? course.modules : [])
    .flatMap((module: { lessons?: unknown }) => (Array.isArray(module?.lessons) ? module.lessons : []))
    .map((lesson: { id?: unknown; minutes?: unknown }) => ({
      id: text(lesson?.id),
      minutes: Number.isFinite(Number(lesson?.minutes)) ? Number(lesson.minutes) : 5,
    }))
    .filter((lesson: OutlineLesson) => lesson.id);
}

/** The learner's local day ('YYYY-MM-DD') when it is within a day of now, else today in UTC. */
function dayOf(value: unknown, now = Date.now()): string {
  const day = text(value);
  if (DAY_PATTERN.test(day)) {
    const millis = Date.parse(`${day}T12:00:00Z`);
    if (Number.isFinite(millis) && Math.abs(millis - now) <= 1.5 * DAY_MS) {
      return day;
    }
  }
  return new Date(now).toISOString().slice(0, 10);
}

function numbers(value: unknown): Record<string, number> {
  const entries = value && typeof value === "object" ? Object.entries(value as Record<string, unknown>) : [];
  return Object.fromEntries(entries.filter(([, item]) => typeof item === "number" && Number.isFinite(item)) as [string, number][]);
}

function trimActivity(activity: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(activity)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, ACTIVITY_DAYS),
  );
}

export const completeCourseLesson = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to save your progress.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const courseId = text(data.courseId);
  const lessonId = text(data.lessonId);
  const organizationId = text(data.organizationId) || null;
  const rawScore = data.checkScore;

  if (!courseId || courseId.includes("/") || !lessonId || (organizationId ?? "").includes("/")) {
    throw new HttpsError("invalid-argument", "A course and a lesson are required.");
  }
  if (rawScore !== null && rawScore !== undefined && (typeof rawScore !== "number" || !Number.isFinite(rawScore))) {
    throw new HttpsError("invalid-argument", "The quick-check score must be a number.");
  }

  const db = getFirestore();
  const uid = request.auth.uid;
  const isAdmin = await isPlatformAdministrator(request);

  const courseRef = organizationId ?
    db.doc(`organizations/${organizationId}/courses/${courseId}`) :
    db.doc(`courses/${courseId}`);

  const [courseSnapshot, membership, entitlement, organization, profile] = await Promise.all([
    courseRef.get(),
    organizationId ? db.doc(`organizationMemberships/${uid}_${organizationId}`).get() : Promise.resolve(null),
    organizationId ? db.doc(`organizations/${organizationId}/applications/courses`).get() : Promise.resolve(null),
    organizationId ? db.doc(`organizations/${organizationId}`).get() : Promise.resolve(null),
    db.doc(`users/${uid}`).get(),
  ]);

  const course = courseSnapshot.data();
  if (!courseSnapshot.exists || !course) {
    throw new HttpsError("not-found", "This course is not available.");
  }

  const rank = membership?.get("active") === true ? ROLE_RANK[text(membership.get("role"))] ?? 0 : 0;

  if (organizationId && !isAdmin) {
    const status = text(organization?.get("status")) || (organization?.get("active") === false ? "suspended" : "active");
    if (!organization?.exists || status !== "active" || rank < 1 || entitlement?.get("status") !== "active") {
      throw new HttpsError("permission-denied", "This course is for members of the organization.");
    }
  }

  // Drafts may be previewed by platform administrators and organization staff and above.
  const canPreview = isAdmin || (!!organizationId && rank >= 2);
  if (course.status !== "published" && !canPreview) {
    throw new HttpsError("not-found", "This course is not available.");
  }

  const outline = outlineOf(course);
  const lesson = outline.find((item) => item.id === lessonId);
  if (!lesson) {
    throw new HttpsError("failed-precondition", "This lesson is not part of the course.");
  }

  const progressId = organizationId ? `${organizationId}__${courseId}` : courseId;
  const progressRef = db.doc(`users/${uid}/courseProgress/${progressId}`);
  const day = dayOf(data.day);
  const learnerName =
    text(profile.get("displayName")) ||
    [text(profile.get("firstName")), text(profile.get("lastName"))].filter(Boolean).join(" ") ||
    text(request.auth.token?.name) ||
    text(request.auth.token?.email).split("@")[0] ||
    "Zebron learner";

  const result = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(progressRef);
    const previous = existing.data() ?? {};

    const done = new Set(strings(previous.completedLessonIds));
    const isNewLesson = !done.has(lessonId);
    done.add(lessonId);

    // Only lessons still in the outline count, in outline order.
    const completedLessonIds = outline.map((item) => item.id).filter((id) => done.has(id));
    const percent = outline.length ? Math.round((completedLessonIds.length * 100) / outline.length) : 0;
    const finished = outline.length > 0 && completedLessonIds.length === outline.length;
    const justCompleted = finished && previous.status !== "completed";

    const checkScores = numbers(previous.checkScores);
    if (typeof rawScore === "number" && checkScores[lessonId] === undefined) {
      checkScores[lessonId] = Math.max(0, Math.min(100, Math.round(rawScore)));
    }

    const activity = numbers(previous.activity);
    if (isNewLesson) {
      activity[day] = (activity[day] ?? 0) + Math.max(1, Math.round(lesson.minutes));
    }

    transaction.set(progressRef, {
      userId: uid,
      courseId,
      organizationId,
      courseTitle: text(course.title),
      cover: text(course.cover) || "teal",
      lessonCount: outline.length,
      finalExam: !!(course.finalExam && typeof course.finalExam === "object" && text(course.finalExam.quizId)),
      completedLessonIds,
      lastLessonId: lessonId,
      percent,
      status: finished ? "completed" : "in_progress",
      checkScores,
      activity: trimActivity(activity),
      learnerName: text(previous.learnerName) || learnerName,
      skills: strings(course.skills),
      startedAt: previous.startedAt instanceof Timestamp ? previous.startedAt : FieldValue.serverTimestamp(),
      completedAt: justCompleted ?
        FieldValue.serverTimestamp() :
        (previous.completedAt instanceof Timestamp ? previous.completedAt : null),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { completedLessonIds, percent, status: finished ? "completed" : "in_progress", justCompleted };
  });

  logger.info("Lesson completed", { courseId, organizationId, lessonId, percent: result.percent });

  return result;
});
