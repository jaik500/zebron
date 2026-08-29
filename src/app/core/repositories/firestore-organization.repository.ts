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

import { firestore } from '../services/firebase-config';

import { Organization } from '../models/organization.model';

import { OrganizationRepository } from './organization.repository';

/**
 * Firestore implementation of the OrganizationRepository.
 *
 * This class contains the Firestore-specific persistence
 * implementation for the Organization domain.
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreOrganizationRepository
  implements OrganizationRepository
{
  private readonly organizationsCollection =
    collection(
      firestore,
      'organizations',
    );


  // =========================================================
  // GET ALL ORGANIZATIONS
  // =========================================================

  async getOrganizations(): Promise<Organization[]> {

    const organizationsQuery =
      query(
        this.organizationsCollection,
        orderBy('name'),
      );

    const snapshot =
      await getDocs(
        organizationsQuery,
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Organization,
    );
  }


  // =========================================================
  // GET ORGANIZATION
  // =========================================================

  async getOrganization(
    id: string,
  ): Promise<Organization | null> {

    const organizationRef =
      doc(
        firestore,
        'organizations',
        id,
      );

    const snapshot =
      await getDoc(
        organizationRef,
      );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Organization;
  }


  // =========================================================
  // FIND BY NORMALIZED NAME
  // =========================================================

  async findByNormalizedName(
    normalizedName: string,
  ): Promise<Organization | null> {

    const organizationsQuery =
      query(
        this.organizationsCollection,

        where(
          'normalizedName',
          '==',
          normalizedName,
        ),

        limit(1),
      );

    const snapshot =
      await getDocs(
        organizationsQuery,
      );

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


  // =========================================================
  // FIND BY COMPANY NUMBER
  // =========================================================

  async findByCompanyNumber(
    companyNumber: string,
  ): Promise<Organization | null> {

    const organizationsQuery =
      query(
        this.organizationsCollection,

        where(
          'companyNumber',
          '==',
          companyNumber,
        ),

        limit(1),
      );

    const snapshot =
      await getDocs(
        organizationsQuery,
      );

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


  // =========================================================
  // CREATE
  // =========================================================

  async createOrganization(
    organization: Omit<
      Organization,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    const document =
      await addDoc(
        this.organizationsCollection,
        {
          ...organization,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

    return document.id;
  }


  // =========================================================
  // UPDATE
  // =========================================================

  async updateOrganization(
    id: string,
    changes: Partial<
      Omit<
        Organization,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    const organizationRef =
      doc(
        firestore,
        'organizations',
        id,
      );

    await updateDoc(
      organizationRef,
      {
        ...changes,

        updatedAt:
          serverTimestamp(),
      },
    );
  }


  // =========================================================
  // DELETE
  // =========================================================

  async deleteOrganization(
    id: string,
  ): Promise<void> {

    const organizationRef =
      doc(
        firestore,
        'organizations',
        id,
      );

    await deleteDoc(
      organizationRef,
    );
  }
}
