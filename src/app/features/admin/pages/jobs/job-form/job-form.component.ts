import { Component, OnInit, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Timestamp } from 'firebase/firestore';

import {
  Job,
  EmploymentType,
  WorkArrangement,
  JobStatus,
} from '../../../../../core/models/job.model';

import { Organization } from '../../../../../core/models/organization.model';

import { JobService } from '../../../../../core/services/job.service';

import { AuthService } from '../../../../../core/services/auth.service';

import { OrganizationService } from '../../../../../core/services/organization.service';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-job-form',

  standalone: true,

  imports: [ReactiveFormsModule, RouterLink],

  template: `
    <!-- =====================================================
         Main Page Wrapper
         ===================================================== -->
    <main
      class="min-h-screen
             bg-gray-50"
    >
      <!-- =====================================================
           Page Header
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
              Zebron Jobs
            </p>

            <h1
              class="text-xl
                     font-bold
                     text-white
                     sm:text-3xl"
            >
              {{ isEditMode() ? 'Edit Job' : 'Create Job' }}
            </h1>

            <p
              class="mt-1
                     text-sm
                     text-white/80"
            >
              @if (isEditMode()) {
                Update the job opportunity and keep its information current.
              } @else {
                Add a job opportunity for people to discover through Zebron.
              }
            </p>
          </div>

          <!-- Header Actions -->
          <div
            class="flex
                   shrink-0
                   items-center
                   gap-2"
          >
            <!-- Dashboard hidden on mobile -->
            <a
              routerLink="/admin"
              class="hidden
                     items-center
                     rounded-lg
                     border
                     border-white/20
                     bg-white/10
                     px-3 py-2
                     text-sm
                     font-semibold
                     text-white
                     transition
                     hover:bg-white/20
                     sm:inline-flex"
            >
              Dashboard
            </a>

            <a
              routerLink="/admin/jobs"
              class="inline-flex
                     items-center
                     rounded-lg
                     border
                     border-gray-300
                     bg-white
                     px-3 py-2
                     text-sm
                     font-semibold
                     text-gray-700
                     shadow-sm
                     transition
                     hover:border-[#7ED6D1]
                     hover:text-[#032D42]"
            >
              ← Jobs
            </a>
          </div>
        </div>
      </header>

      <!-- =====================================================
           Loading Existing Job
           ===================================================== -->
      @if (loadingJob()) {
        <div
          class="mx-auto
                 max-w-7xl
                 px-4 py-12
                 text-center
                 sm:px-6
                 lg:px-8"
        >
          <div
            class="inline-flex
                   items-center
                   gap-3
                   rounded-lg
                   border
                   border-gray-200
                   bg-white
                   px-5 py-4
                   text-sm
                   text-gray-600
                   shadow-sm"
          >
            <span
              class="h-4 w-4
                     animate-spin
                     rounded-full
                     border-2
                     border-gray-300
                     border-t-[#007979]"
            ></span>

            Loading job...
          </div>
        </div>
      }

      <!-- =====================================================
           Error Loading Job
           ===================================================== -->
      @if (loadError()) {
        <div
          class="mx-auto
                 max-w-3xl
                 px-4 py-10
                 sm:px-6"
        >
          <div
            class="rounded-xl
                   border
                   border-red-200
                   bg-red-50
                   p-5"
          >
            <h2
              class="font-semibold
                     text-red-800"
            >
              Unable to load job
            </h2>

            <p
              class="mt-1
                     text-sm
                     text-red-700"
            >
              {{ loadError() }}
            </p>

            <a
              routerLink="/admin/jobs"
              class="mt-4
                     inline-flex
                     rounded-lg
                     bg-[#032D42]
                     px-4 py-2
                     text-sm
                     font-semibold
                     text-white"
            >
              Return to Jobs
            </a>
          </div>
        </div>
      }

      <!-- =====================================================
           Form
           ===================================================== -->
      @if (!loadingJob() && !loadError()) {
        <div
          class="mx-auto
                 max-w-7xl
                 px-4 py-8
                 sm:px-6
                 lg:px-8"
        >
          <form [formGroup]="jobForm" (ngSubmit)="saveJob()" class="space-y-6">
            <!-- =================================================
                 Job Details
                 ================================================= -->
            <section
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <div
                class="border-b
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold
                         text-[#032D42]"
                >
                  Job Details
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-gray-500"
                >
                  Provide the basic information about the opportunity.
                </p>
              </div>

              <div
                class="grid
                       gap-6
                       px-5 py-5
                       lg:grid-cols-2
                       sm:px-6"
              >
                <!-- LEFT -->
                <div class="space-y-6">
                  <!-- Job Title -->
                  <div>
                    <label
                      for="title"
                      class="block
                             text-sm
                             font-medium
                             text-gray-700"
                    >
                      Job title
                      <span class="text-red-500">*</span>
                    </label>

                    <input
                      id="title"
                      type="text"
                      formControlName="title"
                      placeholder="e.g. Junior Software Developer"
                      class="mt-1.5 block
                             w-full
                             rounded-lg
                             border
                             border-gray-300
                             bg-white
                             px-3 py-2.5
                             text-sm
                             text-gray-900
                             outline-none
                             transition
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    />

                    @if (jobForm.controls.title.touched && jobForm.controls.title.invalid) {
                      <p
                        class="mt-1.5
                               text-xs
                               text-red-600"
                      >
                        Job title is required.
                      </p>
                    }
                  </div>

                  <!-- Description -->
                  <div>
                    <label
                      for="description"
                      class="block
                             text-sm
                             font-medium
                             text-gray-700"
                    >
                      Description
                      <span class="text-red-500">*</span>
                    </label>

                    <textarea
                      id="description"
                      rows="13"
                      formControlName="description"
                      placeholder="Describe the position, responsibilities, qualifications, and other relevant details."
                      class="mt-1.5 block
                             w-full
                             resize-y
                             rounded-lg
                             border
                             border-gray-300
                             bg-white
                             px-3 py-2.5
                             text-sm
                             leading-6
                             text-gray-900
                             outline-none
                             transition
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    ></textarea>

                    @if (
                      jobForm.controls.description.touched && jobForm.controls.description.invalid
                    ) {
                      <p
                        class="mt-1.5
                               text-xs
                               text-red-600"
                      >
                        Job description is required and must contain at least 20 characters.
                      </p>
                    }
                  </div>
                </div>

                <!-- RIGHT -->
                <div>
                  <section
                    class="rounded-xl
                           border
                           border-gray-200
                           bg-white
                           shadow-sm"
                  >
                    <div
                      class="border-b
                             border-gray-100
                             px-5 py-4"
                    >
                      <h2
                        class="text-base
                               font-semibold
                               text-[#032D42]"
                      >
                        Organization
                      </h2>

                      <p
                        class="mt-1
                               text-sm
                               text-gray-500"
                      >
                        Use the business number to find the organization.
                      </p>
                    </div>

                    <div
                      class="space-y-5
                             px-5 py-5"
                    >
                      <!-- Business Number -->
                      <div>
                        <label
                          for="companyNumber"
                          class="block
                                 text-sm
                                 font-medium
                                 text-gray-700"
                        >
                          Business / Registration Number
                        </label>

                        <div
                          class="mt-1.5
                                 flex
                                 gap-2"
                        >
                          <input
                            id="companyNumber"
                            type="text"
                            formControlName="companyNumber"
                            placeholder="e.g. ZEBRON-TEST-001"
                            [readonly]="
                              isEditMode() && organizationFound() && !organizationEditing()
                            "
                            class="min-w-0
                                   flex-1
                                   rounded-lg
                                   border
                                   border-gray-300
                                   bg-white
                                   px-3 py-2.5
                                   text-sm
                                   outline-none
                                   focus:border-[#007979]
                                   focus:ring-2
                                   focus:ring-[#007979]/20
                                   read-only:cursor-not-allowed
                                   read-only:bg-gray-50"
                          />

                          <button
                            type="button"
                            (click)="findOrganization()"
                            [disabled]="organizationLookupLoading()"
                            class="inline-flex
                                   shrink-0
                                   items-center
                                   justify-center
                                   rounded-lg
                                   bg-[#007979]
                                   px-4 py-2.5
                                   text-sm
                                   font-semibold
                                   text-white
                                   transition
                                   hover:bg-[#006666]
                                   disabled:cursor-not-allowed
                                   disabled:opacity-60"
                          >
                            @if (organizationLookupLoading()) {
                              Searching...
                            } @else {
                              Find
                            }
                          </button>
                        </div>

                        @if (organizationLookupMessage()) {
                          <div
                            class="mt-3
                                   rounded-lg
                                   border
                                   border-[#007979]/20
                                   bg-[#007979]/5
                                   px-3 py-2.5"
                          >
                            <p
                              class="text-sm
                                     text-[#007979]"
                            >
                              {{ organizationLookupMessage() }}
                            </p>
                          </div>
                        }

                        @if (organizationLookupError()) {
                          <div
                            class="mt-3
                                   rounded-lg
                                   border
                                   border-red-200
                                   bg-red-50
                                   px-3 py-2.5"
                          >
                            <p
                              class="text-sm
                                     text-red-600"
                            >
                              {{ organizationLookupError() }}
                            </p>
                          </div>
                        }
                      </div>

                      <!-- Organization Name -->
                      <div>
                        <label
                          for="companyName"
                          class="block
                                 text-sm
                                 font-medium
                                 text-gray-700"
                        >
                          Organization Name
                          <span class="text-red-500">*</span>
                        </label>

                        <input
                          id="companyName"
                          type="text"
                          formControlName="companyName"
                          [readonly]="organizationFound() && !organizationEditing()"
                          class="mt-1.5 block
                                 w-full
                                 rounded-lg
                                 border
                                 border-gray-300
                                 px-3 py-2.5
                                 text-sm
                                 text-gray-900
                                 outline-none
                                 read-only:cursor-not-allowed
                                 read-only:bg-gray-50
                                 focus:border-[#007979]
                                 focus:ring-2
                                 focus:ring-[#007979]/20"
                        />
                      </div>

                      <!-- Organization Information -->
                      @if (organization()) {
                        <div
                          class="space-y-4
                                 rounded-xl
                                 border
                                 border-gray-200
                                 bg-gray-50
                                 p-4"
                        >
                          <!-- Heading -->
                          <div
                            class="flex
                                   items-start
                                   justify-between
                                   gap-4"
                          >
                            <div>
                              <p
                                class="text-sm
                                       font-semibold
                                       text-[#032D42]"
                              >
                                Organization Information
                              </p>

                              <p
                                class="mt-0.5
                                       text-xs
                                       text-gray-500"
                              >
                                Retrieved from the organization record.
                              </p>
                            </div>

                            <div
                              class="flex
                                     shrink-0
                                     items-center
                                     gap-3"
                            >
                              <label
                                class="inline-flex
                                       cursor-pointer
                                       items-center
                                       gap-2
                                       text-xs
                                       font-medium
                                       text-gray-600"
                              >
                                <input
                                  type="checkbox"
                                  [checked]="organizationEditing()"
                                  (change)="toggleOrganizationEditing()"
                                  class="h-4 w-4
                                         rounded
                                         border-gray-300
                                         text-[#007979]
                                         focus:ring-[#007979]"
                                />

                                <span> Edit </span>
                              </label>

                              <span
                                class="inline-flex
                                       items-center
                                       gap-1
                                       rounded-full
                                       bg-[#007979]/10
                                       px-2.5 py-1
                                       text-xs
                                       font-semibold
                                       text-[#007979]"
                              >
                                ✓ Found
                              </span>
                            </div>
                          </div>

                          <!-- Website -->
                          <div>
                            <p
                              class="text-xs
                                     font-semibold
                                     uppercase
                                     tracking-wide
                                     text-gray-500"
                            >
                              Website
                            </p>

                            @if (organizationEditing()) {
                              <input
                                type="url"
                                formControlName="organizationWebsite"
                                placeholder="https://example.org"
                                class="mt-1.5 block
                                       w-full
                                       rounded-lg
                                       border
                                       border-gray-300
                                       bg-white
                                       px-3 py-2.5
                                       text-sm
                                       outline-none
                                       focus:border-[#007979]
                                       focus:ring-2
                                       focus:ring-[#007979]/20"
                              />
                            } @else {
                              <p
                                class="mt-1
                                       break-all
                                       text-sm
                                       text-gray-800"
                              >
                                {{ organization()?.website || 'Not provided' }}
                              </p>
                            }
                          </div>

                          <!-- Phone -->
                          <div>
                            <p
                              class="text-xs
                                     font-semibold
                                     uppercase
                                     tracking-wide
                                     text-gray-500"
                            >
                              Phone
                            </p>

                            @if (organizationEditing()) {
                              <input
                                type="tel"
                                formControlName="organizationPhone"
                                placeholder="555-555-5555"
                                class="mt-1.5 block
                                       w-full
                                       rounded-lg
                                       border
                                       border-gray-300
                                       bg-white
                                       px-3 py-2.5
                                       text-sm
                                       outline-none
                                       focus:border-[#007979]
                                       focus:ring-2
                                       focus:ring-[#007979]/20"
                              />
                            } @else {
                              <p
                                class="mt-1
                                       text-sm
                                       text-gray-800"
                              >
                                {{ organization()?.phone || 'Not provided' }}
                              </p>
                            }
                          </div>

                          <!-- Email -->
                          <div>
                            <p
                              class="text-xs
                                     font-semibold
                                     uppercase
                                     tracking-wide
                                     text-gray-500"
                            >
                              Email
                            </p>

                            @if (organizationEditing()) {
                              <input
                                type="email"
                                formControlName="organizationEmail"
                                placeholder="contact@example.org"
                                class="mt-1.5 block
                                       w-full
                                       rounded-lg
                                       border
                                       border-gray-300
                                       bg-white
                                       px-3 py-2.5
                                       text-sm
                                       outline-none
                                       focus:border-[#007979]
                                       focus:ring-2
                                       focus:ring-[#007979]/20"
                              />
                            } @else {
                              <p
                                class="mt-1
                                       break-all
                                       text-sm
                                       text-gray-800"
                              >
                                {{ organization()?.email || 'Not provided' }}
                              </p>
                            }
                          </div>

                          <!-- Business Number -->
                          <div>
                            <p
                              class="text-xs
                                     font-semibold
                                     uppercase
                                     tracking-wide
                                     text-gray-500"
                            >
                              Business / Registration Number
                            </p>

                            <p
                              class="mt-1
                                     text-sm
                                     font-medium
                                     text-[#032D42]"
                            >
                              {{ organization()?.companyNumber || 'Not provided' }}
                            </p>
                          </div>

                          <!-- Verification -->
                          <div>
                            <p
                              class="text-xs
                                     font-semibold
                                     uppercase
                                     tracking-wide
                                     text-gray-500"
                            >
                              Verification
                            </p>

                            <p
                              class="mt-1
                                     text-sm
                                     font-medium
                                     text-gray-800"
                            >
                              @if (organization()?.verified) {
                                Verified
                              } @else {
                                Not verified
                              }
                            </p>
                          </div>

                          @if (organizationEditing()) {
                            <div
                              class="rounded-lg
                                     border
                                     border-[#007979]/20
                                     bg-white
                                     px-3 py-2.5"
                            >
                              <p
                                class="text-xs
                                       font-medium
                                       text-[#007979]"
                              >
                                Organization editing is enabled. Changes will be saved to the
                                organization record when you update the job.
                              </p>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </section>
                </div>
              </div>
            </section>

            <!-- =================================================
                 Employment
                 ================================================= -->
            <section
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <div
                class="border-b
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold
                         text-[#032D42]"
                >
                  Employment
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-gray-500"
                >
                  Define how and where the job is performed.
                </p>
              </div>

              <div
                class="grid
                       gap-5
                       px-5 py-5
                       sm:grid-cols-3
                       sm:px-6"
              >
                <!-- Employment Type -->
                <div>
                  <label
                    for="employmentType"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Employment type
                    <span class="text-red-500">*</span>
                  </label>

                  <select
                    id="employmentType"
                    formControlName="employmentType"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  >
                    <option value="">Select type</option>

                    <option value="full-time">Full-time</option>

                    <option value="part-time">Part-time</option>

                    <option value="contract">Contract</option>

                    <option value="internship">Internship</option>

                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                <!-- Work Arrangement -->
                <div>
                  <label
                    for="workArrangement"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Work arrangement
                    <span class="text-red-500">*</span>
                  </label>

                  <select
                    id="workArrangement"
                    formControlName="workArrangement"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  >
                    <option value="">Select arrangement</option>

                    <option value="on-site">On-site</option>

                    <option value="hybrid">Hybrid</option>

                    <option value="remote">Remote</option>
                  </select>
                </div>

                <!-- Category -->
                <div>
                  <label
                    for="categoryName"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Category
                    <span class="text-red-500">*</span>
                  </label>

                  <select
                    id="categoryName"
                    formControlName="categoryName"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  >
                    <option value="">Select category</option>

                    <option value="Technology & IT">Technology & IT</option>

                    <option value="Healthcare">Healthcare</option>

                    <option value="Business & Finance">Business & Finance</option>

                    <option value="Skilled Trades">Skilled Trades</option>

                    <option value="Administrative">Administrative</option>

                    <option value="Customer Service">Customer Service</option>

                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- =================================================
                 Location & Compensation
                 ================================================= -->
            <section
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <div
                class="border-b
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold
                         text-[#032D42]"
                >
                  Location & Compensation
                </h2>
              </div>

              <div
                class="grid
                       gap-5
                       px-5 py-5
                       sm:grid-cols-2
                       lg:grid-cols-4
                       sm:px-6"
              >
                <div>
                  <label
                    for="city"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    formControlName="city"
                    placeholder="e.g. Washington"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="state"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    type="text"
                    formControlName="state"
                    placeholder="e.g. DC"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="salaryMin"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Minimum salary
                  </label>

                  <input
                    id="salaryMin"
                    type="number"
                    min="0"
                    formControlName="salaryMin"
                    placeholder="e.g. 60000"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div>
                  <label
                    for="salaryMax"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Maximum salary
                  </label>

                  <input
                    id="salaryMax"
                    type="number"
                    min="0"
                    formControlName="salaryMax"
                    placeholder="e.g. 90000"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>
            </section>

            <!-- =================================================
                 Skills & Application
                 ================================================= -->
            <section
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <div
                class="border-b
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold
                         text-[#032D42]"
                >
                  Skills & Application
                </h2>
              </div>

              <div
                class="grid
                       gap-5
                       px-5 py-5
                       sm:px-6"
              >
                <div>
                  <label
                    for="skills"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Skills
                  </label>

                  <input
                    id="skills"
                    type="text"
                    formControlName="skills"
                    placeholder="e.g. JavaScript, Angular, Firebase"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />

                  <p
                    class="mt-1.5
                           text-xs
                           text-gray-500"
                  >
                    Separate skills with commas.
                  </p>
                </div>

                <div>
                  <label
                    for="tags"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Tags
                  </label>

                  <input
                    id="tags"
                    type="text"
                    formControlName="tags"
                    placeholder="e.g. entry-level, remote, cleared"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />

                  <p
                    class="mt-1.5
                           text-xs
                           text-gray-500"
                  >
                    Separate tags with commas.
                  </p>
                </div>

                <div>
                  <label
                    for="applicationUrl"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Application URL
                    <span class="text-red-500">*</span>
                  </label>

                  <input
                    id="applicationUrl"
                    type="url"
                    formControlName="applicationUrl"
                    placeholder="https://example.com/apply"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>

                <div class="sm:max-w-xs">
                  <label
                    for="applicationDeadline"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Application deadline
                  </label>

                  <input
                    id="applicationDeadline"
                    type="date"
                    formControlName="applicationDeadline"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  />
                </div>
              </div>
            </section>

            <!-- =================================================
                 Publishing
                 ================================================= -->
            <section
              class="rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <div
                class="border-b
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold
                         text-[#032D42]"
                >
                  Publishing
                </h2>
              </div>

              <div
                class="grid
                       gap-5
                       px-5 py-5
                       sm:grid-cols-2
                       sm:px-6"
              >
                <div>
                  <label
                    for="status"
                    class="block
                           text-sm
                           font-medium
                           text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="status"
                    formControlName="status"
                    class="mt-1.5 block
                           w-full
                           rounded-lg
                           border
                           border-gray-300
                           bg-white
                           px-3 py-2.5
                           text-sm
                           outline-none
                           focus:border-[#007979]
                           focus:ring-2
                           focus:ring-[#007979]/20"
                  >
                    <option value="draft">Draft</option>

                    <option value="active">Active</option>

                    <option value="closed">Closed</option>
                  </select>
                </div>

                <label
                  class="flex
                         cursor-pointer
                         items-center
                         gap-3
                         rounded-lg
                         border
                         border-gray-200
                         px-4 py-3
                         hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    formControlName="featured"
                    class="h-4 w-4
                           rounded
                           border-gray-300
                           text-[#007979]
                           focus:ring-[#007979]"
                  />

                  <span>
                    <span
                      class="block
                             text-sm
                             font-medium
                             text-gray-800"
                    >
                      Featured job
                    </span>

                    <span
                      class="block
                             text-xs
                             text-gray-500"
                    >
                      Give this opportunity additional visibility.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <!-- =================================================
                 Actions
                 ================================================= -->
            <div
              class="flex
                     flex-col-reverse
                     gap-3
                     sm:flex-row
                     sm:justify-end"
            >
              <a
                routerLink="/admin/jobs"
                class="inline-flex
                       items-center
                       justify-center
                       rounded-lg
                       border
                       border-gray-300
                       bg-white
                       px-5 py-2.5
                       text-sm
                       font-semibold
                       text-gray-700
                       transition
                       hover:bg-gray-50"
              >
                Cancel
              </a>

              <button
                type="submit"
                [disabled]="jobForm.invalid || saving()"
                class="inline-flex
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]
                       px-5 py-2.5
                       text-sm
                       font-semibold
                       text-white
                       shadow-sm
                       transition
                       hover:bg-[#006666]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (saving()) {
                  @if (isEditMode()) {
                    Updating...
                  } @else {
                    Saving...
                  }
                } @else {
                  @if (isEditMode()) {
                    Update Job
                  } @else {
                    Save Job
                  }
                }
              </button>
            </div>

            <!-- Validation -->
            @if (submitted() && jobForm.invalid) {
              <p
                class="text-right
                       text-sm
                       font-medium
                       text-red-600"
              >
                Please complete all required fields.
              </p>
            }
          </form>
        </div>
      }
    </main>
  `,
})
export class JobFormComponent implements OnInit {
  // =========================================================
  // Services
  // =========================================================

  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  private readonly jobService = inject(JobService);

