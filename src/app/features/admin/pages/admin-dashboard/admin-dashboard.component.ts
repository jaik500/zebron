import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-6xl p-4">
      <!-- Dashboard header -->
      <section
        class="rounded-2xl bg-[#032D42] px-6 py-6
              text-white shadow-sm sm:px-8"
      >
        <div
          class="flex flex-col gap-5
                sm:flex-row sm:items-center sm:justify-between"
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
                    text-white sm:text-3xl"
            >
              Admin Dashboard
            </h1>

            <p class="mt-3 max-w-2xl text-base leading-7 text-blue-100">
              Manage Zebron resources and database content.
            </p>
          </div>

          <a
            routerLink="/resources"
            class="shrink-0 rounded-lg border border-white/30
                  bg-white/10 px-4 py-2.5 text-sm
                  font-semibold text-white transition
                  hover:bg-white/20"
          >
            View site
          </a>
        </div>
      </section>

      <!-- Admin information -->
      @if (authService.user(); as user) {
        <div
          class="mt-8 rounded-xl border border-[#032D42]/20
                bg-[#032D42]/5 p-5"
        >
          <p
            class="text-sm font-semibold uppercase
                  tracking-wide text-[#007979]"
          >
            Signed in as
          </p>

          <p class="mt-1 font-semibold text-[#032D42]">
            {{ user.displayName || user.email }}
          </p>

          <p class="mt-1 text-sm text-gray-600">
            Administrator
          </p>
        </div>
      }

      <!-- Management sections -->
      <section class="mt-8">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-sm font-semibold uppercase
                    tracking-wide text-[#007979]"
            >
              Administration
            </p>

            <h2 class="mt-1 text-xl font-semibold text-[#032D42]">
              Manage content
            </h2>
          </div>
        </div>

        <div
          class="mt-4 grid gap-6 sm:grid-cols-2
                lg:grid-cols-4"
        >
          <!-- Categories -->
          <a
            routerLink="/admin/categories"
            class="group rounded-xl border border-gray-200
                  bg-white p-6 shadow-sm transition
                  hover:border-[#032D42]/40
                  hover:shadow-md"
          >
            <h3
              class="text-lg font-semibold text-[#032D42]
                    group-hover:text-[#007979]"
            >
              Categories
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Create and manage resource categories.
            </p>

            <span
              class="mt-4 inline-block text-sm font-semibold
                    text-[#007979]"
            >
              Manage →
            </span>
          </a>

          <!-- Resources -->
          <a
            routerLink="/admin/resources"
            class="group rounded-xl border border-gray-200
                  bg-white p-6 shadow-sm transition
                  hover:border-[#032D42]/40
                  hover:shadow-md"
          >
            <h3
              class="text-lg font-semibold text-[#032D42]
                    group-hover:text-[#007979]"
            >
              Resources
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Create, edit, publish, and manage resources.
            </p>

            <span
              class="mt-4 inline-block text-sm font-semibold
                    text-[#007979]"
            >
              Manage →
            </span>
          </a>

          <!-- Organizations -->
          <a
            routerLink="/admin/organizations"
            class="group rounded-xl border border-gray-200
                  bg-white p-6 shadow-sm transition
                  hover:border-[#032D42]/40
                  hover:shadow-md"
          >
            <h3
              class="text-lg font-semibold text-[#032D42]
                    group-hover:text-[#007979]"
            >
              Organizations
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Manage organizations associated with resources.
            </p>

            <span
              class="mt-4 inline-block text-sm font-semibold
                    text-[#007979]"
            >
              Manage →
            </span>
          </a>

          <!-- Submissions -->
          <a
            routerLink="/admin/submissions"
            class="group rounded-xl border border-gray-200
                  bg-white p-6 shadow-sm transition
                  hover:border-[#032D42]/40
                  hover:shadow-md"
          >
            <h3
              class="text-lg font-semibold text-[#032D42]
                    group-hover:text-[#007979]"
            >
              Submissions
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Review and manage submitted resources.
            </p>

            <span
              class="mt-4 inline-block text-sm font-semibold
                    text-[#007979]"
            >
              Manage →
            </span>
          </a>
        </div>
      </section>

      <!-- Sign out -->
      <section class="mt-10 border-t border-gray-200 pt-6">
        <button
          type="button"
          (click)="signOut()"
          class="rounded-lg bg-[#032D42] px-5 py-2.5
                text-sm font-semibold text-white
                transition hover:bg-[#032D42]/90"
        >
          Sign out
        </button>
      </section>
    </main>
  `,
})
export class AdminDashboardComponent {
  protected readonly authService = inject(AuthService);

  protected async signOut(): Promise<void> {
    await this.authService.logout();
  }
}
