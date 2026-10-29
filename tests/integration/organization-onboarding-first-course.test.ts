import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from '../../functions/node_modules/firebase-admin/lib/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createRequire } from 'node:module';

import type { Firestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/**
 * Load the same Firebase Admin SDK instance used by the production Functions.
 */
const require = createRequire(import.meta.url);

const admin = require(
  '../../functions/node_modules/firebase-admin',
) as typeof import('firebase-admin');

const PROJECT_ID = 'zebron-test';

const OWNER_UID = 'first-course-owner';
const ADMIN_UID = 'first-course-admin';
const MANAGER_UID = 'first-course-manager';
const MEMBER_UID = 'first-course-member';
const INACTIVE_UID = 'first-course-inactive';

const ORGANIZATION_ID = 'first-course-test-org';
const OTHER_ORGANIZATION_ID = 'other-course-test-org';

const CORE_ORGANIZATION_STEPS = [
  'organization_profile',
  'owner_profile',
  'invite_members',
  'configuration',
];

const TEST_CENTER_STEPS = [
  'first_program',
  'first_course',
  'first_topic',
  'first_question',
];

type FirstCourseInput = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  provider?: string;
  type: 'certification' | 'course' | 'subject' | 'skill';
  certificationCode?: string;
  imageUrl?: string;
  active: boolean;
};

type TestCenterSetup = {
  steps: string[];
  currentStep: string | null;
  completedSteps: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  firstProgramId: string | null;
  firstCourseId: string | null;
  firstTopicId: string | null;
  firstQuestionId: string | null;
  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
};

function callableRequest(
  uid: string | undefined,
  data: FirstCourseInput,
): CallableRequest<FirstCourseInput> {
  const request = {
    data,
    auth: uid
      ? {
          uid,
          token: {
            uid,
            email: `${uid}@example.com`,
          },
          rawToken: '',
        }
      : undefined,
    instanceIdToken: undefined,
    rawRequest: undefined,
  };

  return request as unknown as CallableRequest<FirstCourseInput>;
}

function initializeAdmin(): void {
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  if (!admin.getApps().length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  adminDb = getAdminFirestore();
}

async function createOrganization(
  organizationId = ORGANIZATION_ID,
  name = 'Test Organization',
): Promise<void> {
  await adminDb.collection('organizations').doc(organizationId).set({
    id: organizationId,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    active: true,
  });
}

async function createMembership(
  uid: string,
  role:
    | 'org_owner'
    | 'org_admin'
    | 'org_manager'
    | 'org_staff'
    | 'org_member',
  organizationId = ORGANIZATION_ID,
  active = true,
): Promise<void> {
  await adminDb
    .collection('organizationMemberships')
    .doc(`${uid}_${organizationId}`)
    .set({
      userId: uid,
      organizationId,
      role,
      active,
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });
}

async function createProgram(
  programId = 'cyber-security',
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await adminDb.collection('testPrograms').doc(programId).set({
    organizationId,
    name: 'Cyber Security',
    slug: programId,
    description: 'Cyber Security Program',
    active: true,
    courseCount: 0,
    createdBy: OWNER_UID,
    createdAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  });
}

/**
 * Organization onboarding contains only the four core organization steps.
 * Test Center setup progress is stored separately in its application entitlement.
 */
async function createOrganizationOnboarding(): Promise<void> {
  await adminDb
    .collection('organizationOnboarding')
    .doc(ORGANIZATION_ID)
    .set({
      organizationId: ORGANIZATION_ID,
      status: 'completed',
      currentStep: 'configuration',
      requiredSteps: CORE_ORGANIZATION_STEPS,
      completedSteps: CORE_ORGANIZATION_STEPS,
      startedAt: AdminFieldValue.serverTimestamp(),
      completedAt: AdminFieldValue.serverTimestamp(),
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });
}

async function createTestCenterEntitlement(
  onboardingOverrides: Partial<TestCenterSetup> = {},
  entitlementOverrides: Record<string, unknown> = {},
): Promise<void> {
  const entitlementOnboarding: TestCenterSetup = {
    steps: [...TEST_CENTER_STEPS],
    currentStep: 'first_course',
    completedSteps: ['first_program'],
    status: 'in_progress',
    firstProgramId: 'cyber-security',
    firstCourseId: null,
    firstTopicId: null,
    firstQuestionId: null,
    startedAt: AdminFieldValue.serverTimestamp(),
    completedAt: null,
    updatedAt: AdminFieldValue.serverTimestamp(),
    ...onboardingOverrides,
  };

  await adminDb
    .collection('organizations')
    .doc(ORGANIZATION_ID)
    .collection('applications')
    .doc('test-center')
    .set({
      applicationId: 'test-center',
      organizationId: ORGANIZATION_ID,
      status: 'selected',
      ...entitlementOverrides,
      onboarding: entitlementOnboarding,
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });
}

function entitlementRef(organizationId = ORGANIZATION_ID) {
  return adminDb
    .collection('organizations')
    .doc(organizationId)
    .collection('applications')
    .doc('test-center');
}

async function updateTestCenterOnboarding(
  updates: Record<string, unknown>,
): Promise<void> {
  const fieldUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    fieldUpdates[`onboarding.${key}`] = value;
  }

  await entitlementRef().update(fieldUpdates);
}

