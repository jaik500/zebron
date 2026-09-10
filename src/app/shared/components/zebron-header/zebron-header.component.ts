import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
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
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

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
              "
              [attr.title]="currentTitle()"
            >
              {{ currentTitle() }}
            </span>

          </div>


   <!-- =========================================================
     MOBILE PAGE TITLE
     ========================================================= -->

<div
  class="
    min-w-0
    flex-1
    md:hidden
  "
>
  <div
    class="
      max-w-[calc(100vw-120px)]
      whitespace-normal
      break-words
      font-semibold
      leading-tight
      text-white
      text-xl
      tracking-tight
      lg:max-w-[320px]
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
               DESKTOP PROFILE
               ================================================= -->

          <div
            class="
              hidden
              shrink-0
              items-center
              lg:flex
            "
          >

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

          </div>


          <!-- =================================================
               MOBILE MENU BUTTON

               shrink-0 guarantees that the hamburger remains
               visible at the far right of the header.
               ================================================= -->

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

      <!-- =================================================
           MENU HEADER
           ================================================= -->

      <div
        class="px-3 py-2"
        (click)="$event.stopPropagation()"
      >

        <div
          class="
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            text-gray-400
          "
        >
          Zebron
        </div>

        <div
          class="
            mt-0.5
            truncate
            text-sm
            font-semibold
            text-[#032D42]
          "
          [attr.title]="currentTitle()"
        >
          {{ currentTitle() }}
        </div>

      </div>


      <mat-divider></mat-divider>


      <!-- =================================================
           ALL AUTHORIZED NAVIGATION
           ================================================= -->

      @for (
        item of navigationService.visibleItems();
        track item.key
      ) {

        <button
          mat-menu-item
          type="button"
          class="
            !min-h-9
            !h-9
          "
          (click)="navigateTo(item.route)"
        >

          <mat-icon
            class="
              !mr-2
              !h-[18px]
              !w-[18px]
              !text-[18px]
            "
          >
            {{ item.icon }}
          </mat-icon>

          <span
            class="text-sm"
          >
            {{ item.label }}
          </span>

        </button>

      }


      <mat-divider></mat-divider>


      <!-- =================================================
           SIGN OUT
           ================================================= -->

      <button
        mat-menu-item
        type="button"
        class="
          !min-h-9
          !h-9
        "
        (click)="signOut()"
      >

        <mat-icon
          class="
            !mr-2
            !h-[18px]
            !w-[18px]
            !text-[18px]
          "
        >
          logout
        </mat-icon>

        <span
          class="text-sm"
        >
          Sign out
        </span>

      </button>

    </mat-menu>
  `,
})
export class ZebronHeaderComponent {

  // =========================================================
  // SERVICES
  // =========================================================

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
   * The global page title is owned by PageTitleService.
   *
   * Individual page components can publish their titles
   * through PageTitleService without knowing anything
   * about this global header.
   */
  protected readonly currentTitle =
    this.pageTitleService.title;


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

  protected async signOut(): Promise<void> {

    try {

      await this.authService.logout();

      await this.router
        .navigateByUrl('/');

    } catch (error) {

      this.logger.error(
        'ZebronHeaderComponent',
        'Unable to sign out.',
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
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
  }
}