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


/**
 * Verify that the caller is authenticated
 * and has administrator privileges.
 *
 * This is used by all administrator-only
 * email functions.
 */
async function requireAdmin(request: CallableRequest<unknown>): Promise<{
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
  const profile = await db.collection("users").doc(uid).get();

  if (!profile.exists) {
    throw new HttpsError("permission-denied", "Administrator profile could not be found.");
  }

  const profileData = profile.data();

  /**
   * Only users with the admin role may
   * send email through the mailbox.
   */
  if (profileData?.["role"] !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can send email.");
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
    const adminProfile = await db.collection("users").doc(adminUid).get();

    if (!adminProfile.exists) {
      throw new HttpsError("permission-denied", "Administrator profile could not be found.");
    }

    const adminData = adminProfile.data();

    /**
     * Only administrators may create users.
     */
    if (adminData?.["role"] !== "admin") {
      throw new HttpsError("permission-denied", "Only administrators can create users.");
    }

    /**
     * Extract submitted user information.
     */
    const data = request.data as {
      email?: unknown;
      password?: unknown;
      displayName?: unknown;
      role?: unknown;
    };

    const email = clean(data.email);

    const password = typeof data.password === "string" ? data.password : undefined;

    const displayName = clean(data.displayName);

    const role = clean(data.role) ?? "user";

    /**
     * Validate the email address.
     */
    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    /**
     * Validate the password.
     */
    if (!password || password.length < 6) {
      throw new HttpsError("invalid-argument", "Password must be at least 6 characters.");
    }

    /**
     * Validate the requested role.
     */
    const allowedRoles = ["user", "admin"];

    if (!allowedRoles.includes(role)) {
      throw new HttpsError("invalid-argument", "Invalid user role.");
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

        role,

        createdAt: FieldValue.serverTimestamp(),

        updatedAt: FieldValue.serverTimestamp(),
      };

      if (displayName) {
        userProfile["displayName"] = displayName;
      }

      await db.collection("users").doc(firebaseUser.uid).set(userProfile);
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
      role,
    });

    /**
     * Return the newly created account information.
     */
    return {
      success: true,
      uid: firebaseUser.uid,
      email,
      role,
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
      await db.collection("passwordResetRequests").add({
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
      await db.collection("contactMessages").add(contactMessage);
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
      await db.collection("contactMessages").doc(messageId).collection("replies").add({
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
      await db.collection("outboundMessages").add({
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
