import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Timestamp, collection, getDocs, limit, query, where } from 'firebase/firestore';

import { firestore } from '../../../../../core/services/firebase-config';

import {
  Job,
  JobCompensation,
  JobStatus,
  EmploymentType,
  WorkArrangement,
  jobExpiresAt,
  JOB_DAYS_AFTER_DEADLINE,
  JOB_DAYS_WITHOUT_DEADLINE,
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
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-job-form',

  standalone: true,

  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatIconModule],

  template: `
    <main [class]="embedded() ? 'bg-transparent' : 'min-h-screen bg-gray-50 mt-16'">
      <!-- Standalone page (/admin/jobs/new, /admin/jobs/:id/edit): a slim bar; the universal header names the page. -->
      @if (!embedded()) {
        <div class="border-b border-gray-200 bg-white">
          <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
            <a routerLink="/admin/jobs" class="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
              Jobs
            </a>
            <h1 class="truncate border-l border-gray-200 pl-3 text-sm font-semibold text-[#032D42]">
              {{ isEditMode() ? 'Edit job' : 'New job' }}
            </h1>
          </div>
        </div>
      }

      @if (loadingJob()) {
        <div class="flex items-center justify-center gap-3 px-4 py-12 text-sm text-gray-600">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#007979]"></span>
          Loading job…
        </div>
      }

      @if (loadError()) {
        <div class="mx-auto max-w-3xl px-4 py-8">
          <div class="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
            <h2 class="font-semibold text-red-800">Unable to load job</h2>
            <p class="mt-1 text-sm text-red-700">{{ loadError() }}</p>
            <a routerLink="/admin/jobs" (click)="onCancel($event)" class="mt-4 inline-flex h-9 items-center rounded-lg bg-[#032D42] px-4 text-sm font-semibold text-white">
              Back to jobs
            </a>
          </div>
        </div>
      }

      @if (!loadingJob() && !loadError()) {
        <div [class]="embedded() ? '' : 'mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8'">
          <form
            [formGroup]="jobForm"
            (ngSubmit)="saveJob()"
            [class]="embedded() ? 'space-y-4 p-4 sm:p-5' : 'space-y-4'"
          >
              @if (copiedFrom()) {
                <div class="flex items-start gap-2 rounded-lg border border-[#007979]/30 bg-[#007979]/5 px-4 py-3 text-sm text-[#032D42]" role="status">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979] shrink-0" aria-hidden="true">content_copy</mat-icon>
                  <p>
                    Copy of <strong>{{ copiedFrom() }}</strong>. Saving creates a new draft job. Add the new
                    application link and deadline; the date posted is set to today.
                  </p>
                </div>
              }

              <!-- Top row: the job, and Publish beside it -->
              <div [class]="embedded() ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'">
              <!-- The job -->
                <section class="h-full rounded-xl border border-gray-200 bg-white shadow-sm">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">work_outline</mat-icon>
                  <h2 class="text-sm font-semibold text-[#032D42]">The job</h2>
                </div>
                <div class="space-y-1 px-4 py-4 sm:px-5">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Job title</mat-label>
                    <input matInput id="title" type="text" formControlName="title" placeholder="e.g. Junior Software Developer" />
                    @if (jobForm.controls.title.touched && jobForm.controls.title.invalid) {
                      <mat-error>Job title is required.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Description</mat-label>
                    <textarea
                      matInput
                      id="description"
                      rows="10"
                      formControlName="description"
                      placeholder="Describe the position, responsibilities, qualifications, and other relevant details."
                    ></textarea>
                    @if (jobForm.controls.description.touched && jobForm.controls.description.invalid) {
                      <mat-error>Job description is required and must contain at least 20 characters.</mat-error>
                    }
                  </mat-form-field>
                </div>
              </section>

            <!-- Publish: beside the job title and description -->
                <aside class="min-w-0">
              <section class="h-full rounded-xl border border-gray-200 bg-white shadow-sm">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">publish</mat-icon>
                  <h2 class="text-sm font-semibold text-[#032D42]">Publish</h2>
                </div>
                <div class="space-y-3 px-4 py-4 sm:px-5">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Status</mat-label>
                    <mat-select id="status" formControlName="status">
                      <mat-option value="draft">Draft</mat-option>
                      <mat-option value="active">Active</mat-option>
                      <mat-option value="closed">Closed</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-checkbox class="zb-checkbox--top" formControlName="featured">
                    <span>
                      <span class="block text-sm font-medium text-gray-800">Featured job</span>
                      <span class="block text-xs text-gray-500">Shown first on the job board.</span>
                    </span>
                  </mat-checkbox>

                  <div class="rounded-lg bg-gray-50 px-3 py-2">
                    @if (closingNote(); as note) {
                      <p class="text-xs font-medium" [class.text-red-700]="closingPassed()" [class.text-gray-700]="!closingPassed()">{{ note }}</p>
                    }
                    <p class="mt-1 text-xs text-gray-500">{{ expiryHint }}</p>
                  </div>

                  <button
                    type="submit"
                    [disabled]="jobForm.invalid || saving()"
                    class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    @if (saving()) {
                      {{ isEditMode() ? 'Updating…' : 'Saving…' }}
                    } @else {
                      {{ isEditMode() ? 'Update job' : 'Save job' }}
                    }
                  </button>
                  <a
                    routerLink="/admin/jobs"
                    (click)="onCancel($event)"
                    class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </a>

                  @if (submitted() && jobForm.invalid) {
                    <p class="text-sm font-medium text-red-600" role="alert">Please complete all required fields.</p>
                  }
                </div>
              </section>
            </aside>
              </div>

              <!-- Employer -->
              <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">business</mat-icon>
                  <h2 class="text-sm font-semibold text-[#032D42]">Employer</h2>
                  @if (organization()) {
                    <span class="ml-auto inline-flex items-center gap-1 rounded-full bg-[#007979]/10 px-2 py-0.5 text-xs font-semibold text-[#007979]">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">check</mat-icon>
                      Found
                    </span>
                  }
                </div>
                <div class="space-y-3 px-4 py-4 sm:px-5">
                  <p class="text-xs text-gray-500">Find the employer by its business number, or type its name for a new one.</p>

                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <div class="flex items-start gap-2">
                      <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                        <mat-label>Business / registration number</mat-label>
                        <input
                          matInput
                          id="companyNumber"
                          type="text"
                          formControlName="companyNumber"
                          placeholder="e.g. ZEBRON-TEST-001"
                          [readonly]="isEditMode() && organizationFound() && !organizationEditing()"
                        />
                      </mat-form-field>
                      <button
                        type="button"
                        (click)="findOrganization()"
                        [disabled]="organizationLookupLoading()"
                        class="inline-flex h-14 shrink-0 items-center justify-center rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] transition hover:bg-[#007979]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {{ organizationLookupLoading() ? 'Searching…' : 'Find' }}
                      </button>
                    </div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Employer name</mat-label>
                      <input matInput id="companyName" type="text" formControlName="companyName" [readonly]="organizationFound() && !organizationEditing()" />
                    </mat-form-field>
                  </div>

                  @if (organizationLookupMessage()) {
                    <p class="rounded-lg border border-[#007979]/20 bg-[#007979]/5 px-3 py-2 text-sm text-[#007979]">{{ organizationLookupMessage() }}</p>
                  }
                  @if (organizationLookupError()) {
                    <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ organizationLookupError() }}</p>
                  }

                  @if (organization()) {
                    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div class="mb-2 flex items-center justify-between gap-3">
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Employer record</p>
                        <mat-checkbox [checked]="organizationEditing()" (change)="toggleOrganizationEditing()">Edit</mat-checkbox>
                      </div>

                      @if (organizationEditing()) {
                        <div class="grid gap-x-3 sm:grid-cols-3">
                          <mat-form-field appearance="outline" class="zb-field">
                            <mat-label>Website</mat-label>
                            <input matInput type="url" formControlName="organizationWebsite" placeholder="https://example.org" />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="zb-field">
                            <mat-label>Phone</mat-label>
                            <input matInput type="tel" formControlName="organizationPhone" placeholder="555-555-5555" />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="zb-field">
                            <mat-label>Email</mat-label>
                            <input matInput type="email" formControlName="organizationEmail" placeholder="contact@example.org" />
                          </mat-form-field>
                        </div>
                        <p class="text-xs font-medium text-[#007979]">Changes are saved to the employer record when you update the job.</p>
                      } @else {
                        <dl class="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div><dt class="text-xs text-gray-500">Website</dt><dd class="break-all text-gray-800">{{ organization()?.website || 'Not provided' }}</dd></div>
                          <div><dt class="text-xs text-gray-500">Phone</dt><dd class="text-gray-800">{{ organization()?.phone || 'Not provided' }}</dd></div>
                          <div><dt class="text-xs text-gray-500">Email</dt><dd class="break-all text-gray-800">{{ organization()?.email || 'Not provided' }}</dd></div>
                          <div><dt class="text-xs text-gray-500">Business number</dt><dd class="text-gray-800">{{ organization()?.companyNumber || 'Not provided' }}</dd></div>
                          <div><dt class="text-xs text-gray-500">Verification</dt><dd class="text-gray-800">{{ organization()?.verified ? 'Verified' : 'Not verified' }}</dd></div>
                        </dl>
                      }
                    </div>
                  }
                </div>
              </section>

              <!-- Details -->
              <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">tune</mat-icon>
                  <h2 class="text-sm font-semibold text-[#032D42]">Type, place and pay</h2>
                </div>
                <div class="px-4 py-4 sm:px-5">
                  <div class="grid gap-x-3 sm:grid-cols-3">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Employment type</mat-label>
                      <mat-select id="employmentType" formControlName="employmentType">
                        <mat-option value="">Select type</mat-option>
                        <mat-option value="full-time">Full-time</mat-option>
                        <mat-option value="part-time">Part-time</mat-option>
                        <mat-option value="contract">Contract</mat-option>
                        <mat-option value="internship">Internship</mat-option>
                        <mat-option value="temporary">Temporary</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Work arrangement</mat-label>
                      <mat-select id="workArrangement" formControlName="workArrangement">
                        <mat-option value="">Select arrangement</mat-option>
                        <mat-option value="on-site">On-site</mat-option>
                        <mat-option value="hybrid">Hybrid</mat-option>
                        <mat-option value="remote">Remote</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Category</mat-label>
                      <mat-select id="categoryName" formControlName="categoryName">
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

                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>City</mat-label>
                      <input matInput id="city" type="text" formControlName="city" placeholder="e.g. Washington" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>State</mat-label>
                      <input matInput id="state" type="text" formControlName="state" placeholder="e.g. DC" />
                    </mat-form-field>
                  </div>

                  <div class="grid gap-x-3 sm:grid-cols-3">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Minimum pay</mat-label>
                      <input matInput id="salaryMin" type="number" inputmode="decimal" min="0" formControlName="salaryMin" placeholder="e.g. 60000" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Maximum pay</mat-label>
                      <input matInput id="salaryMax" type="number" inputmode="decimal" min="0" formControlName="salaryMax" placeholder="e.g. 90000" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Pay period</mat-label>
                      <mat-select id="salaryPeriod" formControlName="salaryPeriod">
                        <mat-option value="year">Yearly</mat-option>
                        <mat-option value="hour">Hourly</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </section>

              <!-- Application -->
              <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">link</mat-icon>
                  <h2 class="text-sm font-semibold text-[#032D42]">Application, source and dates</h2>
                </div>
                <div class="px-4 py-4 sm:px-5">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Application link</mat-label>
                    <input matInput id="applicationUrl" type="url" formControlName="applicationUrl" placeholder="https://example.com/apply" />
                  </mat-form-field>

                  @if (duplicates().length) {
                    <div class="-mt-2 mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
                      <p class="font-semibold">This link is already on the board:</p>
                      <ul class="mt-1 space-y-0.5">
                        @for (duplicate of duplicates(); track duplicate.id) {
                          <li>
                            <a [href]="'/admin/jobs/' + duplicate.id + '/edit'" target="_blank" rel="noopener" class="underline hover:no-underline">{{ duplicate.title }}</a>
                            · {{ duplicate.organizationName }} · {{ duplicate.status }}
                          </li>
                        }
                      </ul>
                      <p class="mt-1 text-xs text-amber-800">You can still save; check it isn't the same job.</p>
                    </div>
                  }

                  <div class="grid gap-x-3 sm:grid-cols-3">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Source site</mat-label>
                      <input matInput id="sourceName" type="text" formControlName="sourceName" placeholder="e.g. Indeed, USAJOBS" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Date posted</mat-label>
                      <input matInput id="postedAt" type="date" formControlName="postedAt" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Application deadline</mat-label>
                      <input matInput id="applicationDeadline" type="date" formControlName="applicationDeadline" />
                    </mat-form-field>
                  </div>

                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <div>
                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Skills</mat-label>
                        <input matInput id="skills" type="text" formControlName="skills" placeholder="e.g. JavaScript, Angular, Firebase" />
                        <mat-hint>Separate with commas. Used for "Prepare for this job".</mat-hint>
                      </mat-form-field>
                    </div>
                    <div>
                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Tags</mat-label>
                        <input matInput id="tags" type="text" formControlName="tags" placeholder="e.g. entry-level, cleared" />
                        <mat-hint>Separate with commas.</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </section>
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

  /** New job prefilled from this one ("Copy as new"). Also ?copy=<id> on /admin/jobs/new. */
  readonly copyFromJobId = input<string | null>(null);

  /** Title of the job being copied, for the banner. */
  protected readonly copiedFrom = signal('');

  /** Other jobs with the same application link (duplicate warning). */
  protected readonly duplicates = signal<Pick<Job, 'id' | 'title' | 'organizationName' | 'status'>[]>([]);

  private readonly destroyRef = inject(DestroyRef);

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

    sourceName: [''],

    postedAt: [''],

    status: ['draft', Validators.required],

    featured: [false],
  });

  // =========================================================
  // Initialization
  // =========================================================

  ngOnInit(): void {
    const id = this.embedded() ? this.editJobId() : this.route.snapshot.paramMap.get('id');

    this.watchDuplicateLinks();
    this.watchClosingDate();

    if (!id) {
      /*
       * /admin/jobs/new (optionally a copy of another job)
       */
      this.isEditMode.set(false);

      const copyId = this.embedded() ? this.copyFromJobId() : this.route.snapshot.queryParamMap.get('copy');
      if (copyId) {
        void this.loadCopy(copyId);
      }

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
  // Copy as new
  // =========================================================

  /**
   * Prefills a new job from an existing one. The link, deadline and
   * featured flag are cleared, the date posted is today and it starts
   * as a draft, so a copy never goes live by accident.
   */
  private async loadCopy(id: string): Promise<void> {
    await this.loadExistingJob(id);

    if (this.loadError()) {
      return;
    }

    this.copiedFrom.set(this.jobForm.controls.title.value);
    this.jobForm.patchValue({
      applicationUrl: '',
      applicationDeadline: '',
      postedAt: this.timestampToDateInput(Timestamp.now()),
      status: 'draft',
      featured: false,
    });
  }

  // =========================================================
  // Duplicate application links
  // =========================================================

  /** "Closes on …" under the dates, from the deadline and the date posted. */
  protected readonly closingNote = signal('');
  protected readonly closingPassed = signal(false);

  private closingMillis(): number {
    const { applicationDeadline, postedAt } = this.jobForm.getRawValue();
    const day = (value: string) => Timestamp.fromDate(new Date(`${value}T00:00:00`));
    return jobExpiresAt({
      applicationDeadline: applicationDeadline ? day(applicationDeadline) : null,
      postedAt: postedAt ? day(postedAt) : Timestamp.now(),
    }).toMillis();
  }

  private watchClosingDate(): void {
    const update = () => {
      const millis = this.closingMillis();
      const passed = millis <= Date.now();
      const date = new Date(millis).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      this.closingPassed.set(passed);
      this.closingNote.set(
        passed
          ? `The closing date (${date}) has passed: this job cannot be Active until you change the deadline or the date posted.`
          : `This listing closes on its own on ${date}.`,
      );
    };
    update();
    this.jobForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update);
  }

  /** Warns when the application link is already used by another job. */
  private watchDuplicateLinks(): void {
    this.jobForm.controls.applicationUrl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => void this.checkDuplicates(value));
  }

  private async checkDuplicates(value: string): Promise<void> {
    const url = value.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      this.duplicates.set([]);
      return;
    }

    // The same link with and without a trailing slash.
    const variants = [...new Set([url, url.replace(/\/+$/, ''), `${url.replace(/\/+$/, '')}/`])];

    try {
      const snapshot = await getDocs(
        query(collection(firestore, 'jobs'), where('applicationUrl', 'in', variants), limit(5)),
      );
      this.duplicates.set(
        snapshot.docs
          .filter((item) => item.id !== this.jobId())
          .map((item) => {
            const data = item.data() as Job;
            return { id: item.id, title: data.title, organizationName: data.organizationName, status: data.status };
          }),
      );
    } catch (error) {
      // The warning is a help, not a requirement.
      console.error('Duplicate link check failed:', error);
      this.duplicates.set([]);
    }
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

        sourceName: job.sourceName ?? '',

        postedAt: this.timestampToDateInput(job.postedAt ?? job.createdAt),

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

    // An Active job past its closing date would be hidden at once and closed tonight.
    if (this.jobForm.controls.status.value === 'active' && this.closingMillis() <= Date.now()) {
      this.toast.error('This job is past its closing date. Change the deadline or the date posted, or save it as a draft.');

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

          ...this.listingDates(formValue),

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

        ...this.listingDates(formValue),

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

  /**
   * Source, posted date and expiry, from the form. The posted date defaults
   * to today; the expiry is 5 days after the deadline, or 60 days after the
   * posted date when there is no deadline (jobExpiresAt in job.model.ts).
   */
  private listingDates(formValue: {
    applicationDeadline: string;
    sourceName: string;
    postedAt: string;
    status: string;
  }): Pick<Job, 'sourceName' | 'postedAt' | 'expiresAt' | 'closedReason'> {
    const applicationDeadline = formValue.applicationDeadline
      ? Timestamp.fromDate(new Date(`${formValue.applicationDeadline}T00:00:00`))
      : null;

    const postedAt = formValue.postedAt
      ? Timestamp.fromDate(new Date(`${formValue.postedAt}T00:00:00`))
      : Timestamp.now();

    return {
      sourceName: formValue.sourceName.trim(),
      postedAt,
      expiresAt: jobExpiresAt({ applicationDeadline, postedAt }),
      closedReason: formValue.status === 'closed' ? 'manual' : null,
    };
  }

  /** Shown under the dates: when this listing will close on its own. */
  protected readonly expiryHint =
    `Listings close on their own ${JOB_DAYS_AFTER_DEADLINE} days after the application deadline, ` +
    `or ${JOB_DAYS_WITHOUT_DEADLINE} days after the posted date when there is no deadline.`;

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
