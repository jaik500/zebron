import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { Organization } from '../../../core/models/organization.model';
import { OrganizationService } from '../../../core/services/organization.service';


// ============================================================
// ORGANIZATION STATE
// ============================================================

type OrganizationState = {

  organizations: Organization[];

  selectedOrganization:
    Organization | null;

  loading: boolean;

  error: string | null;

  searchTerm: string;

  showInactive: boolean;

};


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: OrganizationState = {

  organizations: [],

  selectedOrganization: null,

  loading: false,

  error: null,

  searchTerm: '',

  showInactive: false,

};


// ============================================================
// ORGANIZATION STORE
// ============================================================

export const OrganizationStore = signalStore(

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
      organizations,
      searchTerm,
      showInactive,
    }) => {

      // ------------------------------------------------------
      // Filtered organizations
      // ------------------------------------------------------

      const filteredOrganizations =
        computed(() => {

          const search =
            searchTerm()
              .trim()
              .toLowerCase();


          return organizations().filter(
            (organization) => {

              // ----------------------------------------------
              // Active / inactive filtering
              // ----------------------------------------------

              if (
                !showInactive() &&
                !organization.active
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

                organization.name,

                organization.companyNumber,

                organization.description,

                organization.email,

                organization.phone,

                organization.website,

                organization.slug,

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
      // Active organizations
      // ------------------------------------------------------

      const activeOrganizations =
        computed(() =>
          organizations().filter(
            (organization) =>
              organization.active,
          ),
        );


      // ------------------------------------------------------
      // Inactive organizations
      // ------------------------------------------------------

      const inactiveOrganizations =
        computed(() =>
          organizations().filter(
            (organization) =>
              !organization.active,
          ),
        );


      // ------------------------------------------------------
      // Verified organizations
      // ------------------------------------------------------

      const verifiedOrganizations =
        computed(() =>
          organizations().filter(
            (organization) =>
              organization.verified,
          ),
        );


      // ------------------------------------------------------
      // Result count
      // ------------------------------------------------------

      const resultCount =
        computed(
          () =>
            filteredOrganizations().length,
        );


      // ------------------------------------------------------
      // Active filter state
      // ------------------------------------------------------

      const hasActiveFilters =
        computed(
          () =>
            searchTerm().trim() !== '' ||
            showInactive(),
        );


      return {

        filteredOrganizations,

        activeOrganizations,

        inactiveOrganizations,

        verifiedOrganizations,

        resultCount,

        hasActiveFilters,

      };

    },
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      organizationService =
        inject(OrganizationService),
    ) => ({

      // ======================================================
      // LOAD ORGANIZATIONS
      // ======================================================

      async loadOrganizations(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const organizations =
            await organizationService
              .getAllOrganizations();


          patchState(
            store,
            {
              organizations,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load organizations:',
            error,
          );


          patchState(
            store,
            {
              organizations: [],

              loading: false,

              error:
                'Unable to load organizations. Please try again.',
            },
          );

        }

      },


      // ======================================================
      // LOAD ONE ORGANIZATION
      // ======================================================

      async loadOrganization(
        id: string,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,

            selectedOrganization:
              null,
          },
        );


        try {

          const organization =
            await organizationService
              .getOrganizationById(id);


          if (!organization) {

            patchState(
              store,
              {
                loading: false,

                selectedOrganization:
                  null,

                error:
                  'Organization not found.',
              },
            );

            return;

          }


          patchState(
            store,
            {
              loading: false,

              selectedOrganization:
                organization,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load organization:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              selectedOrganization:
                null,

              error:
                'Unable to load organization. Please try again.',
            },
          );

        }

      },


      // ======================================================
      // CREATE
      // ======================================================

      async createOrganization(
        organization: Omit<
          Organization,
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
            await organizationService
              .createOrganization(
                organization,
              );


          await this.loadOrganizations();


          return id;

        } catch (error) {

          console.error(
            'Failed to create organization:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to create organization. Please try again.',
            },
          );


          throw error;

        }

      },


      // ======================================================
      // UPDATE
      // ======================================================

      async updateOrganization(
        id: string,

        changes: Partial<
          Omit<
            Organization,
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

          await organizationService
            .updateOrganization(
              id,
              changes,
            );


          await this.loadOrganizations();

        } catch (error) {

          console.error(
            'Failed to update organization:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to update organization. Please try again.',
            },
          );


          throw error;

        }

      },


      // ======================================================
      // DELETE
      // ======================================================

      async deleteOrganization(
        id: string,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          await organizationService
            .deleteOrganization(id);


          await this.loadOrganizations();

        } catch (error) {

          console.error(
            'Failed to delete organization:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to delete organization. Please try again.',
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
      // SHOW INACTIVE
      // ======================================================

      setShowInactive(
        value: boolean,
      ): void {

        patchState(
          store,
          {
            showInactive: value,
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

            showInactive: false,
          },
        );

      },


      // ======================================================
      // CLEAR SELECTED ORGANIZATION
      // ======================================================

      clearSelectedOrganization(): void {

        patchState(
          store,
          {
            selectedOrganization:
              null,
          },
        );

      },

    }),
  ),

);
