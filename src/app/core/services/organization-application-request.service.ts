import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

import {
  OrganizationApplicationRequest,
  OrganizationApplicationRequestStatus,
} from '../models/organization-application-request.model';

import {
  ORGANIZATION_APPLICATION_REQUEST_REPOSITORY,
  OrganizationApplicationRequestRepository,
} from '../repositories/organization-application-request.repository';

@Injectable({
  providedIn: 'root',
})
export class OrganizationApplicationRequestService {
  private readonly repository =
    inject<OrganizationApplicationRequestRepository>(
      ORGANIZATION_APPLICATION_REQUEST_REPOSITORY,
    );

  /**
   * Get a single organization application request.
   */
  async getRequest(
    requestId: string,
  ): Promise<OrganizationApplicationRequest | null> {
    return this.repository.getRequest(requestId);
  }

  /**
   * Get all organization application requests for a user.
   */
  async getRequestsForUser(
    userId: string,
  ): Promise<OrganizationApplicationRequest[]> {
    return this.repository.getRequestsForUser(userId);
  }

  /**
   * Get organization application requests by status.
   *
   * Primarily intended for platform administration.
   */
  async getRequestsByStatus(
    status: OrganizationApplicationRequestStatus,
  ): Promise<OrganizationApplicationRequest[]> {
    return this.repository.getRequestsByStatus(status);
  }

  /**
   * Create a new organization application request.
   */
  async createRequest(
    request: Omit<
      OrganizationApplicationRequest,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    return this.repository.createRequest(request);
  }

  /**
   * Update an organization application request.
   */
  async updateRequest(
    requestId: string,
    changes: Partial<
      Omit<
        OrganizationApplicationRequest,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    return this.repository.updateRequest(requestId, changes);
  }

  /**
   * Submit a draft application for platform review.
   */
  async submitRequest(requestId: string): Promise<void> {
    await this.repository.updateRequest(requestId, {
      status: 'submitted',
    });
  }

  /**
   * Move a submitted application into platform review.
   */
  async startReview(
    requestId: string,
    reviewedBy: string,
  ): Promise<void> {
    await this.repository.updateRequest(requestId, {
      status: 'under_review',
      reviewedBy,
      reviewedAt: Timestamp.now(),
    });
  }

  /**
   * Approve an organization application.
   *
   * Approval does not provision the organization.
   * Trusted backend provisioning should happen after approval.
   */
  async approveRequest(
    requestId: string,
    reviewedBy: string,
  ): Promise<void> {
    const now = Timestamp.now();

    await this.repository.updateRequest(requestId, {
      status: 'approved',
      reviewedBy,
      reviewedAt: now,
      approvedAt: now,
    });
  }

  /**
   * Reject an organization application.
   */
  async rejectRequest(
    requestId: string,
    reviewedBy: string,
    rejectionReason: string,
  ): Promise<void> {
    await this.repository.updateRequest(requestId, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: Timestamp.now(),
      rejectionReason: rejectionReason.trim(),
    });
  }

  /**
   * Cancel an organization application.
   */
  async cancelRequest(requestId: string): Promise<void> {
    await this.repository.updateRequest(requestId, {
      status: 'cancelled',
    });
  }
}