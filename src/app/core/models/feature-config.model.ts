import { Timestamp } from 'firebase/firestore';

export type FeatureAvailability =
  | 'enabled'
  | 'disabled'
  | 'maintenance';

export interface FeatureConfig {
  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * Stable application/feature key.
   *
   * Example:
   * community
   * resources
   * learning-lab
   */
  key: string;

  /**
   * Human-readable application name.
   */
  name: string;

  /**
   * Description displayed in the Control Center.
   */
  description?: string;

  /**
   * Overall runtime availability.
   */
  availability: FeatureAvailability;

  /**
   * Convenience property derived from availability.
   */
  enabled: boolean;

  /**
   * Whether the feature should appear in navigation.
   */
  visibleInNavigation: boolean;

  /**
   * Whether new users can access this feature.
   */
  allowNewUsers: boolean;

  /**
   * Core applications cannot normally be disabled.
   *
   * Examples:
   * Authentication
   * Admin Center
   */
  core: boolean;

  /**
   * Other features that must be available.
   */
  dependencies: string[];

  /**
   * Material icon name.
   */
  icon?: string;

  /**
   * Application route.
   */
  route?: string | null;

  /**
   * Application version.
   */
  version?: string;

  /**
   * Last administrator/system that changed the configuration.
   */
  updatedBy?: string | null;

  updatedAt?: Timestamp;
}