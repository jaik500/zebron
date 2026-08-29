import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { QueryDocumentSnapshot } from 'firebase/firestore';

import { Resource } from '../../../core/models/resource.model';

import { ResourceService } from '../../../core/services/resource.service';


// ============================================================
// RESOURCE STATE
// ============================================================

type ResourceState = {

  /**
   * Resources currently held by the store.
   *
   * For public resources this represents the resources
   * loaded through the current pagination session.
   */
  resources: Resource[];

  /**
   * Currently selected resource.
   *
   * Used by resource detail views.
   */
  selectedResource: Resource | null;

  /**
   * Resources related to the selected resource.
   */
  relatedResources: Resource[];

  /**
   * Last Firestore document returned by pagination.
   */
  lastDocument:
    QueryDocumentSnapshot | null;

  /**
   * Whether another public-resource page is available.
   */
  hasMore: boolean;

  /**
   * General loading state.
   */
  loading: boolean;

  /**
   * Error returned by the most recent operation.
   */
  error: string | null;

  /**
   * Client-side search text.
   */
  searchTerm: string;

  /**
   * Selected category ID.
   */
  selectedCategory: string;

  /**
   * Selected resource type.
   */
  selectedResourceType: string;

  /**
   * Selected location ID.
   */
  selectedLocation: string;

};


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: ResourceState = {

  resources: [],

  selectedResource: null,

  relatedResources: [],

  lastDocument: null,

  hasMore: false,

  loading: false,

  error: null,

  searchTerm: '',

  selectedCategory: '',

  selectedResourceType: '',

  selectedLocation: '',

};


// ============================================================
// RESOURCE STORE
// ============================================================

