import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createRequire } from 'node:module';

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'zebron-application-provisioning-test';

process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';

/* Use the same firebase-admin installation as the Functions source. */
const functionsRequire = createRequire(
  new URL('../../functions/package.json', import.meta.url),
);

const admin = functionsRequire('firebase-admin') as typeof import('firebase-admin');

let testEnvironment: RulesTestEnvironment;
let adminApp: ReturnType<typeof admin.initializeApp>;
let createdAdminApp = false;
let db: FirebaseFirestore.Firestore;
let provisionOrganizationApplications: typeof import('../../functions/src/application-provisioning').provisionOrganizationApplications;

const ORGANIZATION_ID = 'application-provisioning-org';
const OTHER_ORGANIZATION_ID = 'application-provisioning-other-org';
const ACTOR_UID = 'provisioning-test-actor';

interface EntitlementSeed {
  applicationId: string;
  status?: string;
  provisioningStrategy?: string;
  configuration?: Record<string, unknown>;
  provisioningError?: string | null;
}

async function seedOrganization(organizationId: string): Promise<void> {
  await db.collection('organizations').doc(organizationId).set({
    id: organizationId,
    name: `Test ${organizationId}`,
    status: 'onboarding',
    createdAt: new Date(),
  });
}

async function seedEntitlement(
  organizationId: string,
  seed: EntitlementSeed,
): Promise<void> {
  await db
    .collection('organizations')
    .doc(organizationId)
    .collection('applications')
    .doc(seed.applicationId)
    .set({
      applicationId: seed.applicationId,
      organizationId,
      status: seed.status ?? 'selected',
      version: 1,
      provisioningStrategy: seed.provisioningStrategy ?? strategyFor(seed.applicationId),
      activatedAt: null,
      activatedBy: null,
      provisionedAt: null,
      configuration: seed.configuration ?? {},
      provisioningError: seed.provisioningError ?? null,
      updatedAt: new Date(),
    });
}

async function seedActiveCore(organizationId: string): Promise<void> {
  await seedEntitlement(organizationId, {
    applicationId: 'core',
    status: 'active',
  });
}

function strategyFor(applicationId: string): string {
  switch (applicationId) {
    case 'test-center':
    case 'business-operations':
      return 'custom';
    case 'resources':
    case 'jobs-training':
    case 'tax-pay':
    case 'content':
    case 'mailbox':
      return 'none';
    default:
      return 'default';
  }
}

async function getEntitlement(
  organizationId: string,
  applicationId: string,
): Promise<Record<string, unknown> | undefined> {
  const snapshot = await db
    .collection('organizations')
    .doc(organizationId)
    .collection('applications')
    .doc(applicationId)
    .get();

  return snapshot.exists ? snapshot.data() as Record<string, unknown> : undefined;
}

beforeAll(async () => {
  if (!admin.apps.length) {
    adminApp = admin.initializeApp({ projectId: PROJECT_ID });
    createdAdminApp = true;
  } else {
    adminApp = admin.app();
  }

  db = admin.firestore();

  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: '',
    },
  });

  const module = await import('../../functions/src/application-provisioning');
  provisionOrganizationApplications = module.provisionOrganizationApplications;
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedOrganization(ORGANIZATION_ID);
  await seedOrganization(OTHER_ORGANIZATION_ID);
});

afterAll(async () => {
  if (testEnvironment) {
    await testEnvironment.cleanup();
  }

  if (createdAdminApp && adminApp) {
    await adminApp.delete();
  }
});

