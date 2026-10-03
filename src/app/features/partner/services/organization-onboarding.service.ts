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


export interface OrganizationConfigurationInput {
  testCenterEnabled: boolean;
  allowMemberTesting: boolean;

  courseVisibility:
    OrganizationCourseVisibility;

  allowSelfRegistration: boolean;

  defaultMemberRole:
    OrganizationDefaultMemberRole;

  adminNotifications: boolean;
  testResultNotifications: boolean;

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
/**
 * ---------------------------------------------------------
 * First Program
 * ---------------------------------------------------------
 */

export interface OrganizationOnboardingFirstProgramInput {
  name: string;
  slug: string;
  description?: string;
}

export interface OrganizationOnboardingFirstProgramResponse {
  success: boolean;
  organizationId: string;

  program: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    active: boolean;
    courseCount: number;
  };

  onboarding: {
    firstProgramId: string;
    currentStep: OrganizationOnboardingStep;
    completedSteps: OrganizationOnboardingStep[];
    status: 'in_progress' | 'completed';
  };
}

interface CompleteOrganizationFirstProgramRequest {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
}

/**
 * ---------------------------------------------------------
 * First Course
 * ---------------------------------------------------------
 */

export type OrganizationOnboardingFirstCourseType =
  | 'certification'
  | 'course'
  | 'subject'
  | 'skill';

export interface OrganizationOnboardingFirstCourseInput {
  name: string;
  slug: string;
  description: string;
  provider?: string;
  type: OrganizationOnboardingFirstCourseType;
  certificationCode?: string;
  imageUrl?: string;
  active: boolean;
}

export interface OrganizationOnboardingFirstCourseResponse {
  success: boolean;
  organizationId: string;

  course: {
    id: string;
    organizationId: string;
    programId: string;
    name: string;
    slug: string;
    description: string;
    provider?: string | null;
    type: OrganizationOnboardingFirstCourseType;
    active: boolean;
    questionCount: number;
  };

  onboarding: {
    firstCourseId: string;
    currentStep: OrganizationOnboardingStep;
    completedSteps: OrganizationOnboardingStep[];
    status: 'in_progress' | 'completed';
  };
}

interface CompleteOrganizationFirstCourseRequest {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  provider?: string;
  type: OrganizationOnboardingFirstCourseType;
  certificationCode?: string;
  imageUrl?: string;
  active: boolean;
}

export interface OrganizationOnboardingFirstTopicInput {
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface OrganizationOnboardingFirstTopicResponse {
  success: boolean;
  organizationId: string;
  topic: {
    id: string;
    organizationId: string;
    courseId: string;
    name: string;
    slug: string;
    description?: string | null;
    sortOrder: number;
    questionCount: number;
    active: boolean;
  };
  onboarding: {
    firstTopicId: string;
    currentStep: OrganizationOnboardingStep;
    completedSteps: OrganizationOnboardingStep[];
    status: 'in_progress' | 'completed';
  };
}

interface CompleteOrganizationFirstTopicRequest {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}


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
export class OrganizationOnboardingService {

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
   * - advances organization_profile -> owner_profile
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
   * - advances owner_profile -> invite_members
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
   * Completes onboarding Step 4:
   *
   *     configuration
   *
   * and advances the organization to:
   *
   *     first_program
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
   * -------------------------------------------------------
   * Normalize organization configuration
   * -------------------------------------------------------
   *
   * The backend remains authoritative, but normalizing
   * here gives the callable a clean payload.
   */
  private normalizeConfiguration(
    configuration: OrganizationConfigurationInput,
  ): OrganizationConfigurationInput {

    return {
      testCenterEnabled:
        configuration.testCenterEnabled,

      allowMemberTesting:
        configuration.allowMemberTesting,

      courseVisibility:
        configuration.courseVisibility,

      allowSelfRegistration:
        configuration.allowSelfRegistration,

      defaultMemberRole:
        configuration.defaultMemberRole,

      adminNotifications:
        configuration.adminNotifications,

      testResultNotifications:
        configuration.testResultNotifications,

      primaryColor:
        configuration.primaryColor
          .trim()
          .toUpperCase(),

      secondaryColor:
        configuration.secondaryColor
          .trim()
          .toUpperCase(),
    };
  }


