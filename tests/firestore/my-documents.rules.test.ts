import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * My documents (users/{uid}/documents, firestore.rules): details of a
 * person's own files for the reader. Private to the owner; fields checked;
 * only the title and the reading position change after upload.
 */
describe('Zebron Firestore Security Rules - my documents', () => {
  let testEnv: RulesTestEnvironment;

  const OWNER_UID = 'documents-owner';
  const OTHER_UID = 'documents-other';
  const DOCUMENT_ID = 'doc-1';
  const PATH = `users/${OWNER_UID}/documents/${DOCUMENT_ID}`;

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

  function documentData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      title: 'Security+ study notes',
      fileName: 'security-plus-notes.pdf',
      format: 'pdf',
      contentType: 'application/pdf',
      size: 2_400_000,
      storagePath: `users/${OWNER_UID}/documents/${DOCUMENT_ID}/security-plus-notes.pdf`,
      position: {},
      progress: 0,
      openedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  const ownerDb = () => testEnv.authenticatedContext(OWNER_UID).firestore();
  const otherDb = () => testEnv.authenticatedContext(OTHER_UID).firestore();

  async function seed(): Promise<void> {
    await assertSucceeds(setDoc(doc(ownerDb(), PATH), documentData()));
  }

  // ---------- Create ----------

  it('lets a person save the details of each supported format', async () => {
    const formats: [string, string, string][] = [
      ['pdf', 'application/pdf', 'a.pdf'],
      ['epub', 'application/epub+zip', 'a.epub'],
      ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'a.docx'],
      ['txt', 'text/plain', 'a.txt'],
      ['md', 'text/markdown', 'a.md'],
    ];
    for (const [format, contentType, fileName] of formats) {
      const id = `doc-${format}`;
      await assertSucceeds(
        setDoc(
          doc(ownerDb(), `users/${OWNER_UID}/documents/${id}`),
          documentData({ format, contentType, fileName, storagePath: `users/${OWNER_UID}/documents/${id}/${fileName}` }),
        ),
      );
    }
  });

  it('refuses another person writing into someone else\'s documents', async () => {
    await assertFails(setDoc(doc(otherDb(), PATH), documentData()));
  });

  it('refuses a signed-out visitor', async () => {
    await assertFails(setDoc(doc(testEnv.unauthenticatedContext().firestore(), PATH), documentData()));
  });

  it('refuses unknown formats, extra fields and files over 50 MB', async () => {
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ format: 'exe' })));
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ shared: true })));
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ size: 52_428_801 })));
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ size: 0 })));
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ title: '' })));
  });

  it('refuses a storage path that points at another file or person', async () => {
    await assertFails(
      setDoc(doc(ownerDb(), PATH), documentData({ storagePath: `users/${OTHER_UID}/documents/${DOCUMENT_ID}/security-plus-notes.pdf` })),
    );
    await assertFails(
      setDoc(doc(ownerDb(), PATH), documentData({ storagePath: `users/${OWNER_UID}/documents/other/security-plus-notes.pdf` })),
    );
  });

  it('refuses a position with unknown keys and a progress over 100', async () => {
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ position: { page: 3, highlight: 'x' } })));
    await assertFails(setDoc(doc(ownerDb(), PATH), documentData({ progress: 120 })));
  });

  // ---------- Read and delete ----------

  it('lets only the owner read and delete', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(ownerDb(), PATH)));
    await assertFails(getDoc(doc(otherDb(), PATH)));
    await assertFails(deleteDoc(doc(otherDb(), PATH)));
    await assertSucceeds(deleteDoc(doc(ownerDb(), PATH)));
  });

  // ---------- Update ----------

  it('lets the owner rename and save the reading position', async () => {
    await seed();
    await assertSucceeds(updateDoc(doc(ownerDb(), PATH), { title: 'Renamed', updatedAt: serverTimestamp() }));
    await assertSucceeds(
      updateDoc(doc(ownerDb(), PATH), {
        position: { page: 12 },
        progress: 40,
        openedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('refuses changing the file, format or size after upload', async () => {
    await seed();
    await assertFails(updateDoc(doc(ownerDb(), PATH), { size: 10, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ownerDb(), PATH), { format: 'epub', updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(doc(ownerDb(), PATH), {
        fileName: 'other.pdf',
        storagePath: `users/${OWNER_UID}/documents/${DOCUMENT_ID}/other.pdf`,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('refuses another person updating the position', async () => {
    await seed();
    await assertFails(updateDoc(doc(otherDb(), PATH), { progress: 50, updatedAt: serverTimestamp() }));
  });
});
