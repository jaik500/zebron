import { Injectable } from '@angular/core';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import {
  OrganizationInvitation,
  OrganizationInvitationRole,
} from '../../../core/models/organization-invitation.model';

export interface CreateOrganizationInvitationInput {
  organizationId: string;
  email: string;
  role: OrganizationInvitationRole;
}

export interface CreateOrganizationInvitationResponse {
  success: boolean;
  invitation: OrganizationInvitation;
}

export interface GetOrganizationInvitationsResponse {
  invitations: OrganizationInvitation[];
}

export interface CompleteOrganizationInviteStepResponse {
  success: boolean;
  organizationId: string;
  onboardingId: string;
  currentStep: string;
  completedSteps: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationInvitationService {
  private readonly functions = getFunctions();

  async createInvitation(
    input: CreateOrganizationInvitationInput,
  ): Promise<CreateOrganizationInvitationResponse> {
    if (!input.organizationId?.trim()) {
      throw new Error('Organization ID is required.');
    }

    if (!input.email?.trim()) {
      throw new Error('Email address is required.');
    }

    const callable = httpsCallable<
      CreateOrganizationInvitationInput,
      CreateOrganizationInvitationResponse
    >(
      this.functions,
      'createOrganizationInvitation',
    );

    const result = await callable({
      organizationId: input.organizationId,
      email: input.email.trim(),
      role: input.role,
    });

    return result.data;
  }

  async getInvitations(
    organizationId: string,
  ): Promise<GetOrganizationInvitationsResponse> {
    const callable = httpsCallable<
      { organizationId: string },
      GetOrganizationInvitationsResponse
    >(
      this.functions,
      'getOrganizationInvitations',
    );

    const result = await callable({
      organizationId,
    });

    return result.data;
  }

  async completeInviteMembersStep(
    organizationId: string,
  ): Promise<CompleteOrganizationInviteStepResponse> {
    const callable = httpsCallable<
      { organizationId: string },
      CompleteOrganizationInviteStepResponse
    >(
      this.functions,
      'completeOrganizationInviteMembersStep',
    );

    const result = await callable({
      organizationId,
    });

    return result.data;
  }
}