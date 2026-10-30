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

import { OrganizationContextStore } from '../../../organizations/stores/organization-context.store';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AnnouncementBannerComponent } from '../../announcements/announcement-banner.component';
import { OrganizationAnnouncement } from '../../announcements/organization-announcement.model';
import { OrganizationAnnouncementService } from '../../announcements/organization-announcement.service';
import { ApplicationRegistryService } from '../../../../core/services/application-registry.service';

import {
  PartnerAdminSearchResult,
  PartnerAdminSearchService,
} from '../../services/partner-admin-search.service';
import { ActivatedRoute } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  enabled: boolean;
  adminOnly?: boolean;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-partner-admin',
  standalone: true,
  imports: [
    TranslatePipe,RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatFormFieldModule, MatInputModule, AnnouncementBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-15">
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-md text-white/70">
                <a routerLink="/profile" class="transition-colors hover:text-white">
                  {{ 'Partner Portal' | t }}
                </a>

                <span>/</span>

                <span class="text-white">{{ 'Dashboard' | t }}</span>
              </div>
            </div>

            <!-- Mobile / overflow menu -->
            <button
              type="button"
              mat-icon-button
              [matMenuTriggerFor]="dashboardMenu"
              [attr.aria-label]="'Partner dashboard menu' | t"
              class="!text-white shrink-0"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #dashboardMenu="matMenu">
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>{{ 'Profile' | t }}</span>
              </a>

              @for (card of visibleDashboardCards(); track card.id) {
                @if (card.enabled) {
                  <a mat-menu-item [routerLink]="dashboardCardRoute(card)">
                    <mat-icon>{{ card.icon }}</mat-icon>
                    <span>{{ card.title | t }}</span>
                  </a>
                } @else {
                  <button mat-menu-item disabled>
                    <mat-icon>{{ card.icon }}</mat-icon>
                    <span>{{ '{0} — Coming soon' | t: [card.title] }}</span>
                  </button>
                }
              }

              @if (!isOrganizationOnboarding() && access.canAccessAdministration()) {
                <a mat-menu-item [routerLink]="administrationRoute()">
                  <mat-icon>admin_panel_settings</mat-icon>
                  <span>{{ 'Administration' | t }}</span>
                </a>
              }
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- =========================================================
           MAIN
           ========================================================= -->

      <main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <!-- =======================================================
             PROFILE REMINDER: stays until first and last name are set
             ======================================================= -->

        @if (profileNameMissing()) {
          <section
            class="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <div class="flex items-start gap-3">
              <mat-icon class="shrink-0 text-amber-700">badge</mat-icon>

              <div>
                <p class="text-sm font-semibold text-amber-900">{{ 'Complete your profile' | t }}</p>
                <p class="mt-0.5 text-sm text-amber-800">
                  {{ 'Add your first and last name so your organization knows who you are.' | t }}
                </p>
              </div>
            </div>

            <a mat-flat-button routerLink="/profile" class="shrink-0 !bg-amber-600 !text-white">
              <mat-icon>edit</mat-icon>
              {{ 'Complete profile' | t }}
            </a>
          </section>
        }

        <!-- =======================================================
             ANNOUNCEMENT BANNERS (closable per person)
             ======================================================= -->

        @for (announcement of visibleAnnouncements(); track announcement.id) {
          <div class="mb-4">
            <app-announcement-banner
              [announcement]="announcement"
              (dismissed)="dismissAnnouncement(announcement)"
            ></app-announcement-banner>
          </div>
        }

        <!-- =======================================================
             LOADING
             ======================================================= -->

        @if (organizationStore.contextLoading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <mat-icon class="!h-9 !w-9 !text-4xl text-[#007979]"> sync </mat-icon>

            <p class="mt-4 text-sm font-medium text-gray-700">
              {{ 'Loading your partner organization...' | t }}
            </p>

            <p class="mt-1 text-sm text-gray-500">{{ 'Please wait while we load your dashboard.' | t }}</p>
          </section>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->

        @else if (organizationStore.contextError()) {
          <section class="rounded-xl border border-red-200 bg-red-50 p-6">
            <div class="flex gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100"
              >
                <mat-icon class="text-red-600"> error_outline </mat-icon>
              </div>

              <div class="min-w-0">
                <h2 class="font-semibold text-red-900">{{ 'Partner access unavailable' | t }}</h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ organizationStore.contextError() | t }}
                </p>

                <button
                  type="button"
                  (click)="initialize()"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#032D42] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#06445f]"
                >
                  <mat-icon>refresh</mat-icon>
                  {{ 'Try again' | t }}
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
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5DB996]"
                >
                  <mat-icon class="!text-2xl text-white"> business </mat-icon>
                </div>

                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {{ 'Organization' | t }}
                  </p>

                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ organizationName() }}
                  </h2>
                  @if (organizationStore.selectedOrganization()?.status === 'onboarding') {
                    <a
                      [routerLink]="[
                        '/partner/org',
                        organizationStore.selectedOrganizationId(),
                        'onboarding',
                      ]"
                      class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#007979]/10 px-3 py-2 text-sm font-semibold text-[#007979] transition-colors hover:bg-[#007979]/20"
                    >
                      <mat-icon class="!h-5 !w-5 !text-xl">checklist</mat-icon>
                      <span>{{ 'Complete onboarding steps' | t }}</span>
                      <mat-icon class="!h-4 !w-4 !text-base">arrow_forward</mat-icon>
                    </a>
                  }

                  <div
                    class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500"
                  >
                  </div>
                </div>
              </div>

              <!-- Operational search is available after onboarding only. -->
              @if (canShowOperationalWorkspace()) {

<div class="relative mt-4">
  <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
    <mat-label>{{ 'Search partner resources' | t }}</mat-label>
    <mat-icon matPrefix class="ml-3 mr-1 !text-[#007979]" aria-hidden="true">search</mat-icon>
    <input matInput
      id="partner-search"
      type="search"
      autocomplete="off"
      [value]="searchQuery()"
      (input)="onSearch($event)"
      [placeholder]="'Search your partner resources...' | t"
      [attr.aria-label]="'Search partner resources' | t"
    />
    @if (searching()) {
      <mat-icon matSuffix class="mr-3 animate-spin !text-[#007979]" [attr.aria-label]="'Searching' | t">sync</mat-icon>
    } @else if (searchQuery()) {
      <button mat-icon-button matSuffix type="button" [attr.aria-label]="'Clear search' | t" (click)="clearSearch()">
        <mat-icon>close</mat-icon>
      </button>
    }
  </mat-form-field>
</div>



                @if (searchQuery().trim()) {
                  <div class="mt-4">
                    @if (searching()) {
                      <div
                        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4"
                      >
                        <mat-icon class="animate-spin text-[#007979]"> sync </mat-icon>

                        <span class="text-sm text-gray-600"> {{ 'Searching your organization...' | t }} </span>
                      </div>
                    } @else if (searchResults().length > 0) {
                      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div class="border-b border-gray-100 bg-gray-50 px-4 py-3">
                          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {{ 'Search Results' | t }}
                          </p>

                          <p class="mt-1 text-xs text-gray-400">
                            {{ '{0} result{1}' | t: [searchResults().length, (searchResults().length === 1 ? '' : 's')] }}
                          </p>
                        </div>

                        <div class="divide-y divide-gray-100">
                          @for (
                            result of searchResults();
                            track result.category + ':' + result.id
                          ) {
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
                                    {{ result.category | t }}
                                  </span>
                                </div>

                                <p class="mt-1 truncate text-xs text-gray-500">
                                  {{ result.description | t }}
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
                                  {{ 'Coming soon' | t }}
                                </span>
                              }
                            </a>
                          }
                        </div>
                      </div>
                    } @else {
                      <div
                        class="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-center"
                      >
                        <mat-icon class="text-gray-400"> search_off </mat-icon>

                        <p class="mt-2 text-sm font-medium text-gray-700">{{ 'No results found' | t }}</p>

                        <p class="mt-1 text-xs text-gray-500">
                          {{ 'Try searching for a course, resource, or partner feature.' | t }}
                        </p>
                      </div>
                    }
                  </div>
                }
              }
            </div>

            <!-- =========================================================
            PROFILE CARD
            ========================================================= -->

            <!-- The whole card opens Profile (stretched link); Help & Support sits above it. -->
            <div
              class="group relative block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md lg:min-w-[250px]"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ 'My Account' | t }}
                  </p>

                  <div class="mt-3 flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50"
                    >
                      <mat-icon class="text-[#007979]">person</mat-icon>
                    </div>

                    <div>
                      <a
                        routerLink="/profile"
                        [attr.aria-label]="'View and manage your profile' | t"
                        class="font-semibold text-gray-900 after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-[#007979] focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#007979]"
                      >{{ 'Profile' | t }}</a>
                      <p class="text-sm text-gray-500">{{ 'View and manage your personal profile' | t }}</p>
                    </div>
                  </div>
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <div
                      class="inline-flex items-center gap-2 rounded-lg bg-[#007979]/10 px-3 py-2 text-sm font-semibold text-[#007979]"
                    >
                      {{ 'Role:' | t }}
                      <span class="font-medium text-gray-700">
                        {{ roleLabel() | t }}
                      </span>
                    </div>

                    <a
                      routerLink="/support"
                      [queryParams]="supportQuery()"
                      class="relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-[#007979]/30 bg-white px-3 py-2 text-sm font-semibold text-[#007979] transition-colors hover:bg-[#007979]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base">support_agent</mat-icon>
                      {{ 'Help & Support' | t }}
                    </a>
                  </div>
                </div>

                <mat-icon class="mt-1 text-gray-300 transition-colors group-hover:text-[#007979]">
                  arrow_forward
                </mat-icon>
              </div>
            </div>
          </section>

          <!-- =====================================================
               MEMBER FEATURES
               ===================================================== -->

          @if (canShowOperationalWorkspace() && visibleDashboardCards().length > 0) {
            <section>
              <div class="mb-5">
                <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                  {{ 'Partner Portal' | t }}
                </p>

                <h2 class="mt-1 text-2xl font-bold text-gray-900">{{ 'Your Workspace' | t }}</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ 'Access the resources and services available to you.' | t }}
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                @for (card of visibleDashboardCards(); track card.id) {
                  <div
                    class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm
         transition-all hover:-translate-y-0.5 hover:border-[#007979]/40
         hover:shadow-md
         focus-within:ring-2 focus-within:ring-[#007979]
         focus-within:ring-offset-2"
                    [class.opacity-60]="!card.enabled"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <a
                        [routerLink]="card.enabled ? dashboardCardRoute(card) : null"
                        [attr.aria-disabled]="!card.enabled"
                        class="flex min-w-0 flex-1 items-start gap-3 rounded-lg
         focus:outline-none"
                        [class.pointer-events-none]="!card.enabled"
                      >
                        <div
                          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007979]/10 transition-colors group-hover:bg-[#007979]"
                        >
                          <mat-icon class="text-white">{{ card.icon }}</mat-icon>
                        </div>

                        <h3 class="min-w-0 flex-1 self-center text-lg font-bold text-gray-900">
                          {{ card.title | t }}
                        </h3>
                      </a>

                      @if (card.enabled && settingsRoute(card); as manageRoute) {
                        <button
                          type="button"
                          [routerLink]="manageRoute"
                          [attr.aria-label]="'Manage {0}' | t: [(card.title | t)]"
                          [title]="'Manage {0}' | t: [(card.title | t)]"
                          class="shrink-0 rounded-lg p-2 text-gray-600 transition-colors hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                        >
                          <mat-icon>settings</mat-icon>
                        </button>
                      } @else if (card.enabled) {
                        <!-- Same destination as the card itself. Shown instead of the
                             settings gear when the person cannot manage the app. -->
                        <a
                          [routerLink]="dashboardCardRoute(card)"
                          tabindex="-1"
                          aria-hidden="true"
                          class="shrink-0 rounded-lg p-2 text-gray-300 transition-colors group-hover:text-[#007979] hover:bg-teal-50"
                        >
                          <mat-icon>arrow_forward</mat-icon>
                        </a>
                      } @else if (!card.enabled) {
                        <span
                          class="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500"
                        >
                          {{ 'Coming soon' | t }}
                        </span>
                      }
                    </div>

                    <!-- Description sits below the header row and spans the full card width. -->
                    <a
                      [routerLink]="card.enabled ? dashboardCardRoute(card) : null"
                      tabindex="-1"
                      aria-hidden="true"
                      class="mt-4 block text-sm leading-6 text-gray-500 focus:outline-none"
                      [class.pointer-events-none]="!card.enabled"
                    >
                      {{ card.description | t }}
                    </a>
                  </div>
                }
              </div>
            </section>
          }

          <!-- =====================================================
               ADMINISTRATION
               ===================================================== -->

          @if (!isOrganizationOnboarding() && access.canAccessAdministration()) {
            <section class="mt-10">
              <div class="mb-5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-[#007979]"> admin_panel_settings </mat-icon>

                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ 'Administration' | t }}
                  </p>
                </div>

                <h2 class="mt-1 text-2xl font-bold text-gray-900">{{ 'Organization Management' | t }}</h2>

                <p class="mt-1 text-sm text-gray-500">
                  {{ 'Manage your organization\\u0027s configuration, members, and resources.' | t }}
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <a
                  [routerLink]="administrationRoute()"
                  class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md"
                >
                  <div class="flex items-start justify-between">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#007979]/10 transition-colors group-hover:bg-[#007979]"
                    >
                      <mat-icon class="text-white"> admin_panel_settings </mat-icon>
                    </div>

                    <mat-icon class="text-gray-300 transition-colors group-hover:text-[#007979]">
                      arrow_forward
                    </mat-icon>
                  </div>

                  <h3 class="mt-3 text-lg font-bold text-gray-900">{{ 'Administration' | t }}</h3>

                  <p class="mt-2 text-sm leading-6 text-gray-500">
                    {{ 'Manage organization courses, members, programs, settings, notifications, and administrative operations.' | t }}
                  </p>
                </a>
              </div>
            </section>
          }

          <!-- =====================================================
               QUICK ACCESS
               ===================================================== -->

          @if (canShowOperationalWorkspace()) {
            <section class="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ 'Quick Access' | t }}
                  </p>

                  <h2 class="mt-1 text-lg font-bold text-gray-900">{{ 'Partner Portal' | t }}</h2>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'Return to the areas you use most frequently.' | t }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-3">
                  @for (card of visibleDashboardCards(); track card.id) {
                    <a mat-stroked-button [routerLink]="dashboardCardRoute(card)">
                      <mat-icon>{{ card.icon }}</mat-icon>
                      {{ card.title | t }}
                    </a>
                  }

                  <a mat-stroked-button routerLink="/profile">
                    <mat-icon>person</mat-icon>
                    {{ 'Profile' | t }}
                  </a>

                  @if (!isOrganizationOnboarding() && access.canAccessAdministration()) {
                    <a mat-stroked-button [routerLink]="administrationRoute()">
                      <mat-icon>admin_panel_settings</mat-icon>
                      {{ 'Administration' | t }}
                    </a>
                  }
                </div>
              </div>
            </section>
          }
        }
      </main>
    </div>
  `,
})
export class PartnerAdminComponent implements OnInit {
  protected readonly organizationStore = inject(OrganizationContextStore);

  private readonly applicationRegistry = inject(ApplicationRegistryService);

  protected readonly access = inject(PartnerAccessService);

  private readonly searchService = inject(PartnerAdminSearchService);

  private readonly pageTitleService = inject(PageTitleService);

  private readonly route = inject(ActivatedRoute);

  private readonly authService = inject(AuthService);

  private readonly announcementService = inject(OrganizationAnnouncementService);

  private readonly announcements = signal<OrganizationAnnouncement[]>([]);

  /** Banners this person closed, remembered in this browser. */
  private readonly dismissedAnnouncements = signal<Set<string>>(new Set());

  /** Live banners this person hasn't closed, newest first, at most three. */
  protected readonly visibleAnnouncements = computed(() => {
    const dismissed = this.dismissedAnnouncements();

    return this.announcements()
      .filter((announcement) => !dismissed.has(this.dismissKey(announcement)))
      .slice(0, 3);
  });

  /** Shown until the signed-in user's profile has a first and last name. */
  protected readonly profileNameMissing = computed(() => {
    const user = this.authService.user();

    if (!user) {
      return false;
    }

    return !user.firstName?.trim() || !user.lastName?.trim();
  });

  protected readonly searchQuery = signal('');

  protected readonly searchResults = signal<PartnerAdminSearchResult[]>([]);

  protected readonly searching = signal(false);

  protected readonly organizationName = computed(
    () => this.organizationStore.selectedOrganization()?.name ?? 'Partner',
  );

  protected readonly roleLabel = computed(() => {
    // Platform admins have full access whatever their organization role.
    if (this.access.isPlatformAdmin()) {
      return 'Platform Admin';
    }

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
    // Platform admins have full access whatever their organization role.
    if (this.access.isPlatformAdmin()) {
      return 'shield_person';
    }

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
    // Platform admins have full access whatever their organization role.
    if (this.access.isPlatformAdmin()) {
      return 'Zebron platform administrator — full access to every organization';
    }

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
    const organization = this.organizationStore.selectedOrganization();
    const onboarding = this.organizationStore.onboarding();

    // A completed onboarding record must take precedence over a stale
    // organization lifecycle status in the dashboard's cached context.
    if (onboarding?.status === 'completed') {
      return false;
    }

    // Otherwise, keep showing the onboarding action while either source says
    // that onboarding is still underway.
    return organization?.status === 'onboarding' || !!onboarding;
  });

  /** Operational application links must not appear until onboarding is complete. */
  protected readonly canShowOperationalWorkspace = computed(() => {
    const organization = this.organizationStore.selectedOrganization();
    const onboarding = this.organizationStore.onboarding();

    if (
      this.organizationStore.contextLoading() ||
      this.organizationStore.applicationsLoading() ||
      this.organizationStore.onboardingLoading() ||
      !organization ||
      this.isOrganizationOnboarding()
    ) {
      return false;
    }

    return onboarding?.status === 'completed';
  });


/**
 * Resolve application cards from the canonical application registry.
 *
 * Every member, staff, manager, admin and owner sees every application
 * provisioned for the organization. What each role can do inside an
 * application is decided by PartnerAccessService and the route guards.
 *
 * Organization entitlements determine which applications are available
 * to the current organization.
 */
protected readonly dashboardCards = computed<DashboardCard[]>(() => {
  if (!this.canShowOperationalWorkspace()) {
    return [];
  }

  const organizationId =
    this.organizationStore.selectedOrganizationId();

  if (!organizationId) {
    return [];
  }

  return this.applicationRegistry
    .getEnabledApplications()
    .filter((application) => application.requiresOrganization)
    .filter((application) =>
      application.route.includes(':organizationId'),
    )
    .filter((application) =>
      this.organizationStore.hasActiveApplication(application.id),
    )
    .map((application) => ({
      id: application.id,
      title: application.name,
      description: application.description,
      icon: application.icon ?? 'apps',
      route: application.route.replace(
        ':organizationId',
        organizationId,
      ),
      enabled: true,
      adminOnly:
        (application as typeof application & {
          adminOnly?: boolean;
        }).adminOnly === true,
    }));
});



  /**
   * Operational application links remain hidden until onboarding completes.
   */
  protected readonly visibleDashboardCards = computed(() => {
    if (!this.canShowOperationalWorkspace()) {
      return [];
    }

    return this.dashboardCards();
  });

  /**
   * The Test Center card opens the learner experience by default.
   * Its separate settings button continues to use the registry's management route.
   */
  protected dashboardCardRoute(card: DashboardCard): string | (string | null)[] {
    if (card.id === 'test-center') {
      const organizationId = this.organizationStore.selectedOrganizationId();

      if (organizationId) {
        return ['/partner/org', organizationId, 'learn', 'test-center'];
      }
    }

    return card.route;
  }

  /** Staff, managers, admins and owners see the Test Center settings icon. */
  protected canManageTestCenter(): boolean {
    return this.access.can('testCenter.settings');
  }

  /**
   * Management route behind a card's settings gear, or null for the arrow.
   * - Test Center: staff and above (Test Center management).
   * - Knowledge Center: managers and above (write and publish articles).
   */
  protected settingsRoute(card: DashboardCard): string | (string | null)[] | null {
    if (card.id === 'test-center' && this.canManageTestCenter()) {
      return card.route;
    }

    if (card.id === 'knowledge' && this.access.can('knowledge.manage')) {
      return ['/partner/org', this.organizationStore.selectedOrganizationId(), 'knowledge', 'manage'];
    }

    return null;
  }

  /**
   * Help & Support opens for this organization. Managers and above can file
   * it as an organization ticket; everyone else files a personal one.
   */
  protected supportQuery(): Record<string, string> {
    const organizationId = this.organizationStore.selectedOrganizationId();

    return organizationId && this.access.canAccessAdministration() ? { organizationId } : {};
  }

  /** Organization Management (Administration) page for this organization. */
  protected administrationRoute(): (string | null)[] {
    return ['/partner/org', this.organizationStore.selectedOrganizationId(), 'settings'];
  }


  async ngOnInit(): Promise<void> {
    await this.initialize();
  }

  /** Banners are optional; a failure here never blocks the dashboard. */
  private async loadAnnouncements(organizationId: string): Promise<void> {
    this.dismissedAnnouncements.set(this.readDismissed(organizationId));

    try {
      this.announcements.set(
        await this.announcementService.getLiveAnnouncements(organizationId),
      );
    } catch (error) {
      console.warn('[Dashboard] Announcements unavailable.', error);
      this.announcements.set([]);
    }
  }

  protected dismissAnnouncement(announcement: OrganizationAnnouncement): void {
    const next = new Set(this.dismissedAnnouncements());
    next.add(this.dismissKey(announcement));
    this.dismissedAnnouncements.set(next);

    try {
      localStorage.setItem(
        this.dismissStorageKey(announcement.organizationId),
        JSON.stringify([...next].slice(-50)),
      );
    } catch {
      // Private mode or storage blocked: it stays closed until reload.
    }
  }

  /** Editing a banner gives it a new key, so it shows to everyone again. */
  private dismissKey(announcement: OrganizationAnnouncement): string {
    const updated = announcement.updatedAt;
    const millis = updated && typeof updated.toMillis === 'function' ? updated.toMillis() : 0;

    return `${announcement.id}:${millis}`;
  }

  private dismissStorageKey(organizationId: string): string {
    return `zebron:dismissed-announcements:${organizationId}`;
  }

  private readDismissed(organizationId: string): Set<string> {
    try {
      const raw = localStorage.getItem(this.dismissStorageKey(organizationId));
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  }

  protected async initialize(): Promise<void> {
    try {
      const organizationId = this.route.snapshot.paramMap.get('organizationId');

      if (!organizationId) {
        throw new Error('Organization ID is missing from the URL.');
      }

      await this.organizationStore.loadOrganizationContext(organizationId);

      this.pageTitleService.setTitle(`${this.organizationName()} Dashboard`);

      void this.loadAnnouncements(organizationId);
    } catch {
      /*
       * OrganizationStore exposes
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

    const organizationId = this.organizationStore.selectedOrganizationId();

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
