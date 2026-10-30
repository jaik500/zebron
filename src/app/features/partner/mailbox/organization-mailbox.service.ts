import { Injectable } from '@angular/core';

import {
  Timestamp,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../../core/services/firebase-config';

/** Must match functions/src/inbound-email.ts. */
export const ORGANIZATION_INBOUND_DOMAIN = 'zebron.org';

export function organizationMailboxAddress(slug: string | null | undefined): string | null {
  const normalized = slug?.trim().toLowerCase() ?? '';

  return /^[a-z0-9][a-z0-9-]{0,99}$/.test(normalized)
    ? `org+${normalized}@${ORGANIZATION_INBOUND_DOMAIN}`
    : null;
}

export interface InboundAttachment {
  id?: string;
  filename?: string;
  content_type?: string;
  size?: number;
}

/** organizations/{id}/inboundMessages/{emailId}, written by receiveInboundEmail. */
export interface InboundMailboxMessage {
  id: string;
  name: string;
  email: string;
  to: string[];
  cc: string[];
  subject: string;
  message: string;
  html: string;
  attachments: InboundAttachment[];
  status: 'new' | 'read' | 'archived';
  read: boolean;
  archived: boolean;
  receivedAt: Timestamp | null;
  repliedAt: Timestamp | null;
}

/** organizations/{id}/sentMessages/{id}, written by sendOrganizationMailboxEmail. */
export interface SentMailboxMessage {
  id: string;
  to: string[];
  cc: string[];
  subject: string;
  message: string;
  senderName: string;
  replyTo: string | null;
  inReplyToMessageId: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  status: 'sending' | 'sent' | 'failed';
  createdAt: Timestamp | null;
}

export interface MailboxSendInput {
  organizationId: string;
  to: string[];
  cc: string[];
  subject: string;
  message: string;
  inReplyToMessageId?: string | null;
}

/**
 * Organization mailbox: messages sent to org+<slug>@zebron.org and
 * email sent from the organization. Managers and above only (rules).
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationMailboxService {
  private inbound(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'inboundMessages');
  }

  private sent(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'sentMessages');
  }

  /** Latest 200 received messages, newest first (inbox and archive). */
  async getReceived(organizationId: string): Promise<InboundMailboxMessage[]> {
    const snapshot = await getDocs(
      query(this.inbound(organizationId), orderBy('receivedAt', 'desc'), limit(200)),
    );

    return snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        name: str(data['name']) || str(data['email']),
        email: str(data['email']).toLowerCase(),
        to: strings(data['to']),
        cc: strings(data['cc']),
        subject: str(data['subject']),
        message: str(data['message']),
        html: str(data['html']),
        attachments: Array.isArray(data['attachments']) ? data['attachments'] : [],
        status: data['status'] === 'archived' || data['status'] === 'read' ? data['status'] : 'new',
        read: data['read'] === true,
        archived: data['archived'] === true || data['status'] === 'archived',
        receivedAt: (data['receivedAt'] ?? data['createdAt'] ?? null) as Timestamp | null,
        repliedAt: (data['repliedAt'] ?? null) as Timestamp | null,
      };
    });
  }

  /** Latest 100 sent emails, newest first. */
  async getSent(organizationId: string): Promise<SentMailboxMessage[]> {
    const snapshot = await getDocs(
      query(this.sent(organizationId), orderBy('createdAt', 'desc'), limit(100)),
    );

    return snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        to: strings(data['to']),
        cc: strings(data['cc']),
        subject: str(data['subject']),
        message: str(data['message']),
        senderName: str(data['senderName']),
        replyTo: str(data['replyTo']) || null,
        inReplyToMessageId: str(data['inReplyToMessageId']) || null,
        createdByName: str(data['createdByName']) || null,
        createdByEmail: str(data['createdByEmail']) || null,
        status: data['status'] === 'failed' || data['status'] === 'sending' ? data['status'] : 'sent',
        createdAt: (data['createdAt'] ?? null) as Timestamp | null,
      };
    });
  }

  async countUnread(organizationId: string): Promise<number> {
    const snapshot = await getCountFromServer(
      query(this.inbound(organizationId), where('status', '==', 'new')),
    );

    return snapshot.data().count;
  }

  markRead(organizationId: string, messageId: string): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'read', read: true, archived: false });
  }

  markUnread(organizationId: string, messageId: string): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'new', read: false, archived: false });
  }

  archive(organizationId: string, messageId: string): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'archived', read: true, archived: true });
  }

  restore(organizationId: string, messageId: string): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'read', read: true, archived: false });
  }

  async send(input: MailboxSendInput): Promise<{ sentMessageId: string }> {
    const callable = httpsCallable<MailboxSendInput, { success: boolean; sentMessageId: string }>(
      firebaseFunctions,
      'sendOrganizationMailboxEmail',
    );

    const result = await callable(input);

    return { sentMessageId: result.data.sentMessageId };
  }

  /** Only status, read, archived and updatedAt may change (Firestore rules). */
  private async setState(
    organizationId: string,
    messageId: string,
    state: { status: InboundMailboxMessage['status']; read: boolean; archived: boolean },
  ): Promise<void> {
    await updateDoc(doc(this.inbound(organizationId), messageId), {
      ...state,
      updatedAt: serverTimestamp(),
    });
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
