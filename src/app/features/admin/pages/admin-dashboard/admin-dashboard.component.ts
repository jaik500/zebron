import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LocationStore } from '../../../locations/stores/location.store';
import { Location } from '../../../../core/models/location.model';
import { HotToastService } from '@ngxpert/hot-toast';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],

  template: `
    <div class="min-h-screen bg-gray-50 mt-16">

      <!-- =========================================================
           ADMIN DASHBOARD HEADER
           ========================================================= -->
      <header class="hidden sm:block border-b border-gray-200 bg-[#2a835f] text-white">

        <div
          class="mx-auto flex max-w-7xl
                 items-center justify-between
                 gap-4 px-5
                 sm:px-6 lg:px-8"
        >

          <!-- =====================================================
               DASHBOARD TITLE
               ===================================================== -->
          <div class="min-w-0">


            <p class="text-sm text-white/80">
              Manage Zebron resources and database content.
            </p>

          </div>

          <!-- =====================================================
               DASHBOARD HEADER ACTIONS
               ===================================================== -->
          <div class="flex items-center">

            <!-- ===================================================
                 DESKTOP ACTIONS
                 =================================================== -->
            <div class="hidden items-center gap-3 sm:flex">

              <!-- Mailbox -->
              <a
                routerLink="/admin/contact"
                class="shrink-0 rounded-lg
                       border border-white/30
                       bg-white/10 px-3 py-1
                       text-sm font-semibold text-white
                       transition hover:bg-white/20"
              >
                Mailbox
              </a>

              <!-- Public site -->
              <a
                routerLink="/resources"
                class="shrink-0 rounded-md
                       border border-white/30
                       bg-white/10 px-3 py-1
                       text-sm font-semibold text-white
                       transition hover:bg-white/20"
              >
                View site
              </a>

              <!-- Sign out -->
              <button
                type="button"
                (click)="signOut()"
                [disabled]="signingOut()"
                class="shrink-0 rounded-lg
                       border border-white/30
                       bg-white/10 px-3 py-1
                       text-sm font-semibold text-white
                       transition hover:bg-white/20
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (signingOut()) {
                  Signing out...
                } @else {
                  Sign out
                }
              </button>

            </div>

            <!-- ===================================================
                 MOBILE THREE-DOT MENU
                 =================================================== -->
            <div class="relative sm:hidden">

              <!-- Three vertical dots -->
              <button
                type="button"
                (click)="toggleMoreMenu()"
                class="flex h-10 w-10
                       items-center justify-center
                       rounded-lg
                       border border-white/30
                       bg-white/10
                       text-2xl font-bold
                       leading-none text-white
                       transition hover:bg-white/20
                       focus:outline-none
                       focus:ring-2
                       focus:ring-white/40"
                aria-label="Open dashboard menu"
                aria-haspopup="menu"
                [attr.aria-expanded]="moreMenuOpen()"
              >
                ⋮
              </button>

              <!-- =================================================
                   MOBILE MENU
                   ================================================= -->
              @if (moreMenuOpen()) {

                <div
                  class="absolute right-0 top-12 z-50
                         w-52 overflow-hidden
                         rounded-xl border
                         border-gray-200
                         bg-white shadow-xl"
                  role="menu"
                >

                  <!-- Mailbox -->
                  <a
                    routerLink="/admin/contact"
                    (click)="closeMoreMenu()"
                    class="flex items-center gap-3
                           px-4 py-3
                           text-sm font-medium
                           text-gray-700
                           transition hover:bg-gray-50"
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      class="text-base"
                    >
                      📥
                    </span>

                    <span>
                      Mailbox
                    </span>
                  </a>

                  <!-- Resources -->
                  <a
                    routerLink="/resources"
                    (click)="closeMoreMenu()"
                    class="flex items-center gap-3
                           px-4 py-3
                           text-sm font-medium
                           text-gray-700
                           transition hover:bg-gray-50"
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      class="text-base"
                    >
                      🌐
                    </span>

                    <span>
                      Resources
                    </span>
                  </a>

                  <!-- Home -->
                  <a
                    routerLink="/"
                    (click)="closeMoreMenu()"
                    class="flex items-center gap-3
                           px-4 py-3
                           text-sm font-medium
                           text-gray-700
                           transition hover:bg-gray-50"
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      class="text-base"
                    >
                      🌐
                    </span>

                    <span>
                      Home
                    </span>
                  </a>

                  <!-- Sign out -->
                  <button
                    type="button"
                    (click)="signOut(); closeMoreMenu()"
                    [disabled]="signingOut()"
                    class="flex w-full
                           items-center gap-3
                           px-4 py-3
                           text-left text-sm
                           font-medium text-gray-700
                           transition hover:bg-gray-50
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      class="text-base"
                    >
                      ↪
                    </span>

                    @if (signingOut()) {
                      <span>
                        Signing out...
                      </span>
                    } @else {
                      <span>
                        Sign out
                      </span>
                    }
                  </button>

                </div>
              }

            </div>

          </div>
        </div>
      </header>

      <!-- =========================================================
           ADMINISTRATOR INFORMATION
           ========================================================= -->
      @if (authService.user(); as user) {

        <section
          class="hidden sm:block bg-[#032D42]/5
                 px-4 py-1
                 sm:px-6"
        >

          <div
            class="flex w-full
                   items-center
                   justify-between
                   gap-3
                   whitespace-nowrap"
          >

            <!-- Administrator information -->
            <div
              class="min-w-0 truncate
                     text-sm font-semibold
                     uppercase tracking-wide
                     text-[#007979]"
            >
              {{ user.displayName || user.email }}
            </div>

            <!-- Administrator label -->
            <p
              class="shrink-0
                     text-sm text-gray-600"
            >
              Administrator
            </p>

          </div>

        </section>
      }

      <!-- =========================================================
           MAIN CONTENT
           ========================================================= -->
      <main
        class="mx-auto max-w-6xl
               px-3
               sm:p-2"
      >

        <!-- =======================================================
             MANAGE CONTENT
             ======================================================= -->
        <section class="mt-1">

          <div>

            <p
              class="text-xs font-semibold uppercase
                     tracking-wider text-[#7ED6D1]"
            >
              Zebron Administration
            </p>

            <h2
              class="text-lg font-semibold
                     text-[#032D42]
                     sm:text-xl"
            >
              Manage content
            </h2>

          </div>

          <!-- =====================================================
               MANAGEMENT CARDS

               MOBILE:
               - 1 columns
               - compact gap
               - compact cards

               TABLET:
               - 2 columns

               DESKTOP:
               - 4 columns
               ===================================================== -->
          <div
            class="mt-2 grid
                   grid-cols-1 gap-1
                   sm:grid-cols-2 sm:gap-6
                   lg:grid-cols-4"
          >

            <!-- ===================================================
                 CATEGORIES
                 =================================================== -->
            <a
              routerLink="/admin/categories"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md
                     sm:rounded-xl
                     sm:px-6 sm:py-3"
            >

              <h3
                class="text-xs font-semibold
                       leading-tight
                       text-[#032D42]
                       sm:text-lg
                       sm:leading-normal
                       group-hover:text-[#007979]"
              >
                Categories
              </h3>

              <!-- Hidden on mobile -->
              <p
                class="hidden
                       sm:mt-2 sm:block
                       sm:text-sm
                       sm:leading-normal
                       text-gray-600"
              >
                Create and manage resource categories.
              </p>

              <span
                class="mt-1 inline-block
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-4
                       sm:text-sm"
              >
                Manage →
              </span>

            </a>

            <!-- ===================================================
                 RESOURCES
                 =================================================== -->
            <a
              routerLink="/admin/resources"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md
                     sm:rounded-xl
                     sm:p-6 sm:py-3"
            >

              <h3
                class="text-xs font-semibold
                       leading-tight
                       text-[#032D42]
                       sm:text-lg
                       sm:leading-normal
                       group-hover:text-[#007979]"
              >
                Resources
              </h3>

              <!-- Hidden on mobile -->
              <p
                class="hidden
                       sm:mt-2 sm:block
                       sm:text-sm
                       sm:leading-normal
                       text-gray-600"
              >
                Create, edit, publish, and manage resources.
              </p>

              <span
                class="mt-1 inline-block
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-4
                       sm:text-sm"
              >
                Manage →
              </span>

            </a>

            <!-- ===================================================
                 ORGANIZATIONS
                 =================================================== -->
            <a
              routerLink="/admin/organizations"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md
                     sm:rounded-xl
                     sm:p-6 sm:py-3"
            >

              <h3
                class="text-xs font-semibold
                       leading-tight
                       text-[#032D42]
                       sm:text-lg
                       sm:leading-normal
                       group-hover:text-[#007979]"
              >
                Organizations
              </h3>

              <!-- Hidden on mobile -->
              <p
                class="hidden
                       sm:mt-2 sm:block
                       sm:text-sm
                       sm:leading-normal
                       text-gray-600"
              >
                Manage organizations associated with resources.
              </p>

              <span
                class="mt-1 inline-block
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-4
                       sm:text-sm"
              >
                Manage →
              </span>

            </a>

            <!-- ===================================================
                 SUBMISSIONS
                 =================================================== -->
            <a
              routerLink="/admin/submissions"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md
                     sm:rounded-xl
                     sm:p-6 sm:py-3"
            >

              <h3
                class="text-xs font-semibold
                       leading-tight
                       text-[#032D42]
                       sm:text-lg
                       sm:leading-normal
                       group-hover:text-[#007979]"
              >
                Submissions
              </h3>

              <!-- Hidden on mobile -->
              <p
                class="hidden
                       sm:mt-2 sm:block
                       sm:text-sm
                       sm:leading-normal
                       text-gray-600"
              >
                Review and manage submitted resources.
              </p>

              <span
                class="mt-1 inline-block
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-4
                       sm:text-sm"
              >
                Manage →
              </span>

            </a>

            <!-- ===================================================
                 JOBS
                 =================================================== -->
            <a
              routerLink="/admin/jobs"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm
                     transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/40
                     hover:shadow-md
                     sm:rounded-xl
                     sm:p-5"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-11 w-11
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-xl"
                aria-hidden="true"
              >
                💼
              </div>

              <h2
                class="mt-0
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#032D42]
                       sm:mt-4
                       sm:text-base
                       sm:leading-normal"
              >
                Jobs
              </h2>

              <!-- Description hidden on mobile -->
              <p
                class="hidden
                       sm:mt-1 sm:block
                       sm:text-sm
                       sm:leading-5
                       text-gray-600"
              >
                Manage job opportunities available through the Zebron Job Finder.
              </p>

              <div
                class="mt-1.5
                       inline-flex
                       items-center
                       gap-1
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       transition
                       group-hover:gap-2
                       sm:mt-4
                       sm:text-sm"
              >
                Manage jobs

                <span aria-hidden="true">
                  →
                </span>
              </div>

            </a>

            <!-- ===================================================
                 USERS
                 =================================================== -->
            <a
              routerLink="/admin/users"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  />

                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M22 21v-2a4 4 0 0 0-3-3.87"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 3.13a4 4 0 0 1 0 7.75"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Users
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Manage user accounts, profiles, roles, and permissions.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Manage users →
              </div>

            </a>

            <!-- ===================================================
                 RESOURCE TYPES
                 =================================================== -->
            <a
              routerLink="/admin/resource-types"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                  />

                  <path
                    stroke-linecap="round"
                    d="M8 9h8M8 13h8M8 17h5"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Resource Types
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Manage the types used to classify resources across Zebron.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Manage resource types →
              </div>

            </a>

            <!-- ===================================================
                 LOCATIONS
                 =================================================== -->
            <a
              routerLink="/admin/locations"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
                  />

                  <circle
                    cx="12"
                    cy="9"
                    r="2.25"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Locations
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Manage locations used by resources and location-based personalization.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Manage locations →
              </div>

            </a>

            <!-- ===================================================
                 TEST CENTER
                 =================================================== -->
            <a
              routerLink="/admin/test-center"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <!-- Clipboard -->
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5h6"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                  />

                  <rect
                    x="5"
                    y="4"
                    width="14"
                    height="17"
                    rx="2"
                  />

                  <!-- Checklist -->
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 10h6"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 14h6"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 18h4"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Test Center
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Manage test courses, topics, questions, and question banks.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Open Test Center →
              </div>

            </a>

            <!-- ===================================================
                 CONTACT MAILBOX
                 =================================================== -->
            <a
              routerLink="/admin/contact"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m3 7 9 6 9-6"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Contact Mailbox
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Review and manage messages submitted through the contact form.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Open mailbox →
              </div>

            </a>

            <!-- ===================================================
                 BUSINESS OPERATIONS
                 =================================================== -->
            <a
              routerLink="/admin/business"
              class="group rounded-lg
                     border border-gray-200
                     bg-white p-2
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md
                     sm:rounded-2xl
                     sm:p-6"
            >

              <!-- Icon hidden on mobile -->
              <div
                class="hidden
                       sm:flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                  aria-hidden="true"
                >

                  <!-- Building -->
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 21h18"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 21V5l7-3 7 3v16"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 21v-4h6v4"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 8h1M8 11h1M8 14h1M15 8h1M15 11h1M15 14h1"
                  />

                </svg>

              </div>

              <div class="mt-0 sm:mt-5">

                <h2
                  class="text-sm
                         font-semibold
                         leading-tight
                         text-[#032D42]
                         sm:text-lg
                         sm:leading-normal
                         group-hover:text-[#007979]"
                >
                  Business Operations
                </h2>

                <!-- Description hidden on mobile -->
                <p
                  class="hidden
                         sm:mt-2 sm:block
                         sm:text-sm
                         sm:leading-6
                         text-gray-500"
                >
                  Manage business finances, revenue, expenses, compliance,
                  activities, documents, and reports.
                </p>

              </div>

              <div
                class="mt-1.5
                       text-xs
                       font-semibold
                       leading-tight
                       text-[#007979]
                       sm:mt-5
                       sm:text-sm"
              >
                Open Business Operations →
              </div>

            </a>

          </div>
        </section>

      </main>
    </div>
  `,
})
export class AdminDashboardComponent {
  /**
   * Firebase authentication service.
   */
  protected readonly authService = inject(AuthService);

