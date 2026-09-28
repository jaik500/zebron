import {
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";

import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

export const acceptOrganizationInvitation = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    // ------------------------------------------------------------
    // 1. Require authentication
    // ------------------------------------------------------------
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to accept an organization invitation.",
      );
    }

    const uid = request.auth.uid;

    // ------------------------------------------------------------
    // 2. Get authenticated user's email
    // ------------------------------------------------------------
    const authenticatedEmail =
      typeof request.auth.token.email === "string" ?
        request.auth.token.email.trim().toLowerCase() :
        "";

    if (!authenticatedEmail) {
      throw new HttpsError(
        "failed-precondition",
        "Your account does not have a verified email address.",
      );
    }

    // ------------------------------------------------------------
    // 3. Validate input
    // ------------------------------------------------------------
    const data = request.data as {
      invitationId?: unknown;
    } | undefined;

    const invitationId =
      typeof data?.invitationId === "string" ?
        data.invitationId.trim() :
        "";

    if (!invitationId) {
      throw new HttpsError(
        "invalid-argument",
        "invitationId is required.",
      );
    }

    const db = getFirestore();

    const invitationRef = db
      .collection("organizationInvitations")
      .doc(invitationId);

    // ------------------------------------------------------------
    // 4. Perform acceptance atomically
    // ------------------------------------------------------------
    const result = await db.runTransaction(async (transaction) => {
      // ----------------------------------------------------------
      // Load invitation
      // ----------------------------------------------------------
      const invitationSnapshot =
        await transaction.get(invitationRef);

      if (!invitationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization invitation could not be found.",
        );
      }

      // IMPORTANT:
      // invitation only exists inside this transaction scope.
      const invitation =
        invitationSnapshot.data() ?? {};

      // ----------------------------------------------------------
      // Extract invitation fields
      // ----------------------------------------------------------
      const organizationId =
        typeof invitation.organizationId === "string" ?
          invitation.organizationId.trim() :
          "";

      const normalizedEmail =
        typeof invitation.normalizedEmail === "string" ?
          invitation.normalizedEmail.trim().toLowerCase() :
          "";

      const role =
        typeof invitation.role === "string" ?
          invitation.role.trim() :
          "";

      // ----------------------------------------------------------
      // Validate invitation status
      // ----------------------------------------------------------
      if (invitation.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "This invitation is no longer pending and cannot be accepted.",
        );
      }

      // ----------------------------------------------------------
      // Validate organization
      // ----------------------------------------------------------
      if (!organizationId) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation does not contain a valid organization.",
        );
      }

      // ----------------------------------------------------------
      // Validate email
      // ----------------------------------------------------------
      if (!normalizedEmail) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation does not contain a valid email address.",
        );
      }

      // ----------------------------------------------------------
      // Validate role
      // ----------------------------------------------------------
      if (!role) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation does not contain a valid organization role.",
        );
      }

      if (!isValidOrganizationRole(role)) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation contains an invalid organization role.",
        );
      }

      // ----------------------------------------------------------
      // Validate expiration
      // ----------------------------------------------------------
      const expiresAt = toDate(invitation.expiresAt);

      if (!expiresAt) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation does not contain a valid expiration date.",
        );
      }

      if (expiresAt.getTime() <= Date.now()) {
        throw new HttpsError(
          "failed-precondition",
          "This organization invitation has expired.",
        );
      }

      // ----------------------------------------------------------
      // Verify email matches invitation
      // ----------------------------------------------------------
      if (authenticatedEmail !== normalizedEmail) {
        throw new HttpsError(
          "permission-denied",
          "This invitation was issued to a different email address.",
        );
      }

      // ----------------------------------------------------------
      // Load organization
      // ----------------------------------------------------------
      const organizationRef = db
        .collection("organizations")
        .doc(organizationId);

      const organizationSnapshot =
        await transaction.get(organizationRef);

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization associated with this invitation could not " +
    "be found.",
        );
      }

      const organization =
        organizationSnapshot.data() ?? {};

      const organizationStatus =
        typeof organization.status === "string" ?
          organization.status :
          "";

      const organizationActive =
        organization.active === true;

      // ----------------------------------------------------------
      // Organization must be eligible for membership
      // ----------------------------------------------------------
      const membershipEligibleStatus =
        organizationStatus === "onboarding" ||
        organizationStatus === "active";

      if (
        !organizationActive ||
        !membershipEligibleStatus
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This organization is not currently eligible to accept new members.",
        );
      }

      // ----------------------------------------------------------
      // Deterministic membership ID
      // ----------------------------------------------------------
      const membershipId =
        `${uid}_${organizationId}`;

      const membershipRef = db
        .collection("organizationMemberships")
        .doc(membershipId);

      // ----------------------------------------------------------
      // Check for existing membership
      // ----------------------------------------------------------
      const membershipSnapshot =
        await transaction.get(membershipRef);

      if (membershipSnapshot.exists) {
        const existingMembership =
          membershipSnapshot.data() ?? {};

        if (existingMembership.active === true) {
          throw new HttpsError(
            "already-exists",
            "You are already an active member of this organization.",
          );
        }

        throw new HttpsError(
          "already-exists",
          "A membership already exists for this organization and user.",
        );
      }

      // ----------------------------------------------------------
      // Create membership
      // ----------------------------------------------------------
      const now =
        FieldValue.serverTimestamp();

      transaction.create(
        membershipRef,
        {
          id: membershipId,
          userId: uid,
          organizationId,
          role,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      );

      // ----------------------------------------------------------
      // Mark invitation accepted
      // ----------------------------------------------------------
      transaction.update(
        invitationRef,
        {
          status: "accepted",
          acceptedAt: now,
          acceptedByUserId: uid,
          updatedAt: now,
        },
      );

      // ----------------------------------------------------------
      // Return transaction result
      // ----------------------------------------------------------
      return {
        invitationId,
        organizationId,
        membershipId,
        role,
      };
    });

    // ------------------------------------------------------------
    // 5. Return success
    // ------------------------------------------------------------
    return {
      success: true,
      invitationId: result.invitationId,
      organizationId: result.organizationId,
      membershipId: result.membershipId,
      role: result.role,
    };
  },
);

// ================================================================
// Helpers
// ================================================================


/**
 * Determines whether an organization role can be assigned through
 * an invitation.
 *
 * @param role Organization role to validate.
 * @return True when the role can be assigned through an invitation.
 */
function isValidOrganizationRole(
  role: string,
): boolean {
  return [
    "org_admin",
    "org_manager",
    "org_staff",
    "org_member",
  ].includes(role);
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
