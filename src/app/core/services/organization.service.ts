import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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

    const snapshot = await getDocs(organizationsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Organization
    );
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<void> {
    const organizationRef = doc(
      firestore,
      'organizations',
      organizationId
    );

    await updateDoc(organizationRef, {
      ...organization,
      updatedAt: serverTimestamp(),
    });
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

    await deleteDoc(organizationRef);
  }
}
