import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  ResourceSubmission,
  SubmissionStatus,
} from '../../../core/models/submission.model';

import { SubmissionService } from '../../../core/services/submission.service';


// ============================================================
// STATE
// ============================================================

interface SubmissionState {
  submissions: ResourceSubmission[];

  selectedSubmission: ResourceSubmission | null;

  loading: boolean;

  error: string | null;
}


const initialState: SubmissionState = {
  submissions: [],

  selectedSubmission: null,

  loading: false,

  error: null,
};


// ============================================================
// SUBMISSION STORE
// ============================================================

export const SubmissionStore = signalStore(

  {
    providedIn: 'root',
  },


  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),


  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed(
    ({
      submissions,
    }) => ({

      // --------------------------------------------------------
      // Total
      // --------------------------------------------------------

      resultCount: computed(
        () =>
          submissions().length,
      ),


      // --------------------------------------------------------
      // Pending
      // --------------------------------------------------------

      pendingSubmissions: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'pending',
        ),
      ),


      // --------------------------------------------------------
      // Approved
      // --------------------------------------------------------

      approvedSubmissions: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'approved',
        ),
      ),


      // --------------------------------------------------------
      // Rejected
      // --------------------------------------------------------

      rejectedSubmissions: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'rejected',
        ),
      ),


      // --------------------------------------------------------
      // Counts
      // --------------------------------------------------------

      pendingCount: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'pending',
        ).length,
      ),

      approvedCount: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'approved',
        ).length,
      ),

      rejectedCount: computed(() =>
        submissions().filter(
          (submission) =>
            submission.status === 'rejected',
        ).length,
      ),

    }),
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      submissionService =
        inject(SubmissionService),
    ) => ({


      // ========================================================
      // LOAD ALL SUBMISSIONS
      // ========================================================

      async loadSubmissions(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const submissions =
            await submissionService
              .getAllSubmissions();


          patchState(
            store,
            {
              submissions,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load submissions:',
            error,
          );


          patchState(
            store,
            {
              submissions: [],

              loading: false,

              error:
                'Unable to load submissions. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // LOAD SUBMISSIONS BY STATUS
      // ========================================================

      async loadSubmissionsByStatus(
        status: SubmissionStatus,
      ): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const submissions =
            await submissionService
              .getSubmissionsByStatus(
                status,
              );


          patchState(
            store,
            {
              submissions,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load submissions by status:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to load submissions. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // GET SUBMISSION
      // ========================================================

      async getSubmission(
        submissionId: string,
      ): Promise<ResourceSubmission | null> {

        try {

          const submission =
            await submissionService
              .getSubmissionById(
                submissionId,
              );


          patchState(
            store,
            {
              selectedSubmission:
                submission,
            },
          );


          return submission;

        } catch (error) {

          console.error(
            'Failed to get submission:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // CREATE SUBMISSION
      // ========================================================

      async createSubmission(
        submission: Omit<
          ResourceSubmission,
          'id' | 'status' | 'createdAt'
        >,
      ): Promise<string> {

        try {

          const submissionId =
            await submissionService
              .createSubmission(
                submission,
              );


          return submissionId;

        } catch (error) {

          console.error(
            'Failed to create submission:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // UPDATE STATUS
      // ========================================================

      async updateSubmissionStatus(
        submissionId: string,

        status: SubmissionStatus,

        reviewedBy?: string,

        rejectionReason?: string,
      ): Promise<void> {

        try {

          await submissionService
            .updateSubmissionStatus(
              submissionId,
              status,
              reviewedBy,
              rejectionReason,
            );


          patchState(
            store,
            {
              submissions:
                store.submissions().map(
                  (submission) =>
                    submission.id === submissionId
                      ? {
                          ...submission,

                          status,

                          ...(reviewedBy
                            ? {
                                reviewedBy,
                              }
                            : {}),

                          ...(rejectionReason
                            ? {
                                rejectionReason:
                                  rejectionReason.trim(),
                              }
                            : {}),
                        }
                      : submission,
                ),
            },
          );


        } catch (error) {

          console.error(
            'Failed to update submission status:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // APPROVE SUBMISSION
      // ========================================================

      async approveSubmission(
        submissionId: string,

        reviewedBy: string,
      ): Promise<void> {

        await submissionService
          .approveSubmission(
            submissionId,
            reviewedBy,
          );


        patchState(
          store,
          {
            submissions:
              store.submissions().map(
                (submission) =>
                  submission.id === submissionId
                    ? {
                        ...submission,

                        status: 'approved',

                        reviewedBy,
                      }
                    : submission,
              ),
          },
        );

      },


      // ========================================================
      // REJECT SUBMISSION
      // ========================================================

      async rejectSubmission(
        submissionId: string,

        reviewedBy: string,

        rejectionReason?: string,
      ): Promise<void> {

        await submissionService
          .rejectSubmission(
            submissionId,
            reviewedBy,
            rejectionReason,
          );


        patchState(
          store,
          {
            submissions:
              store.submissions().map(
                (submission) =>
                  submission.id === submissionId
                    ? {
                        ...submission,

                        status: 'rejected',

                        reviewedBy,

                        ...(rejectionReason?.trim()
                          ? {
                              rejectionReason:
                                rejectionReason.trim(),
                            }
                          : {}),
                      }
                    : submission,
              ),
          },
        );

      },


      // ========================================================
      // DELETE SUBMISSION
      // ========================================================

      async deleteSubmission(
        submissionId: string,
      ): Promise<void> {

        try {

          await submissionService
            .deleteSubmission(
              submissionId,
            );


          patchState(
            store,
            {
              submissions:
                store.submissions().filter(
                  (submission) =>
                    submission.id !== submissionId,
                ),

              selectedSubmission:
                store.selectedSubmission()?.id ===
                submissionId
                  ? null
                  : store.selectedSubmission(),
            },
          );

        } catch (error) {

          console.error(
            'Failed to delete submission:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // SET SELECTED SUBMISSION
      // ========================================================

      setSelectedSubmission(
        submission:
          ResourceSubmission | null,
      ): void {

        patchState(
          store,
          {
            selectedSubmission:
              submission,
          },
        );

      },


      // ========================================================
      // CLEAR SELECTED SUBMISSION
      // ========================================================

      clearSelectedSubmission(): void {

        patchState(
          store,
          {
            selectedSubmission: null,
          },
        );

      },

    }),
  ),

);