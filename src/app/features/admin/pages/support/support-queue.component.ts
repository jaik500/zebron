import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { SupportTicketListComponent } from '../../../support/components/support-ticket-list.component';
import {
  SupportService,
  SupportTicket,
  TICKET_CATEGORY_OPTIONS,
  supportErrorMessage,
} from '../../../support/support.service';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/**
 * Zebron support queue (platform administrators).
 * Route: /admin/support
 */
@Component({
  selector: 'app-support-queue',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, SupportTicketListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 class="text-2xl font-bold text-white">Support</h1>
            <p class="text-sm text-white/75">Tickets from users and partner organizations.</p>
          </div>
          <a mat-stroked-button class="!border-white/40 !text-white" routerLink="/admin">
            <mat-icon>arrow_back</mat-icon>
            Admin
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          @for (stat of stats(); track stat.label) {
            <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500">{{ stat.label }}</p>
              <p class="mt-1 text-2xl font-bold" [class]="stat.classes">{{ stat.value }}</p>
            </div>
          }
        </div>

        <div class="mb-4 grid gap-x-3 sm:grid-cols-2 lg:grid-cols-[12rem_12rem_12rem_1fr]">
          <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select [value]="status()" (selectionChange)="status.set($event.value); load()">
              <mat-option value="active">Active</mat-option>
              <mat-option value="open">Open</mat-option>
              <mat-option value="in_progress">In progress</mat-option>
              <mat-option value="waiting_on_requester">Waiting on requester</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
              <mat-option value="closed">Closed</mat-option>
              <mat-option value="all">All</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
            <mat-label>Category</mat-label>
            <mat-select [value]="category()" (selectionChange)="category.set($event.value)">
              <mat-option value="all">All categories</mat-option>
              @for (option of categories; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
            <mat-label>Show</mat-label>
            <mat-select [value]="view()" (selectionChange)="view.set($event.value)">
              <mat-option value="all">Everyone's tickets</mat-option>
              <mat-option value="mine">Assigned to me</mat-option>
              <mat-option value="unassigned">Unassigned</mat-option>
              <mat-option value="needs_reply">Needs a reply</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field w-full sm:max-w-xs zb-search" subscriptSizing="dynamic">
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <mat-label>Search number, subject, requester, organization</mat-label>
            <input placeholder="Search number, subject, requester, organization" matInput [ngModel]="search()" (ngModelChange)="search.set($event)" name="search" />
          </mat-form-field>
        </div>

        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
        }

        @if (loading()) {
          <p class="text-sm text-gray-500">Loading tickets…</p>
        } @else {
          <app-support-ticket-list [tickets]="filtered()" [staffView]="true" [showOrganization]="true" emptyText="No tickets match." />
        }
      </main>
    </div>
  `,
})
export class SupportQueueComponent implements OnInit {
  private readonly support = inject(SupportService);
  private readonly auth = inject(AuthService);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly categories = TICKET_CATEGORY_OPTIONS;

  protected readonly tickets = signal<SupportTicket[]>([]);
  protected readonly status = signal('active');
  protected readonly category = signal('all');
  protected readonly view = signal<'all' | 'mine' | 'unassigned' | 'needs_reply'>('all');
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.category();
    const view = this.view();

    return this.tickets()
      .filter((ticket) => category === 'all' || ticket.category === category)
      .filter((ticket) => {
        switch (view) {
          case 'mine':
            return Boolean(ticket.assigneeUid) && ticket.assigneeUid === this.auth.firebaseUser()?.uid;
          case 'unassigned':
            return !ticket.assigneeName;
          case 'needs_reply':
            return ticket.lastMessageBy === 'requester' && ticket.status !== 'closed';
          default:
            return true;
        }
      })
      .filter(
        (ticket) =>
          !term ||
          [ticket.number, ticket.subject, ticket.requesterName ?? '', ticket.requesterEmail ?? '', ticket.organizationName ?? '']
            .some((value) => value.toLowerCase().includes(term)),
      )
      .sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2) ||
          (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
      );
  });

  protected readonly stats = computed(() => {
    const all = this.tickets();

    return [
      { label: 'Showing', value: all.length, classes: 'text-gray-900' },
      { label: 'Needs a reply', value: all.filter((ticket) => ticket.lastMessageBy === 'requester' && ticket.status !== 'closed').length, classes: 'text-sky-700' },
      { label: 'Unassigned', value: all.filter((ticket) => !ticket.assigneeName && ticket.status !== 'closed').length, classes: 'text-amber-700' },
      { label: 'Urgent or high', value: all.filter((ticket) => ['urgent', 'high'].includes(ticket.priority) && ticket.status !== 'closed').length, classes: 'text-red-700' },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Admin | Support');
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.tickets.set((await this.support.listAll(this.status())).tickets);
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
