import {
  ConfigurationFeature,
} from './models/configuration-feature.model';
import { catalogApplicationName } from '../../../../core/registries/application-catalog';

/**
 * Cards on Control Center -> Settings. One card per real admin page,
 * grouped by application. applicationKey must be a key in the
 * application registry; the group name comes from there.
 * Only add a card for a page that exists; the Settings tab shows types
 * settings, security and maintenance.
 */
const CARDS: Omit<ConfigurationFeature, 'applicationName'>[] = [
  {
    key: 'applications',
    applicationKey: 'core',
    name: 'Applications (kill switch)',
    description:
      'Turn applications on, off or into maintenance for everyone.',
    icon: 'toggle_on',
    type: 'settings',
    route: '/admin/configuration/applications',
    keywords: ['kill switch', 'enable', 'disable', 'availability', 'applications'],
  },
  {
    key: 'organizations',
    applicationKey: 'core',
    name: 'Organizations',
    description:
      'Edit organizations, suspend or reactivate them, and suspend or resume one of their applications.',
    icon: 'corporate_fare',
    type: 'settings',
    route: '/admin/organizations',
    keywords: ['organizations', 'partners', 'suspend', 'reactivate', 'archive', 'billing', 'tenants'],
  },
  {
    key: 'partner-requests',
    applicationKey: 'core',
    name: 'Partner requests & contract terms',
    description:
      'Approve organizations’ requests to add, suspend or retire applications, and edit the partner contract terms.',
    icon: 'assignment',
    type: 'settings',
    route: '/admin/organizations/requests',
    keywords: ['requests', 'contract', 'terms', 'agreement', 'partners'],
  },
  {
    key: 'organization-applications',
    applicationKey: 'core',
    name: 'Organization sign-ups',
    description:
      'Review organizations applying to join Zebron.',
    icon: 'how_to_reg',
    type: 'settings',
    route: '/admin/organizations/applications',
    keywords: ['onboarding', 'applications', 'sign up', 'join'],
  },
  {
    key: 'users',
    applicationKey: 'core',
    name: 'Users',
    description:
      'Manage people, roles and administrator access.',
    icon: 'group',
    type: 'security',
    route: '/admin/users',
    keywords: ['users', 'roles', 'admins', 'accounts'],
  },
  {
    key: 'security',
    applicationKey: 'core',
    name: 'Security',
    description:
      'Check sign-in, administrator access, audit and logging.',
    icon: 'shield',
    type: 'security',
    route: '/admin/configuration/security',
    keywords: ['security', 'access', 'authentication'],
  },
  {
    key: 'monitoring',
    applicationKey: 'core',
    name: 'Monitoring, health & audit trail',
    description:
      'System health, operational events, application readiness and the audit trail.',
    icon: 'monitor_heart',
    type: 'maintenance',
    route: '/admin/configuration/operational-monitoring',
    keywords: ['monitoring', 'health', 'audit', 'events', 'errors', 'readiness'],
  },
  {
    key: 'maintenance',
    applicationKey: 'core',
    name: 'Maintenance mode & quick links',
    description:
      'Put Zebron into maintenance and keep links to outside services.',
    icon: 'build',
    type: 'maintenance',
    route: '/admin/configuration/maintenance',
    keywords: ['maintenance', 'downtime', 'links', 'resend', 'stripe', 'cloudflare'],
  },
  {
    key: 'help-assistant',
    applicationKey: 'core',
    name: 'Help assistant',
    description:
      'Model, sources, limits and instructions for the Ask for help assistant.',
    icon: 'smart_toy',
    type: 'settings',
    route: '/admin/configuration/help-assistant',
    keywords: ['assistant', 'chatbot', 'gemini', 'ai', 'help'],
  },
  {
    key: 'support',
    applicationKey: 'core',
    name: 'Support tickets',
    description:
      'Answer support tickets from users and organizations.',
    icon: 'support_agent',
    type: 'maintenance',
    route: '/admin/support',
    keywords: ['support', 'tickets', 'help desk'],
  },
  {
    key: 'qa',
    applicationKey: 'core',
    name: 'QA Hub',
    description:
      'Quality checks across the platform.',
    icon: 'fact_check',
    type: 'maintenance',
    route: '/admin/qa',
    keywords: ['qa', 'quality', 'testing'],
  },
  {
    key: 'resources',
    applicationKey: 'resources',
    name: 'Resources',
    description:
      'Add, edit and publish resource listings.',
    icon: 'library_books',
    type: 'settings',
    route: '/admin/resources',
    keywords: ['resources', 'listings', 'publish'],
  },
  {
    key: 'submissions',
    applicationKey: 'resources',
    name: 'Submissions',
    description:
      'Review resources the public submitted.',
    icon: 'inbox',
    type: 'settings',
    route: '/admin/submissions',
    keywords: ['submissions', 'add a resource', 'review'],
  },
  {
    key: 'categories',
    applicationKey: 'resources',
    name: 'Categories',
    description:
      'The categories resources are filed under.',
    icon: 'category',
    type: 'settings',
    route: '/admin/categories',
    keywords: ['categories', 'taxonomy'],
  },
  {
    key: 'resource-types',
    applicationKey: 'resources',
    name: 'Resource types',
    description:
      'Types such as program, service or clinic.',
    icon: 'label',
    type: 'settings',
    route: '/admin/resource-types',
    keywords: ['types', 'taxonomy'],
  },
  {
    key: 'topics',
    applicationKey: 'resources',
    name: 'Topics',
    description:
      'Topic pages and the topics resources belong to.',
    icon: 'tag',
    type: 'settings',
    route: '/admin/topics',
    keywords: ['topics', 'taxonomy'],
  },
  {
    key: 'locations',
    applicationKey: 'resources',
    name: 'Locations',
    description:
      'Counties and cities used for search and the area picker.',
    icon: 'place',
    type: 'settings',
    route: '/admin/locations',
    keywords: ['locations', 'counties', 'areas'],
  },
  {
    key: 'community-topics',
    applicationKey: 'community',
    name: 'Community topics',
    description:
      'Topics people post under in the Community.',
    icon: 'forum',
    type: 'settings',
    route: '/admin/community/topics',
    keywords: ['community', 'topics'],
  },
  {
    key: 'community-moderation',
    applicationKey: 'community',
    name: 'Community moderation',
    description:
      'Review reported posts and comments.',
    icon: 'gavel',
    type: 'maintenance',
    route: '/admin/community/moderation',
    keywords: ['moderation', 'reports', 'community'],
  },
  {
    key: 'jobs',
    applicationKey: 'jobs-training',
    name: 'Jobs',
    description:
      'Post, edit and close job listings.',
    icon: 'work',
    type: 'settings',
    route: '/admin/jobs',
    keywords: ['jobs', 'listings', 'employers'],
  },
  {
    key: 'courses',
    applicationKey: 'courses',
    name: 'Courses',
    description:
      'Create and edit Zebron courses.',
    icon: 'auto_stories',
    type: 'settings',
    route: '/courses/manage',
    keywords: ['courses', 'lessons', 'exams'],
  },
  {
    key: 'test-center',
    applicationKey: 'test-center',
    name: 'Test Center',
    description:
      'Test courses, quizzes and settings.',
    icon: 'quiz',
    type: 'settings',
    route: '/admin/test-center',
    keywords: ['test center', 'quizzes'],
  },
  {
    key: 'test-questions',
    applicationKey: 'test-center',
    name: 'Question bank',
    description:
      'Questions used by quizzes and exams.',
    icon: 'help_center',
    type: 'settings',
    route: '/admin/test-center/questions',
    keywords: ['questions', 'question bank'],
  },
  {
    key: 'tax-pay',
    applicationKey: 'tax-pay',
    name: 'Tax & Pay settings',
    description:
      'Tax years, rates and calculator settings.',
    icon: 'calculate',
    type: 'settings',
    route: '/admin/tax-pay',
    keywords: ['tax', 'pay', 'rates', 'withholding'],
  },
  {
    key: 'content-operations',
    applicationKey: 'content',
    name: 'Content & operations',
    description:
      'Content, milestones, captures and ideas.',
    icon: 'article',
    type: 'settings',
    route: '/admin/content-operations',
    keywords: ['content', 'milestones', 'ideas'],
  },
  {
    key: 'ai-content',
    applicationKey: 'content',
    name: 'AI & content checks',
    description:
      'AI writing help and the weekly content checks (broken links, stale pages).',
    icon: 'auto_fix_high',
    type: 'settings',
    route: '/admin/ai-content',
    keywords: ['ai', 'content checks', 'links', 'gemini'],
  },
  {
    key: 'knowledge',
    applicationKey: 'knowledge',
    name: 'Knowledge Center',
    description:
      'Help articles and guides used by the help assistant.',
    icon: 'menu_book',
    type: 'settings',
    route: '/admin/knowledge',
    keywords: ['knowledge', 'articles', 'guides', 'help'],
  },
  {
    key: 'blog',
    applicationKey: 'blog',
    name: 'Blog',
    description:
      'Write, schedule and manage public blog posts.',
    icon: 'rss_feed',
    type: 'settings',
    route: '/blog/manage',
    keywords: ['blog', 'posts', 'le rondpoint'],
  },
  {
    key: 'internal-blog',
    applicationKey: 'blog',
    name: 'Internal blog',
    description:
      'Posts for Zebron staff only.',
    icon: 'lock',
    type: 'settings',
    route: '/admin/blog',
    keywords: ['internal', 'staff', 'blog'],
  },
  {
    key: 'mailbox',
    applicationKey: 'mailbox',
    name: 'Contact mailbox',
    description:
      'Messages sent to Zebron through the contact form and email.',
    icon: 'mail',
    type: 'settings',
    route: '/admin/contact',
    keywords: ['mailbox', 'contact', 'email'],
  },
  {
    key: 'sent-email',
    applicationKey: 'mailbox',
    name: 'Sent email',
    description:
      'Emails Zebron has sent.',
    icon: 'outgoing_mail',
    type: 'maintenance',
    route: '/admin/contact/sent',
    keywords: ['sent', 'email', 'outbox'],
  },
  {
    key: 'business',
    applicationKey: 'business-operations',
    name: 'Business operations',
    description:
      'Business dashboards and operations.',
    icon: 'business_center',
    type: 'settings',
    route: '/admin/business',
    keywords: ['business', 'operations'],
  },
  {
    key: 'business-profile',
    applicationKey: 'business-operations',
    name: 'Business profile',
    description:
      'Zebron’s own business details.',
    icon: 'badge',
    type: 'settings',
    route: '/admin/business/profile',
    keywords: ['profile', 'company'],
  },
];

export const CONFIGURATION_FEATURES: ConfigurationFeature[] = CARDS.map((card) => ({
  ...card,
  applicationName: catalogApplicationName(card.applicationKey),
}));
