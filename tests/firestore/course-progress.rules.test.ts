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
 * Course progress (users/{uid}/courseProgress, firestore.rules):
 * - written only by completeCourseLesson (functions/src/course-progress.ts);
 * - learners read their own, cannot write or delete it.
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

  it('lets the learner read their own progress', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), record());
    });

    await assertSucceeds(getDoc(doc(learnerDb(), PATH)));
  });

  it('does not let another user read the learner\'s progress', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), record());
    });

    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(getDoc(doc(otherDb, PATH)));
  });

  it('does not let the learner write progress, even a consistent record', async () => {
    await assertFails(setDoc(doc(learnerDb(), PATH), record()));
    await assertFails(
      setDoc(doc(learnerDb(), PATH), record({ completedLessonIds: ['a', 'b', 'c'], percent: 100, status: 'completed' })),
    );
  });

  it('does not let the learner change or delete existing progress', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), PATH), record());
    });

    await assertFails(updateDoc(doc(learnerDb(), PATH), { percent: 100, status: 'completed' }));
    await assertFails(deleteDoc(doc(learnerDb(), PATH)));
  });
});
