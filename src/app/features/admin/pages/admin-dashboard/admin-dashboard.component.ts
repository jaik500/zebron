import {
  Component,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LocationService } from '../../../../core/services/location.service';
import { Location } from '../../../../core/models/location.model';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
  ],

  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- =========================================================
           ADMIN DASHBOARD HEADER
           ========================================================= -->
      <header
        class="border-b border-gray-200 bg-[#032D42]"
      >

        <div
          class="mx-auto flex max-w-7xl
                 items-center justify-between
                 gap-4 p-5
                 sm:px-6 lg:px-8"
        >

          <!-- =====================================================
               DASHBOARD TITLE
               ===================================================== -->
          <div class="min-w-0">

            <p
              class="text-xs font-semibold uppercase
                     tracking-wider text-[#7ED6D1]"
            >
              Zebron Administration
            </p>

            <h1
              class="text-xl font-bold text-white
                     sm:text-3xl"
            >
              Admin Dashboard
            </h1>

            <p
              class="mt-1 text-sm text-white/80"
            >
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
              class="hidden items-center gap-3 sm:flex"
            >

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
            <div
              class="relative sm:hidden"
            >

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


                  <!-- View site -->
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
                      View site
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
          class="bg-[#032D42]/5 px-6 py-1"
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
               px-4 sm:p-2"
      >

        <!-- =======================================================
             MANAGE CONTENT
             ======================================================= -->
        <section class="mt-1">

          <div>

            <h2
              class="text-xl font-semibold
                     text-[#032D42]"
            >
              Manage content
            </h2>

          </div>


          <!-- =====================================================
               MANAGEMENT CARDS
               ===================================================== -->
          <div
            class="mt-2 grid gap-6
                   sm:grid-cols-2
                   lg:grid-cols-4"
          >

            <!-- ===================================================
                 CATEGORIES
                 =================================================== -->
            <a
              routerLink="/admin/categories"
              class="group rounded-xl
                     border border-gray-200
                     bg-white px-6 py-3
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md"
            >

              <h3
                class="text-lg font-semibold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Categories
              </h3>

              <p
                class="mt-2 text-sm text-gray-600"
              >
                Create and manage resource categories.
              </p>

              <span
                class="mt-4 inline-block
                       text-sm font-semibold
                       text-[#007979]"
              >
                Manage →
              </span>

            </a>


            <!-- ===================================================
                 RESOURCES
                 =================================================== -->
            <a
              routerLink="/admin/resources"
              class="group rounded-xl
                     border border-gray-200
                     bg-white p-6 py-3
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md"
            >

              <h3
                class="text-lg font-semibold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Resources
              </h3>

              <p
                class="mt-2 text-sm text-gray-600"
              >
                Create, edit, publish, and manage resources.
              </p>

              <span
                class="mt-4 inline-block
                       text-sm font-semibold
                       text-[#007979]"
              >
                Manage →
              </span>

            </a>


            <!-- ===================================================
                 ORGANIZATIONS
                 =================================================== -->
            <a
              routerLink="/admin/organizations"
              class="group rounded-xl
                     border border-gray-200
                     bg-white p-6 py-3
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md"
            >

              <h3
                class="text-lg font-semibold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Organizations
              </h3>

              <p
                class="mt-2 text-sm text-gray-600"
              >
                Manage organizations associated with resources.
              </p>

              <span
                class="mt-4 inline-block
                       text-sm font-semibold
                       text-[#007979]"
              >
                Manage →
              </span>

            </a>


            <!-- ===================================================
                 SUBMISSIONS
                 =================================================== -->
            <a
              routerLink="/admin/submissions"
              class="group rounded-xl
                     border border-gray-200
                     bg-white p-6 py-3
                     shadow-sm transition
                     hover:border-[#032D42]/40
                     hover:shadow-md"
            >

              <h3
                class="text-lg font-semibold
                       text-[#032D42]
                       group-hover:text-[#007979]"
              >
                Submissions
              </h3>

              <p
                class="mt-2 text-sm text-gray-600"
              >
                Review and manage submitted resources.
              </p>

              <span
                class="mt-4 inline-block
                       text-sm font-semibold
                       text-[#007979]"
              >
                Manage →
              </span>

            </a>


            <!-- ===================================================
                 USERS
                 =================================================== -->
            <a
              routerLink="/admin/users"
              class="group rounded-2xl
                     border border-gray-200
                     bg-white p-6
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md"
            >

              <div
                class="flex h-12 w-12
                       items-center justify-center
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


              <div class="mt-5">

                <h2
                  class="text-lg font-semibold
                         text-[#032D42]
                         group-hover:text-[#007979]"
                >
                  Users
                </h2>

                <p
                  class="mt-2 text-sm
                         leading-6 text-gray-500"
                >
                  Manage user accounts, profiles, roles, and permissions.
                </p>

              </div>


              <div
                class="mt-5 text-sm font-semibold
                       text-[#007979]"
              >
                Manage users →
              </div>

            </a>


            <!-- ===================================================
                 CONTACT MAILBOX
                 =================================================== -->
            <a
              routerLink="/admin/contact"
              class="group rounded-2xl
                     border border-gray-200
                     bg-white p-6
                     shadow-sm transition
                     hover:-translate-y-0.5
                     hover:border-[#007979]/30
                     hover:shadow-md"
            >

              <div
                class="flex h-12 w-12
                       items-center justify-center
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


              <div class="mt-5">

                <h2
                  class="text-lg font-semibold
                         text-[#032D42]
                         group-hover:text-[#007979]"
                >
                  Contact Mailbox
                </h2>

                <p
                  class="mt-2 text-sm
                         leading-6 text-gray-500"
                >
                  Review and manage messages submitted through the contact form.
                </p>

              </div>


              <div
                class="mt-5 text-sm font-semibold
                       text-[#007979]"
              >
                Open mailbox →
              </div>

            </a>

          </div>

        </section>


        <!-- =========================================================
             LOCATION MANAGEMENT
             ========================================================= -->
        <section class="mt-8">

          <div class="mb-4">

            <h2
              class="text-xl font-semibold text-[#032D42]"
            >
              Locations
            </h2>

            <p
              class="mt-1 text-sm text-gray-600"
            >
              Create and manage locations that can be assigned to resources.
            </p>

          </div>


          <div
            class="grid gap-6
                   lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
          >

            <!-- =====================================================
                 CREATE LOCATION
                 ===================================================== -->
            <div
              class="rounded-2xl
                     border border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     sm:p-6"
            >

              <div class="mb-5">

                <div
                  class="flex h-11 w-11
                         items-center justify-center
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
                    class="h-5 w-5"
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


                <h3
                  class="mt-4 text-lg font-semibold
                         text-[#032D42]"
                >
                  Create location
                </h3>

                <p
                  class="mt-1 text-sm text-gray-500"
                >
                  Add a location that can be assigned to resources.
                </p>

              </div>


              <form
                (ngSubmit)="createLocation()"
                class="space-y-4"
              >

                <!-- Address -->
                <div>

                  <label
                    for="location-address"
                    class="block text-sm font-medium
                           text-gray-700"
                  >
                    Address
                  </label>

                  <input
                    id="location-address"
                    name="locationAddress"
                    type="text"
                    [(ngModel)]="locationForm.address"
                    placeholder="123 Main Street"
                    class="mt-1.5 block w-full
                           rounded-lg
                           border border-gray-300
                           bg-white
                           px-3.5 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />

                </div>


                <!-- City / State -->
                <div
                  class="grid grid-cols-1 gap-4
                         sm:grid-cols-2"
                >

                  <div>

                    <label
                      for="location-city"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      City
                    </label>

                    <input
                      id="location-city"
                      name="locationCity"
                      type="text"
                      [(ngModel)]="locationForm.city"
                      placeholder="Upper Marlboro"
                      required
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <div>

                    <label
                      for="location-state"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      State
                    </label>

                    <input
                      id="location-state"
                      name="locationState"
                      type="text"
                      [(ngModel)]="locationForm.state"
                      placeholder="MD"
                      required
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>

                </div>


                <!-- ZIP / Country -->
                <div
                  class="grid grid-cols-1 gap-4
                         sm:grid-cols-2"
                >

                  <div>

                    <label
                      for="location-zip"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      ZIP Code
                    </label>

                    <input
                      id="location-zip"
                      name="locationZip"
                      type="text"
                      [(ngModel)]="locationForm.zipCode"
                      placeholder="20774"
                      required
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <div>

                    <label
                      for="location-country"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      Country
                    </label>

                    <input
                      id="location-country"
                      name="locationCountry"
                      type="text"
                      [(ngModel)]="locationForm.country"
                      required
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>

                </div>


                <!-- Coordinates -->
                <div
                  class="grid grid-cols-1 gap-4
                         sm:grid-cols-2"
                >

                  <div>

                    <label
                      for="location-latitude"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      Latitude
                      <span class="font-normal text-gray-400">
                        optional
                      </span>
                    </label>

                    <input
                      id="location-latitude"
                      name="locationLatitude"
                      type="number"
                      step="any"
                      [(ngModel)]="locationForm.latitude"
                      placeholder="38.9072"
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <div>

                    <label
                      for="location-longitude"
                      class="block text-sm font-medium
                             text-gray-700"
                    >
                      Longitude
                      <span class="font-normal text-gray-400">
                        optional
                      </span>
                    </label>

                    <input
                      id="location-longitude"
                      name="locationLongitude"
                      type="number"
                      step="any"
                      [(ngModel)]="locationForm.longitude"
                      placeholder="-76.8645"
                      class="mt-1.5 block w-full
                             rounded-lg
                             border border-gray-300
                             bg-white
                             px-3.5 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>

                </div>


                <!-- Actions -->
                <div
                  class="flex items-center
                         justify-end gap-3
                         border-t border-gray-100
                         pt-4"
                >

                  <button
                    type="button"
                    (click)="clearLocationForm()"
                    [disabled]="savingLocation()"
                    class="rounded-lg
                           border border-gray-300
                           bg-white
                           px-4 py-2.5
                           text-sm font-semibold
                           text-gray-700
                           transition
                           hover:bg-gray-50
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                  >
                    Clear
                  </button>


                  <button
                    type="submit"
                    [disabled]="savingLocation()"
                    class="rounded-lg
                           bg-[#007979]
                           px-4 py-2.5
                           text-sm font-semibold
                           text-white
                           transition
                           hover:bg-[#032D42]
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                  >

                    @if (savingLocation()) {
                      Creating...
                    } @else {
                      Create location
                    }

                  </button>

                </div>

              </form>

            </div>


            <!-- =====================================================
                 LOCATION INFORMATION
                 ===================================================== -->
            <div
              class="rounded-2xl
                     border border-gray-200
                     bg-white
                     p-5
                     shadow-sm
                     sm:p-6"
            >

              <div class="mb-5">

                <h3
                  class="text-lg font-semibold
                         text-[#032D42]"
                >
                  Location management
                </h3>

                <p
                  class="mt-1 text-sm text-gray-500"
                >
                  Locations created here become available in
                  the Resource Admin location dropdown.
                </p>

              </div>


              <div
                class="rounded-lg
                       border border-[#007979]/10
                       bg-[#007979]/5
                       p-4"
              >

                <div
                  class="flex gap-3"
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    class="mt-0.5 h-5 w-5
                           shrink-0 text-[#007979]"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path
                      stroke-linecap="round"
                      d="M12 10v6"
                    />

                    <circle
                      cx="12"
                      cy="7"
                      r=".7"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>

                  <p
                    class="text-sm leading-6
                           text-[#032D42]/80"
                  >
                    After creating a location, open the Resource
                    Admin form and select it from the Location
                    dropdown.
                  </p>

                </div>

              </div>

            </div>

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
  protected readonly authService =
    inject(AuthService);


  /**
   * Location service used to create
   * resource locations.
   */
  private readonly locationService =
    inject(LocationService);


  /**
   * Prevent duplicate location submissions.
   */
  protected readonly savingLocation =
    signal(false);


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
  private readonly router =
    inject(Router);


  /**
   * Toast notification service.
   */
  private readonly toast =
    inject(HotToastService);


  /**
   * Prevent duplicate sign-out requests
   * while Firebase processes the request.
   */
  protected readonly signingOut =
    signal(false);


  /**
   * Controls the mobile dashboard
   * three-dot menu.
   */
  protected readonly moreMenuOpen =
    signal(false);


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
        'Please complete the city, state, ZIP code, and country.'
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
          this.locationForm.address?.trim() || '',

        city:
          this.locationForm.city!.trim(),

        state:
          this.locationForm.state!.trim(),

        zipCode:
          this.locationForm.zipCode!.trim(),

        country:
          this.locationForm.country!.trim(),

        ...(this.locationForm.latitude !== undefined &&
        this.locationForm.latitude !== null
          ? {
              latitude:
                Number(this.locationForm.latitude),
            }
          : {}),

        ...(this.locationForm.longitude !== undefined &&
        this.locationForm.longitude !== null
          ? {
              longitude:
                Number(this.locationForm.longitude),
            }
          : {}),
      };


      await this.locationService.createLocation(
        location
      );


      this.toast.success(
        'Location created successfully.'
      );


      this.clearLocationForm();

    } catch (error) {

      console.error(
        'Failed to create location:',
        error
      );


      this.toast.error(
        'Unable to create location. Please try again.'
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