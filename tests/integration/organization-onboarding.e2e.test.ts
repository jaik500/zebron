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

const require = createRequire(import.meta.url);

const admin =
  require('../../functions/node_modules/firebase-admin') as typeof import('firebase-admin');

const PROJECT_ID = 'zebron';

const PLATFORM_ADMIN_UID = 'e2e-platform-admin';
const OWNER_UID = 'e2e-owner';

const BASE_REQUEST_ID = 'e2e-base-request';
const TEST_CENTER_REQUEST_ID = 'e2e-test-center-request';

const BASE_ORGANIZATION_ID = `org_${BASE_REQUEST_ID}`;
const TEST_CENTER_ORGANIZATION_ID =
  `org_${TEST_CENTER_REQUEST_ID}`;

const BASE_REQUIRED_STEPS = [
  'organization_profile',
  'owner_profile',
  'invite_members',
  'configuration',
] as const;

const FULL_REQUIRED_STEPS = [
  'organization_profile',
  'owner_profile',
  'invite_members',
  'configuration',
];

const configuration = {
  testCenterEnabled: false,
  allowMemberTesting: false,
  courseVisibility: 'all' as const,
  allowSelfRegistration: false,
  defaultMemberRole: 'org_member' as const,
  adminNotifications: true,
  testResultNotifications: false,
  primaryColor: '#007979',
  secondaryColor: '#032D42',
};

let adminDb: Firestore;
let testEnvironment: RulesTestEnvironment;

let provisionOrganization:
  typeof import('../../functions/src/organization-provisioning')
    .provisionOrganization;

let completeOrganizationConfiguration:
  typeof import('../../functions/src/organization-onboarding-configuration')
    .completeOrganizationConfiguration;

let updateOrganizationOnboardingProfile:
  typeof import('../../functions/src/index')
    .updateOrganizationOnboardingProfile;

let updateOrganizationOnboardingOwnerProfile:
  typeof import('../../functions/src/index')
    .updateOrganizationOnboardingOwnerProfile;

let completeOrganizationInviteMembersStep:
  typeof import('../../functions/src/organization-invitations')
    .completeOrganizationInviteMembersStep;

function configureAdminEnvironment(): void {
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}

/**
 * Initialize the Admin SDK before importing any Functions modules.
 * Several Functions modules call getFirestore() at module scope, so
 * the default app must exist before their imports are evaluated.
 *
 * The app is initialized without options to match the production
 * initializeApp() configuration used by functions/src/index.ts.
 */
function initializeAdmin(): void {
  configureAdminEnvironment();

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  adminDb = admin.firestore();
}

function callableRequest<T>(
  uid: string | undefined,
  data: T,
): CallableRequest<T> {
  return {
    data,
    rawRequest: {} as CallableRequest<T>['rawRequest'],
    auth: uid
      ? {
          uid,
          token: {
            email: `${uid}@example.com`,
          },
        }
      : undefined,
    app: undefined,
    instanceIdToken: undefined,
  };
}

async function deleteCollection(
  collectionName: string,
): Promise<void> {
  const db = adminDb;

  if (!db) {
    throw new Error('Firebase Admin Firestore was not initialized.');
  }

  const snapshot =
    await db
      .collection(collectionName)
      .get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
  }

  await batch.commit();
}

async function deleteCollectionRecursively(
  collectionPath: string,
): Promise<void> {
  const collectionRef = adminDb.collection(collectionPath);

  const snapshot = await collectionRef.get();

  for (const document of snapshot.docs) {
    // Recursively remove subcollections before deleting the parent.
    const subcollections = await document.ref.listCollections();

    for (const subcollection of subcollections) {
      await deleteCollectionRecursively(subcollection.path);
    }

    await document.ref.delete();
  }
}

async function deleteTestData(): Promise<void> {
  const collections = [
    'organizations',
    'organizationMemberships',
    'organizationOnboarding',
    'organizationApplicationRequests',
    'organizationApplications',
    'organizationSettings',
    'organizationAuditLogs',
    'users',
    'testPrograms',
    'testCourses',
    'testTopics',
    'testQuestions',
  ];

  for (const collection of collections) {
    await deleteCollectionRecursively(collection);
  }
}

