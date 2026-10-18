/**
 * Test Center setup is application-specific.
 *
 * These steps must remain separate from the organization's
 * core onboarding workflow.
 */
export const TEST_CENTER_SETUP_STEPS = [
  'first_program',
  'first_course',
  'first_topic',
  'first_question',
] as const;

/**
 * Supported Test Center setup steps.
 */
export type TestCenterSetupStep =
  (typeof TEST_CENTER_SETUP_STEPS)[number];

/**
 * Lifecycle status of Test Center setup.
 *
 * An empty configured workflow is not started, not completed.
 */
export type TestCenterSetupStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

/**
 * Setup state stored inside:
 *
 * organizations/{organizationId}/applications/test-center
 *
 * under the nested `onboarding` field.
 *
 * Keep this model independent of OrganizationOnboarding.
 */
export interface TestCenterSetupState {
  /**
   * Application-specific workflow steps.
   */
  steps: TestCenterSetupStep[];

  /**
   * Current Test Center setup step.
   *
   * Null when there is no remaining step.
   */
  currentStep: TestCenterSetupStep | null;

  /**
   * Completed Test Center setup steps.
   */
  completedSteps: TestCenterSetupStep[];

  /**
   * Application-specific setup status.
   */
  status: TestCenterSetupStatus;

  /**
   * IDs of the resources created during setup.
   */
  firstProgramId: string | null;
  firstCourseId: string | null;
  firstTopicId: string | null;
  firstQuestionId: string | null;

  /**
   * Lifecycle timestamps.
   *
   * These remain `unknown` because their serialized representation
   * can depend on the Firestore SDK and the data source.
   */
  startedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Response returned by a Test Center setup transition.
 */
export interface TestCenterSetupTransitionResult {
  currentStep: TestCenterSetupStep | null;
  completedSteps: TestCenterSetupStep[];
  status: TestCenterSetupStatus;
  isComplete: boolean;
}