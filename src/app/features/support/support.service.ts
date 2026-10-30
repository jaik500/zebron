import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../core/services/firebase-config';

export type TicketCategory =
  | 'technical_issue'
  | 'account_access'
  | 'billing'
  | 'application_request'
  | 'content'
  | 'feature_request'
  | 'security'
  | 'other';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_requester' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  scope: 'personal' | 'organization';
  organizationId: string | null;
  organizationName: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterIsGuest: boolean;
  assigneeUid: string | null;
  assigneeName: string | null;
  pageUrl: string | null;
  messageCount: number;
  lastMessageBy: 'staff' | 'requester' | null;
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface SupportTicketMessage {
  id: string;
  authorName: string;
  authorRole: 'requester' | 'organization' | 'staff' | 'system';
  body: string;
  internal: boolean;
  kind: 'message' | 'note' | 'event';
  createdAt: string | null;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  organizationId?: string | null;
  name?: string;
  email?: string;
  pageUrl?: string;
  userAgent?: string;
  /** Honeypot; must stay empty. */
  website?: string;
}

export const TICKET_CATEGORY_OPTIONS: ReadonlyArray<{ value: TicketCategory; label: string; hint: string }> = [
  { value: 'technical_issue', label: 'Something isn\'t working', hint: 'Errors, pages not loading, broken features' },
  { value: 'account_access', label: 'Account & sign-in', hint: 'Can\'t sign in, email or password problems' },
  { value: 'application_request', label: 'Request a service', hint: 'New application, access or setup help' },
  { value: 'billing', label: 'Billing', hint: 'Contracts, invoices, payments' },
  { value: 'content', label: 'Content or data', hint: 'Wrong information, data corrections, exports' },
  { value: 'feature_request', label: 'Suggest an improvement', hint: 'Ideas and feature requests' },
  { value: 'security', label: 'Security concern', hint: 'Suspicious activity or a vulnerability' },
  { value: 'other', label: 'Something else', hint: 'Anything not listed' },
];

export const TICKET_STATUS_INFO: Record<TicketStatus, { label: string; classes: string; requesterLabel: string }> = {
  open: { label: 'Open', classes: 'bg-sky-50 text-sky-800', requesterLabel: 'Received' },
  in_progress: { label: 'In progress', classes: 'bg-indigo-50 text-indigo-800', requesterLabel: 'Being worked on' },
  waiting_on_requester: { label: 'Waiting on requester', classes: 'bg-amber-50 text-amber-800', requesterLabel: 'Waiting for your reply' },
  resolved: { label: 'Resolved', classes: 'bg-emerald-50 text-emerald-700', requesterLabel: 'Resolved' },
  closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-600', requesterLabel: 'Closed' },
};

export const TICKET_PRIORITY_INFO: Record<TicketPriority, { label: string; classes: string }> = {
  low: { label: 'Low', classes: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', classes: 'bg-gray-100 text-gray-700' },
  high: { label: 'High', classes: 'bg-orange-50 text-orange-800' },
  urgent: { label: 'Urgent', classes: 'bg-red-50 text-red-700' },
};

export function ticketCategoryLabel(category: string): string {
  return TICKET_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

/** Support ticket callables. Every permission check happens on the server. */
@Injectable({
  providedIn: 'root',
})
export class SupportService {
  createTicket(input: CreateTicketInput): Promise<{ ticketId: string | null; ticketNumber: string | null }> {
    return this.call('createSupportTicket', input);
  }

  listMine(): Promise<{ tickets: SupportTicket[]; managedOrganizations: string[] }> {
    return this.call('listMySupportTickets', {});
  }

  listForOrganization(organizationId: string): Promise<{ tickets: SupportTicket[] }> {
    return this.call('listOrganizationSupportTickets', { organizationId });
  }

  listAll(status: string): Promise<{ tickets: SupportTicket[] }> {
    return this.call('listAllSupportTickets', { status });
  }

  getTicket(ticketId: string): Promise<{
    ticket: SupportTicket;
    access: 'staff' | 'requester' | 'organization';
    messages: SupportTicketMessage[];
  }> {
    return this.call('getSupportTicket', { ticketId });
  }

  reply(ticketId: string, body: string, internal = false): Promise<{ status: TicketStatus }> {
    return this.call('addSupportTicketMessage', { ticketId, body, internal });
  }

  update(
    ticketId: string,
    changes: { status?: TicketStatus; priority?: TicketPriority; assignToMe?: boolean; unassign?: boolean },
  ): Promise<{ status: TicketStatus }> {
    return this.call('updateSupportTicket', { ticketId, ...changes });
  }

  private async call<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
    const callable = httpsCallable<TInput, TOutput>(firebaseFunctions, name);
    return (await callable(input)).data;
  }
}

export function supportErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';

  if (code.includes('unauthenticated')) {
    return 'Please sign in to continue.';
  }

  // Undeployed or crashed functions surface as a bare "internal" error.
  if (!message || /^internal$/i.test(message)) {
    return 'The support service is not available right now. Please try again shortly.';
  }

  return message;
}
