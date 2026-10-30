import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import {
  SupportTicket,
  TICKET_PRIORITY_INFO,
  TICKET_STATUS_INFO,
  ticketCategoryLabel,
} from '../support.service';

/** Ticket rows linking to /support/tickets/:id. */
@Component({
  selector: 'app-support-ticket-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tickets().length === 0) {
      <section class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        {{ emptyText() }}
      </section>
    } @else {
      <ul class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        @for (ticket of tickets(); track ticket.id) {
          <li>
            <a [routerLink]="['/support/tickets', ticket.id]" class="flex flex-col gap-1 px-4 py-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-4">
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs text-gray-500">{{ ticket.number }}</span>
                  <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="status(ticket).classes">
                    {{ staffView() ? status(ticket).label : status(ticket).requesterLabel }}
                  </span>
                  @if (ticket.priority === 'high' || ticket.priority === 'urgent' || staffView()) {
                    <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="priority(ticket).classes">{{ priority(ticket).label }}</span>
                  }
                  @if (showOrganization() && ticket.organizationName) {
                    <span class="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">{{ ticket.organizationName }}</span>
                  }
                  @if (staffView() && ticket.lastMessageBy === 'requester' && ticket.status !== 'closed') {
                    <span class="inline-flex items-center gap-0.5 text-[11px] font-semibold text-sky-700">
                      <mat-icon class="!h-3.5 !w-3.5 !text-sm">mark_chat_unread</mat-icon>
                      Needs reply
                    </span>
                  }
                </span>
                <span class="mt-0.5 block truncate font-medium text-gray-900">{{ ticket.subject }}</span>
                <span class="block truncate text-xs text-gray-500">
                  {{ category(ticket.category) }} · {{ ticket.requesterName }}{{ staffView() && ticket.requesterIsGuest ? ' (guest)' : '' }}
                  @if (staffView()) {
                    · {{ ticket.assigneeName ? 'Assigned to ' + ticket.assigneeName : 'Unassigned' }}
                  }
                </span>
              </span>
              <span class="shrink-0 text-xs text-gray-500">Updated {{ ticket.updatedAt | date: 'MMM d, h:mm a' }}</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class SupportTicketListComponent {
  readonly tickets = input.required<SupportTicket[]>();
  readonly staffView = input(false);
  readonly showOrganization = input(false);
  readonly emptyText = input('No tickets here.');

  protected status(ticket: SupportTicket) {
    return TICKET_STATUS_INFO[ticket.status] ?? TICKET_STATUS_INFO.open;
  }

  protected priority(ticket: SupportTicket) {
    return TICKET_PRIORITY_INFO[ticket.priority] ?? TICKET_PRIORITY_INFO.normal;
  }

  protected category(value: string): string {
    return ticketCategoryLabel(value);
  }
}
