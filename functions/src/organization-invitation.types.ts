export type OrganizationInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

export type OrganizationInvitationRole =
  | "org_admin"
  | "org_manager"
  | "org_staff"
  | "org_member";

export interface OrganizationInvitationRecord {
  organizationId: string;
  email: string;
  normalizedEmail: string;
  role: OrganizationInvitationRole;
  invitedByUserId: string;
  status: OrganizationInvitationStatus;
  expiresAt: FirebaseFirestore.Timestamp;
  acceptedAt?: FirebaseFirestore.Timestamp | null;
  acceptedByUserId?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
