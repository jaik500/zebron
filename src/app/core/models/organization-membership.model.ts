export type OrganizationMembershipRole =
  | 'org_owner'
  | 'org_admin'
  | 'org_manager'
  | 'org_staff'
  | 'org_member';

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationMembershipRole;
  active: boolean;
}