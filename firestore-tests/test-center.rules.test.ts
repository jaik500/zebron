import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
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
  updateDoc,
  where,
} from 'firebase/firestore';

import fs from 'node:fs';

describe('Zebron Firestore Security Rules - Test Center', () => {
  let testEnv: RulesTestEnvironment;

  const ORG_A = 'organization-a';
  const ORG_B = 'organization-b';

  const USER_A = 'user-a';
  const USER_B = 'user-b';
  const ADMIN_A = 'admin-a';
  const ADMIN_B = 'admin-b';
  const PLATFORM_ADMIN = 'platform-admin';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-test-center-rules',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync(
          'firestore.rules',
          'utf8',
        ),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seedUser(
    userId: string,
    role: 'user' | 'admin' = 'user',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `users/${userId}`,
          ),
          {
            id: userId,
            email: `${userId}@example.com`,
            displayName: userId,
            role,
          },
        );
      },
    );
  }

  async function seedMembership(
    userId: string,
    organizationId: string,
    role:
      | 'owner'
      | 'admin'
      | 'manager'
      | 'member' = 'member',
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `organizationMemberships/${userId}_${organizationId}`,
          ),
          {
            userId,
            organizationId,
            role,
            active,
          },
        );
      },
    );
  }

  async function seedCourse(
    courseId: string,
    organizationId: string,
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `testCourses/${courseId}`,
          ),
          {
            organizationId,
            name: `Course ${courseId}`,
            slug: courseId,
            description: `Course ${courseId}`,
            type: 'course',
            active,
            questionCount: 0,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        );
      },
    );
  }

  async function seedTopic(
    topicId: string,
    organizationId: string,
    courseId: string,
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `testTopics/${topicId}`,
          ),
          {
            organizationId,
            courseId,
            name: `Topic ${topicId}`,
            slug: topicId,
            description: `Topic ${topicId}`,
            sortOrder: 1,
            questionCount: 0,
            active,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        );
      },
    );
  }

  async function seedQuestion(
    questionId: string,
    organizationId: string,
    courseId: string,
    topicId: string,
    status: 'draft' | 'published' | 'archived' = 'published',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `testQuestions/${questionId}`,
          ),
          {
            organizationId,
            courseId,
            topicId,
            question: `Question ${questionId}`,
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'Answer A' },
              { id: 'b', text: 'Answer B' },
            ],
            correctAnswer: 'a',
            explanation: 'Explanation',
            hint: 'Hint',
            difficulty: 'medium',
            tags: ['test'],
            sourceType: 'original',
            status,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        );
      },
    );
  }

  async function seedAttempt(
    attemptId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `testAttempts/${attemptId}`,
          ),
          {
            organizationId,
            userId,
            courseId: 'course-a',
            topicIds: ['topic-a'],
            questionCount: 10,
            correctCount: 8,
            score: 80,
            mode: 'practice',
            startedAt: '2026-09-22T00:00:00.000Z',
            completedAt: '2026-09-22T00:30:00.000Z',
          },
        );
      },
    );
  }

  async function seedResult(
    resultId: string,
    organizationId: string,
    userId: string,
    attemptId = 'attempt-a',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `testResults/${resultId}`,
          ),
          {
            organizationId,
            userId,
            attemptId,
            courseId: 'course-a',
            courseName: 'Course A',
            totalQuestions: 10,
            answeredQuestions: 10,
            correctAnswers: 8,
            incorrectAnswers: 2,
            unansweredQuestions: 0,
            scorePercentage: 80,
            mode: 'practice',
            difficulty: 'medium',
            topicPerformance: [],
            questionResults: [],
            completedAt: '2026-09-22T00:30:00.000Z',
          },
        );
      },
    );
  }

  async function seedOrganizationAUsers(): Promise<void> {
    await seedUser(USER_A);
    await seedUser(ADMIN_A);
    await seedMembership(USER_A, ORG_A, 'member');
    await seedMembership(ADMIN_A, ORG_A, 'admin');
  }

  async function seedOrganizationBUsers(): Promise<void> {
    await seedUser(USER_B);
    await seedUser(ADMIN_B);
    await seedMembership(USER_B, ORG_B, 'member');
    await seedMembership(ADMIN_B, ORG_B, 'admin');
  }

  describe('courses', () => {
    it('allows an organization member to read an active course in their organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testCourses/course-a'),
        ),
      );
    });

    it('denies an organization member from reading a course in another organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-b', ORG_B);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testCourses/course-b'),
        ),
      );
    });

    it('allows an organization admin to create a course in their organization', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        setDoc(
          doc(db, 'testCourses/course-new'),
          {
            organizationId: ORG_A,
            name: 'New Course',
            slug: 'new-course',
            description: 'New course',
            type: 'course',
            active: true,
            questionCount: 0,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies an organization admin from creating a course for another organization', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testCourses/course-b'),
          {
            organizationId: ORG_B,
            name: 'Organization B Course',
            slug: 'organization-b-course',
            description: 'Organization B course',
            type: 'course',
            active: true,
            questionCount: 0,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('prevents an organization admin from moving a course to another organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testCourses/course-a'),
          {
            organizationId: ORG_B,
          },
        ),
      );
    });

    it('denies a regular member from deleting a course', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        deleteDoc(
          doc(db, 'testCourses/course-a'),
        ),
      );
    });

    it('denies an unscoped course query that could cross organizations', async () => {
      await seedOrganizationAUsers();
      await seedOrganizationBUsers();
      await seedCourse('course-a', ORG_A);
      await seedCourse('course-b', ORG_B);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDocs(
          query(
            collection(db, 'testCourses'),
            where('active', '==', true),
          ),
        ),
      );
    });
  });

  describe('topics', () => {
    it('allows a member to read an active topic in their organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);
      await seedTopic('topic-a', ORG_A, 'course-a');

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testTopics/topic-a'),
        ),
      );
    });

    it('denies a member from reading a topic in another organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-b', ORG_B);
      await seedTopic('topic-b', ORG_B, 'course-b');

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testTopics/topic-b'),
        ),
      );
    });

    it('allows an organization admin to create a topic in their organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        setDoc(
          doc(db, 'testTopics/topic-new'),
          {
            organizationId: ORG_A,
            courseId: 'course-a',
            name: 'New Topic',
            slug: 'new-topic',
            description: 'New topic',
            sortOrder: 1,
            questionCount: 0,
            active: true,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies an organization admin from creating a topic under another organization course', async () => {
      await seedOrganizationAUsers();
      await seedOrganizationBUsers();
      await seedCourse('course-b', ORG_B);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testTopics/topic-cross-org'),
          {
            organizationId: ORG_A,
            courseId: 'course-b',
            name: 'Cross Organization Topic',
            slug: 'cross-organization-topic',
            description: 'Invalid cross-organization topic',
            sortOrder: 1,
            questionCount: 0,
            active: true,
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('prevents moving a topic between organizations', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);
      await seedTopic('topic-a', ORG_A, 'course-a');

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testTopics/topic-a'),
          {
            organizationId: ORG_B,
          },
        ),
      );
    });

    it('prevents moving a topic to another course', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);
      await seedCourse('course-b', ORG_A);
      await seedTopic('topic-a', ORG_A, 'course-a');

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testTopics/topic-a'),
          {
            courseId: 'course-b',
          },
        ),
      );
    });
  });

  describe('questions', () => {
    it('allows a member to read a published question in their organization', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-a',
        ORG_A,
        'course-a',
        'topic-a',
        'published',
      );

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testQuestions/question-a'),
        ),
      );
    });

    it('denies a member from reading a question in another organization', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-b',
        ORG_B,
        'course-b',
        'topic-b',
        'published',
      );

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testQuestions/question-b'),
        ),
      );
    });

    it('denies a member from reading a draft question', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-draft',
        ORG_A,
        'course-a',
        'topic-a',
        'draft',
      );

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testQuestions/question-draft'),
        ),
      );
    });

    it('allows an organization admin to read a draft question', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-draft',
        ORG_A,
        'course-a',
        'topic-a',
        'draft',
      );

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testQuestions/question-draft'),
        ),
      );
    });

    it('allows an organization admin to create a question in their organization', async () => {
      await seedOrganizationAUsers();
      await seedCourse('course-a', ORG_A);
      await seedTopic('topic-a', ORG_A, 'course-a');

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        setDoc(
          doc(db, 'testQuestions/question-new'),
          {
            organizationId: ORG_A,
            courseId: 'course-a',
            topicId: 'topic-a',
            question: 'New question',
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'A' },
              { id: 'b', text: 'B' },
            ],
            correctAnswer: 'a',
            difficulty: 'medium',
            tags: [],
            sourceType: 'original',
            status: 'draft',
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies a regular member from creating a question', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testQuestions/question-new'),
          {
            organizationId: ORG_A,
            courseId: 'course-a',
            topicId: 'topic-a',
            question: 'New question',
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'A' },
              { id: 'b', text: 'B' },
            ],
            correctAnswer: 'a',
            difficulty: 'medium',
            tags: [],
            sourceType: 'original',
            status: 'draft',
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies an organization admin from creating a question under another organization course', async () => {
      await seedOrganizationAUsers();
      await seedOrganizationBUsers();
      await seedCourse('course-b', ORG_B);
      await seedTopic('topic-b', ORG_B, 'course-b');

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testQuestions/question-cross-org'),
          {
            organizationId: ORG_A,
            courseId: 'course-b',
            topicId: 'topic-b',
            question: 'Cross organization question',
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'A' },
              { id: 'b', text: 'B' },
            ],
            correctAnswer: 'a',
            difficulty: 'medium',
            tags: [],
            sourceType: 'original',
            status: 'draft',
            createdAt: '2026-09-22T00:00:00.000Z',
            updatedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('prevents an organization admin from moving a question to another organization', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-a',
        ORG_A,
        'course-a',
        'topic-a',
        'draft',
      );

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testQuestions/question-a'),
          {
            organizationId: ORG_B,
          },
        ),
      );
    });

    it('prevents an organization admin from moving a question to another course', async () => {
      await seedOrganizationAUsers();
      await seedQuestion(
        'question-a',
        ORG_A,
        'course-a',
        'topic-a',
        'draft',
      );

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testQuestions/question-a'),
          {
            courseId: 'course-b',
          },
        ),
      );
    });
  });

  describe('attempts', () => {
    it('allows a user to read their own attempt', async () => {
      await seedOrganizationAUsers();
      await seedAttempt('attempt-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testAttempts/attempt-a'),
        ),
      );
    });

    it('denies a user from reading another user attempt', async () => {
      await seedOrganizationAUsers();
      await seedAttempt('attempt-b', ORG_A, USER_B);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testAttempts/attempt-b'),
        ),
      );
    });

    it('denies a user from reading an attempt in another organization', async () => {
      await seedOrganizationAUsers();
      await seedOrganizationBUsers();
      await seedAttempt('attempt-b', ORG_B, USER_B);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testAttempts/attempt-b'),
        ),
      );
    });

    it('allows a user to create an attempt for themselves in their organization', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        setDoc(
          doc(db, 'testAttempts/attempt-new'),
          {
            organizationId: ORG_A,
            userId: USER_A,
            courseId: 'course-a',
            topicIds: ['topic-a'],
            questionCount: 10,
            correctCount: 0,
            score: 0,
            mode: 'practice',
            startedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies a user from creating an attempt for another user', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testAttempts/attempt-new'),
          {
            organizationId: ORG_A,
            userId: USER_B,
            courseId: 'course-a',
            topicIds: ['topic-a'],
            questionCount: 10,
            correctCount: 0,
            score: 0,
            mode: 'practice',
            startedAt: '2026-09-22T00:00:00.000Z',
          },
        ),
      );
    });

    it('allows an organization admin to read an attempt in their organization', async () => {
      await seedOrganizationAUsers();
      await seedAttempt('attempt-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testAttempts/attempt-a'),
        ),
      );
    });

    it('prevents an organization admin from moving an attempt to another organization', async () => {
      await seedOrganizationAUsers();
      await seedAttempt('attempt-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testAttempts/attempt-a'),
          {
            organizationId: ORG_B,
          },
        ),
      );
    });
  });

  describe('results', () => {
    it('allows a user to read their own result', async () => {
      await seedOrganizationAUsers();
      await seedResult('result-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testResults/result-a'),
        ),
      );
    });

    it('denies a user from reading another user result', async () => {
      await seedOrganizationAUsers();
      await seedResult('result-b', ORG_A, USER_B);

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testResults/result-b'),
        ),
      );
    });

    it('denies a user from reading a result in another organization', async () => {
      await seedOrganizationAUsers();
      await seedOrganizationBUsers();
      await seedResult(
        'result-b',
        ORG_B,
        USER_B,
      );

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testResults/result-b'),
        ),
      );
    });

    it('allows a user to create their own result in their organization', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertSucceeds(
        setDoc(
          doc(db, 'testResults/result-new'),
          {
            organizationId: ORG_A,
            userId: USER_A,
            attemptId: 'attempt-a',
            courseId: 'course-a',
            courseName: 'Course A',
            totalQuestions: 10,
            answeredQuestions: 10,
            correctAnswers: 8,
            incorrectAnswers: 2,
            unansweredQuestions: 0,
            scorePercentage: 80,
            mode: 'practice',
            difficulty: 'medium',
            topicPerformance: [],
            questionResults: [],
            completedAt: '2026-09-22T00:30:00.000Z',
          },
        ),
      );
    });

    it('denies a user from creating a result for another user', async () => {
      await seedOrganizationAUsers();

      const db = testEnv
        .authenticatedContext(USER_A)
        .firestore();

      await assertFails(
        setDoc(
          doc(db, 'testResults/result-new'),
          {
            organizationId: ORG_A,
            userId: USER_B,
            attemptId: 'attempt-a',
            courseId: 'course-a',
            courseName: 'Course A',
            totalQuestions: 10,
            answeredQuestions: 10,
            correctAnswers: 8,
            incorrectAnswers: 2,
            unansweredQuestions: 0,
            scorePercentage: 80,
            mode: 'practice',
            difficulty: 'medium',
            topicPerformance: [],
            questionResults: [],
            completedAt: '2026-09-22T00:30:00.000Z',
          },
        ),
      );
    });

    it('allows an organization admin to read a result in their organization', async () => {
      await seedOrganizationAUsers();
      await seedResult('result-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertSucceeds(
        getDoc(
          doc(db, 'testResults/result-a'),
        ),
      );
    });

    it('prevents an organization admin from moving a result to another organization', async () => {
      await seedOrganizationAUsers();
      await seedResult('result-a', ORG_A, USER_A);

      const db = testEnv
        .authenticatedContext(ADMIN_A)
        .firestore();

      await assertFails(
        updateDoc(
          doc(db, 'testResults/result-a'),
          {
            organizationId: ORG_B,
          },
        ),
      );
    });
  });

  describe('unauthenticated access', () => {
    it('denies unauthenticated access to Test Center courses', async () => {
      await seedCourse('course-a', ORG_A);

      const db = testEnv
        .unauthenticatedContext()
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testCourses/course-a'),
        ),
      );
    });

    it('denies unauthenticated access to Test Center questions', async () => {
      await seedQuestion(
        'question-a',
        ORG_A,
        'course-a',
        'topic-a',
        'published',
      );

      const db = testEnv
        .unauthenticatedContext()
        .firestore();

      await assertFails(
        getDoc(
          doc(db, 'testQuestions/question-a'),
        ),
      );
    });
  });
});
