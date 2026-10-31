import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getCountFromServer, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

import fs from 'node:fs';

/** Likes and reports on Knowledge Center articles. */
describe('Zebron Firestore Security Rules - knowledge likes and reports', () => {
  let testEnv: RulesTestEnvironment;
  const ORG = 'org-kb';

  const like = (uid: string, org: string | null, articleId = 'a1') => ({
    articleKey: org ? `org_${org}_${articleId}` : `zebron_${articleId}`,
    articleId,
    source: org ? 'organization' : 'zebron',
    organizationId: org,
    userId: uid,
    createdAt: serverTimestamp(),
  });

  const report = (uid: string, org: string | null) => ({
    articleKey: org ? `org_${org}_a1` : 'zebron_a1',
    articleId: 'a1',
    articleTitle: 'Article',
    source: org ? 'organization' : 'zebron',
    organizationId: org,
    reason: 'outdated',
    details: 'Steps changed.',
    reporterId: uid,
    reporterName: 'Reader',
    status: 'open',
    createdAt: serverTimestamp(),
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
      await setDoc(doc(db, `organizations/${ORG}`), { name: ORG, status: 'active', active: true });
      for (const [uid, role] of [['member', 'org_member'], ['staff', 'org_staff']]) {
        await setDoc(doc(db, `organizationMemberships/${uid}_${ORG}`), { userId: uid, organizationId: ORG, role, active: true });
      }
      await setDoc(doc(db, `knowledgeReports/member_org_${ORG}_a1`), { ...report('member', ORG), createdAt: new Date() });
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

  it('lets people like Zebron articles and members like their organization articles', async () => {
    await assertSucceeds(setDoc(doc(as('anyone'), 'knowledgeLikes/zebron_a1_anyone'), like('anyone', null)));
    await assertSucceeds(setDoc(doc(as('member'), `knowledgeLikes/org_${ORG}_a1_member`), like('member', ORG)));
    await assertFails(setDoc(doc(as('outsider'), `knowledgeLikes/org_${ORG}_a1_outsider`), like('outsider', ORG)));
    await assertFails(setDoc(doc(as('anyone'), 'knowledgeLikes/zebron_a1_someone'), like('someone', null)));
  });

  it('counts likes and lets people remove only their own', async () => {
    await assertSucceeds(setDoc(doc(as('member'), `knowledgeLikes/org_${ORG}_a1_member`), like('member', ORG)));
    const count = (uid: string) =>
      getCountFromServer(query(collection(as(uid), 'knowledgeLikes'), where('articleKey', '==', `org_${ORG}_a1`), where('organizationId', '==', ORG)));
    await assertSucceeds(count('staff'));
    await assertFails(count('outsider'));
    await assertFails(deleteDoc(doc(as('staff'), `knowledgeLikes/org_${ORG}_a1_member`)));
    await assertSucceeds(deleteDoc(doc(as('member'), `knowledgeLikes/org_${ORG}_a1_member`)));
  });

  it('lets readers report once as themselves', async () => {
    await assertSucceeds(setDoc(doc(as('reader'), 'knowledgeReports/reader_zebron_a1'), report('reader', null)));
    await assertFails(setDoc(doc(as('reader'), 'knowledgeReports/other_zebron_a1'), report('other', null)));
    await assertFails(setDoc(doc(as('outsider'), `knowledgeReports/outsider_org_${ORG}_a1`), report('outsider', ORG)));
    await assertFails(setDoc(doc(as('reader'), 'knowledgeReports/reader_zebron_a1'), { ...report('reader', null), status: 'resolved' }));
  });

  it('lets organization staff review their reports, and only platform admins Zebron reports', async () => {
    const orgReports = (uid: string) =>
      query(collection(as(uid), 'knowledgeReports'), where('organizationId', '==', ORG), where('status', '==', 'open'));
    await assertSucceeds(getCountFromServer(orgReports('staff')));
    await assertFails(getCountFromServer(orgReports('member')));
    await assertFails(getCountFromServer(query(collection(as('staff'), 'knowledgeReports'), where('organizationId', '==', null))));

    const ref = (uid: string) => doc(as(uid), `knowledgeReports/member_org_${ORG}_a1`);
    await assertFails(updateDoc(ref('member'), { status: 'resolved', resolvedBy: 'member', resolvedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('staff'), { status: 'resolved', resolvedBy: 'staff', resolvedAt: serverTimestamp() }));
  });
});
