/* eslint-disable max-len */

import {
  onCall,
  onRequest,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {randomUUID} from "node:crypto";
import Stripe from "stripe";
import {
  provisionOrganization as provisionOrganizationFunction,
} from "./organization-provisioning";
import {
  createOrganizationInvitation,
  getOrganizationInvitations,
  completeOrganizationInviteMembersStep,
} from "./organization-invitations";
import { completeOrganizationFirstQuestion } from "./organization-onboarding-first-question";

initializeApp();

/**
 * Resend configuration.
 *
 * The API key is stored in Firebase Secret Manager.
 * It is never exposed to the Angular application.
 */
const RESEND_API_URL = "https://api.resend.com/emails";
const ZEBRON_FROM_EMAIL = "Zebron <noreply@zebron.org>";

const db = getFirestore();
const auth = getAuth();

interface UpdateUserRequest {
  uid: string;
  profile: Record<string, unknown>;
}

interface UpdateUserResponse {
  success: boolean;
  uid: string;
}

interface DeleteUserRequest {
  uid: string;
}

interface DeleteUserResponse {
  success: boolean;
  uid: string;
}

type PlatformRole =
  | "platform-admin"
  | "platform-operator"
  | "platform-support"
  | "platform-auditor";

const PLATFORM_ROLES: readonly PlatformRole[] = [
  "platform-admin",
  "platform-operator",
  "platform-support",
  "platform-auditor",
];

/**
 * Determines whether a value is a recognized platform role.
 *
 * @param value The role value to validate.
 * @returns True when the value is a supported platform role.
 */
function isPlatformRole(
  value: string | undefined,
): value is PlatformRole {
  return (
    value !== undefined &&
    PLATFORM_ROLES.includes(
      value as PlatformRole,
    )
  );
}

/**
 * Return the initialized Firestore instance.
 *
 * @return {FirebaseFirestore.Firestore} Firestore database instance.
 */
function getDb() {
  return getFirestore();
}


/**
 * Require the authenticated caller to be a platform administrator.
 *
 * Canonical:
 *   platformRole == "platform-admin"
 *
 * Temporary migration fallback:
 *   role == "admin"
 *
 * The legacy role is only honored when platformRole
 * has not yet been established.
 */
async function requireAdmin(
  request: CallableRequest<unknown>,
): Promise<{
  uid: string;
  email?: string;
}> {
  /**
   * Firebase Authentication must be present.
   */
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in as an administrator.");
  }

  const uid = request.auth.uid;

  /**
   * Load the Zebron Firestore profile.
   */
  const profile = await getDb().collection("users").doc(uid).get();

  if (!profile.exists) {
    throw new HttpsError("permission-denied", "Administrator profile could not be found.");
  }

  const profileData = profile.data();

  /**
 * Canonical authorization uses platformRole.
 *
 * Legacy compatibility is retained temporarily for
 * existing users whose platformRole has not yet been
 * migrated.
 */
  const isPlatformAdmin =
  profileData?.["platformRole"] === "platform-admin" ||
  (
    profileData?.["platformRole"] === undefined &&
    profileData?.["role"] === "admin"
  );

  if (!isPlatformAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only platform administrators can send email.",
    );
  }

  return {
    uid,
    email: typeof profileData?.["email"] === "string" ? profileData["email"] : undefined,
  };
}

/**
 * Create a new Firebase Authentication user and
 * corresponding Firestore user profile.
 *
 * This function is intended for administrator use.
 */
export const createUser = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    /**
     * Verify that the caller is authenticated.
     */
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be authenticated to create a user.");
    }

    const adminUid = request.auth.uid;

    /**
     * Retrieve the administrator's Firestore profile.
     */
    const adminProfile = await getDb().collection("users").doc(adminUid).get();

    if (!adminProfile.exists) {
      throw new HttpsError("permission-denied", "Administrator profile could not be found.");
    }

    const adminData = adminProfile.data();

    /**
 * Authorize the caller using the canonical platform role.
 *
 * Legacy compatibility:
 *   role: "admin" -> treated as platform-admin
 *
 * This allows existing administrator accounts to continue
 * working during the platformRole migration.
 */
    const callerPlatformRole = adminData?.["platformRole"];

    const callerIsPlatformAdmin =
  callerPlatformRole === "platform-admin" ||
  (
    callerPlatformRole === undefined &&
    adminData?.["role"] === "admin"
  );

    if (!callerIsPlatformAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only platform administrators can create users.",
      );
    }

    /**
     * Extract submitted user information.
     */
    const data = request.data as {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
  role?: unknown;
  platformRole?: unknown;
};

    const email = clean(data.email);

    const password =
      typeof data.password === "string"
        ? data.password
        : undefined;

    const displayName =
      clean(data.displayName);

    const legacyRole =
      clean(data.role);

    const requestedPlatformRole =
      clean(data.platformRole);

    /**
     * Resolve the canonical platform role.
     *
     * New callers should provide platformRole.
     *
     * The legacy role is supported temporarily:
     *
     *   admin -> platform-admin
     *   user  -> no platform role
     */
    let platformRole: PlatformRole | null = null;

    if (requestedPlatformRole) {
      if (
        !isPlatformRole(
          requestedPlatformRole,
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid platform role.",
        );
      }

      platformRole =
        requestedPlatformRole;
    } else if (
      legacyRole === "admin"
    ) {
      platformRole =
        "platform-admin";
    } else if (
      legacyRole &&
      legacyRole !== "user"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid legacy user role.",
      );
    }

    let firebaseUser;

    try {
      /**
       * Create the Firebase Authentication account.
       */
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName,
      });
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);

      logger.error("Failed to create Firebase user.", {
        errorCode,
        email,
      });

      if (errorCode === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "A user with this email already exists.");
      }

      throw new HttpsError("internal", "Unable to create the user account.");
    }

    try {
      /**
       * Create the corresponding Firestore profile.
       *
       * Optional fields are only included when
       * they contain actual values. This prevents
       * Firestore from receiving undefined values.
       */
      const userProfile: Record<string, unknown> = {
        uid: firebaseUser.uid,

        email,

        platformRole,

        createdAt: FieldValue.serverTimestamp(),

        updatedAt: FieldValue.serverTimestamp(),
      };

      if (displayName) {
        userProfile["displayName"] = displayName;
      }

      await getDb().collection("users").doc(firebaseUser.uid).set(userProfile);
    } catch (error: unknown) {
      logger.error("Failed to create Firestore user profile.", {
        error,
        uid: firebaseUser.uid,
        email,
      });

      /**
       * If the Firestore profile cannot be created,
       * remove the Firebase Authentication account
       * so we do not leave an incomplete user behind.
       */
      try {
        await auth.deleteUser(firebaseUser.uid);
      } catch (deleteError: unknown) {
        logger.error("Failed to roll back Firebase user after Firestore failure.", {
          deleteError,
          uid: firebaseUser.uid,
        });
      }

      throw new HttpsError("internal", "Unable to complete user creation.");
    }

    /**
     * Log the successful user creation.
     */
    logger.info("Administrator created a new Zebron user.", {
      adminUid,
      createdUserUid: firebaseUser.uid,
      email,
      platformRole,
    });

    /**
     * Return the newly created account information.
     */
    return {
      success: true,
      uid: firebaseUser.uid,
      email,
      platformRole,
    };
  },
);