  /**
   * Location service used to create
   * resource locations.
   */
  private readonly locationStore = inject(LocationStore);

  /**
   * Prevent duplicate location submissions.
   */
  protected readonly savingLocation = signal(false);

  private readonly pageTitleService = inject(PageTitleService);

  /**
   * Location creation form.
   */
  protected locationForm: Partial<Location> = {
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    latitude: undefined,
    longitude: undefined,
  };

  /**
   * Angular router.
   */
  private readonly router = inject(Router);

  /**
   * Toast notification service.
   */
  private readonly toast = inject(HotToastService);

  /**
   * Prevent duplicate sign-out requests
   * while Firebase processes the request.
   */
  protected readonly signingOut = signal(false);

  /**
   * Controls the mobile dashboard
   * three-dot menu.
   */
  protected readonly moreMenuOpen = signal(false);

  /**
   * Toggle the mobile dashboard menu.
   */
  protected toggleMoreMenu(): void {
    this.moreMenuOpen.update((open) => !open);
  }

  /**
   * Close the mobile dashboard menu.
   */
  protected closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  constructor() {
    this.pageTitleService.setTitle('Admin Dashboard');
  }

  /**
   * Create a new location in Firestore.
   */
  protected async createLocation(): Promise<void> {
    if (
      !this.locationForm.city?.trim() ||
      !this.locationForm.state?.trim() ||
      !this.locationForm.zipCode?.trim() ||
      !this.locationForm.country?.trim()
    ) {
      this.toast.error(
        'Please complete the city, state, ZIP code, and country.',
      );

      return;
    }

    if (this.savingLocation()) {
      return;
    }

    this.savingLocation.set(true);

    try {
      const location: Location = {
        address: this.locationForm.address?.trim() || '',

        city: this.locationForm.city!.trim(),

        state: this.locationForm.state!.trim(),

        zipCode: this.locationForm.zipCode!.trim(),

        country: this.locationForm.country!.trim(),

        ...(this.locationForm.latitude !== undefined &&
        this.locationForm.latitude !== null
          ? {
              latitude: Number(this.locationForm.latitude),
            }
          : {}),

        ...(this.locationForm.longitude !== undefined &&
        this.locationForm.longitude !== null
          ? {
              longitude: Number(this.locationForm.longitude),
            }
          : {}),
      };

      await this.locationStore.createLocation(location);

      this.toast.success('Location created successfully.');

      this.clearLocationForm();
    } catch (error) {
      console.error('Failed to create location:', error);

      this.toast.error(
        'Unable to create location. Please try again.',
      );
    } finally {
      this.savingLocation.set(false);
    }
  }

  /**
   * Reset the location form.
   */
  protected clearLocationForm(): void {
    this.locationForm = {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      latitude: undefined,
      longitude: undefined,
    };
  }

  /**
   * Sign the administrator out of Firebase,
   * show feedback, and return to the login page.
   */
  protected async signOut(): Promise<void> {
    /**
     * Prevent multiple sign-out requests
     * from repeated button clicks.
     */
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      /**
       * Sign out through the existing
       * authentication service.
       */
      await this.authService.logout();

      /**
       * Show confirmation to the administrator.
       */
      this.toast.success(
        'You have been signed out.',
      );

      /**
       * Return to the login page.
       */
      await this.router.navigateByUrl('/login');

    } catch (error) {
      console.error(
        'Failed to sign out:',
        error,
      );

      this.toast.error(
        'Unable to sign out. Please try again.',
      );

    } finally {
      this.signingOut.set(false);
    }
  }
}