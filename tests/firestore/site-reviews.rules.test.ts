import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Home page reviews (siteReviews/{uid}, firestore.rules): one per person,
 * public once approved, every author edit goes back to pending, platform
 * admins approve, reject or delete.
 */
describe('Zebron Firestore Security Rules - site reviews', () => {
  let testEnv: RulesTestEnvironment;

  const AUTHOR = 'review-author';
  const OTHER = 'review-other';
  const ADMIN = 'review-admin';
  const PATH = `siteReviews/${AUTHOR}`;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  function review(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      userId: AUTHOR,
      displayName: 'Amara K.',
      about: 'Bootcamp graduate',
      rating: 5,
      text: 'The courses helped me get my first cloud job in six months.',
      status: 'pending',
      moderatorNote: '',
      reviewedAt: null,
      reviewedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();
  const anonymous = () => testEnv.unauthenticatedContext().firestore();

  async function seedAdmin(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `users/${ADMIN}`), { platformRole: 'platform-admin', displayName: 'Admin' });
    });
  }

  async function seedReview(status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), review({ status, reviewedAt: status === 'pending' ? null : new Date() }));
    });
  }

  // ---------- Writing ----------

  it('lets a signed-in person submit one review of their own, waiting for approval', async () => {
    await assertSucceeds(setDoc(doc(as(AUTHOR), PATH), review()));
  });

  it('denies reviews submitted as approved, for someone else, or signed out', async () => {
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ status: 'approved' })));
    await assertFails(setDoc(doc(as(OTHER), PATH), review()));
    await assertFails(setDoc(doc(as(OTHER), `siteReviews/${OTHER}`), review()));
    await assertFails(setDoc(doc(anonymous(), PATH), review()));
  });

  it('denies bad ratings, too short or too long text, and extra fields', async () => {
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ rating: 0 })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ rating: 6 })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ rating: 4.5 })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ text: 'Too short' })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ text: 'x'.repeat(801) })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ displayName: '' })));
    await assertFails(setDoc(doc(as(AUTHOR), PATH), review({ featured: true })));
  });

  it('sends an approved review back to pending when the author edits it', async () => {
    await seedReview('approved');
    await assertFails(updateDoc(doc(as(AUTHOR), PATH), { rating: 4, updatedAt: serverTimestamp() }));
    await assertSucceeds(
      updateDoc(doc(as(AUTHOR), PATH), {
        rating: 4,
        status: 'pending',
        moderatorNote: '',
        reviewedAt: null,
        reviewedBy: null,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // ---------- Reading ----------

  it('shows approved reviews to everyone, signed in or not', async () => {
    await seedReview('approved');
    await assertSucceeds(getDoc(doc(anonymous(), PATH)));
    await assertSucceeds(getDocs(query(collection(anonymous(), 'siteReviews'), where('status', '==', 'approved'))));
  });

  it('keeps pending and rejected reviews private to the author and admins', async () => {
    await seedReview('pending');
    await seedAdmin();
    await assertFails(getDoc(doc(anonymous(), PATH)));
    await assertFails(getDoc(doc(as(OTHER), PATH)));
    await assertSucceeds(getDoc(doc(as(AUTHOR), PATH)));
    await assertSucceeds(getDoc(doc(as(ADMIN), PATH)));
    await assertFails(getDocs(collection(anonymous(), 'siteReviews')));
    await assertSucceeds(getDocs(collection(as(ADMIN), 'siteReviews')));
  });

  // ---------- Moderation ----------

  it('lets a platform admin approve or reject, and nobody else', async () => {
    await seedReview('pending');
    await seedAdmin();
    const decision = (status: string, by: string) => ({
      status,
      moderatorNote: status === 'rejected' ? 'Please remove the phone number.' : '',
      reviewedAt: serverTimestamp(),
      reviewedBy: by,
      updatedAt: serverTimestamp(),
    });
    await assertFails(updateDoc(doc(as(AUTHOR), PATH), decision('approved', AUTHOR)));
    await assertFails(updateDoc(doc(as(OTHER), PATH), decision('approved', OTHER)));
    await assertSucceeds(updateDoc(doc(as(ADMIN), PATH), decision('approved', ADMIN)));
    await assertSucceeds(updateDoc(doc(as(ADMIN), PATH), decision('rejected', ADMIN)));
  });

  it("denies an admin rewriting the review's words or rating", async () => {
    await seedReview('pending');
    await seedAdmin();
    await assertFails(
      updateDoc(doc(as(ADMIN), PATH), {
        text: 'Zebron is the best platform ever, five stars!',
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: ADMIN,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // ---------- Deleting ----------

  it('lets the author or an admin delete a review', async () => {
    await seedReview('approved');
    await seedAdmin();
    await assertFails(deleteDoc(doc(as(OTHER), PATH)));
    await assertSucceeds(deleteDoc(doc(as(AUTHOR), PATH)));
    await seedReview('approved');
    await assertSucceeds(deleteDoc(doc(as(ADMIN), PATH)));
  });
});
