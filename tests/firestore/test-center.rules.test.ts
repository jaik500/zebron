import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
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
  updateDoc,
  where,
} from 'firebase/firestore';

import { readFileSync } from 'node:fs';

// ============================================================================
// TEST ENVIRONMENT
// ============================================================================

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'zebron-test-center-rules';

const ORG_A = 'organization-a';
const ORG_B = 'organization-b';

const USER_A = 'user-a';
const USER_B = 'user-b';

const ADMIN_A = 'admin-a';
const ADMIN_B = 'admin-b';

const PLATFORM_ADMIN = 'platform-admin';

const OUTSIDER = 'outsider';

const PROGRAM_A = 'program-a';
const PROGRAM_B = 'program-b';

const COURSE_A = 'course-a';
const COURSE_B = 'course-b';

const TOPIC_A = 'topic-a';
const TOPIC_B = 'topic-b';

const QUESTION_A = 'question-a';
const QUESTION_B = 'question-b';

const TEST_DATE = '2026-09-22T00:00:00.000Z';

// ============================================================================
// TEST DATA HELPERS
// ============================================================================

async function seedUser(
  userId: string,
  role?: string,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(
    async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `users/${userId}`,
        ),
        {
          uid: userId,
          role: role ?? 'user',
        },
      );
    },
  );
}

async function seedOrganization(
  organizationId: string,
  name: string,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(
    async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `organizations/${organizationId}`,
        ),
        {
          id: organizationId,
          name,
          active: true,
        },
      );
    },
  );
}

async function seedMembership(
  userId: string,
  organizationId: string,
  role:
    | 'org_owner'
    | 'org_admin'
    | 'org_manager'
    | 'org_staff'
    | 'org_member',
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
          id: `${userId}_${organizationId}`,
          userId,
          organizationId,
          role,
          active,
        },
      );
    },
  );
}

async function seedProgram(
  programId: string,
  organizationId: string,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(
    async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `testPrograms/${programId}`,
        ),
        {
          organizationId,

          name: `Program ${programId}`,
          slug: programId,
          description: `Program ${programId}`,

          courseCount: 0,
          active: true,

          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
        },
      );
    },
  );
}

/**
 * Organization courses MUST reference an existing program belonging
 * to the same organization.
 *
 * The mapping keeps existing tests concise:
 *
 * organization-a -> program-a
 * organization-b -> program-b
 */
async function seedCourse(
  courseId: string,
  organizationId: string,
  active = true,
  programId?: string,
): Promise<void> {
  const resolvedProgramId =
    programId ??
    (
      organizationId === ORG_A
        ? PROGRAM_A
        : PROGRAM_B
    );

  await testEnv.withSecurityRulesDisabled(
    async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `testCourses/${courseId}`,
        ),
        {
          organizationId,
          programId: resolvedProgramId,

          scope: 'organization',
          accessType: 'organization-members',

          name: `Course ${courseId}`,
          slug: courseId,
          description: `Course ${courseId}`,

          type: 'course',

          active,
          questionCount: 0,

          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
        },
      );
    },
  );
}

async function seedPlatformCourse(
  courseId: string,
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
          organizationId: null,

          scope: 'platform',
          accessType: 'public',

          name: `Platform Course ${courseId}`,
          slug: courseId,
          description: `Platform course ${courseId}`,

          type: 'course',

          active,
          questionCount: 0,

          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
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

          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
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
  status:
    | 'draft'
    | 'published'
    | 'archived' = 'published',
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
            {
              id: 'a',
              text: 'Answer A',
            },
            {
              id: 'b',
              text: 'Answer B',
            },
          ],

          correctAnswer: 'a',

          explanation: 'Explanation',
          hint: 'Hint',

          difficulty: 'medium',

          tags: [
            'test',
          ],

          sourceType: 'original',

          status,

          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
        },
      );
    },
  );
}

