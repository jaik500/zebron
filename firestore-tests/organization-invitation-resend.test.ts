import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  deleteApp,
  getApps,
  initializeApp,
} from "../functions/node_modules/firebase-admin/lib/app";

import {
  getFirestore,
  Timestamp,
} from "../functions/node_modules/firebase-admin/lib/firestore";

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import fs from "node:fs";

import {
  resendOrganizationInvitation,
} from "../functions/src/organization-invitation-resend";

const PROJECT_ID = "zebron-test";

const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const TEST_ORGANIZATION_ID = "org-001";

const ORGANIZATION_NAME = "Test Organization";

const NOW = new Date("2026-09-28T12:00:00.000Z");

let testEnv: RulesTestEnvironment;

let adminApp: ReturnType<typeof initializeApp>;

let adminDb: ReturnType<typeof getFirestore>;

beforeAll(async () => {
  process.env.FIRESTORE_EMULATOR_HOST =
    FIRESTORE_EMULATOR_HOST;

  testEnv = await initializeTestEnvironment({
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

  const existingApps = getApps();

  adminApp =
    existingApps.length > 0
      ? existingApps[0]
      : initializeApp({
          projectId: PROJECT_ID,
        });

  adminDb = getFirestore(adminApp);
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();

  const apps = getApps();

  for (const app of apps) {
    await deleteApp(app);
  }
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function createAuth(
  uid: string,
  email = `${uid}@example.com`,
  claims: Record<string, unknown> = {},
) {
  const rawToken = "test-auth-token";

  return {
    uid,

    token: {
      aud: PROJECT_ID,
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,

      firebase: {
        identities: {
          email: [email],
        },
        sign_in_provider: "password",
      },

      iat: Math.floor(Date.now() / 1000),

      iss:
        `https://securetoken.google.com/${PROJECT_ID}`,

      sub: uid,
      uid,
      email,
      email_verified: true,
      name: "Test User",

      ...claims,
    },

    // Required by Firebase Functions AuthData.
    rawToken,
  };
}

function createCallableRequest(
  uid: string,
  email: string,
  data: Record<string, unknown> = {},
  claims: Record<string, unknown> = {},
) {
  const auth = createAuth(
    uid,
    email,
    claims,
  );

  return {
    data,

    auth,

    // The callable implementation does not use the raw HTTP request.
    // Firebase Functions types this as an Express Request, so the test
    // placeholder is intentionally cast to never.
    rawRequest: {} as never,

    acceptsStreaming: false,
  };
}

async function seedOrganization(
  overrides: Record<string, unknown> = {},
) {
  await adminDb
    .collection("organizations")
    .doc(TEST_ORGANIZATION_ID)
    .set({
      id: TEST_ORGANIZATION_ID,
      name: ORGANIZATION_NAME,
      status: "active",
      active: true,
      verified: true,
      ownerUserId: "owner-user",
      createdAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
      updatedAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
      ...overrides,
    });
}

async function seedMembership(
  uid: string,
  role: string,
  active = true,
) {
  await adminDb
    .collection("organizationMemberships")
    .doc(`${uid}_${TEST_ORGANIZATION_ID}`)
    .set({
      id: `${uid}_${TEST_ORGANIZATION_ID}`,
      userId: uid,
      organizationId: TEST_ORGANIZATION_ID,
      role,
      active,
      createdAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
      updatedAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
    });
}

async function seedInvitation(
  invitationId: string,
  overrides: Record<string, unknown> = {},
) {
  await adminDb
    .collection("organizationInvitations")
    .doc(invitationId)
    .set({
      id: invitationId,
      organizationId: TEST_ORGANIZATION_ID,
      email: "member@example.com",
      normalizedEmail: "member@example.com",
      role: "org_member",
      status: "pending",
      createdByUserId: "owner-user",

      expiresAt: Timestamp.fromDate(
        new Date("2026-10-05T12:00:00.000Z"),
      ),

      createdAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),

      updatedAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),

      ...overrides,
    });
}

async function getInvitation(
  invitationId: string,
) {
  return adminDb
    .collection("organizationInvitations")
    .doc(invitationId)
    .get();
}

async function getOrganizationEmailOutbox(
  invitationId: string,
) {
  return adminDb
    .collection("organizationEmailOutbox")
    .where("invitationId", "==", invitationId)
    .get();
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

describe("resendOrganizationInvitation", () => {
  describe("authentication", () => {
    it("rejects an unauthenticated request", async () => {
      await expect(
        resendOrganizationInvitation.run({
          data: {
            invitationId: "inv-001",
          },
          auth: undefined,
         rawRequest: {} as never,
          acceptsStreaming: false,
        }),
      ).rejects.toMatchObject({
        code: "unauthenticated",
      });
    });

    it("rejects a missing invitation ID", async () => {
      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {},
          ),
        ),
      ).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });

    it("rejects a blank invitation ID", async () => {
      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "   ",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Invitation validation                                                    */
  /* ------------------------------------------------------------------------ */

  describe("invitation validation", () => {
    it("rejects a nonexistent invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "does-not-exist",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "not-found",
      });
    });

    it("allows a pending invitation to be resent", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-001");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-001",
            },
          ),
        );

      expect(result.success).toBe(true);
      expect(result.invitationId).toBe("inv-001");
      expect(result.organizationId).toBe(
        TEST_ORGANIZATION_ID,
      );
      expect(result.status).toBe("pending");
    });

    it("allows an expired invitation to be resent", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-002", {
        status: "expired",
        expiresAt: Timestamp.fromDate(
          new Date("2026-09-20T12:00:00.000Z"),
        ),
        expiredAt: Timestamp.fromDate(
          new Date("2026-09-20T12:00:00.000Z"),
        ),
      });

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-002",
            },
          ),
        );

      expect(result.success).toBe(true);
      expect(result.status).toBe("pending");
    });

    it("rejects an accepted invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-003", {
        status: "accepted",
        acceptedAt: Timestamp.fromDate(
          new Date("2026-09-25T12:00:00.000Z"),
        ),
        acceptedByUserId: "member-user",
      });

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-003",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "failed-precondition",
      });

      const snapshot =
        await getInvitation("inv-003");

      expect(snapshot.data()?.status).toBe(
        "accepted",
      );
    });

    it("rejects a cancelled invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-004", {
        status: "cancelled",
        cancelledAt: Timestamp.fromDate(
          new Date("2026-09-25T12:00:00.000Z"),
        ),
        cancelledByUserId: "admin-user",
      });

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-004",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "failed-precondition",
      });

      const snapshot =
        await getInvitation("inv-004");

      expect(snapshot.data()?.status).toBe(
        "cancelled",
      );
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Authorization                                                            */
  /* ------------------------------------------------------------------------ */

  describe("authorization", () => {
    it("allows org_owner to resend an invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "owner-user",
        "org_owner",
      );

      await seedInvitation("inv-owner");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "owner-user",
            "owner@example.com",
            {
              invitationId: "inv-owner",
            },
          ),
        );

      expect(result.success).toBe(true);
    });

    it("allows org_admin to resend an invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-admin");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-admin",
            },
          ),
        );

      expect(result.success).toBe(true);
    });

    it("allows org_manager to resend an invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "manager-user",
        "org_manager",
      );

      await seedInvitation("inv-manager");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "manager-user",
            "manager@example.com",
            {
              invitationId: "inv-manager",
            },
          ),
        );

      expect(result.success).toBe(true);
    });

    it("rejects org_staff from resending an invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "staff-user",
        "org_staff",
      );

      await seedInvitation("inv-staff");

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "staff-user",
            "staff@example.com",
            {
              invitationId: "inv-staff",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "permission-denied",
      });
    });

    it("rejects org_member from resending an invitation", async () => {
      await seedOrganization();

      await seedMembership(
        "member-user",
        "org_member",
      );

      await seedInvitation("inv-member");

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "member-user",
            "member@example.com",
            {
              invitationId: "inv-member",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "permission-denied",
      });
    });

    it("rejects a user without organization membership", async () => {
      await seedOrganization();

      await seedInvitation("inv-no-membership");

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "random-user",
            "random@example.com",
            {
              invitationId: "inv-no-membership",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "permission-denied",
      });
    });

    it("rejects an inactive organization membership", async () => {
      await seedOrganization();

      await seedMembership(
        "inactive-admin",
        "org_admin",
        false,
      );

      await seedInvitation("inv-inactive");

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "inactive-admin",
            "admin@example.com",
            {
              invitationId: "inv-inactive",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "permission-denied",
      });
    });

    it("allows a platform admin without organization membership", async () => {
      await seedOrganization();

      await seedInvitation("inv-platform-admin");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "platform-admin",
            "platform@example.com",
            {
              invitationId: "inv-platform-admin",
            },
            {
              platformAdmin: true,
            },
          ),
        );

      expect(result.success).toBe(true);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Organization lifecycle                                                  */
  /* ------------------------------------------------------------------------ */

  describe("organization lifecycle", () => {
    it("allows resend during onboarding", async () => {
      await seedOrganization({
        status: "onboarding",
      });

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-onboarding");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-onboarding",
            },
          ),
        );

      expect(result.success).toBe(true);
    });

    it("allows resend while active", async () => {
      await seedOrganization({
        status: "active",
      });

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-active");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-active",
            },
          ),
        );

      expect(result.success).toBe(true);
    });

    it("rejects resend for an inactive organization", async () => {
      await seedOrganization({
        active: false,
        status: "active",
      });

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-inactive-org");

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-inactive-org",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "failed-precondition",
      });
    });

    it.each([
      "pending",
      "provisioning",
      "suspended",
      "archived",
    ])(
      "rejects resend when organization status is %s",
      async (status) => {
        await seedOrganization({
          status,
        });

        await seedMembership(
          "admin-user",
          "org_admin",
        );

        await seedInvitation(
          `inv-${status}`,
        );

        await expect(
          resendOrganizationInvitation.run(
            createCallableRequest(
              "admin-user",
              "admin@example.com",
              {
                invitationId: `inv-${status}`,
              },
            ),
          ),
        ).rejects.toMatchObject({
          code: "failed-precondition",
        });
      },
    );
  });

  /* ------------------------------------------------------------------------ */
  /* State transition                                                         */
  /* ------------------------------------------------------------------------ */

  describe("state transition", () => {
    it("changes expired to pending", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-state-001", {
        status: "expired",
        expiresAt: Timestamp.fromDate(
          new Date("2026-09-20T12:00:00.000Z"),
        ),
      });

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-state-001",
            },
          ),
        );

      expect(result.status).toBe("pending");

      const snapshot =
        await getInvitation("inv-state-001");

      expect(snapshot.data()?.status).toBe(
        "pending",
      );
    });

    it("preserves the invitation ID", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-preserve-id");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-preserve-id",
            },
          ),
        );

      expect(result.invitationId).toBe(
        "inv-preserve-id",
      );

      const snapshot =
        await getInvitation("inv-preserve-id");

      expect(snapshot.exists).toBe(true);
    });

    it("preserves organization, email, and role", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-preserve-data", {
        email: "Original@Example.com",
        normalizedEmail:
          "original@example.com",
        role: "org_manager",
      });

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-preserve-data",
            },
          ),
        );

      expect(result.organizationId).toBe(
        TEST_ORGANIZATION_ID,
      );

      expect(result.email).toBe(
        "Original@Example.com",
      );

      expect(result.normalizedEmail).toBe(
        "original@example.com",
      );

      expect(result.role).toBe(
        "org_manager",
      );

      const snapshot =
        await getInvitation(
          "inv-preserve-data",
        );

      const data = snapshot.data();

      expect(data?.organizationId).toBe(
        TEST_ORGANIZATION_ID,
      );

      expect(data?.email).toBe(
        "Original@Example.com",
      );

      expect(data?.normalizedEmail).toBe(
        "original@example.com",
      );

      expect(data?.role).toBe(
        "org_manager",
      );
    });

    it("increments resendCount from zero", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-count-001");

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-count-001",
            },
          ),
        );

      expect(result.resendCount).toBe(1);

      const snapshot =
        await getInvitation(
          "inv-count-001",
        );

      expect(
        snapshot.data()?.resendCount,
      ).toBe(1);
    });

    it("increments an existing resendCount", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-count-002", {
        resendCount: 4,
        lastResentAt: Timestamp.fromDate(
          new Date("2026-09-27T12:00:00.000Z"),
        ),
      });

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId: "inv-count-002",
            },
          ),
        );

      expect(result.resendCount).toBe(5);

      const snapshot =
        await getInvitation(
          "inv-count-002",
        );

      expect(
        snapshot.data()?.resendCount,
      ).toBe(5);
    });

    it("creates lastResentAt", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-last-resent");

      const before = Date.now();

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          {
            invitationId: "inv-last-resent",
          },
        ),
      );

      const after = Date.now();

      const snapshot =
        await getInvitation(
          "inv-last-resent",
        );

      const lastResentAt =
        snapshot
          .data()
          ?.lastResentAt
          ?.toDate()
          ?.getTime();

      expect(lastResentAt).toBeGreaterThanOrEqual(
        before,
      );

      expect(lastResentAt).toBeLessThanOrEqual(
        after,
      );
    });

    it("extends the expiration by seven days", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-expiration", {
        expiresAt: Timestamp.fromDate(
          new Date("2026-09-20T12:00:00.000Z"),
        ),
      });

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-expiration",
            },
          ),
        );

      const expiresAt = new Date(
        result.expiresAt,
      );

      const now = new Date();

      const difference =
        expiresAt.getTime() - now.getTime();

      const sevenDays =
        7 * 24 * 60 * 60 * 1000;

      expect(
        Math.abs(difference - sevenDays),
      ).toBeLessThan(5000);
    });

    it("updates updatedAt", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation("inv-updated-at", {
        updatedAt: Timestamp.fromDate(
          new Date("2026-09-01T12:00:00.000Z"),
        ),
      });

      const before =
        (
          await getInvitation(
            "inv-updated-at",
          )
        ).data()?.updatedAt.toDate().getTime();

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          {
            invitationId:
              "inv-updated-at",
          },
        ),
      );

      const after =
        (
          await getInvitation(
            "inv-updated-at",
          )
        ).data()?.updatedAt.toDate().getTime();

      expect(after).toBeGreaterThan(
        before,
      );
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Cooldown                                                                 */
  /* ------------------------------------------------------------------------ */

  describe("resend cooldown", () => {
    it("rejects an immediate second resend", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation(
        "inv-cooldown",
      );

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          {
            invitationId:
              "inv-cooldown",
          },
        ),
      );

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-cooldown",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "resource-exhausted",
      });
    });

    it("rejects a resend when lastResentAt is less than 60 seconds ago", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation(
        "inv-cooldown-active",
        {
          lastResentAt:
            Timestamp.fromDate(
              new Date(
                Date.now() - 30_000,
              ),
            ),
        },
      );

      await expect(
        resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-cooldown-active",
            },
          ),
        ),
      ).rejects.toMatchObject({
        code: "resource-exhausted",
      });
    });

    it("allows resend when the cooldown has elapsed", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation(
        "inv-cooldown-expired",
        {
          resendCount: 1,
          lastResentAt:
            Timestamp.fromDate(
              new Date(
                Date.now() - 61_000,
              ),
            ),
        },
      );

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-cooldown-expired",
            },
          ),
        );

      expect(result.success).toBe(true);

      expect(result.resendCount).toBe(2);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Role preservation                                                        */
  /* ------------------------------------------------------------------------ */

  describe("invitation roles", () => {
    it.each([
      "org_admin",
      "org_manager",
      "org_staff",
      "org_member",
    ])(
      "can resend an invitation with role %s",
      async (role) => {
        await seedOrganization();

        await seedMembership(
          "admin-user",
          "org_admin",
        );

        await seedInvitation(
          `inv-role-${role}`,
          {
            role,
          },
        );

        const result =
          await resendOrganizationInvitation.run(
            createCallableRequest(
              "admin-user",
              "admin@example.com",
              {
                invitationId:
                  `inv-role-${role}`,
              },
            ),
          );

        expect(result.success).toBe(true);

        expect(result.role).toBe(role);
      },
    );
  });

  /* ------------------------------------------------------------------------ */
  /* Email outbox                                                              */
  /* ------------------------------------------------------------------------ */

  describe("email outbox", () => {
    it("creates an email outbox record when an invitation is resent", async () => {
      await seedOrganization();

      await seedMembership("admin-user", "org_admin");
      await seedInvitation("inv-outbox-create");

      const result = await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-create" },
        ),
      );

      const snapshot = await getOrganizationEmailOutbox(
        "inv-outbox-create",
      );

      expect(snapshot.size).toBe(1);

      const data = snapshot.docs[0].data();

      expect(data).toMatchObject({
        invitationId: "inv-outbox-create",
        organizationId: TEST_ORGANIZATION_ID,
        recipientEmail: "member@example.com",
        organizationName: ORGANIZATION_NAME,
        role: "org_member",
      });

      expect(data.status).toBe("pending");
      expect(data.attemptCount).toBe(0);
      expect(data.subject).toBeTruthy();
      expect(data.text).toBeTruthy();
      expect(data.html).toBeTruthy();
      expect(result.outboxId).toBe(snapshot.docs[0].id);
    });

    it("creates a new outbox record for each successful resend", async () => {
      await seedOrganization();
      await seedMembership("admin-user", "org_admin");
      await seedInvitation("inv-outbox-repeat");

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-repeat" },
        ),
      );

      await adminDb
        .collection("organizationInvitations")
        .doc("inv-outbox-repeat")
        .update({
          lastResentAt: Timestamp.fromDate(
            new Date(Date.now() - 61_000),
          ),
        });

      const result = await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-repeat" },
        ),
      );

      const snapshot = await getOrganizationEmailOutbox(
        "inv-outbox-repeat",
      );

      expect(snapshot.size).toBe(2);
      expect(new Set(snapshot.docs.map((doc) => doc.id)).size).toBe(2);
      expect(result.outboxId).toBeTruthy();
      expect(snapshot.docs.some((doc) => doc.id === result.outboxId)).toBe(true);
    });

    it("creates an outbox record using the renewed expiration date", async () => {
      await seedOrganization();
      await seedMembership("admin-user", "org_admin");
      await seedInvitation("inv-outbox-expiration", {
        expiresAt: Timestamp.fromDate(
          new Date("2026-09-20T12:00:00.000Z"),
        ),
      });

      const result = await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-expiration" },
        ),
      );

      const snapshot = await getOrganizationEmailOutbox(
        "inv-outbox-expiration",
      );

      expect(snapshot.size).toBe(1);

      const data = snapshot.docs[0].data();
      const expectedExpiration = new Date(
        result.expiresAt,
      ).toLocaleString("en-US");

      expect(data.text).toContain(expectedExpiration);
      expect(data.html).toContain(expectedExpiration);
    });

    it("creates an outbox record containing the invitation acceptance link", async () => {
      await seedOrganization();
      await seedMembership("admin-user", "org_admin");
      await seedInvitation("inv-outbox-link");

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-link" },
        ),
      );

      const snapshot = await getOrganizationEmailOutbox(
        "inv-outbox-link",
      );

      expect(snapshot.size).toBe(1);

      const data = snapshot.docs[0].data();
      const acceptanceUrl =
        "https://zebron.org/organization/invitations/accept?invitationId=inv-outbox-link";

      expect(data.text).toContain(acceptanceUrl);
      expect(data.html).toContain(acceptanceUrl);
    });

    it("creates a pending outbox record with zero attempts", async () => {
      await seedOrganization();
      await seedMembership("admin-user", "org_admin");
      await seedInvitation("inv-outbox-state");

      await resendOrganizationInvitation.run(
        createCallableRequest(
          "admin-user",
          "admin@example.com",
          { invitationId: "inv-outbox-state" },
        ),
      );

      const snapshot = await getOrganizationEmailOutbox(
        "inv-outbox-state",
      );

      expect(snapshot.size).toBe(1);

      const data = snapshot.docs[0].data();

      expect(data.status).toBe("pending");
expect(data.attemptCount).toBe(0);
expect(data.nextAttemptAt).toBeDefined();
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Result                                                                    */
  /* ------------------------------------------------------------------------ */

  describe("result", () => {
    it("returns the expected resend information", async () => {
      await seedOrganization();

      await seedMembership(
        "admin-user",
        "org_admin",
      );

      await seedInvitation(
        "inv-result",
        {
          email: "member@example.com",
          normalizedEmail:
            "member@example.com",
          role: "org_member",
        },
      );

      const result =
        await resendOrganizationInvitation.run(
          createCallableRequest(
            "admin-user",
            "admin@example.com",
            {
              invitationId:
                "inv-result",
            },
          ),
        );

      expect(result).toMatchObject({
        success: true,
        invitationId: "inv-result",
        organizationId:
          TEST_ORGANIZATION_ID,
        email: "member@example.com",
        normalizedEmail:
          "member@example.com",
        role: "org_member",
        status: "pending",
        resendCount: 1,
        resentByUserId: "admin-user",
      });

      expect(
        typeof result.expiresAt,
      ).toBe("string");

      expect(
        typeof result.lastResentAt,
      ).toBe("string");
    });
  });
});