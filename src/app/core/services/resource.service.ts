import { Injectable, inject } from '@angular/core';

import { QueryDocumentSnapshot } from 'firebase/firestore';

import { Resource } from '../models/resource.model';

import {
  ResourcePage,
} from '../repositories/resource.repository';

import {
  FirestoreResourceRepository,
} from '../repositories/firestore-resource.repository';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {

  private readonly repository =
    inject(
      FirestoreResourceRepository,
    );


  // =========================================================
  // PUBLIC RESOURCES
  // =========================================================

  async getPublishedResources(): Promise<Resource[]> {

    return this.repository
      .getPublishedResources();

  }


  // =========================================================
  // PUBLIC RESOURCE PAGE
  // =========================================================

  async getPublishedResourcesPage(
    pageSize = 12,

    lastDocument?: QueryDocumentSnapshot,
  ): Promise<ResourcePage> {

    return this.repository
      .getPublishedResourcesPage(
        pageSize,
        lastDocument,
      );

  }


  // =========================================================
  // RESOURCE BY ID
  // =========================================================

  async getResourceById(
    resourceId: string,
  ): Promise<Resource | null> {

    return this.repository
      .getResourceById(
        resourceId,
      );

  }


  // =========================================================
  // RESOURCE BY SLUG
  // =========================================================

  async getResourceBySlug(
    slug: string,
  ): Promise<Resource | null> {

    return this.repository
      .getResourceBySlug(
        slug,
      );

  }


  // =========================================================
  // RELATED RESOURCES
  // =========================================================

  async getRelatedResources(
    categoryId: string,

    currentResourceId: string,

    limitCount = 3,
  ): Promise<Resource[]> {

    return this.repository
      .getRelatedResources(
        categoryId,
        currentResourceId,
        limitCount,
      );

  }


  // =========================================================
  // ADMIN RESOURCES
  // =========================================================

  async getAllResources(): Promise<Resource[]> {

    return this.repository
      .getAllResources();

  }


  // =========================================================
  // CREATE
  // =========================================================

  async createResource(
    resource: Omit<
      Resource,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    return this.repository
      .createResource(
        resource,
      );

  }


  // =========================================================
  // UPDATE
  // =========================================================

  async updateResource(
    resourceId: string,

    resource: Partial<
      Omit<
        Resource,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    return this.repository
      .updateResource(
        resourceId,
        resource,
      );

  }


  // =========================================================
  // DELETE
  // =========================================================

  async deleteResource(
    resourceId: string,
  ): Promise<void> {

    return this.repository
      .deleteResource(
        resourceId,
      );

  }
}