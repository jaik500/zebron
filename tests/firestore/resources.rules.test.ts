import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Resources directory: resources, categories, locations, submissions, jobs.
 */
describe('Zebron Firestore Security Rules - resources', () => {
  let testEnv: RulesTestEnvironment;

  const resource = (status: string) => ({
    name: `Food bank (${status})`,
    slug: `food-bank-${status}`,
    description: 'Free groceries.',
    categoryId: 'food',
    resourceType: 'service',
    online: false,
    tags: [],
    status,
    verified: true,
    featured: false,
    createdBy: 'admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

  const submission = (uid: string) => ({
    submittedBy: uid,
    resourceName: 'Community clinic',
    description: 'Walk-in clinic.',
    submitterEmail: 'person@example.org',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

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

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/admin'), { platformRole: 'platform-admin' });
      for (const status of ['published', 'draft', 'pending', 'archived']) {
        await setDoc(doc(db, `resources/${status}`), resource(status));
      }
      await setDoc(doc(db, 'categories/food'), { name: 'Food', slug: 'food', active: true, sortOrder: 1 });
      await setDoc(doc(db, 'locations/baltimore'), { city: 'Baltimore', country: 'US' });
      await setDoc(doc(db, 'submissions/s1'), { ...submission('person'), createdAt: new Date() });
      await setDoc(doc(db, 'jobs/active'), { title: 'Analyst', status: 'active', createdAt: new Date() });
      await setDoc(doc(db, 'jobs/closed'), { title: 'Clerk', status: 'closed', createdAt: new Date() });
      await setDoc(doc(db, 'jobs/draft'), { title: 'Draft', status: 'draft', createdAt: new Date() });
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const guest = () => testEnv.unauthenticatedContext().firestore();
  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

  describe('resources', () => {
    it('lets anyone read published resources', async () => {
      await assertSucceeds(getDoc(doc(guest(), 'resources/published')));
      await assertSucceeds(
        getDocs(query(collection(guest(), 'resources'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(12))),
      );
      await assertSucceeds(
        getDocs(query(collection(as('person'), 'resources'), where('slug', '==', 'food-bank-published'), where('status', '==', 'published'), limit(1))),
      );
    });

    it('hides unpublished resources and unfiltered lists from everyone but admins', async () => {
      for (const id of ['draft', 'pending', 'archived']) {
        await assertFails(getDoc(doc(guest(), `resources/${id}`)));
        await assertFails(getDoc(doc(as('person'), `resources/${id}`)));
        await assertSucceeds(getDoc(doc(as('admin'), `resources/${id}`)));
      }
      await assertFails(getDocs(query(collection(as('person'), 'resources'), orderBy('createdAt', 'desc'))));
      await assertSucceeds(getDocs(query(collection(as('admin'), 'resources'), orderBy('createdAt', 'desc'))));
    });

    it('lets only platform admins write', async () => {
      await assertFails(setDoc(doc(as('person'), 'resources/new'), resource('published')));
      await assertFails(updateDoc(doc(as('person'), 'resources/published'), { featured: true }));
      await assertFails(deleteDoc(doc(as('person'), 'resources/published')));

      await assertSucceeds(setDoc(doc(as('admin'), 'resources/new'), resource('draft')));
      await assertSucceeds(updateDoc(doc(as('admin'), 'resources/new'), { status: 'published' }));
      await assertFails(updateDoc(doc(as('admin'), 'resources/new'), { status: 'deleted' }));
      await assertSucceeds(deleteDoc(doc(as('admin'), 'resources/new')));
    });
  });

  describe('categories and locations', () => {
    it('are public to read and admin-only to change', async () => {
      await assertSucceeds(getDocs(query(collection(guest(), 'categories'), where('active', '==', true), orderBy('sortOrder'))));
      await assertSucceeds(getDoc(doc(guest(), 'categories/food')));
      await assertSucceeds(getDocs(query(collection(guest(), 'locations'), orderBy('city'))));

      await assertFails(setDoc(doc(as('person'), 'categories/x'), { name: 'X', active: true, sortOrder: 2 }));
      await assertFails(updateDoc(doc(as('person'), 'locations/baltimore'), { city: 'Elsewhere' }));
      await assertSucceeds(setDoc(doc(as('admin'), 'categories/x'), { name: 'X', active: true, sortOrder: 2 }));
      await assertSucceeds(updateDoc(doc(as('admin'), 'locations/baltimore'), { city: 'Baltimore City' }));
    });
  });

  describe('submissions', () => {
    it('lets signed-in people submit a pending resource as themselves', async () => {
      await assertSucceeds(addDoc(collection(as('person'), 'submissions'), submission('person')));
      await assertSucceeds(
        addDoc(collection(as('person'), 'submissions'), { ...submission('person'), website: 'https://clinic.example.org', categoryId: 'health' }),
      );
    });

    it('refuses guests, impersonation, pre-approved and extra fields', async () => {
      await assertFails(addDoc(collection(guest(), 'submissions'), submission('person')));
      await assertFails(addDoc(collection(as('person'), 'submissions'), submission('someone-else')));
      await assertFails(addDoc(collection(as('person'), 'submissions'), { ...submission('person'), status: 'approved' }));
      await assertFails(addDoc(collection(as('person'), 'submissions'), { ...submission('person'), reviewedBy: 'person' }));
      await assertFails(addDoc(collection(as('person'), 'submissions'), { ...submission('person'), resourceName: '' }));
    });

    it('lets submitters read their own and admins review', async () => {
      await assertSucceeds(getDoc(doc(as('person'), 'submissions/s1')));
      await assertFails(getDoc(doc(as('stranger'), 'submissions/s1')));
      await assertFails(getDocs(collection(as('person'), 'submissions')));
      await assertSucceeds(getDocs(query(collection(as('person'), 'submissions'), where('submittedBy', '==', 'person'))));

      await assertFails(updateDoc(doc(as('person'), 'submissions/s1'), { status: 'approved' }));
      await assertSucceeds(getDocs(query(collection(as('admin'), 'submissions'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))));
      await assertSucceeds(updateDoc(doc(as('admin'), 'submissions/s1'), { status: 'approved', reviewedBy: 'admin' }));
      await assertSucceeds(deleteDoc(doc(as('admin'), 'submissions/s1')));
    });
  });

  describe('jobs', () => {
    it('shows active jobs to everyone and hides drafts', async () => {
      await assertSucceeds(getDocs(query(collection(guest(), 'jobs'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))));
      await assertSucceeds(getDoc(doc(guest(), 'jobs/active')));
      await assertSucceeds(getDoc(doc(guest(), 'jobs/closed')));
      await assertFails(getDoc(doc(guest(), 'jobs/draft')));
      await assertFails(getDocs(query(collection(as('person'), 'jobs'), orderBy('createdAt', 'desc'))));
      await assertSucceeds(getDocs(query(collection(as('admin'), 'jobs'), orderBy('createdAt', 'desc'))));
    });

    it('lets only platform admins write', async () => {
      await assertFails(setDoc(doc(as('person'), 'jobs/new'), { title: 'X', status: 'active' }));
      await assertSucceeds(setDoc(doc(as('admin'), 'jobs/new'), { title: 'X', status: 'draft' }));
    });
  });
});
