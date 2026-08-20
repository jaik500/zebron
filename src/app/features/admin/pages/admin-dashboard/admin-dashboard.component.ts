import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-6xl p-8">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

          <p class="mt-2 text-gray-600">
            Manage Zebron resources and database content.
          </p>
        </div>

        <a
          routerLink="/resources"
          class="rounded-lg border border-gray-300 px-4 py-2
                 text-sm font-medium text-gray-700
                 hover:bg-gray-50"
        >
          View site
        </a>
      </div>

      <!-- Admin information -->
      @if (authService.user(); as user) {
        <div
          class="mt-8 rounded-xl border border-blue-200
                 bg-blue-50 p-5"
        >
          <p class="text-sm text-blue-600">
            Signed in as
          </p>

          <p class="mt-1 font-semibold text-blue-900">
            {{ user.displayName || user.email }}
          </p>

          <p class="mt-1 text-sm text-blue-700">
            Administrator
          </p>
        </div>
      }

      <!-- Management sections -->
      <section class="mt-8">
        <h2 class="text-xl font-semibold text-gray-900">
          Manage content
        </h2>

        <div
          class="mt-4 grid gap-6 sm:grid-cols-2
                 lg:grid-cols-4"
        >
          <!-- Categories -->
          <a
            routerLink="/admin/categories"
            class="rounded-xl border border-gray-200
                   bg-white p-6 shadow-sm
                   transition hover:border-blue-300
                   hover:shadow-md"
          >
            <h3 class="text-lg font-semibold text-gray-900">
              Categories
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Create and manage resource categories.
            </p>
          </a>

          <!-- Resources -->
          <a
            routerLink="/admin/resources"
            class="rounded-xl border border-gray-200
                   bg-white p-6 shadow-sm
                   transition hover:border-blue-300
                   hover:shadow-md"
          >
            <h3 class="text-lg font-semibold text-gray-900">
              Resources
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Create, edit, publish, and manage resources.
            </p>
          </a>

          <!-- Organizations -->
          <a
            routerLink="/admin/organizations"
            class="rounded-xl border border-gray-200
                   bg-white p-6 shadow-sm
                   transition hover:border-blue-300
                   hover:shadow-md"
          >
            <h3 class="text-lg font-semibold text-gray-900">
              Organizations
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Manage organizations associated with resources.
            </p>
          </a>

          <!-- Submissions -->
          <a
            routerLink="/admin/submissions"
            class="rounded-xl border border-gray-200
                   bg-white p-6 shadow-sm
                   transition hover:border-blue-300
                   hover:shadow-md"
          >
            <h3 class="text-lg font-semibold text-gray-900">
              Submissions
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              Review and manage submitted resources.
            </p>
          </a>
        </div>
      </section>

      <!-- Sign out -->
      <section class="mt-10 border-t border-gray-200 pt-6">
        <button
          type="button"
          (click)="signOut()"
          class="rounded-lg bg-gray-900 px-4 py-2
                 text-sm font-medium text-white
                 hover:bg-gray-700"
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
