import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

import { readFileSync } from 'node:fs';

describe('QA Hub Firestore security rules', () => {
  let testEnv: RulesTestEnvironment;

  const adminId = 'qa-platform-admin';
  const testerId = 'qa-tester-1';
  const secondTesterId = 'qa-tester-2';
  const ordinaryUserId = 'qa-ordinary-user';

  const assignedTaskId = 'qa-task-assigned';
  const unassignedTaskId = 'qa-task-unassigned';
  const closedTaskId = 'qa-task-closed';

  const now = Timestamp.now();

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-qa-hub-rules',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  /**
   * Creates an administrator profile using Zebron's canonical
   * platformRole authorization convention.
   */
  async function seedPlatformAdmin(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, `users/${adminId}`), {
        id: adminId,
        platformRole: 'platform-admin',
      });
    });
  }

  /**
   * Creates an ordinary user profile.
   */
  async function seedOrdinaryUser(userId: string): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `users/${userId}`),
        {
          id: userId,
          platformRole: 'member',
        },
      );
    });
  }

  /**
   * Creates an administrator-managed QA tester record.
   */
  async function seedTester(
    userId: string,
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `qaTesters/${userId}`),
        {
          userId,
          active,
          createdAt: now,
        },
      );
    });
  }

  /**
   * Creates a QA task without evaluating security rules.
   */
  async function seedTask(
    taskId: string,
    assignedTesterIds: string[],
    status: 'open' | 'in_progress' | 'submitted' | 'closed' = 'open',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `qaTasks/${taskId}`),
        {
          title: `QA task ${taskId}`,
          description: 'Test task description',
          application: 'Zebron',
          instructions: 'Execute the assigned test scenario.',
          expectedResult: 'The operation succeeds.',
          assignedTesterIds,
          status,
          createdBy: adminId,
          createdAt: now,
          updatedAt: now,
        },
      );
    });
  }

  /**
   * Creates a QA submission without evaluating security rules.
   */
  async function seedSubmission(
    submissionId: string,
    taskId: string,
    submissionTesterId: string,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `qaSubmissions/${submissionId}`),
        {
          taskId,
          testerId: submissionTesterId,
          result: 'pass',
          feedback: 'Test completed successfully.',
          createdAt: now,
        },
      );
    });
  }

  /**
   * Returns a valid QA task payload for administrator creation.
   */
  function validTaskPayload(createdBy: string) {
    return {
      title: 'Verify QA Hub access',
      description: 'Validate QA task access.',
      application: 'Zebron',
      instructions: 'Open the assigned QA task.',
      expectedResult: 'The assigned task is accessible.',
      assignedTesterIds: [testerId],
      status: 'open',
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Returns a database instance authenticated as the specified user.
   */
  function authenticatedDb(userId: string) {
    return testEnv.authenticatedContext(userId).firestore();
  }

  /**
   * Establishes a standard QA test environment.
   */
  async function seedStandardScenario(): Promise<void> {
    await seedPlatformAdmin();

    await seedOrdinaryUser(ordinaryUserId);

    await seedTester(testerId, true);
    await seedTester(secondTesterId, true);

    await seedTask(assignedTaskId, [testerId]);
    await seedTask(unassignedTaskId, [secondTesterId]);
    await seedTask(closedTaskId, [testerId], 'closed');
  }

  // ============================================================
  // QA TESTER AUTHORIZATION
  // ============================================================

  describe('QA tester authorization', () => {
    it('allows a platform administrator to create a tester record', async () => {
      await seedPlatformAdmin();

      const db = authenticatedDb(adminId);

      await assertSucceeds(
        setDoc(doc(db, `qaTesters/${testerId}`), {
          userId: testerId,
          active: true,
          createdAt: now,
        }),
      );
    });

    it('denies an ordinary user from creating their own tester record', async () => {
      await seedOrdinaryUser(ordinaryUserId);

      const db = authenticatedDb(ordinaryUserId);

      await assertFails(
        setDoc(doc(db, `qaTesters/${ordinaryUserId}`), {
          userId: ordinaryUserId,
          active: true,
          createdAt: now,
        }),
      );
    });

    it('denies an ordinary user from activating another tester', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(ordinaryUserId);

      await assertFails(
        setDoc(
          doc(db, `qaTesters/${testerId}`),
          {
            userId: testerId,
            active: true,
          },
          { merge: true },
        ),
      );
    });

    it('allows an active tester to read their own tester record', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        getDoc(doc(db, `qaTesters/${testerId}`)),
      );
    });

    it('denies a tester from reading another tester record', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        getDoc(doc(db, `qaTesters/${secondTesterId}`)),
      );
    });

    it('denies an inactive tester from reading their own tester record', async () => {
      await seedPlatformAdmin();
      await seedTester(testerId, false);

      const db = authenticatedDb(testerId);

      await assertFails(
        getDoc(doc(db, `qaTesters/${testerId}`)),
      );
    });

    it('denies an ordinary user from listing QA testers', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(ordinaryUserId);

      await assertFails(
        getDocs(collection(db, 'qaTesters')),
      );
    });
  });

  // ============================================================
  // QA TASK AUTHORIZATION
  // ============================================================

  describe('QA task authorization', () => {
    it('allows a platform administrator to create a QA task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(adminId);

      await assertSucceeds(
        setDoc(
          doc(db, 'qaTasks/qa-task-created'),
          validTaskPayload(adminId),
        ),
      );
    });

    it('denies an ordinary user from creating a QA task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(ordinaryUserId);

      await assertFails(
        setDoc(
          doc(db, 'qaTasks/qa-task-forbidden'),
          validTaskPayload(ordinaryUserId),
        ),
      );
    });

    it('allows an active tester to read an assigned task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        getDoc(doc(db, `qaTasks/${assignedTaskId}`)),
      );
    });

    it('denies a tester from reading an unassigned task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        getDoc(doc(db, `qaTasks/${unassignedTaskId}`)),
      );
    });

    it('denies an inactive tester from reading an assigned task', async () => {
      await seedPlatformAdmin();
      await seedTester(testerId, false);
      await seedTask(assignedTaskId, [testerId]);

      const db = authenticatedDb(testerId);

      await assertFails(
        getDoc(doc(db, `qaTasks/${assignedTaskId}`)),
      );
    });

    it('allows a tester to query tasks assigned to them', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      const assignedTasksQuery = query(
        collection(db, 'qaTasks'),
        where('assignedTesterIds', 'array-contains', testerId),
      );

      const snapshot = await assertSucceeds(
        getDocs(assignedTasksQuery),
      );

      expect(snapshot.docs.map((item) => item.id)).toContain(
        assignedTaskId,
      );

      expect(snapshot.docs.map((item) => item.id)).not.toContain(
        unassignedTaskId,
      );
    });

    it('denies a tester from modifying a QA task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(
          doc(db, `qaTasks/${assignedTaskId}`),
          {
            title: 'Unauthorized task modification',
          },
          { merge: true },
        ),
      );
    });

    it('denies an ordinary user from deleting a QA task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(ordinaryUserId);

      await assertFails(
        deleteDoc(doc(db, `qaTasks/${assignedTaskId}`)),
      );
    });
  });

  // ============================================================
  // QA SUBMISSION AUTHORIZATION
  // ============================================================

  describe('QA submission authorization', () => {
    it('allows an active tester to submit a passing result for an assigned open task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        setDoc(doc(db, 'qaSubmissions/submission-pass'), {
          taskId: assignedTaskId,
          testerId,
          result: 'pass',
          feedback: 'The expected behavior was observed.',
          createdAt: now,
        }),
      );
    });

    it('allows an active tester to submit a failing result', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        setDoc(doc(db, 'qaSubmissions/submission-fail'), {
          taskId: assignedTaskId,
          testerId,
          result: 'fail',
          feedback: 'The application produced an unexpected result.',
          createdAt: now,
        }),
      );
    });

    it('allows an active tester to submit a blocked result', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        setDoc(doc(db, 'qaSubmissions/submission-blocked'), {
          taskId: assignedTaskId,
          testerId,
          result: 'blocked',
          feedback: 'Testing cannot continue because a dependency is unavailable.',
          createdAt: now,
        }),
      );
    });

    it('denies a tester from submitting results on behalf of another tester', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-impersonation'), {
          taskId: assignedTaskId,
          testerId: secondTesterId,
          result: 'pass',
          feedback: 'Attempted submission for another tester.',
          createdAt: now,
        }),
      );
    });

    it('denies a tester from submitting a result for an unassigned task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-unassigned'), {
          taskId: unassignedTaskId,
          testerId,
          result: 'pass',
          feedback: 'Attempted submission for an unassigned task.',
          createdAt: now,
        }),
      );
    });

    it('denies a tester from submitting a result for a closed task', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-closed'), {
          taskId: closedTaskId,
          testerId,
          result: 'pass',
          feedback: 'Attempted submission for a closed task.',
          createdAt: now,
        }),
      );
    });

    it('denies an inactive tester from submitting results', async () => {
      await seedPlatformAdmin();
      await seedTester(testerId, false);
      await seedTask(assignedTaskId, [testerId]);

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-inactive'), {
          taskId: assignedTaskId,
          testerId,
          result: 'pass',
          feedback: 'Attempted submission while inactive.',
          createdAt: now,
        }),
      );
    });

    it('denies submissions with unsupported result values', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-invalid-result'), {
          taskId: assignedTaskId,
          testerId,
          result: 'pending',
          feedback: 'Invalid result status.',
          createdAt: now,
        }),
      );
    });

    it('denies submissions with feedback exceeding 10000 characters', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-long-feedback'), {
          taskId: assignedTaskId,
          testerId,
          result: 'fail',
          feedback: 'x'.repeat(10001),
          createdAt: now,
        }),
      );
    });

    it('denies submissions containing unauthorized additional fields', async () => {
      await seedStandardScenario();

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(doc(db, 'qaSubmissions/submission-extra-fields'), {
          taskId: assignedTaskId,
          testerId,
          result: 'pass',
          feedback: 'Unexpected additional field.',
          createdAt: now,
          administratorApproved: true,
        }),
      );
    });

    it('allows a tester to read their own submission', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-own',
        assignedTaskId,
        testerId,
      );

      const db = authenticatedDb(testerId);

      await assertSucceeds(
        getDoc(doc(db, 'qaSubmissions/submission-own')),
      );
    });

    it('denies a tester from reading another tester submission', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-other',
        unassignedTaskId,
        secondTesterId,
      );

      const db = authenticatedDb(testerId);

      await assertFails(
        getDoc(doc(db, 'qaSubmissions/submission-other')),
      );
    });

    it('allows a tester to query their own submission history', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-history-own',
        assignedTaskId,
        testerId,
      );

      await seedSubmission(
        'submission-history-other',
        unassignedTaskId,
        secondTesterId,
      );

      const db = authenticatedDb(testerId);

      const submissionsQuery = query(
        collection(db, 'qaSubmissions'),
        where('testerId', '==', testerId),
      );

      const snapshot = await assertSucceeds(
        getDocs(submissionsQuery),
      );

      expect(snapshot.docs.map((item) => item.id)).toContain(
        'submission-history-own',
      );

      expect(snapshot.docs.map((item) => item.id)).not.toContain(
        'submission-history-other',
      );
    });

    it('denies a tester from modifying an existing submission', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-immutable',
        assignedTaskId,
        testerId,
      );

      const db = authenticatedDb(testerId);

      await assertFails(
        setDoc(
          doc(db, 'qaSubmissions/submission-immutable'),
          {
            result: 'pass',
          },
          { merge: true },
        ),
      );
    });

    it('denies a tester from deleting an existing submission', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-delete',
        assignedTaskId,
        testerId,
      );

      const db = authenticatedDb(testerId);

      await assertFails(
        deleteDoc(doc(db, 'qaSubmissions/submission-delete')),
      );
    });

    it('allows a platform administrator to review submissions', async () => {
      await seedStandardScenario();

      await seedSubmission(
        'submission-admin-review',
        assignedTaskId,
        testerId,
      );

      const db = authenticatedDb(adminId);

      await assertSucceeds(
        getDoc(doc(db, 'qaSubmissions/submission-admin-review')),
      );
    });
  });
});