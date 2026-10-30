import {FieldPath, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {onCall} from "firebase-functions/v2/https";
import {requirePlatformAdministrator} from "./platform-admin-authorization";

const db = getFirestore();
const PAGE_SIZE = 400;

/**
 * One-time Community migration (safe to run again).
 *
 * Community feeds now filter on organizationId:
 *   null           -> public Zebron Community
 *   "<org id>"     -> that organization's private community
 *
 * Firestore cannot query for a missing field, so posts created before
 * organization communities need organizationId: null to keep appearing
 * in the public feed. This sets it on every post that lacks the field
 * and leaves everything else unchanged.
 *
 * Platform administrators only. Run it from Community moderation
 * (public Community) before or right after deploying the new rules.
 */
export const backfillCommunityPostScope = onCall(
  {region: "us-central1", timeoutSeconds: 540},
  async (request) => {
    await requirePlatformAdministrator(request);

    let scanned = 0;
    let updated = 0;
    let last: string | null = null;

    for (;;) {
      let page = db
        .collection("communityPosts")
        .orderBy(FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (last) page = page.startAfter(last);

      const snapshot = await page.get();
      if (snapshot.empty) break;

      const batch = db.batch();
      let changes = 0;

      for (const document of snapshot.docs) {
        scanned++;
        if (!Object.prototype.hasOwnProperty.call(document.data(), "organizationId")) {
          batch.update(document.ref, {organizationId: null});
          changes++;
        }
      }

      if (changes > 0) {
        await batch.commit();
        updated += changes;
      }

      last = snapshot.docs[snapshot.docs.length - 1].id;
      if (snapshot.size < PAGE_SIZE) break;
    }

    logger.info("Community post scope backfill finished.", {
      scanned,
      updated,
      by: request.auth?.uid,
    });

    return {scanned, updated};
  },
);