async function seedAttempt(
  attemptId: string,
  organizationId: string,
  userId: string,
  courseId = COURSE_A,
  topicIds: string[] = [TOPIC_A],
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

          courseId,
          topicIds,

          questionCount: 10,
          correctCount: 8,
          score: 80,

          mode: 'practice',

          startedAt: TEST_DATE,

          completedAt:
            '2026-09-22T00:30:00.000Z',
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
  courseId = COURSE_A,
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

          courseId,
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

          completedAt:
            '2026-09-22T00:30:00.000Z',
        },
      );
    },
  );
}

// ============================================================================
// COMMON USER SETUP
// ============================================================================

async function seedOrganizationAUsers(): Promise<void> {
  await seedUser(USER_A);

  await seedUser(ADMIN_A);

  await seedMembership(
    USER_A,
    ORG_A,
    'org_member',
  );

  await seedMembership(
    ADMIN_A,
    ORG_A,
    'org_admin',
  );
}

async function seedOrganizationBUsers(): Promise<void> {
  await seedUser(USER_B);

  await seedUser(ADMIN_B);

  await seedMembership(
    USER_B,
    ORG_B,
    'org_member',
  );

  await seedMembership(
    ADMIN_B,
    ORG_B,
    'org_admin',
  );
}

async function seedPlatformAdministrator(): Promise<void> {
  await seedUser(
    PLATFORM_ADMIN,
    'admin',
  );
}

// ============================================================================
// TEST ENVIRONMENT
// ============================================================================

beforeAll(async () => {
  testEnv =
    await initializeTestEnvironment({
      projectId: PROJECT_ID,

      firestore: {
        host: '127.0.0.1',
        port: 8080,

        rules: readFileSync(
          'firestore.rules',
          'utf8',
        ),
      },
    });
});

// ============================================================================
// TEST DATA
// ============================================================================

