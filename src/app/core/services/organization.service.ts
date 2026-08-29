import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { Organization } from '../models/organization.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly organizationsCollection = collection(
    firestore,
    'organizations'
  );

  /**
   * Get all organizations for the admin area.
   */
  async getAllOrganizations(): Promise<Organization[]> {
    const organizationsQuery = query(
      this.organizationsCollection,
      orderBy('name')
    );

    const snapshot = await getDocs(
      organizationsQuery
    );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Organization
    );
  }

  /**
   * Find an existing organization by name.
   *
   * The comparison is case-insensitive from the
   * application's perspective by storing a normalized
   * organization name in the query.
   *
   * Existing organization records created before this
   * change may not contain normalizedName, so those
   * records are handled by findOrCreateOrganization()
   * using the full organization list as a fallback.
   */
  async findOrganizationByName(
    name: string
  ): Promise<Organization | null> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return null;
    }

    const normalizedName =
      this.normalizeOrganizationName(
        trimmedName
      );

    const organizationsQuery = query(
      this.organizationsCollection,
      where(
        'normalizedName',
        '==',
        normalizedName
      ),
      limit(1)
    );

    const snapshot = await getDocs(
      organizationsQuery
    );

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];

    return {
      id: document.id,
      ...document.data(),
    } as Organization;
  }

  async getOrganizationById(
  id: string
): Promise<Organization | null> {

  const organizationRef =
    doc(
      firestore,
      'organizations',
      id
    );

  const snapshot =
    await getDoc(
      organizationRef
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<
      Organization,
      'id'
    >),
  };
}

  /**
   * Find an existing organization or create a
   * minimal organization record when one does not exist.
   *
   * This is used by job onboarding.
   */
 /**
 * Find an existing organization or create a new one.
 *
 * Company/registration number is checked first.
 * Organization name is used as a fallback.
 */
async findOrCreateOrganization(
  name: string,
  companyNumber?: string
): Promise<Organization> {
  const trimmedName = name.trim();

  const trimmedCompanyNumber =
    companyNumber?.trim() || '';

  if (!trimmedName) {
    throw new Error(
      'Organization name is required.'
    );
  }

  /*
   * First try to find the organization
   * by business/registration number.
   */
  if (trimmedCompanyNumber) {
    const existingByNumber =
      await this.findOrganizationByCompanyNumber(
        trimmedCompanyNumber
      );

    if (existingByNumber) {
      return existingByNumber;
    }
  }

  /*
   * Fall back to organization name.
   */
  const existingByName =
    await this.findOrganizationByName(
      trimmedName
    );

  if (existingByName) {

    /*
     * If the existing organization does not
     * have a company number, add the number
     * supplied by the administrator.
     */
    if (
      trimmedCompanyNumber &&
      !existingByName.companyNumber
    ) {
      await this.updateOrganization(
        existingByName.id,
        {
          companyNumber:
            trimmedCompanyNumber,
        }
      );

      existingByName.companyNumber =
        trimmedCompanyNumber;
    }

    return existingByName;
  }

  /*
   * Create a new organization.
   */
  const organizationData = {
    name: trimmedName,

    slug:
      this.createSlug(trimmedName),

    normalizedName:
      this.normalizeOrganizationName(
        trimmedName
      ),

    ...(trimmedCompanyNumber
      ? {
          companyNumber:
            trimmedCompanyNumber,
        }
      : {}),

    verified: false,

    active: true,
  };

  const organizationId =
    await this.createOrganization(
      organizationData
    );

  return {
    id: organizationId,
    ...organizationData,
    createdAt: undefined as never,
    updatedAt: undefined as never,
  };
}

  /**
   * Create a new organization.
   */
  async createOrganization(
    organization: Omit<
      Organization,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<string> {
    const document = await addDoc(
      this.organizationsCollection,
      {
        ...organization,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );

    return document.id;
  }

  /**
   * Update an existing organization.
   */
  async updateOrganization(
    organizationId: string,
    organization: Partial<
      Omit<
        Organization,
        'id' | 'createdAt' | 'updatedAt'
      >
    >
  ): Promise<void> {
    const organizationRef = doc(
      firestore,
      'organizations',
      organizationId
    );

    await updateDoc(
      organizationRef,
      {
        ...organization,

        updatedAt:
          serverTimestamp(),
      }
    );
  }

  /**
   * Delete an organization.
   */
  async deleteOrganization(
    organizationId: string
  ): Promise<void> {
    const organizationRef = doc(
      firestore,
      'organizations',
      organizationId
    );

    await deleteDoc(
      organizationRef
    );
  }

  /**
   * Normalize an organization name for matching.
   *
   * Example:
   *
   * "Microsoft"
   * " MICROSOFT "
   * "microsoft"
   *
   * all become:
   *
   * "microsoft"
   */
  private normalizeOrganizationName(
    name: string
  ): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Create a URL-friendly organization slug.
   */
  private createSlug(
    name: string
  ): string {
    return this.normalizeOrganizationName(
      name
    )
      .replace(/[^a-z0-9]+/g, '-')
      .replace(
        /^-+|-+$/g,
        ''
      );
  }

  /**
 * Find an organization by business/registration number.
 */
async findOrganizationByCompanyNumber(
  companyNumber: string
): Promise<Organization | null> {
  const normalizedNumber =
    companyNumber.trim();

  if (!normalizedNumber) {
    return null;
  }

  const organizationsQuery = query(
    this.organizationsCollection,
    where(
      'companyNumber',
      '==',
      normalizedNumber
    ),
    limit(1)
  );

  const snapshot =
    await getDocs(organizationsQuery);

  if (snapshot.empty) {
    return null;
  }

  const document =
    snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as Organization;
}

}