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

import {
  initializeApp,
  deleteApp,
  type FirebaseApp,
} from 'firebase/app';

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  getFirestore as getClientFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';

import {
  getApps,
  initializeApp as initializeAdminApp,
  deleteApp as deleteAdminApp,
  type App as AdminApp,
} from 'firebase-admin/app';

import {
  getFirestore as getAdminFirestore,
  type Firestore,
} from 'firebase-admin/firestore';

const PROJECT_ID = 'zebron-rules-test';
const EMULATOR_HOST = '127.0.0.1:8080';

const ADMIN_UID = 'provisioning-repair-admin';
const NON_ADMIN_UID = 'provisioning-repair-user';

const REQUEST_ID = 'provisioning-repair-test';
const ORGANIZATION_ID = `org_${REQUEST_ID}`;

const REQUEST_PATH =
  `organizationApplicationRequests/${REQUEST_ID}`;

const ORGANIZATION_PATH =
  `organizations/${ORGANIZATION_ID}`;

const ONBOARDING_PATH =
  `organizationOnboarding/${ORGANIZATION_ID}`;

const CORE_APPLICATION_PATH =
  `${ORGANIZATION_PATH}/applications/core`;

const COMMUNITY_APPLICATION_PATH =
  `${ORGANIZATION_PATH}/applications/community`;

const TEST_CENTER_APPLICATION_PATH =
  `${ORGANIZATION_PATH}/applications/test-center`;

process.env.FIRESTORE_EMULATOR_HOST ??= EMULATOR_HOST;
process.env.GCLOUD_PROJECT ??= PROJECT_ID;

const requireFromFunctions = createRequire(
  new URL('../../functions/package.json', import.meta.url),
);

let rulesEnvironment: RulesTestEnvironment;
let clientApp: FirebaseApp;
let adminApp: AdminApp;
let functionsAdminApp: AdminApp;
let db: Firestore;

type RepairRequest = {
  requestId: string;
};

type ProvisioningRepairResult = {
  success: boolean;
  requestId: string;
  organizationId: string;
  activatedApplications: string[];
  provisioningResults: unknown;
};

type CallableError = Error & {
  code?: string;
  details?: unknown;
};

type CallableRequestLike = {
  data: RepairRequest;
  rawRequest: Record<string, unknown>;
  auth?: {
    uid: string;
    token: {
      uid: string;
      [key: string]: unknown;
    };
  };
};

/**
 * The callable is imported from the actual Cloud Functions source.
 * The functions package has its own Firebase Admin module registry.
 */
let repairOrganizationApplicationProvisioning: {
  run: (
    request: CallableRequestLike,
  ) => Promise<ProvisioningRepairResult>;
};

function getFunctionsAdminFirestore(): Firestore {
  return getAdminFirestore(functionsAdminApp);
}

function requestData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    requestId: REQUEST_ID,
    organizationId: ORGANIZATION_ID,
    status: 'active',
    requestedApplications: ['community'],
    ...overrides,
  };
}

function organizationData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    organizationId: ORGANIZATION_ID,
    name: 'Provisioning Repair Test Organization',
    status: 'active',
    active: true,
    createdBy: ADMIN_UID,
    ...overrides,
  };
}

function onboardingData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    organizationId: ORGANIZATION_ID,
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
    ...overrides,
  };
}

function communityEntitlementData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    applicationId: 'community',
    organizationId: ORGANIZATION_ID,
    status: 'selected',
    version: 1,
    provisioningStrategy: 'default',
    activatedAt: null,
    activatedBy: null,
    provisionedAt: null,
    configuration: {},
    provisioningError: null,
    ...overrides,
  };
}

function testCenterEntitlementData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    applicationId: 'test-center',
    organizationId: ORGANIZATION_ID,
    status: 'selected',
    version: 1,
    provisioningStrategy: 'custom',
    activatedAt: null,
    activatedBy: null,
    provisionedAt: null,
    configuration: {},
    provisioningError: null,
    ...overrides,
  };
}

async function seedPlatformAdmin(): Promise<void> {
  await getFunctionsAdminFirestore()
    .collection('users')
    .doc(ADMIN_UID)
    .set({
      uid: ADMIN_UID,
      platformRole: 'platform-admin',
      role: 'admin',
    });
}

async function seedNonAdmin(): Promise<void> {
  await getFunctionsAdminFirestore()
    .collection('users')
    .doc(NON_ADMIN_UID)
    .set({
      uid: NON_ADMIN_UID,
      platformRole: 'user',
      role: 'user',
    });
}

async function seedOrganizationRequest(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await getFunctionsAdminFirestore()
    .doc(REQUEST_PATH)
    .set(requestData(overrides));
}

async function seedOrganization(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await getFunctionsAdminFirestore()
    .doc(ORGANIZATION_PATH)
    .set(organizationData(overrides));
}

async function seedCompletedOnboarding(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await getFunctionsAdminFirestore()
    .doc(ONBOARDING_PATH)
    .set(onboardingData(overrides));
}

async function seedCommunityEntitlement(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await getFunctionsAdminFirestore()
    .doc(COMMUNITY_APPLICATION_PATH)
    .set(communityEntitlementData(overrides));
}

