import {getFirestore} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

import {
  createOrganizationInvitationOutboxData,
} from "./organization-email-outbox";

const RESEND_EXPIRATION_DAYS = 7;
const RESEND_COOLDOWN_MS = 60 * 1000;

const INVITABLE_ROLES = new Set([
  "org_admin",
  "org_manager",
  "org_staff",
  "org_member",
]);

const INVITER_ROLES = new Set([
  "org_owner",
  "org_admin",
  "org_manager",
]);

interface OrganizationInvitation {
  id?: string;
  organizationId?: string;
  email?: string;
  normalizedEmail?: string;
  role?: string;
  status?: string;
  expiresAt?: unknown;
  lastResentAt?: unknown;
  resendCount?: number;
}

interface OrganizationMembership {
  userId?: string;
  organizationId?: string;
  role?: string;
  active?: boolean;
}

interface OrganizationRecord {
  name?: unknown;
  organizationName?: unknown;
  active?: unknown;
  status?: unknown;
}

/**
 * Normalizes an email address for case-insensitive comparison.
 *
 * @param email Email address to normalize.
 * @return Normalized email address.
 */
function normalizeEmail(
  email: string,
): string {
  return email.trim().toLowerCase();
}

/**
 * Converts a Firestore-compatible timestamp value to a Date.
 *
 * @param value Value to convert.
 * @return Converted Date, or null when the value cannot be converted.
 */
function toDate(
  value: unknown,
): Date | null {
  if (!value) {
    return null;
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
    return (
      value as {
        toDate: () => Date;
      }
    ).toDate();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (
      value as {
        seconds?: unknown;
      }
    ).seconds === "number"
  ) {
    const seconds =
      (
        value as {
          seconds: number;
        }
      ).seconds;

    const nanoseconds =
      "nanoseconds" in value &&
      typeof (
        value as {
          nanoseconds?: unknown;
        }
      ).nanoseconds === "number" ?
        (
            value as {
              nanoseconds: number;
            }
        ).nanoseconds :
        0;

    return new Date(
      seconds * 1000 +
        Math.floor(
          nanoseconds / 1_000_000,
        ),
    );
  }

  return null;
}

/**
 * Creates the standard invitation authorization error.
 *
 * @return Permission-denied error for unauthorized invitation operations.
 */
function getRoleError(): HttpsError {
  return new HttpsError(
    "permission-denied",
    "You do not have permission to resend organization invitations.",
  );
}

