/* eslint-disable max-len */
import "./firebase-admin";

import { createHash } from "node:crypto";

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { requirePlatformAdministrator } from "./platform-admin-authorization";

/**
 * "Report a problem" on a resource page (resourceReports collection).
 *
 * Reports go through these functions, not straight to Firestore: the
 * checks would not fit in the Firestore rules' compiled-size limit, and a
 * function can limit how many reports one visitor sends.
 *
 *   reportResourceProblem   anyone (guests too); at most HOURLY_LIMIT per
 *                           visitor per hour (by account, else by IP hash)
 *   closeResourceReport     platform administrators: resolved or dismissed
 *
 * firestore.rules: platform administrators read resourceReports; nobody
 * writes from the app. resourceReportLimits is server-only.
 */

const REGION = "us-central1";
const HOURLY_LIMIT = 10;
const REASONS = ["closed", "phone", "address", "hours", "link", "eligibility", "other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const reportResourceProblem = onCall({ region: REGION }, async (request) => {
  const data = (request.data ?? {}) as Record<string, unknown>;
  const resourceId = text(data.resourceId, 100);
  const reason = text(data.reason, 20);
  const details = text(data.details, 1000);
  const contactEmail = text(data.contactEmail, 200);

  if (!/^[A-Za-z0-9_-]{1,100}$/.test(resourceId)) {
    throw new HttpsError("invalid-argument", "Choose a resource.");
  }
  if (!REASONS.includes(reason)) {
    throw new HttpsError("invalid-argument", "Choose what is wrong.");
  }
  if (contactEmail && !EMAIL.test(contactEmail)) {
    throw new HttpsError("invalid-argument", "Enter a valid email address, or leave it empty.");
  }

  const db = getFirestore();
  const resource = await db.collection("resources").doc(resourceId).get();
  if (!resource.exists || resource.get("status") !== "published") {
    throw new HttpsError("not-found", "That resource is no longer listed.");
  }

  // At most HOURLY_LIMIT reports per visitor per hour.
  const uid = request.auth?.uid ?? null;
  const visitor = uid ?? createHash("sha256").update(String(request.rawRequest?.ip ?? "unknown")).digest("hex").slice(0, 32);
  const hour = new Date().toISOString().slice(0, 13).replace(/[-T]/g, "");
  const limitRef = db.collection("resourceReportLimits").doc(`${hour}_${visitor}`);

  await db.runTransaction(async (transaction) => {
    const limit = await transaction.get(limitRef);
    const count = Number(limit.get("count") ?? 0);
    if (count >= HOURLY_LIMIT) {
      throw new HttpsError("resource-exhausted", "You have sent several reports already. Please try again in an hour.");
    }
    transaction.set(limitRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.create(db.collection("resourceReports").doc(), {
      resourceId,
      resourceName: String(resource.get("name") ?? "").slice(0, 200),
      resourceSlug: String(resource.get("slug") ?? "").slice(0, 200),
      reason,
      details,
      contactEmail,
      reportedBy: uid,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

export const closeResourceReport = onCall({ region: REGION }, async (request) => {
  await requirePlatformAdministrator(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const reportId = text(data.reportId, 100);
  const status = text(data.status, 20);

  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reportId) || !["resolved", "dismissed", "open"].includes(status)) {
    throw new HttpsError("invalid-argument", "Choose a report and what to do with it.");
  }

  const ref = getFirestore().collection("resourceReports").doc(reportId);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "That report no longer exists.");
  }
  await ref.update({
    status,
    resolvedBy: status === "open" ? null : request.auth!.uid,
    resolvedAt: status === "open" ? null : FieldValue.serverTimestamp(),
  });
  return { ok: true };
});
