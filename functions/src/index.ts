import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

initializeApp();

const db = getFirestore();
const auth = getAuth();

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
