import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
              Opportunities and employment resources
              based on your search.
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
                Resources that may help you find
                your next opportunity.
              </p>
            </div>

            <span
              class="hidden
                     rounded-full
                     bg-gray-100
                     px-3 py-1
                     text-xs
                     font-medium
                     text-gray-600
                     sm:inline-flex"
            >
              Coming soon
            </span>

          </div>

          <!-- Empty state -->
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
              We're preparing your matches
            </h3>

            <p
              class="mx-auto mt-2
                     max-w-md
                     text-sm
                     leading-6
                     text-gray-600"
            >
              Your search criteria have been saved.
              We're working on connecting the Finder
              to Zebron's job and employment resources.
            </p>

            <div
              class="mt-6
                     flex flex-col
                     justify-center
                     gap-3
                     sm:flex-row"
            >

              <a
                routerLink="/find/job"
                class="inline-flex
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

              <a
                routerLink="/find/training"
                class="inline-flex
                       items-center
                       justify-center
                       rounded-lg
                       border border-gray-300
                       bg-white
                       px-5 py-3
                       text-sm
                       font-semibold
                       text-gray-700
                       transition
                       hover:border-[#007979]
                       hover:text-[#007979]"
              >
                Find Training →
              </a>

            </div>

          </div>

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
export class JobResultsComponent {

  private readonly route = inject(
    ActivatedRoute,
  );

  // ---------------------------------------------------------
  // Search parameters
  // ---------------------------------------------------------

  protected readonly jobType = computed(
    () =>
      this.route.snapshot.queryParamMap.get(
        'type',
      ) ?? '',
  );

  protected readonly location = computed(
    () =>
      this.route.snapshot.queryParamMap.get(
        'location',
      ) ?? '',
  );

  protected readonly preference = computed(
    () =>
      this.route.snapshot.queryParamMap.get(
        'preference',
      ) ?? '',
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

    return (
      labels[this.jobType()] ||
      this.jobType() ||
      'Any job type'
    );
  });

  protected readonly preferenceLabel = computed(() => {
    const labels: Record<string, string> = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      remote: 'Remote',
      any: 'Any opportunity',
    };

    return (
      labels[this.preference()] ||
      this.preference() ||
      'Any preference'
    );
  });
}
