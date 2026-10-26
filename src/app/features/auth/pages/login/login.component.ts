import { Component, inject, OnDestroy, signal, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

const ADMIN_TOAST_ID = 'admin-login-prompt';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatInputModule],
  template: `
    <main class="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-4 sm:px-6 lg:px-8 mt-14">
      <div class="mx-auto max-w-md">
        <!-- Back navigation -->
        <a
          routerLink="/resources"
          class="inline-flex items-center text-sm font-medium
                 text-gray-600 transition hover:text-[#032D42]"
        >
          ← Home
        </a>

        <!-- Login card -->
        <section
          class="mt-1 overflow-hidden rounded-2xl border
                 border-gray-200 bg-white shadow-lg"
        >
          <!-- Header -->
          <div class="bg-[#032D42] px-6 py-6 text-white sm:px-8">
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

            <h1 class="mt-5 text-2xl font-bold sm:text-3xl">Sign in to Zebron</h1>

            <p class="mt-2 text-sm leading-6 text-blue-100">
              Sign in to access your Zebron account.
            </p>
          </div>

          <!-- Form -->
          <div class="p-6 sm:px-8 sm:py-4">
            <form class="space-y-4" (ngSubmit)="login()">
              <!-- Email -->
              <mat-form-field appearance="outline" class="auth-field">
                <mat-label>Email address</mat-label>
                <input
                  matInput
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                  
                />
              </mat-form-field>

              <!-- Password -->
              <mat-form-field appearance="outline" class="auth-field">
                <mat-label>Password</mat-label>
                <input
                  matInput
                  id="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  required
                  autocomplete="current-password"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  (click)="showPassword.update(value => !value)"
                  matSuffix
                  class="!mr-1 !rounded-md !px-3 !py-2 !text-gray-500 hover:!text-[#032D42]"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
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
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
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
              </mat-form-field>

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

                    <p>{{ error() }}</p>
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

            <!-- Register link -->
            <p class="mt-6 text-center text-sm text-gray-600">
              Don't have an account?
              <a routerLink="/register" class="font-semibold text-[#032D42] hover:underline">
                Create an account
              </a>
            </p>

            <!-- Security note -->
            <div class="mt-6 border-t border-gray-100 pt-5">
              <p class="text-center text-xs leading-5 text-gray-500">
                Your credentials are securely handled by Firebase Authentication.
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Administrator task selection popup (rendered inside a toast). -->
      <ng-template #adminPrompt>
        <div class="w-full">
          <p class="text-lg font-semibold text-[#032D42]">Administrator Access</p>

          <p class="mt-2 text-sm leading-6 text-gray-600">
            You have administrator access to Zebron. Would you like to perform administrative tasks?
          </p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="continueToResources()"
              class="rounded-lg border border-gray-300
                     bg-white px-4 py-2.5 text-sm
                     font-semibold text-gray-700
                     transition hover:bg-gray-50"
            >
              Go to Resources
            </button>

            <button
              type="button"
              (click)="continueToAdmin()"
              class="rounded-lg bg-[#032D42]
                     px-4 py-2.5 text-sm
                     font-semibold text-white
                     transition hover:bg-[#032D42]/90"
            >
              Admin Tasks
            </button>
          </div>
        </div>
      </ng-template>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .auth-field { display: block; width: 100%; min-width: 0; margin-bottom: 8px; }
    mat-form-field { box-sizing: border-box; }
    @media (max-width: 640px) { .auth-field { font-size: 16px; } }
  `],
})
export class LoginComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);

  protected email = '';
  protected password = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  private readonly adminPrompt = viewChild.required<TemplateRef<unknown>>('adminPrompt');

  /**
   * Sign the user in and route them according to their account role.
   *
   * Administrators are shown a toast asking whether they want to
   * perform admin tasks. Regular users go straight to the resources page.
   */
  protected async login(): Promise<void> {
    // Prevent duplicate submissions while a login attempt is running.
    if (this.loading()) {
      return;
    }

    const email = this.email.trim();
    if (!email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Authenticate with Firebase and load the Firestore user profile.
      await this.authService.signIn(email, this.password);

      if (this.authService.isAdmin) {
        // The admin chooses where to continue from the toast.
        // A repeated id will not create a duplicate toast.
        this.toast.show(this.adminPrompt(), {
          id: ADMIN_TOAST_ID,
          autoClose: false,
          dismissible: false,
          style: {
            width: '500px',
            maxWidth: '90vw',
            padding: '24px',
          },
        });
        return;
      }

      // Regular users go directly to the public resource directory.
      await this.router.navigate(['/resources']);
    } catch (error) {
      console.error('Login failed:', error);
      this.error.set('Unable to sign in. Please check your email and password.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Route the administrator to the public resource directory. */
  protected continueToResources(): void {
    this.toast.close(ADMIN_TOAST_ID);
    this.router.navigate(['/resources']);
  }

  /** Route the administrator to the admin dashboard. */
  protected continueToAdmin(): void {
    this.toast.close(ADMIN_TOAST_ID);
    this.router.navigate(['/admin']);
  }

  /** Make sure the non-dismissible toast never outlives this page. */
  ngOnDestroy(): void {
    this.toast.close(ADMIN_TOAST_ID);
  }
}