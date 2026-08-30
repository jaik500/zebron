import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';

import { Category } from '../../../../core/models/category.model';
import { CategoryStore } from '../../../categories/stores/category.store';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-category-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <!-- <div class="mb-2">
        <a routerLink="/admin" class="text-sm text-gray-600 transition hover:text-gray-900">
          ← Admin Dashboard
        </a>
      </div> -->
      <header class="border-b border-gray-200 bg-[#032D42]">
        <div
          class="mx-auto flex max-w-7xl items-center
                 justify-between gap-4 px-4 py-4
                 sm:px-6 lg:px-8 "
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wider
             text-[#7ED6D1]"
            >
              Administration
            </p>
            <h1
              class="text-xl font-bold text-white
                     sm:text-3xl"
            >
              Categories
            </h1>

            <p class="mt-1 text-sm text-white/80">
              Create and manage resource categories used to organize Zebron resources.
            </p>
          </div>

          <a
            routerLink="/admin"
            class="shrink-0 rounded-lg border
                   border-gray-300 bg-white px-3 py-2
                   text-sm font-semibold text-gray-700
                   hover:border-[#032D42]
                   hover:text-[#032D42]"
          >
            Admin Dashboard
          </a>
        </div>
      </header>
      <main class="mx-auto max-w-6xl p-2 sm:p-2">
        <!-- =========================================================
           Page header
           ========================================================= -->

        <!-- =========================================================
           Main category management area
           ========================================================= -->
        <section
          class="mt-2 rounded-2xl border border-gray-200
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

                <h2 class="text-xl font-semibold text-[#032D42]">
                  {{ editingId() ? 'Update category' : 'Create category' }}
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
              <form class="mt-6 space-y-7" (ngSubmit)="saveCategory()">
                <!-- =================================================
                   Basic information
                   ================================================= -->
                <section>
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Basic information</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Core information used to identify the category.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- Category name -->
                    <div class="sm:col-span-2">
                      <label for="categoryName" class="block text-sm font-medium text-gray-700">
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
                      <label for="categorySlug" class="block text-sm font-medium text-gray-700">
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
                        Briefly describe what types of resources belong in this category.
                      </p>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                   Category settings
                   ================================================= -->
                <section class="border-t border-gray-200 pt-6">
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Category settings</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Configure how the category is displayed and ordered.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- Icon -->
                    <div>
                      <label for="categoryIcon" class="block text-sm font-medium text-gray-700">
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

                      <p class="mt-1.5 text-xs text-gray-500">Optional icon identifier.</p>
                    </div>

                    <!-- Sort order -->
                    <div>
                      <label for="sortOrder" class="block text-sm font-medium text-gray-700">
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

                      <p class="mt-1.5 text-xs text-gray-500">Lower numbers appear first.</p>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                   Status
                   ================================================= -->
                <section class="border-t border-gray-200 pt-6">
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Status</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Control whether this category is available for resource organization.
                    </p>
                  </div>

                  <label class="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="active"
                      [(ngModel)]="form.active"
                      class="h-4 w-4 rounded border-gray-300
                           text-[#007979]
                           focus:ring-[#007979]"
                    />

                    <span class="text-sm text-gray-700"> Active category </span>
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
                      saving() ? 'Saving...' : editingId() ? 'Update category' : 'Create category'
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
              class="rounded-tr-2xl
         border-t border-gray-200
         bg-gray-50/60
         lg:border-l lg:border-t-0"
            >
              <div
                class="flex items-center
       justify-between
       gap-3
       rounded-tr-2xl
       border-b border-gray-200
       bg-[#66BB6A]/80
       p-3"
              >
                <div class="min-w-0">
                  <h1
                    class="text-lg
             font-semibold
             text-[#032D42]"
                  >
                    Existing Records
                  </h1>

                  <p
                    class="mt-0.5 text-xs
             text-white"
                  >
                    Categories currently in the directory.
                  </p>
                </div>

                <!-- Live record count -->
                @if (!loading()) {
                  <span
                    class="inline-flex
             shrink-0
             min-w-7
             items-center
             justify-center
             rounded-full
             bg-[#E6F4F3]
             px-2
             py-1
             text-xs
             font-semibold
             text-[#007979]"
                  >
                    {{ categories().length }}
                  </span>
                }
              </div>
              @for (category of categories(); track category.id) {
                <div
                  class="border-b border-gray-200
           p-4 last:border-b-0"
                >
                  <!-- =====================================================
         Category name + Show / Hide toggle
         ===================================================== -->
                  <div
                    class="flex items-center
             justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <h3
                        class="truncate text-sm font-semibold
                 text-gray-900"
                      >
                        {{ category.name }}
                      </h3>
                    </div>

                    <!-- Individual record Show / Hide -->
                    <button
                      type="button"
                      (click)="toggleExistingRecord(category.id)"
                      [attr.aria-expanded]="isExistingRecordExpanded(category.id)"
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
                        {{ isExistingRecordExpanded(category.id) ? 'Hide' : 'Show' }}
                      </span>

                      <mat-icon
                        aria-hidden="true"
                        class="!m-0
                 !h-4
                 !w-4
                 !text-[18px]"
                      >
                        {{
                          isExistingRecordExpanded(category.id)
                            ? 'keyboard_arrow_up'
                            : 'keyboard_arrow_down'
                        }}
                      </mat-icon>
                    </button>
                  </div>

                  <!-- =====================================================
         Existing category details
         ===================================================== -->
                  @if (isExistingRecordExpanded(category.id)) {
                    <!-- Slug + status -->
                    <div
                      class="mt-1 flex items-start
               justify-between gap-3"
                    >
                      <p
                        class="min-w-0 truncate text-xs
                 text-gray-500"
                      >
                        {{ category.slug }}
                      </p>

                      <span
                        class="shrink-0 rounded-full px-2
                 py-1 text-xs font-medium"
                        [class.bg-green-100]="category.active"
                        [class.text-green-700]="category.active"
                        [class.bg-gray-100]="!category.active"
                        [class.text-gray-600]="!category.active"
                      >
                        {{ category.active ? 'Active' : 'Inactive' }}
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
                      <span class="text-xs text-gray-400">
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
                  }
                </div>
              }
            </aside>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class CategoryAdminComponent implements OnInit {
  private readonly categoryStore =
  inject(CategoryStore);
  private readonly toast = inject(HotToastService);

  protected readonly categories =
  this.categoryStore.categories;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // =========================================================
  // Related Records
  // =========================================================

  protected readonly expandedRecords = signal<Set<string>>(new Set());

  protected toggleExistingRecord(categoryId: string): void {
    this.expandedRecords.update((expanded) => {
      const next = new Set(expanded);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  protected isExistingRecordExpanded(categoryId: string): boolean {
    return this.expandedRecords().has(categoryId);
  }

  protected form = this.createEmptyForm();

  ngOnInit(): void {
    this.loadCategories();
  }

 /**
 * Load all categories and initialize the next
 * sort order when creating a new category.
 */
private async loadCategories(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  try {
    await this.categoryStore.loadCategories();

    /*
     * Automatically assign the next sort order
     * for a new category.
     *
     * When editing an existing category, preserve
     * its current sort order.
     */
    if (!this.editingId()) {
      this.form.sortOrder =
        this.getNextSortOrder();
    }
    } catch (error) {
      console.error('Failed to load categories:', error);

      this.error.set('Unable to load categories. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new category or update an existing category.
   */
  protected async saveCategory(): Promise<void> {
    // ===============================================================
    // Prevent duplicate submissions
    // ===============================================================

    if (this.saving()) {
      return;
    }

    // ===============================================================
    // Normalize form values
    // ===============================================================

    const name = this.form.name?.trim() || '';

    const slug = this.form.slug?.trim().toLowerCase() || '';

    const sortOrder = Number(this.form.sortOrder);

    // ===============================================================
    // Validate required fields
    // ===============================================================

    if (!name) {
      this.toast.error('Category name is required.');

      return;
    }

    if (!slug) {
      this.toast.error('Category slug is required.');

      return;
    }

    // ===============================================================
    // Validate sort order
    // ===============================================================

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      this.toast.error('Sort order must be 0 or greater.');

      return;
    }

    // ===============================================================
    // Begin save
    // ===============================================================

    this.saving.set(true);

    this.error.set(null);

    try {
      // =============================================================
      // Build category
      // =============================================================

      const category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
        name,

        slug,

        active: this.form.active,

        sortOrder,
      };

      // =============================================================
      // Optional description
      // =============================================================

      const description = this.form.description?.trim() || '';

      if (description) {
        category.description = description;
      }

      // =============================================================
      // Optional icon
      // =============================================================

      const icon = this.form.icon?.trim() || '';

      if (icon) {
        category.icon = icon;
      }

      // =============================================================
      // Create / update
      // =============================================================

      const editingId = this.editingId();

      if (editingId) {
        await this.categoryStore.updateCategory(editingId, category);

        this.toast.success('Category updated successfully.');
      } else {
        await this.categoryStore.createCategory(category);

        this.toast.success('Category created successfully.');
      }

      // =============================================================
      // Reset and refresh
      // =============================================================

      this.resetForm();

      await this.loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);

      this.error.set('Unable to save category. Please try again.');

      this.toast.error(`Unable to save category: ${error?.message ?? 'Unknown error'}`);
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
   * Controls the amount of detail shown
   * for existing category records.
   *
   * Default is collapsed so the directory
   * remains compact.
   */
  protected readonly showExistingRecords = signal(false);

  /**
   * Toggle existing category record details.
   */
  protected toggleExistingRecords(): void {
    this.showExistingRecords.update((visible) => !visible);
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
  protected deleteCategory(category: Category): void {
    this.toast.show(DeleteConfirmationComponent, {
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
        message: `${category.name} will be permanently deleted.`,

        onConfirm: async () => {
          await this.confirmDeleteCategory(category);
        },
      },
    });
  }

  /**
   * Perform the actual category deletion after
   * the administrator confirms the action.
   */
  private async confirmDeleteCategory(category: Category): Promise<void> {
    this.error.set(null);

    try {
      await this.categoryStore.deleteCategory(category.id);

      this.toast.success('Category deleted successfully.');

      // If the deleted category was being edited,
      // return the form to create mode.
      if (this.editingId() === category.id) {
        this.resetForm();
      }

      await this.loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);

      this.toast.error('Unable to delete category. Please try again.');

      this.error.set('Unable to delete category. Please try again.');
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
      sortOrder: this.getNextSortOrder(),
    };
  }

  /**
   * Calculate the default sort order for a new category.
   *
   * The next category is placed after the current highest
   * sort order. The administrator can still manually change
   * this value before saving.
   */
  private getNextSortOrder(): number {
    if (this.categories().length === 0) {
      return 0;
    }

    const highestSortOrder = this.categories().reduce(
      (highest, category) => Math.max(highest, Number(category.sortOrder) || 0),
      -1,
    );

    return highestSortOrder + 1;
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
