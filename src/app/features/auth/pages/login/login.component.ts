import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-md p-8">
      <a
        routerLink="/resources"
        class="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to resources
      </a>

      <section
        class="mt-8 rounded-xl border border-gray-200
               bg-white p-6 shadow-sm"
      >
        <h1 class="text-2xl font-bold text-gray-900">
          Admin Login
        </h1>

        <p class="mt-2 text-sm text-gray-600">
          Sign in to manage Zebron content.
        </p>

        <form
          class="mt-6 space-y-5"
          (ngSubmit)="login()"
        >
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
              class="mt-1 block w-full rounded-lg border
                     border-gray-300 px-4 py-2
                     focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500"
            />
          </div>

          @if (error()) {
            <div
              class="rounded-lg border border-red-200
                     bg-red-50 p-4 text-sm text-red-700"
            >
              {{ error() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-lg bg-blue-600 px-5 py-2
                   font-medium text-white
                   hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
      </section>
    </main>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async login(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.authService.signIn(
        this.email.trim(),
        this.password
      );

      await this.router.navigate(['/admin']);
    } catch (error) {
      console.error('Login failed:', error);

      this.error.set(
        'Unable to sign in. Please check your email and password.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
