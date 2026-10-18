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

/*
 * ============================================================================
 * FIREBASE TEST CONFIGURATION
 * ============================================================================
 */

const PROJECT_ID = 'zebron-provisioning-test';

process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';

/*
 * ============================================================================
 * FUNCTIONS FIREBASE ADMIN INSTANCE
 * ============================================================================
 *
 * The production callable imports firebase-admin from:
 *
 *   functions/node_modules/firebase-admin
 *
 * We intentionally use the same dependency tree in this test.
 */

const functionsRequire = createRequire(
  new URL('../../functions/package.json', import.meta.url),
);

const admin = functionsRequire(
  'firebase-admin',
) as typeof import('firebase-admin');

const { FieldValue } = functionsRequire(
  'firebase-admin/firestore',
) as typeof import('firebase-admin/firestore');

/*
 * ============================================================================
 * TEST CONSTANTS
 * ============================================================================
 */

const ADMIN_UID = 'platform-admin-1';
const NON_ADMIN_UID = 'regular-user-1';

const ADMIN_EMAIL = 'platform-admin@example.com';

const REQUEST_ID = 'org-provisioning-request-1';
const ORGANIZATION_ID = `org_${REQUEST_ID}`;

const APPLICANT_UID = 'organization-applicant-1';

/*
 * ============================================================================
 * EXPECTED ONBOARDING WORKFLOWS
 * ============================================================================
 */

const BASE_REQUIRED_STEPS = [
  'organization_profile',
  'owner_profile',
  'invite_members',
  'configuration',
];

const TEST_CENTER_SETUP_STEPS = [
  'first_program',
  'first_course',
  'first_topic',
  'first_question',
];

/*
 * ============================================================================
 * TYPES
 * ============================================================================
 */

interface OrganizationApplicationRequestData {
  applicantUserId: string;
  organizationName: string;
  organizationSlug?: string;
  contactName: string;
  contactEmail: string;
  requestedApplications: unknown[];
  status: string;
  approvedAt: unknown;
}

/*
 * ============================================================================
 * ADMIN INITIALIZATION
 * ============================================================================
 */

let adminApp: ReturnType<typeof admin.initializeApp>;

let adminDb: Firestore;

let createdAdminApp = false;

let testEnvironment: RulesTestEnvironment;

/*
 * ============================================================================
 * TEST HELPERS
 * ============================================================================
 */

function callableRequest(
  uid: string | undefined,
  data: {
    requestId: string;
  },
): CallableRequest<{ requestId: string }> {
  const request = {
    data,

    auth: uid
      ? {
          uid,

          token: {
            uid,
            email:
              uid === ADMIN_UID
                ? ADMIN_EMAIL
                : `${uid}@example.com`,
          },

          rawToken: '',
        }
      : undefined,

    instanceIdToken: undefined,

    rawRequest: {},
  };

  return request as unknown as CallableRequest<{
    requestId: string;
  }>;
}

async function seedPlatformAdmin(): Promise<void> {
  await adminDb.collection('users').doc(ADMIN_UID).set({
    uid: ADMIN_UID,
    email: ADMIN_EMAIL,
    role: 'admin',
    platformRole: 'platform-admin',
    active: true,
  });
}

async function seedRegularUser(): Promise<void> {
  await adminDb
    .collection('users')
    .doc(NON_ADMIN_UID)
    .set({
      uid: NON_ADMIN_UID,
      email: `${NON_ADMIN_UID}@example.com`,
      role: 'user',
      platformRole: 'user',
      active: true,
    });
}

async function seedOrganizationApplication(
  overrides: Partial<OrganizationApplicationRequestData> = {},
): Promise<void> {
  const application: OrganizationApplicationRequestData = {
    applicantUserId: APPLICANT_UID,

    organizationName:
      'Provisioning Test Organization',

    organizationSlug:
      'provisioning-test-organization',

    contactName:
      'Provisioning Applicant',

    contactEmail:
      'applicant@example.com',

    requestedApplications: [],

    status: 'approved',

    approvedAt:
      FieldValue.serverTimestamp(),

    ...overrides,
  };

  await adminDb
    .collection('organizationApplicationRequests')
    .doc(REQUEST_ID)
    .set(application);
}

