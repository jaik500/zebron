import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">

      <div class="mx-auto max-w-md">

        <!-- Back navigation -->
        <a
          routerLink="/resources"
          class="inline-flex items-center text-sm font-medium
                 text-gray-600 transition hover:text-[#032D42]"
        >
          ← Back to resources
        </a>

        <!-- Login card -->
        <section
          class="mt-6 overflow-hidden rounded-2xl border
                 border-gray-200 bg-white shadow-lg"
        >

          <!-- Header -->
          <div class="bg-[#032D42] px-6 py-8 text-white sm:px-8">

            <div
              class="flex h-12 w-12 items-center justify-center
                     rounded-xl bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="h-6 w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0
                     3.75 3.75 0 0 1 7.5 0ZM4.5
                     20.25a7.5 7.5 0 0 1 15 0"
                />
              </svg>
            </div>

            <h1 class="mt-5 text-2xl font-bold sm:text-3xl">
              Admin Login
            </h1>

            <p class="mt-2 text-sm leading-6 text-blue-100">
              Sign in to manage Zebron content and resources.
            </p>
          </div>

          <!-- Form -->
          <div class="p-6 sm:p-8">

            <form
              class="space-y-5"
              (ngSubmit)="login()"
            >

              <!-- Email -->
              <div>
                <label
                  for="email"
                  class="block text-sm font-semibold text-gray-800"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="mt-2 block w-full rounded-lg border
                         border-gray-300 bg-white px-4 py-3
                         text-gray-900 shadow-sm
                         transition placeholder:text-gray-400
                         hover:border-gray-400
                         focus:border-[#032D42]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20"
                />
              </div>

              <!-- Password -->
              <div>
                <div class="flex items-center justify-between">
                  <label
                    for="password"
                    class="block text-sm font-semibold text-gray-800"
                  >
                    Password
                  </label>
                </div>

                <div class="relative mt-2">

                  <input
                    id="password"
                    name="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    required
                    autocomplete="current-password"
                    placeholder="Enter your password"
                    class="block w-full rounded-lg border
                           border-gray-300 bg-white px-4 py-3 pr-12
                           text-gray-900 shadow-sm
                           transition placeholder:text-gray-400
                           hover:border-gray-400
                           focus:border-[#032D42]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#032D42]/20"
                  />

                  <button
                    type="button"
                    (click)="showPassword.update(value => !value)"
                    class="absolute inset-y-0 right-0 flex items-center
                           px-4 text-gray-500 transition
                           hover:text-[#032D42]"
                    [attr.aria-label]="
                      showPassword()
                        ? 'Hide password'
                        : 'Show password'
                    "
                  >
                    @if (showPassword()) {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.8"
                        stroke="currentColor"
                        class="h-5 w-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3.98 8.223A10.477
                             10.477 0 0 0 1.5 12c1.5
                             3.75 5.25 6.75 10.5
                             6.75 1.906 0 3.64-.51
                             5.116-1.395M6.228
                             6.228A10.451 10.451 0
                             0 0 12 5.25c5.25 0
                             9 3 10.5 6.75a11.95
                             11.95 0 0 1-4.152
                             5.148M6.228 6.228
                             3 3 0 0 0 0 11.544
                             M6.228 6.228 3 3
                             0 0 1 11.544 0
                             M6.228 6.228 17.772
                             17.772"
                        />
                      </svg>
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.8"
                        stroke="currentColor"
                        class="h-5 w-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012
                             1.012 0 0 1 0-.644
                             C3.423 7.51 7.36
                             4.5 12 4.5c4.64
                             0 8.577 3.01
                             9.964 7.178a1.012
                             1.012 0 0 1 0 .644
                             C20.577 16.49
                             16.64 19.5 12
                             19.5c-4.64 0-8.577
                             -3.01-9.964-7.178Z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 1 1-6 0
                             3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    }
                  </button>

                </div>
              </div>

              <!-- Error -->
              @if (error()) {
                <div
                  role="alert"
                  class="rounded-lg border border-red-200
                         bg-red-50 p-4 text-sm text-red-700"
                >
                  <div class="flex gap-3">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.8"
                      stroke="currentColor"
                      class="mt-0.5 h-5 w-5 shrink-0"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v3.75m9-3.75a9
                           9 0 1 1-18 0 9 9
                           0 0 1 18 0Zm-9
                           5.25h.008v.008H12v-.008Z"
                      />
                    </svg>

                    <p>
                      {{ error() }}
                    </p>

                  </div>
                </div>
              }

              <!-- Sign in -->
              <button
                type="submit"
                [disabled]="loading()"
                class="flex w-full items-center justify-center
                       gap-2 rounded-lg bg-[#007979]
                       px-5 py-3 font-semibold text-white
                       shadow-sm transition
                       hover:bg-[#006666]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/30
                       disabled:cursor-not-allowed
                       disabled:opacity-60"
              >
                @if (loading()) {
                  <svg
                    class="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>

                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0
                         C5.373 0 0 5.373 0 12h4Z"
                    ></path>
                  </svg>

                  Signing in...
                } @else {
                  Sign in
                }
              </button>

            </form>

            <!-- >Register Link -->
            <p class="mt-6 text-center text-sm text-gray-600">
              Don't have an account?
              <a
                routerLink="/register"
                class="font-semibold text-[#032D42] hover:underline"
              >
                Create an account
              </a>
            </p>


            <!-- Security note -->
            <div
              class="mt-6 border-t border-gray-100 pt-5"
            >
              <p class="text-center text-xs leading-5 text-gray-500">
                Authorized administrators only.
                Your credentials are securely handled by Firebase Authentication.
              </p>
            </div>

          </div>
        </section>

      </div>
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
  protected readonly showPassword = signal(false);

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