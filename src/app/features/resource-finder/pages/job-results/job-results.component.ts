import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JobStore } from '../../../jobs/stores/job.store';

@Component({
  selector: 'app-job-results',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- =====================================================
           Page Header
           Matches Job Finder / Training Finder
           ===================================================== -->
      <header
        class="border-b border-gray-200
               bg-[#032D42]"
      >
        <div
          class="mx-auto flex max-w-7xl
                 items-center
                 justify-between
                 gap-4
                 px-4 py-4
                 sm:px-6
                 lg:px-8"
        >
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
              class="text-xl
                     font-bold
                     text-white
                     sm:text-3xl"
            >
              Job Matches
            </h1>

            <p
              class="mt-1
                     text-sm
                     text-white/80"
            >
              Opportunities and employment resources based on your search.
            </p>
          </div>

          <a
            routerLink="/"
            class="inline-flex
                   shrink-0
                   items-center
                   rounded-lg
                   border border-gray-300
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

      <!-- =====================================================
           Results Content
           ===================================================== -->
      <div
        class="mx-auto max-w-6xl
               px-4 py-8
               sm:px-6
               lg:px-8"
      >
        <!-- Search Summary -->
        <section
          class="rounded-xl
                 border border-gray-200
                 bg-white
                 p-5
                 shadow-sm
                 sm:p-6"
        >
          <div
            class="flex flex-col gap-4
                   sm:flex-row
                   sm:items-center
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
                Your search
              </p>

              <h2
                class="mt-1
                       text-xl
                       font-bold
                       text-[#032D42]"
              >
                Jobs matching your preferences
              </h2>
            </div>

            <a
              routerLink="/find/job"
              class="inline-flex
                     items-center
                     justify-center
                     rounded-lg
                     border border-gray-300
                     bg-white
                     px-4 py-2
                     text-sm
                     font-semibold
                     text-gray-700
                     transition
                     hover:border-[#007979]
                     hover:text-[#007979]"
            >
              Modify search
            </a>
          </div>

          <!-- Criteria -->
          <div
            class="mt-5
                   flex flex-wrap
                   gap-2"
          >
            <span
              class="rounded-full
                     bg-[#007979]/10
                     px-3 py-1.5
                     text-xs
                     font-medium
                     text-[#007979]"
            >
              💼 {{ jobTypeLabel() }}
            </span>

            <span
              class="rounded-full
                     bg-gray-100
                     px-3 py-1.5
                     text-xs
                     font-medium
                     text-gray-700"
            >
              📍 {{ location() }}
            </span>

            <span
              class="rounded-full
                     bg-gray-100
                     px-3 py-1.5
                     text-xs
                     font-medium
                     text-gray-700"
            >
              {{ preferenceLabel() }}
            </span>
          </div>
        </section>

        <!-- ===================================================
             Results
             =================================================== -->
        <section class="mt-8">
          <div
            class="flex items-center
                   justify-between"
          >
            <div>
              <h2
                class="text-lg
                       font-bold
                       text-[#032D42]"
              >
                Your matches
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-gray-500"
              >
                Resources that may help you find your next opportunity.
              </p>
            </div>

            <span
              class="hidden
         rounded-full
         bg-[#007979]/10
         px-3 py-1
         text-xs
         font-medium
         text-[#007979]
         sm:inline-flex"
            >
              {{ resultCount() }} {{ resultCount() === 1 ? 'job' : 'jobs' }}
            </span>
          </div>

                  <!-- ===================================================
               Results State
               =================================================== -->

          @if (loading()) {

            <!-- Loading -->
            <div
              class="mt-5
                     rounded-xl
                     border border-gray-200
                     bg-white
                     px-6 py-12
                     text-center"
            >

              <div
                class="mx-auto
                       h-8 w-8
                       animate-spin
                       rounded-full
                       border-4
                       border-gray-200
                       border-t-[#007979]"
                aria-hidden="true"
              ></div>

              <h3
                class="mt-4
                       text-lg
                       font-semibold
                       text-[#032D42]"
              >
                Finding jobs for you
              </h3>

              <p
                class="mt-2
                       text-sm
                       text-gray-600"
              >
                We're searching available opportunities
                that match your preferences.
              </p>

            </div>

          } @else if (error()) {

            <!-- Error -->
            <div
              class="mt-5
                     rounded-xl
                     border border-red-200
                     bg-red-50
                     px-6 py-10
                     text-center"
            >

              <div
                class="mx-auto
                       flex h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-red-100
                       text-xl"
                aria-hidden="true"
              >
                !
              </div>

              <h3
                class="mt-4
                       text-lg
                       font-semibold
                       text-red-800"
              >
                Unable to load jobs
              </h3>

              <p
                class="mx-auto mt-2
                       max-w-md
                       text-sm
                       leading-6
                       text-red-700"
              >
                {{ error() }}
              </p>

              <a
                routerLink="/find/job"
                class="mt-6
                       inline-flex
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]
                       px-5 py-3
                       text-sm
                       font-semibold
                       text-white
                       shadow-sm
                       transition
                       hover:bg-[#006666]"
              >
                Modify search
              </a>

            </div>

          } @else if (jobs().length === 0) {

            <!-- No matches -->
            <div
              class="mt-5
                     rounded-xl
                     border border-dashed
                     border-gray-300
                     bg-white
                     px-6 py-12
                     text-center"
            >

              <div
                class="mx-auto
                       flex h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-2xl"
                aria-hidden="true"
              >
                💼
              </div>

              <h3
                class="mt-4
                       text-lg
                       font-semibold
                       text-[#032D42]"
              >
                No matching jobs found
              </h3>

              <p
                class="mx-auto mt-2
                       max-w-md
                       text-sm
                       leading-6
                       text-gray-600"
              >
                We couldn't find active job opportunities
                matching your current preferences.
                Try broadening your search.
              </p>

              <a
                routerLink="/find/job"
                class="mt-6
                       inline-flex
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]
                       px-5 py-3
                       text-sm
                       font-semibold
                       text-white
                       shadow-sm
                       transition
                       hover:bg-[#006666]"
              >
                Modify search
              </a>

            </div>

          } @else {

            <!-- Job Results -->
            <div class="mt-5 space-y-4">

              @for (
                job of jobs();
                track job.id
              ) {

                <article
                  class="rounded-xl
                         border border-gray-200
                         bg-white
                         p-5
                         shadow-sm
                         transition
                         hover:border-[#7ED6D1]
                         hover:shadow-md
                         sm:p-6"
                >

                  <div
                    class="flex
                           flex-col
                           gap-4
                           sm:flex-row
                           sm:items-start
                           sm:justify-between"
                  >

                    <!-- Job information -->
                    <div class="min-w-0">

                      <div
                        class="flex
                               flex-wrap
                               items-center
                               gap-2"
                      >

                        @if (job.featured) {

                          <span
                            class="rounded-full
                                   bg-[#007979]/10
                                   px-2.5 py-1
                                   text-xs
                                   font-semibold
                                   text-[#007979]"
                          >
                            Featured
                          </span>

                        }

                        <span
                          class="rounded-full
                                 bg-gray-100
                                 px-2.5 py-1
                                 text-xs
                                 font-medium
                                 text-gray-600"
                        >
                          {{ job.employmentType }}
                        </span>

                        <span
                          class="rounded-full
                                 bg-gray-100
                                 px-2.5 py-1
                                 text-xs
                                 font-medium
                                 text-gray-600"
                        >
                          {{ job.workArrangement }}
                        </span>

                      </div>

                      <h3
                        class="mt-3
                               text-lg
                               font-bold
                               text-[#032D42]
                               sm:text-xl"
                      >
                        {{ job.title }}
                      </h3>

                      <p
                        class="mt-1
                               text-sm
                               font-semibold
                               text-[#007979]"
                      >
                        {{ job.organizationName }}
                      </p>

                      @if (job.location) {

                        <p
                          class="mt-2
                                 text-sm
                                 text-gray-600"
                        >
                          📍

                          @if (job.location.city) {
                            {{ job.location.city }}
                          }

                          @if (
                            job.location.city &&
                            job.location.state
                          ) {
                            ,
                          }

                          @if (job.location.state) {
                            {{ job.location.state }}
                          }

                          @if (
                            !job.location.city &&
                            !job.location.state &&
                            job.location.country
                          ) {
                            {{ job.location.country }}
                          }

                        </p>

                      }

                    </div>


                    <!-- View job -->
                    <a
                      [routerLink]="['/jobs', job.id]"
                      class="inline-flex
                             shrink-0
                             items-center
                             justify-center
                             rounded-lg
                             bg-[#007979]
                             px-4 py-2.5
                             text-sm
                             font-semibold
                             text-white
                             shadow-sm
                             transition
                             hover:bg-[#006666]"
                    >
                      View job →
                    </a>

                  </div>


                  <!-- Description -->
                  @if (job.description) {

                    <p
                      class="mt-4
                             line-clamp-3
                             text-sm
                             leading-6
                             text-gray-600"
                    >
                      {{ job.description }}
                    </p>

                  }


                  <!-- Skills -->
                  @if (job.skills.length > 0) {

                    <div
                      class="mt-4
                             flex flex-wrap
                             gap-2"
                    >

                      @for (
                        skill of job.skills.slice(0, 5);
                        track skill
                      ) {

                        <span
                          class="rounded-full
                                 border border-gray-200
                                 px-2.5 py-1
                                 text-xs
                                 text-gray-600"
                        >
                          {{ skill }}
                        </span>

                      }

                    </div>

                  }

                </article>

              }

            </div>

          }
        </section>

        <!-- Footer -->
        <p
          class="mt-8
                 text-center
                 text-xs
                 text-gray-500"
        >
          Free to use · No account required
        </p>
      </div>
    </main>
  `,
})
export class JobResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly jobStore = inject(JobStore);

  protected readonly jobs = this.jobStore.filteredJobs;

  protected readonly loading = this.jobStore.loading;

  protected readonly error = this.jobStore.error;

  protected readonly resultCount = this.jobStore.resultCount;

  // ---------------------------------------------------------
  // Search parameters
  // ---------------------------------------------------------

  protected readonly jobType = computed(() => this.route.snapshot.queryParamMap.get('type') ?? '');

  protected readonly location = computed(
    () => this.route.snapshot.queryParamMap.get('location') ?? '',
  );

  protected readonly preference = computed(
    () => this.route.snapshot.queryParamMap.get('preference') ?? '',
  );

  // ---------------------------------------------------------
  // Display labels
  // ---------------------------------------------------------

  protected readonly jobTypeLabel = computed(() => {
    const labels: Record<string, string> = {
      technology: 'Technology & IT',
      healthcare: 'Healthcare',
      business: 'Business & Finance',
      'skilled-trades': 'Skilled Trades',
      administrative: 'Administrative',
      'customer-service': 'Customer Service',
    };

    return labels[this.jobType()] || this.jobType() || 'Any job type';
  });

  protected readonly preferenceLabel = computed(() => {
    const labels: Record<string, string> = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      remote: 'Remote',
      any: 'Any opportunity',
    };

    return labels[this.preference()] || this.preference() || 'Any preference';
  });

  ngOnInit(): void {
    void this.loadResults();
  }

  private async loadResults(): Promise<void> {
    /*
     * Restore the search criteria from the URL.
     *
     * This allows a results URL to be refreshed or
     * bookmarked without losing the search.
     */

    this.jobStore.setCategory(this.jobType());

    this.jobStore.setLocation(this.location());

    this.jobStore.setEmploymentType('');
    this.jobStore.setWorkArrangement('');

    switch (this.preference()) {
      case 'full-time':
        this.jobStore.setEmploymentType('full-time');
        break;

      case 'part-time':
        this.jobStore.setEmploymentType('part-time');
        break;

      case 'remote':
        this.jobStore.setWorkArrangement('remote');
        break;
    }

    await this.jobStore.loadActiveJobs();
  }
}