async function seedTestCenterEntitlement(
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await getFunctionsAdminFirestore()
    .doc(TEST_CENTER_APPLICATION_PATH)
    .set(testCenterEntitlementData(overrides));
}

async function seedValidRecoveryScenario(
  options: {
    includeCore?: boolean;
    includeTestCenter?: boolean;
  } = {},
): Promise<void> {
  const { includeCore = false, includeTestCenter = false } = options;

  await seedPlatformAdmin();
  await seedOrganizationRequest();
  await seedOrganization();
  await seedCompletedOnboarding();
  await seedCommunityEntitlement();

  if (includeCore) {
    await getFunctionsAdminFirestore()
      .doc(CORE_APPLICATION_PATH)
      .set({
        applicationId: 'core',
        organizationId: ORGANIZATION_ID,
        status: 'selected',
        version: 1,
        provisioningStrategy: 'default',
        activatedAt: null,
        activatedBy: null,
        provisionedAt: null,
        configuration: {},
        provisioningError: null,
      });
  }

  if (includeTestCenter) {
    await seedTestCenterEntitlement();
  }
}

async function invokeRepair(
  uid?: string,
  data: RepairRequest = { requestId: REQUEST_ID },
): Promise<ProvisioningRepairResult> {
  const request: CallableRequestLike = {
    data,
    rawRequest: {},
  };

  if (uid) {
    request.auth = {
      uid,
      token: { uid },
    };
  }

  return repairOrganizationApplicationProvisioning.run(
    request,
  );
}

async function expectCallableError(
  operation: Promise<unknown>,
  expectedCode: string,
): Promise<CallableError> {
  try {
    await operation;
  } catch (error) {
    const callableError = error as CallableError;

    expect(callableError.code).toBe(expectedCode);

    return callableError;
  }

  throw new Error(
    `Expected callable to fail with code "${expectedCode}", but it succeeded.`,
  );
}

async function readAdminDocument(
  path: string,
): Promise<Record<string, unknown> | undefined> {
  const snapshot = await getFunctionsAdminFirestore()
    .doc(path)
    .get();

  return snapshot.exists
    ? snapshot.data()
    : undefined;
}

beforeAll(async () => {
  rulesEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  });

  clientApp = initializeApp(
    {
      projectId: PROJECT_ID,
    },
    'provisioning-repair-client',
  );

  adminApp = initializeAdminApp(
    {
      projectId: PROJECT_ID,
    },
    'provisioning-repair-test-admin',
  ) as unknown as AdminApp;

  /**
   * The Functions source imports its own firebase-admin module.
   * Use the same package-resolution approach as the existing
   * organization-application-request-repair integration test.
   */
  const functionsAdmin = requireFromFunctions(
    'firebase-admin/app',
  ) as typeof import('firebase-admin/app');

  functionsAdminApp = functionsAdmin.getApps().find(
    (app) => app.name === '[DEFAULT]',
  ) ?? functionsAdmin.initializeApp(
    {
      projectId: PROJECT_ID,
    },
  );

  const lifecycleModule = await import(
    '../../functions/src/organization-lifecycle'
  );

  repairOrganizationApplicationProvisioning =
    lifecycleModule.repairOrganizationApplicationProvisioning as unknown as typeof repairOrganizationApplicationProvisioning;

  db = getAdminFirestore(adminApp);
});

beforeEach(async () => {
  // Clear the Firestore Emulator before each test.
  // This also clears documents written through the Admin SDK.
  await rulesEnvironment.clearFirestore();

  // Seed the platform administrator required by authorization tests.
  await seedPlatformAdmin();
});

afterEach(async () => {
  await rulesEnvironment.clearFirestore();
});

afterAll(async () => {
  await rulesEnvironment.cleanup();

  if (clientApp) {
    await deleteApp(clientApp);
  }

  if (adminApp) {
    await deleteAdminApp(adminApp);
  }

  if (
    functionsAdminApp &&
    functionsAdminApp.name !== '[DEFAULT]'
  ) {
    await deleteAdminApp(functionsAdminApp);
  }
});

