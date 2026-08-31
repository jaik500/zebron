import { Component, DOCUMENT, inject } from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacy',

  standalone: true,

  imports: [RouterLink, MatIconModule],

  template: `
    <!-- =========================================================
         HEADER
         ========================================================= -->

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

    <!-- =========================================================
         CONTENT
         ========================================================= -->

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
            <mat-icon aria-hidden="true" class="!text-[#007979]"> privacy_tip </mat-icon>
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
            Privacy Policy
          </h1>

          <p class="mt-3 text-sm text-gray-500">Last updated: August 31, 2026</p>

          <div
            class="mt-10 space-y-9 text-sm leading-7 text-gray-600
                   sm:text-base"
          >
            <section>
              <h2 class="text-xl font-bold text-[#032D42]">1. Overview</h2>

              <p class="mt-3">
                Zebron is committed to respecting your privacy. This Privacy Policy explains the
                types of information that may be collected when you use the Zebron platform and how
                that information may be used.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">2. Information You Provide</h2>

              <p class="mt-3">
                Depending on how you use Zebron, you may provide information such as your name,
                email address, account information, organization information, resource submissions,
                job information, or messages submitted through contact forms.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">
                3. Information Collected Automatically
              </h2>

              <p class="mt-3">
                Zebron may collect technical information associated with your use of the platform,
                such as browser, device, network, and usage information. This information may be
                used to operate, secure, maintain, and improve the platform.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">4. How Information Is Used</h2>

              <p class="mt-3">
                Information may be used to provide and improve Zebron services, operate user
                accounts, process submissions, communicate with users, respond to inquiries,
                maintain security, and understand how the platform is being used.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">5. Third-Party Services</h2>

              <p class="mt-3">
                Zebron may rely on third-party services to provide functionality such as
                authentication, data storage, hosting, communications, and analytics. Those services
                may process information according to their own privacy policies and terms.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">6. External Websites</h2>

              <p class="mt-3">
                Zebron contains links to websites operated by third parties. Zebron does not control
                those websites and their privacy practices may differ from ours. Users should review
                the privacy policies of external websites they visit.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">7. Data Security</h2>

              <p class="mt-3">
                We take reasonable measures designed to protect information used by the platform.
                However, no internet-based service can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">8. Your Choices</h2>

              <p class="mt-3">
                If you have questions about information associated with your use of Zebron or would
                like to contact us regarding privacy, please use the Zebron contact page.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">9. Changes to This Policy</h2>

              <p class="mt-3">
                This Privacy Policy may be updated as Zebron evolves. When changes are made, the
                updated version will be published on this page.
              </p>
            </section>

            <section>
              <h2 class="text-xl font-bold text-[#032D42]">10. Contact</h2>

              <p class="mt-3">
                Questions about this Privacy Policy can be submitted through our
                <a
                  routerLink="/contact"
                  class="font-semibold text-[#007979]
                         hover:underline"
                >
                  contact page </a
                >.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  `,

  styles: [],
})
export class PrivacyComponent {
  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly document = inject(DOCUMENT);

  constructor() {
    this.updateSeoMetadata();
  }

  private updateSeoMetadata(): void {
    const pageTitle = 'Privacy Policy | Zebron';

    const description =
      'Read the Zebron Privacy Policy and learn how information may be collected, used, and protected when using the platform.';

    const canonicalUrl = 'https://zebron.org/privacy';

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
