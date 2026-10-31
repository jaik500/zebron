import { Component, OnInit, inject, input, output, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Timestamp } from 'firebase/firestore';

import {
  Job,
  JobCompensation,
  JobStatus,
  EmploymentType,
  WorkArrangement,
} from '../../../../../core/models/job.model';

import { Organization } from '../../../../../core/models/organization.model';

import { JobStore } from '../../../../jobs/stores/job.store';

import { AuthService } from '../../../../../core/services/auth.service';

import { OrganizationContextStore  } from '../../../../organizations/stores/organization-context.store';

import { HotToastService } from '@ngxpert/hot-toast';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
@Component({
  selector: 'app-job-form',

  standalone: true,

  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],

  template: `
    <!-- =====================================================
         Main Page Wrapper
         ===================================================== -->
    <main [class]="embedded() ? 'bg-transparent' : 'min-h-screen bg-gray-50'">
      <!-- =====================================================
           Page Header
           ===================================================== -->
      @if (!embedded()) {
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
      }

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
              (click)="onCancel($event)"
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
                       bg-[#66BB6A]/80
                       rounded-t-xl
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold"
                >
                  Job Details
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-[#032D42]"
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

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Job title</mat-label>
                      <input matInput
                      id="title"
                      type="text"
                      formControlName="title"
                      placeholder="e.g. Junior Software Developer"
                    />
                      @if (jobForm.controls.title.touched && jobForm.controls.title.invalid) {
                        <mat-error>Job title is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Description -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Description</mat-label>
                      <textarea matInput
                      id="description"
                      rows="13"
                      formControlName="description"
                      placeholder="Describe the position, responsibilities, qualifications, and other relevant details."
                    ></textarea>
                      @if (
                      jobForm.controls.description.touched && jobForm.controls.description.invalid
                    ) {
                        <mat-error>Job description is required and must contain at least 20 characters.</mat-error>
                      }
                    </mat-form-field>
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

                        <div
                          class="mt-1.5
                                 flex
                                 items-start
                                 gap-2"
                        >
                          <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                            <mat-label>Business / Registration Number</mat-label>
                            <input matInput
                            id="companyNumber"
                            type="text"
                            formControlName="companyNumber"
                            placeholder="e.g. ZEBRON-TEST-001"
                            [readonly]="
                              isEditMode() && organizationFound() && !organizationEditing()
                            "
                          />
                          </mat-form-field>

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
                                   h-14 px-4
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

                        <mat-form-field appearance="outline" class="zb-field">
                          <mat-label>Organization Name</mat-label>
                          <input matInput
                          id="companyName"
                          type="text"
                          formControlName="companyName"
                          [readonly]="organizationFound() && !organizationEditing()"
                        />
                        </mat-form-field>
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
                              <mat-checkbox [checked]="organizationEditing()" (change)="toggleOrganizationEditing()">Edit</mat-checkbox>

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
                              <mat-form-field appearance="outline" class="zb-field">
                                <mat-label>https://example.org</mat-label>
                                <input matInput
                                type="url"
                                formControlName="organizationWebsite"
                                placeholder="https://example.org"
                              />
                              </mat-form-field>
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
                              <mat-form-field appearance="outline" class="zb-field">
                                <mat-label>555-555-5555</mat-label>
                                <input matInput
                                type="tel"
                                formControlName="organizationPhone"
                                placeholder="555-555-5555"
                              />
                              </mat-form-field>
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
                              <mat-form-field appearance="outline" class="zb-field">
                                <mat-label>contact@example.org</mat-label>
                                <input matInput
                                type="email"
                                formControlName="organizationEmail"
                                placeholder="contact@example.org"
                              />
                              </mat-form-field>
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
                bg-[#66BB6A]/80
                       rounded-t-xl
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold"
                >
                  Employment
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-[#032D42]"
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

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Employment type</mat-label>
                    <mat-select
                    id="employmentType"
                    formControlName="employmentType"
                  >
                    <mat-option value="">Select type</mat-option>

                    <mat-option value="full-time">Full-time</mat-option>

                    <mat-option value="part-time">Part-time</mat-option>

                    <mat-option value="contract">Contract</mat-option>

                    <mat-option value="internship">Internship</mat-option>

                    <mat-option value="temporary">Temporary</mat-option>
                  </mat-select>
                  </mat-form-field>
                </div>

                <!-- Work Arrangement -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Work arrangement</mat-label>
                    <mat-select
                    id="workArrangement"
                    formControlName="workArrangement"
                  >
                    <mat-option value="">Select arrangement</mat-option>

                    <mat-option value="on-site">On-site</mat-option>

                    <mat-option value="hybrid">Hybrid</mat-option>

                    <mat-option value="remote">Remote</mat-option>
                  </mat-select>
                  </mat-form-field>
                </div>

                <!-- Category -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Category</mat-label>
                    <mat-select
                    id="categoryName"
                    formControlName="categoryName"
                  >
                    <mat-option value="">Select category</mat-option>

                    <mat-option value="Technology & IT">Technology & IT</mat-option>

                    <mat-option value="Healthcare">Healthcare</mat-option>

                    <mat-option value="Business & Finance">Business & Finance</mat-option>

                    <mat-option value="Skilled Trades">Skilled Trades</mat-option>

                    <mat-option value="Administrative">Administrative</mat-option>

                    <mat-option value="Customer Service">Customer Service</mat-option>

                    <mat-option value="Other">Other</mat-option>
                  </mat-select>
                  </mat-form-field>
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
                bg-[#66BB6A]/80
                       rounded-t-xl
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold"
                >
                  Location & Compensation
                </h2>
              </div>
              <div
                class="grid
         grid-cols-1
         py-4 px-6
         gap-4
         sm:grid-cols-2
         lg:grid-cols-[0.5fr_0.5fr_180px_180px_150px]"
              >
                <!-- City -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>City</mat-label>
                    <input matInput
                    id="city"
                    type="text"
                    formControlName="city"
                    placeholder="e.g. Washington"
                  />
                  </mat-form-field>
                </div>

                <!-- State -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>State</mat-label>
                    <input matInput
                    id="state"
                    type="text"
                    formControlName="state"
                    placeholder="e.g. DC"
                  />
                  </mat-form-field>
                </div>

                <!-- Minimum Salary -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Minimum salary</mat-label>
                    <input matInput
                    id="salaryMin"
                    type="number" inputmode="decimal"
                    min="0"
                    formControlName="salaryMin"
                    placeholder="e.g. 60000"
                  />
                  </mat-form-field>
                </div>

                <!-- Maximum Salary -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Maximum salary</mat-label>
                    <input matInput
                    id="salaryMax"
                    type="number" inputmode="decimal"
                    min="0"
                    formControlName="salaryMax"
                    placeholder="e.g. 90000"
                  />
                  </mat-form-field>
                </div>

                <!-- Pay Period -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Pay period</mat-label>
                    <mat-select
                    id="salaryPeriod"
                    formControlName="salaryPeriod"
                  >
                    <mat-option value="year">Yearly</mat-option>
                    <mat-option value="hour">Hourly</mat-option>
                  </mat-select>
                  </mat-form-field>
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
                bg-[#66BB6A]/80
                       rounded-t-xl
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold"
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

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Skills</mat-label>
                    <input matInput
                    id="skills"
                    type="text"
                    formControlName="skills"
                    placeholder="e.g. JavaScript, Angular, Firebase"
                  />
                  </mat-form-field>

                  <p
                    class="mt-1.5
                           text-xs
                           text-gray-500"
                  >
                    Separate skills with commas.
                  </p>
                </div>

                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Tags</mat-label>
                    <input matInput
                    id="tags"
                    type="text"
                    formControlName="tags"
                    placeholder="e.g. entry-level, remote, cleared"
                  />
                  </mat-form-field>

                  <p
                    class="mt-1.5
                           text-xs
                           text-gray-500"
                  >
                    Separate tags with commas.
                  </p>
                </div>

                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Application URL</mat-label>
                    <input matInput
                    id="applicationUrl"
                    type="url"
                    formControlName="applicationUrl"
                    placeholder="https://example.com/apply"
                  />
                  </mat-form-field>
                </div>

                <div class="sm:max-w-xs">

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Application deadline</mat-label>
                    <input matInput
                    id="applicationDeadline"
                    type="date"
                    formControlName="applicationDeadline"
                  />
                  </mat-form-field>
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
                bg-[#66BB6A]/80
                       rounded-t-xl
                       border-gray-100
                       px-5 py-4
                       sm:px-6"
              >
                <h2
                  class="text-base
                         font-semibold"
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

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Status</mat-label>
                    <mat-select
                    id="status"
                    formControlName="status"
                  >
                    <mat-option value="draft">Draft</mat-option>

                    <mat-option value="active">Active</mat-option>

                    <mat-option value="closed">Closed</mat-option>
                  </mat-select>
                  </mat-form-field>
                </div>

                <mat-checkbox class="zb-checkbox--top" formControlName="featured"><span>
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
                  </span></mat-checkbox>
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
                (click)="onCancel($event)"
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

 private readonly jobStore =
  inject(JobStore);

  private readonly authService = inject(AuthService);

  private readonly organizationStore =
  inject(OrganizationContextStore );

  private readonly toast = inject(HotToastService);

  // =========================================================
  // Embedded use (Admin → Jobs list/form views)
  // =========================================================

  /** Shown inside the Jobs admin page instead of on its own page. */
  readonly embedded = input(false);

  /** Job to edit when embedded (null or empty = new job). */
  readonly editJobId = input<string | null>(null);

  /** Emitted after a successful save when embedded. */
  readonly saved = output<void>();

  /** Emitted when Cancel is pressed when embedded. */
  readonly cancelled = output<void>();

  protected onCancel(event: Event): void {
    if (this.embedded()) {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  /** Back to the Jobs list: the parent view when embedded, else the page. */
  private async finish(): Promise<void> {
    if (this.embedded()) {
      this.saved.emit();
      return;
    }
    await this.router.navigate(['/admin/jobs']);
  }

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

    salaryPeriod: [''],

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
    const id = this.embedded() ? this.editJobId() : this.route.snapshot.paramMap.get('id');

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
      const job = await this.jobStore.getJob(id);

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

        salaryPeriod: job.compensation?.period ?? 'year',

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
        const organization = await this.organizationStore.getOrganizationById(job.organizationId);

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
        await this.organizationStore.findOrganizationByCompanyNumber(companyNumber);

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
        const existingJob = await this.jobStore.getJob(id);

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
            await this.organizationStore.findOrganizationByCompanyNumber(
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
            city: formValue.city?.trim() ?? '',

            state: formValue.state?.trim() ?? '',

            country: 'United States',
          },

          compensation: this.buildCompensation(
            formValue.salaryMin,
            formValue.salaryMax,
            formValue.salaryPeriod,
          ),

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
        await this.jobStore.updateJob(id, changes);

        /*
         * If organization information was explicitly
         * edited, update the organization record too.
         */
        if (this.organizationEditing() && this.organization()) {
          const organization = this.organization();

          await this.organizationStore.updateOrganization(organization!.id, {
            name: formValue.companyName.trim(),

            companyNumber: formValue.companyNumber.trim(),

            website: formValue.organizationWebsite.trim(),

            phone: formValue.organizationPhone.trim(),

            email: formValue.organizationEmail.trim(),
          });
        }

        console.log('Job updated successfully:', id);

        await this.finish();

        return;
      }

      /*
       * =====================================================
       * CREATE NEW JOB
       * =====================================================
       */

const organization =
  await this.organizationStore.findOrCreateOrganization({
    name: formValue.companyName.trim(),
    companyNumber: formValue.companyNumber.trim(),
    slug: formValue.companyName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    verified: false,
    active: true,
    website: formValue.organizationWebsite.trim(),
    phone: formValue.organizationPhone.trim(),
    email: formValue.organizationEmail.trim(),
  });

      const job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formValue.title.trim(),

        organizationId: organization.id,

        organizationName: organization.name,

        description: formValue.description.trim(),

        employmentType: formValue.employmentType as EmploymentType,

        workArrangement: formValue.workArrangement as WorkArrangement,

        categoryName: formValue.categoryName || undefined,

        location: {
          city: formValue.city?.trim() ?? '',

          state: formValue.state?.trim() ?? '',

          country: 'United States',
        },

        compensation: this.buildCompensation(
          formValue.salaryMin,
          formValue.salaryMax,
          formValue.salaryPeriod,
        ),

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

      const jobId = await this.jobStore.createJob(job);

      // console.log(
      //   'Job created successfully:',
      //   jobId
      // );

      this.toast.success('Job created successfully.');

      await this.finish();
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

  private buildCompensation(
    salaryMin: string | number | null | undefined,
    salaryMax: string | number | null | undefined,
    salaryPeriod: string | null | undefined,
  ): JobCompensation | undefined {
    /*
     * Form controls can return strings or numbers.
     * Normalize both values before validation.
     */

    const minText = salaryMin === null || salaryMin === undefined ? '' : String(salaryMin).trim();

    const maxText = salaryMax === null || salaryMax === undefined ? '' : String(salaryMax).trim();

    const minValue = minText !== '' ? Number(minText) : undefined;

    const maxValue = maxText !== '' ? Number(maxText) : undefined;

    /*
     * No compensation information was provided.
     */
    if (minValue === undefined && maxValue === undefined) {
      return undefined;
    }

    /*
     * Validate salary values.
     */
    if (
      (minValue !== undefined && !Number.isFinite(minValue)) ||
      (maxValue !== undefined && !Number.isFinite(maxValue))
    ) {
      throw new Error('Salary amounts must be valid numbers.');
    }

    /*
     * Prevent negative salary values.
     */
    if ((minValue !== undefined && minValue < 0) || (maxValue !== undefined && maxValue < 0)) {
      throw new Error('Salary amounts cannot be negative.');
    }

    /*
     * Make sure maximum is not less than minimum.
     */
    if (minValue !== undefined && maxValue !== undefined && maxValue < minValue) {
      throw new Error('Maximum salary cannot be less than minimum salary.');
    }

    /*
     * Normalize the selected pay period.
     */
    const period = salaryPeriod === 'hour' || salaryPeriod === 'year' ? salaryPeriod : 'year';

    /*
     * Build the compensation object.
     */
    return {
      ...(minValue !== undefined
        ? {
            min: minValue,
          }
        : {}),

      ...(maxValue !== undefined
        ? {
            max: maxValue,
          }
        : {}),

      period,
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
