import { ConfigurationApplication } from '../models/configuration-application.model';

export const CONFIGURATION_APPLICATIONS: ConfigurationApplication[] = [
  {
    key: 'core',
    name: 'Core Platform',
    description:
      'Core Zebron platform configuration, authentication, authorization, access control, users, and shared services.',
    icon: 'hub',
    enabled: true,
    keywords: [
      'core',
      'platform',
      'authentication',
      'authorization',
      'access',
      'users',
      'security',
      'permissions',
      'roles',
      'shared services',
    ],
  },

  {
    key: 'resources',
    name: 'Resources',
    description:
      'Manage resource listings, categories, locations, availability, organizations, and resource administration.',
    icon: 'library_books',
    enabled: true,
    keywords: [
      'resources',
      'resource center',
      'resource listings',
      'categories',
      'locations',
      'availability',
      'organizations',
      'resource administration',
    ],
  },

  {
    key: 'community',
    name: 'Community',
    description:
      'Manage community posts, topics, comments, reactions, notifications, messaging, following, and moderation.',
    icon: 'groups',
    enabled: true,
    keywords: [
      'community',
      'posts',
      'topics',
      'comments',
      'reactions',
      'notifications',
      'messaging',
      'chat',
      'following',
      'bookmarks',
      'moderation',
      'reporting',
    ],
  },

  {
    key: 'jobs-training',
    name: 'Jobs & Training',
    description:
      'Manage jobs, training opportunities, bootcamps, career resources, and employment-related administration.',
    icon: 'work',
    enabled: true,
    keywords: [
      'jobs',
      'training',
      'bootcamp',
      'employment',
      'career',
      'courses',
      'opportunities',
      'job administration',
      'training administration',
    ],
  },

  {
    key: 'test-center',
    name: 'Test Center',
    description:
      'Manage test courses, question banks, questions, topics, assessments, practice, results, and progress.',
    icon: 'quiz',
    enabled: true,
    keywords: [
      'test',
      'test center',
      'testing',
      'courses',
      'questions',
      'question banks',
      'topics',
      'assessments',
      'practice',
      'results',
      'progress',
    ],
  },

  {
    key: 'tax-pay',
    name: 'Tax & Pay Calculator',
    description:
      'Manage tax calculator configuration, W-2 and 1099 calculations, tax profiles, tax rates, withholding, and pay calculations.',
    icon: 'calculate',
    enabled: true,
    keywords: [
      'tax',
      'pay',
      'calculator',
      'w2',
      'w-2',
      '1099',
      'contractor',
      'withholding',
      'federal tax',
      'state tax',
      'local tax',
      'maryland',
      'tax rates',
      'pay periods',
      'net pay',
    ],
  },

  {
    key: 'content',
    name: 'Content',
    description:
      'Manage editorial content, pages, media, announcements, content categories, publishing workflows, and content administration.',
    icon: 'article',
    enabled: true,
    keywords: [
      'content',
      'articles',
      'pages',
      'media',
      'editorial',
      'publishing',
      'announcements',
      'categories',
      'content management',
      'cms',
    ],
  },

  {
    key: 'knowledge',
    name: 'Knowledge',
    description:
      'Manage knowledge articles, documentation, guides, FAQs, troubleshooting content, runbooks, and application knowledge.',
    icon: 'menu_book',
    enabled: true,
    keywords: [
      'knowledge',
      'knowledge center',
      'knowledge articles',
      'documentation',
      'guides',
      'how-to',
      'troubleshooting',
      'runbooks',
      'faq',
      'reference',
      'support documentation',
    ],
  },

  {
    key: 'mailbox',
    name: 'Mailbox',
    description:
      'Manage inbound and outbound application email, mailbox processing, email routing, notifications, templates, and email administration.',
    icon: 'mail',
    enabled: true,
    keywords: [
      'mailbox',
      'email',
      'emails',
      'inbound email',
      'outbound email',
      'email routing',
      'notifications',
      'email templates',
      'mail processing',
      'communication',
    ],
  },

  {
    key: 'business-operations',
    name: 'Business Operations',
    description:
      'Manage operational workflows, business processes, organizational operations, service activities, and administrative business functions.',
    icon: 'business_center',
    enabled: true,
    keywords: [
      'business operations',
      'operations',
      'business processes',
      'workflows',
      'services',
      'organizations',
      'operational workflows',
      'business administration',
      'process management',
    ],
  },

  {
    key: 'configuration',
    name: 'Configuration',
    description:
      'Manage application configuration, feature availability, system settings, maintenance controls, security configuration, and administrative controls.',
    icon: 'settings',
    enabled: true,
    keywords: [
      'configuration',
      'settings',
      'application settings',
      'feature configuration',
      'feature flags',
      'maintenance',
      'security configuration',
      'administration',
      'system settings',
      'control center',
    ],
  },
];