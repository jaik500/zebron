import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { QueryDocumentSnapshot } from 'firebase/firestore';

import { Resource, ResourceType } from '../../../../core/models/resource.model';

import { Category } from '../../../../core/models/category.model';

import { ResourceService } from '../../../../core/services/resource.service';
import { Location } from '../../../../core/models/location.model';
import { LocationService } from '../../../../core/services/location.service';
import { PersonalizationService } from '../../../../core/services/personalization.service';

import { CategoryService } from '../../../../core/services/category.service';

import { AuthService } from '../../../../core/services/auth.service';

import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';

import { UsefulLinksComponent } from '../../components/useful-links/useful-links.component';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-resource-list',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    ResourceCardComponent,
    UsefulLinksComponent,
  ],

  template: `
    <!-- =========================================================
         Page Header
         ========================================================= -->
    <header class="sticky top-0 z-50 border-b border-gray-200 bg-[#032D42]">
      <div
        class="relative mx-auto flex max-w-7xl
               items-start justify-between gap-2
               p-4
               sm:items-center sm:gap-4
               sm:px-6 sm:py-6
               lg:px-8 lg:py-8"
      >
        <!-- =====================================================
             Header Content
             ===================================================== -->
        <div class="min-w-0 flex-1 pr-2 sm:pr-0">
          <p
            class="text-md
                   font-semibold uppercase
                   tracking-wider
                   text-[#7ED6D1]
                   sm:text-xs"
          >
            Resource Directory
          </p>

          <h1
            class="mt-0.5 text-3xl
                   font-bold leading-7
                   tracking-tight text-white
                   sm:mt-1 sm:text-3xl
                   sm:leading-9
                   lg:text-4xl
                   lg:leading-10"
          >
            Find the help you need
          </h1>

          <p
            class="mt-1 max-w-3xl
                   text-md leading-5
                   text-blue-100
                   sm:mt-2 sm:text-base
                   sm:leading-6
                   lg:text-lg
                   lg:leading-7"
          >
            Browse trusted resources, services, organizations, and tools available to help you and
            your community.
          </p>
        </div>

        <!-- =====================================================
             Authentication
             ===================================================== -->
        <div class="ml-auto shrink-0">
          <!-- =================================================
               Desktop: Authentication / Signed-in User
               ================================================= -->
          <div
            class="hidden items-center
                   gap-2 sm:flex"
          >
            @if (authService.user()) {
              <!-- Signed-in user -->
              <span
                class="max-w-[180px] truncate
                       text-sm font-semibold
                       text-white"
              >
                Hey, {{ authService.user()?.displayName || 'there' }}
              </span>
            } @else {
              <!-- Login -->
              <a
                routerLink="/login"
                class="inline-flex h-9
                       items-center justify-center
                       gap-1.5
                       rounded-md
                       border border-white/40
                       px-3
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-white/10
                       focus:outline-none
                       focus:ring-2
                       focus:ring-white/40"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-4 !w-4
                         !text-[16px]
                         !leading-4"
                >
                  login
                </mat-icon>

                <span> Login </span>
              </a>

              <!-- Register -->
              <a
                routerLink="/register"
                class="inline-flex h-9
                       items-center justify-center
                       gap-1.5
                       rounded-md
                       bg-white
                       px-3
                       text-sm font-semibold
                       text-[#007979]
                       shadow-sm
                       transition
                       hover:bg-gray-100
                       focus:outline-none
                       focus:ring-2
                       focus:ring-white/40"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-4 !w-4
                         !text-[16px]
                         !leading-4"
                >
                  person_add
                </mat-icon>

                <span> Register </span>
              </a>
            }

            <!-- Desktop account menu -->
            @if (authService.user()) {
              <button
                mat-icon-button
                [matMenuTriggerFor]="accountMenu"
                aria-label="Account options"
                title="Account options"
                class="!flex !h-9 !w-9
                       !items-center
                       !justify-center
                       !rounded-md
                       !border !border-white/30
                       !bg-white/10
                       !text-white
                       hover:!bg-white/20
                       focus:!outline-none"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-6 !w-6
                         !text-[24px]
                         !leading-6"
                >
                  more_vert
                </mat-icon>
              </button>
            }
          </div>

          <!-- =================================================
               Mobile: Greeting + Three-dot Account Menu
               ================================================= -->
          <div class="flex items-center gap-1.5 sm:hidden">
            <!-- @if (authService.user()) {
              <span
                class="max-w-[140px] truncate
                       text-sm font-semibold
                       text-white"
              >
                Hey, {{ authService.user()?.displayName || 'there' }}
              </span>
            } -->

            @if (!authService.user()) {
              <button
                mat-icon-button
                [matMenuTriggerFor]="accountMenu"
                aria-label="Account options"
                title="Account options"
                class="!flex !h-9 !w-9
                       !items-center
                       !justify-center
                       !rounded-md
                       !border !border-white/30
                       !bg-white/10
                       !text-white
                       hover:!bg-white/20
                       focus:!outline-none"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-6 !w-6
                         !text-[24px]
                         !leading-6"
                >
                  more_vert
                </mat-icon>
              </button>
            } @else {
              <button
                mat-icon-button
                [matMenuTriggerFor]="accountMenu"
                aria-label="Account options"
                title="Account options"
                class="!flex !h-9 !w-9
                       !items-center
                       !justify-center
                       !rounded-md
                       !border !border-white/30
                       !bg-white/10
                       !text-white
                       hover:!bg-white/20
                       focus:!outline-none"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-6 !w-6
                         !text-[24px]
                         !leading-6"
                >
                  more_vert
                </mat-icon>
              </button>
            }

            <mat-menu #accountMenu="matMenu" xPosition="before" yPosition="below">
              @if (authService.user()) {
                <a mat-menu-item routerLink="/profile">
                  <mat-icon aria-hidden="true"> person </mat-icon>

                  <span> Profile </span>
                </a>

                @if (authService.isAdmin) {
                  <a mat-menu-item routerLink="/admin">
                    <mat-icon aria-hidden="true"> admin_panel_settings </mat-icon>

                    <span> Admin Dashboard </span>
                  </a>
                }
              } @else {
                <a mat-menu-item routerLink="/login">
                  <mat-icon aria-hidden="true"> login </mat-icon>

                  <span> Login </span>
                </a>

                <a mat-menu-item routerLink="/register">
                  <mat-icon aria-hidden="true"> person_add </mat-icon>

                  <span> Register </span>
                </a>
              }

              <button mat-menu-item type="button" (click)="signOut()" [disabled]="signingOut()">
                <mat-icon aria-hidden="true"> logout </mat-icon>

                <span>
                  @if (signingOut()) {
                    Signing out...
                  } @else {
                    Sign out
                  }
                </span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>
    </header>

    <!-- =========================================================
         Main Content
         ========================================================= -->
    <main
      class="px-2 py-3
             sm:px-6 sm:py-6
             lg:px-8"
    >
      <div
        class="mx-auto grid max-w-7xl
               gap-4
               lg:grid-cols-[minmax(0,1fr)_280px]
               lg:gap-6"
      >
        <!-- =====================================================
             Main Resource Directory
             ===================================================== -->
        <section class="min-w-0">
          <!-- ===================================================
               Browse by Category
               =================================================== -->
          <section>
            <!-- Heading + Mobile Filter Builder -->
            <div
              class="flex items-center
                     justify-between"
            >
              <h1
                class="text-xl
                       font-semibold
                       leading-6
                       text-gray-900
                       sm:text-lg"
              >
                Browse by category
              </h1>

              <!-- =================================================
                   Mobile Filter Builder Toggle
                   ================================================= -->
              <button
                type="button"
                (click)="toggleSearch()"
                [attr.aria-expanded]="showSearch()"
                aria-label="Toggle filter builder"
                [title]="showSearch() ? 'Hide filter builder' : 'Show filter builder'"
                class="flex min-h-8
                       shrink-0
                       items-center
                       justify-center
                       rounded-md
                       text-[#007979]
                       transition
                       hover:bg-[#E6F4F3]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/30
                       sm:hidden"
              >
                @if (showSearch()) {
                  <!-- Show Filter Builder -->
                  <span
                    class="rounded-md
                           bg-[#007979]
                           px-2.5 py-1
                           text-[14px]
                           font-medium
                           text-white
                           transition
                           hover:bg-[#006666]"
                  >
                    Show Filters
                  </span>
                } @else {
                  <!-- Filter Builder Icon -->
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-5 !w-10
                           !text-[30px]
                           !leading-5"
                  >
                    search
                  </mat-icon>
                }
              </button>
            </div>

            <!-- =================================================
                 Category Buttons
                 ================================================= -->
            <div
              class="mt-2 flex flex-wrap
                     gap-1.5 sm:gap-2"
            >
              <!-- All -->
              <button
                type="button"
                (click)="selectCategory('')"
                [class.bg-[#007979]]="!selectedCategory()"
                [class.text-white]="!selectedCategory()"
                [class.bg-gray-100]="selectedCategory()"
                [class.text-gray-700]="selectedCategory()"
                class="rounded-full
                       px-2.5 py-1
                       text-[14px]
                       font-medium
                       leading-4
                       hover:bg-blue-100
                       sm:px-3
                       sm:py-1.5
                       sm:text-xs"
              >
                All
              </button>

              @for (category of categories(); track category.id) {
                <button
                  type="button"
                  (click)="selectCategory(category.slug)"
                  [class.bg-[#007979]]="selectedCategory() === category.slug"
                  [class.text-white]="selectedCategory() === category.slug"
                  [class.bg-gray-100]="selectedCategory() !== category.slug"
                  [class.text-gray-700]="selectedCategory() !== category.slug"
                  class="rounded-full
                         px-2.5 py-1
                         text-[14px]
                         font-medium
                         leading-4
                         hover:bg-blue-100
                         sm:px-3
                         sm:py-1.5
                         sm:text-xs"
                >
                  {{ category.name }}
                </button>
              }
            </div>
          </section>

          <!-- ===================================================
               Personalization
               =================================================== -->

          <section
            class="mt-4
                   rounded-xl
                   border
                   border-[#007979]/15
                   bg-white
                   p-4
                   shadow-sm
                   sm:p-5"
          >
            <div
  class="flex items-start
         justify-between
         gap-3
         sm:flex-row
         sm:items-start
         sm:justify-between"
>
              <!-- Personalization heading -->

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0
                           !h-5 !w-5
                           !text-[20px]
                           text-[#007979]"
                  >
                    auto_awesome
                  </mat-icon>

                  <h2
                    class="text-base
                           font-bold
                           text-[#032D42]
                           sm:text-lg"
                  >
                    Find resources for you
                  </h2>
                </div>

                <p
                  class="mt-1
                         text-sm
                         leading-5
                         text-gray-500"
                >
                  Tell us what you need and where you are to see resources that may be more relevant
                  to you.
                </p>
              </div>

              <!-- Clear personalization -->
              <!-- Personalization actions -->
              <div
                class="flex shrink-0
         items-center gap-3"
              >
                <!-- Show / Hide -->
                <button
                  type="button"
                  (click)="togglePersonalization()"
                  [attr.aria-expanded]="showPersonalization()"
                  [attr.aria-label]="
                    showPersonalization()
                      ? 'Hide personalization options'
                      : 'Show personalization options'
                  "
                   class="inline-flex
         shrink-0
         items-center
         gap-1
         border-0
         bg-transparent
         p-0
         text-xs
         font-semibold
         text-[#007979]
         transition
         hover:text-[#032D42]
         focus:outline-none"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0
             !h-4 !w-4
             !text-[18px]"
                  >
                    {{ showPersonalization() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                  </mat-icon>

                  <span>
                    {{ showPersonalization() ? 'Hide' : 'Show' }}
                  </span>
                </button>

                <!-- Clear personalization -->
                @if (hasPersonalization()) {
                  <button
                    type="button"
                    (click)="clearPersonalization()"
                    class="text-xs
             font-semibold
             text-[#007979]
             hover:text-[#032D42]"
                  >
                    Clear
                  </button>
                }
              </div>
            </div>

            @if (showPersonalization()) {
              <!-- =================================================
                 Interests
                 ================================================= -->
              <div class="mt-4">
                <p
                  class="mb-2
                       text-sm
                       font-semibold
                       text-[#032D42]"
                >
                  What are you interested in?
                </p>

                <div class="flex flex-wrap gap-2">
                  @for (category of categories(); track category.id) {
                    <button
                      type="button"
                      (click)="togglePersonalizationInterest(category.slug)"
                      [attr.aria-pressed]="isPersonalizationInterestSelected(category.slug)"
                      class="inline-flex
                           items-center
                           gap-1.5
                           rounded-full
                           border
                           px-3 py-1.5
                           text-xs
                           font-semibold
                           transition
                           focus:outline-none
                           focus:ring-2
                           focus:ring-[#007979]/30"
                      [class.border-[#007979]]="isPersonalizationInterestSelected(category.slug)"
                      [class.bg-[#E6F4F3]]="isPersonalizationInterestSelected(category.slug)"
                      [class.text-[#007979]]="isPersonalizationInterestSelected(category.slug)"
                      [class.border-gray-200]="!isPersonalizationInterestSelected(category.slug)"
                      [class.bg-white]="!isPersonalizationInterestSelected(category.slug)"
                      [class.text-gray-600]="!isPersonalizationInterestSelected(category.slug)"
                    >
                      <mat-icon
                        aria-hidden="true"
                        class="!m-0
                             !h-4 !w-4
                             !text-[16px]"
                      >
                        {{ category.icon }}
                      </mat-icon>

                      <span>
                        {{ category.name }}
                      </span>
                    </button>
                  }
                </div>
              </div>

             <!-- =================================================
     Location
     ================================================= -->
<div class="mt-4">

  <label
    for="personalization-location"
    class="mb-1.5
           block
           text-sm
           font-semibold
           text-[#032D42]"
  >
    Where are you located?
  </label>

  <div
    class="flex
           items-end
           gap-3"
  >

    <!-- Location dropdown -->
    <div class="min-w-0 flex-1 max-w-md">
      <select
        id="personalization-location"
        [value]="
          personalizationService.preferences().locationId ?? ''
        "
        (change)="
          selectPersonalizationLocation(
            $any($event.target).value || null
          )
        "
        class="block
               h-10
               w-full
               rounded-lg
               border
               border-gray-200
               bg-white
               px-3
               text-sm
               text-gray-700
               shadow-sm
               focus:border-[#007979]
               focus:outline-none
               focus:ring-2
               focus:ring-[#007979]/20"
      >
        <option value="">
          Select your location
        </option>

        @for (
          location of locations();
          track location.id
        ) {
          <option
            [value]="location.id"
          >
            {{ formatPersonalizationLocation(location) }}
          </option>
        }
      </select>
    </div>

    <!-- Clear personalization -->
    @if (hasPersonalization()) {
      <button
        type="button"
        (click)="clearPersonalization()"
        class="mb-0.5
               shrink-0
               text-xs
               font-semibold
               text-[#007979]
               transition
               hover:text-[#032D42]
               focus:outline-none
               focus:ring-2
               focus:ring-[#007979]/30"
      >
        Clear
      </button>
    }

  </div>

</div>
            }
          </section>

          <!-- ===================================================
               Search and Filters
               =================================================== -->
          <section
            class="mt-3
                   rounded-lg
                   border
                   border-[#007979]/15
                   bg-[#E6F4F3]
                   p-2
                   shadow-sm
                   sm:p-2.5"
          >
            <!-- =================================================
                 Primary Filters

                 MOBILE:

                 showSearch() === false
                   Category + Type

                 showSearch() === true
                   Search only

                 DESKTOP:

                   Search + Category + Type
                   all visible on one row.
                 ================================================= -->
            <div
              class="grid
                     grid-cols-2
                     gap-1.5
                     sm:grid-cols-3
                     sm:gap-2"
            >
              <!-- =================================================
                   Search
                   ================================================= -->
              <div
                [class.hidden]="!showSearch()"
                class="col-span-2
                       sm:col-span-1
                       sm:block"
              >
                <label
                  for="search"
                  class="mb-0.5 block
                         text-[14px]
                         font-medium
                         text-[#032D42]
                         sm:text-[16px]"
                >
                  Search
                </label>

                <div class="relative">
                  <mat-icon
                    aria-hidden="true"
                    class="pointer-events-none
                           absolute left-2
                           top-1/2
                           !m-0
                           !h-4 !w-4
                           -translate-y-1/2
                           !text-[16px]
                           !leading-4
                           text-gray-400"
                  >
                    search
                  </mat-icon>

                  <input
                    id="search"
                    type="search"
                    [value]="searchTerm()"
                    (input)="onSearch($event)"
                    placeholder="Search resources..."
                    class="block h-9 w-full
                           rounded-md
                           border
                           border-[#007979]/20
                           bg-white
                           pl-8 pr-2.5
                           text-md
                           text-gray-800
                           placeholder:text-gray-300
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-1
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>

              <!-- =================================================
                   Category
                   ================================================= -->
              <div [class.hidden]="showSearch()" class="sm:block">
                <label
                  for="category"
                  class="mb-0.5 block
                         text-[14px]
                         font-medium
                         text-[#032D42]
                         sm:text-[16px]"
                >
                  Category
                </label>

                <select
                  id="category"
                  [value]="selectedCategory()"
                  (change)="onCategoryChange($event)"
                  class="block h-9 w-full
                         rounded-md
                         border
                         border-[#007979]/20
                         bg-white
                         px-2
                         text-md
                         text-gray-800
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-1
                         focus:ring-[#007979]/20"
                >
                  <option value="">All categories</option>

                  @for (category of categories(); track category.slug) {
                    <option [value]="category.slug">
                      {{ category.name }}
                    </option>
                  }
                </select>
              </div>

              <!-- =================================================
                   Resource Type
                   ================================================= -->
              <div [class.hidden]="showSearch()" class="sm:block">
                <label
                  for="resourceType"
                  class="mb-0.5 block
                         text-[14px]
                         font-medium
                         text-[#032D42]
                         sm:text-[16px]"
                >
                  Type
                </label>

                <select
                  id="resourceType"
                  [value]="selectedType()"
                  (change)="onTypeChange($event)"
                  class="block h-9 w-full
                         rounded-md
                         border
                         border-[#007979]/20
                         bg-white
                         px-2
                         text-md
                         text-gray-800
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-1
                         focus:ring-[#007979]/20"
                >
                  <option value="">All types</option>

                  @for (type of resourceTypes; track type) {
                    <option [value]="type">
                      {{ formatResourceType(type) }}
                    </option>
                  }
                </select>
              </div>
            </div>

            <!-- =================================================
                 Secondary Filters + Result Count
                 ================================================= -->
            <div
              class="mt-1.5
                     flex items-center
                     justify-between
                     gap-2"
            >
              <div
                class="flex min-w-0
                       items-center
                       gap-2.5"
              >
                <!-- Online -->
                <label
                  class="flex shrink-0
                         items-center
                         gap-1
                         text-md
                         text-[#032D42]
                         sm:text-[14px]"
                >
                  <input
                    type="checkbox"
                    [checked]="onlineOnly()"
                    (change)="onOnlineChange($event)"
                    class="h-4 w-4
                           rounded
                           border-[#007979]/30
                           text-[#007979]
                           focus:ring-[#007979]/20"
                  />

                  <span> Online </span>
                </label>

                <!-- Featured -->
                <label
                  class="flex shrink-0
                         items-center
                         gap-1
                         text-md
                         text-[#032D42]
                         sm:text-[14px]"
                >
                  <input
                    type="checkbox"
                    [checked]="featuredOnly()"
                    (change)="onFeaturedChange($event)"
                    class="h-4 w-4
                           rounded
                           border-[#007979]/30
                           text-[#007979]
                           focus:ring-[#007979]/20"
                  />

                  <span> Featured </span>
                </label>

                <!-- Clear -->
                @if (hasActiveFilters()) {
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="shrink-0
                           text-lg
                           font-medium
                           text-[#007979]
                           hover:text-[#032D42]
                           sm:text-[14px]"
                  >
                    Clear
                  </button>
                }
              </div>

              <!-- Result Count -->
              @if (!loading()) {
                <span
                  class="shrink-0
                         text-[15px]
                         font-bold
                         text-[#032D42]/60
                         sm:text-[16px]"
                >
                  {{ filteredResources().length }}
                </span>
              }
            </div>
          </section>

          <!-- ===================================================
               Loading State
               =================================================== -->
          @if (loading()) {
            <div
              class="mt-3 grid gap-3
                     sm:grid-cols-2
                     lg:grid-cols-3"
              aria-label="Loading resources"
            >
              @for (skeleton of [1, 2, 3, 4, 5, 6]; track skeleton) {
                <div
                  class="animate-pulse
                         rounded-lg
                         border border-gray-200
                         bg-white
                         p-3
                         shadow-sm"
                >
                  <div
                    class="h-4 w-20
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2 h-5 w-3/4
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2
                           space-y-1.5"
                  >
                    <div
                      class="h-3 w-full
                             rounded
                             bg-gray-200"
                    ></div>

                    <div
                      class="h-3 w-5/6
                             rounded
                             bg-gray-200"
                    ></div>
                  </div>

                  <div
                    class="mt-3 h-3 w-24
                           rounded
                           bg-gray-200"
                  ></div>
                </div>
              }
            </div>
          }

          <!-- ===================================================
               Error
               =================================================== -->
          @if (error()) {
            <p
              class="mt-3
                     rounded-md
                     bg-red-50
                     px-3 py-2
                     text-xs
                     text-red-600"
            >
              {{ error() }}
            </p>
          }

          <!-- ===================================================
               No Matching Resources
               =================================================== -->
          @if (
            !loading() && !error() && resources().length > 0 && filteredResources().length === 0
          ) {
            <div
              class="mt-4
                     rounded-lg
                     border border-gray-200
                     bg-white
                     p-4
                     text-center
                     shadow-sm
                     sm:p-6"
            >
              <h2
                class="text-base
                       font-semibold
                       text-gray-900"
              >
                No resources found
              </h2>

              <p
                class="mt-1
                       text-xs
                       text-gray-600
                       sm:text-sm"
              >
                We couldn't find any resources matching your current search or filters.
              </p>

              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-3
                         rounded-md
                         bg-[#007979]
                         px-3 py-1.5
                         text-xs
                         font-medium
                         text-white
                         hover:bg-[#006666]"
                >
                  Clear filters
                </button>
              }
            </div>
          }

          <!-- ===================================================
               Resource Cards
               =================================================== -->
          @if (!loading() && !error() && filteredResources().length > 0) {
            <div
              class="mt-10
                     grid gap-3
                     sm:grid-cols-2
                     lg:grid-cols-3"
            >
              @for (resource of filteredResources(); track resource.id) {
                <app-resource-card
                  [resource]="resource"
                  [categoryName]="getCategoryName(resource.categoryId)"
                />
              }
            </div>
          }

          <!-- ===================================================
               Load More
               =================================================== -->
          @if (!loading() && !error() && filteredResources().length > 0 && hasMoreResources()) {
            <div
              class="mt-4
                     flex justify-center"
            >
              <button
                type="button"
                (click)="loadMoreResources()"
                [disabled]="loadingMore()"
                class="rounded-md
                       bg-[#007979]
                       px-4 py-2
                       text-md
                       font-medium
                       text-white
                       transition
                       hover:bg-[#006666]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (loadingMore()) {
                  Loading...
                } @else {
                  Load more
                }
              </button>
            </div>
          }

          <!-- ===================================================
               Empty Directory
               =================================================== -->
          @if (!loading() && !error() && resources().length === 0) {
            <p
              class="mt-4
                     text-center
                     text-md
                     text-gray-600"
            >
              No resources are currently available.
            </p>
          }
        </section>

        <!-- =====================================================
             Useful Links Sidebar
             ===================================================== -->
        <aside
          class="lg:sticky
                 lg:top-6
                 lg:self-start"
        >
          <app-useful-links />
        </aside>
      </div>
    </main>
  `,

  styles: [],
})
export class ResourceListComponent implements OnInit {
  // =========================================================
  // Services
  // =========================================================

