export const PERMISSIONS = {
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_MANAGE: 'applications.manage',

  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  FEATURES_VIEW: 'features.view',
  FEATURES_MANAGE: 'features.manage',

  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  ORGANIZATIONS_VIEW: 'organizations.view',
  ORGANIZATIONS_MANAGE: 'organizations.manage',

  TAX_RULES_VIEW: 'tax-rules.view',
  TAX_RULES_MANAGE: 'tax-rules.manage',
  TAX_RULES_PUBLISH: 'tax-rules.publish',

  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_EXECUTE: 'operations.execute',

  AUDIT_VIEW: 'audit.view',

  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];