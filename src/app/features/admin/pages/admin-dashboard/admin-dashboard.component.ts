
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-6xl p-4 sm:p-6">

      <!-- =========================================================
           Dashboard header
           ========================================================= -->
      <section
        class="rounded-2xl bg-[#032D42]
               px-6 py-6 text-white shadow-sm sm:px-8"
      >
        <div
          class="flex flex-col gap-5
                 sm:flex-row sm:items-center
                 sm:justify-between"
        >

          <div>

            <p
              class="text-sm font-semibold uppercase
                     tracking-wide text-blue-100"
            >
              Zebron Administration
            </p>

            <h1
              class="mt-1 text-3xl font-bold tracking-tight
                     text-white"
            >
              Admin Dashboard
            </h1>

            <p
              class="mt-3 max-w-2xl
                     text-base leading-7 text-blue-100"
            >
              Manage Zebron resources and database content.
            </p>

          </div>


          <a
            routerLink="/resources"
            class="shrink-0 rounded-lg
                   border border-white/30
                   bg-white/10 px-4 py-2.5
                   text-sm font-semibold text-white
                   transition hover:bg-white/20"
          >
            View site
          </a>

        </div>
      </section>


      <!-- =========================================================
           Admin information
           ========================================================= -->
      @if (authService.user(); as user) {

        <div
          class="mt-8 rounded-xl
                 border border-[#032D42]/20
                 bg-[#032D42]/5 p-5"
        >

          <p
            class="text-sm font-semibold uppercase
                   tracking-wide text-[#007979]"
          >
            Signed in as
          </p>

          <p
            class="mt-1 font-semibold text-[#032D42]"
          >
            {{ user.displayName || user.email }}
          </p>

          <p
            class="mt-1 text-sm text-gray-600"
          >
            Administrator
          </p>

        </div>

      }


      <!-- =========================================================
           Management sections
           ========================================================= -->
      <section class="mt-8">

        <div class="flex items-center justify-between">

          <div>

            <p
              class="text-sm font-semibold uppercase
                     tracking-wide text-[#007979]"
            >
              Administration
            </p>

            <h2
              class="mt-1 text-xl font-semibold text-[#032D42]"
            >
              Manage content
            </h2>

          </div>

        </div>


        <div
          class="mt-4 grid gap-6
                 sm:grid-cols-2 lg:grid-cols-4"
        >

          <!-- =====================================================
               Categories
               ===================================================== -->
          <a
            routerLink="/admin/categories"
            class="group rounded-xl
                   border border-gray-200
                   bg-white p-6 shadow-sm
                   transition
                   hover:border-[#032D42]/40
                   hover:shadow-md"
          >

            <h3
              class="text-lg font-semibold
                     text-[#032D42]
                     group-hover:text-[#007979]"
            >
              Categories
            </h3>

            <p
              class="mt-2 text-sm text-gray-600"
            >
              Create and manage resource categories.
            </p>

            <span
              class="mt-4 inline-block
                     text-sm font-semibold
                     text-[#007979]"
            >
              Manage →
            </span>

          </a>


          <!-- =====================================================
               Resources
               ===================================================== -->
          <a
            routerLink="/admin/resources"
            class="group rounded-xl
                   border border-gray-200
                   bg-white p-6 shadow-sm
                   transition
                   hover:border-[#032D42]/40
                   hover:shadow-md"
          >

            <h3
              class="text-lg font-semibold
                     text-[#032D42]
                     group-hover:text-[#007979]"
            >
              Resources
            </h3>

            <p
              class="mt-2 text-sm text-gray-600"
            >
              Create, edit, publish, and manage resources.
            </p>

            <span
              class="mt-4 inline-block
                     text-sm font-semibold
                     text-[#007979]"
            >
              Manage →
            </span>

          </a>


          <!-- =====================================================
               Organizations
               ===================================================== -->
          <a
            routerLink="/admin/organizations"
            class="group rounded-xl
                   border border-gray-200
                   bg-white p-6 shadow-sm
                   transition
                   hover:border-[#032D42]/40
                   hover:shadow-md"
          >

            <h3
              class="text-lg font-semibold
                     text-[#032D42]
                     group-hover:text-[#007979]"
            >
              Organizations
            </h3>

            <p
              class="mt-2 text-sm text-gray-600"
            >
              Manage organizations associated with resources.
            </p>

            <span
              class="mt-4 inline-block
                     text-sm font-semibold
                     text-[#007979]"
            >
              Manage →
            </span>

          </a>


          <!-- =====================================================
               Submissions
               ===================================================== -->
          <a
            routerLink="/admin/submissions"
            class="group rounded-xl
                   border border-gray-200
                   bg-white p-6 shadow-sm
                   transition
                   hover:border-[#032D42]/40
                   hover:shadow-md"
          >

            <h3
              class="text-lg font-semibold
                     text-[#032D42]
                     group-hover:text-[#007979]"
            >
              Submissions
            </h3>

            <p
              class="mt-2 text-sm text-gray-600"
            >
              Review and manage submitted resources.
            </p>

            <span
              class="mt-4 inline-block
                     text-sm font-semibold
                     text-[#007979]"
            >
              Manage →
            </span>

          </a>

          <!-- Users -->
<a
  routerLink="/admin/users"
  class="group rounded-2xl
         border border-gray-200
         bg-white p-6
         shadow-sm
         transition
         hover:-translate-y-0.5
         hover:border-[#007979]/30
         hover:shadow-md"
>
  <div
    class="flex h-12 w-12
           items-center justify-center
           rounded-xl
           bg-[#007979]/10
           text-[#007979]"
  >
    <!-- Users icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      class="h-6 w-6"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />

      <circle
        cx="9"
        cy="7"
        r="4"
      />

      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87"
      />

      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  </div>

  <div class="mt-5">
    <h2
      class="text-lg font-semibold
             text-[#032D42]
             group-hover:text-[#007979]"
    >
      Users
    </h2>

    <p
      class="mt-2 text-sm
             leading-6 text-gray-500"
    >
      Manage user accounts, profiles,
      roles, and permissions.
    </p>
  </div>

  <div
    class="mt-5 text-sm font-semibold
           text-[#007979]"
  >
    Manage users →
  </div>
</a>

        </div>

      </section>


      <!-- =========================================================
           Sign out
           ========================================================= -->
      <section
        class="mt-10 border-t
               border-gray-200 pt-6"
      >

        <button
          type="button"
          (click)="signOut()"
          [disabled]="signingOut()"
          class="rounded-lg bg-[#032D42]
                 px-5 py-2.5
                 text-sm font-semibold text-white
                 transition
                 hover:bg-[#032D42]/90
                 disabled:cursor-not-allowed
                 disabled:opacity-60"
        >

          @if (signingOut()) {
            Signing out...
          } @else {
            Sign out
          }

        </button>

      </section>

    </main>
  `,
})
export class AdminDashboardComponent {
  protected readonly authService = inject(AuthService);

  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);

  /**
   * Prevent duplicate sign-out requests while
   * Firebase is processing the current request.
   */
  protected readonly signingOut = signal(false);

  /**
   * Sign the administrator out of Firebase,
   * show feedback, and return to the login page.
   */
  protected async signOut(): Promise<void> {
    // Prevent multiple clicks while signing out.
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      // Sign out from Firebase Authentication.
      await this.authService.logout();

      // Let the administrator know the operation succeeded.
      this.toast.success('You have been signed out.');

      // Explicitly return to the login page.
      await this.router.navigateByUrl('/login');

    } catch (error) {
      console.error(
        'Failed to sign out:',
        error,
      );

      // Keep the user on the dashboard if logout fails.
      this.toast.error(
        'Unable to sign out. Please try again.',
      );

    } finally {
      this.signingOut.set(false);
    }
  }
}

