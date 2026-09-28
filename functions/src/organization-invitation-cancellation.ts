import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

import type {
  CallableRequest,
} from "firebase-functions/v2/https";

/**
 * Represents an organization invitation.
 */
type OrganizationInvitation = {
  id: string;
  organizationId: string;
  email?: string;
  normalizedEmail?: string;
  role?: string;
  status?: string;
  expiresAt?: FirebaseFirestore.Timestamp;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;
  cancelledByUserId?: string;
};

/**
 * Represents an organization.
 */
type Organization = {
  id?: string;
  status?: string;
  active?: boolean;
};

/**
 * Represents an organization membership.
 */
type OrganizationMembership = {
  id?: string;
  userId?: string;
  organizationId?: string;
  role?: string;
  active?: boolean;
};

/**
 * Firestore database instance used by the cancellation callable.
 */
/**
 * Returns the Firestore database instance.
 *
 * Firestore is resolved lazily so importing this module does not require
 * a Firebase Admin default app to already exist. This is important for
 * unit tests, where Firebase Admin is initialized during test setup.
 */
function getDb() {
  return getFirestore();
}

/**
 * Organization roles that are authorized to cancel invitations.
 */
const ALLOWED_CANCELLER_ROLES = new Set([
  "org_owner",
  "org_admin",
  "org_manager",
]);

/**
 * Organization lifecycle states that allow invitation management.
 */
const ELIGIBLE_ORGANIZATION_STATUSES = new Set([
  "onboarding",
  "active",
]);

/**
 * Ensures the callable request contains an authenticated user.
 *
 * @param request Firebase callable request.
 * @return Authenticated user's UID.
 * @throws HttpsError when authentication is missing.
 */
function requireAuthenticatedUser(
  request: CallableRequest,
): string {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to cancel an organization invitation.",
    );
  }

  return uid;
}

/**
 * Extracts and validates the invitation ID from the callable request.
 *
 * @param request Firebase callable request.
 * @return Normalized invitation ID.
 * @throws HttpsError when the invitation ID is missing or invalid.
 */
function getInvitationId(
  request: CallableRequest,
): string {
  const invitationId =
    request.data?.invitationId;

  if (
    typeof invitationId !== "string" ||
    !invitationId.trim()
  ) {
    throw new HttpsError(
      "invalid-argument",
      "invitationId is required.",
    );
  }

  return invitationId.trim();
}

/**
 * Determines whether the caller is a platform administrator.
 *
 * Platform administrators are allowed to manage invitations
 * without an organization membership.
 *
 * @param request Firebase callable request.
 * @return True when the platformAdmin claim is present.
 */
function isPlatformAdmin(
  request: CallableRequest,
): boolean {
  return (
    request.auth?.token?.platformAdmin === true
  );
}


/**
 * Determines whether an invitation is still pending.
 *
 * Cancellation is only allowed for invitations that
 * have not already been accepted or cancelled.
 *
 * @param invitation Organization invitation.
 * @return True when the invitation is pending.
 */
function isPendingInvitation(
  invitation: OrganizationInvitation,
): boolean {
  return invitation.status === "pending";
}

/**
 * Retrieves the organization membership for a user.
 *
 * Zebron uses a deterministic membership document ID
 * composed of the user ID and organization ID.
 *
 * @param userId User ID.
 * @param organizationId Organization ID.
 * @return Organization membership or null when none exists.
 */
async function getOrganizationMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership | null> {
  const membershipId =
    `${userId}_${organizationId}`;

  const membershipSnapshot = await getDb()
    .collection("organizationMemberships")
    .doc(membershipId)
    .get();

  if (!membershipSnapshot.exists) {
    return null;
  }

  return {
    id: membershipSnapshot.id,
    ...(membershipSnapshot.data() as OrganizationMembership),
  };
}

/**
 * Determines whether a user is authorized to cancel
 * an organization invitation.
 *
 * Platform administrators are authorized without membership.
 * Organization owners, administrators, and managers require
 * an active organization membership.
 *
 * @param request Firebase callable request.
 * @param userId Authenticated user ID.
 * @param organizationId Organization ID.
 * @return True when the caller is authorized.
 */
async function canCancelInvitation(
  request: CallableRequest,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  if (isPlatformAdmin(request)) {
    return true;
  }

  const membership =
    await getOrganizationMembership(
      userId,
      organizationId,
    );

  if (!membership) {
    return false;
  }

  if (membership.active !== true) {
    return false;
  }

  return ALLOWED_CANCELLER_ROLES.has(
    membership.role ?? "",
  );
}

