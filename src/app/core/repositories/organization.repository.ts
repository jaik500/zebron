import { Organization } from '../models/organization.model';

/**
 * Persistence contract for organizations.
 *
 * The rest of the application should depend on this
 * interface rather than directly depending on Firestore.
 */
export interface OrganizationRepository {

  /**
   * Get all organizations.
   */
  getOrganizations(): Promise<Organization[]>;

  /**
   * Get one organization by document ID.
   */
  getOrganization(id: string): Promise<Organization | null>;

  /**
   * Find an organization by normalized name.
   */
  findByNormalizedName(
    normalizedName: string,
  ): Promise<Organization | null>;

  /**
   * Find an organization by business / registration number.
   */
  findByCompanyNumber(
    companyNumber: string,
  ): Promise<Organization | null>;

  /**
   * Create an organization.
   */
  createOrganization(
    organization: Omit<
      Organization,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string>;

  /**
   * Update an organization.
   */
  updateOrganization(
    id: string,
    changes: Partial<
      Omit<
        Organization,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void>;

  /**
   * Delete an organization.
   */
  deleteOrganization(
    id: string,
  ): Promise<void>;
}
