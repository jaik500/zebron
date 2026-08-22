
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';

import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
          Categories
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-6 text-white/75">
          Create and manage resource categories used to organize
          Zebron resources.
        </p>
      </section>


      <!-- =========================================================
           Main category management area
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

            <!-- Form header -->
            <div
              class="flex flex-col gap-1
                     border-b border-gray-200 pb-5"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-[#007979]"
              >
                {{ editingId() ? 'Edit category' : 'New category' }}
              </p>

              <h2
                class="text-xl font-semibold text-[#032D42]"
              >
                {{
                  editingId()
                    ? 'Update category'
                    : 'Create category'
                }}
              </h2>

              <p class="text-sm text-gray-500">
                {{
                  editingId()
                    ? 'Update the category details and settings.'
                    : 'Add a category to organize resources.'
                }}
              </p>
            </div>


            <!-- =================================================
                 Category form
                 ================================================= -->
            <form
              class="mt-6 space-y-7"
              (ngSubmit)="saveCategory()"
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
                    Core information used to identify the category.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Category name -->
                  <div class="sm:col-span-2">
                    <label
                      for="categoryName"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Category name
                    </label>

                    <input
                      id="categoryName"
                      name="name"
                      type="text"
                      [(ngModel)]="form.name"
                      (ngModelChange)="generateSlug()"
                      required
                      placeholder="Food Assistance"
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
                      for="categorySlug"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Slug
                    </label>

                    <input
                      id="categorySlug"
                      name="slug"
                      type="text"
                      [(ngModel)]="form.slug"
                      required
                      placeholder="food-assistance"
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
                      Automatically generated from the category name.
                    </p>
                  </div>


                  <!-- Description -->
                  <div class="sm:col-span-2">
                    <label
                      for="categoryDescription"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="categoryDescription"
                      name="description"
                      rows="4"
                      [(ngModel)]="form.description"
                      placeholder="Programs and services that provide food assistance."
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

                    <p class="mt-1.5 text-xs text-gray-500">
                      Briefly describe what types of resources belong
                      in this category.
                    </p>
                  </div>

                </div>
              </section>


              <!-- =================================================
                   Category settings
                   ================================================= -->
              <section
                class="border-t border-gray-200 pt-6"
              >

                <div class="mb-4">
                  <h3
                    class="text-sm font-semibold text-gray-900"
                  >
                    Category settings
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    Configure how the category is displayed and ordered.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Icon -->
                  <div>
                    <label
                      for="categoryIcon"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Icon
                    </label>

                    <input
                      id="categoryIcon"
                      name="icon"
                      type="text"
                      [(ngModel)]="form.icon"
                      placeholder="food"
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

                    <p class="mt-1.5 text-xs text-gray-500">
                      Optional icon identifier.
                    </p>
                  </div>


                  <!-- Sort order -->
                  <div>
                    <label
                      for="sortOrder"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Sort order
                    </label>

                    <input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      min="0"
                      [(ngModel)]="form.sortOrder"
                      required
                      class="mt-1 block w-full rounded-lg
                             border border-gray-300
                             bg-white px-4 py-2.5
                             text-sm text-gray-900
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                    <p class="mt-1.5 text-xs text-gray-500">
                      Lower numbers appear first.
                    </p>
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

                  <p class="mt-1 text-xs text-gray-500">
                    Control whether this category is available
                    for resource organization.
                  </p>
                </div>

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
                    Active category
                  </span>
                </label>
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
                class="flex flex-wrap items-center gap-2
                       border-t border-gray-200 pt-6"
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
                        ? 'Update category'
                        : 'Create category'
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
               EXISTING CATEGORIES / DIRECTORY
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
                    Existing categories
                  </h2>

                  <p class="mt-1 text-sm text-gray-500">
                    Select a category to edit or delete it.
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
                    {{ categories().length }}
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
                    Loading categories...
                  </p>
                </div>
              }


              <!-- Empty -->
              @if (!loading() && categories().length === 0) {
                <div
                  class="mt-6 rounded-xl border
                         border-dashed border-gray-300
                         bg-white p-6 text-center"
                >
                  <p
                    class="text-sm font-medium text-gray-700"
                  >
                    No categories found.
                  </p>

                  <p class="mt-1 text-xs text-gray-500">
                    Create the first category using the form.
                  </p>
                </div>
              }


              <!-- Category list -->
              @if (categories().length > 0) {
                <div
                  class="mt-6 overflow-hidden rounded-xl
                         border border-gray-200
                         bg-white shadow-sm"
                >

                  @for (
                    category of categories();
                    track category.id
                  ) {

                    <div
                      class="border-b border-gray-200
                             p-4 last:border-b-0"
                    >

                      <!-- Category name + status -->
                      <div
                        class="flex items-start
                               justify-between gap-3"
                      >

                        <div class="min-w-0">
                          <h3
                            class="truncate text-sm font-semibold
                                   text-gray-900"
                          >
                            {{ category.name }}
                          </h3>

                          <p
                            class="mt-1 truncate text-xs
                                   text-gray-500"
                          >
                            {{ category.slug }}
                          </p>
                        </div>

                        <span
                          class="shrink-0 rounded-full px-2
                                 py-1 text-xs font-medium"
                          [class.bg-green-100]="category.active"
                          [class.text-green-700]="category.active"
                          [class.bg-gray-100]="!category.active"
                          [class.text-gray-600]="!category.active"
                        >
                          {{
                            category.active
                              ? 'Active'
                              : 'Inactive'
                          }}
                        </span>

                      </div>


                      <!-- Description -->
                      @if (category.description) {
                        <p
                          class="mt-3 line-clamp-2
                                 text-xs leading-5 text-gray-600"
                        >
                          {{ category.description }}
                        </p>
                      }


                      <!-- Metadata + actions -->
                      <div
                        class="mt-3 flex items-center
                               justify-between gap-3"
                      >

                        <span
                          class="text-xs text-gray-400"
                        >
                          Sort order: {{ category.sortOrder }}
                        </span>

                        <div class="flex gap-1.5">

                          <button
                            type="button"
                            (click)="editCategory(category)"
                            class="rounded-md border
                                   border-gray-300 bg-white
                                   px-2.5 py-1.5 text-xs
                                   font-medium text-gray-700
                                   transition
                                   hover:border-[#007979]/40
                                   hover:bg-[#007979]/5"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            (click)="deleteCategory(category)"
                            class="rounded-md border
                                   border-red-200
                                   px-2.5 py-1.5 text-xs
                                   font-medium text-red-600
                                   transition
                                   hover:bg-red-50"
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
export class CategoryAdminComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(HotToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected form = this.createEmptyForm();

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Load all categories for the admin directory.
   */
  private async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const categories =
        await this.categoryService.getAllCategories();

      this.categories.set(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);

      this.error.set(
        'Unable to load categories. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new category or update an existing category.
   */
  protected async saveCategory(): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const category: Omit<
        Category,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        name: this.form.name.trim(),
        slug: this.form.slug.trim().toLowerCase(),
        active: this.form.active,
        sortOrder: Number(this.form.sortOrder),
      };

      // Only add optional fields when they contain a value.
      if (this.form.description.trim()) {
        category.description =
          this.form.description.trim();
      }

      if (this.form.icon.trim()) {
        category.icon =
          this.form.icon.trim();
      }

      const editingId = this.editingId();

      if (editingId) {
        // Update the existing category.
        await this.categoryService.updateCategory(
          editingId,
          category
        );

        this.toast.success(
          'Category updated successfully.'
        );
      } else {
        // Create the new category.
        await this.categoryService.createCategory(
          category
        );

        this.toast.success(
          'Category created successfully.'
        );
      }

      this.resetForm();
      await this.loadCategories();

    } catch (error: any) {
      console.error(
        'Failed to save category:',
        error
      );

      this.toast.error(
        `Unable to save category: ${
          error?.message ?? 'Unknown error'
        }`
      );

    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Load a category into the form for editing.
   */
  protected editCategory(category: Category): void {
    this.editingId.set(category.id);

    this.form = {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      icon: category.icon ?? '',
      active: category.active,
      sortOrder: category.sortOrder,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Cancel editing and return to a blank create form.
   */
  protected cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Show the shared Delete Confirmation component
   * inside a Hot Toast confirmation card.
   */
  protected deleteCategory(
    category: Category,
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
          title: 'Delete category?',
          message:
            `${category.name} will be permanently deleted.`,

          onConfirm: async () => {
            await this.confirmDeleteCategory(
              category,
            );
          },
        },
      },
    );
  }

  /**
   * Perform the actual category deletion after
   * the administrator confirms the action.
   */
  private async confirmDeleteCategory(
    category: Category,
  ): Promise<void> {
    this.error.set(null);

    try {
      await this.categoryService.deleteCategory(
        category.id,
      );

      this.toast.success(
        'Category deleted successfully.',
      );

      // If the deleted category was being edited,
      // return the form to create mode.
      if (this.editingId() === category.id) {
        this.resetForm();
      }

      await this.loadCategories();

    } catch (error) {
      console.error(
        'Failed to delete category:',
        error,
      );

      this.toast.error(
        'Unable to delete category. Please try again.',
      );

      this.error.set(
        'Unable to delete category. Please try again.',
      );
    }
  }

  /**
   * Reset the category form to its default create state.
   */
  private resetForm(): void {
    this.editingId.set(null);
    this.form = this.createEmptyForm();
  }

  /**
   * Create a fresh empty category form.
   */
  private createEmptyForm() {
    return {
      name: '',
      slug: '',
      description: '',
      icon: '',
      active: true,
      sortOrder: 0,
    };
  }

  /**
   * Generate a URL-friendly slug from the category name.
   *
   * Slugs are automatically generated while creating a category.
   * During editing, the existing slug is preserved so an administrator
   * does not accidentally change a category URL.
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
}
