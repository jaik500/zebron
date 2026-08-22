import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';

import { Organization } from '../../../../core/models/organization.model';
import { OrganizationService } from '../../../../core/services/organization.service';

import { Location } from '../../../../core/models/location.model';
import { LocationService } from '../../../../core/services/location.service';

@Component({
  selector: 'app-organization-admin',
  standalone: true,

  imports: [
    FormsModule,
    RouterLink,
  ],

  template: `
    <main class="mx-auto max-w-6xl p-6 sm:p-8">

      <!-- =========================================================
           Page header
           ========================================================= -->
      <div class="mb-4">
        <a
          routerLink="/admin"
          class="text-sm font-medium text-gray-500
                 transition hover:text-[#007979]"
        >
          ← Admin Dashboard
        </a>
      </div>

      <section
        class="rounded-2xl bg-[#032D42]
               px-6 py-5 text-white shadow-sm"
      >
        <p
          class="text-xs font-semibold uppercase
                 tracking-[0.15em] text-[#7DD3D3]"
        >
          Administration
        </p>

        <h1 class="mt-1 text-2xl font-bold tracking-tight">
          Organizations
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-6 text-white/75">
          Create and manage organizations associated with
          Zebron resources.
        </p>
      </section>


      <!-- =========================================================
           Main organization management area
           ========================================================= -->
      <section
        class="mt-4 rounded-2xl border border-gray-200
               bg-white shadow-sm"
      >

        <div class="grid gap-0 lg:grid-cols-3">

          <!-- =====================================================
               FORM
               ===================================================== -->
          <div class="lg:col-span-2 p-6 sm:p-8">

            <div
              class="flex flex-col gap-1
                     border-b border-gray-200 pb-5"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-[#007979]"
              >
                {{ editingId() ? 'Edit organization' : 'New organization' }}
              </p>

              <h2
                class="text-xl font-semibold text-[#032D42]"
              >
                {{
                  editingId()
                    ? 'Update organization'
                    : 'Create organization'
                }}
              </h2>

              <p class="text-sm text-gray-500">
                {{
                  editingId()
                    ? 'Update the organization details and location information.'
                    : 'Add an organization and its location information.'
                }}
              </p>
            </div>


            <!-- =================================================
                 Organization form
                 ================================================= -->
            <form
              class="mt-6 space-y-7"
              (ngSubmit)="saveOrganization()"
            >

              <!-- =================================================
                   Basic information
                   ================================================= -->
              <section>

                <div class="mb-4">
                  <h3
                    class="text-sm font-semibold text-gray-900"
                  >
                    Basic information
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    Core information used to identify the organization.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Organization name -->
                  <div class="sm:col-span-2">

                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Organization name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      [(ngModel)]="form.name"
                      (ngModelChange)="generateSlug()"
                      required
                      placeholder="Maryland Food Bank"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             bg-white px-4 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- Slug -->
                  <div class="sm:col-span-2">

                    <label
                      for="slug"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Slug
                    </label>

                    <input
                      id="slug"
                      name="slug"
                      type="text"
                      [(ngModel)]="form.slug"
                      required
                      placeholder="maryland-food-bank"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             bg-gray-50 px-4 py-2.5
                             text-sm text-gray-700
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                    <p class="mt-1.5 text-xs text-gray-500">
                      Automatically generated from the organization name.
                    </p>

                  </div>


                  <!-- Description -->
                  <div class="sm:col-span-2">

                    <label
                      for="description"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      [(ngModel)]="form.description"
                      placeholder="Describe the organization and the services it provides."
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    ></textarea>

                  </div>

                </div>

              </section>


              <!-- =================================================
                   Contact information
                   ================================================= -->
              <section
                class="border-t border-gray-200 pt-6"
              >

                <div class="mb-4">
                  <h3
                    class="text-sm font-semibold text-gray-900"
                  >
                    Contact information
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    Optional ways users can contact the organization.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Website -->
                  <div>

                    <label
                      for="website"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Website
                    </label>

                    <input
                      id="website"
                      name="website"
                      type="url"
                      [(ngModel)]="form.website"
                      placeholder="https://example.org"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- Phone -->
                  <div>

                    <label
                      for="phone"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      [(ngModel)]="form.phone"
                      placeholder="301-555-1234"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- Email -->
                  <div class="sm:col-span-2">

                    <label
                      for="email"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      [(ngModel)]="form.email"
                      placeholder="info@example.org"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>

                </div>

              </section>


              <!-- =================================================
                   Location
                   ================================================= -->
              <section
                class="border-t border-gray-200 pt-6"
              >

                <div class="mb-4">

                  <h3
                    class="text-sm font-semibold text-gray-900"
                  >
                    Location
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    The location is stored separately in the
                    <code>locations</code> collection and linked
                    to this organization.
                  </p>

                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Street address -->
                  <div class="sm:col-span-2">

                    <label
                      for="address"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Street address
                    </label>

                    <input
                      id="address"
                      name="address"
                      type="text"
                      [(ngModel)]="form.address"
                      placeholder="123 Main Street"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- City -->
                  <div>

                    <label
                      for="city"
                      class="block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      [(ngModel)]="form.city"
                      placeholder="Baltimore"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- State -->
                  <div>

                    <label
                      for="state"
                      class="block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      maxlength="2"
                      [(ngModel)]="form.state"
                      placeholder="MD"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             uppercase
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- ZIP -->
                  <div>

                    <label
                      for="zipCode"
                      class="block text-sm font-medium text-gray-700"
                    >
                      ZIP code
                    </label>

                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      [(ngModel)]="form.zipCode"
                      placeholder="21201"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>


                  <!-- Country -->
                  <div>

                    <label
                      for="country"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Country
                    </label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      [(ngModel)]="form.country"
                      placeholder="United States"
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             px-4 py-2.5 text-sm
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                  </div>

                </div>

              </section>


              <!-- =================================================
                   Status
                   ================================================= -->
              <section
                class="border-t border-gray-200 pt-6"
              >

                <div class="mb-4">
                  <h3
                    class="text-sm font-semibold text-gray-900"
                  >
                    Status
                  </h3>
                </div>

                <div class="flex flex-wrap gap-6">

                  <!-- Verified -->
                  <label
                    class="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      name="verified"
                      [(ngModel)]="form.verified"
                      class="h-4 w-4 rounded border-gray-300
                             text-[#007979]
                             focus:ring-[#007979]"
                    />

                    <span class="text-sm text-gray-700">
                      Verified organization
                    </span>
                  </label>


                  <!-- Active -->
                  <label
                    class="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      name="active"
                      [(ngModel)]="form.active"
                      class="h-4 w-4 rounded border-gray-300
                             text-[#007979]
                             focus:ring-[#007979]"
                    />

                    <span class="text-sm text-gray-700">
                      Active organization
                    </span>
                  </label>

                </div>

              </section>


              <!-- =================================================
                   Error
                   ================================================= -->
              @if (error()) {
                <div
                  class="rounded-lg border border-red-200
                         bg-red-50 px-4 py-3
                         text-sm text-red-700"
                >
                  {{ error() }}
                </div>
              }


              <!-- =================================================
                   Form actions
                   ================================================= -->
              <div
                class="flex flex-wrap items-center
                       gap-2 border-t border-gray-200 pt-6"
              >

                <button
                  type="submit"
                  [disabled]="saving()"
                  class="rounded-lg bg-[#032D42]
                         px-4 py-2 text-sm font-medium
                         text-white transition
                         hover:bg-[#032D42]/90
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  {{
                    saving()
                      ? 'Saving...'
                      : editingId()
                        ? 'Update organization'
                        : 'Create organization'
                  }}
                </button>


                @if (editingId()) {

                  <button
                    type="button"
                    (click)="cancelEdit()"
                    [disabled]="saving()"
                    class="rounded-lg border border-gray-300
                           bg-white px-4 py-2
                           text-sm font-medium text-gray-700
                           transition hover:bg-gray-50
                           disabled:opacity-50"
                  >
                    Cancel
                  </button>

                }

              </div>

            </form>

          </div>


          <!-- =====================================================
               EXISTING ORGANIZATIONS
               ===================================================== -->
          <aside
            class="border-t border-gray-200
                   bg-gray-50/60 lg:border-l lg:border-t-0"
          >

            <div class="p-6 sm:p-8">

              <!-- Directory header -->
              <div
                class="flex items-start justify-between gap-3"
              >

                <div>

                  <p
                    class="text-xs font-semibold uppercase
                           tracking-wide text-[#007979]"
                  >
                    Directory
                  </p>

                  <h2
                    class="mt-1 text-xl font-semibold
                           text-[#032D42]"
                  >
                    Existing organizations
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    Select an organization to edit or delete it.
                  </p>

                </div>


                @if (!loading()) {
                  <span
                    class="inline-flex min-w-7 items-center
                           justify-center rounded-full
                           bg-white px-2 py-1 text-xs
                           font-semibold text-gray-600
                           shadow-sm ring-1 ring-gray-200"
                  >
                    {{ organizations().length }}
                  </span>
                }

              </div>


              <!-- Loading -->
              @if (loading()) {

                <div
                  class="mt-6 rounded-xl border
                         border-gray-200 bg-white p-5"
                >
                  <p class="text-sm text-gray-500">
                    Loading organizations...
                  </p>
                </div>

              }


              <!-- Empty -->
              @if (!loading() && organizations().length === 0) {

                <div
                  class="mt-6 rounded-xl border
                         border-dashed border-gray-300
                         bg-white p-6 text-center"
                >
                  <p class="text-sm font-medium text-gray-700">
                    No organizations found.
                  </p>

                  <p class="mt-1 text-xs text-gray-500">
                    Create the first organization using the form.
                  </p>
                </div>

              }


              <!-- Organization list -->
              @if (organizations().length > 0) {

                <div
                  class="mt-6 overflow-hidden rounded-xl
                         border border-gray-200
                         bg-white shadow-sm"
                >

                  @for (
                    organization of organizations();
                    track organization.id
                  ) {

                    <div
                      class="border-b border-gray-200
                             p-4 last:border-b-0"
                    >

                      <!-- Organization name + active status -->
                      <div
                        class="flex items-start
                               justify-between gap-3"
                      >

                        <div class="min-w-0">

                          <h3
                            class="truncate text-sm font-semibold
                                   text-gray-900"
                          >
                            {{ organization.name }}
                          </h3>

                          <p
                            class="mt-1 truncate text-xs
                                   text-gray-500"
                          >
                            {{ organization.slug }}
                          </p>

                        </div>


                        <!-- Active stays top right -->
                        <span
                          class="shrink-0 rounded-full px-2
                                 py-1 text-xs font-medium"
                          [class.bg-green-100]="organization.active"
                          [class.text-green-700]="organization.active"
                          [class.bg-gray-100]="!organization.active"
                          [class.text-gray-600]="!organization.active"
                        >
                          {{
                            organization.active
                              ? 'Active'
                              : 'Inactive'
                          }}
                        </span>

                      </div>


                      <!-- Description -->
                      @if (organization.description) {

                        <p
                          class="mt-3 line-clamp-2
                                 text-sm leading-5
                                 text-gray-600"
                        >
                          {{ organization.description }}
                        </p>

                      }


                      <!-- Bottom status/actions -->
                      <div
                        class="mt-4 flex items-center
                               justify-between gap-3"
                      >

                        <!-- Verified stays far left -->
                        <div class="shrink-0">

                          @if (organization.verified) {

                            <span
                              class="inline-flex rounded-full
                                     bg-[#007979]/10
                                     px-2.5 py-1
                                     text-xs font-medium
                                     text-[#007979]"
                            >
                              Verified
                            </span>

                          } @else {

                            <span
                              class="inline-flex rounded-full
                                     bg-gray-100
                                     px-2.5 py-1
                                     text-xs font-medium
                                     text-gray-500"
                            >
                              Not verified
                            </span>

                          }

                        </div>


                        <!-- Actions stay far right -->
                        <div
                          class="flex shrink-0 gap-1.5"
                        >

                          <button
                            type="button"
                            (click)="editOrganization(organization)"
                            [disabled]="saving()"
                            class="rounded-md border
                                   border-gray-300
                                   bg-white px-2.5 py-1.5
                                   text-xs font-medium
                                   text-gray-700 transition
                                   hover:border-[#007979]/40
                                   hover:bg-[#007979]/5
                                   disabled:opacity-50"
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            (click)="deleteOrganization(organization)"
                            [disabled]="saving()"
                            class="rounded-md border
                                   border-red-200
                                   bg-white px-2.5 py-1.5
                                   text-xs font-medium
                                   text-red-600 transition
                                   hover:bg-red-50
                                   disabled:opacity-50"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>

                  }

                </div>

              }

            </div>

          </aside>

        </div>

      </section>

    </main>
  `,

})
export class OrganizationAdminComponent implements OnInit {

