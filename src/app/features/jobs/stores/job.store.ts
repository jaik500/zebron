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


        /*
         * The Job Finder uses short category slugs,
         * while Job records store human-readable
         * category names.
         *
         * Normalize both representations here so
         * the Finder and Job data can use different
         * display formats without breaking matching.
         */
        const categoryAliases: Record<string, string[]> = {

          technology: [
            'technology',
            'technology & it',
            'it',
            'information technology',
          ],

          healthcare: [
            'healthcare',
            'health care',
            'medical',
          ],

          business: [
            'business',
            'business & finance',
            'finance',
          ],

          'skilled-trades': [
            'skilled trades',
            'skilled-trade',
            'trades',
          ],

          administrative: [
            'administrative',
            'administration',
            'office administration',
          ],

          'customer-service': [
            'customer service',
            'customer support',
          ],
        };


        /*
         * Convert the selected Finder category
         * into the possible category names stored
         * on Job records.
         */
        const categoryMatches =
          category
            ? (
                categoryAliases[category] ?? [category]
              ).map(
                (value) =>
                  value.trim().toLowerCase(),
              )
            : [];


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


              const jobCategory =
                job.categoryName
                  ?.trim()
                  .toLowerCase() ?? '';


              /*
               * First try the explicit aliases.
               */
              if (
                categoryMatches.includes(
                  jobCategory,
                )
              ) {
                return true;
              }


              /*
               * Also allow the selected category to
               * match the beginning of a stored category.
               *
               * Example:
               *
               * "technology"
               * matches
               * "technology & it"
               */
              return (
                jobCategory.startsWith(
                  category,
                ) ||
                category.startsWith(
                  jobCategory,
                )
              );

            },
          )


          // ----------------------------------------------------
          // Employment Type
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
          // Work Arrangement
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


              const jobLocationParts = [

                job.location?.city,

                job.location?.state,

                job.location?.country,

              ]
                .filter(Boolean)
                .map(
                  (value) =>
                    value!
                      .trim()
                      .toLowerCase(),
                );


              /*
               * A location entered by the user may be:
               *
               * Atlanta
               * Atlanta, GA
               * GA
               * Georgia
               * United States
               *
               * Match against the complete location
               * as well as individual location parts.
               */
              const jobLocation =
                jobLocationParts.join(' ');


              return (
                jobLocation.includes(location) ||
                jobLocationParts.some(
                  (part) =>
                    part.includes(location) ||
                    location.includes(part),
                )
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
      // CLEAR SELECTED JO dB
      // ========================================================

      clearSelectedJob(): void {

        patchState(
          store,
          {
            selectedJob: null,
          },
        );

      },

      // DELETE JOB
      // ========================================================
// DELETE JOB
// ========================================================

async deleteJob(
  id: string,
): Promise<void> {

  try {

    await jobService.deleteJob(id);

    /*
     * Remove the deleted job from the Store immediately
     * so every component using JobStore receives the
     * updated state.
     */
    patchState(
      store,
      {
        jobs: store.jobs().filter(
          (job) => job.id !== id,
        ),
      },
    );

  } catch (error) {

    console.error(
      'Failed to delete job:',
      error,
    );

    throw error;
  }
},

// ========================================================
// CREATE JOB
// ========================================================

async createJob(
  job: Omit<
    Job,
    'id' | 'createdAt' | 'updatedAt'
  >,
): Promise<string> {

  try {

    const jobId =
      await jobService.createJob(job);

    return jobId;

  } catch (error) {

    console.error(
      'Failed to create job:',
      error,
    );

    throw error;
  }
},


// ========================================================
// UPDATE JOB
// ========================================================

async updateJob(
  id: string,
  changes: Partial<
    Omit<
      Job,
      'id' | 'createdAt' | 'updatedAt'
    >
  >,
): Promise<void> {

  try {

    await jobService.updateJob(
      id,
      changes,
    );

  } catch (error) {

    console.error(
      'Failed to update job:',
      error,
    );

    throw error;
  }
},

// ========================================================
// GET JOB
// ========================================================

async getJob(
  id: string,
): Promise<Job | null> {

  try {

    return await jobService.getJob(id);

  } catch (error) {

    console.error(
      'Failed to get job:',
      error,
    );

    throw error;
  }
},

    }),
  ),
);