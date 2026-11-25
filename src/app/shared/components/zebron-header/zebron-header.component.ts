import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
 
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
 
import {
  filter,
} from 'rxjs/operators';
 
import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
 
import {
  MatIconModule,
} from '@angular/material/icon';
 
import {
  MatMenuModule,
} from '@angular/material/menu';
 
import {
  MatDividerModule,
} from '@angular/material/divider';
 
import {
  MatButtonModule,
} from '@angular/material/button';
 
import {
  MatTooltipModule,
} from '@angular/material/tooltip';
 
import {
  NavigationContext,
  NavigationService,
} from '../../../core/services/navigation.service';
 
import {
  AuthService,
} from '../../../core/services/auth.service';

import { LearnerNotificationService } from '../../../features/notifications/learner-notification.service';
 
import {
  LoggerService,
} from '../../../core/services/logger.service';
 
import {
  PageTitleService,
} from '../../../core/services/page-title.service';
 
import {
  LanguageSwitcherComponent,
} from '../language-switcher/language-switcher.component';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../../core/services/firebase-config';
import { PartnerOrganizationContextService } from '../../../core/services/partner-organization-context.service';
import { PwaService } from '../../../core/services/pwa.service';
import { BackNavigationService } from '../../../core/services/back-navigation.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
 
