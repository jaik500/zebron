import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { ResourceType } from '../../../core/models/resource-type.model';
import { ResourceTypeService } from '../../../core/services/resource-type.service';


// ============================================================
// STATE
// ============================================================

interface ResourceTypeState {
  resourceTypes: ResourceType[];

  selectedResourceType: ResourceType | null;

  loading: boolean;

  error: string | null;
}


const initialState: ResourceTypeState = {
  resourceTypes: [],

  selectedResourceType: null,

  loading: false,

  error: null,
};


// ============================================================
// RESOURCE TYPE STORE
// ============================================================

export const ResourceTypeStore = signalStore(

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
      resourceTypes,
    }) => ({

      // --------------------------------------------------------
      // Active Resource Types
      // --------------------------------------------------------

      activeResourceTypes: computed(() =>
        resourceTypes().filter(
          (resourceType) =>
            resourceType.active === true,
        ),
      ),


      // --------------------------------------------------------
      // Result Count
      // --------------------------------------------------------

      resultCount: computed(
        () =>
          resourceTypes().length,
      ),


      // --------------------------------------------------------
      // Active Result Count
      // --------------------------------------------------------

      activeResultCount: computed(() =>
        resourceTypes().filter(
          (resourceType) =>
            resourceType.active === true,
        ).length,
      ),

    }),
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      resourceTypeService =
        inject(ResourceTypeService),
    ) => ({


      // ========================================================
      // LOAD RESOURCE TYPES
      // ========================================================

      async loadResourceTypes(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const resourceTypes =
            await resourceTypeService
              .getAllResourceTypes();


          patchState(
            store,
            {
              resourceTypes,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load resource types:',
            error,
          );


          patchState(
            store,
            {
              resourceTypes: [],

              loading: false,

              error:
                'Unable to load resource types. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // LOAD ACTIVE RESOURCE TYPES
      // ========================================================

      async loadActiveResourceTypes(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const resourceTypes =
            await resourceTypeService
              .getActiveResourceTypes();


          patchState(
            store,
            {
              resourceTypes,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load active resource types:',
            error,
          );


          patchState(
            store,
            {
              resourceTypes: [],

              loading: false,

              error:
                'Unable to load resource types. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // CREATE RESOURCE TYPE
      // ========================================================

      async createResourceType(
        resourceType: ResourceType,
      ): Promise<string> {

        try {

          const resourceTypeId =
            await resourceTypeService
              .createResourceType(
                resourceType,
              );


          return resourceTypeId;

        } catch (error) {

          console.error(
            'Failed to create resource type:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // UPDATE RESOURCE TYPE
      // ========================================================

      async updateResourceType(
        resourceTypeId: string,

        changes: Partial<ResourceType>,
      ): Promise<void> {

        try {

          await resourceTypeService
            .updateResourceType(
              resourceTypeId,
              changes,
            );

        } catch (error) {

          console.error(
            'Failed to update resource type:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // DELETE RESOURCE TYPE
      // ========================================================

      async deleteResourceType(
        resourceTypeId: string,
      ): Promise<void> {

        try {

          await resourceTypeService
            .deleteResourceType(
              resourceTypeId,
            );


          patchState(
            store,
            {
              resourceTypes:
                store.resourceTypes()
                  .filter(
                    (resourceType) =>
                      resourceType.id !== resourceTypeId,
                  ),
            },
          );

        } catch (error) {

          console.error(
            'Failed to delete resource type:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // SET SELECTED RESOURCE TYPE
      // ========================================================

      setSelectedResourceType(
        resourceType: ResourceType | null,
      ): void {

        patchState(
          store,
          {
            selectedResourceType:
              resourceType,
          },
        );

      },


      // ========================================================
      // CLEAR SELECTED RESOURCE TYPE
      // ========================================================

      clearSelectedResourceType(): void {

        patchState(
          store,
          {
            selectedResourceType: null,
          },
        );

      },

    }),
  ),

);