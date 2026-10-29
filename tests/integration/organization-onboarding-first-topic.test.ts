import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from '../../functions/node_modules/firebase-admin/lib/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createRequire } from "node:module";
import type { Firestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const require = createRequire(import.meta.url);
const admin = require(
  "../../functions/node_modules/firebase-admin",
) as typeof import("firebase-admin");

const PROJECT_ID = "zebron-test";
const OWNER_UID = "first-topic-owner";
const ADMIN_UID = "first-topic-admin";
const MANAGER_UID = "first-topic-manager";
const MEMBER_UID = "first-topic-member";
const INACTIVE_UID = "first-topic-inactive";
const OTHER_UID = "first-topic-other";
const ORGANIZATION_ID = "first-topic-test-org";
const OTHER_ORGANIZATION_ID = "other-first-topic-test-org";
const COURSE_ID = "first-topic-test-course";
const OTHER_COURSE_ID = "other-first-topic-course";

const CORE_ORGANIZATION_STEPS = [
  "organization_profile",
  "owner_profile",
  "invite_members",
  "configuration",
];

const TEST_CENTER_STEPS = [
  "first_program",
  "first_course",
  "first_topic",
  "first_question",
];

const TOPIC_FINAL_STEPS = [
  "first_program",
  "first_course",
  "first_topic",
];

type FirstTopicInput = {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
};

type TestCenterSetup = {
  steps: string[];
  currentStep: string | null;
  completedSteps: string[];
  status: "not_started" | "in_progress" | "completed";
  firstProgramId: string | null;
  firstCourseId: string | null;
  firstTopicId: string | null;
  firstQuestionId: string | null;
  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
};

let adminDb: Firestore;
let testEnvironment: RulesTestEnvironment;

let completeOrganizationFirstTopic: {
  run: (request: CallableRequest<FirstTopicInput>) => Promise<unknown>;
};

function callableRequest(
  uid: string | undefined,
  data: FirstTopicInput,
): CallableRequest<FirstTopicInput> {
  return {
    data,
    auth: uid
      ? {
          uid,
          token: { uid, email: `${uid}@example.com` },
          rawToken: "",
        }
      : undefined,
    instanceIdToken: undefined,
    rawRequest: undefined,
  } as unknown as CallableRequest<FirstTopicInput>;
}

function initializeAdmin(): void {
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

  if (!admin.getApps().length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  adminDb = getAdminFirestore();
}

async function createOrganization(
  organizationId = ORGANIZATION_ID,
  name = "First Topic Test Organization",
): Promise<void> {
  await adminDb.collection("organizations").doc(organizationId).set({
    id: organizationId,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    active: true,
    status: "onboarding",
    createdAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  });
}

async function createMembership(
  uid: string,
  role: "org_owner" | "org_admin" | "org_manager" | "org_staff" | "org_member",
  organizationId = ORGANIZATION_ID,
  active = true,
): Promise<void> {
  await adminDb
    .collection("organizationMemberships")
    .doc(`${uid}_${organizationId}`)
    .set({
      id: `${uid}_${organizationId}`,
      userId: uid,
      organizationId,
      role,
      active,
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });
}

async function createCourse(
  courseId = COURSE_ID,
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await adminDb.collection("testCourses").doc(courseId).set({
    id: courseId,
    organizationId,
    scope: "organization",
    accessType: "organization-members",
    programId: "first-topic-test-program",
    name: "First Topic Test Course",
    slug: courseId,
    description: "Course used by first-topic onboarding tests.",
    provider: "Zebron",
    type: "course",
    active: true,
    questionCount: 0,
    createdBy: OWNER_UID,
    createdAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  });
}

/** Core onboarding has only the four organization-level steps. */
async function createOrganizationOnboarding(): Promise<void> {
  await adminDb.collection("organizationOnboarding").doc(ORGANIZATION_ID).set({
    id: ORGANIZATION_ID,
    organizationId: ORGANIZATION_ID,
    status: "completed",
    currentStep: "configuration",
    requiredSteps: CORE_ORGANIZATION_STEPS,
    completedSteps: CORE_ORGANIZATION_STEPS,
    startedAt: AdminFieldValue.serverTimestamp(),
    completedAt: AdminFieldValue.serverTimestamp(),
    createdAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  });
}

function entitlementRef(organizationId = ORGANIZATION_ID) {
  return adminDb
    .collection("organizations")
    .doc(organizationId)
    .collection("applications")
    .doc("test-center");
}

async function createTestCenterEntitlement(
  onboardingOverrides: Partial<TestCenterSetup> = {},
  entitlementOverrides: Record<string, unknown> = {},
): Promise<void> {
  const onboarding: TestCenterSetup = {
    steps: [...TEST_CENTER_STEPS],
    currentStep: "first_topic",
    completedSteps: ["first_program", "first_course"],
    status: "in_progress",
    firstProgramId: "first-topic-test-program",
    firstCourseId: COURSE_ID,
    firstTopicId: null,
    firstQuestionId: null,
    startedAt: AdminFieldValue.serverTimestamp(),
    completedAt: null,
    updatedAt: AdminFieldValue.serverTimestamp(),
    ...onboardingOverrides,
  };

  await entitlementRef().set({
    applicationId: "test-center",
    organizationId: ORGANIZATION_ID,
    status: "selected",
    ...entitlementOverrides,
    onboarding,
    createdAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  });
}

async function updateTestCenterOnboarding(
  updates: Record<string, unknown>,
): Promise<void> {
  const fieldUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    fieldUpdates[`onboarding.${key}`] = value;
  }
  await entitlementRef().update(fieldUpdates);
}

async function createBaseState(): Promise<void> {
  await createOrganization();
  await createMembership(OWNER_UID, "org_owner");
  await createMembership(ADMIN_UID, "org_admin");
  await createMembership(MANAGER_UID, "org_manager");
  await createMembership(MEMBER_UID, "org_member");
  await createMembership(INACTIVE_UID, "org_admin", ORGANIZATION_ID, false);
  await createCourse();
  await createOrganizationOnboarding();
  await createTestCenterEntitlement();
}

async function deleteCollection(collectionName: string): Promise<void> {
  const snapshot = await adminDb.collection(collectionName).get();
  if (snapshot.empty) return;

  const batch = adminDb.batch();
  snapshot.docs.forEach((document) => batch.delete(document.ref));
  await batch.commit();
}

async function deleteTestData(): Promise<void> {
  // Organization subcollections must be explicitly removed.
  await entitlementRef().delete().catch(() => undefined);
  await entitlementRef(OTHER_ORGANIZATION_ID).delete().catch(() => undefined);

  for (const collectionName of [
    "organizationMemberships",
    "organizationOnboarding",
    "testCourses",
    "testTopics",
    "organizations",
  ]) {
    await deleteCollection(collectionName);
  }
}

function validTopicData(
  overrides: Partial<FirstTopicInput> = {},
): FirstTopicInput {
  return {
    organizationId: ORGANIZATION_ID,
    name: "Networking Fundamentals",
    slug: "networking-fundamentals",
    description: "Introduction to networking fundamentals.",
    active: true,
    ...overrides,
  };
}

beforeAll(async () => {
  initializeAdmin();
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: "127.0.0.1", port: 8080 },
  });

  const module = await import(
    "../../functions/src/organization-onboarding-first-topic"
  );
  completeOrganizationFirstTopic = module.completeOrganizationFirstTopic;
});

