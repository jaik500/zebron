import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Location } from '../../../../core/models/location.model';
import { LocationService } from '../../../../core/services/location.service';

import { HotToastService } from '@ngxpert/hot-toast';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-location-admin',

  standalone: true,

  imports: [FormsModule, RouterLink, MatDividerModule, MatIconModule, MatMenuModule],

  template: `
    <!-- =====================================================
         ADMIN HEADER
         ===================================================== -->
    <header
      class="border-b border-gray-200
             bg-[#032D42]"
    >
      <div
        class="mx-auto flex max-w-7xl
               items-center justify-between
               gap-4 px-4 py-4
               sm:px-6
               lg:px-8"
      >
        <div>
          <p
            class="text-xs
                   font-semibold
                   uppercase
                   tracking-wider
                   text-[#7ED6D1]"
          >
            Location management
          </p>

          <h1
            class="text-xl
                   font-bold
                   text-white
                   sm:text-3xl"
          >
            Locations
          </h1>

          <p
            class="mt-1
                   text-sm
                   text-white/80"
          >
            Create and manage locations in the Zebron database.
          </p>
        </div>

        <!-- =====================================================
     Admin Header Actions
     Desktop:
       Admin Dashboard + 3-dot menu

     Mobile:
       3-dot menu only
     ===================================================== -->
        <div
          class="flex shrink-0
         items-center
         gap-2"
        >
          <!-- Admin Dashboard
       Hidden on mobile -->
          <a
            routerLink="/admin"
            class="hidden
           rounded-lg
           border border-gray-300
           bg-white
           px-3 py-2
           text-sm
           font-semibold
           text-gray-700
           transition
           hover:border-[#032D42]
           hover:text-[#032D42]
           sm:inline-flex"
          >
            Admin Dashboard
          </a>

          <!-- =====================================================
       Three-dot navigation menu
       ===================================================== -->
          <button
            type="button"
            [matMenuTriggerFor]="adminMenu"
            aria-label="Open navigation menu"
            class="flex
           h-10
           w-10
           shrink-0
           items-center
           justify-center
           rounded-full
           text-white
           transition
           hover:bg-white/10
           focus:outline-none
           focus:ring-2
           focus:ring-white/30"
          >
            <mat-icon
              aria-hidden="true"
              class="!m-0
             !h-6
             !w-6
             !text-[26px]"
            >
              more_vert
            </mat-icon>
          </button>
        </div>

        <mat-menu #adminMenu="matMenu" xPosition="before" yPosition="below">
          <!-- Home -->
          <button mat-menu-item routerLink="/">
            <mat-icon>home</mat-icon>
            <span>Home</span>
          </button>

          <!-- Dashboard -->
          <button mat-menu-item routerLink="/admin">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </button>

          <!-- Categories -->
          <button mat-menu-item routerLink="/admin/categories">
            <mat-icon>category</mat-icon>
            <span>Categories</span>
          </button>

          <!-- Submissions -->
          <button mat-menu-item routerLink="/admin/submissions">
            <mat-icon>assignment</mat-icon>
            <span>Submissions</span>
          </button>

          <!-- Users -->
          <button mat-menu-item routerLink="/admin/users">
            <mat-icon>group</mat-icon>
            <span>Users</span>
          </button>

          <!-- Resource Types -->
          <button mat-menu-item routerLink="/admin/resource-types">
            <mat-icon>list_alt</mat-icon>
            <span>Resource Types</span>
          </button>

          <!-- Locations -->
          <button mat-menu-item routerLink="/admin/resources">
            <mat-icon>library_books</mat-icon>
            <span>Resources</span>
          </button>

          <!-- Mailbox -->
          <button mat-menu-item routerLink="/admin/contact">
            <mat-icon>mail</mat-icon>
            <span>Mailbox</span>
          </button>

          <mat-divider></mat-divider>

          <!-- Sign out -->
          <button mat-menu-item type="button" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </header>

    <!-- =====================================================
         PAGE CONTENT
         ===================================================== -->
    <main
      class="min-h-screen
             bg-gray-50"
    >
      <div
        class="mx-auto
               max-w-7xl
               px-4
               py-2
               sm:px-6
               lg:px-8"
      >
        <!-- ===================================================
             TWO COLUMN ADMIN LAYOUT
             =================================================== -->
        <div
          class="grid
                 items-start
                 gap-6
                 lg:grid-cols-3"
        >
          <!-- ================================================
               CREATE / EDIT FORM
               ================================================ -->
          <div class="lg:col-span-2">
            <section
              class="overflow-hidden
                     rounded-2xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
            <!-- Form header -->
            <div
              class="border-b
                     border-gray-100
                     px-5
                     py-4
                     sm:px-6"
            >
              <div
                class="flex
                       items-start
                       justify-between
                       gap-4"
              >
                <div>
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wider
                           text-[#007979]"
                  >
                    {{ editingId() ? 'Edit location' : 'Create location' }}
                  </p>

                  <h2
                    class="mt-1
                           text-lg
                           font-semibold
                           text-[#032D42]"
                  >
                    {{ editingId() ? 'Update Location' : 'Add a New Location' }}
                  </h2>

                  <p
                    class="mt-1
                           text-sm
                           text-gray-500"
                  >
                    {{
                      editingId()
                        ? 'Update the selected location details.'
                        : 'Enter the location details below.'
                    }}
                  </p>
                </div>

                <!-- =====================================================
     Form Header Actions
     ===================================================== -->

                @if (editingId()) {
                  <!-- Edit mode -->
                  <div
                    class="flex shrink-0
           flex-col
           items-stretch
           gap-1.5
           sm:flex-row
           sm:items-center"
                  >
                    <!-- Cancel -->
                    <button
                      type="button"
                      (click)="cancelEdit()"
                      [disabled]="saving()"
                      class="rounded-md
             border border-gray-300
             bg-white
             px-2.5 py-1
             text-[11px]
             font-medium
             text-gray-700
             transition
             hover:border-[#007979]/40
             hover:bg-[#007979]/5
             focus:outline-none
             disabled:cursor-not-allowed
             disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <!-- Update -->
                    <button
                      type="submit"
                      form="locationForm"
                      [disabled]="saving()"
                      class="rounded-md
             bg-[#007979]
             px-2.5 py-1
             text-[11px]
             font-semibold
             text-white
             transition
             hover:bg-[#032D42]
             focus:outline-none
             disabled:cursor-not-allowed
             disabled:opacity-50"
                    >
                      {{ saving() ? 'Saving...' : 'Update' }}
                    </button>

                    <!-- Editing -->
                    <span
                      class="hidden
             rounded-full
             bg-[#007979]/10
             px-2.5 py-1
             text-[11px]
             font-semibold
             text-[#007979]
             sm:inline-flex"
                    >
                      Editing
                    </span>
                  </div>
                } @else {
                  <!-- Create mode: Hide / Show form -->
                  <button
                    type="button"
                    (click)="toggleLocationForm()"
                    [attr.aria-expanded]="showLocationForm()"
                    [attr.aria-label]="
                      showLocationForm() ? 'Hide location form' : 'Show location form'
                    "
                    class="inline-flex
           shrink-0
           items-center
           gap-1
           border-0
           bg-transparent
           p-0
           text-xs
           font-semibold
           text-[#007979]
           transition
           hover:text-[#032D42]
           focus:outline-none"
                  >
                    <span>
                      {{ showLocationForm() ? 'Hide' : 'Show' }}
                    </span>

                    <mat-icon
                      aria-hidden="true"
                      class="!m-0
             !h-4
             !w-4
             !text-[18px]"
                    >
                      {{ showLocationForm() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                    </mat-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Form -->
            <form
              id="locationForm"
              class="space-y-1 p-5 sm:p-6"
              (ngSubmit)="saveLocation()"
            >

              @if (editingId() || showLocationForm()) {
             
                <!-- Address -->
                <div>
                  <label
                    for="address"
                    class="block
                         text-sm
                         font-semibold
                         text-[#032D42]"
                  >
                    Address
                  </label>

                  <input
                    id="address"
                    name="address"
                    type="text"
                    [(ngModel)]="form.address"
                    placeholder="123 Main Street"
                    class="mt-1.5
                         block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3.5
                         py-2.5
                         text-sm
                         text-gray-900
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                  />
                </div>

                <!-- City / State -->
                <div
                  class="grid
                       gap-4
                       sm:grid-cols-2"
                >
                  <div>
                    <label
                      for="city"
                      class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      [(ngModel)]="form.city"
                      placeholder="Upper Marlboro"
                      required
                      class="mt-1.5
                           block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3.5
                           py-2.5
                           text-sm
                           text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                    />
                  </div>

                  <div>
                    <label for="county" class="block text-sm font-semibold text-[#032D42]">
                      County
                    </label>

                    <input
                      id="county"
                      name="county"
                      type="text"
                      [(ngModel)]="form.county"
                      placeholder="County"
                      class="mt-1.5
           block
           w-full
           rounded-lg
           border
           border-gray-200
           bg-white
           px-3.5
           py-2.5
           text-sm
           text-gray-700
           focus:border-[#007979]
           focus:outline-none
           focus:ring-2
           focus:ring-[#007979]/20"
                    />
                  </div>

                  <div>
                    <label
                      for="state"
                      class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                    >
                      State/Province/Region
                    </label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      [(ngModel)]="form.state"
                      placeholder="MD"
                      class="mt-1.5
                           block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3.5
                           py-2.5
                           text-sm
                           text-gray-900
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
                  class="grid
                       gap-4
                       sm:grid-cols-2"
                >
                  <div>
                    <label
                      for="zipCode"
                      class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                    >
                      ZIP Code
                    </label>

                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      [(ngModel)]="form.zipCode"
                      placeholder="20774"
                      class="mt-1.5
                           block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3.5
                           py-2.5
                           text-sm
                           text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                    />
                  </div>

                  <div>
                    <label
                      for="country"
                      class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                    >
                      Country
                    </label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      [(ngModel)]="form.country"
                      placeholder="United States"
                      required
                      class="mt-1.5
                           block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3.5
                           py-2.5
                           text-sm
                           text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                    />
                  </div>
                </div>

                <!-- Coordinates -->
                <div>
                  <div class="mb-2">
                    <p
                      class="text-sm
                           font-semibold
                           text-[#032D42]"
                    >
                      Coordinates
                    </p>

                    <p
                      class="mt-0.5
                           text-xs
                           text-gray-500"
                    >
                      Optional. Useful for location-based personalization.
                    </p>
                  </div>

                  <div
                    class="grid
                         gap-4
                         sm:grid-cols-2"
                  >
                    <div>
                      <label
                        for="latitude"
                        class="block
                             text-xs
                             font-medium
                             text-gray-600"
                      >
                        Latitude
                      </label>

                      <input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        [(ngModel)]="form.latitude"
                        placeholder="38.8151"
                        class="mt-1.5
                             block
                             w-full
                             rounded-lg
                             border
                             border-gray-300
                             bg-white
                             px-3.5
                             py-2.5
                             text-sm
                             text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                      />
                    </div>

                    <div>
                      <label
                        for="longitude"
                        class="block
                             text-xs
                             font-medium
                             text-gray-600"
                      >
                        Longitude
                      </label>

                      <input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        [(ngModel)]="form.longitude"
                        placeholder="-76.7497"
                        class="mt-1.5
                             block
                             w-full
                             rounded-lg
                             border
                             border-gray-300
                             bg-white
                             px-3.5
                             py-2.5
                             text-sm
                             text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                      />
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div
                  class="flex
         flex-row
         items-center
         justify-end
         gap-2
         border-t
         border-gray-100
         pt-5"
                >
                  <button
                    type="button"
                    (click)="clearForm()"
                    [disabled]="saving()"
                    class="rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-4
                         py-2.5
                         text-sm
                         font-semibold
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
                    [disabled]="saving()"
                    class="rounded-lg
                         bg-[#007979]
                         px-5
                         py-2.5
                         text-sm
                         font-semibold
                         text-white
                         transition
                         hover:bg-[#032D42]
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                  >
                    @if (saving()) {
                      Saving...
                    } @else {
                      {{ editingId() ? 'Update Location' : 'Create Location' }}
                    }
                  </button>
                </div>

              }
            </form>
            </section>
          </div>

          <!-- ================================================
               DIRECTORY
               ================================================ -->
          <aside
            class="lg:sticky
                   lg:top-6
                   lg:self-start"
          >
            <section
              class="overflow-hidden
                     rounded-2xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <!-- Directory header -->
              <div
                  class="border-b border-gray-200 bg-[#66BB6A]/80
                   px-5 py-2"
                >
                <div
                  class="flex
                         items-start
                         justify-between
                         gap-3"
                >
                  <div>
                    <p
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wider
                             text-[#007979]"
                    >
                      Directory
                    </p>

                    <h2
                      class="mt-1
                             text-lg
                             font-semibold
                             text-[#032D42]"
                    >
                      Existing locations
                    </h2>

                    <p
                      class="mt-1
                             text-sm
                             leading-5
                             text-white"
                    >
                      Select a location to edit or delete it.
                    </p>
                  </div>

                  @if (!loading()) {
                    <span
                      class="shrink-0
                             rounded-full
                             bg-gray-100
                             px-2.5
                             py-1
                             text-xs
                             font-bold
                             text-[#007979]"
                    >
                      {{ locations().length }}
                    </span>
                  }
                </div>
              </div>

              <!-- Search -->
              <div
                class="border-b
                       border-gray-100
                       px-4 py-1"
              >
                <label for="location-search" class="sr-only"> Search locations </label>

                <input
                  id="location-search"
                  name="locationSearch"
                  type="search"
                  [value]="searchTerm()"
                  (input)="onSearch($event)"
                  placeholder="Search locations..."
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3.5
                         py-2.5
                         text-sm
                         text-gray-900
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />
              </div>

              <!-- Directory content -->
              <div
                class="max-h-[calc(100vh-280px)]
                       overflow-y-auto
                       p-4"
              >
                @if (loading()) {
                  <div
                    class="py-8
                           text-center
                           text-sm
                           text-gray-500"
                  >
                    Loading locations...
                  </div>
                } @else if (filteredLocations().length === 0) {
                  <div
                    class="rounded-xl
                           border
                           border-dashed
                           border-gray-300
                           p-6
                           text-center"
                  >
                    <div
                      class="mx-auto
                             flex
                             h-10
                             w-10
                             items-center
                             justify-center
                             rounded-full
                             bg-gray-100
                             text-gray-500"
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

                        <circle cx="12" cy="9" r="2.25" />
                      </svg>
                    </div>

                    <p
                      class="mt-2
                             text-sm
                             font-semibold
                             text-gray-700"
                    >
                      @if (searchTerm()) {
                        No matching locations
                      } @else {
                        No locations yet
                      }
                    </p>

                    @if (searchTerm()) {
                      <button
                        type="button"
                        (click)="clearSearch()"
                        class="mt-2
                               text-sm
                               font-semibold
                               text-[#007979]
                               hover:text-[#032D42]"
                      >
                        Clear search
                      </button>
                    }
                  </div>
                } @else {
                  <div class="space-y-1">
                    @for (location of filteredLocations(); track location.id) {
                      <article
                        class="rounded-xl
                        border border-gray-200
                        bg-white
                        px-4 py-2
                        transition
                        hover:border-[#007979]/30
                        hover:shadow-sm"
                      >
                        <div
                          class="flex items-start
           gap-3"
                        >
                          <!-- Location icon -->
                          <div
                            class="flex
             h-9
             w-9
             shrink-0
             items-center
             justify-center
             rounded-lg
             bg-[#007979]/10
             text-[#007979]"
                          >
                            <!-- Keep your existing location SVG here -->
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
                              <circle cx="12" cy="9" r="2.25" />
                            </svg>
                          </div>

                          <!-- Location content -->
                          <div
                            class="min-w-0
             flex-1"
                          >
                            <!-- =====================================================
           Location name + Show / Hide
           ===================================================== -->
                            <div
                              class="flex items-center
               justify-between
               gap-3"
                            >
                              <h3
                                class="min-w-0
                 truncate
                 font-semibold
                 text-[#032D42]"
                              >
                                {{ location.city || 'Location' }}
                              </h3>

                              <button
                                type="button"
                                (click)="toggleExistingLocation(location.id!)"
                                [attr.aria-expanded]="isExistingLocationExpanded(location.id!)"
                                class="inline-flex
                 shrink-0
                 items-center
                 gap-1
                 border-0
                 bg-transparent
                 p-0
                 text-xs
                 font-semibold
                 text-[#007979]
                 transition
                 hover:text-[#032D42]
                 focus:outline-none"
                              >
                                <span>
                                  {{ isExistingLocationExpanded(location.id!) ? 'Hide' : 'Show' }}
                                </span>

                                <span aria-hidden="true" class="text-base leading-none">
                                  {{ isExistingLocationExpanded(location.id!) ? '▲' : '▼' }}
                                </span>
                              </button>
                            </div>

                            <!-- =====================================================
           Existing location details
           ===================================================== -->
                            @if (isExistingLocationExpanded(location.id!)) {
                              <!-- State / ZIP -->
                              <p
                                class="mt-0.5
                 text-sm
                 text-gray-500"
                              >
                                {{ location.state || '' }}

                                @if (location.zipCode) {
                                  {{ location.zipCode }}
                                }
                              </p>

                              <!-- Address -->
                              @if (location.address) {
                                <p
                                  class="mt-2
                   text-sm
                   leading-5
                   text-gray-600"
                                >
                                  {{ location.address }}
                                </p>
                              }

                              <!-- Country -->
                              <p
                                class="mt-0.5
                 text-sm
                 text-gray-600"
                              >
                                {{ location.country }}
                              </p>

                              <!-- Actions -->
                              <div
                                class="mt-3
                 flex
                 items-center
                 gap-2"
                              >
                                <button
                                  type="button"
                                  (click)="editLocation(location)"
                                  class="rounded-lg
                   bg-[#007979]/10
                   px-3
                   py-1.5
                   text-xs
                   font-semibold
                   text-[#007979]
                   transition
                   hover:bg-[#007979]
                   hover:text-white"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  (click)="deleteLocation(location)"
                                  class="rounded-lg
                   px-3
                   py-1.5
                   text-xs
                   font-semibold
                   text-red-600
                   transition
                   hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            }
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                }
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  `,
})
export class LocationAdminComponent implements OnInit {
  private readonly locationService = inject(LocationService);