async function getOnboarding(): Promise<
  FirebaseFirestore.DocumentData | undefined
> {
  const snapshot = await adminDb
    .collection('organizationOnboarding')
    .doc(ORGANIZATION_ID)
    .get();

  return snapshot.exists
    ? snapshot.data()
    : undefined;
}

async function getOrganization(): Promise<
  FirebaseFirestore.DocumentData | undefined
> {
  const snapshot = await adminDb
    .collection('organizations')
    .doc(ORGANIZATION_ID)
    .get();

  return snapshot.exists
    ? snapshot.data()
    : undefined;
}

async function getMembership(): Promise<
  FirebaseFirestore.DocumentData | undefined
> {
  const membershipId =
    `${APPLICANT_UID}_${ORGANIZATION_ID}`;

  const snapshot = await adminDb
    .collection('organizationMemberships')
    .doc(membershipId)
    .get();

  return snapshot.exists
    ? snapshot.data()
    : undefined;
}

/*
 * ============================================================================
 * TEST SUITE
 * ============================================================================
 */

describe('provisionOrganization', () => {
  let provisionOrganization:
    typeof import('../../functions/src/organization-provisioning')
      .provisionOrganization;

  /*
   * --------------------------------------------------------------------------
   * SETUP
   * --------------------------------------------------------------------------
   */

  beforeAll(async () => {
    /*
     * Use the same firebase-admin package that the Functions code uses.
     *
     * We only create the app if one does not already exist.
     */
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        projectId: PROJECT_ID,
      });

      createdAdminApp = true;
    } else {
      adminApp = admin.app();
    }

    adminDb = admin.firestore();

    testEnvironment =
      await initializeTestEnvironment({
        projectId: PROJECT_ID,

        firestore: {
          host: '127.0.0.1',
          port: 8080,
          rules: '',
        },
      });

    /*
     * Import the production callable only after the
     * Functions Admin SDK is available.
     */
    const module =
      await import(
        '../../functions/src/organization-provisioning'
      );

    provisionOrganization =
      module.provisionOrganization;
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();

    await seedPlatformAdmin();

    await seedRegularUser();
  });

  afterAll(async () => {
    /*
     * Always clean up the emulator first.
     */
    if (testEnvironment) {
      await testEnvironment.cleanup();
    }

    /*
     * IMPORTANT:
     *
     * Do not use deleteApp() imported from another firebase-admin
     * installation. The production Functions code and this test use
     * the firebase-admin package from functions/node_modules.
     *
     * Deleting the exact App instance avoids the previous:
     *
     * "The default Firebase app does not exist"
     *
     * teardown error.
     */
    if (createdAdminApp && adminApp) {
      await adminApp.delete();
    }
  });

  /*
   * ==========================================================================
   * BASIC PROVISIONING
   * ==========================================================================
   */

  it(
    'provisions an organization with the base onboarding workflow',
    async () => {
      await seedOrganizationApplication();

      const result =
        await provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: REQUEST_ID,
          }),
        );

      expect(result).toMatchObject({
        success: true,
        requestId: REQUEST_ID,
        organizationId: ORGANIZATION_ID,
        organizationName:
          'Provisioning Test Organization',
        ownerUserId: APPLICANT_UID,
        alreadyProvisioned: false,
        requestedApplications: [],
      });

      const organization =
        await getOrganization();

      expect(organization).toMatchObject({
        id: ORGANIZATION_ID,
        name:
          'Provisioning Test Organization',
        slug:
          'provisioning-test-organization',
        ownerUserId: APPLICANT_UID,
        status: 'onboarding',
        active: true,
        verified: true,
      });

      const membership =
        await getMembership();

      expect(membership).toMatchObject({
        id:
          `${APPLICANT_UID}_${ORGANIZATION_ID}`,
        userId: APPLICANT_UID,
        organizationId: ORGANIZATION_ID,
        role: 'org_owner',
        active: true,
      });

      const onboarding =
        await getOnboarding();

      expect(onboarding).toBeDefined();

      expect(onboarding).toMatchObject({
        id: ORGANIZATION_ID,
        organizationId: ORGANIZATION_ID,
        ownerUserId: APPLICANT_UID,
        status: 'in_progress',
        currentStep:
          'organization_profile',
        completedSteps: [],
        completedAt: null,
      });

      expect(
        onboarding?.requiredSteps,
      ).toEqual(
        BASE_REQUIRED_STEPS,
      );
    },
  );

  /*
   * ==========================================================================
   * FULL APPLICATION WORKFLOW
   * ==========================================================================
   */

  it(
    'keeps application-specific setup steps out of organization onboarding',
    async () => {
      await seedOrganizationApplication({
        requestedApplications: [
          {
            applicationId: 'test-center',

            onboardingSteps: [
              'first_program',
              'first_course',
              'first_topic',
              'first_question',
            ],
          },
        ],
      });

      await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      const onboarding =
        await getOnboarding();

      expect(onboarding?.requiredSteps).toEqual(BASE_REQUIRED_STEPS);

      expect(
        onboarding?.currentStep,
      ).toBe(
        'organization_profile',
      );

      expect(
        onboarding?.completedSteps,
      ).toEqual([]);

      expect(
        onboarding?.status,
      ).toBe('in_progress');
    },
  );


  /*
   * ==========================================================================
   * APPLICATION-SPECIFIC ONBOARDING WORKFLOW
   * ==========================================================================
   */

  it(
    'keeps trusted Test Center setup steps separate from organization onboarding',
    async () => {
      await seedOrganizationApplication({
        requestedApplications: [
          {
            applicationId: 'test-center',

            // Deliberately provide incomplete metadata.
            // The backend must resolve steps from its trusted configuration.
            onboardingSteps: [
              'first_program',
              'first_course',
            ],
          },
        ],
      });

      await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      const onboarding = await getOnboarding();

      expect(onboarding?.requiredSteps).toEqual(BASE_REQUIRED_STEPS);
    },
  );


  /*
   * ==========================================================================
   * DUPLICATE APPLICATION STEPS
   * ==========================================================================
   */

  it(
    'keeps core onboarding steps unique when multiple applications are requested',
    async () => {
      await seedOrganizationApplication({
        requestedApplications: [
  {
    applicationId: 'test-center',
    onboardingSteps: [
      'first_program',
      'first_course',
    ],
  },
  {
    applicationId: 'community',
  },
],
      });

      await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      const onboarding =
        await getOnboarding();

      expect(onboarding?.requiredSteps).toEqual(BASE_REQUIRED_STEPS);

      const requiredSteps =
        onboarding?.requiredSteps as string[];

      expect(
        new Set(requiredSteps).size,
      ).toBe(
        requiredSteps.length,
      );
    },
  );

  /*
   * ==========================================================================
   * APPLICATION ENTITLEMENTS
   * ==========================================================================
   */

  it(
    'creates tenant-scoped application entitlements',
    async () => {
      await seedOrganizationApplication({
        requestedApplications: [
          {
            applicationId: 'test-center',

            onboardingSteps: [
              'first_program',
              'first_course',
            ],
          },
        ],
      });

      await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      const applicationSnapshot =
        await adminDb
          .collection('organizations')
          .doc(ORGANIZATION_ID)
          .collection('applications')
          .doc('test-center')
          .get();

      expect(
        applicationSnapshot.exists,
      ).toBe(true);

      expect(
        applicationSnapshot.data(),
      ).toMatchObject({
        applicationId: 'test-center',
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
    },
  );

  /*
   * ==========================================================================
   * APPLICATION REQUEST STATUS
   * ==========================================================================
   */

  it(
    'moves the approved application request to onboarding',
    async () => {
      await seedOrganizationApplication();

      await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      const snapshot =
        await adminDb
          .collection(
            'organizationApplicationRequests',
          )
          .doc(REQUEST_ID)
          .get();

      expect(
        snapshot.data(),
      ).toMatchObject({
        status: 'onboarding',
        organizationId:
          ORGANIZATION_ID,
      });
    },
  );

  /*
   * ==========================================================================
   * AUTHORIZATION
   * ==========================================================================
   */

  it(
    'rejects an unauthenticated caller',
    async () => {
      await seedOrganizationApplication();

      await expect(
        provisionOrganization.run(
          callableRequest(undefined, {
            requestId: REQUEST_ID,
          }),
        ),
      ).rejects.toMatchObject({
        code: 'unauthenticated',
      });
    },
  );

  it(
    'rejects a non-platform administrator',
    async () => {
      await seedOrganizationApplication();

      await expect(
        provisionOrganization.run(
          callableRequest(NON_ADMIN_UID, {
            requestId: REQUEST_ID,
          }),
        ),
      ).rejects.toMatchObject({
        code: 'permission-denied',
      });
    },
  );

  /*
   * ==========================================================================
   * APPLICATION STATUS
   * ==========================================================================
   */

  it(
    'rejects an application that is not approved',
    async () => {
      await seedOrganizationApplication({
        status: 'submitted',
      });

      await expect(
        provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: REQUEST_ID,
          }),
        ),
      ).rejects.toMatchObject({
        code: 'failed-precondition',
      });
    },
  );

  /*
   * ==========================================================================
   * MISSING APPLICATION
   * ==========================================================================
   */

  it(
    'rejects a missing application request',
    async () => {
      await expect(
        provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: 'does-not-exist',
          }),
        ),
      ).rejects.toMatchObject({
        code: 'not-found',
      });
    },
  );

  /*
   * ==========================================================================
   * IDEMPOTENCY
   * ==========================================================================
   */

  it(
    'is idempotent after an organization has already been provisioned',
    async () => {
      await seedOrganizationApplication();

      const firstResult =
        await provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: REQUEST_ID,
          }),
        );

      expect(
        firstResult.alreadyProvisioned,
      ).toBe(false);

      const secondResult =
        await provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: REQUEST_ID,
          }),
        );

      expect(
        secondResult,
      ).toMatchObject({
        success: true,
        requestId: REQUEST_ID,
        organizationId: ORGANIZATION_ID,
        alreadyProvisioned: true,
        status: 'onboarding',
      });

      const organizations =
        await adminDb
          .collection('organizations')
          .get();

      expect(
        organizations.size,
      ).toBe(1);

      const onboardingRecords =
        await adminDb
          .collection(
            'organizationOnboarding',
          )
          .get();

      expect(
        onboardingRecords.size,
      ).toBe(1);

      const memberships =
        await adminDb
          .collection(
            'organizationMemberships',
          )
          .get();

      expect(
        memberships.size,
      ).toBe(1);
    },
  );

    /*
   * ==========================================================================
   * IDEMPOTENT RECOVERY
   * ==========================================================================
   */

  it(
    'restores a missing Core entitlement without modifying existing requested applications',
    async () => {
      const requestedApplications = [
        'community',
        'knowledge',
      ];

      /*
       * Seed an existing, already-provisioned organization request.
       */
      await adminDb
        .collection('organizationApplicationRequests')
        .doc(REQUEST_ID)
        .set({
          id: REQUEST_ID,
          applicantUserId: APPLICANT_UID,
          organizationName: 'Busy Bee',
          contactName: 'Busy Bee Owner',
          contactEmail: 'owner@busybee.example',
          requestedApplications,
          status: 'active',
          approvedAt: FieldValue.serverTimestamp(),
          organizationId: ORGANIZATION_ID,
        });

      /*
       * Seed the existing organization.
       */
      await adminDb
        .collection('organizations')
        .doc(ORGANIZATION_ID)
        .set({
          id: ORGANIZATION_ID,
          name: 'Busy Bee',
          ownerUserId: APPLICANT_UID,
          status: 'active',
          active: true,
        });

      const applicationsRef = adminDb
        .collection('organizations')
        .doc(ORGANIZATION_ID)
        .collection('applications');

      /*
       * Seed existing Community and Knowledge entitlements.
       * Core is intentionally missing.
       */
      const communityConfiguration = {
        featureEnabled: true,
        customSetting: 'preserve-community',
      };

      const knowledgeConfiguration = {
        featureEnabled: true,
        customSetting: 'preserve-knowledge',
      };

      await applicationsRef.doc('community').set({
        applicationId: 'community',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        version: 1,
        provisioningStrategy: 'default',
        activatedAt: FieldValue.serverTimestamp(),
        activatedBy: ADMIN_UID,
        provisionedAt: FieldValue.serverTimestamp(),
        configuration: communityConfiguration,
        provisioningError: null,
      });

      await applicationsRef.doc('knowledge').set({
        applicationId: 'knowledge',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        version: 1,
        provisioningStrategy: 'default',
        activatedAt: FieldValue.serverTimestamp(),
        activatedBy: ADMIN_UID,
        provisionedAt: FieldValue.serverTimestamp(),
        configuration: knowledgeConfiguration,
        provisioningError: null,
      });

      /*
       * Retry organization provisioning.
       */
      const result = await provisionOrganization.run(
        callableRequest(ADMIN_UID, {
          requestId: REQUEST_ID,
        }),
      );

      expect(result).toMatchObject({
        success: true,
        requestId: REQUEST_ID,
        organizationId: ORGANIZATION_ID,
        alreadyProvisioned: true,
        status: 'active',
      });

      /*
       * Core must be restored.
       */
      const coreSnapshot = await applicationsRef
        .doc('core')
        .get();

      expect(coreSnapshot.exists).toBe(true);

      expect(coreSnapshot.data()).toMatchObject({
        applicationId: 'core',
        organizationId: ORGANIZATION_ID,
        status: 'selected',
        version: 1,
        configuration: {},
        provisioningError: null,
      });

      /*
       * Existing Community and Knowledge entitlements must be preserved.
       */
      const communitySnapshot = await applicationsRef
        .doc('community')
        .get();

      expect(communitySnapshot.data()).toMatchObject({
        applicationId: 'community',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        configuration: communityConfiguration,
      });

      const knowledgeSnapshot = await applicationsRef
        .doc('knowledge')
        .get();

      expect(knowledgeSnapshot.data()).toMatchObject({
        applicationId: 'knowledge',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        configuration: knowledgeConfiguration,
      });

      /*
       * Test Center must not be provisioned unless requested.
       */
      const testCenterSnapshot = await applicationsRef
        .doc('test-center')
        .get();

      expect(testCenterSnapshot.exists).toBe(false);

      /*
       * Organization and request lifecycle states must remain unchanged.
       */
      const organizationSnapshot = await adminDb
        .collection('organizations')
        .doc(ORGANIZATION_ID)
        .get();

      expect(organizationSnapshot.data()?.status).toBe('active');

      const requestSnapshot = await adminDb
        .collection('organizationApplicationRequests')
        .doc(REQUEST_ID)
        .get();

      expect(requestSnapshot.data()?.status).toBe('active');
    },
  );

  /*
   * ==========================================================================
   * INVALID REQUEST ID
   * ==========================================================================
   */

  it(
    'rejects an empty requestId',
    async () => {
      await expect(
        provisionOrganization.run(
          callableRequest(ADMIN_UID, {
            requestId: '   ',
          }),
        ),
      ).rejects.toMatchObject({
        code: 'invalid-argument',
      });
    },
  );
});