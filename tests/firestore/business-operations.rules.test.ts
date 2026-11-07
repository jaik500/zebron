import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Business Operations (firestore.rules, BUSINESS OPERATIONS):
 * organizations/{id}/business* for an organization's managers while the
 * business-operations app is active; top-level business* for platform
 * administrators (Zebron's own business).
 */
describe('Zebron Firestore Security Rules - Business Operations', () => {
  let testEnv: RulesTestEnvironment;

  const ORGANIZATION_ID = 'org-business-test';
  const OTHER_ORGANIZATION_ID = 'org-business-other';
  const NO_APP_ORGANIZATION_ID = 'org-business-no-app';

  const PLATFORM_ADMIN_UID = 'platform-admin-uid';
  const MANAGER_UID = 'manager-uid';
  const STAFF_UID = 'staff-uid';
  const OUTSIDER_UID = 'outsider-uid';
  const NO_APP_MANAGER_UID = 'no-app-manager-uid';

  const BASE = `organizations/${ORGANIZATION_ID}`;
  const BUSINESS_ID = 'biz-1';

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

  // ==========================================================
  // HELPERS
  // ==========================================================

  async function seed(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, `users/${PLATFORM_ADMIN_UID}`), { platformRole: 'platform-admin' });

      for (const organizationId of [ORGANIZATION_ID, OTHER_ORGANIZATION_ID, NO_APP_ORGANIZATION_ID]) {
        await setDoc(doc(db, `organizations/${organizationId}`), { name: organizationId, status: 'active', active: true });
      }

      for (const organizationId of [ORGANIZATION_ID, OTHER_ORGANIZATION_ID]) {
        await setDoc(doc(db, `organizations/${organizationId}/applications/business-operations`), { status: 'active' });
      }

      const memberships: Array<[string, string, string]> = [
        [MANAGER_UID, ORGANIZATION_ID, 'org_manager'],
        [STAFF_UID, ORGANIZATION_ID, 'org_staff'],
        [OUTSIDER_UID, OTHER_ORGANIZATION_ID, 'org_owner'],
        [NO_APP_MANAGER_UID, NO_APP_ORGANIZATION_ID, 'org_owner'],
      ];

      for (const [userId, organizationId, role] of memberships) {
        await setDoc(doc(db, `organizationMemberships/${userId}_${organizationId}`), {
          userId,
          organizationId,
          role,
          active: true,
        });
      }

      await setDoc(doc(db, `${BASE}/businesses/${BUSINESS_ID}`), business());
      await setDoc(doc(db, `${BASE}/businessTransactions/t-1`), transaction());
      await setDoc(doc(db, `businesses/zebron`), business({ ownerId: PLATFORM_ADMIN_UID }));
      await setDoc(doc(db, `businessTransactions/t-zebron`), transaction({ businessId: 'zebron' }));
    });
  }

  function business(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ownerId: MANAGER_UID,
      legalName: 'Acme Training LLC',
      entityType: 'llc',
      status: 'active',
      address: { street: '1 Main St', city: 'Dover', state: 'DE', postalCode: '19901', country: 'United States' },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  function transaction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      businessId: BUSINESS_ID,
      type: 'revenue',
      date: Timestamp.fromDate(new Date('2026-11-01T12:00:00Z')),
      amount: 250,
      categoryId: 'training',
      status: 'completed',
      recurring: false,
      taxDeductible: false,
      createdBy: MANAGER_UID,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  function db(uid: string) {
    return testEnv.authenticatedContext(uid).firestore();
  }

  // ==========================================================
  // ORGANIZATION RECORDS
  // ==========================================================

  it('lets managers read and write their organization’s records', async () => {
    await seed();

    await assertSucceeds(getDocs(collection(db(MANAGER_UID), `${BASE}/businessTransactions`)));
    await assertSucceeds(setDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-2`), transaction({ amount: 99.5 })));
    await assertSucceeds(updateDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-1`), { amount: 300, updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-1`)));
    await assertSucceeds(setDoc(doc(db(MANAGER_UID), `${BASE}/businesses/biz-2`), business({ legalName: 'Second Co' })));
  });

  it('keeps staff and members out', async () => {
    await seed();

    await assertFails(getDoc(doc(db(STAFF_UID), `${BASE}/businessTransactions/t-1`)));
    await assertFails(setDoc(doc(db(STAFF_UID), `${BASE}/businessTransactions/t-2`), transaction()));
  });

  it('keeps other organizations out', async () => {
    await seed();

    await assertFails(getDoc(doc(db(OUTSIDER_UID), `${BASE}/businesses/${BUSINESS_ID}`)));
    await assertFails(getDocs(collection(db(OUTSIDER_UID), `${BASE}/businessTransactions`)));
  });

  it('needs the business-operations app to be active', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(NO_APP_MANAGER_UID), `organizations/${NO_APP_ORGANIZATION_ID}/businesses/b`), business()),
    );
  });

  it('refuses records for a business outside the organization', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-3`), transaction({ businessId: 'zebron' })),
    );
  });

  it('refuses invalid records', async () => {
    await seed();

    await assertFails(setDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-4`), transaction({ amount: -5 })));
    await assertFails(setDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-5`), transaction({ type: 'gift' })));
    await assertFails(setDoc(doc(db(MANAGER_UID), `${BASE}/businessTransactions/t-6`), transaction({ hacked: true })));
    await assertFails(setDoc(doc(db(MANAGER_UID), `${BASE}/businesses/biz-3`), business({ legalName: '' })));
  });

  it('only accepts documents stored in the organization’s own folder', async () => {
    await seed();

    const document = (storagePath: string) => ({
      businessId: BUSINESS_ID,
      name: 'Operating agreement',
      category: 'operating-agreement',
      fileName: 'agreement.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1200,
      storagePath,
      downloadUrl: 'https://example.test/file',
      uploadedBy: MANAGER_UID,
      uploadedAt: serverTimestamp(),
      verified: false,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await assertSucceeds(
      setDoc(
        doc(db(MANAGER_UID), `${BASE}/businessDocuments/d-1`),
        document(`organizations/${ORGANIZATION_ID}/business-documents/${BUSINESS_ID}/1700-agreement.pdf`),
      ),
    );
    await assertFails(
      setDoc(
        doc(db(MANAGER_UID), `${BASE}/businessDocuments/d-2`),
        document(`organizations/${OTHER_ORGANIZATION_ID}/business-documents/${BUSINESS_ID}/1700-agreement.pdf`),
      ),
    );
  });

  // ==========================================================
  // ZEBRON'S OWN RECORDS AND PLATFORM ADMINISTRATORS
  // ==========================================================

  it("keeps Zebron's own records to platform administrators", async () => {
    await seed();

    await assertSucceeds(getDocs(collection(db(PLATFORM_ADMIN_UID), 'businessTransactions')));
    await assertSucceeds(
      setDoc(doc(db(PLATFORM_ADMIN_UID), 'businessTransactions/t-z2'), transaction({ businessId: 'zebron' })),
    );
    await assertFails(getDocs(collection(db(MANAGER_UID), 'businessTransactions')));
    await assertFails(getDoc(doc(db(OUTSIDER_UID), 'businesses/zebron')));
  });

  it('lets platform administrators help any organization', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(PLATFORM_ADMIN_UID), `${BASE}/businesses/${BUSINESS_ID}`)));
  });
});