async function createBaseState(): Promise<void> {
  await createOrganization();

  await createMembership(OWNER_UID, 'org_owner');
  await createMembership(ADMIN_UID, 'org_admin');
  await createMembership(MANAGER_UID, 'org_manager');
  await createMembership(MEMBER_UID, 'org_member');
  await createMembership(INACTIVE_UID, 'org_owner', ORGANIZATION_ID, false);

  await createProgram();
  await createOrganizationOnboarding();
  await createTestCenterEntitlement();
}

async function deleteCollection(collectionName: string): Promise<void> {
  const snapshot = await adminDb.collection(collectionName).get();

  if (snapshot.empty) {
    return;
  }

  const batch = adminDb.batch();

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
  }

  await batch.commit();
}

async function deleteTestData(): Promise<void> {
  // Deleting an organization document does not delete its subcollections.
  await entitlementRef().delete().catch(() => undefined);
  await entitlementRef(OTHER_ORGANIZATION_ID).delete().catch(() => undefined);

  for (const collectionName of [
    'organizationMemberships',
    'organizationOnboarding',
    'testPrograms',
    'testCourses',
    'organizations',
  ]) {
    await deleteCollection(collectionName);
  }
}

let adminDb: Firestore;
let testEnvironment: RulesTestEnvironment;

let completeOrganizationFirstCourse: {
  run: (request: CallableRequest<FirstCourseInput>) => Promise<unknown>;
};

beforeAll(async () => {
  initializeAdmin();

  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  });

  const module = await import(
    '../../functions/src/organization-onboarding-first-course'
  );

  completeOrganizationFirstCourse = module.completeOrganizationFirstCourse;
});

beforeEach(async () => {
  await deleteTestData();
  await createBaseState();
});

afterAll(async () => {
  await deleteTestData();
  await testEnvironment.cleanup();

  if (admin.getApps().length) {
    await admin.deleteApp(admin.getApp());
  }
});

