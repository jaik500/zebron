import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * "Report a problem" on a resource (resourceReports, firestore.rules):
 * anyone can report a problem with an existing resource; only platform
 * administrators read reports and close them.
 */
describe('Zebron Firestore Security Rules - Resource problem reports', () => {
  let testEnv: RulesTestEnvironment;

  const VISITOR = 'report-visitor';
  const ADMIN = 'report-admin';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'resources/pantry'), { name: 'Food pantry', slug: 'food-pantry', status: 'published' });
      await setDoc(doc(context.firestore(), 'resourceReports/existing'), {
        resourceId: 'pantry', resourceName: 'Food pantry', resourceSlug: 'food-pantry', reason: 'closed',
        details: '', contactEmail: '', reportedBy: null, status: 'open', createdAt: new Date(),
      });
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const guest = () => testEnv.unauthenticatedContext().firestore();
  const visitor = () => testEnv.authenticatedContext(VISITOR, { zv: 1 }).firestore();
  const admin = () => testEnv.authenticatedContext(ADMIN, { zv: 1, zpa: true }).firestore();

  const report = (overrides: Record<string, unknown> = {}) => ({
    resourceId: 'pantry',
    resourceName: 'Food pantry',
    resourceSlug: 'food-pantry',
    reason: 'phone',
    details: 'The new number is 301-555-0100',
    contactEmail: '',
    reportedBy: null,
    status: 'open',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  it('lets guests and signed-in visitors report a problem', async () => {
    await assertSucceeds(addDoc(collection(guest(), 'resourceReports'), report()));
    await assertSucceeds(addDoc(collection(visitor(), 'resourceReports'), report({ reportedBy: VISITOR })));
  });

  it('refuses reports that are not open, name someone else, use unknown reasons, are too long or point at no resource', async () => {
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ status: 'resolved' })));
    await assertFails(addDoc(collection(visitor(), 'resourceReports'), report({ reportedBy: 'someone-else' })));
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ reportedBy: VISITOR })));
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ reason: 'spam' })));
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ details: 'x'.repeat(1001) })));
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ resourceId: 'missing' })));
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report({ extra: true })));
  });

  it('keeps reports private to platform administrators', async () => {
    await assertFails(getDoc(doc(guest(), 'resourceReports/existing')));
    await assertFails(getDocs(collection(visitor(), 'resourceReports')));
    await assertSucceeds(getDoc(doc(admin(), 'resourceReports/existing')));
  });

  it('lets only platform administrators close a report', async () => {
    await assertFails(updateDoc(doc(visitor(), 'resourceReports/existing'), { status: 'resolved' }));
    await assertSucceeds(updateDoc(doc(admin(), 'resourceReports/existing'), { status: 'resolved', resolvedBy: ADMIN, resolvedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(admin(), 'resourceReports/existing'), { details: 'changed' }));
  });
});
