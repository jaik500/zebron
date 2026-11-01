/* eslint-disable max-len */
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Team progress for managers: what each member has started, completed and
 * passed in the organization's courses, and how assignments stand.
 *
 * Learner progress lives in users/{uid}/courseProgress and
 * users/{uid}/courseExams, which only the learner can read, so managers
 * ask this function. Only course progress for this organization is read.
 *
 * Who can call it: platform administrators, and active managers, admins
 * and owners of the organization.
 */

const REGION = "us-central1";

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

/** Members read at once (each one is a small query). */
const PARALLEL = 20;
const MAX_MEMBERS = 1000;

interface ProgressRecord {
  courseId: string;
  completedLessonIds: string[];
  percent: number;
  status: string;
  finalExam: boolean;
  updatedAt: number | null;
  completedAt: number | null;
}

interface ExamRecord {
  passed: boolean;
  certificateCode: string | null;
  passedAt: number | null;
}

export const getTeamLearningProgress = onCall({ region: REGION, timeoutSeconds: 120, memory: "512MiB" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to view team progress.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  if (!organizationId || organizationId.includes("/")) {
    throw new HttpsError("invalid-argument", "An organization is required.");
  }

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);

  const [isAdmin, membership, entitlement] = await Promise.all([
    isPlatformAdministrator(request),
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("courses").get(),
  ]);

  const rank = ROLE_RANK[clean(membership.get("role"))] ?? 0;
  if (!isAdmin && (membership.get("active") !== true || rank < 3)) {
    throw new HttpsError("permission-denied", "Only managers, administrators and owners can view team progress.");
  }

  if (entitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have Courses.");
  }

  // ---------- Members, courses and assignments ----------
  const [membershipsSnapshot, coursesSnapshot, assignmentsSnapshot] = await Promise.all([
    db.collection("organizationMemberships").where("organizationId", "==", organizationId).limit(MAX_MEMBERS).get(),
    organizationRef.collection("courses").where("status", "==", "published").get(),
    organizationRef.collection("courseAssignments").limit(5000).get(),
  ]);

  const memberships = membershipsSnapshot.docs
    .map((document) => document.data())
    .filter((item) => clean(item.userId) && item.active !== false);

  const userIds = [...new Set(memberships.map((item) => clean(item.userId)))];

  const profiles = userIds.length ?
    await db.getAll(...userIds.map((id) => db.collection("users").doc(id))) :
    [];
  const profileById = new Map(profiles.map((snapshot) => [snapshot.id, snapshot.data() ?? {}]));

  const courses = coursesSnapshot.docs
    .map((document) => ({ id: document.id, title: clean(document.get("title")) || document.id }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const courseIds = new Set(courses.map((course) => course.id));

  // ---------- Each member's progress in this organization's courses ----------
  const progressByUser = new Map<string, ProgressRecord[]>();
  const examsByUser = new Map<string, Map<string, ExamRecord>>();

  for (let index = 0; index < userIds.length; index += PARALLEL) {
    await Promise.all(
      userIds.slice(index, index + PARALLEL).map(async (userId) => {
        const progressSnapshot = await db
          .collection("users").doc(userId).collection("courseProgress")
          .where("organizationId", "==", organizationId)
          .get();

        const records: ProgressRecord[] = progressSnapshot.docs.map((document) => ({
          courseId: clean(document.get("courseId")),
          completedLessonIds: Array.isArray(document.get("completedLessonIds")) ? (document.get("completedLessonIds") as unknown[]).map(String) : [],
          percent: Number(document.get("percent") ?? 0),
          status: clean(document.get("status")),
          finalExam: document.get("finalExam") === true,
          updatedAt: millis(document.get("updatedAt")),
          completedAt: millis(document.get("completedAt")),
        }));
        progressByUser.set(userId, records);

        const examRefs = progressSnapshot.docs.map((document) => db.doc(`users/${userId}/courseExams/${document.id}`));
        const exams = new Map<string, ExamRecord>();
        if (examRefs.length) {
          const examSnapshots = await db.getAll(...examRefs);
          examSnapshots.forEach((snapshot, position) => {
            if (snapshot.exists) {
              exams.set(records[position].courseId, {
                passed: snapshot.get("passed") === true,
                certificateCode: clean(snapshot.get("certificateCode")) || null,
                passedAt: millis(snapshot.get("passedAt")),
              });
            }
          });
        }
        examsByUser.set(userId, exams);
      }),
    );
  }

  const courseDone = (record: ProgressRecord | undefined, exam: ExamRecord | undefined) =>
    !!record && record.status === "completed" && (!record.finalExam || exam?.passed === true);

  // ---------- Assignments with their status ----------
  const now = Date.now();
  const assignments = assignmentsSnapshot.docs.map((document) => {
    const userId = clean(document.get("userId"));
    const courseId = clean(document.get("courseId"));
    const lessonId = clean(document.get("lessonId")) || null;
    const record = progressByUser.get(userId)?.find((item) => item.courseId === courseId);
    const exam = examsByUser.get(userId)?.get(courseId);
    const done = lessonId ? !!record?.completedLessonIds.includes(lessonId) : courseDone(record, exam);

    return {
      id: document.id,
      userId,
      userName: clean(document.get("userName")) || nameOf(profileById.get(userId), userId),
      courseId,
      courseTitle: clean(document.get("courseTitle")),
      lessonId,
      lessonTitle: clean(document.get("lessonTitle")) || null,
      dueAt: millis(document.get("dueAt")),
      required: document.get("required") === true,
      status: done ? "completed" : record ? "in_progress" : "not_started",
      percent: lessonId ? (done ? 100 : 0) : Math.round(record?.percent ?? 0),
      completedAt: done ? (lessonId ? record?.updatedAt ?? null : exam?.passedAt ?? record?.completedAt ?? null) : null,
    };
  });

  // ---------- One row per member ----------
  const members = memberships.map((item) => {
    const userId = clean(item.userId);
    const profile = profileById.get(userId);
    const records = (progressByUser.get(userId) ?? []).filter((record) => courseIds.has(record.courseId));
    const exams = examsByUser.get(userId) ?? new Map<string, ExamRecord>();
    const mine = assignments.filter((assignment) => assignment.userId === userId);

    return {
      userId,
      name: clean(item.displayName) || nameOf(profile, userId),
      email: (clean(item.email) || clean(profile?.email)).toLowerCase() || null,
      role: clean(item.role) || "org_member",
      coursesStarted: records.length,
      coursesCompleted: records.filter((record) => courseDone(record, exams.get(record.courseId))).length,
      certificates: [...exams.values()].filter((exam) => exam.passed && exam.certificateCode).length,
      examsPassed: [...exams.values()].filter((exam) => exam.passed).length,
      lastActivity: latestOf(records.map((record) => record.updatedAt)),
      assigned: mine.length,
      assignedDone: mine.filter((assignment) => assignment.status === "completed").length,
      overdue: mine.filter((assignment) => assignment.status !== "completed" && assignment.dueAt !== null && assignment.dueAt < now).length,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  logger.info("Team learning progress.", { organizationId, members: members.length, assignments: assignments.length });

  return { members, assignments, courses, generatedAt: now };
});

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function latestOf(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? Math.max(...known) : null;
}

function millis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

function nameOf(profile: Record<string, unknown> | undefined, fallback: string): string {
  if (!profile) {
    return fallback;
  }
  return (
    clean(profile.displayName) ||
    [clean(profile.firstName), clean(profile.lastName)].filter(Boolean).join(" ") ||
    clean(profile.email) ||
    fallback
  );
}
