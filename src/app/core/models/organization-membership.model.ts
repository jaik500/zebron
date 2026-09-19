export interface OrganizationMembership {
  id: string;

  userId: string;

  organizationId: string;

  role:
    | 'owner'
    | 'admin'
    | 'manager'
    | 'member';

  active: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}