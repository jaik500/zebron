import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Resource, ResourceType } from '../../../../core/models/resource.model';
import { ResourceService } from '../../../../core/services/resource.service';
import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { ActivatedRoute, Router, } from '@angular/router';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [ResourceCardComponent],
  template: `
    <main class="p-8">
      <h1 class="text-3xl font-bold">Resources</h1>

      <p class="mt-2 text-gray-600">
        Browse available resources.
      </p>

      <!-- Search and filters -->
      <section
        class="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="grid gap-4 md:grid-cols-3">
          <!-- Search -->
          <div>
            <label
              for="search"
              class="block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="search"
              type="search"
              [value]="searchTerm()"
              (input)="onSearch($event)"
              placeholder="Search resources..."
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none focus:ring-2
                     focus:ring-blue-500"
            />
          </div>

          <!-- Category -->
          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700"
            >
              Category
            </label>

            <select
              id="category"
              [value]="selectedCategory()"
              (change)="onCategoryChange($event)"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                    focus:border-blue-500 focus:outline-none focus:ring-2
                    focus:ring-blue-500"
            >
              <option value="">All categories</option>

              @for (category of categories(); track category.id) {
                <option [value]="category.slug">
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
              [value]="selectedType()"
              (change)="onTypeChange($event)"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none focus:ring-2
                     focus:ring-blue-500"
            >
              <option value="">All types</option>

              @for (type of resourceTypes; track type) {
                <option [value]="type">
                  {{ formatResourceType(type) }}
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Additional filters -->
        <div class="mt-4 flex flex-wrap gap-6">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              [checked]="onlineOnly()"
              (change)="onOnlineChange($event)"
              class="rounded border-gray-300"
            />
            Available online
          </label>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              [checked]="featuredOnly()"
              (change)="onFeaturedChange($event)"
              class="rounded border-gray-300"
            />
            Featured
          </label>

          @if (hasActiveFilters()) {
            <button
              type="button"
              (click)="clearFilters()"
              class="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          }
        </div>

        @if (!loading()) {
          <p class="mt-4 text-sm text-gray-500">
            {{ filteredResources().length }}
            {{ filteredResources().length === 1 ? 'resource' : 'resources' }}
            found
          </p>
        }
      </section>

      @if (loading()) {
        <p class="mt-6">Loading resources...</p>
      }

      @if (error()) {
        <p class="mt-6 text-red-600">
          {{ error() }}
        </p>
      }

      @if (
        !loading() &&
        !error() &&
        resources().length > 0 &&
        filteredResources().length === 0
      ) {
        <p class="mt-6 text-gray-600">
          No resources match your search or filters.
        </p>
      }

      @if (
        !loading() &&
        !error() &&
        filteredResources().length > 0
      ) {
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (resource of filteredResources(); track resource.id) {
            <app-resource-card [resource]="resource" />
          }
        </div>
      }

      @if (
        !loading() &&
        !error() &&
        resources().length === 0
      ) {
        <p class="mt-6 text-gray-600">
          No resources are currently available.
        </p>
      }
    </main>
  `,
  styles: [],
})
export class ResourceListComponent implements OnInit {
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly resources = signal<Resource[]>([]);
  protected readonly categories = signal<Category[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly selectedType = signal<ResourceType | ''>('');
  protected readonly selectedCategory = signal('');
  protected readonly onlineOnly = signal(false);
  protected readonly featuredOnly = signal(false);

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

  protected readonly filteredResources = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType();
    const category = this.selectedCategory();

    return this.resources().filter((resource) => {
      const matchesSearch =
        !search ||
        resource.name.toLowerCase().includes(search) ||
        resource.description.toLowerCase().includes(search) ||
        resource.tags.some((tag) =>
          tag.toLowerCase().includes(search)
        );

      const matchesType =
        !type || resource.resourceType === type;

      const matchesCategory =
        !category || resource.categoryId === category;

      const matchesOnline =
        !this.onlineOnly() || resource.online;

      const matchesFeatured =
        !this.featuredOnly() || resource.featured;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesOnline &&
        matchesFeatured
      );
    });
  });

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.searchTerm().trim() !== '' ||
      this.selectedType() !== '' ||
      this.selectedCategory() !== '' ||
      this.onlineOnly() ||
      this.featuredOnly()
    );
  });

  ngOnInit(): void {
    this.loadResources();
    this.loadCategories();

    // Read the category filter from the URL.
    const category = this.route.snapshot.queryParamMap.get('category');

    if (category) {
      this.selectedCategory.set(category);
    }
  }

    private async loadCategories(): Promise<void> {
      try {
        const categories =
          await this.categoryService.getActiveCategories();

        this.categories.set(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected onTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedType.set(select.value as ResourceType | '');
  }

  protected onOnlineChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onlineOnly.set(input.checked);
  }

  protected onFeaturedChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.featuredOnly.set(input.checked);
  }

  protected onCategoryChange(event: Event): void {
      const select = event.target as HTMLSelectElement;
      const category = select.value;

      this.selectedCategory.set(category);

      // Keep the selected category in the URL so the filter is shareable.
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          category: category || null,
        },
        queryParamsHandling: 'merge',
      });
    }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedType.set('');
    this.selectedCategory.set('');
    this.onlineOnly.set(false);
    this.featuredOnly.set(false);
  }

  protected formatResourceType(type: ResourceType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private async loadResources(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const resources =
        await this.resourceService.getPublishedResources();

      this.resources.set(resources);
    } catch (error) {
      console.error('Failed to load resources:', error);

      this.error.set(
        'Unable to load resources. Please try again later.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
