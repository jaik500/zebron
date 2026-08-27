import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ResourceType } from '../../../../core/models/resource-type.model';
import { ResourceTypeService } from '../../../../core/services/resource-type.service';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-resource-type-admin',

  standalone: true,

  imports: [FormsModule, RouterLink],

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
            Resource type management
          </p>

          <h1
            class="text-xl
                   font-bold
                   text-white
                   sm:text-3xl"
          >
            Resource Types
          </h1>

          <p
            class="mt-1
                   text-sm
                   text-white/80"
          >
            Create and manage resource types used across Zebron.
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
         MAIN
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
        <div
          class="grid
                 gap-6
                 lg:grid-cols-3"
        >
          <!-- =================================================
               CREATE / EDIT
               ================================================= -->
          <section
            class="rounded-2xl
                   border
                   border-gray-200
                   bg-white
                   shadow-sm
                   lg:col-span-2"
          >
            <div
              class="border-b
                     border-gray-100
                     px-5
                     py-4
                     sm:px-6"
            >
              <p
                class="text-xs
                       font-semibold
                       uppercase
                       tracking-wider
                       text-[#007979]"
              >
                {{ editingId() ? 'Edit resource type' : 'Create resource type' }}
              </p>

              <h2
                class="mt-1
                       text-lg
                       font-semibold
                       text-[#032D42]"
              >
                {{ editingId() ? 'Update Resource Type' : 'Add a New Resource Type' }}
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-gray-500"
              >
                Define how resources are classified across Zebron.
              </p>
            </div>

            <form
              (ngSubmit)="saveResourceType()"
              class="space-y-5
                     p-5
                     sm:p-6"
            >
              <!-- Name -->
              <div>
                <input
                  id="resource-type-name"
                  name="name"
                  type="text"
                  [(ngModel)]="form.name"
                  (ngModelChange)="generateSlug($event)"
                  placeholder="Enter resource type name"
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
           text-gray-700
           focus:border-[#007979]
           focus:outline-none
           focus:ring-2
           focus:ring-[#007979]/20"
                />
              </div>

              <!-- Slug -->
              <div>
                <label
                  for="resource-type-slug"
                  class="block
                         text-sm
                         font-semibold
                         text-[#032D42]"
                >
                  Slug
                </label>

                <input
                  id="resource-type-slug"
                  name="slug"
                  type="text"
                  [(ngModel)]="form.slug"
                  readonly
                  class="mt-1.5
         block
         w-full
         rounded-lg
         border
         border-gray-200
         bg-gray-50
         px-3.5
         py-2.5
         text-sm
         text-gray-600
         focus:outline-none"
                />

                <p
                  class="mt-1
         text-xs
         text-gray-500"
                >
                  Generated automatically from the resource type name.
                </p>
              </div>

              <!-- Description -->
              <div>
                <label
                  for="resource-type-description"
                  class="block
                         text-sm
                         font-semibold
                         text-[#032D42]"
                >
                  Description
                </label>

                <textarea
                  id="resource-type-description"
                  name="description"
                  rows="4"
                  [(ngModel)]="form.description"
                  placeholder="Describe the types of resources that belong here..."
                  class="mt-1.5
                         block
                         w-full
                         resize-y
                         rounded-lg
                         border
                         border-gray-300
                         px-3.5
                         py-2.5
                         text-sm
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                ></textarea>
              </div>

              <!-- Active / Sort order -->
              <div
                class="grid
                       gap-4
                       sm:grid-cols-2"
              >
                <div
                  class="rounded-xl
                         border
                         border-gray-200
                         p-4"
                >
                  <label
                    class="flex
                           items-center
                           gap-3"
                  >
                    <input
                      type="checkbox"
                      name="active"
                      [(ngModel)]="form.active"
                      class="h-4
                             w-4
                             rounded
                             border-gray-300
                             text-[#007979]
                             focus:ring-[#007979]/20"
                    />

                    <span>
                      <span
                        class="block
                               text-sm
                               font-semibold
                               text-[#032D42]"
                      >
                        Active
                      </span>

                      <span
                        class="block
                               text-xs
                               text-gray-500"
                      >
                        Available for resource selection.
                      </span>
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    for="resource-type-sort"
                    class="block
                           text-sm
                           font-semibold
                           text-[#032D42]"
                  >
                    Sort Order
                  </label>

                  <input
                    id="resource-type-sort"
                    name="sortOrder"
                    type="number"
                    min="0"
                    [(ngModel)]="form.sortOrder"
                    class="mt-1.5
                           block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3.5
                           py-2.5
                           text-sm
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
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
                         hover:bg-gray-50
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
                         hover:bg-[#032D42]
                         disabled:opacity-50"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    {{ editingId() ? 'Update Resource Type' : 'Create Resource Type' }}
                  }
                </button>
              </div>
            </form>
          </section>

          <!-- =================================================
               DIRECTORY
               ================================================= -->
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
                      Existing resource types
                    </h2>

                    <p
                      class="mt-1
                             text-sm
                             leading-5
                             text-gray-500"
                    >
                      Select a resource type to edit or delete it.
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
                      {{ resourceTypes().length }}
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
                <label for="resource-type-search" class="sr-only"> Search resource types </label>

                <input
                  id="resource-type-search"
                  name="resourceTypeSearch"
                  type="search"
                  [value]="searchTerm()"
                  (input)="onSearch($event)"
                  placeholder="Search resource types..."
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         px-3.5
                         py-2.5
                         text-sm
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />
              </div>

              <!-- List -->
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
                    Loading resource types...
                  </div>
                } @else if (filteredResourceTypes().length === 0) {
                  <div
                    class="rounded-xl
                           border
                           border-dashed
                           border-gray-300
                           p-6
                           text-center"
                  >
                    <p
                      class="text-sm
                             font-semibold
                             text-gray-700"
                    >
                      @if (searchTerm()) {
                        No matching resource types
                      } @else {
                        No resource types yet
                      }
                    </p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (type of filteredResourceTypes(); track type.id) {
                      <article
                        class="rounded-xl
                               border
                               border-gray-200
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
                              <rect x="4" y="4" width="16" height="16" rx="2" />

                              <path stroke-linecap="round" d="M8 9h8M8 13h8M8 17h5" />
                            </svg>
                          </div>

                          <div
                            class="min-w-0
                                   flex-1"
                          >
                            <div
                              class="flex
                                     items-start
                                     justify-between
                                     gap-2"
                            >
                              <h3
                                class="font-semibold
                                       text-[#032D42]"
                              >
                                {{ type.name }}
                              </h3>

                              <span
                                class="shrink-0
                                       rounded-full
                                       px-2
                                       py-0.5
                                       text-[10px]
                                       font-semibold"
                                [class.bg-green-50]="type.active"
                                [class.text-green-700]="type.active"
                                [class.bg-gray-100]="!type.active"
                                [class.text-gray-500]="!type.active"
                              >
                                {{ type.active ? 'Active' : 'Inactive' }}
                              </span>
                            </div>

                            <p
                              class="mt-0.5
                                     text-xs
                                     text-gray-400"
                            >
                              {{ type.slug }}
                            </p>

                            @if (type.description) {
                              <p
                                class="mt-2
                                       text-sm
                                       leading-5
                                       text-gray-600"
                              >
                                {{ type.description }}
                              </p>
                            }

                            <div
                              class="mt-3
                                     flex
                                     items-center
                                     gap-2"
                            >
                              <button
                                type="button"
                                (click)="editResourceType(type)"
                                class="rounded-lg
                                       bg-[#007979]/10
                                       px-3
                                       py-1.5
                                       text-xs
                                       font-semibold
                                       text-[#007979]
                                       hover:bg-[#007979]
                                       hover:text-white"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                (click)="deleteResourceType(type)"
                                class="rounded-lg
                                       px-3
                                       py-1.5
                                       text-xs
                                       font-semibold
                                       text-red-600
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
export class ResourceTypeAdminComponent implements OnInit {
  private readonly resourceTypeService = inject(ResourceTypeService);

  private readonly toast = inject(HotToastService);

  protected readonly resourceTypes = signal<ResourceType[]>([]);

  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly searchTerm = signal('');

  protected readonly editingId = signal<string | null>(null);

  protected form: Partial<ResourceType> = this.emptyForm();

  protected readonly filteredResourceTypes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.resourceTypes();
    }

    return this.resourceTypes().filter(
      (type) =>
        type.name.toLowerCase().includes(search) ||
        type.slug.toLowerCase().includes(search) ||
        type.description?.toLowerCase().includes(search),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.loadResourceTypes();
  }

  private async loadResourceTypes(): Promise<void> {
    this.loading.set(true);

    try {
      const types = await this.resourceTypeService.getAllResourceTypes();

      this.resourceTypes.set(types);
    } catch (error) {
      console.error('Failed to load resource types:', error);

      this.toast.error('Unable to load resource types.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  protected async saveResourceType(): Promise<void> {
    const name = this.form.name?.trim() || '';

    const slug = this.form.slug?.trim() || '';

    if (!name || !slug) {
      this.toast.error('Name and slug are required.');

      return;
    }

    if (this.saving()) {
      return;
    }

    this.saving.set(true);

    try {
      const resourceType: ResourceType = {
        name,

        slug,

        description: this.form.description?.trim() || '',

        active: this.form.active ?? true,

        sortOrder: Number(this.form.sortOrder ?? 0),
      };

      const id = this.editingId();

      if (id) {
        await this.resourceTypeService.updateResourceType(id, resourceType);

        this.toast.success('Resource type updated successfully.');
      } else {
        await this.resourceTypeService.createResourceType(resourceType);

        this.toast.success('Resource type created successfully.');
      }

      this.clearForm();

      await this.loadResourceTypes();
    } catch (error) {
      console.error('Failed to save resource type:', error);

      this.toast.error('Unable to save resource type.');
    } finally {
      this.saving.set(false);
    }
  }

  protected editResourceType(type: ResourceType): void {
    if (!type.id) {
      return;
    }

    this.editingId.set(type.id);

    this.form = {
      name: type.name,

      slug: type.slug,

      description: type.description || '',

      active: type.active,

      sortOrder: type.sortOrder,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  protected cancelEdit(): void {
    this.clearForm();
  }

  protected async deleteResourceType(type: ResourceType): Promise<void> {
    if (!type.id) {
      return;
    }

    const confirmed = window.confirm(`Delete the resource type "${type.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.resourceTypeService.deleteResourceType(type.id);

      if (this.editingId() === type.id) {
        this.clearForm();
      }

      this.toast.success('Resource type deleted successfully.');

      await this.loadResourceTypes();
    } catch (error) {
      console.error('Failed to delete resource type:', error);

      this.toast.error('Unable to delete resource type.');
    }
  }

  protected clearForm(): void {
    this.form = this.emptyForm();

    this.editingId.set(null);
  }

  private emptyForm(): Partial<ResourceType> {
    return {
      name: '',

      slug: '',

      description: '',

      active: true,

      sortOrder: 0,
    };
  }

  protected generateSlug(name: string): void {
    if (this.editingId()) {
      return;
    }

    this.form.slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
