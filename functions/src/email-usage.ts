/* eslint-disable max-len */
import "./firebase-admin";

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Platform email usage, so administrators can see the email provider's
 * free-plan limits coming (Resend free plan: 100 a day, 3,000 a month;
 * received emails count too).
 *
 *   platformEmailUsage/day-YYYY-MM-DD   { sent, received, bySource.<source> }
 *   platformEmailUsage/month-YYYY-MM    { sent, received, bySource.<source> }
 *
 * Dates are UTC. Written only by Cloud Functions; platform administrators
 * can read them (see firestore.rules). Counting never blocks or fails
 * the email itself.
 */

export type EmailDirection = "sent" | "received";

export const EMAIL_FREE_DAILY_LIMIT = 100;
export const EMAIL_FREE_MONTHLY_LIMIT = 3000;

export async function recordEmailUsage(
  direction: EmailDirection,
  source: string,
  count = 1,
): Promise<void> {
  if (count <= 0) {
    return;
  }

  try {
    const now = new Date().toISOString();
    const day = now.slice(0, 10);
    const month = now.slice(0, 7);
    const sourceKey = source.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "other";

    const db = getFirestore();
    const update = {
      [direction]: FieldValue.increment(count),
      // Nested object (not a dotted key): set() with merge treats dots literally.
      bySource: { [sourceKey]: FieldValue.increment(count) },
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(db.collection("platformEmailUsage").doc(`day-${day}`), { period: day, ...update }, { merge: true });
    batch.set(db.collection("platformEmailUsage").doc(`month-${month}`), { period: month, ...update }, { merge: true });
    await batch.commit();
  } catch (error) {
    logger.warn("Could not record email usage.", { direction, source, error });
  }
}
