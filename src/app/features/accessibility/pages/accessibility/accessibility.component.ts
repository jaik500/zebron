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
  selector: 'app-accessibility',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
  ],

  template: `

     <header
  class="border-b
         border-white/10
         bg-[#032D42]"
>
  <div
    class="mx-auto
           flex
           max-w-7xl
           items-center
           justify-between
           px-5
           py-2
           sm:px-6
           lg:px-8"
  >

    <!-- Logo -->

    <a
      routerLink="/"
      class="flex
             items-center
             gap-2
             text-white"
      aria-label="Zebron home"
    >

      <img
        src="/zebron-favicon.svg"
        alt=""
        class="h-7
               w-7"
      />

      <span
        class="text-lg
               font-bold
               tracking-tight"
      >
        Zebron
      </span>

    </a>

    <!-- Desktop navigation -->

    <nav
      class="hidden
             items-center
             gap-6
             md:flex"
      aria-label="Primary navigation"
    >

      <a
        routerLink="/resources"
        class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
      >
        Resources
      </a>

      <a
        routerLink="/find"
        class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
      >
        Find Jobs
      </a>

      <a
        routerLink="/about"
        class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
      >
        About
      </a>

      <a
        routerLink="/contact"
        class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
      >
        Contact
      </a>

    </nav>

  </div>
</header>


    <main class="bg-gray-50">

      <div
        class="mx-auto max-w-4xl px-5 py-6
               sm:px-6 sm:py-6 lg:px-8"
      >

        <div
          class="rounded-2xl border border-gray-200 bg-white
                 p-6 shadow-sm sm:p-10"
        >

          <div
            class="flex h-11 w-11 items-center justify-center
                   rounded-lg bg-[#E5F4F4]"
          >

            <mat-icon
              aria-hidden="true"
              class="!text-[#007979]"
            >
              accessibility_new
            </mat-icon>

          </div>


          <p
            class="mt-6 text-sm font-bold uppercase
                   tracking-wider text-[#007979]"
          >
            Accessibility
          </p>


          <h1
            class="mt-2 text-3xl font-bold tracking-tight
                   text-[#032D42] sm:text-4xl"
          >
            Accessibility
          </h1>


          <p
            class="mt-4 max-w-2xl text-sm leading-6 text-gray-600
                   sm:text-base sm:leading-7"
          >
            Zebron is committed to making its platform useful
            and accessible to as many people as possible.
          </p>


          <div
            class="mt-10 space-y-9 text-sm leading-7 text-gray-600
                   sm:text-base"
          >

            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                Our commitment
              </h2>

              <p class="mt-3">
                We aim to design and maintain Zebron so that
                people with different abilities can navigate,
                understand, and use the platform.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                Accessible design
              </h2>

              <p class="mt-3">
                Zebron uses responsive layouts, semantic
                structure, descriptive labels, keyboard-friendly
                controls, readable content, and visual
                contrast to support a broad range of users.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                Continuing improvement
              </h2>

              <p class="mt-3">
                Accessibility is an ongoing process. As Zebron
                develops, we will continue identifying and
                addressing opportunities to improve the
                accessibility and usability of the platform.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                Report an accessibility issue
              </h2>

              <p class="mt-3">
                If you encounter an accessibility barrier or
                have a suggestion for improving the experience,
                please contact us and describe the issue,
                including the page where it occurred when
                possible.
              </p>


              <a
                routerLink="/contact"
                class="mt-4 inline-flex items-center gap-2
                       rounded-lg bg-[#007979] px-4 py-2.5
                       text-sm font-semibold text-white
                       hover:bg-[#006666]"
              >

                Contact Zebron

                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5 !text-[18px]"
                >
                  arrow_forward
                </mat-icon>

              </a>

            </section>

          </div>

        </div>

      </div>

    </main>

  `,

  styles: [],
})
export class AccessibilityComponent {

  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly document = inject(DOCUMENT);


  constructor() {

    this.updateSeoMetadata();

  }


  private updateSeoMetadata(): void {

    const pageTitle =
      'Accessibility | Zebron';

    const description =
      'Learn about Zebron accessibility and how to report accessibility barriers or usability issues.';

    const canonicalUrl =
      'https://zebron.org/accessibility';


    this.title.setTitle(pageTitle);

    this.meta.updateTag({
      name: 'description',
      content: description,
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
      property: 'og:type',
      content: 'website',
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });

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


  private setCanonical(url: string): void {

    const existing =
      this.document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );


    if (existing) {

      existing.setAttribute(
        'href',
        url,
      );

      return;

    }


    const link =
      this.document.createElement('link');

    link.setAttribute(
      'rel',
      'canonical',
    );

    link.setAttribute(
      'href',
      url,
    );

    this.document.head.appendChild(link);

  }

}