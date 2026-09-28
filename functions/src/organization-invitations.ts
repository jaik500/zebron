import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {
  OrganizationInvitationRecord,
} from "./organization-invitation.types";

type OrganizationInvitationRole =
  | "org_admin"
  | "org_manager"
  | "org_staff"
  | "org_member";

type OrganizationInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

const ALLOWED_ROLES: OrganizationInvitationRole[] = [
  "org_admin",
  "org_manager",
  "org_staff",
  "org_member",
];

const RESEND_API_URL =
  "https://api.resend.com/emails";

const ZEBRON_FROM_EMAIL =
  "Zebron <noreply@zebron.org>";

/**
 * Creates an organization invitation for a team member.
 */
function normalizeEmail(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Email address is required.",
    );
  }

  const email = value
    .trim()
    .toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "A valid email address is required.",
    );
  }

  return email;
}

/**
 * Normalizes an organization invitation email address.
 */
function normalizeRole(
  value: unknown,
): OrganizationInvitationRole {
  if (
    typeof value !== "string" ||
    !ALLOWED_ROLES.includes(
      value as OrganizationInvitationRole,
    )
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid organization role.",
    );
  }

  return value as OrganizationInvitationRole;
}

/**
 * Completes the invite-members onboarding step.
 */
function getRoleLabel(
  role: OrganizationInvitationRole,
): string {
  switch (role) {
  case "org_admin":
    return "Organization Admin";

  case "org_manager":
    return "Organization Manager";

  case "org_staff":
    return "Organization Staff";

  case "org_member":
    return "Organization Member";

  default:
    return role;
  }
}

/**
 * Completes the invite-members onboarding step.
 */
function getInvitationEmailText(
  organizationName: string,
  role: OrganizationInvitationRole,
): string {
  return [
    `You have been invited to join ${organizationName} on Zebron.`,
    "",
    `Your organization role: ${getRoleLabel(role)}`,
    "",
    "Sign in to Zebron to review and accept your invitation.",
    "",
    "Zebron",
    "https://zebron.org",
  ].join("\n");
}

/**
 * Verify that the caller has permission to manage
 * organization invitations.
 */
async function requireOrganizationInvitationAdmin(
  organizationId: string,
  uid: string,
): Promise<{
  organization: FirebaseFirestore.DocumentData;
  onboarding: FirebaseFirestore.DocumentData;
}> {
  const db = getFirestore();

  const organizationRef = db
    .collection("organizations")
    .doc(organizationId);

  const onboardingRef = db
    .collection("organizationOnboarding")
    .doc(organizationId);

  const membershipRef = db
    .collection("organizationMemberships")
    .doc(
      `${uid}_${organizationId}`,
    );

  const [
    organizationSnapshot,
    onboardingSnapshot,
    membershipSnapshot,
  ] = await Promise.all([
    organizationRef.get(),
    onboardingRef.get(),
    membershipRef.get(),
  ]);

  if (!organizationSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Organization not found.",
    );
  }

  if (!onboardingSnapshot.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Organization onboarding has not been initialized.",
    );
  }

  const organization =
    organizationSnapshot.data() ?? {};

  const onboarding =
    onboardingSnapshot.data() ?? {};


  if (!membershipSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to manage organization invitations.",
    );
  }

  const membership =
    membershipSnapshot.data() ?? {};

  const role = membership.role;

  if (
    membership.active !== true ||
    (
      role !== "org_owner" &&
      role !== "org_admin"
    )
  ) {
    throw new HttpsError(
      "permission-denied",
      "Only organization owners and administrators can manage invitations.",
    );
  }

  if (
    organization.status !== "onboarding"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Organization onboarding is no longer active.",
    );
  }

  if (
    onboarding.status !== "in_progress"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Organization onboarding is not in progress.",
    );
  }

  if (
    onboarding.currentStep !== "invite_members"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The organization is not currently on the Invite Team step.",
    );
  }

  return {
    organization,
    onboarding,
  };
}

/**
 * Create an organization invitation.
 */
