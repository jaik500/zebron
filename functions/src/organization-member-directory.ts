import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

import {
  isPlatformAdministrator,
} from "./platform-admin-authorization";

/**
 * Names and emails for an organization's members.
 *
 * Membership records only store user IDs, and user profiles are
 * private, so the Administration page asks this function for the
 * display details of each member.
 *
 * Who can call it:
 * - platform administrators
 * - active managers, admins and owners of the organization
 *
 * Only display details are returned (name and email), never
 * private profile fields.
 */

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

const MANAGER_RANK = 3;

/** Firebase Auth getUsers accepts at most 100 identifiers per call. */
const AUTH_BATCH_SIZE = 100;

export interface OrganizationMemberDirectoryEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
}

export const getOrganizationMemberDirectory = onCall(
  {
    region: "us-central1",
  },
  async (request): Promise<{
    organizationId: string;
    members: OrganizationMemberDirectoryEntry[];
  }> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to view organization members.",
      );
    }

    const data = request.data as { organizationId?: unknown } | undefined;

    const organizationId =
      typeof data?.organizationId === "string" ?
        data.organizationId.trim() :
        "";

    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    const db = getFirestore();

    // ------------------------------------------------------------
    // Authorization: platform admin, or manager and above.
    // ------------------------------------------------------------
    const isPlatformAdmin = await isPlatformAdministrator(request);

    if (!isPlatformAdmin) {
      const callerMembership = await db
        .collection("organizationMemberships")
        .doc(`${request.auth.uid}_${organizationId}`)
        .get();

      const callerData = callerMembership.data();

      const callerRank =
        typeof callerData?.role === "string" ?
          ROLE_RANK[callerData.role] ?? 0 :
          0;

      if (
        !callerMembership.exists ||
        callerData?.active !== true ||
        callerRank < MANAGER_RANK
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only managers, administrators and owners can view member details.",
        );
      }
    }

    // ------------------------------------------------------------
    // Members of this organization.
    // ------------------------------------------------------------
    const membershipsSnapshot = await db
      .collection("organizationMemberships")
      .where("organizationId", "==", organizationId)
      .get();

    const memberships = membershipsSnapshot.docs
      .map((document) => document.data())
      .filter(
        (membership) =>
          typeof membership.userId === "string" &&
          membership.userId.trim() !== "",
      );

    const userIds = [
      ...new Set(
        memberships.map((membership) => String(membership.userId)),
      ),
    ];

    if (userIds.length === 0) {
      return { organizationId, members: [] };
    }

    // ------------------------------------------------------------
    // 1. Details stored on the membership itself.
    // 2. Zebron user profiles.
    // 3. Firebase Authentication accounts.
    // ------------------------------------------------------------
    const details = new Map<string, { displayName: string; email: string }>();

    for (const membership of memberships) {
      details.set(String(membership.userId), {
        displayName: clean(membership.displayName),
        email: clean(membership.email),
      });
    }

    const profileSnapshots = await db.getAll(
      ...userIds.map((userId) => db.collection("users").doc(userId)),
    );

    for (const snapshot of profileSnapshots) {
      const profile = snapshot.data();
      const entry = details.get(snapshot.id);

      if (!profile || !entry) {
        continue;
      }

      entry.displayName =
        entry.displayName ||
        clean(profile.displayName) ||
        joinName(profile.firstName, profile.lastName) ||
        clean(profile.name);

      entry.email = entry.email || clean(profile.email);
    }

    const missing = userIds.filter((userId) => {
      const entry = details.get(userId);
      return !entry?.displayName || !entry?.email;
    });

    for (let index = 0; index < missing.length; index += AUTH_BATCH_SIZE) {
      const batch = missing.slice(index, index + AUTH_BATCH_SIZE);

      try {
        const result = await getAuth().getUsers(
          batch.map((uid) => ({ uid })),
        );

        for (const authUser of result.users) {
          const entry = details.get(authUser.uid);

          if (!entry) {
            continue;
          }

          entry.displayName =
            entry.displayName || clean(authUser.displayName);
          entry.email = entry.email || clean(authUser.email);
        }
      } catch (error: unknown) {
        // Names are a convenience; fall back to what we have.
        logger.warn("Unable to load member accounts.", {
          organizationId,
          error,
        });
      }
    }

    return {
      organizationId,
      members: userIds.map((userId) => {
        const entry = details.get(userId);

        return {
          userId,
          displayName: entry?.displayName || null,
          email: entry?.email ? entry.email.toLowerCase() : null,
        };
      }),
    };
  },
);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function joinName(first: unknown, last: unknown): string {
  return [clean(first), clean(last)].filter(Boolean).join(" ");
}
