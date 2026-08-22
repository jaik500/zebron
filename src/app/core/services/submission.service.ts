import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  ResourceSubmission,
  SubmissionStatus,
} from '../models/submission.model';

@Injectable({
  providedIn: 'root',
})
export class SubmissionService {
  /**
   * Firestore submissions collection.
   */
  private readonly submissionsCollection =
    collection(
      firestore,
      'submissions',
    );


  /**
   * Create a new resource submission.
   *
   * Every new submission starts as pending
   * and is waiting for administrator review.
   */
  async createSubmission(
    submission: Omit<
      ResourceSubmission,
      'id' | 'status' | 'createdAt'
    >,
  ): Promise<string> {
    const document =
      await addDoc(
        this.submissionsCollection,
        {
          ...submission,
          status: 'pending',
          createdAt: serverTimestamp(),
        },
      );

    return document.id;
  }


  /**
   * Get all resource submissions.
   *
   * The newest submissions are returned first.
   */
  async getAllSubmissions(): Promise<
    ResourceSubmission[]
  > {
    const submissionsQuery =
      query(
        this.submissionsCollection,
        orderBy(
          'createdAt',
          'desc',
        ),
      );

    const snapshot =
      await getDocs(
        submissionsQuery,
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ResourceSubmission,
    );
  }


  /**
   * Backwards-compatible method used by
   * the existing administrator submissions page.
   *
   * This simply returns all submissions.
   */
  async getSubmissions(): Promise<
    ResourceSubmission[]
  > {
    return this.getAllSubmissions();
  }


  /**
   * Get submissions filtered by status.
   *
   * Example:
   * getSubmissionsByStatus('pending')
   */
  async getSubmissionsByStatus(
    status: SubmissionStatus,
  ): Promise<ResourceSubmission[]> {
    const submissionsQuery =
      query(
        this.submissionsCollection,
        where(
          'status',
          '==',
          status,
        ),
        orderBy(
          'createdAt',
          'desc',
        ),
      );

    const snapshot =
      await getDocs(
        submissionsQuery,
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ResourceSubmission,
    );
  }


  /**
   * Get a single submission by its
   * Firestore document ID.
   */
  async getSubmissionById(
    submissionId: string,
  ): Promise<
    ResourceSubmission | null
  > {
    const submissionRef =
      doc(
        firestore,
        'submissions',
        submissionId,
      );

    const snapshot =
      await getDoc(
        submissionRef,
      );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ResourceSubmission;
  }


  /**
   * Update the status of a submission.
   *
   * Approved and rejected submissions receive
   * reviewer information and a review timestamp.
   */
  async updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus,
    reviewedBy?: string,
    rejectionReason?: string,
  ): Promise<void> {
    const submissionRef =
      doc(
        firestore,
        'submissions',
        submissionId,
      );

    const update: Record<
      string,
      unknown
    > = {
      status,
    };


    // Record moderation information when
    // an administrator reviews the submission.
    if (
      status === 'approved' ||
      status === 'rejected'
    ) {
      update['reviewedAt'] =
        serverTimestamp();

      if (reviewedBy) {
        update['reviewedBy'] =
          reviewedBy;
      }
    }


    // Store a rejection reason when provided.
    if (
      status === 'rejected' &&
      rejectionReason?.trim()
    ) {
      update['rejectionReason'] =
        rejectionReason.trim();
    }


    await updateDoc(
      submissionRef,
      update,
    );
  }


  /**
   * Approve a submission.
   *
   * This updates the submission status to approved
   * and records the administrator who reviewed it.
   *
   * Resource creation is handled separately by the
   * administrator approval workflow.
   */
  async approveSubmission(
    submissionId: string,
    reviewedBy: string,
  ): Promise<void> {
    await this.updateSubmissionStatus(
      submissionId,
      'approved',
      reviewedBy,
    );
  }


  /**
   * Reject a submission.
   *
   * The submission remains in Firestore so that
   * administrators retain the moderation history.
   */
  async rejectSubmission(
    submissionId: string,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<void> {
    await this.updateSubmissionStatus(
      submissionId,
      'rejected',
      reviewedBy,
      rejectionReason,
    );
  }


  /**
   * Delete a submission.
   *
   * This is available to the administrator UI
   * for permanent removal when explicitly requested.
   *
   * Normal rejection should use rejectSubmission()
   * instead of deleting the submission.
   */
  async deleteSubmission(
    submissionId: string,
  ): Promise<void> {
    const submissionRef =
      doc(
        firestore,
        'submissions',
        submissionId,
      );

    await deleteDoc(
      submissionRef,
    );
  }
}