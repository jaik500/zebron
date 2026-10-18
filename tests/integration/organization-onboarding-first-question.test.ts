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

const require = createRequire(import.meta.url);
const admin = require(
  "../../functions/node_modules/firebase-admin",
) as typeof import("firebase-admin");

const PROJECT_ID = "zebron-test";
const ORGANIZATION_ID = "first-question-test-org";
const OTHER_ORGANIZATION_ID = "other-first-question-test-org";
const OWNER_UID = "first-question-owner";
const ADMIN_UID = "first-question-admin";
const MANAGER_UID = "first-question-manager";
const MEMBER_UID = "first-question-member";
const INACTIVE_UID = "first-question-inactive";
const COURSE_ID = "first-question-course";
const TOPIC_ID = "first-question-topic";
const OTHER_COURSE_ID = "other-first-question-course";
const OTHER_TOPIC_ID = "other-first-question-topic";

const CORE_STEPS = [
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

type Option = { text: string; isCorrect: boolean };
type Input = {
  organizationId: string;
  courseId?: string;
  topicId?: string;
  question: string;
  explanation?: string;
  options: Option[];
  active: boolean;
};
type Setup = {
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

let db: Firestore;
let completeOrganizationFirstQuestion: {
  run: (request: CallableRequest<Input>) => Promise<unknown>;
};

function callableRequest(
  uid: string | undefined,
  data: Input,
): CallableRequest<Input> {
  return {
    data,
    auth: uid
      ? { uid, token: { uid, email: `${uid}@example.com` }, rawToken: "" }
      : undefined,
    instanceIdToken: undefined,
    rawRequest: undefined,
  } as unknown as CallableRequest<Input>;
}

function entitlementRef(organizationId = ORGANIZATION_ID) {
  return db
    .collection("organizations")
    .doc(organizationId)
    .collection("applications")
    .doc("test-center");
}

async function createOrganization(
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await db.collection("organizations").doc(organizationId).set({
    id: organizationId,
    name: "First Question Test Organization",
    slug: organizationId,
    status: "onboarding",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function createMembership(
  uid: string,
  role: string,
  active = true,
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await db.collection("organizationMemberships")
    .doc(`${uid}_${organizationId}`)
    .set({
      id: `${uid}_${organizationId}`,
      userId: uid,
      organizationId,
      role,
      active,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function createCourse(
  courseId = COURSE_ID,
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await db.collection("testCourses").doc(courseId).set({
    id: courseId,
    organizationId,
    name: "First Question Course",
    slug: courseId,
    active: true,
    questionCount: 0,
    createdBy: OWNER_UID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function createTopic(
  topicId = TOPIC_ID,
  courseId = COURSE_ID,
  organizationId = ORGANIZATION_ID,
): Promise<void> {
  await db.collection("testTopics").doc(topicId).set({
    id: topicId,
    organizationId,
    courseId,
    name: "First Question Topic",
    slug: topicId,
    active: true,
    questionCount: 0,
    createdBy: OWNER_UID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function createEntitlement(
  overrides: Partial<Setup> = {},
  entitlementStatus = "active",
): Promise<void> {
  const onboarding: Setup = {
    steps: [...TEST_CENTER_STEPS],
    currentStep: "first_question",
    completedSteps: ["first_program", "first_course", "first_topic"],
    status: "in_progress",
    firstProgramId: "first-question-program",
    firstCourseId: COURSE_ID,
    firstTopicId: TOPIC_ID,
    firstQuestionId: null,
    ...overrides,
  };
  await entitlementRef().set({
    applicationKey: "test-center",
    status: entitlementStatus,
    onboarding,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function createCoreOnboarding(): Promise<void> {
  await db.collection("organizationOnboarding").doc(ORGANIZATION_ID).set({
    id: ORGANIZATION_ID,
    organizationId: ORGANIZATION_ID,
    status: "completed",
    currentStep: "configuration",
    requiredSteps: CORE_STEPS,
    completedSteps: CORE_STEPS,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function deleteCollection(collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((document) => batch.delete(document.ref));
  await batch.commit();
}

const validInput = (): Input => ({
  organizationId: ORGANIZATION_ID,
  question: "What does HTTP stand for?",
  explanation: "HTTP is the Hypertext Transfer Protocol.",
  options: [
    { text: "Hypertext Transfer Protocol", isCorrect: true },
    { text: "High Transfer Text Process", isCorrect: false },
    { text: "Hyper Transfer Technical Program", isCorrect: false },
    { text: "Host Text Transmission Protocol", isCorrect: false },
  ],
  active: true,
});

async function expectCallableError(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  let caught: unknown;

  try {
    await promise;
  } catch (error) {
    caught = error;
  }

  if (!caught) {
    throw new Error(`Expected callable to reject with ${code}.`);
  }

  expect(caught).toMatchObject({ code });
}

beforeAll(async () => {
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  db = admin.firestore();

  const module = await import(
    "../../functions/src/organization-onboarding-first-question"
  );
  completeOrganizationFirstQuestion =
    module.completeOrganizationFirstQuestion as unknown as typeof completeOrganizationFirstQuestion;
});

beforeEach(async () => {
  await Promise.all([
    deleteCollection("organizations"),
    deleteCollection("organizationMemberships"),
    deleteCollection("organizationOnboarding"),
    deleteCollection("testCourses"),
    deleteCollection("testTopics"),
    deleteCollection("testQuestions"),
  ]);

  await createOrganization();
  await createMembership(OWNER_UID, "org_owner");
  await createMembership(ADMIN_UID, "org_admin");
  await createMembership(MANAGER_UID, "org_manager");
  await createMembership(MEMBER_UID, "org_member");
  await createMembership(INACTIVE_UID, "org_admin", false);
  await createCourse();
  await createTopic();
  await createEntitlement();
  await createCoreOnboarding();
});

afterAll(async () => {
  if (admin.apps.length) {
    await Promise.all(admin.apps.map((app) => app?.delete()));
  }
});

describe("completeOrganizationFirstQuestion", () => {
  it("creates the first question and completes the configured Test Center workflow", async () => {
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    ) as any;

    expect(result.success).toBe(true);
    expect(result.question.id).toBeTruthy();
    expect(result.question.courseId).toBe(COURSE_ID);
    expect(result.question.topicId).toBe(TOPIC_ID);
    expect(result.onboarding).toMatchObject({
      firstQuestionId: result.question.id,
      currentStep: null,
      status: "completed",
      isComplete: true,
    });

    const question = await db.collection("testQuestions").doc(result.question.id).get();
    expect(question.data()).toMatchObject({
      organizationId: ORGANIZATION_ID,
      courseId: COURSE_ID,
      topicId: TOPIC_ID,
      question: "What does HTTP stand for?",
      type: "multiple-choice",
      active: true,
    });

    const entitlement = (await entitlementRef().get()).data();
    expect(entitlement?.onboarding.firstQuestionId).toBe(result.question.id);
    expect(entitlement?.onboarding.completedSteps).toEqual(TEST_CENTER_STEPS);
  });

  it("allows an active organization administrator", async () => {
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(ADMIN_UID, validInput()),
    ) as any;
    expect(result.success).toBe(true);
  });

  it.each([MANAGER_UID, MEMBER_UID])("rejects unauthorized role %s", async (uid) => {
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(uid, validInput())),
      "permission-denied",
    );
  });

  it("rejects an inactive administrator", async () => {
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(INACTIVE_UID, validInput())),
      "permission-denied",
    );
  });

  it("rejects an unauthenticated caller", async () => {
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(undefined, validInput())),
      "unauthenticated",
    );
  });

  it("rejects an unknown organization", async () => {
    const input = { ...validInput(), organizationId: "missing-org" };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "not-found",
    );
  });

  it("rejects a caller without membership", async () => {
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest("nonmember", validInput())),
      "permission-denied",
    );
  });

  it("rejects when Test Center entitlement is missing", async () => {
    await entitlementRef().delete();
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when Test Center onboarding is missing", async () => {
    await entitlementRef().update({ onboarding: admin.firestore.FieldValue.delete() });
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when the current step is not first_question", async () => {
    // The transition helper derives currentStep from configured steps and
    // completedSteps, so make first_topic the next incomplete step.
    await entitlementRef().update({
      "onboarding.completedSteps": ["first_program", "first_course"],
      "onboarding.currentStep": "first_topic",
    });
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when setup is already completed", async () => {
    await createEntitlement({
      currentStep: null,
      completedSteps: [...TEST_CENTER_STEPS],
      status: "completed",
      firstQuestionId: "existing-question",
    });
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when the first course ID is missing", async () => {
    await entitlementRef().update({ "onboarding.firstCourseId": null });
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when the first topic ID is missing", async () => {
    await entitlementRef().update({ "onboarding.firstTopicId": null });
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects when the course belongs to another organization", async () => {
    await createCourse(COURSE_ID, OTHER_ORGANIZATION_ID);
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "permission-denied",
    );
  });

  it("rejects when the topic belongs to another organization", async () => {
    await createTopic(TOPIC_ID, COURSE_ID, OTHER_ORGANIZATION_ID);
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "permission-denied",
    );
  });

  it("rejects when the topic belongs to a different course", async () => {
    await createCourse(OTHER_COURSE_ID);
    await createTopic(TOPIC_ID, OTHER_COURSE_ID);
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, validInput())),
      "failed-precondition",
    );
  });

  it("rejects a supplied courseId that differs from the configured course", async () => {
    const input = { ...validInput(), courseId: OTHER_COURSE_ID };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "failed-precondition",
    );
  });

  it("rejects a supplied topicId that differs from the configured topic", async () => {
    const input = { ...validInput(), topicId: OTHER_TOPIC_ID };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "failed-precondition",
    );
  });

  it("allows courseId and topicId to be omitted", async () => {
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    ) as any;
    expect(result.success).toBe(true);
  });

  it("rejects a question that is too short", async () => {
    const input = { ...validInput(), question: "Hi" };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("rejects fewer than two options", async () => {
    const input = { ...validInput(), options: [{ text: "Only option", isCorrect: true }] };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("rejects more than ten options", async () => {
    const input = {
      ...validInput(),
      options: Array.from({ length: 11 }, (_, index) => ({
        text: `Option ${index + 1}`,
        isCorrect: index === 0,
      })),
    };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("rejects when no option is correct", async () => {
    const input = {
      ...validInput(),
      options: validInput().options.map((option) => ({ ...option, isCorrect: false })),
    };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("rejects when multiple options are marked correct", async () => {
    const input = {
      ...validInput(),
      options: validInput().options.map((option, index) => ({
        ...option,
        isCorrect: index < 2,
      })),
    };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("rejects a non-boolean active value", async () => {
    const input = { ...validInput(), active: "yes" } as unknown as Input;
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
  });

  it("normalizes question and option text", async () => {
    const input = {
      ...validInput(),
      question: "  What does HTTP stand for?  ",
      options: validInput().options.map((option) => ({
        ...option,
        text: `  ${option.text}  `,
      })),
    };
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, input),
    ) as any;
    expect(result.question.question).toBe("What does HTTP stand for?");
    expect(result.question.options[0].text).toBe("Hypertext Transfer Protocol");
  });

  it("stores a null explanation when explanation is blank", async () => {
    const input = { ...validInput(), explanation: "   " };
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, input),
    ) as any;
    expect(result.question.explanation).toBeNull();
  });

  it("increments the course question count", async () => {
    await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    );
    expect((await db.collection("testCourses").doc(COURSE_ID).get()).data()?.questionCount).toBe(1);
  });

  it("increments the topic question count", async () => {
    await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    );
    expect((await db.collection("testTopics").doc(TOPIC_ID).get()).data()?.questionCount).toBe(1);
  });

  it("uses persisted steps to determine whether first_question completes setup", async () => {
    await createEntitlement({
      steps: ["first_program", "first_course", "first_question"],
      currentStep: "first_question",
      completedSteps: ["first_program", "first_course"],
      firstTopicId: TOPIC_ID,
    });
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    ) as any;
    expect(result.onboarding.isComplete).toBe(true);
    expect(result.onboarding.currentStep).toBeNull();
  });

  it("preserves previously completed Test Center steps", async () => {
    await entitlementRef().update({
      "onboarding.completedSteps": ["first_program", "first_course", "first_topic"],
    });
    const result = await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    ) as any;
    expect(result.onboarding.completedSteps).toEqual(TEST_CENTER_STEPS);
  });

  it("does not mutate core organization onboarding", async () => {
    const before = (await db.collection("organizationOnboarding").doc(ORGANIZATION_ID).get()).data();
    await completeOrganizationFirstQuestion.run(
      callableRequest(OWNER_UID, validInput()),
    );
    const after = (await db.collection("organizationOnboarding").doc(ORGANIZATION_ID).get()).data();
    expect(after?.requiredSteps).toEqual(before?.requiredSteps);
    expect(after?.completedSteps).toEqual(before?.completedSteps);
    expect(after?.currentStep).toBe(before?.currentStep);
    expect(after?.status).toBe(before?.status);
  });

  it("does not create a question or update counters when validation fails", async () => {
    const input = { ...validInput(), question: "No" };
    await expectCallableError(
      completeOrganizationFirstQuestion.run(callableRequest(OWNER_UID, input)),
      "invalid-argument",
    );
    expect((await db.collection("testQuestions").get()).size).toBe(0);
    expect((await db.collection("testCourses").doc(COURSE_ID).get()).data()?.questionCount).toBe(0);
    expect((await db.collection("testTopics").doc(TOPIC_ID).get()).data()?.questionCount).toBe(0);
  });
});
