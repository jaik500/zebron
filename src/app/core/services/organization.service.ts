import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { Organization } from '../models/organization.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly firestore = getFirestore();

  private readonly collectionName = 'organizations';

  /**
   * Get the Firestore organizations collection.
   *
   * Kept behind a method so Firestore-specific details remain
   * isolated inside this infrastructure service.
   */
  private getOrganizationsCollection() {
    return collection(this.firestore, this.collectionName);
  }

  /**
   * Get all organizations.
   */
  async getAllOrganizations(): Promise<Organization[]> {
    const snapshot = await getDocs(this.getOrganizationsCollection());

    return snapshot.docs
      .map((organizationDocument) => {
        const data = organizationDocument.data();

        return {
          id: organizationDocument.id,
          ...data,
        } as Organization;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get an organization by ID.
   */
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      return null;
    }

    const organizationReference = doc(this.firestore, this.collectionName, normalizedId);

    const snapshot = await getDoc(organizationReference);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Organization;
  }

  /**
   * Create an organization.
   *
   * Always returns the complete Organization object.
   * This is important because OrganizationStore expects
   * Promise<Organization>, not string | Organization | void.
   */
  async createOrganization(
    organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Organization> {
    const organizationsCollection = this.getOrganizationsCollection();

    const now = Timestamp.now();

    const organizationData = {
      ...organization,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const documentReference = await addDoc(organizationsCollection, organizationData);

    return {
      ...organization,
      id: documentReference.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update an organization.
   *
   * Returns the complete updated organization.
   */
  async updateOrganization(
    organizationId: string,
    changes: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Organization> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      throw new Error('Organization ID is required.');
    }

    const organizationReference = doc(this.firestore, this.collectionName, normalizedId);

    const existing = await getDoc(organizationReference);

    if (!existing.exists()) {
      throw new Error(`Organization "${normalizedId}" was not found.`);
    }

    await updateDoc(organizationReference, {
      ...changes,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(organizationReference);

    if (!updated.exists()) {
      throw new Error(`Organization "${normalizedId}" could not be loaded after update.`);
    }

    return {
      id: updated.id,
      ...updated.data(),
    } as Organization;
  }

  /**
   * Delete an organization.
   */
  async deleteOrganization(organizationId: string): Promise<void> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      throw new Error('Organization ID is required.');
    }

    const organizationReference = doc(this.firestore, this.collectionName, normalizedId);

    const existing = await getDoc(organizationReference);

    if (!existing.exists()) {
      throw new Error(`Organization "${normalizedId}" was not found.`);
    }

    await deleteDoc(organizationReference);
  }

  async findOrganizationByCompanyNumber(companyNumber: string): Promise<Organization | null> {
    const normalizedCompanyNumber = companyNumber.trim();

    if (!normalizedCompanyNumber) {
      return null;
    }

    const organizationsCollection = this.getOrganizationsCollection();

    const organizationQuery = query(
      organizationsCollection,
      where('companyNumber', '==', normalizedCompanyNumber),
      limit(1),
    );

    const snapshot = await getDocs(organizationQuery);

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];

    return {
      id: document.id,
      ...document.data(),
    } as Organization;
  }

  async findOrCreateOrganization(
    organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Organization> {
    const existing = organization.companyNumber
      ? await this.findOrganizationByCompanyNumber(organization.companyNumber)
      : null;

    if (existing) {
      return existing;
    }

    return this.createOrganization(organization);
  }
}
