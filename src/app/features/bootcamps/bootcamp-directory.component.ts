import { Component, DOCUMENT, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import {
  BOOTCAMP_FIELDS,
  BootcampField,
  BootcampProgram,
  costLabel,
  dateLabel,
  fieldLabel,
  formatLabel,
  isFree,
  lengthLabel,
  openStarts,
  scheduleLabel,
  todayKey,
} from './bootcamp.model';
import { BootcampEntry } from './bootcamp-directory.resolver';

const PAGE_SIZE = 20;
const SOON_DAYS = 60;

type SortKey = 'recommended' | 'next' | 'cost' | 'name';

interface BootcampFilters {
  q: string;
  field: BootcampField | '';
  cost: '' | 'free' | 'funded';
  format: '' | 'online' | 'in-person';
  schedule: '' | 'flexible' | 'full-time';
  soon: boolean;
  noDegree: boolean;
  english: boolean;
  sort: SortKey;
}

const EMPTY: BootcampFilters = { q: '', field: '', cost: '', format: '', schedule: '', soon: false, noDegree: false, english: false, sort: 'recommended' };

/** A bootcamp in the results, with the programs that match the filters. */
interface Result {
  entry: BootcampEntry;
  programs: BootcampProgram[];
  nextStart: string | null;
  recommended: boolean;
  lowestCost: number;
}

/**
 * /bootcamps: tech bootcamps for career changers and newcomers. Each is a
 * resource in the Bootcamps category; its programs (field, cost, schedule,
 * start dates, Zebron's take) come from bootcamps/{resourceId}. Filters work
 * on programs and live in the address so searches can be shared.
 */
@Component({
  selector: 'app-bootcamp-directory',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-gray-50">
      <div class="sticky top-16 z-40 shadow-sm">
        <!-- Search band (the universal header shows "Bootcamps") -->
        <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
          <div class="mx-auto max-w-6xl px-4 py-2 sm:px-6 lg:px-8">
            <form class="flex items-center overflow-hidden rounded-xl bg-white text-gray-900 shadow-sm" role="search" (submit)="$event.preventDefault()">
              <label class="flex min-w-0 flex-1 items-center gap-2 px-3 focus-within:bg-[#007979]/5">
                <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">search</mat-icon>
                <span class="sr-only">Search bootcamps</span>
                <input
                  type="search"
                  [value]="filters().q"
                  (input)="set('q', $any($event.target).value)"
                  placeholder="Skill, certification or bootcamp"
                  class="h-9 w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm shadow-none !outline-none placeholder:text-gray-500 focus:ring-0"
                />
              </label>
              <span class="h-6 w-px bg-gray-200" aria-hidden="true"></span>
              <label class="flex shrink-0 items-center gap-1 px-2 text-sm text-gray-600">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-gray-400" aria-hidden="true">sort</mat-icon>
                <span class="sr-only">Sort by</span>
                <select (change)="set('sort', $any($event.target).value)" class="h-9 cursor-pointer appearance-none border-0 bg-transparent p-0 pr-1 text-sm !outline-none focus:ring-0">
                  @for (option of sorts; track option.value) {
                    <option [value]="option.value" [selected]="filters().sort === option.value">{{ option.label }}</option>
                  }
                </select>
              </label>
            </form>
          </div>
        </header>

        <!-- Program filters -->
        <div class="border-b border-gray-200 bg-white">
          <div class="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-1.5 sm:flex-wrap sm:px-6 lg:px-8 [scrollbar-width:none]">
            <label class="sr-only" for="bc-cost">Cost</label>
            <select id="bc-cost" (change)="set('cost', $any($event.target).value)" [class]="selectPill(filters().cost)">
              <option value="" [selected]="!filters().cost">Any cost</option>
              <option value="free" [selected]="filters().cost === 'free'">Free</option>
              <option value="funded" [selected]="filters().cost === 'funded'">Free or funded</option>
            </select>
            <label class="sr-only" for="bc-format">Format</label>
            <select id="bc-format" (change)="set('format', $any($event.target).value)" [class]="selectPill(filters().format)">
              <option value="" [selected]="!filters().format">Online or in person</option>
              <option value="online" [selected]="filters().format === 'online'">Online</option>
              <option value="in-person" [selected]="filters().format === 'in-person'">In person</option>
            </select>
            <label class="sr-only" for="bc-schedule">Schedule</label>
            <select id="bc-schedule" (change)="set('schedule', $any($event.target).value)" [class]="selectPill(filters().schedule)">
              <option value="" [selected]="!filters().schedule">Any schedule</option>
              <option value="flexible" [selected]="filters().schedule === 'flexible'">Part-time, evenings or weekends</option>
              <option value="full-time" [selected]="filters().schedule === 'full-time'">Full-time</option>
            </select>
            <button type="button" (click)="toggle('soon')" [attr.aria-pressed]="filters().soon" [class]="pill(filters().soon)">
              <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">event</mat-icon>
              Starts within 2 months
            </button>
            <button type="button" (click)="toggle('noDegree')" [attr.aria-pressed]="filters().noDegree" [class]="pill(filters().noDegree)">No degree needed</button>
            <button type="button" (click)="toggle('english')" [attr.aria-pressed]="filters().english" [class]="pill(filters().english)">English support</button>
            @if (anyFilter()) {
              <button type="button" (click)="clear()" class="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">close</mat-icon>
                Clear all
              </button>
            }
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <!-- Intro -->
        <section class="overflow-hidden rounded-2xl bg-gradient-to-br from-[#032D42] to-[#035e5e] p-5 text-white shadow-sm sm:p-6">
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Find a tech bootcamp</h1>
          <p class="mt-1 max-w-2xl text-sm text-white/80 sm:text-base">
            Short, hands-on programs that lead to tech jobs. Compare what they teach, what they cost and when the next class starts.
          </p>
          <ul class="mt-4 hidden gap-3 text-sm sm:grid sm:grid-cols-3">
            <li class="flex gap-2">
              <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-[#12BFC3]" aria-hidden="true">verified</mat-icon>
              <span><strong>Recommended by Zebron</strong> marks programs we know well, with our honest take.</span>
            </li>
            <li class="flex gap-2">
              <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-[#12BFC3]" aria-hidden="true">savings</mat-icon>
              <span>Many seats are <strong>free or grant-funded</strong>. Filter by cost to find them.</span>
            </li>
            <li class="flex gap-2">
              <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-[#12BFC3]" aria-hidden="true">play_lesson</mat-icon>
              <span><a routerLink="/courses" class="font-semibold underline">Prepare for free</a> with our courses and practice tests.</span>
            </li>
          </ul>
        </section>

        <!-- Fields -->
        @if (fieldsInUse().length) {
          <nav aria-label="Fields" class="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
            <ul class="flex gap-2 sm:flex-wrap">
              <li>
                <button type="button" (click)="set('field', '')" [attr.aria-pressed]="!filters().field" [class]="fieldChip(!filters().field)">All fields</button>
              </li>
              @for (field of fieldsInUse(); track field.value) {
                <li>
                  <button
                    type="button"
                    (click)="set('field', filters().field === field.value ? '' : field.value)"
                    [attr.aria-pressed]="filters().field === field.value"
                    [class]="fieldChip(filters().field === field.value)"
                  >
                    {{ field.label }}
                    <span class="opacity-70">{{ field.count }}</span>
                  </button>
                </li>
              }
            </ul>
          </nav>
        }

        <div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-labelledby="bc-results" class="min-w-0">
            <h2 id="bc-results" class="sr-only">Bootcamps</h2>
            <p class="mb-3 text-sm text-gray-600" aria-live="polite">
              <strong class="text-[#032D42]">{{ results().length }}</strong>
              {{ results().length === 1 ? 'bootcamp' : 'bootcamps' }}{{ anyFilter() ? ' match' : '' }}
            </p>

            @if (!results().length) {
              <div class="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <mat-icon class="text-gray-500" aria-hidden="true">search_off</mat-icon>
                </span>
                <h3 class="mt-3 text-base font-semibold text-[#032D42]">{{ bootcamps().length ? 'No bootcamp matches all of that' : 'Bootcamps are coming soon' }}</h3>
                <p class="mt-1 text-sm text-gray-600">
                  {{ bootcamps().length ? 'Try fewer filters.' : 'Meanwhile, start learning with our free courses.' }}
                </p>
                @if (anyFilter()) {
                  <button type="button" (click)="clear()" class="mt-4 inline-flex h-9 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">Clear filters</button>
                } @else {
                  <a routerLink="/courses" class="mt-4 inline-flex h-9 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">Free courses</a>
                }
              </div>
            } @else {
              <ul class="space-y-3">
                @for (result of visible(); track result.entry.resource.id) {
                  @let bootcamp = result.entry.resource;
                  <li>
                    <article class="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md {{ result.recommended ? 'border-[#007979]/40' : 'border-gray-200' }}">
                      <div class="p-4 sm:p-5">
                        <div class="flex items-start gap-3">
                          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                            <mat-icon aria-hidden="true">rocket_launch</mat-icon>
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-base font-bold leading-6 text-[#032D42]">
                              <a [routerLink]="['/resources', bootcamp.slug]" class="hover:text-[#007979]">{{ bootcamp.name }}</a>
                              @if (bootcamp.verified) {
                                <mat-icon class="!h-4 !w-4 align-[-2px] !text-base text-green-600" aria-label="Verified">check_circle</mat-icon>
                              }
                            </h3>
                            <p class="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                              @if (result.entry.place) {
                                <span class="inline-flex items-center gap-0.5">
                                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">location_on</mat-icon>
                                  {{ result.entry.place }}
                                </span>
                              }
                              @if (bootcamp.online) {
                                <span class="inline-flex items-center gap-0.5">
                                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">laptop</mat-icon>
                                  Online
                                </span>
                              }
                              @if (result.entry.programs.length) {
                                <span>{{ result.entry.programs.length }} {{ result.entry.programs.length === 1 ? 'program' : 'programs' }}</span>
                              }
                            </p>
                          </div>
                          <div class="flex shrink-0 flex-col items-end gap-1">
                            @if (result.recommended) {
                              <span class="inline-flex items-center gap-1 rounded-full bg-[#007979] px-2 py-0.5 text-[11px] font-semibold text-white">
                                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">verified</mat-icon>
                                Recommended
                              </span>
                            }
                            @if (bootcamp.featured) {
                              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Featured</span>
                            }
                          </div>
                        </div>

                        @if (!result.programs.length) {
                          <p class="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{{ bootcamp.description }}</p>
                          @if (bootcamp.cost?.free || bootcamp.cost?.description) {
                            <p class="mt-2 text-sm font-semibold {{ bootcamp.cost?.free ? 'text-green-700' : 'text-[#032D42]' }}">
                              {{ bootcamp.cost?.free ? 'Free' : bootcamp.cost?.description }}
                            </p>
                          }
                        } @else {
                          <ul class="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
                            @for (program of result.programs.slice(0, 3); track program.id) {
                              <li>
                                <a [routerLink]="['/resources', bootcamp.slug]" fragment="programs" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 hover:bg-gray-50">
                                  <span class="min-w-0 flex-1 basis-56">
                                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-[#007979]">{{ field(program) }}</span>
                                    <span class="block text-sm font-semibold text-[#032D42]">
                                      {{ program.title }}
                                      @if (program.recommended) {
                                        <mat-icon class="!h-4 !w-4 align-[-3px] !text-base text-[#007979]" aria-label="Recommended by Zebron">verified</mat-icon>
                                      }
                                    </span>
                                    <span class="block text-xs text-gray-500">{{ facts(program) }}</span>
                                  </span>
                                  <span class="text-right text-sm">
                                    <span class="block font-semibold {{ cost(program) === 'Free' ? 'text-green-700' : 'text-[#032D42]' }}">{{ cost(program) }}</span>
                                    <span class="block text-xs text-gray-500">{{ next(program) }}</span>
                                  </span>
                                </a>
                              </li>
                            }
                          </ul>
                          @if (result.programs.length > 3) {
                            <p class="mt-2 text-xs text-gray-500">+{{ result.programs.length - 3 }} more matching programs</p>
                          }
                        }

                        <div class="mt-4 flex flex-wrap items-center gap-2">
                          <a [routerLink]="['/resources', bootcamp.slug]" class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                            View bootcamp
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
                          </a>
                          @if (result.nextStart) {
                            <span class="inline-flex items-center gap-1 text-xs text-gray-600">
                              <mat-icon class="!h-4 !w-4 !text-base text-gray-400" aria-hidden="true">event</mat-icon>
                              Next class {{ day(result.nextStart) }}
                            </span>
                          }
                        </div>
                      </div>
                    </article>
                  </li>
                }
              </ul>
              @if (results().length > visible().length) {
                <div class="mt-5 text-center">
                  <button type="button" (click)="limit.set(limit() + pageSize)" class="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-[#032D42] hover:border-[#007979] hover:text-[#007979]">
                    Show more ({{ results().length - visible().length }})
                  </button>
                </div>
              }
            }
          </section>

          <aside class="space-y-4">
            <section class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <h2 class="flex items-center gap-2 text-base font-bold text-[#032D42]">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600" aria-hidden="true">lightbulb</mat-icon>
                Choosing a bootcamp
              </h2>
              <ul class="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                <li>Ask what share of graduates found a job in the field, and when.</li>
                <li>Check the total cost and whether you qualify for a free or funded seat (WIOA, employers, scholarships).</li>
                <li>Pick a schedule you can keep for the whole program.</li>
                <li>Try a free course in the field first to see if you enjoy it.</li>
              </ul>
            </section>
            <nav class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-label="Get ready">
              <h2 class="text-base font-bold text-[#032D42]">Get ready for free</h2>
              <ul class="mt-2 space-y-1 text-sm">
                <li><a routerLink="/courses" class="flex items-center gap-2 rounded-lg px-2 py-2 font-medium text-[#007979] hover:bg-[#E8F4F4]"><mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">play_lesson</mat-icon>Free courses</a></li>
                <li><a routerLink="/test-center" class="flex items-center gap-2 rounded-lg px-2 py-2 font-medium text-[#007979] hover:bg-[#E8F4F4]"><mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">quiz</mat-icon>Practice tests</a></li>
                <li><a routerLink="/jobs" class="flex items-center gap-2 rounded-lg px-2 py-2 font-medium text-[#007979] hover:bg-[#E8F4F4]"><mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">work</mat-icon>Tech jobs</a></li>
                <li><a routerLink="/resources" class="flex items-center gap-2 rounded-lg px-2 py-2 font-medium text-[#007979] hover:bg-[#E8F4F4]"><mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">volunteer_activism</mat-icon>Other help</a></li>
              </ul>
            </nav>
            <section class="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
              <h2 class="text-base font-bold text-[#032D42]">Run a bootcamp?</h2>
              <p class="mt-1">Tell us about your programs and we'll list them for free.</p>
              <a routerLink="/contact" class="mt-2 inline-flex items-center gap-1 font-semibold text-[#007979] hover:underline">
                Contact us
                <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
              </a>
            </section>
          </aside>
        </div>
      </div>
    </main>
  `,
})
export class BootcampDirectoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** From bootcampDirectoryResolver. */
  readonly bootcamps = input<BootcampEntry[]>([]);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly sorts: { value: SortKey; label: string }[] = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'next', label: 'Next class' },
    { value: 'cost', label: 'Lowest cost' },
    { value: 'name', label: 'A–Z' },
  ];

  protected readonly filters = signal<BootcampFilters>(EMPTY);
  protected readonly limit = signal(PAGE_SIZE);

  protected readonly anyFilter = computed(() => {
    const { sort, ...rest } = this.filters();
    void sort;
    return Object.values(rest).some(Boolean);
  });

  /** Program filters other than the field (the field chips count with these applied). */
  private matchesProgram(program: BootcampProgram, value: BootcampFilters, today: string, soonKey: string, withField = true): boolean {
    if (withField && value.field && program.field !== value.field) return false;
    if (value.cost === 'free' && !isFree(program)) return false;
    if (value.cost === 'funded' && !isFree(program) && !program.financing.some((item) => ['wioa', 'scholarship', 'employer', 'gi', 'free'].includes(item))) return false;
    if (value.format === 'online' && program.format === 'in-person') return false;
    if (value.format === 'in-person' && program.format === 'online') return false;
    if (value.schedule === 'full-time' && program.schedule !== 'full-time') return false;
    if (value.schedule === 'flexible' && program.schedule === 'full-time') return false;
    if (value.noDegree && program.requiresDegree) return false;
    if (value.english && !program.englishSupport) return false;
    if (value.soon && !openStarts(program, today).some((start) => start.date <= soonKey)) return false;
    return true;
  }

  private programFilterActive(value: BootcampFilters, withField = true): boolean {
    return !!((withField && value.field) || value.cost || value.format || value.schedule || value.soon || value.noDegree || value.english);
  }

  private searchMatch(entry: BootcampEntry, words: string[]): boolean {
    if (!words.length) return true;
    const text = [
      entry.resource.name,
      entry.resource.description,
      entry.place,
      ...(entry.resource.tags ?? []),
      ...entry.programs.flatMap((program) => [program.title, fieldLabel(program.field), ...program.skills, ...program.certifications]),
    ]
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  }

  private soonKey(today: string): string {
    const [year, month, day] = today.split('-').map(Number);
    const date = new Date(year, month - 1, day + SOON_DAYS);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  protected readonly results = computed<Result[]>(() => {
    const value = this.filters();
    const words = value.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const today = todayKey();
    const soonKey = this.soonKey(today);
    const programFilter = this.programFilterActive(value);

    const items = this.bootcamps()
      .filter((entry) => this.searchMatch(entry, words))
      .map((entry) => {
        const programs = entry.programs
          .filter((program) => this.matchesProgram(program, value, today, soonKey))
          .sort((a, b) => Number(b.recommended) - Number(a.recommended));
        const starts = programs.flatMap((program) => openStarts(program, today).map((start) => start.date)).sort();
        const costs = programs.map((program) => (isFree(program) ? 0 : program.tuition ?? Number.MAX_SAFE_INTEGER));
        return {
          entry,
          programs,
          nextStart: starts[0] ?? null,
          recommended: programs.some((program) => program.recommended),
          lowestCost: costs.length ? Math.min(...costs) : entry.resource.cost?.free ? 0 : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((result) => !programFilter || result.programs.length > 0);

    const byNext = (a: Result, b: Result) => (a.nextStart ?? '9999').localeCompare(b.nextStart ?? '9999');
    const byName = (a: Result, b: Result) => a.entry.resource.name.localeCompare(b.entry.resource.name);
    switch (value.sort) {
      case 'next':
        return items.sort((a, b) => byNext(a, b) || byName(a, b));
      case 'cost':
        return items.sort((a, b) => a.lowestCost - b.lowestCost || byName(a, b));
      case 'name':
        return items.sort(byName);
      default:
        return items.sort(
          (a, b) =>
            Number(b.recommended) - Number(a.recommended) ||
            Number(b.entry.resource.featured) - Number(a.entry.resource.featured) ||
            Number(b.programs.length > 0) - Number(a.programs.length > 0) ||
            byNext(a, b) ||
            byName(a, b),
        );
    }
  });

  protected readonly visible = computed(() => this.results().slice(0, this.limit()));

  /** Fields with at least one matching program (other filters applied), most common first. */
  protected readonly fieldsInUse = computed(() => {
    const value = this.filters();
    const today = todayKey();
    const soonKey = this.soonKey(today);
    const words = value.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const counts = new Map<BootcampField, number>();
    for (const entry of this.bootcamps()) {
      if (!this.searchMatch(entry, words)) continue;
      const fields = new Set(
        entry.programs.filter((program) => this.matchesProgram(program, value, today, soonKey, false)).map((program) => program.field),
      );
      fields.forEach((field) => counts.set(field, (counts.get(field) ?? 0) + 1));
    }
    const order = BOOTCAMP_FIELDS.map((item) => item.value);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([value, count]) => ({ value, label: fieldLabel(value), count }));
  });

  constructor() {
    effect(() => this.updateSeo(this.bootcamps()));
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
        const raw = params.get(key) as T | null;
        return raw && allowed.includes(raw) ? raw : fallback;
      };
      this.filters.set({
        q: params.get('q') ?? '',
        field: pick<BootcampField | ''>('field', BOOTCAMP_FIELDS.map((item) => item.value), ''),
        cost: pick<'' | 'free' | 'funded'>('cost', ['free', 'funded'], ''),
        format: pick<'' | 'online' | 'in-person'>('format', ['online', 'in-person'], ''),
        schedule: pick<'' | 'flexible' | 'full-time'>('schedule', ['flexible', 'full-time'], ''),
        soon: params.get('soon') === '1',
        noDegree: params.get('nodegree') === '1',
        english: params.get('english') === '1',
        sort: pick<SortKey>('sort', ['recommended', 'next', 'cost', 'name'], 'recommended'),
      });
      this.limit.set(PAGE_SIZE);
    });
  }

  // ----------------------------------------------------------
  // Filters (kept in the address)
  // ----------------------------------------------------------

  protected set(key: 'q' | 'field' | 'cost' | 'format' | 'schedule' | 'sort', value: string): void {
    this.update({ ...this.filters(), [key]: value } as BootcampFilters);
  }

  protected toggle(key: 'soon' | 'noDegree' | 'english'): void {
    this.update({ ...this.filters(), [key]: !this.filters()[key] });
  }

  protected clear(): void {
    this.update({ ...EMPTY, sort: this.filters().sort });
  }

  private update(next: BootcampFilters): void {
    const params: Params = {
      q: next.q || null,
      field: next.field || null,
      cost: next.cost || null,
      format: next.format || null,
      schedule: next.schedule || null,
      soon: next.soon ? '1' : null,
      nodegree: next.noDegree ? '1' : null,
      english: next.english ? '1' : null,
      sort: next.sort === 'recommended' ? null : next.sort,
    };
    this.filters.set(next);
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, replaceUrl: true });
  }

  // ----------------------------------------------------------
  // Labels
  // ----------------------------------------------------------

  protected field = (program: BootcampProgram) => fieldLabel(program.field);
  protected cost = (program: BootcampProgram) => costLabel(program);

  protected facts(program: BootcampProgram): string {
    return [formatLabel(program.format), scheduleLabel(program.schedule), lengthLabel(program)].filter(Boolean).join(' · ');
  }

  protected next(program: BootcampProgram): string {
    const start = openStarts(program)[0];
    return start ? `Starts ${this.day(start.date)}` : 'Ask for dates';
  }

  /** "Jan 12" this year, "Jan 12, 2027" otherwise. */
  protected day(value: string): string {
    const full = dateLabel(value);
    return value.startsWith(String(new Date().getFullYear())) ? full.replace(/, \d{4}$/, '') : full;
  }

  protected pill(active: boolean): string {
    return (
      'inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (active ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
    );
  }

  protected selectPill(value: string): string {
    return (
      'h-8 shrink-0 cursor-pointer rounded-full border py-0 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (value ? 'border-[#007979] bg-[#007979]/10 font-medium text-[#007979]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
    );
  }

  protected fieldChip(active: boolean): string {
    return (
      'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#007979]/40 ' +
      (active ? 'border-[#007979] bg-[#007979] text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-[#007979] hover:text-[#007979]')
    );
  }

  // ----------------------------------------------------------
  // SEO
  // ----------------------------------------------------------

  private updateSeo(bootcamps: BootcampEntry[]): void {
    const url = 'https://zebron.org/bootcamps';
    const pageTitle = 'Tech bootcamps: compare programs, costs and start dates | Zebron';
    const description =
      'Find a tech bootcamp: software, data, cybersecurity, cloud and more. Compare cost, schedule and the next class, see free and funded seats, and read Zebron’s take.';
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    } else {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }

    const data = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tech bootcamps on Zebron',
      url,
      itemListElement: bootcamps.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://zebron.org/resources/${entry.resource.slug}`,
        name: entry.resource.name,
      })),
    };
    const existing = this.document.head.querySelector('script[data-zebron-structured-data="bootcamps"]');
    const script = existing ?? this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-zebron-structured-data', 'bootcamps');
    script.textContent = JSON.stringify(data);
    if (!existing) {
      this.document.head.appendChild(script);
    }
  }
}
