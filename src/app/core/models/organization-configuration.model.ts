export type OrganizationCourseVisibility =
  | 'all'
  | 'members'
  | 'admins';

export type OrganizationDefaultMemberRole =
  | 'org_member'
  | 'org_staff'
  | 'org_manager';

export interface OrganizationConfiguration {
  organizationId: string;

  // Features
  testCenterEnabled: boolean;
  allowMemberTesting: boolean;
  courseVisibility: OrganizationCourseVisibility;

  // Member access
  allowSelfRegistration: boolean;
  defaultMemberRole: OrganizationDefaultMemberRole;

  // Notifications
  adminNotifications: boolean;
  testResultNotifications: boolean;

  // Branding
  primaryColor: string;
  secondaryColor: string;

  createdAt?: unknown;
  updatedAt?: unknown;
}