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
  selector: 'app-terms',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
  ],

  template: `

    <header class="border-b border-gray-200 bg-white">

      <div
        class="mx-auto flex max-w-7xl items-center justify-between
               px-5 py-3 sm:px-6 lg:px-8"
      >

        <a
          routerLink="/"
          aria-label="Zebron home"
          class="flex items-center gap-2 text-[#032D42]"
        >

          <img
            src="/zebron-favicon.svg"
            alt=""
            class="h-8 w-8"
          />

          <span class="text-xl font-bold tracking-tight">
            Zebron
          </span>

        </a>


        <nav
          class="hidden items-center gap-7 md:flex"
          aria-label="Primary navigation"
        >

          <a
            routerLink="/resources"
            class="text-sm font-medium text-[#032D42]
                   hover:text-[#007979]"
          >
            Resources
          </a>

          <a
            routerLink="/find"
            class="text-sm font-medium text-[#032D42]
                   hover:text-[#007979]"
          >
            Find Jobs
          </a>

          <a
            routerLink="/about"
            class="text-sm font-medium text-[#032D42]
                   hover:text-[#007979]"
          >
            About
          </a>

          <a
            routerLink="/contact"
            class="text-sm font-medium text-[#032D42]
                   hover:text-[#007979]"
          >
            Contact
          </a>

        </nav>

      </div>

    </header>


    <main class="bg-gray-50">

      <div
        class="mx-auto max-w-4xl px-5 py-12
               sm:px-6 sm:py-16 lg:px-8"
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
              description
            </mat-icon>

          </div>


          <p
            class="mt-6 text-sm font-bold uppercase
                   tracking-wider text-[#007979]"
          >
            Legal
          </p>


          <h1
            class="mt-2 text-3xl font-bold tracking-tight
                   text-[#032D42] sm:text-4xl"
          >
            Terms of Use
          </h1>


          <p class="mt-3 text-sm text-gray-500">
            Last updated: August 31, 2026
          </p>


          <div
            class="mt-10 space-y-9 text-sm leading-7 text-gray-600
                   sm:text-base"
          >

            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                1. Acceptance of These Terms
              </h2>

              <p class="mt-3">
                By accessing or using Zebron, you agree to use
                the platform responsibly and in accordance with
                these Terms of Use.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                2. About Zebron
              </h2>

              <p class="mt-3">
                Zebron provides a platform for discovering
                resources, organizations, services, jobs,
                training, and other opportunities.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                3. Third-Party Information
              </h2>

              <p class="mt-3">
                Information displayed on Zebron may be provided
                by organizations, employers, users, or other
                third parties. Users should independently verify
                important information before relying on it.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                4. External Links
              </h2>

              <p class="mt-3">
                Zebron may link to external websites. Zebron
                does not control external websites and is not
                responsible for their content, policies, or
                availability.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                5. User Submissions
              </h2>

              <p class="mt-3">
                If you submit a resource, organization,
                opportunity, job, or other information to Zebron,
                you are responsible for ensuring that the
                information you provide is accurate and that you
                have the right to provide it.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                6. Prohibited Use
              </h2>

              <p class="mt-3">
                You may not use Zebron to submit misleading,
                fraudulent, unlawful, abusive, harmful, or
                intentionally deceptive information.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                7. Accuracy of Information
              </h2>

              <p class="mt-3">
                Information can change over time. Users should
                confirm current eligibility, availability,
                pricing, requirements, deadlines, and other
                important details directly with the relevant
                organization or provider.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                8. Changes to Zebron
              </h2>

              <p class="mt-3">
                Zebron may add, modify, suspend, or discontinue
                features of the platform as it develops.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                9. Changes to These Terms
              </h2>

              <p class="mt-3">
                These Terms may be updated from time to time.
                Updated terms will be published on this page.
              </p>

            </section>


            <section>

              <h2 class="text-xl font-bold text-[#032D42]">
                10. Contact
              </h2>

              <p class="mt-3">
                Questions about these Terms can be submitted
                through the
                <a
                  routerLink="/contact"
                  class="font-semibold text-[#007979]
                         hover:underline"
                >
                  Zebron contact page
                </a>.
              </p>

            </section>

          </div>

        </div>

      </div>

    </main>

  `,

  styles: [],
})
export class TermsComponent {

  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly document = inject(DOCUMENT);


  constructor() {

    this.updateSeoMetadata();

  }


  private updateSeoMetadata(): void {

    const pageTitle =
      'Terms of Use | Zebron';

    const description =
      'Read the Zebron Terms of Use governing access to and use of the Zebron resource and opportunity platform.';

    const canonicalUrl =
      'https://zebron.org/terms';


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