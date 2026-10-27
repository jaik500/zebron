
import {getFirestore} from "firebase-admin/firestore";
import {
  CallableRequest,
  HttpsError,
} from "firebase-functions/v2/https";

/**
 * Determines whether the authenticated caller is a platform administrator.
 *
 * Canonical authorization:
 *   users/{uid}.platformRole === "platform-admin"
 *
 * Legacy compatibility:
 *   users/{uid}.role === "admin"
 *
 * The legacy role is honored only when platformRole is absent.
 *
 * @param request Firebase callable request.
 * @return True when the caller is a platform administrator.
 */
export async function isPlatformAdministrator(
  request: CallableRequest<unknown>,
): Promise<boolean> {
  if (!request.auth) {
    return false;
  }

  const profileSnapshot = await getFirestore()
    .collection("users")
    .doc(request.auth.uid)
    .get();

  if (!profileSnapshot.exists) {
    return false;
  }

  const profile = profileSnapshot.data();

  if (!profile) {
    return false;
  }

  if (profile.platformRole === "platform-admin") {
    return true;
  }

  return (
    profile.platformRole === undefined &&
    profile.role === "admin"
  );
}

/**
 * Requires the authenticated caller to be a platform administrator.
 *
 * @param request Firebase callable request.
 * @throws HttpsError when the caller is not a platform administrator.
 */
export async function requirePlatformAdministrator(
  request: CallableRequest<unknown>,
): Promise<void> {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in.",
    );
  }

  if (!(await isPlatformAdministrator(request))) {
    throw new HttpsError(
      "permission-denied",
      "Only platform administrators can perform this operation.",
    );
  }
}