async function seedPlatformAdmin(): Promise<void> {
  await adminDb
    .collection('users')
    .doc(PLATFORM_ADMIN_UID)
    .set({
      id: PLATFORM_ADMIN_UID,
      email: 'platform-admin@example.com',
      platformRole: 'platform-admin',
      role: 'admin',
      active: true,
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function seedOwner(): Promise<void> {
  await adminDb
    .collection('users')
    .doc(OWNER_UID)
    .set({
      id: OWNER_UID,
      uid: OWNER_UID,
      email: 'owner@example.com',
      role: 'user',
      platformRole: 'user',
      active: true,
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function seedApprovedRequest(
  requestId: string,
  requestedApplications: unknown[] = [],
): Promise<void> {
    await adminDb
  .collection('organizationApplicationRequests')
  .doc(requestId)
  .set({
    id: requestId,

    applicantUserId: OWNER_UID,

    organizationName:
      requestId === BASE_REQUEST_ID
        ? 'Base E2E Organization'
        : 'Test Center E2E Organization',

    organizationSlug:
      requestId === BASE_REQUEST_ID
        ? 'base-e2e-organization'
        : 'test-center-e2e-organization',

    companyNumber: 'E2E-001',

    description:
      'Organization onboarding end-to-end test.',

    website: 'https://example.com',

    contactName: 'E2E Organization Owner',

    contactEmail:
      'owner@example.com',

    contactPhone:
      '+10000000000',

    requestedApplications,

    status: 'approved',

    approvedAt:
      admin.firestore.FieldValue.serverTimestamp(),

    submittedAt:
      admin.firestore.FieldValue.serverTimestamp(),

    createdAt:
      admin.firestore.FieldValue.serverTimestamp(),

    updatedAt:
      admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getOnboarding(
  organizationId: string,
): Promise<Record<string, unknown>> {
  const snapshot =
    await adminDb
      .collection('organizationOnboarding')
      .doc(organizationId)
      .get();

  expect(snapshot.exists).toBe(true);

  return snapshot.data() as Record<string, unknown>;
}

async function completeConfiguration(
  organizationId: string,
): Promise<void> {
  const result =
    await completeOrganizationConfiguration.run(
      callableRequest(
        OWNER_UID,
        {
          organizationId,
          configuration,
        },
      ),
    );

  expect(result.success).toBe(true);
}

beforeAll(async () => {
  /*
   * Initialize Admin before dynamically importing Functions modules.
   * Some modules call getFirestore() at module scope.
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

  const functionsIndex =
    await import(
      '../../functions/src/index'
    );

  const provisioningModule =
    await import(
      '../../functions/src/organization-provisioning'
    );

  const configurationModule =
    await import(
      '../../functions/src/organization-onboarding-configuration'
    );

  const invitationsModule =
    await import(
      '../../functions/src/organization-invitations'
    );

  provisionOrganization =
    provisioningModule.provisionOrganization;

  completeOrganizationConfiguration =
    configurationModule.completeOrganizationConfiguration;

  updateOrganizationOnboardingProfile =
    functionsIndex.updateOrganizationOnboardingProfile;

  updateOrganizationOnboardingOwnerProfile =
    functionsIndex.updateOrganizationOnboardingOwnerProfile;

  completeOrganizationInviteMembersStep =
    invitationsModule.completeOrganizationInviteMembersStep;
});

beforeEach(async () => {
  // Clear all documents from the Firestore test emulator,
  // including documents in nested subcollections.
  await testEnvironment.clearFirestore();

  await seedPlatformAdmin();
  await seedOwner();
});

afterAll(async () => {
  if (adminDb) {
    await deleteTestData();
  }

  if (testEnvironment) {
    await testEnvironment.cleanup();
  }

  if (admin.apps.length) {
    await admin.app().delete();
  }
});

describe(
  'Organization onboarding lifecycle E2E',
  () => {
    describe(
      'base organization',
      () => {
        it(
          'completes onboarding without Test Center',
          async () => {
            await seedApprovedRequest(
              BASE_REQUEST_ID,
              [],
            );

            /*
             * ----------------------------------------------------------
             * 1. PROVISION
             * ----------------------------------------------------------
             */

            const provisionResult =
              await provisionOrganization.run(
                callableRequest(
                  PLATFORM_ADMIN_UID,
                  {
                    requestId:
                      BASE_REQUEST_ID,
                  },
                ),
              );

            expect(
              provisionResult.success,
            ).toBe(true);

            expect(
              provisionResult.organizationId,
            ).toBe(
              BASE_ORGANIZATION_ID,
            );

            /*
             * ----------------------------------------------------------
             * 2. VERIFY INITIAL WORKFLOW
             * ----------------------------------------------------------
             */

            let onboarding =
              await getOnboarding(
                BASE_ORGANIZATION_ID,
              );

            expect(
              onboarding.requiredSteps,
            ).toEqual(
              BASE_REQUIRED_STEPS,
            );

            expect(
              onboarding.currentStep,
            ).toBe(
              'organization_profile',
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([]);

            expect(
              onboarding.status,
            ).toBe(
              'in_progress',
            );

            /*
             * ----------------------------------------------------------
             * 3. COMPLETE ORGANIZATION PROFILE
             * ----------------------------------------------------------
             */

            const profileResult =
              await updateOrganizationOnboardingProfile.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      BASE_ORGANIZATION_ID,

                    profile: {
                      name:
                        'Base E2E Organization',

                      companyNumber:
                        'E2E-001',

                      description:
                        'Organization onboarding end-to-end test.',

                      website:
                        'https://example.com',

                      phone:
                        '+10000000000',

                      email:
                        'owner@example.com',

                      slug:
                        'base-e2e-organization',
                    },
                  },
                ),
              );

            expect(
              profileResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                BASE_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'owner_profile',
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([
              'organization_profile',
            ]);

            /*
             * ----------------------------------------------------------
             * 4. COMPLETE OWNER PROFILE
             * ----------------------------------------------------------
             */

            const ownerResult =
              await updateOrganizationOnboardingOwnerProfile.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      BASE_ORGANIZATION_ID,

                    profile: {
                      firstName:
                        'E2E',

                      lastName:
                        'Owner',

                      preferredName:
                        'E2E Owner',

                      phone:
                        '+10000000000',
                    },
                  },
                ),
              );

            expect(
              ownerResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                BASE_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'invite_members',
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([
              'organization_profile',
              'owner_profile',
            ]);

            /*
             * ----------------------------------------------------------
             * 5. COMPLETE INVITE MEMBERS
             * ----------------------------------------------------------
             */

            const inviteResult =
              await completeOrganizationInviteMembersStep.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      BASE_ORGANIZATION_ID,
                  },
                ),
              );

            expect(
              inviteResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                BASE_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'configuration',
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([
              'organization_profile',
              'owner_profile',
              'invite_members',
            ]);

            /*
             * ----------------------------------------------------------
             * 6. COMPLETE CONFIGURATION
             * ----------------------------------------------------------
             */

            await completeConfiguration(
              BASE_ORGANIZATION_ID,
            );

            /*
             * ----------------------------------------------------------
             * 7. VERIFY FINAL STATE
             * ----------------------------------------------------------
             */

            onboarding =
              await getOnboarding(
                BASE_ORGANIZATION_ID,
              );

            expect(
              onboarding.requiredSteps,
            ).toEqual(
              BASE_REQUIRED_STEPS,
            );

            expect(
              onboarding.completedSteps,
            ).toEqual(
              BASE_REQUIRED_STEPS,
            );

            expect(
              onboarding.currentStep,
            ).toBe(
              'configuration',
            );

            expect(
              onboarding.status,
            ).toBe(
              'completed',
            );

            expect(
              onboarding.completedAt,
            ).toBeDefined();

            /*
             * ----------------------------------------------------------
             * 8. ABSOLUTE TEST CENTER GUARD
             * ----------------------------------------------------------
             */

            expect(
              onboarding.requiredSteps,
            ).not.toContain(
              'first_program',
            );

            expect(
              onboarding.requiredSteps,
            ).not.toContain(
              'first_course',
            );

            expect(
              onboarding.requiredSteps,
            ).not.toContain(
              'first_topic',
            );

            expect(
              onboarding.requiredSteps,
            ).not.toContain(
              'first_question',
            );

            /*
             * No Test Center resources should have been created.
             */

            expect(
              (
                await adminDb
                  .collection('testPrograms')
                  .get()
              ).empty,
            ).toBe(true);

            expect(
              (
                await adminDb
                  .collection('testCourses')
                  .get()
              ).empty,
            ).toBe(true);

            expect(
              (
                await adminDb
                  .collection('testTopics')
                  .get()
              ).empty,
            ).toBe(true);

            expect(
              (
                await adminDb
                  .collection('testQuestions')
                  .get()
              ).empty,
            ).toBe(true);
          },
        );
      },
    );

    describe(
      'Test Center organization',
      () => {
        it(
          'persists the complete Test Center workflow',
          async () => {
            await seedApprovedRequest(
              TEST_CENTER_REQUEST_ID,
              [
                {
                  applicationId:
                    'test-center',

                  onboardingSteps: [
                    'first_program',
                    'first_course',
                    'first_topic',
                    'first_question',
                  ],
                },
              ],
            );

            /*
             * ----------------------------------------------------------
             * 1. PROVISION
             * ----------------------------------------------------------
             */

            const result =
              await provisionOrganization.run(
                callableRequest(
                  PLATFORM_ADMIN_UID,
                  {
                    requestId:
                      TEST_CENTER_REQUEST_ID,
                  },
                ),
              );

            expect(
              result.success,
            ).toBe(true);

            /*
             * ----------------------------------------------------------
             * 2. VERIFY INITIAL WORKFLOW
             * ----------------------------------------------------------
             */

            let onboarding =
              await getOnboarding(
                TEST_CENTER_ORGANIZATION_ID,
              );

            expect(
              onboarding.requiredSteps,
            ).toEqual(
              FULL_REQUIRED_STEPS,
            );

            expect(
              onboarding.currentStep,
            ).toBe(
              'organization_profile',
            );

            /*
             * ----------------------------------------------------------
             * 3. COMPLETE ORGANIZATION PROFILE
             * ----------------------------------------------------------
             */

            const profileResult =
              await updateOrganizationOnboardingProfile.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      TEST_CENTER_ORGANIZATION_ID,

                    profile: {
                      name:
                        'Test Center E2E Organization',

                      companyNumber:
                        'E2E-001',

                      description:
                        'Organization onboarding end-to-end test.',

                      website:
                        'https://example.com',

                      phone:
                        '+10000000000',

                      email:
                        'owner@example.com',

                      slug:
                        'test-center-e2e-organization',
                    },
                  },
                ),
              );

            expect(
              profileResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                TEST_CENTER_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'owner_profile',
            );

            /*
             * ----------------------------------------------------------
             * 4. COMPLETE OWNER PROFILE
             * ----------------------------------------------------------
             */

            const ownerResult =
              await updateOrganizationOnboardingOwnerProfile.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      TEST_CENTER_ORGANIZATION_ID,

                    profile: {
                      firstName:
                        'E2E',

                      lastName:
                        'Owner',

                      preferredName:
                        'E2E Owner',

                      phone:
                        '+10000000000',
                    },
                  },
                ),
              );

            expect(
              ownerResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                TEST_CENTER_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'invite_members',
            );

            /*
             * ----------------------------------------------------------
             * 5. COMPLETE INVITE MEMBERS
             * ----------------------------------------------------------
             */

            const inviteResult =
              await completeOrganizationInviteMembersStep.run(
                callableRequest(
                  OWNER_UID,
                  {
                    organizationId:
                      TEST_CENTER_ORGANIZATION_ID,
                  },
                ),
              );

            expect(
              inviteResult.success,
            ).toBe(true);

            onboarding =
              await getOnboarding(
                TEST_CENTER_ORGANIZATION_ID,
              );

            expect(
              onboarding.currentStep,
            ).toBe(
              'configuration',
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([
              'organization_profile',
              'owner_profile',
              'invite_members',
            ]);

            /*
             * ----------------------------------------------------------
             * 6. CONFIGURATION MUST NOT COMPLETE ONBOARDING
             * ----------------------------------------------------------
             */

            await completeConfiguration(
              TEST_CENTER_ORGANIZATION_ID,
            );

            onboarding =
              await getOnboarding(
                TEST_CENTER_ORGANIZATION_ID,
              );

            expect(
              onboarding.requiredSteps,
            ).toEqual(
              FULL_REQUIRED_STEPS,
            );

            expect(
              onboarding.completedSteps,
            ).toEqual([
              'organization_profile',
              'owner_profile',
              'invite_members',
              'configuration',
            ]);

           expect(onboarding.currentStep).toBe('configuration');

expect(onboarding.status).toBe('completed');

expect(onboarding.completedAt).toBeDefined();
          },
        );
      },
    );
  },
);