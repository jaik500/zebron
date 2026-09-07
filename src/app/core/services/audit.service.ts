import {
  Injectable,
  inject,
} from '@angular/core';

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';

import {
  AuditActorType,
  AuditLog,
  AuditOutcome,
  AuditSource,
} from '../models/audit-log.model';

export interface AuditEventInput {
  action: string;

  entityType: string;

  entityId?: string | null;

  actorId?: string | null;

  actorType?: AuditActorType;

  outcome: AuditOutcome;

  source?: AuditSource;

  reason?: string | null;

  metadata?: Record<
    string,
    unknown
  >;

  before?: unknown;

  after?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {

  // ============================================================
  // SERVICES
  // ============================================================

  private readonly authService =
    inject(AuthService);

  private readonly logger =
    inject(LoggerService);


  // ============================================================
  // FIRESTORE
  // ============================================================

  private readonly auditCollection =
    collection(
      firestore,
      'auditLogs',
    );


  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * Creates an append-only audit record.
   *
   * Audit failures are logged but do not normally cause
   * the original business operation to fail.
   */
  async log(
    input: AuditEventInput,
  ): Promise<
    string | null
  > {

    const operationId =
      this.logger.createOperationId();

    const firebaseUser =
      this.authService.firebaseUser();

    const actorId =
      input.actorId ??
      firebaseUser?.uid ??
      null;

    const actorType =
      input.actorType ??
      this.resolveActorType();

    this.logger.debug(
      'AuditService',
      'Creating audit record.',
      {
        operationId,
        action:
          input.action,
        entityType:
          input.entityType,
        entityId:
          input.entityId ?? null,
        actorId,
        outcome:
          input.outcome,
      },
    );

    try {

      const record: Omit<
        AuditLog,
        'id' | 'createdAt'
      > & {
        createdAt: ReturnType<
          typeof serverTimestamp
        >;
      } = {

        action:
          input.action.trim(),

        entityType:
          input.entityType.trim(),

        entityId:
          input.entityId ??
          null,

        actorId,

        actorType,

        outcome:
          input.outcome,

        source:
          input.source ??
          'web',

        reason:
          input.reason ??
          null,

        metadata:
          this.sanitize(
            input.metadata,
          ) as Record<
            string,
            unknown
          >,

        before:
          this.sanitize(
            input.before,
          ),

        after:
          this.sanitize(
            input.after,
          ),

        createdAt:
          serverTimestamp(),
      };

      const reference =
        await addDoc(
          this.auditCollection,
          record,
        );

      this.logger.info(
        'AuditService',
        'Audit record created.',
        {
          operationId,
          auditId:
            reference.id,
          action:
            input.action,
          entityType:
            input.entityType,
          entityId:
            input.entityId ??
            null,
        },
      );

      return reference.id;

    } catch (error) {

      this.logger.error(
        'AuditService',
        'Failed to create audit record.',
        error,
        {
          operationId,
          action:
            input.action,
          entityType:
            input.entityType,
          entityId:
            input.entityId ??
            null,
        },
      );

      return null;
    }
  }


  // ============================================================
  // READ AUDIT LOGS
  // ============================================================

  /**
   * Retrieves the most recent audit events.
   *
   * The Control Center uses this method to display the
   * administrative audit trail.
   */
  async getRecentLogs(
    maxResults = 100,
  ): Promise<AuditLog[]> {

    const operationId =
      this.logger.createOperationId();

    const safeLimit =
      Math.min(
        Math.max(
          Math.floor(maxResults),
          1,
        ),
        500,
      );

    this.logger.debug(
      'AuditService',
      'Loading recent audit records.',
      {
        operationId,
        limit:
          safeLimit,
      },
    );

    try {

      const auditQuery =
        query(
          this.auditCollection,
          orderBy(
            'createdAt',
            'desc',
          ),
          limit(
            safeLimit,
          ),
        );

      const snapshot =
        await getDocs(
          auditQuery,
        );

      const logs =
        snapshot.docs.map(
          (document) => {

            const data =
              document.data();

            return {
              id:
                document.id,

              action:
                String(
                  data['action'] ??
                  '',
                ),

              entityType:
                String(
                  data['entityType'] ??
                  '',
                ),

              entityId:
                this.toNullableString(
                  data['entityId'],
                ),

              actorId:
                this.toNullableString(
                  data['actorId'],
                ),

              actorType:
                this.toActorType(
                  data['actorType'],
                ),

              outcome:
                this.toOutcome(
                  data['outcome'],
                ),

              source:
                this.toSource(
                  data['source'],
                ),

              reason:
                this.toNullableString(
                  data['reason'],
                ),

              metadata:
                this.toRecord(
                  data['metadata'],
                ),

              before:
                data['before'],

              after:
                data['after'],

              createdAt:
                this.toTimestamp(
                  data['createdAt'],
                ),
            } satisfies AuditLog;
          },
        );

      this.logger.info(
        'AuditService',
        'Recent audit records loaded.',
        {
          operationId,
          count:
            logs.length,
        },
      );

      return logs;

    } catch (error) {

      this.logger.error(
        'AuditService',
        'Failed to load recent audit records.',
        error,
        {
          operationId,
          limit:
            safeLimit,
        },
      );

      throw error;
    }
  }


  // ============================================================
  // ACTOR
  // ============================================================

  private resolveActorType():
    AuditActorType {

    try {

      return this.authService.isAdmin
        ? 'admin'
        : 'user';

    } catch {

      return 'anonymous';
    }
  }


  // ============================================================
  // TYPE CONVERSION
  // ============================================================

  private toNullableString(
    value: unknown,
  ): string | null {

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    return String(value);
  }


  private toActorType(
    value: unknown,
  ): AuditActorType {

    switch (value) {

      case 'user':
      case 'admin':
      case 'system':
      case 'anonymous':
        return value;

      default:
        return 'system';
    }
  }


  private toOutcome(
    value: unknown,
  ): AuditOutcome {

    switch (value) {

      case 'success':
      case 'failure':
      case 'denied':
      case 'cancelled':
        return value;

      default:
        return 'failure';
    }
  }


  private toSource(
    value: unknown,
  ): AuditSource {

    switch (value) {

      case 'web':
      case 'server':
      case 'system':
        return value;

      default:
        return 'web';
    }
  }


  private toTimestamp(
    value: unknown,
  ): Timestamp | undefined {

    if (
      value instanceof Timestamp
    ) {
      return value;
    }

    return undefined;
  }


  private toRecord(
    value: unknown,
  ): Record<string, unknown> {

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value as Record<
        string,
        unknown
      >;
    }

    return {};
  }


