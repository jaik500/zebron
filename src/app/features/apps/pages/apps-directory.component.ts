import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AuthService } from '../../../core/services/auth.service';
import { FeatureConfigService } from '../../../core/services/feature-config.service';
import { PUBLIC_APP_GROUPS, PUBLIC_APPS, PublicApp } from './public-apps';

const FAVORITES_KEY = 'zebron:apps:favorites';
const OPENS_KEY = 'zebron:apps:opens';

/** Shown in Popular before someone has favorites or history. */
const DEFAULT_POPULAR = ['resources', 'finder', 'jobs'];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: kept for this visit only.
  }
}

interface AppCard extends PublicApp {
  maintenance: boolean;
}

/**
 * Public "All apps" page: every public-facing Zebron application in one
 * place, grouped by what people want to do. Apps switched off in
 * Admin → Configuration are hidden; apps in maintenance are marked.
 */
@Component({
  selector: 'app-apps-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
      <div class="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#89D7B7]/25 blur-3xl" aria-hidden="true"></div>

      <div class="relative mx-auto max-w-7xl px-5 pb-5 pt-20 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0">
            <h1 class="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{{ 'Zebron apps' | t }}</h1>
          </div>

          <div class="relative w-full shrink-0 lg:w-[26rem]">
            <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" aria-hidden="true">search</mat-icon>
            <input
              type="search"
              class="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-3 text-sm text-slate-900 shadow outline-none ring-0 placeholder:text-slate-400 focus:ring-4 focus:ring-[#89D7B7]/50"
              [placeholder]="'Search apps, for example jobs or tax' | t"
              [attr.aria-label]="'Search apps' | t"
              [value]="search()"
              (input)="onSearch($event)"
            />
          </div>
        </div>

        <nav class="mt-4 flex flex-wrap gap-1.5" [attr.aria-label]="'App groups' | t">
          @for (group of visibleGroups(); track group.key) {
            <a
              [href]="'#' + group.key"
              (click)="jumpTo($event, group.key)"
              class="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs text-white transition hover:border-white/60 hover:bg-white/20"
            >
              {{ group.title | t }}
            </a>
          }
        </nav>
      </div>
    </section>

    <!-- Groups -->
    <div class="bg-slate-50">
      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        @if (visibleGroups().length === 0) {
          <div class="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <mat-icon class="text-slate-400" aria-hidden="true">search_off</mat-icon>
            <p class="mt-3 font-semibold text-slate-900">{{ 'No apps match your search.' | t }}</p>
            <button type="button" class="mt-3 text-sm font-semibold text-[#007979] hover:underline" (click)="search.set('')">
              {{ 'Show all apps' | t }}
            </button>
          </div>
        }

        <!-- Popular: favorites, or the most-opened apps -->
        @if (!search().trim() && popularApps().length) {
          <section aria-labelledby="popular-apps-title" class="mb-12">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ favoriteKeys().length ? 'star' : 'trending_up' }}</mat-icon>
              </span>
              <div class="min-w-0">
                <h2 id="popular-apps-title" class="text-xl font-bold tracking-tight text-[#032D42]">{{ 'Popular' | t }}</h2>
                <p class="text-sm text-slate-600">{{ popularHint() | t }}</p>
              </div>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (app of popularApps(); track app.key) {
                <div class="relative">
                  <a
                    [routerLink]="app.route"
                    (click)="recordOpen(app)"
                    class="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white py-3 pl-3 pr-12 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007979]/25"
                  >
                    <span [class]="'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ' + toneFor(app)">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ app.icon }}</mat-icon>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-bold text-[#032D42] group-hover:text-[#007979]">{{ app.title | t }}</span>
                      <span class="block truncate text-xs text-slate-500">{{ app.action | t }}</span>
                    </span>
                  </a>
                  <button
                    type="button"
                    (click)="toggleFavorite(app)"
                    [class]="isFavorite(app) ? 'absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-50' : 'absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-amber-500'"
                    [attr.aria-pressed]="isFavorite(app)"
                    [attr.aria-label]="(isFavorite(app) ? 'Remove {0} from favorites' : 'Add {0} to favorites') | t: [(app.title | t)]"
                    [title]="(isFavorite(app) ? 'Remove from favorites' : 'Add to favorites') | t"
                  >
                    <mat-icon class="!h-5 !w-5 !text-[20px]">{{ isFavorite(app) ? 'star' : 'star_border' }}</mat-icon>
                  </button>
                </div>
              }
            </div>
          </section>
        }

        @for (group of visibleGroups(); track group.key) {
          <section [id]="group.key" class="scroll-mt-24 [&:not(:first-child)]:mt-12">
            <div class="flex items-center gap-3">
              <span [class]="'flex h-9 w-9 items-center justify-center rounded-lg ' + group.tone">
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ group.icon }}</mat-icon>
              </span>
              <div class="min-w-0">
                <h2 class="text-xl font-bold tracking-tight text-[#032D42]">{{ group.title | t }}</h2>
                <p class="text-sm text-slate-600">{{ group.description | t }}</p>
              </div>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (app of group.apps; track app.key) {
                <div class="relative flex">
                <a
                  [routerLink]="app.route"
                  (click)="recordOpen(app)"
                  class="group flex w-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007979]/25"
                >
                  <!-- Icon and title on one row -->
                  <div class="flex items-center gap-3">
                    <span [class]="'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + group.tone">
                      <mat-icon aria-hidden="true">{{ app.icon }}</mat-icon>
                    </span>
                    <h3 class="min-w-0 flex-1 text-lg font-bold leading-tight text-[#032D42] group-hover:text-[#007979]">{{ app.title | t }}</h3>
                    <div class="flex shrink-0 flex-wrap justify-end gap-1.5 pr-8">
                      @if (app.maintenance) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">build</mat-icon>
                          {{ 'Maintenance' | t }}
                        </span>
                      }
                      @if (app.requiresSignIn && !signedIn()) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">lock</mat-icon>
                          {{ 'Sign-in needed' | t }}
                        </span>
                      }
                    </div>
                  </div>

                  <p class="mt-3 flex-1 text-sm leading-6 text-slate-600">{{ app.description | t }}</p>
                  <p class="mt-2 text-xs text-slate-500">{{ app.audience | t }}</p>

                  <span class="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#007979]">
                    {{ app.action | t }}
                    <mat-icon class="!m-0 !h-5 !w-5 !text-[17px] transition-transform group-hover:translate-x-1" aria-hidden="true">arrow_forward</mat-icon>
                  </span>
                </a>
                <!-- Favorite (outside the link) -->
                <button
                  type="button"
                  (click)="toggleFavorite(app)"
                  [class]="isFavorite(app) ? 'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-50' : 'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-amber-500'"
                  [attr.aria-pressed]="isFavorite(app)"
                  [attr.aria-label]="(isFavorite(app) ? 'Remove {0} from favorites' : 'Add {0} to favorites') | t: [(app.title | t)]"
                  [title]="(isFavorite(app) ? 'Remove from favorites' : 'Add to favorites') | t"
                >
                  <mat-icon class="!h-5 !w-5 !text-[20px]">{{ isFavorite(app) ? 'star' : 'star_border' }}</mat-icon>
                </button>
                </div>
              }
            </div>
          </section>
        }
      </div>
    </div>

    <!-- Help -->
    <section class="bg-white">
      <div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <h2 class="text-lg font-bold text-[#032D42]">{{ 'Not sure where to start?' | t }}</h2>
          <p class="mt-1 text-sm text-slate-600">{{ 'Answer a few questions and we\\u0027ll point you to the right resources, jobs and training.' | t }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/find" class="inline-flex items-center gap-2 rounded-xl bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
            <mat-icon class="!h-5 !w-5 !text-[18px]" aria-hidden="true">travel_explore</mat-icon>
            {{ 'Start the Resource Finder' | t }}
          </a>
          <a routerLink="/support" class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
            <mat-icon class="!h-5 !w-5 !text-[18px]" aria-hidden="true">support_agent</mat-icon>
            {{ 'Get help' | t }}
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AppsDirectoryComponent {
  private readonly features = inject(FeatureConfigService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  protected readonly search = signal('');

  protected readonly signedIn = computed(() => !!this.auth.firebaseUser());

  /** Apps that are switched on (or in maintenance), with their state. */
  private readonly availableApps = computed<AppCard[]>(() => {
    // Re-run when feature settings load.
    this.features.features();
    return PUBLIC_APPS.filter((app) => !app.featureKey || this.features.isAvailable(app.featureKey)).map((app) => ({
      ...app,
      maintenance: !!app.featureKey && this.features.isInMaintenance(app.featureKey),
    }));
  });

  protected readonly visibleGroups = computed(() => {
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (app: AppCard) => {
      if (!words.length) return true;
      // Search both the English and the translated text.
      const text = [app.title, app.description, app.audience, ...app.keywords]
        .flatMap((value) => [value, this.i18n.t(value)])
        .join(' ')
        .toLowerCase();
      return words.every((word) => text.includes(word));
    };

    return PUBLIC_APP_GROUPS.map((group) => ({
      ...group,
      apps: this.availableApps().filter((app) => app.group === group.key && matches(app)),
    })).filter((group) => group.apps.length > 0);
  });

  // ===========================================================
  // Popular: favorites, else the 3 most-opened apps (this browser)
  // ===========================================================

  protected readonly favoriteKeys = signal<string[]>(readStorage<string[]>(FAVORITES_KEY, []));

  private readonly openCounts = signal<Record<string, number>>(readStorage<Record<string, number>>(OPENS_KEY, {}));

  protected readonly popularApps = computed<AppCard[]>(() => {
    const apps = this.availableApps();
    const byKey = new Map(apps.map((app) => [app.key, app]));
    const favorites = this.favoriteKeys()
      .map((key) => byKey.get(key))
      .filter((app): app is AppCard => !!app);
    if (favorites.length) {
      return favorites;
    }

    const counts = this.openCounts();
    const mostOpened = apps
      .filter((app) => (counts[app.key] ?? 0) > 0)
      .sort((a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0))
      .slice(0, 3);
    if (mostOpened.length) {
      return mostOpened;
    }

    return DEFAULT_POPULAR.map((key) => byKey.get(key)).filter((app): app is AppCard => !!app);
  });

  protected readonly popularHint = computed(() => {
    if (this.favoriteKeys().length) {
      return 'Your favorite apps. Click a star to add or remove one.';
    }
    return Object.keys(this.openCounts()).length
      ? 'The apps you open most. Star an app to keep it here.'
      : 'Popular places to start. Star an app to keep it here.';
  });

  protected isFavorite(app: PublicApp): boolean {
    return this.favoriteKeys().includes(app.key);
  }

  protected toggleFavorite(app: PublicApp): void {
    this.favoriteKeys.update((keys) => (keys.includes(app.key) ? keys.filter((key) => key !== app.key) : [...keys, app.key]));
    writeStorage(FAVORITES_KEY, this.favoriteKeys());
  }

  protected recordOpen(app: PublicApp): void {
    this.openCounts.update((counts) => ({ ...counts, [app.key]: (counts[app.key] ?? 0) + 1 }));
    writeStorage(OPENS_KEY, this.openCounts());
  }

  protected toneFor(app: PublicApp): string {
    return PUBLIC_APP_GROUPS.find((group) => group.key === app.group)?.tone ?? 'bg-slate-100 text-slate-600';
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
