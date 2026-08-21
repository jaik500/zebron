
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div class="mx-auto max-w-md">

        <!-- Back to resources -->
        <a
          routerLink="/resources"
          class="text-sm font-medium text-gray-600
                 transition hover:text-[#032D42]"
        >
          ← Back to resources
        </a>

        <!-- Registration card -->
        <section
          class="mt-8 overflow-hidden rounded-2xl
                 border border-gray-200 bg-white shadow-sm"
        >

          <!-- Header -->
          <div class="bg-[#032D42] px-6 py-7 text-white sm:px-8">
            <p
              class="text-sm font-semibold uppercase
                     tracking-wide text-blue-100"
            >
              Zebron
            </p>

            <h1 class="mt-2 text-2xl font-bold sm:text-3xl">
              Create your account
            </h1>

            <p class="mt-2 text-sm leading-6 text-blue-100">
              Create an account to access Zebron services and resources.
            </p>
          </div>

          <!-- Form -->
          <div class="p-6 sm:p-8">
            <form
              class="space-y-5"
              (ngSubmit)="register()"
            >

              <!-- Display name -->
              <div>
                <label
                  for="displayName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>

                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  [(ngModel)]="displayName"
                  required
                  autocomplete="name"
                  placeholder="Your name"
                  class="mt-1 block w-full rounded-lg
                         border border-gray-300 bg-white
                         px-4 py-2.5 text-gray-800 shadow-sm
                         transition
                         hover:border-gray-400
                         focus:border-[#032D42]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20"
                />
              </div>

              <!-- Email -->
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
                  placeholder="you@example.com"
                  class="mt-1 block w-full rounded-lg
                         border border-gray-300 bg-white
                         px-4 py-2.5 text-gray-800 shadow-sm
                         transition
                         hover:border-gray-400
                         focus:border-[#032D42]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20"
                />
              </div>

              <!-- Password -->
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
                  minlength="6"
                  autocomplete="new-password"
                  placeholder="At least 6 characters"
                  class="mt-1 block w-full rounded-lg
                         border border-gray-300 bg-white
                         px-4 py-2.5 text-gray-800 shadow-sm
                         transition
                         hover:border-gray-400
                         focus:border-[#032D42]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20"
                />
              </div>

              <!-- Confirm password -->
              <div>
                <label
                  for="confirmPassword"
                  class="block text-sm font-medium text-gray-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  [(ngModel)]="confirmPassword"
                  required
                  autocomplete="new-password"
                  placeholder="Enter your password again"
                  class="mt-1 block w-full rounded-lg
                         border border-gray-300 bg-white
                         px-4 py-2.5 text-gray-800 shadow-sm
                         transition
                         hover:border-gray-400
                         focus:border-[#032D42]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20"
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

              <!-- Register button -->
              <button
                type="submit"
                [disabled]="loading()"
                class="w-full rounded-lg bg-[#032D42]
                       px-5 py-3 font-medium text-white
                       shadow-sm transition
                       hover:bg-[#02405A]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                {{
                  loading()
                    ? 'Creating account...'
                    : 'Create account'
                }}
              </button>
            </form>

            <!-- Login link -->
            <p class="mt-6 text-center text-sm text-gray-600">
              Already have an account?
              <a
                routerLink="/login"
                class="font-semibold text-[#032D42]
                       hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected displayName = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async register(): Promise<void> {
    this.error.set(null);

    const displayName = this.displayName.trim();
    const email = this.email.trim();

    if (!displayName) {
      this.error.set('Please enter your name.');
      return;
    }

    if (!email) {
      this.error.set('Please enter your email address.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set(
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);

    try {
      await this.authService.register(
        email,
        this.password,
        displayName
      );

      // New users are regular users, not administrators.
      await this.router.navigate(['/resources']);
    } catch (error) {
      console.error('Registration failed:', error);

      this.error.set(
        'Unable to create your account. Please check your information and try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}