  /**
   * -------------------------------------------------------
   * Client-side configuration validation
   * -------------------------------------------------------
   *
   * This provides immediate feedback before invoking the
   * Cloud Function.
   *
   * The backend performs the same validation because client
   * validation is never a security boundary.
   */
  private validateConfiguration(
    configuration: OrganizationConfigurationInput,
  ): void {

    if (!configuration) {
      throw new Error(
        'Organization configuration is required.',
      );
    }

    if (
      typeof configuration.testCenterEnabled !==
      'boolean'
    ) {
      throw new Error(
        'Test Center setting is invalid.',
      );
    }

    if (
      typeof configuration.allowMemberTesting !==
      'boolean'
    ) {
      throw new Error(
        'Member testing setting is invalid.',
      );
    }

    if (
      typeof configuration.allowSelfRegistration !==
      'boolean'
    ) {
      throw new Error(
        'Self-registration setting is invalid.',
      );
    }

    if (
      typeof configuration.adminNotifications !==
      'boolean'
    ) {
      throw new Error(
        'Administrator notification setting is invalid.',
      );
    }

    if (
      typeof configuration.testResultNotifications !==
      'boolean'
    ) {
      throw new Error(
        'Test result notification setting is invalid.',
      );
    }

    if (
      configuration.courseVisibility !== 'all'
      && configuration.courseVisibility !== 'members'
      && configuration.courseVisibility !== 'admins'
    ) {
      throw new Error(
        'Course visibility is invalid.',
      );
    }

    if (
      configuration.defaultMemberRole !==
        'org_member'
      && configuration.defaultMemberRole !==
        'org_staff'
      && configuration.defaultMemberRole !==
        'org_manager'
    ) {
      throw new Error(
        'Default member role is invalid.',
      );
    }

    if (
      !this.isValidHexColor(
        configuration.primaryColor,
      )
    ) {
      throw new Error(
        'Primary color must be a valid six-digit hexadecimal color.',
      );
    }

    if (
      !this.isValidHexColor(
        configuration.secondaryColor,
      )
    ) {
      throw new Error(
        'Secondary color must be a valid six-digit hexadecimal color.',
      );
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

  /**
 * -------------------------------------------------------
 * Client-side first-program validation
 * -------------------------------------------------------
 *
 * This provides immediate feedback before invoking the
 * Cloud Function.
 *
 * The backend performs the same validation and remains
 * the security boundary.
 */
private validateFirstProgram(
  program: OrganizationOnboardingFirstProgramInput,
): void {

  if (!program) {
    throw new Error(
      'First program information is required.',
    );
  }

  if (!program.name?.trim()) {
    throw new Error(
      'Program name is required.',
    );
  }

  if (program.name.trim().length > 150) {
    throw new Error(
      'Program name cannot exceed 150 characters.',
    );
  }

  if (!program.slug?.trim()) {
    throw new Error(
      'Program slug is required.',
    );
  }

  const normalizedSlug =
    this.normalizeProgramSlug(
      program.slug,
    );

  if (!normalizedSlug) {
    throw new Error(
      'Program slug must contain at least one valid character.',
    );
  }

  if (normalizedSlug.length > 150) {
    throw new Error(
      'Program slug cannot exceed 150 characters.',
    );
  }

  if (
    program.description &&
    program.description.trim().length > 2000
  ) {
    throw new Error(
      'Program description cannot exceed 2000 characters.',
    );
  }
}

async completeOrganizationFirstCourse(
  organizationId: string,
  course: OrganizationOnboardingFirstCourseInput,
): Promise<OrganizationOnboardingFirstCourseResponse> {
  const normalizedOrganizationId =
    organizationId?.trim();

  if (!normalizedOrganizationId) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  this.validateFirstCourse(course);

  const callable =
    httpsCallable<
      CompleteOrganizationFirstCourseRequest,
      OrganizationOnboardingFirstCourseResponse
    >(
      this.functions,
      'completeOrganizationFirstCourse',
    );

  const result = await callable({
    organizationId: normalizedOrganizationId,
    name: course.name.trim(),
    slug: this.normalizeCourseSlug(course.slug),
    description: course.description.trim(),
    provider:
      course.provider?.trim() || undefined,
    type: course.type,
    certificationCode:
      course.certificationCode?.trim() || undefined,
    imageUrl:
      course.imageUrl?.trim() || undefined,
    active: course.active,
  });

  return result.data;
}

/**
 * Creates the organization's first Test Center topic and advances
 * onboarding from first_topic to first_question.
 *
 * The Cloud Function is the authoritative owner of both the topic
 * creation and onboarding transition.
 */
async completeOrganizationFirstTopic(
  organizationId: string,
  topic: OrganizationOnboardingFirstTopicInput,
): Promise<OrganizationOnboardingFirstTopicResponse> {
  const normalizedOrganizationId = organizationId?.trim();

  if (!normalizedOrganizationId) {
    throw new Error('Organization ID is required.');
  }

  this.validateFirstTopic(topic);

  const callable = httpsCallable<
    CompleteOrganizationFirstTopicRequest,
    OrganizationOnboardingFirstTopicResponse
  >(
    this.functions,
    'completeOrganizationFirstTopic',
  );

  const result = await callable({
    organizationId: normalizedOrganizationId,
    name: topic.name.trim(),
    slug: this.normalizeTopicSlug(topic.slug),
    description: topic.description?.trim() || undefined,
    active: topic.active,
  });

  return result.data;
}


private validateFirstTopic(
  topic: OrganizationOnboardingFirstTopicInput,
): void {
  if (!topic.name?.trim()) {
    throw new Error('Topic name is required.');
  }

  if (topic.name.trim().length > 150) {
    throw new Error('Topic name cannot exceed 150 characters.');
  }

  if (!topic.slug?.trim()) {
    throw new Error('Topic slug is required.');
  }

  if (topic.slug.trim().length > 150) {
    throw new Error('Topic slug cannot exceed 150 characters.');
  }

  if (topic.description && topic.description.trim().length > 2000) {
    throw new Error('Topic description cannot exceed 2000 characters.');
  }

  if (typeof topic.active !== 'boolean') {
    throw new Error('Topic active status is invalid.');
  }

  if (!this.normalizeTopicSlug(topic.slug)) {
    throw new Error('Topic slug is invalid.');
  }
}

private normalizeTopicSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * -------------------------------------------------------
 * Normalize program slug
 * -------------------------------------------------------
 */
private normalizeProgramSlug(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * -------------------------------------------------------
 * Client-side first-course validation
 * -------------------------------------------------------
 *
 * This provides immediate feedback before invoking the
 * Cloud Function.
 *
 * The backend performs the same validation and remains
 * the security boundary.
 */
private validateFirstCourse(
  course: OrganizationOnboardingFirstCourseInput,
): void {

  if (!course) {
    throw new Error(
      'First course information is required.',
    );
  }

  if (!course.name?.trim()) {
    throw new Error(
      'Course name is required.',
    );
  }

  if (course.name.trim().length > 150) {
    throw new Error(
      'Course name cannot exceed 150 characters.',
    );
  }

  if (!course.slug?.trim()) {
    throw new Error(
      'Course slug is required.',
    );
  }

  const normalizedSlug =
    this.normalizeCourseSlug(
      course.slug,
    );

  if (!normalizedSlug) {
    throw new Error(
      'Course slug must contain at least one valid character.',
    );
  }

  if (normalizedSlug.length > 150) {
    throw new Error(
      'Course slug cannot exceed 150 characters.',
    );
  }

  if (!course.description?.trim()) {
    throw new Error(
      'Course description is required.',
    );
  }

  if (course.description.trim().length > 2000) {
    throw new Error(
      'Course description cannot exceed 2000 characters.',
    );
  }

  if (
    course.provider &&
    course.provider.trim().length > 200
  ) {
    throw new Error(
      'Course provider cannot exceed 200 characters.',
    );
  }

  if (
    course.certificationCode &&
    course.certificationCode.trim().length > 150
  ) {
    throw new Error(
      'Certification code cannot exceed 150 characters.',
    );
  }

  if (
    course.imageUrl &&
    course.imageUrl.trim().length > 1000
  ) {
    throw new Error(
      'Course image URL cannot exceed 1000 characters.',
    );
  }

  if (
    course.type !== 'certification' &&
    course.type !== 'course' &&
    course.type !== 'subject' &&
    course.type !== 'skill'
  ) {
    throw new Error(
      'Course type is invalid.',
    );
  }

  if (typeof course.active !== 'boolean') {
    throw new Error(
      'Course active status is invalid.',
    );
  }
}

/**
 * -------------------------------------------------------
 * Normalize course slug
 * -------------------------------------------------------
 */
private normalizeCourseSlug(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async completeOrganizationFirstProgram(
  organizationId: string,
  program: OrganizationOnboardingFirstProgramInput,
): Promise<OrganizationOnboardingFirstProgramResponse> {
  const normalizedOrganizationId = organizationId?.trim();

  if (!normalizedOrganizationId) {
    throw new Error('Organization ID is required.');
  }

  this.validateFirstProgram(program);

  const callable =
    httpsCallable<
      CompleteOrganizationFirstProgramRequest,
      OrganizationOnboardingFirstProgramResponse
    >(
      this.functions,
      'completeOrganizationFirstProgram',
    );

  const result = await callable({
    organizationId: normalizedOrganizationId,
    name: program.name.trim(),
    slug: this.normalizeProgramSlug(program.slug),
    description: this.normalizeOptionalString(program.description),
  });

  return result.data;
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