export const createOrganizationInvitation =
  onCall(
    {
      region: "us-central1",
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in.",
        );
      }

      const data =
        request.data as Record<string, unknown>;

      const organizationId =
        typeof data.organizationId === "string" ?
          data.organizationId.trim() :
          "";

      if (!organizationId) {
        throw new HttpsError(
          "invalid-argument",
          "Organization ID is required.",
        );
      }

      const email =
        normalizeEmail(data.email);

      const role =
        normalizeRole(data.role);

      const uid =
        request.auth.uid;

      const {
        organization,
      } =
        await requireOrganizationInvitationAdmin(
          organizationId,
          uid,
        );

      const db =
        getFirestore();

      const invitationCollection =
        db.collection(
          "organizationInvitations",
        );

      /*
       * Prevent duplicate pending invitations
       * for the same organization/email.
       *
       * Firestore supports compound equality
       * queries without requiring a manual
       * composite index.
       */
      const existingSnapshot =
        await invitationCollection
          .where(
            "organizationId",
            "==",
            organizationId,
          )
          .where(
            "normalizedEmail",
            "==",
            email,
          )
          .where(
            "status",
            "==",
            "pending",
          )
          .limit(1)
          .get();

      if (!existingSnapshot.empty) {
        throw new HttpsError(
          "already-exists",
          "A pending invitation already exists for this email address.",
        );
      }

      const invitationRef =
        invitationCollection.doc();

      const now =
        FieldValue.serverTimestamp();

      const expiresAt =
        new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000,
        );

      const organizationName =
        typeof organization.name === "string" ?
          organization.name :
          "your organization";

      const invitation = {
        id: invitationRef.id,

        organizationId,

        email,

        normalizedEmail: email,

        role,

        invitedByUserId: uid,

        status:
          "pending" as OrganizationInvitationStatus,

        expiresAt,

        acceptedAt: null,

        acceptedByUserId: null,

        createdAt: now,

        updatedAt: now,
      };

      await invitationRef.set(
        invitation,
      );

      /*
       * Send the invitation email.
       *
       * The invitation record is created first so
       * the organization retains an auditable record
       * even if email delivery is temporarily unavailable.
       */
      const apiKey =
        process.env["RESEND_API_KEY"];

      if (!apiKey) {
        logger.error(
          "RESEND_API_KEY is not configured.",
          {
            organizationId,
            invitationId:
              invitationRef.id,
          },
        );
      } else {
        try {
          const response =
            await fetch(
              RESEND_API_URL,
              {
                method: "POST",

                headers: {
                  "Authorization":
                    `Bearer ${apiKey}`,

                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    from:
                      ZEBRON_FROM_EMAIL,

                    to: [email],

                    subject:
                      `Invitation to join ${organizationName} on Zebron`,

                    text:
                      getInvitationEmailText(
                        organizationName,
                        role,
                      ),
                  }),
              },
            );

          const result =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (!response.ok) {
            logger.error(
              "Failed to send organization invitation email.",
              {
                status:
                  response.status,

                result,

                organizationId,

                invitationId:
                  invitationRef.id,

                email,
              },
            );
          }
        } catch (error: unknown) {
          logger.error(
            "Invitation email request failed.",
            {
              error,

              organizationId,

              invitationId:
                invitationRef.id,

              email,
            },
          );
        }
      }

      await db
        .collection("auditLogs")
        .add({
          action:
            "ORGANIZATION_INVITATION_CREATED",

          entityType:
            "organizationInvitation",

          entityId:
            invitationRef.id,

          actorId:
            uid,

          actorEmail:
            request.auth.token.email ??
            null,

          actorName:
            null,

          actorType:
            "user",

          outcome:
            "success",

          source:
            "backend",

          reason:
            null,

          metadata: {
            organizationId,

            email,

            role,

            expiresAt,
          },

          before:
            null,

          after:
            {
              status:
                "pending",

              role,

              email,
            },

          createdAt:
            FieldValue.serverTimestamp(),
        });

      logger.info(
        "Organization invitation created.",
        {
          organizationId,

          invitationId:
            invitationRef.id,

          actorId:
            uid,
        },
      );

      return {
        success: true,

        invitation: {
          ...invitation,

          expiresAt:
            expiresAt.toISOString(),
        },
      };
    },
  );

/**
 * Retrieve invitations for the current organization.
 */
export const getOrganizationInvitations =
  onCall(
    {
      region: "us-central1",
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in.",
        );
      }

      const data =
        request.data as Record<string, unknown>;

      const organizationId =
        typeof data.organizationId === "string" ?
          data.organizationId.trim() :
          "";

      if (!organizationId) {
        throw new HttpsError(
          "invalid-argument",
          "Organization ID is required.",
        );
      }

      const uid =
        request.auth.uid;

      await requireOrganizationInvitationAdmin(
        organizationId,
        uid,
      );

      const db =
        getFirestore();

      const snapshot =
        await db
          .collection(
            "organizationInvitations",
          )
          .where(
            "organizationId",
            "==",
            organizationId,
          )
          .get();

      const invitations = snapshot.docs.map((snapshot) => {
        const data = snapshot.data() as OrganizationInvitationRecord;

        return {
          id: snapshot.id,
          ...data,
        };
      });
      invitations.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      });

      return {
        invitations,
      };
    },
  );

