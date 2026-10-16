import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from './firebase-config';

/**
 * Supported organization lifecycle actions.
 */
export type OrganizationLifecycleAction =
  | 'suspend'
  | 'reactivate'
  | 'archive'
  | 'restore';

/**
 * Result returned by an organization lifecycle Cloud Function.
 */
export interface OrganizationLifecycleResult {
  success: boolean;
  organizationId: string;
  previousStatus: string;
  status: string;
}

/**
 * Request payload for organization lifecycle operations.
 */
interface OrganizationLifecycleRequest {
  organizationId: string;
  reason: string;
}

/**
 * Organization lifecycle service.
 *
 * Invokes the backend Cloud Functions responsible for organization
 * lifecycle transitions. Authorization and lifecycle validation
 * are enforced by the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationLifecycleService {
  private readonly functions = firebaseFunctions;

  /**
   * Perform a supported organization lifecycle transition.
   *
   * Supported actions:
   * - suspend
   * - reactivate
   * - archive
   * - restore
   *
   * @param action The lifecycle action to perform.
   * @param organizationId The organization to update.
   * @param reason The administrative reason for the operation.
   * @returns The result of the lifecycle transition.
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
}