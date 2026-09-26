import {
  ApplicationCategory,
  ApplicationDefinition,
} from '../models/application-definition.model';
import { Permission, PERMISSIONS } from '../models/permission.model';

/**
 * Canonical application catalog for the Zebron platform.
 *
 * This registry answers:
 *
 *   "What applications exist on the Zebron platform?"
 *
 * It does NOT determine whether an application is activated for a
 * particular organization.
 *
 * Organization-specific activation belongs to:
 *
 *   organizations/{organizationId}/applications/{applicationId}
 *
 * Application implementation/readiness is intentionally separate and
 * belongs to the application implementation manifest system.
 */
export const APPLICATION_DEFINITIONS: ApplicationDefinition[] = [
  // ===========================================================================
  // Platform
  // ===========================================================================

  {
    id: 'core',
    key: 'core',
    name: 'Zebron Core',
    description:
      'Core platform capabilities including authentication, organization context, navigation, and shared platform services.',
    category: 'platform',
    icon: 'dashboard',
    route: '/',
    availability: 'internal',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: true,
    provisioningStrategy: 'default',
    dependencies: [],
    permissions: [],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Resources
  // ===========================================================================

  {
    id: 'resources',
    key: 'resources',
    name: 'Resources',
    description:
      'Resource center for discovering and accessing useful services, organizations, and information.',
    category: 'content',
    icon: 'library_books',
    route: '/resources',
    availability: 'available',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'none',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.RESOURCES_VIEW,
      PERMISSIONS.RESOURCES_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Community
  // ===========================================================================

  {
    id: 'community',
    key: 'community',
    name: 'Community',
    description:
      'Community discussion platform supporting posts, topics, comments, reactions, moderation, and community management.',
    category: 'community',
    icon: 'groups',
    route: '/partner/org/:organizationId/community',
    availability: 'available',
    requiresOrganization: true,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'default',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.COMMUNITY_VIEW,
      PERMISSIONS.COMMUNITY_CREATE,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_REACT,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.COMMUNITY_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Jobs & Training
  // ===========================================================================

  {
    id: 'jobs-training',
    key: 'jobs-training',
    name: 'Jobs & Training',
    description:
      'Employment opportunities, workforce resources, training programs, and career development capabilities.',
    category: 'workforce',
    icon: 'work',
    route: '/jobs',
    availability: 'available',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'none',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.JOBS_VIEW,
      PERMISSIONS.JOBS_MANAGE,
      PERMISSIONS.TRAINING_VIEW,
      PERMISSIONS.TRAINING_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Test Center
  // ===========================================================================

  {
    id: 'test-center',
    key: 'test-center',
    name: 'Test Center',
    description:
      'Assessment and testing platform supporting programs, courses, topics, questions, assessments, and organization-based learning.',
    category: 'learning',
    icon: 'quiz',
    route: '/partner/org/:organizationId/test-center',
    availability: 'available',
    requiresOrganization: true,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'custom',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.TEST_CENTER_VIEW,
      PERMISSIONS.TEST_CENTER_MANAGE,
      PERMISSIONS.TEST_CENTER_QUESTIONS_MANAGE,
      PERMISSIONS.TEST_CENTER_QUESTIONS_REVIEW,
      PERMISSIONS.TEST_CENTER_QUESTIONS_PUBLISH,
    ],
    features: [],
    implementationKey: 'test-center',
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Tax & Pay
  // ===========================================================================

  {
    id: 'tax-pay',
    key: 'tax-pay',
    name: 'Tax & Pay Calculator',
    description:
      'Public tax and net-pay calculation capabilities supporting W-2, 1099, and mixed-income scenarios.',
    category: 'utility',
    icon: 'calculate',
    route: '/tax-calculator',
    availability: 'available',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'none',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.TAX_RULES_VIEW,
      PERMISSIONS.TAX_RULES_MANAGE,
      PERMISSIONS.TAX_RULES_PUBLISH,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Content
  // ===========================================================================

  {
    id: 'content',
    key: 'content',
    name: 'Content',
    description:
      'Platform content management capabilities for creating, managing, and publishing application content.',
    category: 'content',
    icon: 'article',
    route: '/admin/content',
    availability: 'available',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'none',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.CONTENT_VIEW,
      PERMISSIONS.CONTENT_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Knowledge
  // ===========================================================================

  {
    id: 'knowledge',
    key: 'knowledge',
    name: 'Knowledge Center',
    description:
      'Organization knowledge center for documentation, articles, troubleshooting guidance, procedures, and operational runbooks.',
    category: 'content',
    icon: 'menu_book',
    route: '/partner/org/:organizationId/knowledge',
    availability: 'available',
    requiresOrganization: true,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'default',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.KNOWLEDGE_VIEW,
      PERMISSIONS.KNOWLEDGE_CREATE,
      PERMISSIONS.KNOWLEDGE_MANAGE,
      PERMISSIONS.KNOWLEDGE_PUBLISH,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Mailbox
  // ===========================================================================

  {
    id: 'mailbox',
    key: 'mailbox',
    name: 'Mailbox',
    description:
      'Mailbox and inbound communication capabilities for receiving, processing, and managing application messages.',
    category: 'business',
    icon: 'mail',
    route: '/admin/mailbox',
    availability: 'available',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: false,
    provisioningStrategy: 'none',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.MAILBOX_VIEW,
      PERMISSIONS.MAILBOX_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Business Operations
  // ===========================================================================

  {
    id: 'business-operations',
    key: 'business-operations',
    name: 'Business Operations',
    description:
      'Organization business operations capabilities for operational workflows, execution, and management.',
    category: 'business',
    icon: 'business_center',
    route: '/partner/org/:organizationId/business-operations',
    availability: 'available',
    requiresOrganization: true,
    requiresApproval: true,
    autoProvision: false,
    provisioningStrategy: 'custom',
    dependencies: ['core', 'knowledge'],
    permissions: [
      PERMISSIONS.BUSINESS_OPERATIONS_VIEW,
      PERMISSIONS.BUSINESS_OPERATIONS_EXECUTE,
    ],
    features: [],
    implementationKey: 'business-operations',
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Configuration
  // ===========================================================================

  {
    id: 'configuration',
    key: 'configuration',
    name: 'Configuration',
    description:
      'Platform administration capabilities for applications, settings, features, monitoring, security, and operational configuration.',
    category: 'platform',
    icon: 'settings',
    route: '/admin/configuration',
    availability: 'internal',
    requiresOrganization: false,
    requiresApproval: false,
    autoProvision: true,
    provisioningStrategy: 'default',
    dependencies: ['core'],
    permissions: [
      PERMISSIONS.APPLICATIONS_VIEW,
      PERMISSIONS.APPLICATIONS_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.FEATURES_VIEW,
      PERMISSIONS.FEATURES_MANAGE,
      PERMISSIONS.OPERATIONS_VIEW,
      PERMISSIONS.OPERATIONS_EXECUTE,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.SECURITY_VIEW,
      PERMISSIONS.SECURITY_MANAGE,
    ],
    features: [],
    version: 1,
    enabled: true,
  },

  // ===========================================================================
  // Veya Cyber Range
  // ===========================================================================

  {
    id: 'cyber-range',
    key: 'cyber-range',
    name: 'Veya Cyber Range',
    description:
      'Hands-on cybersecurity training using isolated organization simulations, security tools, investigation scenarios, and practical skills evidence.',
    category: 'security',
    icon: 'security',
    route: '/partner/org/:organizationId/cyber-range',
    availability: 'coming_soon',
    requiresOrganization: true,
    requiresApproval: true,
    autoProvision: false,
    provisioningStrategy: 'custom',
    dependencies: [
      'core',
      'test-center',
      'knowledge',
    ],
    permissions: [
      PERMISSIONS.CYBER_RANGE_VIEW,
      PERMISSIONS.CYBER_RANGE_LAUNCH,
      PERMISSIONS.CYBER_RANGE_MANAGE,
      PERMISSIONS.CYBER_RANGE_INSTRUCTOR,
    ],
    features: [],
    implementationKey: 'cyber-range',
    version: 1,
    enabled: false,
  },
] as const;

/**
 * Strongly typed application ID.
 */
export type ApplicationId =
  (typeof APPLICATION_DEFINITIONS)[number]['id'];

/**
 * Strongly typed application key.
 */
export type ApplicationKey =
  (typeof APPLICATION_DEFINITIONS)[number]['key'];

/**
 * Strongly typed application category.
 */
export type RegisteredApplicationCategory =
  (typeof APPLICATION_DEFINITIONS)[number]['category'];

/**
 * Find an application by its canonical ID.
 */
export function getApplicationById(
  applicationId: string,
): ApplicationDefinition | undefined {
  return APPLICATION_DEFINITIONS.find(
    application => application.id === applicationId,
  );
}

/**
 * Find an application by its canonical key.
 */
export function getApplicationByKey(
  applicationKey: string,
): ApplicationDefinition | undefined {
  return APPLICATION_DEFINITIONS.find(
    application => application.key === applicationKey,
  );
}

/**
 * Determine whether an application exists in the registry.
 */
export function applicationExists(
  applicationId: string,
): boolean {
  return APPLICATION_DEFINITIONS.some(
    application => application.id === applicationId,
  );
}

/**
 * Return all enabled applications.
 */
export function getEnabledApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => application.enabled,
  );
}

/**
 * Return applications that are currently available.
 */
export function getAvailableApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application =>
      application.enabled &&
      application.availability === 'available',
  );
}

/**
 * Return applications that are coming soon.
 */
export function getComingSoonApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application =>
      application.availability === 'coming_soon',
  );
}

/**
 * Return applications requiring an organization.
 */
export function getOrganizationApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => application.requiresOrganization,
  );
}

/**
 * Return platform-level applications.
 */
export function getPlatformApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => !application.requiresOrganization,
  );
}

