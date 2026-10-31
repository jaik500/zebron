import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { jsPDF } from 'jspdf';

import { OutboundMessage } from
  '../../../../../core/models/outbound-message.model';

import { OutboundMessageService } from
  '../../../../../core/services/outbound-message.service';

import { ContactService } from
  '../../../../../core/services/contact.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
/**
 * Administrator Sent Emails mailbox.
 *
 * Displays emails successfully sent through
 * the Zebron administrator mailbox.
 *
 * The layout intentionally follows the same
 * mailbox pattern used by the Inbox:
 *
 * - Consistent page header
 * - Search
 * - Responsive mailbox table
 * - Mobile message cards
 * - Message detail modal
 */
@Component({
  selector: 'app-sent-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, MatFormFieldModule, MatInputModule, MatIconModule, MatMenuModule, MatDividerModule, MatButtonModule],
  template: `
    <div class="min-h-screen bg-slate-50 pt-16">
      <!-- =======================================================
           HEADER (matches the Inbox)
           ======================================================= -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:px-6 lg:px-8">
          <div class="min-w-0 flex-1 sm:flex-none">
            <h1 class="truncate text-lg font-semibold">Sent</h1>
            <p class="hidden truncate text-xs text-white/80 lg:block">Emails sent from the Zebron mailbox</p>
          </div>

          <mat-form-field appearance="outline" class="zb-field zb-search order-last w-full sm:order-none sm:mx-auto sm:max-w-md">
            <mat-label>Search sent mail</mat-label>
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input
              matInput
              id="sent-search"
              type="search"
              [value]="searchQuery()"
              (input)="setSearch($any($event.target).value)"
              placeholder="Search recipient, subject or message"
              autocomplete="off"
            />
            @if (searchQuery()) {
              <button matSuffix mat-icon-button type="button" (click)="setSearch('')" aria-label="Clear search" title="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <button
            type="button"
            (click)="newMessage()"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#006666] shadow-sm transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">edit</mat-icon>
            <span class="hidden sm:inline">Compose</span>
          </button>

          <a
            routerLink="/admin/contact"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white sm:w-auto sm:px-3"
            [attr.aria-label]="'Inbox'"
            title="Inbox"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">inbox</mat-icon>
            <span class="hidden sm:inline">Inbox</span>
          </a>

          <button
            type="button"
            (click)="loadMessages()"
            [disabled]="loading()"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            aria-label="Refresh"
            title="Refresh"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]" [class.animate-spin]="loading()">refresh</mat-icon>
          </button>

          <button
            type="button"
            [matMenuTriggerFor]="sentMenu"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="More options"
            title="More"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
          </button>

          <mat-menu #sentMenu="matMenu" xPosition="before">
            <button mat-menu-item type="button" (click)="generateSentMessagesPdf()" [disabled]="messages().length === 0">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>Export to PDF</span>
            </button>
            <a mat-menu-item routerLink="/admin">
              <mat-icon>dashboard</mat-icon>
              <span>Admin dashboard</span>
            </a>
          </mat-menu>
        </div>
      </header>

      <!-- =======================================================
           MAIN
           ======================================================= -->
      <main class="px-3 py-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          @if (error() && composeMode() === 'none') {
            <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
              {{ error() }}
            </div>
          }

          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <!-- Folders -->
            <div class="flex items-center border-b border-slate-200 px-2 py-1.5 sm:px-3">
              <nav class="flex gap-1" aria-label="Mailbox folders">
                <a
                  routerLink="/admin/contact"
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">inbox</mat-icon>
                  Inbox
                </a>
                <span
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#007979]/10 px-3 text-sm font-semibold text-[#006666]"
                  aria-current="page"
                >
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">send</mat-icon>
                  Sent
                  @if (messages().length) {
                    <span class="rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold leading-[18px] text-slate-600">{{ messages().length }}</span>
                  }
                </span>
              </nav>
            </div>

            <!-- Messages -->
            @if (loading() && messages().length === 0) {
              <div class="divide-y divide-slate-100" aria-busy="true">
                @for (row of [1, 2, 3, 4, 5]; track row) {
                  <div class="flex items-center gap-4 px-4 py-3">
                    <div class="h-3 w-32 animate-pulse rounded bg-slate-200"></div>
                    <div class="h-3 flex-1 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-3 w-16 animate-pulse rounded bg-slate-100"></div>
                  </div>
                }
              </div>
            } @else if (filteredMessages().length === 0) {
              <div class="px-6 py-12 text-center">
                <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">{{ searchQuery() ? 'search_off' : 'send' }}</mat-icon>
                <p class="mt-2 text-sm font-semibold text-slate-900">
                  {{ searchQuery() ? 'No sent emails match your search' : 'No sent emails yet' }}
                </p>
                @if (searchQuery()) {
                  <button type="button" (click)="setSearch('')" class="mt-2 text-sm font-medium text-[#007979] hover:underline">Clear search</button>
                } @else {
                  <p class="mt-1 text-xs text-slate-500">Replies, forwards and new emails you send appear here.</p>
                }
              </div>
            } @else {
              <ul class="divide-y divide-slate-100">
                @for (message of visibleMessages(); track message.id) {
                  <li
                    class="group relative flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 hover:shadow-[inset_3px_0_0_#007979] sm:px-4"
                    (click)="openMessage(message)"
                  >
                    <div class="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                      <div class="flex items-center justify-between gap-2 sm:w-52 sm:shrink-0">
                        <p class="truncate text-sm text-slate-700" [title]="message.to">
                          <span class="text-slate-400">To:</span> {{ message.to }}
                        </p>
                        <span class="shrink-0 text-xs text-slate-500 sm:hidden">{{ shortDate(message) }}</span>
                      </div>

                      <p class="mt-0.5 flex min-w-0 flex-1 items-center gap-2 sm:mt-0">
                        <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium leading-[18px] text-slate-500">
                          {{ getMessageTypeLabel(message) }}
                        </span>
                        <span class="truncate text-sm text-slate-700">{{ message.subject || '(No subject)' }}</span>
                      </p>
                    </div>

                    <span
                      class="hidden w-20 shrink-0 text-right text-xs text-slate-500 sm:block sm:group-hover:invisible sm:group-focus-within:invisible"
                      [title]="formatDate(message.createdAt)"
                    >
                      {{ shortDate(message) }}
                    </span>

                    <div
                      class="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg bg-slate-50 pl-2 sm:group-hover:flex sm:group-focus-within:flex"
                      (click)="$event.stopPropagation()"
                    >
                      <button type="button" (click)="forwardFrom(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Forward" title="Forward">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
                      </button>
                      <button type="button" (click)="deleteFrom(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete" title="Delete">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                      </button>
                    </div>

                    <button
                      type="button"
                      [matMenuTriggerFor]="rowMenu"
                      [matMenuTriggerData]="{ message: message }"
                      (click)="$event.stopPropagation()"
                      class="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 sm:hidden"
                      aria-label="More actions"
                    >
                      <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
                    </button>
                  </li>
                }
              </ul>

              <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                <span>
                  {{ visibleMessages().length }} of {{ filteredMessages().length }}
                  {{ filteredMessages().length === 1 ? 'email' : 'emails' }}
                </span>
                @if (visibleMessages().length < filteredMessages().length) {
                  <button type="button" (click)="showMore()" class="rounded-md px-2 py-1 font-semibold text-[#007979] hover:bg-[#007979]/10">
                    Show more
                  </button>
                }
              </div>
            }
          </section>
        </div>
      </main>
    </div>

    <!-- Row actions (phones) -->
    <mat-menu #rowMenu="matMenu" xPosition="before">
      <ng-template matMenuContent let-message="message">
        <button mat-menu-item type="button" (click)="openMessage(message)">
          <mat-icon>visibility</mat-icon>
          <span>View</span>
        </button>
        <button mat-menu-item type="button" (click)="forwardFrom(message)">
          <mat-icon>forward</mat-icon>
          <span>Forward</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item type="button" (click)="deleteFrom(message)">
          <mat-icon>delete</mat-icon>
          <span>Delete</span>
        </button>
      </ng-template>
    </mat-menu>

    <!-- =========================================================
         MESSAGE READER (matches the Inbox)
         ========================================================= -->
    @if (selectedMessage(); as msg) {
      <div
        class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        (click)="closeMessage()"
      >
        <section
          class="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sent-message-subject"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-1 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-3 py-2 sm:px-5">
            <button type="button" (click)="closeMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white" aria-label="Back to sent mail" title="Back">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">arrow_back</mat-icon>
            </button>
            <span class="mx-1 h-5 w-px bg-white/30" aria-hidden="true"></span>
            <button type="button" (click)="deleteMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white" aria-label="Delete" title="Delete">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
            </button>
            <div class="ml-auto flex items-center gap-1">
              <button type="button" (click)="printMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white" aria-label="Print" title="Print">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">print</mat-icon>
              </button>
              <button type="button" (click)="closeMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white" aria-label="Close" title="Close">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="px-5 pb-8 pt-6 sm:px-10">
              <div class="flex flex-wrap items-start gap-x-3 gap-y-2">
                <h2 id="sent-message-subject" class="min-w-0 flex-1 break-words text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                  {{ msg.subject || '(No subject)' }}
                </h2>
                <span class="mt-1 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {{ getMessageTypeLabel(msg) }}
                </span>
              </div>

              <div class="mt-6 flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007979] text-base font-semibold text-white" aria-hidden="true">
                  {{ (msg.from || 'Z').charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <p class="min-w-0 truncate text-sm font-semibold text-slate-900">{{ msg.from || 'Zebron' }}</p>
                    <p class="shrink-0 text-xs text-slate-500">{{ formatDate(msg.createdAt) }}</p>
                  </div>
                  <p class="mt-0.5 truncate text-xs text-slate-500">to {{ msg.to }}</p>
                </div>
              </div>

              <div class="mt-6 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800 sm:pl-[52px]">{{ msg.message }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <button type="button" (click)="forwardMessage()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666]">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
              Forward
            </button>
            <button type="button" (click)="closeMessage()" class="ml-auto inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
              Close
            </button>
          </div>
        </section>
      </div>
    }

    <!-- =========================================================
         COMPOSER
         ========================================================= -->
    @if (composeMode() !== 'none') {
      <div
        class="fixed inset-0 z-[70] flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Compose email"
        (click)="closeComposer()"
      >
        <section
          class="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <header class="flex items-center justify-between gap-4 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <h2 class="text-base font-semibold text-white">
              {{ composeMode() === 'forward' ? 'Forward message' : 'New email' }}
            </h2>
            <button
              type="button"
              (click)="closeComposer()"
              [disabled]="sending()"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-50"
              aria-label="Close composer"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">close</mat-icon>
            </button>
          </header>

          @if (error()) {
            <div class="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {{ error() }}
            </div>
          }

          <form class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 py-5" (submit)="$event.preventDefault(); sendComposedMessage()">
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>To</mat-label>
              <input
                matInput
                id="sent-compose-to"
                type="email"
                [value]="composeTo()"
                (input)="composeTo.set($any($event.target).value)"
                required
                autocomplete="email"
                [disabled]="sending()"
                placeholder="recipient@example.com"
              />
            </mat-form-field>
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Subject</mat-label>
              <input
                matInput
                id="sent-compose-subject"
                type="text"
                [value]="composeSubject()"
                (input)="composeSubject.set($any($event.target).value)"
                required
                [disabled]="sending()"
              />
            </mat-form-field>
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Message</mat-label>
              <textarea
                matInput
                id="sent-compose-message"
                rows="14"
                [value]="composeMessage()"
                (input)="composeMessage.set($any($event.target).value)"
                required
                [disabled]="sending()"
                placeholder="Write your message..."
              ></textarea>
            </mat-form-field>

            <div class="mt-auto flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                (click)="closeComposer()"
                [disabled]="sending()"
                class="h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="sending()"
                class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]" [class.animate-spin]="sending()">{{ sending() ? 'refresh' : 'send' }}</mat-icon>
                {{ sending() ? 'Sending...' : composeMode() === 'forward' ? 'Forward' : 'Send' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (toastMessage()) {
      <div
        class="fixed bottom-4 left-3 right-3 z-[100] flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl sm:left-auto sm:right-6"
        role="status"
        aria-live="polite"
      >
        <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">check_circle</mat-icon>
        {{ toastMessage() }}
      </div>
    }
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentEmailComponent
  implements OnInit {

  /**
   * Outbound message service used to
   * retrieve administrator sent emails.
   */
  private readonly outboundMessageService =
    inject(
      OutboundMessageService,
    );

  /**
   * Contact service used to send new and forwarded emails.
   */
  private readonly contactService =
    inject(
      ContactService,
    );

  /**
   * Compose mode for the sent-mail composer.
   */
  readonly composeMode =
    signal<'none' | 'new' | 'forward'>('none');

  readonly composeTo = signal('');
  readonly composeSubject = signal('');
  readonly composeMessage = signal('');
  readonly sending = signal(false);
  readonly toastMessage = signal<string | null>(null);

  /**
   * Controls the three-dot header actions menu.
   */
  readonly headerMenuOpen = signal(false);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * All sent emails loaded from Firestore.
   */
  readonly messages =
    signal<OutboundMessage[]>([]);

  /**
   * Current search text.
   */
  readonly searchQuery =
    signal('');

  /**
   * Sent emails matching the current search.
   *
   * Filtering is performed locally so typing
   * in the search box does not create additional
   * Firestore requests.
   */
  readonly filteredMessages =
    computed(() => {

      const search =
        this.searchQuery()
          .trim()
          .toLowerCase();

      if (!search) {
        return this.messages();
      }

      return this.messages().filter(
        (message) =>
          message.from
            ?.toLowerCase()
            .includes(search) ||

          message.to
            ?.toLowerCase()
            .includes(search) ||

          message.subject
            ?.toLowerCase()
            .includes(search) ||

          message.message
            ?.toLowerCase()
            .includes(search),
      );
    });

  /**
   * Indicates whether messages are currently loading.
   */
  readonly loading =
    signal(false);

  /** Rows shown; "Show more" adds another page. */
  private readonly pageSize = 25;

  readonly visibleCount = signal(25);

  readonly visibleMessages = computed(() => this.filteredMessages().slice(0, this.visibleCount()));

  showMore(): void {
    this.visibleCount.update((count) => count + this.pageSize);
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleCount.set(this.pageSize);
  }

  /** Forward a message straight from the list. */
  forwardFrom(message: OutboundMessage): void {
    this.selectedMessage.set(message);
    this.forwardMessage();
  }

  /** Delete a message straight from the list. */
  async deleteFrom(message: OutboundMessage): Promise<void> {
    this.selectedMessage.set(message);
    await this.deleteMessage();
    // Cancelled: don't leave the reader open.
    this.selectedMessage.set(null);
  }

  /** "3:45 PM" today, "Oct 29" this year, "Oct 29, 2025" otherwise. */
  shortDate(message: OutboundMessage): string {
    const timestamp = message.createdAt as { toDate?: () => Date } | null | undefined;
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '';
    }
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
    }).format(date);
  }

  /**
   * Error displayed when loading fails.
   */
  readonly error =
    signal<string | null>(null);

  /**
   * Currently selected message.
   */
  readonly selectedMessage =
    signal<OutboundMessage | null>(null);

  /**
   * Load messages when the component initializes.
   */
  ngOnInit(): void {
    void this.loadMessages();
  }

  /**
   * Retrieve sent messages from Firestore.
   */
  async loadMessages(): Promise<void> {

    this.loading.set(true);
    this.error.set(null);

    try {

      const messages =
        await this.outboundMessageService
          .getAllOutboundMessages();

      this.messages.set(messages);

    } catch (error) {

      console.error(
        'Failed to load sent emails:',
        error,
      );

      this.error.set(
        'Unable to load sent emails. Please try again.',
      );

    } finally {

      this.loading.set(false);

    }
  }

  /**
   * Open a sent message in the detail modal.
   */
  openMessage(
    message: OutboundMessage,
  ): void {

    this.selectedMessage.set(message);

  }

  /**
   * Close the message detail modal.
   */
  closeMessage(): void {

    this.selectedMessage.set(null);

  }

/**
 * Delete the currently selected sent message.
 *
 * The user must confirm before the message
 * is permanently removed from Firestore.
 */
async deleteMessage(): Promise<void> {

  const message =
    this.selectedMessage();

  if (!message?.id) {
    return;
  }

  const confirmed =
    window.confirm(
      'Delete this sent email? This action cannot be undone.',
    );

  if (!confirmed) {
    return;
  }

  try {

    await this.outboundMessageService
      .deleteMessage(
        message.id,
      );

    /*
     * Remove the deleted message from the
     * local mailbox immediately.
     */
    this.messages.update(
      (messages) =>
        messages.filter(
          (item) =>
            item.id !== message.id,
        ),
    );

    /*
     * Close the message modal.
     */
    this.closeMessage();

  } catch (error) {

    console.error(
      'Failed to delete sent email:',
      error,
    );

    this.error.set(
      'Unable to delete the sent email. Please try again.',
    );

  }
}

/**
 * Toggle the three-dot header actions menu.
 */
toggleHeaderMenu(): void {
  this.headerMenuOpen.update(
    (open) => !open,
  );
}

/**
 * Close the three-dot header actions menu.
 */
closeHeaderMenu(): void {
  this.headerMenuOpen.set(false);
}

/**
 * Generate a PDF report containing all sent records.
 *
 * The report includes:
 * - Recipient
 * - Date/time
 * - Subject
 * - Message type
 * - Sender
 *
 * The report is generated entirely from the messages
 * already loaded into the Sent mailbox.
 */
generateSentMessagesPdf(): void {
  const messages = this.messages();

  this.closeHeaderMenu();

  if (messages.length === 0) {
    this.showSuccessToast(
      'There are no sent records to export.',
    );
    return;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin = 12;

    const tableWidth =
      pageWidth - margin * 2;

    const columns = [
      {
        title: 'Recipient',
        width: 52,
      },
      {
        title: 'Date / Time',
        width: 40,
      },
      {
        title: 'Subject',
        width: 72,
      },
      {
        title: 'Type',
        width: 27,
      },
      {
        title: 'Sender',
        width: 50,
      },
    ];

    /*
     * Keep the declared widths inside the printable
     * page width if the A4 configuration changes.
     */
    const widthScale =
      tableWidth /
      columns.reduce(
        (total, column) =>
          total + column.width,
        0,
      );

    columns.forEach(
      (column) => {
        column.width *= widthScale;
      },
    );

    const reportTitle =
      'Zebron Sent Email Report';

    const generatedAt =
      new Date().toLocaleString();

    const rowHeight = 9;

    const headerHeight = 10;

    const cellPadding = 2;

    let y = margin;

    const drawPageHeader = (): void => {
      pdf.setTextColor(
        3,
        45,
        66,
      );

      pdf.setFont(
        'helvetica',
        'bold',
      );

      pdf.setFontSize(18);

      pdf.text(
        'ZEBRON',
        margin,
        y,
      );

      pdf.setFontSize(13);

      pdf.text(
        reportTitle,
        margin,
        y + 7,
      );

      pdf.setFont(
        'helvetica',
        'normal',
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        107,
        114,
        128,
      );

      pdf.text(
        `Generated: ${generatedAt}`,
        pageWidth - margin,
        y,
        {
          align: 'right',
        },
      );

      pdf.text(
        `Total records: ${messages.length}`,
        pageWidth - margin,
        y + 5,
        {
          align: 'right',
        },
      );

      y += 17;
    };

    const drawTableHeader = (): void => {
      let x = margin;

      pdf.setFillColor(
        243,
        244,
        246,
      );

      pdf.setDrawColor(
        209,
        213,
        219,
      );

      pdf.rect(
        margin,
        y,
        tableWidth,
        headerHeight,
        'FD',
      );

      pdf.setFont(
        'helvetica',
        'bold',
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        55,
        65,
        81,
      );

      columns.forEach(
        (column) => {
          pdf.text(
            column.title,
            x + cellPadding,
            y + 6.5,
          );

          x += column.width;

          pdf.line(
            x,
            y,
            x,
            y + headerHeight,
          );
        },
      );

      y += headerHeight;
    };

    const drawMessageRow = (
      message: OutboundMessage,
    ): void => {
      const type =
        this.getMessageTypeLabel(
          message,
        );

      const values = [
        message.to || '—',
        this.formatDate(
          message.createdAt,
        ),
        message.subject || '—',
        type,
        message.from || '—',
      ];

      let x = margin;

      const rowTop = y;

      pdf.setFillColor(
        255,
        255,
        255,
      );

      pdf.setDrawColor(
        229,
        231,
        235,
      );

      pdf.rect(
        margin,
        rowTop,
        tableWidth,
        rowHeight,
        'FD',
      );

      pdf.setFont(
        'helvetica',
        'normal',
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        31,
        41,
        55,
      );

      columns.forEach(
        (column, index) => {
          const lines =
            pdf.splitTextToSize(
              String(values[index]),
              column.width -
                cellPadding * 2,
            );

          pdf.text(
            lines.slice(0, 2),
            x + cellPadding,
            rowTop + 3.8,
            {
              lineHeightFactor: 1.15,
            },
          );

          x += column.width;

          pdf.line(
            x,
            rowTop,
            x,
            rowTop + rowHeight,
          );
        },
      );

      y += rowHeight;
    };

    const addPageIfNeeded = (): void => {
      if (
        y + headerHeight + rowHeight >
        pageHeight - margin
      ) {
        pdf.addPage();

        y = margin;

        drawPageHeader();

        drawTableHeader();
      }
    };

    drawPageHeader();

    drawTableHeader();

    messages.forEach(
      (message) => {
        addPageIfNeeded();
        drawMessageRow(message);
      },
    );

    /*
     * Footer every page.
     */
    const pageCount =
      pdf.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page += 1
    ) {
      pdf.setPage(page);

      pdf.setFont(
        'helvetica',
        'normal',
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        156,
        163,
        175,
      );

      pdf.text(
        'Zebron administrator mailbox',
        margin,
        pageHeight - 7,
      );

      pdf.text(
        `Page ${page} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        {
          align: 'right',
        },
      );
    }

    const date =
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        );

    pdf.save(
      `zebron-sent-email-report-${date}.pdf`,
    );

    this.showSuccessToast(
      'Sent email PDF generated successfully.',
    );
  } catch (error) {
    console.error(
      'Failed to generate sent email PDF:',
      error,
    );

    this.error.set(
      'Unable to generate the sent email PDF.',
    );
  }
}

