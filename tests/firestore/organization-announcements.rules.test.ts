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

describe('Zebron Firestore Security Rules - Organization Announcements', () => {
  let testEnv: RulesTestEnvironment;

  const ORGANIZATION_ID = 'org-announcements-test';
  const OTHER_ORGANIZATION_ID = 'org-other';

  const MANAGER_UID = 'manager-uid';
  const STAFF_UID = 'staff-uid';
  const MEMBER_UID = 'member-uid';
  const OUTSIDER_UID = 'outsider-uid';

  const PATH = `organizations/${ORGANIZATION_ID}/announcements`;

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
        name: 'Announcements Test Organization',
        slug: 'announcements-test',
        status: 'active',
        active: true,
      });

      const memberships: Array<[string, string, string]> = [
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

      await setDoc(doc(db, `${PATH}/live`), announcement({ createdBy: MANAGER_UID }));
      await setDoc(
        doc(db, `${PATH}/hidden`),
        announcement({ createdBy: MANAGER_UID, active: false }),
      );
    });
  }

  function announcement(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      organizationId: ORGANIZATION_ID,
      type: 'event',
      title: 'Open house',
      message: 'Come meet the team.',
      ctaLabel: 'Register',
      ctaUrl: 'https://example.com/register',
      eventDate: '2026-12-01',
      honoreeName: null,
      theme: 'zebron',
      font: 'default',
      artwork: 'calendar',
      imageUrl: null,
      startsOn: null,
      endsOn: null,
      active: true,
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
  // READ
  // ==========================================================

  it('lets members list active banners', async () => {
    await seed();

    await assertSucceeds(
      getDocs(query(collection(db(MEMBER_UID), PATH), where('active', '==', true))),
    );
  });

  it('hides inactive banners from members', async () => {
    await seed();

    await assertFails(getDoc(doc(db(MEMBER_UID), `${PATH}/hidden`)));
    await assertFails(getDocs(collection(db(MEMBER_UID), PATH)));
  });

  it('lets managers read every banner', async () => {
    await seed();

    await assertSucceeds(getDocs(collection(db(MANAGER_UID), PATH)));
  });

  it('denies people outside the organization', async () => {
    await seed();

    await assertFails(getDoc(doc(db(OUTSIDER_UID), `${PATH}/live`)));
  });

  // ==========================================================
  // WRITE
  // ==========================================================

  it('lets a manager create a valid banner', async () => {
    await seed();

    await assertSucceeds(setDoc(doc(db(MANAGER_UID), `${PATH}/new`), announcement()));
  });

  it('denies staff and members from creating banners', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(STAFF_UID), `${PATH}/new`), announcement({ createdBy: STAFF_UID })),
    );
    await assertFails(
      setDoc(doc(db(MEMBER_UID), `${PATH}/new`), announcement({ createdBy: MEMBER_UID })),
    );
  });

  it('rejects unknown themes, non-https links and unexpected fields', async () => {
    await seed();

    const managerDb = db(MANAGER_UID);

    await assertFails(setDoc(doc(managerDb, `${PATH}/a`), announcement({ theme: 'neon' })));
    await assertFails(
      setDoc(doc(managerDb, `${PATH}/b`), announcement({ ctaUrl: 'javascript:alert(1)' })),
    );
    await assertFails(
      setDoc(doc(managerDb, `${PATH}/c`), announcement({ imageUrl: 'http://example.com/a.png' })),
    );
    await assertFails(setDoc(doc(managerDb, `${PATH}/d`), announcement({ html: '<b>x</b>' })));
    await assertFails(setDoc(doc(managerDb, `${PATH}/e`), announcement({ title: '' })));
  });

  it('requires createdBy to be the author', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(MANAGER_UID), `${PATH}/new`), announcement({ createdBy: 'someone-else' })),
    );
  });

  it('lets a manager hide, edit and delete a banner', async () => {
    await seed();

    const managerDb = db(MANAGER_UID);

    await assertSucceeds(
      updateDoc(doc(managerDb, `${PATH}/live`), { active: false, updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(doc(managerDb, `${PATH}/live`), { title: 'Open house, updated' }),
    );
    await assertSucceeds(deleteDoc(doc(managerDb, `${PATH}/live`)));
  });

  it('denies members from editing or deleting banners', async () => {
    await seed();

    await assertFails(updateDoc(doc(db(MEMBER_UID), `${PATH}/live`), { title: 'Hacked' }));
    await assertFails(deleteDoc(doc(db(MEMBER_UID), `${PATH}/live`)));
  });
});
