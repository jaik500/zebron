import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from './firebase-config';

export type OrganizationLifecycleAction =
  | 'suspend'
  | 'reactivate'
  | 'archive'
  | 'restore';

export interface OrganizationLifecycleResult {
  success: boolean;
  organizationId: string;
  previousStatus: string;
  status: string;
}

interface OrganizationLifecycleRequest {
  organizationId: string;
  reason: string;
}

export interface OrganizationApplicationRequestRepairResult {
  success: boolean;
  repaired: boolean;
  requestId: string;
  organizationId: string;
  previousStatus: string;
  status: string;
}

interface OrganizationApplicationRequestRepairPayload {
  requestId: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationLifecycleService {
  private readonly functions = firebaseFunctions;

  /**
   * Perform a supported organization lifecycle transition.
   */
  async transition(
    action: OrganizationLifecycleAction,
    organizationId: string,
    reason: string,
  ): Promise<OrganizationLifecycleResult> {
    const callableNames: Record<
      OrganizationLifecycleAction,
      string
    > = {
      suspend: 'suspendOrganization',
      reactivate: 'reactivateOrganization',
      archive: 'archiveOrganization',
      restore: 'restoreOrganization',
    };

    const callable = httpsCallable<
      OrganizationLifecycleRequest,
      OrganizationLifecycleResult
    >(
      this.functions,
      callableNames[action],
    );

    const result = await callable({
      organizationId,
      reason: reason.trim(),
    });

    return result.data;
  }

  /**
   * Repair an application request left in onboarding after the
   * associated organization's core onboarding has been completed.
   *
   * The backend independently enforces platform-admin authorization
   * and validates the request, organization, and onboarding records.
   */
  async repairApplicationRequest(
    requestId: string,
  ): Promise<OrganizationApplicationRequestRepairResult> {
    const callable = httpsCallable<
      OrganizationApplicationRequestRepairPayload,
      OrganizationApplicationRequestRepairResult
    >(
      this.functions,
      'repairOrganizationApplicationRequestStatus',
    );

    const result = await callable({
      requestId: requestId.trim(),
    });

    return result.data;
  }
}