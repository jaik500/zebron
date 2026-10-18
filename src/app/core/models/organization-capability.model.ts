export type OrganizationCapability =
  | 'programs'
  | 'courses'
  | 'assessments'
  | 'community'
  | 'knowledge'
  | 'jobs'
  | 'analytics'
  | 'certifications';

export interface OrganizationCapabilities {
  programs: boolean;
  courses: boolean;
  assessments: boolean;
  community: boolean;
  knowledge: boolean;
  jobs: boolean;
  analytics: boolean;
  certifications: boolean;
}

export const DEFAULT_ORGANIZATION_CAPABILITIES: OrganizationCapabilities = {
  programs: true,
  courses: true,
  assessments: true,
  community: false,
  knowledge: false,
  jobs: false,
  analytics: false,
  certifications: false,
};

export function hasOrganizationCapability(
  capabilities: OrganizationCapabilities,
  capability: OrganizationCapability,
): boolean {
  return capabilities[capability] === true;
}   