@Component({
  selector: 'app-zebron-header',
  standalone: true,
 
  imports: [
    RouterLink,
    RouterLinkActive,
 
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
 
    LanguageSwitcherComponent,
    TranslatePipe,
  ],
 
  changeDetection: ChangeDetectionStrategy.OnPush,
 
  template: `
    <!-- =====================================================
         ZEBRON GLOBAL HEADER
         ===================================================== -->
 
    <header
      class="
        fixed
        inset-x-0
        top-0
        z-50
        h-16
        w-full
        border-b
        border-[#0A4058]
        bg-[#032D42]
        text-white
        shadow-sm
      "
    >
      <div
        class="
          mx-auto
          max-w-7xl
          px-3
          sm:px-6
          lg:px-8
        "
      >
        <div
          class="
            flex
            h-16
            items-center
            gap-2
          "
        >
 
          <!-- =================================================
               BACK (BackNavigationService). Computers only: on phones and
               tablets the browser's buttons, or in the installed app the
               navigation bar at the bottom (app-nav-bar), go back.
               ================================================= -->

          @if (back.visible()) {
            <button
              type="button"
              class="-ml-1 hidden h-8 w-8 shrink-0 lg:flex items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
              [attr.aria-label]="'Back' | t"
              [title]="'Back' | t"
              (click)="back.back()"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
            </button>
          }

          <!-- =================================================
               ZEBRON BRAND
               ================================================= -->
 
          <a
            routerLink="/"
            aria-label="Zebron home"
            class="
              flex
              shrink-0
              items-center
              gap-2
              text-white
            "
          >
            <img
              src="/zebron-favicon.svg"
              alt="Zebron"
              class="h-9 w-9"
            />
          </a>
 
 
          <!-- =================================================
               DESKTOP CURRENT PAGE TITLE
               ================================================= -->
 
          <div
            class="
              hidden
              min-w-0
              max-w-[720px]
              shrink
              items-center
              border-l
              border-white/20
              md:flex
            "
          >
            <span
              class="
                block
                truncate
                font-semibold
                tracking-tight
                text-white
                text-2xl
                pl-3
              "
              [attr.title]="currentTitle()"
            >
              {{ currentTitle() }}
            </span>
          </div>
 
 
          <!-- =================================================
               MOBILE PAGE TITLE
               ================================================= -->
 
          <div
            class="
              min-w-0
              flex-1
              md:hidden
            "
          >
            <div
              class="
                max-w-[calc(100vw-170px)]
                whitespace-normal
                break-words
                font-semibold
                leading-tight
                text-white
                text-xl
                tracking-tight
              "
            >
              {{ currentTitle() }}
            </div>
          </div>
 
 
          <!-- =================================================
               DESKTOP CONTEXT NAVIGATION
               ================================================= -->
 
          <nav
            class="
              hidden
              min-w-0
              flex-1
              items-center
              justify-end
              gap-1
              lg:flex
            "
            aria-label="Section navigation"
          >
            @for (
              item of contextItems();
              track item.key
            ) {
              <a
                [routerLink]="item.route"
                [routerLinkActive]="[
                  '!bg-white/15',
                  '!text-white'
                ]"
                [routerLinkActiveOptions]="{
                  exact: item.route === '/'
                }"
                class="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-slate-200
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <mat-icon
                  class="
                    !h-[18px]
                    !w-[18px]
                    !text-[18px]
                  "
                  aria-hidden="true"
                >
                  {{ item.icon }}
                </mat-icon>
 
                <span>
                  {{ item.label }}
                </span>
              </a>
            }
          </nav>
 
 
          <!-- =================================================
               GLOBAL HEADER ACTIONS
               ================================================= -->
 
          <div
            class="
              flex
              shrink-0
              items-center
              gap-1
            "
          >
 
            <!-- =================================================
                 ORGANIZATION DASHBOARD (on every organization page
                 except the dashboard itself)
                 ================================================= -->

            @if (organizationDashboardLink(); as dashboardLink) {
              <a
                mat-icon-button
                [routerLink]="dashboardLink"
                matTooltip="Organization dashboard"
                aria-label="Organization dashboard"
                class="
                  !h-10
                  !w-10
                  !shrink-0
                  !text-white
                  hover:!bg-white/10
                "
              >
                <mat-icon>space_dashboard</mat-icon>
              </a>
            }

            <!-- =================================================
                 REFRESH (installed app only: it has no browser reload button)
                 ================================================= -->

            <!-- Installed app: refresh. Computers only; on phones and tablets the bottom bar has Refresh. -->
            @if (pwa.standalone()) {
              <button
                mat-icon-button
                type="button"
                [matTooltip]="'Refresh' | t"
                [attr.aria-label]="'Refresh' | t"
                class="
                  max-lg:!hidden
                  !h-10
                  !w-10
                  !shrink-0
                  !text-white
                  hover:!bg-white/10
                "
                (click)="refresh()"
              >
                <mat-icon>refresh</mat-icon>
              </button>
            }

            <!-- =================================================
                 ALL APPS (public directory, every screen size)
                 ================================================= -->

            <a
              mat-icon-button
              routerLink="/apps"
              matTooltip="All Zebron apps"
              aria-label="All Zebron apps"
              class="
                !h-10
                !w-10
                !shrink-0
                !text-white
                hover:!bg-white/10
              "
            >
              <mat-icon>apps</mat-icon>
            </a>


            <!-- =================================================
                 LANGUAGE SWITCHER
                 ================================================= -->
 
            <!-- Phones and tablets: signed-in people choose the language in the menu (below). -->
            <div [class]="isSignedIn() ? 'hidden lg:block' : 'block'">
              <app-language-switcher />
            </div>
 
 
            <!-- =================================================
                 DESKTOP PROFILE / SIGN IN
                 ================================================= -->
 
            <div
              class="
                hidden
                shrink-0
                items-center
                lg:flex
              "
            >
              @if (isSignedIn()) {
                <a
                  routerLink="/notifications"
                  [routerLinkActive]="['!bg-white/15', '!text-white']"
                  [attr.aria-label]="learnerNotifications.unreadCount() ? 'Notifications: ' + learnerNotifications.unreadCount() + ' new' : 'Notifications'"
                  matTooltip="Notifications"
                  class="relative mr-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <mat-icon aria-hidden="true">{{ learnerNotifications.unreadCount() ? 'notifications_active' : 'notifications' }}</mat-icon>
                  @if (learnerNotifications.unreadCount()) {
                    <span class="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-none text-[#032D42]" aria-hidden="true">
                      {{ learnerNotifications.unreadCount() > 9 ? '9+' : learnerNotifications.unreadCount() }}
                    </span>
                  }
                </a>
                <a
                  routerLink="/profile"
                  [routerLinkActive]="[
                    '!bg-white/15',
                    '!text-white'
                  ]"
                  aria-label="Profile"
                  matTooltip="Profile"
                  class="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    text-slate-200
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  @if (photoUrl(); as photo) {
                    <img [src]="photo" alt="" class="h-8 w-8 rounded-full object-cover ring-2 ring-white/30" referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon>
                      account_circle
                    </mat-icon>
                  }
                </a>
              } @else if (showSignIn()) {
                <a
                  routerLink="/login"
                  class="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-slate-200
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <mat-icon
                    class="
                      !h-[18px]
                      !w-[18px]
                      !text-[18px]
                    "
                    aria-hidden="true"
                  >
                    login
                  </mat-icon>
 
                  <span>
                    Sign in
                  </span>
                </a>
              }
            </div>
 
 
            <!-- =================================================
                 MOBILE MENU BUTTON
 
                 shrink-0 guarantees that the hamburger remains
                 visible at the far right of the header.
                 ================================================= -->
 
            <!-- Hamburger menu: signed-in users only. Visitors get Sign in. -->
            @if (isSignedIn()) {
            <button
              mat-icon-button
              type="button"
              [matMenuTriggerFor]="mobileNavigationMenu"
              [attr.aria-label]="learnerNotifications.unreadCount() ? 'Open Zebron navigation (' + learnerNotifications.unreadCount() + ' new notifications)' : 'Open Zebron navigation'"
              class="
                !relative
                !h-10
                !w-10
                !shrink-0
                !text-white
                hover:!bg-white/10
                lg:hidden
              "
            >
              <mat-icon>
                menu
              </mat-icon>
              @if (learnerNotifications.unreadCount()) {
                <span class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#032D42]" aria-hidden="true"></span>
              }
            </button>
            } @else if (showSignIn()) {
              <a
                routerLink="/login"
                aria-label="Sign in"
                class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:hidden"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">login</mat-icon>
                <span class="hidden sm:inline">Sign in</span>
              </a>
            }
 
          </div>
 
        </div>
      </div>
    </header>
 
 
    <!-- =====================================================
         MOBILE / UNIVERSAL NAVIGATION MENU
         ===================================================== -->
 
    <mat-menu
      #mobileNavigationMenu="matMenu"
      (closed)="languageOpen.set(false)"
      class="!min-w-[210px]"
    >
 
      <div class="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400" (click)="$event.stopPropagation()">Zebron</div>

      <!-- Zebron (platform) apps -->
      @for (item of platformMenuItems(); track item.key) {
          <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="navigateTo(item.route)">
            <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">{{ item.icon }}</mat-icon>
            <span class="text-sm">{{ item.label }}</span>
          </button>
      }

      <!-- Your organization's apps -->
      @if (currentOrganization(); as org) {
        <mat-divider></mat-divider>
        <div class="truncate px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400" [attr.title]="org.name" (click)="$event.stopPropagation()">
          {{ org.name }}
        </div>
        @for (app of organizationApps(); track app.key) {
          <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="navigateTo(app.route)">
            <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">{{ app.icon }}</mat-icon>
            <span class="text-sm">{{ app.label }}</span>
          </button>
        }
        @if (organizationChoices().length > 1) {
          <button mat-menu-item type="button" class="!h-9 !min-h-9" [matMenuTriggerFor]="switchOrganizationMenu">
            <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">swap_horiz</mat-icon>
            <span class="text-sm">Switch organization</span>
          </button>
        }
      }

      <mat-divider></mat-divider>

      <!-- Language: a dropdown inside the menu (the top-bar button is hidden here on phones and tablets). -->
      <button
        mat-menu-item
        type="button"
        class="!h-9 !min-h-9"
        [attr.aria-expanded]="languageOpen()"
        (click)="$event.stopPropagation(); languageOpen.set(!languageOpen())"
      >
        <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">translate</mat-icon>
        <span class="flex w-full items-center gap-2 text-sm">
          <span>{{ 'Language' | t }}</span>
          <span class="ml-auto font-semibold text-[#007979]">{{ localization.currentLanguage().nativeName }}</span>
          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px] text-gray-500">{{ languageOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
        </span>
      </button>
      @if (languageOpen()) {
        <div class="bg-gray-50" role="group" [attr.aria-label]="'Language' | t">
          @for (language of localization.languages(); track language.code) {
            @let selected = language.code === localization.language();
            <button
              mat-menu-item
              type="button"
              class="!h-9 !min-h-9 !pl-11"
              [disabled]="!language.enabled"
              [attr.aria-current]="selected ? 'true' : null"
              (click)="chooseLanguage(language.code)"
            >
              <span class="flex w-full items-center gap-2 text-sm">
                <span [class]="selected ? 'font-semibold text-[#007979]' : 'text-gray-900'">{{ language.nativeName }}</span>
                @if (!language.enabled) {
                  <span class="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{{ 'Soon' | t }}</span>
                } @else if (selected) {
                  <mat-icon class="!m-0 !ml-auto !h-[18px] !w-[18px] !text-[18px] !text-[#007979]" aria-hidden="true">check</mat-icon>
                }
              </span>
            </button>
          }
        </div>
      }

      <mat-divider></mat-divider>

      <!-- Installable app (PwaService): shown when this browser can install Zebron. -->
      @if (pwa.canInstall()) {
        <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="pwa.install()">
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">install_mobile</mat-icon>
          <span class="text-sm">{{ 'Install the Zebron app' | t }}</span>
        </button>
      }

      <!-- Refresh the page (and switch to a downloaded new version, if any). -->
      <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="refresh()">
        <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">refresh</mat-icon>
        <span class="text-sm">{{ 'Refresh' | t }}</span>
      </button>

      @if (isSignedIn()) {
        <!-- Account: the user's name opens their profile -->
        <button
          mat-menu-item
          type="button"
          class="!h-9 !min-h-9"
          (click)="navigateTo('/profile')"
          [attr.aria-label]="'Profile: ' + accountName()"
          title="View your profile"
        >
          @if (photoUrl(); as photo) {
            <!-- Photo and name on one line (a picture isn't a mat-icon, so it shares the text slot). -->
            <span class="flex min-w-0 items-center gap-2">
              <img [src]="photo" alt="" class="h-6 w-6 shrink-0 rounded-full object-cover" referrerpolicy="no-referrer" />
              <span class="min-w-0 max-w-48 truncate text-sm font-semibold">{{ accountName() }}</span>
            </span>
          } @else {
            <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">account_circle</mat-icon>
            <span class="block max-w-48 truncate text-sm font-semibold">{{ accountName() }}</span>
          }
        </button>
        <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="navigateTo('/notifications')">
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">notifications</mat-icon>
          <span class="text-sm">Notifications</span>
          @if (learnerNotifications.unreadCount()) {
            <span class="ml-2 rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-[#032D42]">{{ learnerNotifications.unreadCount() }}</span>
          }
        </button>
        <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="signOut()">
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">logout</mat-icon>
          <span class="text-sm">Sign out</span>
        </button>
      } @else if (showSignIn()) {
        <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="navigateTo('/login')">
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">login</mat-icon>
          <span class="text-sm">Sign in</span>
        </button>
      }
    </mat-menu>

    <!-- Switch organization -->
    <mat-menu #switchOrganizationMenu="matMenu">
      @for (choice of organizationChoices(); track choice.id) {
        <button mat-menu-item type="button" class="!h-9 !min-h-9" (click)="switchOrganization(choice.id)">
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">{{ choice.id === currentOrganization()?.id ? 'check' : 'domain' }}</mat-icon>
          <span class="text-sm">{{ choice.name }}</span>
        </button>
      }
    </mat-menu>
  `,
})
export class ZebronHeaderComponent {
 