  // ===============================================================
  // Services
  // ===============================================================

  private readonly organizationService =
    inject(OrganizationService);

  private readonly locationService =
    inject(LocationService);

  private readonly toast =
    inject(HotToastService);


  // ===============================================================
  // State
  // ===============================================================

  protected readonly organizations =
    signal<Organization[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly saving =
    signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected readonly editingId =
    signal<string | null>(null);


  // ===============================================================
  // Form
  // ===============================================================

  protected form = {
    name: '',
    slug: '',
    description: '',
    website: '',
    phone: '',
    email: '',

    // Location fields are stored in the locations collection.
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',

    verified: false,
    active: true,
  };


  // ===============================================================
  // Lifecycle
  // ===============================================================

  ngOnInit(): void {
    void this.loadOrganizations();
  }


  // ===============================================================
  // Load organizations
  // ===============================================================

  private async loadOrganizations(): Promise<void> {

    this.loading.set(true);
    this.error.set(null);

    try {

      const organizations =
        await this.organizationService
          .getAllOrganizations();

      this.organizations.set(organizations);

    } catch (error) {

      console.error(
        'Failed to load organizations:',
        error,
      );

      this.error.set(
        'Unable to load organizations. Please try again.',
      );

    } finally {

      this.loading.set(false);

    }
  }


  // ===============================================================
  // Save organization
  // ===============================================================

  protected async saveOrganization(): Promise<void> {

    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {

      const organization:
        Omit<
          Organization,
          'id' | 'createdAt' | 'updatedAt'
        > = {

        name: this.form.name.trim(),

        slug: this.form.slug
          .trim()
          .toLowerCase(),

        verified: this.form.verified,

        active: this.form.active,
      };


      // -----------------------------------------------------------
      // Optional organization fields
      // -----------------------------------------------------------

      const description =
        this.form.description.trim();

      const website =
        this.form.website.trim();

      const phone =
        this.form.phone.trim();

      const email =
        this.form.email.trim();


      if (description) {
        organization.description =
          description;
      }

      if (website) {
        organization.website =
          website;
      }

      if (phone) {
        organization.phone =
          phone;
      }

      if (email) {
        organization.email =
          email;
      }


      // -----------------------------------------------------------
      // Location
      //
      // Locations are stored separately and the organization
      // stores only the locationId.
      // -----------------------------------------------------------

      const address =
        this.form.address.trim();

      const city =
        this.form.city.trim();

      const state =
        this.form.state.trim().toUpperCase();

      const zipCode =
        this.form.zipCode.trim();

      const country =
        this.form.country.trim();


      const hasLocation =
        !!(
          address ||
          city ||
          state ||
          zipCode
        );


      const editingId =
        this.editingId();


      if (hasLocation) {

        const location: Location = {
          country:
            country || 'United States',
        };


        // Only send fields that contain values.
        if (address) {
          location.address = address;
        }

        if (city) {
          location.city = city;
        }

        if (state) {
          location.state = state;
        }

        if (zipCode) {
          location.zipCode = zipCode;
        }


        if (editingId) {

          // Find the organization currently being edited.
          const existingOrganization =
            this.organizations().find(
              (item) =>
                item.id === editingId,
            );


          if (
            existingOrganization?.locationId
          ) {

            // Update the existing location.
            await this.locationService
              .updateLocation(
                existingOrganization.locationId,
                location,
              );

            organization.locationId =
              existingOrganization.locationId;

          } else {

            // Organization does not have a location yet.
            const locationId =
              await this.locationService
                .createLocation(location);

            organization.locationId =
              locationId;
          }

        } else {

          // New organization: create its location first.
          const locationId =
            await this.locationService
              .createLocation(location);

          organization.locationId =
            locationId;
        }

      }


      // -----------------------------------------------------------
      // Create / update organization
      // -----------------------------------------------------------

      if (editingId) {

        await this.organizationService
          .updateOrganization(
            editingId,
            organization,
          );

        this.toast.success(
          'Organization updated successfully.',
        );

      } else {

        await this.organizationService
          .createOrganization(
            organization,
          );

        this.toast.success(
          'Organization created successfully.',
        );

      }


      // Clear the form and refresh the directory.
      this.resetForm();

      await this.loadOrganizations();

    } catch (error) {

      console.error(
        'Failed to save organization:',
        error,
      );

      this.toast.error(
        'Unable to save organization. Please try again.',
      );

    } finally {

      this.saving.set(false);

    }
  }


  // ===============================================================
  // Edit organization
  // ===============================================================

  protected async editOrganization(
    organization: Organization,
  ): Promise<void> {

    this.error.set(null);

    this.editingId.set(
      organization.id,
    );


    // Start by loading the organization fields.
    this.form = {

      name: organization.name,

      slug: organization.slug,

      description:
        organization.description ?? '',

      website:
        organization.website ?? '',

      phone:
        organization.phone ?? '',

      email:
        organization.email ?? '',


      // Location starts empty and is populated below.
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',

      verified:
        organization.verified,

      active:
        organization.active,
    };


    // -----------------------------------------------------------
    // Load the linked location
    // -----------------------------------------------------------

    if (organization.locationId) {

      try {

        const location =
          await this.locationService
            .getLocationById(
              organization.locationId,
            );


        if (location) {

          this.form = {

            ...this.form,

            address:
              location.address ?? '',

            city:
              location.city ?? '',

            state:
              location.state ?? '',

            zipCode:
              location.zipCode ?? '',

            country:
              location.country ||
              'United States',
          };

        }

      } catch (error) {

        console.error(
          'Failed to load organization location:',
          error,
        );

        this.error.set(
          'Unable to load the organization location.',
        );

      }

    }


    // Bring the form into view.
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  // ===============================================================
  // Cancel editing
  // ===============================================================

  protected cancelEdit(): void {
    this.resetForm();
  }



  // ===============================================================
  // Confirm deletion
  // ===============================================================

/**
 * Show a Hot Toast confirmation before deleting
 * an organization.
 */
protected deleteOrganization(
  organization: Organization,
): void {
  this.toast.show(
    DeleteConfirmationComponent,
    {
      position: 'top-center',

      // Keep the confirmation open until the user
      // chooses Cancel or Delete.
      autoClose: false,
      dismissible: false,

      theme: 'toast',

      // The Hot Toast itself is the confirmation card.
       style: {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        padding: '20px',
        marginTop: '70px',
        background: '#FBF5DD',
        color: '#032D42',
      },

      data: {
        title: 'Delete organization?',
        message:
          `${organization.name} will be permanently deleted.`,

        onConfirm: async () => {
          await this.confirmDeleteOrganization(
            organization,
          );
        },
      },
    },
  );
}

/**
 * Delete the organization and its associated location.
 */
private async confirmDeleteOrganization(
  organization: Organization,
): Promise<void> {

  if (this.saving()) {
    return;
  }

  this.error.set(null);
  this.saving.set(true);

  try {

    // Delete the organization first.
    await this.organizationService
      .deleteOrganization(
        organization.id,
      );


    // Delete the associated location.
    if (organization.locationId) {

      await this.locationService
        .deleteLocation(
          organization.locationId,
        );

    }


    // If this organization was being edited,
    // clear the form.
    if (
      this.editingId() ===
      organization.id
    ) {
      this.resetForm();
    }


    // Refresh the directory.
    await this.loadOrganizations();


    // Tell the administrator the operation succeeded.
    this.toast.success(
      'Organization deleted successfully.',
    );

  } catch (error) {

    console.error(
      'Failed to delete organization:',
      error,
    );

    this.error.set(
      'Unable to delete organization. Please try again.',
    );

    this.toast.error(
      'Unable to delete organization. Please try again.',
    );

  } finally {

    this.saving.set(false);

  }
}


  // ===============================================================
  // Reset form
  // ===============================================================

  private resetForm(): void {

    this.editingId.set(null);

    this.error.set(null);

    this.form = {

      name: '',
      slug: '',
      description: '',
      website: '',
      phone: '',
      email: '',

      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',

      verified: false,
      active: true,
    };
  }


  // ===============================================================
  // Generate slug
  // ===============================================================

  /**
   * Generate a URL-friendly slug from the organization name.
   */
  protected generateSlug(): void {

    if (this.editingId()) {
      return;
    }


    this.form.slug =
      this.form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
  }
}