/**
 * Return applications requiring approval before activation.
 */
export function getApprovalRequiredApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => application.requiresApproval,
  );
}

/**
 * Return applications that support provisioning.
 */
export function getProvisionableApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application =>
      application.provisioningStrategy !== 'none',
  );
}

/**
 * Return applications in a specific category.
 */
export function getApplicationsByCategory(
  category: ApplicationCategory,
): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => application.category === category,
  );
}

/**
 * Return applications that declare a specific permission.
 */
export function getApplicationsByPermission(
  permission: Permission,
): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter(
    application => application.permissions.includes(permission),
  );
}

/**
 * Validate the application registry.
 *
 * This performs structural validation without querying Firestore.
 */
export function validateApplicationRegistry(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const keys = new Set<string>();

  for (const application of APPLICATION_DEFINITIONS) {
    if (ids.has(application.id)) {
      errors.push(
        `Duplicate application ID: ${application.id}`,
      );
    }

    if (keys.has(application.key)) {
      errors.push(
        `Duplicate application key: ${application.key}`,
      );
    }

    ids.add(application.id);
    keys.add(application.key);

    if (!application.name.trim()) {
      errors.push(
        `Application ${application.id} has no name.`,
      );
    }

    if (!application.description.trim()) {
      errors.push(
        `Application ${application.id} has no description.`,
      );
    }

    if (
      application.requiresOrganization &&
      !application.route.includes(':organizationId')
    ) {
      errors.push(
        `Organization application ${application.id} must include :organizationId in its route.`,
      );
    }

    if (
      application.provisioningStrategy === 'none' &&
      application.autoProvision
    ) {
      errors.push(
        `Application ${application.id} cannot use autoProvision=true with provisioningStrategy=none.`,
      );
    }

    if (
      application.provisioningStrategy !== 'none' &&
      !application.implementationKey
    ) {
      errors.push(
        `Provisionable application ${application.id} should declare an implementationKey.`,
      );
    }

    for (const dependency of application.dependencies) {
      if (!applicationExists(dependency)) {
        errors.push(
          `Application ${application.id} references missing dependency ${dependency}.`,
        );
      }
    }
  }

  return errors;
}