import { QueryDocumentSnapshot } from 'firebase/firestore';

import { Resource } from '../models/resource.model';

/**
 * One page of published resources.
 *
 * The repository exposes the Firestore pagination
 * cursor because the public resource list already
 * uses cursor-based pagination.
 */
export interface ResourcePage {
  resources: Resource[];
  lastDocument: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Persistence contract for the Resource domain.
 *
 * Application services and stores depend on this
 * contract rather than directly on Firestore.
 */
export interface ResourceRepository {

  /**
   * Get all published resources.
   */
  getPublishedResources(): Promise<Resource[]>;

  /**
   * Get one page of published resources.
   */
  getPublishedResourcesPage(
    pageSize?: number,
    lastDocument?: QueryDocumentSnapshot,
  ): Promise<ResourcePage>;

  /**
   * Get a resource by document ID.
   */
  getResourceById(
    resourceId: string,
  ): Promise<Resource | null>;

  /**
   * Get a published resource by slug.
   */
  getResourceBySlug(
    slug: string,
  ): Promise<Resource | null>;

  /**
   * Get published resources from the same category,
   * excluding the current resource.
   */
  getRelatedResources(
    categoryId: string,
    currentResourceId: string,
    limitCount?: number,
  ): Promise<Resource[]>;

  /**
   * Get all resources for administration.
   *
   * Includes draft, pending, published and archived
   * resources.
   */
  getAllResources(): Promise<Resource[]>;

  /**
   * Create a resource.
   */
  createResource(
    resource: Omit<
      Resource,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string>;

  /**
   * Update a resource.
   */
  updateResource(
    resourceId: string,
    changes: Partial<
      Omit<
        Resource,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void>;

  /**
   * Delete a resource.
   */
  deleteResource(
    resourceId: string,
  ): Promise<void>;
}
