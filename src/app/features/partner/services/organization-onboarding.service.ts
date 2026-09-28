import { Injectable } from '@angular/core';

import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../../../core/models/organization-onboarding.model';

export interface OrganizationOnboardingProfileInput {
  name: string;
  companyNumber?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  slug?: string;
  locationId?: string;
}

export interface UpdateOrganizationOnboardingProfileResponse {
  success: boolean;
  organizationId: string;
  onboardingId: string;
  currentStep: OrganizationOnboardingStep;
  completedSteps: OrganizationOnboardingStep[];
}

export interface OrganizationOnboardingOwnerProfileInput {
  firstName: string;
  lastName: string;
  preferredName?: string;
  phone?: string;
}

export interface UpdateOrganizationOnboardingOwnerProfileResponse {
  success: boolean;
  organizationId: string;
  onboardingId: string;
  currentStep: OrganizationOnboardingStep;
  completedSteps: OrganizationOnboardingStep[];
}

interface UpdateOrganizationOnboardingOwnerProfileRequest {
  organizationId: string;
  profile: OrganizationOnboardingOwnerProfileInput;
}

interface UpdateOrganizationOnboardingProfileRequest {
  organizationId: string;
  profile: OrganizationOnboardingProfileInput;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationOnboardingService {
  private readonly firestore = getFirestore();
  private readonly functions = getFunctions();

  private readonly onboardingCollection =
    'organizationOnboarding';

  /**
   * Load the onboarding state for an organization.
   *
   * Document:
   * organizationOnboarding/{organizationId}
   */
  async getOnboarding(
    organizationId: string,
  ): Promise<OrganizationOnboarding | null> {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required.');
    }

    const onboardingRef = doc(
      this.firestore,
      this.onboardingCollection,
      organizationId,
    );

    const snapshot = await getDoc(onboardingRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as OrganizationOnboarding;
  }

  /**
   * Update the organization profile during onboarding.
   *
   * The organization document is NOT written directly from
   * the browser. The trusted Cloud Function performs the
   * update and advances the onboarding state.
   */
  async updateOrganizationProfile(
    organizationId: string,
    profile: OrganizationOnboardingProfileInput,
  ): Promise<UpdateOrganizationOnboardingProfileResponse> {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required.');
    }

    if (!profile.name?.trim()) {
      throw new Error('Organization name is required.');
    }

    const callable = httpsCallable<
      UpdateOrganizationOnboardingProfileRequest,
      UpdateOrganizationOnboardingProfileResponse
    >(
      this.functions,
      'updateOrganizationOnboardingProfile',
    );

    const result = await callable({
      organizationId,
      profile: this.normalizeProfile(profile),
    });

    return result.data;
  }

  /**
 * Update the organization owner's profile during onboarding.
 *
 * The trusted Cloud Function:
 *
 * - validates the authenticated owner
 * - updates users/{uid}
 * - advances owner_profile -> invite_members
 * - writes the audit event
 */
async updateOwnerProfile(
  organizationId: string,
  profile: OrganizationOnboardingOwnerProfileInput,
): Promise<UpdateOrganizationOnboardingOwnerProfileResponse> {
  if (!organizationId?.trim()) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  if (!profile.firstName?.trim()) {
    throw new Error(
      'First name is required.',
    );
  }

  if (!profile.lastName?.trim()) {
    throw new Error(
      'Last name is required.',
    );
  }

  const callable = httpsCallable<
    UpdateOrganizationOnboardingOwnerProfileRequest,
    UpdateOrganizationOnboardingOwnerProfileResponse
  >(
    this.functions,
    'updateOrganizationOnboardingOwnerProfile',
  );

  const result = await callable({
    organizationId,
    profile:
      this.normalizeOwnerProfile(profile),
  });

  return result.data;
}

private normalizeOwnerProfile(
  profile: OrganizationOnboardingOwnerProfileInput,
): OrganizationOnboardingOwnerProfileInput {
  return {
    firstName:
      profile.firstName.trim(),

    lastName:
      profile.lastName.trim(),

    preferredName:
      this.normalizeOptionalString(
        profile.preferredName,
      ),

    phone:
      this.normalizeOptionalString(
        profile.phone,
      ),
  };
}

  /**
   * Complete an onboarding step.
   *
   * Use this only for steps that are safe to update directly
   * in the onboarding document. Organization profile changes
   * should use updateOrganizationProfile().
   */
  async completeStep(
    organizationId: string,
    step: OrganizationOnboardingStep,
    nextStep: OrganizationOnboardingStep | null,
    completedSteps: OrganizationOnboardingStep[],
  ): Promise<void> {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required.');
    }

    const onboardingRef = doc(
      this.firestore,
      this.onboardingCollection,
      organizationId,
    );

    const allCompletedSteps = Array.from(
      new Set([
        ...completedSteps,
        step,
      ]),
    );

    const isComplete = nextStep === null;

    await updateDoc(onboardingRef, {
      completedSteps: allCompletedSteps,
      currentStep: nextStep ?? step,
      status: isComplete
        ? 'completed'
        : 'in_progress',
      completedAt: isComplete
        ? serverTimestamp()
        : null,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Normalize optional profile values before sending
   * them to the Cloud Function.
   */
  private normalizeProfile(
    profile: OrganizationOnboardingProfileInput,
  ): OrganizationOnboardingProfileInput {
    return {
      name: profile.name.trim(),

      companyNumber:
        this.normalizeOptionalString(
          profile.companyNumber,
        ),

      description:
        this.normalizeOptionalString(
          profile.description,
        ),

      website:
        this.normalizeOptionalString(
          profile.website,
        ),

      phone:
        this.normalizeOptionalString(
          profile.phone,
        ),

      email:
        this.normalizeOptionalString(
          profile.email,
        ),

      slug:
        this.normalizeOptionalString(
          profile.slug,
        ),

      locationId:
        this.normalizeOptionalString(
          profile.locationId,
        ),
    };
  }

  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {
    const normalized = value?.trim();

    return normalized || undefined;
  }
}