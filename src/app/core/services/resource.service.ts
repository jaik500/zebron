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
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { Resource } from '../models/resource.model';


/**
 * Represents one page of published resources.
 *
 * The lastDocument is used by Firestore to determine
 * where the next page should begin.
 */
export interface ResourcePage {
  resources: Resource[];
  lastDocument: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly resourcesCollection = collection(
    firestore,
    'resources'
  );

  async getPublishedResources(): Promise<Resource[]> {
    const q = query(
      this.resourcesCollection,
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Resource
    );
  }

     /**
   * Get one page of published resources.
   *
   * Firestore uses the last document from the previous page
   * to continue loading resources without downloading the
   * entire collection again.
   */
  async getPublishedResourcesPage(
    pageSize = 12,
    lastDocument?: QueryDocumentSnapshot
  ): Promise<ResourcePage> {
    const resourcesQuery = lastDocument
      ? query(
          this.resourcesCollection,
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDocument),
          limit(pageSize)
        )
      : query(
          this.resourcesCollection,
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

    const snapshot = await getDocs(resourcesQuery);

    const resources = snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Resource
    );

    return {
      resources,
      lastDocument:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
      hasMore: snapshot.docs.length === pageSize,
    };
  }

  async getResourceById(
    resourceId: string
  ): Promise<Resource | null> {
    const resourceRef = doc(
      firestore,
      'resources',
      resourceId
    );

    const snapshot = await getDoc(resourceRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Resource;
  }

  async getResourceBySlug(
    slug: string
  ): Promise<Resource | null> {
    const q = query(
      this.resourcesCollection,
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];

    return {
      id: document.id,
      ...document.data(),
    } as Resource;
  }

  /**
 * Get published resources that belong to the same category.
 *
 * The current resource is excluded from the results.
 */
  async getRelatedResources(
    categoryId: string,
    currentResourceId: string,
    limitCount = 3
  ): Promise<Resource[]> {
    const resourcesRef = collection(firestore, 'resources');

    const resourcesQuery = query(
      resourcesRef,
      where('categoryId', '==', categoryId),
      where('status', '==', 'published'),
      limit(limitCount + 1)
    );

    const snapshot = await getDocs(resourcesQuery);

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Resource)
      .filter((resource) => resource.id !== currentResourceId)
      .slice(0, limitCount);
  }

    /**
   * Get all resources for the admin dashboard.
   *
   * Unlike the public resource list, this includes
   * draft, pending, published, and archived resources.
   */
  async getAllResources(): Promise<Resource[]> {
    const resourcesQuery = query(
      this.resourcesCollection,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(resourcesQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as Resource[];
  }

  /**
   * Create a new resource.
   */
  async createResource(
    resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const document = await addDoc(
      this.resourcesCollection,
      {
        ...resource,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return document.id;
  }

  /**
   * Update an existing resource.
   */
  async updateResource(
    resourceId: string,
    resource: Partial<
      Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<void> {
    const resourceRef = doc(
      firestore,
      'resources',
      resourceId
    );

    await updateDoc(resourceRef, {
      ...resource,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete an existing resource.
   */
  async deleteResource(
    resourceId: string
  ): Promise<void> {
    const resourceRef = doc(
      firestore,
      'resources',
      resourceId
    );

    await deleteDoc(resourceRef);
  }

}