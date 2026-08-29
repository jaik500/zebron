import {
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


import {
  Job,
  EmploymentType,
  WorkArrangement,
} from '../../../../core/models/job.model';

import { JobStore } from '../../../jobs/stores/job.store';

@Component({
  selector: 'app-find',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
  ],

  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->
    <main
      class="min-h-screen
             bg-gray-50"
    >

      <!-- =======================================================
           HEADER
           ======================================================= -->
      <header
        class="border-b
               border-gray-200
               bg-[#032D42]"
      >
        <div
          class="mx-auto
                 flex
                 max-w-7xl
                 items-center
                 justify-between
                 gap-4
                 px-4 py-5
                 sm:px-6
                 lg:px-8"
        >

          <!-- Header text -->
          <div class="min-w-0">

            <p
              class="text-xs
                     font-semibold
                     uppercase
                     tracking-wider
                     text-[#7ED6D1]"
            >
              Zebron Resource Finder
            </p>

            <h1
              class="mt-1
                     text-2xl
                     font-bold
                     tracking-tight
                     text-white
                     sm:text-3xl"
            >
              Find your next opportunity
            </h1>

            <p
              class="mt-1
                     max-w-3xl
                     text-sm
                     text-white/80
                     sm:text-base"
            >
              Find jobs, training programs, and resources
              that can help you build your next career opportunity.
            </p>

          </div>

          <!-- Home -->
          <a
            routerLink="/"
            class="inline-flex
                   shrink-0
                   items-center
                   rounded-lg
                   border
                   border-gray-300
                   bg-white
                   px-3 py-2
                   text-sm
                   font-semibold
                   text-gray-700
                   shadow-sm
                   transition
                   hover:border-[#7ED6D1]
                   hover:text-[#032D42]"
          >
            ← Home
          </a>

        </div>
      </header>


      <!-- =======================================================
           MAIN CONTENT
           ======================================================= -->
      <div
        class="mx-auto
               max-w-7xl
               px-4 py-6
               sm:px-6
               sm:py-8
               lg:px-8"
      >


        <!-- =====================================================
             FINDER CARDS
             Smaller than the current version
             ===================================================== -->
        <section
          class="grid
                 gap-4
                 md:grid-cols-2"
        >

          <!-- ===================================================
               FIND A JOB
               =================================================== -->
          <button
            type="button"
            (click)="scrollToJobs()"
            class="group
                   flex
                   min-h-[150px]
                   flex-col
                   justify-between
                   rounded-xl
                   border
                   border-gray-200
                   bg-white
                   p-5
                   text-left
                   shadow-sm
                   transition
                   hover:-translate-y-0.5
                   hover:border-[#7ED6D1]
                   hover:shadow-md"
          >

            <div>

              <div
                class="flex
                       h-10 w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]/10
                       text-xl"
              >
                💼
              </div>

              <h2
                class="mt-3
                       text-lg
                       font-bold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Find a Job
              </h2>

              <p
                class="mt-1
                       max-w-xl
                       text-sm
                       leading-5
                       text-gray-600"
              >
                Discover job opportunities and employment
                resources based on your skills, location,
                and preferences.
              </p>

            </div>

            <span
              class="mt-3
                     text-sm
                     font-semibold
                     text-[#007979]"
            >
              Find jobs →
            </span>

          </button>


          <!-- ===================================================
               FIND TRAINING
               =================================================== -->
          <a
            routerLink="/training"
            class="group
                   flex
                   min-h-[150px]
                   flex-col
                   justify-between
                   rounded-xl
                   border
                   border-gray-200
                   bg-white
                   p-5
                   text-left
                   shadow-sm
                   transition
                   hover:-translate-y-0.5
                   hover:border-[#7ED6D1]
                   hover:shadow-md"
          >

            <div>

              <div
                class="flex
                       h-10 w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]/10
                       text-xl"
              >
                🎓
              </div>

              <h2
                class="mt-3
                       text-lg
                       font-bold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Find Training
              </h2>

              <p
                class="mt-1
                       max-w-xl
                       text-sm
                       leading-5
                       text-gray-600"
              >
                Discover bootcamps, courses, certifications,
                and job-ready training programs.
              </p>

            </div>

            <span
              class="mt-3
                     text-sm
                     font-semibold
                     text-[#007979]"
            >
              Find training →
            </span>

          </a>

        </section>


        <!-- =====================================================
             JOB BOARD
             ===================================================== -->
        <section
          id="job-opportunities"
          class="mt-8 scroll-mt-6"
        >

          <!-- Section heading -->
          <div
            class="mb-4
                   flex
                   flex-col
                   gap-1
                   sm:flex-row
                   sm:items-end
                   sm:justify-between"
          >

            <div>

              <p
                class="text-xs
                       font-semibold
                       uppercase
                       tracking-wider
                       text-[#007979]"
              >
                Opportunities
              </p>

              <h2
                class="mt-1
                       text-xl
                       font-bold
                       tracking-tight
                       text-[#032D42]"
              >
                Job Opportunities
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-gray-500"
              >
                Explore current job opportunities available through Zebron.
              </p>

            </div>

            @if (!loading()) {

              <span
                class="text-sm
                       text-gray-500"
              >
                {{ filteredJobs().length }}
                {{ filteredJobs().length === 1
                    ? 'opportunity'
                    : 'opportunities' }}
              </span>

            }

          </div>


          <!-- ===================================================
               SEARCH + FILTERS
               =================================================== -->
          <section
            class="rounded-xl
                   border
                   border-gray-200
                   bg-white
                   p-4
                   shadow-sm"
          >

            <!-- Search -->
            <div>

              <label
                for="jobSearch"
                class="sr-only"
              >
                Search jobs
              </label>

              <div
                class="relative"
              >

                <span
                  class="pointer-events-none
                         absolute
                         inset-y-0
                         left-3
                         flex
                         items-center
                         text-gray-400"
                >
                  🔎
                </span>

                <input
                  id="jobSearch"
                  type="search"
                  [value]="searchTerm()"
                  (input)="
                    setSearchTerm(
                      $any($event.target).value
                    )
                  "
                  placeholder="Search jobs, organizations, skills..."
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         py-2.5
                         pl-10
                         pr-4
                         text-sm
                         text-gray-900
                         outline-none
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

              </div>

            </div>


            <!-- Filters -->
            <div
              class="mt-3
                     grid
                     gap-3
                     sm:grid-cols-2
                     lg:grid-cols-4"
            >

              <!-- Category -->
              <select
                [value]="categoryFilter()"
                (change)="
                  setCategoryFilter(
                    $any($event.target).value
                  )
                "
                class="rounded-lg
                       border
                       border-gray-300
                       bg-white
                       px-3 py-2.5
                       text-sm
                       text-gray-700
                       outline-none
                       focus:border-[#007979]
                       focus:ring-2
                       focus:ring-[#007979]/20"
              >

                <option value="">
                  All categories
                </option>

                @for (
                  category of categories();
                  track category
                ) {

                  <option
                    [value]="category"
                  >
                    {{ category }}
                  </option>

                }

              </select>


              <!-- Employment type -->
              <select
                [value]="employmentTypeFilter()"
                (change)="
                  setEmploymentTypeFilter(
                    $any($event.target).value
                  )
                "
                class="rounded-lg
                       border
                       border-gray-300
                       bg-white
                       px-3 py-2.5
                       text-sm
                       text-gray-700
                       outline-none
                       focus:border-[#007979]
                       focus:ring-2
                       focus:ring-[#007979]/20"
              >

                <option value="">
                  All employment types
                </option>

                <option value="full-time">
                  Full-time
                </option>

                <option value="part-time">
                  Part-time
                </option>

                <option value="contract">
                  Contract
                </option>

                <option value="internship">
                  Internship
                </option>

                <option value="temporary">
                  Temporary
                </option>

              </select>


              <!-- Work arrangement -->
              <select
                [value]="workArrangementFilter()"
                (change)="
                  setWorkArrangementFilter(
                    $any($event.target).value
                  )
                "
                class="rounded-lg
                       border
                       border-gray-300
                       bg-white
                       px-3 py-2.5
                       text-sm
                       text-gray-700
                       outline-none
                       focus:border-[#007979]
                       focus:ring-2
                       focus:ring-[#007979]/20"
              >

                <option value="">
                  All work arrangements
                </option>

                <option value="remote">
                  Remote
                </option>

                <option value="hybrid">
                  Hybrid
                </option>

                <option value="on-site">
                  On-site
                </option>

              </select>


              <!-- Location -->
              <div
                class="flex gap-2"
              >

                <input
                  type="text"
                  [value]="locationFilter()"
                  (input)="
                    setLocationFilter(
                      $any($event.target).value
                    )
                  "
                  placeholder="Location"
                  class="min-w-0
                         flex-1
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3 py-2.5
                         text-sm
                         text-gray-700
                         outline-none
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

                @if (hasActiveFilters()) {

                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="shrink-0
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3
                           text-xs
                           font-semibold
                           text-gray-600
                           transition
                           hover:bg-gray-50"
                  >
                    Clear
                  </button>

                }

              </div>

            </div>

          </section>


          <!-- ===================================================
               LOADING
               =================================================== -->
          @if (loading()) {

            <section
              class="mt-4
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     px-6 py-12
                     text-center
                     shadow-sm"
            >

              <div
                class="mx-auto
                       h-8 w-8
                       animate-spin
                       rounded-full
                       border-2
                       border-gray-200
                       border-t-[#007979]"
              ></div>

              <p
                class="mt-3
                       text-sm
                       text-gray-500"
              >
                Loading job opportunities...
              </p>

            </section>

          }


          <!-- ===================================================
               ERROR
               =================================================== -->
          @else if (error()) {

            <section
              class="mt-4
                     rounded-xl
                     border
                     border-red-200
                     bg-red-50
                     p-6
                     text-center"
            >

              <p
                class="text-sm
                       font-medium
                       text-red-700"
              >
                {{ error() }}
              </p>

              <button
                type="button"
                (click)="loadJobs()"
                class="mt-4
                       rounded-lg
                       bg-[#007979]
                       px-4 py-2
                       text-sm
                       font-semibold
                       text-white
                       hover:bg-[#006666]"
              >
                Try again
              </button>

            </section>

          }


          <!-- ===================================================
               NO RESULTS
               =================================================== -->
          @else if (filteredJobs().length === 0) {

            <section
              class="mt-4
                     rounded-xl
                     border
                     border-dashed
                     border-gray-300
                     bg-white
                     px-6 py-12
                     text-center"
            >

              <div
                class="mx-auto
                       flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-full
                       bg-[#007979]/10
                       text-xl"
              >
                💼
              </div>

              <h3
                class="mt-4
                       font-semibold
                       text-[#032D42]"
              >
                No matching jobs
              </h3>

              <p
                class="mt-1
                       text-sm
                       text-gray-500"
              >
                Try changing your search or filters.
              </p>

              @if (hasActiveFilters()) {

                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-4
                         text-sm
                         font-semibold
                         text-[#007979]
                         hover:underline"
                >
                  Clear filters
                </button>

              }

            </section>

          }


          <!-- ===================================================
               JOB LIST
               =================================================== -->
          @else {

            <div
              class="mt-4
                     grid
                     gap-4
                     md:grid-cols-2
                     xl:grid-cols-3"
            >

              @for (
                job of filteredJobs();
                track job.id
              ) {

                <a
                  [routerLink]="[
                    '/jobs',
                    job.id
                  ]"
                  class="group
                         flex
                         flex-col
                         rounded-xl
                         border
                         border-gray-200
                         bg-white
                         p-5
                         shadow-sm
                         transition
                         hover:-translate-y-0.5
                         hover:border-[#7ED6D1]
                         hover:shadow-md"
                >

                  <!-- Job content -->
                  <div
                    class="flex-1"
                  >

                    <div
                      class="flex
                             items-start
                             justify-between
                             gap-3"
                    >

                      <div class="min-w-0">

                        @if (job.featured) {

                          <span
                            class="inline-flex
                                   rounded-full
                                   bg-yellow-100
                                   px-2
                                   py-0.5
                                   text-[10px]
                                   font-semibold
                                   text-yellow-700"
                          >
                            ⭐ Featured
                          </span>

                        }

                        <h3
                          class="mt-2
                                 font-bold
                                 leading-6
                                 text-[#032D42]
                                 group-hover:text-[#007979]"
                        >
                          {{ job.title }}
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 font-medium
                                 text-gray-600"
                        >
                          {{ job.organizationName }}
                        </p>

                      </div>

                      <span
                        class="shrink-0
                               text-lg
                               text-gray-300
                               transition
                               group-hover:translate-x-1
                               group-hover:text-[#007979]"
                      >
                        →
                      </span>

                    </div>


                    <!-- Tags -->
                    <div
                      class="mt-3
                             flex
                             flex-wrap
                             gap-2"
                    >

                      <span
                        class="rounded-full
                               bg-[#007979]/10
                               px-2.5 py-1
                               text-xs
                               font-medium
                               text-[#007979]"
                      >
                        {{ formatEmploymentType(
                          job.employmentType
                        ) }}
                      </span>

                      <span
                        class="rounded-full
                               bg-gray-100
                               px-2.5 py-1
                               text-xs
                               text-gray-600"
                      >
                        {{ formatWorkArrangement(
                          job.workArrangement
                        ) }}
                      </span>

                      @if (formatLocation(job)) {

                        <span
                          class="rounded-full
                                 bg-gray-100
                                 px-2.5 py-1
                                 text-xs
                                 text-gray-600"
                        >
                          📍
                          {{ formatLocation(job) }}
                        </span>

                      }

                    </div>


                    <!-- Description -->
                    <p
                      class="mt-3
                             line-clamp-3
                             text-sm
                             leading-6
                             text-gray-600"
                    >
                      {{ job.description }}
                    </p>

                  </div>


                  <!-- Footer -->
                  <div
                    class="mt-4
                           flex
                           items-center
                           justify-between
                           border-t
                           border-gray-100
                           pt-3"
                  >

                    <span
                      class="text-xs
                             text-gray-400"
                    >
                      View opportunity
                    </span>

                    <span
                      class="text-sm
                             font-semibold
                             text-[#007979]"
                    >
                      View Job →
                    </span>

                  </div>

                </a>

              }

            </div>

          }

        </section>

      </div>

    </main>
  `,

})
export class FindComponent
  implements OnInit {


   // =========================================================
  // JOB STORE
  // =========================================================

  protected readonly jobStore =
    inject(JobStore);


  // =========================================================
  // JOB STATE
  //
  // These properties intentionally expose the JobStore
  // to the existing template. This allows us to migrate
  // the state-management architecture without having to
  // redesign the Find page.
  // =========================================================

  protected readonly jobs =
    this.jobStore.jobs;

  protected readonly loading =
    this.jobStore.loading;

  protected readonly error =
    this.jobStore.error;


  // =========================================================
  // JOB FILTERS
  // =========================================================

  protected readonly searchTerm =
    this.jobStore.searchTerm;

  protected readonly categoryFilter =
    this.jobStore.selectedCategory;

  protected readonly employmentTypeFilter =
    this.jobStore.selectedEmploymentType;

  protected readonly workArrangementFilter =
    this.jobStore.selectedWorkArrangement;

  protected readonly locationFilter =
    this.jobStore.selectedLocation;


  // =========================================================
  // JOB DERIVED STATE
  // =========================================================

  protected readonly categories =
    this.jobStore.categories;

  protected readonly filteredJobs =
    this.jobStore.filteredJobs;

  protected readonly resultCount =
    this.jobStore.resultCount;

  protected readonly hasActiveFilters =
    this.jobStore.hasActiveFilters;


  // =========================================================
  // LIFECYCLE
  // =========================================================

  ngOnInit(): void {

    void this.loadJobs();

  }


  // =========================================================
  // LOAD ACTIVE JOBS
  // =========================================================

  protected async loadJobs(): Promise<void> {

    await this.jobStore.loadActiveJobs();

  }


  // =========================================================
  // SEARCH
  // =========================================================

  protected setSearchTerm(
    value: string,
  ): void {

    this.jobStore.setSearchTerm(
      value,
    );

  }


  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  protected setCategoryFilter(
    value: string,
  ): void {

    this.jobStore.setCategory(
      value,
    );

  }


  // =========================================================
  // EMPLOYMENT TYPE FILTER
  // =========================================================

  protected setEmploymentTypeFilter(
    value: string,
  ): void {

    this.jobStore.setEmploymentType(
      value,
    );

  }


  // =========================================================
  // WORK ARRANGEMENT FILTER
  // =========================================================

  protected setWorkArrangementFilter(
    value: string,
  ): void {

    this.jobStore.setWorkArrangement(
      value,
    );

  }


  // =========================================================
  // LOCATION FILTER
  // =========================================================

  protected setLocationFilter(
    value: string,
  ): void {

    this.jobStore.setLocation(
      value,
    );

  }


  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  protected clearFilters(): void {

    this.jobStore.clearFilters();

  }


  // =========================================================
  // Scroll to job board
  // =========================================================

  protected scrollToJobs(): void {

    document
      .getElementById(
        'job-opportunities'
      )
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

  }


  // =========================================================
  // Formatting
  // =========================================================

  protected formatEmploymentType(
    value: EmploymentType
  ): string {

    const labels:
      Record<
        EmploymentType,
        string
      > = {

      'full-time':
        'Full-time',

      'part-time':
        'Part-time',

      contract:
        'Contract',

      internship:
        'Internship',

      temporary:
        'Temporary',

    };

    return labels[value];

  }


  protected formatWorkArrangement(
    value: WorkArrangement
  ): string {

    const labels:
      Record<
        WorkArrangement,
        string
      > = {

      'on-site':
        'On-site',

      hybrid:
        'Hybrid',

      remote:
        'Remote',

    };

    return labels[value];

  }


  protected formatLocation(
    job: Job
  ): string {

    const city =
      job.location?.city?.trim();

    const state =
      job.location?.state?.trim();


    if (
      city &&
      state
    ) {
      return `${city}, ${state}`;
    }


    if (city) {
      return city;
    }


    if (state) {
      return state;
    }


    if (
      job.workArrangement ===
      'remote'
    ) {
      return 'Remote';
    }


    return 'Location not specified';

  }

}