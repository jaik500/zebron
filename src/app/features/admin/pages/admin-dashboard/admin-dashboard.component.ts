import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LocationStore } from '../../../locations/stores/location.store';
import { Location } from '../../../../core/models/location.model';
import { HotToastService } from '@ngxpert/hot-toast';
import { PageTitleService } from '../../../../core/services/page-title.service';

// ============================================================
// TYPES
// ============================================================

interface AdminDashboardCard {
  title: string;
  description: string;
  route: string;
  actionLabel: string;
  icon: string;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">

      <!-- =========================================================
           ADMIN DASHBOARD HEADER
           ========================================================= -->
      <header
        class="hidden sm:block
               border-b border-gray-200
               bg-[#2a835f]
               text-white"
      >
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
            <div
              class="hidden
                     items-center
                     gap-3
                     sm:flex"
            >

              <!-- Mailbox -->
              <a
                routerLink="/admin/contact"
                class="shrink-0
                       rounded-lg
                       border border-white/30
                       bg-white/10
                       px-3 py-1
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-white/20"
              >
                Mailbox
              </a>

              <!-- Public site -->
              <a
                routerLink="/resources"
                class="shrink-0
                       rounded-md
                       border border-white/30
                       bg-white/10
                       px-3 py-1
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-white/20"
              >
                View site
              </a>

              <!-- Sign out -->
              <button
                type="button"
                (click)="signOut()"
                [disabled]="signingOut()"
                class="shrink-0
                       rounded-lg
                       border border-white/30
                       bg-white/10
                       px-3 py-1
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-white/20
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
                       transition
                       hover:bg-white/20
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
                           transition
                           hover:bg-gray-50"
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
                           transition
                           hover:bg-gray-50"
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
                           transition
                           hover:bg-gray-50"
                    role="menuitem"
                  >
                    <span
                      aria-hidden="true"
                      class="text-base"
                    >
                      🏠
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
                           font-medium
                           text-gray-700
                           transition
                           hover:bg-gray-50
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
          class="hidden sm:block
                 bg-[#032D42]/5
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
                     uppercase
                     tracking-wide
                     text-[#007979]"
            >
              {{ user.displayName || user.email }}
            </div>

            <!-- Administrator label -->
            <p
              class="shrink-0
                     text-sm
                     text-gray-600"
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
        class="mx-auto
               max-w-6xl
               px-3
               sm:p-2"
      >

        <!-- =======================================================
             MANAGE CONTENT
             ======================================================= -->
        <section class="mt-1">

          <div>

            <p
              class="text-xs
                     font-semibold
                     uppercase
                     tracking-wider
                     text-[#7ED6D1]"
            >
              Zebron Administration
            </p>

            <h2
              class="text-xl
                     font-semibold
                     text-[#032D42]
                     sm:text-xl"
            >
              Manage content
            </h2>

          </div>

          <!-- =====================================================
               MANAGEMENT CARDS

               Cards are generated from managementCards rather than
               hard-coded individually.

               MOBILE:
               - 2 columns
               - compact gap
               - compact cards

               TABLET:
               - 2 columns

               DESKTOP:
               - 4 columns
               ===================================================== -->
          <div
            class="mt-2 grid
                   grid-cols-2
                   gap-1
                   sm:grid-cols-2
                   sm:gap-6
                   lg:grid-cols-4"
          >

            @for (
              card of managementCards;
              track card.route
            ) {

              <a
                [routerLink]="card.route"
                class="group
                       rounded-lg
                       border border-gray-200
                       bg-white
                       p-2
                       shadow-sm
                       transition
                       hover:-translate-y-0.5
                       hover:border-[#007979]/30
                       hover:shadow-md
                       sm:rounded-2xl
                       sm:p-6"
              >

                <!-- =================================================
                     ICON
                     ================================================= -->
                <div
                  class="hidden
                         sm:flex
                         h-12 w-12
                         items-center
                         justify-center
                         rounded-xl
                         bg-[#007979]/10
                         text-[#007979]"
                  aria-hidden="true"
                >

                  @switch (card.icon) {

                    @case ('category') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <rect
                          x="4"
                          y="4"
                          width="6"
                          height="6"
                          rx="1"
                        />

                        <rect
                          x="14"
                          y="4"
                          width="6"
                          height="6"
                          rx="1"
                        />

                        <rect
                          x="4"
                          y="14"
                          width="6"
                          height="6"
                          rx="1"
                        />

                        <rect
                          x="14"
                          y="14"
                          width="6"
                          height="6"
                          rx="1"
                        />
                      </svg>
                    }

                    @case ('resources') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5v-13Z"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                        />
                      </svg>
                    }

                    @case ('organization') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
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
                          d="M8 8h1M8 11h1M8 14h1M15 8h1M15 11h1M15 14h1"
                        />
                      </svg>
                    }

                    @case ('submission') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M5 4h14v16H5z"
                        />

                        <path
                          stroke-linecap="round"
                          d="M8 9h8M8 13h8M8 17h5"
                        />
                      </svg>
                    }

                    @case ('jobs') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <rect
                          x="3"
                          y="7"
                          width="18"
                          height="13"
                          rx="2"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />

                        <path
                          stroke-linecap="round"
                          d="M3 12h18"
                        />
                      </svg>
                    }

                    @case ('community') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16 11a4 4 0 1 0-8 0"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3 21a7 7 0 0 1 14 0"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M17 7a3 3 0 1 1 0 6"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 21a5 5 0 0 0-3-4.58"
                        />
                      </svg>
                    }

                    @case ('users') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
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
                    }

                    @case ('resource-types') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
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
                    }

                    @case ('locations') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
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
                    }

                    @case ('test-center') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
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

                        <path
                          stroke-linecap="round"
                          d="M9 10h6M9 14h6M9 18h4"
                        />
                      </svg>
                    }

