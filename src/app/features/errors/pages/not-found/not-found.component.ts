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
  selector: 'app-not-found',

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
          aria-label="Zebron home"
          class="flex
                 items-center
                 gap-2
                 text-[#032D42]"
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
            routerLink="/find"
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
            class="text-sm
                   font-medium
                   text-[#032D42]
                   transition
                   hover:text-[#007979]"
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
         404 CONTENT
         ========================================================= -->

    <main
      class="flex
             min-h-[calc(100vh-65px)]
             items-center
             bg-gray-50"
    >

      <div
        class="mx-auto
               w-full
               max-w-3xl
               px-5
               py-16
               text-center
               sm:px-6
               sm:py-20
               lg:px-8"
      >

        <!-- 404 -->

        <div
          class="text-[7rem]
                 font-black
                 leading-none
                 tracking-tighter
                 text-[#032D42]
                 sm:text-[9rem]"
        >
          404
        </div>


        <!-- Accent -->

        <div
          class="mx-auto
                 mt-2
                 h-1
                 w-16
                 rounded-full
                 bg-[#007979]"
        ></div>


        <!-- Heading -->

        <h1
          class="mt-8
                 text-2xl
                 font-bold
                 tracking-tight
                 text-[#032D42]
                 sm:text-3xl"
        >
          We couldn't find that page.
        </h1>


        <!-- Description -->

        <p
          class="mx-auto
                 mt-4
                 max-w-xl
                 text-sm
                 leading-6
                 text-gray-600
                 sm:text-base
                 sm:leading-7"
        >
          The page you're looking for may have been moved,
          removed, or the address may be incorrect.
        </p>


        <!-- Actions -->

        <div
          class="mt-8
                 flex
                 flex-col
                 items-center
                 justify-center
                 gap-3
                 sm:flex-row"
        >

          <!-- Home -->

          <a
            routerLink="/"
            class="inline-flex
                   w-full
                   items-center
                   justify-center
                   gap-2
                   rounded-lg
                   bg-[#007979]
                   px-5
                   py-3
                   text-sm
                   font-semibold
                   text-white
                   shadow-sm
                   transition
                   hover:bg-[#006666]
                   sm:w-auto"
          >

            <mat-icon
              aria-hidden="true"
              class="!m-0
                     !h-5
                     !w-5
                     !text-[19px]"
            >
              home
            </mat-icon>

            Go to homepage

          </a>


          <!-- Resources -->

          <a
            routerLink="/resources"
            class="inline-flex
                   w-full
                   items-center
                   justify-center
                   gap-2
                   rounded-lg
                   border
                   border-gray-300
                   bg-white
                   px-5
                   py-3
                   text-sm
                   font-semibold
                   text-[#032D42]
                   transition
                   hover:border-[#007979]
                   hover:text-[#007979]
                   sm:w-auto"
          >

            <mat-icon
              aria-hidden="true"
              class="!m-0
                     !h-5
                     !w-5
                     !text-[19px]"
            >
              search
            </mat-icon>

            Explore resources

          </a>

        </div>


        <!-- Helpful links -->

        <div
          class="mx-auto
                 mt-12
                 max-w-lg
                 border-t
                 border-gray-200
                 pt-6"
        >

          <p
            class="text-xs
                   font-semibold
                   uppercase
                   tracking-wider
                   text-gray-400"
          >
            You might be looking for
          </p>


          <div
            class="mt-4
                   flex
                   flex-wrap
                   items-center
                   justify-center
                   gap-x-5
                   gap-y-2"
          >

            <a
              routerLink="/resources"
              class="text-sm
                     font-medium
                     text-[#007979]
                     hover:underline"
            >
              Resources
            </a>

            <a
              routerLink="/find"
              class="text-sm
                     font-medium
                     text-[#007979]
                     hover:underline"
            >
              Find Jobs
            </a>

            <a
              routerLink="/about"
              class="text-sm
                     font-medium
                     text-[#007979]
                     hover:underline"
            >
              About Zebron
            </a>

            <a
              routerLink="/contact"
              class="text-sm
                     font-medium
                     text-[#007979]
                     hover:underline"
            >
              Contact
            </a>

          </div>

        </div>

      </div>

    </main>
  `,

  styles: [],
})
export class NotFoundComponent {

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
      'Page Not Found | Zebron';

    const description =
      'The page you are looking for could not be found on Zebron. Explore resources, jobs, and opportunities instead.';

    const canonicalUrl =
      'https://zebron.org/404';


    this.title.setTitle(
      pageTitle,
    );


    this.meta.updateTag({
      name: 'description',
      content: description,
    });


    // =======================================================
    // Canonical
    // =======================================================

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


    // =======================================================
    // Open Graph
    // =======================================================

    this.meta.updateTag({
      property: 'og:title',
      content: pageTitle,
    });

    this.meta.updateTag({
      property: 'og:description',
      content: description,
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });


    // =======================================================
    // Twitter
    // =======================================================

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

  }

}