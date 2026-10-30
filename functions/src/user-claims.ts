import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";

/**
 * Roles on the sign-in token (Firebase Auth custom claims).
 *
 * Firestore rules used to read users/{uid} and the membership document
 * on almost every request to check roles. Copying the roles onto the
 * sign-in token lets the rules check them without any document reads:
 * fewer billed reads, faster requests, and roles that cannot be changed
 * from the browser.
 *
 * Claims (kept small; Firebase allows 1000 bytes in total):
 *   zv   = 1                         claims version; present means synced
 *   zpa  = true | false              Zebron platform administrator
 *   zorg = { [organizationId]: role } active organization roles
 *
 * zorg is left out when a person belongs to so many organizations that
 * it would not fit; the rules then fall back to reading documents.
 *
 * When access is reduced (demotion, deactivation, platform admin
 * removed) the user's refresh tokens are revoked so the change applies
 * within the hour at most. Each change also writes userClaims/{uid}; the
 * app listens to it and refreshes the token right away.
 */

const CLAIMS_VERSION = 1;
const MAX_ORGANIZATION_CLAIM_BYTES = 800;
const ZEBRON_CLAIM_KEYS = ["zv", "zpa", "zorg"];

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

interface ZebronClaims {
  zv: number;
  zpa: boolean;
  zorg?: Record<string, string>;
}

/**
 * Same definition as the rules: platformRole "platform-admin", or the
 * legacy role "admin" when platformRole is absent.
 *
 * @param {Record<string, unknown> | undefined} profile users/{uid} data.
 * @return {boolean} Whether the profile is a platform administrator.
 */
export function isPlatformAdminProfile(
  profile: Record<string, unknown> | undefined,
): boolean {
  if (!profile) return false;
  if ("platformRole" in profile) {
    return profile["platformRole"] === "platform-admin";
  }
  return profile["role"] === "admin";
}

/**
 * Builds the claims for a user from Firestore.
 *
 * @param {string} uid User ID.
 * @return {Promise<ZebronClaims>} Claims to store on the token.
 */
export async function computeZebronClaims(uid: string): Promise<ZebronClaims> {
  const db = getFirestore();
  const [profile, memberships] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("organizationMemberships")
      .where("userId", "==", uid)
      .where("active", "==", true)
      .get(),
  ]);

  const zorg: Record<string, string> = {};
  for (const membership of memberships.docs) {
    const organizationId = membership.get("organizationId");
    const role = membership.get("role");
    if (typeof organizationId === "string" && organizationId &&
        typeof role === "string" && ROLE_RANK[role]) {
      zorg[organizationId] = role;
    }
  }

  const claims: ZebronClaims = {
    zv: CLAIMS_VERSION,
    zpa: isPlatformAdminProfile(profile.data()),
  };

  if (JSON.stringify(zorg).length <= MAX_ORGANIZATION_CLAIM_BYTES) {
    claims.zorg = zorg;
  } else {
    logger.warn("Organization roles too large for token; rules will read documents.", {
      uid,
      organizations: Object.keys(zorg).length,
    });
  }

  return claims;
}

/**
 * Whether the new claims give less access than the old ones.
 *
 * @param {Record<string, unknown>} before Existing claims.
 * @param {ZebronClaims} after New claims.
 * @return {boolean} True when access is reduced.
 */
export function reducesAccess(
  before: Record<string, unknown>,
  after: ZebronClaims,
): boolean {
  if (before["zpa"] === true && !after.zpa) return true;

  const oldRoles = (before["zorg"] ?? {}) as Record<string, string>;
  if (!after.zorg) return false; // Falls back to documents: always current.

  return Object.entries(oldRoles).some(([organizationId, role]) => {
    const newRole = after.zorg?.[organizationId];
    return !newRole || (ROLE_RANK[newRole] ?? 0) < (ROLE_RANK[role] ?? 0);
  });
}

/**
 * Recomputes and stores a user's claims. Safe to call repeatedly.
 *
 * @param {string} uid User ID.
 * @param {string} reason What triggered the sync (for logs).
 * @return {Promise<boolean>} Whether the claims changed.
 */
export async function syncZebronClaims(uid: string, reason: string): Promise<boolean> {
  const auth = getAuth();

  let existing: Record<string, unknown>;
  try {
    existing = (await auth.getUser(uid)).customClaims ?? {};
  } catch (error: unknown) {
    if ((error as {code?: string})?.code === "auth/user-not-found") return false;
    throw error;
  }

  const claims = await computeZebronClaims(uid);
  const others = Object.fromEntries(
    Object.entries(existing).filter(([key]) => !ZEBRON_CLAIM_KEYS.includes(key)),
  );
  const next = {...others, ...claims};

  const current = Object.fromEntries(
    Object.entries(existing).filter(([key]) => ZEBRON_CLAIM_KEYS.includes(key)),
  );
  if (JSON.stringify(sortKeys(current)) === JSON.stringify(sortKeys(claims as unknown as Record<string, unknown>))) {
    return false;
  }

  await auth.setCustomUserClaims(uid, next);

  if (reducesAccess(existing, claims)) {
    await auth.revokeRefreshTokens(uid);
  }

  // Tells the signed-in app to refresh its token now.
  await getFirestore().collection("userClaims").doc(uid).set({
    updatedAt: FieldValue.serverTimestamp(),
    reason,
  });

  logger.info("Zebron claims updated.", {uid, reason, platformAdmin: claims.zpa});
  return true;
}

/**
 * Sorts object keys (and nested map keys) for stable comparison.
 *
 * @param {Record<string, unknown>} value Object to sort.
 * @return {Record<string, unknown>} Sorted copy.
 */
function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => {
      const item = value[key];
      return [key, item && typeof item === "object" && !Array.isArray(item) ?
        sortKeys(item as Record<string, unknown>) : item];
    }),
  );
}

/** Platform role changes on users/{uid}. */
export const syncClaimsOnUserWrite = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (isPlatformAdminProfile(before) === isPlatformAdminProfile(after) && before) {
      return;
    }

    await syncZebronClaims(event.params.uid, "profile");
  },
);

/** Role or active changes on organizationMemberships/{id}. */
export const syncClaimsOnMembershipWrite = onDocumentWritten(
  "organizationMemberships/{membershipId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    const unchanged = before && after &&
      before["role"] === after["role"] &&
      before["active"] === after["active"] &&
      before["organizationId"] === after["organizationId"];
    if (unchanged) return;

    const uid = (after?.["userId"] ?? before?.["userId"]) as string | undefined;
    if (!uid) return;

    await syncZebronClaims(uid, "membership");
  },
);

/**
 * Lets a signed-in user sync their own claims (used once per account by
 * the app when the token has no claims yet, e.g. accounts created before
 * this feature). Only ever writes the caller's own claims.
 */
export const syncMyClaims = onCall(
  {region: "us-central1"},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Sign in to continue.");
    }

    const updated = await syncZebronClaims(uid, "self");
    return {updated};
  },
);
