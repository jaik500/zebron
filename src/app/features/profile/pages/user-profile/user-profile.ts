import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',

  standalone: true,

  imports: [FormsModule, RouterLink],

  template: `
    <main class="mx-auto max-w-7xl p-6 sm:p-8">
      <!-- =========================================================
     Profile navigation
     ========================================================= -->
      <div
        class="mb-1 flex items-center
         justify-between gap-4"
      >
        <!-- Back to resources -->
        <a
          routerLink="/resources"
          class="inline-flex items-center gap-1
           text-sm font-medium text-gray-500
           transition hover:text-[#007979]"
        >
          ← Back to resources
        </a>

        <!-- Admin dashboard -->
        @if (authService.isAdmin) {
          <a
            routerLink="/admin"
            class="inline-flex items-center gap-2
             rounded-lg border
             border-[#032D42]/20
             bg-white px-4 py-1
             text-sm font-semibold
             text-[#032D42]
             shadow-sm
             transition hover:bg-gray-50
             focus:outline-none
             focus:ring-2
             focus:ring-[#007979]/20
             hover:bg-[#17433F]"
          >
            Back to Admin Dashboard
            <span aria-hidden="true">→</span>
          </a>
        }
      </div>
      <!-- =========================================================
           Profile header
           ========================================================= -->
      <!-- Profile header -->
      <section
        class="rounded-2xl bg-[#032D42]
         px-6 py-8 text-white
         shadow-sm sm:px-8"
      >
        <div
          class="flex flex-col gap-5
           sm:flex-row sm:items-center
           sm:justify-between"
        >
          <!-- Profile identity -->
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div
              class="flex h-16 w-16 shrink-0
               items-center justify-center
               rounded-full bg-white/15
               text-xl font-bold text-white
               ring-2 ring-white/20"
            >
              @if (authService.user(); as user) {
                {{ initials(user.preferredName || user.displayName || user.email) }}
              } @else {
                ?
              }
            </div>

            <div class="min-w-0">
              <p
                class="text-sm font-semibold
                 uppercase tracking-wide
                 text-blue-100"
              >
                Profile
              </p>

              <h1
                class="mt-1 text-2xl font-bold
                 tracking-tight text-white
                 sm:text-3xl"
              >
                My Profile
              </h1>

              @if (authService.user(); as user) {
                <p
                  class="mt-1 truncate
                   text-sm text-blue-100"
                >
                  {{ user.email }}
                </p>
              }
            </div>
          </div>

          <!-- =========================================================
     Header navigation
     Home + More menu
     ========================================================= -->
          <div class="relative flex items-center gap-2">
            <!-- Home -->
            <a
              routerLink="/resources"
              class="inline-flex shrink-0
           items-center justify-center
           gap-2 rounded-lg
           border border-white/30
           bg-white/10 px-4 py-2.5
           text-sm font-semibold
           text-white
           transition hover:bg-white/20
           focus:outline-none
           focus:ring-2
           focus:ring-white/40"
            >
              <span aria-hidden="true">⌂</span>
              Home
            </a>

            <!-- More menu -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleMoreMenu()"
                [attr.aria-expanded]="showMoreMenu()"
                aria-label="More navigation options"
                class="inline-flex h-10 w-10
             items-center justify-center
             rounded-lg
             border border-white/30
             bg-white/10
             text-xl font-bold
             text-white
             transition hover:bg-white/20
             focus:outline-none
             focus:ring-2
             focus:ring-white/40"
              >
                <span aria-hidden="true" class="leading-none"> ⋮ </span>
              </button>

              <!-- More menu dropdown -->
              @if (showMoreMenu()) {
                <div
                  class="absolute right-0 z-50 mt-2
               w-56 overflow-hidden
               rounded-xl
               border border-gray-200
               bg-white
               shadow-lg"
                >
                  <!-- Menu heading -->
                  <div
                    class="border-b border-gray-100
                 px-4 py-3"
                  >
                    <p
                      class="text-xs font-semibold
                   uppercase tracking-wide
                   text-[#007979]"
                    >
                      More
                    </p>

                    <p class="mt-1 text-xs text-gray-500">Explore Zebron</p>
                  </div>

                  <!-- Resources -->
                  <a
                    routerLink="/resources"
                    (click)="closeMoreMenu()"
                    class="flex items-center gap-3
                 px-4 py-3
                 text-sm font-medium
                 text-gray-700
                 transition hover:bg-gray-50
                 hover:text-[#007979]"
                  >
                    <span class="text-base" aria-hidden="true"> 📚 </span>

                    Resources
                  </a>

                  <!-- Profile -->
                  <a
                    routerLink="/profile"
                    (click)="closeMoreMenu()"
                    class="flex items-center gap-3
                 px-4 py-3
                 text-sm font-medium
                 text-gray-700
                 transition hover:bg-gray-50
                 hover:text-[#007979]"
                  >
                    <span class="text-base" aria-hidden="true"> 👤 </span>

                    My Profile
                  </a>

                  <!-- Admin Dashboard -->
                  @if (authService.isAdmin) {
                    <a
                      routerLink="/admin"
                      (click)="closeMoreMenu()"
                      class="flex items-center gap-3
                   border-t border-gray-100
                   px-4 py-3
                   text-sm font-medium
                   text-gray-700
                   transition hover:bg-gray-50
                   hover:text-[#007979]"
                    >
                      <span class="text-base" aria-hidden="true"> ⚙ </span>

                      Admin Dashboard
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           Loading state
           ========================================================= -->
      @if (authService.isLoading()) {
        <section
          class="mt-6 rounded-2xl
                 border border-gray-200
                 bg-white p-8 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="h-5 w-5 animate-spin
                     rounded-full border-2
                     border-gray-300
                     border-t-[#007979]"
            ></div>

            <p class="text-sm text-gray-500">Loading your profile...</p>
          </div>
        </section>
      }

      <!-- =========================================================
           Main profile content
           ========================================================= -->
      @if (!authService.isLoading() && authService.user(); as user) {
        <div
          class="mt-6 grid gap-6
                 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <!-- =====================================================
               Main profile form
               ===================================================== -->
          <section
            class="overflow-hidden rounded-2xl
                   border border-gray-200
                   bg-white shadow-sm"
          >
            <!-- Section heading -->
            <div
              class="border-b border-gray-200
                     bg-gray-50/60 p-6 sm:p-8"
            >
              <p
                class="text-xs font-semibold
                       uppercase tracking-wide
                       text-[#007979]"
              >
                Personal information
              </p>

              <h2
                class="mt-1 text-xl font-semibold
                       text-[#032D42]"
              >
                Account details
              </h2>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-500"
              >
                Keep your Zebron profile information up to date. Optional fields can be left blank.
              </p>
            </div>

            <!-- ===================================================
                 Profile form
                 =================================================== -->
            <form class="space-y-7 p-6 sm:p-8" (ngSubmit)="saveProfile()">
              <!-- =================================================
                   Display name
                   ================================================= -->
              <div>
                <label
                  for="displayName"
                  class="block text-sm
                         font-medium text-gray-700"
                >
                  Display name
                </label>

                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  [(ngModel)]="displayName"
                  required
                  autocomplete="name"
                  placeholder="Your name"
                  class="mt-1.5 block w-full
                         rounded-lg border
                         border-gray-300
                         bg-white px-4 py-2.5
                         text-sm text-gray-900
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

                <p
                  class="mt-1.5 text-xs
                         text-gray-500"
                >
                  This name will be displayed throughout your Zebron account.
                </p>
              </div>

              <!-- =================================================
                   First and last name
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >
                <div>
                  <label
                    for="firstName"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    [(ngModel)]="firstName"
                    autocomplete="given-name"
                    placeholder="First name"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="lastName"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    [(ngModel)]="lastName"
                    autocomplete="family-name"
                    placeholder="Last name"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   Preferred name and phone
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >
                <div>
                  <label
                    for="preferredName"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Preferred name
                    <span class="font-normal text-gray-400"> (optional) </span>
                  </label>

                  <input
                    id="preferredName"
                    name="preferredName"
                    type="text"
                    [(ngModel)]="preferredName"
                    placeholder="What should we call you?"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="phone"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Phone number
                    <span class="font-normal text-gray-400"> (optional) </span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    [(ngModel)]="phone"
                    autocomplete="tel"
                    placeholder="(555) 555-5555"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   Email
                   ================================================= -->
              <div>
                <label
                  for="email"
                  class="block text-sm
                         font-medium text-gray-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  [value]="user.email"
                  disabled
                  class="mt-1.5 block w-full
                         rounded-lg border
                         border-gray-300
                         bg-gray-50 px-4 py-2.5
                         text-sm text-gray-500"
                />

                <p
                  class="mt-1.5 text-xs
                         text-gray-500"
                >
                  Your email address is managed through your authentication account.
                </p>
              </div>

              <!-- =================================================
                   Location heading
                   ================================================= -->
              <div
                class="border-t border-gray-200
                       pt-7"
              >
                <h3
                  class="text-base font-semibold
                         text-[#032D42]"
                >
                  Location
                </h3>

                <p class="mt-1 text-sm text-gray-500">Location information is optional.</p>
              </div>

              <!-- =================================================
                   Country information
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >
                <div>
                  <label
                    for="countryOfOrigin"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Country of origin
                  </label>

                  <input
                    id="countryOfOrigin"
                    name="countryOfOrigin"
                    type="text"
                    [(ngModel)]="countryOfOrigin"
                    placeholder="Country of origin"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="currentCountry"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Current country
                  </label>

                  <input
                    id="currentCountry"
                    name="currentCountry"
                    type="text"
                    [(ngModel)]="currentCountry"
                    placeholder="Current country"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   City and state
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >
                <div>
                  <label
                    for="city"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    [(ngModel)]="city"
                    autocomplete="address-level2"
                    placeholder="City"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="state"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    State / Province
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    [(ngModel)]="state"
                    autocomplete="address-level1"
                    placeholder="State or province"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   Postal code and language
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >
                <div>
                  <label
                    for="postalCode"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    ZIP / Postal code
                  </label>

                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    [(ngModel)]="postalCode"
                    autocomplete="postal-code"
                    placeholder="ZIP or postal code"
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="preferredLanguage"
                    class="block text-sm
                           font-medium text-gray-700"
                  >
                    Preferred language
                  </label>

                  <input
                    id="preferredLanguage"
                    name="preferredLanguage"
                    type="text"
                    [(ngModel)]="preferredLanguage"
                    placeholder="English, French, etc."
                    class="mt-1.5 block w-full
                           rounded-lg border
                           border-gray-300
                           bg-white px-4 py-2.5
                           text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   About me
                   ================================================= -->
              <div
                class="border-t border-gray-200
                       pt-7"
              >
                <label
                  for="bio"
                  class="block text-sm
                         font-medium text-gray-700"
                >
                  About me
                  <span class="font-normal text-gray-400"> (optional) </span>
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  [(ngModel)]="bio"
                  maxlength="500"
                  placeholder="Tell us a little about yourself..."
                  class="mt-1.5 block w-full
                         rounded-lg border
                         border-gray-300
                         bg-white px-4 py-2.5
                         text-sm text-gray-900
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                ></textarea>

                <p
                  class="mt-1.5 text-xs
                         text-gray-500"
                >
                  Maximum 500 characters.
                </p>
              </div>

              <!-- =================================================
                   Website
                   ================================================= -->
              <div>
                <label
                  for="website"
                  class="block text-sm
                         font-medium text-gray-700"
                >
                  Website / LinkedIn
                  <span class="font-normal text-gray-400"> (optional) </span>
                </label>

                <input
                  id="website"
                  name="website"
                  type="url"
                  [(ngModel)]="website"
                  autocomplete="url"
                  placeholder="https://example.com"
                  class="mt-1.5 block w-full
                         rounded-lg border
                         border-gray-300
                         bg-white px-4 py-2.5
                         text-sm text-gray-900
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />
              </div>

              <!-- =================================================
                   Account role
                   ================================================= -->
              <div
                class="border-t border-gray-200
                       pt-7"
              >
                <label
                  for="role"
                  class="block text-sm
                         font-medium text-gray-700"
                >
                  Account role
                </label>

                <input
                  id="role"
                  name="role"
                  type="text"
                  [value]="user.role"
                  disabled
                  class="mt-1.5 block w-full
                         rounded-lg border
                         border-gray-300
                         bg-gray-50 px-4 py-2.5
                         text-sm capitalize
                         text-gray-500"
                />

                <p
                  class="mt-1.5 text-xs
                         text-gray-500"
                >
                  Account roles are managed by Zebron administrators.
                </p>
              </div>

              <!-- =================================================
                   Error
                   ================================================= -->
              @if (error()) {
                <div
                  role="alert"
                  class="rounded-lg border
                         border-red-200
                         bg-red-50 px-4 py-3
                         text-sm text-red-700"
                >
                  {{ error() }}
                </div>
              }

              <!-- =================================================
                   Save button
                   ================================================= -->
              <div
                class="flex items-center
                       justify-end
                       border-t border-gray-200
                       pt-6"
              >
                <button
                  type="submit"
                  [disabled]="saving()"
                  class="rounded-lg
                         bg-[#032D42]
                         px-5 py-2.5
                         text-sm font-semibold
                         text-white
                         transition
                         hover:bg-[#032D42]/90
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#032D42]/20
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    Save changes
                  }
                </button>
              </div>
            </form>
          </section>

          <!-- =====================================================
               Account actions
               ===================================================== -->
          <aside
            class="h-fit overflow-hidden
                   rounded-2xl
                   border border-gray-200
                   bg-white shadow-sm"
          >
            <!-- Account heading -->
            <div
              class="border-b border-gray-200
                     bg-gray-50/60 p-6"
            >
              <p
                class="text-xs font-semibold
                       uppercase tracking-wide
                       text-[#007979]"
              >
                Account
              </p>

              <h2
                class="mt-1 text-xl font-semibold
                       text-[#032D42]"
              >
                Account actions
              </h2>

              <p
                class="mt-2 text-sm leading-6
                       text-gray-500"
              >
                Manage your Zebron account.
              </p>
            </div>

            <!-- Account options -->
            <div class="divide-y divide-gray-200">
              <!-- Change password -->
              <div class="p-6">
                <p
                  class="text-sm font-semibold
                         text-gray-900"
                >
                  Password
                </p>

                <p
                  class="mt-1 text-sm leading-6
                         text-gray-500"
                >
                  Update your account password.
                </p>

                <button
                  type="button"
                  (click)="changePassword()"
                  class="mt-4 w-full
                         rounded-lg
                         border border-gray-300
                         bg-white px-4 py-2.5
                         text-sm font-semibold
                         text-gray-700
                         transition
                         hover:bg-gray-50
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                >
                  Change password
                </button>
              </div>

              <!-- Sign out -->
              <div class="p-6">
                <p
                  class="text-sm font-semibold
                         text-gray-900"
                >
                  Sign out
                </p>

                <p
                  class="mt-1 text-sm leading-6
                         text-gray-500"
                >
                  End your current Zebron session.
                </p>

                <button
                  type="button"
                  (click)="signOut()"
                  [disabled]="signingOut()"
                  class="mt-4 w-full
                         rounded-lg
                         border border-gray-300
                         bg-white px-4 py-2.5
                         text-sm font-semibold
                         text-gray-700
                         transition
                         hover:bg-gray-50
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  @if (signingOut()) {
                    Signing out...
                  } @else {
                    Sign out
                  }
                </button>
              </div>

              <!-- Delete account -->
              <div class="p-6">
                <p
                  class="text-sm font-semibold
                         text-red-700"
                >
                  Delete account
                </p>

                <p
                  class="mt-1 text-sm leading-6
                         text-gray-500"
                >
                  Permanently remove your Zebron account.
                </p>

                <button
                  type="button"
                  (click)="deleteAccount()"
                  class="mt-4 w-full
                         rounded-lg
                         border border-red-200
                         bg-white px-4 py-2.5
                         text-sm font-semibold
                         text-red-700
                         transition
                         hover:bg-red-50
                         focus:outline-none
                         focus:ring-2
                         focus:ring-red-500/20"
                >
                  Delete account
                </button>
              </div>
            </div>
          </aside>
        </div>
      }

      <!-- =========================================================
           No authenticated profile
           ========================================================= -->
      @if (!authService.isLoading() && !authService.user()) {
        <section
          class="mt-6 rounded-2xl
                 border border-gray-200
                 bg-white p-8 text-center
                 shadow-sm"
        >
          <h2
            class="text-lg font-semibold
                   text-[#032D42]"
          >
            Profile unavailable
          </h2>

          <p class="mt-2 text-sm text-gray-600">Please sign in to view your profile.</p>

          <a
            routerLink="/login"
            class="mt-5 inline-flex
                   rounded-lg bg-[#032D42]
                   px-5 py-2.5 text-sm
                   font-semibold text-white
                   transition
                   hover:bg-[#032D42]/90"
          >
            Sign in
          </a>
        </section>
      }
    </main>
  `,
})
export class UserProfileComponent implements OnInit {
  // =============================================================
  // Services
  // =============================================================

