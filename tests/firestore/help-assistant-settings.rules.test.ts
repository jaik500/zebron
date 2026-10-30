import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

describe('Zebron Firestore Security Rules - help assistant settings', () => {
  let testEnv: RulesTestEnvironment;

  const settings = (uid: string, extra: Record<string, unknown> = {}) => ({
    enabled: true,
    aiEnabled: true,
    model: 'gemini-2.5-flash',
    hourlyLimit: 40,
    maxSources: 5,
    maxAnswerWords: 180,
    assistantName: 'Zebron Assistant',
    welcomeMessage: 'Ask me anything about Zebron.',
    suggestions: ['What can my role do?'],
    extraInstructions: '',
    sources: { platformArticles: true, organizationArticles: true, builtInGuides: false },
    updatedAt: new Date().toISOString(),
    updatedBy: uid,
    ...extra,
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
      await setDoc(doc(db, 'platformConfig/helpAssistant'), settings('admin'));
      await setDoc(doc(db, 'platformConfig/other'), { secret: true });
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
  const ref = (db: ReturnType<typeof guest>) => doc(db, 'platformConfig/helpAssistant');

  it('lets anyone read the assistant settings, and nothing else in platformConfig', async () => {
    await assertSucceeds(getDoc(ref(guest())));
    await assertSucceeds(getDoc(ref(as('person'))));
    await assertFails(getDoc(doc(guest(), 'platformConfig/other')));
    await assertFails(getDocs(collection(as('person'), 'platformConfig')));
  });

  it('lets only platform admins save valid settings', async () => {
    await assertFails(setDoc(ref(as('person')), settings('person')));
    await assertSucceeds(setDoc(ref(as('admin')), settings('admin', { enabled: false, hourlyLimit: 10 })));
    await assertFails(deleteDoc(ref(as('person'))));
  });

  it('refuses out-of-range or unknown values', async () => {
    const admin = ref(as('admin'));
    await assertFails(setDoc(admin, settings('admin', { hourlyLimit: 5000 })));
    await assertFails(setDoc(admin, settings('admin', { maxSources: 0 })));
    await assertFails(setDoc(admin, settings('admin', { maxAnswerWords: 2000 })));
    await assertFails(setDoc(admin, settings('admin', { model: 'gpt-4' })));
    await assertFails(setDoc(admin, settings('admin', { apiKey: 'secret' })));
    await assertFails(setDoc(admin, settings('admin', { welcomeMessage: 'x'.repeat(501) })));
    await assertFails(setDoc(admin, settings('admin', { suggestions: ['1', '2', '3', '4', '5', '6', '7'] })));
    await assertFails(setDoc(admin, settings('someone-else')));
  });
});