  private readonly resourceService = inject(ResourceService);

  private readonly categoryService = inject(CategoryService);

  private readonly locationService = inject(LocationService);

  protected readonly personalizationService = inject(PersonalizationService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  protected readonly authService = inject(AuthService);

  private readonly toast = inject(HotToastService);

  // =========================================================
  // Resource State
  // =========================================================

  protected readonly resources = signal<Resource[]>([]);

  protected readonly categories = signal<Category[]>([]);

  protected readonly showPersonalization = signal(true);

  protected togglePersonalization(): void {
    this.showPersonalization.update((visible) => !visible);
  }

  // =========================================================
  // Personalization State
  // =========================================================

  /**
   * Available locations for personalization.
   */
  protected readonly locations = signal<Location[]>([]);

  /**
   * Whether the visitor has selected
   * at least one personalization preference.
   */
  protected readonly hasPersonalization = computed(() =>
    this.personalizationService.hasPreferences(),
  );

  // =========================================================
  // Loading / Error State
  // =========================================================

  protected readonly loading = signal(true);

  /**
   * Prevent duplicate sign-out requests.
   */
  protected readonly signingOut = signal(false);

  protected readonly error = signal<string | null>(null);

  // =========================================================
  // Filter State
  // =========================================================

  protected readonly searchTerm = signal('');

  protected readonly selectedType = signal<ResourceType | ''>('');

  protected readonly selectedCategory = signal('');

  protected readonly onlineOnly = signal(false);

  protected readonly featuredOnly = signal(false);

  // =========================================================
  // Mobile Filter Builder State
  //
  // false:
  //   Category + Type visible on mobile
  //
  // true:
  //   Search visible on mobile
  //
  // Desktop:
  //   Search + Category + Type are always visible.
  // =========================================================

  protected readonly showSearch = signal(false);

  // =========================================================
  // Pagination
  // =========================================================

  private lastResourceDocument: QueryDocumentSnapshot | undefined;

  protected readonly hasMoreResources = signal(true);

  protected readonly loadingMore = signal(false);

  /**
   * Number of resources loaded per page.
   */
  private readonly resourcePageSize = 12;

  // =========================================================
  // Resource Types
  // =========================================================

  protected readonly resourceTypes: ResourceType[] = [
    'government',
    'nonprofit',
    'education',
    'business',
    'community',
    'service',
    'tool',
    'other',
  ];

  // =========================================================
  // Selected Category ID
  // =========================================================

  protected readonly selectedCategoryId = computed(() => {
    const slug = this.selectedCategory();

    if (!slug) {
      return '';
    }

    const category = this.categories().find((category) => category.slug === slug);

    return category?.id ?? '';
  });

  // =========================================================
  // Category Name
  // =========================================================

  protected getCategoryName(categoryId: string): string {
    return this.categories().find((category) => category.id === categoryId)?.name ?? '';
  }

  // =========================================================
  // Filtered Resources
  // =========================================================

  protected readonly filteredResources = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    const type = this.selectedType();

    const categoryId = this.selectedCategoryId();

    return this.resources().filter((resource) => {
      const matchesSearch =
        !search ||
        resource.name.toLowerCase().includes(search) ||
        resource.description.toLowerCase().includes(search) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(search));

      const matchesType = !type || resource.resourceType === type;

      const matchesCategory = !categoryId || resource.categoryId === categoryId;

      const matchesOnline = !this.onlineOnly() || resource.online;

      const matchesFeatured = !this.featuredOnly() || resource.featured;

      return matchesSearch && matchesType && matchesCategory && matchesOnline && matchesFeatured;
    });
  });

  // =========================================================
  // Active Filters
  // =========================================================

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.searchTerm().trim() !== '' ||
      this.selectedType() !== '' ||
      this.selectedCategory() !== '' ||
      this.onlineOnly() ||
      this.featuredOnly()
    );
  });

  // =========================================================
  // Initialization
  // =========================================================

  /**
   * Sign out the current user.
   */
  protected async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      this.signingOut.set(false);
    }
  }

  ngOnInit(): void {
    this.loadResources();

    this.loadCategories();

    this.loadLocations();

    const category = this.route.snapshot.queryParamMap.get('category');

    if (category) {
      this.selectedCategory.set(category);
    }
  }

  // =========================================================
  // Load Categories
  // =========================================================

  private async loadCategories(): Promise<void> {
    try {
      const categories = await this.categoryService.getActiveCategories();

      this.categories.set(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  // =========================================================
  // Load Locations
  // =========================================================

  private async loadLocations(): Promise<void> {
    try {
      const locations = await this.locationService.getAllLocations();

      this.locations.set(locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }

  // =========================================================
  // Search
  // =========================================================

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  // =========================================================
  // Toggle Mobile Filter Builder
  // =========================================================

  protected toggleSearch(): void {
    this.showSearch.update((visible) => !visible);
  }

  // =========================================================
  // Resource Type
  // =========================================================

  protected onTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.selectedType.set(select.value as ResourceType | '');
  }

  // =========================================================
  // Online Filter
  // =========================================================

  protected onOnlineChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.onlineOnly.set(input.checked);
  }

  // =========================================================
  // Featured Filter
  // =========================================================

  protected onFeaturedChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.featuredOnly.set(input.checked);
  }

  // =========================================================
  // Category Filter
  // =========================================================

  protected onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    const category = select.value;

    this.selectedCategory.set(category);

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category: category || null,
      },

      queryParamsHandling: 'merge',
    });
  }

  // =========================================================
  // Clear Filters
  // =========================================================

  protected clearFilters(): void {
    this.searchTerm.set('');

    this.selectedType.set('');

    this.selectedCategory.set('');

    this.onlineOnly.set(false);

    this.featuredOnly.set(false);

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category: null,
      },

      queryParamsHandling: 'merge',
    });
  }

  // =========================================================
  // Personalization
  // =========================================================

  /**
   * Toggle a visitor's personalization interest.
   */
  protected togglePersonalizationInterest(interestId: string): void {
    this.personalizationService.toggleInterest(interestId);
  }

  /**
   * Determine whether an interest is selected.
   */
  protected isPersonalizationInterestSelected(interestId: string): boolean {
    return this.personalizationService.preferences().interests.includes(interestId);
  }

  /**
   * Set the visitor's preferred location.
   */
  protected selectPersonalizationLocation(locationId: string | null): void {
    this.personalizationService.setLocation(locationId);
  }

  /**
   * Clear all personalization preferences.
   */
  protected clearPersonalization(): void {
    this.personalizationService.clear();
  }

  /**
   * Format a location for display.
   */
  protected formatPersonalizationLocation(location: Location): string {
    return [location.city, location.state, location.country].filter(Boolean).join(', ');
  }

  // =========================================================
  // Format Resource Type
  // =========================================================

  protected formatResourceType(type: ResourceType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // =========================================================
  // Load Resources
  // =========================================================

  private async loadResources(): Promise<void> {
    this.loading.set(true);

    this.error.set(null);

    this.lastResourceDocument = undefined;

    this.hasMoreResources.set(true);

    try {
      const page = await this.resourceService.getPublishedResourcesPage(this.resourcePageSize);

      this.resources.set(page.resources);

      this.lastResourceDocument = page.lastDocument ?? undefined;

      this.hasMoreResources.set(page.hasMore);
    } catch (error) {
      console.error('Failed to load resources:', error);

      this.error.set('Unable to load resources. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  // =========================================================
  // Load More Resources
  // =========================================================

  protected async loadMoreResources(): Promise<void> {
    if (this.loadingMore() || !this.hasMoreResources()) {
      return;
    }

    this.loadingMore.set(true);

    try {
      const page = await this.resourceService.getPublishedResourcesPage(
        this.resourcePageSize,
        this.lastResourceDocument,
      );

      this.resources.update((resources) => [...resources, ...page.resources]);

      this.lastResourceDocument = page.lastDocument ?? undefined;

      this.hasMoreResources.set(page.hasMore);
    } catch (error) {
      console.error('Failed to load more resources:', error);

      this.error.set('Unable to load more resources. Please try again.');
    } finally {
      this.loadingMore.set(false);
    }
  }

  // =========================================================
  // Select Category
  // =========================================================

  protected selectCategory(categorySlug: string): void {
    this.selectedCategory.set(categorySlug);

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        category: categorySlug || null,
      },

      queryParamsHandling: 'merge',
    });
  }
}