describe('completeOrganizationFirstCourse', () => {
  const validInput = (
    overrides: Partial<FirstCourseInput> = {},
  ): FirstCourseInput => ({
    organizationId: ORGANIZATION_ID,
    name: 'AWS Fundamentals',
    slug: 'aws fundamentals',
    description: 'AWS fundamentals course',
    type: 'course',
    active: true,
    ...overrides,
  });

  it('creates the first course, advances Test Center to first_topic, and leaves core onboarding unchanged', async () => {
    const input = validInput({
      provider: 'Amazon Web Services',
      certificationCode: 'AWS-101',
      imageUrl: 'https://example.com/aws.png',
    });

    const result = await completeOrganizationFirstCourse.run(
      callableRequest(OWNER_UID, input),
    );

    expect(result).toMatchObject({
      success: true,
      course: {
        organizationId: ORGANIZATION_ID,
        programId: 'cyber-security',
        name: 'AWS Fundamentals',
        slug: 'aws-fundamentals',
        description: 'AWS fundamentals course',
        provider: 'Amazon Web Services',
        type: 'course',
        active: true,
        questionCount: 0,
      },
      onboarding: {
        currentStep: 'first_topic',
        completedSteps: ['first_program', 'first_course'],
        status: 'in_progress',
        isComplete: false,
      },
    });

    const response = result as {
      course: { id: string };
      onboarding: { firstCourseId: string; completedSteps: string[] };
    };

    expect(response.course.id).toBe(response.onboarding.firstCourseId);

    const courseSnapshot = await adminDb
      .collection('testCourses')
      .doc(response.course.id)
      .get();

    expect(courseSnapshot.exists).toBe(true);
    expect(courseSnapshot.data()).toMatchObject({
      organizationId: ORGANIZATION_ID,
      scope: 'organization',
      accessType: 'organization-members',
      programId: 'cyber-security',
      name: 'AWS Fundamentals',
      slug: 'aws-fundamentals',
      description: 'AWS fundamentals course',
      provider: 'Amazon Web Services',
      type: 'course',
      certificationCode: 'AWS-101',
      imageUrl: 'https://example.com/aws.png',
      active: true,
      questionCount: 0,
      createdBy: OWNER_UID,
    });

    const entitlementSnapshot = await entitlementRef().get();
    expect(entitlementSnapshot.data()?.onboarding).toMatchObject({
      steps: TEST_CENTER_STEPS,
      currentStep: 'first_topic',
      completedSteps: ['first_program', 'first_course'],
      status: 'in_progress',
      firstProgramId: 'cyber-security',
      firstCourseId: response.course.id,
      firstTopicId: null,
      firstQuestionId: null,
      completedAt: null,
    });

    const organizationOnboardingSnapshot = await adminDb
      .collection('organizationOnboarding')
      .doc(ORGANIZATION_ID)
      .get();

    expect(organizationOnboardingSnapshot.data()).toMatchObject({
      status: 'completed',
      currentStep: 'configuration',
      requiredSteps: CORE_ORGANIZATION_STEPS,
      completedSteps: CORE_ORGANIZATION_STEPS,
    });

    expect(organizationOnboardingSnapshot.data()).not.toHaveProperty(
      'firstCourseId',
    );
  });

  it('allows an org_admin to create the first course', async () => {
    const result = await completeOrganizationFirstCourse.run(
      callableRequest(
        ADMIN_UID,
        validInput({ name: 'AWS Administrator', slug: 'aws-admin' }),
      ),
    );

    expect(result).toMatchObject({
      success: true,
      course: {
        organizationId: ORGANIZATION_ID,
        programId: 'cyber-security',
        name: 'AWS Administrator',
        slug: 'aws-admin',
      },
      onboarding: {
        currentStep: 'first_topic',
        status: 'in_progress',
      },
    });
  });

  it.each([
    ['org_manager', MANAGER_UID],
    ['org_member', MEMBER_UID],
    ['inactive owner', INACTIVE_UID],
  ])('rejects %s', async (_description, uid) => {
    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(uid, validInput({ slug: `denied-${uid}` })),
      ),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    const courses = await adminDb
      .collection('testCourses')
      .where('organizationId', '==', ORGANIZATION_ID)
      .where('slug', '==', `denied-${uid}`)
      .get();

    expect(courses.empty).toBe(true);
  });

  it('rejects an unknown organization', async () => {
    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(
          OWNER_UID,
          validInput({ organizationId: 'missing-organization' }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('rejects when the Test Center entitlement does not exist', async () => {
    await entitlementRef().delete();

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput()),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('rejects when Test Center setup is not configured', async () => {
    await entitlementRef().update({ onboarding: null });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput()),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('rejects when the first program has not been configured', async () => {
    await updateTestCenterOnboarding({ firstProgramId: null });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput()),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('rejects when the first program does not exist', async () => {
    await updateTestCenterOnboarding({ firstProgramId: 'missing-program' });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput()),
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('rejects when the first program belongs to another organization', async () => {
    await createOrganization(OTHER_ORGANIZATION_ID, 'Other Organization');
    await createProgram('other-program', OTHER_ORGANIZATION_ID);
    await updateTestCenterOnboarding({ firstProgramId: 'other-program' });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput({ slug: 'cross-tenant-course' })),
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('rejects when first_course is not the current Test Center step', async () => {
    // The transition helper derives currentStep from completedSteps.
    // Completing first_course makes first_topic the next step.
    await updateTestCenterOnboarding({
      completedSteps: ['first_program', 'first_course'],
      firstCourseId: null,
    });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput({ slug: 'wrong-step-course' })),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' });

    const courses = await adminDb
      .collection('testCourses')
      .where('slug', '==', 'wrong-step-course')
      .get();

    expect(courses.empty).toBe(true);
  });

  it('rejects when Test Center setup is completed', async () => {
    await updateTestCenterOnboarding({
      steps: ['first_program', 'first_course'],
      completedSteps: ['first_program', 'first_course'],
      firstCourseId: null,
      status: 'completed',
    });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput({ slug: 'completed-course' })),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('rejects when a first course has already been recorded', async () => {
    await updateTestCenterOnboarding({ firstCourseId: 'existing-course' });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, validInput({ slug: 'second-course' })),
      ),
    ).rejects.toMatchObject({ code: 'already-exists' });

    const courses = await adminDb
      .collection('testCourses')
      .where('slug', '==', 'second-course')
      .get();

    expect(courses.empty).toBe(true);
  });

  it('rejects a duplicate normalized course slug within the organization', async () => {
    await adminDb.collection('testCourses').doc('existing-course').set({
      organizationId: ORGANIZATION_ID,
      scope: 'organization',
      accessType: 'organization-members',
      programId: 'cyber-security',
      name: 'Existing Course',
      slug: 'aws-fundamentals',
      description: 'Existing course',
      type: 'course',
      active: true,
      questionCount: 0,
      createdBy: OWNER_UID,
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(
          OWNER_UID,
          validInput({
            name: 'AWS Fundamentals',
            slug: ' AWS Fundamentals!!! ',
          }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'already-exists' });
  });

  it('normalizes the course slug before creating the document', async () => {
    const result = await completeOrganizationFirstCourse.run(
      callableRequest(
        OWNER_UID,
        validInput({
          name: 'Linux Basics',
          slug: '  Linux Basics!!!  ',
        }),
      ),
    );

    expect(result).toMatchObject({
      success: true,
      course: { slug: 'linux-basics', name: 'Linux Basics' },
    });

    const response = result as { course: { id: string } };
    const courseSnapshot = await adminDb
      .collection('testCourses')
      .doc(response.course.id)
      .get();

    expect(courseSnapshot.data()).toMatchObject({
      slug: 'linux-basics',
      name: 'Linux Basics',
    });
  });

  it('rejects an empty course name', async () => {
    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(
          OWNER_UID,
          validInput({ name: '   ', slug: 'empty-name-course' }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects an invalid course slug', async () => {
    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(
          OWNER_UID,
          validInput({ name: 'Invalid Slug Course', slug: '!!!' }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects an invalid course type', async () => {
    const invalidInput = {
      ...validInput(),
      type: 'invalid',
    } as unknown as FirstCourseInput;

    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(OWNER_UID, invalidInput),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects an unauthenticated caller', async () => {
    await expect(
      completeOrganizationFirstCourse.run(
        callableRequest(undefined, validInput()),
      ),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('completes Test Center setup when first_course is the final configured step', async () => {
    await updateTestCenterOnboarding({
      steps: ['first_program', 'first_course'],
      completedSteps: ['first_program'],
      firstCourseId: null,
      status: 'in_progress',
    });

    const result = await completeOrganizationFirstCourse.run(
      callableRequest(
        OWNER_UID,
        validInput({ name: 'Final Course', slug: 'final-course' }),
      ),
    );

    expect(result).toMatchObject({
      success: true,
      onboarding: {
        currentStep: null,
        completedSteps: ['first_program', 'first_course'],
        status: 'completed',
        isComplete: true,
      },
    });

    const entitlementSnapshot = await entitlementRef().get();
    expect(entitlementSnapshot.data()?.onboarding).toMatchObject({
      steps: ['first_program', 'first_course'],
      currentStep: null,
      completedSteps: ['first_program', 'first_course'],
      status: 'completed',
    });

    const organizationOnboardingSnapshot = await adminDb
      .collection('organizationOnboarding')
      .doc(ORGANIZATION_ID)
      .get();

    expect(organizationOnboardingSnapshot.data()).toMatchObject({
      status: 'completed',
      currentStep: 'configuration',
      requiredSteps: CORE_ORGANIZATION_STEPS,
      completedSteps: CORE_ORGANIZATION_STEPS,
    });
  });

  it('follows the configured Test Center workflow rather than hard-coding first_topic', async () => {
    await updateTestCenterOnboarding({
      steps: ['first_program', 'first_course', 'first_question'],
      completedSteps: ['first_program'],
      firstCourseId: null,
      status: 'in_progress',
    });

    const result = await completeOrganizationFirstCourse.run(
      callableRequest(
        OWNER_UID,
        validInput({
          name: 'Custom Workflow Course',
          slug: 'custom-workflow-course',
        }),
      ),
    );

    expect(result).toMatchObject({
      success: true,
      onboarding: {
        currentStep: 'first_question',
        completedSteps: ['first_program', 'first_course'],
        status: 'in_progress',
        isComplete: false,
      },
    });

    const entitlementSnapshot = await entitlementRef().get();
    expect(entitlementSnapshot.data()?.onboarding).toMatchObject({
      steps: ['first_program', 'first_course', 'first_question'],
      currentStep: 'first_question',
    });
  });

  it('does not add Test Center steps or resource IDs to organization onboarding', async () => {
    await completeOrganizationFirstCourse.run(
      callableRequest(OWNER_UID, validInput()),
    );

    const snapshot = await adminDb
      .collection('organizationOnboarding')
      .doc(ORGANIZATION_ID)
      .get();

    const onboarding = snapshot.data();

    expect(onboarding?.requiredSteps).toEqual(CORE_ORGANIZATION_STEPS);
    expect(onboarding?.completedSteps).toEqual(CORE_ORGANIZATION_STEPS);
    expect(onboarding?.currentStep).toBe('configuration');
    expect(onboarding).not.toHaveProperty('firstProgramId');
    expect(onboarding).not.toHaveProperty('firstCourseId');
    expect(onboarding).not.toHaveProperty('firstTopicId');
    expect(onboarding).not.toHaveProperty('firstQuestionId');
  });
});
