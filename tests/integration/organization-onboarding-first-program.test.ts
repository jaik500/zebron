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
 * Load Firebase Admin from the Functions installation.
 *
 * The production callable imports firebase-admin from:
 *
 *   functions/node_modules/firebase-admin
 *
 * The test must initialize that same Admin SDK instance because the
 * production callable executes getFirestore() at module load time.
 */
const require = createRequire(import.meta.url);

const admin =
  require(
    '../../functions/node_modules/firebase-admin',
  ) as typeof import('firebase-admin');

const PROJECT_ID = 'zebron-test';

const OWNER_UID = 'first-program-owner';
const ADMIN_UID = 'first-program-admin';
const MANAGER_UID = 'first-program-manager';
const MEMBER_UID = 'first-program-member';
const INACTIVE_UID = 'first-program-inactive';

const ORGANIZATION_ID = 'first-program-test-org';

let testEnvironment: RulesTestEnvironment;
let adminDb: Firestore;

type FirstProgramInput = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
};

/**
 * Builds a callable request object suitable for invoking the
 * Firebase Functions v2 callable handler through `.run()`.
 *
 * We intentionally cast the object because CallableRequest's internal
 * auth token typing is more restrictive than the subset used by the
 * production callable.
 */
function callableRequest(
  uid: string | undefined,
  data: FirstProgramInput,
): CallableRequest<FirstProgramInput> {
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

  return request as unknown as CallableRequest<FirstProgramInput>;
}

/**
 * Firebase Admin must be initialized before the production callable
 * is imported because the callable calls getFirestore() at module load.
 */
function initializeAdmin(): void {
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  if (!admin.getApps().length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }

  adminDb = getAdminFirestore();
}

async function createOrganization(): Promise<void> {
  await adminDb
    .collection('organizations')
    .doc(ORGANIZATION_ID)
    .set({
      name: 'Test Organization',
      slug: 'test-organization',
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
  active = true,
): Promise<void> {
  await adminDb
    .collection('organizationMemberships')
    .doc(`${uid}_${ORGANIZATION_ID}`)
    .set({
      userId: uid,
      organizationId: ORGANIZATION_ID,
      role,
      active,
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });
}

async function createOnboarding(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await adminDb
    .collection('organizationOnboarding')
    .doc(ORGANIZATION_ID)
    .set({
      organizationId: ORGANIZATION_ID,

      status: 'in_progress',

      currentStep: 'configuration',

      /* The core organization workflow contains only these four steps. */
      requiredSteps: [
        'organization_profile',
        'owner_profile',
        'invite_members',
        'configuration',
      ],

      completedSteps: [
        'organization_profile',
        'owner_profile',
        'invite_members',
      ],

      startedAt:
        AdminFieldValue.serverTimestamp(),

      updatedAt:
        AdminFieldValue.serverTimestamp(),

      ...overrides,
    });
}

async function createTestCenterEntitlement(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  const {
    onboarding: onboardingOverrides,
    ...entitlementOverrides
  } = overrides;

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

      onboarding: {
        steps: [
          'first_program',
          'first_course',
          'first_topic',
          'first_question',
        ],
        currentStep: 'first_program',
        completedSteps: [],
        status: 'not_started',

        firstProgramId: null,
        firstCourseId: null,
        firstTopicId: null,
        firstQuestionId: null,

        startedAt: null,
        completedAt: null,

        ...(onboardingOverrides &&
        typeof onboardingOverrides === 'object'
          ? onboardingOverrides as Record<string, unknown>
          : {}),
      },
    });
}

async function createBaseState(): Promise<void> {
  await createOrganization();
  await createOnboarding();
  await createTestCenterEntitlement();

  await createMembership(OWNER_UID, 'org_owner');
  await createMembership(ADMIN_UID, 'org_admin');
  await createMembership(MANAGER_UID, 'org_manager');
  await createMembership(MEMBER_UID, 'org_member');
  await createMembership(INACTIVE_UID, 'org_owner', false);
}

