import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AuthService } from '../../../core/services/auth.service';
import { FeatureConfigService } from '../../../core/services/feature-config.service';
import { PUBLIC_APP_GROUPS, PUBLIC_APPS, PublicApp } from './public-apps';

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
            <p class="text-xs font-bold uppercase tracking-wider text-white/80">{{ 'Zebron apps' | t }}</p>
            <h1 class="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{{ 'Everything Zebron offers, in one place.' | t }}</h1>
            <p class="mt-1 max-w-2xl text-sm text-white/85">
              {{ 'Find help, look for work or training, practise for exams, connect with others and use our free tools.' | t }}
            </p>
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
                <a
                  [routerLink]="app.route"
                  class="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007979]/25"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span [class]="'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + group.tone">
                      <mat-icon aria-hidden="true">{{ app.icon }}</mat-icon>
                    </span>
                    <div class="flex flex-wrap justify-end gap-1.5">
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

                  <h3 class="mt-4 text-lg font-bold text-[#032D42] group-hover:text-[#007979]">{{ app.title | t }}</h3>
                  <p class="mt-1.5 flex-1 text-sm leading-6 text-slate-600">{{ app.description | t }}</p>
                  <p class="mt-3 text-xs text-slate-500">{{ app.audience | t }}</p>

                  <span class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#007979]">
                    {{ app.action | t }}
                    <mat-icon class="!m-0 !h-5 !w-5 !text-[17px] transition-transform group-hover:translate-x-1" aria-hidden="true">arrow_forward</mat-icon>
                  </span>
                </a>
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

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
