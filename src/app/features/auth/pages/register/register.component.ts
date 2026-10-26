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
    <main class="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div class="mx-auto max-w-md">
        <!-- Back to resources -->
        <a
          routerLink="/resources"
          class="inline-flex items-center text-sm font-medium
                 text-gray-600 transition hover:text-[#032D42]"
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
            <form class="space-y-5" (ngSubmit)="register()">
              <!-- Display name -->
              <mat-form-field appearance="outline" class="auth-field">
  <mat-label>Full name</mat-label>
  <input
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
  <mat-label>Email</mat-label>
  <input
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
                  id="password"
                  name="password"
                  type="password"
                  [(ngModel)]="password"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  placeholder="At least 6 characters"
                />
</mat-form-field>

              <!-- Confirm password -->
              <mat-form-field appearance="outline" class="auth-field">
  <mat-label>Confirm password</mat-label>
  <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  [(ngModel)]="confirmPassword"
                  required
                  autocomplete="new-password"
                  placeholder="Enter your password again"
                />
</mat-form-field>

              @if (error()) {
                <div
                  role="alert"
                  class="rounded-xl border border-red-200
                         bg-red-50 p-4 text-sm text-red-700"
                >
                  {{ error() }}
                </div>
              }

              <!-- Register button -->
              <button
                type="submit"
                [disabled]="loading()"
                class="w-full rounded-xl bg-[#007979]
                       px-5 py-3 font-semibold text-white
                       shadow-sm transition
                       hover:bg-[#006666]
                       focus:outline-none focus:ring-2
                       focus:ring-[#007979]/30
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
                class="font-semibold text-[#032D42] hover:underline"
              >
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
      this.error.set('Password must be at least 6 characters.');
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