/**
 * Update an existing Zebron user.
 *
 * This operation is restricted to administrators.
 *
 * Protected fields such as uid, role, createdAt, and updatedAt
 * cannot be supplied by the client.
 */
export const updateUser = onCall(
  {
    region: "us-central1",
  },
  async (request): Promise<UpdateUserResponse> => {
    const admin = await requireAdmin(request);

    const data = request.data as UpdateUserRequest | undefined;

    if (!data || typeof data.uid !== "string" || !data.uid.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "A valid user ID is required.",
      );
    }

    if (!data.profile || typeof data.profile !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "A valid user profile is required.",
      );
    }

    const userId = data.uid.trim();

    /**
     * These fields are controlled by the backend.
     *
     * In particular, clients cannot elevate a user's
     * administrator role through this function.
     */
    const protectedFields = new Set([
      "id",
      "uid",
      "role",
      "createdAt",
      "updatedAt",
    ]);

    const updates: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(data.profile)) {
      if (protectedFields.has(field)) {
        continue;
      }

      if (value !== undefined) {
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "No editable user fields were supplied.",
      );
    }

    updates["updatedAt"] = FieldValue.serverTimestamp();

    const userReference = getDb()
      .collection("users")
      .doc(userId);

    const existingUser = await userReference.get();

    if (!existingUser.exists) {
      throw new HttpsError(
        "not-found",
        "The requested user could not be found.",
      );
    }

    try {
      await userReference.update(updates);
    } catch (error: unknown) {
      logger.error("Failed to update Zebron user.", {
        error,
        adminUid: admin.uid,
        targetUserUid: userId,
      });

      throw new HttpsError(
        "internal",
        "Unable to update the user.",
      );
    }

    logger.info("Administrator updated a Zebron user.", {
      adminUid: admin.uid,
      targetUserUid: userId,
      updatedFields: Object.keys(updates).filter(
        (field) => field !== "updatedAt",
      ),
    });

    return {
      success: true,
      uid: userId,
    };
  },
);

/**
 * Delete a Zebron user.
 *
 * This removes:
 *
 * 1. The Firebase Authentication account.
 * 2. The corresponding Firestore user profile.
 *
 * This operation is restricted to administrators.
 */
export const deleteUser = onCall(
  {
    region: "us-central1",
  },
  async (request): Promise<DeleteUserResponse> => {
    const admin = await requireAdmin(request);

    const data = request.data as DeleteUserRequest | undefined;

    if (!data || typeof data.uid !== "string" || !data.uid.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "A valid user ID is required.",
      );
    }

    const userId = data.uid.trim();

    /**
     * Prevent an administrator from deleting their own account.
     */
    if (userId === admin.uid) {
      throw new HttpsError(
        "failed-precondition",
        "Administrators cannot delete their own account.",
      );
    }

    const userReference = getDb()
      .collection("users")
      .doc(userId);

    const existingUser = await userReference.get();

    if (!existingUser.exists) {
      throw new HttpsError(
        "not-found",
        "The requested user could not be found.",
      );
    }

    try {
      /**
       * Delete the Firebase Authentication account.
       */
      await auth.deleteUser(userId);

      /**
       * Delete the corresponding Firestore profile.
       */
      await userReference.delete();
    } catch (error: unknown) {
      logger.error("Failed to delete Zebron user.", {
        error,
        adminUid: admin.uid,
        targetUserUid: userId,
      });

      throw new HttpsError(
        "internal",
        "Unable to delete the user.",
      );
    }

    logger.info("Administrator deleted a Zebron user.", {
      adminUid: admin.uid,
      targetUserUid: userId,
    });

    return {
      success: true,
      uid: userId,
    };
  },
);

/**
 * Send a password-reset email for an existing user.
 *
 * Only authenticated administrators may use this function.
 *
 * The administrator never sees or handles the user's password.
 * Firebase generates the secure password-reset link and Resend
 * delivers it to the user's email address.
 */
export const resetUserPassword = onCall(
  {
    region: "us-central1",

    // Allow this function to access the Resend API key.
    secrets: ["RESEND_API_KEY"],
  },

  async (request) => {
    /**
     * Verify that the caller is an authenticated administrator.
     */
    const admin = await requireAdmin(request);

    /**
     * Read the target Firebase Authentication UID.
     */
    const data = request.data as {
      uid?: unknown;
    };

    const uid = clean(data.uid);

    if (!uid) {
      throw new HttpsError("invalid-argument", "User ID is required.");
    }

    /**
     * Find the target Firebase Authentication account.
     */
    let targetUser;

    try {
      targetUser = await auth.getUser(uid);
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);

      logger.error("Failed to find Firebase user for password reset.", {
        errorCode,
        adminUid: admin.uid,
        uid,
      });

      if (errorCode === "auth/user-not-found") {
        throw new HttpsError("not-found", "The user account could not be found.");
      }

      throw new HttpsError("internal", "Unable to locate the user account.");
    }

    /**
     * The target account must have an email address.
     */
    const targetEmail = targetUser.email?.trim().toLowerCase();

    if (!targetEmail) {
      throw new HttpsError("failed-precondition", "This user does not have an email address.");
    }

    /**
     * Generate Firebase's secure password-reset link.
     *
     * The password itself is never exposed to the administrator.
     */
    let resetLink: string;

    try {
      resetLink = await auth.generatePasswordResetLink(targetEmail);
    } catch (error: unknown) {
      logger.error("Failed to generate password reset link.", {
        error,
        adminUid: admin.uid,
        uid,
      });

      throw new HttpsError("internal", "Unable to generate the password reset link.");
    }

    /**
     * Get the Resend API key from Firebase Secret Manager.
     */
    const apiKey = process.env["RESEND_API_KEY"];

    if (!apiKey) {
      logger.error("RESEND_API_KEY is not configured.");

      throw new HttpsError("failed-precondition", "Email service is not configured.");
    }

    /**
     * Build the password-reset email.
     */
    const subject = "Reset your Zebron password";

    const message = [
      "Hello,",
      "",
      "A password reset was requested for your Zebron account.",
      "",
      "Click the link below to create a new password:",
      "",
      resetLink,
      "",
      "If you did not request a password reset,",
      "you can safely ignore this email.",
      "",
      "Zebron",
    ].join("\n");

    /**
     * Send the password-reset email through Resend.
     */
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,

          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          from: ZEBRON_FROM_EMAIL,

          to: [targetEmail],

          subject,

          text: message,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error("Resend failed to send password reset email.", {
          status: response.status,

          result,

          adminUid: admin.uid,

          targetUserUid: uid,

          to: targetEmail,
        });

        throw new HttpsError("internal", "Unable to send the password reset email.");
      }

      /**
       * Record the administrative action.
       *
       * Do NOT store the password-reset link in Firestore.
       */
      await getDb().collection("passwordResetRequests").add({
        userId: uid,

        email: targetEmail,

        requestedBy: admin.uid,

        createdAt: FieldValue.serverTimestamp(),
      });

      /**
       * Log successful delivery.
       *
       * The reset link itself is intentionally
       * never written to the logs.
       */
      logger.info("Password reset email sent successfully.", {
        adminUid: admin.uid,

        targetUserUid: uid,

        email: targetEmail,
      });

      return {
        success: true,

        email: targetEmail,
      };
    } catch (error: unknown) {
      /**
       * Preserve Firebase HttpsErrors.
       */
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Unexpected error while sending password reset email.", {
        error,

        adminUid: admin.uid,

        targetUserUid: uid,

        email: targetEmail,
      });

      throw new HttpsError("internal", "Unable to send the password reset email.");
    }
  },
);

