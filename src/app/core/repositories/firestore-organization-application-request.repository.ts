import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../services/firebase-config';

import {
  OrganizationApplicationRequest,
  OrganizationApplicationRequestStatus,
} from '../models/organization-application-request.model';

import {
  OrganizationApplicationRequestRepository,
} from './organization-application-request.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreOrganizationApplicationRequestRepository
  implements OrganizationApplicationRequestRepository
{
  private readonly requestsCollection = collection(
    firestore,
    'organizationApplicationRequests',
  );

  // ============================================================
  // GET REQUEST
  // ============================================================

  async getRequest(
    requestId: string,
  ): Promise<OrganizationApplicationRequest | null> {
    const requestRef = doc(
      firestore,
      'organizationApplicationRequests',
      requestId,
    );

    const snapshot = await getDoc(requestRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as OrganizationApplicationRequest;
  }

  // ============================================================
  // GET USER REQUESTS
  // ============================================================

  async getRequestsForUser(
    userId: string,
  ): Promise<OrganizationApplicationRequest[]> {
    const requestsQuery = query(
      this.requestsCollection,
      where('applicantUserId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(requestsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as OrganizationApplicationRequest,
    );
  }

  // ============================================================
  // GET BY STATUS
  // ============================================================

  async getRequestsByStatus(
    status: OrganizationApplicationRequestStatus,
  ): Promise<OrganizationApplicationRequest[]> {
    const requestsQuery = query(
      this.requestsCollection,
      where('status', '==', status),
      orderBy('createdAt', 'asc'),
    );

    const snapshot = await getDocs(requestsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as OrganizationApplicationRequest,
    );
  }

  // ============================================================
  // CREATE
  // ============================================================

  async createRequest(
    request: Omit<
      OrganizationApplicationRequest,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const sanitizedRequest =
      this.removeUndefinedValues(request);

    const documentReference = await addDoc(
      this.requestsCollection,
      {
        ...sanitizedRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );

    return documentReference.id;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async updateRequest(
    requestId: string,
    changes: Partial<
      Omit<
        OrganizationApplicationRequest,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    const requestRef = doc(
      firestore,
      'organizationApplicationRequests',
      requestId,
    );

    const sanitizedChanges =
      this.removeUndefinedValues(changes);

    await updateDoc(
      requestRef,
      {
        ...sanitizedChanges,
        updatedAt: serverTimestamp(),
      },
    );
  }

  // ============================================================
  // REMOVE UNDEFINED VALUES
  // ============================================================

  private removeUndefinedValues<
    T extends Record<string, unknown>,
  >(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, fieldValue]) => fieldValue !== undefined,
      ),
    ) as Partial<T>;
  }
}