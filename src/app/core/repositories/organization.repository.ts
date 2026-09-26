import { InjectionToken } from '@angular/core';

import { Organization } from '../models/organization.model';

/**
 * Persistence contract for organizations.
 *
 * The rest of the application should depend on this
 * interface rather than directly depending on Firestore.
 */
export interface OrganizationRepository {

  getOrganizations(): Promise<Organization[]>;

  getOrganization(
    id: string,
  ): Promise<Organization | null>;

  findByNormalizedName(
    normalizedName: string,
  ): Promise<Organization | null>;

  findByCompanyNumber(
    companyNumber: string,
  ): Promise<Organization | null>;

  createOrganization(
    organization: Omit<
      Organization,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string>;

  updateOrganization(
    id: string,
    changes: Partial<
      Omit<
        Organization,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void>;

  deleteOrganization(
    id: string,
  ): Promise<void>;
}

/**
 * Angular DI token for the organization repository.
 *
 * The interface above is compile-time only, so Angular
 * cannot inject it directly.
 */
export const ORGANIZATION_REPOSITORY =
  new InjectionToken<OrganizationRepository>(
    'OrganizationRepository',
  );