/**
 * Receive a public contact form submission.
 *
 * The function validates and sanitizes the submitted
 * information before storing it in Firestore.
 */
export const submitContactMessage = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const data = request.data as {
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
      website?: unknown;
    };

    /**
     * Honeypot protection.
     *
     * Normal users should never populate this field.
     * Bots that populate it receive a successful response
     * without creating a Firestore document.
     */
    if (typeof data.website === "string" && data.website.trim()) {
      return {
        success: true,
      };
    }

    /**
     * Clean the submitted values.
     */
    const name = typeof data.name === "string" ? data.name.trim() : "";

    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

    const subject = typeof data.subject === "string" ? data.subject.trim() : "";

    const message = typeof data.message === "string" ? data.message.trim() : "";

    /**
     * Validate the sender's name.
     */
    if (!name) {
      throw new HttpsError("invalid-argument", "Name is required.");
    }

    if (name.length > 100) {
      throw new HttpsError("invalid-argument", "Name is too long.");
    }

    /**
     * Validate the email address.
     */
    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError("invalid-argument", "A valid email address is required.");
    }

    /**
     * Validate the subject.
     */
    if (!subject) {
      throw new HttpsError("invalid-argument", "Subject is required.");
    }

    if (subject.length > 200) {
      throw new HttpsError("invalid-argument", "Subject is too long.");
    }

    /**
     * Validate the message.
     */
    if (!message) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }

    if (message.length > 5000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    /**
     * Capture the authenticated user's UID when
     * available. The contact form remains available
     * to public visitors.
     */
    const submittedBy = request.auth?.uid;

    /**
     * Build the Firestore document without
     * undefined values.
     */
    const contactMessage: Record<string, unknown> = {
      name,
      email,
      subject,
      message,

      status: "new",

      createdAt: FieldValue.serverTimestamp(),
    };

    if (submittedBy) {
      contactMessage["submittedBy"] = submittedBy;
    }

    /**
     * Store the contact message.
     */
    try {
      await getDb().collection("contactMessages").add(contactMessage);
    } catch (error: unknown) {
      logger.error("Failed to save contact message.", {
        error,
        email,
      });

      throw new HttpsError("internal", "Unable to receive your message.");
    }

    /**
     * Log successful contact reception.
     */
    logger.info("New Zebron contact message received.", {
      email,
      subject,
      submittedBy,
    });

    return {
      success: true,
    };
  },
);

/**
 * Receive inbound email from Resend.
 *
 * Resend sends an email.received webhook whenever an email
 * arrives at a configured inbound address or custom domain.
 *
 * This endpoint:
 * 1. Verifies the Resend webhook signature.
 * 2. Confirms the event is an inbound email.
 * 3. Retrieves the complete received email from Resend.
 * 4. Stores the message in Firestore.
 *
 * Resend calls this function directly, so this must be
 * an HTTP function rather than an onCall function.
 */
/**
 * Personal Gmail address that receives a copy
 * of every inbound Zebron email.
 */
const INBOUND_FORWARD_EMAIL =
  "jaik500@gmail.com";


/**
 * Receive inbound email from Resend.
 *
 * Resend sends an email.received webhook whenever
 * an email arrives at the configured inbound domain.
 *
 * Processing flow:
 *
 * 1. Verify the Resend webhook signature.
 * 2. Confirm the event is email.received.
 * 3. Retrieve the complete received email.
 * 4. Retrieve attachment metadata.
 * 5. Store the message in contactMessages.
 * 6. Forward the message to the administrator's Gmail.
 *
 * This is an HTTP function because Resend calls
 * the endpoint directly.
 */
