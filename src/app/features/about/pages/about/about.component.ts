import {
  Component,
  DOCUMENT,
  inject,
} from '@angular/core';

import {
  Meta,
  Title,
} from '@angular/platform-browser';

import {
  RouterLink,
} from '@angular/router';

import {
  MatIconModule,
} from '@angular/material/icon';


@Component({
  selector: 'app-about',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
  ],

  template: `

    <!-- =========================================================
         ZEBRON HEADER
         ========================================================= -->

    <header
      class="border-b
             border-gray-200
             bg-white"
    >
      <div
        class="mx-auto
               flex
               max-w-7xl
               items-center
               justify-between
               px-5
               py-3
               sm:px-6
               lg:px-8"
      >

        <!-- Logo -->

        <a
          routerLink="/"
          class="flex
                 items-center
                 gap-2
                 text-[#032D42]"
          aria-label="Zebron home"
        >

          <img
            src="/zebron-favicon.svg"
            alt=""
            class="h-8
                   w-8"
          />

          <span
            class="text-xl
                   font-bold
                   tracking-tight"
          >
            Zebron
          </span>

        </a>


        <!-- Navigation -->

        <nav
          class="hidden
                 items-center
                 gap-7
                 md:flex"
          aria-label="Primary navigation"
        >

          <a
            routerLink="/resources"
            class="text-sm
                   font-medium
                   text-[#032D42]
                   transition
                   hover:text-[#007979]"
          >
            Resources
          </a>

          <a
            routerLink="/find/job"
            class="text-sm
                   font-medium
                   text-[#032D42]
                   transition
                   hover:text-[#007979]"
          >
            Find Jobs
          </a>

          <a
            routerLink="/about"
            aria-current="page"
            class="text-sm
                   font-semibold
                   text-[#007979]"
          >
            About
          </a>

          <a
            routerLink="/contact"
            class="text-sm
                   font-medium
                   text-[#032D42]
                   transition
                   hover:text-[#007979]"
          >
            Contact
          </a>

          <a
            routerLink="/submit"
            class="rounded-lg
                   bg-[#007979]
                   px-4
                   py-2
                   text-sm
                   font-semibold
                   text-white
                   shadow-sm
                   transition
                   hover:bg-[#006666]"
          >
            Add Resource
          </a>

        </nav>

      </div>
    </header>


    <!-- =========================================================
         MAIN
         ========================================================= -->

    <main>


      <!-- =======================================================
           HERO
           ======================================================= -->

      <section
        class="bg-[#032D42]"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 sm:py-20
                 lg:px-8
                 lg:py-24"
        >

          <div
            class="max-w-3xl"
          >

            <span
              class="inline-flex
                     items-center
                     rounded-full
                     border
                     border-white/20
                     bg-white/10
                     px-3
                     py-1
                     text-xs
                     font-semibold
                     uppercase
                     tracking-wide
                     text-white/90"
            >
              About Zebron
            </span>


            <h1
              class="mt-5
                     text-4xl
                     font-bold
                     tracking-tight
                     text-white
                     sm:text-5xl
                     lg:text-6xl"
            >
              Helping people find
              <span class="text-[#55C7C7]">
                opportunities
              </span>
              and resources.
            </h1>


            <p
              class="mt-6
                     max-w-2xl
                     text-base
                     leading-7
                     text-white/75
                     sm:text-lg
                     sm:leading-8"
            >
              Zebron is a resource and opportunity platform
              designed to make useful information easier to
              discover, understand, and access.
            </p>


            <div
              class="mt-8
                     flex
                     flex-wrap
                     gap-3"
            >

              <a
                routerLink="/resources"
                class="rounded-lg
                       bg-[#007979]
                       px-5
                       py-3
                       text-sm
                       font-semibold
                       text-white
                       shadow-sm
                       transition
                       hover:bg-[#006666]"
              >
                Explore resources
              </a>


              <a
                routerLink="/contact"
                class="rounded-lg
                       border
                       border-white/30
                       bg-white/5
                       px-5
                       py-3
                       text-sm
                       font-semibold
                       text-white
                       transition
                       hover:bg-white/10"
              >
                Get in touch
              </a>

            </div>

          </div>

        </div>

      </section>


      <!-- =======================================================
           WHAT IS ZEBRON
           ======================================================= -->

      <section
        class="bg-white"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="grid
                   gap-10
                   lg:grid-cols-2
                   lg:gap-16"
          >

            <!-- Left -->

            <div>

              <p
                class="text-sm
                       font-bold
                       uppercase
                       tracking-wider
                       text-[#007979]"
              >
                What is Zebron?
              </p>

              <h2
                class="mt-3
                       text-3xl
                       font-bold
                       tracking-tight
                       text-[#032D42]
                       sm:text-4xl"
              >
                One place to discover
                what can help you move forward.
              </h2>

            </div>


            <!-- Right -->

            <div
              class="space-y-5
                     text-sm
                     leading-7
                     text-gray-600
                     sm:text-base"
            >

              <p>
                Finding the right opportunity, service,
                organization, or source of information can
                be difficult when useful resources are spread
                across countless websites and organizations.
              </p>

              <p>
                Zebron brings those resources together into
                one searchable platform so people can spend
                less time looking for information and more
                time acting on it.
              </p>

              <p>
                The platform is built around discovery,
                accessibility, and practical usefulness —
                connecting people with resources that can
                support education, employment, community,
                business, settlement, and everyday needs.
              </p>

            </div>

          </div>

        </div>

      </section>


      <!-- =======================================================
           MISSION
           ======================================================= -->

      <section
        class="bg-gray-50"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="mx-auto
                   max-w-3xl
                   text-center"
          >

            <div
              class="mx-auto
                     flex
                     h-12
                     w-12
                     items-center
                     justify-center
                     rounded-full
                     bg-[#E5F4F4]"
            >

              <mat-icon
                aria-hidden="true"
                class="!text-[#007979]"
              >
                explore
              </mat-icon>

            </div>


            <p
              class="mt-5
                     text-sm
                     font-bold
                     uppercase
                     tracking-wider
                     text-[#007979]"
            >
              Our mission
            </p>


            <h2
              class="mt-3
                     text-3xl
                     font-bold
                     tracking-tight
                     text-[#032D42]
                     sm:text-4xl"
            >
              Make opportunity easier to find.
            </h2>


            <p
              class="mt-5
                     text-base
                     leading-7
                     text-gray-600
                     sm:text-lg
                     sm:leading-8"
            >
              Zebron's mission is to make trustworthy,
              relevant resources easier to discover and
              access — especially for people navigating
              unfamiliar systems, new communities, and
              new opportunities.
            </p>

          </div>

        </div>

      </section>


      <!-- =======================================================
           WHAT WE PROVIDE
           ======================================================= -->

      <section
        class="bg-white"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="max-w-2xl"
          >

            <p
              class="text-sm
                     font-bold
                     uppercase
                     tracking-wider
                     text-[#007979]"
            >
              What you'll find
            </p>

            <h2
              class="mt-3
                     text-3xl
                     font-bold
                     tracking-tight
                     text-[#032D42]"
            >
              Resources for real-world needs.
            </h2>

            <p
              class="mt-4
                     text-sm
                     leading-6
                     text-gray-600
                     sm:text-base"
            >
              Zebron is designed to grow into a broad
              ecosystem of resources and opportunities.
            </p>

          </div>


          <!-- Cards -->

          <div
            class="mt-10
                   grid
                   gap-4
                   sm:grid-cols-2
                   lg:grid-cols-4"
          >


            <!-- Resources -->

            <article
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     transition
                     hover:-translate-y-0.5
                     hover:shadow-md"
            >

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]"
              >

                <mat-icon
                  aria-hidden="true"
                  class="!text-[#007979]"
                >
                  library_books
                </mat-icon>

              </div>

              <h3
                class="mt-4
                       font-bold
                       text-[#032D42]"
              >
                Resources
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-gray-600"
              >
                Discover organizations, services,
                programs, tools, and useful information.
              </p>

            </article>


            <!-- Jobs -->

            <article
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     transition
                     hover:-translate-y-0.5
                     hover:shadow-md"
            >

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]"
              >

                <mat-icon
                  aria-hidden="true"
                  class="!text-[#007979]"
                >
                  work_outline
                </mat-icon>

              </div>

              <h3
                class="mt-4
                       font-bold
                       text-[#032D42]"
              >
                Jobs & Careers
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-gray-600"
              >
                Find employment opportunities and
                career-related resources.
              </p>

            </article>


            <!-- Education -->

            <article
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     transition
                     hover:-translate-y-0.5
                     hover:shadow-md"
            >

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]"
              >

                <mat-icon
                  aria-hidden="true"
                  class="!text-[#007979]"
                >
                  school
                </mat-icon>

              </div>

              <h3
                class="mt-4
                       font-bold
                       text-[#032D42]"
              >
                Education
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-gray-600"
              >
                Explore education, training, bootcamps,
                scholarships, and learning opportunities.
              </p>

            </article>


            <!-- Community -->

            <article
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     transition
                     hover:-translate-y-0.5
                     hover:shadow-md"
            >

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]"
              >

                <mat-icon
                  aria-hidden="true"
                  class="!text-[#007979]"
                >
                  groups
                </mat-icon>

              </div>

              <h3
                class="mt-4
                       font-bold
                       text-[#032D42]"
              >
                Community
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-gray-600"
              >
                Connect with community services,
                organizations, and opportunities.
              </p>

            </article>

          </div>

        </div>

      </section>


      <!-- =======================================================
           HOW ZEBRON WORKS
           ======================================================= -->

      <section
        class="bg-[#032D42]"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="max-w-2xl"
          >

            <p
              class="text-sm
                     font-bold
                     uppercase
                     tracking-wider
                     text-[#55C7C7]"
            >
              How it works
            </p>

            <h2
              class="mt-3
                     text-3xl
                     font-bold
                     tracking-tight
                     text-white
                     sm:text-4xl"
            >
              Simple discovery.
            </h2>

          </div>


          <div
            class="mt-10
                   grid
                   gap-6
                   md:grid-cols-3"
          >

            <!-- Step 1 -->

            <div>

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-full
                       bg-[#007979]
                       text-sm
                       font-bold
                       text-white"
              >
                1
              </div>

              <h3
                class="mt-4
                       text-lg
                       font-bold
                       text-white"
              >
                Search
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-white/70"
              >
                Search for resources and opportunities
                based on what you need.
              </p>

            </div>


            <!-- Step 2 -->

            <div>

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-full
                       bg-[#007979]
                       text-sm
                       font-bold
                       text-white"
              >
                2
              </div>

              <h3
                class="mt-4
                       text-lg
                       font-bold
                       text-white"
              >
                Explore
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-white/70"
              >
                Review organizations, services,
                programs, and opportunities.
              </p>

            </div>


            <!-- Step 3 -->

            <div>

              <div
                class="flex
                       h-10
                       w-10
                       items-center
                       justify-center
                       rounded-full
                       bg-[#007979]
                       text-sm
                       font-bold
                       text-white"
              >
                3
              </div>

              <h3
                class="mt-4
                       text-lg
                       font-bold
                       text-white"
              >
                Take action
              </h3>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-white/70"
              >
                Connect directly with the organization,
                service, or opportunity that can help.
              </p>

            </div>

          </div>

        </div>

      </section>


      <!-- =======================================================
           BUILT TO GROW
           ======================================================= -->

      <section
        class="bg-white"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="grid
                   gap-10
                   lg:grid-cols-2
                   lg:items-center"
          >

            <div>

              <p
                class="text-sm
                       font-bold
                       uppercase
                       tracking-wider
                       text-[#007979]"
              >
                Looking ahead
              </p>

              <h2
                class="mt-3
                       text-3xl
                       font-bold
                       tracking-tight
                       text-[#032D42]
                       sm:text-4xl"
              >
                More than a directory.
              </h2>

            </div>


            <div
              class="space-y-4
                     text-sm
                     leading-7
                     text-gray-600
                     sm:text-base"
            >

              <p>
                Zebron is being built as a platform that can
                grow with the needs of the communities it serves.
              </p>

              <p>
                Over time, the platform can support jobs,
                training, scholarships, community services,
                events, mentorship, business resources,
                immigration and settlement resources,
                organization profiles, and more.
              </p>

              <p>
                The goal is simple: create a dependable place
                where people can discover possibilities and
                take the next step.
              </p>

            </div>

          </div>

        </div>

      </section>


      <!-- =======================================================
           CALL TO ACTION
           ======================================================= -->

      <section
        class="bg-gray-50"
      >

        <div
          class="mx-auto
                 max-w-7xl
                 px-5
                 py-16
                 sm:px-6
                 lg:px-8
                 lg:py-20"
        >

          <div
            class="rounded-2xl
                   bg-[#007979]
                   px-6
                   py-10
                   text-center
                   sm:px-10
                   sm:py-12"
          >

            <h2
              class="text-2xl
                     font-bold
                     tracking-tight
                     text-white
                     sm:text-3xl"
            >
              Have a resource to share?
            </h2>

            <p
              class="mx-auto
                     mt-3
                     max-w-2xl
                     text-sm
                     leading-6
                     text-white/80
                     sm:text-base"
            >
              Help make useful opportunities easier to
              discover by adding a resource to Zebron.
            </p>

            <div
              class="mt-6"
            >

              <a
                routerLink="/submit"
                class="inline-flex
                       items-center
                       gap-2
                       rounded-lg
                       bg-white
                       px-5
                       py-3
                       text-sm
                       font-bold
                       text-[#032D42]
                       shadow-sm
                       transition
                       hover:bg-gray-100"
              >

                Add a resource

                <mat-icon
                  aria-hidden="true"
                  class="!m-0
                         !h-5
                         !w-5
                         !text-[18px]"
                >
                  arrow_forward
                </mat-icon>

              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  `,

  styles: [],
})
export class AboutComponent {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly title =
    inject(Title);

