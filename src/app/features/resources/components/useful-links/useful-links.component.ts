import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface UsefulLink {
  title: string;
  description: string;
  route?: string;
  url?: string;
  external?: boolean;
}

@Component({
  selector: 'app-useful-links',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside class="space-y-6">

      <!-- =====================================================
           Useful Links
           ===================================================== -->
      <section
        class="rounded-2xl border border-gray-200
               bg-white p-5 shadow-sm"
      >
        <div class="mb-4">
          <h2
            class="text-lg font-bold text-[#032D42]"
          >
            Useful Links
          </h2>

          <p
            class="mt-1 text-sm text-gray-500"
          >
            Explore helpful categories and services.
          </p>
        </div>

        <div class="space-y-2">

          @for (
            link of usefulLinks;
            track link.title
          ) {

            @if (link.route) {

              <a
                [routerLink]="link.route"
                class="group block rounded-xl
                       border border-gray-100
                       p-3 transition
                       hover:border-[#007979]/30
                       hover:bg-[#007979]/5"
              >
                <div
                  class="flex items-center
                         justify-between gap-3"
                >
                  <div>
                    <h3
                      class="text-sm font-semibold
                             text-[#032D42]
                             group-hover:text-[#007979]"
                    >
                      {{ link.title }}
                    </h3>

                    <p
                      class="mt-1 text-xs
                             text-gray-500"
                    >
                      {{ link.description }}
                    </p>
                  </div>

                  <span
                    class="text-gray-400
                           transition
                           group-hover:translate-x-1
                           group-hover:text-[#007979]"
                  >
                    →
                  </span>
                </div>
              </a>

            } @else {

              <a
                [href]="link.url"
                [target]="
                  link.external
                    ? '_blank'
                    : '_self'
                "
                [rel]="
                  link.external
                    ? 'noopener noreferrer'
                    : null
                "
                class="group block rounded-xl
                       border border-gray-100
                       p-3 transition
                       hover:border-[#007979]/30
                       hover:bg-[#007979]/5"
              >
                <div
                  class="flex items-center
                         justify-between gap-3"
                >
                  <div>
                    <h3
                      class="text-sm font-semibold
                             text-[#032D42]
                             group-hover:text-[#007979]"
                    >
                      {{ link.title }}
                    </h3>

                    <p
                      class="mt-1 text-xs
                             text-gray-500"
                    >
                      {{ link.description }}
                    </p>
                  </div>

                  <span
                    class="text-gray-400
                           transition
                           group-hover:translate-x-1
                           group-hover:text-[#007979]"
                  >
                    ↗
                  </span>
                </div>
              </a>

            }

          }

        </div>
      </section>


      <!-- =====================================================
           Catalogs
           ===================================================== -->
      <section
        class="rounded-2xl border border-gray-200
               bg-white p-5 shadow-sm"
      >
        <div class="mb-4">
          <h2
            class="text-lg font-bold text-[#032D42]"
          >
            Resource Catalogs
          </h2>

          <p
            class="mt-1 text-sm text-gray-500"
          >
            Browse additional directories and catalogs.
          </p>
        </div>

        <div class="space-y-2">

          @for (
            catalog of catalogs;
            track catalog.title
          ) {

            <a
              [href]="catalog.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center
                     justify-between gap-3
                     rounded-xl border
                     border-gray-100 p-3
                     transition
                     hover:border-[#007979]/30
                     hover:bg-[#007979]/5"
            >

              <div>
                <h3
                  class="text-sm font-semibold
                         text-[#032D42]
                         group-hover:text-[#007979]"
                >
                  {{ catalog.title }}
                </h3>

                <p
                  class="mt-1 text-xs
                         text-gray-500"
                >
                  {{ catalog.description }}
                </p>
              </div>

              <span
                class="shrink-0 text-gray-400
                       transition
                       group-hover:translate-x-1
                       group-hover:text-[#007979]"
              >
                ↗
              </span>

            </a>

          }

        </div>
      </section>


      <!-- =====================================================
           Submit Resource CTA
           ===================================================== -->
      <section
        class="rounded-2xl bg-[#032D42]
               p-5 text-white shadow-sm"
      >

        <h2
          class="text-lg font-bold"
        >
          Know a helpful resource?
        </h2>

        <p
          class="mt-2 text-sm leading-6
                 text-white/80"
        >
          Help grow the Zebron directory by
          submitting a resource for review.
        </p>

        <a
          routerLink="/submit"
          class="mt-4 block rounded-lg
                 bg-white px-4 py-2.5
                 text-center text-sm
                 font-semibold text-[#032D42]
                 transition hover:bg-gray-100"
        >
          Submit a Resource
        </a>

      </section>

    </aside>
  `,
})
export class UsefulLinksComponent {

  /**
   * Internal Zebron links.
   *
   * These can later become admin-managed
   * records instead of hard-coded values.
   */
  protected readonly usefulLinks: UsefulLink[] = [
    {
      title: 'Education & Training',
      description:
        'Find schools, training programs, and educational resources.',
      route: '/resources?category=education',
    },
    {
      title: 'Jobs & Careers',
      description:
        'Explore employment and career resources.',
      route: '/resources?category=jobs',
    },
    {
      title: 'Housing',
      description:
        'Find housing and related assistance.',
      route: '/resources?category=housing',
    },
    {
      title: 'Government Services',
      description:
        'Find government programs and services.',
      route: '/resources?category=government',
    },
    {
      title: 'Community Services',
      description:
        'Connect with community organizations and programs.',
      route: '/resources?category=community',
    },
  ];


  /**
   * External resource catalogs.
   *
   * Placeholder entries are intentionally kept
   * generic until we decide which catalogs Zebron
   * should officially recommend.
   */
  protected readonly catalogs: UsefulLink[] = [
    {
      title: 'Community Resource Directory',
      description:
        'External community resource directory.',
      url: '#',
      external: true,
    },
    {
      title: 'Government Resource Directory',
      description:
        'Government programs and services directory.',
      url: '#',
      external: true,
    },
  ];
}