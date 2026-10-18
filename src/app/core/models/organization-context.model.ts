import { Organization } from './organization.model';
import { OrganizationMembership } from './organization-membership.model';
import {
  OrganizationCapabilities,
} from './organization-capability.model';
import {
  OrganizationOnboarding,
} from './organization-onboarding.model';

export interface OrganizationContext {
  organizationId: string;

  organization: Organization;

  membership: OrganizationMembership | null;

  role: OrganizationMembership['role'] | null;

  capabilities: OrganizationCapabilities;

  onboarding: OrganizationOnboarding | null;
}