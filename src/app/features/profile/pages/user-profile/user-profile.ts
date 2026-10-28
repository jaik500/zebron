import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { firestore } from '../../../../core/services/firebase-config';
import { Organization } from '../../../../core/models/organization.model';
import { OrganizationMembership } from '../../../../core/models/organization-membership.model';
import { OrganizationMembershipRepository } from '../../../../core/repositories/firestore/organization-membership.repository';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../../core/repositories/organization.repository';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

import { CommunityFollowStore } from '../../../community/store/community-follow.store';
import { CommunityUser } from '../../../community/models/community-user.model';

@Component({
  selector: 'app-user-profile',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],

  styles: [
    `
      :host .tax-field {
        display: block;
        width: 100%;
      }

      :host .tax-field .mat-mdc-form-field-subscript-wrapper {
        min-height: 0;
      }
    `,
  ],

  template: `
    <main class="mx-auto max-w-7xl p-6 sm:p-8 mt-9">
      <!-- =========================================================
           Profile header
           ========================================================= -->
      <!-- Profile header -->
      <section
        class="rounded-2xl bg-[#2a835f]
         px-6 py-3 text-white
         shadow-sm sm:px-8"
      >
        <div
          class="flex flex-col gap-1
           sm:flex-row sm:items-center
           sm:justify-between"
        >
          <!-- Profile identity -->
          <div class="flex min-w-0 items-center gap-3">
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

            <!-- Name + email -->
            <div class="min-w-0 flex-1">
              <!-- Back to resources -->

              @if (authService.user(); as user) {
                <h1
                  class="mt-1 truncate text-2xl font-bold
               tracking-tight text-white
               sm:text-2xl"
                >
                  {{ user.firstName }} {{ user.lastName }}
                </h1>

                <p
                  class="mt-1 truncate
               text-sm text-blue-100"
                >
                  {{ user.email }}
                </p>
              }
            </div>

            <!-- Mobile Save icon -->
            <button
              type="button"
              (click)="saveProfile()"
              [disabled]="saving()"
              aria-label="Save profile"
              title="Save profile"
              class="inline-flex shrink-0
           items-center justify-center
           rounded-lg
           bg-transparent
           p-2
           text-[#7CC242]
           transition
           hover:bg-white/10
           hover:text-[#8ED957]
           focus:outline-none
           focus:ring-2
           focus:ring-[#7CC242]/50
           disabled:cursor-not-allowed
           disabled:opacity-50
           sm:hidden"
            >
              <mat-icon class="!m-0 !h-6 !w-6 !text-[24px]" aria-hidden="true"> save </mat-icon>
            </button>
          </div>

          <!-- =========================================================
Header actions
Desktop: Home + Save
Mobile: Save icon only
========================================================= -->
          <div
            class=" flex w-full items-center justify-end gap-2
         sm:w-auto"
          >
            <!-- Back to resources -->
            <a
              routerLink="/resources"
              class="hidden sm:inline-flex shrink-0
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
              ← Back to resources
            </a>

            <!-- Home - desktop only -->
            <a
              routerLink="/resources"
              class="hidden sm:inline-flex shrink-0
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
            <button
              type="button"
              (click)="saveProfile()"
              [disabled]="saving()"
              class="hidden sm:inline-flex shrink-0
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
              @if (saving()) {
                Saving...
              } @else {
                Save
              }
            </button>
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
           Profile workspace
           ========================================================= -->
      @if (!authService.isLoading() && authService.user(); as user) {
        <section class="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <!-- =======================================================
               Horizontal profile tabs
               ======================================================= -->
          <div class="border-b border-gray-200 bg-white px-4 sm:px-6">
            <nav class="-mb-px flex overflow-x-auto" aria-label="Profile sections">
              <button
                type="button"
                (click)="setActiveTab('personal')"
                [attr.aria-selected]="activeTab() === 'personal'"
                [class.border-[#007979]]="activeTab() === 'personal'"
                [class.text-[#032D42]]="activeTab() === 'personal'"
                [class.border-transparent]="activeTab() !== 'personal'"
                [class.text-gray-500]="activeTab() !== 'personal'"
                class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
              >
                Personal Info
              </button>

              @if (showLearningAndOrganizations()) {
                <button
                  type="button"
                  (click)="setActiveTab('learning')"
                  [attr.aria-selected]="activeTab() === 'learning'"
                  [class.border-[#007979]]="activeTab() === 'learning'"
                  [class.text-[#032D42]]="activeTab() === 'learning'"
                  [class.border-transparent]="activeTab() !== 'learning'"
                  [class.text-gray-500]="activeTab() !== 'learning'"
                  class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
                >
                  Learning Dashboard
                </button>
              }

              @if (
                !communityFollowStore.loadingFollowers() &&
                communityFollowStore.followersCount() > 0
              ) {
                <button
                  type="button"
                  role="tab"
                  (click)="setActiveTab('followers')"
                  [attr.aria-selected]="activeTab() === 'followers'"
                  [class.border-[#007979]]="activeTab() === 'followers'"
                  [class.text-[#032D42]]="activeTab() === 'followers'"
                  [class.border-transparent]="activeTab() !== 'followers'"
                  [class.text-gray-500]="activeTab() !== 'followers'"
                  class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
                >
                  Followers
                  <span class="ml-1 text-xs font-bold">
                    {{ communityFollowStore.followersCount() }}
                  </span>
                </button>
              }

              @if (
                !communityFollowStore.loadingFollowing() &&
                communityFollowStore.followingCount() > 0
              ) {
                <button
                  type="button"
                  role="tab"
                  (click)="setActiveTab('following')"
                  [attr.aria-selected]="activeTab() === 'following'"
                  [class.border-[#007979]]="activeTab() === 'following'"
                  [class.text-[#032D42]]="activeTab() === 'following'"
                  [class.border-transparent]="activeTab() !== 'following'"
                  [class.text-gray-500]="activeTab() !== 'following'"
                  class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
                >
                  Following
                  <span class="ml-1 text-xs font-bold">
                    {{ communityFollowStore.followingCount() }}
                  </span>
                </button>
              }

              @if (showLearningAndOrganizations()) {
                <button
                  type="button"
                  (click)="setActiveTab('organizations')"
                  [attr.aria-selected]="activeTab() === 'organizations'"
                  [class.border-[#007979]]="activeTab() === 'organizations'"
                  [class.text-[#032D42]]="activeTab() === 'organizations'"
                  [class.border-transparent]="activeTab() !== 'organizations'"
                  [class.text-gray-500]="activeTab() !== 'organizations'"
                  class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
                >
                  My Organizations
                  <span class="ml-1 text-xs font-bold">{{ organizations().length }}</span>
                </button>
              }

              <button
                type="button"
                (click)="setActiveTab('settings')"
                [attr.aria-selected]="activeTab() === 'settings'"
                [class.border-[#007979]]="activeTab() === 'settings'"
                [class.text-[#032D42]]="activeTab() === 'settings'"
                [class.border-transparent]="activeTab() !== 'settings'"
                [class.text-gray-500]="activeTab() !== 'settings'"
                class="whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition hover:text-[#032D42] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:px-5"
              >
                Settings
              </button>
            </nav>
          </div>

          <!-- =======================================================
               Personal Info
               ======================================================= -->
          @if (activeTab() === 'personal') {
            <div class="p-0">
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
                    Keep your Zebron profile information up to date. Optional fields can be left
                    blank.
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
                    <mat-form-field appearance="outline" class="tax-field w-full">
                      <mat-label>Display name</mat-label>
                      <input
                        matInput
                        id="displayName"
                        name="displayName"
                        type="text"
                        [(ngModel)]="displayName"
                        required
                        autocomplete="name"
                        placeholder="Your name"
                        class="block w-full"
                      />
                    </mat-form-field>

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
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>First name</mat-label>
                        <input
                          matInput
                          id="firstName"
                          name="firstName"
                          type="text"
                          [(ngModel)]="firstName"
                          autocomplete="given-name"
                          placeholder="First name"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>

                    <div>
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Last name</mat-label>
                        <input
                          matInput
                          id="lastName"
                          name="lastName"
                          type="text"
                          [(ngModel)]="lastName"
                          autocomplete="family-name"
                          placeholder="Last name"
                          class="block w-full"
                        />
                      </mat-form-field>
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
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Preferred name (optional)</mat-label>
                        <input
                          matInput
                          id="preferredName"
                          name="preferredName"
                          type="text"
                          [(ngModel)]="preferredName"
                          placeholder="What should we call you?"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>

                    <div>
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Phone number (optional)</mat-label>
                        <input
                          matInput
                          id="phone"
                          name="phone"
                          type="tel"
                          [(ngModel)]="phone"
                          autocomplete="tel"
                          placeholder="(555) 555-5555"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>
                  </div>

                  <!-- =================================================
                   Email
                   ================================================= -->
                  <div>
                    <mat-form-field appearance="outline" class="tax-field w-full">
                      <mat-label>Email address</mat-label>
                      <input
                        matInput
                        id="email"
                        name="email"
                        type="email"
                        [value]="user.email"
                        disabled
                        class="block w-full"
                      />
                    </mat-form-field>

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
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Country of origin</mat-label>
                        <input
                          matInput
                          id="countryOfOrigin"
                          name="countryOfOrigin"
                          type="text"
                          [(ngModel)]="countryOfOrigin"
                          placeholder="Country of origin"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>

                    <div>
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Current country</mat-label>
                        <input
                          matInput
                          id="currentCountry"
                          name="currentCountry"
                          type="text"
                          [(ngModel)]="currentCountry"
                          placeholder="Current country"
                          class="block w-full"
                        />
                      </mat-form-field>
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
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>City</mat-label>
                        <input
                          matInput
                          id="city"
                          name="city"
                          type="text"
                          [(ngModel)]="city"
                          autocomplete="address-level2"
                          placeholder="City"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>

                    <div>
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>State / Province</mat-label>
                        <input
                          matInput
                          id="state"
                          name="state"
                          type="text"
                          [(ngModel)]="state"
                          autocomplete="address-level1"
                          placeholder="State or province"
                          class="block w-full"
                        />
                      </mat-form-field>
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
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>ZIP / Postal code</mat-label>
                        <input
                          matInput
                          id="postalCode"
                          name="postalCode"
                          type="text"
                          [(ngModel)]="postalCode"
                          autocomplete="postal-code"
                          placeholder="ZIP or postal code"
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>

                    <div>
                      <mat-form-field appearance="outline" class="tax-field w-full">
                        <mat-label>Preferred language</mat-label>
                        <input
                          matInput
                          id="preferredLanguage"
                          name="preferredLanguage"
                          type="text"
                          [(ngModel)]="preferredLanguage"
                          placeholder="English, French, etc."
                          class="block w-full"
                        />
                      </mat-form-field>
                    </div>
                  </div>

                  <!-- =================================================
                   About me
                   ================================================= -->
                  <div
                    class="border-t border-gray-200
                       pt-7"
                  >
                    <mat-form-field appearance="outline" class="tax-field w-full">
                      <mat-label>About me (optional)</mat-label>
                      <textarea
                        matInput
                        id="bio"
                        name="bio"
                        rows="4"
                        [(ngModel)]="bio"
                        maxlength="500"
                        placeholder="Tell us a little about yourself..."
                        class="block w-full"
                      ></textarea>
                    </mat-form-field>

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
                    <mat-form-field appearance="outline" class="tax-field w-full">
                      <mat-label>Website / LinkedIn (optional)</mat-label>
                      <input
                        matInput
                        id="website"
                        name="website"
                        type="url"
                        [(ngModel)]="website"
                        autocomplete="url"
                        placeholder="https://example.com"
                        class="block w-full"
                      />
                    </mat-form-field>
                  </div>

                  <!-- =================================================
 Account role
 ================================================= -->
                  <div
                    class="border-t border-gray-200
     pt-7"
                  >
                    <mat-form-field appearance="outline" class="tax-field w-full">
                      <mat-label>Platform role</mat-label>
                      <input
                        matInput
                        id="platformRole"
                        name="platformRole"
                        type="text"
                        [value]="user.platformRole || 'Standard User'"
                        disabled
                        class="block w-full"
                      />
                    </mat-form-field>

                    <p
                      class="mt-1.5 text-xs
       text-gray-500"
                    >
                      Platform roles are managed by Zebron administrators.
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
                      type="button"
                      (click)="saveProfile()"
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
            </div>
          }

          <!-- =======================================================
               Learning Dashboard
               ======================================================= -->
          @if (activeTab() === 'learning' && showLearningAndOrganizations()) {
            <div class="p-6 sm:p-8">
              <div class="max-w-3xl">
                <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">
                  Learning dashboard
                </p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">
                  Your learning journey
                </h2>
                <p class="mt-2 text-sm leading-6 text-gray-500">
                  Track your progress, assessments, and learning activity from one place.
                </p>
              </div>

              <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p class="text-sm font-medium text-gray-500">Courses started</p>
                  <p class="mt-2 text-3xl font-bold text-[#032D42]">0</p>
                  <p class="mt-1 text-xs text-gray-500">Your active learning</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p class="text-sm font-medium text-gray-500">Completed</p>
                  <p class="mt-2 text-3xl font-bold text-[#032D42]">0</p>
                  <p class="mt-1 text-xs text-gray-500">Courses completed</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p class="text-sm font-medium text-gray-500">Tests taken</p>
                  <p class="mt-2 text-3xl font-bold text-[#032D42]">0</p>
                  <p class="mt-1 text-xs text-gray-500">Test Center activity</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p class="text-sm font-medium text-gray-500">Learning streak</p>
                  <p class="mt-2 text-3xl font-bold text-[#032D42]">0</p>
                  <p class="mt-1 text-xs text-gray-500">Days in a row</p>
                </div>
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-2">
                <section class="rounded-2xl border border-gray-200 bg-white p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h3 class="text-base font-semibold text-[#032D42]">Continue learning</h3>
                      <p class="mt-1 text-sm text-gray-500">
                        Your recently started courses will appear here.
                      </p>
                    </div>
                    <span
                      class="rounded-full bg-[#007979]/10 px-3 py-1 text-xs font-semibold text-[#007979]"
                    >
                      Coming soon
                    </span>
                  </div>
                  <div
                    class="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500"
                  >
                    No learning activity yet. Start a course or practice assessment to build your
                    dashboard.
                  </div>
                </section>

                <section class="rounded-2xl border border-gray-200 bg-white p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h3 class="text-base font-semibold text-[#032D42]">Recommended next steps</h3>
                      <p class="mt-1 text-sm text-gray-500">
                        Personalized learning recommendations will appear here.
                      </p>
                    </div>
                    <span
                      class="rounded-full bg-[#007979]/10 px-3 py-1 text-xs font-semibold text-[#007979]"
                    >
                      Coming soon
                    </span>
                  </div>
                  <div class="mt-5 space-y-3">
                    <a
                      routerLink="/test-center"
                      class="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-[#007979]/40 hover:bg-gray-50"
                    >
                      <div>
                        <p class="text-sm font-semibold text-[#032D42]">Explore Test Center</p>
                        <p class="mt-1 text-xs text-gray-500">
                          Practice and assess your knowledge.
                        </p>
                      </div>
                      <span class="text-[#007979]" aria-hidden="true">→</span>
                    </a>
                    <a
                      routerLink="/resources"
                      class="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-[#007979]/40 hover:bg-gray-50"
                    >
                      <div>
                        <p class="text-sm font-semibold text-[#032D42]">Explore Resources</p>
                        <p class="mt-1 text-xs text-gray-500">
                          Find resources to support your goals.
                        </p>
                      </div>
                      <span class="text-[#007979]" aria-hidden="true">→</span>
                    </a>
                  </div>
                </section>
              </div>
            </div>
          }

          <!-- =======================================================
               Followers
               ======================================================= -->

          @if (activeTab() === 'followers') {
            <div class="p-6 sm:p-8">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">
                    Community
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">
                    Followers
                  </h2>
                  <p class="mt-2 text-sm leading-6 text-gray-500">
                    People who follow your community activity.
                  </p>
                </div>
                <span
                  class="inline-flex w-fit rounded-full bg-[#007979]/10 px-3 py-1 text-xs font-semibold text-[#007979]"
                >
                  {{ communityFollowStore.followersCount() }} followers
                </span>
              </div>

              @if (communityFollowStore.loadingFollowers()) {
                <div
                  class="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#007979]"
                  ></div>
                  <p class="text-sm text-gray-500">Loading followers...</p>
                </div>
              } @else if (communityFollowStore.followerUsers().length === 0) {
                <div
                  class="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center"
                >
                  <div class="text-3xl" aria-hidden="true">👥</div>
                  <h3 class="mt-3 text-base font-semibold text-[#032D42]">No followers yet</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    When people follow you, they will appear here.
                  </p>
                </div>
              } @else {
                <div class="mt-6 grid gap-3 sm:grid-cols-2">
                  @for (user of communityFollowStore.followerUsers(); track user.id) {
                    <a
                      [routerLink]="['/community/users', user.id]"
                      class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[#007979]/40 hover:bg-gray-50"
                    >
                      @if (user.photoUrl) {
                        <img
                          [src]="user.photoUrl"
                          [alt]="communityUserName(user)"
                          class="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                        />
                      } @else {
                        <div
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#032D42] text-sm font-bold text-white"
                        >
                          {{ initials(communityUserName(user)) }}
                        </div>
                      }
                      <div class="min-w-0 flex-1">
                        <p
                          class="truncate text-sm font-semibold text-[#032D42] group-hover:text-[#007979]"
                        >
                          {{ communityUserName(user) }}
                        </p>
                        @if (communityUserLocation(user); as location) {
                          <p class="mt-1 truncate text-xs text-gray-500">{{ location }}</p>
                        } @else if (user.bio) {
                          <p class="mt-1 line-clamp-1 text-xs text-gray-500">{{ user.bio }}</p>
                        }
                      </div>
                      <span
                        class="text-lg text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#007979]"
                        aria-hidden="true"
                        >→</span
                      >
                    </a>
                  }
                </div>
              }
            </div>
          }

          <!-- =======================================================
               Following
               ======================================================= -->
          @if (activeTab() === 'following') {
            <div class="p-6 sm:p-8">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">
                    Community
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">
                    Following
                  </h2>
                  <p class="mt-2 text-sm leading-6 text-gray-500">People you follow on Zebron.</p>
                </div>
                <span
                  class="inline-flex w-fit rounded-full bg-[#007979]/10 px-3 py-1 text-xs font-semibold text-[#007979]"
                >
                  {{ communityFollowStore.followingCount() }} following
                </span>
              </div>

              @if (communityFollowStore.loadingFollowing()) {
                <div
                  class="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#007979]"
                  ></div>
                  <p class="text-sm text-gray-500">Loading following...</p>
                </div>
              } @else if (communityFollowStore.followingUsers().length === 0) {
                <div
                  class="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center"
                >
                  <div class="text-3xl" aria-hidden="true">🔎</div>
                  <h3 class="mt-3 text-base font-semibold text-[#032D42]">
                    You are not following anyone yet
                  </h3>
                  <p class="mt-1 text-sm text-gray-500">
                    Discover community members and follow people whose activity interests you.
                  </p>
                  <a
                    routerLink="/community"
                    class="mt-4 inline-flex rounded-lg bg-[#032D42] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#032D42]/90"
                    >Explore Community</a
                  >
                </div>
              } @else {
                <div class="mt-6 grid gap-3 sm:grid-cols-2">
                  @for (user of communityFollowStore.followingUsers(); track user.id) {
                    <a
                      [routerLink]="['/community/users', user.id]"
                      class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[#007979]/40 hover:bg-gray-50"
                    >
                      @if (user.photoUrl) {
                        <img
                          [src]="user.photoUrl"
                          [alt]="communityUserName(user)"
                          class="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                        />
                      } @else {
                        <div
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#032D42] text-sm font-bold text-white"
                        >
                          {{ initials(communityUserName(user)) }}
                        </div>
                      }
                      <div class="min-w-0 flex-1">
                        <p
                          class="truncate text-sm font-semibold text-[#032D42] group-hover:text-[#007979]"
                        >
                          {{ communityUserName(user) }}
                        </p>
                        @if (communityUserLocation(user); as location) {
                          <p class="mt-1 truncate text-xs text-gray-500">{{ location }}</p>
                        } @else if (user.bio) {
                          <p class="mt-1 line-clamp-1 text-xs text-gray-500">{{ user.bio }}</p>
                        }
                      </div>
                      <span
                        class="text-lg text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#007979]"
                        aria-hidden="true"
                        >→</span
                      >
                    </a>
                  }
                </div>
              }
            </div>
          }

          <!-- =======================================================
                My Organizations
                ======================================================= -->
          @if (activeTab() === 'organizations' && showLearningAndOrganizations()) {
            <div class="p-6 sm:p-8">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">
                    Organizations
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">
                    My Organizations
                  </h2>
                  <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    View the organizations you belong to, your role in each organization, and
                    membership status.
                  </p>
                </div>
                <span
                  class="inline-flex w-fit rounded-full bg-[#007979]/10 px-3 py-1 text-xs font-semibold text-[#007979]"
                >
                  {{ organizations().length }}
                  {{ organizations().length === 1 ? 'organization' : 'organizations' }}
                </span>
              </div>

              @if (loadingOrganizations()) {
                <div
                  class="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#007979]"
                  ></div>
                  <p class="text-sm text-gray-500">Loading your organizations...</p>
                </div>
              } @else if (organizationError()) {
                <div
                  class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                  role="alert"
                >
                  {{ organizationError() }}
                  <button
                    type="button"
                    (click)="loadOrganizationData()"
                    class="ml-2 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              } @else if (organizations().length === 0) {
                <div
                  class="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center"
                >
                  <div class="text-3xl" aria-hidden="true">🏢</div>
                  <h3 class="mt-3 text-base font-semibold text-[#032D42]">
                    No organizations found
                  </h3>
                  <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
                    When you join an organization, its name, your assigned role, and your membership
                    status will appear here.
                  </p>
                </div>
              } @else {
                <div class="mt-6 grid gap-4 lg:grid-cols-2">
                  @for (entry of organizations(); track entry.membership.id) {
                    <article
                      class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#007979]/40"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <h3 class="break-words text-base font-semibold text-[#032D42]">
                            {{
                              organizationName(entry.organization, entry.membership.organizationId)
                            }}
                          </h3>
                          <p class="mt-1 break-all text-xs text-gray-500">
                            ID: {{ entry.membership.organizationId }}
                          </p>
                        </div>
                        <span
                          class="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                          [ngClass]="
                            entry.membership.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          "
                        >
                          {{
                            entry.membership.active ? 'Active membership' : 'Inactive membership'
                          }}
                        </span>
                      </div>

                      <dl class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="rounded-xl bg-gray-50 p-3">
                          <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Your role
                          </dt>
                          <dd class="mt-1 text-sm font-semibold text-gray-800">
                            {{ organizationRoleLabel(entry.membership.role) }}
                          </dd>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3">
                          <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Organization status
                          </dt>
                          <dd class="mt-1 text-sm font-semibold text-gray-800">
                            {{ organizationStatus(entry.organization) }}
                          </dd>
                        </div>
                      </dl>

                      @if (entry.membership.active && entry.organization) {
                        <div class="mt-5">
                          <a
                            [routerLink]="[
                              '/partner/org',
                              entry.membership.organizationId,
                              'dashboard',
                            ]"
                            class="inline-flex items-center gap-2 rounded-lg bg-[#032D42] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#06445f]"
                          >
                            Open organization workspace <span aria-hidden="true">→</span>
                          </a>
                        </div>
                      }
                    </article>
                  }
                </div>
              }
            </div>
          }

          <!-- =======================================================
               Settings
               ======================================================= -->
          @if (activeTab() === 'settings') {
            <div class="p-6 sm:p-8">
              <div class="max-w-3xl">
                <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">Settings</p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">
                  Account settings
                </h2>
                <p class="mt-2 text-sm leading-6 text-gray-500">
                  Manage your account security, session, and other profile preferences.
                </p>
              </div>

              <div class="mt-8 max-w-3xl">
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
            </div>
          }
        </section>
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

  protected readonly communityFollowStore = inject(CommunityFollowStore);

  private readonly membershipRepository = inject(OrganizationMembershipRepository);
  private readonly organizationRepository: OrganizationRepository = inject(ORGANIZATION_REPOSITORY);

  private readonly router = inject(Router);

  protected readonly toast = inject(HotToastService);

  readonly pageTitleService = inject(PageTitleService);

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

  protected readonly loadingOrganizations = signal(false);
  protected readonly organizationError = signal<string | null>(null);
  protected readonly organizations = signal<
    Array<{ membership: OrganizationMembership; organization: Organization | null }>
  >([]);
  protected readonly hasCourseEnrollment = signal(false);
  protected readonly hasOrganizationMembership = signal(false);
  protected readonly showLearningAndOrganizations = () =>
    this.hasCourseEnrollment() || this.hasOrganizationMembership();

  // Controls the additional navigation menu.
  protected readonly showMoreMenu = signal(false);

  // Controls the active profile tab. Personal Info is the default view.
  protected readonly activeTab = signal<
    'personal' | 'learning' | 'followers' | 'following' | 'organizations' | 'settings'
  >('personal');

  constructor() {
    this.pageTitleService.setTitle('My Profile');
  }

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

    void this.loadFollowData(user.id);
    void this.loadOrganizationData();
  }

  // =============================================================
  // Load community follow data
  // =============================================================

  private async loadFollowData(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    await Promise.all([
      this.communityFollowStore.loadFollowers(userId),
      this.communityFollowStore.loadFollowing(userId),
    ]);
  }

  // =============================================================
  // Organization memberships and course-enrollment visibility
  // =============================================================

  protected async loadOrganizationData(): Promise<void> {
    const user = this.authService.user();
    if (!user?.id) {
      this.organizations.set([]);
      this.hasOrganizationMembership.set(false);
      this.hasCourseEnrollment.set(false);
      return;
    }

    this.loadingOrganizations.set(true);
    this.organizationError.set(null);

    try {
      const [memberships, enrolled] = await Promise.all([
        this.membershipRepository.getMembershipsForUser(user.id),
        this.checkCourseEnrollment(user.id),
      ]);

      const activeMemberships = memberships.filter((membership) => membership.active);
      const entries = await Promise.all(
        activeMemberships.map(async (membership) => {
          try {
            const organization = await this.organizationRepository.getOrganization(
              membership.organizationId,
            );
            return { membership, organization };
          } catch {
            return { membership, organization: null };
          }
        }),
      );

      entries.sort((a, b) =>
        this.organizationName(a.organization, a.membership.organizationId).localeCompare(
          this.organizationName(b.organization, b.membership.organizationId),
        ),
      );

      this.organizations.set(entries);
      this.hasOrganizationMembership.set(activeMemberships.length > 0);
      this.hasCourseEnrollment.set(enrolled);

      if (
        !this.showLearningAndOrganizations() &&
        (this.activeTab() === 'learning' || this.activeTab() === 'organizations')
      ) {
        this.activeTab.set('personal');
      }
    } catch (error: unknown) {
      this.organizations.set([]);
      this.hasOrganizationMembership.set(false);
      this.organizationError.set(
        error instanceof Error ? error.message : 'Unable to load your organization memberships.',
      );
    } finally {
      this.loadingOrganizations.set(false);
    }
  }

  /**
   * Looks up enrollment records scoped to the signed-in user.
   * Expected collection: `courseEnrollments`, with a `userId` field.
   */
  private async checkCourseEnrollment(userId: string): Promise<boolean> {
    try {
      const enrollmentQuery = query(
        collection(firestore, 'courseEnrollments'),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(enrollmentQuery);
      return snapshot.docs.some((enrollment) => {
        const data = enrollment.data() as Record<string, unknown>;
        return (
          data['status'] !== 'cancelled' &&
          data['status'] !== 'withdrawn' &&
          data['active'] !== false
        );
      });
    } catch (error) {
      console.warn('Unable to check course enrollment for profile tabs.', error);
      return false;
    }
  }

  protected organizationName(organization: Organization | null, fallbackId: string): string {
    if (!organization) {
      return 'Organization details unavailable';
    }

    const value = organization as Organization & {
      name?: unknown;
      organizationName?: unknown;
    };

    if (typeof value.name === 'string' && value.name.trim()) {
      return value.name.trim();
    }
    if (typeof value.organizationName === 'string' && value.organizationName.trim()) {
      return value.organizationName.trim();
    }
    return fallbackId;
  }

  protected organizationRoleLabel(role: string | undefined): string {
    const labels: Record<string, string> = {
      org_owner: 'Organization Owner',
      org_admin: 'Organization Admin',
      org_manager: 'Organization Manager',
      org_staff: 'Organization Staff',
      org_member: 'Organization Member',
      owner: 'Organization Owner',
      admin: 'Organization Admin',
      manager: 'Organization Manager',
      staff: 'Organization Staff',
      member: 'Organization Member',
    };
    return role ? (labels[role] ?? role) : 'Not assigned';
  }

  protected organizationStatus(organization: Organization | null): string {
    if (!organization) {
      return 'Unavailable';
    }
    const status = (organization as Organization & { status?: string }).status;
    if (!status) {
      return 'Unknown';
    }
    return status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // =============================================================
  // Community user helpers
  // =============================================================

  protected communityUserName(user: CommunityUser): string {
    return user.preferredName?.trim() || user.displayName || 'Zebron User';
  }

  protected communityUserLocation(user: CommunityUser): string {
    return [user.city, user.state, user.currentCountry]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(', ');
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
   * Switch between the four profile workspace tabs.
   */
  protected setActiveTab(
    tab: 'personal' | 'learning' | 'followers' | 'following' | 'organizations' | 'settings',
  ): void {
    this.activeTab.set(tab);
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
