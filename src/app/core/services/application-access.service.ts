import { Injectable, inject } from '@angular/core';

import { ApplicationDefinition } from '../models/application-definition.model';
import { OrganizationApplication } from '../models/organization-application.model';

import { ApplicationRegistryService } from './application-registry.service';
import { AuthorizationService } from './authorization.service';

import { OrganizationApplicationRepository } from '../repositories/organization-application.repository';
import {
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

  organizationApplication:
    | OrganizationApplication
    | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationAccessService {
  private readonly applicationRegistry =
    inject(ApplicationRegistryService);

  private readonly authorization =
    inject(AuthorizationService);

  private readonly organizationApplications =
    inject<OrganizationApplicationRepository>(
      ORGANIZATION_APPLICATION_REPOSITORY,
    );

  // ============================================================
  // APPLICATION ACCESS
  // ============================================================

  /**
   * Determine whether a user can access an application.
   *
   * Authorization chain:
   *
   * Authenticated User
   *        ↓
   * Platform Role
   *        +
   * Organization Membership
   *        ↓
   * Effective Permissions
   *        ↓
   * Application exists and is enabled
   *        ↓
   * Organization application is active
   *        ↓
   * Required application permission
   *        ↓
   * ALLOW
   *
   * The user's platform role is resolved internally by
   * AuthorizationService from the persisted User profile.
   *
   * Callers never provide a platform role.
   */
  async checkAccess(
    userId: string,
    organizationId: string,
    applicationId: string,
  ): Promise<ApplicationAccessResult> {
    // ----------------------------------------------------------
    // INPUT VALIDATION
    // ----------------------------------------------------------

    const normalizedUserId = userId.trim();
    const normalizedOrganizationId =
      organizationId.trim();
    const normalizedApplicationId =
      applicationId.trim();

    if (!normalizedUserId) {
      return {
        allowed: false,
        reason: 'membership-required',
        application: null,
        organizationApplication: null,
      };
    }

    if (!normalizedApplicationId) {
      return {
        allowed: false,
        reason: 'application-not-found',
        application: null,
        organizationApplication: null,
      };
    }

    // ----------------------------------------------------------
    // APPLICATION DEFINITION
    // ----------------------------------------------------------

    const application =
      this.applicationRegistry.getById(
        normalizedApplicationId,
      );

    if (!application) {
      return {
        allowed: false,
        reason: 'application-not-found',
        application: null,
        organizationApplication: null,
      };
    }

    // ----------------------------------------------------------
    // APPLICATION ENABLEMENT
    // ----------------------------------------------------------

    if (!application.enabled) {
      return {
        allowed: false,
        reason: 'application-disabled',
        application,
        organizationApplication: null,
      };
    }

    // ----------------------------------------------------------
    // PLATFORM APPLICATION
    // ----------------------------------------------------------

    /**
     * Applications that do not require an organization
     * do not require an OrganizationApplication record.
     *
     * Examples include public/platform applications such
     * as the tax calculator.
     *
     * If the application declares permissions, those
     * permissions are evaluated against the user's effective
     * platform permissions.
     */
    if (!application.requiresOrganization) {
      // No permission requirement.
      if (application.permissions.length === 0) {
        return {
          allowed: true,
          reason: 'allowed',
          application,
          organizationApplication: null,
        };
      }

      /**
       * Resolve permissions from the user's persisted
       * platformRole.
       */
      const effectivePermissions =
        await this.authorization
          .getEffectivePermissionsForUser(
            normalizedUserId,
            undefined,
          );

      const hasPermission =
        application.permissions.some(
          (permission) =>
            effectivePermissions.includes(permission),
        );

      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'permission-required',
          application,
          organizationApplication: null,
        };
      }

      return {
        allowed: true,
        reason: 'allowed',
        application,
        organizationApplication: null,
      };
    }

    // ----------------------------------------------------------
    // ORGANIZATION CONTEXT
    // ----------------------------------------------------------

    /**
     * Organization applications require an organization
     * context.
     */
    if (!normalizedOrganizationId) {
      return {
        allowed: false,
        reason: 'organization-required',
        application,
        organizationApplication: null,
      };
    }

    // ----------------------------------------------------------
    // ORGANIZATION APPLICATION
    // ----------------------------------------------------------

    /**
     * The organization must have the application activated.
     *
     * Application authorization and application activation
     * are separate concerns:
     *
     * OrganizationApplication
     *        ↓
     * status === active
     *
     * then:
     *
     * Effective Permissions
     *        ↓
     * required application permission
     */
    const organizationApplication =
      await this.organizationApplications.getApplication(
        normalizedOrganizationId,
        normalizedApplicationId,
      );

    if (
      !organizationApplication ||
      organizationApplication.status !== 'active'
    ) {
      return {
        allowed: false,
        reason: 'application-not-active',
        application,
        organizationApplication,
      };
    }

    // ----------------------------------------------------------
    // APPLICATION PERMISSIONS
    // ----------------------------------------------------------

    /**
     * An activated application with no declared
     * permissions does not require additional
     * authorization.
     */
    if (application.permissions.length === 0) {
      return {
        allowed: true,
        reason: 'allowed',
        application,
        organizationApplication,
      };
    }

    // ----------------------------------------------------------
    // EFFECTIVE PERMISSIONS
    // ----------------------------------------------------------

    /**
     * Effective permissions combine:
     *
     * Platform Role
     *        +
     * Organization Membership Role
     *
     * The platform role is resolved internally from
     * users/{userId}.
     */
    const effectivePermissions =
      await this.authorization
        .getEffectivePermissionsForUser(
          normalizedUserId,
          normalizedOrganizationId,
        );

    /**
     * An application may declare multiple permissions.
     *
     * The user only needs one of the application's
     * declared permissions to gain access.
     */
    const hasPermission =
      application.permissions.some(
        (permission) =>
          effectivePermissions.includes(permission),
      );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: 'permission-required',
        application,
        organizationApplication,
      };
    }

    // ----------------------------------------------------------
    // ALLOW
    // ----------------------------------------------------------

    return {
      allowed: true,
      reason: 'allowed',
      application,
      organizationApplication,
    };
  }

  // ============================================================
  // SIMPLE ACCESS CHECK
  // ============================================================

  /**
   * Convenience method that returns only the access decision.
   *
   * The user's platform role is resolved internally.
   */
  async canAccessApplication(
    userId: string,
    organizationId: string,
    applicationId: string,
  ): Promise<boolean> {
    const result =
      await this.checkAccess(
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
   * Determine whether an application is currently active
   * for an organization.
   *
   * This checks activation only. It does not perform
   * authorization.
   */
  async isApplicationActive(
    organizationId: string,
    applicationId: string,
  ): Promise<boolean> {
    const normalizedOrganizationId =
      organizationId.trim();

    const normalizedApplicationId =
      applicationId.trim();

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

  /**
   * Retrieve the application's tenant-specific
   * activation record.
   */
  async getOrganizationApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<OrganizationApplication | null> {
    const normalizedOrganizationId =
      organizationId.trim();

    const normalizedApplicationId =
      applicationId.trim();

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

  /**
   * Retrieve the platform-level application definition
   * from the application registry.
   */
  getApplicationDefinition(
    applicationId: string,
  ): ApplicationDefinition | null {
    const normalizedApplicationId =
      applicationId.trim();

    if (!normalizedApplicationId) {
      return null;
    }

    return this.applicationRegistry.getById(
      normalizedApplicationId,
    );
  }
}