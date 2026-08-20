import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-6xl p-8">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <a
            routerLink="/admin"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Admin Dashboard
          </a>

          <h1 class="mt-3 text-3xl font-bold text-gray-900">
            Categories
          </h1>

          <p class="mt-2 text-gray-600">
            Create and manage resource categories.
          </p>
        </div>
      </div>

      <!-- Category form -->
      <section
        class="mt-8 rounded-xl border border-gray-200
               bg-white p-6 shadow-sm"
      >
        <h2 class="text-xl font-semibold text-gray-900">
          {{ editingId() ? 'Edit category' : 'Create category' }}
        </h2>

        <form
          class="mt-6 space-y-5"
          (ngSubmit)="saveCategory()"
        >
          <!-- Name -->
          <div>
            <label
              for="categoryName"
              class="block text-sm font-medium text-gray-700"
            >
              Name
            </label>

            <input
              id="categoryName"
              name="name"
              type="text"
              [(ngModel)]="form.name"
              (ngModelChange)="generateSlug()"
              required
              placeholder="Food Assistance"
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Slug -->
          <div>
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
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />

            <p class="mt-1 text-xs text-gray-500">
              Used in URLs and resource category filtering.
            </p>
          </div>

          <!-- Description -->
          <div>
            <label
              for="categoryDescription"
              class="block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="categoryDescription"
              name="description"
              rows="3"
              [(ngModel)]="form.description"
              placeholder="Programs and services that provide food assistance."
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

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
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />
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
              [(ngModel)]="form.sortOrder"
              min="0"
              required
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Active -->
          <label class="flex items-center gap-3">
            <input
              type="checkbox"
              name="active"
              [(ngModel)]="form.active"
              class="h-4 w-4 rounded border-gray-300"
            />

            <span class="text-sm text-gray-700">
              Active category
            </span>
          </label>

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
              class="rounded-lg bg-blue-600 px-5 py-2
                     text-sm font-medium text-white
                     hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving()
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

      <!-- Category list -->
      <section class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            Existing categories
          </h2>

          @if (loading()) {
            <span class="text-sm text-gray-500">
              Loading...
            </span>
          }
        </div>

        @if (!loading() && categories().length === 0) {
          <div
            class="mt-4 rounded-xl border border-gray-200
                   bg-white p-6 text-gray-600"
          >
            No categories found.
          </div>
        }

        @if (categories().length > 0) {
          <div
            class="mt-4 overflow-hidden rounded-xl border
                   border-gray-200 bg-white shadow-sm"
          >
            <div class="divide-y divide-gray-200">
              @for (category of categories(); track category.id) {
                <div
                  class="flex flex-col gap-4 p-5
                         sm:flex-row sm:items-center
                         sm:justify-between"
                >
                  <div>
                    <div class="flex items-center gap-3">
                      <h3 class="font-semibold text-gray-900">
                        {{ category.name }}
                      </h3>

                      <span
                        class="rounded-full px-2 py-1 text-xs font-medium"
                        [class.bg-green-100]="category.active"
                        [class.text-green-700]="category.active"
                        [class.bg-gray-100]="!category.active"
                        [class.text-gray-600]="!category.active"
                      >
                        {{ category.active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>

                    <p class="mt-1 text-sm text-gray-500">
                      {{ category.slug }}
                    </p>

                    @if (category.description) {
                      <p class="mt-2 text-sm text-gray-600">
                        {{ category.description }}
                      </p>
                    }

                    <p class="mt-2 text-xs text-gray-400">
                      Sort order: {{ category.sortOrder }}
                    </p>
                  </div>

                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="editCategory(category)"
                      class="rounded-lg border border-gray-300
                             px-3 py-2 text-sm font-medium
                             text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      (click)="deleteCategory(category)"
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
export class CategoryAdminComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected form = {
    name: '',
    slug: '',
    description: '',
    icon: '',
    active: true,
    sortOrder: 0,
  };

  ngOnInit(): void {
    this.loadCategories();
  }

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

  protected async saveCategory(): Promise<void> {
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
          category.description = this.form.description.trim();
        }

        if (this.form.icon.trim()) {
          category.icon = this.form.icon.trim();
        }

        const editingId = this.editingId();

        if (editingId) {
          await this.categoryService.updateCategory(
            editingId,
            category
          );
        } else {
          await this.categoryService.createCategory(category);
        }

        this.resetForm();
        await this.loadCategories();
      } catch (error: any) {
        console.error('Failed to save category:', error);

        this.error.set(
          `Unable to save category: ${
            error?.code ?? error?.message ?? error
          }`
        );
      } finally {
        this.saving.set(false);
      }
    }

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

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected async deleteCategory(
    category: Category
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);

    try {
      await this.categoryService.deleteCategory(category.id);

      if (this.editingId() === category.id) {
        this.resetForm();
      }

      await this.loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);

      this.error.set(
        'Unable to delete category. Please try again.'
      );
    }
  }

  private resetForm(): void {
    this.editingId.set(null);

    this.form = {
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
