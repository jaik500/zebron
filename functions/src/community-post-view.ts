import {
  DocumentData,
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";

import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import {isPlatformAdministrator} from "./platform-admin-authorization";

const db = getFirestore();

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const VIEW_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Records a Community post view for the authenticated user.
 *
 * Security:
 * - Requires Firebase Authentication.
 * - Accepts the post ID, never a caller-supplied user ID.
 * - Only published, approved posts may receive views.
 * - A user's view is counted at most once per 24 hours.
 * - The shared view counter is updated by the server.
 */
export const recordCommunityPostView = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError(
        "unauthenticated",
        "You must sign in to record a post view.",
      );
    }

    const postId =
      typeof request.data?.postId === "string"
        ? request.data.postId.trim()
        : "";

    if (!postId) {
      throw new HttpsError(
        "invalid-argument",
        "A valid post ID is required.",
      );
    }

    const postRef = db
      .collection("communityPosts")
      .doc(postId);

    const viewRef = postRef
      .collection("views")
      .doc(userId);

    return db.runTransaction(async (transaction) => {
      // Read both documents before performing any writes.
      const [postSnapshot, viewSnapshot] =
        await Promise.all([
          transaction.get(postRef),
          transaction.get(viewRef),
        ]);

      if (!postSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The Community post could not be found.",
        );
      }

      const post = postSnapshot.data() ?? {};

      // Organization community posts: active members only.
      const organizationId = post["organizationId"];
      if (typeof organizationId === "string" && organizationId) {
        const [membership, organization] = await Promise.all([
          transaction.get(
            db.collection("organizationMemberships")
              .doc(`${userId}_${organizationId}`),
          ),
          transaction.get(db.collection("organizations").doc(organizationId)),
        ]);
        const isMember =
          membership.exists &&
          membership.get("active") === true &&
          organization.get("status") === "active";

        if (!isMember && !(await isPlatformAdministrator(request))) {
          throw new HttpsError(
            "permission-denied",
            "This post belongs to an organization community.",
          );
        }
      }

      if (
        post["status"] !== "published" ||
        post["moderationStatus"] !== "approved"
      ) {
        throw new HttpsError(
          "permission-denied",
          "This post is not available for public viewing.",
        );
      }

      const currentViewCount =
        typeof post["viewCount"] === "number"
          ? Math.max(0, post["viewCount"])
          : 0;

      const now = Timestamp.now();
      const existingView = viewSnapshot.data();

      const lastViewedAt =
        existingView?.["lastViewedAt"];

      // Do not count repeated views within the cooldown period.
      if (
        lastViewedAt instanceof Timestamp &&
        now.toMillis() - lastViewedAt.toMillis() <
          VIEW_COOLDOWN_MS
      ) {
        return {
          recorded: false,
          viewCount: currentViewCount,
        };
      }

      const viewData: DocumentData = {
        postId,
        userId,
        lastViewedAt: now,
        updatedAt: now,
        // View records only prevent double counting within a day;
        // Firestore deletes them automatically after 30 days (TTL).
        expireAt: Timestamp.fromMillis(now.toMillis() + VIEW_RETENTION_MS),
      };

      if (!viewSnapshot.exists) {
        viewData["createdAt"] = now;
      }

      transaction.set(
        viewRef,
        viewData,
        { merge: true },
      );

      transaction.update(postRef, {
        viewCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        recorded: true,
        viewCount: currentViewCount + 1,
      };
    });
  },
);