describe('repairOrganizationApplicationProvisioning', () => {
  describe('authorization', () => {
    it('rejects an unauthenticated caller', async () => {
      await seedValidRecoveryScenario();

      await expectCallableError(
        invokeRepair(),
        'unauthenticated',
      );
    });

    it('rejects a non-platform administrator', async () => {
      await seedValidRecoveryScenario();
      await seedNonAdmin();

      await expectCallableError(
        invokeRepair(NON_ADMIN_UID),
        'permission-denied',
      );
    });

    it('allows a platform administrator to recover provisioning', async () => {
      await seedValidRecoveryScenario();

      const result = await invokeRepair(ADMIN_UID);

      expect(result.success).toBe(true);
      expect(result.requestId).toBe(REQUEST_ID);
      expect(result.organizationId).toBe(ORGANIZATION_ID);
      expect(result.activatedApplications).toEqual([
        'core',
        'community',
      ]);
    });
  });

  describe('request and onboarding validation', () => {
    it('rejects a missing request', async () => {
      await seedPlatformAdmin();
      await seedOrganization();
      await seedCompletedOnboarding();
      await seedCommunityEntitlement();

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'not-found',
      );
    });

   it('rejects a missing organization', async () => {
  await seedPlatformAdmin();
  await seedOrganizationRequest();
  await seedCompletedOnboarding();
  await seedCommunityEntitlement();

  await expectCallableError(
    invokeRepair(ADMIN_UID),
    'failed-precondition',
  );
});

    it('rejects incomplete onboarding', async () => {
      await seedPlatformAdmin();
      await seedOrganizationRequest();
      await seedOrganization();
      await seedCompletedOnboarding({
        status: 'in_progress',
      });
      await seedCommunityEntitlement();

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'failed-precondition',
      );
    });

    it('rejects a request that does not include Community', async () => {
      await seedPlatformAdmin();
      await seedOrganizationRequest({
        requestedApplications: [],
      });
      await seedOrganization();
      await seedCompletedOnboarding();
      await seedCommunityEntitlement();

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'failed-precondition',
      );
    });

    it('rejects a request that is not active', async () => {
      await seedPlatformAdmin();
      await seedOrganizationRequest({
        status: 'onboarding',
      });
      await seedOrganization();
      await seedCompletedOnboarding();
      await seedCommunityEntitlement();

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'failed-precondition',
      );
    });

    it('rejects a Community entitlement belonging to another organization', async () => {
      await seedPlatformAdmin();
      await seedOrganizationRequest();
      await seedOrganization();
      await seedCompletedOnboarding();
      await seedCommunityEntitlement({
        organizationId: 'org-another-organization',
      });

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'failed-precondition',
      );
    });
  });

  describe('entitlement recovery', () => {
    it('creates the missing core entitlement and activates Core and Community', async () => {
      await seedValidRecoveryScenario();

      const coreBefore = await readAdminDocument(
        CORE_APPLICATION_PATH,
      );

      expect(coreBefore).toBeUndefined();

      const result = await invokeRepair(ADMIN_UID);

      expect(result.success).toBe(true);
      expect(result.activatedApplications).toEqual([
        'core',
        'community',
      ]);

      const core = await readAdminDocument(
        CORE_APPLICATION_PATH,
      );

      const community = await readAdminDocument(
        COMMUNITY_APPLICATION_PATH,
      );

      expect(core).toBeDefined();
      expect(core?.applicationId).toBe('core');
      expect(core?.organizationId).toBe(ORGANIZATION_ID);
      expect(core?.status).toBe('active');
      expect(core?.provisionedAt).toBeDefined();
      expect(core?.activatedAt).toBeDefined();

      expect(community?.applicationId).toBe('community');
      expect(community?.organizationId).toBe(ORGANIZATION_ID);
      expect(community?.status).toBe('active');
      expect(community?.provisionedAt).toBeDefined();
      expect(community?.activatedAt).toBeDefined();
      expect(community?.provisioningError ?? null).toBeNull();
    });

    it('does not create or activate Test Center when only Community was requested', async () => {
      await seedValidRecoveryScenario({
        includeTestCenter: true,
      });

      const testCenterBefore = await readAdminDocument(
        TEST_CENTER_APPLICATION_PATH,
      );

      expect(testCenterBefore?.status).toBe('selected');

      await invokeRepair(ADMIN_UID);

      const testCenterAfter = await readAdminDocument(
        TEST_CENTER_APPLICATION_PATH,
      );

      expect(testCenterAfter?.status).toBe('selected');
      expect(testCenterAfter?.applicationId).toBe('test-center');
    });

    it('does not overwrite an existing core entitlement with an invalid organization ID', async () => {
      await seedValidRecoveryScenario({
        includeCore: true,
      });

      await getFunctionsAdminFirestore()
        .doc(CORE_APPLICATION_PATH)
        .update({
          organizationId: 'org-another-organization',
        });

      await expectCallableError(
        invokeRepair(ADMIN_UID),
        'failed-precondition',
      );

      const core = await readAdminDocument(
        CORE_APPLICATION_PATH,
      );

      expect(core?.organizationId).toBe(
        'org-another-organization',
      );
    });

    it('can be called repeatedly without creating duplicate entitlements', async () => {
      await seedValidRecoveryScenario();

      const firstResult = await invokeRepair(ADMIN_UID);
      const secondResult = await invokeRepair(ADMIN_UID);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);

      expect(secondResult.activatedApplications).toEqual([
        'core',
        'community',
      ]);

      const core = await readAdminDocument(
        CORE_APPLICATION_PATH,
      );

      const community = await readAdminDocument(
        COMMUNITY_APPLICATION_PATH,
      );

      expect(core?.status).toBe('active');
      expect(community?.status).toBe('active');

      const applicationsSnapshot =
        await getFunctionsAdminFirestore()
          .collection(`${ORGANIZATION_PATH}/applications`)
          .get();

      const applicationIds = applicationsSnapshot.docs
        .map((document) => document.id)
        .sort();

      expect(applicationIds).toEqual(['community', 'core']);
    });
  });
});