export const receiveInboundEmail = onRequest(
  {
    region: "us-central1",

    /**
     * Give this function access to the secrets
     * required for Resend.
     */
    secrets: [
      "RESEND_API_KEY",
      "RESEND_WEBHOOK_SECRET",
    ],
  },

  async (request, response) => {
    /**
     * Only POST requests are accepted.
     */
    if (request.method !== "POST") {
      response
        .status(405)
        .send("Method Not Allowed");

      return;
    }

    try {
      /**
       * Resend/Svix signatures must be verified
       * against the original raw request body.
       */
      const rawBody =
        typeof request.rawBody === "string" ?
          request.rawBody :
          request.rawBody?.toString("utf8");

      if (!rawBody) {
        logger.error(
          "Inbound email webhook has no raw request body."
        );

        response
          .status(400)
          .send("Missing request body.");

        return;
      }

      /**
       * Read the Svix verification headers.
       */
      const svixId =
        request.header("svix-id");

      const svixTimestamp =
        request.header("svix-timestamp");

      const svixSignature =
        request.header("svix-signature");

      if (
        !svixId ||
        !svixTimestamp ||
        !svixSignature
      ) {
        logger.error(
          "Inbound email webhook is missing signature headers."
        );

        response
          .status(401)
          .send("Missing webhook signature.");

        return;
      }

      /**
       * Read the webhook signing secret from
       * Firebase Secret Manager.
       */
      const webhookSecret =
        process.env["RESEND_WEBHOOK_SECRET"];

      if (!webhookSecret) {
        logger.error(
          "RESEND_WEBHOOK_SECRET is not configured."
        );

        response
          .status(500)
          .send("Webhook configuration error.");

        return;
      }

      /**
       * Read the Resend API key.
       */
      const resendApiKey =
        process.env["RESEND_API_KEY"];

      if (!resendApiKey) {
        logger.error(
          "RESEND_API_KEY is not configured."
        );

        response
          .status(500)
          .send("Email configuration error.");

        return;
      }

      /**
       * Load the Resend SDK.
       */
      const {Resend} =
        await import("resend");

      const resend =
        new Resend(resendApiKey);

      /**
       * Verify the Resend/Svix webhook.
       *
       * Resend recommends using the raw request
       * body together with the Svix headers.
       */
      const event =
        resend.webhooks.verify({
          payload: rawBody,

          headers: {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
          },

          webhookSecret,
        }) as {
          type?: string;

          created_at?: string;

          data?: {
            email_id?: string;
            created_at?: string;
            from?: string;
            to?: string[];
            cc?: string[];
            bcc?: string[];
            message_id?: string;
            subject?: string;
            attachments?: unknown[];
          };
        };

      /**
       * Only process inbound email events.
       */
      if (
        event.type !== "email.received"
      ) {
        response
          .status(200)
          .json({
            success: true,
            ignored: true,
          });

        return;
      }

      const webhookEmail =
        event.data;

      /**
       * The Resend email ID is required
       * to retrieve the complete email.
       */
      if (!webhookEmail?.email_id) {
        logger.error(
          "Inbound email event has no email ID."
        );

        response
          .status(400)
          .send("Missing email ID.");

        return;
      }

      const emailId =
        webhookEmail.email_id;

      /**
       * Use the Resend email ID as the Firestore
       * document ID.
       *
       * This provides idempotency because Resend
       * may retry webhook delivery.
       */
      const messageRef =
        db
          .collection("contactMessages")
          .doc(emailId);

      /**
       * Check whether this message has already
       * been processed.
       */
      const existing =
        await messageRef.get();

      if (existing.exists) {
        const existingData =
          existing.data();

        /**
         * If the message already exists and has
         * been forwarded, do nothing.
         */
        if (
          existingData?.["forwardedAt"]
        ) {
          logger.info(
            "Inbound email already processed and forwarded.",
            {
              emailId,
            }
          );

          response
            .status(200)
            .json({
              success: true,
              duplicate: true,
              forwarded: true,
            });

          return;
        }

        /**
         * If the document exists but forwarding
         * did not complete, continue processing
         * instead of sending a duplicate blindly.
         */
        logger.info(
          "Inbound email exists but forwarding has not completed.",
          {
            emailId,
          }
        );
      }

      /**
       * Retrieve the complete received email.
       */
      const {
        data: receivedEmail,
        error: receiveError,
      } =
        await resend
          .emails
          .receiving
          .get(emailId);

      if (
        receiveError ||
        !receivedEmail
      ) {
        logger.error(
          "Unable to retrieve received email from Resend.",
          {
            emailId,
            error: receiveError,
          }
        );

        response
          .status(502)
          .send(
            "Unable to retrieve received email."
          );

        return;
      }

      /**
       * Retrieve attachment metadata.
       *
       * The actual attachment content remains
       * available through Resend.
       */
      const {
        data: attachments,
        error: attachmentError,
      } =
        await resend
          .emails
          .receiving
          .attachments
          .list({
            emailId,
          });

      if (attachmentError) {
        logger.warn(
          "Unable to retrieve inbound email attachments.",
          {
            emailId,
            error: attachmentError,
          }
        );
      }

      /**
       * Parse the sender.
       *
       * Examples:
       *
       * John Doe <john@example.com>
       *
       * or:
       *
       * john@example.com
       */
      const sender =
        receivedEmail.from ??
        webhookEmail.from ??
        "";

      const senderMatch =
        sender.match(
          /^(.*?)\s*<([^>]+)>$/,
        );

      const senderName =
        senderMatch?.[1]?.trim() ??
        "";

      const senderEmail =
        senderMatch?.[2]?.trim().toLowerCase() ??
        sender.trim().toLowerCase();

      /**
       * Make sure we have a valid sender.
       */
      if (!senderEmail) {
        logger.error(
          "Inbound email does not contain a sender email address.",
          {
            emailId,
          }
        );

        response
          .status(400)
          .send(
            "Missing sender email address."
          );

        return;
      }

      /**
       * Resolve the subject.
       */
      const subject =
        (
          receivedEmail.subject ??
          webhookEmail.subject ??
          ""
        ).trim();

      /**
       * Prefer the plain-text body.
       *
       * Fall back to HTML if no text body
       * was returned.
       */
      const message =
        (
          receivedEmail.text ??
          ""
        ).trim() ||
        (
          receivedEmail.html ??
          ""
        ).trim();

      /**
       * Resolve the original Message-ID.
       *
       * This will be useful for threaded replies.
       */
      const messageId =
        receivedEmail.message_id ??
        webhookEmail.message_id ??
        null;

      /**
       * Store the inbound email using the same
       * contactMessages collection used by the
       * existing Zebron mailbox.
       */
      await messageRef.set(
        {
          /**
           * Identify this as an inbound email.
           */
          source: "email",

          provider: "resend",

          emailId,

          messageId,

          /**
           * Existing mailbox sender fields.
           */
          name:
            senderName ||
            senderEmail,

          email:
            senderEmail,

          /**
           * Preserve original addressing.
           */
          from:
            sender,

          to:
            receivedEmail.to ??
            webhookEmail.to ??
            [],

          cc:
            receivedEmail.cc ??
            webhookEmail.cc ??
            [],

          bcc:
            receivedEmail.bcc ??
            webhookEmail.bcc ??
            [],

          /**
           * Existing mailbox fields.
           */
          subject,

          message,

          /**
           * Preserve HTML for future rendering.
           */
          html:
            receivedEmail.html ??
            "",

          /**
           * Preserve original headers.
           */
          headers:
            receivedEmail.headers ??
            {},

          /**
           * Preserve attachment metadata.
           */
          attachments:
            attachments ??
            [],

          /**
           * IMPORTANT:
           *
           * The ContactMailbox uses "new",
           * "read", and "archived".
           *
           * Do NOT use "unread" here.
           */
          status: "new",

          read: false,

          archived: false,

          /**
           * Firestore timestamps.
           */
          createdAt:
            FieldValue.serverTimestamp(),

          receivedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),

          /**
           * Forwarding state.
           *
           * We intentionally leave forwardedAt
           * empty until Gmail forwarding succeeds.
           */
          forwardedTo:
            INBOUND_FORWARD_EMAIL,

          forwardedAt:
            null,

          forwardingEmailId:
            null,
        },
        {
          merge: true,
        },
      );

      logger.info(
        "Inbound email stored successfully.",
        {
          emailId,
          from:
            receivedEmail.from,
          subject:
            receivedEmail.subject,
        }
      );

      /**
       * Build the forwarded email.
       *
       * We use Reply-To so that when you reply
       * from Gmail, the response goes to the
       * original sender.
       */
      const forwardedSubject =
        `[Zebron Inbox] ${subject || "(No subject)"}`;

      /**
       * Convert the plain-text message into
       * safe HTML for the forwarding email.
       */
      const escapedMessage =
        escapeHtml(message)
          .replace(
            /\r?\n/g,
            "<br>",
          );

      const forwardedHtml = `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #222;
          "
        >
          <h2>
            New inbound email
          </h2>

          <table
            cellpadding="6"
            cellspacing="0"
            style="
              border-collapse: collapse;
              margin-bottom: 20px;
            "
          >
            <tr>
              <td>
                <strong>From:</strong>
              </td>

              <td>
                ${escapeHtml(senderName || senderEmail)}
                &lt;${escapeHtml(senderEmail)}&gt;
              </td>
            </tr>

            <tr>
              <td>
                <strong>To:</strong>
              </td>

              <td>
                ${escapeHtml(
    (
      receivedEmail.to ??
                    webhookEmail.to ??
                    []
    ).join(", ")
  )}
              </td>
            </tr>

            <tr>
              <td>
                <strong>Subject:</strong>
              </td>

              <td>
                ${escapeHtml(
    subject || "(No subject)"
  )}
              </td>
            </tr>
          </table>

          <hr />

          <div>
            ${escapedMessage}
          </div>

          <hr />

          <p
            style="
              color: #777;
              font-size: 12px;
            "
          >
            Automatically forwarded from the
            Zebron Contact Mailbox.
          </p>
        </div>
      `;

      /**
       * Forward the message to Gmail.
       */
      const {
        data: forwardedEmail,
        error: forwardingError,
      } =
        await resend.emails.send({
          from:
            ZEBRON_FROM_EMAIL,

          to:
            [INBOUND_FORWARD_EMAIL],

          subject:
            forwardedSubject,

          html:
            forwardedHtml,

          /**
           * This is critical.
           *
           * Replying from Gmail will go to the
           * original sender rather than back to
           * the Zebron inbound address.
           */
          replyTo:
            senderEmail,

          /**
           * Preserve the original email thread
           * where possible.
           */
          headers:
            messageId ?
              {
                "In-Reply-To":
                    messageId,

                "References":
                    messageId,
              } :
              undefined,
        });

      /**
       * Handle forwarding failure separately.
       *
       * The inbound email has already been saved
       * to the Zebron mailbox, so we don't lose it.
       */
      if (forwardingError) {
        logger.error(
          "Inbound email was stored, but Gmail forwarding failed.",
          {
            emailId,

            senderEmail,

            forwardingError,
          }
        );

        /**
         * Keep forwarding state visible in
         * Firestore for troubleshooting.
         */
        await messageRef.update({
          forwardingError:
            String(
              forwardingError
            ),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

        /**
         * Return an error so Resend can retry
         * the webhook.
         */
        response
          .status(500)
          .send(
            "Email stored, but forwarding failed."
          );

        return;
      }

      /**
       * Mark forwarding as successful.
       */
      await messageRef.update({
        forwardedAt:
          FieldValue.serverTimestamp(),

        forwardingEmailId:
          forwardedEmail?.id ??
          null,

        forwardingError:
          null,

        updatedAt:
          FieldValue.serverTimestamp(),
      });

      logger.info(
        "Inbound email forwarded successfully.",
        {
          emailId,

          senderEmail,

          forwardedTo:
            INBOUND_FORWARD_EMAIL,

          forwardingEmailId:
            forwardedEmail?.id ??
            null,
        }
      );

      /**
       * Tell Resend that processing completed
       * successfully.
       */
      response
        .status(200)
        .json({
          success: true,

          emailId,

          forwardedTo:
            INBOUND_FORWARD_EMAIL,
        });
    } catch (error: unknown) {
      logger.error(
        "Failed to process inbound email webhook.",
        {
          error,
        }
      );

      response
        .status(500)
        .send(
          "Unable to process inbound email."
        );
    }
  }
);


/**
 * Escape HTML values before inserting
 * email/user-controlled content into the
 * forwarded message.
 */
function escapeHtml(
  value: string,
): string {
  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

/**
 * Send a reply from the administrator mailbox.
 *
 * Only authenticated administrators may use this function.
 *
 * The email is sent through Resend using the
 * RESEND_API_KEY Firebase Secret.
 */
export const sendContactReply = onCall(
  {
    region: "us-central1",

    /**
     * Make the Resend API key available to this function.
     */
    secrets: ["RESEND_API_KEY"],
  },
  async (request) => {
    const admin = await requireAdmin(request);

    const data = request.data as {
      messageId?: unknown;
      to?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    /**
     * Clean incoming values.
     */
    const messageId = clean(data.messageId);

    const to = clean(data.to)?.toLowerCase();

    const subject = clean(data.subject);

    const message = clean(data.message);

    /**
     * Validate the message ID.
     */
    if (!messageId) {
      throw new HttpsError("invalid-argument", "Message ID is required.");
    }

    /**
     * Validate recipient.
     */
    if (!to || to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new HttpsError("invalid-argument", "A valid recipient email address is required.");
    }

    /**
     * Validate subject.
     */
    if (!subject) {
      throw new HttpsError("invalid-argument", "Subject is required.");
    }

    if (subject.length > 200) {
      throw new HttpsError("invalid-argument", "Subject is too long.");
    }

    /**
     * Validate message body.
     */
    if (!message) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }

    if (message.length > 10000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    /**
     * Read the Resend API key from Firebase Secret Manager.
     */
    const apiKey = process.env["RESEND_API_KEY"];

    if (!apiKey) {
      logger.error("RESEND_API_KEY is not configured.");

      throw new HttpsError("failed-precondition", "Email service is not configured.");
    }

    /**
     * Send the email through Resend.
     */
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,

          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          from: ZEBRON_FROM_EMAIL,

          to: [to],

          subject,

          text: message,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error("Resend failed to send contact reply.", {
          status: response.status,

          result,

          adminUid: admin.uid,

          to,
        });

        throw new HttpsError("internal", "Unable to send the email.");
      }

      /**
       * Record the outbound reply.
       *
       * We use a subcollection under the
       * original contact message so the
       * conversation remains associated.
       */
      await getDb().collection("contactMessages").doc(messageId).collection("replies").add({
        from: ZEBRON_FROM_EMAIL,

        to,

        subject,

        message,

        sentBy: admin.uid,

        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info("Contact reply sent successfully.", {
        adminUid: admin.uid,

        to,

        subject,

        messageId,
      });

      return {
        success: true,
      };
    } catch (error: unknown) {
      /**
       * Re-throw Firebase HttpsErrors unchanged.
       */
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Unexpected error while sending contact reply.", {
        error,

        adminUid: admin.uid,

        to,
      });

      throw new HttpsError("internal", "Unable to send the email.");
    }
  },
);

/**
 * Send a new email from the administrator mailbox.
 *
 * Only authenticated administrators may use this function.
 */
export const sendNewContactMessage = onCall(
  {
    region: "us-central1",

    /**
     * Make the Resend API key available to this function.
     */
    secrets: ["RESEND_API_KEY"],
  },
  async (request) => {
    const admin = await requireAdmin(request);

    const data = request.data as {
  to?: unknown;
  subject?: unknown;
  message?: unknown;
  type?: unknown;
};

    /**
     * Clean incoming values.
     */
    const to = clean(data.to)?.toLowerCase();

    const subject = clean(data.subject);

    const message = clean(data.message);

    /**
 * Identify how the administrator email was created.
 *
 * New emails default to "new" so existing callers
 * remain backwards compatible.
 */
    const type =
  data.type === "forward" ?
    "forward" :
    "new";

    /**
     * Validate recipient.
     */
    if (!to || to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new HttpsError("invalid-argument", "A valid recipient email address is required.");
    }

    /**
     * Validate subject.
     */
    if (!subject) {
      throw new HttpsError("invalid-argument", "Subject is required.");
    }

    if (subject.length > 200) {
      throw new HttpsError("invalid-argument", "Subject is too long.");
    }

    /**
     * Validate message body.
     */
    if (!message) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }

    if (message.length > 10000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    /**
     * Retrieve the Resend API key from
     * Firebase Secret Manager.
     */
    const apiKey = process.env["RESEND_API_KEY"];

    if (!apiKey) {
      logger.error("RESEND_API_KEY is not configured.");

      throw new HttpsError("failed-precondition", "Email service is not configured.");
    }

    const idempotencyKey =
  `admin-email:${randomUUID()}`;

    try {
      /**
       * Send the email through Resend.
       */
      const response = await fetch(RESEND_API_URL, {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,

          "Content-Type": "application/json",

          "Idempotency-Key": idempotencyKey,
        },

        body: JSON.stringify({
          from: ZEBRON_FROM_EMAIL,

          to: [to],

          subject,

          text: message,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error("Resend failed to send new contact message.", {
          status: response.status,

          result,

          adminUid: admin.uid,

          to,
        });

        throw new HttpsError("internal", "Unable to send the email.");
      }

      /**
       * Keep a record of administrator-sent
       * messages in a dedicated collection.
       */
      await getDb().collection("outboundMessages").add({
        from: ZEBRON_FROM_EMAIL,

        to,

        subject,

        message,

        type,

        sentBy: admin.uid,

        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info("New administrator email sent successfully.", {
        adminUid: admin.uid,

        to,

        subject,
      });

      return {
        success: true,
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Unexpected error while sending new contact message.", {
        error,

        adminUid: admin.uid,

        to,
      });

      throw new HttpsError("internal", "Unable to send the email.");
    }
  },
);

/**
 * Safely extract a Firebase error code.
 *
 * @param {unknown} error The error to inspect.
 * @return {string|undefined} The Firebase error code.
 */
function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (
      error as {
        code?: unknown;
      }
    ).code;

    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

/**
 * Return a trimmed string or undefined.
 *
 * Empty strings are converted to undefined so that
 * optional Firestore fields can be omitted entirely.
 *
 * @param {unknown} value The value to clean.
 * @return {string|undefined} The cleaned value.
 */
function clean(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}


export const createDonationCheckout = onCall(
  {
    region: "us-central1",
    secrets: ["STRIPE_SECRET_KEY"],
  },
  async (request) => {
    const data = request.data as {
      amount?: unknown;
      email?: unknown;
    };

    const amount =
      typeof data.amount === "number" ?
        data.amount :
        Number(data.amount);

    const email =
      typeof data.email === "string" ?
        data.email.trim().toLowerCase() :
        undefined;

    /*
     * Validate donation amount.
     *
     * Keep the minimum donation at $1.00.
     */
    if (!Number.isFinite(amount)) {
      throw new HttpsError(
        "invalid-argument",
        "A valid donation amount is required.",
      );
    }

    if (amount < 1) {
      throw new HttpsError(
        "invalid-argument",
        "The minimum donation is $1.",
      );
    }

    if (amount > 10000) {
      throw new HttpsError(
        "invalid-argument",
        "The maximum donation is $10,000.",
      );
    }

    /*
     * Convert dollars to cents.
     */
    const amountInCents =
      Math.round(amount * 100);

    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY ?? "",
    );

    /*
     * Create the Stripe Checkout session.
     */
    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name: "Donation to Zebron",
                description:
                  "Support Zebron's mission to connect people with trusted resources and opportunities.",
              },

              unit_amount: amountInCents,
            },

            quantity: 1,
          },
        ],

        submit_type: "donate",

        customer_email: email,

        success_url:
          "https://zebron.org/donate/success?session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
          "https://zebron.org/donate/cancel",

        metadata: {
          donationAmount: amount.toFixed(2),

          ...(request.auth?.uid ?
            {
              userId: request.auth.uid,
            } :
            {}),
        },
      });

    return {
      url: session.url,
    };
  },
);
export {
  processBusinessComplianceStatuses,
} from "./compliance-scheduler";

