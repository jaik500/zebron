import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createRequire } from "node:module";

import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import fs from "node:fs";

/*
 * --------------------------------------------------------------------------
 * FIREBASE EMULATOR CONFIGURATION
 * --------------------------------------------------------------------------
 */

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ??
  "127.0.0.1:8080";

process.env.GCLOUD_PROJECT =
  process.env.GCLOUD_PROJECT ??
  "zebron-rules-test";

/*
 * --------------------------------------------------------------------------
 * FIREBASE ADMIN INSTANCES
 * --------------------------------------------------------------------------
 *
 * The root project and the Functions project both have firebase-admin
 * installed:
 *
 *   /node_modules/firebase-admin
 *   /functions/node_modules/firebase-admin
 *
 * The production callable imports firebase-admin from the Functions
 * project. Therefore we intentionally initialize BOTH Admin SDK instances.
 *
 * We do NOT reference functions/node_modules directly.
 *
 * Instead, createRequire() resolves firebase-admin relative to
 * functions/package.json, which makes Node use the Functions dependency
 * tree naturally.
 */

/*
 * Root application's firebase-admin instance.
 *
 * Used by the test for seeding and reading Firestore emulator data.
 */
const adminApp = initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
});

const adminDb = getFirestore(adminApp);

/*
 * Functions application's firebase-admin instance.
 *
 * This is the instance used by:
 *
 *   functions/src/organization-onboarding-configuration.ts
 *
 * when it executes:
 *
 *   const db = getFirestore();
 */
const functionsRequire = createRequire(
  new URL("../functions/package.json", import.meta.url),
);

const functionsAdminAppModule = functionsRequire(
  "firebase-admin/app",
) as typeof import("firebase-admin/app");

const functionsAdminFirestoreModule = functionsRequire(
  "firebase-admin/firestore",
) as typeof import("firebase-admin/firestore");

const functionsAdminApp = functionsAdminAppModule.initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
});

const functionsAdminDb =
  functionsAdminFirestoreModule.getFirestore(functionsAdminApp);

/*
 * Import the production callable only AFTER both Firebase Admin
 * instances have been initialized.
 */
const { completeOrganizationConfiguration } =
  await import("../functions/src/organization-onboarding-configuration");

/*
 * --------------------------------------------------------------------------
 * TEST SUITE
 * --------------------------------------------------------------------------
 */

