import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import {
  SupportService,
  SupportTicket,
  TICKET_CATEGORY_OPTIONS,
  TICKET_PRIORITY_INFO,
  TICKET_STATUS_INFO,
  TicketCategory,
  TicketPriority,
  supportErrorMessage,
  ticketCategoryLabel,
} from '../support.service';

type Tab = 'new' | 'mine';

/**
 * Public Help & Support page (/support).
 *
 * - Anyone can open a ticket; guests give a name and email.
 * - Signed-in users see "My tickets": their own tickets plus the tickets
 *   of organizations they manage.
 * - Managers can open a ticket on behalf of an organization.
 */
@Component({
  selector: 'app-support-home',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="bg-gradient-to-r from-[#032D42] to-[#007979]">
        <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">Help & Support</h1>
          <p class="mt-2 max-w-2xl text-white/85">
            Report a problem, ask a question or request a service. We'll reply by email, and you can follow
            your request here.
          </p>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        @if (signedIn()) {
          <div class="mb-5 flex flex-wrap gap-2">
            <button type="button" class="rounded-full border px-4 py-1.5 text-sm font-medium"
              [class]="tab() === 'new' ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
              (click)="tab.set('new')">
              New request
            </button>
            <button type="button" class="rounded-full border px-4 py-1.5 text-sm font-medium"
              [class]="tab() === 'mine' ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
              (click)="openMine()">
              My tickets
              @if (activeCount() > 0) {
                <span class="ml-1 rounded-full bg-[#007979] px-1.5 text-[11px] font-bold text-white">{{ activeCount() }}</span>
              }
            </button>
          </div>
        }

        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
        }

        @if (tab() === 'new') {
          @if (created(); as done) {
            <!-- ============ CONFIRMATION ============ -->
            <section class="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
              <mat-icon class="!h-12 !w-12 !text-5xl text-emerald-600">task_alt</mat-icon>
              <h2 class="mt-3 text-xl font-bold text-gray-900">We've received your request</h2>
              <p class="mt-2 text-gray-600">
                Your ticket number is <strong class="text-gray-900">{{ done.number }}</strong>.
                We've emailed you a copy and will reply there.
              </p>

              <div class="mt-5 flex flex-wrap justify-center gap-2">
                @if (signedIn() && done.id) {
                  <a mat-flat-button class="!bg-[#007979] !text-white" [routerLink]="['/support/tickets', done.id]">
                    <mat-icon>visibility</mat-icon>
                    View ticket
                  </a>
                } @else {
                  <a mat-flat-button class="!bg-[#007979] !text-white" routerLink="/login">
                    Sign in to track it
                  </a>
                }
                <button mat-stroked-button type="button" (click)="startAnother()">Open another request</button>
              </div>

              @if (!signedIn()) {
                <p class="mt-4 text-xs text-gray-500">
                  Sign in or create an account with {{ guestEmail }} to see this ticket online.
                </p>
              }
            </section>
          } @else {
            <!-- ============ FORM ============ -->
            <form class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" (ngSubmit)="submit()">
              <p class="mb-2 text-sm font-semibold text-gray-900">What can we help with?</p>
              <div class="mb-5 grid gap-2 sm:grid-cols-2">
                @for (option of categories; track option.value) {
                  <button
                    type="button"
                    class="rounded-xl border-2 p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#007979]"
                    [class]="category === option.value ? 'border-teal-700 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'"
                    [attr.aria-pressed]="category === option.value"
                    (click)="category = option.value"
                  >
                    <span class="block text-sm font-semibold text-gray-900">{{ option.label }}</span>
                    <span class="block text-xs text-gray-500">{{ option.hint }}</span>
                  </button>
                }
              </div>

              @if (!signedIn()) {
                <div class="grid gap-x-4 sm:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Your name</mat-label>
                    <input matInput autocomplete="name" [(ngModel)]="guestName" name="guestName" required />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Your email</mat-label>
                    <input matInput type="email" inputmode="email" autocomplete="email" [(ngModel)]="guestEmail" name="guestEmail" required />
                    <mat-hint>We'll reply here.</mat-hint>
                  </mat-form-field>
                </div>
              }

              @if (organizationOptions().length > 0) {
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>On behalf of</mat-label>
                  <mat-select [(ngModel)]="organizationId" name="organizationId">
                    <mat-option [value]="null">Just me (personal)</mat-option>
                    @for (organization of organizationOptions(); track organization.id) {
                      <mat-option [value]="organization.id">{{ organization.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Organization tickets are visible to its managers, admins and owners.</mat-hint>
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Subject</mat-label>
                <input matInput maxlength="150" [(ngModel)]="subject" name="subject" required placeholder="Short summary, e.g. Can't open the Test Center" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Details</mat-label>
                <textarea matInput rows="6" maxlength="10000" [(ngModel)]="description" name="description" required
                  placeholder="What happened? What did you expect? Steps to reproduce, error messages, and when it started."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field sm:max-w-xs">
                <mat-label>How urgent is it?</mat-label>
                <mat-select [(ngModel)]="priority" name="priority">
                  <mat-option value="low">Low: whenever you can</mat-option>
                  <mat-option value="normal">Normal</mat-option>
                  <mat-option value="high">High: blocking my work</mat-option>
                  <mat-option value="urgent">Urgent: many people affected</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Honeypot: hidden from people, filled in by bots. -->
              <input type="text" name="website" [(ngModel)]="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 opacity-0" />

              @if (fromPage) {
                <p class="mb-4 break-all text-xs text-gray-500">Page: {{ fromPage }}</p>
              }

              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-xs text-gray-500">
                  Please don't include passwords or payment card numbers.
                </p>
                <button mat-flat-button type="submit" class="!bg-[#007979] !text-white" [disabled]="submitting() || !formValid()">
                  <mat-icon>send</mat-icon>
                  {{ submitting() ? 'Sending…' : 'Submit request' }}
                </button>
              </div>
            </form>

            @if (!signedIn()) {
              <p class="mt-4 text-center text-sm text-gray-600">
                Have an account? <a routerLink="/login" class="font-semibold text-[#007979] hover:underline">Sign in</a> to track your requests online.
              </p>
            }
          }
        } @else {
          <!-- ============ MY TICKETS ============ -->
          <div class="mb-4 flex flex-wrap items-center gap-2">
            @for (filter of filters; track filter.key) {
              <button type="button" class="rounded-full border px-3 py-1 text-sm"
                [class]="statusFilter() === filter.key ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
                (click)="statusFilter.set(filter.key)">
                {{ filter.label }}
              </button>
            }
            <button mat-icon-button type="button" class="!ml-auto" aria-label="Refresh" title="Refresh" [disabled]="loading()" (click)="loadMine()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          @if (loading()) {
            <p class="text-sm text-gray-500">Loading your tickets…</p>
          } @else if (filteredTickets().length === 0) {
            <section class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No tickets here.
              <button mat-button type="button" class="!text-[#007979]" (click)="tab.set('new')">Open a request</button>
            </section>
          } @else {
            <ul class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              @for (ticket of filteredTickets(); track ticket.id) {
                <li>
                  <a [routerLink]="['/support/tickets', ticket.id]" class="flex flex-col gap-1 px-4 py-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-4">
                    <span class="min-w-0 flex-1">
                      <span class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-xs text-gray-500">{{ ticket.number }}</span>
                        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusInfo(ticket.status).classes">{{ statusInfo(ticket.status).requesterLabel }}</span>
                        @if (ticket.organizationName) {
                          <span class="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">{{ ticket.organizationName }}</span>
                        }
                        @if (ticket.lastMessageBy === 'staff' && ticket.status === 'waiting_on_requester') {
                          <span class="text-[11px] font-semibold text-amber-700">New reply</span>
                        }
                      </span>
                      <span class="mt-0.5 block truncate font-medium text-gray-900">{{ ticket.subject }}</span>
                      <span class="block text-xs text-gray-500">{{ categoryLabel(ticket.category) }} · {{ ticket.requesterName }}</span>
                    </span>
                    <span class="shrink-0 text-xs text-gray-500">Updated {{ ticket.updatedAt | date: 'MMM d, h:mm a' }}</span>
                  </a>
                </li>
              }
            </ul>
          }
        }
      </main>
    </div>
  `,
})
export class SupportHomeComponent implements OnInit {
  private readonly support = inject(SupportService);
  private readonly auth = inject(AuthService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly categories = TICKET_CATEGORY_OPTIONS;
  protected readonly filters: ReadonlyArray<{ key: 'active' | 'resolved' | 'all'; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved & closed' },
    { key: 'all', label: 'All' },
  ];

  protected readonly tab = signal<Tab>('new');
  protected readonly signedIn = signal(false);
  protected readonly tickets = signal<SupportTicket[]>([]);
  protected readonly managed = signal<string[]>([]);
  protected readonly statusFilter = signal<'active' | 'resolved' | 'all'>('active');
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly created = signal<{ id: string | null; number: string } | null>(null);

  protected category: TicketCategory = 'technical_issue';
  protected priority: TicketPriority = 'normal';
  protected subject = '';
  protected description = '';
  protected guestName = '';
  protected guestEmail = '';
  protected organizationId: string | null = null;
  protected website = '';
  protected fromPage = '';

  protected readonly organizationOptions = computed(() => {
    const managed = new Set(this.managed());

    return this.organizationStore
      .organizations()
      .filter((organization) => managed.has(organization.id))
      .map((organization) => ({ id: organization.id, name: organization.name }));
  });

  protected readonly activeCount = computed(
    () => this.tickets().filter((ticket) => !['resolved', 'closed'].includes(ticket.status)).length,
  );

  protected readonly filteredTickets = computed(() => {
    const filter = this.statusFilter();

    return this.tickets().filter((ticket) =>
      filter === 'all' ? true : filter === 'resolved' ? ['resolved', 'closed'].includes(ticket.status) : !['resolved', 'closed'].includes(ticket.status),
    );
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Help & Support');

    const params = this.route.snapshot.queryParamMap;
    this.fromPage = params.get('from')?.slice(0, 500) ?? '';
    this.organizationId = params.get('organizationId');

    const category = params.get('category');
    if (category && TICKET_CATEGORY_OPTIONS.some((option) => option.value === category)) {
      this.category = category as TicketCategory;
    }

    if (params.get('tab') === 'mine') {
      this.tab.set('mine');
    }

    // Wait for Firebase to restore the session.
    while (this.auth.isLoading()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.signedIn.set(Boolean(this.auth.firebaseUser()));

    if (this.signedIn()) {
      await this.loadMine();

      try {
        await this.organizationStore.loadAvailableOrganizations();
      } catch {
        // Organization choices are optional.
      }
    } else {
      this.tab.set('new');
    }
  }

  protected async openMine(): Promise<void> {
    this.tab.set('mine');
    void this.router.navigate([], { queryParams: { tab: 'mine' }, replaceUrl: true });
  }

  protected async loadMine(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const result = await this.support.listMine();
      this.tickets.set(result.tickets);
      this.managed.set(result.managedOrganizations);

      if (this.organizationId && !result.managedOrganizations.includes(this.organizationId)) {
        this.organizationId = null;
      }
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected formValid(): boolean {
    const contactOk =
      this.signedIn() ||
      (this.guestName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guestEmail.trim()));

    return contactOk && this.subject.trim().length >= 4 && this.description.trim().length >= 10;
  }

  protected async submit(): Promise<void> {
    if (!this.formValid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const result = await this.support.createTicket({
        subject: this.subject.trim(),
        description: this.description.trim(),
        category: this.category,
        priority: this.priority,
        organizationId: this.organizationId,
        name: this.guestName.trim(),
        email: this.guestEmail.trim(),
        pageUrl: this.fromPage || undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        website: this.website,
      });

      this.created.set({ id: result.ticketId, number: result.ticketNumber ?? '' });

      if (this.signedIn()) {
        void this.loadMine();
      }
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  protected startAnother(): void {
    this.created.set(null);
    this.subject = '';
    this.description = '';
    this.priority = 'normal';
  }

  protected statusInfo(status: SupportTicket['status']) {
    return TICKET_STATUS_INFO[status] ?? TICKET_STATUS_INFO.open;
  }

  protected priorityInfo(priority: SupportTicket['priority']) {
    return TICKET_PRIORITY_INFO[priority] ?? TICKET_PRIORITY_INFO.normal;
  }

  protected categoryLabel(category: string): string {
    return ticketCategoryLabel(category);
  }
}
