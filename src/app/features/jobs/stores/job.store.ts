import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { Job } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';


// ============================================================
// JOB STORE STATE
// ============================================================

type JobState = {
  jobs: Job[];

  selectedJob: Job | null;

  loading: boolean;

  error: string | null;

  searchTerm: string;

  selectedCategory: string;

  selectedEmploymentType: string;

  selectedWorkArrangement: string;

  selectedLocation: string;
};


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: JobState = {
  jobs: [],

  selectedJob: null,

  loading: false,

  error: null,

  searchTerm: '',

  selectedCategory: '',

  selectedEmploymentType: '',

  selectedWorkArrangement: '',

  selectedLocation: '',
};


// ============================================================
// JOB STORE
// ============================================================

export const JobStore = signalStore(

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
      jobs,
      searchTerm,
      selectedCategory,
      selectedEmploymentType,
      selectedWorkArrangement,
      selectedLocation,
    }) => {

      // --------------------------------------------------------
      // Active jobs
      // --------------------------------------------------------

      const activeJobs = computed(() =>
        jobs().filter(
          (job) =>
            job.status === 'active',
        ),
      );


      // --------------------------------------------------------
      // Categories
      // --------------------------------------------------------

      const categories = computed(() => {

        const values =
          activeJobs()
            .map(
              (job) =>
                job.categoryName?.trim(),
            )
            .filter(
              (
                category,
              ): category is string =>
                Boolean(category),
            );


        return [
          ...new Set(values),
        ].sort(
          (a, b) =>
            a.localeCompare(b),
        );

      });


      // --------------------------------------------------------
      // Filtered jobs
      // --------------------------------------------------------

      const filteredJobs = computed(() => {

        const search =
          searchTerm()
            .trim()
            .toLowerCase();


        const category =
          selectedCategory()
            .trim()
            .toLowerCase();


        const employmentType =
          selectedEmploymentType()
            .trim()
            .toLowerCase();


        const workArrangement =
          selectedWorkArrangement()
            .trim()
            .toLowerCase();


        const location =
          selectedLocation()
            .trim()
            .toLowerCase();


        return activeJobs()

          // ----------------------------------------------------
          // Search
          // ----------------------------------------------------

          .filter(
            (job) => {

              if (!search) {
                return true;
              }


              const searchableText = [

                job.title,

                job.organizationName,

                job.description,

                job.categoryName,

                job.location?.city,

                job.location?.state,

                job.location?.country,

                job.employmentType,

                job.workArrangement,

                ...(job.skills ?? []),

                ...(job.tags ?? []),

              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


              return searchableText.includes(
                search,
              );

            },
          )


          // ----------------------------------------------------
          // Category
          // ----------------------------------------------------

          .filter(
            (job) => {

              if (!category) {
                return true;
              }


              return (
                job.categoryName
                  ?.trim()
                  .toLowerCase() ===
                category
              );

            },
          )


          // ----------------------------------------------------
          // Employment type
          // ----------------------------------------------------

          .filter(
            (job) => {

              if (!employmentType) {
                return true;
              }


              return (
                job.employmentType
                  ?.trim()
                  .toLowerCase() ===
                employmentType
              );

            },
          )


          // ----------------------------------------------------
          // Work arrangement
          // ----------------------------------------------------

          .filter(
            (job) => {

              if (!workArrangement) {
                return true;
              }


              return (
                job.workArrangement
                  ?.trim()
                  .toLowerCase() ===
                workArrangement
              );

            },
          )


          // ----------------------------------------------------
          // Location
          // ----------------------------------------------------

          .filter(
            (job) => {

              if (!location) {
                return true;
              }


              const jobLocation = [

                job.location?.city,

                job.location?.state,

                job.location?.country,

                job.workArrangement,

              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


              return jobLocation.includes(
                location,
              );

            },
          );

      });


      // --------------------------------------------------------
      // Featured jobs
      // --------------------------------------------------------

      const featuredJobs = computed(() =>
        activeJobs().filter(
          (job) =>
            job.featured === true,
        ),
      );


      // --------------------------------------------------------
      // Result count
      // --------------------------------------------------------

      const resultCount = computed(
        () =>
          filteredJobs().length,
      );


      // --------------------------------------------------------
      // Active filters
      // --------------------------------------------------------

      const hasActiveFilters =
        computed(
          () =>
            searchTerm().trim() !== '' ||
            selectedCategory().trim() !== '' ||
            selectedEmploymentType().trim() !== '' ||
            selectedWorkArrangement().trim() !== '' ||
            selectedLocation().trim() !== '',
        );


      return {

        activeJobs,

        categories,

        filteredJobs,

        featuredJobs,

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
      jobService = inject(JobService),
    ) => ({

      // ========================================================
      // LOAD ACTIVE JOBS
      // ========================================================

      async loadActiveJobs(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const jobs =
            await jobService.getActiveJobs();


          patchState(
            store,
            {
              jobs,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load public jobs:',
            error,
          );


          patchState(
            store,
            {
              jobs: [],

              loading: false,

              error:
                'Unable to load available jobs. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // LOAD ALL JOBS
      // ========================================================

      async loadJobs(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const jobs =
            await jobService.getJobs();


          patchState(
            store,
            {
              jobs,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load jobs:',
            error,
          );


          patchState(
            store,
            {
              jobs: [],

              loading: false,

              error:
                'Unable to load jobs. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // LOAD SINGLE JOB
      // ========================================================

      async loadJob(
        id: string,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,

            selectedJob: null,
          },
        );


        try {

          const job =
            await jobService.getJob(
              id,
            );


          if (!job) {

            patchState(
              store,
              {
                loading: false,

                selectedJob: null,

                error:
                  'Job not found.',
              },
            );

            return;

          }


          patchState(
            store,
            {
              loading: false,

              selectedJob: job,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load job:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              selectedJob: null,

              error:
                'Unable to load job. Please try again.',
            },
          );

        }

      },

      // ========================================================
      // LOAD PUBLIC JOB
       async loadPublicJob(
        id: string,
      ): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
          selectedJob: null,
        });
      
        try {
          const job =
            await jobService.getJob(id);
      
          if (!job) {
            patchState(store, {
              loading: false,
              selectedJob: null,
              error: 'This job opportunity no longer exists.',
            });
      
            return;
          }
      
          if (job.status !== 'active') {
            patchState(store, {
              loading: false,
              selectedJob: null,
              error: 'This job opportunity is no longer available.',
            });
      
            return;
          }
      
          patchState(store, {
            loading: false,
            selectedJob: job,
            error: null,
          });
      
        } catch (error) {
      
          console.error(
            'Failed to load public job:',
            error,
          );
      
          patchState(store, {
            loading: false,
            selectedJob: null,
            error:
              'Unable to load this job opportunity. Please try again.',
          });
        }
      },


      // ========================================================
      // SEARCH
      // ========================================================

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


      // ========================================================
      // CATEGORY
      // ========================================================

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


      // ========================================================
      // EMPLOYMENT TYPE
      // ========================================================

      setEmploymentType(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedEmploymentType:
              value,
          },
        );

      },


      // ========================================================
      // WORK ARRANGEMENT
      // ========================================================

      setWorkArrangement(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedWorkArrangement:
              value,
          },
        );

      },


      // ========================================================
      // LOCATION
      // ========================================================

      setLocation(
        value: string,
      ): void {

        patchState(
          store,
          {
            selectedLocation:
              value,
          },
        );

      },


      // ========================================================
      // CLEAR FILTERS
      // ========================================================

      clearFilters(): void {

        patchState(
          store,
          {
            searchTerm: '',

            selectedCategory: '',

            selectedEmploymentType: '',

            selectedWorkArrangement: '',

            selectedLocation: '',
          },
        );

      },


      // ========================================================
      // CLEAR SELECTED JOB
      // ========================================================

      clearSelectedJob(): void {

        patchState(
          store,
          {
            selectedJob: null,
          },
        );

      },

    }),
  ),

);