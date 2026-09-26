import { InjectionToken } from '@angular/core';

import { OrganizationApplication } from '../models/organization-application.model';

/**
 * Persistence contract for organization application activations.
 *
 * Organization applications are tenant-scoped. Every operation
 * requires an organizationId so callers cannot accidentally
 * operate on applications outside the current organization.
 */
export interface OrganizationApplicationRepository {

  getApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<OrganizationApplication | null>;

  getApplications(
    organizationId: string,
  ): Promise<OrganizationApplication[]>;

  getActiveApplications(
    organizationId: string,
  ): Promise<OrganizationApplication[]>;

  createApplication(
    application: OrganizationApplication,
  ): Promise<void>;

  updateApplication(
    organizationId: string,
    applicationId: string,
    changes: Partial<
      Omit<
        OrganizationApplication,
        'applicationId' | 'organizationId'
      >
    >,
  ): Promise<void>;

  deleteApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<void>;
}

/**
 * Angular DI token for the organization application repository.
 */
export const ORGANIZATION_APPLICATION_REPOSITORY =
  new InjectionToken<OrganizationApplicationRepository>(
    'OrganizationApplicationRepository',
  );
