import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { OutboundMessage } from
  '../../../../../core/models/outbound-message.model';

import { OutboundMessageService } from
  '../../../../../core/services/outbound-message.service';

/**
 * Administrator Sent Emails mailbox.
 *
 * Displays emails successfully sent through
 * the Zebron administrator mailbox.
 */
@Component({
  selector: 'app-sent-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `

     <!-- Page header -->
        <div
          class="mb-8 flex flex-col gap-4
                 rounded-xl bg-[#032D42]
                 px-6 py-6 shadow-sm
                 sm:flex-row
                 sm:items-center
                 sm:justify-between"
        >

          <div>
            <h1
              class="text-2xl font-bold
                     tracking-tight text-white"
            >
              Sent Emails
            </h1>

            <p class="mt-1 text-sm text-white/80">
              View emails sent from the
              Zebron administrator mailbox.
            </p>
          </div>

          <div
            class="flex flex-wrap gap-3"
          >

            <!-- Refresh -->
            <button
              type="button"
              (click)="loadMessages()"
              [disabled]="loading()"
              class="inline-flex items-center
                     justify-center rounded-lg
                     border border-white/30
                     px-4 py-2 text-sm
                     font-medium text-white
                     transition
                     hover:bg-white/10
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >
              ↻
              <span class="ml-2">
                {{ loading() ? 'Refreshing...' : 'Refresh' }}
              </span>
            </button>

            <!-- Inbox -->
            <a
              routerLink="/admin/contact"
              class="inline-flex items-center
                     justify-center rounded-lg
                     bg-white px-4 py-2
                     text-sm font-semibold
                     text-[#032D42]
                     shadow-sm transition
                     hover:bg-gray-100"
            >
              ← Inbox
            </a>

            <!-- Admin dashboard -->
            <a
              routerLink="/admin"
              class="inline-flex items-center
                     justify-center rounded-lg
                     border border-white/30
                     px-4 py-2 text-sm
                     font-medium text-white
                     transition
                     hover:bg-white/10"
            >
              Admin Dashboard
            </a>

          </div>

        </div>
    <div
      class="min-h-screen bg-gray-50
             px-4 py-8 sm:px-6 lg:px-8"
    >

      <div class="mx-auto max-w-7xl">

     

        <!-- Sent email search -->
        <div class="mb-6">

          <div class="relative">

            <!-- Search icon -->
            <span
              class="pointer-events-none absolute inset-y-0 left-0
                     flex items-center pl-4 text-gray-400"
              aria-hidden="true"
            >
              🔍
            </span>

            <input
              id="sent-email-search"
              type="search"
              [value]="searchQuery()"
              (input)="
                searchQuery.set(
                  $any($event.target).value
                )
              "
              placeholder="Search sender, email, recipient, subject, or message..."
              autocomplete="off"
              class="w-full rounded-xl
                     border border-gray-300
                     bg-white py-3 pl-11 pr-10
                     text-sm text-gray-900
                     shadow-sm outline-none
                     transition
                     placeholder:text-gray-400
                     focus:border-[#032D42]
                     focus:ring-2
                     focus:ring-[#032D42]/20"
            />

            <!-- Clear search -->
            @if (searchQuery()) {
              <button
                type="button"
                (click)="searchQuery.set('')"
                class="absolute inset-y-0 right-0
                       flex items-center px-4
                       text-gray-400 transition
                       hover:text-gray-700"
                aria-label="Clear sent email search"
              >
                ✕
              </button>
            }

          </div>

          <!-- Search result count -->
          @if (searchQuery()) {
            <p class="mt-2 text-xs text-gray-500">
              Showing
              <span class="font-semibold text-gray-700">
                {{ filteredMessages().length }}
              </span>
              matching
              {{
                filteredMessages().length === 1
                  ? 'email'
                  : 'emails'
              }}
            </p>
          }

        </div>


        <!-- Error message -->
        @if (error()) {
          <div
            class="mb-6 rounded-xl border
                   border-red-200 bg-red-50
                   px-5 py-4 text-sm
                   text-red-700"
            role="alert"
          >
            {{ error() }}
          </div>
        }

        <!-- Loading state -->
        @if (loading()) {

          <div
            class="rounded-xl border
                   border-gray-200 bg-white
                   p-12 text-center shadow-sm"
          >
            <div
              class="mx-auto h-8 w-8
                     animate-spin rounded-full
                     border-4 border-gray-200
                     border-t-[#032D42]"
            ></div>

            <p
              class="mt-4 text-sm
                     text-gray-500"
            >
              Loading sent emails...
            </p>
          </div>

        }

        <!-- Empty state -->
        @else if (messages().length === 0) {

          <div
            class="rounded-xl border
                   border-gray-200 bg-white
                   p-12 text-center shadow-sm"
          >

            <div
              class="mx-auto flex h-14 w-14
                     items-center justify-center
                     rounded-full bg-gray-100
                     text-2xl"
            >
              ✉
            </div>

            <h2
              class="mt-4 text-lg font-semibold
                     text-gray-900"
            >
              No Sent Emails
            </h2>

            <p
              class="mx-auto mt-2 max-w-md
                     text-sm leading-6
                     text-gray-500"
            >
              Emails sent from the administrator
              mailbox will appear here.
            </p>

          </div>

        }

        <!-- Sent email list -->
        @else {

          <div
            class="overflow-hidden rounded-xl
                   border border-gray-200
                   bg-white shadow-sm"
          >

            <!-- Desktop table -->
            <div class="hidden md:block">

              <table
                class="min-w-full
                       divide-y divide-gray-200"
              >

                <thead class="bg-gray-50">

                  <tr>

                    <th
                      scope="col"
                      class="px-6 py-4 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Recipient
                    </th>

                    <th
                      scope="col"
                      class="px-6 py-4 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Subject
                    </th>

                    <th
                      scope="col"
                      class="px-6 py-4 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Type
                    </th>

                    <th
                      scope="col"
                      class="px-6 py-4 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Sent
                    </th>

                    <th
                      scope="col"
                      class="px-6 py-4 text-right
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody
                  class="divide-y divide-gray-100"
                >

                  @for (
                    message of filteredMessages();
                    track message.id
                  ) {

                    <tr
                      class="transition
                             hover:bg-gray-50"
                    >

                      <td
                        class="whitespace-nowrap
                               px-6 py-4"
                      >
                        <div
                          class="text-sm
                                 font-medium
                                 text-gray-900"
                        >
                          {{ message.to }}
                        </div>

                        <div
                          class="mt-1 text-xs
                                 text-gray-400"
                        >
                          From {{ message.from }}
                        </div>
                      </td>

                      <td
                        class="max-w-sm px-6 py-4"
                      >
                        <div
                          class="truncate text-sm
                                 font-medium
                                 text-gray-900"
                        >
                          {{ message.subject }}
                        </div>

                        <div
                          class="mt-1 truncate
                                 text-xs
                                 text-gray-500"
                        >
                          {{ message.message }}
                        </div>
                      </td>

                      <td
                        class="whitespace-nowrap
                               px-6 py-4"
                      >

                        @if (message.type === 'reply') {

                          <span
                            class="inline-flex
                                   rounded-full
                                   bg-blue-100 px-2.5
                                   py-1 text-xs
                                   font-medium
                                   text-blue-700"
                          >
                            Reply
                          </span>

                        } @else {

                          <span
                            class="inline-flex
                                   rounded-full
                                   bg-gray-100 px-2.5
                                   py-1 text-xs
                                   font-medium
                                   text-gray-700"
                          >
                            New Email
                          </span>

                        }

                      </td>

                      <td
                        class="whitespace-nowrap
                               px-6 py-4
                               text-sm text-gray-500"
                      >
                        {{ formatDate(message.createdAt) }}
                      </td>

                      <td
                        class="whitespace-nowrap
                               px-6 py-4 text-right"
                      >

                        <button
                          type="button"
                          (click)="openMessage(message)"
                          class="rounded-lg
                                 bg-[#032D42]
                                 px-3 py-2
                                 text-xs font-semibold
                                 text-white
                                 transition
                                 hover:bg-[#064b68]"
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  }

                </tbody>

              </table>

            </div>

            <!-- Mobile cards -->
            <div
              class="divide-y divide-gray-100
                     md:hidden"
            >

              @for (
                message of filteredMessages();
                track message.id
              ) {

                <div
                  class="p-5"
                >

                  <div
                    class="flex items-start
                           justify-between gap-4"
                  >

                    <div class="min-w-0">

                      <p
                        class="truncate text-sm
                               font-semibold
                               text-gray-900"
                      >
                        {{ message.to }}
                      </p>

                      <p
                        class="mt-1 truncate
                               text-sm
                               text-gray-700"
                      >
                        {{ message.subject }}
                      </p>

                    </div>

                    @if (message.type === 'reply') {

                      <span
                        class="shrink-0
                               rounded-full
                               bg-blue-100 px-2.5
                               py-1 text-xs
                               font-medium
                               text-blue-700"
                      >
                        Reply
                      </span>

                    } @else {

                      <span
                        class="shrink-0
                               rounded-full
                               bg-gray-100 px-2.5
                               py-1 text-xs
                               font-medium
                               text-gray-700"
                      >
                        New
                      </span>

                    }

                  </div>

                  <p
                    class="mt-3 line-clamp-2
                           text-sm leading-6
                           text-gray-500"
                  >
                    {{ message.message }}
                  </p>

                  <div
                    class="mt-4 flex items-center
                           justify-between"
                  >

                    <span
                      class="text-xs
                             text-gray-400"
                    >
                      {{ formatDate(message.createdAt) }}
                    </span>

                    <button
                      type="button"
                      (click)="openMessage(message)"
                      class="rounded-lg
                             bg-[#032D42]
                             px-3 py-2
                             text-xs font-semibold
                             text-white"
                    >
                      View
                    </button>

                  </div>

                </div>

              }

            </div>

          </div>

        }

      </div>

      <!-- Message detail modal -->
      @if (selectedMessage()) {

        <div
          class="fixed inset-0 z-50
                 flex items-center justify-center
                 bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Sent email"
          (click)="closeMessage()"
        >

          <div
            class="max-h-[90vh] w-full
                   max-w-2xl overflow-hidden
                   rounded-2xl bg-white
                   shadow-2xl"
            (click)="$event.stopPropagation()"
          >

            <!-- Modal header -->
            <div
              class="flex items-start
                     justify-between gap-4
                     border-b border-gray-200
                     px-6 py-5"
            >

              <div class="min-w-0">

                <p
                  class="text-xs font-semibold
                         uppercase tracking-wider
                         text-gray-400"
                >
                  {{ selectedMessage()!.type === 'reply'
                    ? 'Reply'
                    : 'New Email'
                  }}
                </p>

                <h2
                  class="mt-1 text-lg font-bold
                         text-gray-900"
                >
                  {{ selectedMessage()!.subject }}
                </h2>

              </div>

              <button
                type="button"
                (click)="closeMessage()"
                class="shrink-0 rounded-lg
                       px-3 py-2 text-xl
                       text-gray-500
                       transition
                       hover:bg-gray-100
                       hover:text-gray-900"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <!-- Modal content -->
            <div
              class="max-h-[65vh]
                     overflow-y-auto px-6 py-6"
            >

              <dl class="space-y-4">

                <div>

                  <dt
                    class="text-xs font-semibold
                           uppercase tracking-wider
                           text-gray-400"
                  >
                    To
                  </dt>

                  <dd
                    class="mt-1 text-sm
                           text-gray-900"
                  >
                    {{ selectedMessage()!.to }}
                  </dd>

                </div>

                <div>

                  <dt
                    class="text-xs font-semibold
                           uppercase tracking-wider
                           text-gray-400"
                  >
                    From
                  </dt>

                  <dd
                    class="mt-1 text-sm
                           text-gray-900"
                  >
                    {{ selectedMessage()!.from }}
                  </dd>

                </div>

                <div>

                  <dt
                    class="text-xs font-semibold
                           uppercase tracking-wider
                           text-gray-400"
                  >
                    Sent
                  </dt>

                  <dd
                    class="mt-1 text-sm
                           text-gray-900"
                  >
                    {{ formatDate(selectedMessage()!.createdAt) }}
                  </dd>

                </div>

                <div>

                  <dt
                    class="text-xs font-semibold
                           uppercase tracking-wider
                           text-gray-400"
                  >
                    Message
                  </dt>

                  <dd
                    class="mt-3 whitespace-pre-wrap
                           rounded-xl bg-gray-50
                           p-4 text-sm leading-7
                           text-gray-700"
                  >
                    {{ selectedMessage()!.message }}
                  </dd>

                </div>

              </dl>

            </div>

            <!-- Modal footer -->
            <div
              class="flex justify-end
                     border-t border-gray-200
                     px-6 py-4"
            >

              <button
                type="button"
                (click)="closeMessage()"
                class="rounded-lg
                       bg-[#032D42]
                       px-4 py-2
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-[#064b68]"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      }

    </div>
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

  /** Sent emails displayed in the mailbox. */
  readonly messages =
    signal<OutboundMessage[]>([]);

  /**
   * Current sent-email search text.
   *
   * Searches the sender, recipient, subject,
   * and message body.
   */
  readonly searchQuery =
    signal("");

  /**
   * Sent emails matching the current search.
   *
   * Filtering happens locally so searching does
   * not create additional Firestore requests.
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

  /** Indicates that sent emails are loading. */
  readonly loading =
    signal(false);

  /** Error displayed when loading fails. */
  readonly error =
    signal<string | null>(null);

  /** Currently selected sent email. */
  readonly selectedMessage =
    signal<OutboundMessage | null>(null);

  /**
   * Load sent emails when the page initializes.
   */
  ngOnInit(): void {
    void this.loadMessages();
  }

  /**
   * Retrieve sent emails from Firestore.
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
        "Failed to load sent emails:",
        error,
      );

      this.error.set(
        "Unable to load sent emails. Please try again.",
      );

    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Open a sent email for viewing.
   */
  openMessage(
    message: OutboundMessage,
  ): void {
    this.selectedMessage.set(message);
  }

  /**
   * Close the sent email detail modal.
   */
  closeMessage(): void {
    this.selectedMessage.set(null);
  }

  /**
   * Format a Firestore Timestamp for display.
   */
  formatDate(
    timestamp: OutboundMessage["createdAt"],
  ): string {

    if (!timestamp) {
      return "Unknown";
    }

    return timestamp
      .toDate()
      .toLocaleString();
  }
}
