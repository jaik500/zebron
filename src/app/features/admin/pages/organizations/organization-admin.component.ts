import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Organization } from '../../../../core/models/organization.model';
import { OrganizationService } from '../../../../core/services/organization.service';
import { LocationService } from '../../../../core/services/location.service';
import { Location } from '../../../../core/models/location.model';

@Component({
  selector: 'app-organization-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-6xl p-8">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/admin" class="text-sm text-gray-600 hover:text-gray-900">
            ← Admin Dashboard
          </a>

          <h1 class="mt-3 text-3xl font-bold text-gray-900">Organizations</h1>

          <p class="mt-2 text-gray-600">
            Create and manage organizations associated with resources.
          </p>
        </div>
      </div>

      <!-- Organization form -->
      <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ editingId() ? 'Edit organization' : 'Create organization' }}
        </h2>

        <form class="mt-6 space-y-5" (ngSubmit)="saveOrganization()">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Organization name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              [(ngModel)]="form.name"
              required
              placeholder="Maryland Food Bank"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <!-- Slug -->
          <div>
            <label for="slug" class="block text-sm font-medium text-gray-700"> Slug </label>

            <input
              id="slug"
              name="slug"
              type="text"
              [(ngModel)]="form.slug"
              required
              placeholder="maryland-food-bank"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows="3"
              [(ngModel)]="form.description"
              placeholder="Organization description"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            ></textarea>
          </div>

          <!-- Website -->
          <div>
            <label for="website" class="block text-sm font-medium text-gray-700"> Website </label>

            <input
              id="website"
              name="website"
              type="url"
              [(ngModel)]="form.website"
              placeholder="https://example.org"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700"> Phone </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              [(ngModel)]="form.phone"
              placeholder="301-555-1234"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"> Email </label>

            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="form.email"
              placeholder="info@example.org"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <!-- Location -->
          <div class="border-t border-gray-200 pt-5">
            <h3 class="font-semibold text-gray-900">Location</h3>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label for="address" class="block text-sm font-medium text-gray-700">
                  Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  [(ngModel)]="form.address"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label for="city" class="block text-sm font-medium text-gray-700"> City </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  [(ngModel)]="form.city"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label for="state" class="block text-sm font-medium text-gray-700"> State </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  [(ngModel)]="form.state"
                  placeholder="MD"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label for="zipCode" class="block text-sm font-medium text-gray-700">
                  ZIP code
                </label>

                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  [(ngModel)]="form.zipCode"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label for="country" class="block text-sm font-medium text-gray-700">
                  Country
                </label>

                <input
                  id="country"
                  name="country"
                  type="text"
                  [(ngModel)]="form.country"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="flex flex-wrap gap-6 border-t border-gray-200 pt-5">
            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                name="verified"
                [(ngModel)]="form.verified"
                class="h-4 w-4 rounded border-gray-300"
              />

              <span class="text-sm text-gray-700"> Verified organization </span>
            </label>

            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                name="active"
                [(ngModel)]="form.active"
                class="h-4 w-4 rounded border-gray-300"
              />

              <span class="text-sm text-gray-700"> Active organization </span>
            </label>
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-[#032D42] px-5 py-2 text-sm font-medium text-white hover:bg-[#032D42]/90 disabled:opacity-50"
            >
              {{
                saving() ? 'Saving...' : editingId() ? 'Update organization' : 'Create organization'
              }}
            </button>

            @if (editingId()) {
              <button
                type="button"
                (click)="cancelEdit()"
                class="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
            }
          </div>
        </form>
      </section>

      <!-- Organization list -->
      <section class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Existing organizations</h2>

          @if (loading()) {
            <span class="text-sm text-gray-500">Loading...</span>
          }
        </div>

        @if (!loading() && organizations().length === 0) {
          <div class="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
            No organizations found.
          </div>
        }

        @if (organizations().length > 0) {
          <div
            class="mt-4 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            @for (organization of organizations(); track organization.id) {
              <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex items-center gap-3">
                    <h3 class="font-semibold text-gray-900">
                      {{ organization.name }}
                    </h3>

                    @if (organization.verified) {
                      <span
                        class="rounded-full bg-[#007979]/10 px-2 py-1 text-xs font-medium text-[#007979]"
                      >
                        Verified
                      </span>
                    }

                    <span
                      class="rounded-full px-2 py-1 text-xs font-medium"
                      [class.bg-green-100]="organization.active"
                      [class.text-green-700]="organization.active"
                      [class.bg-gray-100]="!organization.active"
                      [class.text-gray-600]="!organization.active"
                    >
                      {{ organization.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ organization.slug }}
                  </p>

                  @if (organization.description) {
                    <p class="mt-2 text-sm text-gray-600">
                      {{ organization.description }}
                    </p>
                  }
                </div>

                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="editOrganization(organization)"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    (click)="deleteOrganization(organization)"
                    class="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </main>
  `,
})
export class OrganizationAdminComponent implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  private readonly locationService = inject(LocationService);

  protected readonly organizations = signal<Organization[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected form = {
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

  ngOnInit(): void {
    this.loadOrganizations();
  }

  private async loadOrganizations(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const organizations = await this.organizationService.getAllOrganizations();

      this.organizations.set(organizations);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      this.error.set('Unable to load organizations. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveOrganization(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);

    try {
      const organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
        name: this.form.name.trim(),
        slug: this.form.slug.trim().toLowerCase(),
        verified: this.form.verified,
        active: this.form.active,
      };

      // Only include optional fields when they contain a value.
      const description = this.form.description.trim();
      const website = this.form.website.trim();
      const phone = this.form.phone.trim();
      const email = this.form.email.trim();

      if (description) {
        organization.description = description;
      }

      if (website) {
        organization.website = website;
      }

      if (phone) {
        organization.phone = phone;
      }

      if (email) {
        organization.email = email;
      }

      /*
       * Location is stored separately in the locations collection.
       *
       * The organization only stores the location document ID.
       */
      const address = this.form.address.trim();
      const city = this.form.city.trim();
      const state = this.form.state.trim();
      const zipCode = this.form.zipCode.trim();
      const country = this.form.country.trim();

      const hasLocation = address || city || state || zipCode || country;

      if (hasLocation) {
        const location: Location = {
          country: country || 'United States',
        };

        // Avoid sending undefined values to Firestore.
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

        const editingId = this.editingId();

        if (editingId) {
          /*
           * When editing, update the existing location if one exists.
           */
          const existingOrganization = this.organizations().find((item) => item.id === editingId);

          if (existingOrganization?.locationId) {
            await this.locationService.updateLocation(existingOrganization.locationId, location);

            organization.locationId = existingOrganization.locationId;
          } else {
            /*
             * Existing organization has no location yet,
             * so create one.
             */
            const locationId = await this.locationService.createLocation(location);

            organization.locationId = locationId;
          }
        } else {
          /*
           * Creating a new organization:
           * create the location first, then store its ID.
           */
          const locationId = await this.locationService.createLocation(location);

          organization.locationId = locationId;
        }
      }

      const editingId = this.editingId();

      if (editingId) {
        await this.organizationService.updateOrganization(editingId, organization);
      } else {
        await this.organizationService.createOrganization(organization);
      }

      this.resetForm();
      await this.loadOrganizations();
    } catch (error) {
      console.error('Failed to save organization:', error);

      this.error.set(
        `Unable to save organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected async editOrganization(organization: Organization): Promise<void> {
    this.editingId.set(organization.id);

    this.form = {
      name: organization.name,
      slug: organization.slug,
      description: organization.description ?? '',
      website: organization.website ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',

      // Start with empty location fields.
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',

      verified: organization.verified,
      active: organization.active,
    };

    /*
     * Load the referenced location.
     */
    if (organization.locationId) {
      try {
        const location = await this.locationService.getLocationById(organization.locationId);

        if (location) {
          this.form = {
            ...this.form,
            address: location.address ?? '',
            city: location.city ?? '',
            state: location.state ?? '',
            zipCode: location.zipCode ?? '',
            country: location.country || 'United States',
          };
        }
      } catch (error) {
        console.error('Failed to load organization location:', error);

        this.error.set('Unable to load the organization location.');
      }
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected async deleteOrganization(organization: Organization): Promise<void> {
    const confirmed = window.confirm(`Delete the organization "${organization.name}"?`);

    if (!confirmed) {
      return;
    }

    this.error.set(null);

    try {
      await this.organizationService.deleteOrganization(organization.id);

      if (this.editingId() === organization.id) {
        this.resetForm();
      }

      await this.loadOrganizations();
    } catch (error) {
      console.error('Failed to delete organization:', error);

      this.error.set('Unable to delete organization. Please try again.');
    }
  }

  private resetForm(): void {
    this.editingId.set(null);

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
}
