import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PwaService } from '../../services/pwa.service';

/**
 * Site footer.
 *
 * - Computers and tablets (md and up): the full footer (brand, Explore, Legal).
 * - Phones in a browser: a compact footer (logo and Donate, the links in two
 *   wrapped lines, copyright and email on one line).
 * - Phones in the installed app: one line (copyright, Privacy, Terms, Help);
 *   the menu and the bottom navigation bar cover the rest.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],

  template: `
    <footer
      class="border-t
             border-white/10
             bg-[#032D42]
             text-white"
    >
      <!-- =====================================================
           PHONES
           ===================================================== -->
      @if (pwa.standalone()) {
        <!-- Installed app: one line -->
        <p class="px-4 py-2.5 text-center text-xs text-white/60 md:hidden">
          © {{ currentYear }} Zebron
          <span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
          <a routerLink="/privacy" class="text-white/85 hover:text-white">Privacy</a>
          <span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
          <a routerLink="/terms" class="text-white/85 hover:text-white">Terms</a>
          <span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
          <a routerLink="/faq" class="text-white/85 hover:text-white">Help</a>
        </p>
      } @else {
        <!-- Browser: compact -->
        <div class="px-4 py-3.5 md:hidden">
          <div class="flex items-center justify-between gap-3">
            <a routerLink="/" aria-label="Zebron home" class="inline-flex items-center gap-1.5">
              <img src="/zebron-favicon.svg" alt="" class="h-6 w-6" />
              <span class="text-base font-bold tracking-tight">Zebron</span>
            </a>
            <a routerLink="/donate" class="text-sm font-semibold text-[#7ED6D1] hover:text-white">Donate</a>
          </div>
          <nav class="mt-2 text-sm leading-7 text-white/75" aria-label="Footer">
            <a routerLink="/apps" class="hover:text-white">All apps</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/about" class="hover:text-white">About</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/jobs" class="hover:text-white">Jobs</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/contact" class="hover:text-white">Contact</a>
            <br />
            <a routerLink="/privacy" class="hover:text-white">Privacy</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/terms" class="hover:text-white">Terms</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/accessibility" class="hover:text-white">Accessibility</a><span class="mx-1.5 text-white/30" aria-hidden="true">·</span>
            <a routerLink="/faq" class="hover:text-white">FAQ</a>
          </nav>
          <p class="mt-1.5 text-xs text-white/50">
            © {{ currentYear }} Zebron
            <span class="mx-1 text-white/30" aria-hidden="true">·</span>
            <a href="mailto:support@inbound.zebron.org" class="hover:text-white">contact&#64;zebron.org</a>
          </p>
        </div>
      }

      <!-- =====================================================
           COMPUTERS AND TABLETS (md and up): the full footer
           ===================================================== -->
      <div
        class="mx-auto
               hidden
               max-w-7xl
               px-5
               py-12
               sm:px-6
               md:block
               lg:px-8"
      >
        <!-- =====================================================
             MAIN FOOTER
             ===================================================== -->

        <div
          class="grid
                 grid-cols-2
                 gap-x-6
                 gap-y-10
                 sm:gap-10
                 lg:grid-cols-3"
        >
          <!-- ===================================================
               BRAND
               =================================================== -->

          <div class="col-span-2 sm:col-span-1">
            <a
              routerLink="/"
              aria-label="Zebron home"
              class="inline-flex
                     items-center
                     gap-2"
            >
              <img
                src="/zebron-favicon.svg"
                alt=""
                class="h-9
                       w-9"
              />

              <span
                class="text-xl
                       font-bold
                       tracking-tight"
              >
                Zebron
              </span>
            </a>

            <p
              class="mt-4
                     max-w-xs
                     text-sm
                     leading-6
                     text-white/70"
            >
              Discover resources, organizations, training, and opportunities.
            </p>
             <div>
                <a
                  routerLink="/contact"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Message Us
                </a>
            </div>
           <div>
            <a class="text-white/70 hover:text-white" href="mailto:support@inbound.zebron.org">
              contact@zebron.org
            </a>
          </div>
          </div>

          <!-- ===================================================
               EXPLORE
               =================================================== -->

          <div class="order-1 sm:order-none">
            <h2
              class="text-sm
                     font-semibold
                     text-white"
            >
              Explore
            </h2>

            <ul
              class="mt-4
                     space-y-3"
            >
              <li>
                <a
                  routerLink="/apps"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  All Zebron apps
                </a>
              </li>

              <li>
                <a
                  routerLink="/about"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  About Zebron
                </a>
              </li>

              <li>
                <a
                  routerLink="/jobs"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Job Board
                </a>
              </li>
              <li>
                <a
                  routerLink="/donate"
                  class="text-sm
               font-medium
               text-[#7ED6D1]
               transition
               hover:text-white"
                >
                  Donate
                </a>
              </li>

              
            </ul>
          </div>

          <!-- ===================================================
               LEGAL
               =================================================== -->

          <div class="order-2 sm:order-none">
            <h2
              class="text-sm
                     font-semibold
                     text-white"
            >
              Legal
            </h2>

            <ul
              class="mt-4
                     space-y-3"
            >
              <li>
                <a
                  routerLink="/privacy"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  routerLink="/terms"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Terms of Use
                </a>
              </li>
              <li>
                <a
                  routerLink="/accessibility"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Accessibility
                </a>
              </li>
             <li>
                <a
                  routerLink="/faq"
                  class="text-sm
               text-white/70
               transition
               hover:text-white"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- =====================================================
             BOTTOM BAR
             ===================================================== -->

        <div
          class="mt-10
                 flex
                 flex-col
                 gap-3
                 border-t
                 border-white/10
                 pt-6
                 sm:flex-row
                 sm:items-center
                 sm:justify-between"
        >
          <p
            class="text-xs
                   text-white/50"
          >
            © {{ currentYear }} Zebron. All rights reserved.
          </p>

          <a
            routerLink="/"
            class="text-xs
                   font-medium
                   text-white/50
                   transition
                   hover:text-white"
          >
            Rondpoint Inc
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly pwa = inject(PwaService);
  readonly currentYear = new Date().getFullYear();
}
