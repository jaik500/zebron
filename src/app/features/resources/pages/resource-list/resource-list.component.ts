import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Category } from '../../../../core/models/category.model';
import { Location } from '../../../../core/models/location.model';
import { Resource } from '../../../../core/models/resource.model';
import { ResourceType } from '../../../../core/models/resource-type.model';
import { CategoryService } from '../../../../core/services/category.service';
import { LocationService } from '../../../../core/services/location.service';
import { PersonalizationService } from '../../../../core/services/personalization.service';
import { ResourceService } from '../../../../core/services/resource.service';
import { ResourceTypeService } from '../../../../core/services/resource-type.service';
import { BootcampService } from '../../../bootcamps/bootcamp.service';
import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';
import { LocationPickerComponent } from '../../components/location-picker/location-picker.component';
import { resourceKind } from '../../resource-kinds';
import { POPULAR_SEARCHES, RESOURCE_NEEDS, ResourceNeed, needOf } from '../../resource-needs';

const PAGE_SIZE = 24;

/** The query parameters this page reads and writes. */
interface DirectoryFilters {
  q: string;
  /** A "Search by Category" topic (resource-needs.ts key). */
  topic: string;
  category: string;
  near: string;
  type: string;
  free: boolean;
  online: boolean;
  verified: boolean;
  /** "See all resources" from the front door. */
  all: boolean;
}

const EMPTY: DirectoryFilters = { q: '', topic: '', category: '', near: '', type: '', free: false, online: false, verified: false, all: false };

/**
 * /resources: the public directory of help (legal, health, housing, food,
 * jobs, education…). Filters live in the address so searches can be shared:
 * ?q=&category=<slug>&near=<locationId>&type=&free=1&online=1&verified=1.
 * Bootcamps have their own page, /bootcamps.
 */