  protected readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  // =============================================================
  // Required profile information
  // =============================================================

  protected displayName = '';

  // =============================================================
  // Optional personal information
  // =============================================================

  protected firstName = '';
  protected lastName = '';
  protected preferredName = '';
  protected phone = '';

  // =============================================================
  // Optional location information
  // =============================================================

  protected countryOfOrigin = '';
  protected currentCountry = '';
  protected city = '';
  protected state = '';
  protected postalCode = '';

  // =============================================================
  // Optional preferences
  // =============================================================

  protected preferredLanguage = '';

  // =============================================================
  // Optional profile information
  // =============================================================

  protected bio = '';
  protected website = '';

  // =============================================================
  // UI state
  // =============================================================

  protected readonly saving = signal(false);

  protected readonly signingOut = signal(false);

  protected readonly error = signal<string | null>(null);
  // Controls the additional navigation menu.
  protected readonly showMoreMenu = signal(false);

  // =============================================================
  // Initialize profile form
  // =============================================================

  ngOnInit(): void {
    const user = this.authService.user();

    if (!user) {
      return;
    }

    // Required profile information.
    this.displayName = user.displayName ?? '';

    // Optional personal information.
    this.firstName = user.firstName ?? '';

    this.lastName = user.lastName ?? '';

    this.preferredName = user.preferredName ?? '';

    this.phone = user.phone ?? '';

    // Optional location information.
    this.countryOfOrigin = user.countryOfOrigin ?? '';

    this.currentCountry = user.currentCountry ?? '';

    this.city = user.city ?? '';

    this.state = user.state ?? '';

    this.postalCode = user.postalCode ?? '';

    // Optional preferences.
    this.preferredLanguage = user.preferredLanguage ?? '';

    // Optional profile information.
    this.bio = user.bio ?? '';

    this.website = user.website ?? '';
  }