/**
 * Complete the Invite Team onboarding step.
 *
 * Invitations are optional, so an organization
 * may continue without inviting additional users.
 */
export const completeOrganizationInviteMembersStep =
  onCall(
    {
      region: "us-central1",
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in.",
        );
      }

      const data =
        request.data as Record<string, unknown>;

      const organizationId =
        typeof data.organizationId === "string" ?
          data.organizationId.trim() :
          "";

      if (!organizationId) {
        throw new HttpsError(
          "invalid-argument",
          "Organization ID is required.",
        );
      }

      const uid =
        request.auth.uid;

      const db =
        getFirestore();

      const organizationRef =
        db
          .collection("organizations")
          .doc(organizationId);

      const onboardingRef =
        db
          .collection(
            "organizationOnboarding",
          )
          .doc(organizationId);

      const membershipRef =
        db
          .collection(
            "organizationMemberships",
          )
          .doc(
            `${uid}_${organizationId}`,
          );

      const result =
        await db.runTransaction(
          async (transaction) => {
            const [
              organizationSnapshot,
              onboardingSnapshot,
              membershipSnapshot,
            ] =
              await Promise.all([
                transaction.get(
                  organizationRef,
                ),

                transaction.get(
                  onboardingRef,
                ),

                transaction.get(
                  membershipRef,
                ),
              ]);

            if (
              !organizationSnapshot.exists
            ) {
              throw new HttpsError(
                "not-found",
                "Organization not found.",
              );
            }

            if (
              !onboardingSnapshot.exists
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding was not found.",
              );
            }

            if (
              !membershipSnapshot.exists
            ) {
              throw new HttpsError(
                "permission-denied",
                "You are not a member of this organization.",
              );
            }

            const membership =
              membershipSnapshot.data() ??
              {};

            if (
              membership.active !== true ||
              (
                membership.role !==
                  "org_owner" &&
                membership.role !==
                  "org_admin"
              )
            ) {
              throw new HttpsError(
                "permission-denied",
                "Only organization owners and administrators can " +
    "complete this step.",
              );
            }

            const organization =
              organizationSnapshot.data() ??
              {};

            const onboarding =
              onboardingSnapshot.data() ??
              {};

            if (
              organization.status !==
              "onboarding"
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding is no longer active.",
              );
            }

            if (
              onboarding.status !==
              "in_progress"
            ) {
              throw new HttpsError(
                "failed-precondition",
                "Organization onboarding is not in progress.",
              );
            }

            if (
              onboarding.currentStep !==
              "invite_members"
            ) {
              throw new HttpsError(
                "failed-precondition",
                "The organization is not currently on the Invite Team step.",
              );
            }

            const completedSteps =
              Array.isArray(
                onboarding.completedSteps,
              ) ?
                onboarding.completedSteps :
                [];

            const nextCompletedSteps =
              Array.from(
                new Set([
                  ...completedSteps,
                  "invite_members",
                ]),
              );

            transaction.update(
              onboardingRef,
              {
                completedSteps:
                  nextCompletedSteps,

                currentStep:
                  "configuration",

                status:
                  "in_progress",

                completedAt:
                  null,

                updatedAt:
                  FieldValue.serverTimestamp(),
              },
            );

            const auditRef =
              db
                .collection("auditLogs")
                .doc();

            transaction.set(
              auditRef,
              {
                action:
                  "ORGANIZATION_ONBOARDING_STEP_COMPLETED",

                entityType:
                  "organizationOnboarding",

                entityId:
                  organizationId,

                actorId:
                  uid,

                actorEmail:
                  request.auth?.token
                    ?.email ??
                  null,

                actorName:
                  null,

                actorType:
                  "user",

                outcome:
                  "success",

                source:
                  "backend",

                reason:
                  null,

                metadata: {
                  organizationId,

                  completedStep:
                    "invite_members",

                  nextStep:
                    "configuration",
                },

                before:
                  null,

                after:
                  {
                    currentStep:
                      "configuration",
                  },

                createdAt:
                  FieldValue.serverTimestamp(),
              },
            );

            return {
              completedSteps:
                nextCompletedSteps,

              currentStep:
                "configuration",
            };
          },
        );

      return {
        success: true,

        organizationId,

        onboardingId:
          organizationId,

        currentStep:
          result.currentStep,

        completedSteps:
          result.completedSteps,
      };
    },
  );
