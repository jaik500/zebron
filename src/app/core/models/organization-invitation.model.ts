import { Timestamp } from 'firebase/firestore';

export type OrganizationInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'cancelled'
  | 'expired';

export type OrganizationInvitationRole =
  | 'org_admin'
  | 'org_manager'
  | 'org_staff'
  | 'org_member';

export interface OrganizationInvitation {
  id: string;

  organizationId: string;

  email: string;
  normalizedEmail: string;

  role: OrganizationInvitationRole;

  invitedByUserId: string;

  status: OrganizationInvitationStatus;

  expiresAt: Timestamp;

  acceptedAt?: Timestamp | null;
  acceptedByUserId?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}