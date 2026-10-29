import {
  CommonModule,
} from '@angular/common';

import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

import { OrganizationApplicationRequestService } from '../../../core/services/organization-application-request.service';

import {
  OrganizationApplicationRequest,
} from '../../../core/models/organization-application-request.model';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-organization-application-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink, MatFormFieldModule, MatInputModule],
  template: `
    <main class="mt-6 min-h-screen bg-slate-50 px-3 py-5 sm:mt-10 sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto w-full max-w-4xl">

        <!-- Header -->
        <div class="mb-8">
          <a
            routerLink="/"
            class="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Zebron
          </a>

          <h1 class="mt-4 text-3xl font-bold text-slate-900">
            {{ isEditing() ? 'Edit Organization Application' : 'Organization Application' }}
          </h1>

          <p class="mt-2 text-slate-600">
            {{
              isEditing()
                ? 'Update your draft organization application before submitting it for review.'
                : 'Tell us about your organization and the Zebron applications you would like to use.'
            }}
          </p>
        </div>

        <!-- Loading existing request -->
        @if (loadingExistingRequest()) {
          <section class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div class="text-slate-600">
              Loading your application...
            </div>
          </section>
        }

        @if (!loadingExistingRequest()) {

          <!-- Error -->
          @if (errorMessage()) {
            <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <h2 class="font-semibold text-red-900">
                Unable to continue
              </h2>

              <p class="mt-2 text-sm text-red-700">
                {{ errorMessage() }}
              </p>

              <div class="mt-4">
                <a
                  routerLink="/organizations/application"
                  class="text-sm font-medium text-red-800 underline"
                >
                  View application status
                </a>
              </div>
            </div>
          }

          @if (!errorMessage()) {
            <form
              [formGroup]="form"
              (ngSubmit)="save('draft')"
              class="space-y-6"
            >

              <!-- Organization Information -->
            <section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <!-- Full-width section header -->
  <div class="bg-[#007979]/60 px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
    <h2 class="text-lg font-semibold text-[slate-900]">
      Organization Information
    </h2>

    <p class="mt-1 text-md text-white/90">
      Provide the basic information about your organization.
    </p>
  </div>

                 <div class="space-y-1 p-4 sm:p-6 lg:p-8">

                  <!-- Organization Name -->
                  <div class="sm:col-span-2">

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Organization Name</mat-label>
                      <input matInput
                      id="organizationName"
                      type="text"
                      formControlName="organizationName"
                    />
                      @if (
                      form.controls.organizationName.touched &&
                      form.controls.organizationName.invalid
                    ) {
                        <mat-error>Organization name is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Organization Type -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Organization Type</mat-label>
                      <input matInput
                      id="organizationType"
                      type="text"
                      formControlName="organizationType"
                      placeholder="Nonprofit, Company, School..."
                    />
                    </mat-form-field>
                  </div>

                  <!-- Company Number -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Company / Registration Number</mat-label>
                      <input matInput
                      id="companyNumber"
                      type="text"
                      formControlName="companyNumber"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Website -->
                  <div class="sm:col-span-2">

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Website</mat-label>
                      <input matInput
                      id="website"
                      type="url"
                      formControlName="website"
                      placeholder="https://example.org"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Description -->
                  <div class="sm:col-span-2">

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Organization Description</mat-label>
                      <textarea matInput
                      id="description"
                      rows="4"
                      formControlName="description"
                      placeholder="Tell us briefly about your organization."
                    ></textarea>
                    </mat-form-field>
                  </div>

                </div>
              </section>

              <!-- Contact Information -->
           <section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <!-- Full-width section header -->
  <div class="bg-[#007979]/60 px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
    <h2 class="text-lg font-semibold text-slate-900">
                    Primary Contact
                  </h2>

                  <p class="mt-1 text-sm text-white/90">
                    Provide the primary contact information for your organization.
                  </p>
                </div>

                 <!-- Section form fields -->
  <div class="space-y-1 p-4 sm:p-6 lg:p-8">

                  <!-- Contact Name -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Contact Name</mat-label>
                      <input matInput
                      id="contactName"
                      type="text"
                      formControlName="contactName"
                    />
                      @if (
                      form.controls.contactName.touched &&
                      form.controls.contactName.invalid
                    ) {
                        <mat-error>Contact name is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Contact Email -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Contact Email</mat-label>
                      <input matInput
                      id="contactEmail"
                      type="email"
                      formControlName="contactEmail"
                    />
                      @if (
                      form.controls.contactEmail.touched &&
                      form.controls.contactEmail.invalid
                    ) {
                        <mat-error>A valid contact email is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Phone -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Contact Phone</mat-label>
                      <input matInput
                      id="contactPhone"
                      type="tel"
                      formControlName="contactPhone"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Country -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Country</mat-label>
                      <input matInput
                      id="country"
                      type="text"
                      formControlName="country"
                    />
                    </mat-form-field>
                  </div>

                  <!-- State -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>State / Province</mat-label>
                      <input matInput
                      id="state"
                      type="text"
                      formControlName="state"
                    />
                    </mat-form-field>
                  </div>

                  <!-- City -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>City</mat-label>
                      <input matInput
                      id="city"
                      type="text"
                      formControlName="city"
                    />
                    </mat-form-field>
                  </div>

                </div>
              </section>

              <!-- Requested Applications -->
             <section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <!-- Full-width section header -->
  <div class="bg-[#007979]/60 px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
    <h2 class="text-lg font-semibold text-slate-900">
                    Zebron Applications
                  </h2>

                  <p class="mt-1 text-sm text-white/90">
                    Select the applications your organization would like to use.
                  </p>
                </div>

                <div class="grid grid-cols-1 items-stretch gap-4 p-3 sm:grid-cols-3 sm:p-6 lg:p-8">

                  @for (application of availableApplications; track application.id) {
                    <button
                      type="button"
                      (click)="toggleApplication(application.id)"
                      class="rounded-xl border p-5 text-left transition"
                      [class.border-slate-900]="isApplicationSelected(application.id)"
                      [class.bg-slate-50]="isApplicationSelected(application.id)"
                      [class.border-slate-200]="!isApplicationSelected(application.id)"
                    >
                      <div class="flex items-start justify-between gap-3">

                        <div>
                          <h3 class="font-semibold text-slate-900">
                            {{ application.name }}
                          </h3>

                          <p class="mt-1 text-sm text-slate-500">
                            {{ application.description }}
                          </p>
                        </div>

                        @if (isApplicationSelected(application.id)) {
                          <span class="text-lg font-bold text-slate-900">
                            ✓
                          </span>
                        }

                      </div>
                    </button>
                  }

                </div>

                @if (
                  submittingAttempted() &&
                  selectedApplications().size === 0
                ) {
                  <p class="mt-3 text-sm text-red-600">
                    Select at least one application before submitting.
                  </p>
                }

              </section>

              <!-- Messages -->
              @if (successMessage()) {
                <div class="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p class="text-sm text-green-800">
                    {{ successMessage() }}
                  </p>
                </div>
              }

              @if (errorMessage()) {
                <div class="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p class="text-sm text-red-800">
                    {{ errorMessage() }}
                  </p>
                </div>
              }


<!-- Actions -->
<div class="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">

  <a
    [routerLink]="
      requestId()
        ? ['/organizations/application', requestId()]
        : '/'
    "
    class="inline-flex min-w-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-3 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 sm:px-5 sm:py-2.5 sm:text-sm"
  >
    Cancel
  </a>

  <button
    type="button"
    (click)="save('draft')"
    [disabled]="saving()"
    class="min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
  >
    {{ saving() ? 'Saving...' : 'Save Draft' }}
  </button>

  <button
    type="button"
    (click)="save('submitted')"
    [disabled]="saving()"
    class="min-w-0 rounded-lg bg-slate-900 px-2 py-3 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
  >
    {{ saving() ? 'Submitting...' : 'Submit Application' }}
  </button>

</div>


            </form>
          }
        }

      </div>
    </main>
  `,
})
export class OrganizationApplicationFormComponent
  implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly applicationService =
    inject(OrganizationApplicationRequestService);

  readonly requestId = signal<string | null>(null);

  readonly loadingExistingRequest = signal(false);

  readonly saving = signal(false);

  readonly submittingAttempted = signal(false);

  readonly successMessage = signal<string | null>(null);

  readonly errorMessage = signal<string | null>(null);

  readonly selectedApplications = signal<Set<string>>(
    new Set<string>(),
  );

  readonly isEditing = signal(false);

  readonly availableApplications = [
    {
      id: 'community',
      name: 'Community',
      description: 'Community discussions, topics, and member engagement.',
    },
    {
      id: 'test-center',
      name: 'Test Center',
      description: 'Create and manage training programs, courses, and assessments.',
    },
    {
      id: 'knowledge',
      name: 'Knowledge Center',
      description: 'Create and manage organization knowledge and documentation.',
    },
  ];

  readonly form = this.fb.nonNullable.group({
    organizationName: [
      '',
      [Validators.required],
    ],

    organizationType: [
      '',
    ],

    companyNumber: [
      '',
    ],

    website: [
      '',
    ],

    description: [
      '',
    ],

    contactName: [
      '',
      [Validators.required],
    ],

    contactEmail: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    contactPhone: [
      '',
    ],

    country: [
      '',
    ],

    state: [
      '',
    ],

    city: [
      '',
    ],
  });

  async ngOnInit(): Promise<void> {
    const requestId =
      this.route.snapshot.paramMap.get('id');

    if (!requestId) {
      return;
    }

    this.requestId.set(requestId);
    this.isEditing.set(true);

    await this.loadExistingRequest(requestId);
  }

  private async loadExistingRequest(
    requestId: string,
  ): Promise<void> {

    this.loadingExistingRequest.set(true);
    this.errorMessage.set(null);

    try {
      const firebaseUser =
        this.authService.firebaseUser();

      if (!firebaseUser) {
        this.errorMessage.set(
          'You must be signed in to edit an organization application.',
        );
        return;
      }

      const request =
        await this.applicationService.getRequest(requestId);

      if (!request) {
        this.errorMessage.set(
          'The organization application could not be found.',
        );
        return;
      }

      /*
       * The Firestore rules provide the actual security boundary.
       * This check prevents displaying another user's request
       * even if the component receives an unexpected request ID.
       */
      if (
        request.applicantUserId !== firebaseUser.uid &&
        !this.authService.isAdmin
      ) {
        this.errorMessage.set(
          'You do not have permission to edit this application.',
        );
        return;
      }

      /*
       * Only drafts can be edited by the applicant.
       * Submitted applications move into the review lifecycle.
       */
      if (request.status !== 'draft') {
        this.errorMessage.set(
          'Only draft organization applications can be edited.',
        );
        return;
      }

      this.populateForm(request);

    } catch (error) {

      console.error(
        'Failed to load organization application:',
        error,
      );

      this.errorMessage.set(
        'We could not load the organization application. Please try again.',
      );

    } finally {
      this.loadingExistingRequest.set(false);
    }
  }

  private populateForm(
    request: OrganizationApplicationRequest,
  ): void {

    this.form.patchValue({
      organizationName:
        request.organizationName,

      organizationType:
        request.organizationType ?? '',

      companyNumber:
        request.companyNumber ?? '',

      website:
        request.website ?? '',

      description:
        request.description ?? '',

      contactName:
        request.contactName,

      contactEmail:
        request.contactEmail,

      contactPhone:
        request.contactPhone ?? '',

      country:
        request.country ?? '',

      state:
        request.state ?? '',

      city:
        request.city ?? '',
    });

    this.selectedApplications.set(
      new Set(
        request.requestedApplications ?? [],
      ),
    );
  }

  toggleApplication(
    applicationId: string,
  ): void {

    const current =
      new Set(this.selectedApplications());

    if (current.has(applicationId)) {
      current.delete(applicationId);
    } else {
      current.add(applicationId);
    }

    this.selectedApplications.set(current);
  }

  isApplicationSelected(
    applicationId: string,
  ): boolean {

    return this.selectedApplications().has(
      applicationId,
    );
  }

  async save(
    status: 'draft' | 'submitted',
  ): Promise<void> {

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (status === 'submitted') {
      this.submittingAttempted.set(true);
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.errorMessage.set(
          'Please complete all required fields before submitting.',
        );
        return;
      }

      if (this.selectedApplications().size === 0) {
        this.errorMessage.set(
          'Please select at least one application.',
        );
        return;
      }
    }

    const firebaseUser =
      this.authService.firebaseUser();

    if (!firebaseUser) {
      this.errorMessage.set(
        'You must be signed in to submit an organization application.',
      );
      return;
    }

    this.saving.set(true);

    try {

      const formValue =
        this.form.getRawValue();

   const changes = {
  applicantUserId: firebaseUser.uid,

  organizationName:
    formValue.organizationName.trim(),

  contactName:
    formValue.contactName.trim(),

  contactEmail:
    formValue.contactEmail.trim(),

  requestedApplications:
    Array.from(this.selectedApplications()),

  status,

  ...(formValue.organizationType.trim()
    ? {
        organizationType:
          formValue.organizationType.trim(),
      }
    : {}),

  ...(formValue.companyNumber.trim()
    ? {
        companyNumber:
          formValue.companyNumber.trim(),
      }
    : {}),

  ...(formValue.website.trim()
    ? {
        website:
          formValue.website.trim(),
      }
    : {}),

  ...(formValue.description.trim()
    ? {
        description:
          formValue.description.trim(),
      }
    : {}),

  ...(formValue.contactPhone.trim()
    ? {
        contactPhone:
          formValue.contactPhone.trim(),
      }
    : {}),

  ...(formValue.country.trim()
    ? {
        country:
          formValue.country.trim(),
      }
    : {}),

  ...(formValue.state.trim()
    ? {
        state:
          formValue.state.trim(),
      }
    : {}),

  ...(formValue.city.trim()
    ? {
        city:
          formValue.city.trim(),
      }
    : {}),
};

      const existingRequestId =
        this.requestId();

      /*
       * Existing draft:
       *
       * Do NOT send applicantUserId in the update.
       * Firestore rules explicitly prevent an applicant
       * from changing ownership of the application.
       */
      if (existingRequestId) {

        const {
          applicantUserId: _applicantUserId,
          ...updateChanges
        } = changes;

        await this.applicationService.updateRequest(
          existingRequestId,
          updateChanges,
        );

        this.successMessage.set(
          status === 'draft'
            ? 'Your organization application has been saved.'
            : 'Your organization application has been submitted for review.',
        );

        if (status === 'submitted') {

          await this.router.navigate([
            '/organizations/application',
            existingRequestId,
          ]);

        }

        return;
      }

      /*
       * New application.
       */
      const newRequestId =
        await this.applicationService.createRequest(
          changes,
        );

      this.requestId.set(newRequestId);

      this.isEditing.set(true);

      this.successMessage.set(
        status === 'draft'
          ? 'Your organization application has been saved as a draft.'
          : 'Your organization application has been submitted for review.',
      );

      if (status === 'submitted') {

        await this.router.navigate([
          '/organizations/application',
          newRequestId,
        ]);

      } else {

        /*
         * Give the newly-created draft a stable edit URL.
         */
        await this.router.navigate([
          '/organizations/apply',
          newRequestId,
        ]);

      }

    } catch (error) {

      console.error(
        'Failed to save organization application:',
        error,
      );

      this.errorMessage.set(
        'We could not save your organization application. Please try again.',
      );

    } finally {
      this.saving.set(false);
    }
  }
}