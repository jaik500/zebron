import { Injectable, inject } from '@angular/core';

import { OrganizationMembership } from '../models/organization-membership.model';
import { MembershipRepository } from '../repositories/membership.repository';
import { FirestoreMembershipRepository } from '../repositories/firestore/firestore-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class MembershipService {
  private readonly repository: MembershipRepository =
    inject(FirestoreMembershipRepository);

  async getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null> {
    return this.repository.getMembership(
      membershipId,
    );
  }

  async getMembershipsForUser(
    userId: string,
  ): Promise<OrganizationMembership[]> {
    return this.repository.getMembershipsForUser(
      userId,
    );
  }

  async getMembershipsForOrganization(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    return this.repository.getMembershipsForOrganization(
      organizationId,
    );
  }

  async getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    return this.repository
      .getMembershipForUserAndOrganization(
        userId,
        organizationId,
      );
  }

  async createMembership(
    membership: Omit<
      OrganizationMembership,
      'id'
    >,
  ): Promise<string> {
    return this.repository.createMembership(
      membership,
    );
  }

  async updateMembership(
    membershipId: string,
    changes: Partial<
      Omit<
        OrganizationMembership,
        'id'
      >
    >,
  ): Promise<void> {
    return this.repository.updateMembership(
      membershipId,
      changes,
    );
  }

  async deleteMembership(
    membershipId: string,
  ): Promise<void> {
    return this.repository.deleteMembership(
      membershipId,
    );
  }
}