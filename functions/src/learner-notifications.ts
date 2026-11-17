/* eslint-disable max-len */
import "./firebase-admin";

import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { EMAIL_FREE_DAILY_LIMIT } from "./email-usage";

/**
 * Learner notifications: tell people when something needs them.
 *
 *   users/{uid}/notifications/{id}         one update (the in-app list, the bell)
 *   users/{uid}/preferences/notifications  { learningEmails: false } turns the daily email off
 *   learnerDigestQueue/{uid}               { pending, lastEmailedAt } per learner (functions only)
 *
 * Updates are written here, by Cloud Functions only:
 * - a manager assigns a course or lesson         (notifyOnCourseAssignment)
 * - a training group assignment is published      (training-group-assignments.ts)
 * - an instructor reviews a submission            (training-group-assignments.ts)
 * - a career path project is reviewed             (notifyOnCareerProjectReview)
 * - work is due within 2 days, or just went overdue (sendLearningUpdates)
 *
 * Email is kept to a minimum (Resend's free plan allows 100 emails a day
 * for the whole platform, see email-usage.ts):
 * - never one email per update: one summary covers everything new;
 * - at most one summary every MIN_DAYS_BETWEEN_EMAILS days per learner,
 *   sooner only when something is due soon or overdue;
 * - at most dailyCap summaries a day for the whole platform, and never
 *   past the free limit minus EMAIL_RESERVE (room for invitations,
 *   password resets and job alerts); the rest wait for the next day;
 * - learners can turn them off; updates still show in the app.
 *
 * Platform switch, no deploy needed (Firebase console, Firestore):
 *   platformSettings/learningEmails  { enabled: false }  stops all summaries
 *                                    { dailyCap: 10 }     changes the daily cap
 *
 * Notification ids are fixed per event, so an update is never written (or
 * emailed) twice.
 */

const REGION = "us-central1";
const TIME_ZONE = "America/New_York";
const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_MS = 2 * DAY_MS;
const DEFAULT_APP_BASE_URL = "https://zebron.org";

/** Default summaries a day (platformSettings/learningEmails.dailyCap overrides it), and the room always left for other platform emails. */
const DEFAULT_DAILY_CAP = 30;
const EMAIL_RESERVE = 30;
/** Days between two summaries to the same learner, unless something is due. */
const MIN_DAYS_BETWEEN_EMAILS = 3;
const MAX_ITEMS_PER_EMAIL = 15;
const MAX_QUEUE_PER_RUN = 300;

export type LearnerNotificationKind =
  | "course_assigned"
  | "assignment_published"
  | "work_reviewed"
  | "project_reviewed"
  | "due_soon"
  | "overdue";

export interface LearnerNotification {
  kind: LearnerNotificationKind;
  title: string;
  body: string;
  /** Path in the app, such as /partner/org/abc/training-groups/xyz. */
  link: string;
}

type Data = FirebaseFirestore.DocumentData;

const clean = (value: unknown, max = 300): string => (typeof value === "string" ? value.trim().slice(0, max) : "");
const millis = (value: unknown): number | null => (value instanceof Timestamp ? value.toMillis() : null);
const safeId = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 300);

