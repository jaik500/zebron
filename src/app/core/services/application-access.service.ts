import { Injectable, inject } from '@angular/core';

import { ApplicationDefinition } from '../models/application-definition.model';
import { OrganizationApplication } from '../models/organization-application.model';

import { ApplicationRegistryService } from './application-registry.service';

import {
  OrganizationApplicationRepository,
  ORGANIZATION_APPLICATION_REPOSITORY,
} from '../repositories/organization-application.repository';

export interface ApplicationAccessResult {
  allowed: boolean;

  reason:
    | 'allowed'
    | 'application-not-found'
    | 'application-disabled'
    | 'organization-required'
    | 'organization-not-found'
    | 'application-not-active'
    | 'membership-required'
    | 'permission-required';

  application: ApplicationDefinition | null;

  organizationApplication: OrganizationApplication | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationAccessService {
  private readonly applicationRegistry = inject(
    ApplicationRegistryService,
  );

  private readonly organizationApplications =
    inject<OrganizationApplicationRepository>(
      ORGANIZATION_APPLICATION_REPOSITORY,
    );

  // ============================================================
  // APPLICATION ACCESS
  // ============================================================

  /**
   * Checks whether an application is available to an organization.
   *
   * This service checks application availability and activation.
   * It deliberately does not inject AuthorizationService.
   *
   * Authentication and organization access must be checked by
   * their respective route guards.
   *
   * Firestore Security Rules and Cloud Functions must independently
   * enforce authorization for protected data and operations.
   */
  async checkAccess(
    userId: string,
    organizationId: string,
    applicationId: string,
  ): Promise<ApplicationAccessResult> {
    const normalizedUserId = userId.trim();
    const normalizedOrganizationId = organizationId.trim();
    const normalizedApplicationId = applicationId.trim();

    if (!normalizedUserId) {
      return this.deny(
        'membership-required',
        null,
        null,
      );
    }

    if (!normalizedApplicationId) {
      return this.deny(
        'application-not-found',
        null,
        null,
      );
    }

    // ----------------------------------------------------------
    // APPLICATION DEFINITION
    // ----------------------------------------------------------

    const application =
      this.applicationRegistry.getById(
        normalizedApplicationId,
      );

    if (!application) {
      return this.deny(
        'application-not-found',
        null,
        null,
      );
    }

    // ----------------------------------------------------------
    // APPLICATION ENABLEMENT
    // ----------------------------------------------------------

    if (!application.enabled) {
      return this.deny(
        'application-disabled',
        application,
        null,
      );
    }

    // ----------------------------------------------------------
    // PLATFORM APPLICATION
    // ----------------------------------------------------------

    if (!application.requiresOrganization) {
      return this.allow(application, null);
    }

    // ----------------------------------------------------------
    // ORGANIZATION CONTEXT
    // ----------------------------------------------------------

    if (!normalizedOrganizationId) {
      return this.deny(
        'organization-required',
        application,
        null,
      );
    }

    // ----------------------------------------------------------
    // ORGANIZATION APPLICATION ENTITLEMENT
    // ----------------------------------------------------------

    const organizationApplication =
      await this.organizationApplications.getApplication(
        normalizedOrganizationId,
        normalizedApplicationId,
      );

    if (!organizationApplication) {
      return this.deny(
        'application-not-active',
        application,
        null,
      );
    }

    if (organizationApplication.status !== 'active') {
      return this.deny(
        'application-not-active',
        application,
        organizationApplication,
      );
    }

    // ----------------------------------------------------------
    // ACCESS GRANTED
    // ----------------------------------------------------------

    return this.allow(
      application,
      organizationApplication,
    );
  }

  // ============================================================
  // SIMPLE ACCESS CHECK
  // ============================================================

  async canAccessApplication(
    userId: string,
    organizationId: string,
    applicationId: string,
  ): Promise<boolean> {
    const result = await this.checkAccess(
      userId,
      organizationId,
      applicationId,
    );

    return result.allowed;
  }

  // ============================================================
  // ACTIVATION
  // ============================================================

  /**
   * Checks application activation only.
   * This does not authenticate users or authorize operations.
   */
  async isApplicationActive(
    organizationId: string,
    applicationId: string,
  ): Promise<boolean> {
    const normalizedOrganizationId = organizationId.trim();
    const normalizedApplicationId = applicationId.trim();

    if (
      !normalizedOrganizationId ||
      !normalizedApplicationId
    ) {
      return false;
    }

    const application =
      await this.organizationApplications.getApplication(
        normalizedOrganizationId,
        normalizedApplicationId,
      );

    return application?.status === 'active';
  }

  // ============================================================
  // ORGANIZATION APPLICATION
  // ============================================================

  async getOrganizationApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<OrganizationApplication | null> {
    const normalizedOrganizationId = organizationId.trim();
    const normalizedApplicationId = applicationId.trim();

    if (
      !normalizedOrganizationId ||
      !normalizedApplicationId
    ) {
      return null;
    }

    return this.organizationApplications.getApplication(
      normalizedOrganizationId,
      normalizedApplicationId,
    );
  }

  // ============================================================
  // APPLICATION DEFINITION
  // ============================================================

  getApplicationDefinition(
    applicationId: string,
  ): ApplicationDefinition | null {
    const normalizedApplicationId = applicationId.trim();

    if (!normalizedApplicationId) {
      return null;
    }

    return this.applicationRegistry.getById(
      normalizedApplicationId,
    );
  }

  // ============================================================
  // RESULT HELPERS
  // ============================================================

  private allow(
    application: ApplicationDefinition,
    organizationApplication: OrganizationApplication | null,
  ): ApplicationAccessResult {
    return {
      allowed: true,
      reason: 'allowed',
      application,
      organizationApplication,
    };
  }

  private deny(
    reason: ApplicationAccessResult['reason'],
    application: ApplicationDefinition | null,
    organizationApplication: OrganizationApplication | null,
  ): ApplicationAccessResult {
    return {
      allowed: false,
      reason,
      application,
      organizationApplication,
    };
  }
}