  // =========================================================
  // SERVICES
  // =========================================================
 
  /**
   * Platform links in the menu. The Tax & Pay Calculator and Business stay
   * reachable from All apps (Business also from the Admin dashboard), not
   * from this menu. The learning app (/courses) shows as "Learning".
   */
  private static readonly HIDDEN_MENU_KEYS = new Set(['tax-calculator', 'business-operations']);
  private static readonly MENU_LABELS: Record<string, string> = { 'learning-lab': 'Learning' };

  protected readonly platformMenuItems = computed(() =>
    this.navigationService
      .visibleItems()
      .filter((item) => !ZebronHeaderComponent.HIDDEN_MENU_KEYS.has(item.key))
      .map((item) => {
        const label = ZebronHeaderComponent.MENU_LABELS[item.key];
        return label ? { ...item, label } : item;
      }),
  );

  protected readonly navigationService =
    inject(NavigationService);
 
  private readonly authService =
    inject(AuthService);

  /** Learning updates: the bell's unread count (features/notifications). */
  protected readonly learnerNotifications =
    inject(LearnerNotificationService);
 
  private readonly router =
    inject(Router);
 
  private readonly logger =
    inject(LoggerService);
 
  private readonly pageTitleService =
    inject(PageTitleService);

  /** Install the Zebron app (menu item). */
  protected readonly pwa = inject(PwaService);

