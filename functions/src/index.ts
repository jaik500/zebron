import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {onInit} from "firebase-functions/v2/core";
import {setGlobalOptions} from "firebase-functions";
import {
  HttpsError,
  onCall,
} from "firebase-functions/https";

import * as logger from "firebase-functions/logger";

/**
 * Firebase Admin Authentication service.
 *
 * Initialized lazily so Firebase can discover the function
 * without initializing the Admin SDK during deployment.
 */
let adminAuth: ReturnType<typeof getAuth>;

/**
 * Firebase Admin Firestore service.
 *
 * Initialized lazily during runtime startup.
 */
let adminFirestore: ReturnType<typeof getFirestore>;

/**
 * Initialize Firebase Admin SDK after the Functions runtime starts.
 */
onInit(async () => {
  const {initializeApp} = await import("firebase-admin/app");

  initializeApp();

  adminAuth = getAuth();
  adminFirestore = getFirestore();
});

/**
 * Configure global Firebase Functions options.
 */
setGlobalOptions({
  maxInstances: 10,
});

/**
 * Data accepted by the createUser callable function.
 */
interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role?: "user" | "admin";

  firstName?: string;
  lastName?: string;
  preferredName?: string;
  phone?: string;

  countryOfOrigin?: string;
  currentCountry?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  preferredLanguage?: string;

  bio?: string;
  website?: string;
}

/**
 * Create a new Firebase Authentication account and
 * corresponding Zebron Firestore user profile.
 *
 * Only authenticated administrators are permitted to
 * call this function.
 */
export const createUser = onCall(
  async (request) => {
    /**
     * Verify that the caller is authenticated.
     */
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to create users."
      );
    }

    /**
     * Verify that Firebase Admin services have initialized.
     */
    if (!adminAuth || !adminFirestore) {
      throw new HttpsError(
        "internal",
        "Firebase services are not initialized."
      );
    }

    const adminUid = request.auth.uid;

    /**
     * Load the administrator's Zebron profile.
     */
    const adminProfile = await adminFirestore
      .collection("users")
      .doc(adminUid)
      .get();

    if (!adminProfile.exists) {
      throw new HttpsError(
        "permission-denied",
        "Your Zebron user profile could not be found."
      );
    }

    const adminData = adminProfile.data();

    /**
     * Only administrators may create users.
     */
    if (adminData?.["role"] !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Administrator privileges are required."
      );
    }

    /**
     * Validate the incoming request.
     */
    const data = request.data as CreateUserData;

    if (!data || typeof data !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "Invalid user data."
      );
    }

    const email =
      typeof data.email === "string" ?
        data.email.trim().toLowerCase() :
        "";

    const password =
      typeof data.password === "string" ?
        data.password :
        "";

    const displayName =
      typeof data.displayName === "string" ?
        data.displayName.trim() :
        "";

    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Email address is required."
      );
    }

    if (!password) {
      throw new HttpsError(
        "invalid-argument",
        "Password is required."
      );
    }

    if (password.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters."
      );
    }

    if (!displayName) {
      throw new HttpsError(
        "invalid-argument",
        "Display name is required."
      );
    }

    /**
     * Only allow the roles supported by Zebron.
     */
    const role =
      data.role === "admin" ?
        "admin" :
        "user";

    /**
     * Create the Firebase Authentication account.
     */
    let firebaseUser;

    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
    } catch (error: unknown) {
      logger.error(
        "Failed to create Firebase Authentication user.",
        error
      );

      const errorCode =
        getErrorCode(error);

      if (
        errorCode ===
        "auth/email-already-exists"
      ) {
        throw new HttpsError(
          "already-exists",
          "A user with this email address already exists."
        );
      }

      if (
        errorCode ===
        "auth/invalid-password"
      ) {
        throw new HttpsError(
          "invalid-argument",
          "The password does not meet Firebase requirements."
        );
      }

      if (
        errorCode ===
        "auth/invalid-email"
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Please provide a valid email address."
        );
      }

      throw new HttpsError(
        "internal",
        "Unable to create the Firebase Authentication account."
      );
    }

    /**
     * Start with only required Firestore fields.
     *
     * Optional fields are added below only when they
     * contain actual values. This prevents Firestore
     * from receiving undefined values.
     */
    const userProfile: Record<
      string,
      unknown
    > = {
      email,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * Add optional fields only when they contain
     * non-empty values.
     */
    const firstName =
      clean(data.firstName);

    if (firstName !== undefined) {
      userProfile["firstName"] =
        firstName;
    }

    const lastName =
      clean(data.lastName);

    if (lastName !== undefined) {
      userProfile["lastName"] =
        lastName;
    }

    const preferredName =
      clean(data.preferredName);

    if (preferredName !== undefined) {
      userProfile["preferredName"] =
        preferredName;
    }

    const phone =
      clean(data.phone);

    if (phone !== undefined) {
      userProfile["phone"] =
        phone;
    }

    const countryOfOrigin =
      clean(data.countryOfOrigin);

    if (countryOfOrigin !== undefined) {
      userProfile["countryOfOrigin"] =
        countryOfOrigin;
    }

    const currentCountry =
      clean(data.currentCountry);

    if (currentCountry !== undefined) {
      userProfile["currentCountry"] =
        currentCountry;
    }

    const city =
      clean(data.city);

    if (city !== undefined) {
      userProfile["city"] =
        city;
    }

    const state =
      clean(data.state);

    if (state !== undefined) {
      userProfile["state"] =
        state;
    }

    const postalCode =
      clean(data.postalCode);

    if (postalCode !== undefined) {
      userProfile["postalCode"] =
        postalCode;
    }

    const preferredLanguage =
      clean(data.preferredLanguage);

    if (preferredLanguage !== undefined) {
      userProfile["preferredLanguage"] =
        preferredLanguage;
    }

    const bio =
      clean(data.bio);

    if (bio !== undefined) {
      userProfile["bio"] =
        bio;
    }

    const website =
      clean(data.website);

    if (website !== undefined) {
      userProfile["website"] =
        website;
    }

    /**
     * Create the Firestore user profile.
     */
    try {
      await adminFirestore
        .collection("users")
        .doc(firebaseUser.uid)
        .set(userProfile);
    } catch (error: unknown) {
      logger.error(
        "Failed to create Firestore user profile.",
        error
      );

      /**
       * Roll back the Authentication account if
       * the Firestore profile cannot be created.
       */
      try {
        await adminAuth.deleteUser(
          firebaseUser.uid
        );
      } catch (rollbackError: unknown) {
        logger.error(
          "Failed to roll back Firebase Authentication user.",
          rollbackError
        );
      }

      throw new HttpsError(
        "internal",
        "The user account could not be completed."
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
      uid: firebaseUser.uid,
      email,
      role,
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
