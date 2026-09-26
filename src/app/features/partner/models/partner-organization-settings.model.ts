import type { OrganizationMembershipRole } from '../../../core/models/organization-membership.model';

export type PartnerCourseVisibility =
  | 'organization'
  | 'all';

export interface PartnerOrganizationSettings {
  organizationId: string;

  testCenter: {
    enabled: boolean;
    allowMemberTesting: boolean;
    courseVisibility: PartnerCourseVisibility;
  };

  members: {
    allowSelfRegistration: boolean;
    defaultMemberRole: OrganizationMembershipRole;
  };

  notifications: {
    adminNotifications: boolean;
    testResultNotifications: boolean;
  };

  updatedAt: unknown;
  updatedBy: string;
}