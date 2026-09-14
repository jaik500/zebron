
/**
 * Community Trending Ranking
 * ---------------------------
 *
 * Server-side ranking logic for Zebron Community posts.
 *
 * Responsibilities:
 *
 * 1. Recalculate a post's Trending score when ranking inputs change.
 * 2. Keep ranking logic outside the Angular client.
 * 3. Persist the calculated score to communityPosts.
 *
 * Ranking inputs:
 *
 * - reactions
 * - comments
 * - views
 * - post age
 *
 * The calculated score is stored on the post as:
 *
 *     trendingScore
 *
 * The Angular CommunityPostService uses this field when querying
 * the Trending feed.
 */

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  Change,
  FirestoreEvent,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface CommunityPostData {
  reactionCounts?: Record<string, unknown>;
  commentCount?: unknown;
  viewCount?: unknown;
  trendingScore?: unknown;
  createdAt?: FirebaseFirestore.Timestamp | null;
  status?: string;
  moderationStatus?: string;
}

/**
 * ============================================================
 * RANKING CONFIGURATION
 * ============================================================
 */

/**
 * Engagement weights.
 *
 * Reactions indicate stronger engagement than a simple view.
 * Comments indicate deeper engagement and therefore receive
 * the highest weight.
 */
const REACTION_WEIGHT = 3;
const COMMENT_WEIGHT = 5;
const VIEW_WEIGHT = 1;

/**
 * Recency window.
 *
 * Posts older than this number of days receive no additional
 * recency score.
 */
const RECENCY_WINDOW_DAYS = 30;

/**
 * Maximum number of points contributed by recency.
 */
const MAX_RECENCY_SCORE = 100;

/**
 * ============================================================
 * FIRESTORE TRIGGER
 * ============================================================
 */

/**
 * Recalculate Trending whenever a Community post changes.
 *
 * This catches changes to:
 *
 * - reactionCounts
 * - commentCount
 * - viewCount
 * - createdAt
 * - status
 * - moderationStatus
 *
 * The function intentionally ignores changes that only modify
 * trendingScore or updatedAt.
 *
 * This prevents the function from repeatedly recalculating the
 * same post when its own score is persisted.
 */
export const updateCommunityTrendingScore =
  onDocumentWritten(
    "communityPosts/{postId}",
    async (
      event: FirestoreEvent<
        Change<FirebaseFirestore.DocumentSnapshot> | undefined,
        { postId: string }
      >,
    ): Promise<void> => {
      const postId = event.params.postId;

      const before = event.data?.before;

      const after = event.data?.after;

      /**
       * --------------------------------------------------------
       * DELETED DOCUMENT
       * --------------------------------------------------------
       */

      if (!after?.exists) {
        logInfo(
          "Community post deleted; Trending score update skipped.",
          {
            postId,
          },
        );

        return;
      }

      /**
       * --------------------------------------------------------
       * READ POST
       * --------------------------------------------------------
       */

      const post =
        after.data() as CommunityPostData;

      /**
       * --------------------------------------------------------
       * ONLY RANK PUBLISHED / APPROVED POSTS
       * --------------------------------------------------------
       */

      if (!isEligibleForTrending(post)) {
        /**
         * If a post becomes hidden, deleted, pending,
         * flagged, or rejected, reset its Trending score.
         *
         * This prevents stale scores from remaining on posts
         * that should no longer participate in the public feed.
         */
        const currentScore =
          toNumber(post.trendingScore);

        if (currentScore !== 0) {
          await after.ref.update({
            trendingScore: 0,
            updatedAt:
              FieldValue.serverTimestamp(),
          });

          logInfo(
            "Community post removed from Trending.",
            {
              postId,
              previousScore: currentScore,
            },
          );
        }

        return;
      }

      /**
       * --------------------------------------------------------
       * UPDATE OPTIMIZATION
       * --------------------------------------------------------
       *
       * On updates, only recalculate if an actual ranking input
       * changed.
       *
       * This is especially important because this function itself
       * updates trendingScore and updatedAt.
       */

      if (
        before?.exists &&
        !rankingInputsChanged(
          before.data() as CommunityPostData,
          post,
        )
      ) {
        return;
      }

      /**
       * --------------------------------------------------------
       * CALCULATE SCORE
       * --------------------------------------------------------
       */

      const score =
        calculateTrendingScore(post);

      const currentScore =
        toNumber(post.trendingScore);

      /**
       * --------------------------------------------------------
       * AVOID UNNECESSARY WRITE
       * --------------------------------------------------------
       */

      if (
        scoresAreEqual(
          currentScore,
          score,
        )
      ) {
        return;
      }

      /**
       * --------------------------------------------------------
       * UPDATE SCORE
       * --------------------------------------------------------
       */

      await after.ref.update({
        trendingScore: score,
        updatedAt:
          FieldValue.serverTimestamp(),
      });

      /**
       * --------------------------------------------------------
       * LOG
       * --------------------------------------------------------
       */

      logInfo(
        "Community Trending score updated.",
        {
          postId,
          previousScore: currentScore,
          trendingScore: score,
          changedByPostUpdate:
            Boolean(before?.exists),
        },
      );
    },
  );

/**
 * ============================================================
 * ELIGIBILITY
 * ============================================================
 */

/**
 * Determines whether a post is eligible for Trending.
 */
function isEligibleForTrending(
  post: CommunityPostData,
): boolean {
  return (
    post.status === "published" &&
    post.moderationStatus === "approved"
  );
}

/**
 * ============================================================
 * CHANGE DETECTION
 * ============================================================
 */

