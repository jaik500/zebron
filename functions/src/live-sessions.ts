/* eslint-disable max-len */
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Virtual Classroom: register for, or cancel, a live session.
 *
 * organizations/{id}/liveSessions/{sessionId}
 *   registeredCount is kept here so capacity is enforced in one transaction.
 * organizations/{id}/liveSessions/{sessionId}/registrations/{uid}
 *
 * Members of the organization register themselves. The meeting itself runs
 * in Zoom, Google Meet, Teams, Jitsi or any tool: Zebron keeps the link.
 */

const REGION = "us-central1";

export const registerForLiveSession = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to register.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  const sessionId = clean(data.sessionId);
  const action = data.action === "cancel" ? "cancel" : "register";

  if (!organizationId || !sessionId || organizationId.includes("/") || sessionId.includes("/")) {
    throw new HttpsError("invalid-argument", "A session is required.");
  }

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const sessionRef = organizationRef.collection("liveSessions").doc(sessionId);
  const registrationRef = sessionRef.collection("registrations").doc(uid);

  const [membership, entitlement, profile, isAdmin] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("virtual-classroom").get(),
    db.collection("users").doc(uid).get(),
    isPlatformAdministrator(request),
  ]);

  if (!isAdmin && membership.get("active") !== true) {
    throw new HttpsError("permission-denied", "Live sessions are for members of the organization.");
  }

  if (entitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have the Virtual Classroom.");
  }

  const learnerName =
    clean(membership.get("displayName")) ||
    clean(profile.get("displayName")) ||
    [clean(profile.get("firstName")), clean(profile.get("lastName"))].filter(Boolean).join(" ") ||
    clean(profile.get("email")) ||
    "Member";

  const result = await db.runTransaction(async (transaction) => {
    const [session, registration] = await Promise.all([transaction.get(sessionRef), transaction.get(registrationRef)]);

    if (!session.exists) {
      throw new HttpsError("not-found", "This session no longer exists.");
    }

    const count = Number(session.get("registeredCount") ?? 0);

    if (action === "cancel") {
      if (registration.exists) {
        transaction.delete(registrationRef);
        transaction.update(sessionRef, { registeredCount: Math.max(0, count - 1), updatedAt: FieldValue.serverTimestamp() });
      }
      return { registered: false, registeredCount: Math.max(0, count - (registration.exists ? 1 : 0)) };
    }

    if (registration.exists) {
      return { registered: true, registeredCount: count };
    }

    if (session.get("status") === "cancelled") {
      throw new HttpsError("failed-precondition", "This session was cancelled.");
    }

    const startAt = session.get("startAt") as Timestamp | undefined;
    const minutes = Number(session.get("durationMinutes") ?? 60);
    if (startAt && startAt.toMillis() + minutes * 60_000 < Date.now()) {
      throw new HttpsError("failed-precondition", "This session has ended.");
    }

    const capacity = Number(session.get("capacity") ?? 0);
    if (capacity > 0 && count >= capacity) {
      throw new HttpsError("resource-exhausted", "This session is full.");
    }

    transaction.set(registrationRef, {
      userId: uid,
      name: learnerName,
      email: clean(profile.get("email")).toLowerCase() || null,
      attended: false,
      registeredAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sessionRef, { registeredCount: count + 1, updatedAt: FieldValue.serverTimestamp() });

    return { registered: true, registeredCount: count + 1 };
  });

  logger.info("Live session registration.", { organizationId, sessionId, action });

  return result;
});

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
