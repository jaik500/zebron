import { Injectable, inject } from '@angular/core';

import {
  OrganizationMembership,
  OrganizationMembershipRole,
} from '../models/organization-membership.model';

import { OrganizationMembershipRepository } from '../repositories/firestore/organization-membership.repository';

@Injectable({
  providedIn: 'root',
})
export class OrganizationMembershipService {
  private readonly repository = inject(
    OrganizationMembershipRepository,
  );

  private readonly validRoles:
    readonly OrganizationMembershipRole[] = [
  'org_owner',
  'org_admin',
  'org_manager',
  'org_staff',
  'org_member',
];

  async getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null> {
    const normalizedId = membershipId.trim();

    if (!normalizedId) {
      return null;
    }

    return this.repository.getMembership(
      normalizedId,
    );
  }

  async getOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    const normalizedOrganizationId =
      organizationId.trim();

    if (!normalizedOrganizationId) {
      return [];
    }

    return this.repository.getMembershipsForOrganization(
      normalizedOrganizationId,
    );
  }

  async getUserMemberships(
    userId: string,
  ): Promise<OrganizationMembership[]> {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      return [];
    }

    return this.repository.getMembershipsForUser(
      normalizedUserId,
    );
  }

  async getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const normalizedUserId = userId.trim();

    const normalizedOrganizationId =
      organizationId.trim();

    if (
      !normalizedUserId ||
      !normalizedOrganizationId
    ) {
      return null;
    }

    return this.repository
      .getMembershipForUserAndOrganization(
        normalizedUserId,
        normalizedOrganizationId,
      );
  }

  async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationMembershipRole = 'org_member',
  ): Promise<string> {
    const normalizedOrganizationId =
      organizationId.trim();

    const normalizedUserId =
      userId.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    if (!normalizedUserId) {
      throw new Error(
        'User ID is required.',
      );
    }

    this.validateRole(role);

    const existingMembership =
      await this.repository
        .getMembershipForUserAndOrganization(
          normalizedUserId,
          normalizedOrganizationId,
        );

    if (existingMembership) {
      throw new Error(
        'This user is already a member of the organization.',
      );
    }

    return this.repository.createMembership({
      userId: normalizedUserId,
      organizationId: normalizedOrganizationId,
      role,
      active: true,
    });
  }

  async updateMemberRole(
    membershipId: string,
    role: OrganizationMembershipRole,
  ): Promise<void> {
    const normalizedId =
      membershipId.trim();

    if (!normalizedId) {
      throw new Error(
        'Membership ID is required.',
      );
    }

    this.validateRole(role);

    await this.repository.updateMembership(
      normalizedId,
      { role },
    );
  }

  async setMemberActive(
    membershipId: string,
    active: boolean,
  ): Promise<void> {
    const normalizedId =
      membershipId.trim();

    if (!normalizedId) {
      throw new Error(
        'Membership ID is required.',
      );
    }

    await this.repository.updateMembership(
      normalizedId,
      { active },
    );
  }

  async removeMember(
    membershipId: string,
  ): Promise<void> {
    const normalizedId =
      membershipId.trim();

    if (!normalizedId) {
      throw new Error(
        'Membership ID is required.',
      );
    }

    await this.repository.deleteMembership(
      normalizedId,
    );
  }

  private validateRole(
    role: OrganizationMembershipRole,
  ): void {
    if (!this.validRoles.includes(role)) {
      throw new Error(
        `Invalid organization membership role: ${role}`,
      );
    }
  }
}