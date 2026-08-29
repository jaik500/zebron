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

import { firestore } from '../services/firebase-config';

import { Resource } from '../models/resource.model';

import {
  ResourcePage,
  ResourceRepository,
} from './resource.repository';

/**
 * Firestore persistence implementation for Resources.
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreResourceRepository
  implements ResourceRepository
{
  private readonly resourcesCollection =
    collection(
      firestore,
      'resources',
    );


  // =========================================================
  // GET PUBLISHED RESOURCES
  // =========================================================

  async getPublishedResources(): Promise<Resource[]> {

    const resourcesQuery =
      query(
        this.resourcesCollection,

        where(
          'status',
          '==',
          'published',
        ),

        orderBy(
          'createdAt',
          'desc',
        ),
      );


    const snapshot =
      await getDocs(
        resourcesQuery,
      );


    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Resource,
    );
  }


  // =========================================================
  // GET PUBLISHED RESOURCE PAGE
  // =========================================================

  async getPublishedResourcesPage(
    pageSize = 12,

    lastDocument?: QueryDocumentSnapshot,
  ): Promise<ResourcePage> {

    const resourcesQuery =
      lastDocument

        ? query(
            this.resourcesCollection,

            where(
              'status',
              '==',
              'published',
            ),

            orderBy(
              'createdAt',
              'desc',
            ),

            startAfter(
              lastDocument,
            ),

            limit(
              pageSize,
            ),
          )

        : query(
            this.resourcesCollection,

            where(
              'status',
              '==',
              'published',
            ),

            orderBy(
              'createdAt',
              'desc',
            ),

            limit(
              pageSize,
            ),
          );


    const snapshot =
      await getDocs(
        resourcesQuery,
      );


    const resources =
      snapshot.docs.map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as Resource,
      );


    return {

      resources,

      lastDocument:
        snapshot.docs.length > 0
          ? snapshot.docs[
              snapshot.docs.length - 1
            ]
          : null,

      hasMore:
        snapshot.docs.length ===
        pageSize,

    };
  }


  // =========================================================
  // GET RESOURCE BY ID
  // =========================================================

  async getResourceById(
    resourceId: string,
  ): Promise<Resource | null> {

    const resourceRef =
      doc(
        firestore,
        'resources',
        resourceId,
      );


    const snapshot =
      await getDoc(
        resourceRef,
      );


    if (!snapshot.exists()) {
      return null;
    }


    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Resource;
  }


  // =========================================================
  // GET RESOURCE BY SLUG
  // =========================================================

  async getResourceBySlug(
    slug: string,
  ): Promise<Resource | null> {

    const resourcesQuery =
      query(
        this.resourcesCollection,

        where(
          'slug',
          '==',
          slug,
        ),

        where(
          'status',
          '==',
          'published',
        ),

        limit(1),
      );


    const snapshot =
      await getDocs(
        resourcesQuery,
      );


    if (snapshot.empty) {
      return null;
    }


    const document =
      snapshot.docs[0];


    return {
      id: document.id,
      ...document.data(),
    } as Resource;
  }


  // =========================================================
  // GET RELATED RESOURCES
  // =========================================================

  async getRelatedResources(
    categoryId: string,

    currentResourceId: string,

    limitCount = 3,
  ): Promise<Resource[]> {

    const resourcesQuery =
      query(
        this.resourcesCollection,

        where(
          'categoryId',
          '==',
          categoryId,
        ),

        where(
          'status',
          '==',
          'published',
        ),

        limit(
          limitCount + 1,
        ),
      );


    const snapshot =
      await getDocs(
        resourcesQuery,
      );


    return snapshot.docs

      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as Resource,
      )

      .filter(
        (resource) =>
          resource.id !==
          currentResourceId,
      )

      .slice(
        0,
        limitCount,
      );
  }


  // =========================================================
  // GET ALL RESOURCES
  // =========================================================

  async getAllResources(): Promise<Resource[]> {

    const resourcesQuery =
      query(
        this.resourcesCollection,

        orderBy(
          'createdAt',
          'desc',
        ),
      );


    const snapshot =
      await getDocs(
        resourcesQuery,
      );


    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Resource,
    );
  }


  // =========================================================
  // CREATE RESOURCE
  // =========================================================

  async createResource(
    resource: Omit<
      Resource,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    const document =
      await addDoc(
        this.resourcesCollection,
        {
          ...resource,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );


    return document.id;
  }


  // =========================================================
  // UPDATE RESOURCE
  // =========================================================

  async updateResource(
    resourceId: string,

    changes: Partial<
      Omit<
        Resource,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    const resourceRef =
      doc(
        firestore,
        'resources',
        resourceId,
      );


    await updateDoc(
      resourceRef,
      {
        ...changes,

        updatedAt:
          serverTimestamp(),
      },
    );
  }


  // =========================================================
  // DELETE RESOURCE
  // =========================================================

  async deleteResource(
    resourceId: string,
  ): Promise<void> {

    const resourceRef =
      doc(
        firestore,
        'resources',
        resourceId,
      );


    await deleteDoc(
      resourceRef,
    );
  }
}
