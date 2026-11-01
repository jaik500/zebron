import { Injectable } from '@angular/core';

import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../../core/services/firebase-config';

/** Must match functions/src/inbound-email.ts. */
export const ORGANIZATION_INBOUND_DOMAIN = 'zebron.org';

/** Names kept for Zebron itself (must match RESERVED_ADDRESS_NAMES in functions/src/inbound-email.ts). */
const RESERVED_ADDRESS_NAMES: readonly string[] = [
  'abuse', 'account', 'accounts', 'admin', 'administrator', 'alerts', 'api', 'app',
  'billing', 'contact', 'help', 'hello', 'hostmaster', 'info', 'legal', 'mail',
  'mailer-daemon', 'marketing', 'news', 'newsletter', 'no-reply', 'noreply',
  'notifications', 'org', 'partner', 'partners', 'postmaster', 'privacy', 'root',
  'sales', 'security', 'support', 'system', 'team', 'webmaster', 'www', 'zebron',
];

/**
 * The organization's main address: <slug>@zebron.org. An older
 * organization whose slug is a reserved name keeps org+<slug>@zebron.org.
 */
export function organizationMailboxAddress(slug: string | null | undefined): string | null {
  const normalized = slug?.trim().toLowerCase() ?? '';

  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(normalized)) {
    return null;
  }

  return RESERVED_ADDRESS_NAMES.includes(normalized)
    ? `org+${normalized}@${ORGANIZATION_INBOUND_DOMAIN}`
    : `${normalized}@${ORGANIZATION_INBOUND_DOMAIN}`;
}

/** The organization's main mailbox (<slug>@zebron.org). */
export const MAIN_MAILBOX_ID = 'main';

/** Departmental mailbox keys: what goes before the dot in <key>.<slug>@zebron.org. */
export const MAILBOX_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Keys that cannot be used for departmental mailboxes. */
export const RESERVED_MAILBOX_KEYS: readonly string[] = ['main'];

/** A departmental mailbox: <key>.<slug>@zebron.org, e.g. admissions.acme-academy@zebron.org. */
export function departmentMailboxAddress(slug: string | null | undefined, key: string): string | null {
  const normalized = slug?.trim().toLowerCase() ?? '';
  return /^[a-z0-9][a-z0-9-]{0,99}$/.test(normalized) && MAILBOX_KEY_PATTERN.test(key)
    ? `${key}.${normalized}@${ORGANIZATION_INBOUND_DOMAIN}`
    : null;
}

/** organizations/{id}/mailboxes/{key}: a shared departmental mailbox. */
export interface OrganizationMailbox {
  id: string;
  key: string;
  name: string;
  description: string;
  /** Staff assigned to the mailbox (owners and admins can always open it). */
  memberIds: string[];
  active: boolean;
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
  /** "main" (default) or a departmental mailbox key. */
  mailboxId?: string;
}

/**
 * Organization mailbox: messages sent to <slug>@zebron.org (and its
 * departmental mailboxes, <key>.<slug>@zebron.org) and
 * email sent from the organization. Managers and above only (rules).
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationMailboxService {
  private inbound(organizationId: string, mailboxId = MAIN_MAILBOX_ID) {
    return mailboxId === MAIN_MAILBOX_ID
      ? collection(firestore, 'organizations', organizationId, 'inboundMessages')
      : collection(firestore, 'organizations', organizationId, 'mailboxes', mailboxId, 'inboundMessages');
  }

  private sent(organizationId: string, mailboxId = MAIN_MAILBOX_ID) {
    return mailboxId === MAIN_MAILBOX_ID
      ? collection(firestore, 'organizations', organizationId, 'sentMessages')
      : collection(firestore, 'organizations', organizationId, 'mailboxes', mailboxId, 'sentMessages');
  }

  private mailboxes(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'mailboxes');
  }

  // ------------------------------------------------------------
  // Departmental mailboxes
  // ------------------------------------------------------------

  /** Every departmental mailbox of the organization (staff and above can list). */
  async listMailboxes(organizationId: string): Promise<OrganizationMailbox[]> {
    const snapshot = await getDocs(this.mailboxes(organizationId));

    return snapshot.docs
      .map((document) => {
        const data = document.data();

        return {
          id: document.id,
          key: str(data['key']) || document.id,
          name: str(data['name']) || document.id,
          description: str(data['description']),
          memberIds: strings(data['memberIds']),
          active: data['active'] !== false,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Create or update a mailbox (owners and admins). The key is its permanent ID. */
  async saveMailbox(
    organizationId: string,
    mailbox: Omit<OrganizationMailbox, 'id'>,
    userId: string,
    isNew: boolean,
  ): Promise<void> {
    const ref = doc(this.mailboxes(organizationId), mailbox.key);

    await setDoc(
      ref,
      {
        key: mailbox.key,
        name: mailbox.name.trim().slice(0, 60),
        description: mailbox.description.trim().slice(0, 200),
        memberIds: [...new Set(mailbox.memberIds)].slice(0, 50),
        active: mailbox.active,
        ...(isNew ? { createdAt: serverTimestamp(), createdBy: userId } : {}),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  }

  /** Emails stored in a mailbox; a mailbox can only be deleted when empty. */
  async countMailboxMessages(organizationId: string, mailboxId: string): Promise<number> {
    const [inbound, sent] = await Promise.all([
      getCountFromServer(this.inbound(organizationId, mailboxId)),
      getCountFromServer(this.sent(organizationId, mailboxId)),
    ]);

    return inbound.data().count + sent.data().count;
  }

  deleteMailbox(organizationId: string, mailboxId: string): Promise<void> {
    return deleteDoc(doc(this.mailboxes(organizationId), mailboxId));
  }

  /** Latest 200 received messages, newest first (inbox and archive). */
  async getReceived(organizationId: string, mailboxId = MAIN_MAILBOX_ID): Promise<InboundMailboxMessage[]> {
    const snapshot = await getDocs(
      query(this.inbound(organizationId, mailboxId), orderBy('receivedAt', 'desc'), limit(200)),
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
  async getSent(organizationId: string, mailboxId = MAIN_MAILBOX_ID): Promise<SentMailboxMessage[]> {
    const snapshot = await getDocs(
      query(this.sent(organizationId, mailboxId), orderBy('createdAt', 'desc'), limit(100)),
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

  async countUnread(organizationId: string, mailboxId = MAIN_MAILBOX_ID): Promise<number> {
    const snapshot = await getCountFromServer(
      query(this.inbound(organizationId, mailboxId), where('status', '==', 'new')),
    );

    return snapshot.data().count;
  }

  markRead(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'read', read: true, archived: false }, mailboxId);
  }

  markUnread(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'new', read: false, archived: false }, mailboxId);
  }

  archive(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'archived', read: true, archived: true }, mailboxId);
  }

  restore(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return this.setState(organizationId, messageId, { status: 'read', read: true, archived: false }, mailboxId);
  }

  /** Permanently removes a received email (managers and above). */
  deleteReceived(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return deleteDoc(doc(this.inbound(organizationId, mailboxId), messageId));
  }

  /** Permanently removes a sent email from the mailbox (managers and above). */
  deleteSent(organizationId: string, messageId: string, mailboxId = MAIN_MAILBOX_ID): Promise<void> {
    return deleteDoc(doc(this.sent(organizationId, mailboxId), messageId));
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
    mailboxId = MAIN_MAILBOX_ID,
  ): Promise<void> {
    await updateDoc(doc(this.inbound(organizationId, mailboxId), messageId), {
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
