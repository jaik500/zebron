import { HttpsError } from "firebase-functions/v2/https";

/**
 * Core organization onboarding steps.
 *
 * Application-specific setup steps must never be added here.
 * Each application owns its own setup workflow and lifecycle.
 */
export type OrganizationOnboardingStep =
  | "organization_profile"
  | "owner_profile"
  | "invite_members"
  | "configuration";

/**
 * Core organization onboarding status.
 *
 * This status describes only the core onboarding workflow.
 * It does not describe the organization's overall lifecycle
 * or the setup status of any application.
 */
export type OrganizationOnboardingStatus =
  | "not_started"
  | "in_progress"
  | "completed";

/**
 * Minimal onboarding state required by transition helpers.
 */
export interface OrganizationOnboardingTransitionState {
  requiredSteps?: unknown;
  currentStep?: unknown;
  completedSteps?: unknown;
  status?: unknown;
}

/**
 * Result of advancing the core onboarding workflow.
 */
export interface OnboardingTransitionResult {
  currentStep: OrganizationOnboardingStep;
  completedSteps: OrganizationOnboardingStep[];
  status: OrganizationOnboardingStatus;
  isComplete: boolean;
}

/**
 * The only supported steps in core organization onboarding.
 *
 * Keep this sequence stable unless the core onboarding
 * requirements intentionally change.
 */
export const BASE_ORGANIZATION_ONBOARDING_STEPS:
  readonly OrganizationOnboardingStep[] = [
    "organization_profile",
    "owner_profile",
    "invite_members",
    "configuration",
  ];

/**
 * Runtime validation for core organization onboarding steps.
 *
 * Application-specific steps such as first_program,
 * first_quiz, first_topic, and first_question are
 * deliberately excluded.
 */
export function isOrganizationOnboardingStep(
  value: unknown,
): value is OrganizationOnboardingStep {
  return (
    value === "organization_profile" ||
    value === "owner_profile" ||
    value === "invite_members" ||
    value === "configuration"
  );
}

/**
 * Runtime validation for core onboarding status.
 */
export function isOrganizationOnboardingStatus(
  value: unknown,
): value is OrganizationOnboardingStatus {
  return (
    value === "not_started" ||
    value === "in_progress" ||
    value === "completed"
  );
}

/**
 * Normalize persisted core onboarding steps.
 *
 * Core onboarding always follows the canonical four-step workflow.
 *
 * The persisted requiredSteps field is intentionally not treated
 * as authoritative because older records may contain application-
 * specific steps that no longer belong to core onboarding.
 *
 * Application-specific setup workflows must be resolved by their
 * respective application services.
 */
export function normalizeRequiredSteps(
  _value: unknown,
): OrganizationOnboardingStep[] {
  return [...BASE_ORGANIZATION_ONBOARDING_STEPS];
}

/**
 * Normalize completed core onboarding steps.
 *
 * Legacy application-specific steps are ignored.
 */
export function normalizeCompletedSteps(
  value: unknown,
): OrganizationOnboardingStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(isOrganizationOnboardingStep),
    ),
  );
}

/**
 * Resolve the next core onboarding step.
 *
 * Returns null when the current step is configuration
 * or when the current step is invalid.
 */
export function getNextOnboardingStep(
  onboarding: OrganizationOnboardingTransitionState,
): OrganizationOnboardingStep | null {
  const requiredSteps = normalizeRequiredSteps(
    onboarding.requiredSteps,
  );

  const currentStep = onboarding.currentStep;

  if (!isOrganizationOnboardingStep(currentStep)) {
    return requiredSteps[0] ?? null;
  }

  const currentIndex = requiredSteps.indexOf(currentStep);

  if (currentIndex === -1) {
    return requiredSteps[0] ?? null;
  }

  return requiredSteps[currentIndex + 1] ?? null;
}

/**
 * Complete the current core onboarding step.
 *
 * Completing configuration completes core onboarding.
 * It does not automatically activate the organization
 * or complete any application's setup workflow.
 */
export function advanceOnboarding(
  onboarding: OrganizationOnboardingTransitionState,
): OnboardingTransitionResult {
  if (onboarding.status !== "in_progress") {
    throw new HttpsError(
      "failed-precondition",
      "Organization onboarding is not in progress.",
    );
  }

  const requiredSteps = normalizeRequiredSteps(
    onboarding.requiredSteps,
  );

  const currentStep = onboarding.currentStep;

  if (!isOrganizationOnboardingStep(currentStep)) {
    throw new HttpsError(
      "failed-precondition",
      "The organization onboarding current step is invalid.",
    );
  }

  if (!requiredSteps.includes(currentStep)) {
    throw new HttpsError(
      "failed-precondition",
      `The onboarding step "${currentStep}" is not part of the organization's core onboarding workflow.`,
    );
  }

  const completedSteps = normalizeCompletedSteps(
    onboarding.completedSteps,
  );

  const nextCompletedSteps = Array.from(
    new Set([
      ...completedSteps,
      currentStep,
    ]),
  );

  const currentIndex = requiredSteps.indexOf(currentStep);
  const nextStep = requiredSteps[currentIndex + 1] ?? null;

  if (nextStep === null) {
    return {
      currentStep,
      completedSteps: nextCompletedSteps,
      status: "completed",
      isComplete: true,
    };
  }

  return {
    currentStep: nextStep,
    completedSteps: nextCompletedSteps,
    status: "in_progress",
    isComplete: false,
  };
}

/**
 * Validate that a callable is being invoked for the
 * organization's current core onboarding step.
 */
export function assertCurrentOnboardingStep(
  onboarding: OrganizationOnboardingTransitionState,
  expectedStep: OrganizationOnboardingStep,
): void {
  if (onboarding.status !== "in_progress") {
    throw new HttpsError(
      "failed-precondition",
      "Organization onboarding is not in progress.",
    );
  }

  if (!isOrganizationOnboardingStep(expectedStep)) {
    throw new HttpsError(
      "invalid-argument",
      "The requested step is not a valid core organization onboarding step.",
    );
  }

  if (onboarding.currentStep !== expectedStep) {
    throw new HttpsError(
      "failed-precondition",
      `The current onboarding step is "${String(
        onboarding.currentStep ?? "unknown",
      )}", not "${expectedStep}".`,
    );
  }

  const requiredSteps = normalizeRequiredSteps(
    onboarding.requiredSteps,
  );

  if (!requiredSteps.includes(expectedStep)) {
    throw new HttpsError(
      "failed-precondition",
      `The onboarding step "${expectedStep}" is not required for this organization.`,
    );
  }
}