import { Timestamp } from 'firebase/firestore';

export type OrganizationOnboardingStep =
  | 'organization_profile'
  | 'owner_profile'
  | 'invite_members'
  | 'configuration'
  | 'first_program'
  | 'first_course'
  | 'first_topic'
  | 'first_question';

export type OrganizationOnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export interface OrganizationOnboarding {
  id: string;
  organizationId: string;
  ownerUserId: string;

  status: OrganizationOnboardingStatus;

  currentStep: OrganizationOnboardingStep;

  completedSteps: OrganizationOnboardingStep[];

  startedAt?: Timestamp;
  completedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}