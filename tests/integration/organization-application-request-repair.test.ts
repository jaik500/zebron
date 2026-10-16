import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createRequire } from 'node:module';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.GCLOUD_PROJECT ??= 'zebron-rules-test';

/*
 * Root Firebase Admin instance: used to seed and inspect test data.
 */
const adminApp = initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
});

const adminDb = getFirestore(adminApp);

/*
 * Functions Firebase Admin instance: used by the production callable.
 */
const functionsRequire = createRequire(
  new URL('../../functions/package.json', import.meta.url),
);

const functionsAdminAppModule = functionsRequire(
  'firebase-admin/app',
) as typeof import('firebase-admin/app');

const functionsAdminFirestoreModule = functionsRequire(
  'firebase-admin/firestore',
) as typeof import('firebase-admin/firestore');

const functionsAdminApp = functionsAdminAppModule.initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
});

const functionsAdminDb =
  functionsAdminFirestoreModule.getFirestore(functionsAdminApp);

/*
 * Import the actual production callable after initializing Admin.
 */
const {
  repairOrganizationApplicationRequestStatus,
} = await import('../../functions/src/organization-lifecycle');

describe('repairOrganizationApplicationRequestStatus', () => {
  let testEnv: RulesTestEnvironment;

  const requestId = 'repair-test';
  const organizationId = `org_${requestId}`;
  const adminUid = 'platform-admin-test';
  const nonAdminUid = 'ordinary-user-test';

  const requestedApplications = ['community'];

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: process.env.GCLOUD_PROJECT!,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await seedPlatformAdmin();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
    await deleteApp(adminApp);
    await functionsAdminAppModule.deleteApp(functionsAdminApp);
  });

  async function seedPlatformAdmin(): Promise<void> {
    await adminDb.collection('users').doc(adminUid).set({
      uid: adminUid,
      platformRole: 'platform-admin',
    });

    await adminDb.collection('users').doc(nonAdminUid).set({
      uid: nonAdminUid,
      platformRole: 'user',
    });
  }

  async function seedRequest(
    status: string = 'onboarding',
    overrides: Record<string, unknown> = {},
  ): Promise<void> {
    await adminDb
      .collection('organizationApplicationRequests')
      .doc(requestId)
      .set({
        organizationId,
        status,
        requestedApplications,
        createdAt: Timestamp.fromDate(
          new Date('2026-10-14T12:00:00.000Z'),
        ),
        updatedAt: Timestamp.fromDate(
          new Date('2026-10-14T12:00:00.000Z'),
        ),
        ...overrides,
      });
  }

  async function seedOrganization(): Promise<void> {
    await adminDb.collection('organizations').doc(organizationId).set({
      id: organizationId,
      name: 'Repair Test Organization',
      status: 'onboarding',
      active: true,
    });
  }

  async function seedCompletedOnboarding(): Promise<void> {
    await adminDb
      .collection('organizationOnboarding')
      .doc(organizationId)
      .set({
        organizationId,
        status: 'completed',
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
          'configuration',
        ],
        completedAt: Timestamp.fromDate(
          new Date('2026-10-16T13:05:53.000Z'),
        ),
      });
  }

  async function callRepair(
    uid: string,
    data: Record<string, unknown> = { requestId },
  ) {
    return repairOrganizationApplicationRequestStatus.run({
      data,
      rawRequest: {},
      auth: {
        uid,
        token: { uid },
      },
    } as never);
  }

  async function seedValidRepairState(): Promise<void> {
    await seedRequest();
    await seedOrganization();
    await seedCompletedOnboarding();
  }

  it('repairs an onboarding request after core onboarding completes', async () => {
    await seedValidRepairState();

    const organizationBefore = (
      await adminDb.collection('organizations').doc(organizationId).get()
    ).data();

    const onboardingBefore = (
      await adminDb
        .collection('organizationOnboarding')
        .doc(organizationId)
        .get()
    ).data();

    const result = await callRepair(adminUid);

    expect(result).toMatchObject({
      success: true,
      repaired: true,
      requestId,
      organizationId,
      previousStatus: 'onboarding',
      status: 'active',
    });

    const requestAfter = (
      await adminDb
        .collection('organizationApplicationRequests')
        .doc(requestId)
        .get()
    ).data();

    expect(requestAfter?.status).toBe('active');
    expect(requestAfter?.requestedApplications).toEqual(['community']);
    expect(requestAfter?.organizationId).toBe(organizationId);

    const organizationAfter = (
      await adminDb.collection('organizations').doc(organizationId).get()
    ).data();

    const onboardingAfter = (
      await adminDb
        .collection('organizationOnboarding')
        .doc(organizationId)
        .get()
    ).data();

    expect(organizationAfter).toEqual(organizationBefore);
    expect(onboardingAfter).toEqual(onboardingBefore);
  });

  it('returns a successful no-op when the request is already active', async () => {
    await seedValidRepairState();
    await seedRequest('active');

    const before = (
      await adminDb
        .collection('organizationApplicationRequests')
        .doc(requestId)
        .get()
    ).data();

    const result = await callRepair(adminUid);

    expect(result).toMatchObject({
      success: true,
      repaired: false,
      status: 'active',
    });

    const after = (
      await adminDb
        .collection('organizationApplicationRequests')
        .doc(requestId)
        .get()
    ).data();

    expect(after?.updatedAt).toEqual(before?.updatedAt);
  });

  it('rejects an unauthenticated caller', async () => {
    await seedValidRepairState();

    await expect(
      repairOrganizationApplicationRequestStatus.run({
        data: { requestId },
        rawRequest: {},
      } as never),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('rejects a caller who is not a platform administrator', async () => {
    await seedValidRepairState();

    await expect(callRepair(nonAdminUid)).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('rejects an application request that does not exist', async () => {
    await expect(
      callRepair(adminUid, { requestId: 'missing-request' }),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('rejects a mismatched organization ID', async () => {
    await seedRequest('onboarding', {
      organizationId: 'org_different-request',
    });

    await seedOrganization();
    await seedCompletedOnboarding();

    await expect(callRepair(adminUid)).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('rejects a missing organization', async () => {
    await seedRequest();
    await seedCompletedOnboarding();

    await expect(callRepair(adminUid)).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('rejects a missing onboarding record', async () => {
    await seedRequest();
    await seedOrganization();

    await expect(callRepair(adminUid)).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('rejects incomplete core onboarding', async () => {
    await seedRequest();
    await seedOrganization();

    await adminDb
      .collection('organizationOnboarding')
      .doc(organizationId)
      .set({
        organizationId,
        status: 'in_progress',
        currentStep: 'configuration',
      });

    await expect(callRepair(adminUid)).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it.each(['cancelled', 'rejected'])(
    'does not change a %s request',
    async (status) => {
      await seedValidRepairState();
      await seedRequest(status);

      await expect(callRepair(adminUid)).rejects.toMatchObject({
        code: 'failed-precondition',
      });

      const requestAfter = (
        await adminDb
          .collection('organizationApplicationRequests')
          .doc(requestId)
          .get()
      ).data();

      expect(requestAfter?.status).toBe(status);
    },
  );

  it('rejects a missing request ID', async () => {
    await expect(
      callRepair(adminUid, { requestId: '' }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });
});