import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
 
import { AuthService } from '../../../../core/services/auth.service';
 
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatInputModule],
  template: `
    <main class="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-4 sm:px-6 lg:px-8 mt-14">
      <div class="mx-auto max-w-md">
        <!-- Back to resources -->
        <a
          routerLink="/"
          class="inline-flex items-center text-sm font-medium
                 text-gray-600 transition hover:text-[#032D42]"
        >
          ← Home
        </a>
 
        <!-- Registration card -->
        <section
          class="mt-1 overflow-hidden rounded-2xl border
                 border-gray-200 bg-white shadow-lg"
        >
          <!-- Header -->
          <div class="bg-[#032D42] px-6 py-6 text-white sm:px-8">
            <p
              class="text-sm font-semibold uppercase
                     tracking-wide text-blue-100"
            >
              Zebron
            </p>
 
            <h1 class="mt-2 text-2xl font-bold sm:text-3xl">Create your account</h1>
 
            <p class="mt-2 text-sm leading-6 text-blue-100">
              Create an account to access Zebron services and resources.
            </p>
          </div>
 
          <!-- Form -->
          <div class="p-6 sm:px-8 sm:py-4">
            <form class="space-y-4" (ngSubmit)="register()">
              <!-- Display name -->
              <mat-form-field appearance="outline" class="auth-field">
                <mat-label>Full name</mat-label>
                <input
                  matInput
                  id="displayName"
                  name="displayName"
                  type="text"
                  [(ngModel)]="displayName"
                  required
                  autocomplete="name"
                  placeholder="Your name"
                />
              </mat-form-field>
 
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
                  minlength="6"
                  autocomplete="new-password"
                  placeholder="At least 6 characters"
                />
 
                <button
                  type="button"
                  (click)="showPassword.update(value => !value)"
                  matSuffix
                  class="!mr-1 !rounded-md !px-3 !py-2 !text-gray-500 hover:!text-[#032D42]"
                  [attr.aria-label]="showPassword() ? 'Hide passwords' : 'Show passwords'"
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
 
              <!-- Confirm password (shown or hidden together with the password above) -->
              <mat-form-field appearance="outline" class="auth-field">
                <mat-label>Confirm password</mat-label>
                <input
                  matInput
                  id="confirmPassword"
                  name="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password' "
                  [(ngModel)]="confirmPassword"
                  required
                  autocomplete="new-password"
                  placeholder="Enter your password again"
                />

                <button
                  type="button"
                  (click)="showConfirmPassword.update(value => !value)"
                  matSuffix
                  class="!mr-1 !rounded-md !px-3 !py-2 !text-gray-500 hover:!text-[#032D42]"
                  [attr.aria-label]="showConfirmPassword() ? 'Hide passwords' : 'Show passwords'"              >
                  @if (showConfirmPassword()) {
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
 
              <!-- Register button -->
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
 
                  Creating account...
                } @else {
                  Create account
                }
              </button>
            </form>
 
            <!-- Login link -->
            <p class="mt-6 mb-2 text-center text-sm text-gray-600">
              Already have an account?
              <a routerLink="/login" class="font-semibold text-[#032D42] hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .auth-field { display: block; width: 100%; min-width: 0; margin-bottom: 8px; }
    mat-form-field { box-sizing: border-box; }
    @media (max-width: 640px) { .auth-field { font-size: 16px; } }
  `],
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
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
 
  protected async register(): Promise<void> {
    // Prevent duplicate submissions while registration is running.
    if (this.loading()) {
      return;
    }
 
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
      this.error.set('Password must be at least 6 characters.');
      return;
    }
 
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
 
    this.loading.set(true);
 
    try {
      await this.authService.register(email, this.password, displayName);
 
      // New users are regular users, not administrators.
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Registration failed:', error);
 
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
 
  /** Turn a Firebase error into a message the user can act on. */
  private getErrorMessage(error: unknown): string {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
 
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Please choose a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'Unable to create your account. Please check your information and try again.';
    }
  }
}
 