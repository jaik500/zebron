import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseAuth, firebaseFunctions, firestore } from './firebase-config';

/**
 * Keeps the signed-in user's roles on their sign-in token current.
 *
 * Firestore rules read roles from the token (custom claims) instead of
 * reading documents on every request. This service:
 *
 * 1. Asks the server to add the claims once if the token has none yet
 *    (accounts created before claims existed), then refreshes the token.
 * 2. Listens to userClaims/{uid}; the server writes it whenever roles
 *    change, and the token is refreshed straight away so new access
 *    works immediately.
 *
 * Started once from the app shell, in the browser only.
 */
@Injectable({ providedIn: 'root' })
export class ClaimsSyncService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private started = false;
  private stopListening: Unsubscribe | null = null;

  start(): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;

    onAuthStateChanged(firebaseAuth, (user) => {
      this.stopListening?.();
      this.stopListening = null;

      if (user) {
        void this.ensureClaims(user);
        this.listen(user);
      }
    });
  }

  private async ensureClaims(user: User): Promise<void> {
    try {
      const token = await user.getIdTokenResult();
      if (token.claims['zv'] === 1) return;

      const sync = httpsCallable<void, { updated: boolean }>(firebaseFunctions, 'syncMyClaims');
      await sync();
      await user.getIdToken(true);
    } catch (error) {
      // Not fatal: the rules fall back to reading documents.
      console.info('[Claims] Could not sync roles to the sign-in token yet.', error);
    }
  }

  private listen(user: User): void {
    this.stopListening = onSnapshot(
      doc(firestore, 'userClaims', user.uid),
      (snapshot) => void this.refreshIfStale(user, snapshot.get('updatedAt')),
      () => {
        // Rules not deployed yet, or signed out: nothing to do.
      },
    );
  }

  /** Refreshes the token when the roles changed after it was issued. */
  private async refreshIfStale(user: User, updatedAt: { toMillis?: () => number } | undefined): Promise<void> {
    const changedAt = updatedAt?.toMillis?.();
    if (!changedAt) return;

    try {
      const token = await user.getIdTokenResult();
      if (changedAt > Date.parse(token.issuedAtTime)) {
        await user.getIdToken(true);
      }
    } catch {
      // Signed out meanwhile.
    }
  }
}
