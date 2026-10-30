import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../core/services/firebase-config';

export type ServiceRequestType =
  | 'add_application'
  | 'suspend_application'
  | 'resume_application'
  | 'retire_application'
  | 'terminate_contract'
  | 'transfer_ownership'
  | 'data_export'
  | 'billing_question'
  | 'other';

export type ServiceRequestStatus =
  | 'awaiting_owner'
  | 'submitted'
  | 'completed'
  | 'rejected'
  | 'declined'
  | 'withdrawn';

export interface ContractTermsSection {
  heading: string;
  body: string;
}

export interface ContractTerms {
  version: string;
  title: string;
  sections: ContractTermsSection[];
  updatedAt: string | null;
}

export interface OrganizationContract {
  contractNumber: string;
  planName: string;
  status: 'active' | 'notice' | 'terminated' | string;
  effectiveDate: string | null;
  noticePeriodDays: number;
  billingContact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  acceptedTermsVersion: string | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  termination: {
    requestedAt: string | null;
    requestedByName: string | null;
    effectiveDate: string | null;
    reason: string | null;
    requestId: string | null;
  } | null;
  terminatedAt: string | null;
}

export interface ContractApplication {
  applicationId: string;
  status: string;
  activatedAt: string | null;
  updatedAt: string | null;
  suspendedAt: string | null;
}

export interface ServiceRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  type: ServiceRequestType;
  title: string;
  applicationId: string | null;
  reason: string | null;
  newOwnerName: string | null;
  status: ServiceRequestStatus;
  requestedBy: string;
  requestedByName: string | null;
  requestedByRole: string | null;
  ownerApprovedByName: string | null;
  reviewNote: string | null;
  outcome: string | null;
  terminationEffectiveDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  history: Array<{ at: string | null; byName: string | null; message: string }>;
}

export interface ContractOverview {
  organization: { id: string; name: string; slug: string; status: string };
  viewer: {
    role: string | null;
    isPlatformAdmin: boolean;
    isOwner: boolean;
    canRequest: boolean;
    canApprove: boolean;
    uid: string;
  };
  contract: OrganizationContract;
  terms: ContractTerms;
  applications: ContractApplication[];
  requests: ServiceRequest[];
}

export interface SubmitServiceRequestInput {
  organizationId: string;
  type: ServiceRequestType;
  applicationId?: string | null;
  reason?: string;
  newOwnerUserId?: string;
  confirmName?: string;
}

export const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  awaiting_owner: 'Waiting for owner',
  submitted: 'With Zebron',
  completed: 'Completed',
  rejected: 'Not approved',
  declined: 'Declined by owner',
  withdrawn: 'Withdrawn',
};

export const REQUEST_STATUS_CLASSES: Record<ServiceRequestStatus, string> = {
  awaiting_owner: 'bg-amber-50 text-amber-800',
  submitted: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  declined: 'bg-gray-100 text-gray-700',
  withdrawn: 'bg-gray-100 text-gray-600',
};

/** Contract & Billing callables. All authorization happens on the server. */
@Injectable({
  providedIn: 'root',
})
export class OrganizationContractService {
  async getOverview(organizationId: string): Promise<ContractOverview> {
    return this.call<{ organizationId: string }, ContractOverview>('getOrganizationContractOverview', {
      organizationId,
    });
  }

  async submitRequest(input: SubmitServiceRequestInput): Promise<{ requestId: string; status: ServiceRequestStatus }> {
    return this.call('submitOrganizationServiceRequest', input);
  }

  async respond(requestId: string, action: 'approve' | 'decline' | 'withdraw', note = ''): Promise<void> {
    await this.call('respondToOrganizationServiceRequest', { requestId, action, note });
  }

  async cancelTermination(organizationId: string): Promise<void> {
    await this.call('cancelOrganizationContractTermination', { organizationId });
  }

  async updateBillingContact(
    organizationId: string,
    contact: { name: string; email: string; phone: string; address: string },
  ): Promise<void> {
    await this.call('updateOrganizationBillingContact', { organizationId, ...contact });
  }

  async acceptTerms(organizationId: string): Promise<void> {
    await this.call('acceptOrganizationContractTerms', { organizationId });
  }

  // ---------------- Zebron platform admins ----------------

  async listAllRequests(): Promise<{ requests: ServiceRequest[]; terms: ContractTerms }> {
    return this.call('listOrganizationServiceRequests', {});
  }

  async review(requestId: string, decision: 'approve' | 'reject', note: string): Promise<{ outcome: string }> {
    return this.call('reviewOrganizationServiceRequest', { requestId, decision, note });
  }

  async updateTerms(title: string, sections: ContractTermsSection[]): Promise<{ version: string }> {
    return this.call('updateContractTerms', { title, sections });
  }

  private async call<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
    const callable = httpsCallable<TInput, TOutput>(firebaseFunctions, name);
    return (await callable(input)).data;
  }
}
