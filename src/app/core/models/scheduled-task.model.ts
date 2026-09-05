import { Timestamp } from 'firebase/firestore';

/**
 * Identifies the type of record that owns a scheduled task.
 *
 * This is intentionally platform-wide so the scheduler can
 * eventually support Business, Learning Lab, Test Center,
 * Community, Resources, and other Zebron features.
 */
export type ScheduledTaskSourceType =
  | 'business-compliance'
  | 'business-activity'
  | 'business-document'
  | 'learning'
  | 'test-center'
  | 'community'
  | 'resource'
  | 'other';

/**
 * Defines what the scheduled task should do.
 */
export type ScheduledTaskAction =
  | 'update-compliance-status'
  | 'send-reminder'
  | 'expire-record'
  | 'custom';

/**
 * Represents one centrally managed scheduled task.
 *
 * The task points back to the source record rather than
 * duplicating the source record's business data.
 */
export interface ScheduledTask {
  id: string;

  /**
   * Whether this task is currently active.
   */
  enabled: boolean;

  /**
   * Type of record being scheduled.
   */
  sourceType: ScheduledTaskSourceType;

  /**
   * ID of the source record.
   */
  sourceId: string;

  /**
   * Business operation to perform.
   */
  action: ScheduledTaskAction;

  /**
   * Optional business association.
   *
   * This allows future multi-business support.
   */
  businessId?: string;

  /**
   * Specific date/time the task should run.
   */
  runAt?: Timestamp;

  /**
   * Number of days before the source date
   * that the scheduler should act.
   */
  daysBefore?: number;

  /**
   * Whether the task should continue being
   * evaluated after it has been processed.
   */
  repeat: boolean;

  /**
   * Most recent execution time.
   */
  lastRunAt?: Timestamp;

  /**
   * Next calculated execution time.
   */
  nextRunAt?: Timestamp;

  /**
   * Optional error information from the
   * most recent execution.
   */
  lastError?: string;

  /**
   * Number of times this task has executed.
   */
  runCount: number;

  /**
   * User who created the task.
   */
  createdBy: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}