beforeEach(async () => {
  await deleteTestData();
  await createBaseState();
});

afterAll(async () => {
  await deleteTestData();
  await testEnvironment.cleanup();
  if (admin.getApps().length) await admin.deleteApp(admin.getApp());
});

describe("completeOrganizationFirstTopic", () => {
  it("creates the first topic, advances Test Center, and leaves core onboarding unchanged", async () => {
    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData()),
    );

    expect(result).toMatchObject({
      success: true,
      topic: {
        organizationId: ORGANIZATION_ID,
        courseId: COURSE_ID,
        name: "Networking Fundamentals",
        slug: "networking-fundamentals",
        description: "Introduction to networking fundamentals.",
        sortOrder: 0,
        questionCount: 0,
        active: true,
      },
      onboarding: {
        currentStep: "first_question",
        completedSteps: ["first_program", "first_course", "first_topic"],
        status: "in_progress",
        isComplete: false,
      },
    });

    const response = result as {
      topic: { id: string };
      onboarding: { firstTopicId: string };
    };
    expect(response.topic.id).toBe(response.onboarding.firstTopicId);

    const topic = await adminDb.collection("testTopics").doc(response.topic.id).get();
    expect(topic.exists).toBe(true);
    expect(topic.data()).toMatchObject({
      organizationId: ORGANIZATION_ID,
      courseId: COURSE_ID,
      name: "Networking Fundamentals",
      slug: "networking-fundamentals",
      sortOrder: 0,
      questionCount: 0,
      active: true,
      createdBy: OWNER_UID,
    });

    expect((await entitlementRef().get()).data()?.onboarding).toMatchObject({
      steps: TEST_CENTER_STEPS,
      currentStep: "first_question",
      firstTopicId: response.topic.id,
      completedSteps: ["first_program", "first_course", "first_topic"],
      status: "in_progress",
    });

    const core = (await adminDb.collection("organizationOnboarding").doc(ORGANIZATION_ID).get()).data();
    expect(core).toMatchObject({
      status: "completed",
      currentStep: "configuration",
      requiredSteps: CORE_ORGANIZATION_STEPS,
      completedSteps: CORE_ORGANIZATION_STEPS,
    });
    expect(core).not.toHaveProperty("firstTopicId");
    expect(core).not.toHaveProperty("firstCourseId");
    expect(core).not.toHaveProperty("firstQuestionId");
  });

  it("allows an organization administrator", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(ADMIN_UID, validTopicData()),
      ),
    ).resolves.toMatchObject({ success: true });
  });

  it.each([
    ["manager", MANAGER_UID],
    ["member", MEMBER_UID],
    ["inactive administrator", INACTIVE_UID],
    ["nonmember", OTHER_UID],
  ])("rejects an unauthorized %s", async (_label, uid) => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(uid, validTopicData({ slug: `denied-${uid}` })),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });

    const topics = await adminDb.collection("testTopics").get();
    expect(topics.empty).toBe(true);
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(undefined, validTopicData()),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects an unknown organization", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(OWNER_UID, validTopicData({ organizationId: "missing-org" })),
      ),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects when the Test Center entitlement is missing", async () => {
    await entitlementRef().delete();
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects when Test Center onboarding is not initialized", async () => {
    await entitlementRef().update({ onboarding: null });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects when the current Test Center step is not first_topic", async () => {
    await updateTestCenterOnboarding({
      completedSteps: ["first_program"],
      firstTopicId: null,
    });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects when Test Center setup is already complete", async () => {
    await updateTestCenterOnboarding({
      steps: ["first_program", "first_course"],
      completedSteps: ["first_program", "first_course"],
      status: "completed",
      firstTopicId: null,
    });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects when the first course ID is missing", async () => {
    await updateTestCenterOnboarding({ firstCourseId: null });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects when the first course does not exist", async () => {
    await updateTestCenterOnboarding({ firstCourseId: "missing-course" });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects when the first course belongs to another organization", async () => {
    await createOrganization(OTHER_ORGANIZATION_ID, "Other Organization");
    await createCourse(OTHER_COURSE_ID, OTHER_ORGANIZATION_ID);
    await updateTestCenterOnboarding({ firstCourseId: OTHER_COURSE_ID });

    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects when a first topic has already been recorded", async () => {
    await updateTestCenterOnboarding({ firstTopicId: "existing-topic" });
    await expect(
      completeOrganizationFirstTopic.run(callableRequest(OWNER_UID, validTopicData())),
    ).rejects.toMatchObject({ code: "already-exists" });
  });

  it("rejects a duplicate normalized slug within the same course", async () => {
    await adminDb.collection("testTopics").doc("existing-topic").set({
      organizationId: ORGANIZATION_ID,
      courseId: COURSE_ID,
      name: "Existing Topic",
      slug: "networking-fundamentals",
      sortOrder: 0,
      questionCount: 0,
      active: true,
      createdBy: OWNER_UID,
    });

    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(
          OWNER_UID,
          validTopicData({ slug: "Networking Fundamentals!!!" }),
        ),
      ),
    ).rejects.toMatchObject({ code: "already-exists" });
  });

  it("normalizes the topic slug", async () => {
    const result = await completeOrganizationFirstTopic.run(
      callableRequest(
        OWNER_UID,
        validTopicData({
          name: "Network Security Basics",
          slug: "  Network & Security Basics!!!  ",
        }),
      ),
    );
    expect(result).toMatchObject({
      success: true,
      topic: {
        name: "Network Security Basics",
        slug: "network-security-basics",
      },
    });
  });

  it("assigns the next available sort order for this course", async () => {
    await adminDb.collection("testTopics").doc("topic-one").set({
      organizationId: ORGANIZATION_ID,
      courseId: COURSE_ID,
      slug: "topic-one",
      sortOrder: 0,
    });
    await adminDb.collection("testTopics").doc("topic-two").set({
      organizationId: ORGANIZATION_ID,
      courseId: COURSE_ID,
      slug: "topic-two",
      sortOrder: 3,
    });

    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData({ slug: "topic-three" })),
    );
    expect(result).toMatchObject({
      success: true,
      topic: { sortOrder: 4 },
    });
  });

  it("rejects a topic name that is too short", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(OWNER_UID, validTopicData({ name: "A" })),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid slug", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(OWNER_UID, validTopicData({ slug: "---" })),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a non-boolean active value", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(
          OWNER_UID,
          validTopicData({ active: "true" as unknown as boolean }),
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("uses the persisted Test Center steps to determine the next step", async () => {
    await updateTestCenterOnboarding({
      steps: ["first_program", "first_course", "first_topic", "first_question"],
      completedSteps: ["first_program", "first_course"],
      firstTopicId: null,
    });
    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData()),
    );
    expect(result).toMatchObject({
      success: true,
      onboarding: {
        currentStep: "first_question",
        status: "in_progress",
        isComplete: false,
      },
    });
  });

  it("completes Test Center setup when first_topic is the final configured step", async () => {
    await updateTestCenterOnboarding({
      steps: TOPIC_FINAL_STEPS,
      completedSteps: ["first_program", "first_course"],
      firstTopicId: null,
    });
    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData()),
    );
    expect(result).toMatchObject({
      success: true,
      onboarding: {
        currentStep: null,
        completedSteps: ["first_program", "first_course", "first_topic"],
        status: "completed",
        isComplete: true,
      },
    });
    expect((await entitlementRef().get()).data()?.onboarding).toMatchObject({
      steps: TOPIC_FINAL_STEPS,
      currentStep: null,
      status: "completed",
    });
  });

  it("preserves previously completed Test Center steps", async () => {
    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData()),
    );
    expect(result).toMatchObject({
      onboarding: {
        completedSteps: ["first_program", "first_course", "first_topic"],
      },
    });
  });

  it("does not create a topic or advance setup when validation fails", async () => {
    await expect(
      completeOrganizationFirstTopic.run(
        callableRequest(OWNER_UID, validTopicData({ slug: "---" })),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });

    expect((await adminDb.collection("testTopics").get()).empty).toBe(true);
    expect((await entitlementRef().get()).data()?.onboarding).toMatchObject({
      firstTopicId: null,
      currentStep: "first_topic",
      completedSteps: ["first_program", "first_course"],
    });
  });

  it("does not count topics belonging to another course when assigning sort order", async () => {
    await adminDb.collection("testTopics").doc("other-course-topic").set({
      organizationId: ORGANIZATION_ID,
      courseId: OTHER_COURSE_ID,
      name: "Other Course Topic",
      slug: "other-course-topic",
      sortOrder: 99,
      questionCount: 0,
      active: true,
    });

    const result = await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData({ slug: "valid-first-topic" })),
    );
    expect(result).toMatchObject({ success: true, topic: { sortOrder: 0 } });
  });

  it("does not mutate core organization onboarding when setup is completed", async () => {
    await completeOrganizationFirstTopic.run(
      callableRequest(OWNER_UID, validTopicData()),
    );
    const core = (await adminDb.collection("organizationOnboarding").doc(ORGANIZATION_ID).get()).data();

    expect(core?.requiredSteps).toEqual(CORE_ORGANIZATION_STEPS);
    expect(core?.completedSteps).toEqual(CORE_ORGANIZATION_STEPS);
    expect(core?.currentStep).toBe("configuration");
    expect(core).not.toHaveProperty("firstProgramId");
    expect(core).not.toHaveProperty("firstCourseId");
    expect(core).not.toHaveProperty("firstTopicId");
    expect(core).not.toHaveProperty("firstQuestionId");
  });
});
