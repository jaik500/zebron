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

@Component({
  selector: 'app-organization-application-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <main class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 mt-10">
      <div class="mx-auto max-w-4xl">

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
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-slate-900">
                    Organization Information
                  </h2>

                  <p class="mt-1 text-sm text-slate-500">
                    Provide the basic information about your organization.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Organization Name -->
                  <div class="sm:col-span-2">
                    <label
                      for="organizationName"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Organization Name
                    </label>

                    <input
                      id="organizationName"
                      type="text"
                      formControlName="organizationName"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />

                    @if (
                      form.controls.organizationName.touched &&
                      form.controls.organizationName.invalid
                    ) {
                      <p class="mt-1 text-xs text-red-600">
                        Organization name is required.
                      </p>
                    }
                  </div>

                  <!-- Organization Type -->
                  <div>
                    <label
                      for="organizationType"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Organization Type
                    </label>

                    <input
                      id="organizationType"
                      type="text"
                      formControlName="organizationType"
                      placeholder="Nonprofit, Company, School..."
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- Company Number -->
                  <div>
                    <label
                      for="companyNumber"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Company / Registration Number
                    </label>

                    <input
                      id="companyNumber"
                      type="text"
                      formControlName="companyNumber"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- Website -->
                  <div class="sm:col-span-2">
                    <label
                      for="website"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Website
                    </label>

                    <input
                      id="website"
                      type="url"
                      formControlName="website"
                      placeholder="https://example.org"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- Description -->
                  <div class="sm:col-span-2">
                    <label
                      for="description"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Organization Description
                    </label>

                    <textarea
                      id="description"
                      rows="4"
                      formControlName="description"
                      placeholder="Tell us briefly about your organization."
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    ></textarea>
                  </div>

                </div>
              </section>

              <!-- Contact Information -->
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-slate-900">
                    Primary Contact
                  </h2>

                  <p class="mt-1 text-sm text-slate-500">
                    Provide the primary contact information for your organization.
                  </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                  <!-- Contact Name -->
                  <div>
                    <label
                      for="contactName"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Contact Name
                    </label>

                    <input
                      id="contactName"
                      type="text"
                      formControlName="contactName"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />

                    @if (
                      form.controls.contactName.touched &&
                      form.controls.contactName.invalid
                    ) {
                      <p class="mt-1 text-xs text-red-600">
                        Contact name is required.
                      </p>
                    }
                  </div>

                  <!-- Contact Email -->
                  <div>
                    <label
                      for="contactEmail"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Contact Email
                    </label>

                    <input
                      id="contactEmail"
                      type="email"
                      formControlName="contactEmail"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />

                    @if (
                      form.controls.contactEmail.touched &&
                      form.controls.contactEmail.invalid
                    ) {
                      <p class="mt-1 text-xs text-red-600">
                        A valid contact email is required.
                      </p>
                    }
                  </div>

                  <!-- Phone -->
                  <div>
                    <label
                      for="contactPhone"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Contact Phone
                    </label>

                    <input
                      id="contactPhone"
                      type="tel"
                      formControlName="contactPhone"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- Country -->
                  <div>
                    <label
                      for="country"
                      class="block text-sm font-medium text-slate-700"
                    >
                      Country
                    </label>

                    <input
                      id="country"
                      type="text"
                      formControlName="country"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- State -->
                  <div>
                    <label
                      for="state"
                      class="block text-sm font-medium text-slate-700"
                    >
                      State / Province
                    </label>

                    <input
                      id="state"
                      type="text"
                      formControlName="state"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <!-- City -->
                  <div>
                    <label
                      for="city"
                      class="block text-sm font-medium text-slate-700"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      type="text"
                      formControlName="city"
                      class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                </div>
              </section>

              <!-- Requested Applications -->
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-slate-900">
                    Zebron Applications
                  </h2>

                  <p class="mt-1 text-sm text-slate-500">
                    Select the applications your organization would like to use.
                  </p>
                </div>

                <div class="grid gap-4 sm:grid-cols-3">

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
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

                <a
                  [routerLink]="
                    requestId()
                      ? ['/organizations/application', requestId()]
                      : '/'
                  "
                  class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </a>

                <div class="flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    (click)="save('draft')"
                    [disabled]="saving()"
                    class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ saving() ? 'Saving...' : 'Save Draft' }}
                  </button>

                  <button
                    type="button"
                    (click)="save('submitted')"
                    [disabled]="saving()"
                    class="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{
                      saving()
                        ? 'Submitting...'
                        : 'Submit Application'
                    }}
                  </button>

                </div>
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