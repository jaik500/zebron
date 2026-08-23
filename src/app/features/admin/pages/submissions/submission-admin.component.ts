import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getAuth } from 'firebase/auth';

import { HotToastService } from '@ngxpert/hot-toast';

import { ResourceSubmission, SubmissionStatus } from '../../../../core/models/submission.model';

import { SubmissionService } from '../../../../core/services/submission.service';

@Component({
  selector: 'app-submission-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- <div class="m-1">
        <a routerLink="/admin" class="text-sm text-gray-600 transition hover:text-gray-900">
          ← Admin Dashboard
        </a>
      </div> -->
      <!-- Header -->
      <header class="border-b border-gray-200 bg-[#032D42]">
        <div
          class="mx-auto flex max-w-7xl items-center
                 justify-between gap-4 px-4 py-4
                 sm:px-6 lg:px-8 "
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wider
             text-[#7ED6D1]"
            >
              Request management
            </p>
            <h1
              class="text-xl font-bold text-white
                     sm:text-3xl"
            >
              Submissions
            </h1>

            <p class="mt-1 text-sm text-white/80">Review and manage submitted resources.</p>
          </div>

          <a
            routerLink="/admin"
            class="shrink-0 rounded-lg border
                   border-gray-300 bg-white px-3 py-2
                   text-sm font-semibold text-gray-700
                   hover:border-[#032D42]
                   hover:text-[#032D42]"
          >
            Admin Dashboard
          </a>
        </div>
      </header>

      <!-- Main -->
      <main
        class="mx-auto max-w-7xl px-4 py-2
               sm:px-6 lg:px-8"
      >
        <!-- Search and filter -->
        <section
          class="mb-4 rounded-xl border
                 border-gray-200 bg-white p-4
                 shadow-sm sm:p-4"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label
                for="search"
                class="mb-2 block text-sm
                       font-medium text-gray-700"
              >
                Search submissions
              </label>

              <input
                id="search"
                type="search"
                [(ngModel)]="searchTerm"
                placeholder="Search by resource name, organization, email..."
                class="w-full rounded-lg border
                       border-gray-300 px-4 py-2.5
                       text-sm outline-none
                       focus:border-[#007979]
                       focus:ring-2
                       focus:ring-[#007979]/20"
              />
            </div>

            <div>
              <label
                for="status"
                class="mb-2 block text-sm
                       font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status"
                [(ngModel)]="statusFilter"
                class="w-full rounded-lg border
                       border-gray-300 bg-white
                       px-4 py-2.5 text-sm outline-none
                       focus:border-[#007979]
                       focus:ring-2
                       focus:ring-[#007979]/20"
              >
                <option value="all">All statuses</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div
            class="mt-2 flex items-center
                   justify-between border-t
                   border-gray-100 pt-2"
          >
            <p class="text-sm text-gray-500">
              Showing
              <strong>
                {{ filteredSubmissions().length }}
              </strong>
              of
              <strong>
                {{ submissions().length }}
              </strong>
              submissions
            </p>

            @if (searchTerm || statusFilter !== 'all') {
              <button
                type="button"
                (click)="clearFilters()"
                class="text-sm font-semibold
                       text-[#007979]
                       hover:underline"
              >
                Clear filters
              </button>
            }
          </div>
        </section>

        <!-- Loading -->
        @if (loading()) {
          <div
            class="rounded-xl border
                   border-gray-200 bg-white
                   p-10 text-center shadow-sm"
          >
            <div
              class="mx-auto h-8 w-8 animate-spin
                     rounded-full border-4
                     border-gray-200
                     border-t-[#007979]"
            ></div>

            <p class="mt-4 text-sm text-gray-500">Loading submissions...</p>
          </div>
        }

        <!-- Error -->
        @else if (errorMessage()) {
          <div
            class="rounded-xl border
                   border-red-200 bg-red-50
                   p-6 text-center"
          >
            <h2 class="font-semibold text-red-800">Unable to load submissions</h2>

            <p class="mt-2 text-sm text-red-700">
              {{ errorMessage() }}
            </p>

            <button
              type="button"
              (click)="loadSubmissions()"
              class="mt-4 rounded-lg
                     bg-red-700 px-4 py-2
                     text-sm font-semibold
                     text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        }

        <!-- No results -->
        @else if (filteredSubmissions().length === 0) {
          <div
            class="rounded-xl border
                   border-gray-200 bg-white
                   p-10 text-center shadow-sm"
          >
            <h2
              class="text-lg font-semibold
                     text-[#032D42]"
            >
              @if (searchTerm || statusFilter !== 'all') {
                No submissions found
              } @else {
                No submissions yet
              }
            </h2>

            <p class="mt-2 text-sm text-gray-500">
              @if (searchTerm || statusFilter !== 'all') {
                No submissions match your current search or filter.
              } @else {
                Submitted resources will appear here for administrator review.
              }
            </p>

            @if (searchTerm || statusFilter !== 'all') {
              <button
                type="button"
                (click)="clearFilters()"
                class="mt-4 text-sm font-semibold
                       text-[#007979]
                       hover:underline"
              >
                Clear filters
              </button>
            }
          </div>
        }

        <!-- Submission list -->
        @else {
          <div class="space-y-4">
            @for (submission of filteredSubmissions(); track submission.id) {
             <article
  class="rounded-lg border
         border-gray-200 bg-white
         px-4 py-3 shadow-sm
         transition hover:shadow-md"
>
  <!-- =========================================================
       HEADER
       Resource name, status, and submission date
       ========================================================= -->
  <div
    class="flex items-center
           justify-between gap-3"
  >

    <!-- Resource name + status -->
    <div
      class="flex min-w-0
             items-center gap-2"
    >
      <h2
        class="truncate text-base
               font-semibold text-[#032D42]"
        [title]="submission.resourceName"
      >
        {{ submission.resourceName }}
      </h2>

      <span
        class="shrink-0 rounded-full
               px-2 py-0.5 text-[11px]
               font-semibold"
        [class.bg-yellow-100]="submission.status === 'pending'"
        [class.text-yellow-800]="submission.status === 'pending'"
        [class.bg-green-100]="submission.status === 'approved'"
        [class.text-green-800]="submission.status === 'approved'"
        [class.bg-red-100]="submission.status === 'rejected'"
        [class.text-red-800]="submission.status === 'rejected'"
      >
        {{ submission.status | titlecase }}
      </span>
    </div>

    <!-- Date -->
    <span
      class="shrink-0 whitespace-nowrap
             text-xs text-gray-400"
    >
      {{ formatDate(submission.createdAt) }}
    </span>

  </div>


  <!-- =========================================================
       DESCRIPTION
       Keep the description compact.
       ========================================================= -->
  @if (submission.description) {
    <p
      class="mt-1 line-clamp-2
             text-xs leading-5
             text-gray-500"
      [title]="submission.description"
    >
      {{ submission.description }}
    </p>
  }


  <!-- =========================================================
       COMPACT METADATA + ACTIONS
       ========================================================= -->
  <div
    class="mt-2 flex flex-col
           gap-2 border-t border-gray-100
           pt-2 sm:flex-row
           sm:items-center
           sm:justify-between"
  >

    <!-- Metadata -->
    <div
      class="flex min-w-0
             flex-wrap items-center
             gap-x-4 gap-y-1"
    >

      <!-- Organization -->
      @if (submission.organizationName) {
        <div
          class="flex min-w-0
                 items-center gap-1"
        >
          <span
            class="text-[10px]
                   font-semibold uppercase
                   tracking-wide
                   text-gray-400"
          >
            Org:
          </span>

          <span
            class="truncate text-xs
                   text-gray-700"
          >
            {{ submission.organizationName }}
          </span>
        </div>
      }


      <!-- Submitter -->
      @if (submission.submitterEmail) {
        <div
          class="flex min-w-0
                 items-center gap-1"
        >
          <span
            class="text-[10px]
                   font-semibold uppercase
                   tracking-wide
                   text-gray-400"
          >
            From:
          </span>

          <span
            class="max-w-[220px]
                   truncate text-xs
                   text-gray-700"
            [title]="submission.submitterEmail"
          >
            {{ submission.submitterEmail }}
          </span>
        </div>
      }


      <!-- Website -->
      @if (submission.website) {
        <div
          class="flex min-w-0
                 items-center gap-1"
        >
          <span
            class="text-[10px]
                   font-semibold uppercase
                   tracking-wide
                   text-gray-400"
          >
            Web:
          </span>

          <a
            [href]="submission.website"
            target="_blank"
            rel="noopener noreferrer"
            class="max-w-[180px]
                   truncate text-xs
                   font-medium
                   text-[#007979]
                   hover:underline"
            [title]="submission.website"
          >
            {{ submission.website }}
          </a>
        </div>
      }

    </div>


    <!-- =======================================================
         ACTIONS
         ======================================================= -->
    <div
      class="flex shrink-0
             items-center gap-1.5"
    >

      <!-- View -->
      <button
        type="button"
        (click)="openDetails(submission)"
        class="rounded-md border
               border-gray-300
               bg-white px-2.5 py-1.5
               text-xs font-semibold
               text-gray-700
               transition
               hover:border-[#007979]
               hover:text-[#007979]"
      >
        View
      </button>


      <!-- Approve -->
      @if (submission.status !== 'approved') {
        <button
          type="button"
          (click)="approveSubmission(submission)"
          [disabled]="processingId() === submission.id"
          class="rounded-md bg-green-700
                 px-2.5 py-1.5
                 text-xs font-semibold
                 text-white transition
                 hover:bg-green-800
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
        >
          Approve
        </button>
      }


      <!-- Reject -->
      @if (submission.status !== 'rejected') {
        <button
          type="button"
          (click)="rejectSubmission(submission)"
          [disabled]="processingId() === submission.id"
          class="rounded-md bg-red-700
                 px-2.5 py-1.5
                 text-xs font-semibold
                 text-white transition
                 hover:bg-red-800
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
        >
          Reject
        </button>
      }


      <!-- Delete -->
      <button
        type="button"
        (click)="deleteSubmission(submission)"
        [disabled]="processingId() === submission.id"
        class="rounded-md border
               border-gray-300
               bg-white px-2.5 py-1.5
               text-xs font-semibold
               text-gray-700 transition
               hover:border-red-300
               hover:text-red-700
               disabled:cursor-not-allowed
               disabled:opacity-50"
      >
        Delete
      </button>

    </div>

  </div>

</article>
            }
          </div>
        }
      </main>

      <!-- Details modal -->
      @if (selectedSubmission()) {
        <div
          class="fixed inset-0 z-50 flex
                 items-center justify-center
                 bg-black/50 p-4"
          (click)="closeDetails()"
        >
          <div
            class="max-h-[90vh] w-full max-w-2xl
                   overflow-y-auto rounded-2xl
                   bg-white shadow-xl"
            (click)="$event.stopPropagation()"
          >
            <div
              class="flex items-center
                     justify-between border-b
                     border-gray-200 px-6 py-4"
            >
              <h2
                class="text-lg font-bold
                       text-[#032D42]"
              >
                Submission Details
              </h2>

              <button
                type="button"
                (click)="closeDetails()"
                class="rounded-lg p-2
                       text-gray-500
                       hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div class="space-y-5 p-6">
              <div>
                <p
                  class="text-xs font-semibold
                         uppercase tracking-wide
                         text-gray-400"
                >
                  Resource Name
                </p>

                <p
                  class="mt-1 text-lg font-semibold
                         text-[#032D42]"
                >
                  {{ selectedSubmission()?.resourceName }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold
                         uppercase tracking-wide
                         text-gray-400"
                >
                  Description
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap
                         text-sm leading-6
                         text-gray-700"
                >
                  {{ selectedSubmission()?.description }}
                </p>
              </div>

              @if (selectedSubmission()?.organizationName) {
                <div>
                  <p
                    class="text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-400"
                  >
                    Organization
                  </p>

                  <p
                    class="mt-1 text-sm
                           text-gray-700"
                  >
                    {{ selectedSubmission()?.organizationName }}
                  </p>
                </div>
              }

              @if (selectedSubmission()?.submitterEmail) {
                <div>
                  <p
                    class="text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-400"
                  >
                    Submitter Email
                  </p>

                  <p
                    class="mt-1 break-all
                           text-sm text-gray-700"
                  >
                    {{ selectedSubmission()?.submitterEmail }}
                  </p>
                </div>
              }

              @if (selectedSubmission()?.website) {
                <div>
                  <p
                    class="text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-400"
                  >
                    Website
                  </p>

                  <a
                    [href]="selectedSubmission()?.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-1 block break-all
                           text-sm font-medium
                           text-[#007979]
                           hover:underline"
                  >
                    {{ selectedSubmission()?.website }}
                  </a>
                </div>
              }
            </div>

            <div
              class="flex justify-end
                     border-t border-gray-200
                     px-6 py-4"
            >
              <button
                type="button"
                (click)="closeDetails()"
                class="rounded-lg bg-[#032D42]
                       px-4 py-2 text-sm
                       font-semibold text-white
                       hover:bg-[#021f2d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SubmissionAdminComponent implements OnInit {
  private readonly submissionService = inject(SubmissionService);

  private readonly toast = inject(HotToastService);

  readonly submissions = signal<ResourceSubmission[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly processingId = signal<string | null>(null);

  readonly selectedSubmission = signal<ResourceSubmission | null>(null);

  searchTerm = '';

  statusFilter: 'all' | SubmissionStatus = 'all';

  /**
   * Apply search and status filters.
   */
  readonly filteredSubmissions = computed(() => {
    const search = this.searchTerm.trim().toLowerCase();

    return this.submissions().filter((submission) => {
      if (this.statusFilter !== 'all' && submission.status !== this.statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        submission.resourceName,
        submission.description,
        submission.organizationName,
        submission.submitterEmail,
        submission.website,
        submission.categoryId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  });

  ngOnInit(): void {
    this.loadSubmissions();
  }

  /**
   * Load submissions from Firestore.
   */
  async loadSubmissions(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const submissions = await this.submissionService.getSubmissions();

      this.submissions.set(submissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);

      this.errorMessage.set('Unable to load submissions. Please try again.');

      this.toast.error('Unable to load submissions.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Approve a submission.
   */
  async approveSubmission(submission: ResourceSubmission): Promise<void> {
    if (this.processingId()) {
      return;
    }

    const confirmed = window.confirm(`Approve "${submission.resourceName}"?`);

    if (!confirmed) {
      return;
    }

    this.processingId.set(submission.id);

    try {
      const reviewerId = this.getCurrentUserId();

      if (!reviewerId) {
        throw new Error('No authenticated administrator found.');
      }

      await this.submissionService.updateSubmissionStatus(submission.id, 'approved', reviewerId);

      this.toast.success('Submission approved successfully.');

      await this.loadSubmissions();
    } catch (error) {
      console.error('Failed to approve submission:', error);

      this.toast.error('Unable to approve submission.');
    } finally {
      this.processingId.set(null);
    }
  }

  /**
   * Reject a submission.
   */
  async rejectSubmission(submission: ResourceSubmission): Promise<void> {
    if (this.processingId()) {
      return;
    }

    const confirmed = window.confirm(`Reject "${submission.resourceName}"?`);

    if (!confirmed) {
      return;
    }

    this.processingId.set(submission.id);

    try {
      const reviewerId = this.getCurrentUserId();

      if (!reviewerId) {
        throw new Error('No authenticated administrator found.');
      }

      await this.submissionService.updateSubmissionStatus(submission.id, 'rejected', reviewerId);

      this.toast.success('Submission rejected successfully.');

      await this.loadSubmissions();
    } catch (error) {
      console.error('Failed to reject submission:', error);

      this.toast.error('Unable to reject submission.');
    } finally {
      this.processingId.set(null);
    }
  }

  /**
   * Delete a submission.
   */
  async deleteSubmission(submission: ResourceSubmission): Promise<void> {
    if (this.processingId()) {
      return;
    }

    const confirmed = window.confirm(`Delete "${submission.resourceName}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    this.processingId.set(submission.id);

    try {
      await this.submissionService.deleteSubmission(submission.id);

      this.toast.success('Submission deleted successfully.');

      await this.loadSubmissions();
    } catch (error) {
      console.error('Failed to delete submission:', error);

      this.toast.error('Unable to delete submission.');
    } finally {
      this.processingId.set(null);
    }
  }

  /**
   * Open submission details.
   */
  openDetails(submission: ResourceSubmission): void {
    this.selectedSubmission.set(submission);
  }

  /**
   * Close submission details.
   */
  closeDetails(): void {
    this.selectedSubmission.set(null);
  }

  /**
   * Clear filters.
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
  }

  /**
   * Get the current Firebase Authentication UID.
   */
  private getCurrentUserId(): string | null {
    return getAuth().currentUser?.uid ?? null;
  }

  /**
   * Format a Firestore timestamp.
   */
  formatDate(timestamp: unknown): string {
    if (!timestamp) {
      return '—';
    }

    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      const value = timestamp as {
        toDate: () => Date;
      };

      if (typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }

    return '—';
  }
}