/**
 * Cancels an organization invitation.
 *
 * Authorization is limited to:
 *
 * - Platform administrators.
 * - Active organization owners.
 * - Active organization administrators.
 * - Active organization managers.
 *
 * The associated organization must be in an eligible
 * lifecycle state and the invitation must still be pending.
 *
 * The final invitation state transition is performed inside
 * a Firestore transaction so that two concurrent cancellation
 * requests cannot both successfully cancel the invitation.
 */
export const cancelOrganizationInvitation =
  onCall(
    {
      region: "us-central1",
    },
    async (request) => {
      /*
       * Validate authentication before processing any
       * invitation information.
       */
      const userId =
        requireAuthenticatedUser(request);

      /*
       * Validate and normalize the invitation ID
       * supplied by the caller.
       */
      const invitationId =
        getInvitationId(request);

      /*
       * Build the Firestore reference for the
       * requested invitation.
       */
      const invitationReference = getDb()
        .collection("organizationInvitations")
        .doc(invitationId);

      /*
       * Load the invitation before performing
       * authorization or organization validation.
       */
      const invitationSnapshot =
        await invitationReference.get();

      /*
       * The requested invitation does not exist.
       */
      if (!invitationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization invitation could not be found.",
        );
      }

      const invitation =
        invitationSnapshot.data() as OrganizationInvitation;

      /*
       * Every invitation must reference a valid
       * organization before cancellation can continue.
       */
      if (
        !invitation.organizationId ||
        typeof invitation.organizationId !== "string"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation is not associated with a valid organization.",
        );
      }

      /*
       * Only pending invitations can be cancelled.
       *
       * Accepted and already-cancelled invitations are
       * immutable from the cancellation operation.
       */
      if (!isPendingInvitation(invitation)) {
        throw new HttpsError(
          "failed-precondition",
          "Only pending organization invitations " +
            "can be cancelled.",
        );
      }

      /*
       * Load the organization associated with the invitation.
       */
      const organizationReference =
        getDb()
          .collection("organizations")
          .doc(invitation.organizationId);

      const organizationSnapshot =
        await organizationReference.get();

      /*
       * An invitation cannot be cancelled when its
       * associated organization no longer exists.
       */
      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization associated with this " +
            "invitation could not be found.",
        );
      }

      const organization =
        organizationSnapshot.data() as Organization;

      /*
       * Invitation management is only available while
       * the organization is onboarding or active.
       */
      if (organization.active !== true) {
        throw new HttpsError(
          "failed-precondition",
          "This organization is not currently active.",
        );
      }

      if (
        typeof organization.status !== "string" ||
  !ELIGIBLE_ORGANIZATION_STATUSES.has(
    organization.status,
  )
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This organization is not currently eligible for invitation mgmt.",
        );
      }

      /*
       * Verify that the authenticated user has the
       * required organization-level authorization.
       */
      const authorized =
        await canCancelInvitation(
          request,
          userId,
          invitation.organizationId,
        );

      /*
       * Do not expose membership details to unauthorized
       * callers. All unauthorized membership cases use
       * the same permission-denied response.
       */
      if (!authorized) {
        throw new HttpsError(
          "permission-denied",
          "You do not have permission to cancel " +
            "invitations for this org.",
        );
      }

      /*
       * Use a server timestamp so the cancellation timestamp
       * is generated by Firestore rather than by the client.
       */
      const now =
        FieldValue.serverTimestamp();

      /*
       * Perform the final state transition transactionally.
       *
       * The invitation is re-read inside the transaction
       * because another request could have modified it after
       * the initial validation above.
       */
      await getDb().runTransaction(
        async (transaction) => {
          const currentSnapshot =
            await transaction.get(
              invitationReference,
            );

          /*
           * The invitation was removed after the initial read.
           */
          if (!currentSnapshot.exists) {
            throw new HttpsError(
              "not-found",
              "The organization invitation could not be found.",
            );
          }

          const currentInvitation =
            currentSnapshot.data() as OrganizationInvitation;

          /*
           * Re-check the invitation state inside the
           * transaction to prevent double cancellation.
           */
          if (
            currentInvitation.status !==
            "pending"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "Only pending organization invitations " +
                "can be cancelled.",
            );
          }

          /*
           * Transition the invitation from pending to
           * cancelled and record the user responsible
           * for the cancellation.
           */
          transaction.update(
            invitationReference,
            {
              status: "cancelled",
              cancelledAt: now,
              cancelledByUserId: userId,
              updatedAt: now,
            },
          );
        },
      );

      /*
       * Return a stable result to the client.
       */
      return {
        success: true,
        invitationId,
        organizationId:
          invitation.organizationId,
        status: "cancelled",
        cancelledByUserId: userId,
      };
    },
  );
