import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Role ladder for organization memberships:
 *   org_member (1) < org_staff (2) < org_manager (3) < org_admin (4) < org_owner (5)
 *
 * Managers and above manage people strictly below their own role, only
 * to roles strictly below their own, and never their own membership.
 * Checked both with membership documents and with roles on the token.
 */
describe('Zebron Firestore Security Rules - membership role ladder', () => {
  let testEnv: RulesTestEnvironment;

  const ORG = 'org-ladder';
  const people: Array<[string, string]> = [
    ['owner', 'org_owner'],
    ['admin', 'org_admin'],
    ['manager', 'org_manager'],
    ['staff', 'org_staff'],
    ['member', 'org_member'],
    ['member2', 'org_member'],
  ];

  const membershipId = (uid: string) => `${uid}_${ORG}`;

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
      await setDoc(doc(db, `organizations/${ORG}`), { name: ORG, status: 'active', active: true });
      for (const [uid, role] of people) {
        await setDoc(doc(db, `organizationMemberships/${membershipId(uid)}`), {
          userId: uid,
          organizationId: ORG,
          role,
          active: true,
        });
      }
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  /** Documents only, or roles on the token (claims) as well. */
  const modes = [
    { name: 'membership documents', claims: (_role: string) => undefined },
    { name: 'roles on the token', claims: (role: string) => ({ zv: 1, zpa: false, zorg: { [ORG]: role } }) },
  ];

  for (const mode of modes) {
    describe(`using ${mode.name}`, () => {
      const as = (uid: string) => {
        const role = people.find(([id]) => id === uid)?.[1] ?? '';
        return testEnv.authenticatedContext(uid, mode.claims(role)).firestore();
      };

      const invite = (by: string, uid: string, role: string) =>
        setDoc(doc(as(by), `organizationMemberships/${membershipId(uid)}`), {
          userId: uid,
          organizationId: ORG,
          role,
          active: true,
        });

      it('lets managers add staff and members only', async () => {
        await assertSucceeds(invite('manager', 'new-staff', 'org_staff'));
        await assertSucceeds(invite('manager', 'new-member', 'org_member'));
        await assertFails(invite('manager', 'new-manager', 'org_manager'));
        await assertFails(invite('manager', 'new-admin', 'org_admin'));
      });

      it('lets admins add managers but not admins or owners', async () => {
        await assertSucceeds(invite('admin', 'new-manager', 'org_manager'));
        await assertFails(invite('admin', 'new-admin', 'org_admin'));
        await assertFails(invite('admin', 'new-owner', 'org_owner'));
      });

      it('denies staff and members adding anyone', async () => {
        await assertFails(invite('staff', 'new-member', 'org_member'));
        await assertFails(invite('member', 'new-member', 'org_member'));
      });

      it('lets managers change and deactivate people below them', async () => {
        await assertSucceeds(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('member')}`), { role: 'org_staff' }));
        await assertSucceeds(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('staff')}`), { active: false }));
      });

      it('denies promoting someone to your own role or above', async () => {
        await assertFails(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('member')}`), { role: 'org_manager' }));
        await assertFails(updateDoc(doc(as('admin'), `organizationMemberships/${membershipId('manager')}`), { role: 'org_admin' }));
      });

      it('denies changing someone at or above your role', async () => {
        await assertFails(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('admin')}`), { active: false }));
        await assertFails(updateDoc(doc(as('admin'), `organizationMemberships/${membershipId('owner')}`), { role: 'org_member' }));
        await assertFails(deleteDoc(doc(as('admin'), `organizationMemberships/${membershipId('owner')}`)));
      });

      it('denies changing your own role or status', async () => {
        await assertFails(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('manager')}`), { role: 'org_admin' }));
        await assertFails(updateDoc(doc(as('admin'), `organizationMemberships/${membershipId('admin')}`), { active: false }));
      });

      it('denies moving a membership to another person or organization', async () => {
        await assertFails(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('member')}`), { userId: 'someone-else' }));
        await assertFails(updateDoc(doc(as('manager'), `organizationMemberships/${membershipId('member')}`), { organizationId: 'other-org' }));
      });

      it('lets managers list the organization and members see only themselves', async () => {
        const all = (uid: string) => getDocs(query(collection(as(uid), 'organizationMemberships'), where('organizationId', '==', ORG)));
        await assertSucceeds(all('manager'));
        await assertFails(all('staff'));
        await assertFails(all('member'));

        const own = getDocs(query(collection(as('member'), 'organizationMemberships'), where('userId', '==', 'member')));
        await assertSucceeds(own);
      });
    });
  }
});
