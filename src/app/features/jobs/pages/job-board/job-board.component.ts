import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { EmploymentType, Job, WorkArrangement } from '../../../../core/models/job.model';
import { JobStore } from '../../stores/job.store';
import { SaveJobButtonComponent } from '../../components/save-job-button.component';

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const VIEW_KEY = 'zebron.jobBoard.view';

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

const ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  'on-site': 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

/** The query parameters this page reads and writes. */
interface BoardFilters {
  q: string;
  location: string;
  category: string;
  type: string;
  arrangement: string;
}

const EMPTY: BoardFilters = { q: '', location: '', category: '', type: '', arrangement: '' };

/**
 * /jobs: the public Zebron job board. Every open listing, with filters kept
 * in the address (?q=&location=&category=&type=&arrangement=) so searches
 * can be shared and linked from job alert emails. Free, no account needed.
 */
@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [RouterLink, MatIconModule, SaveJobButtonComponent],
  template: `
    <main class="min-h-screen bg-gray-50 mt-16">
      <!-- Search and filters stay in view below the universal header (h-16, fixed). -->
      <div class="sticky top-16 z-40 shadow-sm">
      <!-- Search band under the universal header -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto max-w-6xl px-4 py-2 sm:px-6 lg:px-8">
          <!-- The universal header shows the page name ("Job board"). -->
          <h1 class="sr-only">Job board</h1>

          <form
            class="flex flex-col overflow-hidden rounded-xl bg-white text-gray-900 shadow-sm sm:flex-row sm:items-center"
            role="search"
            (submit)="$event.preventDefault()"
          >
            <!-- Keywords: always on wider screens; on phones, opened with the search icon. -->
            <label
              id="job-keywords"
              class="min-w-0 flex-1 items-center gap-2 px-3 transition-colors focus-within:bg-[#007979]/5 sm:flex"
              [class.flex]="searchOpen()"
              [class.hidden]="!searchOpen()"
            >
              <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">search</mat-icon>
              <span class="sr-only">Keywords</span>
              <input
                #keywords
                type="search"
                [value]="filters().q"
                (input)="type('q', $any($event.target).value)"
                placeholder="Job title, skill or employer"
                class="h-9 w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm shadow-none !outline-none placeholder:text-gray-500 focus:border-0 focus:shadow-none focus:ring-0 focus-visible:!outline-none"
              />
            </label>
            <span
              class="mx-3 h-px bg-gray-200 sm:mx-0 sm:block sm:h-6 sm:w-px"
              [class.hidden]="!searchOpen()"
              aria-hidden="true"
            ></span>
            <div class="flex min-w-0 flex-1 items-center">
            <label class="flex min-w-0 flex-1 items-center gap-2 px-3 transition-colors focus-within:bg-[#007979]/5">
              <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">place</mat-icon>
              <span class="sr-only">Location</span>
              <input
                type="search"
                [value]="filters().location"
                (input)="type('location', $any($event.target).value)"
                placeholder="City or state"
                class="h-9 w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm shadow-none !outline-none placeholder:text-gray-500 focus:border-0 focus:shadow-none focus:ring-0 focus-visible:!outline-none"
              />
            </label>
            <!-- Phones: show or hide the keyword search. -->
            <button
              type="button"
              (click)="toggleSearch(keywords)"
              class="mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition sm:hidden"
              [class]="searchOpen() ? 'bg-[#007979]/10 text-[#007979]' : 'text-gray-500 hover:bg-gray-100'"
              [attr.aria-expanded]="searchOpen()"
              aria-controls="job-keywords"
              [attr.aria-label]="searchOpen() ? 'Hide keyword search' : 'Search by keyword'"
            >
              <mat-icon aria-hidden="true">{{ searchOpen() && !filters().q ? 'search_off' : 'search' }}</mat-icon>
            </button>
            </div>
          </form>
        </div>
      </header>

      <!-- Filters -->
      <div class="border-b border-gray-200 bg-white">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-0.5 sm:px-6 lg:px-8">
          <label class="sr-only" for="job-arrangement">Work arrangement</label>
          <select
            id="job-arrangement"
            (change)="set('arrangement', $any($event.target).value)"
            [class]="chip(filters().arrangement)"
          >
            <option value="" [selected]="!filters().arrangement">Any arrangement</option>
            @for (option of arrangements; track option.value) {
              <option [value]="option.value" [selected]="filters().arrangement === option.value">{{ option.label }}</option>
            }
          </select>
          <label class="sr-only" for="job-type">Job type</label>
          <select
            id="job-type"
            (change)="set('type', $any($event.target).value)"
            [class]="chip(filters().type)"
          >
            <option value="" [selected]="!filters().type">Any job type</option>
            @for (option of employmentTypes; track option.value) {
              <option [value]="option.value" [selected]="filters().type === option.value">{{ option.label }}</option>
            }
          </select>
          <label class="sr-only" for="job-category">Category</label>
          <select
            id="job-category"
            (change)="set('category', $any($event.target).value)"
            [class]="chip(filters().category)"
          >
            <option value="" [selected]="!filters().category">Any category</option>
            @for (category of store.categories(); track category) {
              <option [value]="category" [selected]="filters().category === category">{{ category }}</option>
            }
          </select>
          @if (anyFilter()) {
            <button
              type="button"
              (click)="clear()"
              class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">close</mat-icon>
              Clear all
            </button>
          }
          <a
            routerLink="/jobs/my"
            class="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-[#007979] hover:bg-[#007979]/10"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">bookmark_border</mat-icon>
            Saved jobs and alerts
          </a>
        </div>
      </div>
      </div>

      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        @if (store.loading() && !store.jobs().length) {
          <p class="py-16 text-center text-sm text-gray-500">Loading jobs…</p>
        } @else if (store.error()) {
          <div class="rounded-xl border border-red-200 bg-white p-6 text-center text-sm text-red-700">
            {{ store.error() }}
            <button type="button" (click)="reload()" class="ml-2 font-semibold underline">Try again</button>
          </div>
        } @else {
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm text-gray-600" aria-live="polite">
              <strong class="text-[#032D42]">{{ results().length }}</strong>
              {{ results().length === 1 ? 'job' : 'jobs' }}{{ anyFilter() ? ' match your search' : ' open now' }}
              @if (anyFilter()) {
                · <a routerLink="/jobs/my" class="font-medium text-[#007979] hover:underline">Set a job alert</a>
              }
            </p>
            <!-- List or card view, remembered on this device -->
            <div class="inline-flex rounded-lg border border-gray-300 bg-white p-0.5" role="group" aria-label="View">
              <button
                type="button"
                (click)="setView('list')"
                [attr.aria-pressed]="view() === 'list'"
                title="List"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md transition"
                [class]="view() === 'list' ? 'bg-[#007979] text-white' : 'text-gray-600 hover:bg-gray-100'"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">view_list</mat-icon>
                <span class="sr-only">List</span>
              </button>
              <button
                type="button"
                (click)="setView('cards')"
                [attr.aria-pressed]="view() === 'cards'"
                title="Cards"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md transition"
                [class]="view() === 'cards' ? 'bg-[#007979] text-white' : 'text-gray-600 hover:bg-gray-100'"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">grid_view</mat-icon>
                <span class="sr-only">Cards</span>
              </button>
            </div>
          </div>

          @if (!results().length) {
            <section class="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 class="text-base font-bold text-[#032D42]">No jobs match yet</h2>
              <p class="mt-1 text-sm text-gray-600">Try fewer words or another location, or set a job alert to hear when one is posted.</p>
              <div class="mt-4 flex justify-center gap-2">
                <button type="button" (click)="clear()" class="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:border-[#007979]">
                  Clear search
                </button>
                <a routerLink="/jobs/my" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                  Set a job alert
                </a>
              </div>
            </section>
          } @else {
            @if (view() === 'list') {
              <!-- List: one compact row per job -->
              <ul class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                @for (job of shown(); track job.id) {
                  <li class="flex items-center gap-2 px-3 py-2.5 transition hover:bg-gray-50 sm:px-4">
                    <a [routerLink]="['/jobs', job.id]" class="min-w-0 flex-1">
                      <span class="flex min-w-0 items-center gap-1.5">
                        <span class="truncate text-sm font-semibold text-[#032D42] sm:text-[15px]">{{ job.title }}</span>
                        @if (job.featured) {
                          <span class="shrink-0 rounded-full bg-[#007979]/10 px-1.5 py-px text-[11px] font-semibold text-[#007979]">Featured</span>
                        }
                        @if (isNew(job)) {
                          <span class="shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold text-amber-800">New</span>
                        }
                      </span>
                      <span class="mt-0.5 block truncate text-xs text-gray-600 sm:text-[13px]">
                        {{ meta(job, true) }}
                        @if (pay(job)) {
                          · <span class="font-medium text-gray-700">{{ pay(job) }}</span>
                        }
                      </span>
                    </a>
                    <span class="hidden shrink-0 text-xs text-gray-500 sm:block" [attr.title]="postedTitle(job)">{{ posted(job) }}</span>
                    <app-save-job-button [job]="job" [iconOnly]="true" />
                    <a
                      [routerLink]="['/jobs', job.id]"
                      class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#007979] sm:inline-flex"
                      [attr.aria-label]="'View ' + job.title"
                    >
                      <mat-icon aria-hidden="true">chevron_right</mat-icon>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <!-- Cards: compact grid -->
              <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @for (job of shown(); track job.id) {
                  <li>
                    <article class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition hover:border-[#7ED6D1] hover:shadow-md">
                      <div class="flex flex-wrap items-center gap-1">
                        @if (job.featured) {
                          <span class="rounded-full bg-[#007979]/10 px-1.5 py-px text-[11px] font-semibold text-[#007979]">Featured</span>
                        }
                        @if (isNew(job)) {
                          <span class="rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold text-amber-800">New</span>
                        }
                        <span class="rounded-full bg-gray-100 px-1.5 py-px text-[11px] font-medium text-gray-600">{{ arrangement(job) }}</span>
                        <span class="rounded-full bg-gray-100 px-1.5 py-px text-[11px] font-medium text-gray-600">{{ employment(job) }}</span>
                      </div>
                      <h2 class="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-[#032D42]">
                        <a [routerLink]="['/jobs', job.id]" class="hover:text-[#007979]">{{ job.title }}</a>
                      </h2>
                      <p class="mt-0.5 truncate text-[13px] text-gray-600">
                        {{ meta(job, false) }}
                      </p>
                      @if (pay(job)) {
                        <p class="mt-0.5 text-[13px] font-medium text-gray-700">{{ pay(job) }}</p>
                      }
                      <div class="mt-auto flex items-center gap-1 pt-2">
                        <span class="mr-auto truncate text-xs text-gray-500" [attr.title]="postedTitle(job)">{{ posted(job) }}</span>
                        <app-save-job-button [job]="job" [iconOnly]="true" />
                        <a
                          [routerLink]="['/jobs', job.id]"
                          class="inline-flex h-9 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]"
                        >
                          View
                        </a>
                      </div>
                    </article>
                  </li>
                }
              </ul>
            }

            @if (results().length > shown().length) {
              <div class="mt-4 text-center">
                <button
                  type="button"
                  (click)="showMore()"
                  class="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:border-[#007979] hover:text-[#007979]"
                >
                  Show more ({{ results().length - shown().length }} left)
                </button>
              </div>
            }
          }
        }
        <p class="mt-8 text-center text-xs text-gray-500">
          Free to use. Jobs are gathered from employers and job sites by the Zebron team; Apply opens the employer's own site.
        </p>
      </div>
    </main>
  `,
})
export class JobBoardComponent implements OnInit {
  protected readonly store = inject(JobStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly arrangements = Object.entries(ARRANGEMENT_LABELS).map(([value, label]) => ({ value, label }));
  protected readonly employmentTypes = Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({ value, label }));

