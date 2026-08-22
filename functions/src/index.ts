import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

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
async function requireAdmin(
  request: CallableRequest<unknown>
): Promise<{
  uid: string;
  email?: string;
}> {
  /**
   * Firebase Authentication must be present.
   */
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in as an administrator."
    );
  }

  const uid = request.auth.uid;

  /**
   * Load the Zebron Firestore profile.
   */
  const profile =
    await db
      .collection("users")
      .doc(uid)
      .get();

  if (!profile.exists) {
    throw new HttpsError(
      "permission-denied",
      "Administrator profile could not be found."
    );
  }

  const profileData =
    profile.data();

  /**
   * Only users with the admin role may
   * send email through the mailbox.
   */
  if (profileData?.["role"] !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only administrators can send email."
    );
  }

  return {
    uid,
    email:
      typeof profileData?.["email"] === "string" ?
        profileData["email"] :
        undefined,
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
      throw new HttpsError(
        "unauthenticated",
        "You must be authenticated to create a user."
      );
    }

    const adminUid = request.auth.uid;

    /**
     * Retrieve the administrator's Firestore profile.
     */
    const adminProfile =
      await db
        .collection("users")
        .doc(adminUid)
        .get();

    if (!adminProfile.exists) {
      throw new HttpsError(
        "permission-denied",
        "Administrator profile could not be found."
      );
    }

    const adminData =
      adminProfile.data();

    /**
     * Only administrators may create users.
     */
    if (adminData?.["role"] !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only administrators can create users."
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
    };

    const email =
      clean(data.email);

    const password =
      typeof data.password === "string" ?
        data.password :
        undefined;

    const displayName =
      clean(data.displayName);

    const role =
      clean(data.role) ?? "user";

    /**
     * Validate the email address.
     */
    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    /**
     * Validate the password.
     */
    if (
      !password ||
      password.length < 6
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters."
      );
    }

    /**
     * Validate the requested role.
     */
    const allowedRoles = [
      "user",
      "admin",
    ];

    if (
      !allowedRoles.includes(role)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid user role."
      );
    }

    let firebaseUser;

    try {
      /**
       * Create the Firebase Authentication account.
       */
      firebaseUser =
        await auth.createUser({
          email,
          password,
          displayName,
        });
    } catch (error: unknown) {
      const errorCode =
        getErrorCode(error);

      logger.error(
        "Failed to create Firebase user.",
        {
          errorCode,
          email,
        }
      );

      if (
        errorCode ===
        "auth/email-already-exists"
      ) {
        throw new HttpsError(
          "already-exists",
          "A user with this email already exists."
        );
      }

      throw new HttpsError(
        "internal",
        "Unable to create the user account."
      );
    }

    try {
      /**
       * Create the corresponding Firestore profile.
       *
       * Optional fields are only included when
       * they contain actual values. This prevents
       * Firestore from receiving undefined values.
       */
      const userProfile: Record<
        string,
        unknown
      > = {
        uid:
          firebaseUser.uid,

        email,

        role,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),
      };

      if (displayName) {
        userProfile["displayName"] =
          displayName;
      }

      await db
        .collection("users")
        .doc(firebaseUser.uid)
        .set(userProfile);
    } catch (error: unknown) {
      logger.error(
        "Failed to create Firestore user profile.",
        {
          error,
          uid:
            firebaseUser.uid,
          email,
        }
      );

      /**
       * If the Firestore profile cannot be created,
       * remove the Firebase Authentication account
       * so we do not leave an incomplete user behind.
       */
      try {
        await auth.deleteUser(
          firebaseUser.uid
        );
      } catch (deleteError: unknown) {
        logger.error(
          "Failed to roll back Firebase user after Firestore failure.",
          {
            deleteError,
            uid:
              firebaseUser.uid,
          }
        );
      }

      throw new HttpsError(
        "internal",
        "Unable to complete user creation."
      );
    }

    /**
     * Log the successful user creation.
     */
    logger.info(
      "Administrator created a new Zebron user.",
      {
        adminUid,
        createdUserUid:
          firebaseUser.uid,
        email,
        role,
      }
    );

    /**
     * Return the newly created account information.
     */
    return {
      success: true,
      uid:
        firebaseUser.uid,
      email,
      role,
    };
  }
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
    if (
      typeof data.website === "string" &&
      data.website.trim()
    ) {
      return {
        success: true,
      };
    }

    /**
     * Clean the submitted values.
     */
    const name =
      typeof data.name === "string" ?
        data.name.trim() :
        "";

    const email =
      typeof data.email === "string" ?
        data.email.trim().toLowerCase() :
        "";

    const subject =
      typeof data.subject === "string" ?
        data.subject.trim() :
        "";

    const message =
      typeof data.message === "string" ?
        data.message.trim() :
        "";

    /**
     * Validate the sender's name.
     */
    if (!name) {
      throw new HttpsError(
        "invalid-argument",
        "Name is required."
      );
    }

    if (name.length > 100) {
      throw new HttpsError(
        "invalid-argument",
        "Name is too long."
      );
    }

    /**
     * Validate the email address.
     */
    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid email address is required."
      );
    }

    /**
     * Validate the subject.
     */
    if (!subject) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is required."
      );
    }

    if (subject.length > 200) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is too long."
      );
    }

    /**
     * Validate the message.
     */
    if (!message) {
      throw new HttpsError(
        "invalid-argument",
        "Message is required."
      );
    }

    if (message.length > 5000) {
      throw new HttpsError(
        "invalid-argument",
        "Message is too long."
      );
    }

    /**
     * Capture the authenticated user's UID when
     * available. The contact form remains available
     * to public visitors.
     */
    const submittedBy =
      request.auth?.uid;

    /**
     * Build the Firestore document without
     * undefined values.
     */
    const contactMessage: Record<
      string,
      unknown
    > = {
      name,
      email,
      subject,
      message,

      status: "new",

      createdAt:
        FieldValue.serverTimestamp(),
    };

    if (submittedBy) {
      contactMessage["submittedBy"] =
        submittedBy;
    }

    /**
     * Store the contact message.
     */
    try {
      await db
        .collection("contactMessages")
        .add(contactMessage);
    } catch (error: unknown) {
      logger.error(
        "Failed to save contact message.",
        {
          error,
          email,
        }
      );

      throw new HttpsError(
        "internal",
        "Unable to receive your message."
      );
    }

    /**
     * Log successful contact reception.
     */
    logger.info(
      "New Zebron contact message received.",
      {
        email,
        subject,
        submittedBy,
      }
    );

    return {
      success: true,
    };
  }
);


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
    const admin =
      await requireAdmin(request);

    const data =
      request.data as {
        messageId?: unknown;
        to?: unknown;
        subject?: unknown;
        message?: unknown;
      };

    /**
     * Clean incoming values.
     */
    const messageId =
      clean(data.messageId);

    const to =
      clean(data.to)?.toLowerCase();

    const subject =
      clean(data.subject);

    const message =
      clean(data.message);

    /**
     * Validate the message ID.
     */
    if (!messageId) {
      throw new HttpsError(
        "invalid-argument",
        "Message ID is required."
      );
    }

    /**
     * Validate recipient.
     */
    if (
      !to ||
      to.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid recipient email address is required."
      );
    }

    /**
     * Validate subject.
     */
    if (!subject) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is required."
      );
    }

    if (subject.length > 200) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is too long."
      );
    }

    /**
     * Validate message body.
     */
    if (!message) {
      throw new HttpsError(
        "invalid-argument",
        "Message is required."
      );
    }

    if (message.length > 10000) {
      throw new HttpsError(
        "invalid-argument",
        "Message is too long."
      );
    }

    /**
     * Read the Resend API key from Firebase Secret Manager.
     */
    const apiKey =
      process.env["RESEND_API_KEY"];

    if (!apiKey) {
      logger.error(
        "RESEND_API_KEY is not configured."
      );

      throw new HttpsError(
        "failed-precondition",
        "Email service is not configured."
      );
    }

    /**
     * Send the email through Resend.
     */
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

            body: JSON.stringify({
              from:
                ZEBRON_FROM_EMAIL,

              to: [to],

              subject,

              text: message,
            }),
          }
        );

      const result =
        await response.json()
          .catch(() => ({}));

      if (!response.ok) {
        logger.error(
          "Resend failed to send contact reply.",
          {
            status:
              response.status,

            result,

            adminUid:
              admin.uid,

            to,
          }
        );

        throw new HttpsError(
          "internal",
          "Unable to send the email."
        );
      }

      /**
       * Record the outbound reply.
       *
       * We use a subcollection under the
       * original contact message so the
       * conversation remains associated.
       */
      await db
        .collection("contactMessages")
        .doc(messageId)
        .collection("replies")
        .add({
          from:
            ZEBRON_FROM_EMAIL,

          to,

          subject,

          message,

          sentBy:
            admin.uid,

          createdAt:
            FieldValue.serverTimestamp(),
        });

      logger.info(
        "Contact reply sent successfully.",
        {
          adminUid:
            admin.uid,

          to,

          subject,

          messageId,
        }
      );

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

      logger.error(
        "Unexpected error while sending contact reply.",
        {
          error,

          adminUid:
            admin.uid,

          to,
        }
      );

      throw new HttpsError(
        "internal",
        "Unable to send the email."
      );
    }
  }
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
    const admin =
      await requireAdmin(request);

    const data =
      request.data as {
        to?: unknown;
        subject?: unknown;
        message?: unknown;
      };

    /**
     * Clean incoming values.
     */
    const to =
      clean(data.to)?.toLowerCase();

    const subject =
      clean(data.subject);

    const message =
      clean(data.message);

    /**
     * Validate recipient.
     */
    if (
      !to ||
      to.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid recipient email address is required."
      );
    }

    /**
     * Validate subject.
     */
    if (!subject) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is required."
      );
    }

    if (subject.length > 200) {
      throw new HttpsError(
        "invalid-argument",
        "Subject is too long."
      );
    }

    /**
     * Validate message body.
     */
    if (!message) {
      throw new HttpsError(
        "invalid-argument",
        "Message is required."
      );
    }

    if (message.length > 10000) {
      throw new HttpsError(
        "invalid-argument",
        "Message is too long."
      );
    }

    /**
     * Retrieve the Resend API key from
     * Firebase Secret Manager.
     */
    const apiKey =
      process.env["RESEND_API_KEY"];

    if (!apiKey) {
      logger.error(
        "RESEND_API_KEY is not configured."
      );

      throw new HttpsError(
        "failed-precondition",
        "Email service is not configured."
      );
    }

    try {
      /**
       * Send the email through Resend.
       */
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

            body: JSON.stringify({
              from:
                ZEBRON_FROM_EMAIL,

              to: [to],

              subject,

              text: message,
            }),
          }
        );

      const result =
        await response.json()
          .catch(() => ({}));

      if (!response.ok) {
        logger.error(
          "Resend failed to send new contact message.",
          {
            status:
              response.status,

            result,

            adminUid:
              admin.uid,

            to,
          }
        );

        throw new HttpsError(
          "internal",
          "Unable to send the email."
        );
      }

      /**
       * Keep a record of administrator-sent
       * messages in a dedicated collection.
       */
      await db
        .collection("outboundMessages")
        .add({
          from:
            ZEBRON_FROM_EMAIL,

          to,

          subject,

          message,

          sentBy:
            admin.uid,

          createdAt:
            FieldValue.serverTimestamp(),
        });

      logger.info(
        "New administrator email sent successfully.",
        {
          adminUid:
            admin.uid,

          to,

          subject,
        }
      );

      return {
        success: true,
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        "Unexpected error while sending new contact message.",
        {
          error,

          adminUid:
            admin.uid,

          to,
        }
      );

      throw new HttpsError(
        "internal",
        "Unable to send the email."
      );
    }
  }
);


/**
 * Safely extract a Firebase error code.
 *
 * @param {unknown} error The error to inspect.
 * @return {string|undefined} The Firebase error code.
 */
function getErrorCode(
  error: unknown
): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code =
      (
        error as {
          code?: unknown;
        }
      ).code;

    return typeof code === "string" ?
      code :
      undefined;
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
function clean(
  value: unknown
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed || undefined;
}
