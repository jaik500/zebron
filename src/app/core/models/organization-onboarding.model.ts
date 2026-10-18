import { Timestamp } from 'firebase/firestore';

/**
 * Canonical steps for core organization onboarding.
 *
 * Application-specific setup, such as creating Test Center
 * programs, courses, topics, and questions, does not belong
 * to the core organization onboarding workflow.
 */
export type OrganizationOnboardingStep =
  | 'organization_profile'
  | 'owner_profile'
  | 'invite_members'
  | 'configuration';

export type OrganizationOnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export interface OrganizationOnboarding {
  id: string;

  organizationId: string;

  ownerUserId: string;

  status: OrganizationOnboardingStatus;

  /**
   * Authoritative core onboarding workflow persisted during
   * organization provisioning.
   *
   * The frontend must not reconstruct this workflow from the
   * organization's currently selected applications.
   */
  requiredSteps: OrganizationOnboardingStep[];

  /**
   * Current step in the persisted core onboarding workflow.
   */
  currentStep: OrganizationOnboardingStep;

  /**
   * Core onboarding steps that have already been completed.
   */
  completedSteps: OrganizationOnboardingStep[];

  startedAt?: Timestamp;

  completedAt?: Timestamp | null;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}