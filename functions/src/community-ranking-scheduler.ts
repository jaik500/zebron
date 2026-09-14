
/**
 * Community Trending Score Scheduler
 *
 * Periodically recalculates trending scores for recently active
 * community posts.
 *
 * The scheduled job acts as a safety net for the Firestore-triggered
 * ranking function. This ensures scores are refreshed as posts age,
 * even when no new reaction, comment, or view occurs.
 */

import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";

import * as logger from "firebase-functions/logger";

import {onSchedule} from "firebase-functions/v2/scheduler";

import {
  calculateTrendingScore,
  CommunityPostData,
} from "./community-ranking";

const db = getFirestore();

const SCHEDULED_REFRESH_WINDOW_DAYS = 30;
const MAX_POSTS_PER_RUN = 450;

/**
 * Refresh Trending scores for recently created Community posts.
 *
 * This scheduled function recalculates scores for published and
 * approved posts from the previous 30 days.
 */
export const refreshCommunityTrendingScores =
  onSchedule(
    {
      schedule: "every day 03:00",
      timeZone: "America/New_York",
      region: "us-east4",
    },
    async (): Promise<void> => {
      const startedAt = Date.now();

      const cutoffDate = new Date();

      cutoffDate.setDate(
        cutoffDate.getDate() -
          SCHEDULED_REFRESH_WINDOW_DAYS,
      );

      const cutoffTimestamp =
        Timestamp.fromDate(cutoffDate);

      try {
        const snapshot = await db
          .collection("communityPosts")
          .where("status", "==", "published")
          .where(
            "moderationStatus",
            "==",
            "approved",
          )
          .where(
            "createdAt",
            ">=",
            cutoffTimestamp,
          )
          .orderBy("createdAt", "asc")
          .limit(MAX_POSTS_PER_RUN)
          .get();

        if (snapshot.empty) {
          logger.info(
            "Community trending refresh completed with no eligible posts.",
            {
              durationMs: Date.now() - startedAt,
            },
          );

          return;
        }

        const batch = db.batch();
        let updatedCount = 0;

        for (const document of snapshot.docs) {
          const post =
            document.data() as CommunityPostData;

          const calculatedScore =
            calculateTrendingScore(post);

          let currentScore = 0;

          if (
            typeof post.trendingScore === "number" &&
            Number.isFinite(post.trendingScore)
          ) {
            currentScore = post.trendingScore;
          }

          if (calculatedScore === currentScore) {
            continue;
          }

          batch.update(document.ref, {
            trendingScore: calculatedScore,
            updatedAt:
              FieldValue.serverTimestamp(),
          });

          updatedCount++;
        }

        if (updatedCount > 0) {
          await batch.commit();
        }

        logger.info(
          "Community trending scores refreshed successfully.",
          {
            scannedCount: snapshot.size,
            updatedCount,
            durationMs: Date.now() - startedAt,
          },
        );
      } catch (error: unknown) {
        logger.error(
          "Failed to refresh community trending scores.",
          {
            error,
            durationMs: Date.now() - startedAt,
          },
        );

        throw error;
      }
    },
  );

