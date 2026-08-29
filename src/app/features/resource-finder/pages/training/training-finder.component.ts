import { Component, inject, signal,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-training-finder',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main
      class="min-h-screen bg-gray-50">
     

        <!-- Header -->
<header class="border-b border-gray-200 bg-[#032D42]">
  <div
    class="mx-auto flex max-w-7xl items-center
           justify-between gap-4
           px-4 py-4
           sm:px-6
           lg:px-8"
  >
    <!-- Title and description -->
    <div class="min-w-0">
      <p
        class="text-xs font-semibold
               uppercase tracking-wider
               text-[#7ED6D1]"
      >
        Zebron Resource Finder
      </p>

      <h1
        class="text-xl font-bold text-white
               sm:text-3xl"
      >
        Find Training
      </h1>

      <p
        class="mt-1 text-sm text-white/80"
      >
        Discover bootcamps, courses, certifications,
        and job-ready training programs.
      </p>
    </div>

    <!-- Resources -->
    <a
      routerLink="/resources"
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
          <div
            class="flex items-center
                   justify-between"
          >
            <span
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Find Training
            </span>

            <span class="text-xs text-gray-500">
              Step {{ step() }} of 3
            </span>
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
              [style.width.%]="
                (step() / 3) * 100
              "
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
              What do you want to learn?
            </h1>

            <p
              class="mt-3 text-sm
                     leading-6 text-gray-600
                     sm:text-base"
            >
              Choose a skill or career area you'd
              like to learn more about.
            </p>

            <div
              class="mt-4 grid gap-2
                     sm:grid-cols-2"
            >
              @for (
                option of trainingTypes;
                track option.value
              ) {
                <button
                  type="button"
                  (click)="
                    selectTrainingType(option.value)
                  "
                  [class.border-[#007979]]="
                    selectedTrainingType() === option.value
                  "
                  [class.bg-[#007979]/10]="
                    selectedTrainingType() === option.value
                  "
                  [class.ring-2]="
                    selectedTrainingType() === option.value
                  "
                  [class.ring-[#007979]/20]="
                    selectedTrainingType() === option.value
                  "
                  class="flex items-center
                         justify-between
                         rounded-xl
                         border-2
                         border-gray-200
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
                             leading-5
                             text-gray-500"
                    >
                      {{ option.description }}
                    </span>
                  </span>

                  @if (
                    selectedTrainingType() === option.value
                  ) {
                    <span
                      class="ml-3 flex h-5 w-5
                             shrink-0
                             items-center
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
              Choose the option that best matches
              what you're looking for.
            </p>

            <div
              class="mt-8 grid
                     grid-cols-2 gap-3"
            >
              @for (
                option of preferences;
                track option.value
              ) {
                <button
                  type="button"
                  (click)="
                    selectPreference(option.value)
                  "
                  [class.border-[#007979]]="
                    selectedPreference() === option.value
                  "
                  [class.bg-[#007979]/10]="
                    selectedPreference() === option.value
                  "
                  [class.ring-2]="
                    selectedPreference() === option.value
                  "
                  [class.ring-[#007979]/20]="
                    selectedPreference() === option.value
                  "
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

                  @if (
                    selectedPreference() === option.value
                  ) {
                    <span
                      class="ml-2 flex h-5 w-5
                             shrink-0
                             items-center
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
              📍
            </div>

            <h1
              class="mt-5 text-3xl
                     font-bold tracking-tight
                     text-[#032D42]
                     sm:text-4xl"
            >
              Where are you located?
            </h1>

            <p
              class="mt-3 text-sm
                     leading-6 text-gray-600
                     sm:text-base"
            >
              This helps us prioritize training
              programs near you. Online programs are
              included when available.
            </p>

            <label
              for="trainingLocation"
              class="mt-8 block text-sm
                     font-semibold
                     text-gray-900"
            >
              Location
            </label>

            <input
              id="trainingLocation"
              name="trainingLocation"
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
              You can enter a city, state, or ZIP code.
            </p>
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
              Find Training →
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
export class TrainingFinderComponent {

  private readonly router = inject(Router);

  protected readonly step =
    signal(1);

  protected readonly selectedTrainingType =
    signal('');

  protected readonly selectedPreference =
    signal('');

  protected location = '';

  protected readonly trainingTypes = [
    {
      value: 'software-development',
      label: 'Software Development',
      description:
        'Web development, programming and software engineering.',
    },
    {
      value: 'cybersecurity',
      label: 'Cybersecurity',
      description:
        'Security, networking, compliance and cyber defense.',
    },
    {
      value: 'data-analytics',
      label: 'Data & Analytics',
      description:
        'Data analysis, visualization and business intelligence.',
    },
    {
      value: 'cloud-it',
      label: 'Cloud & IT',
      description:
        'Cloud computing, IT infrastructure and support.',
    },
    {
      value: 'digital-marketing',
      label: 'Digital Marketing',
      description:
        'Marketing, social media, SEO and digital strategy.',
    },
    {
      value: 'project-management',
      label: 'Project Management',
      description:
        'Project coordination, agile and management skills.',
    },
    {
      value: 'healthcare',
      label: 'Healthcare',
      description:
        'Healthcare careers and practical training.',
    },
    {
      value: 'skilled-trades',
      label: 'Skilled Trades',
      description:
        'Hands-on training for in-demand trade careers.',
    },
  ];

  protected readonly preferences = [
    {
      value: 'free',
      label: '🆓 Free',
    },
    {
      value: 'low-cost',
      label: '💰 Low cost',
    },
    {
      value: 'online',
      label: '🌐 Online',
    },
    {
      value: 'in-person',
      label: '📍 In person',
    },
    {
      value: 'job-placement',
      label: '💼 Job placement',
    },
    {
      value: 'short-program',
      label: '⏱️ Short program',
    },
  ];

  protected selectTrainingType(
    value: string,
  ): void {
    this.selectedTrainingType.set(value);
  }

  protected selectPreference(
    value: string,
  ): void {
    this.selectedPreference.set(value);
  }

  protected canContinue(): boolean {
    if (this.step() === 1) {
      return !!this.selectedTrainingType();
    }

    if (this.step() === 2) {
      return !!this.selectedPreference();
    }

    return this.location.trim().length > 0;
  }

 protected nextStep(): void {
  if (!this.canContinue()) {
    return;
  }

  if (this.step() < 3) {
    this.step.update(
      (value) => value + 1,
    );

    return;
  }

  this.router.navigate(
    ['/find/training/results'],
    {
      queryParams: {
        type: this.selectedTrainingType(),
        preference: this.selectedPreference(),
        location: this.location.trim(),
      },
    },
  );
}

  protected previousStep(): void {
    if (this.step() > 1) {
      this.step.update(
        (value) => value - 1,
      );
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


