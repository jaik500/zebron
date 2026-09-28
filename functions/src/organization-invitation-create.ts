import {
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

import {
  createOrganizationInvitationOutboxData,
} from "./organization-email-outbox";

const INVITATION_EXPIRATION_DAYS = 7;

const INVITABLE_ROLES = [
  "org_admin",
  "org_manager",
  "org_staff",
  "org_member",
] as const;

type InvitableOrganizationRole =
  (typeof INVITABLE_ROLES)[number];

const INVITER_ROLES = [
  "org_owner",
  "org_admin",
  "org_manager",
] as const;

type OrganizationStatus =
  | "pending"
  | "provisioning"
  | "onboarding"
  | "active"
  | "suspended"
  | "archived";

interface OrganizationRecord {
  name?: unknown;
  organizationName?: unknown;
  status?: unknown;
  active?: unknown;
}

export const createOrganizationInvitation = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to create an organization invitation.",
      );
    }

    const uid = request.auth.uid;

    const data = request.data as
      | {
          organizationId?: unknown;
          email?: unknown;
          role?: unknown;
        }
      | undefined;

    const organizationId =
      typeof data?.organizationId === "string" ?
        data.organizationId.trim() :
        "";

    const email =
      typeof data?.email === "string" ?
        data.email.trim() :
        "";

    const normalizedEmail = email.toLowerCase();

    const role =
      typeof data?.role === "string" ?
        data.role.trim() :
        "";

    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "email is required.",
      );
    }

    if (!isValidEmail(email)) {
      throw new HttpsError(
        "invalid-argument",
        "A valid email address is required.",
      );
    }

    if (!role) {
      throw new HttpsError(
        "invalid-argument",
        "role is required.",
      );
    }

    if (!isInvitableRole(role)) {
      throw new HttpsError(
        "invalid-argument",
        "The requested organization role cannot be assigned through an invite.",
      );
    }

    const db = getFirestore();

    const organizationRef = db
      .collection("organizations")
      .doc(organizationId);

    const membershipId =
      `${uid}_${organizationId}`;

    const membershipRef = db
      .collection("organizationMemberships")
      .doc(membershipId);

    const result = await db.runTransaction(
      async (transaction) => {
        const [
          organizationSnapshot,
          membershipSnapshot,
        ] = await Promise.all([
          transaction.get(organizationRef),
          transaction.get(membershipRef),
        ]);

        if (!organizationSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "The organization could not be found.",
          );
        }

        const organization =
          organizationSnapshot.data() as OrganizationRecord;

        const organizationStatus =
          typeof organization.status === "string" ?
            organization.status as OrganizationStatus :
            "";

        const organizationActive =
          organization.active === true;

        const membershipData =
          membershipSnapshot.exists ?
            membershipSnapshot.data() :
            undefined;

        const membershipRole =
          getString(
            membershipData,
            "role",
          );

        const membershipActive =
          membershipSnapshot.exists &&
          membershipData?.active === true;

        const isPlatformAdmin =
          request.auth?.token?.platformAdmin === true;

        const isAuthorizedOrganizationInviter =
          membershipActive &&
          isInviterRole(membershipRole);

        if (
          !isPlatformAdmin &&
          !isAuthorizedOrganizationInviter
        ) {
          throw new HttpsError(
            "permission-denied",
            "You do not have permission to invite users to this organization.",
          );
        }

        if (!organizationActive) {
          throw new HttpsError(
            "failed-precondition",
            "This organization is not currently active.",
          );
        }

        if (
          organizationStatus !== "onboarding" &&
          organizationStatus !== "active"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "This organization isn't currently eligible to accept new members.",
          );
        }

        /*
         * Find existing pending invitations for this
         * organization/email combination.
         *
         * normalizedEmail allows case-insensitive matching
         * without relying on Firestore case-insensitive queries.
         */
        const existingInvitationQuery = db
          .collection("organizationInvitations")
          .where(
            "organizationId",
            "==",
            organizationId,
          )
          .where(
            "normalizedEmail",
            "==",
            normalizedEmail,
          )
          .where(
            "status",
            "==",
            "pending",
          )
          .limit(10);

        const existingInvitationSnapshot =
          await transaction.get(
            existingInvitationQuery,
          );

        const now = Date.now();

        const hasActivePendingInvitation =
          existingInvitationSnapshot.docs.some(
            (invitation) => {
              const expiresAt =
                toDate(
                  invitation.data().expiresAt,
                );

              return (
                expiresAt !== null &&
                expiresAt.getTime() > now
              );
            },
          );

        if (hasActivePendingInvitation) {
          throw new HttpsError(
            "already-exists",
            "A pending invitation already exists for this email address.",
          );
        }

        /*
         * Generate the invitation only after all
         * validation has succeeded.
         */
        const invitationRef = db
          .collection("organizationInvitations")
          .doc();

        const invitationId =
          invitationRef.id;

        const expirationDate =
          new Date(
            now +
              INVITATION_EXPIRATION_DAYS *
                24 *
                60 *
                60 *
                1000,
          );

        const expiresAt =
          Timestamp.fromDate(
            expirationDate,
          );

        const timestamp =
          FieldValue.serverTimestamp();

        const organizationName =
          getOrganizationName(
            organization,
          );

        /*
         * Create the invitation.
         */
        transaction.create(
          invitationRef,
          {
            id: invitationId,
            organizationId,
            email,
            normalizedEmail,
            role,
            status: "pending",
            expiresAt,
            createdAt: timestamp,
            createdByUserId: uid,
            updatedAt: timestamp,
          },
        );

        /*
         * Create the email outbox record in the
         * SAME transaction.
         *
         * The external Resend API is NOT called here.
         */
        const outboxRef = db
          .collection("organizationEmailOutbox")
          .doc();

        const outboxData =
  createOrganizationInvitationOutboxData({
    invitationId,
    organizationId,
    recipientEmail: email,
    organizationName,
    role,
    expiresAt: expirationDate,
  });

        transaction.create(
          outboxRef,
          outboxData,
        );

        return {
          invitationId,
          organizationId,
          email,
          normalizedEmail,
          role,
          status: "pending",
          expiresAt,
          createdByUserId: uid,
        };
      },
    );

    return {
      success: true,
      invitationId: result.invitationId,
      organizationId: result.organizationId,
      email: result.email,
      normalizedEmail: result.normalizedEmail,
      role: result.role,
      status: result.status,
      expiresAt:
        result.expiresAt
          .toDate()
          .toISOString(),
      createdByUserId:
        result.createdByUserId,
    };
  },
);