/**
 * Determines whether one of the ranking inputs changed.
 *
 * trendingScore and updatedAt are intentionally excluded.
 */
function rankingInputsChanged(
  before: CommunityPostData,
  after: CommunityPostData,
): boolean {
  return (
    !areEqual(
      before.reactionCounts,
      after.reactionCounts,
    ) ||
    toNumber(before.commentCount) !==
      toNumber(after.commentCount) ||
    toNumber(before.viewCount) !==
      toNumber(after.viewCount) ||
    !areEqual(
      before.createdAt,
      after.createdAt,
    ) ||
    before.status !== after.status ||
    before.moderationStatus !==
      after.moderationStatus
  );
}

/**
 * ============================================================
 * TRENDING SCORE
 * ============================================================
 */

/**
 * Calculate the Trending score for a Community post.
 *
 * Formula:
 *
 *     engagement score
 *       = reactions × 3
 *       + comments × 5
 *       + views × 1
 *
 *     trending score
 *       = engagement score + recency score
 *
 * Recency contributes up to 100 additional points during
 * the first 30 days after publication.
 */
export function calculateTrendingScore(
  post: CommunityPostData,
  now: Date = new Date(),
): number {
  const reactionTotal =
    getReactionTotal(post);

  const commentCount =
    Math.max(
      0,
      toNumber(post.commentCount),
    );

  const viewCount =
    Math.max(
      0,
      toNumber(post.viewCount),
    );

  const engagementScore =
    reactionTotal * REACTION_WEIGHT +
    commentCount * COMMENT_WEIGHT +
    viewCount * VIEW_WEIGHT;

  const recencyScore =
    calculateRecencyScore(
      post,
      now,
    );

  return roundScore(
    Math.max(
      0,
      engagementScore +
        recencyScore,
    ),
  );
}

/**
 * ============================================================
 * REACTIONS
 * ============================================================
 */

/**
 * Calculate the total number of reactions regardless of type.
 */
function getReactionTotal(
  post: CommunityPostData,
): number {
  const reactionCounts =
    post.reactionCounts;

  if (
    !reactionCounts ||
    typeof reactionCounts !== "object"
  ) {
    return 0;
  }

  let total = 0;

  for (
    const count of Object.values(
      reactionCounts,
    )
  ) {
    total += Math.max(
      0,
      toNumber(count),
    );
  }

  return total;
}

/**
 * ============================================================
 * RECENCY
 * ============================================================
 */

/**
 * Calculate the recency contribution.
 *
 * A brand-new post receives 100 points.
 *
 * The score decreases linearly until it reaches zero after
 * 30 days.
 */
function calculateRecencyScore(
  post: CommunityPostData,
  now: Date,
): number {
  const createdAt =
    post.createdAt;

  if (!createdAt) {
    return 0;
  }

  const createdAtMilliseconds =
    createdAt.toDate().getTime();

  const ageMilliseconds =
    Math.max(
      0,
      now.getTime() -
        createdAtMilliseconds,
    );

  const ageDays =
    ageMilliseconds /
    (
      1000 *
      60 *
      60 *
      24
    );

  if (
    ageDays >=
    RECENCY_WINDOW_DAYS
  ) {
    return 0;
  }

  const recencyRatio =
    1 -
    (
      ageDays /
      RECENCY_WINDOW_DAYS
    );

  return (
    recencyRatio *
    MAX_RECENCY_SCORE
  );
}

/**
 * ============================================================
 * NUMBER HELPERS
 * ============================================================
 */

/**
 * Safely convert Firestore values to numbers.
 */
function toNumber(
  value: unknown,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(
      parsed,
    ) ?
      parsed :
      0;
  }

  return 0;
}

/**
 * ============================================================
 * VALUE COMPARISON
 * ============================================================
 */

/**
 * Safely compare ranking input values.
 */
function areEqual(
  first: unknown,
  second: unknown,
): boolean {
  if (first === second) {
    return true;
  }

  /**
   * Firestore Timestamp comparison.
   */
  if (
    first &&
    second &&
    typeof first === "object" &&
    typeof second === "object"
  ) {
    const firstObject =
      first as Record<
        string,
        unknown
      >;

    const secondObject =
      second as Record<
        string,
        unknown
      >;

    if (
      "toMillis" in firstObject &&
      "toMillis" in secondObject &&
      typeof firstObject.toMillis ===
        "function" &&
      typeof secondObject.toMillis ===
        "function"
    ) {
      return (
        (
          firstObject.toMillis as
            () => number
        )() ===
        (
          secondObject.toMillis as
            () => number
        )()
      );
    }
  }

  return (
    JSON.stringify(first) ===
    JSON.stringify(second)
  );
}

/**
 * ============================================================
 * SCORE HELPERS
 * ============================================================
 */

/**
 * Round the score to two decimal places.
 *
 * This keeps Firestore values predictable and avoids storing
 * unnecessary floating-point precision.
 */
function roundScore(
  score: number,
): number {
  return (
    Math.round(
      score * 100,
    ) / 100
  );
}

/**
 * Determine whether two scores are effectively identical.
 */
function scoresAreEqual(
  first: number,
  second: number,
): boolean {
  return (
    Math.abs(
      first - second,
    ) < 0.01
  );
}

/**
 * ============================================================
 * LOGGING
 * ============================================================
 *
 * Keep server-side ranking logs structured and centralized.
 *
 * This wrapper gives us one place to replace the implementation
 * with the project's shared logging infrastructure without
 * scattering console calls throughout the ranking logic.
 */
function logInfo(
  message: string,
  context: Record<string, unknown>,
): void {
  console.info(
    `[CommunityRanking] ${message}`,
    context,
  );
}