export const ResourceStore = signalStore(

  {
    providedIn: 'root',
  },


  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),


  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed(
    ({
      resources,
      searchTerm,
      selectedCategory,
      selectedResourceType,
      selectedLocation,
    }) => {

      // ------------------------------------------------------
      // Filter resources
      // ------------------------------------------------------

      const filteredResources =
        computed(() => {

          const search =
            searchTerm()
              .trim()
              .toLowerCase();

          const category =
            selectedCategory();

          const resourceType =
            selectedResourceType();

          const location =
            selectedLocation();


          return resources().filter(
            (resource) => {

              // ----------------------------------------------
              // Category
              // ----------------------------------------------

              if (
                category &&
                resource.categoryId !== category
              ) {
                return false;
              }


              // ----------------------------------------------
              // Resource type
              // ----------------------------------------------

              if (
                resourceType &&
                resource.resourceType !==
                  resourceType
              ) {
                return false;
              }


              // ----------------------------------------------
              // Location
              // ----------------------------------------------

              if (
                location &&
                resource.locationId !== location
              ) {
                return false;
              }


              // ----------------------------------------------
              // Search
              // ----------------------------------------------

              if (!search) {
                return true;
              }


              const searchableText = [

                resource.name,

                resource.description,

                resource.resourceType,

                resource.categoryId,

                resource.organizationId,

                resource.locationId,

                resource.website,

                resource.phone,

                resource.email,

                ...resource.tags,

              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


              return searchableText.includes(
                search,
              );

            },
          );

        });


      // ------------------------------------------------------
      // Result count
      // ------------------------------------------------------

      const resultCount =
        computed(
          () =>
            filteredResources().length,
        );


      // ------------------------------------------------------
      // Active filter state
      // ------------------------------------------------------

      const hasActiveFilters =
        computed(
          () =>
            searchTerm().trim() !== '' ||
            selectedCategory() !== '' ||
            selectedResourceType() !== '' ||
            selectedLocation() !== '',
        );


      // ------------------------------------------------------
      // Featured resources
      // ------------------------------------------------------

      const featuredResources =
        computed(() =>
          resources().filter(
            (resource) =>
              resource.featured,
          ),
        );


      // ------------------------------------------------------
      // Published resources
      // ------------------------------------------------------

      const publishedResources =
        computed(() =>
          resources().filter(
            (resource) =>
              resource.status === 'published',
          ),
        );


      // ------------------------------------------------------
      // Verified resources
      // ------------------------------------------------------

      const verifiedResources =
        computed(() =>
          resources().filter(
            (resource) =>
              resource.verified,
          ),
        );


      return {

        filteredResources,

        resultCount,

        hasActiveFilters,

        featuredResources,

        publishedResources,

        verifiedResources,

      };

    },
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      resourceService =
        inject(ResourceService),
    ) => ({

      // ======================================================
      // LOAD PUBLISHED RESOURCES
      // ======================================================

      async loadPublishedResources(
        pageSize = 12,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,

            resources: [],

            lastDocument: null,

            hasMore: false,
          },
        );


        try {

          const page =
            await resourceService
              .getPublishedResourcesPage(
                pageSize,
              );


          patchState(
            store,
            {
              resources:
                page.resources,

              lastDocument:
                page.lastDocument,

              hasMore:
                page.hasMore,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load published resources:',
            error,
          );


          patchState(
            store,
            {
              resources: [],

              lastDocument: null,

              hasMore: false,

              loading: false,

              error:
                'Unable to load resources. Please try again.',
            },
          );

        }

      },


      // ======================================================
      // LOAD NEXT PUBLIC PAGE
      // ======================================================

      async loadNextPublishedPage(
        pageSize = 12,
      ): Promise<void> {

        if (
          store.loading() ||
          !store.hasMore() ||
          !store.lastDocument()
        ) {
          return;
        }


        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const page =
            await resourceService
              .getPublishedResourcesPage(
                pageSize,

                store.lastDocument()!,
              );


          patchState(
            store,
            (state) => ({
              resources: [
                ...state.resources,
                ...page.resources,
              ],

              lastDocument:
                page.lastDocument,

              hasMore:
                page.hasMore,

              loading: false,

              error: null,
            }),
          );

        } catch (error) {

          console.error(
            'Failed to load more resources:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to load more resources. Please try again.',
            },
          );

        }

      },


      // ======================================================
      // LOAD ALL RESOURCES
      // ======================================================

      async loadAllResources(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const resources =
            await resourceService
              .getAllResources();


          patchState(
            store,
            {
              resources,

              lastDocument: null,

              hasMore: false,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load all resources:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to load resources. Please try again.',
            },
          );

        }

      },


      // ======================================================
      // LOAD RESOURCE BY ID
      // ======================================================

      async loadResourceById(
        resourceId: string,
      ): Promise<Resource | null> {

        patchState(
          store,
          {
            loading: true,

            error: null,

            selectedResource: null,

            relatedResources: [],
          },
        );


        try {

          const resource =
            await resourceService
              .getResourceById(
                resourceId,
              );


          if (!resource) {

            patchState(
              store,
              {
                loading: false,

                selectedResource: null,

                error:
                  'Resource not found.',
              },
            );

            return null;
          }


          patchState(
            store,
            {
              loading: false,

              selectedResource:
                resource,

              error: null,
            },
          );


          return resource;

        } catch (error) {

          console.error(
            'Failed to load resource:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              selectedResource: null,

              error:
                'Unable to load resource. Please try again.',
            },
          );


          return null;

        }

      },


      // ======================================================
      // LOAD RESOURCE BY SLUG
      // ======================================================

      async loadResourceBySlug(
        slug: string,
      ): Promise<Resource | null> {

        patchState(
          store,
          {
            loading: true,

            error: null,

            selectedResource: null,

            relatedResources: [],
          },
        );


        try {

          const resource =
            await resourceService
              .getResourceBySlug(
                slug,
              );


          if (!resource) {

            patchState(
              store,
              {
                loading: false,

                selectedResource: null,

                error:
                  'Resource not found.',
              },
            );

            return null;
          }


          patchState(
            store,
            {
              loading: false,

              selectedResource:
                resource,

              error: null,
            },
          );


          return resource;

        } catch (error) {

          console.error(
            'Failed to load resource by slug:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              selectedResource: null,

              error:
                'Unable to load resource. Please try again.',
            },
          );


          return null;

        }

      },


      // ======================================================
      // LOAD RELATED RESOURCES
      // ======================================================

      async loadRelatedResources(
        categoryId: string,

        currentResourceId: string,

        limitCount = 3,
      ): Promise<void> {

        try {

          const relatedResources =
            await resourceService
              .getRelatedResources(
                categoryId,

                currentResourceId,

                limitCount,
              );


          patchState(
            store,
            {
              relatedResources,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load related resources:',
            error,
          );


          patchState(
            store,
            {
              relatedResources: [],

              error:
                'Unable to load related resources.',
            },
          );

        }

      },


      // ======================================================
      // CREATE RESOURCE
      // ======================================================

      async createResource(
        resource: Omit<
          Resource,
          'id' | 'createdAt' | 'updatedAt'
        >,
      ): Promise<string> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const id =
            await resourceService
              .createResource(
                resource,
              );


          await this.loadAllResources();


          return id;

        } catch (error) {

          console.error(
            'Failed to create resource:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to create resource. Please try again.',
            },
          );


          throw error;

        }

      },


      // ======================================================
      // UPDATE RESOURCE
      // ======================================================

      async updateResource(
        resourceId: string,

        changes: Partial<
          Omit<
            Resource,
            'id' | 'createdAt' | 'updatedAt'
          >
        >,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          await resourceService
            .updateResource(
              resourceId,
              changes,
            );


          await this.loadAllResources();

        } catch (error) {

          console.error(
            'Failed to update resource:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to update resource. Please try again.',
            },
          );


          throw error;

        }

      },


      // ======================================================
      // DELETE RESOURCE
      // ======================================================

      async deleteResource(
        resourceId: string,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          await resourceService
            .deleteResource(
              resourceId,
            );


          patchState(
            store,
            (state) => ({
              resources:
                state.resources.filter(
                  (resource) =>
                    resource.id !==
                    resourceId,
                ),

              selectedResource:
                state.selectedResource?.id ===
                resourceId
                  ? null
                  : state.selectedResource,

              loading: false,

              error: null,
            }),
          );

        } catch (error) {

          console.error(
            'Failed to delete resource:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to delete resource. Please try again.',
            },
          );


          throw error;

        }

      },


      // ======================================================
      // SEARCH
      // ======================================================

      setSearchTerm(
        value: string,
      ): void {

        patchState(
          store,
          {
            searchTerm: value,
          },
        );

      },


      // ======================================================
      // CATEGORY
      // ======================================================

      setCategory(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedCategory: value,
          },
        );

      },


      // ======================================================
      // RESOURCE TYPE
      // ======================================================

      setResourceType(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedResourceType: value,
          },
        );

      },


      // ======================================================
      // LOCATION
      // ======================================================

      setLocation(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedLocation: value,
          },
        );

      },


      // ======================================================
      // CLEAR FILTERS
      // ======================================================

      clearFilters(): void {

        patchState(
          store,
          {
            searchTerm: '',

            selectedCategory: '',

            selectedResourceType: '',

            selectedLocation: '',
          },
        );

      },


      // ======================================================
      // CLEAR SELECTED RESOURCE
      // ======================================================

      clearSelectedResource(): void {

        patchState(
          store,
          {
            selectedResource: null,

            relatedResources: [],
          },
        );

      },


      // ======================================================
      // RESET PUBLIC PAGINATION
      // ======================================================

      resetPagination(): void {

        patchState(
          store,
          {
            resources: [],

            lastDocument: null,

            hasMore: false,
          },
        );

      },

    }),
  ),

);