/**
 * Resolves the display name of an organization.
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

export const resendOrganizationInvitation = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication is required.",
      );
    }

    const invitationId =
      typeof request.data?.invitationId === "string" ?
        request.data.invitationId.trim() :
        "";

    if (!invitationId) {
      throw new HttpsError(
        "invalid-argument",
        "invitationId is required.",
      );
    }

    const uid = request.auth.uid;

    const isPlatformAdmin =
      request.auth.token.platformAdmin === true;

    const db = getFirestore();

    const invitationRef =
      db
        .collection("organizationInvitations")
        .doc(invitationId);

    const now = new Date();

    const newExpirationDate =
      new Date(
        now.getTime() +
          RESEND_EXPIRATION_DAYS *
            24 *
            60 *
            60 *
            1000,
      );

    return db.runTransaction(
      async (transaction) => {
        /*
         * ----------------------------------------------------------
         * 1. Load invitation
         * ----------------------------------------------------------
         */

        const invitationSnapshot =
          await transaction.get(
            invitationRef,
          );

        if (!invitationSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "Organization invitation was not found.",
          );
        }

        const invitation =
          invitationSnapshot.data() as
            OrganizationInvitation;

        const organizationId =
          invitation.organizationId?.trim();

        if (!organizationId) {
          throw new HttpsError(
            "failed-precondition",
            "The invitation is missing an organization.",
          );
        }

        const role =
          invitation.role?.trim();

        if (
          !role ||
          !INVITABLE_ROLES.has(role)
        ) {
          throw new HttpsError(
            "failed-precondition",
            "The invitation contains an invalid organization role.",
          );
        }

        /*
         * ----------------------------------------------------------
         * 2. Load organization and caller membership
         * ----------------------------------------------------------
         */

        const organizationRef =
          db
            .collection("organizations")
            .doc(organizationId);

        const membershipRef =
          db
            .collection("organizationMemberships")
            .doc(
              `${uid}_${organizationId}`,
            );

        const [
          organizationSnapshot,
          membershipSnapshot,
        ] = await Promise.all([
          transaction.get(
            organizationRef,
          ),
          transaction.get(
            membershipRef,
          ),
        ]);

        if (!organizationSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "Organization was not found.",
          );
        }

        const organization =
          organizationSnapshot.data() as
            OrganizationRecord;

        /*
         * ----------------------------------------------------------
         * 3. Validate organization lifecycle
         * ----------------------------------------------------------
         */

        const organizationActive =
          organization.active === true;

        const organizationStatus =
          organization.status;

        if (!organizationActive) {
          throw new HttpsError(
            "failed-precondition",
            "The organization is not currently active.",
          );
        }

        if (
          organizationStatus !== "onboarding" &&
          organizationStatus !== "active"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "The organization is not currently eligible for invitation mgmt.",
          );
        }

        /*
         * ----------------------------------------------------------
         * 4. Authorize caller
         * ----------------------------------------------------------
         */

        let authorized =
          isPlatformAdmin;

        if (!authorized) {
          if (
            !membershipSnapshot.exists
          ) {
            throw getRoleError();
          }

          const membership =
            membershipSnapshot.data() as
              OrganizationMembership;

          authorized =
            membership.active === true &&
            typeof membership.role ===
              "string" &&
            INVITER_ROLES.has(
              membership.role,
            );
        }

        if (!authorized) {
          throw getRoleError();
        }

        /*
         * ----------------------------------------------------------
         * 5. Validate invitation state
         * ----------------------------------------------------------
         */

        const status =
          invitation.status;

        if (
          status !== "pending" &&
          status !== "expired"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Only pending or expired invitations can be resent.",
          );
        }

        /*
         * ----------------------------------------------------------
         * 6. Enforce resend cooldown
         * ----------------------------------------------------------
         */

        const lastResentAt =
          toDate(
            invitation.lastResentAt,
          );

        if (lastResentAt) {
          const elapsed =
            now.getTime() -
            lastResentAt.getTime();

          if (
            elapsed <
            RESEND_COOLDOWN_MS
          ) {
            const remainingSeconds =
              Math.ceil(
                (
                  RESEND_COOLDOWN_MS -
                  elapsed
                ) / 1000,
              );

            throw new HttpsError(
              "resource-exhausted",
              `Invite was resent. Try again in ${remainingSeconds} seconds.`,
            );
          }
        }

        /*
         * ----------------------------------------------------------
         * 7. Calculate new resend state
         * ----------------------------------------------------------
         */

        const currentResendCount =
          typeof invitation.resendCount ===
            "number" &&
          Number.isFinite(
            invitation.resendCount,
          ) ?
            invitation.resendCount :
            0;

        const nextResendCount =
          currentResendCount + 1;

        /*
         * ----------------------------------------------------------
         * 8. Update existing invitation
         * ----------------------------------------------------------
         */

        transaction.update(
          invitationRef,
          {
            status: "pending",
            expiresAt:
              newExpirationDate,
            resendCount:
              nextResendCount,
            lastResentAt:
              now,
            updatedAt:
              now,
          },
        );

        /*
         * ----------------------------------------------------------
         * 9. Create NEW email outbox record
         * ----------------------------------------------------------
         *
         * We intentionally create a new outbox document for
         * every resend. The invitation itself keeps the same ID.
         *
         * No external email API is called inside this transaction.
         */

        const outboxRef =
          db
            .collection(
              "organizationEmailOutbox",
            )
            .doc();

        const recipientEmail =
          invitation.email?.trim() ||
          invitation.normalizedEmail?.trim() ||
          "";

        if (!recipientEmail) {
          throw new HttpsError(
            "failed-precondition",
            "The invitation does not contain a recipient email address.",
          );
        }

        const organizationName =
          getOrganizationName(
            organization,
          );

        const outboxData =
          createOrganizationInvitationOutboxData(
            {
              invitationId,
              organizationId,
              organizationName,
              recipientEmail,
              role,
              expiresAt:
                newExpirationDate,
            },
          );

        transaction.create(
          outboxRef,
          outboxData,
        );

        /*
         * ----------------------------------------------------------
         * 10. Return result
         * ----------------------------------------------------------
         */

        return {
          success: true,
          invitationId,
          organizationId,
          email:
            invitation.email ??
            invitation.normalizedEmail ??
            "",
          normalizedEmail:
            invitation.normalizedEmail ??
            normalizeEmail(
              invitation.email ?? "",
            ),
          role,
          status: "pending",
          expiresAt:
            newExpirationDate.toISOString(),
          resendCount:
            nextResendCount,
          resentByUserId:
            uid,
          lastResentAt:
            now.toISOString(),
          outboxId:
            outboxRef.id,
        };
      },
    );
  },
);