async function deleteTestData(): Promise<void> {
  // Delete the nested entitlement explicitly; deleting an organization
  // document does not delete its subcollections in Firestore.
  await adminDb
    .collection('organizations')
    .doc(ORGANIZATION_ID)
    .collection('applications')
    .doc('test-center')
    .delete()
    .catch(() => undefined);

  const collections = [
    'organizations',
    'organizationMemberships',
    'organizationOnboarding',
    'testPrograms',
  ];

  for (const collectionName of collections) {
    const snapshot = await adminDb
      .collection(collectionName)
      .get();

    if (snapshot.empty) {
      continue;
    }

    const batch = adminDb.batch();

    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
    });

    await batch.commit();
  }
}

let completeOrganizationFirstProgram: {
  run: (
    request: CallableRequest<FirstProgramInput>,
  ) => Promise<unknown>;
};

beforeAll(async () => {
  /**
   * IMPORTANT:
   *
   * Initialize the Functions-installed Firebase Admin SDK before
   * dynamically importing the production callable.
   */
  initializeAdmin();

  testEnvironment =
    await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
      },
    });

  /**
   * The production module executes:
   *
   *   const db = getFirestore();
   *
   * at module load time.
   *
   * Because initializeAdmin() has already initialized the same
   * Firebase Admin package instance, getFirestore() can now resolve
   * the default application successfully.
   */
  const module = await import(
    '../../functions/src/organization-onboarding-first-program'
  );

  completeOrganizationFirstProgram =
    module.completeOrganizationFirstProgram;
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

