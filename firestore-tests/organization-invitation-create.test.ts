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
  addDoc,
  collection,
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

import {
  createOrganizationInvitation,
} from '../functions/src/organization-invitation-create';

describe('Zebron Organization Invitation Creation', () => {
  let testEnv: RulesTestEnvironment;

  const PROJECT_ID =
    'zebron-organization-invitation-test';

  const ORGANIZATION_ID =
    'organization-test-001';

  const INVITER_USER_ID =
    'user-inviter-test';

  const INVITER_EMAIL =
    'admin@example.com';

  const INVITEE_EMAIL =
    'member@example.com';

  const INVITEE_EMAIL_UPPERCASE =
    'Member@Example.COM';

  const INVITATION_ID_PREFIX =
    'organizationInvitations/';

  // -------------------------------------------------------------------------
  // TEST ENVIRONMENT
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    process.env.FIRESTORE_EMULATOR_HOST =
      '127.0.0.1:8080';

    /*
     * IMPORTANT:
     *
     * The callable is loaded from ../functions and uses the Firebase Admin
     * SDK installed under functions/node_modules.
     *
     * Initialize that exact Admin SDK instance so getFirestore() inside
     * organization-invitation-create.ts sees the default app.
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
    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `organizations/${ORGANIZATION_ID}`,
          ),
          {
            id: ORGANIZATION_ID,

            name: 'Test Organization',

            status:
              options.status ?? 'active',

            active:
              options.active ?? true,

            verified: true,

            createdAt:
              Timestamp.fromDate(
                new Date(
                  '2026-09-20T00:00:00.000Z',
                ),
              ),

            updatedAt:
              Timestamp.fromDate(
                new Date(
                  '2026-09-20T00:00:00.000Z',
                ),
              ),
          },
        );
      },
    );
  }

  async function seedMembership(
    options: {
      userId?: string;
      role?: string;
      active?: boolean;
    } = {},
  ): Promise<void> {
    const userId =
      options.userId ??
      INVITER_USER_ID;

    const membershipId =
      `${userId}_${ORGANIZATION_ID}`;

    await testEnv.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(
            context.firestore(),
            `organizationMemberships/${membershipId}`,
          ),
          {
            id: membershipId,

            userId,

            organizationId:
              ORGANIZATION_ID,

            role:
              options.role ?? 'org_admin',

            active:
              options.active ?? true,

            createdAt:
              Timestamp.fromDate(
                new Date(
                  '2026-09-20T00:00:00.000Z',
                ),
              ),

            updatedAt:
              Timestamp.fromDate(
                new Date(
                  '2026-09-20T00:00:00.000Z',
                ),
              ),
          },
        );
      },
    );
  }

async function seedInvitation(
  options: {
    email?: string;
    role?: string;
    status?: string;
    expiresAt?: Date;
  } = {},
): Promise<string> {
  let invitationId = '';

  await testEnv.withSecurityRulesDisabled(
    async (context) => {
      const invitationsRef = collection(
        context.firestore(),
        'organizationInvitations',
      );

      const invitationRef = await addDoc(
        invitationsRef,
        {
          organizationId:
            ORGANIZATION_ID,

          email:
            options.email ?? INVITEE_EMAIL,

          normalizedEmail:
            (
              options.email ??
              INVITEE_EMAIL
            )
              .trim()
              .toLowerCase(),

          role:
            options.role ?? 'org_member',

          status:
            options.status ?? 'pending',

          expiresAt:
            Timestamp.fromDate(
              options.expiresAt ??
                new Date(
                  Date.now() +
                    24 *
                      60 *
                      60 *
                      1000,
                ),
            ),

          createdAt:
            Timestamp.fromDate(
              new Date(
                '2026-09-20T00:00:00.000Z',
              ),
            ),

          createdByUserId:
            INVITER_USER_ID,

          updatedAt:
            Timestamp.fromDate(
              new Date(
                '2026-09-20T00:00:00.000Z',
              ),
            ),
        },
      );

      invitationId =
        invitationRef.id;

      /*
       * Keep the document's id field consistent
       * with the Firestore document ID.
       */
      await setDoc(
        invitationRef,
        {
          id: invitationId,
        },
        {
          merge: true,
        },
      );
    },
  );

  return invitationId;
}

  // -------------------------------------------------------------------------
  // CALLABLE REQUEST HELPERS
  // -------------------------------------------------------------------------

  function createDecodedIdToken(
    email = INVITER_EMAIL,
    platformAdmin = false,
  ) {
    const now =
      Math.floor(Date.now() / 1000);

    return {
      aud: PROJECT_ID,

      auth_time: now,

      exp: now + 3600,

      firebase: {
        identities: {
          email: [email],
        },

        sign_in_provider: 'password',
      },

      iat: now,

      iss:
        `https://securetoken.google.com/${PROJECT_ID}`,

      sub: INVITER_USER_ID,

      uid: INVITER_USER_ID,

      email,

      email_verified: true,

      name: 'Test Inviter',

      ...(platformAdmin
        ? {
            platformAdmin: true,
          }
        : {}),
    };
  }

  function createRequest(
    data: {
      organizationId?: string;
      email?: string;
      role?: string;
    },
    options: {
      authenticated?: boolean;
      platformAdmin?: boolean;
      email?: string;
    } = {},
  ) {
    const authenticated =
      options.authenticated ?? true;

    if (!authenticated) {
      return {
        data,

        auth: undefined,

        instanceIdToken: undefined,

        acceptsStreaming: false,

        rawRequest: {} as never,
      };
    }

    return {
      data,

      auth: {
        uid: INVITER_USER_ID,

        token:
          createDecodedIdToken(
            options.email ??
              INVITER_EMAIL,
            options.platformAdmin ??
              false,
          ),

        rawToken:
          'test-auth-token',
      },

      instanceIdToken: undefined,

      acceptsStreaming: false,

      rawRequest: {} as never,
    };
  }

  async function invokeCreate(
    options: {
      organizationId?: string;
      email?: string;
      role?: string;
      platformAdmin?: boolean;
      authenticated?: boolean;
      authEmail?: string;
    } = {},
  ) {
    return createOrganizationInvitation.run(
      createRequest(
        {
          organizationId:
            options.organizationId ??
            ORGANIZATION_ID,

          email:
            options.email ??
            INVITEE_EMAIL,

          role:
            options.role ??
            'org_member',
        },
        {
          authenticated:
            options.authenticated ??
            true,

          platformAdmin:
            options.platformAdmin ??
            false,

          email:
            options.authEmail ??
            INVITER_EMAIL,
        },
      ),
    );
  }

  // -------------------------------------------------------------------------
  // SUCCESSFUL INVITATION CREATION
  // -------------------------------------------------------------------------

  describe('create invitation', () => {
    it('creates a valid organization invitation', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(true);

      expect(result.organizationId).toBe(
        ORGANIZATION_ID,
      );

      expect(result.email).toBe(
        INVITEE_EMAIL,
      );

      expect(result.normalizedEmail).toBe(
        INVITEE_EMAIL,
      );

      expect(result.role).toBe(
        'org_member',
      );

      expect(result.status).toBe(
        'pending',
      );

      expect(result.createdByUserId).toBe(
        INVITER_USER_ID,
      );

      expect(result.invitationId).toMatch(
        /^[A-Za-z0-9_-]+$/,
      );

      expect(
        result.expiresAt,
      ).toBeTruthy();

      const db =
        testEnv
          .authenticatedContext(
            INVITER_USER_ID,
          )
          .firestore();

      /*
       * The exact invitation ID is returned by the callable.
       */
      const invitationSnapshot =
        await getDoc(
          doc(
            db,
            `${INVITATION_ID_PREFIX}${result.invitationId}`,
          ),
        );

      expect(
        invitationSnapshot.exists(),
      ).toBe(true);

      expect(
        invitationSnapshot.data(),
      ).toMatchObject({
        id: result.invitationId,

        organizationId:
          ORGANIZATION_ID,

        email:
          INVITEE_EMAIL,

        normalizedEmail:
          INVITEE_EMAIL,

        role:
          'org_member',

        status:
          'pending',

        createdByUserId:
          INVITER_USER_ID,
      });

      expect(
        invitationSnapshot.data()
          ?.expiresAt,
      ).toBeTruthy();
    });

    it('normalizes the invitee email address', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      const result =
        await invokeCreate({
          email:
            INVITEE_EMAIL_UPPERCASE,
        });

      expect(result.email).toBe(
        INVITEE_EMAIL_UPPERCASE,
      );

      expect(
        result.normalizedEmail,
      ).toBe(
        'member@example.com',
      );

      const db =
        testEnv
          .authenticatedContext(
            INVITER_USER_ID,
          )
          .firestore();

      const invitationSnapshot =
        await getDoc(
          doc(
            db,
            `${INVITATION_ID_PREFIX}${result.invitationId}`,
          ),
        );

      expect(
        invitationSnapshot.data(),
      ).toMatchObject({
        email:
          INVITEE_EMAIL_UPPERCASE,

        normalizedEmail:
          'member@example.com',
      });
    });
  });

  // -------------------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------------------

  describe('authentication', () => {
    it('rejects an unauthenticated request', async () => {
      await expect(
        invokeCreate({
          authenticated: false,
        }),
      ).rejects.toThrow(
        'You must be signed in to create an organization invitation.',
      );
    });
  });

  // -------------------------------------------------------------------------
  // ORGANIZATION AUTHORIZATION
  // -------------------------------------------------------------------------

  describe('organization authorization', () => {
    it.each([
      'org_owner',
      'org_admin',
      'org_manager',
    ])(
      'allows %s to create an invitation',
      async (role) => {
        await seedOrganization();

        await seedMembership({
          role,
        });

        const result =
          await invokeCreate();

        expect(result.success).toBe(
          true,
        );

        expect(result.role).toBe(
          'org_member',
        );
      },
    );

    it.each([
      'org_staff',
      'org_member',
    ])(
      'rejects %s from creating an invitation',
      async (role) => {
        await seedOrganization();

        await seedMembership({
          role,
        });

        await expect(
          invokeCreate(),
        ).rejects.toThrow(
          'You do not have permission to invite users to this organization.',
        );
      },
    );

    it('allows a platform admin to create an invitation without organization membership', async () => {
      await seedOrganization();

      const result =
        await invokeCreate({
          platformAdmin: true,
        });

      expect(result.success).toBe(
        true,
      );

      expect(result.createdByUserId).toBe(
        INVITER_USER_ID,
      );
    });

    it('rejects an authenticated user with no organization membership', async () => {
      await seedOrganization();

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        'You do not have permission to invite users to this organization.',
      );
    });

    it('rejects an inactive organization membership', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
        active: false,
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        'You do not have permission to invite users to this organization.',
      );
    });
  });

  // -------------------------------------------------------------------------
  // ARGUMENT VALIDATION
  // -------------------------------------------------------------------------

  describe('argument validation', () => {
    it('rejects a missing organization ID', async () => {
      await expect(
        invokeCreate({
          organizationId: '',
        }),
      ).rejects.toThrow(
        'organizationId is required.',
      );
    });

    it('rejects a missing email', async () => {
      await expect(
        invokeCreate({
          email: '',
        }),
      ).rejects.toThrow(
        'email is required.',
      );
    });

    it('rejects an invalid email address', async () => {
      await expect(
        invokeCreate({
          email: 'not-an-email',
        }),
      ).rejects.toThrow(
        'A valid email address is required.',
      );
    });

    it('rejects a missing role', async () => {
      await expect(
        invokeCreate({
          role: '',
        }),
      ).rejects.toThrow(
        'role is required.',
      );
    });

it('rejects an invalid organization role', async () => {
  await expect(
    invokeCreate({
      role: 'administrator',
    }),
  ).rejects.toThrow(
    'The requested organization role cannot be assigned through an invite.',
  );
});

it('rejects an org_owner invitation role', async () => {
  await expect(
    invokeCreate({
      role: 'org_owner',
    }),
  ).rejects.toThrow(
    'The requested organization role cannot be assigned through an invite.',
  );
});

    it('rejects an org_owner invitation role', async () => {
      await expect(
        invokeCreate({
          role: 'org_owner',
        }),
      ).rejects.toThrow(
        'The requested organization role cannot be assigned through an invite.',
      );
    });
  });

  // -------------------------------------------------------------------------
  // ORGANIZATION LIFECYCLE
  // -------------------------------------------------------------------------

  describe('organization lifecycle', () => {
    it('allows invitations while organization is onboarding', async () => {
      await seedOrganization({
        status: 'onboarding',
      });

      await seedMembership({
        role: 'org_admin',
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(
        true,
      );
    });

    it('allows invitations while organization is active', async () => {
      await seedOrganization({
        status: 'active',
      });

      await seedMembership({
        role: 'org_admin',
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(
        true,
      );
    });

    it('rejects a nonexistent organization', async () => {
      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate({
          organizationId:
            'does-not-exist',
        }),
      ).rejects.toThrow(
        'The organization could not be found.',
      );
    });

    it('rejects a suspended organization', async () => {
      await seedOrganization({
        status: 'suspended',
      });

      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        "This organization isn't currently eligible to accept new members.",
      );
    });

    it('rejects an archived organization', async () => {
      await seedOrganization({
        status: 'archived',
      });

      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        "This organization isn't currently eligible to accept new members.",
      );
    });

    it('rejects an inactive organization', async () => {
      await seedOrganization({
        active: false,
      });

      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        'This organization is not currently active.',
      );
    });

    it('rejects a pending organization', async () => {
      await seedOrganization({
        status: 'pending',
      });

      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
       "This organization isn't currently eligible to accept new members.",
      );
    });

    it('rejects a provisioning organization', async () => {
      await seedOrganization({
        status: 'provisioning',
      });

      await seedMembership({
        role: 'org_admin',
      });

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        "This organization isn't currently eligible to accept new members.",
      );
    });
  });

  // -------------------------------------------------------------------------
  // DUPLICATE INVITATIONS
  // -------------------------------------------------------------------------

  describe('duplicate invitations', () => {
    it('rejects a duplicate pending invitation', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      await invokeCreate();

      await expect(
        invokeCreate(),
      ).rejects.toThrow(
        'A pending invitation already exists for this email address.',
      );
    });

    it('allows a new invitation when the previous invitation has expired', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      await seedInvitation({
        expiresAt:
          new Date(
            Date.now() - 60_000,
          ),
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(
        true,
      );

      expect(result.status).toBe(
        'pending',
      );
    });

    it('allows a new invitation when the previous invitation was cancelled', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      await seedInvitation({
        status: 'cancelled',
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(
        true,
      );
    });

    it('allows a new invitation when the previous invitation was accepted', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      await seedInvitation({
        status: 'accepted',
      });

      const result =
        await invokeCreate();

      expect(result.success).toBe(
        true,
      );
    });
  });

  // -------------------------------------------------------------------------
  // INVITABLE ROLES
  // -------------------------------------------------------------------------

  describe('invitable organization roles', () => {
    it.each([
      'org_admin',
      'org_manager',
      'org_staff',
      'org_member',
    ])(
      'allows invitation role %s',
      async (role) => {
        await seedOrganization();

        await seedMembership({
          role: 'org_admin',
        });

        const result =
          await invokeCreate({
            role,
          });

        expect(result.success).toBe(
          true,
        );

        expect(result.role).toBe(
          role,
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  // DETERMINISTIC INVITATION DATA
  // -------------------------------------------------------------------------

  describe('invitation data', () => {
    it('stores the inviter user ID', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_manager',
      });

      const result =
        await invokeCreate();

      expect(
        result.createdByUserId,
      ).toBe(INVITER_USER_ID);

      const db =
        testEnv
          .authenticatedContext(
            INVITER_USER_ID,
          )
          .firestore();

      const invitationSnapshot =
        await getDoc(
          doc(
            db,
            `${INVITATION_ID_PREFIX}${result.invitationId}`,
          ),
        );

      expect(
        invitationSnapshot.data()
          ?.createdByUserId,
      ).toBe(INVITER_USER_ID);
    });

    it('creates a seven-day invitation expiration window', async () => {
      await seedOrganization();

      await seedMembership({
        role: 'org_admin',
      });

      const before =
        Date.now();

      const result =
        await invokeCreate();

      const after =
        Date.now();

      const expiresAt =
        new Date(result.expiresAt).getTime();

      const sevenDays =
        7 *
        24 *
        60 *
        60 *
        1000;

      expect(expiresAt).toBeGreaterThanOrEqual(
        before + sevenDays,
      );

      expect(expiresAt).toBeLessThanOrEqual(
        after + sevenDays,
      );
    });
  });
});