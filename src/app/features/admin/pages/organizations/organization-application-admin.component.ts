import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  OrganizationApplicationRequest,
  OrganizationApplicationRequestStatus,
} from '../../../../core/models/organization-application-request.model';

import { OrganizationApplicationRequestService } from '../../../../core/services/organization-application-request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizationProvisioningService } from '../../../../core/services/organization-provisioning.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-organization-application-admin',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <main class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 mt-10">
      <div class="mx-auto max-w-7xl">
        <!-- Header -->
        <div class="mb-8">
          <p class="text-sm font-medium text-slate-500">Administration</p>

          <div class="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">Organization Applications</h1>

              <p class="mt-2 text-slate-600">Review and manage organization onboarding requests.</p>
            </div>

            <button
              type="button"
              (click)="loadApplications()"
              [disabled]="loading()"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ loading() ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- Error -->
        @if (errorMessage()) {
          <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p class="text-sm text-red-800">
              {{ errorMessage() }}
            </p>
          </div>
        }

        <!-- Filters -->
        <section class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap gap-2">
            @for (filter of filters; track filter.status) {
              <button
                type="button"
                (click)="selectFilter(filter.status)"
                class="rounded-lg px-4 py-2 text-sm font-medium transition"
                [class.bg-slate-900]="selectedFilter() === filter.status"
                [class.text-white]="selectedFilter() === filter.status"
                [class.bg-slate-100]="selectedFilter() !== filter.status"
                [class.text-slate-700]="selectedFilter() !== filter.status"
              >
                {{ filter.label }}

                @if (filter.status !== 'all') {
                  <span class="ml-1 text-xs opacity-70">
                    {{ filterCount(filter.status) }}
                  </span>
                }
              </button>
            }
          </div>
        </section>

        <!-- Loading -->
        @if (loading()) {
          <section class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p class="text-slate-600">Loading organization applications...</p>
          </section>
        }

        <!-- Empty -->
        @if (!loading() && filteredApplications().length === 0) {
          <section class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div class="mx-auto max-w-md">
              <h2 class="text-lg font-semibold text-slate-900">No applications found</h2>

              <p class="mt-2 text-sm text-slate-500">
                There are no organization applications matching the selected status.
              </p>
            </div>
          </section>
        }

        <!-- Application list -->
        @if (!loading() && filteredApplications().length > 0) {
          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Organization
                    </th>

                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Applicant
                    </th>

                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Status
                    </th>

                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Submitted
                    </th>

                    <th
                      class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-slate-200">
                  @for (application of filteredApplications(); track application.id) {
                    <tr class="hover:bg-slate-50">
                      <!-- Organization -->
                      <td class="px-6 py-5">
                        <div>
                          <p class="font-semibold text-slate-900">
                            {{ application.organizationName }}
                          </p>

                          @if (application.organizationType) {
                            <p class="mt-1 text-xs text-slate-500">
                              {{ application.organizationType }}
                            </p>
                          }
                        </div>
                      </td>

                      <!-- Applicant -->
                      <td class="px-6 py-5">
                        <p class="text-sm font-medium text-slate-900">
                          {{ application.contactName }}
                        </p>

                        <p class="mt-1 text-sm text-slate-500">
                          {{ application.contactEmail }}
                        </p>
                      </td>

                      <!-- Status -->
                      <td class="px-6 py-5">
                        <span
                          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                          [class.bg-blue-100]="application.status === 'submitted'"
                          [class.text-blue-800]="application.status === 'submitted'"
                          [class.bg-amber-100]="
                            application.status === 'under_review' ||
                            application.status === 'provisioning'
                          "
                          [class.text-amber-800]="
                            application.status === 'under_review' ||
                            application.status === 'provisioning'
                          "
                          [class.bg-green-100]="
                            application.status === 'approved' || application.status === 'active'
                          "
                          [class.text-green-800]="
                            application.status === 'approved' || application.status === 'active'
                          "
                          [class.bg-teal-100]="application.status === 'onboarding'"
                          [class.text-teal-800]="application.status === 'onboarding'"
                          [class.bg-red-100]="application.status === 'rejected'"
                          [class.text-red-800]="application.status === 'rejected'"
                          [class.bg-slate-100]="
                            application.status === 'draft' || application.status === 'cancelled'
                          "
                          [class.text-slate-700]="
                            application.status === 'draft' || application.status === 'cancelled'
                          "
                        >
                          {{ statusLabel(application.status) }}
                        </span>
                      </td>

                      <!-- Submitted -->
                      <td class="px-6 py-5 text-sm text-slate-600">
                        @if (application.submittedAt) {
                          {{ formatTimestamp(application.submittedAt) | date: 'medium' }}
                        } @else {
                          —
                        }
                      </td>

                      <!-- Action -->
                      <td class="px-6 py-5 text-right">
                        <button
                          type="button"
                          (click)="selectApplication(application)"
                          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <!-- Detail panel -->
        @if (selectedApplication()) {
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            (click)="closeApplication()"
          >
            <section
              class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              (click)="$event.stopPropagation()"
            >
              <!-- Detail header -->
              <div class="flex items-start justify-between border-b border-slate-200 p-6">
                <div>
                  <p class="text-sm font-medium text-slate-500">Organization Application</p>

                  <h2 class="mt-1 text-2xl font-bold text-slate-900">
                    {{ selectedApplication()!.organizationName }}
                  </h2>

                  <p class="mt-1 font-mono text-xs text-slate-500">
                    {{ selectedApplication()!.id }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="closeApplication()"
                  class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close application"
                >
                  ✕
                </button>
              </div>

              <div class="space-y-6 p-6">
                <!-- Organization -->
                <section>
                  <h3 class="text-lg font-semibold text-slate-900">Organization Information</h3>

                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Organization Name
                      </p>

                      <p class="mt-1 text-sm text-slate-900">
                        {{ selectedApplication()!.organizationName }}
                      </p>
                    </div>

                    @if (selectedApplication()!.organizationSlug) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Organization Slug
                        </p>

                        <p class="mt-1 font-mono text-sm text-slate-900">
                          {{ selectedApplication()!.organizationSlug }}
                        </p>
                      </div>
                    }

                    @if (selectedApplication()!.organizationType) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Organization Type
                        </p>

                        <p class="mt-1 text-sm text-slate-900">
                          {{ selectedApplication()!.organizationType }}
                        </p>
                      </div>
                    }

                    @if (selectedApplication()!.companyNumber) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Company Number
                        </p>

                        <p class="mt-1 text-sm text-slate-900">
                          {{ selectedApplication()!.companyNumber }}
                        </p>
                      </div>
                    }

                    @if (selectedApplication()!.website) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Website
                        </p>

                        <p class="mt-1 break-all text-sm text-slate-900">
                          {{ selectedApplication()!.website }}
                        </p>
                      </div>
                    }

                    @if (
                      selectedApplication()!.city ||
                      selectedApplication()!.state ||
                      selectedApplication()!.country
                    ) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Location
                        </p>

                        <p class="mt-1 text-sm text-slate-900">
                          {{ getLocation(selectedApplication()!) }}
                        </p>
                      </div>
                    }
                  </div>

                  @if (selectedApplication()!.description) {
                    <div class="mt-4">
                      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Description
                      </p>

                      <p class="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {{ selectedApplication()!.description }}
                      </p>
                    </div>
                  }
                </section>

                <!-- Applicant -->
                <section class="border-t border-slate-200 pt-6">
                  <h3 class="text-lg font-semibold text-slate-900">Applicant</h3>

                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>

                      <p class="mt-1 text-sm text-slate-900">
                        {{ selectedApplication()!.contactName }}
                      </p>
                    </div>

                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Email
                      </p>

                      <p class="mt-1 text-sm text-slate-900">
                        {{ selectedApplication()!.contactEmail }}
                      </p>
                    </div>

                    @if (selectedApplication()!.contactPhone) {
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Phone
                        </p>

                        <p class="mt-1 text-sm text-slate-900">
                          {{ selectedApplication()!.contactPhone }}
                        </p>
                      </div>
                    }

                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Applicant User ID
                      </p>

                      <p class="mt-1 break-all font-mono text-xs text-slate-600">
                        {{ selectedApplication()!.applicantUserId }}
                      </p>
                    </div>
                  </div>
                </section>

                <!-- Requested applications -->
                <section class="border-t border-slate-200 pt-6">
                  <h3 class="text-lg font-semibold text-slate-900">Requested Applications</h3>

                  <div class="mt-4 flex flex-wrap gap-2">
                    @for (
                      application of selectedApplication()!.requestedApplications;
                      track application
                    ) {
                      <span
                        class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {{ applicationLabel(application) }}
                      </span>
                    }
                  </div>
                </section>

                <!-- Review information -->
                <section class="border-t border-slate-200 pt-6">
                  <h3 class="text-lg font-semibold text-slate-900">Review Information</h3>

                  <div class="mt-4 space-y-3 text-sm">
                    <div class="flex justify-between gap-4">
                      <span class="text-slate-500"> Status </span>

                      <span class="font-medium text-slate-900">
                        {{ statusLabel(selectedApplication()!.status) }}
                      </span>
                    </div>

                    @if (selectedApplication()!.createdAt) {
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500"> Created </span>

                        <span class="text-right text-slate-900">
                          {{ formatTimestamp(selectedApplication()!.createdAt) | date: 'medium' }}
                        </span>
                      </div>
                    }

                    @if (selectedApplication()!.submittedAt) {
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500"> Submitted </span>

                        <span class="text-right text-slate-900">
                          {{ formatTimestamp(selectedApplication()!.submittedAt) | date: 'medium' }}
                        </span>
                      </div>
                    }

                    @if (selectedApplication()!.reviewedBy) {
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500"> Reviewed By </span>

                        <span class="break-all font-mono text-xs text-slate-900">
                          {{ selectedApplication()!.reviewedBy }}
                        </span>
                      </div>
                    }

                    @if (selectedApplication()!.reviewedAt) {
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500"> Reviewed </span>

                        <span class="text-right text-slate-900">
                          {{ formatTimestamp(selectedApplication()!.reviewedAt) | date: 'medium' }}
                        </span>
                      </div>
                    }

                    @if (selectedApplication()!.approvedAt) {
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500"> Approved </span>

                        <span class="text-right text-slate-900">
                          {{ formatTimestamp(selectedApplication()!.approvedAt) | date: 'medium' }}
                        </span>
                      </div>
                    }

                    @if (selectedApplication()!.rejectionReason) {
                      <div class="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p class="text-xs font-semibold uppercase tracking-wide text-red-700">
                          Rejection Reason
                        </p>

                        <p class="mt-2 whitespace-pre-wrap text-sm text-red-800">
                          {{ selectedApplication()!.rejectionReason }}
                        </p>
                      </div>
                    }
                  </div>
                </section>

                <!-- Rejection reason -->
                @if (selectedApplication()!.status === 'under_review') {
                  <section class="border-t border-slate-200 pt-6">
                    <label for="rejectionReason" class="block text-sm font-medium text-slate-700">
                      Rejection Reason
                    </label>

                    <p class="mt-1 text-xs text-slate-500">
                      Required when rejecting an application.
                    </p>

                    <textarea
                      id="rejectionReason"
                      rows="4"
                      [value]="rejectionReason()"
                      (input)="rejectionReason.set($any($event.target).value)"
                      placeholder="Provide a clear reason if the application needs to be rejected."
                      class="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    ></textarea>
                  </section>
                }

                <!-- Review state -->
                @if (selectedApplication()!.status === 'submitted') {
                  <section class="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p class="text-sm font-semibold text-blue-900">Review required</p>

                    <p class="mt-1 text-sm text-blue-800">
                      Start the review before approving or rejecting this application.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'under_review') {
                  <section class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p class="text-sm font-semibold text-amber-900">Application is under review</p>

                    <p class="mt-1 text-sm text-amber-800">
                      Review the organization information and requested applications before making a
                      decision.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'approved') {
                  <section class="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p class="text-sm font-semibold text-green-900">Application approved</p>

                    <p class="mt-1 text-sm text-green-800">
                      Organization provisioning should be performed by the trusted backend workflow.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'provisioning') {
                  <section class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p class="text-sm font-semibold text-amber-900">
                      Organization provisioning in progress
                    </p>

                    <p class="mt-1 text-sm text-amber-800">
                      The organization has been approved and Zebron is provisioning its tenant
                      resources.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'onboarding') {
                  <section class="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p class="text-sm font-semibold text-teal-900">Organization onboarding</p>

                    <p class="mt-1 text-sm text-teal-800">
                      The organization has been provisioned and is ready for onboarding.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'active') {
                  <section class="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p class="text-sm font-semibold text-green-900">Organization active</p>

                    <p class="mt-1 text-sm text-green-800">
                      The organization has completed onboarding and is active.
                    </p>
                  </section>
                }

                @if (selectedApplication()!.status === 'rejected') {
                  <section class="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p class="text-sm font-semibold text-red-900">Application rejected</p>

                    <p class="mt-1 text-sm text-red-800">
                      This application is no longer available for approval.
                    </p>
                  </section>
                }
              </div>

              <!-- Actions -->
              <div
                class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:justify-end"
              >
                @if (selectedApplication()!.status === 'submitted') {
                  <button
                    type="button"
                    (click)="startReview()"
                    [disabled]="processing()"
                    class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ processing() ? 'Starting Review...' : 'Start Review' }}
                  </button>
                }

                @if (selectedApplication()!.status === 'under_review') {
                  <button
                    type="button"
                    (click)="rejectApplication()"
                    [disabled]="processing() || !rejectionReason().trim()"
                    class="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ processing() ? 'Processing...' : 'Reject Application' }}
                  </button>

                  <button
                    type="button"
                    (click)="approveApplication()"
                    [disabled]="processing()"
                    class="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ processing() ? 'Processing...' : 'Approve Application' }}
                  </button>
                }

                <button
                  type="button"
                  (click)="closeApplication()"
                  [disabled]="processing()"
                  class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        }
      </div>
    </main>
  `,
})
export class OrganizationApplicationAdminComponent implements OnInit {
  private readonly applicationService = inject(OrganizationApplicationRequestService);

  private readonly provisioningService = inject(OrganizationProvisioningService);

  private readonly authService = inject(AuthService);

  readonly loading = signal(false);

  readonly processing = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly applications = signal<OrganizationApplicationRequest[]>([]);

  readonly selectedApplication = signal<OrganizationApplicationRequest | null>(null);

  readonly rejectionReason = signal('');

  readonly selectedFilter = signal<'all' | OrganizationApplicationRequestStatus>('all');

  readonly filters: Array<{
    status: 'all' | OrganizationApplicationRequestStatus;
    label: string;
  }> = [
    {
      status: 'all',
      label: 'All',
    },
    {
      status: 'submitted',
      label: 'Submitted',
    },
    {
      status: 'under_review',
      label: 'Under Review',
    },
    {
      status: 'approved',
      label: 'Approved',
    },
    {
      status: 'provisioning',
      label: 'Provisioning',
    },
    {
      status: 'onboarding',
      label: 'Onboarding',
    },
    {
      status: 'active',
      label: 'Active',
    },
    {
      status: 'rejected',
      label: 'Rejected',
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadApplications();
  }

  async loadApplications(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const statuses: OrganizationApplicationRequestStatus[] = [
        'submitted',
        'under_review',
        'approved',
        'provisioning',
        'onboarding',
        'active',
        'rejected',
      ];

      const results = await Promise.all(
        statuses.map((status) => this.applicationService.getRequestsByStatus(status)),
      );

      const combined = results
        .flat()
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      this.applications.set(combined);

      const selectedId = this.selectedApplication()?.id;

      if (selectedId) {
        const refreshed = combined.find((application) => application.id === selectedId);

        this.selectedApplication.set(refreshed ?? null);

        if (refreshed) {
          this.rejectionReason.set(refreshed.rejectionReason ?? '');
        }
      }
    } catch (error) {
      console.error('Failed to load organization applications:', error);

      this.errorMessage.set('We could not load organization applications. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  filteredApplications(): OrganizationApplicationRequest[] {
    const filter = this.selectedFilter();

    if (filter === 'all') {
      return this.applications();
    }

    return this.applications().filter((application) => application.status === filter);
  }

  filterCount(status: OrganizationApplicationRequestStatus): number {
    return this.applications().filter((application) => application.status === status).length;
  }

  selectFilter(status: 'all' | OrganizationApplicationRequestStatus): void {
    this.selectedFilter.set(status);
  }

  selectApplication(application: OrganizationApplicationRequest): void {
    this.selectedApplication.set(application);

    this.rejectionReason.set(application.rejectionReason ?? '');

    this.errorMessage.set(null);
  }

  closeApplication(): void {
    if (this.processing()) {
      return;
    }

    this.selectedApplication.set(null);
    this.rejectionReason.set('');
    this.errorMessage.set(null);
  }

  async startReview(): Promise<void> {
    const application = this.selectedApplication();

    if (!application || application.status !== 'submitted') {
      return;
    }

    const firebaseUser = this.authService.firebaseUser();

    if (!firebaseUser) {
      this.errorMessage.set('You must be signed in as a platform administrator.');
      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);

    try {
      await this.applicationService.startReview(application.id, firebaseUser.uid);

      const updated: OrganizationApplicationRequest = {
        ...application,
        status: 'under_review',
        reviewedBy: firebaseUser.uid,
      };

      this.selectedApplication.set(updated);

      this.applications.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      console.error('Failed to start organization application review:', error);

      this.errorMessage.set('We could not start the application review.');
    } finally {
      this.processing.set(false);
    }
  }

  async approveApplication(): Promise<void> {
    const application = this.selectedApplication();

    if (!application) {
      return;
    }

    /*
     * Approval should only happen from the review state.
     */
    if (application.status !== 'under_review') {
      this.errorMessage.set('Only applications under review can be approved.');

      return;
    }

    const firebaseUser = this.authService.firebaseUser();

    if (!firebaseUser) {
      this.errorMessage.set('You must be signed in as a platform administrator.');

      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);

    try {
      /*
       * ------------------------------------------------------------
       * STEP 1
       * ------------------------------------------------------------
       *
       * Mark the application as approved.
       *
       * This remains a normal application lifecycle update.
       */
      await this.applicationService.approveRequest(
  application.id,
  firebaseUser.uid,
);

const approvedApplication:
  OrganizationApplicationRequest = {
  ...application,
  status: 'approved',
  reviewedBy: firebaseUser.uid,
  approvedAt: Timestamp.now(),
};

this.selectedApplication.set(
  approvedApplication,
);

this.applications.update(
  (items) =>
    items.map((item) =>
      item.id === approvedApplication.id
        ? approvedApplication
        : item,
    ),
);

      /*
       * ------------------------------------------------------------
       * STEP 2
       * ------------------------------------------------------------
       *
       * Ask the trusted backend to provision the tenant.
       *
       * The browser does NOT create:
       *
       * - organizations/{organizationId}
       * - organizationMemberships/{membershipId}
       * - organizationOnboarding/{organizationId}
       * - organization applications
       *
       * The Cloud Function performs those operations.
       */
      const provisioningResult = await this.provisioningService.provisionOrganization(
        application.id,
      );

      const provisionedApplication:
  OrganizationApplicationRequest = {
  ...approvedApplication,

  status:
    provisioningResult.status === 'active'
      ? 'active'
      : 'onboarding',

  organizationId:
    provisioningResult.organizationId,
};

this.selectedApplication.set(
  provisionedApplication,
);

this.applications.update(
  (items) =>
    items.map((item) =>
      item.id === provisionedApplication.id
        ? provisionedApplication
        : item,
    ),
);

      /*
       * ------------------------------------------------------------
       * STEP 3
       * ------------------------------------------------------------
       *
       * Update the local UI using the result returned by
       * the trusted backend.
       */
      const updated: OrganizationApplicationRequest = {
        ...application,

        status: provisioningResult.status === 'active' ? 'active' : 'onboarding',

        reviewedBy: firebaseUser.uid,

        organizationId: provisioningResult.organizationId,
      };

      this.selectedApplication.set(updated);

      this.applications.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );

      /*
       * Refresh from Firestore so the admin UI reflects the
       * authoritative backend state.
       */
      await this.loadApplications();

      /*
       * Re-select the provisioned application after refresh.
       */
      const refreshedApplication = this.applications().find((item) => item.id === application.id);

      if (refreshedApplication) {
        this.selectedApplication.set(refreshedApplication);
      }

      this.rejectionReason.set('');
    } catch (error) {
      console.error('Failed to approve and provision organization application:', error);

      /*
       * IMPORTANT:
       *
       * If approval succeeded but provisioning failed,
       * the application remains "approved".
       *
       * That is intentional.
       *
       * The application can be retried without creating
       * a duplicate organization.
       */
      this.errorMessage.set(
        'The application was approved, but organization provisioning could not be completed. Please retry provisioning.',
      );
    } finally {
      this.processing.set(false);
    }
  }

  async rejectApplication(): Promise<void> {
    const application = this.selectedApplication();

    if (!application || application.status !== 'under_review') {
      return;
    }

    const reason = this.rejectionReason().trim();

    if (!reason) {
      this.errorMessage.set('Please provide a rejection reason.');
      return;
    }

    const firebaseUser = this.authService.firebaseUser();

    if (!firebaseUser) {
      this.errorMessage.set('You must be signed in as a platform administrator.');
      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);

    try {
      await this.applicationService.rejectRequest(application.id, firebaseUser.uid, reason);

      const updated: OrganizationApplicationRequest = {
        ...application,
        status: 'rejected',
        reviewedBy: firebaseUser.uid,
        rejectionReason: reason,
      };

      this.selectedApplication.set(updated);

      this.applications.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );

      this.rejectionReason.set(reason);
    } catch (error) {
      console.error('Failed to reject organization application:', error);

      this.errorMessage.set('We could not reject the application.');
    } finally {
      this.processing.set(false);
    }
  }

  statusLabel(status: OrganizationApplicationRequestStatus): string {
    const labels: Record<OrganizationApplicationRequestStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      provisioning: 'Provisioning',
      onboarding: 'Onboarding',
      active: 'Active',
      cancelled: 'Cancelled',
    };

    return labels[status];
  }

  applicationLabel(application: string): string {
    const labels: Record<string, string> = {
      community: 'Community',
      'test-center': 'Test Center',
      knowledge: 'Knowledge Center',
    };

    return labels[application] ?? application;
  }

  getLocation(request: OrganizationApplicationRequest): string {
    return [request.city, request.state, request.country]
      .filter((value): value is string => Boolean(value))
      .join(', ');
  }

  formatTimestamp(
    timestamp:
      | OrganizationApplicationRequest['createdAt']
      | OrganizationApplicationRequest['submittedAt'],
  ): Date | null {
    return timestamp?.toDate() ?? null;
  }
}
