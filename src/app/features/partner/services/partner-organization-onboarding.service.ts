import { Injectable } from '@angular/core';

import {
  doc,
  getDoc,
  getFirestore,
} from 'firebase/firestore';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../../../core/models/organization-onboarding.model';


/**
 * ---------------------------------------------------------
 * Organization Profile
 * ---------------------------------------------------------
 */

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


interface UpdateOrganizationOnboardingProfileRequest {
  organizationId: string;
  profile: OrganizationOnboardingProfileInput;
}


/**
 * ---------------------------------------------------------
 * Owner Profile
 * ---------------------------------------------------------
 */

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


/**
 * ---------------------------------------------------------
 * Organization Configuration
 * ---------------------------------------------------------
 */

export type OrganizationCourseVisibility =
  | 'all'
  | 'members'
  | 'admins';


export type OrganizationDefaultMemberRole =
  | 'org_member'
  | 'org_staff'
  | 'org_manager';


/**
 * Organization-wide configuration only.
 * Application-specific settings (including Test Center settings)
 * belong to each application's entitlement and are not part of
 * the organization onboarding payload.
 */
export interface OrganizationConfigurationInput {
  allowSelfRegistration: boolean;
  defaultMemberRole: OrganizationDefaultMemberRole;
  adminNotifications: boolean;
  primaryColor: string;
  secondaryColor: string;
}


export interface CompleteOrganizationConfigurationResponse {
  success: boolean;
  organizationId: string;
  currentStep: OrganizationOnboardingStep;
  completedSteps: OrganizationOnboardingStep[];
}


interface CompleteOrganizationConfigurationRequest {
  organizationId: string;
  configuration: OrganizationConfigurationInput;
}

/**
 * ---------------------------------------------------------
 * **/
export interface OrganizationInvitationAcceptanceResponse {
  success: boolean;
  invitationId: string;
  organizationId: string;
  membershipId: string;
  role: string;
}

export interface OrganizationInvitationPreviewResponse {
  success: boolean;
  invitationId: string;
  organizationId: string;
  organizationName: string;
}


/**
 * ---------------------------------------------------------
 * Service
 * ---------------------------------------------------------
 */

@Injectable({
  providedIn: 'root',
})
export class PartnerOrganizationOnboardingService  {

  private readonly firestore =
    getFirestore();

  private readonly functions =
    getFunctions();

  private readonly onboardingCollection =
    'organizationOnboarding';


