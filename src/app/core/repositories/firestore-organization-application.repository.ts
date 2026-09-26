import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../services/firebase-config';

import {
  OrganizationApplication,
} from '../models/organization-application.model';

import {
  OrganizationApplicationRepository,
} from './organization-application.repository';

/**
 * Firestore implementation of the OrganizationApplicationRepository.
 *
 * Organization application documents are stored under:
 *
 * organizations/{organizationId}/applications/{applicationId}
 *
 * The organizationId is therefore part of every repository operation.
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreOrganizationApplicationRepository
  implements OrganizationApplicationRepository
{
  private applicationsCollection(
    organizationId: string,
  ) {
    return collection(
      firestore,
      'organizations',
      organizationId,
      'applications',
    );
  }

  private applicationRef(
    organizationId: string,
    applicationId: string,
  ) {
    return doc(
      firestore,
      'organizations',
      organizationId,
      'applications',
      applicationId,
    );
  }

  // =========================================================
  // GET APPLICATION
  // =========================================================

  async getApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<OrganizationApplication | null> {
    const snapshot = await getDoc(
      this.applicationRef(
        organizationId,
        applicationId,
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      applicationId: snapshot.id,
      organizationId,
      ...snapshot.data(),
    } as OrganizationApplication;
  }

  // =========================================================
  // GET APPLICATIONS
  // =========================================================

  async getApplications(
    organizationId: string,
  ): Promise<OrganizationApplication[]> {
    const snapshot = await getDocs(
      this.applicationsCollection(
        organizationId,
      ),
    );

    return snapshot.docs.map(
      (document) =>
        ({
          applicationId: document.id,
          organizationId,
          ...document.data(),
        }) as OrganizationApplication,
    );
  }

  // =========================================================
  // GET ACTIVE APPLICATIONS
  // =========================================================

  async getActiveApplications(
    organizationId: string,
  ): Promise<OrganizationApplication[]> {
    const applicationsQuery = query(
      this.applicationsCollection(
        organizationId,
      ),
      where('status', '==', 'active'),
    );

    const snapshot = await getDocs(
      applicationsQuery,
    );

    return snapshot.docs.map(
      (document) =>
        ({
          applicationId: document.id,
          organizationId,
          ...document.data(),
        }) as OrganizationApplication,
    );
  }

  // =========================================================
  // CREATE / SAVE APPLICATION
  // =========================================================

  async createApplication(
    application: OrganizationApplication,
  ): Promise<void> {
    const {
      organizationId,
      applicationId,
      ...data
    } = application;

    await setDoc(
      this.applicationRef(
        organizationId,
        applicationId,
      ),
      {
        ...data,
        organizationId,
        updatedAt: serverTimestamp(),
      },
    );
  }

  // =========================================================
  // UPDATE APPLICATION
  // =========================================================

  async updateApplication(
    organizationId: string,
    applicationId: string,
    changes: Partial<
      Omit<
        OrganizationApplication,
        'applicationId' | 'organizationId'
      >
    >,
  ): Promise<void> {
    await updateDoc(
      this.applicationRef(
        organizationId,
        applicationId,
      ),
      {
        ...changes,
        updatedAt: serverTimestamp(),
      },
    );
  }

  // =========================================================
  // DELETE APPLICATION
  // =========================================================

  async deleteApplication(
    organizationId: string,
    applicationId: string,
  ): Promise<void> {
    await deleteDoc(
      this.applicationRef(
        organizationId,
        applicationId,
      ),
    );
  }
}
