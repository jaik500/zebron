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

import {
  ContactMessage,
  ContactMessageStatus,
} from '../../../../core/models/contact-message.model';

import { ContactMessageService } from '../../../../core/services/contact-message.service';
import { ContactService } from '../../../../core/services/contact.service';

/**
 * Filter options used by the contact mailbox.
 */
type MailboxFilter =
  | 'all'
  | 'new'
  | 'read'
  | 'archived';

/**
 * Administrator mailbox for messages submitted
 * through the public Zebron contact form.
 *
 * This component is protected by the admin route guard.
 */
@Component({
  selector: 'app-contact-mailbox',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">

      <div class="mx-auto max-w-7xl">

        <!-- =====================================================
             PAGE HEADER
             ===================================================== -->
        <div
          class="mb-4 flex flex-col gap-4
                 rounded-xl bg-[#032D42] px-6 py-6
                 shadow-sm sm:flex-row sm:items-center
                 sm:justify-between"
        >

          <div>
            <h1
              class="text-2xl font-bold tracking-tight text-white"
            >
             Zebron Mailbox
            </h1>

            <p class="mt-1 text-sm text-white/80">
              Manage messages submitted through the
              Zebron contact form.
            </p>
          </div>

          <!-- =====================================================
               Header actions
               ===================================================== -->
          <div class="flex flex-wrap items-center gap-3">

            <!-- Admin dashboard -->
            <a
              routerLink="/admin"
              class="inline-flex items-center
                     justify-center rounded-lg
                     border border-gray-300
                     bg-white px-4 py-2
                     text-sm font-medium text-gray-700
                     transition
                     hover:bg-gray-50
                     hover:text-gray-900"
            >
              ← Admin Dashboard
            </a>

            <!-- New message -->
            <button
              type="button"
              (click)="newMessage()"
              class="inline-flex items-center
                     justify-center rounded-lg
                     bg-white px-4 py-2
                     text-sm font-semibold
                     text-[#032D42]
                     shadow-sm transition
                     hover:bg-gray-100"
            >
              + New Message
            </button>

            <!-- Refresh -->
            <button
              type="button"
              (click)="loadMessages()"
              [disabled]="loading()"
              class="inline-flex items-center
                     justify-center rounded-lg
                     bg-gray-900 px-4 py-2
                     text-sm font-medium text-white
                     transition hover:bg-gray-700
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >
              {{ loading() ? 'Refreshing...' : 'Refresh' }}
            </button>
<!-- More mailbox options -->
<div class="relative">

  <!-- Vertical three-dot menu button -->
  <button
    type="button"
    (click)="toggleMoreMenu()"
    class="inline-flex h-10 w-10
           items-center justify-center
           rounded-lg bg-white/10
           text-xl font-bold text-white
           transition hover:bg-white/20
           focus:outline-none
           focus:ring-2 focus:ring-white/40"
    aria-label="More mailbox options"
    aria-haspopup="menu"
    [attr.aria-expanded]="moreMenuOpen()"
  >
    ⋮
  </button>

  @if (moreMenuOpen()) {
    <div
      class="absolute right-0 z-50 mt-2 w-56
             overflow-hidden rounded-xl
             border border-gray-200
             bg-white shadow-xl"
      role="menu"
    >

      <!-- Inbox -->
      <a
        routerLink="/admin/contact"
        (click)="closeMoreMenu()"
        class="flex items-center gap-3
               px-4 py-3 text-sm font-medium
               text-gray-700 transition
               hover:bg-gray-50"
        role="menuitem"
      >
        <span class="text-base">📥</span>
        <span>Inbox</span>
      </a>

      <!-- Sent Emails -->
      <a
        routerLink="/admin/contact/sent"
        (click)="closeMoreMenu()"
        class="flex items-center gap-3
               px-4 py-3 text-sm font-medium
               text-gray-700 transition
               hover:bg-gray-50"
        role="menuitem"
      >
        <span class="text-base">📤</span>
        <span>Sent Emails</span>
      </a>

      <!-- Refresh -->
      <button
        type="button"
        (click)="loadMessages(); closeMoreMenu()"
        [disabled]="loading()"
        class="flex w-full items-center gap-3
               px-4 py-3 text-left
               text-sm font-medium text-gray-700
               transition hover:bg-gray-50
               disabled:cursor-not-allowed
               disabled:opacity-50"
        role="menuitem"
      >
        <span class="text-base">🔄</span>
        <span>
          {{ loading() ? 'Refreshing...' : 'Refresh' }}
        </span>
      </button>

      <!-- New Message -->
      <button
        type="button"
        (click)="newMessage(); closeMoreMenu()"
        class="flex w-full items-center gap-3
               px-4 py-3 text-left
               text-sm font-medium text-gray-700
               transition hover:bg-gray-50"
        role="menuitem"
      >
        <span class="text-base">✉️</span>
        <span>New Message</span>
      </button>

      <!-- Divider -->
      <div class="border-t border-gray-100"></div>

      <!-- Archived -->
      <button
        type="button"
        disabled
        class="flex w-full cursor-not-allowed
               items-center gap-3 px-4 py-3
               text-left text-sm font-medium
               text-gray-400"
        role="menuitem"
        title="Coming soon"
      >
        <span class="text-base">🗄️</span>
        <span>Archived</span>
      </button>

      <!-- Trash -->
      <button
        type="button"
        disabled
        class="flex w-full cursor-not-allowed
               items-center gap-3 px-4 py-3
               text-left text-sm font-medium
               text-gray-400"
        role="menuitem"
        title="Coming soon"
      >
        <span class="text-base">🗑️</span>
        <span>Trash</span>
      </button>

    </div>
  }

</div>

          </div>

        </div>


        <!-- =====================================================
             ERROR MESSAGE
             ===================================================== -->
        @if (error()) {

          <div
            class="mb-6 rounded-lg
                   border border-red-200
                   bg-red-50 p-4
                   text-sm text-red-700"
          >
            {{ error() }}
          </div>

        }


               <!-- =====================================================
             MAILBOX SEARCH
             ===================================================== -->
        <div class="mb-2">

          <label
            for="mailbox-search"
            class="sr-only"
          >
            Search mailbox
          </label>

          <div class="relative">

            <!-- Search icon -->
            <span
              class="pointer-events-none
                     absolute inset-y-0 left-0
                     flex items-center pl-4
                     text-gray-400"
              aria-hidden="true"
            >
              🔍
            </span>

            <input
              id="mailbox-search"
              type="search"
              [value]="searchQuery()"
              (input)="
                searchQuery.set(
                  $any($event.target).value
                )
              "
              placeholder="Search sender, email, subject, or message..."
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
                       text-gray-400
                       transition hover:text-gray-700"
                aria-label="Clear mailbox search"
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
                  ? 'message'
                  : 'messages'
              }}
            </p>
          }

        </div>



        <!-- =====================================================
             MAILBOX SUMMARY
             ===================================================== -->
        <div
          class="mb-4 grid grid-cols-1 gap-4
                 sm:grid-cols-2 lg:grid-cols-4"
        >
     
          <!-- All messages -->
          <button
            type="button"
            (click)="setFilter('all')"
            class="rounded-xl border
                   bg-white px-5 py-2 text-left
                   shadow-sm transition
                   hover:shadow-md"
            [class.ring-2]="filter() === 'all'"
          >
            <p class="text-sm font-medium text-gray-500">
              All Messages
            </p>

            <p class=" mt-1 text-3xl font-bold text-gray-900">
              {{ messages().length }}
            </p>
          </button>


          <!-- New messages -->
          <button
            type="button"
            (click)="setFilter('new')"
            class="rounded-xl border
                   bg-white px-5 py-2 text-left
                   shadow-sm transition
                   hover:shadow-md"
            [class.ring-2]="filter() === 'new'"
          >
            <p class="text-sm font-medium text-gray-500">
              New
            </p>

            <p class="mt-1 text-3xl font-bold text-blue-600">
              {{ newCount() }}
            </p>
          </button>


          <!-- Read messages -->
          <button
            type="button"
            (click)="setFilter('read')"
            class="rounded-xl border
                   bg-white px-5 py-2 text-left
                   shadow-sm transition
                   hover:shadow-md"
            [class.ring-2]="filter() === 'read'"
          >
            <p class="text-sm font-medium text-gray-500">
              Read
            </p>

            <p class="mt-1 text-3xl font-bold text-green-600">
              {{ readCount() }}
            </p>
          </button>


          <!-- Archived messages -->
          <button
            type="button"
            (click)="setFilter('archived')"
            class="rounded-xl border
                   bg-white px-5 py-2 text-left
                   shadow-sm transition
                   hover:shadow-md"
            [class.ring-2]="filter() === 'archived'"
          >
            <p class="text-sm font-medium text-gray-500">
              Archived
            </p>

            <p class="mt-1 text-3xl font-bold text-gray-500">
              {{ archivedCount() }}
            </p>
          </button>

        </div>


        


        <!-- =====================================================
             MESSAGE LIST
             ===================================================== -->
        <div
          class="overflow-hidden rounded-xl
                 border bg-white shadow-sm"
        >

          <!-- Loading -->
          @if (loading()) {

            <div
              class="p-8 text-center
                     text-sm text-gray-500"
            >
              Loading messages...
            </div>

          }

          <!-- Empty state -->
          @else if (filteredMessages().length === 0) {

            <div class="p-12 text-center">

              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full bg-gray-100
                       text-xl"
              >
                ✉
              </div>

              <h2
                class="mt-4 text-lg
                       font-semibold text-gray-900"
              >
                No messages
              </h2>

              <p
                class="mt-1 text-sm
                       text-gray-500"
              >
                There are no messages in this mailbox view.
              </p>

            </div>

          }

          <!-- Desktop table -->
          @else {

            <div class="overflow-x-auto">

              <table
                class="min-w-full
                       divide-y divide-gray-200"
              >

                <thead class="bg-gray-50">

                  <tr>

                    <th
                      class="px-6 py-3 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Sender
                    </th>

                    <th
                      class="px-6 py-3 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Subject
                    </th>

                    <th
                      class="px-6 py-3 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Date
                    </th>

                    <th
                      class="px-6 py-3 text-left
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Status
                    </th>

                    <th
                      class="px-6 py-3 text-right
                             text-xs font-semibold
                             uppercase tracking-wider
                             text-gray-500"
                    >
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody
                  class="divide-y
                         divide-gray-200 bg-white"
                >

                  @for (
                    message of filteredMessages();
                    track message.id
                  ) {

                    <tr
                      class="transition
                             hover:bg-gray-50"
                      [class.bg-blue-50]="
                        message.status === 'new'
                      "
                    >

                      <!-- Sender -->
                      <td
                        class="whitespace-nowrap
                               px-6 py-4"
                      >

                        <div
                          class="flex items-center gap-3"
                        >

                          <!-- New message indicator -->
                          @if (message.status === 'new') {

                            <span
                              class="h-2.5 w-2.5
                                     rounded-full bg-blue-600"
                              title="New message"
                            ></span>

                          }

                          <div>

                            <div
                              class="text-sm
                                     font-medium
                                     text-gray-900"
                            >
                              {{ message.name }}
                            </div>

                            <div
                              class="text-sm
                                     text-gray-500"
                            >
                              {{ message.email }}
                            </div>

                          </div>

                        </div>

                      </td>


                      <!-- Subject -->
                      <td
                        class="max-w-xs px-6 py-4"
                      >

                        <button
                          type="button"
                          (click)="openMessage(message)"
                          class="text-left"
                        >

                          <div
                            class="truncate text-sm
                                   font-medium
                                   text-gray-900
                                   hover:text-blue-600"
                            [class.font-bold]="
                              message.status === 'new'
                            "
                          >
                            {{ message.subject }}
                          </div>

                          <div
                            class="mt-1 truncate
                                   text-sm text-gray-500"
                          >
                            {{ message.message }}
                          </div>

                        </button>

                      </td>


                      <!-- Date -->
                      <td
                        class="whitespace-nowrap
                               px-6 py-4
                               text-sm text-gray-500"
                      >
                        {{ formatDate(message) }}
                      </td>


                      <!-- Status -->
                      <td
                        class="whitespace-nowrap
                               px-6 py-4"
                      >

                        <span
                          class="inline-flex
                                 rounded-full px-2.5 py-1
                                 text-xs font-medium"
                          [class.bg-blue-100]="
                            message.status === 'new'
                          "
                          [class.text-blue-700]="
                            message.status === 'new'
                          "
                          [class.bg-green-100]="
                            message.status === 'read'
                          "
                          [class.text-green-700]="
                            message.status === 'read'
                          "
                          [class.bg-gray-100]="
                            message.status === 'archived'
                          "
                          [class.text-gray-700]="
                            message.status === 'archived'
                          "
                        >
                          {{ message.status }}
                        </span>

                      </td>


                      <!-- Actions -->
                      <td
                        class="whitespace-nowrap
                               px-6 py-4 text-right"
                      >

                        <div
                          class="flex justify-end gap-2"
                        >

                          <!-- Open -->
                          <button
                            type="button"
                            (click)="openMessage(message)"
                            class="rounded-md px-3 py-1.5
                                   text-sm font-medium
                                   text-blue-600
                                   hover:bg-blue-50"
                          >
                            View
                          </button>


                          <!-- Archive / unarchive -->
                          @if (
                            message.status === 'archived'
                          ) {

                            <button
                              type="button"
                              (click)="
                                unarchiveMessage(message)
                              "
                              class="rounded-md px-3 py-1.5
                                     text-sm font-medium
                                     text-gray-600
                                     hover:bg-gray-100"
                            >
                              Restore
                            </button>

                          } @else {

                            <button
                              type="button"
                              (click)="
                                archiveMessage(message)
                              "
                              class="rounded-md px-3 py-1.5
                                     text-sm font-medium
                                     text-gray-600
                                     hover:bg-gray-100"
                            >
                              Archive
                            </button>

                          }


                          <!-- Delete -->
                          <button
                            type="button"
                            (click)="deleteMessage(message)"
                            class="rounded-md px-3 py-1.5
                                   text-sm font-medium
                                   text-red-600
                                   hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  }

                </tbody>

              </table>

            </div>

          }

        </div>

      </div>

    </div>


    <!-- =======================================================
         MESSAGE DETAIL MODAL
         ======================================================= -->
    @if (selectedMessage()) {

      <div
        class="fixed inset-0 z-50
               flex items-center justify-center
               bg-black/50 p-4"
        (click)="closeMessage()"
      >

        <div
          class="max-h-[90vh] w-full max-w-2xl
                 overflow-y-auto rounded-xl
                 bg-white shadow-2xl"
          (click)="$event.stopPropagation()"
        >

          <!-- Modal header -->
          <div
            class="flex items-start
                   justify-between
                   border-b px-6 py-5"
          >

            <div>

              <h2
                class="text-xl font-bold
                       text-gray-900"
              >
                {{ selectedMessage()!.subject }}
              </h2>

              <p
                class="mt-1 text-sm
                       text-gray-500"
              >
                {{ formatDate(selectedMessage()!) }}
              </p>

            </div>

            <button
              type="button"
              (click)="closeMessage()"
              class="rounded-lg p-2
                     text-gray-500
                     hover:bg-gray-100
                     hover:text-gray-900"
              aria-label="Close message"
            >
              ✕
            </button>

          </div>


          <!-- Sender information -->
          <div
            class="border-b bg-gray-50
                   px-6 py-5"
          >

            <div
              class="grid gap-4 sm:grid-cols-2"
            >

              <div>

                <p
                  class="text-xs font-semibold
                         uppercase tracking-wide
                         text-gray-500"
                >
                  From
                </p>

                <p
                  class="mt-1 text-sm
                         font-medium text-gray-900"
                >
                  {{ selectedMessage()!.name }}
                </p>

              </div>


              <div>

                <p
                  class="text-xs font-semibold
                         uppercase tracking-wide
                         text-gray-500"
                >
                  Email
                </p>

                <a
                  [href]="
                    'mailto:' +
                    selectedMessage()!.email
                  "
                  class="mt-1 block text-sm
                         font-medium text-blue-600
                         hover:underline"
                >
                  {{ selectedMessage()!.email }}
                </a>

              </div>

            </div>

          </div>


          <!-- Message body -->
          <div class="px-6 py-6">

            <p
              class="whitespace-pre-wrap
                     text-sm leading-7
                     text-gray-700"
            >
              {{ selectedMessage()!.message }}
            </p>

          </div>


          <!-- Modal actions -->
          <div
            class="flex flex-wrap items-center justify-between
                   gap-3 border-t px-6 py-4"
          >

            <!-- Reply stays at the far left -->
            <button
              type="button"
              (click)="replyToMessage(selectedMessage()!)"
              class="rounded-lg bg-[#032D42]
                     px-4 py-2 text-sm font-medium
                     text-white transition
                     hover:bg-[#064B68]"
            >
              Reply
            </button>

          </div>

        </div>

      </div>

    }

      <!-- =====================================================
           EMAIL COMPOSER
           ===================================================== -->
      @if (composeMode() !== "none") {

        <div
          class="fixed inset-0 z-50 flex items-center
                 justify-center bg-black/50 px-4 py-6"
          (click)="closeComposer()"
        >

          <div
            class="w-full max-w-2xl overflow-hidden
                   rounded-xl bg-white shadow-2xl"
            (click)="$event.stopPropagation()"
          >

            <!-- Composer header -->
            <div
              class="flex items-center justify-between
                     bg-[#032D42] px-6 py-4"
            >

              <div>
                <h2 class="text-lg font-semibold text-white">
                  {{ composeMode() === "reply"
                    ? "Reply to Message"
                    : "New Message" }}
                </h2>

                <p class="mt-1 text-sm text-white/70">
                  Send an email from Zebron.
                </p>
              </div>

              <button
                type="button"
                (click)="closeComposer()"
                [disabled]="sending()"
                class="rounded-lg p-2 text-white/80
                       transition hover:bg-white/10
                       hover:text-white
                       disabled:opacity-50"
                aria-label="Close composer"
              >
                ✕
              </button>

            </div>

            <!-- Composer form -->
            <form
              class="space-y-5 px-6 py-6"
              (submit)="$event.preventDefault(); sendComposedMessage()"
            >

              <!-- Recipient -->
              <div>
                <label
                  for="compose-to"
                  class="block text-sm font-medium text-gray-700"
                >
                  To
                </label>

                <input
                  id="compose-to"
                  type="email"
                  [value]="composeTo()"
                  (input)="composeTo.set($any($event.target).value)"
                  placeholder="recipient@example.com"
                  required
                  [disabled]="sending()"
                  class="mt-1 w-full rounded-lg border
                         border-gray-300 px-3 py-2
                         text-sm text-gray-900
                         outline-none focus:border-[#032D42]
                         focus:ring-2 focus:ring-[#032D42]/20
                         disabled:bg-gray-100"
                />
              </div>

              <!-- Subject -->
              <div>
                <label
                  for="compose-subject"
                  class="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>

                <input
                  id="compose-subject"
                  type="text"
                  [value]="composeSubject()"
                  (input)="composeSubject.set($any($event.target).value)"
                  placeholder="Message subject"
                  required
                  [disabled]="sending()"
                  class="mt-1 w-full rounded-lg border
                         border-gray-300 px-3 py-2
                         text-sm text-gray-900
                         outline-none focus:border-[#032D42]
                         focus:ring-2 focus:ring-[#032D42]/20
                         disabled:bg-gray-100"
                />
              </div>

              <!-- Message -->
              <div>
                <label
                  for="compose-message"
                  class="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>

                <textarea
                  id="compose-message"
                  rows="8"
                  [value]="composeMessage()"
                  (input)="composeMessage.set($any($event.target).value)"
                  placeholder="Write your message..."
                  required
                  [disabled]="sending()"
                  class="mt-1 w-full resize-y rounded-lg border
                         border-gray-300 px-3 py-2
                         text-sm leading-6 text-gray-900
                         outline-none focus:border-[#032D42]
                         focus:ring-2 focus:ring-[#032D42]/20
                         disabled:bg-gray-100"
                ></textarea>
              </div>

              <!-- Composer actions -->
              <div
                class="flex justify-end gap-3 border-t pt-5"
              >
                <button
                  type="button"
                  (click)="closeComposer()"
                  [disabled]="sending()"
                  class="rounded-lg border border-gray-300
                         bg-white px-4 py-2 text-sm font-medium
                         text-gray-700 transition
                         hover:bg-gray-50
                         disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="sending()"
                  class="rounded-lg bg-[#032D42] px-5 py-2
                         text-sm font-semibold text-white
                         transition hover:bg-[#064B68]
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
                >
                  {{ sending() ? "Sending..." : "Send Message" }}
                </button>
              </div>

            </form>

          </div>

        </div>

      }

        <!-- Success toast -->
        @if (toastMessage()) {
          <div
            class="fixed bottom-6 right-6 z-[100]
                   flex items-center gap-3
                   rounded-xl bg-green-600
                   px-5 py-4 text-sm font-semibold
                   text-white shadow-2xl"
            role="status"
            aria-live="polite"
          >
            <span
              class="flex h-6 w-6 items-center justify-center
                     rounded-full bg-white/20"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>{{ toastMessage() }}</span>
          </div>
        }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactMailboxComponent
  implements OnInit {

  /**
   * Contact message service used for all
   * mailbox Firestore operations.
   */
  /**
   * Contact service used for administrator email delivery.
   */
  private readonly contactService = inject(ContactService);

  private readonly contactMessageService =
    inject(ContactMessageService);

  /**
   * All messages loaded from Firestore.
   */
  readonly messages =
    signal<ContactMessage[]>([]);

  /**
 * Current mailbox search text.
 *
 * Searches sender name, sender email,
 * subject, and message body.
 */
readonly searchQuery =
  signal("");

  /**
   * Currently selected mailbox filter.
   */
  readonly filter =
    signal<MailboxFilter>('all');

  /**
   * Currently opened message.
   */
  readonly selectedMessage =
    signal<ContactMessage | null>(null);

  /**
   * Loading state.
   */
  readonly loading =
    signal(false);

  /**
   * Error message displayed to the administrator.
   */
  readonly error =
    signal<string | null>(null);

  /**
   * Number of new messages.
   */
  readonly newCount =
    computed(
      () =>
        this.messages().filter(
          (message) =>
            message.status === 'new',
        ).length,
    );

  /**
   * Number of read messages.
   */
  readonly readCount =
    computed(
      () =>
        this.messages().filter(
          (message) =>
            message.status === 'read',
        ).length,
    );

  /**
   * Number of archived messages.
   */
  readonly archivedCount =
    computed(
      () =>
        this.messages().filter(
          (message) =>
            message.status === 'archived',
        ).length,
    );

  /**
 * Messages displayed for the currently
 * selected status filter and search query.
 *
 * Search is performed locally against:
 * - Sender name
 * - Sender email address
 * - Subject
 * - Message body
 *
 * This avoids another Firestore request
 * whenever the administrator searches.
 */
readonly filteredMessages =
  computed(() => {

    const currentFilter =
      this.filter();

    const search =
      this.searchQuery()
        .trim()
        .toLowerCase();

    return this.messages().filter(
      (message) => {

        /**
         * Apply the status filter first.
         */
        const matchesStatus =
          currentFilter === 'all' ||
          message.status === currentFilter;

        if (!matchesStatus) {
          return false;
        }

        /**
         * No search text means every message
         * matching the status filter is displayed.
         */
        if (!search) {
          return true;
        }

        /**
         * Search across the important mailbox
         * fields.
         */
        return (
          message.name
            ?.toLowerCase()
            .includes(search) ||

          message.email
            ?.toLowerCase()
            .includes(search) ||

          message.subject
            ?.toLowerCase()
            .includes(search) ||

          message.message
            ?.toLowerCase()
            .includes(search)
        );
      },
    );
  });

  /**
   * Load messages when the mailbox opens.
   */
  ngOnInit(): void {
    console.log(
      '========== CONTACT MAILBOX LOADED =========='
    );

    console.log(
      'ContactMailboxComponent initialized'
    );

    this.loadMessages();
  }

  /**
   * Retrieve all contact messages.
   */
  async loadMessages(): Promise<void> {

    this.loading.set(true);
    this.error.set(null);

    try {

      const messages =
        await this.contactMessageService
          .getAllContactMessages();

      this.messages.set(messages);

    } catch (error) {

      console.error(
        'Failed to load contact messages:',
        error,
      );

      this.error.set(
        'Unable to load contact messages. Please try again.',
      );

    } finally {

      this.loading.set(false);

    }
  }

  /**
   * Change the mailbox filter.
   */
  setFilter(
    filter: MailboxFilter,
  ): void {
    this.filter.set(filter);
  }

  /**
   * Open a message.
   *
   * New messages are automatically marked as read
   * when the administrator opens them.
   */
  async openMessage(
    message: ContactMessage,
  ): Promise<void> {

    this.selectedMessage.set(message);

    if (message.status === 'new') {
      await this.markAsRead(message);
    }
  }

  /**
   * Close the message detail modal.
   */
  closeMessage(): void {
    this.selectedMessage.set(null);
  }

  /**
   * Mark a message as read.
   */
  async markAsRead(
    message: ContactMessage,
  ): Promise<void> {

    try {

      await this.contactMessageService
        .markAsRead(message.id);

      this.updateLocalStatus(
        message.id,
        'read',
      );

    } catch (error) {

      console.error(
        'Failed to mark message as read:',
        error,
      );

      this.error.set(
        'Unable to mark the message as read.',
      );

    }
  }

  /**
   * Archive a message.
   */
  async archiveMessage(
    message: ContactMessage,
  ): Promise<void> {

    try {

      await this.contactMessageService
        .archiveMessage(message.id);

      this.updateLocalStatus(
        message.id,
        'archived',
      );

      this.closeMessage();

    } catch (error) {

      console.error(
        'Failed to archive message:',
        error,
      );

      this.error.set(
        'Unable to archive the message.',
      );

    }
  }

  /**
   * Restore an archived message.
   */
  async unarchiveMessage(
    message: ContactMessage,
  ): Promise<void> {

    try {

      await this.contactMessageService
        .unarchiveMessage(message.id);

      this.updateLocalStatus(
        message.id,
        'read',
      );

      this.closeMessage();

    } catch (error) {

      console.error(
        'Failed to restore message:',
        error,
      );

      this.error.set(
        'Unable to restore the message.',
      );

    }
  }

  /**
   * Permanently delete a message.
   */
  async deleteMessage(
    message: ContactMessage,
  ): Promise<void> {

    const confirmed =
      window.confirm(
        `Delete the message from ${message.name}? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {

      await this.contactMessageService
        .deleteMessage(message.id);

      this.messages.update(
        (messages) =>
          messages.filter(
            (item) =>
              item.id !== message.id,
          ),
      );

      this.closeMessage();

    } catch (error) {

      console.error(
        'Failed to delete contact message:',
        error,
      );

      this.error.set(
        'Unable to delete the message.',
      );
    }
  }

  /**
   * Update the local signal after changing
   * a message status in Firestore.
   */
  /**
   * Controls the administrator email composer.
   */
  readonly composeMode = signal<"none" | "reply" | "new">("none");

  /** Recipient of the composed message. */
  readonly composeTo = signal("");

  /** Subject of the composed message. */
  readonly composeSubject = signal("");

  /** Body of the composed message. */
  readonly composeMessage = signal("");

    /** Indicates that an email is being sent. */
  readonly sending = signal(false);

  /**
   * Controls the vertical three-dot mailbox menu.
   */
  readonly moreMenuOpen = signal(false);

  /**
   * Toggle the vertical three-dot mailbox menu.
   */
  toggleMoreMenu(): void {
    this.moreMenuOpen.update(
      (open) => !open,
    );
  }

  /**
   * Close the vertical three-dot mailbox menu.
   */
  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  /** Success message displayed after an email is sent. */
  readonly toastMessage = signal<string | null>(null);

  /** Timer used to automatically hide the success toast. */
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Open a reply composer for a mailbox message.
   */
  replyToMessage(message: ContactMessage): void {
    this.composeMode.set("reply");
    this.composeTo.set(message.email);
    this.composeSubject.set(
      message.subject.toLowerCase().startsWith("re:")
        ? message.subject
        : `Re: ${message.subject}`,
    );
    this.composeMessage.set("");
  }

  /**
   * Open a blank composer for a new message.
   */
  newMessage(): void {
    this.composeMode.set("new");
    this.composeTo.set("");
    this.composeSubject.set("");
    this.composeMessage.set("");
  }

  /**
   * Display a temporary success toast.
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

  /** Close the administrator email composer. */
  closeComposer(): void {
    if (this.sending()) {
      return;
    }

    this.composeMode.set("none");
    this.composeTo.set("");
    this.composeSubject.set("");
    this.composeMessage.set("");
  }

  /**
   * Send a reply or a new administrator message.
   */
  async sendComposedMessage(): Promise<void> {
    const to = this.composeTo().trim();
    const subject = this.composeSubject().trim();
    const message = this.composeMessage().trim();

    if (!to || !subject || !message) {
      this.error.set(
        "Recipient, subject, and message are required.",
      );
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    try {
      if (this.composeMode() === "reply") {
        const selected = this.selectedMessage();

        if (!selected) {
          throw new Error(
            "No contact message is selected.",
          );
        }

        await this.contactService.sendReply({
          messageId: selected.id,
          to,
          subject,
          message,
        });
      } else {
        await this.contactService.sendNewMessage({
          to,
          subject,
          message,
        });
      }

      // Firebase confirmed the message was sent successfully.
      // Reset and close the composer before showing the toast.
      this.composeMode.set("none");
      this.composeTo.set("");
      this.composeSubject.set("");
      this.composeMessage.set("");

      this.showSuccessToast("Message sent successfully.");
    } catch (error) {
      console.error(
        "Failed to send email:",
        error,
      );

      this.error.set(
        "Unable to send the email. Please try again.",
      );
    } finally {
      this.sending.set(false);
    }
  }

  private updateLocalStatus(
    messageId: string,
    status: ContactMessageStatus,
  ): void {

    this.messages.update(
      (messages) =>
        messages.map(
          (message) =>
            message.id === messageId
              ? {
                  ...message,
                  status,
                }
              : message,
        ),
    );

    /*
     * Keep the opened message synchronized with
     * the updated local status.
     */
    this.selectedMessage.update(
      (message) =>
        message?.id === messageId
          ? {
              ...message,
              status,
            }
          : message,
    );
  }

  /**
   * Convert a Firestore Timestamp into a
   * displayable JavaScript Date.
   */
  formatDate(
    message: ContactMessage,
  ): Date | string {

    if (
      message.createdAt &&
      typeof message.createdAt.toDate === 'function'
    ) {
      return message.createdAt.toDate();
    }

    return 'Unknown date';
  }
}
