export const PERMISSIONS = {
  // ---------------------------------------------------------------------------
  // Applications
  // ---------------------------------------------------------------------------
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_MANAGE: 'applications.manage',

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  // ---------------------------------------------------------------------------
  // Features
  // ---------------------------------------------------------------------------
  FEATURES_VIEW: 'features.view',
  FEATURES_MANAGE: 'features.manage',

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  // ---------------------------------------------------------------------------
  // Organizations
  // ---------------------------------------------------------------------------
  ORGANIZATIONS_VIEW: 'organizations.view',
  ORGANIZATIONS_MANAGE: 'organizations.manage',

  // ---------------------------------------------------------------------------
  // Tax Rules
  //
  // These permissions control administration of tax rules/configuration.
  // They do NOT control access to the public Tax & Pay Calculator.
  // ---------------------------------------------------------------------------
  TAX_RULES_VIEW: 'tax-rules.view',
  TAX_RULES_MANAGE: 'tax-rules.manage',
  TAX_RULES_PUBLISH: 'tax-rules.publish',

  // ---------------------------------------------------------------------------
  // Operations
  // ---------------------------------------------------------------------------
  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_EXECUTE: 'operations.execute',

  // ---------------------------------------------------------------------------
  // Audit
  // ---------------------------------------------------------------------------
  AUDIT_VIEW: 'audit.view',

  // ---------------------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------------------
  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',

   // ---------------------------------------------------------------------------
  // Community
  //
  // Community is available to authenticated basic users.
  // Moderation/management permissions are separate from basic participation.
  // ---------------------------------------------------------------------------

  COMMUNITY_VIEW: 'community.view',
  COMMUNITY_CREATE: 'community.create',
  COMMUNITY_COMMENT: 'community.comment',
  COMMUNITY_REACT: 'community.react',
  COMMUNITY_MODERATE: 'community.moderate',
  COMMUNITY_MANAGE: 'community.manage',

  // ---------------------------------------------------------------------------
  // Resources
  // ---------------------------------------------------------------------------

  RESOURCES_VIEW: 'resources.view',
  RESOURCES_MANAGE: 'resources.manage',

  // ---------------------------------------------------------------------------
  // Jobs
  // ---------------------------------------------------------------------------

  JOBS_VIEW: 'jobs.view',
  JOBS_MANAGE: 'jobs.manage',

  // ---------------------------------------------------------------------------
  // Training
  // ---------------------------------------------------------------------------

  TRAINING_VIEW: 'training.view',
  TRAINING_MANAGE: 'training.manage',

  // ---------------------------------------------------------------------------
  // Test Center
  // ---------------------------------------------------------------------------

  TEST_CENTER_VIEW: 'test-center.view',
  TEST_CENTER_MANAGE: 'test-center.manage',
  TEST_CENTER_QUESTIONS_MANAGE: 'test-center.questions.manage',
  TEST_CENTER_QUESTIONS_REVIEW: 'test-center.questions.review',
  TEST_CENTER_QUESTIONS_PUBLISH: 'test-center.questions.publish',

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  CONTENT_VIEW: 'content.view',
  CONTENT_MANAGE: 'content.manage',

  // ---------------------------------------------------------------------------
  // Knowledge
  // ---------------------------------------------------------------------------

  KNOWLEDGE_VIEW: 'knowledge.view',
  KNOWLEDGE_CREATE: 'knowledge.create',
  KNOWLEDGE_MANAGE: 'knowledge.manage',
  KNOWLEDGE_PUBLISH: 'knowledge.publish',

  // ---------------------------------------------------------------------------
  // Mailbox
  // ---------------------------------------------------------------------------

  MAILBOX_VIEW: 'mailbox.view',
  MAILBOX_MANAGE: 'mailbox.manage',

  // ---------------------------------------------------------------------------
  // Business Operations
  // ---------------------------------------------------------------------------

  BUSINESS_OPERATIONS_VIEW: 'business-operations.view',
  BUSINESS_OPERATIONS_EXECUTE: 'business-operations.execute',

  // ---------------------------------------------------------------------------
  // Veya Cyber Range
  // ---------------------------------------------------------------------------

  CYBER_RANGE_VIEW: 'cyber-range.view',
  CYBER_RANGE_LAUNCH: 'cyber-range.launch',
  CYBER_RANGE_MANAGE: 'cyber-range.manage',
  CYBER_RANGE_INSTRUCTOR: 'cyber-range.instructor',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
