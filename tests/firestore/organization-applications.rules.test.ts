import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { readFileSync } from 'node:fs';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'zebron-2b49f';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const PLATFORM_ADMIN = 'platform-admin';

const ORG_OWNER = 'org-owner';
const ORG_ADMIN = 'org-admin';
const ORG_MANAGER = 'org-manager';
const ORG_STAFF = 'org-staff';
const ORG_MEMBER = 'org-member';

const OUTSIDER = 'outsider';

function organizationApplicationPath(
  organizationId: string,
  applicationId: string,
): string {
  return `organizations/${organizationId}/applications/${applicationId}`;
}

function membershipPath(
  userId: string,
  organizationId: string,
): string {
  return `organizationMemberships/${userId}_${organizationId}`;
}

async function seedOrganization(
  organizationId: string,
  name: string,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(
      doc(
        db,
        `organizations/${organizationId}`,
      ),
      {
        id: organizationId,
        name,
        active: true,
      },
    );
  });
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
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(
      doc(
        db,
        membershipPath(
          userId,
          organizationId,
        ),
      ),
      {
        id: `${userId}_${organizationId}`,
        userId,
        organizationId,
        role,
        active,
      },
    );
  });
}

async function seedPlatformAdmin(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(
      doc(
        db,
        `users/${PLATFORM_ADMIN}`,
      ),
      {
        role: 'admin',
      },
    );
  });
}

async function seedApplication(
  organizationId: string,
  applicationId: string,
  status:
    | 'available'
    | 'selected'
    | 'provisioning'
    | 'active'
    | 'suspended'
    | 'deactivated'
    | 'failed',
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(
      doc(
        db,
        organizationApplicationPath(
          organizationId,
          applicationId,
        ),
      ),
      {
        applicationId,
        organizationId,
        status,
        version: 1,
        provisioningStrategy: 'default',
      },
    );
  });
}

function authenticatedDb(userId: string) {
  return testEnv
    .authenticatedContext(userId)
    .firestore();
}

function unauthenticatedDb() {
  return testEnv
    .unauthenticatedContext()
    .firestore();
}

// ============================================================
// TEST ENVIRONMENT
// ============================================================

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
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

// ============================================================
// TEST DATA
// ============================================================

beforeEach(async () => {
  /*
   * Organizations
   */
  await seedOrganization(
    ORG_A,
    'Organization A',
  );

  await seedOrganization(
    ORG_B,
    'Organization B',
  );

  /*
   * Organization A memberships
   */
  await seedMembership(
    ORG_OWNER,
    ORG_A,
    'org_owner',
  );

  await seedMembership(
    ORG_ADMIN,
    ORG_A,
    'org_admin',
  );

  await seedMembership(
    ORG_MANAGER,
    ORG_A,
    'org_manager',
  );

  await seedMembership(
    ORG_STAFF,
    ORG_A,
    'org_staff',
  );

  await seedMembership(
    ORG_MEMBER,
    ORG_A,
    'org_member',
  );

  /*
   * Organization B membership.
   *
   * This user represents a user from another tenant.
   */
  await seedMembership(
    OUTSIDER,
    ORG_B,
    'org_member',
  );

  /*
   * Platform administrator.
   *
   * Existing firestore.rules determines platform admin
   * status from:
   *
   * users/{uid}.role == "admin"
   */
  await seedPlatformAdmin();

  /*
   * Organization A applications
   */
  await seedApplication(
    ORG_A,
    'test-center',
    'active',
  );

  await seedApplication(
    ORG_A,
    'community',
    'selected',
  );

  await seedApplication(
    ORG_A,
    'knowledge',
    'provisioning',
  );

  await seedApplication(
    ORG_A,
    'jobs-training',
    'failed',
  );

  /*
   * Organization B application.
   *
   * Used for cross-tenant isolation tests.
   */
  await seedApplication(
    ORG_B,
    'test-center',
    'active',
  );
});

// ============================================================
// CLEANUP
// ============================================================

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

// ============================================================
// ORGANIZATION APPLICATION AUTHORIZATION
// ============================================================