  /** The back arrow before the logo. */
  protected readonly back = inject(BackNavigationService);

  /** Language in the menu (phones and tablets). */
  protected readonly localization = inject(LocalizationService);
  protected readonly languageOpen = signal(false);

  /**
   * Reload the page. The installed app has no browser reload button; a new
   * version that has already downloaded is switched to at the same time.
   */
  protected refresh(): void {
    void this.pwa.reload();
  }

  protected chooseLanguage(code: string): void {
    this.languageOpen.set(false);
    if (this.localization.isLanguageEnabled(code)) this.localization.setLanguage(code);
  }
 
  private readonly destroyRef =
    inject(DestroyRef);
 
 
  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================
 
  /**
   * True when a Zebron user profile is loaded.
   */
  protected readonly isSignedIn =
    computed(() => this.authService.user() !== null);

  /** The signed-in person's profile photo, if they have one. */
  protected readonly photoUrl = computed(() => this.authService.user()?.photoUrl || null);
 
  /**
   * Show "Sign in" only after authentication state has
   * finished loading, so signed-in users never see it
   * flash on page load.
   */
  protected readonly showSignIn =
    computed(
      () =>
        !this.authService.isLoading() &&
        this.authService.user() === null,
    );
 
 
  // =========================================================
  // CURRENT ROUTE
  // =========================================================
 
