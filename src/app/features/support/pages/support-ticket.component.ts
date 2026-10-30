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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { PageTitleService } from '../../../core/services/page-title.service';
import {
  SupportService,
  SupportTicket,
  SupportTicketMessage,
  TICKET_PRIORITY_INFO,
  TICKET_STATUS_INFO,
  TicketPriority,
  TicketStatus,
  supportErrorMessage,
  ticketCategoryLabel,
} from '../support.service';

/**
 * One support ticket: conversation, status and actions.
 * Route: /support/tickets/:ticketId (signed in).
 *
 * - Requesters and organization managers: reply, close, reopen.
 * - Zebron staff: also assign, set status and priority, internal notes.
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-support-ticket',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#032D42]">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <p class="font-mono text-sm text-white/70">{{ ticket()?.number || ('Ticket' | t) }}</p>
            <h1 class="break-words text-xl font-bold text-white sm:text-2xl">{{ ticket()?.subject || ('Support ticket' | t) }}</h1>
          </div>
          <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="backLink()" [queryParams]="backQuery()">
            <mat-icon>arrow_back</mat-icon>
            {{ access() === 'staff' ? ('Support queue' | t) : ('My tickets' | t) }}
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }

        @if (loading() && !ticket()) {
          <p class="text-sm text-gray-500">{{ 'Loading ticket…' | t }}</p>
        } @else if (ticket(); as current) {
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <!-- ============ CONVERSATION ============ -->
            <section class="min-w-0">
              <ol class="space-y-3">
                @for (message of messages(); track message.id) {
                  @if (message.kind === 'event') {
                    <li class="flex items-center gap-2 px-2 text-xs text-gray-500">
                      <mat-icon class="!h-4 !w-4 !text-base">{{ message.internal ? 'lock' : 'info' }}</mat-icon>
                      <span>{{ message.body }} · {{ message.authorName }} · {{ message.createdAt | date: 'MMM d, h:mm a' }}</span>
                    </li>
                  } @else {
                    <li class="rounded-xl border p-4 shadow-sm"
                      [class]="message.internal ? 'border-amber-200 bg-amber-50' : message.authorRole === 'staff' ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200 bg-white'">
                      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span class="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                            [class]="message.authorRole === 'staff' ? 'bg-[#007979] text-white' : 'bg-gray-200 text-gray-700'">
                            <mat-icon class="!h-4 !w-4 !text-base">{{ message.authorRole === 'staff' ? 'support_agent' : 'person' }}</mat-icon>
                          </span>
                          {{ message.authorName }}
                          @if (message.internal) {
                            <span class="rounded bg-amber-200 px-1.5 text-[10px] font-bold uppercase text-amber-900">{{ 'Internal note' | t }}</span>
                          }
                        </span>
                        <span class="text-xs text-gray-500">{{ message.createdAt | date: 'medium' }}</span>
                      </div>
                      <p class="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{{ message.body }}</p>
                    </li>
                  }
                }
              </ol>

              <!-- Reply -->
              @if (current.status !== 'closed' || access() === 'staff') {
                <div class="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ internal ? ('Internal note (only Zebron staff see this)' | t) : ('Reply' | t) }}</mat-label>
                    <textarea matInput rows="4" maxlength="10000" [(ngModel)]="replyText" name="reply"></textarea>
                  </mat-form-field>

                  <div class="flex flex-wrap items-center justify-between gap-3">
                    @if (access() === 'staff') {
                      <mat-slide-toggle [(ngModel)]="internal" name="internal">{{ 'Internal note' | t }}</mat-slide-toggle>
                    } @else {
                      <span class="text-xs text-gray-500">{{ 'Replying to a resolved ticket reopens it.' | t }}</span>
                    }

                    <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busy() || !replyText.trim()" (click)="sendReply()">
                      <mat-icon>{{ internal ? 'lock' : 'send' }}</mat-icon>
                      {{ busy() ? ('Sending…' | t) : internal ? ('Add note' | t) : ('Send reply' | t) }}
                    </button>
                  </div>
                </div>
              } @else {
                <div class="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  {{ 'This ticket is closed.' | t }}
                  <button mat-button type="button" class="!text-[#007979]" [disabled]="busy()" (click)="setStatus('open')">{{ 'Reopen it' | t }}</button>
                  {{ 'or' | t }} <a routerLink="/support" class="font-semibold text-[#007979] hover:underline">{{ 'open a new request' | t }}</a>.
                </div>
              }
            </section>

            <!-- ============ DETAILS ============ -->
            <aside class="space-y-4">
              <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <dl class="space-y-3 text-sm">
                  <div>
                    <dt class="text-xs text-gray-500">{{ 'Status' | t }}</dt>
                    <dd class="mt-1">
                      <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="statusInfo(current.status).classes">
                        {{ (access() === 'staff' ? statusInfo(current.status).label : statusInfo(current.status).requesterLabel) | t }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-500">{{ 'Priority' | t }}</dt>
                    <dd class="mt-1"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="priorityInfo(current.priority).classes">{{ priorityInfo(current.priority).label | t }}</span></dd>
                  </div>
                  <div><dt class="text-xs text-gray-500">{{ 'Category' | t }}</dt><dd class="text-gray-900">{{ categoryLabel(current.category) | t }}</dd></div>
                  <div>
                    <dt class="text-xs text-gray-500">{{ 'Requested by' | t }}</dt>
                    <dd class="break-words text-gray-900">
                      {{ current.requesterName }}
                      @if (access() === 'staff' && current.requesterEmail) {
                        <span class="block break-all text-xs text-gray-500">{{ current.requesterEmail }}{{ current.requesterIsGuest ? (' (guest)' | t) : '' }}</span>
                      }
                    </dd>
                  </div>
                  @if (current.organizationName) {
                    <div><dt class="text-xs text-gray-500">{{ 'Organization' | t }}</dt><dd class="text-gray-900">{{ current.organizationName }}</dd></div>
                  }
                  <div><dt class="text-xs text-gray-500">{{ 'Assigned to' | t }}</dt><dd class="text-gray-900">{{ current.assigneeName || ('Not assigned yet' | t) }}</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ 'Opened' | t }}</dt><dd class="text-gray-900">{{ current.createdAt | date: 'medium' }}</dd></div>
                  @if (current.pageUrl) {
                    <div><dt class="text-xs text-gray-500">{{ 'Page' | t }}</dt><dd class="break-all text-xs text-gray-700">{{ current.pageUrl }}</dd></div>
                  }
                </dl>
              </section>

              @if (access() === 'staff') {
                <section class="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-800">{{ 'Zebron staff' | t }}</p>

                  <mat-form-field appearance="outline" class="zb-field zb-field--dense">
                    <mat-label>{{ 'Status' | t }}</mat-label>
                    <mat-select [value]="current.status" (selectionChange)="setStatus($event.value)">
                      @for (status of statuses; track status) {
                        <mat-option [value]="status">{{ statusInfo(status).label | t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="zb-field zb-field--dense">
                    <mat-label>{{ 'Priority' | t }}</mat-label>
                    <mat-select [value]="current.priority" (selectionChange)="setPriority($event.value)">
                      @for (priority of priorities; track priority) {
                        <mat-option [value]="priority">{{ priorityInfo(priority).label | t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <div class="flex flex-wrap gap-2">
                    <button mat-stroked-button type="button" [disabled]="busy()" (click)="assignToMe()">
                      <mat-icon>person_add</mat-icon>
                      {{ 'Assign to me' | t }}
                    </button>
                    @if (current.assigneeName) {
                      <button mat-button type="button" [disabled]="busy()" (click)="unassign()">{{ 'Unassign' | t }}</button>
                    }
                  </div>
                </section>
              } @else {
                <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  @if (current.status === 'resolved' || current.status === 'closed') {
                    <button mat-stroked-button type="button" class="w-full" [disabled]="busy()" (click)="setStatus('open')">
                      <mat-icon>replay</mat-icon>
                      {{ 'Reopen ticket' | t }}
                    </button>
                  } @else {
                    <button mat-stroked-button type="button" class="w-full" [disabled]="busy()" (click)="setStatus('closed')">
                      <mat-icon>check_circle</mat-icon>
                      {{ 'My issue is solved, close it' | t }}
                    </button>
                  }
                </section>
              }
            </aside>
          </div>
        }
      </main>
    </div>
  `,
})
export class SupportTicketComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly support = inject(SupportService);
  private readonly pageTitleService = inject(PageTitleService);

  private readonly ticketId = this.route.snapshot.paramMap.get('ticketId') ?? '';

  protected readonly statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_on_requester', 'resolved', 'closed'];
  protected readonly priorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

  protected readonly ticket = signal<SupportTicket | null>(null);
  protected readonly messages = signal<SupportTicketMessage[]>([]);
  protected readonly access = signal<'staff' | 'requester' | 'organization' | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected replyText = '';
  protected internal = false;

  protected readonly backLink = computed(() => (this.access() === 'staff' ? ['/admin/support'] : ['/support']));
  protected readonly backQuery = computed(() => (this.access() === 'staff' ? {} : { tab: 'mine' }));

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);

    try {
      const result = await this.support.getTicket(this.ticketId);
      this.ticket.set(result.ticket);
      this.messages.set(result.messages);
      this.access.set(result.access);
      this.pageTitleService.setTitle(`${result.ticket.number} · ${result.ticket.subject}`);
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async sendReply(): Promise<void> {
    const body = this.replyText.trim();

    if (!body) {
      return;
    }

    await this.run(async () => {
      await this.support.reply(this.ticketId, body, this.internal);
      this.replyText = '';
      this.internal = false;
    });
  }

  protected setStatus(status: TicketStatus): Promise<void> {
    return this.run(() => this.support.update(this.ticketId, { status }).then(() => undefined));
  }

  protected setPriority(priority: TicketPriority): Promise<void> {
    return this.run(() => this.support.update(this.ticketId, { priority }).then(() => undefined));
  }

  protected assignToMe(): Promise<void> {
    return this.run(() => this.support.update(this.ticketId, { assignToMe: true }).then(() => undefined));
  }

  protected unassign(): Promise<void> {
    return this.run(() => this.support.update(this.ticketId, { unassign: true }).then(() => undefined));
  }

  protected statusInfo(status: TicketStatus) {
    return TICKET_STATUS_INFO[status] ?? TICKET_STATUS_INFO.open;
  }

  protected priorityInfo(priority: TicketPriority) {
    return TICKET_PRIORITY_INFO[priority] ?? TICKET_PRIORITY_INFO.normal;
  }

  protected categoryLabel(category: string): string {
    return ticketCategoryLabel(category);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');

    try {
      await action();
      await this.load();
    } catch (error) {
      this.error.set(supportErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
