import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
      <div
        class="mx-auto
               max-w-7xl
               px-5
               py-12
               sm:px-6
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
              Discover resources, organizations, jobs, training, and opportunities.
            </p>
            <a class="text-white/70 hover:text-white" href="mailto:support@inbound.zebron.org">
              contact@zebron.org
            </a>
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
                  routerLink="/find"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Find Jobs and opportunities
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
              Legal & Help
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
                  routerLink="/faq"
                  class="text-sm
               text-white/70
               transition
               hover:text-white"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  routerLink="/contact"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Contact
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
  readonly currentYear = new Date().getFullYear();
}