  /**
   * Current URL used by NavigationService to determine
   * the contextual navigation displayed in the header.
   */
  private readonly currentUrl =
    signal(this.router.url);
 
 
  // =========================================================
  // DYNAMIC PAGE TITLE
  // =========================================================
 
  /**
   * Tracks whether a user was signed in, so sign-out is
   * detected only on a signed-in -> signed-out transition
   * (not during the initial loading state).
   */
  private hadUser = false;
 
  /**
   * The global page title is owned by PageTitleService.
   *
   * Individual page components publish their titles
   * through PageTitleService without knowing anything
   * about this global header. After sign-out the header
   * resets the service, which restores the default
   * "Zebron" title.
   */
  protected readonly currentTitle =
    this.pageTitleService.title;

  // =========================================================
  // ORGANIZATION SECTION OF THE MENU
  // =========================================================

  private readonly partnerContext =
    inject(PartnerOrganizationContextService);

  private static readonly LAST_ORGANIZATION_KEY = 'zebron:last-organization';

  private static readonly ROLE_LABELS: Record<string, string> = {
    org_owner: 'Owner',
    org_admin: 'Administrator',
    org_manager: 'Manager',
    org_staff: 'Staff',
    org_member: 'Member',
  };

  /** Organization chosen in the menu (or seen in the URL). */
  private readonly chosenOrganizationId = signal<string | null>(this.readLastOrganization());

  /** Active application keys of the current organization. */
  private readonly activeApplications = signal<string[]>([]);

  /** Departmental mailboxes the person is assigned to in the current organization. */
  private readonly assignedMailboxCount = signal(0);

  /** Organizations the person is an active member of. */
  protected readonly organizationChoices = computed(() => {
    const organizations = this.partnerContext.organizations();
    return this.partnerContext
      .memberships()
      .filter((membership) => membership.active !== false)
      .map((membership) => ({
        id: membership.organizationId,
        name: organizations.find((organization) => organization.id === membership.organizationId)?.name ?? 'Organization',
        role: membership.role as string,
      }));
  });

