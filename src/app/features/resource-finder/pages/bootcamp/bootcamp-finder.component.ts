import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bootcamp-finder',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main
      class="min-h-[calc(100vh-4rem)]
             bg-gray-50
             px-4 py-10
             sm:px-6 sm:py-14
             lg:px-8"
    >
      <div class="mx-auto max-w-3xl">

        <!-- Top navigation -->
        <div class="flex items-center justify-between">
          <a
            routerLink="/find"
            class="text-sm font-medium
                   text-gray-600
                   hover:text-[#007979]"
          >
            ← Back
          </a>

          <a
            routerLink="/"
            class="rounded-lg
                   border border-gray-200
                   bg-white
                   px-3 py-2
                   text-sm font-medium
                   text-[#032D42]
                   shadow-sm
                   hover:border-[#007979]
                   hover:text-[#007979]"
          >
            Home
          </a>
        </div>

        <!-- Progress -->
        <div class="mt-8">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Find a Bootcamp
            </span>

            <span class="text-xs text-gray-500">
              Step 1 of 3
            </span>
          </div>

          <div
            class="mt-2 h-1.5
                   overflow-hidden
                   rounded-full
                   bg-gray-200"
          >
            <div
              class="h-full w-1/3
                     rounded-full
                     bg-[#007979]"
            ></div>
          </div>
        </div>

        <!-- Header -->
        <section class="mt-8">
          <div
            class="flex h-12 w-12
                   items-center justify-center
                   rounded-xl
                   bg-[#007979]/10
                   text-2xl"
          >
            🎓
          </div>

          <h1
            class="mt-5 text-3xl
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
            Choose a skill or career area you'd like
            to learn more about.
          </p>
        </section>

        <!-- Bootcamp categories -->
        <section class="mt-8">
          <div
            class="grid gap-3
                   sm:grid-cols-2"
          >
            @for (
              option of bootcampTypes;
              track option.value
            ) {
              <button
                type="button"
                (click)="
                  selectBootcampType(option.value)
                "
                [class.border-[#007979]]="
                  selectedBootcampType() === option.value
                "
                [class.bg-[#007979]/5]="
                  selectedBootcampType() === option.value
                "
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

                @if (
                  selectedBootcampType() === option.value
                ) {
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

        <!-- Learning preference -->
        <section class="mt-8">
          <p
            class="text-sm font-semibold
                   text-gray-900"
          >
            What matters most to you?
          </p>

          <div
            class="mt-3 grid
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
                [class.bg-[#007979]/5]="
                  selectedPreference() === option.value
                "
                class="rounded-xl
                       border border-gray-200
                       bg-white
                       px-3 py-3
                       text-sm font-medium
                       text-gray-700
                       transition
                       hover:border-[#007979]"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </section>

        <!-- Location -->
        <section class="mt-8">
          <label
            for="bootcampLocation"
            class="block text-sm
                   font-semibold
                   text-gray-900"
          >
            Where are you located?
          </label>

          <p
            class="mt-1 text-xs
                   text-gray-500"
          >
            This helps us prioritize programs near you.
          </p>

          <input
            id="bootcampLocation"
            name="bootcampLocation"
            type="text"
            [(ngModel)]="location"
            placeholder="e.g. Maryland"
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
        </section>

        <!-- Continue -->
        <button
          type="button"
          [disabled]="!selectedBootcampType()"
          class="mt-8 flex w-full
                 items-center
                 justify-center
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
          Find Bootcamps →
        </button>

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
export class BootcampFinderComponent {

  protected readonly selectedBootcampType =
    signal('');

  protected readonly selectedPreference =
    signal('');

  protected location = '';

  protected readonly bootcampTypes = [
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
      value: 'cloud',
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
        'Healthcare careers and practical training programs.',
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
  ];

  protected selectBootcampType(
    value: string,
  ): void {
    this.selectedBootcampType.set(value);
  }

  protected selectPreference(
    value: string,
  ): void {
    this.selectedPreference.set(value);
  }
}
