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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import fs from 'node:fs';

describe(
  'Zebron Firestore Security Rules - Organization Memberships',
  () => {
    let testEnv: RulesTestEnvironment;

    const ORGANIZATION_ID = 'org-security-test';

    const OWNER_UID = 'owner-uid';
    const ADMIN_UID = 'admin-uid';
    const MEMBER_UID = 'member-uid';
    const PLATFORM_ADMIN_UID = 'platform-admin-uid';

    const ownerMembershipId =
      `${OWNER_UID}_${ORGANIZATION_ID}`;

    const adminMembershipId =
      `${ADMIN_UID}_${ORGANIZATION_ID}`;

    const memberMembershipId =
      `${MEMBER_UID}_${ORGANIZATION_ID}`;

    beforeAll(async () => {
      testEnv = await initializeTestEnvironment({
        projectId: 'zebron-rules-test',

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

    // ==========================================================
    // HELPERS
    // ==========================================================

    async function seedBaseOrganization(): Promise<void> {
      await testEnv.withSecurityRulesDisabled(
        async (context) => {
          const db = context.firestore();

          await setDoc(
            doc(
              db,
              `organizations/${ORGANIZATION_ID}`,
            ),
            {
              name: 'Security Test Organization',
              slug: 'security-test-organization',
              status: 'active',
              lifecycleStatus: 'active',
            },
          );

          await setDoc(
            doc(
              db,
              `organizationMemberships/${ownerMembershipId}`,
            ),
            {
              userId: OWNER_UID,
              organizationId: ORGANIZATION_ID,
              role: 'org_owner',
              active: true,
            },
          );

          await setDoc(
            doc(
              db,
              `organizationMemberships/${adminMembershipId}`,
            ),
            {
              userId: ADMIN_UID,
              organizationId: ORGANIZATION_ID,
              role: 'org_admin',
              active: true,
            },
          );

          await setDoc(
            doc(
              db,
              `organizationMemberships/${memberMembershipId}`,
            ),
            {
              userId: MEMBER_UID,
              organizationId: ORGANIZATION_ID,
              role: 'org_member',
              active: true,
            },
          );
        },
      );
    }

    function authenticatedDb(uid: string) {
      return testEnv
        .authenticatedContext(uid)
        .firestore();
    }

    async function seedPlatformAdmin(): Promise<void> {
      await testEnv.withSecurityRulesDisabled(
        async (context) => {
          await setDoc(
            doc(
              context.firestore(),
              `users/${PLATFORM_ADMIN_UID}`,
            ),
            {
              id: PLATFORM_ADMIN_UID,
              email: 'platform-admin@example.com',
              displayName: 'Platform Admin',
              platformRole: 'platform-admin',
            },
          );
        },
      );
    }

    // ==========================================================
    // CREATE
    // ==========================================================

    it(
      'denies an organization admin from creating an org_owner membership',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(ADMIN_UID);

        const newOwnerUid = 'new-owner-uid';

        const newMembershipId =
          `${newOwnerUid}_${ORGANIZATION_ID}`;

        await assertFails(
          setDoc(
            doc(
              db,
              `organizationMemberships/${newMembershipId}`,
            ),
            {
              userId: newOwnerUid,
              organizationId: ORGANIZATION_ID,
              role: 'org_owner',
              active: true,
            },
          ),
        );
      },
    );

    it(
      'allows an organization admin to create a non-owner membership',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(ADMIN_UID);

        const newUserUid = 'new-member-uid';

        const newMembershipId =
          `${newUserUid}_${ORGANIZATION_ID}`;

        await assertSucceeds(
          setDoc(
            doc(
              db,
              `organizationMemberships/${newMembershipId}`,
            ),
            {
              userId: newUserUid,
              organizationId: ORGANIZATION_ID,
              role: 'org_member',
              active: true,
            },
          ),
        );
      },
    );

    it(
      'allows a platform admin to create an org_owner membership',
      async () => {
        await seedBaseOrganization();
        await seedPlatformAdmin();

        const db = authenticatedDb(
          PLATFORM_ADMIN_UID,
        );

        const newOwnerUid =
          'platform-created-owner';

        const newMembershipId =
          `${newOwnerUid}_${ORGANIZATION_ID}`;

        await assertSucceeds(
          setDoc(
            doc(
              db,
              `organizationMemberships/${newMembershipId}`,
            ),
            {
              userId: newOwnerUid,
              organizationId: ORGANIZATION_ID,
              role: 'org_owner',
              active: true,
            },
          ),
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              `organizationMemberships/${newMembershipId}`,
            ),
          ),
        );
      },
    );

    // ==========================================================
    // UPDATE
    // ==========================================================

    it(
      'denies an organization admin from promoting a member to org_owner',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(ADMIN_UID);

        await assertFails(
          updateDoc(
            doc(
              db,
              `organizationMemberships/${memberMembershipId}`,
            ),
            {
              role: 'org_owner',
            },
          ),
        );
      },
    );

    it(
      'allows an organization admin to change a member to another non-owner role',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(ADMIN_UID);

        await assertSucceeds(
          updateDoc(
            doc(
              db,
              `organizationMemberships/${memberMembershipId}`,
            ),
            {
              role: 'org_manager',
            },
          ),
        );
      },
    );

    // ==========================================================
    // DELETE
    // ==========================================================

    it(
      'denies an organization owner from deleting their own membership',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(OWNER_UID);

        await assertFails(
          deleteDoc(
            doc(
              db,
              `organizationMemberships/${ownerMembershipId}`,
            ),
          ),
        );
      },
    );

    it(
      'allows an organization admin to delete a non-owner membership',
      async () => {
        await seedBaseOrganization();

        const db = authenticatedDb(ADMIN_UID);

        await assertSucceeds(
          deleteDoc(
            doc(
              db,
              `organizationMemberships/${memberMembershipId}`,
            ),
          ),
        );
      },
    );
  },
);