  protected readonly currentOrganization = computed(() => {
    const choices = this.organizationChoices();
    const fromUrl = /^\/partner\/org\/([^/?#]+)/.exec(this.currentUrl())?.[1] ?? null;
    const id = fromUrl ?? this.chosenOrganizationId();
    const match = choices.find((choice) => choice.id === id) ?? choices[0] ?? null;
    if (match) {
      return { ...match, roleLabel: ZebronHeaderComponent.ROLE_LABELS[match.role] ?? '' };
    }
    // Platform admins viewing an organization they don't belong to.
    const viewed = this.partnerContext.organization();
    return fromUrl && viewed?.id === fromUrl ? { id: viewed.id, name: viewed.name, role: '', roleLabel: '' } : null;
  });

  /**
   * The organization dashboard of the organization page being viewed
   * (/partner/org/:id/...), for the header button. Null elsewhere and on
   * the dashboard itself.
   */
  protected readonly organizationDashboardLink = computed(() => {
    const url = this.currentUrl().split(/[?#]/)[0];
    const match = /^\/partner\/org\/([^/]+)(\/.*)?$/.exec(url);
    if (!match) return null;
    const rest = match[2] ?? '';
    if (rest === '' || rest === '/' || rest === '/dashboard') return null;
    return `/partner/org/${match[1]}/dashboard`;
  });

  /** Links for the current organization: its dashboard plus the apps it has. */
  protected readonly organizationApps = computed(() => {
    const org = this.currentOrganization();
    if (!org) {
      return [];
    }
    const base = `/partner/org/${encodeURIComponent(org.id)}`;
    const active = this.activeApplications();
    const apps = [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: `${base}/dashboard` }];
    // Learning: Courses when the organization has it, otherwise the Test Center on its own.
    if (active.includes('courses')) {
      apps.push({ key: 'learning', label: 'Learning', icon: 'school', route: `${base}/courses` });
    } else if (active.includes('test-center')) {
      apps.push({ key: 'learning', label: 'Learning', icon: 'school', route: `${base}/learn/test-center` });
    } else if (active.includes('virtual-classroom')) {
      apps.push({ key: 'learning', label: 'Learning', icon: 'school', route: `${base}/live` });
    } else if (active.includes('training-groups')) {
      apps.push({ key: 'learning', label: 'Learning', icon: 'school', route: `${base}/training-groups` });
    }
    if (active.includes('community')) {
      apps.push({ key: 'community', label: 'Community', icon: 'forum', route: `${base}/community` });
    }
    if (active.includes('knowledge')) {
      apps.push({ key: 'knowledge', label: 'Knowledge Center', icon: 'menu_book', route: `${base}/knowledge` });
    }
    // Mailbox (on demand): managers and above, or staff assigned to a departmental mailbox.
    if (active.includes('mailbox') && (['org_owner', 'org_admin', 'org_manager'].includes(org.role) || this.assignedMailboxCount() > 0)) {
      apps.push({ key: 'mailbox', label: 'Mailbox', icon: 'mail', route: `${base}/mailbox` });
    }
    // The blog only when requested and active.
    if (active.includes('blog')) {
      apps.push({ key: 'blog', label: 'Blog', icon: 'article', route: `${base}/blog` });
    }
    return apps;
  });

  /** Name shown once in the account section. */
  protected readonly accountName = computed(() => {
    const user = this.authService.user();
    return user?.displayName || this.authService.firebaseUser()?.email || 'Your account';
  });

  protected switchOrganization(organizationId: string): void {
    this.rememberOrganization(organizationId);
    void this.router.navigate(['/partner/org', organizationId, 'dashboard']);
  }

  private rememberOrganization(organizationId: string): void {
    this.chosenOrganizationId.set(organizationId);
    try {
      localStorage.setItem(ZebronHeaderComponent.LAST_ORGANIZATION_KEY, organizationId);
    } catch {
      // Storage unavailable.
    }
  }

  private readLastOrganization(): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(ZebronHeaderComponent.LAST_ORGANIZATION_KEY);
    } catch {
      return null;
    }
  }

  private async loadActiveApplications(organizationId: string): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, 'organizations', organizationId, 'applications'),
          where('status', '==', 'active'),
        ),
      );
      this.activeApplications.set(snapshot.docs.map((document) => document.id));
    } catch {
      this.activeApplications.set([]);
    }

    await this.loadAssignedMailboxes(organizationId);
  }

  /** Staff see Mailbox in the menu once they are assigned to a departmental mailbox. */
  private async loadAssignedMailboxes(organizationId: string): Promise<void> {
    const uid = this.authService.firebaseUser()?.uid;

    if (!uid) {
      this.assignedMailboxCount.set(0);
      return;
    }

    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, 'organizations', organizationId, 'mailboxes'),
          where('memberIds', 'array-contains', uid),
        ),
      );
      // Filtered here: an extra where() would need a composite index.
      this.assignedMailboxCount.set(snapshot.docs.filter((document) => document.data()['active'] !== false).length);
    } catch {
      // Members below staff cannot list mailboxes.
      this.assignedMailboxCount.set(0);
    }
  }
 
 
  // =========================================================
  // CONTEXT NAVIGATION
  // =========================================================
 
  /**
   * Dynamically resolves navigation based on the current
   * application context.
   *
   * NavigationService remains responsible for determining
   * which navigation items are available.
   */
  protected readonly contextItems =
    computed(() => {
      const url =
        this.currentUrl();
 
      const context =
        this.resolveContext(url);
 
      return this.navigationService
        .getContextItems(context);
    });
 
 
  // =========================================================
  // NAVIGATION
  // =========================================================
 
  protected navigateTo(
    route: string,
  ): void {
    void this.router
      .navigateByUrl(route);
  }
 
 
  // =========================================================
  // SIGN OUT
  // =========================================================
 
  /**
   * Sign out and return to the home page.
   *
   * The title reset happens automatically when the signed-in
   * user becomes null (see the constructor), so every sign-out
   * path is covered, including session expiry.
   */
  protected async signOut(): Promise<void> {
    try {
      await this.authService.logout();
 
      await this.router
        .navigateByUrl('/');
    } catch (error) {
      this.logger.error(
        'ZebronHeaderComponent',
        'Unable to sign out.',
        error,
      );
    }
  }
 
 
  // =========================================================
  // ROUTE CONTEXT
  // =========================================================
 
  private resolveContext(
    url: string,
  ): NavigationContext {
    const path =
      url
        .split('?')[0]
        .split('#')[0];
 
 
    // -------------------------------------------------------
    // COMMUNITY
    // -------------------------------------------------------
 
    if (
      path === '/community' ||
      path.startsWith('/community/')
    ) {
      return 'community';
    }
 
 
    // -------------------------------------------------------
    // LEARNING LAB
    // -------------------------------------------------------
 
    if (
      path === '/learning' ||
      path.startsWith('/learning/') ||
      path === '/courses' ||
      path.startsWith('/courses/') ||
      /^\/partner\/org\/[^/]+\/courses(?:\/|$)/.test(path)
    ) {
      return 'learning-lab';
    }
 
 
    // -------------------------------------------------------
    // TEST CENTER
    // -------------------------------------------------------
 
    if (
      path === '/test-center' ||
      path.startsWith('/test-center/')
    ) {
      return 'test-center';
    }
 
 
    // -------------------------------------------------------
    // BUSINESS
    // -------------------------------------------------------
 
    if (
      path === '/admin/business' ||
      path.startsWith('/admin/business/')
    ) {
      return 'business';
    }
 
 
    // -------------------------------------------------------
    // ADMIN
    // -------------------------------------------------------
 
    if (
      path === '/admin' ||
      path.startsWith('/admin/')
    ) {
      return 'admin';
    }
 
 
    // -------------------------------------------------------
    // RESOURCES
    // -------------------------------------------------------
 
    if (
      path === '/resources' ||
      path.startsWith('/resources/')
    ) {
      return 'resources';
    }
 
 
    // -------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------
 
    return 'global';
  }
 
 
  // =========================================================
  // INITIALIZATION
  // =========================================================
 
  constructor() {
    /**
     * Keep the URL state synchronized with Angular
     * navigation so contextual navigation updates whenever
     * the user moves between pages.
     */
    this.router.events
      .pipe(
        filter(
          (
            event,
          ): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(
        (event) => {
          this.currentUrl.set(
            event.urlAfterRedirects,
          );
        },
      );
 
    /**
     * Organization section of the menu: load the person's
     * organizations once they are signed in, then the apps of
     * the current organization whenever it changes.
     */
    let organizationsRequested = false;

    effect(() => {
      const signedIn = this.isSignedIn();
      untracked(() => {
        if (signedIn && !organizationsRequested) {
          organizationsRequested = true;
          void this.partnerContext.initialize().catch(() => undefined);
        }
        if (!signedIn) {
          organizationsRequested = false;
        }
      });
    });

    effect(() => {
      const organizationId = this.currentOrganization()?.id ?? null;
      untracked(() => {
        if (!organizationId) {
          this.activeApplications.set([]);
          return;
        }
        if (this.currentUrl().startsWith('/partner/org/')) {
          this.rememberOrganization(organizationId);
        }
        void this.loadActiveApplications(organizationId);
      });
    });

    /**
     * Reset the header title to the default whenever the
     * user goes from signed in to signed out. Watching the
     * auth state (instead of the Sign out button) also covers
     * session expiry and sign-out from other pages.
     */
    effect(() => {
      const user =
        this.authService.user();
 
      untracked(() => {
        if (!user && this.hadUser) {
          this.pageTitleService.reset();
        }
 
        this.hadUser = user !== null;
      });
    });
  }
}
 