  // ============================================================
  // SECURITY
  // ============================================================

  private sanitize(
    value: unknown,
    depth = 0,
  ): unknown {

    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    if (depth > 5) {
      return '[max-depth]';
    }

    if (
      typeof value === 'string'
    ) {
      return value.length > 2000
        ? `${value.substring(0, 2000)}...[truncated]`
        : value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (
      value instanceof Date
    ) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {

      return value.map(
        (item) =>
          this.sanitize(
            item,
            depth + 1,
          ),
      );
    }

    if (
      typeof value === 'object'
    ) {

      const result:
        Record<
          string,
          unknown
        > = {};

      for (
        const [
          key,
          item,
        ] of Object.entries(
          value as Record<
            string,
            unknown
          >,
        )
      ) {

        if (
          this.isSensitiveKey(
            key,
          )
        ) {

          result[key] =
            '[REDACTED]';

          continue;
        }

        result[key] =
          this.sanitize(
            item,
            depth + 1,
          );
      }

      return result;
    }

    return String(value);
  }


  private isSensitiveKey(
    key: string,
  ): boolean {

    const normalized =
      key
        .toLowerCase()
        .replace(
          /[_-]/g,
          '',
        );

    return [
      'password',
      'passwd',
      'token',
      'accesstoken',
      'refreshtoken',
      'idtoken',
      'secret',
      'apikey',
      'authorization',
      'cookie',
      'credential',
      'privatekey',
    ].some(
      (sensitive) =>
        normalized.includes(
          sensitive,
        ),
    );
  }
}