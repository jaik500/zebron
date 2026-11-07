import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Course progress (users/{uid}/courseProgress, firestore.rules):
 * - percent and status must follow from completedLessonIds and lessonCount;
 * - the legacy certificateCode field is gone (certificates come from exams);
 * - learners cannot delete their progress.
 */
describe('Zebron Firestore Security Rules - course progress', () => {
  let testEnv: RulesTestEnvironment;

  const LEARNER_UID = 'progress-learner';
  const OTHER_UID = 'progress-other';
  const PATH = `users/${LEARNER_UID}/courseProgress/course-1`;

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

  function record(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      userId: LEARNER_UID,
      courseId: 'course-1',
      organizationId: null,
      courseTitle: 'Course 1',
      cover: 'teal',
      lessonCount: 3,
      finalExam: false,
      completedLessonIds: ['a'],
      lastLessonId: 'a',
      percent: 33,
      status: 'in_progress',
      checkScores: {},
      activity: {},
      learnerName: 'Learner',
      skills: [],
      startedAt: serverTimestamp(),
      completedAt: null,
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  function learnerDb() {
    return testEnv.authenticatedContext(LEARNER_UID).firestore();
  }

  it('saves progress whose percent and status match the lessons done', async () => {
    await assertSucceeds(setDoc(doc(learnerDb(), PATH), record()));
    await assertSucceeds(setDoc(doc(learnerDb(), PATH), record({ completedLessonIds: ['a', 'b'], percent: 67 })));
    await assertSucceeds(
      setDoc(doc(learnerDb(), PATH), record({ completedLessonIds: ['a', 'b', 'c'], percent: 100, status: 'completed', completedAt: serverTimestamp() })),
    );
  });

  it('saves an empty course at 0 percent, in progress', async () => {
    await assertSucceeds(setDoc(doc(learnerDb(), PATH), record({ lessonCount: 0, completedLessonIds: [], percent: 0 })));
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ lessonCount: 0, completedLessonIds: [], percent: 0, status: 'completed' })));
  });

  it('rejects a percent that does not match the lessons done', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ percent: 100 })));
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ percent: 34 })));
  });

  it('rejects completed status before every lesson is done', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ status: 'completed' })));
  });

  it('rejects in-progress status when every lesson is done', async () => {
    await assertFails(
      setDoc(doc(learnerDb(), PATH), record({ completedLessonIds: ['a', 'b', 'c'], percent: 100, status: 'in_progress' })),
    );
  });

  it('rejects more lessons done than the course has', async () => {
    await assertFails(
      setDoc(doc(learnerDb(), PATH), record({ lessonCount: 1, completedLessonIds: ['a', 'b'], percent: 200, status: 'completed' })),
    );
  });

  it('rejects the retired certificateCode field', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ certificateCode: 'ABC-123' })));
    await assertFails(setDoc(doc(learnerDb(), PATH), record({ certificateCode: null })));
  });

  it('does not let a learner delete progress', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), record());
    });

    await assertFails(deleteDoc(doc(learnerDb(), PATH)));
  });

  it("does not let another user write the learner's progress", async () => {
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(setDoc(doc(otherDb, PATH), record()));
  });
});
