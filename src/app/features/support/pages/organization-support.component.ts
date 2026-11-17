import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PageTitleService } from '../../../core/services/page-title.service';
import { SupportTicketListComponent } from '../components/support-ticket-list.component';
import { SupportService, SupportTicket, supportErrorMessage } from '../support.service';

/**
 * Organization support tickets (managers and above).
 * Route: /partner/org/:organizationId/support
 *
 * - Requests from members: sent to the organization (handledBy
 *   "organization"); its managers, admins and owners answer them, or send
 *   them on to Zebron.
 * - Raised with Zebron: the organization's tickets that Zebron Support
 *   answers, including requests passed on to Zebron.
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-support',
  standalone: true,
  imports: [
    TranslatePipe,RouterLink, MatButtonModule, MatIconModule, SupportTicketListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <h1 class="text-2xl font-bold text-white">{{ 'Support Tickets' | t }}</h1>
            <p class="text-sm text-white/80">{{ 'Requests from your members, and issues your organization has raised with Zebron.' | t }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId, 'settings']">
              <mat-icon>arrow_back</mat-icon>
              {{ 'Administration' | t }}
            </a>
            <a mat-flat-button class="!bg-white !text-[#007979]" routerLink="/support" [queryParams]="{ organizationId: organizationId }">
              <mat-icon>add</mat-icon>
              {{ 'Ask Zebron' | t }}
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-4 flex gap-1 border-b border-gray-200" role="tablist">
          @for (option of tabs; track option.key) {
            <button
              type="button"
              role="tab"
              class="-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold"
              [class]="tab() === option.key ? 'border-[#007979] text-[#007979]' : 'border-transparent text-gray-600 hover:text-gray-900'"
              [attr.aria-selected]="tab() === option.key"
              (click)="tab.set(option.key)"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]">{{ option.icon }}</mat-icon>
              {{ option.label | t }}
              @if (waiting(option.key)) {
                <span class="rounded-full bg-[#007979] px-1.5 text-[11px] font-bold text-white">{{ waiting(option.key) }}</span>
              }
            </button>
          }
        </div>

        @if (tab() === 'members') {
          <p class="mb-3 text-sm text-gray-600">
            {{ 'Your members send these to your organization from Help & Support. Your managers, admins and owners answer them; Zebron doesn’t see them unless you send one on to Zebron Support.' | t }}
          </p>
        }

        <div class="mb-4 flex flex-wrap items-center gap-2">
          @for (filter of filters; track filter.key) {
            <button type="button" class="rounded-full border px-3 py-1 text-sm"
              [class]="statusFilter() === filter.key ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
              (click)="statusFilter.set(filter.key)">
              {{ filter.label | t }} ({{ count(filter.key) }})
            </button>
          }
          <button mat-icon-button type="button" class="!ml-auto" [attr.aria-label]="'Refresh' | t" [title]="'Refresh' | t" [disabled]="loading()" (click)="load()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }

        @if (loading()) {
          <p class="text-sm text-gray-500">{{ 'Loading tickets…' | t }}</p>
        } @else {
          <app-support-ticket-list
            [tickets]="filtered()"
            [staffView]="tab() === 'members'"
            [emptyText]="tab() === 'members' ? 'No requests from members here.' : 'No tickets here. Use Ask Zebron to report an issue or request a service.'"
          />
        }

        <p class="mt-4 text-xs text-gray-500">
          {{ (tab() === 'members' ? 'Members’ requests are visible to the member who sent them and to your organization’s managers, admins and owners.' : 'Tickets raised with Zebron are visible to your organization’s managers, admins and owners, and to Zebron Support.') | t }}
        </p>
      </main>
    </div>
  `,
})
export class OrganizationSupportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly support = inject(SupportService);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly filters: ReadonlyArray<{ key: 'active' | 'resolved' | 'all'; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved & closed' },
    { key: 'all', label: 'All' },
  ];

  protected readonly tabs: ReadonlyArray<{ key: 'members' | 'zebron'; label: string; icon: string }> = [
    { key: 'members', label: 'Requests from members', icon: 'groups' },
    { key: 'zebron', label: 'Raised with Zebron', icon: 'support_agent' },
  ];
  protected readonly tab = signal<'members' | 'zebron'>('members');

  private readonly allTickets = signal<SupportTicket[]>([]);
  /** The current tab's tickets. */
  protected readonly tickets = computed(() =>
    this.allTickets().filter((ticket) => (ticket.handledBy === 'organization') === (this.tab() === 'members')),
  );
  protected readonly statusFilter = signal<'active' | 'resolved' | 'all'>('active');
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly filtered = computed(() => this.tickets().filter((ticket) => this.matches(ticket, this.statusFilter())));

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setDocumentTitle('Support Tickets');
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.allTickets.set((await this.support.listForOrganization(this.organizationId)).tickets);
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  /** Member requests waiting for an answer; Zebron tickets waiting for the organization. */
  protected waiting(tab: 'members' | 'zebron'): number {
    return this.allTickets().filter((ticket) =>
      tab === 'members'
        ? ticket.handledBy === 'organization' && ticket.status !== 'closed' && ticket.status !== 'resolved' && ticket.lastMessageBy === 'requester'
        : ticket.handledBy !== 'organization' && ticket.status === 'waiting_on_requester',
    ).length;
  }

  protected count(filter: 'active' | 'resolved' | 'all'): number {
    return this.tickets().filter((ticket) => this.matches(ticket, filter)).length;
  }

  private matches(ticket: SupportTicket, filter: 'active' | 'resolved' | 'all'): boolean {
    const done = ticket.status === 'resolved' || ticket.status === 'closed';
    return filter === 'all' || (filter === 'resolved' ? done : !done);
  }
}
