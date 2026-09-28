import { CommonModule, DatePipe } from '@angular/common';

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

import { OrganizationApplicationRequestService } from '../../../core/services/organization-application-request.service';

import {
  OrganizationApplicationRequest,
  OrganizationApplicationRequestStatus,
} from '../../../core/models/organization-application-request.model';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-organization-application-status',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <!-- Header -->
        <div class="mb-8">
          <a routerLink="/" class="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to Zebron
          </a>

          <h1 class="mt-4 text-3xl font-bold text-slate-900">Organization Application</h1>

          <p class="mt-2 text-slate-600">Track the status of your organization application.</p>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div class="text-slate-600">Loading your application...</div>
          </div>
        }

        <!-- Error -->
        @if (!loading() && errorMessage()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 class="font-semibold text-red-900">Unable to load application</h2>

            <p class="mt-2 text-sm text-red-700">
              {{ errorMessage() }}
            </p>

            <div class="mt-5">
              <a
                routerLink="/organizations/apply"
                class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Start an application
              </a>
            </div>
          </div>
        }

        @if (!loading() && request()) {
          <!-- Status Card -->
          <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500">Organization</p>

                <h2 class="mt-1 text-2xl font-bold text-slate-900">
                  {{ request()!.organizationName }}
                </h2>

                <p class="mt-2 text-sm text-slate-500">
                  Application ID:
                  <span class="font-mono">
                    {{ request()!.id }}
                  </span>
                </p>
              </div>

              <span
                class="inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold"
                [class.bg-slate-100]="request()!.status === 'draft'"
                [class.text-slate-700]="request()!.status === 'draft'"
                [class.bg-blue-100]="
                  request()!.status === 'submitted' || request()!.status === 'under_review'
                "
                [class.text-blue-800]="
                  request()!.status === 'submitted' || request()!.status === 'under_review'
                "
                [class.bg-green-100]="
                  request()!.status === 'approved' || request()!.status === 'active'
                "
                [class.text-green-800]="
                  request()!.status === 'approved' || request()!.status === 'active'
                "
                [class.bg-amber-100]="
                  request()!.status === 'provisioning' || request()!.status === 'onboarding'
                "
                [class.text-amber-800]="
                  request()!.status === 'provisioning' || request()!.status === 'onboarding'
                "
                [class.bg-red-100]="request()!.status === 'rejected'"
                [class.text-red-800]="request()!.status === 'rejected'"
                [class.bg-gray-100]="request()!.status === 'cancelled'"
                [class.text-gray-700]="request()!.status === 'cancelled'"
              >
                {{ statusLabel(request()!.status) }}
              </span>
            </div>

            <!-- Draft actions -->
            @if (request()!.status === 'draft') {
              <div class="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <a
                  [routerLink]="['/organizations/apply', request()!.id]"
                  class="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Edit Application
                </a>

                <button
                  type="button"
                  (click)="submitApplication()"
                  [disabled]="submitting()"
                  class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ submitting() ? 'Submitting...' : 'Submit Application' }}
                </button>
              </div>
            }

            <!-- Rejection -->
            @if (request()!.status === 'rejected' && request()!.rejectionReason) {
              <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
                <h3 class="font-semibold text-red-900">Application requires changes</h3>

                <p class="mt-2 text-sm text-red-800">
                  {{ request()!.rejectionReason }}
                </p>
              </div>
            }
          </section>

          <!-- Lifecycle -->
          <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-semibold text-slate-900">Application Progress</h2>

            <p class="mt-1 text-sm text-slate-500">
              Your application moves through these stages after submission.
            </p>

            <div class="mt-8 space-y-7">
              @for (step of lifecycleSteps; track step.status) {
                <div class="flex gap-4">
                  <!-- Indicator -->
                  <div class="flex flex-col items-center">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold"
                      [class.border-green-600]="stepState(step.status) === 'complete'"
                      [class.bg-green-600]="stepState(step.status) === 'complete'"
                      [class.text-white]="stepState(step.status) === 'complete'"
                      [class.border-blue-600]="stepState(step.status) === 'current'"
                      [class.bg-blue-50]="stepState(step.status) === 'current'"
                      [class.text-blue-700]="stepState(step.status) === 'current'"
                      [class.border-slate-300]="stepState(step.status) === 'upcoming'"
                      [class.text-slate-400]="stepState(step.status) === 'upcoming'"
                    >
                      @if (stepState(step.status) === 'complete') {
                        ✓
                      } @else {
                        {{ step.number }}
                      }
                    </div>

                    @if (!$last) {
                      <div
                        class="mt-2 h-full min-h-7 w-px"
                        [class.bg-green-300]="stepState(step.status) === 'complete'"
                        [class.bg-slate-200]="stepState(step.status) !== 'complete'"
                      ></div>
                    }
                  </div>

                  <!-- Description -->
                  <div class="pb-2">
                    <h3
                      class="font-semibold"
                      [class.text-slate-900]="stepState(step.status) !== 'upcoming'"
                      [class.text-slate-400]="stepState(step.status) === 'upcoming'"
                    >
                      {{ step.label }}
                    </h3>

                    <p
                      class="mt-1 text-sm"
                      [class.text-slate-600]="stepState(step.status) !== 'upcoming'"
                      [class.text-slate-400]="stepState(step.status) === 'upcoming'"
                    >
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Organization Details -->
          <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-semibold text-slate-900">Organization Details</h2>

            <div class="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Organization Name
                </p>

                <p class="mt-1 text-sm text-slate-900">
                  {{ request()!.organizationName }}
                </p>
              </div>

              @if (request()!.organizationType) {
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Organization Type
                  </p>

                  <p class="mt-1 text-sm text-slate-900">
                    {{ request()!.organizationType }}
                  </p>
                </div>
              }

              @if (request()!.website) {
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Website</p>

                  <p class="mt-1 text-sm text-slate-900">
                    {{ request()!.website }}
                  </p>
                </div>
              }

              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Contact Name
                </p>

                <p class="mt-1 text-sm text-slate-900">
                  {{ request()!.contactName }}
                </p>
              </div>

              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Contact Email
                </p>

                <p class="mt-1 text-sm text-slate-900">
                  {{ request()!.contactEmail }}
                </p>
              </div>

              @if (request()!.contactPhone) {
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contact Phone
                  </p>

                  <p class="mt-1 text-sm text-slate-900">
                    {{ request()!.contactPhone }}
                  </p>
                </div>
              }

              @if (request()!.city || request()!.state || request()!.country) {
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Location</p>

                  <p class="mt-1 text-sm text-slate-900">
                    {{ getLocation(request()!) }}
                  </p>
                </div>
              }
            </div>
          </section>

          <!-- Requested Applications -->
          <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-semibold text-slate-900">Requested Applications</h2>

            <div class="mt-5 flex flex-wrap gap-2">
              @for (application of request()!.requestedApplications; track application) {
                <span
                  class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {{ applicationLabel(application) }}
                </span>
              }
            </div>
          </section>

          <!-- Dates -->
          <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-semibold text-slate-900">Application History</h2>

            <div class="mt-5 space-y-4 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-slate-500"> Created </span>

                <span class="text-right text-slate-900">
                  {{ formatTimestamp(request()!.createdAt) | date:'medium' }}
                </span>
              </div>

              @if (request()!.submittedAt) {
                <div class="flex justify-between gap-4">
                  <span class="text-slate-500"> Submitted </span>

                  <span class="text-right text-slate-900">
                   {{ formatTimestamp(request()!.submittedAt) | date:'medium' }}
                  </span>
                </div>
              }

              @if (request()!.reviewedAt) {
                <div class="flex justify-between gap-4">
                  <span class="text-slate-500"> Reviewed </span>

                  <span class="text-right text-slate-900">
                   {{ formatTimestamp(request()!.reviewedAt) | date:'medium' }}
                  </span>
                </div>
              }

              @if (request()!.approvedAt) {
                <div class="flex justify-between gap-4">
                  <span class="text-slate-500"> Approved </span>

                  <span class="text-right text-slate-900">
                   {{ formatTimestamp(request()!.approvedAt) | date:'medium' }}
                  </span>
                </div>
              }

              @if (request()!.organizationId) {
                <div class="flex justify-between gap-4">
                  <span class="text-slate-500"> Organization ID </span>

                  <span class="font-mono text-right text-slate-900">
                    {{ request()!.organizationId }}
                  </span>
                </div>
              }
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class OrganizationApplicationStatusComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly applicationService = inject(OrganizationApplicationRequestService);

  readonly loading = signal(true);

  readonly submitting = signal(false);

  readonly request = signal<OrganizationApplicationRequest | null>(null);

  readonly errorMessage = signal<string | null>(null);

  readonly lifecycleSteps = [
    {
      number: 1,
      status: 'submitted' as OrganizationApplicationRequestStatus,
      label: 'Submitted',
      description: 'Your organization application has been submitted to Zebron.',
    },
    {
      number: 2,
      status: 'under_review' as OrganizationApplicationRequestStatus,
      label: 'Under Review',
      description: 'A platform administrator is reviewing your application.',
    },
    {
      number: 3,
      status: 'approved' as OrganizationApplicationRequestStatus,
      label: 'Approved',
      description: 'Your organization has been approved for onboarding.',
    },
    {
      number: 4,
      status: 'provisioning' as OrganizationApplicationRequestStatus,
      label: 'Provisioning',
      description: 'Zebron is creating the organization and initial tenant configuration.',
    },
    {
      number: 5,
      status: 'onboarding' as OrganizationApplicationRequestStatus,
      label: 'Onboarding',
      description: 'Complete the remaining organization setup steps.',
    },
    {
      number: 6,
      status: 'active' as OrganizationApplicationRequestStatus,
      label: 'Active',
      description: 'Your organization is active and ready to use Zebron.',
    },
  ];

  readonly isTerminal = computed(() => {
    const status = this.request()?.status;

    return status === 'active' || status === 'rejected' || status === 'cancelled';
  });

  async ngOnInit(): Promise<void> {
    await this.loadRequest();
  }

  private async loadRequest(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const requestId = this.route.snapshot.paramMap.get('id');

      if (!requestId) {
        this.errorMessage.set('No organization application ID was provided.');
        return;
      }

      const firebaseUser = this.authService.firebaseUser();

      if (!firebaseUser) {
        this.errorMessage.set('You must be signed in to view this application.');
        return;
      }

      const application = await this.applicationService.getRequest(requestId);

      if (!application) {
        this.errorMessage.set('The organization application could not be found.');
        return;
      }

      /*
       * Firestore rules already protect this document.
       * This client-side check provides an additional UX boundary
       * and prevents displaying a request that does not belong
       * to the current applicant.
       */
      if (application.applicantUserId !== firebaseUser.uid && !this.authService.isAdmin) {
        this.errorMessage.set('You do not have permission to view this organization application.');
        return;
      }

      this.request.set(application);
    } catch (error) {
      console.error('Failed to load organization application:', error);

      this.errorMessage.set('We could not load your organization application. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async submitApplication(): Promise<void> {
    const application = this.request();

    if (!application || application.status !== 'draft') {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.applicationService.submitRequest(application.id);

      this.request.set({
        ...application,
        status: 'submitted',
      });
    } catch (error) {
      console.error('Failed to submit organization application:', error);

      this.errorMessage.set('We could not submit your application. Please try again.');
    } finally {
      this.submitting.set(false);
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

 stepState(
  stepStatus: OrganizationApplicationRequestStatus,
): 'complete' | 'current' | 'upcoming' {
  const requestStatus = this.request()?.status;

  if (!requestStatus) {
    return 'upcoming';
  }

  // Rejected or cancelled applications stop progressing.
  if (
    requestStatus === 'rejected' ||
    requestStatus === 'cancelled'
  ) {
    return stepStatus === 'submitted'
      ? 'complete'
      : 'upcoming';
  }

  const order: OrganizationApplicationRequestStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'approved',
    'provisioning',
    'onboarding',
    'active',
  ];

  const currentIndex = order.indexOf(requestStatus);
  const stepIndex = order.indexOf(stepStatus);

  if (currentIndex === -1 || stepIndex === -1) {
    return 'upcoming';
  }

  if (stepIndex < currentIndex) {
    return 'complete';
  }

  if (stepIndex === currentIndex) {
    return 'current';
  }

  return 'upcoming';
}

  getLocation(request: OrganizationApplicationRequest): string {
    return [request.city, request.state, request.country]
      .filter((value): value is string => Boolean(value))
      .join(', ');
  }

  formatTimestamp(
  timestamp: Timestamp | undefined,
): Date | null {
  return timestamp?.toDate() ?? null;
}
}
