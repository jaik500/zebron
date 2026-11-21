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
 * Highlights, notes and lesson bookmarks (users/{uid}/courseAnnotations,
 * firestore.rules): private to the learner, fields and sizes checked.
 */
describe('Zebron Firestore Security Rules - course annotations', () => {
  let testEnv: RulesTestEnvironment;

  const LEARNER_UID = 'annotations-learner';
  const OTHER_UID = 'annotations-other';
  const PATH = `users/${LEARNER_UID}/courseAnnotations/highlight-1`;

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

  function highlight(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      kind: 'highlight',
      courseKey: 'org-1__course-1',
      courseId: 'course-1',
      organizationId: 'org-1',
      courseTitle: 'Course 1',
      lessonId: 'lesson-1',
      lessonTitle: 'Lesson 1',
      blockIndex: 2,
      quote: 'the shared responsibility model',
      prefix: 'AWS explains ',
      suffix: ' in its documentation',
      color: 'yellow',
      note: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  const learnerDb = () => testEnv.authenticatedContext(LEARNER_UID).firestore();
  const otherDb = () => testEnv.authenticatedContext(OTHER_UID).firestore();

  async function seed(): Promise<void> {
    await assertSucceeds(setDoc(doc(learnerDb(), PATH), highlight()));
  }

  // ---------- Create ----------

  it('lets a learner save a highlight in each of the four colours', async () => {
    for (const color of ['yellow', 'green', 'blue', 'pink']) {
      await assertSucceeds(
        setDoc(doc(learnerDb(), `users/${LEARNER_UID}/courseAnnotations/h-${color}`), highlight({ color })),
      );
    }
  });

  it('lets a learner save a note and a lesson bookmark, for Zebron and organization courses', async () => {
    await assertSucceeds(
      setDoc(
        doc(learnerDb(), `users/${LEARNER_UID}/courseAnnotations/note-1`),
        highlight({ kind: 'note', color: null, note: 'Ask about this in class' }),
      ),
    );
    await assertSucceeds(
      setDoc(
        doc(learnerDb(), `users/${LEARNER_UID}/courseAnnotations/bookmark__course-1__lesson-1`),
        highlight({
          kind: 'bookmark',
          courseKey: 'course-1',
          organizationId: null,
          blockIndex: -1,
          quote: '',
          prefix: '',
          suffix: '',
          color: null,
        }),
      ),
    );
  });

  it("denies writing into someone else's annotations, and signed-out writes", async () => {
    await assertFails(setDoc(doc(otherDb(), PATH), highlight()));
    await assertFails(setDoc(doc(testEnv.unauthenticatedContext().firestore(), PATH), highlight()));
  });

  it('denies unknown colours, highlights without text and colours on notes or bookmarks', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ color: 'red' })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ quote: '' })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ kind: 'note', color: 'yellow' })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ kind: 'bookmark', color: 'pink', quote: '' })));
  });

  it('denies extra fields and oversized text', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ shared: true })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ quote: 'x'.repeat(1001) })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ note: 'x'.repeat(2001) })));
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ prefix: 'x'.repeat(65) })));
  });

  it('denies made-up timestamps', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), highlight({ createdAt: new Date('2020-01-01') })));
  });

  // ---------- Read ----------

  it('lets only the learner read their annotations', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(learnerDb(), PATH)));
    await assertFails(getDoc(doc(otherDb(), PATH)));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), PATH)));
  });

  // ---------- Update ----------

  it('lets the learner change the colour and the note, and turn a highlight into a note', async () => {
    await seed();
    await assertSucceeds(updateDoc(doc(learnerDb(), PATH), { color: 'pink', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(learnerDb(), PATH), { note: 'Review before the exam', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(learnerDb(), PATH), { kind: 'note', color: null, updatedAt: serverTimestamp() }));
  });

  it('denies changing the quote, the lesson or the course, and turning a highlight into a bookmark', async () => {
    await seed();
    await assertFails(updateDoc(doc(learnerDb(), PATH), { quote: 'something else', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(learnerDb(), PATH), { lessonId: 'lesson-2', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(learnerDb(), PATH), { courseKey: 'course-9', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(learnerDb(), PATH), { kind: 'bookmark', color: null, updatedAt: serverTimestamp() }));
  });

  it("denies changing someone else's annotations", async () => {
    await seed();
    await assertFails(updateDoc(doc(otherDb(), PATH), { color: 'blue', updatedAt: serverTimestamp() }));
  });

  // ---------- Study preference (users/{uid}/preferences/study) ----------

  it('lets a learner turn the removal question off and on again', async () => {
    const ref = doc(learnerDb(), `users/${LEARNER_UID}/preferences/study`);
    await assertSucceeds(setDoc(ref, { confirmRemoveFromMyLearning: false, updatedAt: serverTimestamp() }));
    await assertSucceeds(setDoc(ref, { confirmRemoveFromMyLearning: true, updatedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(ref));
  });

  it('denies other fields, non-boolean values and other people on the study preference', async () => {
    const path = `users/${LEARNER_UID}/preferences/study`;
    await assertFails(setDoc(doc(learnerDb(), path), { confirmRemoveFromMyLearning: 'no', updatedAt: serverTimestamp() }));
    await assertFails(
      setDoc(doc(learnerDb(), path), { confirmRemoveFromMyLearning: false, theme: 'dark', updatedAt: serverTimestamp() }),
    );
    await assertFails(setDoc(doc(otherDb(), path), { confirmRemoveFromMyLearning: false, updatedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(otherDb(), path)));
  });

  it('still allows the notifications preference, and nothing else', async () => {
    await assertSucceeds(
      setDoc(doc(learnerDb(), `users/${LEARNER_UID}/preferences/notifications`), { learningEmails: false, updatedAt: serverTimestamp() }),
    );
    await assertFails(
      setDoc(doc(learnerDb(), `users/${LEARNER_UID}/preferences/notifications`), { confirmRemoveFromMyLearning: false, updatedAt: serverTimestamp() }),
    );
    await assertFails(
      setDoc(doc(learnerDb(), `users/${LEARNER_UID}/preferences/other`), { confirmRemoveFromMyLearning: false, updatedAt: serverTimestamp() }),
    );
  });

  // ---------- Delete ----------

  it('lets only the learner delete their annotations', async () => {
    await seed();
    await assertFails(deleteDoc(doc(otherDb(), PATH)));
    await assertSucceeds(deleteDoc(doc(learnerDb(), PATH)));
  });
});
