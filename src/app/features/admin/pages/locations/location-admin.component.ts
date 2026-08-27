import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Location } from '../../../../core/models/location.model';
import { LocationService } from '../../../../core/services/location.service';

import { HotToastService } from '@ngxpert/hot-toast';


@Component({
  selector: 'app-location-admin',

  standalone: true,

  imports: [
    FormsModule,
    RouterLink,
  ],

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


        <a
          routerLink="/admin"
          class="shrink-0
                 rounded-lg
                 border
                 border-gray-300
                 bg-white
                 px-3
                 py-2
                 text-sm
                 font-semibold
                 text-gray-700
                 transition
                 hover:border-[#032D42]
                 hover:text-[#032D42]"
        >
          Admin Dashboard
        </a>

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
               py-6
               sm:px-6
               lg:px-8"
      >

        <!-- ===================================================
             TWO COLUMN ADMIN LAYOUT
             =================================================== -->
        <div
          class="grid
                 gap-6
                 lg:grid-cols-3"
        >


          <!-- ================================================
               CREATE / EDIT FORM
               ================================================ -->
          <section
            class="rounded-2xl
                   border
                   border-gray-200
                   bg-white
                   shadow-sm
                   lg:col-span-2"
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
                    {{ editingId()
                      ? 'Update Location'
                      : 'Add a New Location' }}
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


                @if (editingId()) {

                  <button
                    type="button"
                    (click)="cancelEdit()"
                    class="shrink-0
                           text-sm
                           font-semibold
                           text-[#007979]
                           hover:text-[#032D42]"
                  >
                    Cancel edit
                  </button>

                }

              </div>

            </div>


            <!-- Form -->
            <form
              (ngSubmit)="saveLocation()"
              class="space-y-5
                     p-5
                     sm:p-6"
            >

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

                  <label
                    for="state"
                    class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    [(ngModel)]="form.state"
                    placeholder="MD"
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

                <div
                  class="mb-2"
                >

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
                       flex-col-reverse
                       gap-3
                       border-t
                       border-gray-100
                       pt-5
                       sm:flex-row
                       sm:items-center
                       sm:justify-end"
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

            </form>

          </section>


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
                class="border-b
                       border-gray-200
                       bg-gray-50
                       px-5
                       py-4"
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
                             text-gray-500"
                    >
                      Select a location to edit or delete it.
                    </p>

                  </div>


                  @if (!loading()) {

                    <span
                      class="shrink-0
                             rounded-full
                             bg-[#007979]/10
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
                       p-4"
              >

                <label
                  for="location-search"
                  class="sr-only"
                >
                  Search locations
                </label>

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

                        <circle
                          cx="12"
                          cy="9"
                          r="2.25"
                        />

                      </svg>

                    </div>


                    <p
                      class="mt-3
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

                  <div
                    class="space-y-3"
                  >

                    @for (
                      location of filteredLocations();
                      track location.id
                    ) {

                      <article
                        class="rounded-xl
                               border
                               border-gray-200
                               bg-white
                               p-4
                               transition
                               hover:border-[#007979]/30
                               hover:shadow-sm"
                      >

                        <div
                          class="flex
                                 items-start
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


                          <!-- Location information -->
                          <div
                            class="min-w-0
                                   flex-1"
                          >

                            <h3
                              class="font-semibold
                                     text-[#032D42]"
                            >
                              {{ location.city || 'Location' }}
                            </h3>

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
export class LocationAdminComponent
  implements OnInit {

  private readonly locationService =
    inject(LocationService);

  private readonly toast =
    inject(HotToastService);


  protected readonly locations =
    signal<Location[]>([]);

  protected readonly loading =
    signal(false);

  protected readonly saving =
    signal(false);

  protected readonly searchTerm =
    signal('');

  protected readonly editingId =
    signal<string | null>(null);


  protected form: Partial<Location> =
    this.emptyForm();


  protected readonly filteredLocations =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      if (!search) {
        return this.locations();
      }

      return this.locations().filter(
        (location) => {

          return (
            location.address
              ?.toLowerCase()
              .includes(search) ||

            location.city
              ?.toLowerCase()
              .includes(search) ||

            location.state
              ?.toLowerCase()
              .includes(search) ||

            location.zipCode
              ?.toLowerCase()
              .includes(search) ||

            location.country
              ?.toLowerCase()
              .includes(search)
          );
        }
      );
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

      const locations =
        await this.locationService.getAllLocations();

      this.locations.set(locations);

    } catch (error) {

      console.error(
        'Failed to load locations:',
        error,
      );

      this.toast.error(
        'Unable to load locations.',
      );

    } finally {

      this.loading.set(false);

    }
  }


  /**
   * Search locations.
   */
  protected onSearch(
    event: Event,
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value,
    );
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

    const city =
      this.form.city?.trim() || '';

    const state =
      this.form.state?.trim() || '';

    const zipCode =
      this.form.zipCode?.trim() || '';

    const country =
      this.form.country?.trim() || '';

    if (
      !city ||
      !state ||
      !zipCode ||
      !country
    ) {

      this.toast.error(
        'Please complete the city, state, ZIP code, and country.',
      );

      return;
    }


    if (this.saving()) {
      return;
    }


    this.saving.set(true);


    try {

      const location: Location = {

        address:
          this.form.address?.trim() || '',

        city,

        state,

        zipCode,

        country,

        ...(this.form.latitude != null
          ? {
              latitude:
                Number(this.form.latitude),
            }
          : {}),

        ...(this.form.longitude != null
          ? {
              longitude:
                Number(this.form.longitude),
            }
          : {}),
      };


      const id =
        this.editingId();


      if (id) {

        await this.locationService.updateLocation(
          id,
          location,
        );

        this.toast.success(
          'Location updated successfully.',
        );

      } else {

        await this.locationService.createLocation(
          location,
        );

        this.toast.success(
          'Location created successfully.',
        );

      }


      this.clearForm();

      await this.loadLocations();

    } catch (error) {

      console.error(
        'Failed to save location:',
        error,
      );

      this.toast.error(
        'Unable to save location.',
      );

    } finally {

      this.saving.set(false);

    }
  }


  /**
   * Load a location into the form for editing.
   */
  protected editLocation(
    location: Location,
  ): void {

    if (!location.id) {
      return;
    }


    this.editingId.set(
      location.id,
    );


    this.form = {

      address:
        location.address || '',

      city:
        location.city || '',

      state:
        location.state || '',

      zipCode:
        location.zipCode || '',

      country:
        location.country || 'United States',

      latitude:
        location.latitude,

      longitude:
        location.longitude,
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
  protected async deleteLocation(
    location: Location,
  ): Promise<void> {

    if (!location.id) {
      return;
    }


    const name =
      [
        location.city,
        location.state,
        location.zipCode,
      ]
        .filter(Boolean)
        .join(', ');


    const confirmed =
      window.confirm(
        `Delete the location "${name || 'Location'}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await this.locationService.deleteLocation(
        location.id,
      );


      if (
        this.editingId() === location.id
      ) {
        this.clearForm();
      }


      this.toast.success(
        'Location deleted successfully.',
      );


      await this.loadLocations();

    } catch (error) {

      console.error(
        'Failed to delete location:',
        error,
      );

      this.toast.error(
        'Unable to delete location.',
      );
    }
  }


  /**
   * Reset the form.
   */
  protected clearForm(): void {

    this.form =
      this.emptyForm();

    this.editingId.set(null);
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

}
