import { ApplicationDefinition } from '../models/application-definition.model';
import { APPLICATION_DEFINITIONS } from './application.registry';

/**
 * ONE LIST OF APPLICATIONS
 *
 * APPLICATION_DEFINITIONS (application.registry.ts) is the only list of
 * Zebron applications. Everything else is built from it:
 *
 *   - Control Center -> Applications (kill switch defaults)   feature-config.service.ts
 *   - Control Center -> Settings application filter           configuration-application.registry.ts
 *   - Settings cards' group names                             configuration-feature.registry.ts
 *   - Knowledge Center "applies to" list                      knowledge.config.ts
 *
 * Two lists live outside the app and cannot import this file; the unit
 * test tests/unit/application-lists.test.ts fails when they miss an app:
 *
 *   - scripts/generate-application-inventory.mjs (code folders per app)
 *   - functions/src/organization-contracts.ts applicationName() (emails)
 *
 * To add an application: add it to APPLICATION_DEFINITIONS, then add
 * its folders to the inventory script and its name to the server list.
 * The details below are optional.
 */

/** Control Center details for an application. All optional. */
export interface ApplicationControlDetails {
  /** Extra search words for the Control Center. */
  keywords?: string[];
  /** Show the application in navigation menus (default true). */
  showInNavigation?: boolean;
  /** Core applications cannot be switched off (default false). */
  core?: boolean;
  /**
   * Address used by the Control Center. Defaults to the registry route
   * unless that route is organization-specific (then none).
   */
  adminRoute?: string | null;
  /** Knowledge article key, when it differs from the application key. */
  knowledgeKey?: string;
}

const CONTROL_DETAILS: Record<string, ApplicationControlDetails> = {
  'core': {
    keywords: ['core', 'platform', 'authentication', 'authorization', 'access', 'users', 'security', 'permissions', 'roles', 'shared services'],
    showInNavigation: false,
    core: true,
    adminRoute: null,
  },
  'resources': {
    keywords: ['resources', 'resource center', 'resource listings', 'categories', 'locations', 'availability', 'organizations', 'resource administration'],
  },
  'community': {
    keywords: ['community', 'posts', 'topics', 'comments', 'reactions', 'notifications', 'messaging', 'chat', 'following', 'bookmarks', 'moderation', 'reporting'],
    adminRoute: '/community',
  },
  'jobs-training': {
    keywords: ['jobs', 'training', 'bootcamp', 'employment', 'career', 'courses', 'opportunities', 'job administration', 'training administration'],
    knowledgeKey: 'jobs',
  },
  'learning': {
    keywords: ['learning', 'learning administration', 'training', 'team progress'],
    showInNavigation: false,
    adminRoute: '/courses',
  },
  'courses': {
    keywords: ['courses', 'lessons', 'exams', 'certificates', 'assignments', 'progress'],
    adminRoute: '/courses',
  },
  'virtual-classroom': {
    keywords: ['virtual classroom', 'live', 'live sessions', 'classes', 'polls', 'video'],
    adminRoute: null,
  },
  'test-center': {
    keywords: ['test', 'test center', 'testing', 'courses', 'questions', 'question banks', 'topics', 'assessments', 'practice', 'results', 'progress'],
    adminRoute: '/test-center',
  },
  'tax-pay': {
    keywords: ['tax', 'pay', 'calculator', 'w2', 'w-2', '1099', 'contractor', 'withholding', 'federal tax', 'state tax', 'local tax', 'maryland', 'tax rates', 'pay periods', 'net pay'],
  },
  'content': {
    keywords: ['content', 'articles', 'pages', 'media', 'editorial', 'publishing', 'announcements', 'categories', 'content management', 'cms'],
    adminRoute: null,
  },
  'knowledge': {
    keywords: ['knowledge', 'knowledge center', 'knowledge articles', 'documentation', 'guides', 'how-to', 'troubleshooting', 'runbooks', 'faq', 'reference', 'support documentation'],
    adminRoute: '/admin/knowledge',
  },
  'blog': {
    keywords: ['blog', 'posts', 'articles', 'comments', 'publishing', 'le rondpoint'],
    adminRoute: '/blog',
  },
  'mailbox': {
    keywords: ['mailbox', 'email', 'emails', 'inbound email', 'outbound email', 'email routing', 'notifications', 'email templates', 'mail processing', 'communication'],
    showInNavigation: false,
    adminRoute: null,
  },
  'business-operations': {
    keywords: ['business operations', 'operations', 'business processes', 'workflows', 'services', 'organizations', 'operational workflows', 'business administration', 'process management'],
    adminRoute: null,
  },
  'configuration': {
    keywords: ['configuration', 'settings', 'application settings', 'feature configuration', 'feature flags', 'maintenance', 'security configuration', 'administration', 'system settings', 'control center'],
    core: true,
  },
};

/** Applications that exist and are switched on in the registry. */
export function catalogApplications(): ApplicationDefinition[] {
  return APPLICATION_DEFINITIONS.filter((application) => application.enabled);
}

export function controlDetails(key: string): ApplicationControlDetails {
  return CONTROL_DETAILS[key] ?? {};
}

/** Display name from the registry; the key when unknown. */
export function catalogApplicationName(key: string): string {
  return APPLICATION_DEFINITIONS.find((application) => application.key === key)?.name ?? key;
}

/**
 * What must stay on while this application is on: its registry
 * dependencies plus its parent (Courses -> Learning, Test Center).
 */
export function killSwitchDependencies(application: ApplicationDefinition): string[] {
  const all = [...application.dependencies, ...(application.parent ? [application.parent] : [])];
  return [...new Set(all)].filter((key) => key !== application.key);
}

export function catalogAdminRoute(application: ApplicationDefinition): string | null {
  const details = controlDetails(application.key);
  if (details.adminRoute !== undefined) return details.adminRoute;
  return application.route.includes(':') ? null : application.route;
}

export function catalogKnowledgeKey(key: string): string {
  return controlDetails(key).knowledgeKey ?? key;
}
