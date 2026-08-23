import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { QueryDocumentSnapshot } from 'firebase/firestore';

import {
  Resource,
  ResourceType,
} from '../../../../core/models/resource.model';

import { Category } from '../../../../core/models/category.model';

import { ResourceService } from '../../../../core/services/resource.service';

import { CategoryService } from '../../../../core/services/category.service';

import { AuthService } from '../../../../core/services/auth.service';

import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';

import { UsefulLinksComponent } from '../../components/useful-links/useful-links.component';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-resource-list',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    ResourceCardComponent,
    UsefulLinksComponent,
  ],

  template: `
    <!-- =========================================================
         Page Header
         ========================================================= -->
    <header class="border-b border-gray-200 bg-[#032D42]">
      <div
        class="relative mx-auto flex max-w-7xl
               items-center justify-between gap-2
               px-3 py-3
               sm:gap-4 sm:px-6 sm:py-6
               lg:px-8 lg:py-8"
      >

        <!-- =====================================================
             Header Content
             ===================================================== -->
        <div
          class="min-w-0 pr-8 sm:pr-0"
        >
          <p
            class="text-[10px]
                   font-semibold uppercase
                   tracking-wider
                   text-[#7ED6D1]
                   sm:text-xs"
          >
            Resource Directory
          </p>

          <h1
            class="mt-0.5 text-xl
                   font-bold leading-6
                   tracking-tight text-white
                   sm:mt-1 sm:text-3xl
                   sm:leading-9
                   lg:text-4xl
                   lg:leading-10"
          >
            Find the help you need
          </h1>

          <p
            class="mt-1 max-w-3xl
                   text-[11px] leading-4
                   text-blue-100
                   sm:mt-2 sm:text-base
                   sm:leading-6
                   lg:text-lg
                   lg:leading-7"
          >
            Browse trusted resources, services,
            organizations, and tools available
            to help you and your community.
          </p>
        </div>

        <!-- =====================================================
             Authentication
             ===================================================== -->
        <div class="shrink-0">

          <!-- =================================================
               Desktop: Login + Sign Up
               ================================================= -->
          <div
            class="hidden items-center
                   gap-2 sm:flex"
          >

            <!-- Login -->
            <a
              routerLink="/login"
              class="inline-flex h-9
                     items-center justify-center
                     gap-1.5
                     rounded-md
                     border border-white/40
                     px-3
                     text-sm font-semibold
                     text-white
                     transition
                     hover:bg-white/10
                     focus:outline-none
                     focus:ring-2
                     focus:ring-white/40"
            >
              <mat-icon
                aria-hidden="true"
                class="!m-0 !h-4 !w-4
                       !text-[16px]
                       !leading-4"
              >
                login
              </mat-icon>

              <span>
                Login
              </span>
            </a>

            <!-- Sign Up -->
            <a
              routerLink="/signup"
              class="inline-flex h-9
                     items-center justify-center
                     gap-1.5
                     rounded-md
                     bg-white
                     px-3
                     text-sm font-semibold
                     text-[#007979]
                     shadow-sm
                     transition
                     hover:bg-gray-100
                     focus:outline-none
                     focus:ring-2
                     focus:ring-white/40"
            >
              <mat-icon
                aria-hidden="true"
                class="!m-0 !h-4 !w-4
                       !text-[16px]
                       !leading-4"
              >
                person_add
              </mat-icon>

              <span>
                Sign Up
              </span>
            </a>
          </div>

          <!-- =================================================
               Mobile: Three-dot Account Menu
               ================================================= -->
          <div
            class="absolute right-3 top-3
                   sm:hidden"
          >
            <button
              type="button"
              (click)="toggleMoreMenu()"
              [attr.aria-expanded]="showMoreMenu()"
              aria-label="Account options"
              title="Account options"
              class="flex h-8 w-8
                     items-center
                     justify-center
                     rounded-md
                     border border-white/30
                     bg-white/10
                     text-base font-bold
                     text-white
                     transition
                     hover:bg-white/20
                     focus:outline-none
                     focus:ring-2
                     focus:ring-white/40"
            >
              <span
                aria-hidden="true"
                class="leading-none"
              >
                ⋮
              </span>
            </button>

            <!-- Mobile account menu -->
            @if (showMoreMenu()) {
              <div
                class="absolute right-0 z-50
                       mt-2 w-36
                       overflow-hidden
                       rounded-lg
                       border border-gray-200
                       bg-white
                       shadow-lg"
              >

                <!-- Login -->
                <a
                  routerLink="/login"
                  (click)="closeMoreMenu()"
                  class="flex items-center
                         gap-2
                         px-3 py-2.5
                         text-sm font-medium
                         text-gray-700
                         hover:bg-gray-50
                         hover:text-[#007979]"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-4 !w-4
                           !text-[16px]
                           !leading-4"
                  >
                    login
                  </mat-icon>

                  <span>
                    Login
                  </span>
                </a>

                <!-- Sign Up -->
                <a
                  routerLink="/signup"
                  (click)="closeMoreMenu()"
                  class="flex items-center
                         gap-2
                         border-t border-gray-100
                         px-3 py-2.5
                         text-sm font-medium
                         text-[#007979]
                         hover:bg-gray-50"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-4 !w-4
                           !text-[16px]
                           !leading-4"
                  >
                    person_add
                  </mat-icon>

                  <span>
                    Sign Up
                  </span>
                </a>

              </div>
            }
          </div>
        </div>
      </div>
    </header>

    <!-- =========================================================
         Main Content
         ========================================================= -->
    <main
      class="px-2 py-3
             sm:px-6 sm:py-6
             lg:px-8"
    >
      <div
        class="mx-auto grid max-w-7xl
               gap-4
               lg:grid-cols-[minmax(0,1fr)_280px]
               lg:gap-6"
      >

        <!-- =====================================================
             Main Resource Directory
             ===================================================== -->
        <section class="min-w-0">

          <!-- ===================================================
               Browse by Category
               =================================================== -->
          <section>

            <!-- Heading + Mobile Filter Builder -->
            <div
              class="flex items-center
                     justify-between"
            >

              <h2
                class="text-base
                       font-semibold
                       leading-5
                       text-gray-900
                       sm:text-lg"
              >
                Browse by category
              </h2>

              <!-- =================================================
                   Mobile Filter Builder Toggle
                   ================================================= -->
              <button
                type="button"
                (click)="toggleSearch()"
                [attr.aria-expanded]="showSearch()"
                aria-label="Toggle filter builder"
                [title]="
                  showSearch()
                    ? 'Hide filter builder'
                    : 'Show filter builder'
                "
                class="flex min-h-8
                       shrink-0
                       items-center
                       justify-center
                       rounded-md
                       text-[#007979]
                       transition
                       hover:bg-[#E6F4F3]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/30
                       sm:hidden"
              >

                @if (showSearch()) {

                  <!-- Show Filter Builder -->
                  <span
                    class="rounded-md
                           bg-[#007979]
                           px-2.5 py-1
                           text-[10px]
                           font-medium
                           text-white
                           transition
                           hover:bg-[#006666]"
                  >
                    Show Filter Builder
                  </span>

                } @else {

                  <!-- Filter Builder Icon -->
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-5 !w-10
                           !text-[20px]
                           !leading-5"
                  >
                    search
                  </mat-icon>

                }

              </button>
            </div>

            <!-- =================================================
                 Category Buttons
                 ================================================= -->
            <div
              class="mt-2 flex flex-wrap
                     gap-1.5 sm:gap-2"
            >

              <!-- All -->
              <button
                type="button"
                (click)="selectCategory('')"
                [class.bg-[#007979]]="
                  !selectedCategory()
                "
                [class.text-white]="
                  !selectedCategory()
                "
                [class.bg-gray-100]="
                  selectedCategory()
                "
                [class.text-gray-700]="
                  selectedCategory()
                "
                class="rounded-full
                       px-2.5 py-1
                       text-[11px]
                       font-medium
                       leading-4
                       hover:bg-blue-100
                       sm:px-3
                       sm:py-1.5
                       sm:text-xs"
              >
                All
              </button>

              @for (
                category of categories();
                track category.id
              ) {
                <button
                  type="button"
                  (click)="
                    selectCategory(
                      category.slug
                    )
                  "
                  [class.bg-[#007979]]="
                    selectedCategory() ===
                    category.slug
                  "
                  [class.text-white]="
                    selectedCategory() ===
                    category.slug
                  "
                  [class.bg-gray-100]="
                    selectedCategory() !==
                    category.slug
                  "
                  [class.text-gray-700]="
                    selectedCategory() !==
                    category.slug
                  "
                  class="rounded-full
                         px-2.5 py-1
                         text-[11px]
                         font-medium
                         leading-4
                         hover:bg-blue-100
                         sm:px-3
                         sm:py-1.5
                         sm:text-xs"
                >
                  {{ category.name }}
                </button>
              }
            </div>
          </section>

          <!-- ===================================================
               Search and Filters
               =================================================== -->
          <section
            class="mt-3
                   rounded-lg
                   border
                   border-[#007979]/15
                   bg-[#E6F4F3]
                   p-2
                   shadow-sm
                   sm:p-2.5"
          >

            <!-- =================================================
                 Primary Filters

                 MOBILE:

                 showSearch() === false
                   Category + Type

                 showSearch() === true
                   Search only

                 DESKTOP:

                   Search + Category + Type
                   all visible on one row.
                 ================================================= -->
            <div
              class="grid
                     grid-cols-2
                     gap-1.5
                     sm:grid-cols-3
                     sm:gap-2"
            >

              <!-- =================================================
                   Search
                   ================================================= -->
              <div
                [class.hidden]="!showSearch()"
                class="col-span-2
                       sm:col-span-1
                       sm:block"
              >
                <label
                  for="search"
                  class="mb-0.5 block
                         text-[10px]
                         font-medium
                         text-[#032D42]
                         sm:text-[11px]"
                >
                  Search
                </label>

                <div
                  class="relative"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="pointer-events-none
                           absolute left-2
                           top-1/2
                           !m-0
                           !h-4 !w-4
                           -translate-y-1/2
                           !text-[16px]
                           !leading-4
                           text-gray-400"
                  >
                    search
                  </mat-icon>

                  <input
                    id="search"
                    type="search"
                    [value]="searchTerm()"
                    (input)="onSearch($event)"
                    placeholder="Search resources..."
                    class="block h-8 w-full
                           rounded-md
                           border
                           border-[#007979]/20
                           bg-white
                           pl-8 pr-2.5
                           text-xs
                           text-gray-800
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-1
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   Category
                   ================================================= -->
              <div
                [class.hidden]="showSearch()"
                class="sm:block"
              >
                <label
                  for="category"
                  class="mb-0.5 block
                         text-[10px]
                         font-medium
                         text-[#032D42]
                         sm:text-[11px]"
                >
                  Category
                </label>

                <select
                  id="category"
                  [value]="selectedCategory()"
                  (change)="
                    onCategoryChange($event)
                  "
                  class="block h-8 w-full
                         rounded-md
                         border
                         border-[#007979]/20
                         bg-white
                         px-2
                         text-xs
                         text-gray-800
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-1
                         focus:ring-[#007979]/20"
                >
                  <option value="">
                    All categories
                  </option>

                  @for (
                    category of categories();
                    track category.slug
                  ) {
                    <option
                      [value]="category.slug"
                    >
                      {{ category.name }}
                    </option>
                  }
                </select>
              </div>

              <!-- =================================================
                   Resource Type
                   ================================================= -->
              <div
                [class.hidden]="showSearch()"
                class="sm:block"
              >
                <label
                  for="resourceType"
                  class="mb-0.5 block
                         text-[10px]
                         font-medium
                         text-[#032D42]
                         sm:text-[11px]"
                >
                  Type
                </label>

                <select
                  id="resourceType"
                  [value]="selectedType()"
                  (change)="
                    onTypeChange($event)
                  "
                  class="block h-8 w-full
                         rounded-md
                         border
                         border-[#007979]/20
                         bg-white
                         px-2
                         text-xs
                         text-gray-800
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-1
                         focus:ring-[#007979]/20"
                >
                  <option value="">
                    All types
                  </option>

                  @for (
                    type of resourceTypes;
                    track type
                  ) {
                    <option [value]="type">
                      {{ formatResourceType(type) }}
                    </option>
                  }
                </select>
              </div>
            </div>

            <!-- =================================================
                 Secondary Filters + Result Count
                 ================================================= -->
            <div
              class="mt-1.5
                     flex items-center
                     justify-between
                     gap-2"
            >

              <div
                class="flex min-w-0
                       items-center
                       gap-2.5"
              >

                <!-- Online -->
                <label
                  class="flex shrink-0
                         items-center
                         gap-1
                         text-[10px]
                         text-[#032D42]
                         sm:text-[11px]"
                >
                  <input
                    type="checkbox"
                    [checked]="onlineOnly()"
                    (change)="
                      onOnlineChange($event)
                    "
                    class="h-3 w-3
                           rounded
                           border-[#007979]/30
                           text-[#007979]
                           focus:ring-[#007979]/20"
                  />

                  <span>
                    Online
                  </span>
                </label>

                <!-- Featured -->
                <label
                  class="flex shrink-0
                         items-center
                         gap-1
                         text-[10px]
                         text-[#032D42]
                         sm:text-[11px]"
                >
                  <input
                    type="checkbox"
                    [checked]="featuredOnly()"
                    (change)="
                      onFeaturedChange($event)
                    "
                    class="h-3 w-3
                           rounded
                           border-[#007979]/30
                           text-[#007979]
                           focus:ring-[#007979]/20"
                  />

                  <span>
                    Featured
                  </span>
                </label>

                <!-- Clear -->
                @if (hasActiveFilters()) {
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="shrink-0
                           text-[10px]
                           font-medium
                           text-[#007979]
                           hover:text-[#032D42]
                           sm:text-[11px]"
                  >
                    Clear
                  </button>
                }
              </div>

              <!-- Result Count -->
              @if (!loading()) {
                <span
                  class="shrink-0
                         text-[10px]
                         text-[#032D42]/60
                         sm:text-[11px]"
                >
                  {{ filteredResources().length }}
                </span>
              }
            </div>
          </section>

          <!-- ===================================================
               Loading State
               =================================================== -->
          @if (loading()) {
            <div
              class="mt-3 grid gap-3
                     sm:grid-cols-2
                     lg:grid-cols-3"
              aria-label="Loading resources"
            >
              @for (
                skeleton of [1, 2, 3, 4, 5, 6];
                track skeleton
              ) {
                <div
                  class="animate-pulse
                         rounded-lg
                         border border-gray-200
                         bg-white
                         p-3
                         shadow-sm"
                >
                  <div
                    class="h-4 w-20
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2 h-5 w-3/4
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2
                           space-y-1.5"
                  >
                    <div
                      class="h-3 w-full
                             rounded
                             bg-gray-200"
                    ></div>

                    <div
                      class="h-3 w-5/6
                             rounded
                             bg-gray-200"
                    ></div>
                  </div>

                  <div
                    class="mt-3 h-3 w-24
                           rounded
                           bg-gray-200"
                  ></div>
                </div>
              }
            </div>
          }

          <!-- ===================================================
               Error
               =================================================== -->
          @if (error()) {
            <p
              class="mt-3
                     rounded-md
                     bg-red-50
                     px-3 py-2
                     text-xs
                     text-red-600"
            >
              {{ error() }}
            </p>
          }

          <!-- ===================================================
               No Matching Resources
               =================================================== -->
          @if (
            !loading() &&
            !error() &&
            resources().length > 0 &&
            filteredResources().length === 0
          ) {
            <div
              class="mt-4
                     rounded-lg
                     border border-gray-200
                     bg-white
                     p-4
                     text-center
                     shadow-sm
                     sm:p-6"
            >
              <h2
                class="text-base
                       font-semibold
                       text-gray-900"
              >
                No resources found
              </h2>

              <p
                class="mt-1
                       text-xs
                       text-gray-600
                       sm:text-sm"
              >
                We couldn't find any resources
                matching your current search
                or filters.
              </p>

              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-3
                         rounded-md
                         bg-[#007979]
                         px-3 py-1.5
                         text-xs
                         font-medium
                         text-white
                         hover:bg-[#006666]"
                >
                  Clear filters
                </button>
              }
            </div>
          }

          <!-- ===================================================
               Resource Cards
               =================================================== -->
          @if (
            !loading() &&
            !error() &&
            filteredResources().length > 0
          ) {
            <div
              class="mt-3
                     grid gap-3
                     sm:grid-cols-2
                     lg:grid-cols-3"
            >
              @for (
                resource of filteredResources();
                track resource.id
              ) {
                <app-resource-card
                  [resource]="resource"
                  [categoryName]="
                    getCategoryName(
                      resource.categoryId
                    )
                  "
                />
              }
            </div>
          }

          <!-- ===================================================
               Load More
               =================================================== -->
          @if (
            !loading() &&
            !error() &&
            filteredResources().length > 0 &&
            hasMoreResources()
          ) {
            <div
              class="mt-4
                     flex justify-center"
            >
              <button
                type="button"
                (click)="
                  loadMoreResources()
                "
                [disabled]="loadingMore()"
                class="rounded-md
                       bg-[#007979]
                       px-4 py-2
                       text-xs
                       font-medium
                       text-white
                       transition
                       hover:bg-[#006666]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (loadingMore()) {
                  Loading...
                } @else {
                  Load more
                }
              </button>
            </div>
          }

          <!-- ===================================================
               Empty Directory
               =================================================== -->
          @if (
            !loading() &&
            !error() &&
            resources().length === 0
          ) {
            <p
              class="mt-4
                     text-center
                     text-xs
                     text-gray-600"
            >
              No resources are currently
              available.
            </p>
          }

        </section>

        <!-- =====================================================
             Useful Links Sidebar
             ===================================================== -->
        <aside
          class="lg:sticky
                 lg:top-6
                 lg:self-start"
        >
          <app-useful-links />
        </aside>

      </div>
    </main>
  `,

  styles: [],
})
export class ResourceListComponent
  implements OnInit
{
  // =========================================================
  // Services
  // =========================================================

  private readonly resourceService =
    inject(ResourceService);

  private readonly categoryService =
    inject(CategoryService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  protected readonly authService =
    inject(AuthService);

  private readonly toast =
    inject(HotToastService);

  // =========================================================
  // Resource State
  // =========================================================

  protected readonly resources =
    signal<Resource[]>([]);

  protected readonly categories =
    signal<Category[]>([]);

  // =========================================================
  // Loading / Error State
  // =========================================================

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  // =========================================================
  // Filter State
  // =========================================================

  protected readonly searchTerm =
    signal('');

  protected readonly selectedType =
    signal<ResourceType | ''>('');

  protected readonly selectedCategory =
    signal('');

  protected readonly onlineOnly =
    signal(false);

  protected readonly featuredOnly =
    signal(false);

  // =========================================================
  // Mobile Filter Builder State
  //
  // false:
  //   Category + Type visible on mobile
  //
  // true:
  //   Search visible on mobile
  //
  // Desktop:
  //   Search + Category + Type are always visible.
  // =========================================================

  protected readonly showSearch =
    signal(false);

  // =========================================================
  // Mobile Account Menu
  // =========================================================

  protected readonly showMoreMenu =
    signal(false);

  // =========================================================
  // Authentication
  // =========================================================

  protected readonly signingOut =
    signal(false);

  // =========================================================
  // Pagination
  // =========================================================

  private lastResourceDocument:
    QueryDocumentSnapshot | undefined;

  protected readonly hasMoreResources =
    signal(true);

  protected readonly loadingMore =
    signal(false);

  /**
   * Number of resources loaded per page.
   */
  private readonly resourcePageSize = 12;

  // =========================================================
  // Resource Types
  // =========================================================

  protected readonly resourceTypes:
    ResourceType[] = [
      'government',
      'nonprofit',
      'education',
      'business',
      'community',
      'service',
      'tool',
      'other',
    ];

  // =========================================================
  // Selected Category ID
  // =========================================================

  protected readonly selectedCategoryId =
    computed(() => {
      const slug =
        this.selectedCategory();

      if (!slug) {
        return '';
      }

      const category =
        this.categories().find(
          (category) =>
            category.slug === slug,
        );

      return category?.id ?? '';
    });

  // =========================================================
  // Category Name
  // =========================================================

  protected getCategoryName(
    categoryId: string,
  ): string {
    return (
      this.categories().find(
        (category) =>
          category.id === categoryId,
      )?.name ?? ''
    );
  }

  // =========================================================
  // Filtered Resources
  // =========================================================

  protected readonly filteredResources =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const type =
        this.selectedType();

      const categoryId =
        this.selectedCategoryId();

      return this.resources().filter(
        (resource) => {
          const matchesSearch =
            !search ||
            resource.name
              .toLowerCase()
              .includes(search) ||
            resource.description
              .toLowerCase()
              .includes(search) ||
            resource.tags.some(
              (tag) =>
                tag
                  .toLowerCase()
                  .includes(search),
            );

          const matchesType =
            !type ||
            resource.resourceType === type;

          const matchesCategory =
            !categoryId ||
            resource.categoryId ===
              categoryId;

          const matchesOnline =
            !this.onlineOnly() ||
            resource.online;

          const matchesFeatured =
            !this.featuredOnly() ||
            resource.featured;

          return (
            matchesSearch &&
            matchesType &&
            matchesCategory &&
            matchesOnline &&
            matchesFeatured
          );
        },
      );
    });

  // =========================================================
  // Active Filters
  // =========================================================

  protected readonly hasActiveFilters =
    computed(() => {
      return (
        this.searchTerm().trim() !== '' ||
        this.selectedType() !== '' ||
        this.selectedCategory() !== '' ||
        this.onlineOnly() ||
        this.featuredOnly()
      );
    });

  // =========================================================
  // Initialization
  // =========================================================

  ngOnInit(): void {
    this.loadResources();

    this.loadCategories();

    const category =
      this.route.snapshot
        .queryParamMap
        .get('category');

    if (category) {
      this.selectedCategory.set(
        category,
      );
    }
  }

  // =========================================================
  // Load Categories
  // =========================================================

  private async loadCategories(): Promise<void> {
    try {
      const categories =
        await this.categoryService
          .getActiveCategories();

      this.categories.set(
        categories,
      );
    } catch (error) {
      console.error(
        'Failed to load categories:',
        error,
      );
    }
  }

  // =========================================================
  // Search
  // =========================================================

  protected onSearch(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value,
    );
  }

  // =========================================================
  // Toggle Mobile Filter Builder
  // =========================================================

  protected toggleSearch(): void {
    this.showSearch.update(
      (visible) => !visible,
    );
  }

  // =========================================================
  // Resource Type
  // =========================================================

  protected onTypeChange(
    event: Event,
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.selectedType.set(
      select.value as
        | ResourceType
        | '',
    );
  }

  // =========================================================
  // Online Filter
  // =========================================================

  protected onOnlineChange(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.onlineOnly.set(
      input.checked,
    );
  }

  // =========================================================
  // Featured Filter
  // =========================================================

  protected onFeaturedChange(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.featuredOnly.set(
      input.checked,
    );
  }

  // =========================================================
  // Category Filter
  // =========================================================

  protected onCategoryChange(
    event: Event,
  ): void {
    const select =
      event.target as HTMLSelectElement;

    const category =
      select.value;

    this.selectedCategory.set(
      category,
    );

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category:
          category || null,
      },

      queryParamsHandling:
        'merge',
    });
  }

  // =========================================================
  // Clear Filters
  // =========================================================

  protected clearFilters(): void {
    this.searchTerm.set('');

    this.selectedType.set('');

    this.selectedCategory.set('');

    this.onlineOnly.set(false);

    this.featuredOnly.set(false);

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category: null,
      },

      queryParamsHandling:
        'merge',
    });
  }

  // =========================================================
  // Format Resource Type
  // =========================================================

  protected formatResourceType(
    type: ResourceType,
  ): string {
    return (
      type.charAt(0).toUpperCase() +
      type.slice(1)
    );
  }

  // =========================================================
  // Load Resources
  // =========================================================

  private async loadResources(): Promise<void> {
    this.loading.set(true);

    this.error.set(null);

    this.lastResourceDocument =
      undefined;

    this.hasMoreResources.set(
      true,
    );

    try {
      const page =
        await this.resourceService
          .getPublishedResourcesPage(
            this.resourcePageSize,
          );

      this.resources.set(
        page.resources,
      );

      this.lastResourceDocument =
        page.lastDocument ??
        undefined;

      this.hasMoreResources.set(
        page.hasMore,
      );
    } catch (error) {
      console.error(
        'Failed to load resources:',
        error,
      );

      this.error.set(
        'Unable to load resources. Please try again later.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // Load More Resources
  // =========================================================

  protected async loadMoreResources(): Promise<void> {
    if (
      this.loadingMore() ||
      !this.hasMoreResources()
    ) {
      return;
    }

    this.loadingMore.set(true);

    try {
      const page =
        await this.resourceService
          .getPublishedResourcesPage(
            this.resourcePageSize,
            this.lastResourceDocument,
          );

      this.resources.update(
        (resources) => [
          ...resources,
          ...page.resources,
        ],
      );

      this.lastResourceDocument =
        page.lastDocument ??
        undefined;

      this.hasMoreResources.set(
        page.hasMore,
      );
    } catch (error) {
      console.error(
        'Failed to load more resources:',
        error,
      );

      this.error.set(
        'Unable to load more resources. Please try again.',
      );
    } finally {
      this.loadingMore.set(false);
    }
  }

  // =========================================================
  // Select Category
  // =========================================================

  protected selectCategory(
    categorySlug: string,
  ): void {
    this.selectedCategory.set(
      categorySlug,
    );

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category:
          categorySlug || null,
      },

      queryParamsHandling:
        'merge',
    });
  }

  // =========================================================
  // Mobile Account Menu
  // =========================================================

  protected toggleMoreMenu(): void {
    this.showMoreMenu.update(
      (visible) => !visible,
    );
  }

  protected closeMoreMenu(): void {
    this.showMoreMenu.set(false);
  }

  // =========================================================
  // Sign Out
  // =========================================================

  protected async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      await this.authService.logout();

      this.toast.success(
        'You have been signed out.',
      );

      await this.router.navigateByUrl(
        '/login',
      );
    } catch (error) {
      console.error(
        'Failed to sign out:',
        error,
      );

      this.toast.error(
        'Unable to sign out. Please try again.',
      );
    } finally {
      this.signingOut.set(false);
    }
  }
}