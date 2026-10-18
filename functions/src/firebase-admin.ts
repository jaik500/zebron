import { getApps, initializeApp } from "firebase-admin/app";

/**
 * Initialize Firebase Admin before any module accesses Firestore,
 * Authentication, or another Firebase Admin service.
 *
 * Safe to import from multiple Cloud Functions modules.
 */
if (getApps().length === 0) {
  initializeApp();
}