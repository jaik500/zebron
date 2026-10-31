import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

const REGION = "us-central1";
const MAX_POSTS_PER_RUN = 400;

/**
 * Publishes blog posts whose scheduled time has come.
 *
 * Covers every blogPosts collection: the public and internal blog
 * (blogPosts) and each organization's blog
 * (organizations/{id}/blogPosts). Readers only see status "published",
 * so a scheduled post stays hidden until this runs.
 *
 * Index: blogPosts collection group (status ASC, publishAt ASC).
 */
export const publishScheduledBlogPosts = onSchedule(
  { region: REGION, schedule: "every 15 minutes", timeZone: "America/New_York" },
  async () => {
    const db = getFirestore();
    const due = await db
      .collectionGroup("blogPosts")
      .where("status", "==", "scheduled")
      .where("publishAt", "<=", Timestamp.now())
      .limit(MAX_POSTS_PER_RUN)
      .get();

    if (due.empty) {
      return;
    }

    const batch = db.batch();

    for (const document of due.docs) {
      const publishAt = document.get("publishAt") as Timestamp | null;

      batch.update(document.ref, {
        status: "published",
        publishedAt: publishAt ?? Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
    logger.info("Published scheduled blog posts", { count: due.size });
  },
);
