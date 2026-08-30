import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobStore } from '../../../jobs/stores/job.store';

@Component({
  selector: 'app-job-finder',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- =====================================================
     Page Header
     Matches the Training Finder header
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
          <!-- Title and description -->
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
              Find a Job
            </h1>

            <p
              class="mt-1
               text-sm
               text-white/80"
            >
              Discover job opportunities and employment resources that match your skills and goals.
            </p>
          </div>

          <!-- Home -->
          <a
            routerLink="/"
            class="inline-flex
             shrink-0
             items-center
             rounded-lg
             border border-gray-300
             bg-white
             px-3 py-2
             text-sm font-semibold
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

      <div
        class="mx-auto max-w-3xl
           px-4 py-1
           sm:px-6
           lg:px-6"
      >
        <!-- Progress -->
        <div class="mt-3">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Find a Job
            </span>

            <span class="text-xs text-gray-500"> Step {{ step() }} of 3 </span>
          </div>

          <div
            class="mt-2 h-1.5
                   overflow-hidden
                   rounded-full
                   bg-gray-200"
          >
            <div
              class="h-full rounded-full
                     bg-[#007979]
                     transition-all duration-300"
              [style.width.%]="(step() / 3) * 100"
            ></div>
          </div>
        </div>

        @if (step() === 1) {
          <!-- STEP 1 -->
          <section class="mt-4">
            <div
              class="flex h-12 w-12
                     items-center justify-center
                     rounded-xl
                     bg-[#007979]/10
                     text-2xl
                     hidden
                     sm:block"
            >
              🎓
            </div>

            <h1
              class="mt-3 text-3xl
                     font-bold tracking-tight
                     text-[#032D42]
                     sm:text-4xl"
            >
              What kind of work are you looking for?
            </h1>

            <p
              class="mt-3 text-sm
                     leading-6 text-gray-600
                     sm:text-base"
            >
              Choose the area that best matches the type of work you want to find.
            </p>

            <div
              class="mt-4 grid gap-2
                     sm:grid-cols-2"
            >
              @for (option of jobTypes; track option.value) {
                <button
                  type="button"
                  (click)="selectJobType(option.value)"
                  [class.border-[#007979]]="selectedJobType() === option.value"
                  [class.bg-[#007979]/5]="selectedJobType() === option.value"
                  class="flex items-center
                         justify-between
                         rounded-xl
                         border border-gray-200
                         bg-white
                         px-4 py-4
                         text-left
                         transition
                         hover:border-[#007979]
                         hover:bg-[#007979]/5"
                >
                  <span>
                    <span
                      class="block text-sm
                             font-semibold
                             text-gray-900"
                    >
                      {{ option.label }}
                    </span>

                    <span
                      class="mt-1 block text-xs
                             text-gray-500"
                    >
                      {{ option.description }}
                    </span>
                  </span>

                  @if (selectedJobType() === option.value) {
                    <span
                      class="ml-3
                             text-[#007979]"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  }
                </button>
              }
            </div>
          </section>
        } @else if (step() === 2) {
          <!-- STEP 2 -->
          <section class="mt-8">
            <div
              class="flex h-12 w-12
                     items-center justify-center
                     rounded-xl
                     bg-[#007979]/10
                     text-2xl"
            >
              📍
            </div>

            <h1
              class="mt-5 text-3xl
                     font-bold tracking-tight
                     text-[#032D42]
                     sm:text-4xl"
            >
              Where are you looking?
            </h1>

            <p
              class="mt-3 text-sm
                     leading-6 text-gray-600
                     sm:text-base"
            >
              Tell us where you want to work. You can enter a city, state, or search for remote
              opportunities.
            </p>

            <label
              for="jobLocation"
              class="mt-8 block text-sm
                     font-semibold
                     text-gray-900"
            >
              Location
            </label>

            <input
              id="jobLocation"
              name="jobLocation"
              type="text"
              [(ngModel)]="location"
              placeholder="e.g. Washington, DC"
              class="mt-3 block w-full
                     rounded-xl
                     border border-gray-300
                     bg-white
                     px-4 py-3
                     text-sm
                     focus:border-[#007979]
                     focus:outline-none
                     focus:ring-2
                     focus:ring-[#007979]/20"
            />

            <p
              class="mt-2 text-xs
                     text-gray-500"
            >
              You can also enter "Remote".
            </p>
          </section>
        } @else {
          <!-- STEP 3 -->
          <section class="mt-8">
            <div
              class="flex h-12 w-12
                     items-center justify-center
                     rounded-xl
                     bg-[#007979]/10
                     text-2xl"
            >
              ⭐
            </div>

            <h1
              class="mt-5 text-3xl
                     font-bold tracking-tight
                     text-[#032D42]
                     sm:text-4xl"
            >
              What matters most to you?
            </h1>

            <p
              class="mt-3 text-sm
                     leading-6 text-gray-600
                     sm:text-base"
            >
              Choose the type of opportunity you'd prefer.
            </p>

            <div class="mt-8 grid grid-cols-2 gap-3">
              @for (option of preferences; track option.value) {
                <button
                  type="button"
                  (click)="selectPreference(option.value)"
                  [class.border-[#007979]]="selectedPreference() === option.value"
                  [class.bg-[#007979]/10]="selectedPreference() === option.value"
                  [class.ring-2]="selectedPreference() === option.value"
                  [class.ring-[#007979]/20]="selectedPreference() === option.value"
                  class="flex items-center
             justify-between
             rounded-xl
             border-2
             border-gray-200
             bg-white
             px-4 py-4
             text-left
             text-sm font-medium
             text-gray-700
             transition
             hover:border-[#007979]
             hover:bg-[#007979]/5"
                >
                  <span>
                    {{ option.label }}
                  </span>

                  @if (selectedPreference() === option.value) {
                    <span
                      class="ml-2 flex h-5 w-5
                 shrink-0 items-center
                 justify-center
                 rounded-full
                 bg-[#007979]
                 text-xs font-bold
                 text-white"
                      aria-label="Selected"
                    >
                      ✓
                    </span>
                  }
                </button>
              }
            </div>
          </section>
        }

        <!-- Navigation -->
        <div class="mt-8 flex gap-3">
          @if (step() > 1) {
            <button
              type="button"
              (click)="previousStep()"
              class="flex-1
                     rounded-xl
                     border border-gray-300
                     bg-white
                     px-5 py-3.5
                     text-sm font-semibold
                     text-gray-700
                     transition
                     hover:bg-gray-50"
            >
              Back
            </button>
          }

          <button
            type="button"
            (click)="nextStep()"
            [disabled]="!canContinue()"
            class="flex-1
                   rounded-xl
                   bg-[#007979]
                   px-5 py-3.5
                   text-sm font-semibold
                   text-white
                   shadow-sm
                   transition
                   hover:bg-[#006666]
                   disabled:cursor-not-allowed
                   disabled:opacity-50"
          >
            @if (step() < 3) {
              Continue →
            } @else {
              Find Jobs →
            }
          </button>
        </div>

        <p
          class="mt-4 text-center
                 text-xs text-gray-500"
        >
          Free to use · No account required
        </p>
      </div>
    </main>
  `,
})
export class JobFinderComponent {
  private readonly router = inject(Router);

  private readonly jobStore = inject(JobStore);

  protected readonly step = signal(1);

  protected readonly selectedJobType = signal('');

  protected readonly selectedPreference = signal('');

  protected location = '';

  protected readonly jobTypes = [
    {
      value: 'technology',
      label: 'Technology & IT',
      description: 'Software, IT support, cybersecurity, cloud and more.',
    },
    {
      value: 'healthcare',
      label: 'Healthcare',
      description: 'Healthcare, medical support and related roles.',
    },
    {
      value: 'business',
      label: 'Business & Finance',
      description: 'Business, finance, sales and professional services.',
    },
    {
      value: 'skilled-trades',
      label: 'Skilled Trades',
      description: 'Construction, electrical, maintenance and trades.',
    },
    {
      value: 'administrative',
      label: 'Administrative',
      description: 'Office, administrative and support positions.',
    },
    {
      value: 'customer-service',
      label: 'Customer Service',
      description: 'Customer support, call centers and service roles.',
    },
  ];

  protected readonly preferences = [
    {
      value: 'full-time',
      label: 'Full-time',
    },
    {
      value: 'part-time',
      label: 'Part-time',
    },
    {
      value: 'remote',
      label: 'Remote',
    },
    {
      value: 'any',
      label: 'Any opportunity',
    },
  ];

  protected selectJobType(value: string): void {
    this.selectedJobType.set(value);
  }

  protected selectPreference(value: string): void {
    this.selectedPreference.set(value);
  }

  protected canContinue(): boolean {
    if (this.step() === 1) {
      return !!this.selectedJobType();
    }

    if (this.step() === 2) {
      return this.location.trim().length > 0;
    }

    return !!this.selectedPreference();
  }

  protected async nextStep(): Promise<void> {
  if (!this.canContinue()) {
    return;
  }

  if (this.step() < 3) {
    this.step.update((value) => value + 1);
    return;
  }

  /*
   * Transfer the Finder criteria into the Job Store.
   */

  this.jobStore.setCategory(
    this.selectedJobType(),
  );

  this.jobStore.setLocation(
    this.location.trim(),
  );

  /*
   * Clear the previous preference filters first.
   *
   * This prevents a previous search from leaking
   * into a new search.
   */
  this.jobStore.setEmploymentType('');

  this.jobStore.setWorkArrangement('');

  switch (this.selectedPreference()) {

    case 'full-time':
      this.jobStore.setEmploymentType('full-time');
      break;

    case 'part-time':
      this.jobStore.setEmploymentType('part-time');
      break;

    case 'remote':
      this.jobStore.setWorkArrangement('remote');
      break;

    case 'any':
      break;
  }

  /*
   * Load active jobs through the Store.
   */
  await this.jobStore.loadActiveJobs();

  /*
   * Keep the search criteria in the URL so the
   * results page remains shareable/bookmarkable.
   */
  await this.router.navigate(
    ['/find/job/results'],
    {
      queryParams: {
        type: this.selectedJobType(),
        location: this.location.trim(),
        preference: this.selectedPreference(),
      },
    },
  );
}

  //   console.log('Job Finder criteria:', {
  //     jobType: this.selectedJobType(),
  //     location: this.location.trim(),
  //     preference: this.selectedPreference(),
  //   });
  // }

  protected previousStep(): void {
    if (this.step() > 1) {
      this.step.update((value) => value - 1);
    }
  }

  protected goBack(): void {
    if (this.step() > 1) {
      this.previousStep();
      return;
    }

    window.history.back();
  }
}
