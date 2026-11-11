/* eslint-disable max-len */
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * The public job board (jobs/{jobId}): listings platform admins copy from
 * other sites so job seekers can find work. Apply links go to the employer.
 *
 * expireJobListings (daily): closes active listings 5 days after their
 *   application deadline, or 60 days after they were posted when there is
 *   no deadline. Keep the rule in step with jobExpiresAtMillis in
 *   src/app/core/models/job.model.ts (the board hides them at once).
 *
 * sendJobAlerts (daily): emails each job alert (users/{uid}/jobAlerts) the
 *   new listings that match it since its last email, through the
 *   organizationEmailOutbox worker (Resend).
 */

const REGION = "us-central1";
const TIME_ZONE = "America/New_York";
const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_AFTER_DEADLINE = 2;
const DAYS_WITHOUT_DEADLINE = 60;
const MAX_JOBS_PER_EMAIL = 10;
const DEFAULT_APP_BASE_URL = "https://zebron.org";

type Data = FirebaseFirestore.DocumentData;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function millis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

/** When a listing closes on its own, in milliseconds (null when no date is known). */
export function expiresAtMillis(job: Data): number | null {
  const deadline = millis(job.applicationDeadline);
  if (deadline !== null) {
    return deadline + DAYS_AFTER_DEADLINE * DAY_MS;
  }
  const posted = millis(job.postedAt) ?? millis(job.createdAt);
  return posted === null ? null : posted + DAYS_WITHOUT_DEADLINE * DAY_MS;
}

// ------------------------------------------------------------
// Expiry
// ------------------------------------------------------------

export const expireJobListings = onSchedule(
  { schedule: "every day 02:10", timeZone: TIME_ZONE, region: REGION },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    // Active listings are a curated set (hundreds, not millions): read them all.
    const snapshot = await db.collection("jobs").where("status", "==", "active").get();

    let closed = 0;
    let batch = db.batch();
    let pending = 0;

    for (const doc of snapshot.docs) {
      const job = doc.data();
      const stored = millis(job.expiresAt);
      const expires = stored ?? expiresAtMillis(job);

      if (expires !== null && now >= expires) {
        batch.update(doc.ref, { status: "closed", closedReason: "expired", updatedAt: FieldValue.serverTimestamp() });
        closed++;
      } else if (stored === null && expires !== null) {
        // Older listings: record the expiry so the board and admins can see it.
        batch.update(doc.ref, { expiresAt: Timestamp.fromMillis(expires) });
      } else {
        continue;
      }

      if (++pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) {
      await batch.commit();
    }

    logger.info("Job listings expired", { active: snapshot.size, closed });
  },
);

// ------------------------------------------------------------
// Job alerts
// ------------------------------------------------------------

interface Listing {
  id: string;
  title: string;
  employer: string;
  place: string;
  arrangement: string;
  employmentType: string;
  state: string;
  createdAt: number;
  searchable: string;
}

function toListing(id: string, job: Data): Listing {
  const location = (job.location ?? {}) as Data;
  const place = [text(location.city), text(location.state)].filter(Boolean).join(", ") || text(location.country);
  const skills = Array.isArray(job.skills) ? job.skills.filter((skill: unknown) => typeof skill === "string") : [];
  return {
    id,
    title: text(job.title),
    employer: text(job.organizationName),
    place,
    arrangement: text(job.workArrangement),
    employmentType: text(job.employmentType),
    state: text(location.state).toUpperCase(),
    createdAt: millis(job.createdAt) ?? 0,
    searchable: [job.title, job.organizationName, job.description, job.categoryName, ...skills, ...(Array.isArray(job.tags) ? job.tags : [])]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase(),
  };
}