                    @case ('contact') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
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
                    }

                    @case ('business') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
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
                          d="M8 8h1M8 11h1M8 14h1M15 8h1M15 11h1M15 14h1"
                        />
                      </svg>
                    }

                    @case ('configuration') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="h-6 w-6"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="3.5"
                        />

                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.56-1.03H6.4v-2.55h.14A1.7 1.7 0 0 0 8.1 10.4a1.7 1.7 0 0 0-.34-1.88L7.7 8.46l1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5.4h2.55v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.14v2.55h-.14A1.7 1.7 0 0 0 19.4 15Z"
                        />
                      </svg>
                    }

                  }

                </div>

                <!-- =================================================
                     CARD CONTENT
                     ================================================= -->
                <div class="mt-0 sm:mt-5">

                  <h2
                    class="text-md
                           font-semibold
                           leading-tight
                           text-[#032D42]
                           sm:text-xl
                           sm:leading-normal
                           group-hover:text-[#007979]"
                  >
                    {{ card.title }}
                  </h2>

                  <!-- Description hidden on mobile -->
                  <p
                    class="hidden
                           sm:mt-2
                           sm:block
                           sm:text-md
                           sm:leading-6
                           text-gray-500"
                  >
                    {{ card.description }}
                  </p>

                </div>

                <!-- =================================================
                     ACTION
                     ================================================= -->
                <div
                  class="mt-1.5
                         text-md
                         font-semibold
                         leading-tight
                         text-[#007979]
                         sm:mt-5
                         sm:text-sm"
                >
                  {{ card.actionLabel }} →
                </div>

              </a>
            }

          </div>

        </section>

      </main>

    </div>
  `,
})
export class AdminDashboardComponent {

  // ============================================================
  // SERVICES
  // ============================================================

  /**
   * Firebase authentication service.
   */
  protected readonly authService =
    inject(AuthService);

  /**
   * Location store.
   *
   * Kept here because the dashboard currently owns
   * location creation functionality.
   */
  private readonly locationStore =
    inject(LocationStore);

  /**
   * Angular router.
   */
  private readonly router =
    inject(Router);

  /**
   * Toast notification service.
   */
  private readonly toast =
    inject(HotToastService);

  /**
   * Page title service.
   */
  private readonly pageTitleService =
    inject(PageTitleService);

  // ============================================================
  // ADMIN MANAGEMENT CARDS
  // ============================================================

  /**
   * Central configuration for the Admin Dashboard
   * management cards.
   *
   * The template renders these cards dynamically with
   * Angular's @for control flow.
   *
   * Adding a new administration feature should generally
   * require adding a new object here rather than duplicating
   * card markup in the template.
   */
  protected readonly managementCards:
    AdminDashboardCard[] = [

      {
        title: 'Categories',
        description:
          'Create and manage resource categories.',
        route: '/admin/categories',
        actionLabel: 'Manage',
        icon: 'category',
      },

      {
        title: 'Resources',
        description:
          'Create, edit, publish, and manage resources.',
        route: '/admin/resources',
        actionLabel: 'Manage',
        icon: 'resources',
      },

      {
        title: 'Organizations',
        description:
          'Manage organizations associated with resources.',
        route: '/admin/organizations',
        actionLabel: 'Manage',
        icon: 'organization',
      },

      {
        title: 'Submissions',
        description:
          'Review and manage submitted resources.',
        route: '/admin/submissions',
        actionLabel: 'Manage',
        icon: 'submission',
      },

      {
        title: 'Jobs',
        description:
          'Manage job opportunities available through the Zebron Job Finder.',
        route: '/admin/jobs',
        actionLabel: 'Manage jobs',
        icon: 'jobs',
      },

      {
        title: 'Community',
        description:
          'Manage community posts, topics, comments, and moderation.',
        route: '/community',
        actionLabel: 'Manage community',
        icon: 'community',
      },

      {
        title: 'Users',
        description:
          'Manage user accounts, profiles, roles, and permissions.',
        route: '/admin/users',
        actionLabel: 'Manage users',
        icon: 'users',
      },

      {
        title: 'Resource Types',
        description:
          'Manage the types used to classify resources across Zebron.',
        route: '/admin/resource-types',
        actionLabel: 'Manage resource types',
        icon: 'resource-types',
      },

      {
        title: 'Locations',
        description:
          'Manage locations used by resources and location-based personalization.',
        route: '/admin/locations',
        actionLabel: 'Manage locations',
        icon: 'locations',
      },

      {
        title: 'Test Center',
        description:
          'Manage test courses, topics, questions, and question banks.',
        route: '/admin/test-center',
        actionLabel: 'Open Test Center',
        icon: 'test-center',
      },

      {
        title: 'Contact Mailbox',
        description:
          'Review and manage messages submitted through the contact form.',
        route: '/admin/contact',
        actionLabel: 'Open mailbox',
        icon: 'contact',
      },

      {
        title: 'Business Operations',
        description:
          'Manage business finances, revenue, expenses, compliance, activities, documents, and reports.',
        route: '/admin/business',
        actionLabel: 'Open Business Operations',
        icon: 'business',
      },

      {
        title: 'Configuration',
        description:
          'Manage system settings, platform configuration, and administrative options.',
        route: '/admin/configuration',
        actionLabel: 'Manage configuration',
        icon: 'configuration',
      },
    ];

  // ============================================================
  // LOCATION STATE
  // ============================================================

  /**
   * Prevent duplicate location submissions.
   */
  protected readonly savingLocation =
    signal(false);

  /**
   * Location creation form.
   *
   * Kept for compatibility with the existing
   * dashboard location functionality.
   */
  protected locationForm:
    Partial<Location> = {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      latitude: undefined,
      longitude: undefined,
    };

  // ============================================================
  // UI STATE
  // ============================================================

  /**
   * Prevent duplicate sign-out requests.
   */
  protected readonly signingOut =
    signal(false);

  /**
   * Controls the mobile dashboard
   * three-dot menu.
   */
  protected readonly moreMenuOpen =
    signal(false);

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor() {
    this.pageTitleService.setTitle(
      'Admin Dashboard',
    );
  }

  // ============================================================
  // MOBILE MENU
  // ============================================================

  /**
   * Toggle the mobile dashboard menu.
   */
  protected toggleMoreMenu(): void {
    this.moreMenuOpen.update(
      (open) => !open,
    );
  }

  /**
   * Close the mobile dashboard menu.
   */
  protected closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  // ============================================================
  // LOCATION MANAGEMENT
  // ============================================================

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
        address:
          this.locationForm.address?.trim() ||
          '',

        city:
          this.locationForm.city!.trim(),

        state:
          this.locationForm.state!.trim(),

        zipCode:
          this.locationForm.zipCode!.trim(),

        country:
          this.locationForm.country!.trim(),

        ...(this.locationForm.latitude !==
          undefined &&
        this.locationForm.latitude !==
          null
          ? {
              latitude: Number(
                this.locationForm.latitude,
              ),
            }
          : {}),

        ...(this.locationForm.longitude !==
          undefined &&
        this.locationForm.longitude !==
          null
          ? {
              longitude: Number(
                this.locationForm.longitude,
              ),
            }
          : {}),
      };

      await this.locationStore.createLocation(
        location,
      );

      this.toast.success(
        'Location created successfully.',
      );

      this.clearLocationForm();

    } catch (error) {

      console.error(
        'Failed to create location:',
        error,
      );

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

  // ============================================================
  // AUTHENTICATION
  // ============================================================

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
      await this.router.navigateByUrl(
        '/login',
      );

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