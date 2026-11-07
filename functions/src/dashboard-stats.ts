/* eslint-disable max-len */
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Shared Dashboard Engine: org-wide summaries for dashboard widgets.
 *
 * organizations/{organizationId}/stats/{appId}
 *
 * Dashboards read one small document instead of every member's records
 * (cost rule 1), so showing an org-wide figure costs one read whatever the
 * organization's size. Written only here; managers and above read them
 * (firestore.rules), the same people who can open Team progress.
 *
 * - stats/learning: organizations with Courses.
 * - stats/business: organizations with Business Operations (completed
 *   transactions by month, compliance by status).
 *
 * - refreshDashboardStatsNightly: every active organization, 02:45 ET.
 * - refreshOrganizationStats: on request by a manager, at most every 10 minutes.
 *
 * The learning figures follow getTeamLearningProgress (learning-progress.ts):
 * a course counts as completed when every lesson is done and, if it has a
 * final exam, the exam is passed.
 */

const REGION = "us-central1";
const ROLE_RANK: Record<string, number> = { org_member: 1, org_staff: 2, org_manager: 3, org_admin: 4, org_owner: 5 };
const PARALLEL = 20;
const MAX_MEMBERS = 1000;
const MAX_ORGANIZATIONS = 1000;
const REFRESH_AFTER_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
/** Summaries that can be refreshed on request, and the app that must be active. */
const STATS_APPS: Record<string, string> = { learning: "courses", business: "business-operations" };
const MONTHS = 6;
const MAX_TRANSACTIONS = 20000;
const MAX_COMPLIANCE = 2000;

export const refreshOrganizationStats = onCall({ region: REGION, timeoutSeconds: 120, memory: "512MiB" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to refresh dashboard figures.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  const appId = clean(data.appId) || "learning";
  if (!organizationId || organizationId.includes("/")) {
    throw new HttpsError("invalid-argument", "An organization is required.");
  }
  if (!STATS_APPS[appId]) {
    throw new HttpsError("invalid-argument", "These figures can't be refreshed.");
  }

  const db = getFirestore();
  const [isAdmin, membership] = await Promise.all([
    isPlatformAdministrator(request),
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
  ]);
  const rank = ROLE_RANK[clean(membership.get("role"))] ?? 0;
  if (!isAdmin && (membership.get("active") !== true || rank < 3)) {
    throw new HttpsError("permission-denied", "Only managers, administrators and owners can refresh these figures.");
  }

  const statsRef = db.collection("organizations").doc(organizationId).collection("stats").doc(appId);
  const current = await statsRef.get();
  const updatedAt = (current.get("updatedAt") as Timestamp | undefined)?.toMillis() ?? 0;
  if (Date.now() - updatedAt < REFRESH_AFTER_MS) {
    return { refreshed: false };
  }

  if (appId === "business") {
    await writeBusinessStats(organizationId, "on-request");
  } else {
    await writeLearningStats(organizationId, "on-request");
  }
  return { refreshed: true };
});

export const refreshDashboardStatsNightly = onSchedule(
  { schedule: "every day 02:45", timeZone: "America/New_York", region: REGION, timeoutSeconds: 540, memory: "512MiB" },
  async (): Promise<void> => {
    const db = getFirestore();
    const organizations = await db.collection("organizations").limit(MAX_ORGANIZATIONS).get();

    const candidates = organizations.docs.filter((organization) => {
      const status = organization.get("status") ?? (organization.get("active") === false ? "suspended" : "active");
      return status === "active";
    });
    if (!candidates.length) {
      logger.info("Dashboard stats: no active organizations.");
      return;
    }

    const jobs: { appId: string; write: (organizationId: string, source: "nightly") => Promise<void> }[] = [
      { appId: "learning", write: writeLearningStats },
      { appId: "business", write: writeBusinessStats },
    ];

    for (const job of jobs) {
      const entitlements = await db.getAll(
        ...candidates.map((organization) => organization.ref.collection("applications").doc(STATS_APPS[job.appId])),
      );
      const withApp = candidates.filter((_, index) => entitlements[index].get("status") === "active");

      let done = 0;
      for (const organization of withApp) {
        try {
          await job.write(organization.id, "nightly");
          done += 1;
        } catch (error) {
          logger.error("Dashboard stats failed for an organization.", { organizationId: organization.id, appId: job.appId, error: String(error) });
        }
      }

      logger.info("Dashboard stats refreshed.", { appId: job.appId, organizations: done, of: withApp.length });
    }
  },
);