describe('provisionOrganizationApplications', () => {
  it('provisions Core before automatically activating an eligible Community entitlement', async () => {
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'core' });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'automatic' },
    );

    expect(results).toContainEqual({ applicationId: 'core', status: 'active' });
    expect(results).toContainEqual({ applicationId: 'community', status: 'active' });

    expect(await getEntitlement(ORGANIZATION_ID, 'core')).toMatchObject({ status: 'active' });
    const entitlement = await getEntitlement(ORGANIZATION_ID, 'community');
    expect(entitlement).toMatchObject({
      status: 'active',
      activatedBy: ACTOR_UID,
      configuration: {},
      provisioningError: null,
    });
    expect(entitlement?.activatedAt).toBeDefined();
    expect(entitlement?.provisionedAt).toBeDefined();
  });

  it('automatically provisions Test Center when its Core dependency is active', async () => {
  await seedActiveCore(ORGANIZATION_ID);

  await seedEntitlement(ORGANIZATION_ID, {
    applicationId: 'test-center',
    provisioningStrategy: 'default',
  });

  const results = await provisionOrganizationApplications(
    db,
    ORGANIZATION_ID,
    ACTOR_UID,
    { mode: 'automatic' },
  );

  expect(results).toContainEqual({
    applicationId: 'test-center',
    status: 'active',
  });

  expect(await getEntitlement(ORGANIZATION_ID, 'test-center')).toMatchObject({
    status: 'active',
    activatedBy: ACTOR_UID,
    configuration: {},
    provisioningError: null,
  });

  const entitlement = await getEntitlement(
    ORGANIZATION_ID,
    'test-center',
  );

  expect(entitlement?.activatedAt).toBeDefined();
  expect(entitlement?.provisionedAt).toBeDefined();
});

  it('only processes explicitly requested application IDs in requested mode', async () => {
    await seedActiveCore(ORGANIZATION_ID);
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'knowledge' });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['knowledge'] },
    );

    expect(results).toEqual([{ applicationId: 'knowledge', status: 'active' }]);
    expect(await getEntitlement(ORGANIZATION_ID, 'knowledge')).toMatchObject({ status: 'active' });
    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({ status: 'selected' });
  });

  it('does not reinitialize or regress an already-active entitlement', async () => {
    await seedEntitlement(ORGANIZATION_ID, {
      applicationId: 'community',
      status: 'active',
      configuration: { theme: 'blue' },
    });

    const before = await getEntitlement(ORGANIZATION_ID, 'community');
    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );
    const after = await getEntitlement(ORGANIZATION_ID, 'community');

    expect(results).toEqual([{
      applicationId: 'community',
      status: 'active',
      reason: 'Application is already active.',
    }]);
    expect(after).toMatchObject({ status: 'active', configuration: { theme: 'blue' } });
    expect(after?.activatedAt).toEqual(before?.activatedAt);
    expect(after?.activatedBy).toEqual(before?.activatedBy);
  });

  it('can retry a previously failed default-strategy entitlement', async () => {
    await seedActiveCore(ORGANIZATION_ID);
    await seedEntitlement(ORGANIZATION_ID, {
      applicationId: 'community',
      status: 'failed',
      provisioningError: 'Previous temporary failure',
    });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );

    expect(results).toEqual([{ applicationId: 'community', status: 'active' }]);
    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({
      status: 'active',
      provisioningError: null,
    });
  });

 it('provisions a requested Test Center entitlement using the default strategy', async () => {
  await seedActiveCore(ORGANIZATION_ID);

  await seedEntitlement(ORGANIZATION_ID, {
    applicationId: 'test-center',
    provisioningStrategy: 'default',
  });

  const results = await provisionOrganizationApplications(
    db,
    ORGANIZATION_ID,
    ACTOR_UID,
    {
      mode: 'requested',
      applicationIds: ['test-center'],
    },
  );

  expect(results).toEqual([
    {
      applicationId: 'test-center',
      status: 'active',
    },
  ]);

  expect(await getEntitlement(ORGANIZATION_ID, 'test-center')).toMatchObject({
    status: 'active',
    activatedBy: ACTOR_UID,
    configuration: {},
    provisioningError: null,
  });
});

  it('does not modify another organization when provisioning one tenant', async () => {
    await seedActiveCore(ORGANIZATION_ID);
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });
    await seedEntitlement(OTHER_ORGANIZATION_ID, { applicationId: 'community' });

    await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'automatic' },
    );

    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({ status: 'active' });
    expect(await getEntitlement(OTHER_ORGANIZATION_ID, 'community')).toMatchObject({ status: 'selected' });
  });

  it('blocks an application when its required dependency is missing', async () => {
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );

    expect(results).toEqual([{
      applicationId: 'community',
      status: 'blocked',
      reason: 'Required dependency \"core\" is missing from this organization.',
    }]);
    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({ status: 'selected' });
  });

  it('blocks an application while its required dependency is not active', async () => {
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'core', status: 'selected' });
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );

    expect(results).toEqual([{
      applicationId: 'community',
      status: 'blocked',
      reason: 'Required dependency \"core\" is not active (current status: selected).',
    }]);
    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({ status: 'selected' });
  });

  it('does not accept another organization’s Core entitlement as a dependency', async () => {
    await seedActiveCore(OTHER_ORGANIZATION_ID);
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });

    const results = await provisionOrganizationApplications(
      db,
      ORGANIZATION_ID,
      ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );

    expect(results).toEqual([{
      applicationId: 'community',
      status: 'blocked',
      reason: 'Required dependency \"core\" is missing from this organization.',
    }]);
    expect(await getEntitlement(OTHER_ORGANIZATION_ID, 'core')).toMatchObject({ status: 'active' });
  });

  it('allows a blocked application to provision after its dependency becomes active', async () => {
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'core', status: 'selected' });
    await seedEntitlement(ORGANIZATION_ID, { applicationId: 'community' });

    const firstAttempt = await provisionOrganizationApplications(
      db, ORGANIZATION_ID, ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );
    expect(firstAttempt[0]).toMatchObject({ applicationId: 'community', status: 'blocked' });

    await db.collection('organizations').doc(ORGANIZATION_ID)
      .collection('applications').doc('core').update({ status: 'active' });

    const retry = await provisionOrganizationApplications(
      db, ORGANIZATION_ID, ACTOR_UID,
      { mode: 'requested', applicationIds: ['community'] },
    );

    expect(retry).toEqual([{ applicationId: 'community', status: 'active' }]);
    expect(await getEntitlement(ORGANIZATION_ID, 'community')).toMatchObject({ status: 'active' });
  });

  it('throws when the organization does not exist', async () => {
    await expect(
      provisionOrganizationApplications(
        db,
        'missing-organization',
        ACTOR_UID,
        { mode: 'automatic' },
      ),
    ).rejects.toThrow('does not exist');
  });

 it('automatically provisions Resources using the default strategy', async () => {
  await seedActiveCore(ORGANIZATION_ID);

  await seedEntitlement(ORGANIZATION_ID, {
    applicationId: 'resources',
    provisioningStrategy: 'default',
  });

  const results = await provisionOrganizationApplications(
    db,
    ORGANIZATION_ID,
    ACTOR_UID,
    {
      mode: 'requested',
      applicationIds: ['resources'],
    },
  );

  expect(results).toEqual([
    {
      applicationId: 'resources',
      status: 'active',
    },
  ]);

  expect(await getEntitlement(ORGANIZATION_ID, 'resources')).toMatchObject({
    status: 'active',
    activatedBy: ACTOR_UID,
    configuration: {},
    provisioningError: null,
  });
});
});
