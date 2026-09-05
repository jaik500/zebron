import { Component, DOCUMENT, inject } from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,

  imports: [RouterLink, MatIconModule],

  template: `
    <!-- =========================================================
         HERO
         ========================================================= -->

    <main>
      <section
        class="relative overflow-hidden
               bg-[#032D42]"
      >
        <!-- Decorative background -->

        <div
          aria-hidden="true"
          class="absolute -right-24 -top-24
                 h-72 w-72 rounded-full
                 border-[40px]
                 border-[#007979]/20"
        ></div>

        <div
          aria-hidden="true"
          class="absolute -bottom-32 -left-24
                 h-80 w-80 rounded-full
                 border-[50px]
                 border-[#007979]/10"
        ></div>

        <div
          class="relative mx-auto max-w-7xl
                 px-5 py-20
                 sm:px-6 sm:py-24
                 lg:px-8 lg:py-20"
        >
          <div class="max-w-3xl">
           
      <div class="max-w-5xl">

        <!-- =================================================
             ZEBRON WORDMARK

             The mirrored lowercase "e" is the visual brand
             treatment. aria-label preserves accessibility.
             ================================================= -->

        <div
          aria-label="Zebron"
          class="flex items-center
                 text-7xl
                 font-black
                 leading-none
                 text-white
                 sm:text-8xl
                 lg:text-[10rem]"
        >

          <span>Z</span>

          <span
            aria-hidden="true"
            class="mx-[-0.01em] inline-block
                   text-[#12BFC3]"
            style="transform: scaleX(-1);"
          >
            e
          </span>

          <span>bron</span>

        </div>


        <!-- =================================================
             HERO HEADLINE
             ================================================= -->

        <h1
          class="mt-5
                 max-w-4xl
                 text-3xl
                 font-extrabold
                 leading-[1.08]
                 tracking-tight
                 text-white
                 sm:text-4xl
                 lg:text-5xl"
        >
          Everything you need to discover,
          explore, and move forward.
        </h1>


        <!-- =================================================
             HERO DESCRIPTION
             ================================================= -->

        <p
          class="mt-6
                 max-w-3xl
                 text-lg
                 leading-8
                 text-white/80
                 sm:text-xl"
        >
          Connect with resources, organizations,
          services, opportunities, information,
          and more—all in one place.
        </p>


        <!-- =================================================
             HERO ACTIONS
             ================================================= -->

      </div>

            <!-- Primary actions -->

            <div
              class="mt-9 flex flex-col gap-3
         sm:flex-row"
            >
              <a
                routerLink="/resources"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           bg-[#007979]
           px-6 py-3.5
           text-sm font-bold
           text-white
           shadow-lg shadow-black/10
           transition
           hover:bg-[#008989]"
              >
                Explore Resources

                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">
                  arrow_forward
                </mat-icon>
              </a>

              <a
                routerLink="/find"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           border border-white/25
           bg-white/5
           px-6 py-3.5
           text-sm font-bold
           text-white
           transition
           hover:bg-white/10"
              >
                Find Opportunities
              </a>

              <a
                routerLink="/donate"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           border border-[#65CFCF]/50
           bg-[#65CFCF]/10
           px-6 py-3.5
           text-sm font-bold
           text-[#B9F0ED]
           transition
           hover:bg-[#65CFCF]/20"
              >
                Donate
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           EXPLORE ZEBRON
           ======================================================= -->

      <section class="bg-white">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-20
                 lg:px-8"
        >
          <div class="max-w-2xl">
            <p
              class="text-sm font-bold uppercase
                     tracking-wider
                     text-[#007979]"
            >
              Explore Zebron
            </p>

            <h2
              class="mt-2 text-3xl font-bold
                     tracking-tight
                     text-[#032D42]"
            >
              One platform, multiple ways to move forward.
            </h2>

            <p
              class="mt-4 text-sm leading-6
                     text-gray-600
                     sm:text-base"
            >
              Start with what you need and explore the opportunities that connect to it.
            </p>
          </div>

          <div
            class="mt-10 grid gap-5
                   md:grid-cols-3"
          >
            <!-- Resources -->

            <a
              routerLink="/resources"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div
                class="flex h-12 w-12
                       items-center justify-center
                       rounded-xl
                       bg-[#E5F4F4]"
              >
                <mat-icon aria-hidden="true" class="!text-[#007979]"> explore </mat-icon>
              </div>

              <h3
                class="mt-6 text-xl font-bold
                       text-[#032D42]"
              >
                Resources
              </h3>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-600"
              >
                Discover services, programs, organizations, and resources that can help you reach
                your next goal.
              </p>

              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                Explore Resources

                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>

            <!-- Jobs -->

            <a
              routerLink="/find"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div
                class="flex h-12 w-12
                       items-center justify-center
                       rounded-xl
                       bg-[#E5F4F4]"
              >
                <mat-icon aria-hidden="true" class="!text-[#007979]"> work_outline </mat-icon>
              </div>

              <h3
                class="mt-6 text-xl font-bold
                       text-[#032D42]"
              >
                Jobs
              </h3>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-600"
              >
                Find employment opportunities and discover organizations looking for people with
                your skills.
              </p>

              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                Find Jobs

                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>

            <!-- Training -->

            <a
              routerLink="/find"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div
                class="flex h-12 w-12
                       items-center justify-center
                       rounded-xl
                       bg-[#E5F4F4]"
              >
                <mat-icon aria-hidden="true" class="!text-[#007979] bg-[#E5F4F4]"> school </mat-icon>
              </div>

              <h3
                class="mt-6 text-xl font-bold
                       text-[#032D42]"
              >
                Training
              </h3>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-600"
              >
                Explore bootcamps, courses, educational programs, and other opportunities to build
                your skills.
              </p>

              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                Explore Training

                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>

                <!-- Test Center -->

            <a
              routerLink="/test-center"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div
                class="flex h-12 w-12
                       items-center justify-center
                       rounded-xl
                       bg-[#E5F4F4]"
              >
                <mat-icon aria-hidden="true" class="!text-[#007979] bg-[#E5F4F4]"> quiz </mat-icon>
              </div>

              <h3
                class="mt-6 text-xl font-bold
                       text-[#032D42]"
              >
                Test Center
              </h3>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-600"
              >
                Challenge yourself today, and build the competitive edge you need to stand out tomorrow.
              </p>

              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                Explore Training

                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
          </div>
        </div>
      </section>

      <!-- =======================================================
           HOW IT WORKS
           ======================================================= -->

      <section class="bg-gray-50">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-20
                 lg:px-8"
        >
          <div class="text-center">
            <p
              class="text-sm font-bold uppercase
                     tracking-wider
                     text-[#007979]"
            >
              How Zebron works
            </p>

            <h2
              class="mt-2 text-3xl font-bold
                     tracking-tight
                     text-[#032D42]"
            >
              From discovery to opportunity.
            </h2>
          </div>

          <div
            class="mt-12 grid gap-8
                   md:grid-cols-3"
          >
            <!-- Step 1 -->

            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#032D42]
                       text-lg font-bold
                       text-white"
              >
                1
              </div>

              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                Discover
              </h3>

              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                Search for resources, organizations, jobs, and training that match your needs.
              </p>
            </div>

            <!-- Step 2 -->

            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#032D42]
                       text-lg font-bold
                       text-white"
              >
                2
              </div>

              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                Explore
              </h3>

              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                Learn more about the organizations, services, programs, and opportunities you
                discover.
              </p>
            </div>

            <!-- Step 3 -->

            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#007979]
                       text-lg font-bold
                       text-white"
              >
                3
              </div>

              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                Connect
              </h3>

              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                Take the next step by connecting directly with the organization or opportunity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           FEATURED / VALUE SECTION
           ======================================================= -->

      <section class="bg-white">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-20
                 lg:px-8"
        >
          <div
            class="grid items-center gap-10
                   lg:grid-cols-2"
          >
            <div>
              <p
                class="text-sm font-bold uppercase
                       tracking-wider
                       text-[#007979]"
              >
                Built for discovery
              </p>

              <h2
                class="mt-2 text-3xl font-bold
                       tracking-tight
                       text-[#032D42]
                       sm:text-4xl"
              >
                Spend less time searching. Spend more time moving forward.
              </h2>

              <p
                class="mt-5 text-sm leading-7
                       text-gray-600
                       sm:text-base"
              >
                Zebron brings useful information together so you can spend less time searching
                across disconnected websites and more time exploring options that fit your goals.
              </p>

              <div class="mt-7">
                <a
                  routerLink="/resources"
                  class="inline-flex items-center
                         gap-2 text-sm font-bold
                         text-[#007979]
                         hover:underline"
                >
                  Start exploring

                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-5 !w-5
                           !text-[18px]"
                  >
                    arrow_forward
                  </mat-icon>
                </a>
              </div>
            </div>

            <!-- Visual -->

            <div
              class="relative min-h-[280px]
                     overflow-hidden rounded-2xl
                     bg-[#032D42] p-7"
            >
              <div
                aria-hidden="true"
                class="absolute -right-16 -top-16
                       h-48 w-48 rounded-full
                       border-[28px]
                       border-[#007979]/30"
              ></div>

              <div class="relative grid gap-3">
                <div
                  class="rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> explore </mat-icon>
                    </div>

                    <div>
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        Discover
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        Resources & Services
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="ml-8 rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> school </mat-icon>
                    </div>

                    <div>
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        Explore
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        Training & Education
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="ml-16 rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> work_outline </mat-icon>
                    </div>

                    <div>
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        Connect
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        Jobs & Opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           ORGANIZATION CTA
           ======================================================= -->

      <section class="bg-[#E5F4F4]">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-14
                 sm:px-6
                 lg:px-8"
        >
          <div
            class="flex flex-col gap-6
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >
            <div class="max-w-2xl">
              <p
                class="text-sm font-bold uppercase
                       tracking-wider
                       text-[#007979]"
              >
                For organizations
              </p>

              <h2
                class="mt-2 text-2xl font-bold
                       tracking-tight
                       text-[#032D42]"
              >
                Share what your organization provides.
              </h2>

              <p
                class="mt-3 text-sm leading-6
                       text-gray-600"
              >
                Help people discover your resources, programs, services, and opportunities through
                Zebron.
              </p>
            </div>

            <a
              routerLink="/submit"
              class="inline-flex shrink-0
                     items-center justify-center
                     gap-2 rounded-lg
                     bg-[#007979]
                     px-5 py-3
                     text-sm font-bold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]"
            >
              Add a Resource

              <mat-icon
                aria-hidden="true"
                class="!m-0 !h-5 !w-5
                       !text-[18px]"
              >
                arrow_forward
              </mat-icon>
            </a>

            <!-- =======================================================
     SUPPORT ZEBRON
     ======================================================= -->

<section class="bg-[#032D42]">

  <div
    class="mx-auto max-w-7xl
           px-5 py-14
           sm:px-6 sm:py-16
           lg:px-8"
  >

    <div
      class="flex flex-col gap-7
             md:flex-row
             md:items-center
             md:justify-between"
    >

      <div class="max-w-2xl">

        <p
          class="text-sm font-bold uppercase
                 tracking-wider
                 text-[#65CFCF]"
        >
          Support Zebron
        </p>

        <h2
          class="mt-2 text-2xl font-bold
                 tracking-tight
                 text-white
                 sm:text-3xl"
        >
          Help make resources easier to find.
        </h2>

        <p
          class="mt-3 text-sm leading-6
                 text-white/70
                 sm:text-base"
        >
          Your support helps Zebron connect people
          with trusted resources, organizations,
          services, and opportunities.
        </p>

      </div>

      <a
        routerLink="/donate"
        class="inline-flex shrink-0
               items-center justify-center
               gap-2 rounded-lg
               bg-[#007979]
               px-6 py-3
               text-sm font-bold
               text-white
               shadow-sm
               transition
               hover:bg-[#008989]"
      >

        Support Zebron

        <mat-icon
          aria-hidden="true"
          class="!m-0 !h-5 !w-5
                 !text-[18px]"
        >
          favorite
        </mat-icon>

      </a>

    </div>

  </div>

</section>
          </div>
        </div>
      </section>
    </main>
  `,

  styles: [],
})
export class HomeComponent {
  // =========================================================
  // SEO SERVICES
  // =========================================================

  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly document = inject(DOCUMENT);

  constructor() {
    this.updateSeoMetadata();
  }

  // =========================================================
  // SEO METADATA
  // =========================================================

  private updateSeoMetadata(): void {
    const pageTitle = 'Zebron | Discover Resources, Jobs & Opportunities';

    const description =
      'Zebron helps you discover resources, organizations, jobs, training, and opportunities in one place. Explore what is available and find your next opportunity.';

    const canonicalUrl = 'https://zebron.org/';

    this.title.setTitle(pageTitle);

    this.meta.updateTag({
      name: 'description',
      content: description,
    });

    // Open Graph

    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Zebron',
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
    });

    this.meta.updateTag({
      property: 'og:title',
      content: pageTitle,
    });

    this.meta.updateTag({
      property: 'og:description',
      content: description,
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });

    // Twitter

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary',
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: pageTitle,
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: description,
    });

    this.setCanonical(canonicalUrl);
  }

  // =========================================================
  // CANONICAL URL
  // =========================================================

  private setCanonical(url: string): void {
    const existing = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (existing) {
      existing.setAttribute('href', url);

      return;
    }

    const link = this.document.createElement('link');

    link.setAttribute('rel', 'canonical');

    link.setAttribute('href', url);

    this.document.head.appendChild(link);
  }
}