  // =============================================================
  // Save profile
  // =============================================================

  /**
   * Save the user's profile information.
   *
   * Display name is required.
   * All other profile fields are optional.
   */
  protected async saveProfile(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const name = this.displayName.trim();

    if (!name) {
      this.error.set('Display name is required.');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.authService.updateUserProfile({
        displayName: name,

        firstName: this.firstName,

        lastName: this.lastName,

        preferredName: this.preferredName,

        phone: this.phone,

        countryOfOrigin: this.countryOfOrigin,

        currentCountry: this.currentCountry,

        city: this.city,

        state: this.state,

        postalCode: this.postalCode,

        preferredLanguage: this.preferredLanguage,

        bio: this.bio,

        website: this.website,
      });

      this.toast.success('Profile updated successfully.');
    } catch (error: any) {
      console.error('Failed to update profile:', error);

      const message = error?.message || 'Unable to update your profile. Please try again.';

      this.error.set(message);

      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  // =============================================================
  // Change password
  // =============================================================

  /**
   * Initiate a password change.
   *
   * The actual Firebase password reset flow will
   * be connected here next.
   */
  protected async changePassword(): Promise<void> {
    const user = this.authService.user();

    if (!user?.email) {
      this.toast.error('Unable to determine your account email.');

      return;
    }

    this.toast.success('Password reset instructions will be sent to your email.');
  }

  

  // =============================================================
  // Sign out
  // =============================================================

  /**
   * Sign the user out and return to login.
   */
  protected async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      await this.authService.logout();

      this.toast.success('You have been signed out.');

      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    } finally {
      this.signingOut.set(false);
    }
  }

  // =============================================================
  // Delete account
  // =============================================================

  /**
   * Account deletion will be implemented with
   * an explicit confirmation flow.
   */
  protected deleteAccount(): void {
    this.toast.error('Account deletion is not available yet.');
  }

  // =============================================================
  // Avatar initials
  // =============================================================

  /**
   * Generate initials for the profile avatar.
   */
  protected initials(value: string | null | undefined): string {
    if (!value) {
      return '?';
    }

    const parts = value.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Toggle the additional navigation menu.
   */
  protected toggleMoreMenu(): void {
    this.showMoreMenu.update((visible) => !visible);
  }

  /**
   * Close the additional navigation menu.
   */
  protected closeMoreMenu(): void {
    this.showMoreMenu.set(false);
  }
}