  /**
   * -------------------------------------------------------
   * Get onboarding state
   * -------------------------------------------------------
   *
   * Loads:
   *
   * organizationOnboarding/{organizationId}
   *
   * The onboarding document is the authoritative source
   * for the current onboarding step.
   */
  async getOnboarding(
    organizationId: string,
  ): Promise<OrganizationOnboarding | null> {

    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    const onboardingRef =
      doc(
        this.firestore,
        this.onboardingCollection,
        normalizedOrganizationId,
      );

    const snapshot =
      await getDoc(onboardingRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as OrganizationOnboarding;
  }

  /**
   * Return the workflow persisted for this organization.
   *
   * `requiredSteps` is authoritative once onboarding has been
   * provisioned. This service intentionally does not recalculate
   * the workflow from organization applications.
   */
  getRequiredOnboardingSteps(
    onboarding: OrganizationOnboarding | null | undefined,
  ): OrganizationOnboardingStep[] {
    return [...(onboarding?.requiredSteps ?? [])];
  }

  /**
   * Determine whether a step is part of the persisted workflow.
   */
  isOnboardingStepRequired(
    onboarding: OrganizationOnboarding | null | undefined,
    step: OrganizationOnboardingStep,
  ): boolean {
    return onboarding?.requiredSteps?.includes(step) ?? false;
  }

  /**
   * Return the zero-based position of a persisted onboarding step.
   */
  getOnboardingStepIndex(
    onboarding: OrganizationOnboarding | null | undefined,
    step: OrganizationOnboardingStep,
  ): number {
    return onboarding?.requiredSteps?.indexOf(step) ?? -1;
  }

  /**
   * Return the next step from the persisted workflow.
   *
   * This is a read-only UI helper. The backend remains responsible
   * for actually advancing onboarding after a successful operation.
   */
  getNextRequiredOnboardingStep(
    onboarding: OrganizationOnboarding | null | undefined,
    currentStep: OrganizationOnboardingStep,
  ): OrganizationOnboardingStep | null {
    const requiredSteps = onboarding?.requiredSteps ?? [];
    const index = requiredSteps.indexOf(currentStep);

    if (index < 0) {
      return null;
    }

    return requiredSteps[index + 1] ?? null;
  }

  /**
   * -------------------------------------------------------
   * Update organization profile
   * -------------------------------------------------------
   *
   * The browser does not directly modify the organization
   * document.
   *
   * The trusted Cloud Function:
   *
   * - validates the caller
   * - validates organization membership
   * - updates the organization
   * - advances the persisted onboarding workflow
   * - writes the audit event
   */
  async updateOrganizationProfile(
    organizationId: string,
    profile: OrganizationOnboardingProfileInput,
  ): Promise<
    UpdateOrganizationOnboardingProfileResponse
  > {

    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    if (!profile.name?.trim()) {
      throw new Error(
        'Organization name is required.',
      );
    }

    const callable =
      httpsCallable<
        UpdateOrganizationOnboardingProfileRequest,
        UpdateOrganizationOnboardingProfileResponse
      >(
        this.functions,
        'updateOrganizationOnboardingProfile',
      );

    const result =
      await callable({
        organizationId:
          normalizedOrganizationId,

        profile:
          this.normalizeProfile(
            profile,
          ),
      });

    return result.data;
  }


  /**
   * -------------------------------------------------------
   * Update owner profile
   * -------------------------------------------------------
   *
   * The trusted Cloud Function:
   *
   * - validates the authenticated owner
   * - updates users/{uid}
   * - advances the persisted onboarding workflow
   * - writes the audit event
   */
  async updateOwnerProfile(
    organizationId: string,
    profile: OrganizationOnboardingOwnerProfileInput,
  ): Promise<
    UpdateOrganizationOnboardingOwnerProfileResponse
  > {

    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
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

    const callable =
      httpsCallable<
        UpdateOrganizationOnboardingOwnerProfileRequest,
        UpdateOrganizationOnboardingOwnerProfileResponse
      >(
        this.functions,
        'updateOrganizationOnboardingOwnerProfile',
      );

    const result =
      await callable({
        organizationId:
          normalizedOrganizationId,

        profile:
          this.normalizeOwnerProfile(
            profile,
          ),
      });

    return result.data;
  }


  /**
   * -------------------------------------------------------
   * Complete organization configuration
   * -------------------------------------------------------
   *
   * Submits the final core organization onboarding step.
   * The backend must complete the canonical four-step organization
   * workflow and must not advance into application-specific setup.
   *
   * IMPORTANT:
   *
   * The browser does NOT update organizationOnboarding
   * directly.
   *
   * The Cloud Function owns:
   *
   * - authorization
   * - configuration validation
   * - organization settings persistence
   * - completedSteps
   * - currentStep
   * - onboarding state
   */
  async completeOrganizationConfiguration(
    organizationId: string,
    configuration: OrganizationConfigurationInput,
  ): Promise<
    CompleteOrganizationConfigurationResponse
  > {

    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    this.validateConfiguration(
      configuration,
    );

    const callable =
      httpsCallable<
        CompleteOrganizationConfigurationRequest,
        CompleteOrganizationConfigurationResponse
      >(
        this.functions,
        'completeOrganizationConfiguration',
      );

    const result =
      await callable({
        organizationId:
          normalizedOrganizationId,

        configuration:
          this.normalizeConfiguration(
            configuration,
          ),
      });

    return result.data;
  }


  /**
   * -------------------------------------------------------
   * Normalize organization profile
   * -------------------------------------------------------
   */
  private normalizeProfile(
    profile: OrganizationOnboardingProfileInput,
  ): OrganizationOnboardingProfileInput {

    return {
      name:
        profile.name.trim(),

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


  /**
   * -------------------------------------------------------
   * Normalize owner profile
   * -------------------------------------------------------
   */
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
   * Normalize organization-wide configuration only.
   * Test Center and other application settings are deliberately
   * excluded from the organization onboarding contract.
   */
  private normalizeConfiguration(
    configuration: OrganizationConfigurationInput,
  ): OrganizationConfigurationInput {
    return {
      allowSelfRegistration: configuration.allowSelfRegistration,
      defaultMemberRole: configuration.defaultMemberRole,
      adminNotifications: configuration.adminNotifications,
      primaryColor: configuration.primaryColor.trim().toUpperCase(),
      secondaryColor: configuration.secondaryColor.trim().toUpperCase(),
    };
  }

  /**
   * Validate only organization-wide settings. The backend must
   * repeat these checks; client validation is not a security boundary.
   */
  private validateConfiguration(
    configuration: OrganizationConfigurationInput,
  ): void {
    if (!configuration) {
      throw new Error('Organization configuration is required.');
    }

    if (typeof configuration.allowSelfRegistration !== 'boolean') {
      throw new Error('Self-registration setting is invalid.');
    }

    if (typeof configuration.adminNotifications !== 'boolean') {
      throw new Error('Administrator notification setting is invalid.');
    }

    if (
      configuration.defaultMemberRole !== 'org_member' &&
      configuration.defaultMemberRole !== 'org_staff' &&
      configuration.defaultMemberRole !== 'org_manager'
    ) {
      throw new Error('Default member role is invalid.');
    }

    if (!this.isValidHexColor(configuration.primaryColor)) {
      throw new Error('Primary color must be a valid six-digit hexadecimal color.');
    }

    if (!this.isValidHexColor(configuration.secondaryColor)) {
      throw new Error('Secondary color must be a valid six-digit hexadecimal color.');
    }
  }


  /**
   * -------------------------------------------------------
   * Hex color validation
   * -------------------------------------------------------
   */
  private isValidHexColor(
    value: string,
  ): boolean {

    return /^#[0-9A-Fa-f]{6}$/.test(
      value.trim(),
    );
  }


  /**
   * -------------------------------------------------------
   * Normalize optional strings
   * -------------------------------------------------------
   */
  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {

    const normalized =
      value?.trim();

    return normalized || undefined;
  }

  async acceptOrganizationInvitation(
  invitationId: string,
): Promise<OrganizationInvitationAcceptanceResponse> {
  const normalizedInvitationId = invitationId?.trim();

  if (!normalizedInvitationId) {
    throw new Error('Invitation ID is required.');
  }

  const callable = httpsCallable<
    { invitationId: string },
    OrganizationInvitationAcceptanceResponse
  >(
    this.functions,
    'acceptOrganizationInvitation',
  );

  const result = await callable({
    invitationId: normalizedInvitationId,
  });

  return result.data;
}

async getOrganizationInvitationPreview(
  invitationId: string,
): Promise<OrganizationInvitationPreviewResponse> {
  const normalizedInvitationId = invitationId?.trim();

  if (!normalizedInvitationId) {
    throw new Error('Invitation ID is required.');
  }

  const callable = httpsCallable<
    { invitationId: string },
    OrganizationInvitationPreviewResponse
  >(
    this.functions,
    'getOrganizationInvitationPreview',
  );

  const result = await callable({
    invitationId: normalizedInvitationId,
  });

  return result.data;
}

}
