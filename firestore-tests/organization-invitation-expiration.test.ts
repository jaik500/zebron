import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  deleteApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import {
  expirePendingOrganizationInvitations,
} from "../functions/src/organization-invitation-expiration";

import fs from "node:fs";

const PROJECT_ID = "zebron-test";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

let testEnv: RulesTestEnvironment;
let adminDb: ReturnType<typeof getFirestore>;

beforeAll(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });

  const existingApps = getApps();

  const app =
    existingApps.length > 0
      ? existingApps[0]
      : initializeApp({
          projectId: PROJECT_ID,
        });

  adminDb = getFirestore(app);
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

async function seedInvitation(
  invitationId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await adminDb
    .collection("organizationInvitations")
    .doc(invitationId)
    .set({
      id: invitationId,
      organizationId: "org-001",
      email: "member@example.com",
      normalizedEmail: "member@example.com",
      role: "org_member",
      status: "pending",
      createdByUserId: "admin-user",
      createdAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
      updatedAt: Timestamp.fromDate(
        new Date("2026-09-01T12:00:00.000Z"),
      ),
      ...data,
    });
}

describe("expirePendingOrganizationInvitations", () => {
  it("expires a pending invitation whose expiration time has passed", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-001", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(1);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-001")
      .get();

    expect(snapshot.exists).toBe(true);

    const data = snapshot.data();

    expect(data?.status).toBe("expired");
    expect(data?.expiredAt.toDate().toISOString()).toBe(
      "2026-09-28T12:00:00.000Z",
    );
    expect(data?.updatedAt.toDate().toISOString()).toBe(
      "2026-09-28T12:00:00.000Z",
    );
  });

  it("expires an invitation exactly at its expiration time", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-002", {
      expiresAt: Timestamp.fromDate(now),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(1);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-002")
      .get();

    expect(snapshot.data()?.status).toBe("expired");
  });

  it("does not expire a future invitation", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-003", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-29T12:00:00.000Z"),
      ),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(0);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-003")
      .get();

    expect(snapshot.data()?.status).toBe("pending");
  });

  it("does not modify an accepted invitation", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-004", {
      status: "accepted",
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
      acceptedAt: Timestamp.fromDate(
        new Date("2026-09-26T12:00:00.000Z"),
      ),
      acceptedByUserId: "user-001",
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(0);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-004")
      .get();

    const data = snapshot.data();

    expect(data?.status).toBe("accepted");
    expect(data?.acceptedByUserId).toBe("user-001");
    expect(data?.expiredAt).toBeUndefined();
  });

  it("does not modify a cancelled invitation", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-005", {
      status: "cancelled",
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
      cancelledAt: Timestamp.fromDate(
        new Date("2026-09-26T12:00:00.000Z"),
      ),
      cancelledByUserId: "admin-user",
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(0);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-005")
      .get();

    const data = snapshot.data();

    expect(data?.status).toBe("cancelled");
    expect(data?.cancelledByUserId).toBe("admin-user");
    expect(data?.expiredAt).toBeUndefined();
  });

  it("expires multiple pending invitations", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-006", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-25T12:00:00.000Z"),
      ),
    });

    await seedInvitation("inv-007", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-26T12:00:00.000Z"),
      ),
    });

    await seedInvitation("inv-008", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(3);

    const snapshots = await Promise.all([
      adminDb
        .collection("organizationInvitations")
        .doc("inv-006")
        .get(),
      adminDb
        .collection("organizationInvitations")
        .doc("inv-007")
        .get(),
      adminDb
        .collection("organizationInvitations")
        .doc("inv-008")
        .get(),
    ]);

    for (const snapshot of snapshots) {
      expect(snapshot.data()?.status).toBe("expired");
    }
  });

  it("handles a mix of expired and future invitations", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-009", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
    });

    await seedInvitation("inv-010", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-29T12:00:00.000Z"),
      ),
    });

    await seedInvitation("inv-011", {
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-30T12:00:00.000Z"),
      ),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(1);

    const expiredSnapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-009")
      .get();

    const futureSnapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-010")
      .get();

    const futureSnapshot2 = await adminDb
      .collection("organizationInvitations")
      .doc("inv-011")
      .get();

    expect(expiredSnapshot.data()?.status).toBe("expired");
    expect(futureSnapshot.data()?.status).toBe("pending");
    expect(futureSnapshot2.data()?.status).toBe("pending");
  });

  it("is safe to run when there are no invitations", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(0);
  });

  it("does not reprocess an already expired invitation", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    await seedInvitation("inv-012", {
      status: "expired",
      expiresAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
      expiredAt: Timestamp.fromDate(
        new Date("2026-09-27T12:00:00.000Z"),
      ),
    });

    const result =
      await expirePendingOrganizationInvitations(now, adminDb);

    expect(result.processed).toBe(0);

    const snapshot = await adminDb
      .collection("organizationInvitations")
      .doc("inv-012")
      .get();

    expect(snapshot.data()?.status).toBe("expired");
  });
});