/** Every keyword must appear somewhere in the listing; empty filters match everything. */
export function matchesAlert(listing: Listing, alert: Data): boolean {
  const words = text(alert.keywords).toLowerCase().split(/\s+/).filter(Boolean);
  if (words.some((word) => !listing.searchable.includes(word))) {
    return false;
  }
  const state = text(alert.state).toUpperCase();
  if (state && listing.state !== state) {
    return false;
  }
  if (text(alert.workArrangement) && listing.arrangement !== text(alert.workArrangement)) {
    return false;
  }
  if (text(alert.employmentType) && listing.employmentType !== text(alert.employmentType)) {
    return false;
  }
  return true;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

function describeAlert(alert: Data): string {
  const parts = [
    text(alert.keywords) ? `"${text(alert.keywords)}"` : "",
    text(alert.state),
    text(alert.workArrangement),
    text(alert.employmentType),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "all new jobs";
}

function buildEmail(alert: Data, listings: Listing[], more: number, baseUrl: string): { subject: string; text: string; html: string } {
  const label = describeAlert(alert);
  const manageUrl = `${baseUrl}/jobs/my`;
  // The job board with this alert's filters.
  const search = new URLSearchParams(Object.entries({
    q: text(alert.keywords),
    location: text(alert.state),
    arrangement: text(alert.workArrangement),
    type: text(alert.employmentType),
  }).filter(([, value]) => value)).toString();
  const boardUrl = `${baseUrl}/jobs${search ? `?${search}` : ""}`;
  const subject = listings.length === 1 ?
    `1 new job for ${label} on Zebron` :
    `${listings.length + more} new jobs for ${label} on Zebron`;

  const lines = listings.map((listing) =>
    `${listing.title} - ${listing.employer}${listing.place ? ` (${listing.place})` : ""}\n${baseUrl}/jobs/${listing.id}`);

  const textBody = [
    `New jobs on the Zebron job board for ${label}:`,
    "",
    lines.join("\n\n"),
    more > 0 ? `\nand ${more} more: ${boardUrl}` : `\nSee all matching jobs: ${boardUrl}`,
    "",
    `Change or stop this alert: ${manageUrl}`,
  ].join("\n");

  const items = listings.map((listing) =>
    `<li style="margin:0 0 12px"><a href="${baseUrl}/jobs/${encodeURIComponent(listing.id)}" style="color:#007979;font-weight:600">${escapeHtml(listing.title)}</a><br><span style="color:#555">${escapeHtml(listing.employer)}${listing.place ? ` · ${escapeHtml(listing.place)}` : ""}</span></li>`).join("");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#032D42">
<p>New jobs on the Zebron job board for <strong>${escapeHtml(label)}</strong>:</p>
<ul style="padding-left:18px">${items}</ul>
<p>${more > 0 ? `And ${more} more. ` : ""}<a href="${escapeHtml(boardUrl)}" style="color:#007979">See all matching jobs on the job board</a>.</p>
<p style="color:#777;font-size:12px">You get this email because you set a job alert on Zebron. <a href="${manageUrl}" style="color:#007979">Change or stop this alert</a>.</p>
</div>`;

  return { subject, text: textBody, html };
}

export const sendJobAlerts = onSchedule(
  { schedule: "every day 07:41", timeZone: TIME_ZONE, region: REGION, timeoutSeconds: 300 },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const baseUrl = (process.env["APP_BASE_URL"]?.trim() || DEFAULT_APP_BASE_URL).replace(/\/+$/, "");

    const jobsSnapshot = await db.collection("jobs").where("status", "==", "active").get();
    const listings = jobsSnapshot.docs
      .filter((doc) => {
        const expires = millis(doc.get("expiresAt")) ?? expiresAtMillis(doc.data());
        return expires === null || now < expires;
      })
      .map((doc) => toListing(doc.id, doc.data()))
      .sort((a, b) => b.createdAt - a.createdAt);

    const newest = listings[0]?.createdAt ?? 0;
    if (newest < now - 7 * DAY_MS) {
      logger.info("Job alerts: no new listings this week");
      return;
    }

    // Unfiltered collection-group read: no index needed. Alerts are few (5 per person at most).
    const alerts = await db.collectionGroup("jobAlerts").get();
    const emails = new Map<string, string | null>();
    let sent = 0;

    for (const alertDoc of alerts.docs) {
      const alert = alertDoc.data();
      if (alert.active !== true) {
        continue;
      }

      // New since the last email (at most the last 7 days; the last day for a new alert).
      const since = Math.max(millis(alert.lastSentAt) ?? millis(alert.createdAt) ?? now - DAY_MS, now - 7 * DAY_MS);
      const matches = listings.filter((listing) => listing.createdAt > since && matchesAlert(listing, alert));
      if (matches.length === 0) {
        continue;
      }

      const uid = alertDoc.ref.parent.parent?.id;
      if (!uid) {
        continue;
      }

      if (!emails.has(uid)) {
        const user = await db.doc(`users/${uid}`).get();
        const email = text(user.get("email"));
        emails.set(uid, email.includes("@") ? email : null);
      }
      const recipientEmail = emails.get(uid);
      if (!recipientEmail) {
        continue;
      }

      const shown = matches.slice(0, MAX_JOBS_PER_EMAIL);
      const message = buildEmail(alert, shown, matches.length - shown.length, baseUrl);
      const at = new Date();

      const batch = db.batch();
      batch.create(db.collection("organizationEmailOutbox").doc(), {
        type: "job_alert",
        recipientEmail,
        userId: uid,
        alertId: alertDoc.id,
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
      batch.update(alertDoc.ref, { lastSentAt: FieldValue.serverTimestamp() });
      await batch.commit();
      sent++;
    }

    logger.info("Job alerts sent", { listings: listings.length, alerts: alerts.size, sent });
  },
);
