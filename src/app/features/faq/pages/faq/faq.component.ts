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
  selector: 'app-faq',

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
        class="mx-auto max-w-4xl px-5 py-4
               sm:px-6 sm:py-4 lg:px-8"
      >

        <!-- Intro -->

        <div class="text-center">

          <div
            class="mx-auto flex h-12 w-12 items-center justify-center
                   rounded-full bg-[#E5F4F4]"
          >

            <mat-icon
              aria-hidden="true"
              class="!text-[#007979]"
            >
              help_outline
            </mat-icon>

          </div>


          <p
            class="mt-5 text-sm font-bold uppercase
                   tracking-wider text-[#007979]"
          >
            Help Center
          </p>


          <h1
            class="mt-2 text-3xl font-bold tracking-tight
                   text-[#032D42] sm:text-4xl"
          >
            Frequently Asked Questions
          </h1>


          <p
            class="mx-auto mt-4 max-w-2xl text-sm leading-6
                   text-gray-600 sm:text-base"
          >
            Answers to common questions about finding resources,
            discovering opportunities, and using Zebron.
          </p>

        </div>


        <!-- Questions -->

        <div class="mt-10 space-y-4">


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              What is Zebron?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Zebron is a platform designed to make resources,
              organizations, services, jobs, training, and
              other opportunities easier to discover.
            </p>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              How do I find a resource?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Visit the Resources section and use search and
              available filters to find resources relevant to
              your needs.
            </p>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              Can I submit a resource?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Yes. Organizations and individuals can use the
              resource submission process to suggest information
              for inclusion on Zebron.
            </p>


            <a
              routerLink="/submit"
              class="mt-3 inline-flex text-sm font-semibold
                     text-[#007979] hover:underline"
            >
              Submit a resource →
            </a>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              What does a verified resource mean?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Verification is intended to provide an additional
              indication that information has been reviewed by
              Zebron. Users should still confirm important
              information directly with the organization.
            </p>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              Can organizations be listed on Zebron?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Yes. Zebron is designed to help people discover
              organizations and the resources and opportunities
              they provide.
            </p>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              Can I find jobs on Zebron?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Yes. Use the Find section to explore available
              employment opportunities and career-related
              information.
            </p>


            <a
              routerLink="/find/job"
              class="mt-3 inline-flex text-sm font-semibold
                     text-[#007979] hover:underline"
            >
              Find jobs →
            </a>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              Is all information on Zebron provided by Zebron?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              No. Some information may be supplied by
              organizations, employers, users, or other
              third parties. Always verify important details
              with the relevant provider.
            </p>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              How can I report incorrect information?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              If you find information that appears incorrect,
              outdated, or inappropriate, please contact Zebron
              so it can be reviewed.
            </p>


            <a
              routerLink="/contact"
              class="mt-3 inline-flex text-sm font-semibold
                     text-[#007979] hover:underline"
            >
              Contact Zebron →
            </a>

          </article>


          <article
            class="rounded-xl border border-gray-200 bg-white
                   p-5 shadow-sm"
          >

            <h2 class="text-base font-bold text-[#032D42]">
              How can I contact Zebron?
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Visit the Contact page to send a message to the
              Zebron team.
            </p>

          </article>

        </div>

      </div>

    </main>

  `,

  styles: [],
})
export class FaqComponent {

  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly document = inject(DOCUMENT);


  constructor() {

    this.updateSeoMetadata();

  }


  private updateSeoMetadata(): void {

    const pageTitle =
      'Frequently Asked Questions | Zebron';

    const description =
      'Find answers to common questions about Zebron, resources, jobs, submissions, organizations, verification, and using the platform.';

    const canonicalUrl =
      'https://zebron.org/faq';


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