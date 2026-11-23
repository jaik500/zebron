import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * My documents (users/{uid}/documents, firestore.rules): details of a
 * person's own files for the reader. Private to the owner; fields checked;
 * only the title, the reading position and (for a PDF saved with its form
 * filled in) the size change after upload.
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

  it('refuses changing the file or format after upload', async () => {
    await seed();
    await assertFails(updateDoc(doc(ownerDb(), PATH), { format: 'epub', updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(doc(ownerDb(), PATH), {
        fileName: 'other.pdf',
        storagePath: `users/${OWNER_UID}/documents/${DOCUMENT_ID}/other.pdf`,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('lets the owner save the new size of a PDF saved with its form filled in, but not of other formats', async () => {
    await seed();
    await assertSucceeds(updateDoc(doc(ownerDb(), PATH), { size: 2_450_000, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ownerDb(), PATH), { size: 52_428_801, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(otherDb(), PATH), { size: 10, updatedAt: serverTimestamp() }));

    const EPUB_PATH = `users/${OWNER_UID}/documents/doc-2`;
    await assertSucceeds(
      setDoc(
        doc(ownerDb(), EPUB_PATH),
        documentData({ format: 'epub', fileName: 'book.epub', contentType: 'application/epub+zip', storagePath: `users/${OWNER_UID}/documents/doc-2/book.epub` }),
      ),
    );
    await assertFails(updateDoc(doc(ownerDb(), EPUB_PATH), { size: 10, updatedAt: serverTimestamp() }));
  });

    it('refuses another person updating the position', async () => {
    await seed();
    await assertFails(updateDoc(doc(otherDb(), PATH), { progress: 50, updatedAt: serverTimestamp() }));
  });

  // ---------- Highlights and notes (users/{uid}/documentAnnotations) ----------

  const ANNOTATION_PATH = `users/${OWNER_UID}/documentAnnotations/a-1`;

  function annotationData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      kind: 'highlight',
      documentId: DOCUMENT_ID,
      documentTitle: 'Security+ study notes',
      blockIndex: 3,
      quote: 'least privilege',
      prefix: 'the principle of ',
      suffix: ' means',
      color: 'yellow',
      note: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  it('lets the owner save a highlight and a note', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData()));
    await assertSucceeds(
      setDoc(doc(ownerDb(), `users/${OWNER_UID}/documentAnnotations/a-2`), annotationData({ kind: 'note', color: null, note: 'Exam topic' })),
    );
  });

  it('keeps highlights private to the owner', async () => {
    await assertFails(setDoc(doc(otherDb(), ANNOTATION_PATH), annotationData()));
    await assertSucceeds(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData()));
    await assertFails(getDoc(doc(otherDb(), ANNOTATION_PATH)));
    await assertFails(deleteDoc(doc(otherDb(), ANNOTATION_PATH)));
    await assertSucceeds(getDoc(doc(ownerDb(), ANNOTATION_PATH)));
  });

  it('refuses a highlight without a colour, a note with one, empty quotes and unknown fields', async () => {
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ color: null })));
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ kind: 'note', color: 'pink' })));
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ color: 'orange' })));
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ quote: '' })));
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ shared: true })));
    await assertFails(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData({ blockIndex: -1 })));
  });

  it('lets the owner change only the colour and the note', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), ANNOTATION_PATH), annotationData()));
    await assertSucceeds(updateDoc(doc(ownerDb(), ANNOTATION_PATH), { color: 'pink', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(ownerDb(), ANNOTATION_PATH), { note: 'Review', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(ownerDb(), ANNOTATION_PATH), { kind: 'note', color: null, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ownerDb(), ANNOTATION_PATH), { quote: 'something else', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ownerDb(), ANNOTATION_PATH), { documentId: 'other', updatedAt: serverTimestamp() }));
  });

  // ---------- Quiz me on this chapter (documentQuizzes) ----------

  const QUIZ_PATH = (id: string) => `users/${OWNER_UID}/documentQuizzes/${id}`;

  async function seedQuizzes(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const question = { id: 'q1', question: 'What?', options: ['a', 'b', 'c', 'd'], answer: 2, explanation: '', topic: 'General' };
      await setDoc(doc(db, QUIZ_PATH('open-quiz')), { documentId: DOCUMENT_ID, status: 'open', questions: [question] });
      await setDoc(doc(db, QUIZ_PATH('graded-quiz')), { documentId: DOCUMENT_ID, status: 'graded', questions: [question], scorePercentage: 100 });
    });
  }

  it('shows the owner a quiz only once it is graded, so the answers stay hidden', async () => {
    await seedQuizzes();
    await assertSucceeds(getDoc(doc(ownerDb(), QUIZ_PATH('graded-quiz'))));
    await assertFails(getDoc(doc(ownerDb(), QUIZ_PATH('open-quiz'))));
    await assertSucceeds(getDocs(query(collection(ownerDb(), `users/${OWNER_UID}/documentQuizzes`), where('status', '==', 'graded'))));
    await assertFails(getDocs(collection(ownerDb(), `users/${OWNER_UID}/documentQuizzes`)));
  });

  it('keeps quizzes private and lets only Cloud Functions write them', async () => {
    await seedQuizzes();
    await assertFails(getDoc(doc(otherDb(), QUIZ_PATH('graded-quiz'))));
    await assertFails(setDoc(doc(ownerDb(), QUIZ_PATH('new-quiz')), { documentId: DOCUMENT_ID, status: 'graded', scorePercentage: 100 }));
    await assertFails(updateDoc(doc(ownerDb(), QUIZ_PATH('graded-quiz')), { scorePercentage: 100 }));
    await assertFails(deleteDoc(doc(ownerDb(), QUIZ_PATH('graded-quiz'))));
  });
});
