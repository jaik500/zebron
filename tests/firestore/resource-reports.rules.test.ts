import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * "Report a problem" on a resource (resourceReports, firestore.rules):
 * reports are written only by the reportResourceProblem and
 * closeResourceReport functions; only platform administrators read them.
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

  const report = {
    resourceId: 'pantry', resourceName: 'Food pantry', resourceSlug: 'food-pantry', reason: 'phone',
    details: '', contactEmail: '', reportedBy: null, status: 'open', createdAt: serverTimestamp(),
  };

  it('lets nobody write reports from the app (the functions do)', async () => {
    await assertFails(addDoc(collection(guest(), 'resourceReports'), report));
    await assertFails(addDoc(collection(visitor(), 'resourceReports'), { ...report, reportedBy: VISITOR }));
    await assertFails(addDoc(collection(admin(), 'resourceReports'), report));
    await assertFails(updateDoc(doc(admin(), 'resourceReports/existing'), { status: 'resolved' }));
  });

  it('keeps reports private to platform administrators', async () => {
    await assertFails(getDoc(doc(guest(), 'resourceReports/existing')));
    await assertFails(getDocs(collection(visitor(), 'resourceReports')));
    await assertSucceeds(getDoc(doc(admin(), 'resourceReports/existing')));
    await assertSucceeds(getDocs(collection(admin(), 'resourceReports')));
  });

  it('keeps the report rate limits server-only', async () => {
    await assertFails(getDoc(doc(admin(), 'resourceReportLimits/2026112310_x')));
    await assertFails(setDoc(doc(guest(), 'resourceReportLimits/2026112310_x'), { count: 0 }));
  });
});
