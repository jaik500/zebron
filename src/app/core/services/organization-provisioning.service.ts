import { Injectable } from '@angular/core';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

export interface ProvisionOrganizationRequest {
  requestId: string;
}

export interface ProvisionOrganizationResponse {
  success: boolean;
  requestId: string;
  alreadyProvisioned: boolean;
  organizationId: string;
  organizationName?: string;
  ownerUserId?: string;
  requestedApplications?: string[];
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationProvisioningService {
  /**
   * Firebase Functions client.
   *
   * The organization provisioning callable is deployed
   * to us-central1.
   */
  private readonly functions =
    getFunctions(
      undefined,
      'us-central1',
    );

  /**
   * Provision an approved organization application.
   *
   * IMPORTANT:
   * The browser does not create the organization directly.
   *
   * The trusted Cloud Function:
   *
   * approved application
   *        ↓
   * organization
   *        ↓
   * org_owner membership
   *        ↓
   * application entitlements
   *        ↓
   * onboarding record
   */
  async provisionOrganization(
    requestId: string,
  ): Promise<ProvisionOrganizationResponse> {
    const provisionOrganizationFunction =
      httpsCallable<
        ProvisionOrganizationRequest,
        ProvisionOrganizationResponse
      >(
        this.functions,
        'provisionOrganization',
      );

    const result =
      await provisionOrganizationFunction({
        requestId,
      });

    return result.data;
  }
}