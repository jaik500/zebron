export type ConfigurationFeatureType =
  | 'settings'
  | 'maintenance'
  | 'monitoring'
  | 'audit'
  | 'knowledge'
  | 'diagnostics'
  | 'security'
  | 'applications'
  | 'recovery';

export interface ConfigurationFeature {
  key: string;
  applicationKey: string;
  applicationName: string;

  name: string;
  description: string;
  icon: string;

  type: ConfigurationFeatureType;

  route?: string;

  keywords: string[];

  enabled?: boolean;
}