function formatDue(value: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

/**
 * Writes one update for a learner (once: the id is fixed per event) and
 * queues them for the daily email. Never throws: a notification must not
 * break the action that caused it.
 */
export async function notifyLearner(uid: string, id: string, notification: LearnerNotification): Promise<boolean> {
  if (!uid || uid.includes("/")) return false;
  const db = getFirestore();
  try {
    await db.doc(`users/${uid}/notifications/${safeId(id)}`).create({
      kind: notification.kind,
      title: clean(notification.title, 200),
      body: clean(notification.body, 600),
      link: clean(notification.link, 300),
      read: false,
      emailedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Already written for this event.
    if ((error as { code?: number }).code === 6) return false;
    logger.warn("Could not write a learner notification.", { uid, id, error });
    return false;
  }
  await db.doc(`learnerDigestQueue/${uid}`).set({ uid, pending: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true }).catch((error: unknown) =>
    logger.warn("Could not queue a learner for the daily email.", { uid, error }),
  );
  return true;
}

/** Notifies several learners (in parallel, a few at a time). */
export async function notifyLearners(entries: Array<{ uid: string; id: string; notification: LearnerNotification }>): Promise<number> {
  let written = 0;
  for (let index = 0; index < entries.length; index += 20) {
    const results = await Promise.all(entries.slice(index, index + 20).map((entry) => notifyLearner(entry.uid, entry.id, entry.notification)));
    written += results.filter(Boolean).length;
  }
  return written;
}

// ============================================================
// EVENTS
// ============================================================

/** A manager assigned a course or a lesson (a new assignment only, not a change). */
export const notifyOnCourseAssignment = onDocumentCreated(
  { document: "organizations/{organizationId}/courseAssignments/{assignmentId}", region: REGION },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { organizationId, assignmentId } = event.params;
    const userId = clean(data.userId, 128);
    const courseTitle = clean(data.courseTitle, 200) || "a course";
    const lessonTitle = clean(data.lessonTitle, 200);
    const due = millis(data.dueAt);
    const by = clean(data.assignedByName, 120);
    const courseId = clean(data.courseId, 128);

    await notifyLearner(userId, `course-assigned-${organizationId}-${assignmentId}`, {
      kind: "course_assigned",
      title: lessonTitle ? `New lesson to complete: ${lessonTitle}` : `New course assigned: ${courseTitle}`,
      body: [
        lessonTitle ? `From the course ${courseTitle}.` : "",
        by ? `Assigned by ${by}.` : "",
        due ? `Due ${formatDue(due)}.` : "",
        clean(data.note, 300),
      ].filter(Boolean).join(" "),
      link: courseId ? `/partner/org/${organizationId}/courses/${courseId}` : `/partner/org/${organizationId}/courses`,
    });
  },
);

/** A career path project was verified or sent back (Learning → Career paths). */
export const notifyOnCareerProjectReview = onDocumentUpdated(
  { document: "careerProjects/{projectId}", region: REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const status = clean(after.status, 20);
    const reviewedAt = millis(after.reviewedAt);
    if (!reviewedAt || reviewedAt === millis(before.reviewedAt) || (status !== "verified" && status !== "needs-work")) return;

    const stepTitle = clean(after.stepTitle, 160) || "your project";
    await notifyLearner(clean(after.userId, 128), `project-review-${event.params.projectId}-${reviewedAt}`, {
      kind: "project_reviewed",
      title: status === "verified" ? `Project verified: ${stepTitle}` : `Changes requested: ${stepTitle}`,
      body: [clean(after.pathTitle, 200) ? `Career path: ${clean(after.pathTitle, 200)}.` : "", clean(after.feedback, 400)].filter(Boolean).join(" "),
      link: `/courses/careers/${clean(after.pathId, 120)}`,
    });
  },
);

// ============================================================
// DAILY: DUE-DATE REMINDERS, THEN ONE EMAIL PER LEARNER
// ============================================================

export const sendLearningUpdates = onSchedule(
  { schedule: "every day 07:17", timeZone: TIME_ZONE, region: REGION, timeoutSeconds: 540 },
  async () => {
    const reminders = await writeDueReminders().catch((error: unknown) => {
      logger.error("Learning reminders failed.", { error });
      return 0;
    });
    const emailed = await queueDigests().catch((error: unknown) => {
      logger.error("Learning summaries failed.", { error });
      return 0;
    });
    logger.info("Learning updates.", { reminders, emailed });
  },
);

/**
 * Work due within 2 days, or that went overdue in the last day, and not done yet:
 * course assignments (organizations/{id}/courseAssignments) and published
 * training group assignments (…/trainingGroups/{id}/assignments).
 * Collection-group range queries on dueAt (see firestore.indexes.json).
 */
async function writeDueReminders(): Promise<number> {
  const db = getFirestore();
  const now = Date.now();
  const from = Timestamp.fromMillis(now - DAY_MS);
  const to = Timestamp.fromMillis(now + DUE_SOON_MS);
  let written = 0;

  // ---------- Course assignments ----------
  const courseAssignments = await db.collectionGroup("courseAssignments").where("dueAt", ">=", from).where("dueAt", "<=", to).get();
  for (const document of courseAssignments.docs) {
    const data = document.data();
    const organizationId = document.ref.parent.parent?.id ?? "";
    const userId = clean(data.userId, 128);
    const courseId = clean(data.courseId, 128);
    const due = millis(data.dueAt);
    if (!organizationId || !userId || !courseId || due === null) continue;
    if (await courseAssignmentDone(userId, organizationId, courseId, clean(data.lessonId, 128) || null)) continue;

    const overdue = due < now;
    const what = clean(data.lessonTitle, 200) || clean(data.courseTitle, 200) || "your course";
    if (await notifyLearner(userId, `${overdue ? "overdue" : "due"}-course-${organizationId}-${document.id}`, {
      kind: overdue ? "overdue" : "due_soon",
      title: overdue ? `Overdue: ${what}` : `Due soon: ${what}`,
      body: overdue ? `It was due ${formatDue(due)}. You can still finish it.` : `Due ${formatDue(due)}.`,
      link: `/partner/org/${organizationId}/courses/${courseId}`,
    })) written++;
  }

  // ---------- Training group assignments ----------
  const groupAssignments = await db.collectionGroup("assignments").where("dueAt", ">=", from).where("dueAt", "<=", to).get();
  for (const document of groupAssignments.docs) {
    const data = document.data();
    const groupRef = document.ref.parent.parent;
    const organizationId = groupRef?.parent.parent?.id ?? "";
    if (!groupRef || groupRef.parent.id !== "trainingGroups" || !organizationId || data.status !== "published") continue;
    const due = millis(data.dueAt);
    if (due === null) continue;
    const overdue = due < now;
    // Overdue work that can't be handed in any more: no reminder.
    if (overdue && data.acceptLate === false) continue;

    const members = await groupRef.collection("members").get();
    const memberIds = members.docs.map((member) => member.id).filter((id) => !id.includes("/"));
    if (!memberIds.length) continue;
    const submissions = await db.getAll(...memberIds.map((id) => document.ref.collection("submissions").doc(id)));
    const title = clean(data.title, 150) || "an assignment";

    const entries = memberIds
      .filter((_, index) => !submissions[index].exists)
      .map((uid) => ({
        uid,
        id: `${overdue ? "overdue" : "due"}-group-${organizationId}-${groupRef.id}-${document.id}`,
        notification: {
          kind: (overdue ? "overdue" : "due_soon") as LearnerNotificationKind,
          title: overdue ? `Overdue: ${title}` : `Due soon: ${title}`,
          body: overdue ? `It was due ${formatDue(due)}. Late work is accepted, so you can still hand it in.` : `Due ${formatDue(due)}. Hand in your work from the training group page.`,
          link: `/partner/org/${organizationId}/training-groups/${groupRef.id}`,
        },
      }));
    written += await notifyLearners(entries);
  }

  return written;
}

/** Same rule as the team progress report (learning-progress.ts). */
async function courseAssignmentDone(userId: string, organizationId: string, courseId: string, lessonId: string | null): Promise<boolean> {
  const db = getFirestore();
  // Organization courses: "<orgId>__<courseId>"; a Zebron course the organization offers: "<courseId>".
  const ids = [`${organizationId}__${courseId}`, courseId];
  const progress = await db.getAll(...ids.map((id) => db.doc(`users/${userId}/courseProgress/${id}`)));
  const index = progress.findIndex((snapshot) => snapshot.exists);
  if (index < 0) return false;
  const record = progress[index];
  if (lessonId) {
    const lessons = record.get("completedLessonIds");
    return Array.isArray(lessons) && lessons.map(String).includes(lessonId);
  }
  if (record.get("status") !== "completed") return false;
  if (record.get("finalExam") !== true) return true;
  const exam = await db.doc(`users/${userId}/courseExams/${ids[index]}`).get();
  return exam.get("passed") === true;
}

/** Today's (UTC) sent emails across the platform (platformEmailUsage, see email-usage.ts). */
async function emailsSentToday(): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const usage = await getFirestore().doc(`platformEmailUsage/day-${day}`).get();
  return Number(usage.get("sent") ?? 0);
}

/** The platform switch and daily cap (platformSettings/learningEmails), with defaults. */
async function emailSettings(): Promise<{ enabled: boolean; dailyCap: number }> {
  const snapshot = await getFirestore().doc("platformSettings/learningEmails").get().catch(() => null);
  const cap = Number(snapshot?.get("dailyCap"));
  return {
    enabled: snapshot?.get("enabled") !== false,
    dailyCap: Number.isFinite(cap) && cap >= 0 ? Math.floor(cap) : DEFAULT_DAILY_CAP,
  };
}

/** One summary email per queued learner, through the email outbox (Resend). */
async function queueDigests(): Promise<number> {
  const db = getFirestore();
  const settings = await emailSettings();
  const baseUrl = (process.env["APP_BASE_URL"]?.trim() || DEFAULT_APP_BASE_URL).replace(/\/+$/, "");
  const budget = settings.enabled ?
    Math.max(0, Math.min(settings.dailyCap, EMAIL_FREE_DAILY_LIMIT - EMAIL_RESERVE - (await emailsSentToday()))) :
    0;
  const now = Date.now();
  const queue = await db.collection("learnerDigestQueue").where("pending", "==", true).limit(MAX_QUEUE_PER_RUN).get();
  let emailed = 0;
  let waiting = 0;

  for (const entry of queue.docs) {
    const uid = entry.id;
    const pendingSnapshot = await db.collection(`users/${uid}/notifications`).where("emailedAt", "==", null).limit(50).get();
    const pending = pendingSnapshot.docs.sort((a, b) => (millis(a.get("createdAt")) ?? 0) - (millis(b.get("createdAt")) ?? 0));
    if (!pending.length) {
      await entry.ref.update({ pending: false });
      continue;
    }

    const [user, preferences] = await Promise.all([db.doc(`users/${uid}`).get(), db.doc(`users/${uid}/preferences/notifications`).get()]);
    const email = clean(user.get("email"), 200);
    const wantsEmail = settings.enabled && preferences.get("learningEmails") !== false && email.includes("@");

    if (wantsEmail) {
      // Not again within a few days, unless something is due soon or overdue.
      const urgent = pending.some((item) => item.get("kind") === "due_soon" || item.get("kind") === "overdue");
      const last = millis(entry.get("lastEmailedAt"));
      if (!urgent && last !== null && now - last < MIN_DAYS_BETWEEN_EMAILS * DAY_MS) continue;
      // Out of today's email room: wait in the queue until tomorrow.
      if (emailed >= budget) {
        waiting++;
        continue;
      }
      const message = buildDigest(user.data() ?? {}, pending.map((item) => item.data()), baseUrl);
      const at = new Date();
      await db.collection("organizationEmailOutbox").add({
        type: "learning_digest",
        recipientEmail: email,
        userId: uid,
        subject: message.subject,
        text: message.text,
        html: message.html,
        status: "pending",
        attemptCount: 0,
        createdAt: at,
        updatedAt: at,
        sentAt: null,
        lastAttemptAt: null,
        nextAttemptAt: at,
        leaseExpiresAt: null,
        lastError: null,
      });
      emailed++;
    } else if (settings.enabled === false) {
      // Emails switched off for the platform: keep the updates for when they come back on.
      continue;
    }

    // Marked even when not emailed (turned off by the learner, no address): they stay in the in-app list.
    const batch = db.batch();
    pending.forEach((item) => batch.update(item.ref, { emailedAt: FieldValue.serverTimestamp() }));
    batch.update(entry.ref, { pending: false, ...(wantsEmail ? { lastEmailedAt: FieldValue.serverTimestamp() } : {}) });
    await batch.commit();
  }

  if (waiting) {
    logger.warn("Learning summaries reached today's email limit; the rest go out tomorrow.", { budget, waiting });
  }
  return emailed;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

function buildDigest(user: Data, items: Data[], baseUrl: string): { subject: string; text: string; html: string } {
  const name = clean(user.preferredName, 60) || clean(user.firstName, 60) || clean(user.displayName, 60);
  const shown = items.slice(-MAX_ITEMS_PER_EMAIL).reverse();
  const more = items.length - shown.length;
  const urgent = items.filter((item) => item.kind === "overdue" || item.kind === "due_soon").length;
  const subject = urgent ?
    `Zebron: ${urgent === 1 ? "1 thing is" : `${urgent} things are`} due soon` :
    `Zebron: ${items.length === 1 ? "1 learning update" : `${items.length} learning updates`}`;
  const allUrl = `${baseUrl}/notifications`;
  const link = (item: Data) => `${baseUrl}${clean(item.link, 300) || "/notifications"}`;

  const text = [
    name ? `Hi ${name},` : "Hi,",
    "",
    "Here is what's new in your learning on Zebron:",
    "",
    ...shown.map((item) => `- ${clean(item.title, 200)}${clean(item.body, 600) ? `\n  ${clean(item.body, 600)}` : ""}\n  ${link(item)}`),
    more > 0 ? `\nAnd ${more} more: ${allUrl}` : "",
    "",
    `See all your updates, or turn these emails off: ${allUrl}`,
  ].join("\n");

  const rows = shown.map((item) =>
    `<li style="margin:0 0 14px"><a href="${escapeHtml(link(item))}" style="color:#007979;font-weight:600">${escapeHtml(clean(item.title, 200))}</a>${clean(item.body, 600) ? `<br><span style="color:#444">${escapeHtml(clean(item.body, 600))}</span>` : ""}</li>`).join("");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#032D42;line-height:1.5">
<p>${name ? `Hi ${escapeHtml(name)},` : "Hi,"}</p>
<p>Here is what's new in your learning on Zebron:</p>
<ul style="padding-left:18px">${rows}</ul>
${more > 0 ? `<p>And ${more} more. <a href="${allUrl}" style="color:#007979">See all your updates</a>.</p>` : ""}
<p style="color:#777;font-size:12px">You get this summary only when there is something new, and at most every few days unless something is due. <a href="${allUrl}" style="color:#007979">See all your updates or turn these emails off</a>.</p>
</div>`;

  return { subject, text, html };
}