/**
 * Determines whether a role can be assigned through an invitation.
 *
 * @param role Organization role to validate.
 * @return True when the role is invitable.
 */
function isInvitableRole(
  role: string,
): role is InvitableOrganizationRole {
  return INVITABLE_ROLES.includes(
    role as InvitableOrganizationRole,
  );
}

/**
 * Determines whether a role is authorized to invite organization users.
 *
 * @param role Organization membership role to validate.
 * @return True when the role can invite users.
 */
function isInviterRole(
  role: string,
): boolean {
  return INVITER_ROLES.includes(
    role as (typeof INVITER_ROLES)[number],
  );
}

/**
 * Validates the basic structure of an email address.
 *
 * @param email Email address to validate.
 * @return True when the email has a valid basic format.
 */
function isValidEmail(
  email: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

/**
 * Reads and trims a string field from a Firestore document.
 *
 * @param data Firestore document data.
 * @param field Field name to read.
 * @return Trimmed string value, or an empty string.
 */
function getString(
  data:
    | FirebaseFirestore.DocumentData
    | undefined,
  field: string,
): string {
  return typeof data?.[field] === "string" ?
    data[field].trim() :
    "";
}

/**
 * Resolves the display name for an organization.
 *
 * @param organization Organization record.
 * @return Organization display name.
 */
function getOrganizationName(
  organization: OrganizationRecord,
): string {
  const name =
    typeof organization.name === "string" ?
      organization.name.trim() :
      "";

  if (name) {
    return name;
  }

  const organizationName =
    typeof organization.organizationName === "string" ?
      organization.organizationName.trim() :
      "";

  if (organizationName) {
    return organizationName;
  }

  return "Zebron organization";
}

/**
 * Converts a supported timestamp value to a Date.
 *
 * @param value Value to convert.
 * @return Converted Date, or null when unsupported.
 */
function toDate(
  value: unknown,
): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    const converted =
      (
        value as {
          toDate: () => unknown;
        }
      ).toDate();

    return converted instanceof Date ?
      converted :
      null;
  }

  return null;
}
