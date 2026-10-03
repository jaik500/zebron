import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

import {
  PartnerAdminSearchResult,
  PartnerAdminSearchService,
} from '../../services/partner-admin-search.service';
import { ActivatedRoute } from '@angular/router';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  enabled: boolean;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-partner-admin',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-sm text-white/70">
                <a routerLink="/profile" class="transition-colors hover:text-white">
                  Partner Portal
                </a>

                <span>/</span>

                <span class="text-white"> Dashboard </span>
              </div>

              <p class=" hidden text-lg text-white/70 sm:block">
                Your partner organization dashboard.
              </p>
            </div>

            <!-- Mobile / overflow menu -->

            <button
              type="button"
              mat-icon-button
              [matMenuTriggerFor]="dashboardMenu"
              aria-label="Partner dashboard menu"
              class="!text-white"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #dashboardMenu="matMenu">
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </a>

              <a
                mat-menu-item
                [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
              >
                <mat-icon>school</mat-icon>
                <span>Test Center</span>
              </a>

              @if (access.canAccessAdministration()) {
                <a mat-menu-item routerLink="/partner/admin">
                  <mat-icon>admin_panel_settings</mat-icon>
                  <span>Administration</span>
                </a>
              }
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- =========================================================
           MAIN
           ========================================================= -->

      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- =======================================================
             LOADING
             ======================================================= -->

        @if (context.loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <mat-icon class="!h-9 !w-9 !text-4xl text-[#007979]"> sync </mat-icon>

            <p class="mt-4 text-sm font-medium text-gray-700">
              Loading your partner organization...
            </p>

            <p class="mt-1 text-sm text-gray-500">Please wait while we load your dashboard.</p>
          </section>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->

        @else if (context.error()) {
          <section class="rounded-xl border border-red-200 bg-red-50 p-6">
            <div class="flex gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100"
              >
                <mat-icon class="text-red-600"> error_outline </mat-icon>
              </div>

              <div class="min-w-0">
                <h2 class="font-semibold text-red-900">Partner access unavailable</h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ context.error() }}
                </p>

                <button
                  type="button"
                  (click)="initialize()"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#032D42] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#06445f]"
                >
                  <mat-icon>refresh</mat-icon>
                  Try again
                </button>
              </div>
            </div>
          </section>
        }

        <!-- =======================================================
             DASHBOARD
             ======================================================= -->

        @else {
          <!-- =====================================================
               ORGANIZATION SUMMARY
               ===================================================== -->

          <section class="mb-8 grid gap-5 lg:grid-cols-[1fr_auto]">
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#032D42]"
                >
                  <mat-icon class="!text-2xl text-white"> business </mat-icon>
                </div>

                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Organization
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ organizationName() }}
                  </h2>

                  <div
                    class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500"
                  >
                    <span>
                      Role:
                      <span class="font-medium text-gray-700">
                        {{ roleLabel() }}
                      </span>
                    </span>

                    <span class="hidden sm:inline"> • </span>

                    @if (context.isPlatformAdmin()) {
                      <span>
                        {{ context.organizations().length }}
                        organization{{ context.organizations().length === 1 ? '' : 's' }}
                        available
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Search -->

              <div class="relative mt-5">
                <mat-icon
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  search
                </mat-icon>

                <input
                  id="partner-search"
                  type="search"
                  [value]="searchQuery()"
                  (input)="onSearch($event)"
                  placeholder="Search your partner resources..."
                  autocomplete="off"
                  class="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/20"
                />

                @if (searching()) {
                  <mat-icon
                    class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#007979]"
                  >
                    sync
                  </mat-icon>
                } @else if (searchQuery()) {
                  <button
                    type="button"
                    (click)="clearSearch()"
                    aria-label="Clear search"
                    class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <mat-icon class="!text-lg"> close </mat-icon>
                  </button>
                }
              </div>

              @if (searchQuery().trim()) {
                <div class="mt-4">
                  @if (searching()) {
                    <div
                      class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4"
                    >
                      <mat-icon class="animate-spin text-[#007979]"> sync </mat-icon>

                      <span class="text-sm text-gray-600"> Searching your organization... </span>
                    </div>
                  } @else if (searchResults().length > 0) {
                    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div class="border-b border-gray-100 bg-gray-50 px-4 py-3">
                        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Search Results
                        </p>

                        <p class="mt-1 text-xs text-gray-400">
                          {{ searchResults().length }}
                          result{{ searchResults().length === 1 ? '' : 's' }}
                        </p>
                      </div>

                      <div class="divide-y divide-gray-100">
                        @for (result of searchResults(); track result.category + ':' + result.id) {
                          <a
                            [routerLink]="result.enabled ? result.route : null"
                            [class.pointer-events-none]="!result.enabled"
                            [class.opacity-60]="!result.enabled"
                            class="flex items-center gap-4 px-4 py-4 transition-colors"
                            [class.hover:bg-gray-50]="result.enabled"
                          >
                            <div
                              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#032D42]"
                            >
                              <mat-icon class="text-white">
                                {{ result.icon }}
                              </mat-icon>
                            </div>

                            <div class="min-w-0 flex-1">
                              <div class="flex items-center gap-2">
                                <h3 class="truncate font-semibold text-gray-900">
                                  {{ result.title }}
                                </h3>

                                <span
                                  class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                                >
                                  {{ result.category }}
                                </span>
                              </div>

                              <p class="mt-1 truncate text-xs text-gray-500">
                                {{ result.description }}
                              </p>

                              @if (result.metadata) {
                                <p class="mt-1 text-[11px] font-medium text-[#007979]">
                                  {{ result.metadata }}
                                </p>
                              }
                            </div>

                            @if (result.enabled) {
                              <mat-icon class="shrink-0 text-gray-300"> arrow_forward </mat-icon>
                            } @else {
                              <span
                                class="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-400"
                              >
                                Coming soon
                              </span>
                            }
                          </a>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-center">
                      <mat-icon class="text-gray-400"> search_off </mat-icon>

                      <p class="mt-2 text-sm font-medium text-gray-700">No results found</p>

                      <p class="mt-1 text-xs text-gray-500">
                        Try searching for a course, resource, or partner feature.
                      </p>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- =========================================================
     ACCESS / ONBOARDING
     ========================================================= -->

            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:min-w-[250px]">
              @if (isOrganizationOnboarding()) {
                <!-- ONBOARDING ACTION -->

                <a
                  [routerLink]="['/partner/org', context.organizationId(), 'onboarding']"
                  class="group block h-full rounded-lg transition-colors"
                  aria-label="Continue organization onboarding"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                        Organization Setup
                      </p>

                      <div class="mt-3 flex items-center gap-3">
                        <div
                          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50"
                        >
                          <mat-icon class="text-[#007979]"> checklist </mat-icon>
                        </div>

                        <div>
                          <p class="font-semibold text-gray-900 group-hover:text-[#007979]">
                            Continue Onboarding
                          </p>

                          <p class="text-sm text-gray-500">Complete your organization setup</p>
                        </div>
                      </div>
                    </div>

                    <mat-icon
                      class="mt-1 text-gray-300 transition-colors group-hover:text-[#007979]"
                    >
                      arrow_forward
                    </mat-icon>
                  </div>

                  <div class="mt-5 rounded-lg bg-teal-50 px-3 py-2">
                    <p class="text-xs font-medium text-[#007979]">Setup in progress</p>

                    <p class="mt-1 text-xs text-gray-600">
                      Complete the remaining onboarding steps to activate your organization.
                    </p>
                  </div>
                </a>
              } @else {
                <!-- NORMAL ACCESS -->

                <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Access</p>

                <div class="mt-3 flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
                    <mat-icon class="text-[#007979]">
                      {{ accessIcon() }}
                    </mat-icon>
                  </div>

                  <div>
                    <p class="font-semibold text-gray-900">
                      {{ roleLabel() }}
                    </p>

                    <p class="text-sm text-gray-500">
                      {{ accessDescription() }}
                    </p>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- =====================================================
               MEMBER FEATURES
               ===================================================== -->

          <section>
            <div class="mb-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                Partner Portal
              </p>

              <h2 class="mt-1 text-2xl font-bold text-gray-900">Your Workspace</h2>

              <p class="mt-1 text-sm text-gray-500">
                Access the resources and services available to you.
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              @for (card of visibleDashboardCards(); track card.id) {
                <a
                  [routerLink]="
                    card.enabled
                      ? card.id === 'test-center'
                        ? ['/partner/org', context.organizationId(), 'test-center']
                        : card.route
                      : null
                  "
                  [attr.aria-disabled]="!card.enabled"
                  class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md"
                  [class.pointer-events-none]="!card.enabled"
                  [class.opacity-60]="!card.enabled"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#032D42] transition-colors group-hover:bg-[#007979]"
                    >
                      <mat-icon class="text-white">
                        {{ card.icon }}
                      </mat-icon>
                    </div>

                    @if (!card.enabled) {
                      <span
                        class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500"
                      >
                        Coming soon
                      </span>
                    } @else {
                      <mat-icon class="text-gray-300 transition-colors group-hover:text-[#007979]">
                        arrow_forward
                      </mat-icon>
                    }
                  </div>

                  <h3 class="mt-5 text-lg font-bold text-gray-900">
                    {{ card.title }}
                  </h3>

                  <p class="mt-2 text-sm leading-6 text-gray-500">
                    {{ card.description }}
                  </p>
                </a>
              }
            </div>
          </section>

          <!-- =====================================================
               ADMINISTRATION
               ===================================================== -->

          @if (access.canAccessAdministration()) {
            <section class="mt-10">
              <div class="mb-5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-[#007979]"> admin_panel_settings </mat-icon>

                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    Administration
                  </p>
                </div>

                <h2 class="mt-1 text-2xl font-bold text-gray-900">Organization Management</h2>

                <p class="mt-1 text-sm text-gray-500">
                  Manage your organization's configuration, members, and resources.
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <a
                  routerLink="/partner/admin"
                  class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md"
                >
                  <div class="flex items-start justify-between">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#032D42] transition-colors group-hover:bg-[#007979]"
                    >
                      <mat-icon class="text-white"> admin_panel_settings </mat-icon>
                    </div>

                    <mat-icon class="text-gray-300 transition-colors group-hover:text-[#007979]">
                      arrow_forward
                    </mat-icon>
                  </div>

                  <h3 class="mt-5 text-lg font-bold text-gray-900">Administration</h3>

                  <p class="mt-2 text-sm leading-6 text-gray-500">
                    Manage organization courses, members, programs, settings, notifications, and
                    administrative operations.
                  </p>
                </a>
              </div>
            </section>
          }

          <!-- =====================================================
               QUICK ACCESS
               ===================================================== -->

          <section class="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                  Quick Access
                </p>

                <h2 class="mt-1 text-lg font-bold text-gray-900">Partner Portal</h2>

                <p class="mt-1 text-sm text-gray-500">
                  Return to the areas you use most frequently.
                </p>
              </div>

              <div class="flex flex-wrap gap-3">
                <a
                  mat-stroked-button
                  [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
                >
                  <mat-icon>school</mat-icon>
                  Test Center
                </a>

                <a mat-stroked-button routerLink="/profile">
                  <mat-icon>person</mat-icon>
                  Profile
                </a>

                @if (access.canAccessAdministration()) {
                  <a mat-stroked-button routerLink="/partner/admin">
                    <mat-icon>admin_panel_settings</mat-icon>
                    Administration
                  </a>
                }
              </div>
            </div>
          </section>
        }
      </main>
    </div>
  `,
})
export class PartnerAdminComponent implements OnInit {
  protected readonly context = inject(PartnerOrganizationContextService);

  protected readonly access = inject(PartnerAccessService);

  private readonly searchService = inject(PartnerAdminSearchService);

  private readonly pageTitleService = inject(PageTitleService);

  private readonly route = inject(ActivatedRoute);

  protected readonly searchQuery = signal('');

  protected readonly searchResults = signal<PartnerAdminSearchResult[]>([]);

  protected readonly searching = signal(false);

  protected readonly organizationName = computed(
    () => this.context.organization()?.name ?? 'Partner',
  );

  protected readonly roleLabel = computed(() => {
    switch (this.access.role()) {
      case 'org_owner':
        return 'Owner';

      case 'org_admin':
        return 'Administrator';

      case 'org_manager':
        return 'Manager';

      case 'org_staff':
        return 'Staff';

      case 'org_member':
        return 'Member';

      default:
        return 'Member';
    }
  });

  protected readonly accessIcon = computed(() => {
    switch (this.access.role()) {
      case 'org_owner':
      case 'org_admin':
        return 'admin_panel_settings';

      case 'org_manager':
        return 'manage_accounts';

      case 'org_staff':
        return 'badge';

      case 'org_member':
      default:
        return 'person';
    }
  });

  protected readonly accessDescription = computed(() => {
    switch (this.access.role()) {
      case 'org_owner':
        return 'Organization owner';

      case 'org_admin':
        return 'Organization administrator';

      case 'org_manager':
        return 'Organization manager';

      case 'org_staff':
        return 'Organization staff member';

      case 'org_member':
      default:
        return 'Organization member';
    }
  });

  protected readonly isOrganizationOnboarding = computed(() => {
    const organization = this.context.organization();
    const role = this.access.role();

    return organization?.status === 'onboarding' && role === 'org_owner';
  });

  /**
   * Features available to normal Partner Portal members.
   */
  protected readonly dashboardCards: DashboardCard[] = [
    {
      id: 'test-center',
      title: 'Test Center',
      description: 'Take courses, practice assessments, and complete tests available to you.',
      icon: 'school',
      route: '',
      enabled: true,
    },

    {
      id: 'courses',
      title: 'Courses',
      description: 'Browse training and courses available through your organization.',
      icon: 'menu_book',
      route: '/partner/courses',
      enabled: false,
    },

    {
      id: 'results',
      title: 'My Results',
      description: 'View your test history, scores, and completed assessments.',
      icon: 'assessment',
      route: '/partner/results',
      enabled: false,
    },

    {
      id: 'profile',
      title: 'Profile',
      description: 'View and manage your personal partner profile.',
      icon: 'person',
      route: '/profile',
      enabled: true,
    },
  ];

  /**
   * Administration is deliberately NOT included here.
   *
   * It is rendered separately with @if so that regular
   * members never see an administration section.
   */
  protected readonly visibleDashboardCards = computed(() => this.dashboardCards);

  async ngOnInit(): Promise<void> {
    await this.initialize();
  }

  protected async initialize(): Promise<void> {
    try {
      const organizationId = this.route.snapshot.paramMap.get('organizationId');

      await this.context.initialize(organizationId);

      this.pageTitleService.setTitle(`${this.organizationName()} Dashboard`);
    } catch {
      /*
       * PartnerOrganizationContextService exposes
       * the user-facing error state.
       */
    }
  }

  protected async onSearch(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;

    const value = input?.value ?? '';

    this.searchQuery.set(value);

    const query = value.trim();

    if (!query) {
      this.searchResults.set([]);
      return;
    }

    const organizationId = this.context.organizationId();

    if (!organizationId) {
      this.searchResults.set([]);
      return;
    }

    try {
      this.searching.set(true);

      const results = await this.searchService.search(organizationId, query);

      /*
       * Ignore stale results if the user has already
       * changed the search text while Firestore was loading.
       */
      if (this.searchQuery().trim() !== query) {
        return;
      }

      this.searchResults.set(results);
    } catch {
      this.searchResults.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
  }
}