describe(
  'organization application authorization',
  () => {

    // ----------------------------------------------------------
    // READ ACCESS
    // ----------------------------------------------------------

    it(
      'allows a platform admin to read an organization application',
      async () => {
        const db = authenticatedDb(
          PLATFORM_ADMIN,
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'test-center',
              ),
            ),
          ),
        );
      },
    );

    it(
      'allows an organization member to read an active application',
      async () => {
        const db = authenticatedDb(
          ORG_MEMBER,
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'test-center',
              ),
            ),
          ),
        );
      },
    );

    it(
      'denies an organization member from reading a selected application',
      async () => {
        const db = authenticatedDb(
          ORG_MEMBER,
        );

        await assertFails(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'community',
              ),
            ),
          ),
        );
      },
    );

    it(
      'allows an organization admin to read a selected application',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'community',
              ),
            ),
          ),
        );
      },
    );

    it(
      'allows an organization admin to read a failed application',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'jobs-training',
              ),
            ),
          ),
        );
      },
    );

    it(
      'denies an organization member from reading another organization application',
      async () => {
        const db = authenticatedDb(
          ORG_MEMBER,
        );

        await assertFails(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_B,
                'test-center',
              ),
            ),
          ),
        );
      },
    );

    it(
      'denies an unauthenticated user from reading an application',
      async () => {
        const db = unauthenticatedDb();

        await assertFails(
          getDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'test-center',
              ),
            ),
          ),
        );
      },
    );

    // ----------------------------------------------------------
    // CREATE ACCESS
    // ----------------------------------------------------------

    it(
      'allows an organization admin to create a selected application',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertSucceeds(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'mailbox',
              ),
            ),
            {
              applicationId: 'mailbox',
              organizationId: ORG_A,
              status: 'selected',
              version: 1,
              provisioningStrategy: 'default',
            },
          ),
        );
      },
    );

    it(
      'denies an organization admin from creating an active application',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertFails(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'cyber-range',
              ),
            ),
            {
              applicationId: 'cyber-range',
              organizationId: ORG_A,
              status: 'active',
              version: 1,
              provisioningStrategy: 'custom',
            },
          ),
        );
      },
    );

    it(
      'denies an organization member from creating an application',
      async () => {
        const db = authenticatedDb(
          ORG_MEMBER,
        );

        await assertFails(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'mailbox',
              ),
            ),
            {
              applicationId: 'mailbox',
              organizationId: ORG_A,
              status: 'selected',
              version: 1,
              provisioningStrategy: 'default',
            },
          ),
        );
      },
    );

    it(
      'denies an organization manager from creating an application',
      async () => {
        const db = authenticatedDb(
          ORG_MANAGER,
        );

        await assertFails(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'mailbox',
              ),
            ),
            {
              applicationId: 'mailbox',
              organizationId: ORG_A,
              status: 'selected',
              version: 1,
              provisioningStrategy: 'default',
            },
          ),
        );
      },
    );

    it(
      'denies an organization staff member from creating an application',
      async () => {
        const db = authenticatedDb(
          ORG_STAFF,
        );

        await assertFails(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'mailbox',
              ),
            ),
            {
              applicationId: 'mailbox',
              organizationId: ORG_A,
              status: 'selected',
              version: 1,
              provisioningStrategy: 'default',
            },
          ),
        );
      },
    );

    it(
      'allows a platform admin to create an active application',
      async () => {
        const db = authenticatedDb(
          PLATFORM_ADMIN,
        );

        await assertSucceeds(
          setDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'cyber-range',
              ),
            ),
            {
              applicationId: 'cyber-range',
              organizationId: ORG_A,
              status: 'active',
              version: 1,
              provisioningStrategy: 'custom',
            },
          ),
        );
      },
    );

    // ----------------------------------------------------------
    // UPDATE ACCESS
    // ----------------------------------------------------------

    it(
      'denies an organization admin from changing application identity',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertFails(
          updateDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'community',
              ),
            ),
            {
              applicationId:
                'different-application',
            },
          ),
        );
      },
    );

    it(
      'denies an organization admin from moving an application to another organization',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertFails(
          updateDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'community',
              ),
            ),
            {
              organizationId: ORG_B,
            },
          ),
        );
      },
    );

    it(
      'allows a platform admin to update an application to active',
      async () => {
        const db = authenticatedDb(
          PLATFORM_ADMIN,
        );

        await assertSucceeds(
          updateDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'knowledge',
              ),
            ),
            {
              status: 'active',
            },
          ),
        );
      },
    );

    it(
      'allows a platform admin to suspend an active application',
      async () => {
        const db = authenticatedDb(
          PLATFORM_ADMIN,
        );

        await assertSucceeds(
          updateDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'test-center',
              ),
            ),
            {
              status: 'suspended',
            },
          ),
        );
      },
    );

    // ----------------------------------------------------------
    // DELETE ACCESS
    // ----------------------------------------------------------

    it(
      'denies an organization member from deleting an application',
      async () => {
        const db = authenticatedDb(
          ORG_MEMBER,
        );

        await assertFails(
          deleteDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'test-center',
              ),
            ),
          ),
        );
      },
    );

    it(
      'allows an organization admin to delete an application',
      async () => {
        const db = authenticatedDb(
          ORG_ADMIN,
        );

        await assertSucceeds(
          deleteDoc(
            doc(
              db,
              organizationApplicationPath(
                ORG_A,
                'community',
              ),
            ),
          ),
        );
      },
    );
  },
);