  protected readonly filters = signal<BoardFilters>(EMPTY);
  private readonly limit = signal(PAGE_SIZE);
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  /** List or card view, remembered on this device. */
  protected readonly view = signal<'list' | 'cards'>(this.savedView());

  protected setView(view: 'list' | 'cards'): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Storage can be unavailable (private mode, SSR): the choice lasts this visit.
    }
  }

  private savedView(): 'list' | 'cards' {
    try {
      return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'list';
    } catch {
      return 'list';
    }
  }

  /** Phones: keyword search opened with the search icon (always open while it has words). */
  private readonly keywordsOpen = signal(false);
  protected readonly searchOpen = computed(() => this.keywordsOpen() || this.filters().q.trim() !== '');

  protected readonly anyFilter = computed(() => Object.values(this.filters()).some((value) => value.trim() !== ''));

  /** Featured first, then newest. */
  protected readonly results = computed(() =>
    [...this.store.filteredJobs()].sort(
      (a, b) => Number(b.featured === true) - Number(a.featured === true) || this.postedMillis(b) - this.postedMillis(a),
    ),
  );

  protected readonly shown = computed(() => this.results().slice(0, this.limit()));

  ngOnInit(): void {
    // The address is the source of truth for the filters.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const next: BoardFilters = {
        q: params.get('q') ?? '',
        location: params.get('location') ?? '',
        category: params.get('category') ?? '',
        type: params.get('type') ?? '',
        arrangement: params.get('arrangement') ?? '',
      };
      this.filters.set(next);
      this.limit.set(PAGE_SIZE);
      this.store.setSearchTerm(next.q);
      this.store.setLocation(next.location);
      this.store.setCategory(next.category);
      this.store.setEmploymentType(next.type);
      this.store.setWorkArrangement(next.arrangement);
    });

    if (!this.store.jobs().length) {
      void this.store.loadActiveJobs();
    }
  }

  /** A filter as a pill: tinted when it is set. */
  protected chip(value: string): string {
    return (
      'h-8 cursor-pointer rounded-full border py-0 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (value ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
    );
  }

  protected toggleSearch(input: HTMLInputElement): void {
    if (this.searchOpen()) {
      // Closing clears the words, so the field can hide.
      this.keywordsOpen.set(false);
      if (this.filters().q) {
        this.type('q', '');
        input.value = '';
      }
      return;
    }
    this.keywordsOpen.set(true);
    setTimeout(() => input.focus());
  }

  protected reload(): void {
    void this.store.loadActiveJobs();
  }

  /** Text boxes: update the address after a short pause in typing. */
  protected type(key: 'q' | 'location', value: string): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(() => this.set(key, value), 300);
  }

  protected set(key: keyof BoardFilters, value: string): void {
    const next = { ...this.filters(), [key]: value };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toParams(next),
      replaceUrl: true,
    });
  }

  protected clear(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected showMore(): void {
    this.limit.update((value) => value + PAGE_SIZE);
  }

  /** Employer · place, and in the list view also arrangement · job type. */
  protected meta(job: Job, withKind: boolean): string {
    return [job.organizationName, this.place(job), ...(withKind ? [this.arrangement(job), this.employment(job)] : [])]
      .filter(Boolean)
      .join(' · ');
  }

  protected employment(job: Job): string {
    return EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType;
  }

  protected arrangement(job: Job): string {
    return ARRANGEMENT_LABELS[job.workArrangement] ?? job.workArrangement;
  }

  protected place(job: Job): string {
    const location = job.location;
    if (!location) {
      return '';
    }
    return [location.city, location.state].filter(Boolean).join(', ') || location.country || '';
  }

  protected pay(job: Job): string {
    const pay = job.compensation;
    if (!pay || (pay.min == null && pay.max == null)) {
      return '';
    }
    const money = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: pay.currency || 'USD', maximumFractionDigits: 0 }).format(value);
    const range =
      pay.min != null && pay.max != null && pay.min !== pay.max
        ? `${money(pay.min)} to ${money(pay.max)}`
        : money((pay.min ?? pay.max) as number);
    return `${range}${pay.period === 'hour' ? ' an hour' : pay.period === 'year' ? ' a year' : ''}`;
  }

  /** "Posted today", "Posted 3 days ago", or the date for older listings. */
  protected posted(job: Job): string {
    const millis = this.postedMillis(job);
    if (!millis) {
      return '';
    }
    const days = Math.floor((this.startOfToday() - this.startOfDay(millis)) / DAY_MS);
    if (days <= 0) {
      return 'Posted today';
    }
    if (days === 1) {
      return 'Posted yesterday';
    }
    if (days < 30) {
      return `Posted ${days} days ago`;
    }
    return `Posted ${new Date(millis).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  /** Full date for the tooltip. */
  protected postedTitle(job: Job): string | null {
    const millis = this.postedMillis(job);
    return millis ? new Date(millis).toLocaleDateString('en-US', { dateStyle: 'long' }) : null;
  }

  private startOfDay(millis: number): number {
    const date = new Date(millis);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  private startOfToday(): number {
    return this.startOfDay(Date.now());
  }

  /** Posted in the last 7 days. */
  protected isNew(job: Job): boolean {
    return Date.now() - this.postedMillis(job) < 7 * 24 * 60 * 60 * 1000;
  }

  private postedMillis(job: Job): number {
    return job.postedAt?.toMillis() ?? job.createdAt?.toMillis() ?? 0;
  }

  private toParams(filters: BoardFilters): Params {
    return Object.fromEntries(
      Object.entries(filters)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== ''),
    );
  }
}
