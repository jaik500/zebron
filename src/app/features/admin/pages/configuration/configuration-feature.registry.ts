import {
  ConfigurationFeature,
} from './models/configuration-feature.model';

export const CONFIGURATION_FEATURES: ConfigurationFeature[] = [

  // ============================================================
  // CORE PLATFORM
  // ============================================================

  {
    key: 'platform-applications',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Applications',
    description:
      'Manage application availability, lifecycle state, and dependencies.',
    icon: 'apps',
    type: 'applications',
    route: '/admin/configuration/applications',
    keywords: [
      'applications',
      'app',
      'availability',
      'enabled',
      'disabled',
      'maintenance',
      'dependencies',
      'lifecycle',
    ],
  },

  {
    key: 'platform-settings',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Settings',
    description:
      'Manage centralized platform settings and configuration values.',
    icon: 'settings',
    type: 'settings',
    route: '/admin/configuration/settings',
    keywords: [
      'settings',
      'configuration',
      'platform',
      'system',
      'core',
    ],
  },

  {
    key: 'platform-monitoring',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Operational Monitoring',
    description:
      'Monitor application health, operational events, and diagnostics.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'monitoring',
      'health',
      'events',
      'diagnostics',
      'operational',
      'telemetry',
      'platform',
    ],
  },

  {
    key: 'platform-audit',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Audit',
    description:
      'Review administrative and system audit activity.',
    icon: 'fact_check',
    type: 'audit',
    route: '/admin/configuration/audit',
    keywords: [
      'audit',
      'history',
      'administration',
      'activity',
      'security',
      'logs',
    ],
  },

  {
    key: 'platform-maintenance',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Maintenance',
    description:
      'Manage platform maintenance operations and maintenance mode.',
    icon: 'build',
    type: 'maintenance',
    route: '/admin/configuration/maintenance',
    keywords: [
      'maintenance',
      'cache',
      'operations',
      'platform',
      'system',
    ],
  },

  {
    key: 'platform-recovery',
    applicationKey: 'core',
    applicationName: 'Core Platform',
    name: 'Recovery',
    description:
      'Perform controlled platform recovery and reset operations.',
    icon: 'restore',
    type: 'recovery',
    route: '/admin/configuration/recovery',
    keywords: [
      'recovery',
      'reset',
      'restore',
      'repair',
      'platform',
    ],
  },

  // ============================================================
  // COMMUNITY
  // ============================================================

  {
    key: 'community-settings',
    applicationKey: 'community',
    applicationName: 'Community',
    name: 'Community Settings',
    description:
      'Manage Community application behavior and configuration.',
    icon: 'forum',
    type: 'settings',
    keywords: [
      'community',
      'settings',
      'posts',
      'comments',
      'reactions',
      'moderation',
    ],
  },

  {
    key: 'community-monitoring',
    applicationKey: 'community',
    applicationName: 'Community',
    name: 'Community Monitoring',
    description:
      'Monitor Community operational health and events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'community',
      'monitoring',
      'health',
      'events',
      'posts',
      'errors',
    ],
  },

  {
    key: 'community-knowledge',
    applicationKey: 'community',
    applicationName: 'Community',
    name: 'Community Knowledge',
    description:
      'Manage Community documentation, guides, and troubleshooting articles.',
    icon: 'menu_book',
    type: 'knowledge',
    route: '/admin/configuration/knowledge',
    keywords: [
      'community',
      'knowledge',
      'documentation',
      'guide',
      'troubleshooting',
      'runbook',
    ],
  },

  // ============================================================
  // TAX & PAY
  // ============================================================

  {
    key: 'tax-pay-settings',
    applicationKey: 'tax-pay',
    applicationName: 'Tax & Pay Calculator',
    name: 'Tax & Pay Settings',
    description:
      'Manage Tax & Pay calculator configuration.',
    icon: 'payments',
    type: 'settings',
    keywords: [
      'tax',
      'pay',
      'calculator',
      'w2',
      '1099',
      'contractor',
      'settings',
    ],
  },

  {
    key: 'tax-pay-maintenance',
    applicationKey: 'tax-pay',
    applicationName: 'Tax & Pay Calculator',
    name: 'Tax & Pay Maintenance',
    description:
      'Manage tax-year and calculator maintenance activities.',
    icon: 'build',
    type: 'maintenance',
    keywords: [
      'tax',
      'pay',
      'maintenance',
      'tax year',
      'rates',
      'withholding',
    ],
  },

  {
    key: 'tax-pay-monitoring',
    applicationKey: 'tax-pay',
    applicationName: 'Tax & Pay Calculator',
    name: 'Tax & Pay Monitoring',
    description:
      'Monitor Tax & Pay calculator health and operational events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'tax',
      'pay',
      'monitoring',
      'calculator',
      'health',
      'errors',
    ],
  },

  {
    key: 'tax-pay-knowledge',
    applicationKey: 'tax-pay',
    applicationName: 'Tax & Pay Calculator',
    name: 'Tax & Pay Knowledge',
    description:
      'Manage Tax & Pay documentation and troubleshooting guides.',
    icon: 'menu_book',
    type: 'knowledge',
    route: '/admin/configuration/knowledge',
    keywords: [
      'tax',
      'pay',
      'knowledge',
      'documentation',
      'calculator',
      'w2',
      '1099',
    ],
  },

  // ============================================================
  // RESOURCES
  // ============================================================

  {
    key: 'resources-settings',
    applicationKey: 'resources',
    applicationName: 'Resources',
    name: 'Resource Settings',
    description:
      'Manage Resource Center configuration.',
    icon: 'library_books',
    type: 'settings',
    keywords: [
      'resources',
      'settings',
      'categories',
      'locations',
      'resource center',
    ],
  },

  {
    key: 'resources-monitoring',
    applicationKey: 'resources',
    applicationName: 'Resources',
    name: 'Resource Monitoring',
    description:
      'Monitor Resource Center health and operational events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'resources',
      'monitoring',
      'health',
      'events',
      'errors',
    ],
  },

  {
    key: 'resources-knowledge',
    applicationKey: 'resources',
    applicationName: 'Resources',
    name: 'Resource Knowledge',
    description:
      'Manage Resource Center documentation and support articles.',
    icon: 'menu_book',
    type: 'knowledge',
    route: '/admin/configuration/knowledge',
    keywords: [
      'resources',
      'knowledge',
      'documentation',
      'guide',
      'troubleshooting',
    ],
  },

  // ============================================================
  // CONTENT
  // ============================================================

  {
    key: 'content-settings',
    applicationKey: 'content',
    applicationName: 'Content',
    name: 'Content Settings',
    description:
      'Manage Content application behavior and configuration.',
    icon: 'article',
    type: 'settings',
    keywords: [
      'content',
      'settings',
      'articles',
      'pages',
      'media',
      'editorial',
    ],
  },

  {
    key: 'content-monitoring',
    applicationKey: 'content',
    applicationName: 'Content',
    name: 'Content Monitoring',
    description:
      'Monitor content processing, publishing activity, and operational events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'content',
      'monitoring',
      'publishing',
      'health',
      'events',
      'errors',
    ],
  },

  {
    key: 'content-knowledge',
    applicationKey: 'content',
    applicationName: 'Content',
    name: 'Content Knowledge',
    description:
      'Manage Content documentation, editorial guides, and troubleshooting articles.',
    icon: 'menu_book',
    type: 'knowledge',
    route: '/admin/configuration/knowledge',
    keywords: [
      'content',
      'knowledge',
      'documentation',
      'guide',
      'editorial',
      'troubleshooting',
    ],
  },

  // ============================================================
  // KNOWLEDGE
  // ============================================================

  {
    key: 'knowledge-settings',
    applicationKey: 'knowledge',
    applicationName: 'Knowledge',
    name: 'Knowledge Settings',
    description:
      'Manage Knowledge Center behavior and configuration.',
    icon: 'menu_book',
    type: 'settings',
    keywords: [
      'knowledge',
      'knowledge center',
      'settings',
      'articles',
      'documentation',
      'configuration',
    ],
  },

  {
    key: 'knowledge-monitoring',
    applicationKey: 'knowledge',
    applicationName: 'Knowledge',
    name: 'Knowledge Monitoring',
    description:
      'Monitor Knowledge Center publishing, article processing, and operational events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'knowledge',
      'monitoring',
      'articles',
      'publishing',
      'health',
      'errors',
    ],
  },

  {
    key: 'knowledge-maintenance',
    applicationKey: 'knowledge',
    applicationName: 'Knowledge',
    name: 'Knowledge Maintenance',
    description:
      'Manage Knowledge Center maintenance and content lifecycle activities.',
    icon: 'build',
    type: 'maintenance',
    keywords: [
      'knowledge',
      'maintenance',
      'articles',
      'archive',
      'restore',
      'cleanup',
    ],
  },

  // ============================================================
  // MAILBOX
  // ============================================================

  {
    key: 'mailbox-settings',
    applicationKey: 'mailbox',
    applicationName: 'Mailbox',
    name: 'Mailbox Settings',
    description:
      'Manage mailbox and email processing configuration.',
    icon: 'mail',
    type: 'settings',
    keywords: [
      'mailbox',
      'email',
      'settings',
      'inbound',
      'outbound',
      'mail processing',
    ],
  },

  {
    key: 'mailbox-monitoring',
    applicationKey: 'mailbox',
    applicationName: 'Mailbox',
    name: 'Mailbox Monitoring',
    description:
      'Monitor inbound and outbound email processing and mailbox health.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'mailbox',
      'email',
      'monitoring',
      'inbound',
      'outbound',
      'health',
      'errors',
    ],
  },

  {
    key: 'mailbox-maintenance',
    applicationKey: 'mailbox',
    applicationName: 'Mailbox',
    name: 'Mailbox Maintenance',
    description:
      'Manage mailbox maintenance, processing queues, and email cleanup operations.',
    icon: 'build',
    type: 'maintenance',
    keywords: [
      'mailbox',
      'maintenance',
      'email',
      'queue',
      'cleanup',
      'processing',
    ],
  },

  // ============================================================
  // BUSINESS OPERATIONS
  // ============================================================

  {
    key: 'business-operations-settings',
    applicationKey: 'business-operations',
    applicationName: 'Business Operations',
    name: 'Business Operations Settings',
    description:
      'Manage business operation configuration and administrative settings.',
    icon: 'business_center',
    type: 'settings',
    keywords: [
      'business operations',
      'operations',
      'settings',
      'configuration',
      'business',
      'processes',
    ],
  },

  {
    key: 'business-operations-monitoring',
    applicationKey: 'business-operations',
    applicationName: 'Business Operations',
    name: 'Business Operations Monitoring',
    description:
      'Monitor business processes, operational workflows, and related events.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'business operations',
      'operations',
      'monitoring',
      'workflows',
      'processes',
      'health',
      'errors',
    ],
  },

  {
    key: 'business-operations-maintenance',
    applicationKey: 'business-operations',
    applicationName: 'Business Operations',
    name: 'Business Operations Maintenance',
    description:
      'Manage business operation maintenance and controlled administrative activities.',
    icon: 'build',
    type: 'maintenance',
    keywords: [
      'business operations',
      'maintenance',
      'operations',
      'processes',
      'workflows',
    ],
  },

  // ============================================================
  // CONFIGURATION
  // ============================================================

  {
    key: 'configuration-settings',
    applicationKey: 'configuration',
    applicationName: 'Configuration',
    name: 'Configuration Settings',
    description:
      'Manage application configuration and administrative settings.',
    icon: 'settings',
    type: 'settings',
    route: '/admin/configuration/settings',
    keywords: [
      'configuration',
      'settings',
      'application configuration',
      'administration',
      'system settings',
    ],
  },

  {
    key: 'configuration-monitoring',
    applicationKey: 'configuration',
    applicationName: 'Configuration',
    name: 'Configuration Monitoring',
    description:
      'Monitor configuration changes, operational events, and configuration-related health.',
    icon: 'monitor_heart',
    type: 'monitoring',
    route: '/admin/configuration/operational-monitoring',
    keywords: [
      'configuration',
      'monitoring',
      'health',
      'events',
      'changes',
      'diagnostics',
    ],
  },

  {
    key: 'configuration-maintenance',
    applicationKey: 'configuration',
    applicationName: 'Configuration',
    name: 'Configuration Maintenance',
    description:
      'Manage configuration maintenance and administrative maintenance activities.',
    icon: 'build',
    type: 'maintenance',
    route: '/admin/configuration/maintenance',
    keywords: [
      'configuration',
      'maintenance',
      'settings',
      'administration',
      'system',
    ],
  },

  {
    key: 'configuration-audit',
    applicationKey: 'configuration',
    applicationName: 'Configuration',
    name: 'Configuration Audit',
    description:
      'Review configuration changes and administrative configuration activity.',
    icon: 'fact_check',
    type: 'audit',
    route: '/admin/configuration/audit',
    keywords: [
      'configuration',
      'audit',
      'history',
      'changes',
      'administration',
      'activity',
    ],
  },

];