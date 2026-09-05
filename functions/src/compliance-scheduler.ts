import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {getFirestore, Timestamp} from "firebase-admin/firestore";


/**
 * Returns the calendar date in Eastern Time as YYYY-MM-DD.
 */
function getEasternDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";
  const month =
    parts.find((part) => part.type === "month")?.value ?? "";
  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}
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

    const snapshot = await db
      .collection("businessCompliance")
      .get();

    logger.info(`Found ${snapshot.size} compliance records.`);

    if (snapshot.empty) {
      logger.info("No business compliance records found.");
      return;
    }

    let updatedCount = 0;
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

      if (data.completedDate) {
        newStatus = "current";
      } else if (data.status === "not_applicable") {
        newStatus = "not_applicable";
      } else {
        const targetTimestamp =
          data.dueDate ?? data.renewalDate;

        if (targetTimestamp instanceof Timestamp) {
          const targetDateKey =
            getEasternDateKey(targetTimestamp.toDate());

          if (targetDateKey > today) {
            newStatus = "upcoming";
          } else if (targetDateKey === today) {
            newStatus = "action_required";
          } else {
            newStatus = "overdue";
          }
        }
      }

      if (newStatus !== data.status) {
        batch.update(complianceDoc.ref, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });

        batchOperations++;
        updatedCount++;
      }

      if (batchOperations >= 500) {
        await commitBatch();
      }
    }

    await commitBatch();

    logger.info(
      "Business compliance status refresh completed. " +
      `Updated ${updatedCount} records.`,
    );
  },
);