  private readonly authService = inject(AuthService);

  private readonly organizationService = inject(OrganizationService);

  private readonly toast = inject(HotToastService);

  // =========================================================
  // Edit State
  // =========================================================

  protected readonly jobId = signal<string | null>(null);

  protected readonly isEditMode = signal(false);

  protected readonly loadingJob = signal(false);

  protected readonly loadError = signal('');

  // =========================================================
  // General State
  // =========================================================

  protected readonly saving = signal(false);

  protected readonly submitted = signal(false);

  // =========================================================
  // Organization State
  // =========================================================

  protected readonly organization = signal<Organization | null>(null);

  protected readonly organizationFound = signal(false);

  protected readonly organizationEditing = signal(false);

  protected readonly organizationLookupLoading = signal(false);

  protected readonly organizationLookupMessage = signal('');

  protected readonly organizationLookupError = signal('');

  // =========================================================
  // Job Form
  // =========================================================

  protected readonly jobForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],

    companyNumber: [''],

    companyName: ['', [Validators.required, Validators.maxLength(150)]],

    organizationWebsite: [''],

    organizationPhone: [''],

    organizationEmail: [''],

    description: ['', [Validators.required, Validators.minLength(20)]],

    employmentType: ['', Validators.required],

    workArrangement: ['', Validators.required],

    categoryName: ['', Validators.required],

    city: [''],

    state: [''],

    salaryMin: [''],

    salaryMax: [''],

    skills: [''],

    tags: [''],

    applicationUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],

    applicationDeadline: [''],

    status: ['draft', Validators.required],

    featured: [false],
  });

  // =========================================================
  // Initialization
  // =========================================================

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      /*
       * /admin/jobs/new
       */
      this.isEditMode.set(false);

      return;
    }

    /*
     * /admin/jobs/:id/edit
     */
    this.jobId.set(id);

    this.isEditMode.set(true);

    void this.loadExistingJob(id);
  }

  // =========================================================
  // Load Existing Job
  // =========================================================

  private async loadExistingJob(id: string): Promise<void> {
    this.loadingJob.set(true);

    this.loadError.set('');

    try {
      const job = await this.jobService.getJob(id);

      if (!job) {
        this.loadError.set('The requested job could not be found.');

        return;
      }

      /*
       * Populate the complete form.
       */
      this.jobForm.patchValue({
        title: job.title ?? '',

        companyName: job.organizationName ?? '',

        companyNumber: '',

        description: job.description ?? '',

        employmentType: job.employmentType ?? '',

        workArrangement: job.workArrangement ?? '',

        categoryName: job.categoryName ?? '',

        city: job.location?.city ?? '',

        state: job.location?.state ?? '',

        salaryMin: job.compensation?.min != null ? String(job.compensation.min) : '',

        salaryMax: job.compensation?.max != null ? String(job.compensation.max) : '',

        skills: (job.skills ?? []).join(', '),

        tags: (job.tags ?? []).join(', '),

        applicationUrl: job.applicationUrl ?? '',

        applicationDeadline: this.timestampToDateInput(job.applicationDeadline),

        status: job.status ?? 'draft',

        featured: job.featured ?? false,
      });

      /*
       * Load the organization attached to the job.
       */
      if (job.organizationId) {
        const organization = await this.organizationService.getOrganizationById(job.organizationId);

        if (organization) {
          this.organization.set(organization);

          this.organizationFound.set(true);

          /*
           * Populate organization fields.
           */
          this.jobForm.patchValue({
            companyNumber: organization.companyNumber ?? '',

            companyName: organization.name ?? '',

            organizationWebsite: organization.website ?? '',

            organizationPhone: organization.phone ?? '',

            organizationEmail: organization.email ?? '',
          });
        }
      }

      /*
       * Organization starts locked.
       */
      this.organizationEditing.set(false);
    } catch (error) {
      console.error('Failed to load job:', error);

      this.loadError.set('An error occurred while loading the job.');
    } finally {
      this.loadingJob.set(false);
    }
  }

  // =========================================================
  // Organization Lookup
  // =========================================================

  protected async findOrganization(): Promise<void> {
    const companyNumber = this.jobForm.controls.companyNumber.value.trim();

    if (!companyNumber) {
      this.organization.set(null);

      this.organizationFound.set(false);

      this.organizationLookupError.set('Enter a business or registration number.');

      this.organizationLookupMessage.set('');

      return;
    }

    this.organizationLookupLoading.set(true);

    this.organizationLookupError.set('');

    this.organizationLookupMessage.set('');

    try {
      const organization =
        await this.organizationService.findOrganizationByCompanyNumber(companyNumber);

      if (!organization) {
        this.organization.set(null);

        this.organizationFound.set(false);

        this.organizationEditing.set(false);

        this.organizationLookupMessage.set(
          'Organization not found. Enter the organization name manually.',
        );

        this.jobForm.patchValue({
          companyName: '',

          organizationWebsite: '',

          organizationPhone: '',

          organizationEmail: '',
        });

        return;
      }

      /*
       * Existing organization found.
       */
      this.organization.set(organization);

      this.organizationFound.set(true);

      this.organizationEditing.set(false);

      this.jobForm.patchValue({
        companyNumber: organization.companyNumber ?? companyNumber,

        companyName: organization.name ?? '',

        organizationWebsite: organization.website ?? '',

        organizationPhone: organization.phone ?? '',

        organizationEmail: organization.email ?? '',
      });

      this.organizationLookupMessage.set(
        'Organization found. The organization information has been populated from the existing record.',
      );
    } catch (error) {
      console.error('Organization lookup failed:', error);

      this.organization.set(null);

      this.organizationFound.set(false);

      this.organizationLookupError.set('Unable to look up the organization. Please try again.');
    } finally {
      this.organizationLookupLoading.set(false);
    }
  }

  // =========================================================
  // Organization Editing
  // =========================================================

  protected toggleOrganizationEditing(): void {
    const editing = !this.organizationEditing();

    this.organizationEditing.set(editing);

    if (!editing) {
      return;
    }

    const organization = this.organization();

    if (!organization) {
      return;
    }

    this.jobForm.patchValue({
      companyNumber: organization.companyNumber ?? '',

      organizationWebsite: organization.website ?? '',

      organizationPhone: organization.phone ?? '',

      organizationEmail: organization.email ?? '',
    });
  }

  // =========================================================
  // Save / Update
  // =========================================================

  protected async saveJob(): Promise<void> {
    this.submitted.set(true);

    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();

      return;
    }

    const firebaseUser = this.authService.firebaseUser();

    if (!firebaseUser) {
      console.error('No authenticated Firebase user found.');

      return;
    }

    if (!this.authService.isAdmin) {
      console.error('Only administrators can create or update jobs.');

      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.jobForm.getRawValue();

      /*
       * =====================================================
       * EDIT EXISTING JOB
       * =====================================================
       */
      if (this.isEditMode()) {
        const id = this.jobId();

        if (!id) {
          throw new Error('No job ID was supplied for edit mode.');
        }

        /*
         * Retrieve the existing job so we preserve
         * organizationId and createdBy.
         */
        const existingJob = await this.jobService.getJob(id);

        if (!existingJob) {
          throw new Error('The job being edited no longer exists.');
        }

        /*
         * Keep the existing organization relationship.
         */
        let organizationId = existingJob.organizationId;

        let organizationName = existingJob.organizationName;

        /*
         * If the administrator intentionally changes
         * the organization, look it up using the
         * supplied business number.
         */
        if (
          this.organizationEditing() &&
          formValue.companyNumber.trim() &&
          formValue.companyNumber.trim() !== (this.organization()?.companyNumber ?? '')
        ) {
          const replacementOrganization =
            await this.organizationService.findOrganizationByCompanyNumber(
              formValue.companyNumber.trim(),
            );

          if (!replacementOrganization) {
            throw new Error('The new organization could not be found.');
          }

          organizationId = replacementOrganization.id;

          organizationName = replacementOrganization.name;
        }

        /*
         * Build only Job fields.
         */
        const changes: Partial<Job> = {
          title: formValue.title.trim(),

          organizationId: organizationId,

          organizationName: organizationName,

          description: formValue.description.trim(),

          employmentType: formValue.employmentType as EmploymentType,

          workArrangement: formValue.workArrangement as WorkArrangement,

          categoryName: formValue.categoryName || undefined,

         location: {
          city:
            formValue.city?.trim() ?? '',

          state:
            formValue.state?.trim() ?? '',

          country:
            'United States',
        },

          compensation: this.buildCompensation(formValue.salaryMin, formValue.salaryMax),

          skills: this.parseList(formValue.skills),

          tags: this.parseList(formValue.tags),

          applicationUrl: formValue.applicationUrl.trim(),

          applicationDeadline: formValue.applicationDeadline
            ? Timestamp.fromDate(new Date(`${formValue.applicationDeadline}T00:00:00`))
            : null,

          status: formValue.status as JobStatus,

          featured: formValue.featured,
        };

        /*
         * Update the job.
         */
        await this.jobService.updateJob(id, changes);

        /*
         * If organization information was explicitly
         * edited, update the organization record too.
         */
        if (this.organizationEditing() && this.organization()) {
          const organization = this.organization();

          await this.organizationService.updateOrganization(organization!.id, {
            name: formValue.companyName.trim(),

            companyNumber: formValue.companyNumber.trim(),

            website: formValue.organizationWebsite.trim(),

            phone: formValue.organizationPhone.trim(),

            email: formValue.organizationEmail.trim(),
          });
        }

        console.log('Job updated successfully:', id);

        await this.router.navigate(['/admin/jobs']);

        return;
      }

      /*
       * =====================================================
       * CREATE NEW JOB
       * =====================================================
       */

      const organization = await this.organizationService.findOrCreateOrganization(
        formValue.companyName.trim(),
        formValue.companyNumber.trim(),
      );

      const job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formValue.title.trim(),

        organizationId: organization.id,

        organizationName: organization.name,

        description: formValue.description.trim(),

        employmentType: formValue.employmentType as EmploymentType,

        workArrangement: formValue.workArrangement as WorkArrangement,

        categoryName: formValue.categoryName || undefined,

       location: {
        city:
          formValue.city?.trim() ?? '',

        state:
          formValue.state?.trim() ?? '',

        country:
          'United States',
      },

        compensation: this.buildCompensation(formValue.salaryMin, formValue.salaryMax),

        skills: this.parseList(formValue.skills),

        tags: this.parseList(formValue.tags),

        applicationUrl: formValue.applicationUrl.trim(),

        applicationDeadline: formValue.applicationDeadline
          ? Timestamp.fromDate(new Date(`${formValue.applicationDeadline}T00:00:00`))
          : null,

        status: formValue.status as JobStatus,

        featured: formValue.featured,

        createdBy: firebaseUser.uid,
      };

      const jobId = await this.jobService.createJob(job);

      // console.log(
      //   'Job created successfully:',
      //   jobId
      // );

      this.toast.success('Job created successfully.');

      await this.router.navigate(['/admin/jobs']);
    } catch (error) {
      console.error(this.isEditMode() ? 'Failed to update job:' : 'Failed to create job:', error);

      this.toast.error(
        this.isEditMode()
          ? 'Unable to update the job. Please try again.'
          : 'Unable to create the job. Please try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // =========================================================
  // Compensation
  // =========================================================

  private buildCompensation(salaryMin: string, salaryMax: string): Job['compensation'] {
    const min = salaryMin.trim() ? Number(salaryMin) : undefined;

    const max = salaryMax.trim() ? Number(salaryMax) : undefined;

    /*
     * Avoid undefined properties being sent to
     * Firestore.
     */
    if (min === undefined && max === undefined) {
      return {
        currency: 'USD',
        period: 'year',
      };
    }

    return {
      ...(min !== undefined ? { min } : {}),

      ...(max !== undefined ? { max } : {}),

      currency: 'USD',

      period: 'year',
    };
  }

  // =========================================================
  // Timestamp -> HTML Date
  // =========================================================

  private timestampToDateInput(timestamp?: Timestamp | null): string {
    if (!timestamp) {
      return '';
    }

    const date = timestamp.toDate();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // Comma-separated fields
  // =========================================================

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
