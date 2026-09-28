import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import fs from 'node:fs';

import {
  deleteApp,
  getApps,
  initializeApp,
} from '../functions/node_modules/firebase-admin/lib/app';

import { acceptOrganizationInvitation } from '../functions/src/organization-invitation-acceptance';

describe('Zebron Organization Invitation Acceptance', () => {
  let testEnv: RulesTestEnvironment;

  const PROJECT_ID = 'zebron-organization-invitation-test';

  const USER_ID = 'user-invitation-test';

  const USER_EMAIL = 'member@example.com';

  const ORGANIZATION_ID = 'organization-test-001';

  const INVITATION_ID = 'invitation-test-001';

  // -------------------------------------------------------------------------
  // TEST ENVIRONMENT
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

    /*
     * IMPORTANT:
     *
     * The callable is loaded from ../functions and uses the Firebase Admin
     * SDK installed under functions/node_modules.
     *
     * Initialize that exact Admin SDK instance so getFirestore() inside
     * organization-invitation-acceptance.ts sees the default app.
     */
    if (getApps().length === 0) {
      initializeApp({
        projectId: PROJECT_ID,
      });
    }

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();

    const apps = getApps();

    await Promise.all(
      apps.map((app) => deleteApp(app)),
    );
  });
  // -------------------------------------------------------------------------
  // SEED HELPERS
  // -------------------------------------------------------------------------

  async function seedOrganization(
    options: {
      status?: string;
      active?: boolean;
    } = {},
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `organizations/${ORGANIZATION_ID}`), {
        id: ORGANIZATION_ID,

        name: 'Test Organization',

        status: options.status ?? 'active',

        active: options.active ?? true,

        verified: true,

        createdAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),

        updatedAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),
      });
    });
  }

  async function seedInvitation(
    options: {
      status?: string;
      email?: string;
      role?: string;
      expiresAt?: Date;
    } = {},
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `organizationInvitations/${INVITATION_ID}`), {
        id: INVITATION_ID,

        organizationId: ORGANIZATION_ID,

        normalizedEmail: options.email ?? USER_EMAIL,

        role: options.role ?? 'org_member',

        status: options.status ?? 'pending',

        expiresAt: Timestamp.fromDate(
          options.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        ),

        createdAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),

        updatedAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),
      });
    });
  }

  async function seedMembership(
    options: {
      active?: boolean;
      role?: string;
    } = {},
  ): Promise<void> {
    const membershipId = `${USER_ID}_${ORGANIZATION_ID}`;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `organizationMemberships/${membershipId}`), {
        id: membershipId,

        userId: USER_ID,

        organizationId: ORGANIZATION_ID,

        role: options.role ?? 'org_member',

        active: options.active ?? true,

        createdAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),

        updatedAt: Timestamp.fromDate(new Date('2026-09-20T00:00:00.000Z')),
      });
    });
  }

  // -------------------------------------------------------------------------
  // CALLABLE REQUEST HELPERS
  // -------------------------------------------------------------------------

  /**
   * Creates the Firebase Functions v7 CallableRequest shape.
   *
   * Keeping this in one place prevents individual tests from having to
   * construct auth/rawToken/rawRequest repeatedly.
   */
  function createDecodedIdToken(email: string) {
    const now = Math.floor(Date.now() / 1000);

    return {
      aud: 'zebron-test-project',
      auth_time: now,
      exp: now + 3600,
      firebase: {
        identities: {
          email: [email],
        },
        sign_in_provider: 'password',
      },
      iat: now,
      iss: 'https://securetoken.google.com/zebron-test-project',
      sub: USER_ID,
      uid: USER_ID,
      email,
      email_verified: true,
      name: 'Test User',
    };
  }

  function createRequest(
    data: {
      invitationId?: string;
    },
    email = USER_EMAIL,
  ) {
    return {
      data,

      auth: {
        uid: USER_ID,
        token: createDecodedIdToken(email),
        rawToken: 'test-auth-token',
      },

      instanceIdToken: undefined,
      acceptsStreaming: false,
      rawRequest: {} as never,
    };
  }

  function createAuthenticatedRequest(email = USER_EMAIL) {
    return createRequest(
      {
        invitationId: INVITATION_ID,
      },
      email,
    );
  }

  function createUnauthenticatedRequest() {
    return {
      data: {
        invitationId: INVITATION_ID,
      },

      auth: undefined,
      instanceIdToken: undefined,
      acceptsStreaming: false,
      rawRequest: {} as never,
    };
  }

  async function invokeAcceptance(email = USER_EMAIL) {
    return acceptOrganizationInvitation.run(createAuthenticatedRequest(email));
  }

  async function invokeUnauthenticatedAcceptance() {
    return acceptOrganizationInvitation.run(createUnauthenticatedRequest());
  }

  // -------------------------------------------------------------------------
  // ACCEPTANCE TESTS
  // -------------------------------------------------------------------------

  describe('accept invitation', () => {
    it('accepts a valid organization invitation', async () => {
      await seedOrganization();

      await seedInvitation();

      const result = await invokeAcceptance();

      expect(result).toEqual({
        success: true,

        invitationId: INVITATION_ID,

        organizationId: ORGANIZATION_ID,

        membershipId: `${USER_ID}_${ORGANIZATION_ID}`,

        role: 'org_member',
      });

      const db = testEnv.authenticatedContext(USER_ID).firestore();

      // ---------------------------------------------------------------
      // Verify membership
      // ---------------------------------------------------------------

      const membershipSnapshot = await getDoc(
        doc(db, `organizationMemberships/${USER_ID}_${ORGANIZATION_ID}`),
      );

      expect(membershipSnapshot.exists()).toBe(true);

      expect(membershipSnapshot.data()).toMatchObject({
        id: `${USER_ID}_${ORGANIZATION_ID}`,

        userId: USER_ID,

        organizationId: ORGANIZATION_ID,

        role: 'org_member',

        active: true,
      });

      // ---------------------------------------------------------------
      // Verify invitation
      // ---------------------------------------------------------------

      const invitationSnapshot = await getDoc(doc(db, `organizationInvitations/${INVITATION_ID}`));

      expect(invitationSnapshot.exists()).toBe(true);

      expect(invitationSnapshot.data()).toMatchObject({
        status: 'accepted',

        acceptedByUserId: USER_ID,
      });
    });

    it('rejects an unauthenticated request', async () => {
      await seedOrganization();

      await seedInvitation();

      await expect(invokeUnauthenticatedAcceptance()).rejects.toThrow(
        'You must be signed in to accept an organization invitation.',
      );
    });

    it('rejects a missing invitation ID', async () => {
      await expect(acceptOrganizationInvitation.run(createRequest({}))).rejects.toThrow(
        'invitationId is required.',
      );
    });

    it('rejects a nonexistent invitation', async () => {
      await seedOrganization();

      await expect(
        acceptOrganizationInvitation.run(
          createRequest({
            invitationId: 'does-not-exist',
          }),
        ),
      ).rejects.toThrow('The organization invitation could not be found.');
    });

    it('rejects an invitation that is no longer pending', async () => {
      await seedOrganization();

      await seedInvitation({
        status: 'accepted',
      });

      await expect(invokeAcceptance()).rejects.toThrow(
        'This invitation is no longer pending and cannot be accepted.',
      );
    });

    it('rejects an expired invitation', async () => {
      await seedOrganization();

      await seedInvitation({
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(invokeAcceptance()).rejects.toThrow('This organization invitation has expired.');
    });

    it('rejects an invitation for a different email address', async () => {
      await seedOrganization();

      await seedInvitation();

      await expect(invokeAcceptance('different@example.com')).rejects.toThrow(
        'This invitation was issued to a different email address.',
      );
    });

    it('rejects a nonexistent organization', async () => {
      await seedInvitation();

      await expect(invokeAcceptance()).rejects.toThrow(
        'The organization associated with this invitation could not be found.',
      );
    });

    it('rejects a suspended organization', async () => {
      await seedOrganization({
        status: 'suspended',
      });

      await seedInvitation();

      await expect(invokeAcceptance()).rejects.toThrow(
        'This organization is not currently eligible to accept new members.',
      );
    });

    it('rejects an archived organization', async () => {
      await seedOrganization({
        status: 'archived',
      });

      await seedInvitation();

      await expect(invokeAcceptance()).rejects.toThrow(
        'This organization is not currently eligible to accept new members.',
      );
    });

    it('rejects an inactive organization', async () => {
      await seedOrganization({
        active: false,
      });

      await seedInvitation();

      await expect(invokeAcceptance()).rejects.toThrow(
        'This organization is not currently eligible to accept new members.',
      );
    });

    it('rejects an existing active membership', async () => {
      await seedOrganization();

      await seedInvitation();

      await seedMembership();

      await expect(invokeAcceptance()).rejects.toThrow(
        'You are already an active member of this organization.',
      );
    });

    it('rejects repeated acceptance of the same invitation', async () => {
  await seedOrganization();

  await seedInvitation();

  // First acceptance succeeds.
  const firstResult = await invokeAcceptance();

  expect(firstResult).toEqual({
    success: true,
    invitationId: INVITATION_ID,
    organizationId: ORGANIZATION_ID,
    membershipId: `${USER_ID}_${ORGANIZATION_ID}`,
    role: 'org_member',
  });

  // Second acceptance must fail because the invitation is no longer pending.
  await expect(invokeAcceptance()).rejects.toThrow(
    'This invitation is no longer pending and cannot be accepted.',
  );

  const db = testEnv.authenticatedContext(USER_ID).firestore();

  const membershipSnapshot = await getDoc(
    doc(
      db,
      `organizationMemberships/${USER_ID}_${ORGANIZATION_ID}`,
    ),
  );

  expect(membershipSnapshot.exists()).toBe(true);

  expect(membershipSnapshot.data()).toMatchObject({
    id: `${USER_ID}_${ORGANIZATION_ID}`,
    userId: USER_ID,
    organizationId: ORGANIZATION_ID,
    role: 'org_member',
    active: true,
  });
});


it('allows only one successful acceptance when two requests run concurrently', async () => {
  await seedOrganization();

  await seedInvitation();

  const results = await Promise.allSettled([
    invokeAcceptance(),
    invokeAcceptance(),
  ]);

  const fulfilled = results.filter(
    (result) => result.status === 'fulfilled',
  );

  const rejected = results.filter(
    (result) => result.status === 'rejected',
  );

  expect(fulfilled).toHaveLength(1);

  expect(rejected).toHaveLength(1);

  expect(
    fulfilled[0].status === 'fulfilled'
      ? fulfilled[0].value
      : undefined,
  ).toEqual({
    success: true,
    invitationId: INVITATION_ID,
    organizationId: ORGANIZATION_ID,
    membershipId: `${USER_ID}_${ORGANIZATION_ID}`,
    role: 'org_member',
  });

  const rejectionMessage =
    rejected[0].status === 'rejected'
      ? String(rejected[0].reason?.message ?? rejected[0].reason)
      : '';

  expect([
    'This invitation is no longer pending and cannot be accepted.',
    'A membership already exists for this organization and user.',
    'You are already an active member of this organization.',
  ]).toContain(rejectionMessage);

  const db = testEnv.authenticatedContext(USER_ID).firestore();

  const membershipSnapshot = await getDoc(
    doc(
      db,
      `organizationMemberships/${USER_ID}_${ORGANIZATION_ID}`,
    ),
  );

  expect(membershipSnapshot.exists()).toBe(true);

  expect(membershipSnapshot.data()).toMatchObject({
    id: `${USER_ID}_${ORGANIZATION_ID}`,
    userId: USER_ID,
    organizationId: ORGANIZATION_ID,
    role: 'org_member',
    active: true,
  });
});

    it('rejects an org_owner invitation', async () => {
      await seedOrganization();

      await seedInvitation({
        role: 'org_owner',
      });

      await expect(invokeAcceptance()).rejects.toThrow(
        'The invitation contains an invalid organization role.',
      );
    });
  });

  // -------------------------------------------------------------------------
  // ORGANIZATION ROLE TESTS
  // -------------------------------------------------------------------------

  describe('organization roles', () => {
    it.each(['org_admin', 'org_manager', 'org_staff', 'org_member'])(
      'creates a membership for role %s',
      async (role) => {
        await seedOrganization();

        await seedInvitation({
          role,
        });

        const result = await invokeAcceptance();

        expect(result.role).toBe(role);

        const db = testEnv.authenticatedContext(USER_ID).firestore();

        const membershipSnapshot = await getDoc(
          doc(db, `organizationMemberships/${USER_ID}_${ORGANIZATION_ID}`),
        );

        expect(membershipSnapshot.exists()).toBe(true);

        expect(membershipSnapshot.data()).toMatchObject({
          userId: USER_ID,

          organizationId: ORGANIZATION_ID,

          role,

          active: true,
        });
      },
    );
  });
});
