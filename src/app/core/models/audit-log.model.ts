import { Timestamp } from 'firebase/firestore';

export type AuditActorType =
  | 'user'
  | 'admin'
  | 'system'
  | 'anonymous';

export type AuditOutcome =
  | 'success'
  | 'failure'
  | 'denied'
  | 'cancelled';

export type AuditSource =
  | 'web'
  | 'server'
  | 'system';

export interface AuditLog {
  id: string;

  /**
   * Machine-readable action.
   *
   * Examples:
   * configuration.feature.updated
   * configuration.setting.updated
   * community.post.created
   * community.comment.deleted
   */
  action: string;

  /**
   * Type of entity affected by the action.
   */
  entityType: string;

  /**
   * ID of the affected entity, when applicable.
   */
  entityId?: string | null;

  /**
   * User or system responsible for the action.
   */
  actorId?: string | null;

  actorType: AuditActorType;

  /**
   * Whether the operation succeeded, failed, etc.
   */
  outcome: AuditOutcome;

  /**
   * Where the action originated.
   */
  source: AuditSource;

  /**
   * Optional human-readable reason.
   */
  reason?: string | null;

  /**
   * Additional structured information.
   *
   * Never place passwords, tokens, credentials,
   * private message content, or other secrets here.
   */
  metadata?: Record<string, unknown>;

  /**
   * State before the change.
   */
  before?: unknown;

  /**
   * State after the change.
   */
  after?: unknown;

  createdAt?: Timestamp;
}