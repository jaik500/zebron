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
                 gap-10
                 sm:grid-cols-2
                 lg:grid-cols-4"
        >
          <!-- ===================================================
               BRAND
               =================================================== -->

          <div>
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
          </div>

          <!-- ===================================================
               EXPLORE
               =================================================== -->

          <div>
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
                  routerLink="/resources"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Resources
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

          <!-- ===================================================
     PARTICIPATE
     =================================================== -->

          <div>
            <h2
              class="text-sm
           font-semibold
           text-white"
            >
              Participate
            </h2>

            <ul
              class="mt-4
           space-y-3"
            >
              <li>
                <a
                  routerLink="/submit"
                  class="text-sm
               text-white/70
               transition
               hover:text-white"
                >
                  Add a Resource
                </a>
              </li>

              <li>
                <a
                  routerLink="/test-center"
                  class="text-sm
                  font-medium
                  text-white/70
                  transition
                  hover:text-[#12BFC3]"
                >
                  Test Center
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

          <!-- ===================================================
               LEGAL
               =================================================== -->

          <div>
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
                  routerLink="/accessibility"
                  class="text-sm
                         text-white/70
                         transition
                         hover:text-white"
                >
                  Accessibility
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
            zebron.org
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