/**
 * Return the display label for an outbound
 * message type.
 */
getMessageTypeLabel(
  message: OutboundMessage,
): string {
  switch (message.type) {
    case 'reply':
      return 'Reply';

    case 'forward':
      return 'Forward';

    case 'new':
    default:
      return 'New Email';
  }
}

/**
 * Print the currently selected sent message.
 *
 * A print-only document is rendered by the component's
 * print stylesheet so the mailbox controls and navigation
 * are excluded from the printed output.
 */
printMessage(): void {
  const message = this.selectedMessage();
  if (!message || typeof document === 'undefined') {
    return;
  }

  const escape = (value: string | null | undefined) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const printed = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  const rows = [
    ['From', message.from || 'Zebron'],
    ['To', message.to],
    ['Date', this.formatDate(message.createdAt)],
    ['Type', this.getMessageTypeLabel(message)],
  ]
    .map(([label, value]) => `<tr><th>${label}</th><td>${escape(value)}</td></tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(message.subject || 'Sent email')}</title>
<style>
  @page { margin: 16mm; }
  body { margin: 0; font-family: Roboto, Arial, sans-serif; color: #0f172a; font-size: 12pt; }
  .band { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 6px;
          background: linear-gradient(90deg, #007979, #00706f, #2a835f); color: #fff;
          -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .band strong { font-size: 13pt; letter-spacing: .02em; }
  .band span { font-size: 9pt; opacity: .9; }
  h1 { margin: 18px 0 10px; font-size: 17pt; line-height: 1.3; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
  th { width: 70px; padding: 3px 10px 3px 0; text-align: left; vertical-align: top; color: #64748b; font-weight: 600; font-size: 10pt; }
  td { padding: 3px 0; font-size: 10.5pt; }
  .body { border-top: 1px solid #e2e8f0; padding-top: 14px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6; }
  footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 6px; color: #94a3b8; font-size: 8.5pt; }
</style>
</head>
<body>
  <div class="band"><strong>ZEBRON</strong><span>Sent email</span></div>
  <h1>${escape(message.subject || '(No subject)')}</h1>
  <table>${rows}</table>
  <div class="body">${escape(message.message)}</div>
  <footer>Printed ${escape(printed)} from the Zebron Mailbox</footer>
</body>
</html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  if (!frameDocument || !frameWindow) {
    frame.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  frameWindow.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 500), { once: true });
  setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => frame.isConnected && frame.remove(), 60_000);
  }, 50);
}

/**
 * Open a blank New Email composer.
 */
newMessage(): void {
  this.closeMessage();
  this.error.set(null);
  this.composeMode.set('new');
  this.composeTo.set('');
  this.composeSubject.set('');
  this.composeMessage.set('');
}

/**
 * Open the composer with the selected sent email
 * prepared as a forward.
 */
forwardMessage(): void {
  const message = this.selectedMessage();

  if (!message) {
    return;
  }

  this.error.set(null);
  this.composeMode.set('forward');
  this.composeTo.set('');
  this.composeSubject.set(
    message.subject.toLowerCase().startsWith('fwd:')
      ? message.subject
      : `Fwd: ${message.subject}`,
  );
  this.composeMessage.set(
    `\n---------- Forwarded message ----------\nFrom: ${message.from}\nTo: ${message.to}\nDate: ${this.formatDate(message.createdAt)}\nSubject: ${message.subject}\n\n${message.message}`,
  );

  this.closeMessage();
}

/**
 * Close the composer and clear its fields.
 */
closeComposer(): void {
  if (this.sending()) {
    return;
  }

  this.composeMode.set('none');
  this.composeTo.set('');
  this.composeSubject.set('');
  this.composeMessage.set('');
  this.error.set(null);
}

/**
 * Send a new or forwarded email.
 *
 * Exactly one Firebase request is made for each
 * successful button submission.
 */
async sendComposedMessage(): Promise<void> {
  if (this.sending()) {
    return;
  }

  const to = this.composeTo().trim();
  const subject = this.composeSubject().trim();
  const message = this.composeMessage().trim();
  const mode = this.composeMode();

  if (!to || !subject || !message) {
    this.error.set('Recipient, subject, and message are required.');
    return;
  }

  if (mode !== 'new' && mode !== 'forward') {
    return;
  }

  this.sending.set(true);
  this.error.set(null);

  try {
    await this.contactService.sendNewMessage({
      to,
      subject,
      message,
      type: mode === 'forward' ? 'forward' : 'new',
    });

    /*
     * Release the sending lock before cleanup so
     * closeComposer() can actually close the modal.
     */
    this.sending.set(false);
    this.closeComposer();
    await this.loadMessages();

    this.showSuccessToast(
      mode === 'forward'
        ? 'Message forwarded successfully.'
        : 'Message sent successfully.',
    );
  } catch (error) {
    console.error('Failed to send sent-page email:', error);
    this.error.set('Unable to send the email. Please try again.');
  } finally {
    this.sending.set(false);
  }
}

/**
 * Show a temporary success toast.
 */
private showSuccessToast(message: string): void {
  if (this.toastTimer) {
    clearTimeout(this.toastTimer);
  }

  this.toastMessage.set(message);

  this.toastTimer = setTimeout(() => {
    this.toastMessage.set(null);
    this.toastTimer = null;
  }, 4000);
}



  /**
   * Format a Firestore Timestamp for display.
   */
  formatDate(
    timestamp: OutboundMessage['createdAt'],
  ): string {

    if (!timestamp) {
      return 'Unknown';
    }

    return timestamp
      .toDate()
      .toLocaleString();

  }


}