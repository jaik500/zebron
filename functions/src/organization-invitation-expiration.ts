import {getFirestore} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";

const BATCH_SIZE = 500;

type FirestoreLike = ReturnType<typeof getFirestore>;

/**
 * Expires pending organization invitations whose expiration time has passed.
 *
 * @param now Current time used to determine whether an invitation has expired.
 * @param firestore Optional Firestore instance used primarily for testing.
 * @return The number of invitations transitioned to expired.
 */
export async function expirePendingOrganizationInvitations(
  now: Date = new Date(),
  firestore?: FirestoreLike,
): Promise<{ processed: number }> {
  const db = firestore ?? getFirestore();
  let processed = 0;
  let batchSize = BATCH_SIZE;

  while (batchSize === BATCH_SIZE) {
    const snapshot = await db
      .collection("organizationInvitations")
      .where("status", "==", "pending")
      .where("expiresAt", "<=", now)
      .limit(BATCH_SIZE)
      .get();

    batchSize = snapshot.size;

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();

    for (const invitation of snapshot.docs) {
      batch.update(invitation.ref, {
        status: "expired",
        expiredAt: now,
        updatedAt: now,
      });

      processed += 1;
    }

    await batch.commit();
  }

  return {processed};
}

/**
 * Scheduled cleanup for expired organization invitations.
 *
 * Runs every 15 minutes.
 *
 * The scheduler is cleanup only. Invitation acceptance independently
 * validates expiresAt, so expiration does not depend on this scheduler
 * running at the exact expiration time.
 */
export const expireOrganizationInvitations = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "America/New_York",
    region: "us-central1",
  },
  async () => {
    const result = await expirePendingOrganizationInvitations();

    console.log(
      "Organization invitation expiration cleanup completed. " +
        `Expired ${result.processed} invitation(s).`,
    );
  },
);