beforeEach(async () => {
  await seedOrganization(
    ORG_A,
    'Organization A',
  );

  await seedOrganization(
    ORG_B,
    'Organization B',
  );

  await seedProgram(
    PROGRAM_A,
    ORG_A,
  );

  await seedProgram(
    PROGRAM_B,
    ORG_B,
  );

  await seedPlatformAdministrator();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

// ============================================================================
// COURSES
// ============================================================================

describe(
  'Zebron Firestore Security Rules - Test Center',
  () => {

    describe(
      'courses',
      () => {

        it(
          'allows an organization member to read an active course in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  `testCourses/${COURSE_A}`,
                ),
              ),
            );
          },
        );

        it(
          'denies an organization member from reading a course in another organization',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedCourse(
              COURSE_B,
              ORG_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  `testCourses/${COURSE_B}`,
                ),
              ),
            );
          },
        );

        it(
          'denies an authenticated user without organization membership from reading an organization course',
          async () => {
            await seedUser(USER_A);

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  `testCourses/${COURSE_A}`,
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to create a course in their organization',
          async () => {
            await seedOrganizationAUsers();

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              setDoc(
                doc(
                  db,
                  'testCourses/course-new',
                ),
                {
                  organizationId: ORG_A,

                  // Required by the current
                  // Firestore course rule.
                  programId: PROGRAM_A,

                  scope: 'organization',
                  accessType:
                    'organization-members',

                  name: 'New Course',
                  slug: 'new-course',
                  description: 'New course',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies an organization admin from creating a course for another organization',
          async () => {
            await seedOrganizationAUsers();

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testCourses/course-b',
                ),
                {
                  organizationId: ORG_B,

                  programId: PROGRAM_B,

                  scope: 'organization',
                  accessType:
                    'organization-members',

                  name:
                    'Organization B Course',

                  slug:
                    'organization-b-course',

                  description:
                    'Organization B course',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies an organization admin from creating a course without a program',
          async () => {
            await seedOrganizationAUsers();

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testCourses/course-no-program',
                ),
                {
                  organizationId: ORG_A,

                  programId: '',

                  scope: 'organization',
                  accessType:
                    'organization-members',

                  name: 'Invalid Course',
                  slug: 'invalid-course',

                  description:
                    'Missing program',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies an organization admin from creating a course using another organization program',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testCourses/cross-org-program',
                ),
                {
                  organizationId: ORG_A,

                  programId: PROGRAM_B,

                  scope: 'organization',
                  accessType:
                    'organization-members',

                  name:
                    'Cross Organization Course',

                  slug:
                    'cross-organization-course',

                  description:
                    'Invalid program relationship',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'prevents an organization admin from moving a course to another organization',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              updateDoc(
                doc(
                  db,
                  `testCourses/${COURSE_A}`,
                ),
                {
                  organizationId: ORG_B,
                },
              ),
            );
          },
        );

        it(
          'denies a regular member from deleting a course',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              deleteDoc(
                doc(
                  db,
                  `testCourses/${COURSE_A}`,
                ),
              ),
            );
          },
        );

        it(
          'denies an unscoped course query that could cross organizations',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            await seedCourse(
              COURSE_B,
              ORG_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDocs(
                query(
                  collection(
                    db,
                    'testCourses',
                  ),
                  where(
                    'active',
                    '==',
                    true,
                  ),
                ),
              ),
            );
          },
        );

        // ----------------------------------------------------------
        // PLATFORM COURSES
        // ----------------------------------------------------------

        it(
          'allows an authenticated user without an organization to read an active platform course',
          async () => {
            await seedUser(USER_A);

            await seedPlatformCourse(
              'platform-course-a',
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testCourses/platform-course-a',
                ),
              ),
            );
          },
        );

        it(
          'allows an authenticated organization member to read an active platform course',
          async () => {
            await seedOrganizationAUsers();

            await seedPlatformCourse(
              'platform-course-a',
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testCourses/platform-course-a',
                ),
              ),
            );
          },
        );

        it(
          'denies an unauthenticated user from reading a platform course',
          async () => {
            await seedPlatformCourse(
              'platform-course-a',
            );

            const db =
              testEnv
                .unauthenticatedContext()
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testCourses/platform-course-a',
                ),
              ),
            );
          },
        );

        it(
          'denies an authenticated user from reading an inactive platform course',
          async () => {
            await seedUser(USER_A);

            await seedPlatformCourse(
              'platform-course-inactive',
              false,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testCourses/platform-course-inactive',
                ),
              ),
            );
          },
        );

        it(
          'allows a constrained platform course query without organization membership',
          async () => {
            await seedUser(USER_A);

            await seedPlatformCourse(
              'platform-course-a',
            );

            await seedPlatformCourse(
              'platform-course-inactive',
              false,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            const platformQuery =
              query(
                collection(
                  db,
                  'testCourses',
                ),
                where(
                  'scope',
                  '==',
                  'platform',
                ),
                where(
                  'accessType',
                  '==',
                  'public',
                ),
                where(
                  'active',
                  '==',
                  true,
                ),
              );

            await assertSucceeds(
              getDocs(platformQuery),
            );
          },
        );

        it(
          'denies an organization admin from creating a platform course',
          async () => {
            await seedOrganizationAUsers();

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testCourses/platform-course-new',
                ),
                {
                  organizationId: null,

                  scope: 'platform',
                  accessType: 'public',

                  name: 'Platform Course',
                  slug: 'platform-course-new',

                  description:
                    'Platform course',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'allows a platform administrator to create a platform course',
          async () => {
            const db =
              testEnv
                .authenticatedContext(
                  PLATFORM_ADMIN,
                )
                .firestore();

            await assertSucceeds(
              setDoc(
                doc(
                  db,
                  'testCourses/platform-course-new',
                ),
                {
                  organizationId: null,

                  scope: 'platform',
                  accessType: 'public',

                  name: 'Platform Course',
                  slug: 'platform-course-new',

                  description:
                    'Platform course',

                  type: 'course',

                  active: true,
                  questionCount: 0,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );
      },
    );

    // ========================================================================
    // TOPICS
    // ========================================================================

    describe(
      'topics',
      () => {

        it(
          'allows a member to read an active topic in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            await seedTopic(
              TOPIC_A,
              ORG_A,
              COURSE_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  `testTopics/${TOPIC_A}`,
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading a topic in another organization',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedCourse(
              COURSE_B,
              ORG_B,
            );

            await seedTopic(
              TOPIC_B,
              ORG_B,
              COURSE_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  `testTopics/${TOPIC_B}`,
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to create a topic in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              setDoc(
                doc(
                  db,
                  'testTopics/topic-new',
                ),
                {
                  organizationId: ORG_A,
                  courseId: COURSE_A,

                  name: 'New Topic',
                  slug: 'new-topic',
                  description: 'New topic',

                  sortOrder: 1,
                  questionCount: 0,

                  active: true,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies an organization admin from creating a topic under another organization course',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedCourse(
              COURSE_B,
              ORG_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testTopics/topic-cross-org',
                ),
                {
                  organizationId: ORG_A,
                  courseId: COURSE_B,

                  name:
                    'Cross Organization Topic',

                  slug:
                    'cross-organization-topic',

                  description:
                    'Invalid cross-organization topic',

                  sortOrder: 1,
                  questionCount: 0,

                  active: true,

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'prevents moving a topic between organizations',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            await seedTopic(
              TOPIC_A,
              ORG_A,
              COURSE_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              updateDoc(
                doc(
                  db,
                  `testTopics/${TOPIC_A}`,
                ),
                {
                  organizationId: ORG_B,
                },
              ),
            );
          },
        );

        it(
          'prevents moving a topic to another course',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            await seedCourse(
              'course-b-same-org',
              ORG_A,
            );

            await seedTopic(
              TOPIC_A,
              ORG_A,
              COURSE_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              updateDoc(
                doc(
                  db,
                  `testTopics/${TOPIC_A}`,
                ),
                {
                  courseId:
                    'course-b-same-org',
                },
              ),
            );
          },
        );
      },
    );

    // ========================================================================
    // QUESTIONS
    // ========================================================================

    describe(
      'questions',
      () => {

        it(
          'allows a member to read a published question in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedQuestion(
              QUESTION_A,
              ORG_A,
              COURSE_A,
              TOPIC_A,
              'published',
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  `testQuestions/${QUESTION_A}`,
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading a question in another organization',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedQuestion(
              QUESTION_B,
              ORG_B,
              COURSE_B,
              TOPIC_B,
              'published',
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  `testQuestions/${QUESTION_B}`,
                ),
              ),
            );
          },
        );

        it(
          'denies a regular member from reading a draft question',
          async () => {
            await seedOrganizationAUsers();

            await seedQuestion(
              'question-draft',
              ORG_A,
              COURSE_A,
              TOPIC_A,
              'draft',
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testQuestions/question-draft',
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to read a draft question',
          async () => {
            await seedOrganizationAUsers();

            await seedQuestion(
              'question-draft',
              ORG_A,
              COURSE_A,
              TOPIC_A,
              'draft',
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testQuestions/question-draft',
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to create a question in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedCourse(
              COURSE_A,
              ORG_A,
            );

            await seedTopic(
              TOPIC_A,
              ORG_A,
              COURSE_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              setDoc(
                doc(
                  db,
                  'testQuestions/question-new',
                ),
                {
                  organizationId: ORG_A,

                  courseId: COURSE_A,

                  topicId: TOPIC_A,

                  question:
                    'New question',

                  type:
                    'multiple-choice',

                  options: [
                    {
                      id: 'a',
                      text: 'A',
                    },
                    {
                      id: 'b',
                      text: 'B',
                    },
                  ],

                  correctAnswer: 'a',

                  difficulty: 'medium',

                  tags: [],

                  sourceType: 'original',

                  status: 'draft',

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies a regular member from creating a question',
          async () => {
            await seedOrganizationAUsers();

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testQuestions/question-new',
                ),
                {
                  organizationId: ORG_A,

                  courseId: COURSE_A,

                  topicId: TOPIC_A,

                  question:
                    'New question',

                  type:
                    'multiple-choice',

                  options: [
                    {
                      id: 'a',
                      text: 'A',
                    },
                    {
                      id: 'b',
                      text: 'B',
                    },
                  ],

                  correctAnswer: 'a',

                  difficulty: 'medium',

                  tags: [],

                  sourceType: 'original',

                  status: 'draft',

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );

        it(
          'denies an organization admin from creating a question under another organization course',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedCourse(
              COURSE_B,
              ORG_B,
            );

            await seedTopic(
              TOPIC_B,
              ORG_B,
              COURSE_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertFails(
              setDoc(
                doc(
                  db,
                  'testQuestions/question-cross-org',
                ),
                {
                  organizationId: ORG_A,

                  courseId: COURSE_B,

                  topicId: TOPIC_B,

                  question:
                    'Cross organization question',

                  type:
                    'multiple-choice',

                  options: [
                    {
                      id: 'a',
                      text: 'A',
                    },
                    {
                      id: 'b',
                      text: 'B',
                    },
                  ],

                  correctAnswer: 'a',

                  difficulty: 'medium',

                  tags: [],

                  sourceType: 'original',

                  status: 'draft',

                  createdAt: TEST_DATE,
                  updatedAt: TEST_DATE,
                },
              ),
            );
          },
        );
      },
    );

    // ========================================================================
    // ATTEMPTS
    // ========================================================================

    describe(
      'attempts',
      () => {

        it(
          'allows a member to read their own attempt',
          async () => {
            await seedOrganizationAUsers();

            await seedAttempt(
              'attempt-a',
              ORG_A,
              USER_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testAttempts/attempt-a',
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading another users attempt',
          async () => {
            await seedOrganizationAUsers();

            await seedAttempt(
              'attempt-a',
              ORG_A,
              ADMIN_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testAttempts/attempt-a',
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to read an attempt in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedAttempt(
              'attempt-a',
              ORG_A,
              USER_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testAttempts/attempt-a',
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading an attempt in another organization',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedAttempt(
              'attempt-b',
              ORG_B,
              USER_B,
              COURSE_B,
              [TOPIC_B],
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testAttempts/attempt-b',
                ),
              ),
            );
          },
        );
      },
    );

    // ========================================================================
    // RESULTS
    // ========================================================================

    describe(
      'results',
      () => {

        it(
          'allows a member to read their own result',
          async () => {
            await seedOrganizationAUsers();

            await seedResult(
              'result-a',
              ORG_A,
              USER_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testResults/result-a',
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading another users result',
          async () => {
            await seedOrganizationAUsers();

            await seedResult(
              'result-a',
              ORG_A,
              ADMIN_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testResults/result-a',
                ),
              ),
            );
          },
        );

        it(
          'allows an organization admin to read a result in their organization',
          async () => {
            await seedOrganizationAUsers();

            await seedResult(
              'result-a',
              ORG_A,
              USER_A,
            );

            const db =
              testEnv
                .authenticatedContext(
                  ADMIN_A,
                )
                .firestore();

            await assertSucceeds(
              getDoc(
                doc(
                  db,
                  'testResults/result-a',
                ),
              ),
            );
          },
        );

        it(
          'denies a member from reading a result in another organization',
          async () => {
            await seedOrganizationAUsers();
            await seedOrganizationBUsers();

            await seedResult(
              'result-b',
              ORG_B,
              USER_B,
              'attempt-b',
              COURSE_B,
            );

            const db =
              testEnv
                .authenticatedContext(
                  USER_A,
                )
                .firestore();

            await assertFails(
              getDoc(
                doc(
                  db,
                  'testResults/result-b',
                ),
              ),
            );
          },
        );
      },
    );
  },
);