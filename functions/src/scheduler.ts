import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

/**
 * Business Compliance Status Scheduler
 *
 * Runs once every day shortly after midnight Eastern Time.
 *
 * The function evaluates businessCompliance records and
 * automatically updates their status based on dueDate
 * or renewalDate.
 *
 * Architecture:
 *
 * Cloud Scheduler
 *       ↓
 * this function
 *       ↓
 * Firebase Admin SDK
 *       ↓
 * Firestore
 */


/**
 * Converts a Date into a YYYY-MM-DD key using Eastern Time.
 *
 * Using the local business timezone is important because
 * Firebase Functions execute using UTC by default.
 */
function getEasternDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";

  const month = parts.find((part) => part.type === "month")?.value ?? "";

  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

/**
 * Updates all business compliance statuses.
 *
 * Rules:
 *
 * completedDate exists
 *   → current
 *
 * not_applicable
 *   → remains not_applicable
 *
 * target date > today
 *   → upcoming
 *
 * target date = today
 *   → action_required
 *
 * target date < today
 *   → overdue
 *
 * target date:
 *   dueDate first
 *   renewalDate second
 */
export const processBusinessComplianceStatuses = onSchedule(
  {
    schedule: "every day 00:05",
    timeZone: "America/New_York",
    region: "us-central1",
  },

  async () => {
    const db = getFirestore();
    logger.info("Starting business compliance status refresh.");

    const today = getEasternDateKey(new Date());

    logger.info(`Business compliance status date: ${today}`);

    const snapshot = await db.collection("businessCompliance").get();

    logger.info(`Found ${snapshot.size} compliance records.`);

    if (snapshot.empty) {
      logger.info("No business compliance records found.");

      return;
    }

    let updatedCount = 0;

    /*
     * Firestore batches support up to 500 writes.
     *
     * We process records in batches so this function can
     * continue working as the business compliance collection
     * grows.
     */
    let batch = db.batch();
    let batchOperations = 0;

    const commitBatch = async (): Promise<void> => {
      if (batchOperations === 0) {
        return;
      }

      await batch.commit();

      batch = db.batch();
      batchOperations = 0;
    };

    for (const complianceDoc of snapshot.docs) {
      const data = complianceDoc.data();

      if (data.automaticMonitoring !== true) {
        continue;
      }

      let newStatus = data.status;

      /*
       * Completed requirements are current.
       */
      if (data.completedDate) {
        newStatus = "current";
      } else if (data.status === "not_applicable") {
        /*
       * Explicitly not-applicable requirements should
       * not be changed automatically.
       */
        newStatus = "not_applicable";
      } else {
        /*
         * Prefer dueDate.
         * Fall back to renewalDate.
         */
        const targetTimestamp = data.dueDate ?? data.renewalDate;

        if (targetTimestamp instanceof Timestamp) {
          const targetDate = targetTimestamp.toDate();

          const targetDateKey = getEasternDateKey(targetDate);

          if (targetDateKey > today) {
            newStatus = "upcoming";
          } else if (targetDateKey === today) {
            newStatus = "action_required";
          } else {
            newStatus = "overdue";
          }
        }
      }

      /*
       * Only update Firestore when the status changed.
       */
      if (newStatus !== data.status) {
        batch.update(complianceDoc.ref, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });

        batchOperations++;
        updatedCount++;
      }

      /*
       * Commit at the Firestore batch limit.
       */
      if (batchOperations >= 500) {
        await commitBatch();
      }
    }

    /*
     * Commit the remaining operations.
     */
    await commitBatch();

    logger.info(
      "Business compliance status refresh completed. " +
    `Updated ${updatedCount} records.`,
    );
  },
);
