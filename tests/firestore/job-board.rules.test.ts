import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Job board (firestore.rules, JOBS and JOB SEEKERS blocks):
 * - anyone reads active listings; only platform admins write them;
 * - users/{uid}/savedJobs and users/{uid}/jobAlerts belong to their owner;
 * - at most five alerts (fixed ids), and lastSentAt is left to the server.
 */
describe('Zebron Firestore Security Rules - job board', () => {
  let testEnv: RulesTestEnvironment;

  const SEEKER = 'job-seeker';
  const OTHER = 'job-other';

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
      await setDoc(doc(context.firestore(), 'jobs/job-1'), { title: 'Help desk analyst', organizationName: 'Acme', status: 'active' });
      await setDoc(doc(context.firestore(), 'jobs/job-draft'), { title: 'Draft', organizationName: 'Acme', status: 'draft' });
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const seekerDb = () => testEnv.authenticatedContext(SEEKER).firestore();
  const otherDb = () => testEnv.authenticatedContext(OTHER).firestore();

  function alert(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'alert-1',
      keywords: 'help desk',
      state: 'VA',
      workArrangement: 'remote',
      employmentType: '',
      active: true,
      createdAt: serverTimestamp(),
      ...overrides,
    };
  }

  it('lets anyone read an active listing but not a draft', async () => {
    const visitor = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(visitor, 'jobs/job-1')));
    await assertFails(getDoc(doc(visitor, 'jobs/job-draft')));
  });

  it('lets a job seeker save, read and remove a job', async () => {
    const ref = doc(seekerDb(), `users/${SEEKER}/savedJobs/job-1`);
    await assertSucceeds(setDoc(ref, { jobId: 'job-1', title: 'Help desk analyst', organizationName: 'Acme', savedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });

  it('refuses a saved job for a listing that does not exist, or with extra fields', async () => {
    await assertFails(
      setDoc(doc(seekerDb(), `users/${SEEKER}/savedJobs/missing`), { jobId: 'missing', title: 'x', organizationName: 'y', savedAt: serverTimestamp() }),
    );
    await assertFails(
      setDoc(doc(seekerDb(), `users/${SEEKER}/savedJobs/job-1`), { jobId: 'job-1', title: 'x', organizationName: 'y', savedAt: serverTimestamp(), note: 'extra' }),
    );
  });

  it("keeps saved jobs private to their owner", async () => {
    await assertFails(
      setDoc(doc(otherDb(), `users/${SEEKER}/savedJobs/job-1`), { jobId: 'job-1', title: 'x', organizationName: 'y', savedAt: serverTimestamp() }),
    );
    await assertFails(getDoc(doc(otherDb(), `users/${SEEKER}/savedJobs/job-1`)));
  });

  it('lets a job seeker create, change and delete an alert', async () => {
    const ref = doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-1`);
    await assertSucceeds(setDoc(ref, alert()));
    await assertSucceeds(updateDoc(ref, { keywords: 'it support', active: false }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('allows only the five fixed alert ids', async () => {
    await assertSucceeds(setDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-5`), alert({ id: 'alert-5' })));
    await assertFails(setDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-6`), alert({ id: 'alert-6' })));
  });

  it('refuses invalid filters', async () => {
    await assertFails(setDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-1`), alert({ workArrangement: 'moon' })));
    await assertFails(setDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-1`), alert({ state: 'Virginia' })));
  });

  it('leaves lastSentAt to the server', async () => {
    await assertFails(
      setDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-1`), alert({ lastSentAt: Timestamp.now() })),
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `users/${SEEKER}/jobAlerts/alert-2`), { ...alert({ id: 'alert-2' }), createdAt: Timestamp.now(), lastSentAt: Timestamp.now() });
    });
    await assertFails(updateDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-2`), { lastSentAt: null }));
    await assertSucceeds(updateDoc(doc(seekerDb(), `users/${SEEKER}/jobAlerts/alert-2`), { keywords: 'network' }));
  });

  it("keeps alerts private to their owner", async () => {
    await assertFails(setDoc(doc(otherDb(), `users/${SEEKER}/jobAlerts/alert-1`), alert()));
  });
});
