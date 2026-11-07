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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Shared Dashboard Engine: organizations/{id}/dashboards and
 * organizations/{id}/stats (firestore.rules, SHARED DASHBOARD ENGINE).
 */
describe('Zebron Firestore Security Rules - Dashboards', () => {
  let testEnv: RulesTestEnvironment;

  const ORGANIZATION_ID = 'org-dashboards-test';
  const OTHER_ORGANIZATION_ID = 'org-other';

  const ADMIN_UID = 'admin-uid';
  const MANAGER_UID = 'manager-uid';
  const STAFF_UID = 'staff-uid';
  const MEMBER_UID = 'member-uid';
  const OUTSIDER_UID = 'outsider-uid';

  const PATH = `organizations/${ORGANIZATION_ID}/dashboards`;
  const STATS = `organizations/${ORGANIZATION_ID}/stats/learning`;

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

      await setDoc(doc(db, `organizations/${ORGANIZATION_ID}`), {
        name: 'Dashboards Test Organization',
        slug: 'dashboards-test',
        status: 'active',
        active: true,
      });

      const memberships: Array<[string, string, string]> = [
        [ADMIN_UID, ORGANIZATION_ID, 'org_admin'],
        [MANAGER_UID, ORGANIZATION_ID, 'org_manager'],
        [STAFF_UID, ORGANIZATION_ID, 'org_staff'],
        [MEMBER_UID, ORGANIZATION_ID, 'org_member'],
        [OUTSIDER_UID, OTHER_ORGANIZATION_ID, 'org_owner'],
      ];

      for (const [userId, organizationId, role] of memberships) {
        await setDoc(doc(db, `organizationMemberships/${userId}_${organizationId}`), {
          userId,
          organizationId,
          role,
          active: true,
        });
      }

      await setDoc(doc(db, `${PATH}/everyone`), dashboard());
      await setDoc(
        doc(db, `${PATH}/managers`),
        dashboard({ viewMinRole: 'org_manager', viewMinRank: 3 }),
      );
      await setDoc(
        doc(db, `${PATH}/admins`),
        dashboard({ viewMinRole: 'org_admin', viewMinRank: 4, editMinRole: 'org_admin', editMinRank: 4 }),
      );
      await setDoc(doc(db, STATS), { members: 4, completionPercent: 50, updatedAt: serverTimestamp() });
    });
  }

  function dashboard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      organizationId: ORGANIZATION_ID,
      name: 'Organization overview',
      description: '',
      appId: 'organization',
      scope: 'shared',
      ownerId: MANAGER_UID,
      viewMinRole: 'org_member',
      viewMinRank: 1,
      editMinRole: 'org_manager',
      editMinRank: 3,
      isDefault: false,
      widgets: [{ id: 'w_1', type: 'note', size: 'm', title: '', config: { text: 'Hello' } }],
      templateId: 'organization-overview',
      templateVersion: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: MANAGER_UID,
      ...overrides,
    };
  }

  function db(uid: string) {
    return testEnv.authenticatedContext(uid).firestore();
  }

  // ==========================================================
  // READ
  // ==========================================================

  it('lets members read and list dashboards at their level', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(MEMBER_UID), `${PATH}/everyone`)));
    await assertSucceeds(
      getDocs(query(collection(db(MEMBER_UID), PATH), where('viewMinRank', '<=', 1))),
    );
  });

  it("hides dashboards above the reader's role", async () => {
    await seed();

    await assertFails(getDoc(doc(db(MEMBER_UID), `${PATH}/managers`)));
    await assertFails(getDoc(doc(db(MANAGER_UID), `${PATH}/admins`)));
    await assertSucceeds(getDoc(doc(db(ADMIN_UID), `${PATH}/admins`)));
  });

  it("refuses list queries that do not filter by the reader's rank", async () => {
    await seed();

    await assertFails(getDocs(collection(db(MEMBER_UID), PATH)));
    await assertFails(
      getDocs(query(collection(db(MEMBER_UID), PATH), where('viewMinRank', '<=', 3))),
    );
  });

  it('denies people outside the organization', async () => {
    await seed();

    await assertFails(getDoc(doc(db(OUTSIDER_UID), `${PATH}/everyone`)));
  });

  // ==========================================================
  // CREATE
  // ==========================================================

  it('lets a manager create a valid dashboard', async () => {
    await seed();

    await assertSucceeds(setDoc(doc(db(MANAGER_UID), `${PATH}/new`), dashboard()));
  });

  it('denies staff and members from creating dashboards', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(STAFF_UID), `${PATH}/new`), dashboard({ ownerId: STAFF_UID, updatedBy: STAFF_UID })),
    );
    await assertFails(
      setDoc(doc(db(MEMBER_UID), `${PATH}/new`), dashboard({ ownerId: MEMBER_UID, updatedBy: MEMBER_UID })),
    );
  });

  it('rejects invalid dashboards', async () => {
    await seed();

    const managerDb = db(MANAGER_UID);
    const tooMany = Array.from({ length: 13 }, (_, index) => ({ id: `w_${index}`, type: 'note', size: 's', title: '', config: {} }));

    // Edit rights below managers.
    await assertFails(setDoc(doc(managerDb, `${PATH}/a`), dashboard({ editMinRole: 'org_staff', editMinRank: 2 })));
    // Rank that doesn't match its role.
    await assertFails(setDoc(doc(managerDb, `${PATH}/b`), dashboard({ viewMinRank: 3 })));
    // More than 12 widgets.
    await assertFails(setDoc(doc(managerDb, `${PATH}/c`), dashboard({ widgets: tooMany })));
    // Personal dashboards aren't available yet.
    await assertFails(setDoc(doc(managerDb, `${PATH}/d`), dashboard({ scope: 'personal' })));
    // Unexpected fields, someone else as owner, and edit rights above one's own role.
    await assertFails(setDoc(doc(managerDb, `${PATH}/e`), dashboard({ data: { completion: 99 } })));
    await assertFails(setDoc(doc(managerDb, `${PATH}/f`), dashboard({ ownerId: ADMIN_UID })));
    await assertFails(
      setDoc(doc(managerDb, `${PATH}/g`), dashboard({ editMinRole: 'org_admin', editMinRank: 4 })),
    );
  });

  it('lets only admins create a default dashboard', async () => {
    await seed();

    await assertFails(setDoc(doc(db(MANAGER_UID), `${PATH}/x`), dashboard({ isDefault: true })));
    await assertSucceeds(
      setDoc(
        doc(db(ADMIN_UID), `${PATH}/y`),
        dashboard({ isDefault: true, ownerId: ADMIN_UID, updatedBy: ADMIN_UID }),
      ),
    );
  });

  // ==========================================================
  // UPDATE AND DELETE
  // ==========================================================

  it('lets a manager edit a dashboard they can edit', async () => {
    await seed();

    await assertSucceeds(
      updateDoc(doc(db(MANAGER_UID), `${PATH}/everyone`), {
        name: 'Renamed',
        updatedAt: serverTimestamp(),
        updatedBy: MANAGER_UID,
      }),
    );
  });

  it('denies members, other owners and the wrong editor', async () => {
    await seed();

    await assertFails(
      updateDoc(doc(db(MEMBER_UID), `${PATH}/everyone`), {
        name: 'Hacked',
        updatedAt: serverTimestamp(),
        updatedBy: MEMBER_UID,
      }),
    );
    await assertFails(
      updateDoc(doc(db(MANAGER_UID), `${PATH}/everyone`), {
        ownerId: ADMIN_UID,
        updatedAt: serverTimestamp(),
        updatedBy: MANAGER_UID,
      }),
    );
    await assertFails(
      updateDoc(doc(db(MANAGER_UID), `${PATH}/everyone`), {
        name: 'Renamed',
        updatedAt: serverTimestamp(),
        updatedBy: ADMIN_UID,
      }),
    );
  });

  it('lets only admins change the default', async () => {
    await seed();

    await assertFails(
      updateDoc(doc(db(MANAGER_UID), `${PATH}/everyone`), {
        isDefault: true,
        updatedAt: serverTimestamp(),
        updatedBy: MANAGER_UID,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db(ADMIN_UID), `${PATH}/everyone`), {
        isDefault: true,
        updatedAt: serverTimestamp(),
        updatedBy: ADMIN_UID,
      }),
    );
  });

  it('lets editors delete, and no one below them', async () => {
    await seed();

    await assertFails(deleteDoc(doc(db(MEMBER_UID), `${PATH}/everyone`)));
    await assertFails(deleteDoc(doc(db(MANAGER_UID), `${PATH}/admins`)));
    await assertSucceeds(deleteDoc(doc(db(MANAGER_UID), `${PATH}/everyone`)));
  });

  // ==========================================================
  // STATS (written only by Cloud Functions)
  // ==========================================================

  it('lets managers read the learning summary, and no one write it', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(MANAGER_UID), STATS)));
    await assertFails(getDoc(doc(db(STAFF_UID), STATS)));
    await assertFails(getDoc(doc(db(MEMBER_UID), STATS)));
    await assertFails(getDoc(doc(db(OUTSIDER_UID), STATS)));
    await assertFails(setDoc(doc(db(ADMIN_UID), STATS), { members: 999 }));
  });
});