  private readonly authService = inject(AuthService);

  private readonly toast = inject(HotToastService);

  protected readonly locations = signal<Location[]>([]);

  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly searchTerm = signal('');

  protected readonly editingId = signal<string | null>(null);

  // =========================================================
  // Location Form Visibility
  // =========================================================

  /**
   * Controls whether the location form fields
   * are visible.
   *
   * The form starts open by default.
   */
  protected readonly showLocationForm = signal(true);

  /**
   * Toggle the location form fields.
   */
  protected toggleLocationForm(): void {
    this.showLocationForm.update((visible) => !visible);
  }

  // =========================================================
  // Existing Location Expand / Collapse State
  // =========================================================

  /**
   * Tracks which existing location records are expanded.
   */
  protected readonly expandedLocations = signal<Set<string>>(new Set());

  /**
   * Toggle the details for one existing location.
   */
  protected toggleExistingLocation(locationId: string): void {
    this.expandedLocations.update((expanded) => {
      const next = new Set(expanded);

      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }

      return next;
    });
  }

  /**
   * Determine whether an existing location
   * is currently expanded.
   */
  protected isExistingLocationExpanded(locationId: string): boolean {
    return this.expandedLocations().has(locationId);
  }

  protected form: Partial<Location> = this.emptyForm();

  protected readonly filteredLocations = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.locations();
    }

    return this.locations().filter((location) => {
      return (
        location.address?.toLowerCase().includes(search) ||
        location.city?.toLowerCase().includes(search) ||
        location.state?.toLowerCase().includes(search) ||
        location.zipCode?.toLowerCase().includes(search) ||
        location.country?.toLowerCase().includes(search)
      );
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadLocations();
  }

  /**
   * Load all locations.
   */
  private async loadLocations(): Promise<void> {
    this.loading.set(true);

    try {
      const locations = await this.locationService.getAllLocations();

      this.locations.set(locations);
    } catch (error) {
      console.error('Failed to load locations:', error);

      this.toast.error('Unable to load locations.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search locations.
   */
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  /**
   * Clear search.
   */
  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Save a new or existing location.
   */
  protected async saveLocation(): Promise<void> {
    // =========================================================
    // Basic validation
    // =========================================================

    const address = this.form.address?.trim() || '';

    const city = this.form.city?.trim() || '';

    const county = this.form.county?.trim() || '';

    const state = this.form.state?.trim() || '';

    const zipCode = this.form.zipCode?.trim() || '';

    const country = this.form.country?.trim() || '';

    if (!address) {
      this.toast.error('Address is required.');
      return;
    }

    if (!city) {
      this.toast.error('City is required.');
      return;
    }

    if (!country) {
      this.toast.error('Country is required.');
      return;
    }

    // =========================================================
    // U.S.-specific validation
    // =========================================================

    const normalizedCountry = country.toLowerCase();

    const isUnitedStates =
      normalizedCountry === 'united states' ||
      normalizedCountry === 'usa' ||
      normalizedCountry === 'us';

    if (isUnitedStates && !state) {
      this.toast.error('State is required for United States locations.');
      return;
    }

    if (isUnitedStates && !zipCode) {
      this.toast.error('ZIP Code is required for United States locations.');
      return;
    }

    // =========================================================
    // Build location
    // =========================================================

    const location: Location = {
      address,
      city,
      county,
      state,
      zipCode,
      country,

      ...(this.form.latitude != null
        ? {
            latitude: Number(this.form.latitude),
          }
        : {}),

      ...(this.form.longitude != null
        ? {
            longitude: Number(this.form.longitude),
          }
        : {}),
    };

    // =========================================================
    // Save
    // =========================================================

    this.saving.set(true);

    const editingId = this.editingId();

    try {
      if (editingId) {
        await this.locationService.updateLocation(editingId, location);

        this.toast.success('Location updated successfully.');
      } else {
        await this.locationService.createLocation(location);

        this.toast.success('Location created successfully.');
      }

      this.clearForm();

      await this.loadLocations();
    } catch (error) {
      console.error('Failed to save location:', error);

      this.toast.error(editingId ? 'Unable to update location.' : 'Unable to create location.');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Load a location into the form for editing.
   */
  protected editLocation(location: Location): void {
    if (!location.id) {
      return;
    }

    this.editingId.set(location.id);

    this.form = {
      address: location.address || '',

      city: location.city || '',

      state: location.state || '',

      zipCode: location.zipCode || '',

      country: location.country || 'United States',

      latitude: location.latitude,

      longitude: location.longitude,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Cancel editing.
   */
  protected cancelEdit(): void {
    this.clearForm();
  }

  /**
   * Delete a location.
   */
  protected async deleteLocation(location: Location): Promise<void> {
    if (!location.id) {
      return;
    }

    const name = [location.city, location.state, location.zipCode].filter(Boolean).join(', ');

    const confirmed = window.confirm(`Delete the location "${name || 'Location'}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.locationService.deleteLocation(location.id);

      if (this.editingId() === location.id) {
        this.clearForm();
      }

      this.toast.success('Location deleted successfully.');

      await this.loadLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);

      this.toast.error('Unable to delete location.');
    }
  }

  /**
   * Reset the form.
   */
 protected clearForm(): void {
  this.form =
    this.emptyForm();

  this.editingId.set(null);

  // Always reopen the create form after
  // canceling or completing an action.
  this.showLocationForm.set(true);
}

  /**
   * Create a clean form object.
   */
  private emptyForm(): Partial<Location> {
    return {
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
   * Sign the current administrator out.
   */
  protected async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Failed to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    }
  }
}
