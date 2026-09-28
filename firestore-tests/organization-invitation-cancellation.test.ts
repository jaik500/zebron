import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import fs from "node:fs";

import {
  deleteApp,
  getApps,
  initializeApp,
} from "../functions/node_modules/firebase-admin/lib/app";

import {
  cancelOrganizationInvitation,
} from "../functions/src/organization-invitation-cancellation";

describe(
  "Zebron Organization Invitation Cancellation",
  () => {
    let testEnv: RulesTestEnvironment;

    const PROJECT_ID =
      "zebron-organization-invitation-test";

    const USER_ID =
      "user-inviter-test";

    const USER_EMAIL =
      "admin@example.com";

    const ORGANIZATION_ID =
      "organization-test-001";

    const INVITATION_ID =
      "invitation-test-001";

    beforeAll(async () => {
      process.env.FIRESTORE_EMULATOR_HOST =
        "127.0.0.1:8080";

      if (getApps().length === 0) {
        initializeApp({
          projectId: PROJECT_ID,
        });
      }

      testEnv =
        await initializeTestEnvironment({
          projectId: PROJECT_ID,

          firestore: {
            host: "127.0.0.1",
            port: 8080,
            rules: fs.readFileSync(
              "firestore.rules",
              "utf8",
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

              name: "Test Organization",

              status:
                options.status ?? "active",

              active:
                options.active ?? true,

              verified: true,

              createdAt:
                Timestamp.fromDate(
                  new Date(
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),

              updatedAt:
                Timestamp.fromDate(
                  new Date(
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),
            },
          );
        },
      );
    }

    async function seedMembership(
      options: {
        role?: string;
        active?: boolean;
      } = {},
    ): Promise<void> {
      const membershipId =
        `${USER_ID}_${ORGANIZATION_ID}`;

      await testEnv.withSecurityRulesDisabled(
        async (context) => {
          await setDoc(
            doc(
              context.firestore(),
              `organizationMemberships/${membershipId}`,
            ),
            {
              id: membershipId,

              userId: USER_ID,

              organizationId:
                ORGANIZATION_ID,

              role:
                options.role ?? "org_admin",

              active:
                options.active ?? true,

              createdAt:
                Timestamp.fromDate(
                  new Date(
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),

              updatedAt:
                Timestamp.fromDate(
                  new Date(
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),
            },
          );
        },
      );
    }

    async function seedInvitation(
      options: {
        status?: string;
        email?: string;
        role?: string;
        expiresAt?: Date;
      } = {},
    ): Promise<void> {
      await testEnv.withSecurityRulesDisabled(
        async (context) => {
          await setDoc(
            doc(
              context.firestore(),
              `organizationInvitations/${INVITATION_ID}`,
            ),
            {
              id: INVITATION_ID,

              organizationId:
                ORGANIZATION_ID,

              email:
                options.email ??
                "member@example.com",

              normalizedEmail:
                (
                  options.email ??
                  "member@example.com"
                )
                  .trim()
                  .toLowerCase(),

              role:
                options.role ??
                "org_member",

              status:
                options.status ??
                "pending",

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
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),

              createdByUserId:
                USER_ID,

              updatedAt:
                Timestamp.fromDate(
                  new Date(
                    "2026-09-20T00:00:00.000Z",
                  ),
                ),
            },
          );
        },
      );
    }

    // -------------------------------------------------------------------------
    // REQUEST HELPERS
    // -------------------------------------------------------------------------

    function createDecodedIdToken(
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
            email: [USER_EMAIL],
          },

          sign_in_provider: "password",
        },

        iat: now,

        iss:
          `https://securetoken.google.com/${PROJECT_ID}`,

        sub: USER_ID,

        uid: USER_ID,

        email: USER_EMAIL,

        email_verified: true,

        name: "Test User",

        ...(platformAdmin
          ? {
              platformAdmin: true,
            }
          : {}),
      };
    }

    function createRequest(
      options: {
        authenticated?: boolean;
        platformAdmin?: boolean;
      } = {},
    ) {
      const authenticated =
        options.authenticated ?? true;

      if (!authenticated) {
        return {
          data: {
            invitationId:
              INVITATION_ID,
          },

          auth: undefined,

          instanceIdToken: undefined,

          acceptsStreaming: false,

          rawRequest: {} as never,
        };
      }

      return {
        data: {
          invitationId:
            INVITATION_ID,
        },

        auth: {
          uid: USER_ID,

          token:
            createDecodedIdToken(
              options.platformAdmin ??
                false,
            ),

          rawToken:
            "test-auth-token",
        },

        instanceIdToken: undefined,

        acceptsStreaming: false,

        rawRequest: {} as never,
      };
    }

    async function invokeCancellation(
      options: {
        authenticated?: boolean;
        platformAdmin?: boolean;
      } = {},
    ) {
      return cancelOrganizationInvitation.run(
        createRequest(options),
      );
    }

    // -------------------------------------------------------------------------
    // SUCCESSFUL CANCELLATION
    // -------------------------------------------------------------------------

    describe(
      "cancel invitation",
      () => {
        it(
          "cancels a valid pending invitation",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            const result =
              await invokeCancellation();

            expect(result).toEqual({
              success: true,

              invitationId:
                INVITATION_ID,

              organizationId:
                ORGANIZATION_ID,

              status:
                "cancelled",

              cancelledByUserId:
                USER_ID,
            });

            const db =
              testEnv
                .authenticatedContext(
                  USER_ID,
                )
                .firestore();

            const snapshot =
              await getDoc(
                doc(
                  db,
                  `organizationInvitations/${INVITATION_ID}`,
                ),
              );

            expect(
              snapshot.exists(),
            ).toBe(true);

            expect(
              snapshot.data(),
            ).toMatchObject({
              id:
                INVITATION_ID,

              organizationId:
                ORGANIZATION_ID,

              status:
                "cancelled",

              cancelledByUserId:
                USER_ID,
            });

            expect(
              snapshot.data()?.cancelledAt,
            ).toBeTruthy();

            expect(
              snapshot.data()?.updatedAt,
            ).toBeTruthy();
          },
        );
      },
    );

    // -------------------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------------------

    describe(
      "authentication",
      () => {
        it(
          "rejects an unauthenticated request",
          async () => {
            await expect(
              invokeCancellation({
                authenticated: false,
              }),
            ).rejects.toThrow(
              "You must be signed in to cancel an organization invitation.",
            );
          },
        );

        it(
          "rejects a missing invitation ID",
          async () => {
            await expect(
              cancelOrganizationInvitation.run({
                data: {},

                auth: {
                  uid: USER_ID,

                  token:
                    createDecodedIdToken(),

                  rawToken:
                    "test-auth-token",
                },

                instanceIdToken:
                  undefined,

                acceptsStreaming:
                  false,

                rawRequest:
                  {} as never,
              }),
            ).rejects.toThrow(
              "invitationId is required.",
            );
          },
        );
      },
    );

    // -------------------------------------------------------------------------
    // INVITATION VALIDATION
    // -------------------------------------------------------------------------

    describe(
      "invitation validation",
      () => {
        it(
          "rejects a nonexistent invitation",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "The organization invitation could not be found.",
            );
          },
        );

        it(
          "rejects an already accepted invitation",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation({
              status: "accepted",
            });

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "Only pending organization invitations can be cancelled.",
            );
          },
        );

        it(
          "rejects an already cancelled invitation",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation({
              status: "cancelled",
            });

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "Only pending organization invitations can be cancelled.",
            );
          },
        );

        it(
          "rejects an expired invitation",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation({
              expiresAt:
                new Date(
                  Date.now() - 60_000,
                ),
            });

            /*
             * Cancellation is a state-management operation.
             *
             * Expiration is handled by the invitation lifecycle itself.
             * Therefore the cancellation callable intentionally only requires
             * the invitation to still be pending.
             */

            const result =
              await invokeCancellation();

            expect(result.status).toBe(
              "cancelled",
            );
          },
        );
      },
    );

    // -------------------------------------------------------------------------
    // AUTHORIZATION
    // -------------------------------------------------------------------------

    describe(
      "authorization",
      () => {
        it.each([
          "org_owner",
          "org_admin",
          "org_manager",
        ])(
          "allows %s to cancel an invitation",
          async (role) => {
            await seedOrganization();

            await seedMembership({
              role,
            });

            await seedInvitation();

            const result =
              await invokeCancellation();

            expect(result.success).toBe(
              true,
            );

            expect(result.status).toBe(
              "cancelled",
            );
          },
        );

        it.each([
          "org_staff",
          "org_member",
        ])(
          "rejects %s from cancelling an invitation",
          async (role) => {
            await seedOrganization();

            await seedMembership({
              role,
            });

            await seedInvitation();

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "You do not have permission to cancel invitations for this org.",
            );
          },
        );

        it(
          "rejects a user with no organization membership",
          async () => {
            await seedOrganization();

            await seedInvitation();

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "You do not have permission to cancel invitations for this org.",
            );
          },
        );

        it(
          "rejects an inactive organization membership",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
              active: false,
            });

            await seedInvitation();

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "You do not have permission to cancel invitations for this org.",
            );
          },
        );

        it(
          "allows a platform admin to cancel an invitation without organization membership",
          async () => {
            await seedOrganization();

            await seedInvitation();

            const result =
              await invokeCancellation({
                platformAdmin: true,
              });

            expect(result.success).toBe(
              true,
            );

            expect(
              result.cancelledByUserId,
            ).toBe(USER_ID);
          },
        );
      },
    );

    // -------------------------------------------------------------------------
    // ORGANIZATION LIFECYCLE
    // -------------------------------------------------------------------------

    describe(
      "organization lifecycle",
      () => {
        it(
          "allows cancellation during onboarding",
          async () => {
            await seedOrganization({
              status: "onboarding",
            });

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            const result =
              await invokeCancellation();

            expect(result.success).toBe(
              true,
            );
          },
        );

        it(
          "allows cancellation while active",
          async () => {
            await seedOrganization({
              status: "active",
            });

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            const result =
              await invokeCancellation();

            expect(result.success).toBe(
              true,
            );
          },
        );

        it(
          "rejects cancellation for an inactive organization",
          async () => {
            await seedOrganization({
              active: false,
            });

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "This organization is not currently active.",
            );
          },
        );

        it.each([
          "pending",
          "provisioning",
          "suspended",
          "archived",
        ])(
          "rejects cancellation when organization status is %s",
          async (status) => {
            await seedOrganization({
              status,
            });

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "This organization is not currently eligible for invitation mgmt.",
            );
          },
        );
      },
    );

    // -------------------------------------------------------------------------
    // STATE TRANSITION
    // -------------------------------------------------------------------------

    describe(
      "state transition",
      () => {
        it(
          "cannot cancel the same invitation twice",
          async () => {
            await seedOrganization();

            await seedMembership({
              role: "org_admin",
            });

            await seedInvitation();

            const firstResult =
              await invokeCancellation();

            expect(firstResult.status).toBe(
              "cancelled",
            );

            await expect(
              invokeCancellation(),
            ).rejects.toThrow(
              "Only pending organization invitations can be cancelled.",
            );
          },
        );
      },
    );
  },
);