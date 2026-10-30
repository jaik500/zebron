import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: 'AIzaSyAA7WmoDxeoIjNegg1ADl3di7YR45GPk-U',
  authDomain: 'zebron-2b49f.firebaseapp.com',
  projectId: 'zebron-2b49f',
  storageBucket: 'zebron-2b49f.firebasestorage.app',
  messagingSenderId: '427124681171',
  appId: '1:427124681171:web:d05865aff76fee589a2726',
  measurementId: 'G-PWD4V2RJCY',
};

// Reuse the existing app on hot reload / SSR re-evaluation
// to avoid "Firebase App named '[DEFAULT]' already exists".
export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const firestore = getFirestore(firebaseApp);

export const firebaseFunctions = getFunctions(firebaseApp, 'us-central1');

export const firebaseStorage = getStorage(firebaseApp);

// ------------------------------------------------------------------
// APP CHECK
// ------------------------------------------------------------------

/**
 * reCAPTCHA Enterprise site key for App Check.
 *
 * Leave empty to keep App Check off. When set, every request from the
 * website to Firestore, Cloud Functions and Storage carries a token
 * proving it came from the real Zebron site. Turning on enforcement in
 * the Firebase console then blocks scripts and bots that call the
 * backend directly. See docs/SCALING-AND-SECURITY-RUNBOOK.md.
 */
export const APP_CHECK_SITE_KEY = '';

/**
 * Starts App Check in the browser only. Server-side rendering has no
 * document or window (that crash is why App Check was removed before).
 *
 * On localhost a debug token is used: its value is printed in the
 * browser console the first time; add it in Firebase console →
 * App Check → Apps → Manage debug tokens.
 */
function startAppCheck(): void {
  if (!APP_CHECK_SITE_KEY || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // Already started (hot reload) or blocked by the browser.
    console.info('[App Check] Not started.', error);
  }
}

startAppCheck();
