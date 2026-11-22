import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Home page looks built in Admin → Home page look (homeLooks/{id},
 * firestore.rules): everyone reads them; platform administrators create,
 * change and delete them; fields and placement ranges are checked.
 */
describe('Zebron Firestore Security Rules - home page looks', () => {
  let testEnv: RulesTestEnvironment;

  const ADMIN_UID = 'looks-admin';
  const USER_UID = 'looks-user';
  const LOOK_ID = 'pumpkin';
  const PATH = `homeLooks/${LOOK_ID}`;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const admin = () => testEnv.authenticatedContext(ADMIN_UID, { zv: 1, zpa: true }).firestore();
  const user = () => testEnv.authenticatedContext(USER_UID, { zv: 1 }).firestore();
  const visitor = () => testEnv.unauthenticatedContext().firestore();

  function look(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      label: 'Pumpkin',
      occasion: 'October',
      description: 'A small pumpkin on the e.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/zebron/o/home-looks%2Fpumpkin%2F1-pumpkin.svg?alt=media',
      imagePath: `home-looks/${LOOK_ID}/1-pumpkin.svg`,
      placement: { size: 0.765, x: 0.087, y: 0.02, rotate: 0 },
      circle: 'standard',
      createdAt: serverTimestamp(),
      createdBy: ADMIN_UID,
      updatedAt: serverTimestamp(),
      updatedBy: ADMIN_UID,
      ...overrides,
    };
  }

  async function seed(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), look());
    });
  }

  it('lets everyone read looks, signed in or not', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(visitor(), PATH)));
    await assertSucceeds(getDoc(doc(user(), PATH)));
  });

  it('lets platform administrators create, change and delete looks', async () => {
    await assertSucceeds(setDoc(doc(admin(), PATH), look()));
    await assertSucceeds(
      updateDoc(doc(admin(), PATH), { label: 'Big pumpkin', circle: 'ornament', updatedAt: serverTimestamp(), updatedBy: ADMIN_UID }),
    );
    await assertSucceeds(deleteDoc(doc(admin(), PATH)));
  });

  it('refuses everyone else', async () => {
    await assertFails(setDoc(doc(user(), PATH), look({ createdBy: USER_UID, updatedBy: USER_UID })));
    await seed();
    await assertFails(updateDoc(doc(user(), PATH), { label: 'Mine', updatedAt: serverTimestamp(), updatedBy: USER_UID }));
    await assertFails(deleteDoc(doc(user(), PATH)));
  });

  it('checks the fields, the picture and the placement ranges', async () => {
    await assertFails(setDoc(doc(admin(), PATH), look({ label: '' })));
    await assertFails(setDoc(doc(admin(), PATH), look({ imageUrl: 'https://example.com/hat.svg' })));
    await assertFails(setDoc(doc(admin(), PATH), look({ imagePath: 'home-looks/another-look/1-hat.svg' })));
    await assertFails(setDoc(doc(admin(), PATH), look({ placement: { size: 3, x: 0, y: 0, rotate: 0 } })));
    await assertFails(setDoc(doc(admin(), PATH), look({ placement: { size: 0.5, x: 0, y: 0 } })));
    await assertFails(setDoc(doc(admin(), PATH), look({ circle: 'snowman' })));
    await assertFails(setDoc(doc(admin(), PATH), look({ letter: 'neon' })));
    await assertSucceeds(setDoc(doc(admin(), 'homeLooks/sparkly'), look({ letter: 'sparkler', imagePath: 'home-looks/sparkly/1-sparks.svg' })));
    await assertFails(setDoc(doc(admin(), PATH), look({ script: '<script>' })));
  });

  it('keeps who created a look', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(admin(), PATH), { createdBy: 'someone-else', updatedAt: serverTimestamp(), updatedBy: ADMIN_UID }),
    );
  });
});
