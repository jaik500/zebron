import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestore } from './firebase-config';

/**
 * Zebron's own mailboxes: platformMailboxes/{name}, where the name is the
 * address (support -> support@zebron.org). "contact" is General: the
 * contact form, contact@ and anything without its own mailbox.
 * Must match functions/src/inbound-email.ts.
 */
export const PLATFORM_GENERAL_MAILBOX = 'contact';

export const PLATFORM_MAIL_DOMAIN = 'zebron.org';

/** Address names a platform mailbox can use (reserved for Zebron, minus system addresses). */
export const PLATFORM_MAILBOX_NAMES: readonly string[] = [
  'abuse', 'account', 'accounts', 'admin', 'administrator', 'alerts', 'billing', 'help', 'hello',
  'hostmaster', 'info', 'legal', 'mail', 'marketing', 'news', 'newsletter', 'notifications',
  'partner', 'partners', 'postmaster', 'privacy', 'sales', 'security', 'support', 'team', 'webmaster',
];

/** Suggested starting set. */
export const SUGGESTED_PLATFORM_MAILBOXES: ReadonlyArray<{ id: string; name: string; description: string }> = [
  { id: 'support', name: 'Support', description: 'Help with using Zebron.' },
  { id: 'billing', name: 'Billing', description: 'Invoices, plans and payments.' },
  { id: 'partners', name: 'Partnerships', description: 'Organizations and partners joining Zebron.' },
];

export interface PlatformMailbox {
  id: string;
  name: string;
  description: string;
  /** A copy of each incoming message goes here; empty for none (each copy counts as one email). */
  forwardTo: string;
  active: boolean;
  /** False for General until it has been saved once. */
  configured: boolean;
}

export function platformMailboxAddress(id: string): string {
  return `${id}@${PLATFORM_MAIL_DOMAIN}`;
}

@Injectable({ providedIn: 'root' })
export class PlatformMailboxService {
  private readonly mailboxes = collection(firestore, 'platformMailboxes');

  /** General first, then the others by name. */
  async list(): Promise<PlatformMailbox[]> {
    const snapshot = await getDocs(this.mailboxes);
    const configured = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        name: typeof data['name'] === 'string' && data['name'].trim() ? data['name'].trim() : document.id,
        description: typeof data['description'] === 'string' ? data['description'] : '',
        forwardTo: typeof data['forwardTo'] === 'string' ? data['forwardTo'] : '',
        active: data['active'] !== false,
        configured: true,
      };
    });

    const general =
      configured.find((box) => box.id === PLATFORM_GENERAL_MAILBOX) ??
      { id: PLATFORM_GENERAL_MAILBOX, name: 'General', description: '', forwardTo: '', active: true, configured: false };

    return [
      { ...general, active: true },
      ...configured.filter((box) => box.id !== PLATFORM_GENERAL_MAILBOX).sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }

  async save(mailbox: Omit<PlatformMailbox, 'configured'>, userId: string, isNew: boolean): Promise<void> {
    await setDoc(
      doc(this.mailboxes, mailbox.id),
      {
        name: mailbox.name.trim().slice(0, 60),
        description: mailbox.description.trim().slice(0, 200),
        forwardTo: mailbox.forwardTo.trim().toLowerCase().slice(0, 254),
        active: mailbox.id === PLATFORM_GENERAL_MAILBOX ? true : mailbox.active,
        ...(isNew ? { createdAt: serverTimestamp(), createdBy: userId } : {}),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  }

  remove(id: string): Promise<void> {
    return deleteDoc(doc(this.mailboxes, id));
  }
}
