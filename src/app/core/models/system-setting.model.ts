import { Timestamp } from 'firebase/firestore';

export type SystemSettingType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'json';

export type SystemSettingValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, unknown>;

export interface SystemSetting<T = SystemSettingValue> {
  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * Stable configuration key.
   *
   * Example:
   * community.comment.maxLength
   */
  key: string;

  /**
   * Human-readable label.
   */
  label: string;

  /**
   * Group displayed in the Control Center.
   */
  group: string;

  /**
   * Description of what the setting controls.
   */
  description?: string;

  /**
   * Data type used by the Control Center editor.
   */
  type: SystemSettingType;

  /**
   * Current runtime value.
   */
  value: T;

  /**
   * Default value used by Reset.
   */
  defaultValue: T;

  /**
   * Whether administrators can modify this setting.
   */
  editable: boolean;

  /**
   * Whether the setting can safely be exposed
   * to the client application.
   *
   * Sensitive server-only configuration should
   * never be stored here.
   */
  clientReadable: boolean;

  updatedBy?: string | null;

  updatedAt?: Timestamp;
}