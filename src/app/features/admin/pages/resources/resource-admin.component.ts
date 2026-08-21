import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Resource,
  ResourceStatus,
  ResourceType,
} from '../../../../core/models/resource.model';

import { Category } from '../../../../core/models/category.model';

import { ResourceService } from '../../../../core/services/resource.service';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-resource-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-7xl p-8">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a
            routerLink="/admin"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Admin Dashboard
          </a>

          <h1 class="mt-3 text-3xl font-bold text-gray-900">
            Resources
          </h1>

          <p class="mt-2 text-gray-600">
            Create and manage resources in the Zebron database.
          </p>
        </div>
      </div>

      <!-- Resource form -->
      <section
        class="mt-8 rounded-xl border border-gray-200
               bg-white p-6 shadow-sm"
      >
        <h2 class="text-xl font-semibold text-gray-900">
          {{ editingId() ? 'Edit resource' : 'Create resource' }}
        </h2>

        <form
          class="mt-6 space-y-8"
          (ngSubmit)="saveResource()"
        >

          <!-- ========================= -->
          <!-- Basic Information -->
          <!-- ========================= -->

          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Basic information
            </h3>

            <div class="mt-4 grid gap-5 md:grid-cols-2">

              <!-- Name -->
              <div>
                <label
                  for="resourceName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>

                <input
                  id="resourceName"
                  name="name"
                  type="text"
                  [(ngModel)]="form.name"
                  (ngModelChange)="generateSlug()"
                  required
                  placeholder="Food Assistance"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2
                         focus:border-[#007979] focus:outline-none
                         focus:ring-2 focus:ring-[#007979]/20"
                />
              </div>

              <!-- Slug -->
              <div>
                <label
                  for="resourceSlug"
                  class="block text-sm font-medium text-gray-700"
                >
                  Slug
                </label>

                <input
                  id="resourceSlug"
                  name="slug"
                  type="text"
                  [(ngModel)]="form.slug"
                  required
                  placeholder="food-assistance"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2
                         focus:border-[#007979] focus:outline-none
                         focus:ring-2 focus:ring-[#007979]/20"
                />
              </div>

              <!-- Category -->
              <div>
                <label
                  for="categoryId"
                  class="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="categoryId"
                  name="categoryId"
                  [(ngModel)]="form.categoryId"
                  required
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2
                         bg-white focus:border-[#007979]
                         focus:outline-none focus:ring-2
                         focus:ring-[#007979]/20"
                >
                  <option value="">
                    Select a category
                  </option>

                  @for (category of categories(); track category.id) {
                    <option [value]="category.id">
                      {{ category.name }}
                    </option>
                  }
                </select>
              </div>

              <!-- Resource type -->
              <div>
                <label
                  for="resourceType"
                  class="block text-sm font-medium text-gray-700"
                >
                  Resource type
                </label>

                <select
                  id="resourceType"
                  name="resourceType"
                  [(ngModel)]="form.resourceType"
                  required
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2
                         bg-white focus:border-[#007979]
                         focus:outline-none focus:ring-2
                         focus:ring-[#007979]/20"
                >
                  @for (type of resourceTypes; track type) {
                    <option [value]="type">
                      {{ formatLabel(type) }}
                    </option>
                  }
                </select>
              </div>

            </div>

            <!-- Description -->
            <div class="mt-5">
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
                required
                placeholder="Describe this resource."
                class="mt-1 block w-full rounded-lg border
                       border-gray-300 px-4 py-2
                       focus:border-[#007979] focus:outline-none
                       focus:ring-2 focus:ring-[#007979]/20"
              ></textarea>
            </div>
          </div>

          <!-- ========================= -->
          <!-- Contact -->
          <!-- ========================= -->

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-900">
              Contact information
            </h3>

            <div class="mt-4 grid gap-5 md:grid-cols-2">

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
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2"
                />
              </div>

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
                  placeholder="555-555-5555"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2"
                />
              </div>

              <div>
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
                  placeholder="contact@example.org"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label
                  for="organizationId"
                  class="block text-sm font-medium text-gray-700"
                >
                  Organization ID
                </label>

                <input
                  id="organizationId"
                  name="organizationId"
                  type="text"
                  [(ngModel)]="form.organizationId"
                  placeholder="Optional"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2"
                />
              </div>

            </div>
          </div>

          <!-- ========================= -->
          <!-- Availability -->
          <!-- ========================= -->

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-900">
              Availability
            </h3>

            <div class="mt-4 space-y-4">

              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="online"
                  [(ngModel)]="form.online"
                  class="h-4 w-4 rounded border-gray-300"
                />

                <span class="text-sm text-gray-700">
                  Available online
                </span>
              </label>

              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="alwaysAvailable"
                  [(ngModel)]="form.alwaysAvailable"
                  class="h-4 w-4 rounded border-gray-300"
                />

                <span class="text-sm text-gray-700">
                  Always available
                </span>
              </label>

              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="byAppointment"
                  [(ngModel)]="form.byAppointment"
                  class="h-4 w-4 rounded border-gray-300"
                />

                <span class="text-sm text-gray-700">
                  By appointment
                </span>
              </label>

            </div>
          </div>

          <!-- ========================= -->
          <!-- Cost -->
          <!-- ========================= -->

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-900">
              Cost
            </h3>

            <label class="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                name="free"
                [(ngModel)]="form.free"
                class="h-4 w-4 rounded border-gray-300"
              />

              <span class="text-sm text-gray-700">
                Free service
              </span>
            </label>

            <div class="mt-4">
              <label
                for="costDescription"
                class="block text-sm font-medium text-gray-700"
              >
                Cost description
              </label>

              <input
                id="costDescription"
                name="costDescription"
                type="text"
                [(ngModel)]="form.costDescription"
                placeholder="Free for eligible residents."
                class="mt-1 block w-full rounded-lg border
                       border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <!-- ========================= -->
          <!-- Tags -->
          <!-- ========================= -->

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-900">
              Tags
            </h3>

            <input
              id="tags"
              name="tags"
              type="text"
              [(ngModel)]="form.tags"
              placeholder="food, assistance, community"
              class="mt-4 block w-full rounded-lg border
                     border-gray-300 px-4 py-2"
            />

            <p class="mt-1 text-xs text-gray-500">
              Separate tags with commas.
            </p>
          </div>

          <!-- ========================= -->
          <!-- Publishing -->
          <!-- ========================= -->

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-900">
              Publishing
            </h3>

            <div class="mt-4 grid gap-5 md:grid-cols-2">

              <div>
                <label
                  for="status"
                  class="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  [(ngModel)]="form.status"
                  class="mt-1 block w-full rounded-lg border
                         border-gray-300 px-4 py-2 bg-white"
                >
                  @for (status of resourceStatuses; track status) {
                    <option [value]="status">
                      {{ formatLabel(status) }}
                    </option>
                  }
                </select>
              </div>

              <div class="flex flex-col justify-end gap-4">

                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="verified"
                    [(ngModel)]="form.verified"
                    class="h-4 w-4 rounded border-gray-300"
                  />

                  <span class="text-sm text-gray-700">
                    Verified
                  </span>
                </label>

                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="featured"
                    [(ngModel)]="form.featured"
                    class="h-4 w-4 rounded border-gray-300"
                  />

                  <span class="text-sm text-gray-700">
                    Featured
                  </span>
                </label>

              </div>
            </div>
          </div>

          <!-- Error -->
          @if (error()) {
            <div
              class="rounded-lg border border-red-200
                     bg-red-50 p-4 text-sm text-red-700"
            >
              {{ error() }}
            </div>
          }

          <!-- Buttons -->
          <div class="flex flex-wrap gap-3">

            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-[#032D42] px-5 py-2
                     text-sm font-medium text-white
                     hover:bg-[#032D42]/90 disabled:opacity-50"
            >
              {{
                saving()
                  ? 'Saving...'
                  : editingId()
                    ? 'Update resource'
                    : 'Create resource'
              }}
            </button>

            @if (editingId()) {
              <button
                type="button"
                (click)="cancelEdit()"
                class="rounded-lg border border-gray-300
                       px-5 py-2 text-sm font-medium
                       text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            }

          </div>

        </form>
      </section>

      <!-- Existing resources -->
      <section class="mt-8">

        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            Existing resources
          </h2>

          @if (loading()) {
            <span class="text-sm text-gray-500">
              Loading...
            </span>
          }
        </div>

        @if (!loading() && resources().length === 0) {
          <div
            class="mt-4 rounded-xl border border-gray-200
                   bg-white p-6 text-gray-600"
          >
            No resources found.
          </div>
        }

        @if (resources().length > 0) {
          <div
            class="mt-4 overflow-hidden rounded-xl border
                   border-gray-200 bg-white shadow-sm"
          >
            <div class="divide-y divide-gray-200">

              @for (resource of resources(); track resource.id) {

                <div
                  class="flex flex-col gap-4 p-5
                         sm:flex-row sm:items-center
                         sm:justify-between"
                >

                  <div>
                    <div class="flex flex-wrap items-center gap-3">

                      <h3 class="font-semibold text-gray-900">
                        {{ resource.name }}
                      </h3>

                      <span
                        class="rounded-full bg-gray-100 px-2 py-1
                               text-xs font-medium text-gray-700"
                      >
                        {{ formatLabel(resource.status) }}
                      </span>

                      @if (resource.verified) {
                        <span
                          class="rounded-full bg-green-100 px-2 py-1
                                 text-xs font-medium text-green-700"
                        >
                          Verified
                        </span>
                      }

                    </div>

                    <p class="mt-1 text-sm text-gray-500">
                      {{ resource.slug }}
                    </p>

                    <p class="mt-2 text-sm text-gray-600">
                      {{ resource.description }}
                    </p>

                  </div>

                  <div class="flex gap-2">

                    <button
                      type="button"
                      (click)="editResource(resource)"
                      class="rounded-lg border border-gray-300
                             px-3 py-2 text-sm font-medium
                             text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteResource(resource)"
                      class="rounded-lg border border-red-200
                             px-3 py-2 text-sm font-medium
                             text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              }

            </div>
          </div>
        }

      </section>

    </main>
  `,
})
export class ResourceAdminComponent implements OnInit {
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);

  protected readonly resources = signal<Resource[]>([]);
  protected readonly categories = signal<Category[]>([]);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected readonly resourceTypes: ResourceType[] = [
    'government',
    'nonprofit',
    'education',
    'business',
    'community',
    'service',
    'tool',
    'other',
  ];

  protected readonly resourceStatuses: ResourceStatus[] = [
    'draft',
    'pending',
    'published',
    'archived',
  ];

  protected form = this.createEmptyForm();

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load resources and categories for the admin page.
   */
  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [resources, categories] = await Promise.all([
        this.resourceService.getAllResources(),
        this.categoryService.getAllCategories(),
      ]);

      this.resources.set(resources);
      this.categories.set(categories);
    } catch (error) {
      console.error('Failed to load resource admin data:', error);

      this.error.set(
        'Unable to load resources. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Automatically create a URL-friendly slug from the resource name.
   */
  protected generateSlug(): void {
    if (this.editingId()) {
      return;
    }

    this.form.slug = this.form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Save a new or existing resource.
   */
  protected async saveResource(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);

    try {
      const currentUser = this.authService.user();

      if (!currentUser) {
        throw new Error('You must be signed in.');
      }

      const resource = {
        name: this.form.name.trim(),
        slug: this.form.slug.trim().toLowerCase(),
        description: this.form.description.trim(),

        categoryId: this.form.categoryId,

        organizationId:
          this.form.organizationId.trim(),

        resourceType: this.form.resourceType,

        website: this.form.website.trim(),

        phone: this.form.phone.trim(),

        email: this.form.email.trim(),

        online: this.form.online,

        // Only include the cost description when one was entered.
        // Firestore does not accept undefined field values.
        cost: this.form.costDescription.trim()
          ? {
              free: this.form.free,
              description: this.form.costDescription.trim(),
            }
          : {
              free: this.form.free,
            },

        tags: this.form.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),

        status: this.form.status,

        verified: this.form.verified,

        featured: this.form.featured,

        createdBy: currentUser.id,
      };

      console.log('RESOURCE TO SAVE:', resource);

      const editingId = this.editingId();

      if (editingId) {
        await this.resourceService.updateResource(
          editingId,
          resource
        );
      } else {
        await this.resourceService.createResource(
          resource
        );
      }

      this.resetForm();

      await this.loadData();

    } catch (error) {
      console.error('Failed to save resource:', error);

      this.error.set(
        `Unable to save resource: ${
          error instanceof Error
            ? error.message
            : 'Unknown error'
        }`
      );
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Load a resource into the form for editing.
   */
  protected editResource(resource: Resource): void {
    this.editingId.set(resource.id);

    this.form = {
      name: resource.name,
      slug: resource.slug,
      description: resource.description,

      categoryId: resource.categoryId,

      organizationId:
        resource.organizationId ?? '',

      resourceType: resource.resourceType,

      website: resource.website ?? '',
      phone: resource.phone ?? '',
      email: resource.email ?? '',

      online: resource.online,

      alwaysAvailable:
        resource.availability?.alwaysAvailable ?? false,

      byAppointment:
        resource.availability?.byAppointment ?? false,

      free:
        resource.cost?.free ?? true,

      costDescription:
        resource.cost?.description ?? '',

      tags: resource.tags.join(', '),

      status: resource.status,

      verified: resource.verified,

      featured: resource.featured,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Cancel editing and return to a blank form.
   */
  protected cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Delete a resource.
   */
  protected async deleteResource(
    resource: Resource
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete the resource "${resource.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);

    try {
      await this.resourceService.deleteResource(
        resource.id
      );

      if (this.editingId() === resource.id) {
        this.resetForm();
      }

      await this.loadData();

    } catch (error) {
      console.error('Failed to delete resource:', error);

      this.error.set(
        'Unable to delete resource. Please try again.'
      );
    }
  }

  /**
   * Reset the form to its default values.
   */
  private resetForm(): void {
    this.editingId.set(null);
    this.form = this.createEmptyForm();
  }

  /**
   * Create default values for a new resource.
   */
  private createEmptyForm() {
    return {
      name: '',
      slug: '',
      description: '',

      categoryId: '',

      organizationId: '',

      resourceType: 'other' as ResourceType,

      website: '',
      phone: '',
      email: '',

      online: false,

      alwaysAvailable: false,
      byAppointment: false,

      free: true,
      costDescription: '',

      tags: '',

      status: 'draft' as ResourceStatus,

      verified: false,
      featured: false,
    };
  }

  /**
   * Convert values such as "food-assistance"
   * into readable labels such as "Food Assistance".
   */
  protected formatLabel(value: string): string {
    return value
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
