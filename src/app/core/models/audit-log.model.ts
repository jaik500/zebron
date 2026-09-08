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

  action: string;

  entityType: string;

  entityId?: string | null;

  /**
   * Firebase/Auth user ID.
   */
  actorId?: string | null;

  /**
   * User's display name captured at the
   * time the audit event occurred.
   */
  actorName?: string | null;

  /**
   * User's email captured at the
   * time the audit event occurred.
   */
  actorEmail?: string | null;

  actorType: AuditActorType;

  outcome: AuditOutcome;

  source: AuditSource;

  reason?: string | null;

  metadata?: Record<string, unknown>;

  before?: unknown;

  after?: unknown;

  /**
   * Server-generated audit timestamp.
   */
  createdAt?: Timestamp;
}