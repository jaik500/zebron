import { HttpsError } from "firebase-functions/v2/https";

/**
 * Test Center setup steps belong to the Test Center application,
 * not to the organization's core onboarding workflow.
 */
export const TEST_CENTER_SETUP_STEPS = [
  "first_program",
  "first_quiz",
  "first_topic",
  "first_question",
] as const;

export type TestCenterSetupStep =
  (typeof TEST_CENTER_SETUP_STEPS)[number];

export type TestCenterSetupStatus =
  | "not_started"
  | "in_progress"
  | "completed";

/**
 * Setup state persisted inside the Test Center application entitlement.
 */
export interface TestCenterSetupState {
  steps: TestCenterSetupStep[];
  currentStep: TestCenterSetupStep | null;
  completedSteps: TestCenterSetupStep[];
  status: TestCenterSetupStatus;

  firstProgramId: string | null;
  firstQuizId: string | null;
  firstTopicId: string | null;
  firstQuestionId: string | null;

  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Result returned when a Test Center setup step advances.
 */
export interface TestCenterSetupTransitionResult {
  currentStep: TestCenterSetupStep | null;
  completedSteps: TestCenterSetupStep[];
  status: TestCenterSetupStatus;
  isComplete: boolean;
}

/**
 * Checks whether a value is a supported Test Center setup step.
 */
export function isTestCenterSetupStep(
  value: unknown,
): value is TestCenterSetupStep {
  return (
    typeof value === "string" &&
    TEST_CENTER_SETUP_STEPS.includes(
      value as TestCenterSetupStep,
    )
  );
}

/**
 * Normalizes configured setup steps, preserving their order
 * while removing invalid values and duplicates.
 */
export function normalizeTestCenterSetupSteps(
  value: unknown,
): TestCenterSetupStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: TestCenterSetupStep[] = [];

  for (const candidate of value) {
    if (
      isTestCenterSetupStep(candidate) &&
      !result.includes(candidate)
    ) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Normalizes completed steps against the configured workflow.
 */
export function normalizeCompletedTestCenterSetupSteps(
  completed: unknown,
  required: readonly TestCenterSetupStep[],
): TestCenterSetupStep[] {
  if (!Array.isArray(completed)) {
    return [];
  }

  const result: TestCenterSetupStep[] = [];

  for (const candidate of completed) {
    if (
      isTestCenterSetupStep(candidate) &&
      required.includes(candidate) &&
      !result.includes(candidate)
    ) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Finds the first required step that has not been completed.
 */
export function getNextTestCenterSetupStep(
  steps: readonly TestCenterSetupStep[],
  completedSteps: readonly TestCenterSetupStep[],
): TestCenterSetupStep | null {
  return (
    steps.find(
      (step) => !completedSteps.includes(step),
    ) ?? null
  );
}

/**
 * Initializes setup state while preserving valid existing progress.
 *
 * An empty configured workflow is treated as not started rather
 * than completed. Only a nonempty workflow with every step
 * completed is considered complete.
 */
export function initializeTestCenterSetup(
  configuredSteps: unknown,
  existingState?: Partial<TestCenterSetupState> | null,
): TestCenterSetupState {
  const steps =
    normalizeTestCenterSetupSteps(configuredSteps);

  const completedSteps =
    normalizeCompletedTestCenterSetupSteps(
      existingState?.completedSteps,
      steps,
    );

  const currentStep =
    getNextTestCenterSetupStep(
      steps,
      completedSteps,
    );

  const status: TestCenterSetupStatus =
    steps.length === 0
      ? "not_started"
      : currentStep === null
        ? "completed"
        : completedSteps.length === 0
          ? "not_started"
          : "in_progress";

  return {
    steps,
    currentStep,
    completedSteps,
    status,

    firstProgramId:
      typeof existingState?.firstProgramId === "string"
        ? existingState.firstProgramId
        : null,

    firstQuizId:
      typeof existingState?.firstQuizId === "string"
        ? existingState.firstQuizId
        : null,

    firstTopicId:
      typeof existingState?.firstTopicId === "string"
        ? existingState.firstTopicId
        : null,

    firstQuestionId:
      typeof existingState?.firstQuestionId === "string"
        ? existingState.firstQuestionId
        : null,

    ...(existingState?.startedAt !== undefined
      ? { startedAt: existingState.startedAt }
      : {}),

    ...(existingState?.completedAt !== undefined
      ? { completedAt: existingState.completedAt }
      : {}),

    ...(existingState?.updatedAt !== undefined
      ? { updatedAt: existingState.updatedAt }
      : {}),
  };
}

/**
 * Validates that a requested setup step is the current step
 * in the Test Center application workflow.
 */
export function assertCurrentTestCenterSetupStep(
  setup: Partial<TestCenterSetupState>,
  expectedStep: TestCenterSetupStep,
): asserts setup is TestCenterSetupState {
  const steps =
    normalizeTestCenterSetupSteps(setup.steps);

  const completedSteps =
    normalizeCompletedTestCenterSetupSteps(
      setup.completedSteps,
      steps,
    );

  if (setup.status === "completed") {
    throw new HttpsError(
      "failed-precondition",
      "Test Center setup has already been completed.",
    );
  }

  if (
    !steps.includes(expectedStep) ||
    setup.currentStep !== expectedStep ||
    completedSteps.includes(expectedStep)
  ) {
    throw new HttpsError(
      "failed-precondition",
      `The current Test Center setup step must be ${expectedStep}.`,
    );
  }

  if (
    setup.status !== "not_started" &&
    setup.status !== "in_progress"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Test Center setup has not been initialized.",
    );
  }
}

/**
 * Marks the current setup step complete and computes the next step.
 */
export function advanceTestCenterSetup(
  setup: TestCenterSetupState,
  completedStep: TestCenterSetupStep,
): TestCenterSetupTransitionResult {
  assertCurrentTestCenterSetupStep(
    setup,
    completedStep,
  );

  const completedSteps = [
    ...setup.completedSteps,
    completedStep,
  ];

  const currentStep =
    getNextTestCenterSetupStep(
      setup.steps,
      completedSteps,
    );

  const isComplete =
    setup.steps.length > 0 &&
    currentStep === null;

  return {
    currentStep,
    completedSteps,
    status: isComplete
      ? "completed"
      : "in_progress",
    isComplete,
  };
}