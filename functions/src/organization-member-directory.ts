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
    await requireManagerOrAbove(request, organizationId);

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

/**
 * Profile of one organization member, for the member profile page.
 *
 * Who can call it: platform administrators, and active managers,
 * admins and owners of the organization. The target user must be
 * a member of that organization. Only the fields below are returned.
 */
export interface OrganizationMemberProfile {
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  joinedAt: string | null;

  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  city: string | null;
  state: string | null;
  currentCountry: string | null;
  photoUrl: string | null;
  bio: string | null;

  accountCreatedAt: string | null;
  lastSignInAt: string | null;

  /** True once first and last name are both filled in. */
  nameComplete: boolean;
}

export const getOrganizationMemberProfile = onCall(
  {
    region: "us-central1",
  },
  async (request): Promise<OrganizationMemberProfile> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to view member profiles.",
      );
    }

    const data = request.data as {
      organizationId?: unknown;
      userId?: unknown;
    } | undefined;

    const organizationId = clean(data?.organizationId);
    const userId = clean(data?.userId);

    if (!organizationId || !userId) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId and userId are required.",
      );
    }

    const db = getFirestore();

    await requireManagerOrAbove(request, organizationId);

    const membershipSnapshot = await db
      .collection("organizationMemberships")
      .doc(`${userId}_${organizationId}`)
      .get();

    const membership = membershipSnapshot.data();

    if (
      !membershipSnapshot.exists ||
      membership?.organizationId !== organizationId
    ) {
      throw new HttpsError(
        "not-found",
        "This person is not a member of the organization.",
      );
    }

    const profile = (
      await db.collection("users").doc(userId).get()
    ).data() ?? {};

    let authEmail = "";
    let authName = "";
    let emailVerified = false;
    let accountCreatedAt: string | null = null;
    let lastSignInAt: string | null = null;

    try {
      const authUser = await getAuth().getUser(userId);

      authEmail = clean(authUser.email);
      authName = clean(authUser.displayName);
      emailVerified = authUser.emailVerified === true;
      accountCreatedAt = toIso(authUser.metadata.creationTime);
      lastSignInAt = toIso(authUser.metadata.lastSignInTime);
    } catch (error: unknown) {
      logger.warn("Unable to load member account.", {
        organizationId,
        userId,
        error,
      });
    }

    const firstName = clean(profile.firstName);
    const lastName = clean(profile.lastName);

    const displayName =
      clean(membership.displayName) ||
      clean(profile.displayName) ||
      joinName(firstName, lastName) ||
      authName;

    const email =
      clean(membership.email) ||
      clean(profile.email) ||
      authEmail;

    return {
      userId,
      organizationId,
      role: clean(membership.role) || "org_member",
      active: membership.active === true,
      joinedAt: timestampToIso(membership.createdAt),

      displayName: displayName || null,
      firstName: firstName || null,
      lastName: lastName || null,
      preferredName: clean(profile.preferredName) || null,
      email: email ? email.toLowerCase() : null,
      emailVerified,
      phone: clean(profile.phone) || null,
      city: clean(profile.city) || null,
      state: clean(profile.state) || null,
      currentCountry: clean(profile.currentCountry) || null,
      photoUrl: clean(profile.photoUrl) || null,
      bio: clean(profile.bio) || null,

      accountCreatedAt,
      lastSignInAt,

      nameComplete: Boolean(firstName && lastName),
    };
  },
);

/**
 * Throws unless the caller is a platform administrator or an
 * active manager, admin or owner of the organization.
 */
async function requireManagerOrAbove(
  request: Parameters<typeof isPlatformAdministrator>[0],
  organizationId: string,
): Promise<void> {
  if (await isPlatformAdministrator(request)) {
    return;
  }

  const snapshot = await getFirestore()
    .collection("organizationMemberships")
    .doc(`${request.auth?.uid}_${organizationId}`)
    .get();

  const membership = snapshot.data();
  const rank =
    typeof membership?.role === "string" ?
      ROLE_RANK[membership.role] ?? 0 :
      0;

  if (
    !snapshot.exists ||
    membership?.active !== true ||
    rank < MANAGER_RANK
  ) {
    throw new HttpsError(
      "permission-denied",
      "Only managers, administrators and owners can view member profiles.",
    );
  }
}

function toIso(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function timestampToIso(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}
