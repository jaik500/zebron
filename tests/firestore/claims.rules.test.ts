import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Roles on the sign-in token (custom claims):
 *   zv = 1, zpa = platform admin, zorg = { organizationId: role }
 *
 * The token is checked first; organization roles missing from it fall
 * back to the membership document. Platform admin status is taken from
 * the token whenever claims are synced.
 */
describe('Zebron Firestore Security Rules - roles on the sign-in token', () => {
  let testEnv: RulesTestEnvironment;

  const ORG = 'org-claims';
  const OTHER_ORG = 'org-claims-other';
  const topic = { name: 'Announcements', slug: 'announcements', active: true, sortOrder: 1 };

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
      await setDoc(doc(db, `organizations/${OTHER_ORG}`), { name: OTHER_ORG, status: 'active', active: true });
      // Profile says platform admin, used to prove the token wins.
      await setDoc(doc(db, 'users/profile-admin'), { platformRole: 'platform-admin' });
      // Membership document only (no claims): fallback path.
      await setDoc(doc(db, `organizationMemberships/doc-manager_${ORG}`), {
        userId: 'doc-manager',
        organizationId: ORG,
        role: 'org_manager',
        active: true,
      });
      await setDoc(doc(db, 'userClaims/claims-user'), { reason: 'membership' });
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const as = (uid: string, claims?: Record<string, unknown>) =>
    testEnv.authenticatedContext(uid, claims).firestore();

  it('grants organization access from the token without a membership document', async () => {
    const member = as('token-member', { zv: 1, zpa: false, zorg: { [ORG]: 'org_member' } });
    await assertSucceeds(getDocs(collection(member, `organizations/${ORG}/communityTopics`)));

    const manager = as('token-manager', { zv: 1, zpa: false, zorg: { [ORG]: 'org_manager' } });
    await assertSucceeds(setDoc(doc(manager, `organizations/${ORG}/communityTopics/t1`), topic));
  });

  it('respects the role on the token', async () => {
    const member = as('token-member', { zv: 1, zpa: false, zorg: { [ORG]: 'org_member' } });
    await assertFails(setDoc(doc(member, `organizations/${ORG}/communityTopics/t1`), topic));
  });

  it('does not grant access to other organizations', async () => {
    const manager = as('token-manager', { zv: 1, zpa: false, zorg: { [OTHER_ORG]: 'org_manager' } });
    await assertFails(getDocs(collection(manager, `organizations/${ORG}/communityTopics`)));
    await assertFails(setDoc(doc(manager, `organizations/${ORG}/communityTopics/t1`), topic));
  });

  it('falls back to the membership document when the token has no role', async () => {
    const noClaims = as('doc-manager');
    await assertSucceeds(setDoc(doc(noClaims, `organizations/${ORG}/communityTopics/t1`), topic));

    const syncedWithoutThisOrg = as('doc-manager', { zv: 1, zpa: false, zorg: {} });
    await assertSucceeds(setDoc(doc(syncedWithoutThisOrg, `organizations/${ORG}/communityTopics/t2`), topic));
  });

  it('takes platform admin status from the token', async () => {
    const tokenAdmin = as('token-admin', { zv: 1, zpa: true, zorg: {} });
    await assertSucceeds(setDoc(doc(tokenAdmin, 'communityTopics/t1'), topic));

    // Profile says admin, but the synced token says no: the token wins.
    const demoted = as('profile-admin', { zv: 1, zpa: false, zorg: {} });
    await assertFails(setDoc(doc(demoted, 'communityTopics/t2'), topic));

    // No claims yet: the profile is used.
    const unsynced = as('profile-admin');
    await assertSucceeds(setDoc(doc(unsynced, 'communityTopics/t3'), topic));
  });

  it('ignores claims that are not synced', async () => {
    const forged = as('someone', { zpa: true, zorg: { [ORG]: 'org_owner' } });
    await assertFails(setDoc(doc(forged, 'communityTopics/t1'), topic));
    await assertFails(setDoc(doc(forged, `organizations/${ORG}/communityTopics/t1`), topic));
  });

  it('lets people read only their own role-change signal', async () => {
    await assertSucceeds(getDoc(doc(as('claims-user'), 'userClaims/claims-user')));
    await assertFails(getDoc(doc(as('someone-else'), 'userClaims/claims-user')));
    await assertFails(setDoc(doc(as('claims-user'), 'userClaims/claims-user'), { reason: 'x' }));
  });
});