export {
  updateCommunityTrendingScore,
} from "./community-ranking";

export {
  refreshCommunityTrendingScores,
} from "./community-ranking-scheduler";

/**
 * Create a persistent audit record inside the current Firestore transaction.
 *
 * Audit records are written by trusted backend functions rather than
 * directly by the Angular client.
 */
function createAuditRecord(
  transaction: FirebaseFirestore.Transaction,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    actorEmail?: string;
    metadata?: Record<string, unknown>;
    reason?: string;
  },
): void {
  const auditRef = db
    .collection("auditLogs")
    .doc();

  transaction.set(
    auditRef,
    {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,

      actorId: input.actorId,
      actorName: null,
      actorEmail: input.actorEmail ?? null,
      actorType: "user",

      outcome: "success",
      source: "backend",

      reason:
        input.reason ??
        null,

      metadata:
        input.metadata ??
        {},

      before: null,
      after: null,

      createdAt:
        FieldValue.serverTimestamp(),
    },
  );
}

export const provisionOrganization =
  provisionOrganizationFunction;

/**
 * Update the organization profile during tenant onboarding.
 *
 * This is intentionally implemented as a trusted callable instead of
 * allowing the Angular client to write protected organization fields.
 *
 * Allowed organization profile fields:
 *   - name
 *   - companyNumber
 *   - description
 *   - website
 *   - phone
 *   - email
 *   - slug
 *   - locationId
 *
 * Protected lifecycle/security fields such as status, active, verified,
 * ownerUserId, approvedAt, activatedAt, createdAt, and updatedAt are
 * controlled by the backend.
 */
