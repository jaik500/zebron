import {getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const db = getFirestore();

export const getOrganizationInvitationPreview = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    const invitationId =
      typeof request.data?.invitationId === "string" ?
        request.data.invitationId.trim() :
        "";

    if (!invitationId) {
      throw new HttpsError(
        "invalid-argument",
        "Invitation ID is required.",
      );
    }

    try {
      const invitationSnapshot = await db
        .collection("organizationInvitations")
        .doc(invitationId)
        .get();

      if (!invitationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Invitation not found.",
        );
      }

      const invitation =
        invitationSnapshot.data() ?? {};

      const organizationId =
        typeof invitation.organizationId === "string" ?
          invitation.organizationId.trim() :
          "";

      if (!organizationId) {
        throw new HttpsError(
          "failed-precondition",
          "The invitation does not contain an organization.",
        );
      }

      const organizationSnapshot = await db
        .collection("organizations")
        .doc(organizationId)
        .get();

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization associated with this invitation " +
"could not be found.",
        );
      }

      const organization =
        organizationSnapshot.data() ?? {};

      const organizationName =
        typeof organization.name === "string" ?
          organization.name.trim() :
          "";

      if (!organizationName) {
        throw new HttpsError(
          "failed-precondition",
          "The organization does not have a name.",
        );
      }

      return {
        success: true,
        invitationId,
        organizationId,
        organizationName,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error(
        "Failed to load organization invitation preview.",
        {
          invitationId,
          error,
        },
      );

      throw new HttpsError(
        "internal",
        "Unable to load invitation details.",
      );
    }
  },
);
