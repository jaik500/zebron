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
    RouterLink,
  ],
  template: `

   <!-- ============================================================
         PAGE
         ============================================================ -->

           <!-- ========================================================
             PAGE HEADER
             ======================================================== -->

        <div
          class="mb-2 flex flex-col gap-4
                 bg-[#032D42]
                 px-5 py-6 shadow-sm
                 sm:flex-row
                 sm:items-center
                 sm:justify-between
                 sticky top-0 z-50"
        >

          <!-- Title -->
          <div>

            <div
              class="flex items-center gap-3"
            >

              <h1
                class="text-xl font-bold
                       tracking-tight
                       text-white
                       sm:text-2xl"
              >
                Sent Mails
              </h1>

              <span
                class="rounded-full
                       bg-white/10
                       px-2.5 py-1
                       text-xs font-medium
                       text-white/80"
              >
                {{ messages().length }}
              </span>

            </div>

            <p
              class="mt-1 text-sm
                     text-white/70"
            >
              Emails sent from the
              Zebron administrator mailbox.
            </p>

          </div>

          <!-- Header actions -->
          <div
            class="flex flex-wrap gap-2"
          >

            <!-- New Email -->
            <button
              type="button"
              (click)="newMessage()"
              class="inline-flex items-center
                     justify-center
                     rounded-lg
                     bg-white
                     px-3.5 py-2
                     text-sm font-semibold
                     text-[#032D42]
                     shadow-sm
                     transition
                     hover:bg-gray-100"
            >
              + New Email
            </button>

            <!-- Refresh -->
            <button
              type="button"
              (click)="loadMessages()"
              [disabled]="loading()"
              class="inline-flex items-center
                     justify-center
                     rounded-lg
                     border border-white/20
                     px-3.5 py-2
                     text-sm font-medium
                     text-white
                     transition
                     hover:bg-white/10
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >

              <span
                class="text-base"
                aria-hidden="true"
              >
                ↻
              </span>

              <span class="ml-2">
                {{ loading() ? 'Refreshing...' : 'Refresh' }}
              </span>

            </button>

            <!-- Inbox -->
            <a
              routerLink="/admin/contact"
              class="inline-flex items-center
                     justify-center
                     rounded-lg
                     bg-white
                     px-3.5 py-2
                     text-sm font-semibold
                     text-[#032D42]
                     shadow-sm
                     transition
                     hover:bg-gray-100"
            >
              ← Inbox
            </a>

            <!-- Dashboard -->
            <a
              routerLink="/admin"
              class="inline-flex items-center
                     justify-center
                     rounded-lg
                     border border-white/20
                     px-3.5 py-2
                     text-sm font-medium
                     text-white
                     transition
                     hover:bg-white/10"
            >
              Dashboard
            </a>

            <!-- More actions -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleHeaderMenu()"
                class="inline-flex h-10 w-10
                       items-center justify-center
                       rounded-lg
                       border border-white/20
                       text-xl
                       font-bold
                       text-white
                       transition
                       hover:bg-white/10"
                aria-label="More sent mailbox actions"
                [attr.aria-expanded]="headerMenuOpen()"
              >
                ⋮
              </button>

              @if (headerMenuOpen()) {
                <div
                  class="absolute right-0 top-full z-[80]
                         mt-2 w-56 overflow-hidden
                         rounded-xl border border-gray-200
                         bg-white py-1 shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    (click)="generateSentMessagesPdf()"
                    [disabled]="messages().length === 0"
                    class="flex w-full items-center gap-3
                           px-4 py-3 text-left text-sm
                           font-medium text-gray-700
                           transition hover:bg-gray-50
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                    role="menuitem"
                  >
                    <span aria-hidden="true">📄</span>
                    <span>
                      <span class="block font-semibold">
                        Generate PDF
                      </span>
                      <span class="block text-xs text-gray-400">
                        Export all sent records
                      </span>
                    </span>
                  </button>
                </div>
              }
            </div>

          </div>

        </div>

    <div
      class="min-h-screen bg-gray-50
             px-4 py-2
             sm:px-2
             lg:px-8"
    >

      <div class="mx-auto max-w-7xl">

        <!-- ========================================================
             SEARCH
             ======================================================== -->

        <div class="mb-5">

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
              id="sent-email-search"
              type="search"
              [value]="searchQuery()"
              (input)="
                searchQuery.set(
                  $any($event.target).value
                )
              "
              placeholder="Search recipient, sender, subject, or message..."
              autocomplete="off"
              class="w-full
                     rounded-xl
                     border border-gray-300
                     bg-white
                     py-3
                     pl-11
                     pr-10
                     text-sm
                     text-gray-900
                     shadow-sm
                     outline-none
                     transition
                     placeholder:text-gray-400
                     focus:border-[#032D42]
                     focus:ring-2
                     focus:ring-[#032D42]/20"
            />

            <!-- Clear -->
            @if (searchQuery()) {

              <button
                type="button"
                (click)="searchQuery.set('')"
                class="absolute
                       inset-y-0
                       right-0
                       flex items-center
                       px-4
                       text-gray-400
                       transition
                       hover:text-gray-700"
                aria-label="Clear search"
              >
                ✕
              </button>

            }

          </div>

          <!-- Search count -->
          @if (searchQuery()) {

            <p
              class="mt-2 text-xs
                     text-gray-500"
            >
              Showing
              <span
                class="font-semibold
                       text-gray-700"
              >
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


        <!-- ========================================================
             ERROR
             ======================================================== -->

        @if (error()) {

          <div
            class="mb-5 rounded-xl
                   border border-red-200
                   bg-red-50
                   px-5 py-4
                   text-sm text-red-700"
            role="alert"
          >
            {{ error() }}
          </div>

        }


        <!-- ========================================================
             LOADING
             ======================================================== -->

        @if (loading()) {

          <div
            class="rounded-xl
                   border border-gray-200
                   bg-white
                   p-10
                   text-center
                   shadow-sm"
          >

            <div
              class="mx-auto h-8 w-8
                     animate-spin
                     rounded-full
                     border-4
                     border-gray-200
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


        <!-- ========================================================
             EMPTY STATE
             ======================================================== -->

        @else if (messages().length === 0) {

          <div
            class="rounded-xl
                   border border-gray-200
                   bg-white
                   p-10
                   text-center
                   shadow-sm"
          >

            <div
              class="mx-auto flex h-14 w-14
                     items-center justify-center
                     rounded-full
                     bg-gray-100
                     text-2xl"
            >
              ✉
            </div>

            <h2
              class="mt-4 text-lg
                     font-semibold
                     text-gray-900"
            >
              No Sent Emails
            </h2>

            <p
              class="mx-auto mt-2
                     max-w-md
                     text-sm leading-6
                     text-gray-500"
            >
              Emails sent from the administrator
              mailbox will appear here.
            </p>

          </div>

        }


        <!-- ========================================================
             SEARCH EMPTY STATE
             ======================================================== -->

        @else if (filteredMessages().length === 0) {

          <div
            class="rounded-xl
                   border border-gray-200
                   bg-white
                   p-10
                   text-center
                   shadow-sm"
          >

            <div
              class="mx-auto flex h-12 w-12
                     items-center justify-center
                     rounded-full
                     bg-gray-100
                     text-xl"
            >
              🔍
            </div>

            <h2
              class="mt-4 text-base
                     font-semibold
                     text-gray-900"
            >
              No matching emails
            </h2>

            <p
              class="mt-2 text-sm
                     text-gray-500"
            >
              Try a different recipient,
              subject, sender, or message.
            </p>

            <button
              type="button"
              (click)="searchQuery.set('')"
              class="mt-4 rounded-lg
                     bg-[#032D42]
                     px-4 py-2
                     text-sm font-semibold
                     text-white
                     transition
                     hover:bg-[#064b68]"
            >
              Clear Search
            </button>

          </div>

        }


        <!-- ========================================================
             SENT MAILBOX
             ======================================================== -->

        @else {

          <div
            class="overflow-hidden
                   rounded-xl
                   border border-gray-200
                   bg-white
                   shadow-sm"
          >

            <!-- ==================================================
                 DESKTOP TABLE
                 ================================================== -->

            <div class="hidden md:block">

              <table
                class="min-w-full
                       table-fixed
                       divide-y
                       divide-gray-200"
              >

                <thead
                  class="bg-gray-50"
                >

                  <tr>

                    <!-- Recipient -->
                    <th
                      scope="col"
                      class="w-[25%]
                             px-5 py-3.5
                             text-left
                             text-xs font-semibold
                             uppercase
                             tracking-wider
                             text-gray-500"
                    >
                      Recipient
                    </th>

                    <!-- Subject -->
                    <th
                      scope="col"
                      class="w-[35%]
                             px-5 py-3.5
                             text-left
                             text-xs font-semibold
                             uppercase
                             tracking-wider
                             text-gray-500"
                    >
                      Subject
                    </th>

                    <!-- Type -->
                    <th
                      scope="col"
                      class="w-[12%]
                             px-5 py-3.5
                             text-left
                             text-xs font-semibold
                             uppercase
                             tracking-wider
                             text-gray-500"
                    >
                      Type
                    </th>

                    <!-- Sent -->
                    <th
                      scope="col"
                      class="w-[16%]
                             px-5 py-3.5
                             text-left
                             text-xs font-semibold
                             uppercase
                             tracking-wider
                             text-gray-500"
                    >
                      Sent
                    </th>

                    <!-- Actions -->
                    <th
                      scope="col"
                      class="w-[12%]
                             px-5 py-3.5
                             text-right
                             text-xs font-semibold
                             uppercase
                             tracking-wider
                             text-gray-500"
                    >
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody
                  class="divide-y
                         divide-gray-100"
                >

                  @for (
                    message of filteredMessages();
                    track message.id
                  ) {

                    <tr
                      class="transition
                             hover:bg-gray-50"
                    >

                      <!-- ======================================
                           RECIPIENT
                           ====================================== -->

                      <td
                        class="px-5 py-4
                               align-top"
                      >

                        <div
                          class="break-words
                                 text-sm
                                 font-semibold
                                 text-gray-900"
                        >
                          {{ message.to }}
                        </div>

                        <div
                          class="mt-1
                                 break-words
                                 text-xs
                                 text-gray-400"
                        >
                          From {{ message.from }}
                        </div>

                      </td>


                      <!-- ======================================
                           SUBJECT
                           ====================================== -->

                      <td
                        class="px-5 py-4
                               align-top"
                      >

                        <div
                          class="break-words
                                 whitespace-normal
                                 text-sm
                                 font-medium
                                 text-gray-900"
                        >
                          {{ message.subject }}
                        </div>

                        <div
                          class="mt-1
                                 line-clamp-2
                                 break-words
                                 text-xs
                                 leading-5
                                 text-gray-500"
                        >
                          {{ message.message }}
                        </div>

                      </td>


                      <!-- ======================================
                           TYPE
                           ====================================== -->

                      <td
                        class="px-5 py-4
                               align-top"
                      >

                        <span
                          class="inline-flex
                                 rounded-full
                                 bg-gray-100
                                 px-2.5 py-1
                                 text-xs
                                 font-medium
                                 text-gray-700"
                        >
                          {{ getMessageTypeLabel(message) }}
                        </span>

                      </td>


                      <!-- ======================================
                           DATE
                           ====================================== -->

                      <td
                        class="whitespace-nowrap
                               px-5 py-4
                               align-top
                               text-sm
                               text-gray-500"
                      >
                        {{ formatDate(message.createdAt) }}
                      </td>


                      <!-- ======================================
                           ACTION
                           ====================================== -->

                      <td
                        class="px-5 py-4
                               text-right
                               align-top"
                      >

                        <button
                          type="button"
                          (click)="openMessage(message)"
                          class="rounded-lg
                                 bg-[#032D42]
                                 px-3 py-2
                                 text-xs
                                 font-semibold
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


            <!-- ==================================================
                 MOBILE MAILBOX
                 ================================================== -->

            <div
              class="divide-y
                     divide-gray-100
                     md:hidden"
            >

              @for (
                message of filteredMessages();
                track message.id
              ) {

                <div
                  class="p-5"
                >

                  <!-- Top row -->
                  <div
                    class="flex
                           items-start
                           justify-between
                           gap-3"
                  >

                    <div
                      class="min-w-0"
                    >

                      <!-- Recipient -->
                      <p
                        class="break-words
                               text-sm
                               font-semibold
                               text-gray-900"
                      >
                        {{ message.to }}
                      </p>

                      <!-- Subject -->
                      <p
                        class="mt-1
                               break-words
                               text-sm
                               font-medium
                               text-gray-800"
                      >
                        {{ message.subject }}
                      </p>

                    </div>


                    <!-- Type -->
                    <span
                      class="shrink-0
                             rounded-full
                             bg-gray-100
                             px-2.5 py-1
                             text-xs
                             font-medium
                             text-gray-700"
                    >
                      {{ getMessageTypeLabel(message) }}
                    </span>

                  </div>


                  <!-- From -->
                  <p
                    class="mt-1
                           break-words
                           text-xs
                           text-gray-400"
                  >
                    From {{ message.from }}
                  </p>


                  <!-- Message preview -->
                  <p
                    class="mt-3
                           line-clamp-2
                           break-words
                           text-sm
                           leading-6
                           text-gray-500"
                  >
                    {{ message.message }}
                  </p>


                  <!-- Bottom row -->
                  <div
                    class="mt-4
                           flex
                           items-center
                           justify-between
                           gap-3"
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
                             text-xs
                             font-semibold
                             text-white
                             transition
                             hover:bg-[#064b68]"
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


      <!-- ==========================================================
           MESSAGE DETAIL MODAL
           ========================================================== -->
@if (selectedMessage()) {

  <!-- ==========================================================
       SENT MESSAGE VIEW MODAL
       ========================================================== -->

  <div
    class="fixed inset-0 z-50
           flex items-center justify-center
           bg-black/50 px-4 py-5"
    role="dialog"
    aria-modal="true"
    aria-label="Sent email"
    (click)="closeMessage()"
  >

    <div
      class="w-full max-w-xl
             overflow-hidden
             rounded-xl
             bg-white
             shadow-2xl"
      (click)="$event.stopPropagation()"
    >

      <!-- ======================================================
           HEADER
           ====================================================== -->

      <div
        class="flex items-center
               justify-between gap-4
               border-b border-gray-200
               px-5 py-3.5"
      >

        <div class="min-w-0">

          <div
            class="flex items-center gap-2"
          >

            <span
              class="shrink-0
                     rounded-full
                     bg-gray-100
                     px-2 py-0.5
                     text-[11px]
                     font-semibold
                     text-gray-700"
            >
              {{ getMessageTypeLabel(selectedMessage()!) }}
            </span>

            <span
              class="text-xs
                     text-gray-400"
            >
              Sent
            </span>

          </div>

          <h2
            class="mt-1 truncate
                   text-base
                   font-semibold
                   text-gray-900"
            [title]="selectedMessage()!.subject"
          >
            {{ selectedMessage()!.subject }}
          </h2>

        </div>

        <!-- Close -->
        <button
          type="button"
          (click)="closeMessage()"
          class="shrink-0
                 rounded-lg
                 p-2
                 text-lg
                 leading-none
                 text-gray-400
                 transition
                 hover:bg-gray-100
                 hover:text-gray-700"
          aria-label="Close message"
        >
          ×
        </button>

      </div>


      <!-- ======================================================
           MESSAGE DETAILS
           ====================================================== -->

      <div
        class="max-h-[60vh]
               overflow-y-auto
               px-5 py-4"
      >

        <!-- Recipient -->
        <div
          class="flex gap-3"
        >

          <span
            class="w-12 shrink-0
                   text-xs
                   font-semibold
                   text-gray-400"
          >
            To
          </span>

          <span
            class="min-w-0
                   break-words
                   text-sm
                   text-gray-900"
          >
            {{ selectedMessage()!.to }}
          </span>

        </div>


        <!-- From -->
        <div
          class="mt-2 flex gap-3"
        >

          <span
            class="w-12 shrink-0
                   text-xs
                   font-semibold
                   text-gray-400"
          >
            From
          </span>

          <span
            class="min-w-0
                   break-words
                   text-sm
                   text-gray-700"
          >
            {{ selectedMessage()!.from }}
          </span>

        </div>


        <!-- Sent date -->
        <div
          class="mt-2 flex gap-3"
        >

          <span
            class="w-12 shrink-0
                   text-xs
                   font-semibold
                   text-gray-400"
          >
            Date
          </span>

          <span
            class="text-sm
                   text-gray-500"
          >
            {{ formatDate(
              selectedMessage()!.createdAt
            ) }}
          </span>

        </div>


        <!-- Message -->
        <div class="mt-4">

          <div
            class="mb-2 text-xs
                   font-semibold
                   uppercase
                   tracking-wide
                   text-gray-400"
          >
            Message
          </div>

          <div
            class="whitespace-pre-wrap
                   break-words
                   rounded-lg
                   border border-gray-200
                   bg-gray-50
                   px-4 py-3
                   text-sm
                   leading-6
                   text-gray-700"
          >
            {{ selectedMessage()!.message }}
          </div>

        </div>

      </div>


      <!-- ======================================================
           FOOTER ACTIONS
           ====================================================== -->

      <div
        class="flex items-center
               justify-between
               border-t border-gray-200
               bg-gray-50
               px-5 py-3"
      >

        <!-- Destructive action -->
        <button
          type="button"
          (click)="deleteMessage()"
          class="inline-flex
                 items-center
                 rounded-lg
                 border border-red-200
                 bg-white
                 px-3 py-2
                 text-xs
                 font-semibold
                 text-red-600
                 transition
                 hover:bg-red-50"
        >
          🗑
          <span class="ml-1.5">
            Delete
          </span>
        </button>


        <div
          class="flex items-center
                 gap-2"
        >

          <!-- Print -->
          <button
            type="button"
            (click)="printMessage()"
            class="inline-flex
                   items-center
                   rounded-lg
                   border border-gray-300
                   bg-white
                   px-3 py-2
                   text-xs
                   font-semibold
                   text-gray-700
                   transition
                   hover:bg-gray-100"
          >
            🖨
            <span class="ml-1.5">
              Print
            </span>
          </button>


          <!-- Forward -->
          <button
            type="button"
            (click)="forwardMessage()"
            class="inline-flex
                   items-center
                   rounded-lg
                   border border-gray-300
                   bg-white
                   px-3 py-2
                   text-xs
                   font-semibold
                   text-gray-700
                   transition
                   hover:bg-gray-100"
          >
            ↗
            <span class="ml-1.5">
              Forward
            </span>
          </button>


          <!-- Close -->
          <button
            type="button"
            (click)="closeMessage()"
            class="rounded-lg
                   bg-[#032D42]
                   px-3.5 py-2
                   text-xs
                   font-semibold
                   text-white
                   transition
                   hover:bg-[#064b68]"
          >
            Close
          </button>

        </div>

      </div>

    </div>

  </div>

}


      <!-- ==========================================================
           COMPOSE EMAIL MODAL
           ========================================================== -->
      @if (composeMode() !== 'none') {
        <div
          class="fixed inset-0 z-[70]
                 flex items-center justify-center
                 bg-black/50 px-4 py-5"
          role="dialog"
          aria-modal="true"
          aria-label="Compose email"
          (click)="closeComposer()"
        >
          <section
            class="max-h-[92vh] w-full max-w-xl
                   overflow-y-auto rounded-xl
                   bg-white shadow-2xl"
            (click)="$event.stopPropagation()"
          >
            <header
              class="flex items-center justify-between gap-4
                     bg-[#032D42] px-5 py-4"
            >
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-white">
                  {{
                    composeMode() === 'forward'
                      ? 'Forward Message'
                      : 'New Email'
                  }}
                </h2>
                <p class="mt-0.5 text-xs text-white/70">
                  Send an email from the Zebron administrator mailbox.
                </p>
              </div>

              <button
                type="button"
                (click)="closeComposer()"
                [disabled]="sending()"
                class="flex h-8 w-8 items-center justify-center
                       rounded-lg text-lg text-white/70
                       hover:bg-white/10 hover:text-white
                       disabled:opacity-50"
                aria-label="Close composer"
              >
                ×
              </button>
            </header>

            @if (error()) {
              <div
                class="mx-5 mt-4 rounded-lg border border-red-200
                       bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {{ error() }}
              </div>
            }

            <form
              class="space-y-4 px-5 py-5"
              (submit)="$event.preventDefault(); sendComposedMessage()"
            >
              <div>
                <label
                  for="sent-compose-to"
                  class="block text-xs font-semibold text-gray-600"
                >
                  To
                </label>
                <input
                  id="sent-compose-to"
                  type="email"
                  [value]="composeTo()"
                  (input)="composeTo.set($any($event.target).value)"
                  required
                  autocomplete="email"
                  [disabled]="sending()"
                  placeholder="recipient@example.com"
                  class="mt-1 h-10 w-full rounded-lg border border-gray-300
                         px-3 text-sm text-gray-900 outline-none
                         focus:border-[#032D42] focus:ring-2
                         focus:ring-[#032D42]/15 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  for="sent-compose-subject"
                  class="block text-xs font-semibold text-gray-600"
                >
                  Subject
                </label>
                <input
                  id="sent-compose-subject"
                  type="text"
                  [value]="composeSubject()"
                  (input)="composeSubject.set($any($event.target).value)"
                  required
                  [disabled]="sending()"
                  class="mt-1 h-10 w-full rounded-lg border border-gray-300
                         px-3 text-sm text-gray-900 outline-none
                         focus:border-[#032D42] focus:ring-2
                         focus:ring-[#032D42]/15 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  for="sent-compose-message"
                  class="block text-xs font-semibold text-gray-600"
                >
                  Message
                </label>
                <textarea
                  id="sent-compose-message"
                  rows="9"
                  [value]="composeMessage()"
                  (input)="composeMessage.set($any($event.target).value)"
                  required
                  [disabled]="sending()"
                  placeholder="Write your message..."
                  class="mt-1 w-full resize-y rounded-lg border border-gray-300
                         px-3 py-2 text-sm leading-6 text-gray-900 outline-none
                         focus:border-[#032D42] focus:ring-2
                         focus:ring-[#032D42]/15 disabled:bg-gray-100"
                ></textarea>
              </div>

              <div class="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  (click)="closeComposer()"
                  [disabled]="sending()"
                  class="h-9 rounded-lg border border-gray-300
                         bg-white px-4 text-xs font-semibold text-gray-700
                         hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="sending()"
                  class="inline-flex h-9 items-center gap-1.5
                         rounded-lg bg-[#032D42] px-4 text-xs
                         font-semibold text-white hover:bg-[#064b68]
                         disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ sending() ? 'Sending...' : composeMode() === 'forward' ? 'Forward' : 'Send Email' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      }


      <!-- ==========================================================
           SUCCESS TOAST
           ========================================================== -->
      @if (toastMessage()) {
        <div
          class="fixed bottom-4 left-4 right-4 z-[100]
                 mx-auto max-w-md rounded-xl bg-green-600
                 px-4 py-3 text-sm font-medium text-white shadow-xl"
          role="status"
          aria-live="polite"
        >
          {{ toastMessage() }}
        </div>
      }


      <!-- ==========================================================
           PRINT-ONLY DOCUMENT
           ========================================================== -->
      @if (selectedMessage()) {
        <article class="zebron-print-document" aria-hidden="true">
          <header class="zebron-print-header">
            <div>
              <div class="zebron-print-brand">ZEBRON</div>
              <div class="zebron-print-title">Sent Email</div>
            </div>
            <div class="zebron-print-date">
              {{ formatDate(selectedMessage()!.createdAt) }}
            </div>
          </header>

          <section class="zebron-print-meta">
            <div>
              <span>From</span>
              <strong>{{ selectedMessage()!.from }}</strong>
            </div>
            <div>
              <span>To</span>
              <strong>{{ selectedMessage()!.to }}</strong>
            </div>
            <div>
              <span>Subject</span>
              <strong>{{ selectedMessage()!.subject }}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>
                {{ getMessageTypeLabel(selectedMessage()!) }}
              </strong>
            </div>
          </section>

          <section class="zebron-print-body">
            <h2>Message</h2>
            <div class="zebron-print-message">
              {{ selectedMessage()!.message }}
            </div>
          </section>

          <footer class="zebron-print-footer">
            Printed from the Zebron administrator mailbox.
          </footer>
        </article>
      }


    </div>
  `,
  styles: [`
    .zebron-print-document {
      display: none;
    }

    @media print {
      @page {
        size: auto;
        margin: 0.65in;
      }

      body * {
        visibility: hidden !important;
      }

      .zebron-print-document,
      .zebron-print-document * {
        visibility: visible !important;
      }

      .zebron-print-document {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        box-sizing: border-box;
        background: #ffffff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        padding: 0;
      }

      .zebron-print-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        padding-bottom: 18px;
        border-bottom: 2px solid #032d42;
      }

      .zebron-print-brand {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #032d42;
      }

      .zebron-print-title {
        margin-top: 4px;
        font-size: 24px;
        font-weight: 700;
      }

      .zebron-print-date {
        font-size: 12px;
        color: #6b7280;
        text-align: right;
      }

      .zebron-print-meta {
        margin-top: 24px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        overflow: hidden;
      }

      .zebron-print-meta > div {
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .zebron-print-meta > div:last-child {
        border-bottom: 0;
      }

      .zebron-print-meta span {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
      }

      .zebron-print-meta strong {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 12px;
        font-weight: 600;
      }

      .zebron-print-body {
        margin-top: 24px;
      }

      .zebron-print-body h2 {
        margin: 0 0 10px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #4b5563;
      }

      .zebron-print-message {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-size: 13px;
        line-height: 1.7;
      }

      .zebron-print-footer {
        margin-top: 36px;
        padding-top: 12px;
        border-top: 1px solid #d1d5db;
        font-size: 10px;
        color: #9ca3af;
      }
    }
  `],
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

  if (!message) {
    return;
  }

  window.print();
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