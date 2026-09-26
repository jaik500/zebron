export type ApplicationValidationStatus =
  | 'passed'
  | 'warning'
  | 'failed';

export interface ApplicationValidationIssue {
  dependencyId: string;
  applicationKey: string;
  status: ApplicationValidationStatus;
  message: string;
  path?: string;
}

export interface ApplicationValidationResult {
  applicationKey: string;
  applicationName: string;
  status: ApplicationValidationStatus;
  checked: number;
  passed: number;
  warnings: number;
  failed: number;
  issues: ApplicationValidationIssue[];
  validatedAt: string;
}

export interface ApplicationValidationSummary {
  applications: number;
  passed: number;
  warnings: number;
  failed: number;
  checked: number;
  issues: number;
  validatedAt: string | null;
}