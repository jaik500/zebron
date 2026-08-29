import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  AuthService,
} from '../../../../core/services/auth.service';

import {
  Job,
} from '../../../../core/models/job.model';

import {
  JobService,
} from '../../../../core/services/job.service';

import {
  MatMenuModule,
} from '@angular/material/menu';

import {
  MatDividerModule,
} from '@angular/material/divider';

import {
  HotToastService,
} from '@ngxpert/hot-toast';


@Component({
  selector: 'app-job-admin',

  standalone: true,

  imports: [
    RouterLink,
    MatMenuModule,
    MatDividerModule,
  ],

  template: `

    <main
      class="min-h-screen
             bg-gray-50"
    >

      <!-- =====================================================
           Header
           ===================================================== -->
      <header
        class="border-b
               border-gray-200
               bg-[#032D42]"
      >

        <div
          class="mx-auto flex
                 max-w-7xl
                 items-center
                 justify-between
                 gap-4
                 px-4 py-4
                 sm:px-6
                 lg:px-8"
        >

          <!-- Title -->
          <div class="min-w-0">

            <p
              class="text-xs
                     font-semibold
                     uppercase
                     tracking-wider
                     text-[#7ED6D1]"
            >
              Job Management
            </p>

            <h1
              class="text-xl
                     font-bold
                     text-white
                     sm:text-3xl"
            >
              Jobs
            </h1>

            <p
              class="mt-1
                     text-sm
                     text-white/80"
            >
              Manage the opportunities available
              through the Zebron Job Finder.
            </p>

          </div>


          <!-- =================================================
               Header Actions
               ================================================= -->
          <div
            class="flex
                   shrink-0
                   items-center
                   gap-2"
          >

            <!-- Dashboard -->
            <a
              routerLink="/admin"
              class="hidden
                     items-center
                     rounded-lg
                     border border-gray-300
                     bg-white
                     px-3 py-2.5
                     text-sm
                     font-semibold
                     text-gray-700
                     shadow-sm
                     transition
                     hover:border-[#7ED6D1]
                     hover:text-[#032D42]
                     sm:inline-flex"
            >
              ← Dashboard
            </a>


            <!-- Add Job -->
            <a
              routerLink="/admin/jobs/new"
              class="hidden
                     items-center
                     rounded-lg
                     bg-[#007979]
                     px-4 py-2.5
                     text-sm
                     font-semibold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]
                     sm:inline-flex"
            >
              + Add Job
            </a>


            <!-- =================================================
                 Three-dot Menu
                 ================================================= -->
            <button
              mat-icon-button
              [matMenuTriggerFor]="adminMenu"
              aria-label="Open admin navigation"
              class="!h-10
                     !w-10
                     !text-white"
            >

              <span
                class="text-2xl
                       font-bold
                       leading-none"
                aria-hidden="true"
              >
                ⋮
              </span>

            </button>


            <mat-menu
              #adminMenu="matMenu"
              xPosition="before"
            >

              <!-- Dashboard -->
              <a
                mat-menu-item
                routerLink="/admin"
              >
                <span>
                  Dashboard
                </span>
              </a>


              <!-- Resources -->
              <a
                mat-menu-item
                routerLink="/admin/resources"
              >
                <span>
                  Resources
                </span>
              </a>


              <!-- Categories -->
              <a
                mat-menu-item
                routerLink="/admin/categories"
              >
                <span>
                  Categories
                </span>
              </a>


              <!-- Organizations -->
              <a
                mat-menu-item
                routerLink="/admin/organizations"
              >
                <span>
                  Organizations
                </span>
              </a>


              <!-- Contact Messages -->
              <a
                mat-menu-item
                routerLink="/admin/contact"
              >
                <span>
                  Contact Messages
                </span>
              </a>


              <!-- Add Jobs -->
              <a
                mat-menu-item
                routerLink="/admin/jobs/new"
              >
                <span>
                  Add Jobs
                </span>
              </a>


              <mat-divider></mat-divider>


              <!-- Sign Out -->
              <button
                mat-menu-item
                type="button"
                (click)="signOut()"
              >

                <span
                  class="text-red-600"
                >
                  Sign out
                </span>

              </button>

            </mat-menu>

          </div>

        </div>

      </header>


      <!-- =====================================================
           Content
           ===================================================== -->
      <div
        class="mx-auto
               max-w-7xl
               px-4 py-3
               sm:px-6
               lg:px-8"
      >

        <!-- ===================================================
             Loading
             =================================================== -->
        @if (loading()) {

          <div
            class="rounded-xl
                   border
                   border-gray-200
                   bg-white
                   px-6 py-12
                   text-center
                   shadow-sm"
          >

            <div
              class="mx-auto
                     h-8 w-8
                     animate-spin
                     rounded-full
                     border-4
                     border-gray-200
                     border-t-[#007979]"
            ></div>


            <p
              class="mt-4
                     text-sm
                     text-gray-500"
            >
              Loading jobs...
            </p>

          </div>

        }

        <!-- ===================================================
             Error
             =================================================== -->
        @else if (error()) {

          <div
            class="rounded-xl
                   border
                   border-red-200
                   bg-red-50
                   px-5 py-4"
          >

            <p
              class="text-sm
                     font-medium
                     text-red-700"
            >
              {{ error() }}
            </p>


            <button
              type="button"
              (click)="loadJobs()"
              class="mt-3
                     text-sm
                     font-semibold
                     text-red-700
                     underline
                     hover:text-red-900"
            >
              Try again
            </button>

          </div>

        }

        <!-- ===================================================
             No Jobs At All
             =================================================== -->
        @else if (jobs().length === 0) {

          <section
            class="rounded-xl
                   border
                   border-dashed
                   border-gray-300
                   bg-white
                   px-6 py-14
                   text-center
                   shadow-sm"
          >

            <div
              class="mx-auto
                     flex
                     h-14 w-14
                     items-center
                     justify-center
                     rounded-2xl
                     bg-[#007979]/10
                     text-2xl"
              aria-hidden="true"
            >
              💼
            </div>


            <h2
              class="mt-4
                     text-lg
                     font-semibold
                     text-[#032D42]"
            >
              No jobs yet
            </h2>


            <p
              class="mx-auto
                     mt-2
                     max-w-md
                     text-sm
                     leading-6
                     text-gray-600"
            >
              Add your first job opportunity to
              make it available to the Zebron Job Finder.
            </p>


            <a
              routerLink="/admin/jobs/new"
              class="mt-6
                     inline-flex
                     items-center
                     rounded-lg
                     bg-[#007979]
                     px-5 py-2.5
                     text-sm
                     font-semibold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]"
            >
              + Add Job
            </a>

          </section>

        }

        <!-- ===================================================
             Jobs
             =================================================== -->
        @else {

          <!-- =================================================
               Search & Filters
               ================================================= -->
          <section
            class="mb-2
                   rounded-xl
                   border
                   border-gray-200
                   bg-white
                   px-4 py-2
                   shadow-sm
                   sm:px-5"
          >

            <!-- Search Row -->
            <div
              class="flex
                     flex-col
                     gap-3
                     lg:flex-row
                     lg:items-center"
            >

              <!-- Search -->
              <div
                class="relative
                       min-w-0
                       flex-1"
              >

                <span
                  class="pointer-events-none
                         absolute
                         left-3
                         top-1/2
                         -translate-y-1/2
                         text-gray-400"
                  aria-hidden="true"
                >
                  🔎
                </span>


                <input
                  type="search"
                  [value]="searchTerm()"
                  (input)="
                    setSearchTerm(
                      $any($event.target).value
                    )
                  "
                  placeholder="Search jobs, organizations, locations, skills, tags..."
                  aria-label="Search jobs"
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         py-2.5
                         pl-10
                         pr-10
                         text-sm
                         text-gray-900
                         outline-none
                         transition
                         placeholder:text-gray-400
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />


                @if (searchTerm()) {

                  <button
                    type="button"
                    (click)="clearSearch()"
                    aria-label="Clear search"
                    class="absolute
                           right-3
                           top-1/2
                           -translate-y-1/2
                           text-gray-400
                           hover:text-gray-700"
                  >
                    ×
                  </button>

                }

              </div>


              <!-- Clear Filters -->
              @if (hasActiveFilters()) {

                <button
                  type="button"
                  (click)="clearFilters()"
                  class="inline-flex
                         shrink-0
                         items-center
                         justify-center
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-4 py-2.5
                         text-sm
                         font-semibold
                         text-gray-700
                         transition
                         hover:border-[#007979]
                         hover:text-[#007979]"
                >
                  Clear Filters
                </button>

              }

            </div>


            <!-- Filter heading -->
            <div
              class="mt-2
                     flex
                     items-center
                     justify-between
                     gap-3"
            >

              <div>

                <p
                  class="text-xs
                         font-semibold
                         uppercase
                         tracking-wider
                         text-gray-500"
                >
                  Filters
                </p>

                <p
                  class="mt-0.5
                         text-xs
                         text-gray-400"
                >
                  Narrow the job listing by column.
                </p>

              </div>


              <p
                class="text-xs
                       font-medium
                       text-gray-500"
              >
                Showing
                {{ filteredJobs().length }}
                of
                {{ jobs().length }}
              </p>

            </div>


            <!-- =================================================
                 Mobile / Tablet Filter Grid
                 ================================================= -->
            <div
              class="mt-4
                     grid
                     gap-3
                     sm:grid-cols-2
                     lg:hidden"
            >

              <!-- Job Filter -->
              <div>

                <label
                  for="mobileJobFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Job
                </label>

                <input
                  id="mobileJobFilter"
                  type="text"
                  [value]="jobFilter()"
                  (input)="
                    setJobFilter(
                      $any($event.target).value
                    )
                  "
                  placeholder="Filter job title"
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

              </div>


              <!-- Organization Filter -->
              <div>

                <label
                  for="mobileOrganizationFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Organization
                </label>

                <input
                  id="mobileOrganizationFilter"
                  type="text"
                  [value]="organizationFilter()"
                  (input)="
                    setOrganizationFilter(
                      $any($event.target).value
                    )
                  "
                  placeholder="Filter organization"
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

              </div>


              <!-- Type -->
              <div>

                <label
                  for="mobileTypeFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Employment Type
                </label>

                <select
                  id="mobileTypeFilter"
                  [value]="employmentTypeFilter()"
                  (change)="
                    setEmploymentTypeFilter(
                      $any($event.target).value
                    )
                  "
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                >

                  <option value="">
                    All types
                  </option>

                  <option value="full-time">
                    Full-time
                  </option>

                  <option value="part-time">
                    Part-time
                  </option>

                  <option value="contract">
                    Contract
                  </option>

                  <option value="internship">
                    Internship
                  </option>

                  <option value="temporary">
                    Temporary
                  </option>

                </select>

              </div>


              <!-- Location -->
              <div>

                <label
                  for="mobileLocationFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Location
                </label>

                <input
                  id="mobileLocationFilter"
                  type="text"
                  [value]="locationFilter()"
                  (input)="
                    setLocationFilter(
                      $any($event.target).value
                    )
                  "
                  placeholder="City or state"
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />

              </div>


              <!-- Status -->
              <div>

                <label
                  for="mobileStatusFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Status
                </label>

                <select
                  id="mobileStatusFilter"
                  [value]="statusFilter()"
                  (change)="
                    setStatusFilter(
                      $any($event.target).value
                    )
                  "
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                >

                  <option value="">
                    All statuses
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="closed">
                    Closed
                  </option>

                </select>

              </div>


              <!-- Featured -->
              <div>

                <label
                  for="mobileFeaturedFilter"
                  class="mb-1
                         block
                         text-xs
                         font-semibold
                         text-gray-500"
                >
                  Featured
                </label>

                <select
                  id="mobileFeaturedFilter"
                  [value]="featuredFilter()"
                  (change)="
                    setFeaturedFilter(
                      $any($event.target).value
                    )
                  "
                  class="block
                         w-full
                         rounded-lg
                         border
                         border-gray-300
                         bg-white
                         px-3 py-2
                         text-sm
                         outline-none
                         focus:border-[#007979]
                         focus:ring-2
                         focus:ring-[#007979]/20"
                >

                  <option value="">
                    All jobs
                  </option>

                  <option value="featured">
                    Featured
                  </option>

                  <option value="not-featured">
                    Not featured
                  </option>

                </select>

              </div>

            </div>

          </section>


          <!-- =================================================
               Summary
               ================================================= -->
          <div
            class="mb-5
                   flex
                   flex-col
                   gap-3
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >

            <div>

              <h2
                class="text-lg
                       font-bold
                       text-[#032D42]"
              >
                All Jobs
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-gray-500"
              >

                @if (hasActiveFilters()) {

                  Showing
                  <span
                    class="font-semibold
                           text-gray-700"
                  >
                    {{ filteredJobs().length }}
                  </span>
                  of
                  {{ jobs().length }}
                  jobs.

                } @else {

                  {{ jobs().length }}
                  {{ jobs().length === 1 ? 'job' : 'jobs' }}
                  onboarded.

                }

              </p>

            </div>


            <!-- Status summary -->
            <div
              class="flex
                     flex-wrap
                     gap-2"
            >

              <span
                class="rounded-full
                       bg-green-100
                       px-3 py-1
                       text-xs
                       font-medium
                       text-green-700"
              >
                {{ activeCount() }}
                Active
              </span>


              <span
                class="rounded-full
                       bg-yellow-100
                       px-3 py-1
                       text-xs
                       font-medium
                       text-yellow-700"
              >
                {{ draftCount() }}
                Draft
              </span>


              <span
                class="rounded-full
                       bg-gray-100
                       px-3 py-1
                       text-xs
                       font-medium
                       text-gray-600"
              >
                {{ closedCount() }}
                Closed
              </span>

            </div>

          </div>


          <!-- =================================================
               No Filter Results
               ================================================= -->
          @if (
            filteredJobs().length === 0
          ) {

            <section
              class="rounded-xl
                     border
                     border-dashed
                     border-gray-300
                     bg-white
                     px-6 py-12
                     text-center
                     shadow-sm"
            >

              <div
                class="mx-auto
                       flex
                       h-12 w-12
                       items-center
                       justify-center
                       rounded-xl
                       bg-gray-100
                       text-xl"
                aria-hidden="true"
              >
                🔎
              </div>


              <h2
                class="mt-4
                       text-lg
                       font-semibold
                       text-[#032D42]"
              >
                No matching jobs
              </h2>


              <p
                class="mx-auto
                       mt-2
                       max-w-md
                       text-sm
                       leading-6
                       text-gray-600"
              >
                No jobs match the current search
                and filter criteria.
              </p>


              <button
                type="button"
                (click)="clearFilters()"
                class="mt-5
                       inline-flex
                       items-center
                       rounded-lg
                       bg-[#007979]
                       px-4 py-2.5
                       text-sm
                       font-semibold
                       text-white
                       transition
                       hover:bg-[#006666]"
              >
                Clear Filters
              </button>

            </section>

          }

          @else {

            <!-- =================================================
                 Desktop Table
                 ================================================= -->
            <div
              class="hidden
                     overflow-hidden
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm
                     md:block"
            >

              <div
                class="overflow-x-auto"
              >

                <table
                  class="min-w-full
                         divide-y
                         divide-gray-200"
                >

                  <thead
                    class="bg-[#66BB6A]/80"
                  >

                    <tr>

                      <!-- =====================================
                           Job Column
                           ===================================== -->
                      <th
                        class="min-w-[260px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Job
                        </div>


                        <input
                          type="text"
                          [value]="jobFilter()"
                          (input)="
                            setJobFilter(
                              $any($event.target).value
                            )
                          "
                          placeholder="Filter job..."
                          aria-label="Filter jobs by title"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 placeholder:text-gray-400
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        />

                      </th>


                      <!-- =====================================
                           Organization
                           ===================================== -->
                      <th
                        class="min-w-[210px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Organization
                        </div>


                        <input
                          type="text"
                          [value]="organizationFilter()"
                          (input)="
                            setOrganizationFilter(
                              $any($event.target).value
                            )
                          "
                          placeholder="Filter organization..."
                          aria-label="Filter by organization"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 placeholder:text-gray-400
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        />

                      </th>


                      <!-- =====================================
                           Type
                           ===================================== -->
                      <th
                        class="min-w-[150px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Type
                        </div>


                        <select
                          [value]="employmentTypeFilter()"
                          (change)="
                            setEmploymentTypeFilter(
                              $any($event.target).value
                            )
                          "
                          aria-label="Filter by employment type"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        >

                          <option value="">
                            All
                          </option>

                          <option value="full-time">
                            Full-time
                          </option>

                          <option value="part-time">
                            Part-time
                          </option>

                          <option value="contract">
                            Contract
                          </option>

                          <option value="internship">
                            Internship
                          </option>

                          <option value="temporary">
                            Temporary
                          </option>

                        </select>

                      </th>


                      <!-- =====================================
                           Location
                           ===================================== -->
                      <th
                        class="min-w-[180px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Location
                        </div>


                        <input
                          type="text"
                          [value]="locationFilter()"
                          (input)="
                            setLocationFilter(
                              $any($event.target).value
                            )
                          "
                          placeholder="City / state..."
                          aria-label="Filter by location"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 placeholder:text-gray-400
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        />

                      </th>


                      <!-- =====================================
                           Status
                           ===================================== -->
                      <th
                        class="min-w-[130px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Status
                        </div>


                        <select
                          [value]="statusFilter()"
                          (change)="
                            setStatusFilter(
                              $any($event.target).value
                            )
                          "
                          aria-label="Filter by status"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        >

                          <option value="">
                            All
                          </option>

                          <option value="active">
                            Active
                          </option>

                          <option value="draft">
                            Draft
                          </option>

                          <option value="closed">
                            Closed
                          </option>

                        </select>

                      </th>


                      <!-- =====================================
                           Featured
                           ===================================== -->
                      <th
                        class="min-w-[125px]
                               px-5 py-3
                               text-left
                               align-top"
                      >

                        <div
                          class="text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wider"
                        >
                          Featured
                        </div>


                        <select
                          [value]="featuredFilter()"
                          (change)="
                            setFeaturedFilter(
                              $any($event.target).value
                            )
                          "
                          aria-label="Filter featured jobs"
                          class="mt-2
                                 block
                                 w-full
                                 rounded-md
                                 border
                                 border-gray-300
                                 bg-white
                                 px-2.5 py-2
                                 text-xs
                                 font-normal
                                 normal-case
                                 tracking-normal
                                 text-gray-700
                                 outline-none
                                 focus:border-[#007979]
                                 focus:ring-1
                                 focus:ring-[#007979]"
                        >

                          <option value="">
                            All
                          </option>

                          <option value="featured">
                            Featured
                          </option>

                          <option value="not-featured">
                            Not featured
                          </option>

                        </select>

                      </th>


                      <!-- Actions -->
                      <th
                        class="px-5 py-3
                               text-right
                               align-top
                               text-xs
                               font-semibold
                               uppercase
                               tracking-wider"
                      >
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody
                    class="divide-y
                           divide-gray-100"
                  >

                    @for (
                      job of filteredJobs();
                      track job.id
                    ) {

                      <tr
                        class="transition
                               hover:bg-gray-50"
                      >

                        <!-- Job -->
                        <td
                          class="px-5 py-4"
                        >

                          <div>

                            <div
                              class="flex
                                     items-center
                                     gap-2"
                            >

                              <span
                                class="font-semibold
                                       text-gray-900"
                              >
                                {{ job.title }}
                              </span>


                              @if (job.featured) {

                                <span
                                  class="rounded-full
                                         bg-yellow-100
                                         px-2 py-0.5
                                         text-[10px]
                                         font-semibold
                                         text-yellow-700"
                                >
                                  Featured
                                </span>

                              }

                            </div>


                            <p
                              class="mt-1
                                     line-clamp-2
                                     text-sm
                                     text-gray-500"
                            >
                              {{ truncate(
                                job.description,
                                100
                              ) }}
                            </p>

                          </div>

                        </td>


                        <!-- Organization -->
                        <td
                          class="px-5 py-4
                                 text-sm
                                 text-gray-700"
                        >
                          {{ job.organizationName }}
                        </td>


                        <!-- Type -->
                        <td
                          class="px-5 py-4
                                 text-sm
                                 text-gray-600"
                        >
                          {{ formatEmploymentType(
                            job.employmentType
                          ) }}
                        </td>


                        <!-- Location -->
                        <td
                          class="px-5 py-4
                                 text-sm
                                 text-gray-600"
                        >
                          {{ formatLocation(job) }}
                        </td>


                        <!-- Status -->
                        <td
                          class="px-5 py-4"
                        >

                          <span
                            [class]="
                              statusClasses(
                                job.status
                              )
                            "
                          >
                            {{ formatStatus(
                              job.status
                            ) }}
                          </span>

                        </td>


                        <!-- Featured -->
                        <td
                          class="px-5 py-4"
                        >

                          @if (job.featured) {

                            <span
                              class="text-sm
                                     font-medium
                                     text-yellow-700"
                            >
                              Yes
                            </span>

                          } @else {

                            <span
                              class="text-sm
                                     text-gray-400"
                            >
                              No
                            </span>

                          }

                        </td>


                        <!-- Actions -->
                        <td
                          class="px-5 py-4
                                 text-right"
                        >

                          <div
                            class="flex
                                   justify-end
                                   gap-3"
                          >

                            <a
                              [routerLink]="[
                                '/admin/jobs',
                                job.id,
                                'edit'
                              ]"
                              class="text-sm
                                     font-semibold
                                     text-[#007979]
                                     hover:underline"
                            >
                              Edit
                            </a>


                            <button
                              type="button"
                              (click)="
                                deleteJob(job)
                              "
                              class="text-sm
                                     font-semibold
                                     text-red-600
                                     hover:underline"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    }

                  </tbody>

                </table>

              </div>

            </div>


            <!-- =================================================
                 Mobile Cards
                 ================================================= -->
            <div
              class="space-y-3
                     md:hidden"
            >

              @for (
                job of filteredJobs();
                track job.id
              ) {

                <article
                  class="rounded-xl
                         border
                         border-gray-200
                         bg-white
                         p-4
                         shadow-sm"
                >

                  <div
                    class="flex
                           items-start
                           justify-between
                           gap-3"
                  >

                    <div
                      class="min-w-0"
                    >

                      <div
                        class="flex
                               flex-wrap
                               items-center
                               gap-2"
                      >

                        <h3
                          class="font-semibold
                                 text-gray-900"
                        >
                          {{ job.title }}
                        </h3>


                        @if (job.featured) {

                          <span
                            class="rounded-full
                                   bg-yellow-100
                                   px-2 py-0.5
                                   text-[10px]
                                   font-semibold
                                   text-yellow-700"
                          >
                            Featured
                          </span>

                        }

                      </div>


                      <p
                        class="mt-1
                               text-sm
                               text-gray-500"
                      >
                        {{ job.organizationName }}
                      </p>

                    </div>


                    <span
                      [class]="
                        statusClasses(
                          job.status
                        )
                      "
                    >
                      {{ formatStatus(
                        job.status
                      ) }}
                    </span>

                  </div>


                  <div
                    class="mt-4
                           grid
                           grid-cols-2
                           gap-3
                           text-sm"
                  >

                    <div>

                      <p
                        class="text-xs
                               text-gray-400"
                      >
                        Employment
                      </p>

                      <p
                        class="mt-0.5
                               text-gray-700"
                      >
                        {{ formatEmploymentType(
                          job.employmentType
                        ) }}
                      </p>

                    </div>


                    <div>

                      <p
                        class="text-xs
                               text-gray-400"
                      >
                        Location
                      </p>

                      <p
                        class="mt-0.5
                               text-gray-700"
                      >
                        {{ formatLocation(job) }}
                      </p>

                    </div>


                    <div
                      class="col-span-2"
                    >

                      <p
                        class="text-xs
                               text-gray-400"
                      >
                        Description
                      </p>

                      <p
                        class="mt-0.5
                               text-sm
                               leading-5
                               text-gray-600"
                      >
                        {{ truncate(
                          job.description,
                          150
                        ) }}
                      </p>

                    </div>

                  </div>


                  <div
                    class="mt-4
                           flex
                           justify-end
                           gap-4
                           border-t
                           border-gray-100
                           pt-3"
                  >

                    <a
                      [routerLink]="[
                        '/admin/jobs',
                        job.id,
                        'edit'
                      ]"
                      class="text-sm
                             font-semibold
                             text-[#007979]"
                    >
                      Edit
                    </a>


                    <button
                      type="button"
                      (click)="
                        deleteJob(job)
                      "
                      class="text-sm
                             font-semibold
                             text-red-600"
                    >
                      Delete
                    </button>

                  </div>

                </article>

              }

            </div>

          }

        }

      </div>

    </main>

  `,
})
export class JobAdminComponent
  implements OnInit {

  // =========================================================
  // Services
  // =========================================================

  private readonly router =
    inject(Router);

  private readonly jobService =
    inject(JobService);

  private readonly authService =
    inject(AuthService);

  private readonly toast =
    inject(HotToastService);


  // =========================================================
  // Job State
  // =========================================================

  protected readonly jobs =
    signal<Job[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal('');


  // =========================================================
  // Search / Filter State
  // =========================================================

  protected readonly searchTerm =
    signal('');

  protected readonly jobFilter =
    signal('');

  protected readonly organizationFilter =
    signal('');

  protected readonly employmentTypeFilter =
    signal('');

  protected readonly locationFilter =
    signal('');

  protected readonly statusFilter =
    signal('');

  protected readonly featuredFilter =
    signal('');


  // =========================================================
  // Filtered Jobs
  // =========================================================

  protected readonly filteredJobs =
    computed(() => {

      const jobs =
        this.jobs();

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const jobFilter =
        this.jobFilter()
          .trim()
          .toLowerCase();

      const organizationFilter =
        this.organizationFilter()
          .trim()
          .toLowerCase();

      const employmentTypeFilter =
        this.employmentTypeFilter()
          .trim()
          .toLowerCase();

      const locationFilter =
        this.locationFilter()
          .trim()
          .toLowerCase();

      const statusFilter =
        this.statusFilter()
          .trim()
          .toLowerCase();

      const featuredFilter =
        this.featuredFilter()
          .trim()
          .toLowerCase();


      return jobs.filter(
        (job) => {

          // ---------------------------------------------------
          // Global Search
          // ---------------------------------------------------

          if (search) {

            const searchableText =
              [
                job.title,

                job.organizationName,

                job.description,

                job.categoryName,

                job.location?.city,

                job.location?.state,

                job.location?.country,

                ...(job.skills ?? []),

                ...(job.tags ?? []),

                job.employmentType,

                job.workArrangement,

                job.status,

              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


            if (
              !searchableText.includes(
                search
              )
            ) {
              return false;
            }

          }


          // ---------------------------------------------------
          // Job Column
          // ---------------------------------------------------

          if (
            jobFilter &&
            !job.title
              .toLowerCase()
              .includes(jobFilter)
          ) {
            return false;
          }


          // ---------------------------------------------------
          // Organization Column
          // ---------------------------------------------------

          if (
            organizationFilter &&
            !job.organizationName
              .toLowerCase()
              .includes(
                organizationFilter
              )
          ) {
            return false;
          }


          // ---------------------------------------------------
          // Employment Type
          // ---------------------------------------------------

          if (
            employmentTypeFilter &&
            job.employmentType !==
              employmentTypeFilter
          ) {
            return false;
          }


          // ---------------------------------------------------
          // Location
          // ---------------------------------------------------

          if (
            locationFilter
          ) {

            const location =
              [
                job.location?.city,

                job.location?.state,

                job.location?.country,

                job.workArrangement,

              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


            if (
              !location.includes(
                locationFilter
              )
            ) {
              return false;
            }

          }


          // ---------------------------------------------------
          // Status
          // ---------------------------------------------------

          if (
            statusFilter &&
            job.status !==
              statusFilter
          ) {
            return false;
          }


          // ---------------------------------------------------
          // Featured
          // ---------------------------------------------------

          if (
            featuredFilter ===
            'featured' &&
            !job.featured
          ) {
            return false;
          }


          if (
            featuredFilter ===
            'not-featured' &&
            job.featured
          ) {
            return false;
          }


          return true;

        }
      );

    });


  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {

    void this.loadJobs();

  }


  // =========================================================
  // Load Jobs
  // =========================================================

  protected async loadJobs(): Promise<void> {

    this.loading.set(true);

    this.error.set('');


    try {

      const jobs =
        await this.jobService.getJobs();

      this.jobs.set(jobs);

    } catch (error) {

      console.error(
        'Failed to load jobs:',
        error
      );

      this.error.set(
        'Unable to load jobs. Please try again.'
      );

      this.toast.error(
        'Unable to load jobs. Please try again.'
      );

    } finally {

      this.loading.set(false);

    }

  }


  // =========================================================
  // Search
  // =========================================================

  protected setSearchTerm(
    value: string
  ): void {

    this.searchTerm.set(
      value
    );

  }


  protected clearSearch(): void {

    this.searchTerm.set('');

  }


  // =========================================================
  // Filters
  // =========================================================

  protected setJobFilter(
    value: string
  ): void {

    this.jobFilter.set(
      value
    );

  }


  protected setOrganizationFilter(
    value: string
  ): void {

    this.organizationFilter.set(
      value
    );

  }


  protected setEmploymentTypeFilter(
    value: string
  ): void {

    this.employmentTypeFilter.set(
      value
    );

  }


  protected setLocationFilter(
    value: string
  ): void {

    this.locationFilter.set(
      value
    );

  }


  protected setStatusFilter(
    value: string
  ): void {

    this.statusFilter.set(
      value
    );

  }


  protected setFeaturedFilter(
    value: string
  ): void {

    this.featuredFilter.set(
      value
    );

  }


  // =========================================================
  // Clear Filters
  // =========================================================

  protected clearFilters(): void {

    this.searchTerm.set('');

    this.jobFilter.set('');

    this.organizationFilter.set('');

    this.employmentTypeFilter.set('');

    this.locationFilter.set('');

    this.statusFilter.set('');

    this.featuredFilter.set('');

  }


  // =========================================================
  // Active Filters
  // =========================================================

  protected hasActiveFilters(): boolean {

    return Boolean(

      this.searchTerm().trim() ||

      this.jobFilter().trim() ||

      this.organizationFilter().trim() ||

      this.employmentTypeFilter().trim() ||

      this.locationFilter().trim() ||

      this.statusFilter().trim() ||

      this.featuredFilter().trim()

    );

  }


  // =========================================================
  // Delete Job
  // =========================================================

  protected async deleteJob(
    job: Job
  ): Promise<void> {

    if (!job.id) {

      this.toast.error(
        'Unable to delete this job because its ID is missing.'
      );

      return;
    }


    /*
     * Confirm destructive action before
     * touching Firestore.
     */
    const confirmed =
      window.confirm(
        `Delete "${job.title}"?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {

      this.toast.info(
        'Job deletion cancelled.'
      );

      return;
    }


    try {

      /*
       * Inform the administrator that
       * the operation has started.
       */
      this.toast.info(
        'Deleting job...'
      );


      await this.jobService.deleteJob(
        job.id
      );


      /*
       * Remove the deleted job from
       * the local signal immediately.
       */
      this.jobs.update(
        (jobs) =>
          jobs.filter(
            (item) =>
              item.id !== job.id
          )
      );


      this.toast.success(
        'Job deleted successfully.'
      );

    } catch (error) {

      console.error(
        'Failed to delete job:',
        error
      );


      this.toast.error(
        'Unable to delete the job. Please try again.'
      );

    }

  }


  // =========================================================
  // Status Counts
  // =========================================================

  protected activeCount(): number {

    return this.jobs().filter(
      (job) =>
        job.status === 'active'
    ).length;

  }


  protected draftCount(): number {

    return this.jobs().filter(
      (job) =>
        job.status === 'draft'
    ).length;

  }


  protected closedCount(): number {

    return this.jobs().filter(
      (job) =>
        job.status === 'closed'
    ).length;

  }


  // =========================================================
  // Display Helpers
  // =========================================================

  protected formatEmploymentType(
    value: Job['employmentType']
  ): string {

    const labels: Record<
      Job['employmentType'],
      string
    > = {

      'full-time':
        'Full-time',

      'part-time':
        'Part-time',

      contract:
        'Contract',

      internship:
        'Internship',

      temporary:
        'Temporary',

    };


    return labels[value];

  }


  protected formatStatus(
    value: Job['status']
  ): string {

    const labels: Record<
      Job['status'],
      string
    > = {

      draft:
        'Draft',

      active:
        'Active',

      closed:
        'Closed',

    };


    return labels[value];

  }


  protected statusClasses(
    value: Job['status']
  ): string {

    if (
      value ===
      'active'
    ) {

      return `
        inline-flex
        rounded-full
        bg-green-100
        px-2.5 py-1
        text-xs
        font-semibold
        text-green-700
      `;

    }


    if (
      value ===
      'draft'
    ) {

      return `
        inline-flex
        rounded-full
        bg-yellow-100
        px-2.5 py-1
        text-xs
        font-semibold
        text-yellow-700
      `;

    }


    return `
      inline-flex
      rounded-full
      bg-gray-100
      px-2.5 py-1
      text-xs
      font-semibold
      text-gray-600
    `;

  }


  protected formatLocation(
    job: Job
  ): string {

    const city =
      job.location?.city?.trim();

    const state =
      job.location?.state?.trim();


    if (
      city &&
      state
    ) {

      return `${city}, ${state}`;

    }


    if (city) {

      return city;

    }


    if (state) {

      return state;

    }


    if (
      job.workArrangement ===
      'remote'
    ) {

      return 'Remote';

    }


    return 'Not specified';

  }


  protected truncate(
    value: string | undefined,
    maxLength: number
  ): string {

    if (!value) {

      return '';

    }


    const text =
      value.trim();


    if (
      text.length <=
      maxLength
    ) {

      return text;

    }


    return (
      text.substring(
        0,
        maxLength
      ).trimEnd() +
      '...'
    );

  }


  // =========================================================
  // Sign Out
  // =========================================================

  protected async signOut(): Promise<void> {

    try {

      await this.authService.logout();


      this.toast.success(
        'You have been signed out.'
      );


      await this.router.navigate(
        ['/login']
      );

    } catch (error) {

      console.error(
        'Failed to sign out:',
        error
      );


      this.toast.error(
        'Unable to sign out. Please try again.'
      );

    }

  }

}