export const updateOrganizationOnboardingProfile = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const db = getFirestore();

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to update the organization profile.",
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail =
      typeof request.auth.token.email === "string" ?
        request.auth.token.email :
        null;

    const data = request.data as {
      organizationId?: unknown;
      profile?: {
        name?: unknown;
        companyNumber?: unknown;
        description?: unknown;
        website?: unknown;
        phone?: unknown;
        email?: unknown;
        slug?: unknown;
        locationId?: unknown;
      };
    } | undefined;

    const organizationId = clean(data?.organizationId);

    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "organizationId is required.",
      );
    }

    if (!data?.profile || typeof data.profile !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "An organization profile is required.",
      );
    }

    const profile = data.profile;

    const organizationRef = db
      .collection("organizations")
      .doc(organizationId);

    const membershipRef = db
      .collection("organizationMemberships")
      .doc(`${callerUid}_${organizationId}`);

    const onboardingRef = db
      .collection("organizationOnboarding")
      .doc(organizationId);

    const userRef = db
      .collection("users")
      .doc(callerUid);

    const result = await db.runTransaction(async (transaction) => {
      const organizationSnapshot =
        await transaction.get(organizationRef);

      const membershipSnapshot =
        await transaction.get(membershipRef);

      const onboardingSnapshot =
        await transaction.get(onboardingRef);

      const userSnapshot =
        await transaction.get(userRef);

      if (!organizationSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "The organization could not be found.",
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

      const membership =
        membershipSnapshot.exists ?
          membershipSnapshot.data() ?? {} :
          {};

      const user =
        userSnapshot.exists ?
          userSnapshot.data() ?? {} :
          {};

      const isPlatformAdmin =
        user["platformRole"] === "platform-admin" ||
        (
          user["platformRole"] === undefined &&
          user["role"] === "admin"
        );

      const membershipRole =
        membership["role"];

      const isOrganizationAdmin =
        membershipSnapshot.exists &&
        membership["active"] === true &&
        (
          membershipRole === "org_owner" ||
          membershipRole === "org_admin"
        );

      if (!isPlatformAdmin && !isOrganizationAdmin) {
        throw new HttpsError(
          "permission-denied",
          "Only the organization owner, organization administrator, or platform administrator can update the organization profile.",
        );
      }

      if (organization["status"] !== "onboarding") {
        throw new HttpsError(
          "failed-precondition",
          `The organization is not currently in onboarding. Current status: ${String(organization["status"] ?? "unknown")}.`,
        );
      }

      const name = clean(profile.name);
      const companyNumber =
        clean(profile.companyNumber);
      const description =
        clean(profile.description);
      const website =
        clean(profile.website);
      const phone =
        clean(profile.phone);
      const email =
        clean(profile.email)?.toLowerCase();
      const slug =
        clean(profile.slug)?.toLowerCase();
      const locationId =
        clean(profile.locationId);

      if (
        name !== undefined &&
        (name.length < 2 || name.length > 200)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Organization name must be between 2 and 200 characters.",
        );
      }

      if (
        website !== undefined &&
        website.length > 500
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Website URL is too long.",
        );
      }

      if (
        email !== undefined &&
        (
          email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid organization email address is required.",
        );
      }

      if (
        slug !== undefined &&
        (
          slug.length < 2 ||
          slug.length > 100 ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Organization slug must contain only lowercase letters, numbers, and single hyphens.",
        );
      }

      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (name !== undefined) {
        updates["name"] = name;
        updates["normalizedName"] =
          name.toLowerCase();
      }

      if (companyNumber !== undefined) {
        updates["companyNumber"] =
          companyNumber;
      }

      if (description !== undefined) {
        updates["description"] =
          description;
      }

      if (website !== undefined) {
        updates["website"] =
          website;
      }

      if (phone !== undefined) {
        updates["phone"] =
          phone;
      }

      if (email !== undefined) {
        updates["email"] =
          email;
      }

      if (slug !== undefined) {
        updates["slug"] =
          slug;
      }

      if (locationId !== undefined) {
        updates["locationId"] =
          locationId;
      }

      const currentName =
        typeof organization["name"] === "string" ?
          organization["name"] :
          undefined;

      if (name === undefined && !currentName) {
        throw new HttpsError(
          "invalid-argument",
          "Organization name is required.",
        );
      }

      const currentCompletedSteps =
        Array.isArray(
          onboarding["completedSteps"],
        ) ?
          onboarding["completedSteps"].filter(
            (step): step is string =>
              typeof step === "string",
          ) :
          [];

      const completedSteps =
        Array.from(
          new Set([
            ...currentCompletedSteps,
            "organization_profile",
          ]),
        );

      const currentStep =
        typeof onboarding["currentStep"] === "string" ?
          onboarding["currentStep"] :
          "organization_profile";

      const shouldAdvance =
        currentStep === "organization_profile";

      const nextStep =
        shouldAdvance ?
          "owner_profile" :
          currentStep;

      const updatedFields =
        Object.keys(updates).filter(
          (field) => field !== "updatedAt",
        );

      const onboardingUpdates:
        Record<string, unknown> = {
          completedSteps,
          updatedAt:
            FieldValue.serverTimestamp(),
        };

      if (shouldAdvance) {
        onboardingUpdates["currentStep"] =
          "owner_profile";
      }

      transaction.update(
        organizationRef,
        updates,
      );

      transaction.update(
        onboardingRef,
        onboardingUpdates,
      );

      const auditRef =
        db.collection("auditLogs").doc();

      const actorEmail =
        typeof user["email"] === "string" ?
          user["email"] :
          callerEmail;

      transaction.set(auditRef, {
        action:
          "ORGANIZATION_PROFILE_UPDATED",
        entityType:
          "organization",
        entityId:
          organizationId,
        actorId:
          callerUid,
        actorName:
          null,
        actorEmail,
        actorType:
          "user",
        outcome:
          "success",
        source:
          "backend",
        reason:
          "Organization onboarding profile updated.",

        metadata: {
          organizationId,
          organizationStatus:
            "onboarding",
          completedStep:
            "organization_profile",
          nextStep,
          updatedFields,
        },

        before: {
          name:
            organization["name"] ?? null,
          companyNumber:
            organization["companyNumber"] ?? null,
          description:
            organization["description"] ?? null,
          website:
            organization["website"] ?? null,
          phone:
            organization["phone"] ?? null,
          email:
            organization["email"] ?? null,
          slug:
            organization["slug"] ?? null,
          locationId:
            organization["locationId"] ?? null,
        },

        after: {
          name:
            updates["name"] ??
            organization["name"] ??
            null,

          companyNumber:
            updates["companyNumber"] ??
            organization["companyNumber"] ??
            null,

          description:
            updates["description"] ??
            organization["description"] ??
            null,

          website:
            updates["website"] ??
            organization["website"] ??
            null,

          phone:
            updates["phone"] ??
            organization["phone"] ??
            null,

          email:
            updates["email"] ??
            organization["email"] ??
            null,

          slug:
            updates["slug"] ??
            organization["slug"] ??
            null,

          locationId:
            updates["locationId"] ??
            organization["locationId"] ??
            null,
        },

        createdAt:
          FieldValue.serverTimestamp(),
      });

      return {
        organizationId,
        currentStep: nextStep,
        completedSteps,
      };
    });

    logger.info(
      "Organization onboarding profile updated.",
      {
        organizationId:
          result.organizationId,
        actorId:
          callerUid,
        nextStep:
          result.currentStep,
      },
    );

    return {
      success: true,
      ...result,
    };
  },
);

