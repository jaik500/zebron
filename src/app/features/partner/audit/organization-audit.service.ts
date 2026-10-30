import { Injectable } from '@angular/core';

import {
  QueryConstraint,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

export type AuditSource = 'organization' | 'platform' | 'system';
export type AuditSeverity = 'info' | 'notice' | 'critical';
export type AuditEntityType =
  | 'organization'
  | 'membership'
  | 'invitation'
  | 'application'
  | 'contract'
  | 'service_request'
  | 'announcement'
  | 'email_sent'
  | 'email_received'
  | 'settings'
  | 'onboarding'
  | 'test_program'
  | 'test_course'
  | 'test_topic'
  | 'test_question';

/** organizations/{id}/auditLogs/{eventId}, written by the audit triggers. */
export interface AuditLogEntry {
  id: string;
  eventId: string;
  occurredAt: Date | null;
  action: 'created' | 'updated' | 'deleted';
  entityType: AuditEntityType;
  entityId: string;
  entityPath: string;
  entityLabel: string;
  summary: string;
  source: AuditSource;
  actorType: 'user' | 'platform_admin' | 'system';
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  changedFields: string[];
  changes: Array<{ field: string; before: unknown; after: unknown }>;
  severity: AuditSeverity;
}

export interface AuditQuery {
  source: AuditSource | 'all';
  entityType: AuditEntityType | 'all';
  from: Date | null;
  to: Date | null;
  /** Cursor from the previous page. */
  after: unknown;
}

const PAGE_SIZE = 50;

/** Reads an organization's audit log (admins and owners; see Firestore rules). */
@Injectable({
  providedIn: 'root',
})
export class OrganizationAuditService {
  async getPage(
    organizationId: string,
    options: AuditQuery,
  ): Promise<{ entries: AuditLogEntry[]; cursor: unknown; hasMore: boolean }> {
    const constraints: QueryConstraint[] = [];

    if (options.source !== 'all') {
      constraints.push(where('source', '==', options.source));
    }

    if (options.entityType !== 'all') {
      constraints.push(where('entityType', '==', options.entityType));
    }

    if (options.from) {
      constraints.push(where('occurredAt', '>=', Timestamp.fromDate(options.from)));
    }

    if (options.to) {
      constraints.push(where('occurredAt', '<=', Timestamp.fromDate(options.to)));
    }

    constraints.push(orderBy('occurredAt', 'desc'));

    if (options.after) {
      constraints.push(startAfter(options.after as QueryDocumentSnapshot));
    }

    constraints.push(limit(PAGE_SIZE));

    const snapshot = await getDocs(
      query(collection(firestore, 'organizations', organizationId, 'auditLogs'), ...constraints),
    );

    const entries = snapshot.docs.map((document) => {
      const data = document.data();
      const occurred = data['occurredAt'];

      return {
        id: document.id,
        eventId: str(data['eventId']),
        occurredAt: occurred && typeof occurred.toDate === 'function' ? occurred.toDate() : null,
        action: (str(data['action']) || 'updated') as AuditLogEntry['action'],
        entityType: str(data['entityType']) as AuditEntityType,
        entityId: str(data['entityId']),
        entityPath: str(data['entityPath']),
        entityLabel: str(data['entityLabel']),
        summary: str(data['summary']),
        source: (str(data['source']) || 'system') as AuditSource,
        actorType: (str(data['actorType']) || 'system') as AuditLogEntry['actorType'],
        actorId: str(data['actorId']) || null,
        actorName: str(data['actorName']) || null,
        actorEmail: str(data['actorEmail']) || null,
        actorRole: str(data['actorRole']) || null,
        changedFields: Array.isArray(data['changedFields']) ? data['changedFields'] : [],
        changes: Array.isArray(data['changes']) ? data['changes'] : [],
        severity: (str(data['severity']) || 'info') as AuditSeverity,
      };
    });

    return {
      entries,
      cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
