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
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../core/services/firebase-config';
import { PageTitleService } from '../../../core/services/page-title.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import {
  InboundMailboxMessage,
  OrganizationMailboxService,
  SentMailboxMessage,
  organizationMailboxAddress,
} from './organization-mailbox.service';

type Folder = 'inbox' | 'sent' | 'archived';

interface DirectoryEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
}

interface ComposeDraft {
  to: string;
  cc: string;
  subject: string;
  message: string;
  inReplyToMessageId: string | null;
}

type Selected =
  | { kind: 'received'; message: InboundMailboxMessage }
  | { kind: 'sent'; message: SentMailboxMessage };

/**
 * Organization mailbox for managers, admins and owners.
 *
 * - Inbox / Archived: email sent to org+<slug>@zebron.org.
 * - Sent: email sent from here, as "<Organization> via Zebron".
 * - Compose and reply; replies come back to this Inbox.
 *
 * Route: /partner/org/:organizationId/mailbox (manager and above).
 */
@Component({
  selector: 'app-organization-mailbox',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <!-- HEADER -->
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white">Mailbox</h1>

            @if (address(); as mailboxAddress) {
              <button
                type="button"
                class="mt-0.5 inline-flex max-w-full items-center gap-1 rounded text-sm text-white/85 hover:text-white"
                title="Copy address"
                (click)="copyAddress(mailboxAddress)"
              >
                <span class="truncate">{{ mailboxAddress }}</span>
                <mat-icon class="!h-4 !w-4 !text-base">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
              </button>
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <a
              mat-stroked-button
              class="!border-white/40 !text-white"
              [routerLink]="['/partner/org', organizationId, 'settings']"
            >
              <mat-icon>arrow_back</mat-icon>
              Administration
            </a>

            <button mat-flat-button type="button" class="!bg-white !text-[#007979]" (click)="compose()">
              <mat-icon>edit</mat-icon>
              Compose
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {{ error() }}
          </p>
        }

        @if (draft(); as current) {
          <!-- =====================================================
               COMPOSE
               ===================================================== -->
          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h2 class="text-lg font-bold text-gray-900">
                {{ current.inReplyToMessageId ? 'Reply' : 'New email' }}
              </h2>
              <button mat-button type="button" (click)="discard()">
                <mat-icon>close</mat-icon>
                Discard
              </button>
            </div>

            <p class="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
              Sent as <strong>{{ senderLabel() }}</strong>.
              @if (address()) {
                Replies come back to this mailbox.
              }
              Up to 10 recipients per email.
            </p>

            <div class="grid gap-x-4 md:grid-cols-[1fr_16rem]">
              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>To</mat-label>
                <input
                  matInput
                  type="text"
                  autocomplete="off"
                  inputmode="email"
                  [ngModel]="current.to"
                  (ngModelChange)="patchDraft({ to: $event })"
                  name="to"
                  placeholder="name@example.com, another@example.com"
                />
                <mat-hint>Separate addresses with commas.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Add a member</mat-label>
                <mat-select [(ngModel)]="memberPick" name="memberPick" (selectionChange)="addRecipient($event.value)">
                  @for (member of directoryWithEmail(); track member.userId) {
                    <mat-option [value]="member.email">
                      {{ member.displayName || member.email }}
                    </mat-option>
                  } @empty {
                    <mat-option [value]="null" disabled>No members with an email</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Cc</mat-label>
              <input
                matInput
                type="text"
                autocomplete="off"
                inputmode="email"
                [ngModel]="current.cc"
                (ngModelChange)="patchDraft({ cc: $event })"
                name="cc"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Subject</mat-label>
              <input
                matInput
                maxlength="200"
                [ngModel]="current.subject"
                (ngModelChange)="patchDraft({ subject: $event })"
                name="subject"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Message</mat-label>
              <textarea
                matInput
                rows="10"
                maxlength="20000"
                [ngModel]="current.message"
                (ngModelChange)="patchDraft({ message: $event })"
                name="message"
              ></textarea>
              <mat-hint>"The {{ senderName() }} Team" is added at the end automatically.</mat-hint>
            </mat-form-field>

            <div class="mt-2 flex flex-wrap justify-end gap-2">
              <button mat-button type="button" (click)="discard()">Cancel</button>
              <button
                mat-flat-button
                type="button"
                class="!bg-[#007979] !text-white"
                [disabled]="sending() || !current.to.trim() || !current.subject.trim() || !current.message.trim()"
                (click)="send()"
              >
                <mat-icon>send</mat-icon>
                {{ sending() ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </section>
        } @else {
          <!-- =====================================================
               FOLDERS + LIST + MESSAGE
               ===================================================== -->
          <div class="mb-4 flex flex-wrap items-center gap-2">
            @for (item of folders; track item.key) {
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition"
                [class.border-teal-700]="folder() === item.key"
                [class.bg-teal-50]="folder() === item.key"
                [class.text-teal-800]="folder() === item.key"
                [class.border-gray-200]="folder() !== item.key"
                [class.bg-white]="folder() !== item.key"
                [class.text-gray-700]="folder() !== item.key"
                (click)="openFolder(item.key)"
              >
                <mat-icon class="!h-5 !w-5 !text-xl">{{ item.icon }}</mat-icon>
                {{ item.label }}
                @if (item.key === 'inbox' && unreadCount() > 0) {
                  <span class="rounded-full bg-[#007979] px-1.5 text-[11px] font-bold text-white">{{ unreadCount() }}</span>
                }
              </button>
            }

            <button mat-icon-button type="button" aria-label="Refresh" title="Refresh" [disabled]="loading()" (click)="load()">
              <mat-icon>refresh</mat-icon>
            </button>

            <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-field--dense min-w-0 flex-1 sm:max-w-xs" subscriptSizing="dynamic">
              <mat-icon matPrefix>search</mat-icon>
              <mat-label>Search</mat-label>
              <input matInput [ngModel]="search()" (ngModelChange)="search.set($event)" name="search" />
            </mat-form-field>
          </div>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <!-- LIST -->
            <section
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              [class]="selected() ? 'hidden lg:block' : ''"
            >
              @if (loading()) {
                <p class="p-5 text-sm text-gray-500">Loading…</p>
              } @else if (listItems().length === 0) {
                <div class="p-8 text-center">
                  <mat-icon class="!h-10 !w-10 !text-4xl text-gray-300">inbox</mat-icon>
                  <p class="mt-2 text-sm text-gray-500">{{ emptyText() }}</p>
                </div>
              } @else {
                <ul class="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto">
                  @for (item of listItems(); track item.id) {
                    <li>
                      <button
                        type="button"
                        class="block w-full px-4 py-3 text-left transition hover:bg-gray-50"
                        [class.bg-teal-50]="selectedId() === item.id"
                        (click)="select(item.id)"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <span
                            class="min-w-0 truncate text-sm"
                            [class.font-bold]="item.unread"
                            [class.text-gray-900]="item.unread"
                            [class.font-medium]="!item.unread"
                            [class.text-gray-700]="!item.unread"
                          >
                            @if (item.unread) {
                              <span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#007979]" aria-label="Unread"></span>
                            }
                            {{ item.who }}
                          </span>
                          <span class="shrink-0 text-xs text-gray-500">{{ item.date ? (item.date | date: 'MMM d') : '' }}</span>
                        </div>
                        <p class="mt-0.5 truncate text-sm" [class.font-semibold]="item.unread" [class.text-gray-800]="item.unread" [class.text-gray-600]="!item.unread">
                          {{ item.subject || '(No subject)' }}
                        </p>
                        <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                          @if (item.badge) {
                            <span class="rounded bg-gray-100 px-1 text-[10px] font-semibold uppercase text-gray-600">{{ item.badge }}</span>
                          }
                          <span class="truncate">{{ item.preview }}</span>
                        </p>
                      </button>
                    </li>
                  }
                </ul>
              }
            </section>

            <!-- MESSAGE -->
            <section
              class="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm"
              [class]="selected() ? '' : 'hidden lg:block'"
            >
              @if (selected(); as current) {
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2 sm:px-5">
                  <button mat-button type="button" class="lg:!hidden" (click)="selectedId.set(null)">
                    <mat-icon>arrow_back</mat-icon>
                    Back
                  </button>

                  <div class="ml-auto flex flex-wrap gap-1">
                    @if (current.kind === 'received') {
                      <button mat-stroked-button type="button" (click)="reply(current.message)">
                        <mat-icon>reply</mat-icon>
                        Reply
                      </button>

                      @if (!current.message.archived) {
                        <button mat-icon-button type="button" aria-label="Mark as unread" title="Mark as unread" (click)="markUnread(current.message)">
                          <mat-icon>mark_email_unread</mat-icon>
                        </button>
                        <button mat-icon-button type="button" aria-label="Archive" title="Archive" (click)="archive(current.message)">
                          <mat-icon>archive</mat-icon>
                        </button>
                      } @else {
                        <button mat-stroked-button type="button" (click)="restore(current.message)">
                          <mat-icon>unarchive</mat-icon>
                          Move to inbox
                        </button>
                      }
                    } @else {
                      <button mat-stroked-button type="button" (click)="forwardSent(current.message)">
                        <mat-icon>forward_to_inbox</mat-icon>
                        Send again
                      </button>
                    }
                  </div>
                </div>

                <article class="p-4 sm:p-6">
                  <h2 class="break-words text-xl font-bold text-gray-900">{{ current.message.subject || '(No subject)' }}</h2>

                  @if (current.kind === 'received') {
                    <dl class="mt-3 space-y-1 text-sm">
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">From</dt>
                        <dd class="min-w-0 break-all text-gray-900">
                          <strong>{{ current.message.name }}</strong>
                          @if (current.message.name !== current.message.email) {
                            &lt;{{ current.message.email }}&gt;
                          }
                        </dd>
                      </div>
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">To</dt>
                        <dd class="min-w-0 break-all text-gray-700">{{ current.message.to.join(', ') }}</dd>
                      </div>
                      @if (current.message.cc.length) {
                        <div class="flex gap-2">
                          <dt class="w-12 shrink-0 text-gray-500">Cc</dt>
                          <dd class="min-w-0 break-all text-gray-700">{{ current.message.cc.join(', ') }}</dd>
                        </div>
                      }
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">Date</dt>
                        <dd class="text-gray-700">{{ toDate(current.message.receivedAt) | date: 'medium' }}</dd>
                      </div>
                    </dl>

                    @if (current.message.repliedAt) {
                      <p class="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <mat-icon class="!h-4 !w-4 !text-base">reply</mat-icon>
                        Replied {{ toDate(current.message.repliedAt) | date: 'medium' }}
                      </p>
                    }

                    @if (current.message.html) {
                      <div class="mt-4 flex gap-2 text-sm">
                        <button mat-button type="button" [class]="showFormatted() ? '!bg-gray-100' : ''" (click)="showFormatted.set(true)">Formatted</button>
                        <button mat-button type="button" [class]="showFormatted() ? '' : '!bg-gray-100'" (click)="showFormatted.set(false)">Plain text</button>
                      </div>
                    }

                    @if (showFormatted() && current.message.html) {
                      <!-- Sandboxed: no scripts, no access to this app. -->
                      <iframe
                        title="Email content"
                        sandbox=""
                        referrerpolicy="no-referrer"
                        class="mt-3 h-[60vh] w-full rounded-lg border border-gray-200 bg-white"
                        [srcdoc]="current.message.html"
                      ></iframe>
                    } @else {
                      <div class="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{{ plainText(current.message) }}</div>
                    }

                    @if (current.message.attachments.length) {
                      <div class="mt-5 border-t border-gray-100 pt-4">
                        <p class="text-xs font-medium text-gray-500">Attachments</p>
                        <ul class="mt-2 flex flex-wrap gap-2">
                          @for (file of current.message.attachments; track $index) {
                            <li class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700">
                              <mat-icon class="!h-4 !w-4 !text-base">attach_file</mat-icon>
                              {{ file.filename || 'Attachment' }}
                            </li>
                          }
                        </ul>
                        <p class="mt-2 text-xs text-gray-500">Attachments are listed but not stored. Ask the sender to share files by link.</p>
                      </div>
                    }
                  } @else {
                    <dl class="mt-3 space-y-1 text-sm">
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">To</dt>
                        <dd class="min-w-0 break-all text-gray-900">{{ current.message.to.join(', ') }}</dd>
                      </div>
                      @if (current.message.cc.length) {
                        <div class="flex gap-2">
                          <dt class="w-12 shrink-0 text-gray-500">Cc</dt>
                          <dd class="min-w-0 break-all text-gray-700">{{ current.message.cc.join(', ') }}</dd>
                        </div>
                      }
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">By</dt>
                        <dd class="min-w-0 break-all text-gray-700">{{ current.message.createdByName || current.message.createdByEmail || 'Unknown' }}</dd>
                      </div>
                      <div class="flex gap-2">
                        <dt class="w-12 shrink-0 text-gray-500">Date</dt>
                        <dd class="text-gray-700">{{ toDate(current.message.createdAt) | date: 'medium' }}</dd>
                      </div>
                    </dl>

                    <span
                      class="mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
                      [class.bg-emerald-50]="current.message.status === 'sent'"
                      [class.text-emerald-700]="current.message.status === 'sent'"
                      [class.bg-red-50]="current.message.status === 'failed'"
                      [class.text-red-700]="current.message.status === 'failed'"
                      [class.bg-gray-100]="current.message.status === 'sending'"
                      [class.text-gray-600]="current.message.status === 'sending'"
                    >
                      {{ current.message.status === 'sent' ? 'Sent' : current.message.status === 'failed' ? 'Failed to send' : 'Sending' }}
                    </span>

                    <div class="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{{ current.message.message }}</div>
                  }
                </article>
              } @else {
                <div class="flex h-full min-h-60 flex-col items-center justify-center p-8 text-center">
                  <mat-icon class="!h-10 !w-10 !text-4xl text-gray-300">mail</mat-icon>
                  <p class="mt-2 text-sm text-gray-500">Select a message to read it.</p>
                </div>
              }
            </section>
          </div>
        }
      </main>
    </div>
  `,
})
export class OrganizationMailboxComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mailbox = inject(OrganizationMailboxService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly folders: ReadonlyArray<{ key: Folder; label: string; icon: string }> = [
    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
    { key: 'sent', label: 'Sent', icon: 'send' },
    { key: 'archived', label: 'Archived', icon: 'archive' },
  ];

  protected readonly folder = signal<Folder>('inbox');
  protected readonly received = signal<InboundMailboxMessage[]>([]);
  protected readonly sentMessages = signal<SentMailboxMessage[]>([]);
  protected readonly directory = signal<DirectoryEntry[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  protected readonly copied = signal(false);
  /** Formatted (HTML) view is the default when the email has one. */
  protected readonly showFormatted = signal(true);
  protected readonly draft = signal<ComposeDraft | null>(null);

  /** "Add a member" picker; reset after each pick. */
  protected memberPick: string | null = null;

  protected readonly address = computed(() =>
    organizationMailboxAddress(this.organizationStore.selectedOrganization()?.slug),
  );

  protected readonly senderName = computed(
    () => this.organizationStore.selectedOrganization()?.name?.trim() || 'Zebron',
  );

  protected readonly senderLabel = computed(() => `${this.senderName()} via Zebron`);

  protected readonly unreadCount = computed(
    () => this.received().filter((message) => message.status === 'new').length,
  );

  protected readonly directoryWithEmail = computed(() =>
    this.directory()
      .filter((member) => member.email)
      .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')),
  );

  protected readonly listItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    const matches = (...values: string[]) =>
      !term || values.some((value) => value.toLowerCase().includes(term));

    if (this.folder() === 'sent') {
      return this.sentMessages()
        .filter((message) => matches(message.subject, message.message, ...message.to, ...message.cc))
        .map((message) => ({
          id: message.id,
          who: `To: ${message.to.join(', ')}`,
          subject: message.subject,
          preview: message.message.slice(0, 120),
          date: this.toDate(message.createdAt),
          unread: false,
          badge: message.status === 'failed' ? 'Failed' : message.inReplyToMessageId ? 'Reply' : '',
        }));
    }

    const archived = this.folder() === 'archived';

    return this.received()
      .filter((message) => message.archived === archived)
      .filter((message) => matches(message.name, message.email, message.subject, message.message))
      .map((message) => ({
        id: message.id,
        who: message.name || message.email,
        subject: message.subject,
        preview: this.plainText(message).slice(0, 120),
        date: this.toDate(message.receivedAt),
        unread: message.status === 'new',
        badge: message.repliedAt ? 'Replied' : '',
      }));
  });

  protected readonly selected = computed<Selected | null>(() => {
    const id = this.selectedId();

    if (!id) {
      return null;
    }

    if (this.folder() === 'sent') {
      const message = this.sentMessages().find((item) => item.id === id);
      return message ? { kind: 'sent', message } : null;
    }

    const message = this.received().find((item) => item.id === id);
    return message ? { kind: 'received', message } : null;
  });

  protected readonly emptyText = computed(() => {
    switch (this.folder()) {
      case 'sent':
        return 'Nothing sent yet.';
      case 'archived':
        return 'No archived messages.';
      default:
        return this.address()
          ? `No messages yet. Email sent to ${this.address()} appears here.`
          : 'No messages yet.';
    }
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Mailbox');

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // The store exposes context errors; the mailbox still loads below.
    }

    await Promise.all([this.load(), this.loadDirectory()]);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [received, sent] = await Promise.all([
        this.mailbox.getReceived(this.organizationId),
        this.mailbox.getSent(this.organizationId),
      ]);

      this.received.set(received);
      this.sentMessages.set(sent);
    } catch (error) {
      this.error.set(
        this.isPermissionDenied(error)
          ? "The mailbox couldn't be loaded: the database refused access. If the mailbox was just added, deploy the Firestore rules. Otherwise, only managers, admins and owners can use it."
          : this.messageOf(error),
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Member names and emails for "Add a member" (best effort). */
  private async loadDirectory(): Promise<void> {
    try {
      const callable = httpsCallable<
        { organizationId: string },
        { members: DirectoryEntry[] }
      >(firebaseFunctions, 'getOrganizationMemberDirectory');

      const result = await callable({ organizationId: this.organizationId });
      this.directory.set(result.data.members ?? []);
    } catch (error) {
      console.warn('[Mailbox] Member directory unavailable.', error);
    }
  }

  protected openFolder(folder: Folder): void {
    this.folder.set(folder);
    this.selectedId.set(null);
  }

  protected async select(id: string): Promise<void> {
    this.selectedId.set(id);
    this.showFormatted.set(true);

    const message = this.received().find((item) => item.id === id);

    if (this.folder() !== 'sent' && message && message.status === 'new') {
      this.updateLocal(id, { status: 'read', read: true });

      try {
        await this.mailbox.markRead(this.organizationId, id);
      } catch (error) {
        console.warn('[Mailbox] Could not mark as read.', error);
      }
    }
  }

  protected async markUnread(message: InboundMailboxMessage): Promise<void> {
    await this.changeState(message, { status: 'new', read: false, archived: false }, () =>
      this.mailbox.markUnread(this.organizationId, message.id),
    );
    this.selectedId.set(null);
  }

  protected async archive(message: InboundMailboxMessage): Promise<void> {
    await this.changeState(message, { status: 'archived', read: true, archived: true }, () =>
      this.mailbox.archive(this.organizationId, message.id),
    );
    this.selectedId.set(null);
  }

  protected async restore(message: InboundMailboxMessage): Promise<void> {
    await this.changeState(message, { status: 'read', read: true, archived: false }, () =>
      this.mailbox.restore(this.organizationId, message.id),
    );
    this.selectedId.set(null);
  }

  // ------------------------------------------------------------
  // Compose
  // ------------------------------------------------------------

  protected compose(): void {
    this.error.set('');
    this.draft.set({ to: '', cc: '', subject: '', message: '', inReplyToMessageId: null });
  }

  protected reply(message: InboundMailboxMessage): void {
    const date = this.toDate(message.receivedAt);
    const when = date ? date.toLocaleString() : 'an earlier date';
    const quoted = this.plainText(message)
      .slice(0, 3000)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');

    this.error.set('');
    this.draft.set({
      to: message.email,
      cc: '',
      subject: /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject || '(No subject)'}`,
      message: `\n\n\nOn ${when}, ${message.name || message.email} wrote:\n${quoted}`,
      inReplyToMessageId: message.id,
    });
  }

  protected forwardSent(message: SentMailboxMessage): void {
    this.error.set('');
    this.draft.set({
      to: message.to.join(', '),
      cc: message.cc.join(', '),
      subject: message.subject,
      message: message.message,
      inReplyToMessageId: null,
    });
  }

  protected patchDraft(changes: Partial<ComposeDraft>): void {
    const current = this.draft();

    if (current) {
      this.draft.set({ ...current, ...changes });
    }
  }

  protected addRecipient(email: string | null): void {
    const current = this.draft();

    if (!current || !email) {
      return;
    }

    const existing = splitAddresses(current.to);

    if (!existing.includes(email.toLowerCase())) {
      this.patchDraft({ to: [...existing, email.toLowerCase()].join(', ') });
    }

    setTimeout(() => (this.memberPick = null));
  }

  protected discard(): void {
    this.draft.set(null);
    this.error.set('');
  }

  protected async send(): Promise<void> {
    const current = this.draft();

    if (!current) {
      return;
    }

    this.sending.set(true);
    this.error.set('');

    try {
      await this.mailbox.send({
        organizationId: this.organizationId,
        to: splitAddresses(current.to),
        cc: splitAddresses(current.cc),
        subject: current.subject.trim(),
        message: current.message.trim(),
        inReplyToMessageId: current.inReplyToMessageId,
      });

      this.draft.set(null);
      this.folder.set('sent');
      this.selectedId.set(null);
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.sending.set(false);
    }
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  protected async copyAddress(address: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard blocked; the address is visible on screen.
    }
  }

  /** Text body, or the HTML body stripped to text when there is no text part. */
  protected plainText(message: InboundMailboxMessage): string {
    const text = message.message;

    if (text && !/^\s*</.test(text)) {
      return text;
    }

    const html = message.html || text;

    if (!html) {
      return '';
    }

    // DOMParser does not exist during server-side rendering.
    if (typeof DOMParser === 'undefined') {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    return (parsed.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
  }

  protected toDate(value: { toDate: () => Date } | null | undefined): Date | null {
    return value && typeof value.toDate === 'function' ? value.toDate() : null;
  }

  private async changeState(
    message: InboundMailboxMessage,
    state: Pick<InboundMailboxMessage, 'status' | 'read' | 'archived'>,
    write: () => Promise<void>,
  ): Promise<void> {
    const previous = { status: message.status, read: message.read, archived: message.archived };

    this.updateLocal(message.id, state);

    try {
      await write();
    } catch (error) {
      this.updateLocal(message.id, previous);
      this.error.set(this.messageOf(error));
    }
  }

  private updateLocal(id: string, changes: Partial<InboundMailboxMessage>): void {
    this.received.update((messages) =>
      messages.map((message) => (message.id === id ? { ...message, ...changes } : message)),
    );
  }

  private isPermissionDenied(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      String((error as { code: unknown }).code).includes('permission-denied')
    );
  }

  private messageOf(error: unknown): string {
    if (this.isPermissionDenied(error)) {
      return 'You do not have permission to do that. Managers, admins and owners can use the mailbox.';
    }

    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}

function splitAddresses(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,;\s]+/)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
