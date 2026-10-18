import { Injectable } from '@angular/core';

import {
  OrganizationOnboardingStep,
} from '../models/organization-onboarding.model';

/**
 * Resolves the core organization onboarding workflow.
 *
 * Organization onboarding is independent of application-specific setup.
 * Applications such as Test Center manage their own setup workflows through
 * their organization application entitlements.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationOnboardingStepResolverService {
  /**
   * The complete core organization onboarding workflow.
   *
   * Configuration is always the final step.
   */
  private readonly baseSteps: readonly OrganizationOnboardingStep[] = [
    'organization_profile',
    'owner_profile',
    'invite_members',
    'configuration',
  ];

  /**
   * Return the canonical core organization onboarding steps.
   *
   * The optional argument is retained for compatibility with existing
   * callers. Application assignments never add steps to core onboarding.
   */
  resolve(
    _applications: readonly unknown[] = [],
  ): OrganizationOnboardingStep[] {
    return [...this.baseSteps];
  }

  /**
   * Determine whether an application is active for an organization.
   *
   * This is a convenience method only. Application authorization must
   * continue to be enforced by the appropriate access service and backend.
   */
  isApplicationActive(
    applications: readonly {
      applicationId: string;
      status: string;
    }[],
    applicationId: string,
  ): boolean {
    return applications.some(
      application =>
        application.applicationId === applicationId &&
        application.status === 'active',
    );
  }

  /**
   * Return the next core onboarding step.
   *
   * Configuration has no next step.
   */
  getNextStep(
    currentStep: OrganizationOnboardingStep,
    applications: readonly unknown[] = [],
  ): OrganizationOnboardingStep | null {
    const steps = this.resolve(applications);
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < 0) {
      return null;
    }

    return steps[currentIndex + 1] ?? null;
  }

  /**
   * Return the previous core onboarding step.
   */
  getPreviousStep(
    currentStep: OrganizationOnboardingStep,
    applications: readonly unknown[] = [],
  ): OrganizationOnboardingStep | null {
    const steps = this.resolve(applications);
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex <= 0) {
      return null;
    }

    return steps[currentIndex - 1] ?? null;
  }

  /**
   * Determine whether a step belongs to core organization onboarding.
   */
  isStepRequired(
    step: OrganizationOnboardingStep,
    applications: readonly unknown[] = [],
  ): boolean {
    return this.resolve(applications).includes(step);
  }

  /**
   * Return the number of core onboarding steps.
   */
  getStepCount(
    applications: readonly unknown[] = [],
  ): number {
    return this.resolve(applications).length;
  }

  /**
   * Return the one-based position of a core onboarding step.
   */
  getStepNumber(
    currentStep: OrganizationOnboardingStep,
    applications: readonly unknown[] = [],
  ): number {
    const index = this.resolve(applications).indexOf(currentStep);

    return index >= 0 ? index + 1 : 1;
  }

  /**
   * Determine whether a step is the final core onboarding step.
   */
  isFinalStep(
    currentStep: OrganizationOnboardingStep,
    applications: readonly unknown[] = [],
  ): boolean {
    const steps = this.resolve(applications);

    return steps.length > 0 &&
      steps[steps.length - 1] === currentStep;
  }
}