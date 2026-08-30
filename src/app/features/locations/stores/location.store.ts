import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { Location } from '../../../core/models/location.model';
import { LocationService } from '../../../core/services/location.service';


// ============================================================
// STATE
// ============================================================

interface LocationState {
  locations: Location[];

  selectedLocation: Location | null;

  loading: boolean;

  error: string | null;
}


const initialState: LocationState = {

  locations: [],

  selectedLocation: null,

  loading: false,

  error: null,

};


// ============================================================
// LOCATION STORE
// ============================================================

export const LocationStore = signalStore(

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
      locations,
    }) => ({

      // --------------------------------------------------------
      // Result Count
      // --------------------------------------------------------

      resultCount: computed(
        () =>
          locations().length,
      ),


      // --------------------------------------------------------
      // Countries
      // --------------------------------------------------------

      countries: computed(() => {

        const values =
          locations()
            .map(
              (location) =>
                location.country?.trim(),
            )
            .filter(
              (
                country,
              ): country is string =>
                Boolean(country),
            );


        return [
          ...new Set(values),
        ].sort(
          (a, b) =>
            a.localeCompare(b),
        );

      }),

    }),
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      locationService = inject(LocationService),
    ) => ({


      // ========================================================
      // LOAD LOCATIONS
      // ========================================================

      async loadLocations(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const locations =
            await locationService
              .getAllLocations();


          patchState(
            store,
            {
              locations,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load locations:',
            error,
          );


          patchState(
            store,
            {
              locations: [],

              loading: false,

              error:
                'Unable to load locations. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // GET LOCATION
      // ========================================================

      async getLocation(
        locationId: string,
      ): Promise<Location | null> {

        try {

          return await locationService
            .getLocationById(
              locationId,
            );

        } catch (error) {

          console.error(
            'Failed to get location:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // CREATE LOCATION
      // ========================================================

      async createLocation(
        location: Location,
      ): Promise<string> {

        try {

          const locationId =
            await locationService
              .createLocation(
                location,
              );


          return locationId;

        } catch (error) {

          console.error(
            'Failed to create location:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // UPDATE LOCATION
      // ========================================================

      async updateLocation(
        locationId: string,

        changes: Partial<Location>,
      ): Promise<void> {

        try {

          await locationService
            .updateLocation(
              locationId,
              changes,
            );

        } catch (error) {

          console.error(
            'Failed to update location:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // DELETE LOCATION
      // ========================================================

      async deleteLocation(
        locationId: string,
      ): Promise<void> {

        try {

          await locationService
            .deleteLocation(
              locationId,
            );


          patchState(
            store,
            {
              locations:
                store.locations()
                  .filter(
                    (location) =>
                      location.id !== locationId,
                  ),
            },
          );

        } catch (error) {

          console.error(
            'Failed to delete location:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // SET SELECTED LOCATION
      // ========================================================

      setSelectedLocation(
        location: Location | null,
      ): void {

        patchState(
          store,
          {
            selectedLocation: location,
          },
        );

      },


      // ========================================================
      // CLEAR SELECTED LOCATION
      // ========================================================

      clearSelectedLocation(): void {

        patchState(
          store,
          {
            selectedLocation: null,
          },
        );

      },

    }),
  ),

);