@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, ResourceCardComponent, LocationPickerComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-gray-50">
      @if (!showResults()) {
        <!-- ===================== Front door (like 211): search over a photo, then categories ===================== -->
        <!-- Photo: add public/images/resources-hero.jpg (a licensed photo, about 2000×900). Until then the teal gradient shows. -->
        <section
          class="relative bg-[#035e5e] bg-cover bg-center"
          style="background-image: linear-gradient(90deg, rgba(3, 45, 66, 0.55) 0%, rgba(3, 45, 66, 0.15) 60%, rgba(3, 45, 66, 0) 100%), url('/images/resources-hero.jpg'), linear-gradient(135deg, #007979 0%, #035e5e 55%, #2a835f 100%)"
        >
          <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
            <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[48px] border-white/10"></div>
            <div class="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full border-[56px] border-white/5"></div>
          </div>

          <div class="relative mx-auto flex min-h-[380px] max-w-6xl items-center px-4 py-10 sm:min-h-[440px] sm:px-6 lg:px-8">
            <div class="w-full max-w-2xl rounded-2xl bg-[#032D42]/95 p-6 text-white shadow-2xl shadow-black/30 sm:p-8">
              <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">What do you need help with?</h1>
              <p class="mt-3 text-lg text-white/85">Search services, programs and places near you</p>

              <form role="search" (submit)="search($event, heroQuery.value)" class="mt-5 flex flex-col gap-2 sm:flex-row">
                <label class="min-w-0 flex-[3]">
                  <span class="sr-only">Search services or programs</span>
                  <input
                    #heroQuery
                    type="search"
                    placeholder="Search services or programs"
                    class="h-11 w-full rounded-lg border-0 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#12BFC3]"
                  />
                </label>
                <app-location-picker
                  class="flex-[2]"
                  size="large"
                  [locations]="locations()"
                  [value]="filters().near"
                  [counts]="placeCounts()"
                  (valueChange)="setNear($event)"
                />
                <button
                  type="submit"
                  class="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#12BFC3] px-5 text-sm font-bold text-[#032D42] transition hover:bg-[#3fd3d6] focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Search
                  <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">search</mat-icon>
                </button>
              </form>

              <p class="mt-5 text-sm leading-6 text-white/85">
                Need help now? Emergency <a href="tel:911" class="font-semibold text-white underline">911</a> ·
                Crisis <a href="tel:988" class="font-semibold text-white underline">988</a> ·
                Outside our area? <a href="https://www.211.org" target="_blank" rel="noopener noreferrer" class="font-semibold text-white underline">Find your local 211</a>.
              </p>
            </div>
          </div>
        </section>

        <!-- ===================== Search by category ===================== -->
        <section class="bg-white" aria-labelledby="needs-title">
          <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="needs-title" class="text-3xl font-bold tracking-tight text-[#032D42]">Search by Category</h2>
            <p class="mt-2 text-sm text-gray-600 sm:text-base">Find resources near you, with hours, costs and how to reach them.</p>

            <ul class="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-3 lg:grid-cols-4">
              @for (need of needs(); track need.need.key) {
                <li>
                  <a [routerLink]="need.link" [queryParams]="need.query" class="group block focus:outline-none">
                    <span class="text-lg font-bold text-[#007979] group-hover:underline group-focus-visible:underline">{{ need.need.title }}</span>
                    @if (need.count) {
                      <span class="ml-1 text-xs font-semibold text-gray-400">{{ need.count }}</span>
                    }
                    <span class="mt-0.5 block text-sm leading-5 text-gray-600">{{ need.need.text }}</span>
                  </a>
                </li>
              }
            </ul>

            <div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-6 text-sm">
              <button type="button" (click)="browseAll()" class="inline-flex items-center gap-1 font-bold text-[#007979] hover:underline">
                See all {{ resources().length || '' }} resources
                <mat-icon class="!h-5 !w-5 !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
              </button>
              <span class="text-gray-500">Popular:</span>
              @for (term of popular; track term) {
                <button type="button" (click)="set('q', term)" class="font-medium text-gray-700 hover:text-[#007979] hover:underline">{{ term }}</button>
              }
            </div>
          </div>
        </section>

        <!-- Featured -->
        @if (featured().length) {
          <section class="bg-white" aria-labelledby="featured-title">
            <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
              <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">Featured</p>
              <h2 id="featured-title" class="mt-1 text-2xl font-bold tracking-tight text-[#032D42]">Trusted places to start</h2>
              <p class="mt-1 text-sm text-gray-600">Verified by Zebron. Check hours and details before you go.</p>
              <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @for (resource of featured(); track resource.id) {
                  <app-resource-card
                    [resource]="resource"
                    [category]="categoryById().get(resource.categoryId)"
                    [place]="placeOf(resource)"
                    [programs]="programSummaries().get(resource.id)"
                  />
                }
              </div>
            </div>
          </section>
        }

        <!-- Can't find it -->
        <section class="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <mat-icon class="text-[#007979]" aria-hidden="true">support_agent</mat-icon>
            <h2 class="mt-2 text-base font-bold text-[#032D42]">Can't find what you need?</h2>
            <p class="mt-1 text-sm text-gray-600">Dial <a href="tel:211" class="font-semibold text-[#007979] hover:underline">211</a> to talk to someone near you, or ask our assistant (bottom right).</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <mat-icon class="text-[#007979]" aria-hidden="true">add_business</mat-icon>
            <h2 class="mt-2 text-base font-bold text-[#032D42]">Know a service we're missing?</h2>
            <p class="mt-1 text-sm text-gray-600">Organizations and neighbors can list services for free.</p>
            <a routerLink="/submit" class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
              Suggest a resource
              <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
            </a>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-[#032D42] to-[#035e5e] p-5 text-white shadow-sm">
            <mat-icon class="text-[#12BFC3]" aria-hidden="true">verified</mat-icon>
            <h2 class="mt-2 text-base font-bold">Checked by people</h2>
            <p class="mt-1 text-sm text-white/80">Zebron verifies listings and shows when they were last checked. Something wrong? Tell us from any resource page.</p>
          </div>
        </section>
      } @else {
        <!-- ===================== Category / search results ===================== -->
        <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
          <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
            <!-- Back, breadcrumb and title on one line -->
            <div class="flex min-w-0 items-center gap-1 lg:w-[250px] lg:shrink-0">
              <button
                type="button"
                (click)="topics()"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="All categories"
                title="All categories"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
              </button>
              <h1 class="min-w-0 truncate text-lg font-bold leading-tight" [attr.title]="heading().text || null">{{ heading().title }}</h1>
            </div>

            <!-- Search within -->
            <form
              role="search"
              (submit)="$event.preventDefault()"
              class="flex min-w-0 flex-1 items-center rounded-xl bg-white text-gray-900 shadow-sm"
            >
              <label class="flex min-w-0 flex-[3] items-center gap-2 px-3">
                <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] text-gray-400" aria-hidden="true">search</mat-icon>
                <span class="sr-only">Search</span>
                <input
                  type="search"
                  [value]="filters().q"
                  (input)="set('q', $any($event.target).value)"
                  [placeholder]="currentNeed() ? 'Search within ' + currentNeed()!.title : 'Search services or programs'"
                  class="h-9 w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm !outline-none placeholder:text-gray-500 focus:ring-0"
                />
              </label>
              <span class="h-6 w-px bg-gray-200" aria-hidden="true"></span>
              <app-location-picker
                class="flex-[2]"
                [locations]="locations()"
                [value]="filters().near"
                [counts]="placeCounts()"
                (valueChange)="setNear($event)"
              />
            </form>
          </div>
        </header>

        <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div class="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            <!-- ===================== Refine (sidebar on desktop, panel on phones) ===================== -->
            <aside class="lg:block" [class.hidden]="!filtersOpen()" id="resource-refine" aria-label="Refine results">
              <div class="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
                <div>
                  <h2 class="text-sm font-bold text-[#032D42]">Show only</h2>
                  <div class="mt-2 space-y-1">
                    @for (option of toggles; track option.key) {
                      <label class="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          [checked]="filters()[option.key]"
                          (change)="toggle(option.key)"
                          class="h-4 w-4 rounded border-gray-300 text-[#007979] focus:ring-[#007979]"
                        />
                        <mat-icon class="!h-4 !w-4 !text-base !leading-none text-gray-400" aria-hidden="true">{{ option.icon }}</mat-icon>
                        {{ option.label }}
                      </label>
                    }
                  </div>
                </div>

                @if (resourceTypes().length) {
                  <div>
                    <label for="resource-type" class="text-sm font-bold text-[#032D42]">Type</label>
                    <select
                      id="resource-type"
                      (change)="set('type', $any($event.target).value)"
                      class="mt-2 h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20"
                    >
                      <option value="" [selected]="!filters().type">Any type</option>
                      @for (type of resourceTypes(); track type.id) {
                        <option [value]="type.slug" [selected]="filters().type === type.slug">{{ type.name }}</option>
                      }
                    </select>
                  </div>
                }

                <div>
                  <h2 class="text-sm font-bold text-[#032D42]">Categories</h2>
                  <ul class="mt-2 max-h-[22rem] space-y-0.5 overflow-y-auto pr-1">
                    @for (need of needs(); track need.need.key) {
                      <li>
                        <a
                          [routerLink]="need.link"
                          [queryParams]="need.query"
                          class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition {{
                            currentNeed()?.key === need.need.key ? 'bg-[#007979] font-semibold text-white' : 'text-gray-700 hover:bg-[#E8F4F4] hover:text-[#007979]'
                          }}"
                          [attr.aria-current]="currentNeed()?.key === need.need.key ? 'page' : null"
                        >
                          <span class="truncate">{{ need.need.title }}</span>
                          @if (need.count) {
                            <span class="text-xs {{ currentNeed()?.key === need.need.key ? 'text-white/80' : 'text-gray-400' }}">{{ need.count }}</span>
                          }
                        </a>
                      </li>
                    }
                  </ul>
                </div>

                @if (refined()) {
                  <button type="button" (click)="clearRefine()" class="w-full rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Clear filters
                  </button>
                }
              </div>
            </aside>

            <!-- ===================== Results ===================== -->
            <section aria-labelledby="results-count" class="min-w-0">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p id="results-count" class="text-sm text-gray-600" aria-live="polite">
                  @if (loading()) {
                    Loading…
                  } @else {
                    <strong class="text-[#032D42]">{{ results().length }}</strong>
                    {{ results().length === 1 ? 'result' : 'results' }}
                    @if (nearName()) {
                      in {{ nearName() }} or online
                    }
                  }
                </p>
                <button
                  type="button"
                  (click)="filtersOpen.set(!filtersOpen())"
                  class="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 lg:hidden"
                  [attr.aria-expanded]="filtersOpen()"
                  aria-controls="resource-refine"
                >
                  <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">tune</mat-icon>
                  Filters{{ refinedCount() ? ' (' + refinedCount() + ')' : '' }}
                </button>
              </div>

              <!-- Active filters, each removable -->
              @if (activeChips().length) {
                <ul class="mb-3 flex flex-wrap gap-2" aria-label="Active filters">
                  @for (chip of activeChips(); track chip.label) {
                    <li>
                      <button
                        type="button"
                        (click)="chip.remove()"
                        class="inline-flex h-8 items-center gap-1 rounded-full border border-[#007979]/30 bg-[#E8F4F4] pl-3 pr-2 text-sm font-medium text-[#035e5e] hover:border-[#007979]"
                        [attr.aria-label]="'Remove filter: ' + chip.label"
                      >
                        {{ chip.label }}
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">close</mat-icon>
                      </button>
                    </li>
                  }
                </ul>
              }

              @if (loading()) {
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (item of [1, 2, 3, 4]; track item) {
                    <div class="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white"></div>
                  }
                </div>
              } @else if (error()) {
                <div class="rounded-2xl border border-red-200 bg-white p-6 text-center text-sm text-red-700">
                  {{ error() }}
                  <button type="button" (click)="load()" class="ml-2 font-semibold underline">Try again</button>
                </div>
              } @else if (!results().length) {
                <div class="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
                  <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <mat-icon class="text-gray-500" aria-hidden="true">search_off</mat-icon>
                  </span>
                  <h2 class="mt-3 text-base font-semibold text-[#032D42]">
                    {{ currentNeed() ? 'No ' + currentNeed()!.title.toLowerCase() + ' listings yet' : 'Nothing matches' }}{{ nearName() ? ' in ' + nearName() : '' }}
                  </h2>
                  <p class="mx-auto mt-1 max-w-md text-sm text-gray-600">
                    @if (refined()) {
                      Try removing a filter.
                    } @else {
                      We're still adding services. Dial
                      <a href="tel:211" class="font-semibold text-[#007979] hover:underline">211</a>
                      to talk to someone near you, or ask our assistant.
                    }
                  </p>
                  <div class="mt-4 flex flex-wrap justify-center gap-2">
                    @if (refined()) {
                      <button type="button" (click)="clearRefine()" class="inline-flex h-9 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">Clear filters</button>
                    }
                    <button type="button" (click)="topics()" class="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:border-[#007979] hover:text-[#007979]">All categories</button>
                    <a routerLink="/submit" class="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:border-[#007979] hover:text-[#007979]">Suggest a resource</a>
                  </div>
                </div>
              } @else {
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (resource of visible(); track resource.id) {
                    <app-resource-card
                      [resource]="resource"
                      [category]="categoryById().get(resource.categoryId)"
                      [place]="placeOf(resource)"
                      [programs]="programSummaries().get(resource.id)"
                    />
                  }
                </div>
                @if (results().length > visible().length) {
                  <div class="mt-5 text-center">
                    <button
                      type="button"
                      (click)="limit.set(limit() + pageSize)"
                      class="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-[#032D42] hover:border-[#007979] hover:text-[#007979]"
                    >
                      Show more ({{ results().length - visible().length }})
                    </button>
                  </div>
                }
              }

              @if (currentNeed()?.key === 'jobs' || currentNeed()?.key === 'education') {
                <a routerLink="/bootcamps" class="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#032D42] to-[#035e5e] p-4 text-white shadow-sm hover:shadow-md">
                  <mat-icon class="text-[#12BFC3]" aria-hidden="true">rocket_launch</mat-icon>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-bold">Thinking about a tech career?</span>
                    <span class="block text-xs text-white/80">Compare bootcamps by field, cost, schedule and next class.</span>
                  </span>
                  <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                </a>
              }
            </section>
          </div>
        </div>
      }
    </main>
  `,
})
export class ResourceListComponent implements OnInit {
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly locationService = inject(LocationService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly bootcampService = inject(BootcampService);
  private readonly personalization = inject(PersonalizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;

  protected readonly resources = signal<Resource[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly resourceTypes = signal<ResourceType[]>([]);
  protected readonly programSummaries = this.bootcampService.summaries;
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly filters = signal<DirectoryFilters>(EMPTY);
  protected readonly limit = signal(PAGE_SIZE);
  protected readonly searchOpen = signal(false);

  protected readonly categoryById = computed(() => new Map(this.categories().map((category) => [category.id, category])));
  private readonly locationById = computed(() => new Map(this.locations().map((place) => [place.id ?? '', place])));

  protected readonly selectedCategory = computed(() => this.categories().find((category) => category.slug === this.filters().category) ?? null);

  protected readonly nearName = computed(() => {
    const place = this.locationById().get(this.filters().near);
    return place ? this.placeName(place) : '';
  });

  protected readonly anyFilter = computed(() => {
    const value = this.filters();
    return !!(value.q || value.topic || value.category || value.near || value.type || value.free || value.online || value.verified);
  });

  /** Matching resources: featured first, then the visitor's interests, then verified, then newest. */
  protected readonly results = computed(() => {
    const value = this.filters();
    const words = value.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const categoryId = this.selectedCategory()?.id ?? (value.category ? '__none__' : '');
    const typeName = this.resourceTypes().find((type) => type.slug === value.type)?.name.toLowerCase();
    const interests = this.personalization.preferences().interests;
    const need = this.currentNeed();

    const matches = this.resources().filter((resource) => {
      if (categoryId && resource.categoryId !== categoryId) return false;
      if (need && !this.inNeed(resource, need)) return false;
      if (value.near && resource.locationId !== value.near && !resource.online) return false;
      if (value.type && resource.resourceType !== value.type && resource.resourceType?.toLowerCase() !== typeName) return false;
      if (value.free && !resource.cost?.free) return false;
      if (value.online && !resource.online) return false;
      if (value.verified && !resource.verified) return false;
      if (words.length) {
        const text = [resource.name, resource.description, ...(resource.tags ?? []), this.categoryById().get(resource.categoryId)?.name ?? '']
          .join(' ')
          .toLowerCase();
        if (!words.every((word) => text.includes(word))) return false;
      }
      return true;
    });

    const score = (resource: Resource) =>
      (resource.featured ? 4 : 0) + (interests.includes(resource.categoryId) ? 2 : 0) + (resource.verified ? 1 : 0);
    return matches
      .map((resource, index) => ({ resource, index, score: score(resource) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.resource);
  });

  protected readonly visible = computed(() => this.results().slice(0, this.limit()));

  // ----------------------------------------------------------
  // Front door (shown until the visitor searches or filters)
  // ----------------------------------------------------------

  protected readonly popular = POPULAR_SEARCHES;

  /** Results instead of the front door once anything is searched or chosen. */
  protected readonly showResults = computed(() => {
    const value = this.filters();
    // The place alone (remembered on this device) keeps the front door.
    return !!(value.q || value.topic || value.category || value.type || value.free || value.online || value.verified || value.all);
  });

  /** Topic of each category (first matching topic). */
  private readonly needByCategory = computed(
    () => new Map<string, ResourceNeed | undefined>(this.categories().map((category) => [category.id, needOf(category)])),
  );

  /** In a topic: its category belongs to it, or its text mentions the topic's words. */
  private inNeed(resource: Resource, need: ResourceNeed): boolean {
    if (this.needByCategory().get(resource.categoryId) === need) {
      return true;
    }
    const text = [resource.name, resource.description, ...(resource.tags ?? [])].join(' ').toLowerCase();
    return need.keywords.some((word) => word.length > 3 && text.includes(word));
  }

  protected readonly currentNeed = computed(() => RESOURCE_NEEDS.find((need) => need.key === this.filters().topic) ?? null);

  /** Title, breadcrumb and description of the results page. */
  protected readonly heading = computed(() => {
    const need = this.currentNeed();
    if (need) {
      return { title: need.title, crumb: need.title, text: need.text };
    }
    const category = this.selectedCategory();
    if (category) {
      return { title: category.name, crumb: category.name, text: category.description ?? '' };
    }
    const q = this.filters().q.trim();
    if (q) {
      return { title: `Results for “${q}”`, crumb: 'Search', text: '' };
    }
    return { title: 'All resources', crumb: 'All resources', text: 'Every service, program and place listed on Zebron.' };
  });

  // ----------------------------------------------------------
  // Refine (filters inside a category)
  // ----------------------------------------------------------

  protected readonly filtersOpen = signal(false);

  protected readonly toggles: { key: 'free' | 'online' | 'verified'; label: string; icon: string }[] = [
    { key: 'free', label: 'Free', icon: 'savings' },
    { key: 'online', label: 'Available online', icon: 'language' },
    { key: 'verified', label: 'Verified by Zebron', icon: 'verified' },
  ];

  /** Filters on top of the category or search. */
  protected readonly refinedCount = computed(() => {
    const value = this.filters();
    return [value.free, value.online, value.verified, !!value.type].filter(Boolean).length;
  });
  protected readonly refined = computed(() => this.refinedCount() > 0 || !!this.filters().near || (!!this.filters().q && !!(this.filters().topic || this.filters().category)));

  /** Removes the refinements, keeping the category or topic. */
  protected clearRefine(): void {
    const value = this.filters();
    this.personalization.setLocation(null);
    this.update({ ...EMPTY, topic: value.topic, category: value.category, all: value.all, q: value.topic || value.category ? '' : value.q });
  }

  /** Removable chips for what is applied. */
  protected readonly activeChips = computed(() => {
    const value = this.filters();
    const chips: { label: string; remove: () => void }[] = [];
    if (value.q && (value.topic || value.category)) chips.push({ label: `“${value.q}”`, remove: () => this.set('q', '') });
    if (value.near && this.nearName()) chips.push({ label: this.nearName(), remove: () => this.setNear('') });
    for (const option of this.toggles) {
      if (value[option.key]) chips.push({ label: option.label, remove: () => this.toggle(option.key) });
    }
    if (value.type) {
      const name = this.resourceTypes().find((type) => type.slug === value.type)?.name ?? value.type;
      chips.push({ label: name, remove: () => this.set('type', '') });
    }
    return chips;
  });

  /** Back to the front door, keeping the place. */
  protected topics(): void {
    this.update({ ...EMPTY, near: this.filters().near });
  }

  /** Each topic with its link and how many resources it covers. */
  protected readonly needs = computed(() => {
    return RESOURCE_NEEDS.map((need) => {
      const count = this.resources().filter((resource) => this.inNeed(resource, need)).length;
      if (need.route) {
        return { need, count, link: need.route, query: {} as Params };
      }
      return { need, count, link: '/resources', query: { topic: need.key } as Params };
    });
  });

  /** Featured first, then verified. */
  protected readonly featured = computed(() =>
    this.resources()
      .filter((resource) => resource.featured || resource.verified)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, 6),
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      // Bootcamps have their own page.
      const category = params.get('category') ?? '';
      if (category && this.isBootcamps(this.categories().find((item) => item.slug === category))) {
        void this.router.navigate(['/bootcamps'], { replaceUrl: true });
        return;
      }
      this.filters.set({
        q: params.get('q') ?? '',
        topic: params.get('topic') ?? '',
        category,
        near: params.get('near') ?? this.personalization.preferences().locationId ?? '',
        type: params.get('type') ?? '',
        free: params.get('free') === '1',
        online: params.get('online') === '1',
        verified: params.get('verified') === '1',
        all: params.get('all') === '1',
      });
      this.limit.set(PAGE_SIZE);
    });
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    void this.bootcampService.loadSummaries();
    const [resources, categories, locations, types] = await Promise.all([
      this.resourceService.getPublishedResources().catch((error) => {
        console.error('Failed to load resources:', error);
        this.error.set('Unable to load resources. Please try again.');
        return [] as Resource[];
      }),
      this.categoryService.getActiveCategories().catch(() => [] as Category[]),
      this.locationService.getAllLocations().catch(() => [] as Location[]),
      this.resourceTypeService.getActiveResourceTypes().catch(() => [] as ResourceType[]),
    ]);
    this.resources.set(resources);
    this.categories.set(categories);
    this.locations.set(
      [...locations].sort((a, b) => this.placeName(a).localeCompare(this.placeName(b))),
    );
    this.resourceTypes.set(types);
    this.loading.set(false);

    // An old link such as /resources?category=bootcamps opens the Bootcamps page.
    if (this.isBootcamps(this.selectedCategory())) {
      void this.router.navigate(['/bootcamps'], { replaceUrl: true });
    }
  }

  // ----------------------------------------------------------
  // Filters (kept in the address)
  // ----------------------------------------------------------

  protected set(key: 'q' | 'category' | 'type' | 'near', value: string): void {
    this.update({ ...this.filters(), [key]: value });
  }

  /** Front door search: opens the results. */
  protected search(event: Event, query: string): void {
    event.preventDefault();
    this.update({ ...this.filters(), q: query.trim(), all: true });
  }

  /** Resources per place, shown in the "Where?" picker. */
  protected readonly placeCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const resource of this.resources()) {
      if (resource.locationId) counts.set(resource.locationId, (counts.get(resource.locationId) ?? 0) + 1);
    }
    return counts;
  });

  protected browseAll(): void {
    this.update({ ...this.filters(), all: true });
  }

  protected toggle(key: 'free' | 'online' | 'verified'): void {
    this.update({ ...this.filters(), [key]: !this.filters()[key] });
  }

  /** "Where are you?" is also remembered on this device. */
  protected setNear(locationId: string): void {
    this.personalization.setLocation(locationId || null);
    this.set('near', locationId);
  }

  protected clear(): void {
    this.personalization.setLocation(null);
    this.update(EMPTY);
  }

  private update(next: DirectoryFilters): void {
    const params: Params = {
      q: next.q || null,
      topic: next.topic || null,
      category: next.category || null,
      near: next.near || null,
      type: next.type || null,
      free: next.free ? '1' : null,
      online: next.online ? '1' : null,
      verified: next.verified ? '1' : null,
      all: next.all ? '1' : null,
    };
    this.filters.set(next);
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, replaceUrl: true });
  }

  protected toggleSearch(input: HTMLInputElement): void {
    this.searchOpen.update((open) => !open);
    if (this.searchOpen()) {
      setTimeout(() => input.focus());
    }
  }

  // ----------------------------------------------------------
  // Display helpers
  // ----------------------------------------------------------

  protected isBootcamps(category: Category | null | undefined): boolean {
    return !!category && resourceKind(category).kind === 'bootcamp';
  }

  protected icon(category: Category): string {
    return resourceKind(category).icon;
  }

  protected placeName(place: Location): string {
    return [place.city, place.state].filter(Boolean).join(', ') || place.address || place.country || 'Unnamed place';
  }

  protected placeOf(resource: Resource): string {
    const place = resource.locationId ? this.locationById().get(resource.locationId) : undefined;
    return place ? [place.city, place.state].filter(Boolean).join(', ') : '';
  }

  protected pill(active: boolean): string {
    return (
      'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (active ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
    );
  }

  protected selectPill(value: string): string {
    return (
      'h-8 shrink-0 cursor-pointer rounded-full border py-0 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (value ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
    );
  }

  protected categoryChip(active: boolean): string {
    return (
      'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (active ? 'border-[#007979] bg-[#007979] text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-[#007979] hover:text-[#007979]')
    );
  }
}