describe('completeOrganizationFirstProgram', () => {
  it('creates the first program and advances onboarding to courses', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Cyber Security',
      slug: 'cyber-security',
      description: 'Cyber Security Program',
    };

    const result =
      await completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      );

    expect(result).toMatchObject({
      success: true,
      program: {
        id: 'cyber-security',
        organizationId: ORGANIZATION_ID,
        name: 'Cyber Security',
        slug: 'cyber-security',
        description: 'Cyber Security Program',
        active: true,
        courseCount: 0,
      },
      onboarding: {
        firstProgramId: 'cyber-security',
        currentStep: 'first_course',
        status: 'in_progress',
      },
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('cyber-security')
      .get();

    expect(programSnapshot.exists).toBe(true);

    expect(programSnapshot.data()).toMatchObject({
      organizationId: ORGANIZATION_ID,
      name: 'Cyber Security',
      slug: 'cyber-security',
      description: 'Cyber Security Program',
      active: true,
      courseCount: 0,
      createdBy: OWNER_UID,
    });

    const onboardingSnapshot = await adminDb
      .collection('organizationOnboarding')
      .doc(ORGANIZATION_ID)
      .get();

    expect(onboardingSnapshot.exists).toBe(true);

    const onboarding =
      onboardingSnapshot.data();

    expect(onboarding).toMatchObject({
      organizationId: ORGANIZATION_ID,
      status: 'in_progress',
      currentStep: 'configuration',
      requiredSteps: [
        'organization_profile',
        'owner_profile',
        'invite_members',
        'configuration',
      ],
      completedSteps: [
        'organization_profile',
        'owner_profile',
        'invite_members',
      ],
    });

    expect(onboarding).not.toHaveProperty('firstProgramId');

    const entitlementSnapshot = await adminDb
      .collection('organizations')
      .doc(ORGANIZATION_ID)
      .collection('applications')
      .doc('test-center')
      .get();

    expect(entitlementSnapshot.data()?.onboarding).toMatchObject({
      firstProgramId: 'cyber-security',
      currentStep: 'first_course',
      completedSteps: ['first_program'],
      status: 'in_progress',
    });
  });

  it('allows an org_admin to create the first program', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'AWS',
      slug: 'aws',
      description: 'AWS Program',
    };

    const result =
      await completeOrganizationFirstProgram.run(
        callableRequest(ADMIN_UID, input),
      );

    expect(result).toMatchObject({
      success: true,
      program: {
        id: 'aws',
        organizationId: ORGANIZATION_ID,
        name: 'AWS',
        slug: 'aws',
      },
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('aws')
      .get();

    expect(programSnapshot.exists).toBe(true);
  });

  it('rejects an org_manager because first-program onboarding is restricted to owner/admin', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Linux',
      slug: 'linux',
      description: 'Linux Program',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(MANAGER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('linux')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects an org_member', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Member Program',
      slug: 'member-program',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(MEMBER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('member-program')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects an inactive organization membership', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Inactive Program',
      slug: 'inactive-program',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(INACTIVE_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('inactive-program')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects an unknown organization', async () => {
    const input: FirstProgramInput = {
      organizationId: 'does-not-exist',
      name: 'Unknown Organization Program',
      slug: 'unknown-organization-program',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'not-found',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('unknown-organization-program')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects when the Test Center entitlement does not exist', async () => {
    await adminDb
      .collection('organizations')
      .doc(ORGANIZATION_ID)
      .collection('applications')
      .doc('test-center')
      .delete();

    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Missing Test Center',
      slug: 'missing-test-center',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('missing-test-center')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

it('rejects when onboarding is not currently at first_program', async () => {
  // Simulate a Test Center workflow that has already completed
  // first_program and is now on first_course.
  await adminDb
    .collection('organizations')
    .doc(ORGANIZATION_ID)
    .collection('applications')
    .doc('test-center')
    .update({
      'onboarding.currentStep': 'first_course',
      'onboarding.completedSteps': ['first_program'],
      'onboarding.status': 'in_progress',
      'onboarding.firstProgramId': 'existing-program',
    });

  const input: FirstProgramInput = {
    organizationId: ORGANIZATION_ID,
    name: 'Wrong Step',
    slug: 'wrong-step',
    description: 'Should not be created',
  };

  await expect(
    completeOrganizationFirstProgram.run(
      callableRequest(OWNER_UID, input),
    ),
  ).rejects.toMatchObject({
    code: 'already-exists',
  });

  const programSnapshot = await adminDb
    .collection('testPrograms')
    .doc('wrong-step')
    .get();

  expect(programSnapshot.exists).toBe(false);
});

  it('rejects when onboarding is not in progress', async () => {
    await createTestCenterEntitlement({
      onboarding: {
        currentStep: null,
        completedSteps: [
          'first_program',
          'first_course',
          'first_topic',
          'first_question',
        ],
        status: 'completed',
      },
    });

    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Completed Onboarding',
      slug: 'completed-onboarding',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('completed-onboarding')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects when a first program has already been recorded', async () => {
    await createTestCenterEntitlement({
      onboarding: {
        firstProgramId: 'existing-program',
      },
    });

    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Second Program',
      slug: 'second-program',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'already-exists',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('second-program')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects a duplicate normalized program slug', async () => {
    await adminDb
      .collection('testPrograms')
      .doc('cyber-security')
      .set({
        organizationId: ORGANIZATION_ID,
        name: 'Existing Program',
        slug: 'cyber-security',
        description: 'Existing program',
        active: true,
        courseCount: 0,
        createdBy: OWNER_UID,
        createdAt:
          AdminFieldValue.serverTimestamp(),
        updatedAt:
          AdminFieldValue.serverTimestamp(),
      });

    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Cyber Security',
      slug: 'cyber-security',
      description: 'Duplicate program',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'already-exists',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('cyber-security')
      .get();

    expect(programSnapshot.data()).toMatchObject({
      name: 'Existing Program',
      description: 'Existing program',
    });
  });

  it('normalizes the program slug before creating the document', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Cyber Security',
      slug: '  Cyber Security!!!  ',
      description: 'Cyber Security Program',
    };

    const result =
      await completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      );

    expect(result).toMatchObject({
      success: true,
      program: {
        id: 'cyber-security',
        slug: 'cyber-security',
      },
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('cyber-security')
      .get();

    expect(programSnapshot.exists).toBe(true);

    expect(programSnapshot.data()).toMatchObject({
      slug: 'cyber-security',
      name: 'Cyber Security',
    });
  });

  it('rejects an empty program name', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: '   ',
      slug: 'invalid-name',
      description: 'Invalid program',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('invalid-name')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });

  it('rejects an invalid program slug', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Invalid Slug Program',
      slug: '!!!',
      description: 'Invalid slug',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(OWNER_UID, input),
      ),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('rejects an unauthenticated caller', async () => {
    const input: FirstProgramInput = {
      organizationId: ORGANIZATION_ID,
      name: 'Unauthenticated Program',
      slug: 'unauthenticated-program',
      description: 'Should not be created',
    };

    await expect(
      completeOrganizationFirstProgram.run(
        callableRequest(undefined, input),
      ),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    const programSnapshot = await adminDb
      .collection('testPrograms')
      .doc('unauthenticated-program')
      .get();

    expect(programSnapshot.exists).toBe(false);
  });
});