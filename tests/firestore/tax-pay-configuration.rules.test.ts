import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

/** Public Tax & Pay Calculator: free for everyone, admin-managed rates. */
describe('Zebron Firestore Security Rules - Tax & Pay configuration', () => {
  let testEnv: RulesTestEnvironment;

  const configuration = (taxYear: number, active: boolean) => ({
    id: `tax-${taxYear}`,
    taxYear,
    active,
    federal: { standardDeductionSingle: 15000 },
    updatedAt: new Date().toISOString(),
  });

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/admin'), { platformRole: 'platform-admin' });
      await setDoc(doc(db, 'taxPayConfigurations/tax-2026'), configuration(2026, true));
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

  it('lets guests and signed-in people read the rates', async () => {
    await assertSucceeds(getDocs(collection(guest(), 'taxPayConfigurations')));
    await assertSucceeds(getDoc(doc(guest(), 'taxPayConfigurations/tax-2026')));
    await assertSucceeds(getDocs(collection(as('person'), 'taxPayConfigurations')));
  });

  it('lets only platform admins change the rates', async () => {
    await assertFails(setDoc(doc(guest(), 'taxPayConfigurations/tax-2027'), configuration(2027, false)));
    await assertFails(setDoc(doc(as('person'), 'taxPayConfigurations/tax-2026'), configuration(2026, false)));
    await assertFails(deleteDoc(doc(as('person'), 'taxPayConfigurations/tax-2026')));

    await assertSucceeds(setDoc(doc(as('admin'), 'taxPayConfigurations/tax-2027'), configuration(2027, false)));
    await assertSucceeds(setDoc(doc(as('admin'), 'taxPayConfigurations/tax-2026'), { active: false }, { merge: true }));
    await assertFails(setDoc(doc(as('admin'), 'taxPayConfigurations/bad'), { taxYear: 'next year', active: true }));
    await assertSucceeds(deleteDoc(doc(as('admin'), 'taxPayConfigurations/tax-2027')));
  });
});