describe(
  "completeOrganizationConfiguration",
  () => {
    let testEnv: RulesTestEnvironment;

    const organizationId = "org-config-test";

    const ownerId = "owner-1";
    const adminId = "admin-1";
    const managerId = "manager-1";
    const staffId = "staff-1";
    const memberId = "member-1";

    const validConfiguration = {
      testCenterEnabled: true,
      allowMemberTesting: true,
      courseVisibility: "members" as const,
      allowSelfRegistration: false,
      defaultMemberRole: "org_member" as const,
      adminNotifications: true,
      testResultNotifications: true,
      primaryColor: "#007979",
      secondaryColor: "#032D42",
    };

    /*
     * ----------------------------------------------------------------------
     * TEST ENVIRONMENT
     * ----------------------------------------------------------------------
     */

    beforeAll(async () => {
      testEnv = await initializeTestEnvironment({
        projectId: process.env.GCLOUD_PROJECT!,
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

      await deleteApp(adminApp);

      /*
       * The Functions Admin instance was initialized through the
       * Functions dependency tree, so delete that instance as well.
       */
      await functionsAdminAppModule.deleteApp(
        functionsAdminApp,
      );
    });

    /*
     * ----------------------------------------------------------------------
     * SEED HELPERS
     * ----------------------------------------------------------------------
     */

    async function seedOrganization(): Promise<void> {
      await adminDb
        .collection("organizations")
        .doc(organizationId)
        .set({
          id: organizationId,
          name: "Configuration Test Organization",
          normalizedName:
            "configuration test organization",
          active: true,
        });
    }

    async function seedMembership(
      userId: string,
      role:
        | "org_owner"
        | "org_admin"
        | "org_manager"
        | "org_staff"
        | "org_member",
    ): Promise<void> {
      await adminDb
        .collection("organizationMemberships")
        .doc(`${userId}_${organizationId}`)
        .set({
          userId,
          organizationId,
          role,
          active: true,
        });
    }

    async function seedOnboarding(
      overrides: Record<string, unknown> = {},
    ): Promise<void> {
      await adminDb
        .collection("organizationOnboarding")
        .doc(organizationId)
        .set({
          organizationId,
          status: "in_progress",
          currentStep: "configuration",
          completedSteps: [],
          completedAt: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          ...overrides,
        });
    }

    async function setupValidState(
      userId: string,
      role:
        | "org_owner"
        | "org_admin"
        | "org_manager"
        | "org_staff"
        | "org_member",
    ): Promise<void> {
      await seedOrganization();
      await seedMembership(userId, role);
      await seedOnboarding();
    }

    /*
     * ----------------------------------------------------------------------
     * CALLABLE HELPER
     * ----------------------------------------------------------------------
     */

    async function callConfiguration(
      uid: string,
      data: Record<string, unknown>,
    ) {
      return completeOrganizationConfiguration.run({
        data,
        rawRequest: {},
        auth: {
          uid,
          token: {
            uid,
          },
        },
      } as never);
    }

    /*
     * ----------------------------------------------------------------------
     * AUTHENTICATION
     * ----------------------------------------------------------------------
     */

    describe("authentication", () => {
      it(
        "rejects unauthenticated requests",
        async () => {
          await expect(
            completeOrganizationConfiguration.run({
              data: {
                organizationId,
                configuration: validConfiguration,
              },
              rawRequest: {},
            } as never),
          ).rejects.toMatchObject({
            code: "unauthenticated",
          });
        },
      );

      it(
        "rejects a missing organizationId",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );

      it(
        "rejects a missing configuration",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );
    });

    /*
     * ----------------------------------------------------------------------
     * CONFIGURATION VALIDATION
     * ----------------------------------------------------------------------
     */

    describe("configuration validation", () => {
      beforeEach(async () => {
        await setupValidState(
          ownerId,
          "org_owner",
        );
      });

      it(
        "rejects an invalid boolean",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: {
                ...validConfiguration,
                testCenterEnabled: "true",
              },
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );

      it(
        "rejects invalid course visibility",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: {
                ...validConfiguration,
                courseVisibility: "public",
              },
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );

      it(
        "rejects invalid default member role",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: {
                ...validConfiguration,
                defaultMemberRole: "administrator",
              },
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );

      it(
        "rejects an invalid primary color",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: {
                ...validConfiguration,
                primaryColor: "red",
              },
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );

      it(
        "rejects an invalid secondary color",
        async () => {
          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: {
                ...validConfiguration,
                secondaryColor: "#123",
              },
            }),
          ).rejects.toMatchObject({
            code: "invalid-argument",
          });
        },
      );
    });

    /*
     * ----------------------------------------------------------------------
     * ORGANIZATION AUTHORIZATION
     * ----------------------------------------------------------------------
     */

    describe("organization authorization", () => {
      it(
        "rejects a nonexistent organization",
        async () => {
          await seedMembership(
            ownerId,
            "org_owner",
          );

          await seedOnboarding();

          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "not-found",
          });
        },
      );

      it(
        "rejects a user without membership",
        async () => {
          await seedOrganization();
          await seedOnboarding();

          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "permission-denied",
          });
        },
      );

      it(
        "rejects an org_member",
        async () => {
          await setupValidState(
            memberId,
            "org_member",
          );

          await expect(
            callConfiguration(memberId, {
              organizationId,
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "permission-denied",
          });
        },
      );

      it(
        "rejects an org_staff member",
        async () => {
          await setupValidState(
            staffId,
            "org_staff",
          );

          await expect(
            callConfiguration(staffId, {
              organizationId,
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "permission-denied",
          });
        },
      );

      it(
        "rejects an org_manager",
        async () => {
          await setupValidState(
            managerId,
            "org_manager",
          );

          await expect(
            callConfiguration(managerId, {
              organizationId,
              configuration: validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "permission-denied",
          });
        },
      );

      it(
        "allows an org_admin to complete configuration",
        async () => {
          await setupValidState(
            adminId,
            "org_admin",
          );

          const result =
            await callConfiguration(
              adminId,
              {
                organizationId,
                configuration:
                  validConfiguration,
              },
            );

          expect(result).toEqual({
            success: true,
            organizationId,
            currentStep: "first_program",
            completedSteps: [
              "configuration",
            ],
          });
        },
      );

      it(
        "allows an org_owner to complete configuration",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          const result =
            await callConfiguration(
              ownerId,
              {
                organizationId,
                configuration:
                  validConfiguration,
              },
            );

          expect(result).toEqual({
            success: true,
            organizationId,
            currentStep: "first_program",
            completedSteps: [
              "configuration",
            ],
          });
        },
      );
    });

    /*
     * ----------------------------------------------------------------------
     * ONBOARDING STATE
     * ----------------------------------------------------------------------
     */

    describe("onboarding state", () => {
      it(
        "rejects when onboarding does not exist",
        async () => {
          await seedOrganization();

          await seedMembership(
            ownerId,
            "org_owner",
          );

          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration:
                validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "failed-precondition",
          });
        },
      );

      it(
        "rejects when onboarding is not in progress",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          await adminDb
            .collection(
              "organizationOnboarding",
            )
            .doc(organizationId)
            .update({
              status: "completed",
            });

          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration:
                validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "failed-precondition",
          });
        },
      );

      it(
        "rejects when configuration is not the current step",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          await adminDb
            .collection(
              "organizationOnboarding",
            )
            .doc(organizationId)
            .update({
              currentStep: "first_program",
            });

          await expect(
            callConfiguration(ownerId, {
              organizationId,
              configuration:
                validConfiguration,
            }),
          ).rejects.toMatchObject({
            code: "failed-precondition",
          });
        },
      );
    });

    /*
     * ----------------------------------------------------------------------
     * SUCCESSFUL CONFIGURATION
     * ----------------------------------------------------------------------
     */

    describe("successful configuration", () => {
      it(
        "persists configuration and advances onboarding",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          const result =
            await callConfiguration(
              ownerId,
              {
                organizationId,
                configuration:
                  validConfiguration,
              },
            );

          expect(result.success).toBe(
            true,
          );

          expect(
            result.currentStep,
          ).toBe("first_program");

          const settingsSnapshot =
            await adminDb
              .collection(
                "organizationSettings",
              )
              .doc(organizationId)
              .get();

          expect(
            settingsSnapshot.exists,
          ).toBe(true);

          expect(
            settingsSnapshot.data(),
          ).toMatchObject({
            organizationId,
            ...validConfiguration,
          });

          const onboardingSnapshot =
            await adminDb
              .collection(
                "organizationOnboarding",
              )
              .doc(organizationId)
              .get();

          expect(
            onboardingSnapshot.exists,
          ).toBe(true);

          expect(
            onboardingSnapshot.data(),
          ).toMatchObject({
            organizationId,
            status: "in_progress",
            currentStep: "first_program",
            completedSteps: [
              "configuration",
            ],
            completedAt: null,
          });
        },
      );

      it(
        "preserves previously completed steps",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          await adminDb
            .collection(
              "organizationOnboarding",
            )
            .doc(organizationId)
            .update({
              completedSteps: [
                "organization",
                "membership",
              ],
            });

          const result =
            await callConfiguration(
              ownerId,
              {
                organizationId,
                configuration:
                  validConfiguration,
              },
            );

          expect(
            result.completedSteps,
          ).toEqual([
            "organization",
            "membership",
            "configuration",
          ]);
        },
      );

      it(
        "does not duplicate configuration in completed steps",
        async () => {
          await setupValidState(
            ownerId,
            "org_owner",
          );

          await adminDb
            .collection(
              "organizationOnboarding",
            )
            .doc(organizationId)
            .update({
              completedSteps: [
                "organization",
                "configuration",
              ],
            });

          const result =
            await callConfiguration(
              ownerId,
              {
                organizationId,
                configuration:
                  validConfiguration,
              },
            );

          expect(
            result.completedSteps,
          ).toEqual([
            "organization",
            "configuration",
          ]);

          expect(
            result.currentStep,
          ).toBe("first_program");
        },
      );
    });
  },
);