interface ProgressRecord {
  courseId: string;
  courseTitle: string;
  completedAt: number | null;
  completedLessonIds: string[];
  status: string;
  finalExam: boolean;
  updatedAt: number | null;
  examPassed: boolean;
  certificate: boolean;
}

/** Compute and store organizations/{id}/stats/learning. */
async function writeLearningStats(organizationId: string, source: "nightly" | "on-request"): Promise<void> {
  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);

  const [membershipsSnapshot, coursesCount, assignmentsSnapshot] = await Promise.all([
    db.collection("organizationMemberships").where("organizationId", "==", organizationId).limit(MAX_MEMBERS).get(),
    organizationRef.collection("courses").where("status", "==", "published").count().get(),
    organizationRef.collection("courseAssignments").limit(5000).get(),
  ]);

  const userIds = [...new Set(
    membershipsSnapshot.docs
      .map((document) => document.data())
      .filter((item) => clean(item.userId) && item.active !== false)
      .map((item) => clean(item.userId)),
  )];

  // Each member's progress in this organization's courses, plus their final exams.
  const progressByUser = new Map<string, ProgressRecord[]>();
  for (let index = 0; index < userIds.length; index += PARALLEL) {
    await Promise.all(
      userIds.slice(index, index + PARALLEL).map(async (userId) => {
        const progress = await db.collection("users").doc(userId).collection("courseProgress")
          .where("organizationId", "==", organizationId)
          .get();
        if (progress.empty) {
          progressByUser.set(userId, []);
          return;
        }
        const exams = await db.getAll(...progress.docs.map((document) => db.doc(`users/${userId}/courseExams/${document.id}`)));
        progressByUser.set(userId, progress.docs.map((document, position) => ({
          courseId: clean(document.get("courseId")),
          courseTitle: clean(document.get("courseTitle")),
          completedAt: millis(document.get("completedAt")) ?? (clean(document.get("status")) === "completed" ? millis(document.get("updatedAt")) : null),
          completedLessonIds: Array.isArray(document.get("completedLessonIds")) ? (document.get("completedLessonIds") as unknown[]).map(String) : [],
          status: clean(document.get("status")),
          finalExam: document.get("finalExam") === true,
          updatedAt: millis(document.get("updatedAt")),
          examPassed: exams[position].exists && exams[position].get("passed") === true,
          certificate: exams[position].exists && exams[position].get("passed") === true && !!clean(exams[position].get("certificateCode")),
        })));
      }),
    );
  }

  const now = Date.now();
  const isDone = (record: ProgressRecord | undefined) =>
    !!record && record.status === "completed" && (!record.finalExam || record.examPassed);

  const records = ([] as ProgressRecord[]).concat(...progressByUser.values());
  const coursesStarted = records.length;
  const coursesCompleted = records.filter(isDone).length;

  const assignments = assignmentsSnapshot.docs.map((document) => {
    const userId = clean(document.get("userId"));
    const courseId = clean(document.get("courseId"));
    const lessonId = clean(document.get("lessonId"));
    const record = progressByUser.get(userId)?.find((item) => item.courseId === courseId);
    const done = lessonId ? !!record?.completedLessonIds.includes(lessonId) : isDone(record);
    return { done, dueAt: millis(document.get("dueAt")) };
  });

  // Chart series: completions per week (last 8 weeks, Monday to Sunday, UTC)
  // and per course (top 8).
  const completed = records.filter(isDone);
  const thisWeek = startOfWeek(now);
  const completionsByWeek = Array.from({ length: 8 }, (_, index) => {
    const start = thisWeek - (7 - index) * 7 * DAY_MS;
    const end = start + 7 * DAY_MS;
    return {
      label: new Date(start).toISOString().slice(0, 10),
      value: completed.filter((record) => record.completedAt !== null && record.completedAt >= start && record.completedAt < end).length,
    };
  });
  const byCourse = new Map<string, number>();
  for (const record of completed) {
    const title = record.courseTitle || record.courseId || "Course";
    byCourse.set(title, (byCourse.get(title) ?? 0) + 1);
  }
  const completionsByCourse = [...byCourse.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([label, value]) => ({ label: label.slice(0, 80), value }));

  await organizationRef.collection("stats").doc("learning").set({
    members: userIds.length,
    coursesPublished: coursesCount.data().count,
    learnersStarted: [...progressByUser.values()].filter((list) => list.length > 0).length,
    activeLast7Days: [...progressByUser.values()].filter((list) => list.some((item) => (item.updatedAt ?? 0) >= now - 7 * DAY_MS)).length,
    coursesStarted,
    coursesCompleted,
    completionPercent: coursesStarted ? Math.round((coursesCompleted / coursesStarted) * 100) : 0,
    certificates: records.filter((record) => record.certificate).length,
    assignments: assignments.length,
    assignmentsCompleted: assignments.filter((assignment) => assignment.done).length,
    overdueAssignments: assignments.filter((assignment) => !assignment.done && assignment.dueAt !== null && assignment.dueAt < now).length,
    completionsByWeek,
    completionsByCourse,
    source,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Compute and store organizations/{id}/stats/business: completed
 * transactions by month (this month and the 5 before, UTC) and compliance
 * requirements by status. Every business of the organization is included.
 */
async function writeBusinessStats(organizationId: string, source: "nightly" | "on-request"): Promise<void> {
  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);

  const now = new Date();
  const monthStarts = Array.from({ length: MONTHS + 1 }, (_, index) =>
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1) + index, 1),
  );

  const [transactionsSnapshot, complianceSnapshot] = await Promise.all([
    organizationRef.collection("businessTransactions")
      .where("date", ">=", Timestamp.fromMillis(monthStarts[0]))
      .limit(MAX_TRANSACTIONS)
      .get(),
    organizationRef.collection("businessCompliance").limit(MAX_COMPLIANCE).get(),
  ]);

  const revenue = new Array<number>(MONTHS).fill(0);
  const expenses = new Array<number>(MONTHS).fill(0);

  for (const document of transactionsSnapshot.docs) {
    if (clean(document.get("status")) !== "completed") continue;
    const at = millis(document.get("date"));
    const amount = Number(document.get("amount"));
    if (at === null || !Number.isFinite(amount) || amount < 0) continue;
    const month = monthStarts.findIndex((start, index) => index < MONTHS && at >= start && at < monthStarts[index + 1]);
    if (month < 0) continue;
    if (document.get("type") === "revenue") revenue[month] += amount;
    else if (document.get("type") === "expense") expenses[month] += amount;
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  const label = (index: number) => new Date(monthStarts[index]).toISOString().slice(0, 7);

  const statusLabels: [string, string][] = [
    ["current", "Current"],
    ["upcoming", "Upcoming"],
    ["action_required", "Action required"],
    ["overdue", "Overdue"],
    ["expired", "Expired"],
  ];
  const compliance = complianceSnapshot.docs.map((document) => ({
    status: clean(document.get("status")),
    dueAt: millis(document.get("dueDate")),
  }));
  const soon = now.getTime() + 30 * DAY_MS;
  const last = MONTHS - 1;

  await organizationRef.collection("stats").doc("business").set({
    revenueThisMonth: round(revenue[last]),
    expensesThisMonth: round(expenses[last]),
    netThisMonth: round(revenue[last] - expenses[last]),
    revenueByMonth: revenue.map((value, index) => ({ label: label(index), value: round(value) })),
    expensesByMonth: expenses.map((value, index) => ({ label: label(index), value: round(value) })),
    complianceByStatus: statusLabels.map(([status, name]) => ({
      label: name,
      value: compliance.filter((item) => item.status === status).length,
    })),
    complianceNeedsAttention: compliance.filter((item) => ["action_required", "overdue", "expired"].includes(item.status)).length,
    complianceDueSoon: compliance.filter((item) =>
      item.status !== "not_applicable" && item.dueAt !== null && item.dueAt >= now.getTime() && item.dueAt <= soon,
    ).length,
    complianceTotal: compliance.filter((item) => item.status !== "not_applicable").length,
    transactionsCounted: transactionsSnapshot.size,
    source,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Monday 00:00 UTC of the week containing `time`. */
function startOfWeek(time: number): number {
  const date = new Date(time);
  const day = (date.getUTCDay() + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day);
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function millis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}
