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
                text-3xl
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
 
            <app-language-switcher />
 
 
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
                  <mat-icon>
                    account_circle
                  </mat-icon>
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
              aria-label="Open Zebron navigation"
              class="
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
          <mat-icon class="!mr-2 !h-[18px] !w-[18px] !text-[18px]">account_circle</mat-icon>
          <span class="block max-w-48 truncate text-sm font-semibold">{{ accountName() }}</span>
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
   * Platform links in the menu. Tax & Pay Calculator and Learning Lab
   * stay reachable from All apps, not from this menu.
   */
  private static readonly HIDDEN_MENU_KEYS = new Set(['tax-calculator', 'learning-lab']);

  protected readonly platformMenuItems = computed(() =>
    this.navigationService.visibleItems().filter((item) => !ZebronHeaderComponent.HIDDEN_MENU_KEYS.has(item.key)),
  );

  protected readonly navigationService =
    inject(NavigationService);
 
  private readonly authService =
    inject(AuthService);
 
  private readonly router =
    inject(Router);
 
  private readonly logger =
    inject(LoggerService);
 
  private readonly pageTitleService =
    inject(PageTitleService);
 
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

  /** Links for the current organization: its dashboard plus the apps it has. */
  protected readonly organizationApps = computed(() => {
    const org = this.currentOrganization();
    if (!org) {
      return [];
    }
    const base = `/partner/org/${encodeURIComponent(org.id)}`;
    const active = this.activeApplications();
    const apps = [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: `${base}/dashboard` }];
    if (active.includes('test-center')) {
      apps.push({ key: 'test-center', label: 'Test Center', icon: 'quiz', route: `${base}/learn/test-center` });
    }
    if (active.includes('community')) {
      apps.push({ key: 'community', label: 'Community', icon: 'forum', route: `${base}/community` });
    }
    if (active.includes('knowledge')) {
      apps.push({ key: 'knowledge', label: 'Knowledge Center', icon: 'menu_book', route: `${base}/knowledge` });
    }
    // Every organization has a members-only blog.
    apps.push({ key: 'blog', label: 'Blog', icon: 'article', route: `${base}/blog` });
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
      path.startsWith('/learning/')
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
 