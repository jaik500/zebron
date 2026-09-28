import { InjectionToken } from '@angular/core';

import {
  OrganizationApplicationRequest,
  OrganizationApplicationRequestStatus,
} from '../models/organization-application-request.model';

export interface OrganizationApplicationRequestRepository {
  getRequest(
    requestId: string,
  ): Promise<OrganizationApplicationRequest | null>;

  getRequestsForUser(
    userId: string,
  ): Promise<OrganizationApplicationRequest[]>;

  getRequestsByStatus(
    status: OrganizationApplicationRequestStatus,
  ): Promise<OrganizationApplicationRequest[]>;

  createRequest(
    request: Omit<
      OrganizationApplicationRequest,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string>;

  updateRequest(
    requestId: string,
    changes: Partial<
      Omit<
        OrganizationApplicationRequest,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void>;
}

export const ORGANIZATION_APPLICATION_REQUEST_REPOSITORY =
  new InjectionToken<OrganizationApplicationRequestRepository>(
    'OrganizationApplicationRequestRepository',
  );
  