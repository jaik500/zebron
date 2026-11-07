import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Test Center exams (firestore.rules):
 * - browsers save practice attempts and results only; exams are written by
 *   the server (functions/src/quiz-exams.ts, course-exams.ts);
 * - exam-only banks (quizzes.examOnly) are never readable by learners;
 * - learners read their own Zebron (platform) results.
 */
describe('Zebron Firestore Security Rules - Test Center exams', () => {
  let testEnv: RulesTestEnvironment;

  const ORGANIZATION_ID = 'org-exams';
  const MEMBER_UID = 'exam-member';
  const MANAGER_UID = 'exam-manager';
  const OTHER_UID = 'exam-other';

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

  // ==========================================================
  // HELPERS
  // ==========================================================

  async function seed(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, `organizations/${ORGANIZATION_ID}`), { name: 'Exams', status: 'active', active: true });
      await setDoc(doc(db, `organizations/${ORGANIZATION_ID}/applications/test-center`), { status: 'active' });

      for (const [userId, role] of [[MEMBER_UID, 'org_member'], [MANAGER_UID, 'org_manager']] as const) {
        await setDoc(doc(db, `organizationMemberships/${userId}_${ORGANIZATION_ID}`), {
          userId,
          organizationId: ORGANIZATION_ID,
          role,
          active: true,
        });
      }

      // Organization banks: one for practice, one exam-only.
      for (const [quizId, examOnly] of [['org-practice', false], ['org-exam', true]] as const) {
        await setDoc(doc(db, `quizzes/${quizId}`), {
          organizationId: ORGANIZATION_ID,
          scope: 'organization',
          accessType: 'organization-members',
          programId: 'program-1',
          name: quizId,
          active: true,
          examOnly,
        });
        await setDoc(doc(db, `quizQuestions/${quizId}-q1`), {
          organizationId: ORGANIZATION_ID,
          scope: 'organization',
          quizId,
          topicId: `${quizId}-topic`,
          question: 'What is 2 + 2?',
          type: 'multiple-choice',
          options: [{ id: 'a', text: '4' }, { id: 'b', text: '5' }],
          correctAnswer: 'a',
          status: 'published',
        });
      }

      // Zebron banks: one public practice bank, one exam-only.
      for (const [quizId, examOnly] of [['zebron-practice', false], ['zebron-exam', true]] as const) {
        await setDoc(doc(db, `quizzes/${quizId}`), {
          organizationId: null,
          scope: 'platform',
          accessType: 'public',
          name: quizId,
          active: true,
          examOnly,
        });
        await setDoc(doc(db, `quizTopics/${quizId}-topic`), {
          organizationId: null,
          scope: 'platform',
          quizId,
          name: 'Topic',
          active: true,
        });
        await setDoc(doc(db, `quizQuestions/${quizId}-q1`), {
          organizationId: null,
          scope: 'platform',
          quizId,
          topicId: `${quizId}-topic`,
          question: 'What is 3 + 3?',
          type: 'multiple-choice',
          options: [{ id: 'a', text: '6' }, { id: 'b', text: '7' }],
          correctAnswer: 'a',
          status: 'published',
        });
      }

      // A server-written exam result on Zebron's bank, for MEMBER_UID.
      await setDoc(doc(db, 'quizResults/platform-result'), {
        id: 'platform-result',
        organizationId: null,
        userId: MEMBER_UID,
        attemptId: 'platform-attempt',
        quizId: 'zebron-exam',
        mode: 'exam',
        scorePercentage: 80,
      });
    });
  }

  function db(uid: string) {
    return testEnv.authenticatedContext(uid).firestore();
  }

  function attempt(mode: 'practice' | 'exam', organizationId: string | null, quizId: string) {
    return {
      id: 'attempt-1',
      organizationId,
      userId: MEMBER_UID,
      quizId,
      topicIds: [],
      questionCount: 1,
      correctCount: 1,
      score: 100,
      mode,
      scope: organizationId ? 'organization' : 'platform',
      quizName: quizId,
      startedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    };
  }

  // ==========================================================
  // RESULTS FROM THE BROWSER
  // ==========================================================

  it('lets learners save practice attempts', async () => {
    await seed();

    await assertSucceeds(
      setDoc(doc(db(MEMBER_UID), 'quizAttempts/attempt-1'), attempt('practice', ORGANIZATION_ID, 'org-practice')),
    );
  });

  it('refuses exam attempts and results written by the browser', async () => {
    await seed();

    await assertFails(
      setDoc(doc(db(MEMBER_UID), 'quizAttempts/attempt-1'), attempt('exam', ORGANIZATION_ID, 'org-practice')),
    );
    await assertFails(
      setDoc(doc(db(MEMBER_UID), 'quizResults/result-1'), {
        id: 'result-1',
        organizationId: ORGANIZATION_ID,
        userId: MEMBER_UID,
        attemptId: 'attempt-1',
        quizId: 'org-practice',
        mode: 'exam',
        scorePercentage: 100,
      }),
    );
    await assertFails(
      setDoc(doc(db(MEMBER_UID), 'quizAttempts/attempt-2'), attempt('exam', null, 'zebron-practice')),
    );
  });

  // ==========================================================
  // EXAM-ONLY BANKS
  // ==========================================================

  it('lets members read practice questions but not exam-only ones', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(MEMBER_UID), 'quizQuestions/org-practice-q1')));
    await assertFails(getDoc(doc(db(MEMBER_UID), 'quizQuestions/org-exam-q1')));
  });

  it('lets Test Center managers read exam-only questions', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(MANAGER_UID), 'quizQuestions/org-exam-q1')));
  });

  it("hides Zebron's exam-only questions from everyone signed in", async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(OTHER_UID), 'quizQuestions/zebron-practice-q1')));
    await assertFails(getDoc(doc(db(OTHER_UID), 'quizQuestions/zebron-exam-q1')));
  });

  // ==========================================================
  // ZEBRON RESULTS
  // ==========================================================

  it('lets learners read their own Zebron results, not other people’s', async () => {
    await seed();

    await assertSucceeds(getDoc(doc(db(MEMBER_UID), 'quizResults/platform-result')));
    await assertFails(getDoc(doc(db(OTHER_UID), 'quizResults/platform-result')));
  });
});