  private readonly meta =
    inject(Meta);

  private readonly document =
    inject(DOCUMENT);


  // =========================================================
  // INITIALIZATION
  // =========================================================

  constructor() {

    this.updateSeoMetadata();

  }


  // =========================================================
  // SEO
  // =========================================================

  private updateSeoMetadata(): void {

    const pageTitle =
      'About Zebron | Discover Resources & Opportunities';


    const description =
      'Learn about Zebron, a platform designed to make useful resources, services, organizations, and opportunities easier to discover and access.';


    const canonicalUrl =
      'https://zebron.org/about';


    // Page title.

    this.title.setTitle(
      pageTitle,
    );


    // Meta description.

    this.meta.updateTag({

      name:
        'description',

      content:
        description,

    });


    // Canonical URL.

    const existingCanonical =
      this.document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );


    if (existingCanonical) {

      existingCanonical.setAttribute(
        'href',
        canonicalUrl,
      );

    } else {

      const canonical =
        this.document.createElement(
          'link',
        );

      canonical.setAttribute(
        'rel',
        'canonical',
      );

      canonical.setAttribute(
        'href',
        canonicalUrl,
      );

      this.document.head.appendChild(
        canonical,
      );

    }


    // Open Graph.

    this.meta.updateTag({

      property:
        'og:title',

      content:
        pageTitle,

    });


    this.meta.updateTag({

      property:
        'og:description',

      content:
        description,

    });


    this.meta.updateTag({

      property:
        'og:type',

      content:
        'website',

    });


    this.meta.updateTag({

      property:
        'og:url',

      content:
        canonicalUrl,

    });


    // Twitter.

    this.meta.updateTag({

      name:
        'twitter:card',

      content:
        'summary',

    });


    this.meta.updateTag({

      name:
        'twitter:title',

      content:
        pageTitle,

    });


    this.meta.updateTag({

      name:
        'twitter:description',

      content:
        description,

    });

  }

}