/**
 * Update the organization owner's profile during onboarding.
 *
 * The owner profile is intentionally updated through a trusted
 * backend function rather than directly from the browser.
 *
 * Editable:
 * - firstName
 * - lastName
 * - preferredName
 * - phone
 *
 * Email is read from the authenticated Firebase account and is
 * therefore not accepted from the client.
 *
 * Successful completion advances:
 *
 * owner_profile -> invite_members
 */
export const updateOrganizationOnboardingOwnerProfile = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to update the owner profile.",
      );
    }

    const callerUid = request.auth.uid;

    const data =
      request.data as {
        organizationId?: unknown;
        profile?: {
          firstName?: unknown;
          lastName?: unknown;
          preferredName?: unknown;
          phone?: unknown;
        };
      };

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

    const profile = data.profile;

    if (!profile || typeof profile !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "Owner profile is required.",
      );
    }

    const cleanString = (
      value: unknown,
    ): string | undefined => {
      if (typeof value !== "string") {
        return undefined;
      }

      const normalized = value.trim();

      return normalized || undefined;
    };

    const firstName =
      cleanString(profile.firstName);

    const lastName =
      cleanString(profile.lastName);

    const preferredName =
      cleanString(profile.preferredName);

    const phone =
      cleanString(profile.phone);

    if (!firstName) {
      throw new HttpsError(
        "invalid-argument",
        "First name is required.",
      );
    }

    if (!lastName) {
      throw new HttpsError(
        "invalid-argument",
        "Last name is required.",
      );
    }

    if (firstName.length > 100) {
      throw new HttpsError(
        "invalid-argument",
        "First name is too long.",
      );
    }

    if (lastName.length > 100) {
      throw new HttpsError(
        "invalid-argument",
        "Last name is too long.",
      );
    }

    if (
      preferredName &&
      preferredName.length > 100
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Preferred name is too long.",
      );
    }

    if (
      phone &&
      phone.length > 50
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Phone number is too long.",
      );
    }

    const userRef = db.doc(
      `users/${callerUid}`,
    );

    const organizationRef = db.doc(
      `organizations/${organizationId}`,
    );

    const onboardingRef = db.doc(
      `organizationOnboarding/${organizationId}`,
    );

    const membershipRef = db.doc(
      `organizationMemberships/${callerUid}_${organizationId}`,
    );

    const result =
      await db.runTransaction(
        async (transaction) => {
          const [
            userSnapshot,
            organizationSnapshot,
            onboardingSnapshot,
            membershipSnapshot,
          ] = await Promise.all([
            transaction.get(userRef),
            transaction.get(organizationRef),
            transaction.get(onboardingRef),
            transaction.get(membershipRef),
          ]);

          if (!userSnapshot.exists) {
            throw new HttpsError(
              "not-found",
              "Your user profile could not be found.",
            );
          }

          if (!organizationSnapshot.exists) {
            throw new HttpsError(
              "not-found",
              "The organization could not be found.",
            );
          }

          if (!onboardingSnapshot.exists) {
            throw new HttpsError(
              "not-found",
              "The organization onboarding record could not be found.",
            );
          }

          if (!membershipSnapshot.exists) {
            throw new HttpsError(
              "permission-denied",
              "You are not a member of this organization.",
            );
          }

          const user =
            userSnapshot.data() ?? {};

          const organization =
            organizationSnapshot.data() ?? {};

          const onboarding =
            onboardingSnapshot.data() ?? {};

          const membership =
            membershipSnapshot.data() ?? {};

          const isPlatformAdmin =
            user["platformRole"] ===
              "platform-admin" ||
            (
              user["platformRole"] === undefined &&
              user["role"] === "admin"
            );

          const membershipActive =
            membership["active"] === true;

          const membershipRole =
            membership["role"];

          const isOrganizationOwner =
            membershipActive &&
            membershipRole === "org_owner" &&
            onboarding["ownerUserId"] === callerUid;

          if (
            !isPlatformAdmin &&
            !isOrganizationOwner
          ) {
            throw new HttpsError(
              "permission-denied",
              "Only the organization owner can update the owner profile.",
            );
          }

          if (
            organization["status"] !==
            "onboarding"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "The organization is not currently in onboarding.",
            );
          }

          if (
            onboarding["status"] !==
            "in_progress"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "The organization onboarding process is not active.",
            );
          }

          if (
            onboarding["currentStep"] !==
            "owner_profile"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "The owner profile is not the current onboarding step.",
            );
          }

          const completedSteps =
            Array.isArray(
              onboarding["completedSteps"],
            ) ?
              onboarding[
                "completedSteps"
              ].filter(
                (
                  step,
                ): step is string =>
                  typeof step === "string",
              ) :
              [];

          const nextCompletedSteps =
            Array.from(
              new Set([
                ...completedSteps,
                "owner_profile",
              ]),
            );

          const now =
            FieldValue.serverTimestamp();

          const existingPreferredName =
            user["preferredName"];

          const displayName =
            [
              firstName,
              lastName,
            ]
              .filter(Boolean)
              .join(" ");

          transaction.update(
            userRef,
            {
              firstName,
              lastName,
              preferredName:
                preferredName ??
                existingPreferredName ??
                null,
              phone: phone ?? null,
              displayName,
              updatedAt: now,
            },
          );

          transaction.update(
            onboardingRef,
            {
              completedSteps:
                nextCompletedSteps,
              currentStep:
                "invite_members",
              status:
                "in_progress",
              completedAt: null,
              updatedAt: now,
            },
          );

          createAuditRecord(
            transaction,
            {
              action:
                "ORGANIZATION_OWNER_PROFILE_UPDATED",
              entityType:
                "organizationOnboarding",
              entityId:
                organizationId,
              actorId:
                callerUid,
              actorEmail:
                typeof request.auth?.token?.email ===
                "string" ?
                  request.auth.token.email :
                  undefined,
              metadata: {
                organizationId,
                ownerUserId:
                  callerUid,
                organizationName:
                  organization["name"] ?? null,
                completedStep:
                  "owner_profile",
                nextStep:
                  "invite_members",
              },
            },
          );

          return {
            organizationId,
            onboardingId:
              onboarding["id"] ??
              organizationId,
            currentStep:
              "invite_members",
            completedSteps:
              nextCompletedSteps,
          };
        },
      );

    logger.info(
      "Organization owner profile updated.",
      {
        organizationId,
        actorId: callerUid,
        nextStep:
          result.currentStep,
      },
    );

    return {
      success: true,
      ...result,
    };
  },
);

export {
  createOrganizationInvitation,
  getOrganizationInvitations,
  completeOrganizationInviteMembersStep,
};

export {
  acceptOrganizationInvitation,
} from "./organization-invitation-acceptance";

export {
  cancelOrganizationInvitation,
} from "./organization-invitation-cancellation";

export {
  expireOrganizationInvitations,
  expirePendingOrganizationInvitations,
} from "./organization-invitation-expiration";

export {
  resendOrganizationInvitation,
} from "./organization-invitation-resend";

export { completeOrganizationFirstQuestion };