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
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import {
  ContactMessage,
  ContactMessageStatus,
} from '../../../app/core/models/contact-message.model';

import { ContactMessageService } from '../../../app/core/services/contact-message.service';
import { ContactService } from '../../../app/core/services/contact.service';

type MailboxFilter = 'all' | 'new' | 'read' | 'archived';

type ComposeMode = 'none' | 'reply' | 'forward' | 'new';

@Component({
  selector: 'app-contact-mailbox',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->

    <div class="min-h-screen bg-gray-50">
      <!-- =======================================================
           HEADER
           ======================================================= -->

      <header
        class="bg-[#032D42] px-4 py-5 text-white
               sm:px-6 sm:py-6"
      >
        <div
          class="mx-auto flex max-w-7xl
                 items-center justify-between gap-4"
        >
          <!-- Header title -->
          <div class="min-w-0">
            <h1
              class="truncate text-xl font-bold
                     tracking-tight sm:text-2xl"
            >
              Zebron Mailbox
            </h1>

            <p
              class="mt-1 text-xs text-white/80
                     sm:text-sm"
            >
              Manage messages submitted through the Zebron contact form.
            </p>
          </div>

          <!-- Header actions -->
          <div
            class="flex shrink-0 items-center gap-2
                   sm:gap-3"
          >
            <!-- Admin dashboard -->
            <a
              routerLink="/admin"
              class="hidden min-h-10 items-center
                     justify-center rounded-lg
                     bg-white px-4 py-2
                     text-sm font-medium
                     text-gray-700
                     transition hover:bg-gray-100
                     sm:inline-flex"
            >
              <mat-icon class="mr-1 !h-5 !w-5 !text-[20px]"> arrow_back </mat-icon>

              Admin Dashboard
            </a>

            <!-- New message -->
            <button
              type="button"
              (click)="newMessage()"
              class="hidden min-h-10 items-center
                     justify-center rounded-lg
                     bg-white px-4 py-2
                     text-sm font-semibold
                     text-[#032D42]
                     transition hover:bg-gray-100
                     sm:inline-flex"
            >
              <mat-icon class="mr-1 !h-5 !w-5 !text-[20px]"> add </mat-icon>

              New Message
            </button>

            <!-- Refresh -->
            <button
              type="button"
              (click)="loadMessages()"
              [disabled]="loading()"
              class="inline-flex min-h-10
                     items-center justify-center
                     rounded-lg border
                     border-white/30
                     bg-white/5 px-3 py-2
                     text-sm font-medium
                     text-white
                     transition
                     hover:bg-white/10
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
              aria-label="Refresh mailbox"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]" [class.animate-spin]="loading()">
                refresh
              </mat-icon>

              <span class="ml-1 hidden sm:inline">
                {{ loading() ? 'Refreshing...' : 'Refresh' }}
              </span>
            </button>

            <!-- Header overflow -->
            <button
              mat-icon-button
              [matMenuTriggerFor]="mailboxMenu"
              aria-label="More mailbox options"
              class="!flex !h-10 !w-10
                     !items-center !justify-center
                     !rounded-lg
                     !border !border-white/20
                     !bg-white/5
                     !text-white
                     hover:!bg-white/10"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #mailboxMenu="matMenu" xPosition="before">
              <a mat-menu-item routerLink="/admin">
                <mat-icon>dashboard</mat-icon>
                <span>Admin Dashboard</span>
              </a>

              <button mat-menu-item type="button" (click)="newMessage()">
                <mat-icon>mail</mat-icon>
                <span>New Message</span>
              </button>

              <button mat-menu-item type="button" (click)="loadMessages()">
                <mat-icon>refresh</mat-icon>
                <span>Refresh</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- =======================================================
           MAIN CONTENT
           ======================================================= -->

      <main class="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <!-- Error -->
          @if (error()) {
            <div
              class="mb-4 rounded-lg
                     border border-red-200
                     bg-red-50 px-4 py-3
                     text-sm text-red-700"
              role="alert"
            >
              {{ error() }}
            </div>
          }

          <!-- =====================================================
               SEARCH
               ===================================================== -->

          <section class="mb-4">
            <label for="mailbox-search" class="sr-only"> Search mailbox </label>

            <div class="relative">
              <!-- Search icon -->
              <mat-icon
                class="pointer-events-none
                       absolute left-4 top-1/2
                       !h-5 !w-5
                       -translate-y-1/2
                       !text-[20px]
                       text-gray-400"
              >
                search
              </mat-icon>

              <input
                id="mailbox-search"
                type="search"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                placeholder="Search sender, email, subject, or message..."
                autocomplete="off"
                class="h-12 w-full rounded-xl
                       border border-gray-300
                       bg-white pl-11 pr-11
                       text-sm text-gray-900
                       shadow-sm outline-none
                       transition
                       placeholder:text-gray-400
                       focus:border-[#032D42]
                       focus:ring-2
                       focus:ring-[#032D42]/15"
              />

              <!-- ONE clear button -->
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="searchQuery.set('')"
                  class="absolute right-3 top-1/2
                         flex h-8 w-8
                         -translate-y-1/2
                         items-center justify-center
                         rounded-md
                         text-gray-400
                         transition
                         hover:bg-gray-100
                         hover:text-gray-700"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <mat-icon
                    class="!m-0 !h-5 !w-5
                           !text-[20px]"
                  >
                    close
                  </mat-icon>
                </button>
              }
            </div>

            @if (searchQuery()) {
              <p class="mt-2 text-xs text-gray-500">
                Showing
                <span class="font-semibold text-gray-700">
                  {{ filteredMessages().length }}
                </span>
                matching
                {{ filteredMessages().length === 1 ? 'message' : 'messages' }}
              </p>
            }
          </section>

          <!-- =====================================================
               SUMMARY CARDS
               ===================================================== -->

          <section
            class="mb-5 grid grid-cols-2
                   gap-3 lg:grid-cols-4"
          >
            <!-- All -->
            <button
              type="button"
              (click)="setFilter('all')"
              class="rounded-xl border
                     bg-white px-4 py-4
                     text-left shadow-sm
                     transition hover:shadow-md"
              [class.border-[#032D42]]="filter() === 'all'"
              [class.ring-2]="filter() === 'all'"
              [class.ring-[#032D42]/10]="filter() === 'all'"
            >
              <div
                class="flex items-center
                       justify-between gap-2"
              >
                <p
                  class="text-sm font-medium
                         text-gray-500"
                >
                  All Messages
                </p>

                <span
                  class="hidden h-10 w-10
                         items-center justify-center
                         rounded-full bg-blue-50
                         text-blue-600
                         sm:flex"
                >
                  <mat-icon>mail</mat-icon>
                </span>
              </div>

              <p
                class="mt-2 text-3xl font-bold
                       leading-none text-gray-900"
              >
                {{ messages().length }}
              </p>
            </button>

            <!-- New -->
            <button
              type="button"
              (click)="setFilter('new')"
              class="rounded-xl border
                     border-gray-200 bg-white
                     px-4 py-4 text-left
                     shadow-sm transition
                     hover:shadow-md"
              [class.ring-2]="filter() === 'new'"
              [class.ring-blue-500/20]="filter() === 'new'"
            >
              <div
                class="flex items-center
                       justify-between gap-2"
              >
                <p
                  class="text-sm font-medium
                         text-gray-500"
                >
                  New
                </p>

                <span
                  class="hidden h-10 w-10
                         items-center justify-center
                         rounded-full bg-blue-50
                         text-blue-600
                         sm:flex"
                >
                  <mat-icon>mail_outline</mat-icon>
                </span>
              </div>

              <p
                class="mt-2 text-3xl font-bold
                       leading-none text-blue-600"
              >
                {{ newCount() }}
              </p>
            </button>

            <!-- Read -->
            <button
              type="button"
              (click)="setFilter('read')"
              class="rounded-xl border
                     border-gray-200 bg-white
                     px-4 py-4 text-left
                     shadow-sm transition
                     hover:shadow-md"
              [class.ring-2]="filter() === 'read'"
              [class.ring-green-500/20]="filter() === 'read'"
            >
              <div
                class="flex items-center
                       justify-between gap-2"
              >
                <p
                  class="text-sm font-medium
                         text-gray-500"
                >
                  Read
                </p>

                <span
                  class="hidden h-10 w-10
                         items-center justify-center
                         rounded-full bg-green-50
                         text-green-600
                         sm:flex"
                >
                  <mat-icon>drafts</mat-icon>
                </span>
              </div>

              <p
                class="mt-2 text-3xl font-bold
                       leading-none text-green-600"
              >
                {{ readCount() }}
              </p>
            </button>

            <!-- Archived -->
            <button
              type="button"
              (click)="setFilter('archived')"
              class="rounded-xl border
                     border-gray-200 bg-white
                     px-4 py-4 text-left
                     shadow-sm transition
                     hover:shadow-md"
              [class.ring-2]="filter() === 'archived'"
              [class.ring-gray-400/20]="filter() === 'archived'"
            >
              <div
                class="flex items-center
                       justify-between gap-2"
              >
                <p
                  class="text-sm font-medium
                         text-gray-500"
                >
                  Archived
                </p>

                <span
                  class="hidden h-10 w-10
                         items-center justify-center
                         rounded-full bg-gray-100
                         text-gray-700
                         sm:flex"
                >
                  <mat-icon>inventory_2</mat-icon>
                </span>
              </div>

              <p
                class="mt-2 text-3xl font-bold
                       leading-none text-gray-500"
              >
                {{ archivedCount() }}
              </p>
            </button>
          </section>

          <!-- =====================================================
               MESSAGE TABLE
               ===================================================== -->

          <section
            class="overflow-hidden rounded-xl
                   border border-gray-200
                   bg-white shadow-sm"
          >
            @if (loading()) {
              <div
                class="px-6 py-12 text-center
                       text-sm text-gray-500"
              >
                <mat-icon
                  class="mb-2 animate-spin
                         !h-6 !w-6
                         !text-[24px]"
                >
                  refresh
                </mat-icon>

                <p>Loading messages...</p>
              </div>
            } @else if (filteredMessages().length === 0) {
              <div class="px-6 py-14 text-center">
                <mat-icon
                  class="!h-12 !w-12
                         !text-[48px]
                         text-gray-300"
                >
                  mail_outline
                </mat-icon>

                <h2
                  class="mt-3 text-base
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
            } @else {
              <!-- Desktop -->
              <div
                class="hidden overflow-x-auto
                       sm:block"
              >
                <table class="w-full table-fixed">
                  <thead
                    class="border-b
                           border-gray-200
                           bg-gray-50"
                  >
                    <tr>
                      <th
                        class="w-[20%]
                               px-5 py-3
                               text-left text-xs
                               font-semibold uppercase
                               tracking-wide
                               text-gray-500"
                      >
                        Sender
                      </th>

                      <th
                        class="w-[30%]
                               px-5 py-3
                               text-left text-xs
                               font-semibold uppercase
                               tracking-wide
                               text-gray-500"
                      >
                        Subject
                      </th>

                      <th
                        class="w-[18%]
                               px-5 py-3
                               text-left text-xs
                               font-semibold uppercase
                               tracking-wide
                               text-gray-500"
                      >
                        Date
                      </th>

                      <th
                        class="w-[12%]
                               px-5 py-3
                               text-left text-xs
                               font-semibold uppercase
                               tracking-wide
                               text-gray-500"
                      >
                        Status
                      </th>

                      <th
                        class="w-[20%]
                               px-5 py-3
                               text-right text-xs
                               font-semibold uppercase
                               tracking-wide
                               text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    class="divide-y
                           divide-gray-100"
                  >
                    @for (message of filteredMessages(); track message.id) {
                      <tr
                        class="transition
                               hover:bg-gray-50"
                        [class.bg-blue-50]="message.status === 'new'"
                      >
                        <!-- Sender -->
                        <td class="px-5 py-4 align-middle">
                          <div class="min-w-0">
                            <div
                              class="flex items-center
                                     gap-2"
                            >
                              @if (message.status === 'new') {
                                <span
                                  class="h-2 w-2
                                         shrink-0
                                         rounded-full
                                         bg-blue-600"
                                  title="New message"
                                ></span>
                              }

                              <p
                                class="truncate
                                       text-sm
                                       font-semibold
                                       text-gray-900"
                              >
                                {{ message.name }}
                              </p>
                            </div>

                            <p
                              class="mt-0.5 truncate
                                     text-xs
                                     text-gray-500"
                            >
                              {{ message.email }}
                            </p>
                          </div>
                        </td>

                        <!-- Subject -->
                        <td
                          class="px-5 py-4
                                 align-middle"
                        >
                          <button
                            type="button"
                            (click)="openMessage(message)"
                            class="block w-full
                                   min-w-0
                                   text-left"
                          >
                            <p
                              class="break-words
                                     text-sm
                                     font-semibold
                                     leading-5
                                     text-gray-900
                                     hover:text-blue-600"
                              [class.font-bold]="message.status === 'new'"
                            >
                              {{ message.subject }}
                            </p>

                            <p
                              class="mt-1
                                     break-words
                                     text-xs
                                     leading-5
                                     text-gray-500"
                            >
                              {{ message.message }}
                            </p>
                          </button>
                        </td>

                        <!-- Date -->
                        <td
                          class="whitespace-nowrap
                                 px-5 py-4
                                 align-middle
                                 text-sm
                                 text-gray-500"
                        >
                          {{ formatDate(message) }}
                        </td>

                        <!-- Status -->
                        <td
                          class="px-5 py-4
                                 align-middle"
                        >
                          <span
                            class="inline-flex
                                   rounded-full
                                   px-2.5 py-1
                                   text-xs
                                   font-medium
                                   capitalize"
                            [class.bg-blue-100]="message.status === 'new'"
                            [class.text-blue-700]="message.status === 'new'"
                            [class.bg-green-100]="message.status === 'read'"
                            [class.text-green-700]="message.status === 'read'"
                            [class.bg-gray-100]="message.status === 'archived'"
                            [class.text-gray-700]="message.status === 'archived'"
                          >
                            {{ message.status }}
                          </span>
                        </td>

                        <!-- Actions -->
                        <td
                          class="px-4 py-4
                                 align-middle"
                        >
                          <div
                            class="flex items-center
                                   justify-end gap-1"
                          >
                            <!-- View -->
                            <button
                              type="button"
                              (click)="openMessage(message)"
                              class="inline-flex h-8
                                     items-center
                                     gap-1 rounded-md
                                     bg-blue-50
                                     px-2.5
                                     text-xs
                                     font-semibold
                                     text-blue-700
                                     transition
                                     hover:bg-blue-100"
                            >
                              <mat-icon
                                class="!m-0 !h-4
                                       !w-4
                                       !text-[17px]"
                              >
                                visibility
                              </mat-icon>

                              View
                            </button>

                            <!-- Reply -->
                            <button
                              type="button"
                              (click)="replyToMessage(message)"
                              class="inline-flex h-8
                                     items-center
                                     gap-1 rounded-md
                                     bg-blue-50
                                     px-2.5
                                     text-xs
                                     font-semibold
                                     text-blue-700
                                     transition
                                     hover:bg-blue-100"
                            >
                              <mat-icon
                                class="!m-0 !h-4
                                       !w-4
                                       !text-[17px]"
                              >
                                reply
                              </mat-icon>

                              Reply
                            </button>

                            <!-- Delete -->
                            <button
                              type="button"
                              (click)="deleteMessage(message)"
                              class="inline-flex h-8
                                     items-center
                                     gap-1 rounded-md
                                     bg-red-50
                                     px-2.5
                                     text-xs
                                     font-semibold
                                     text-red-700
                                     transition
                                     hover:bg-red-100"
                            >
                              <mat-icon
                                class="!m-0 !h-4
                                       !w-4
                                       !text-[17px]"
                              >
                                delete
                              </mat-icon>

                              Delete
                            </button>

                            <!-- More -->
                            <button
                              mat-icon-button
                              [matMenuTriggerFor]="messageMenu"
                              [matMenuTriggerData]="{
                                message: message,
                              }"
                              aria-label="More message actions"
                              class="!ml-1 !flex !h-8
                                     !w-8 !items-center
                                     !justify-center
                                     !rounded-md
                                     !border
                                     !border-gray-200
                                     !text-gray-600
                                     hover:!bg-gray-100"
                            >
                              <mat-icon
                                class="!m-0
                                       !text-[20px]"
                              >
                                more_vert
                              </mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- =================================================
                   MOBILE CARDS
                   ================================================= -->

              <div class="space-y-2 p-3 sm:hidden">
                @for (message of filteredMessages(); track message.id) {
                  <article
                    class="rounded-xl
                           border border-gray-200
                           bg-white p-3
                           shadow-sm"
                    [class.border-blue-200]="message.status === 'new'"
                    [class.bg-blue-50]="message.status === 'new'"
                  >
                    <div
                      class="flex items-start
                             justify-between gap-3"
                    >
                      <div class="min-w-0">
                        <p
                          class="truncate
                                 text-sm
                                 font-semibold
                                 text-gray-900"
                        >
                          {{ message.name }}
                        </p>

                        <p
                          class="mt-0.5 truncate
                                 text-xs
                                 text-gray-500"
                        >
                          {{ message.email }}
                        </p>
                      </div>

                      <span
                        class="shrink-0
                               rounded-full
                               px-2 py-0.5
                               text-[10px]
                               font-semibold
                               capitalize"
                        [class.bg-blue-100]="message.status === 'new'"
                        [class.text-blue-700]="message.status === 'new'"
                        [class.bg-green-100]="message.status === 'read'"
                        [class.text-green-700]="message.status === 'read'"
                        [class.bg-gray-100]="message.status === 'archived'"
                        [class.text-gray-700]="message.status === 'archived'"
                      >
                        {{ message.status }}
                      </span>
                    </div>

                    <button
                      type="button"
                      (click)="openMessage(message)"
                      class="mt-3 block w-full
                             text-left"
                    >
                      <p
                        class="break-words
                               text-sm
                               font-semibold
                               text-gray-900"
                      >
                        {{ message.subject }}
                      </p>

                      <p
                        class="mt-1
                               line-clamp-2
                               break-words
                               text-xs
                               leading-5
                               text-gray-500"
                      >
                        {{ message.message }}
                      </p>
                    </button>

                    <div
                      class="mt-3 flex items-center
                             justify-between gap-2
                             border-t
                             border-gray-100 pt-3"
                    >
                      <span
                        class="shrink-0
                               text-[11px]
                               text-gray-500"
                      >
                        {{ formatDate(message) }}
                      </span>

                      <div
                        class="flex items-center
                               gap-1"
                      >
                        <button
                          type="button"
                          (click)="openMessage(message)"
                          class="inline-flex h-8
                                 items-center
                                 justify-center
                                 rounded-md
                                 bg-blue-50
                                 px-2
                                 text-[11px]
                                 font-semibold
                                 text-blue-700"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          (click)="replyToMessage(message)"
                          class="inline-flex h-8
                                 items-center
                                 justify-center
                                 rounded-md
                                 bg-blue-50
                                 px-2
                                 text-[11px]
                                 font-semibold
                                 text-blue-700"
                        >
                          Reply
                        </button>

                        <button
                          type="button"
                          (click)="deleteMessage(message)"
                          class="inline-flex h-8
                                 items-center
                                 justify-center
                                 rounded-md
                                 bg-red-50
                                 px-2
                                 text-[11px]
                                 font-semibold
                                 text-red-700"
                        >
                          Delete
                        </button>

                        <button
                          mat-icon-button
                          [matMenuTriggerFor]="messageMenu"
                          [matMenuTriggerData]="{
                            message: message,
                          }"
                          aria-label="More message actions"
                          class="!flex !h-8 !w-8
                                 !items-center
                                 !justify-center
                                 !rounded-md
                                 !border
                                 !border-gray-200"
                        >
                          <mat-icon
                            class="!m-0
                                   !text-[19px]"
                          >
                            more_vert
                          </mat-icon>
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>

              <!-- =================================================
                   PAGINATION / FOOTER
                   ================================================= -->

              <div
                class="flex flex-col gap-3
                       border-t border-gray-200
                       px-4 py-4
                       sm:flex-row
                       sm:items-center
                       sm:justify-between"
              >
                <p
                  class="text-xs
                         text-gray-500 sm:text-sm"
                >
                  Showing
                  <span class="font-medium text-gray-700">
                    {{ filteredMessages().length }}
                  </span>
                  {{ filteredMessages().length === 1 ? 'message' : 'messages' }}
                </p>

                <div
                  class="flex items-center
                         justify-between gap-3
                         sm:justify-end"
                >
                  <div
                    class="flex items-center
                           gap-1"
                  >
                    <button
                      type="button"
                      disabled
                      class="flex h-9 w-9
                             items-center
                             justify-center
                             rounded-lg
                             border
                             border-gray-200
                             text-gray-300"
                      aria-label="Previous page"
                    >
                      <mat-icon>chevron_left</mat-icon>
                    </button>

                    <span
                      class="flex h-9 w-9
                             items-center
                             justify-center
                             rounded-lg
                             bg-[#032D42]
                             text-sm font-semibold
                             text-white"
                    >
                      1
                    </span>

                    <button
                      type="button"
                      disabled
                      class="flex h-9 w-9
                             items-center
                             justify-center
                             rounded-lg
                             border
                             border-gray-200
                             text-gray-300"
                      aria-label="Next page"
                    >
                      <mat-icon>chevron_right</mat-icon>
                    </button>
                  </div>

                  <select
                    class="h-9 rounded-lg
                           border border-gray-200
                           bg-white px-3
                           text-xs text-gray-700
                           outline-none
                           sm:text-sm"
                    aria-label="Messages per page"
                  >
                    <option>10 per page</option>
                    <option>25 per page</option>
                    <option>50 per page</option>
                  </select>
                </div>
              </div>
            }
          </section>
        </div>
      </main>
    </div>

    <!-- =========================================================
         MESSAGE ACTION MENU
         ========================================================= -->

    <mat-menu #messageMenu="matMenu" xPosition="before" class="message-action-menu">
      <ng-template matMenuContent let-message="message">
        <!-- View -->
        <button mat-menu-item type="button" (click)="openMessage(message)">
          <mat-icon>visibility</mat-icon>
          <span>View</span>
        </button>

        <!-- Reply -->
        <button mat-menu-item type="button" (click)="replyToMessage(message)">
          <mat-icon>reply</mat-icon>
          <span>Reply</span>
        </button>

        <!-- Forward -->
        <button mat-menu-item type="button" (click)="forwardMessage(message)">
          <mat-icon>send</mat-icon>
          <span>Forward</span>
        </button>

        <!-- Hold -->
        <button mat-menu-item type="button" (click)="holdMessage(message)">
          <mat-icon>schedule</mat-icon>
          <span>Hold</span>
        </button>

        <!-- Archive / Restore -->
        @if (message.status === 'archived') {
          <button mat-menu-item type="button" (click)="unarchiveMessage(message)">
            <mat-icon>unarchive</mat-icon>
            <span>Restore</span>
          </button>
        } @else {
          <button mat-menu-item type="button" (click)="archiveMessage(message)">
            <mat-icon>archive</mat-icon>
            <span>Archive</span>
          </button>
        }

        <mat-divider></mat-divider>

        <!-- Delete -->
        <button mat-menu-item type="button" (click)="deleteMessage(message)" class="!text-red-600">
          <mat-icon class="!text-red-600"> delete </mat-icon>

          <span>Delete</span>
        </button>
      </ng-template>
    </mat-menu>

    <!-- =========================================================
         MESSAGE DETAIL MODAL
         ========================================================= -->

    @if (selectedMessage()) {
      <div
        class="fixed inset-0 z-50
               flex items-center justify-center
               bg-black/50 p-3 sm:p-4"
        (click)="closeMessage()"
      >
        <section
          class="max-h-[90vh] w-full max-w-xl
                 overflow-y-auto
                 rounded-xl bg-white
                 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal header -->
          <div
            class="border-b px-4 py-4
                   sm:px-6"
          >
            <div
              class="flex items-start
                     justify-between gap-4"
            >
              <div class="min-w-0">
                <h2
                  class="break-words
                         text-lg font-bold
                         leading-6 text-gray-900"
                >
                  {{ selectedMessage()!.subject }}
                </h2>

                <p
                  class="mt-1 text-xs
                         text-gray-500 sm:text-sm"
                >
                  {{ formatDate(selectedMessage()!) }}
                </p>
              </div>

              <button
                type="button"
                (click)="closeMessage()"
                class="flex h-8 w-8
                       shrink-0
                       items-center
                       justify-center
                       rounded-md
                       text-gray-400
                       hover:bg-gray-100
                       hover:text-gray-700"
                aria-label="Close message"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Sender -->
          <div
            class="border-b
                   bg-gray-50
                   px-4 py-3
                   sm:px-6"
          >
            <div
              class="grid grid-cols-2
                     gap-4"
            >
              <div class="min-w-0">
                <p
                  class="text-[11px]
                         font-semibold
                         uppercase
                         tracking-wide
                         text-gray-500"
                >
                  From
                </p>

                <p
                  class="mt-1 truncate
                         text-sm font-medium
                         text-gray-900"
                >
                  {{ selectedMessage()!.name }}
                </p>
              </div>

              <div class="min-w-0">
                <p
                  class="text-[11px]
                         font-semibold
                         uppercase
                         tracking-wide
                         text-gray-500"
                >
                  Email
                </p>

                <a
                  [href]="'mailto:' + selectedMessage()!.email"
                  class="mt-1 block truncate
                         text-sm font-medium
                         text-blue-600
                         hover:underline"
                >
                  {{ selectedMessage()!.email }}
                </a>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div class="px-4 py-5 sm:px-6">
            <p
              class="whitespace-pre-wrap
                     break-words
                     text-sm leading-7
                     text-gray-700"
            >
              {{ selectedMessage()!.message }}
            </p>
          </div>

          <!-- Modal actions -->
          <div
            class="flex items-center
                   gap-2 border-t
                   px-4 py-3
                   sm:px-6"
          >
            <button
              type="button"
              (click)="replyToMessage(selectedMessage()!)"
              class="inline-flex h-9
                     items-center gap-1.5
                     rounded-md
                     bg-[#032D42]
                     px-3
                     text-xs font-semibold
                     text-white
                     transition
                     hover:bg-[#064B68]"
            >
              <mat-icon
                class="!m-0 !h-4
                       !w-4 !text-[17px]"
              >
                reply
              </mat-icon>

              Reply
            </button>

            <button
              type="button"
              (click)="forwardMessage(selectedMessage()!)"
              class="inline-flex h-9
                     items-center gap-1.5
                     rounded-md
                     border border-gray-200
                     bg-white px-3
                     text-xs font-semibold
                     text-gray-700
                     transition
                     hover:bg-gray-50"
            >
              <mat-icon
                class="!m-0 !h-4
                       !w-4 !text-[17px]"
              >
                send
              </mat-icon>

              Forward
            </button>

            <button
              type="button"
              (click)="deleteMessage(selectedMessage()!)"
              class="ml-auto
                     inline-flex h-9
                     items-center gap-1.5
                     rounded-md
                     bg-red-50 px-3
                     text-xs font-semibold
                     text-red-700
                     transition
                     hover:bg-red-100"
            >
              <mat-icon
                class="!m-0 !h-4
                       !w-4 !text-[17px]"
              >
                delete
              </mat-icon>

              Delete
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
        class="fixed inset-0 z-[60]
               flex items-center
               justify-center
               bg-black/50 p-3 sm:p-4"
        (click)="closeComposer()"
      >
        <section
          class="max-h-[92vh] w-full max-w-xl
                 overflow-y-auto
                 rounded-xl bg-white
                 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Composer header -->
          <div
            class="flex items-center
                   justify-between
                   gap-3
                   bg-[#032D42]
                   px-4 py-4
                   sm:px-6"
          >
            <div>
              <h2
                class="text-lg font-semibold
                       text-white"
              >
                {{
                  composeMode() === 'reply'
                    ? 'Reply to Message'
                    : composeMode() === 'forward'
                      ? 'Forward Message'
                      : 'New Message'
                }}
              </h2>

              <p
                class="mt-0.5 text-xs
                       text-white/70"
              >
                Send an email from Zebron.
              </p>
            </div>

            <button
              type="button"
              (click)="closeComposer()"
              [disabled]="sending()"
              class="flex h-8 w-8
                     items-center
                     justify-center
                     rounded-md
                     text-white/70
                     hover:bg-white/10
                     hover:text-white
                     disabled:opacity-50"
              aria-label="Close composer"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Composer form -->
          <form
            class="space-y-4
                   px-4 py-5
                   sm:px-6"
            (submit)="$event.preventDefault(); sendComposedMessage()"
          >
            <!-- To -->
            <div>
              <label
                for="compose-to"
                class="block text-sm
                       font-medium
                       text-gray-700"
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
                class="mt-1 h-10 w-full
                       rounded-lg
                       border border-gray-300
                       px-3 text-sm
                       text-gray-900
                       outline-none
                       focus:border-[#032D42]
                       focus:ring-2
                       focus:ring-[#032D42]/15
                       disabled:bg-gray-100"
              />
            </div>

            <!-- Subject -->
            <div>
              <label
                for="compose-subject"
                class="block text-sm
                       font-medium
                       text-gray-700"
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
                class="mt-1 h-10 w-full
                       rounded-lg
                       border border-gray-300
                       px-3 text-sm
                       text-gray-900
                       outline-none
                       focus:border-[#032D42]
                       focus:ring-2
                       focus:ring-[#032D42]/15
                       disabled:bg-gray-100"
              />
            </div>

            <!-- Message -->
            <div>
              <label
                for="compose-message"
                class="block text-sm
                       font-medium
                       text-gray-700"
              >
                Message
              </label>

              <textarea
                id="compose-message"
                rows="7"
                [value]="composeMessage()"
                (input)="composeMessage.set($any($event.target).value)"
                placeholder="Write your message..."
                required
                [disabled]="sending()"
                class="mt-1 w-full
                       resize-y rounded-lg
                       border border-gray-300
                       px-3 py-2
                       text-sm leading-6
                       text-gray-900
                       outline-none
                       focus:border-[#032D42]
                       focus:ring-2
                       focus:ring-[#032D42]/15
                       disabled:bg-gray-100"
              ></textarea>
            </div>

            <!-- Actions -->
            <div
              class="flex justify-end
                     gap-2 border-t
                     pt-4"
            >
              <button
                type="button"
                (click)="closeComposer()"
                [disabled]="sending()"
                class="h-9 rounded-md
                       border border-gray-300
                       bg-white px-4
                       text-xs font-semibold
                       text-gray-700
                       hover:bg-gray-50
                       disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                [disabled]="sending()"
                class="inline-flex h-9
                       items-center gap-1.5
                       rounded-md
                       bg-[#032D42]
                       px-4
                       text-xs font-semibold
                       text-white
                       hover:bg-[#064B68]
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (sending()) {
                  <mat-icon
                    class="!m-0
                           !h-4 !w-4
                           animate-spin
                           !text-[17px]"
                  >
                    refresh
                  </mat-icon>
                } @else {
                  <mat-icon
                    class="!m-0
                           !h-4 !w-4
                           !text-[17px]"
                  >
                    send
                  </mat-icon>
                }

                {{
                  sending()
                    ? 'Sending...'
                    : composeMode() === 'forward'
                      ? 'Forward'
                      : 'Send Message'
                }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- =========================================================
         SUCCESS TOAST
         ========================================================= -->

    @if (toastMessage()) {
      <div
        class="fixed bottom-4 left-3
               right-3 z-[100]
               flex items-center gap-3
               rounded-xl bg-green-600
               px-4 py-3
               text-sm font-semibold
               text-white shadow-2xl
               sm:left-auto
               sm:right-6"
        role="status"
        aria-live="polite"
      >
        <span
          class="flex h-6 w-6
                 items-center justify-center
                 rounded-full bg-white/20"
        >
          ✓
        </span>

        {{ toastMessage() }}
      </div>
    }
  `,

  styles: [
    `
      :host {
        display: block;
      }

      :host ::ng-deep .mat-mdc-menu-panel {
        min-width: 190px;
        margin-top: 6px;
        padding: 6px 0;
        overflow: hidden;
        border: 1px solid #dfe8e8;
        border-radius: 12px;
        background: #ffffff;
        box-shadow:
          0 14px 30px rgba(3, 45, 66, 0.16),
          0 4px 10px rgba(3, 45, 66, 0.08);
      }

      :host ::ng-deep .mat-mdc-menu-item {
        min-height: 42px;
        margin: 2px 6px;
        padding: 0 11px;
        border-radius: 8px;
        color: #032d42;
        font-size: 14px;
        font-weight: 500;
      }

      :host ::ng-deep .mat-mdc-menu-item:hover,
      :host ::ng-deep .mat-mdc-menu-item.cdk-focused {
        background: #eef7f7;
      }

      :host ::ng-deep .mat-mdc-menu-item .mat-icon {
        margin-right: 9px;
        color: #007979;
      }

      :host ::ng-deep .mat-mdc-menu-item:last-child .mat-icon {
        color: #dc2626;
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactMailboxComponent implements OnInit {
  private readonly contactService = inject(ContactService);

  private readonly contactMessageService = inject(ContactMessageService);

  /**
   * All messages.
   */
  readonly messages = signal<ContactMessage[]>([]);

  /**
   * Search text.
   */
  readonly searchQuery = signal('');

  /**
   * Current mailbox filter.
   */
  readonly filter = signal<MailboxFilter>('all');

  /**
   * Currently opened message.
   */
  readonly selectedMessage = signal<ContactMessage | null>(null);

  /**
   * Loading state.
   */
  readonly loading = signal(false);

  /**
   * Error message.
   */
  readonly error = signal<string | null>(null);

  /**
   * Email composer state.
   */
  readonly composeMode = signal<ComposeMode>('none');

  readonly composeTo = signal('');

  readonly composeSubject = signal('');

  readonly composeMessage = signal('');

  readonly sending = signal(false);

  readonly toastMessage = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Number of new messages.
   */
  readonly newCount = computed(
    () => this.messages().filter((message) => message.status === 'new').length,
  );

  /**
   * Number of read messages.
   */
  readonly readCount = computed(
    () => this.messages().filter((message) => message.status === 'read').length,
  );

  /**
   * Number of archived messages.
   */
  readonly archivedCount = computed(
    () => this.messages().filter((message) => message.status === 'archived').length,
  );

  /**
   * Apply status and search filters.
   */
  readonly filteredMessages = computed(() => {
    const currentFilter = this.filter();

    const search = this.searchQuery().trim().toLowerCase();

    return this.messages().filter((message) => {
      const matchesStatus = currentFilter === 'all' || message.status === currentFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        message.name?.toLowerCase().includes(search) ||
        message.email?.toLowerCase().includes(search) ||
        message.subject?.toLowerCase().includes(search) ||
        message.message?.toLowerCase().includes(search)
      );
    });
  });

  ngOnInit(): void {
    this.loadMessages();
  }

  /**
   * Load mailbox messages.
   */
  async loadMessages(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const messages = await this.contactMessageService.getAllContactMessages();

      this.messages.set(messages);
    } catch (error) {
      console.error('Failed to load contact messages:', error);

      this.error.set('Unable to load contact messages. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Change mailbox filter.
   */
  setFilter(filter: MailboxFilter): void {
    this.filter.set(filter);
  }

  /**
   * Open a message.
   *
   * New messages become read when opened.
   */
  async openMessage(message: ContactMessage): Promise<void> {
    this.selectedMessage.set(message);

    if (message.status === 'new') {
      await this.markAsRead(message);
    }
  }

  /**
   * Close message modal.
   */
  closeMessage(): void {
    this.selectedMessage.set(null);
  }

  /**
   * Mark message as read.
   */
  async markAsRead(message: ContactMessage): Promise<void> {
    try {
      await this.contactMessageService.markAsRead(message.id);

      this.updateLocalStatus(message.id, 'read');
    } catch (error) {
      console.error('Failed to mark message as read:', error);

      this.error.set('Unable to mark the message as read.');
    }
  }

  /**
   * Archive a message.
   */
  async archiveMessage(message: ContactMessage): Promise<void> {
    try {
      await this.contactMessageService.archiveMessage(message.id);

      this.updateLocalStatus(message.id, 'archived');

      this.closeMessage();
    } catch (error) {
      console.error('Failed to archive message:', error);

      this.error.set('Unable to archive the message.');
    }
  }

  /**
   * Restore an archived message.
   */
  async unarchiveMessage(message: ContactMessage): Promise<void> {
    try {
      await this.contactMessageService.unarchiveMessage(message.id);

      this.updateLocalStatus(message.id, 'read');

      this.closeMessage();
    } catch (error) {
      console.error('Failed to restore message:', error);

      this.error.set('Unable to restore the message.');
    }
  }

  /**
   * Permanently delete a message.
   */
  async deleteMessage(message: ContactMessage): Promise<void> {
    const confirmed = window.confirm(
      `Delete the message from ${message.name}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.contactMessageService.deleteMessage(message.id);

      this.messages.update((messages) => messages.filter((item) => item.id !== message.id));

      this.closeMessage();
    } catch (error) {
      console.error('Failed to delete message:', error);

      this.error.set('Unable to delete the message.');
    }
  }

  /**
   * Reply to a message.
   */
  replyToMessage(message: ContactMessage): void {
    this.selectedMessage.set(message);

    this.composeMode.set('reply');

    this.composeTo.set(message.email);

    this.composeSubject.set(
      message.subject.toLowerCase().startsWith('re:') ? message.subject : `Re: ${message.subject}`,
    );

    this.composeMessage.set('');
  }

  /**
   * Forward a message.
   */
  forwardMessage(message: ContactMessage): void {
    this.selectedMessage.set(message);

    this.composeMode.set('forward');

    this.composeTo.set('');

    this.composeSubject.set(
      message.subject.toLowerCase().startsWith('fwd:')
        ? message.subject
        : `Fwd: ${message.subject}`,
    );

    this.composeMessage.set(
      [
        '',
        '---------- Forwarded message ----------',
        `From: ${message.name} <${message.email}>`,
        `Date: ${this.formatDate(message)}`,
        `Subject: ${message.subject}`,
        '',
        message.message,
      ].join('\n'),
    );
  }

  /**
   * Hold placeholder.
   *
   * The current ContactMessage model only supports
   * new, read, and archived statuses. We therefore
   * keep Hold visible in the UI without inventing
   * a non-persistent status.
   */
  holdMessage(_message: ContactMessage): void {
    this.error.set(
      'Hold is not enabled yet. The mailbox status model currently supports new, read, and archived.',
    );
  }

  /**
   * Create a new message.
   */
  newMessage(): void {
    this.selectedMessage.set(null);

    this.composeMode.set('new');

    this.composeTo.set('');
    this.composeSubject.set('');
    this.composeMessage.set('');
  }

  /**
   * Close composer.
   */
 closeComposer(): void {

  if (this.sending()) {
    return;
  }

  /*
   * Close the composer.
   */
  this.composeMode.set('none');

  /*
   * Also close any underlying message modal.
   */
  this.selectedMessage.set(null);

  /*
   * Clear compose fields.
   */
  this.composeTo.set('');
  this.composeSubject.set('');
  this.composeMessage.set('');

  /*
   * Clear errors.
   */
  this.error.set(null);
}

  /**
   * Send reply, forward, or new message.
   *
   * Reply uses the existing contact-reply function.
   * New and Forward use the administrator new-message function.
   */
  async sendComposedMessage(): Promise<void> {
    /*
     * Prevent duplicate submissions.
     */
    if (this.sending()) {
      return;
    }

    const to = this.composeTo().trim();

    const subject = this.composeSubject().trim();

    const message = this.composeMessage().trim();

    /*
     * Validate the compose form.
     */
    if (!to || !subject || !message) {
      this.error.set('Recipient, subject, and message are required.');

      return;
    }

    const mode = this.composeMode();

    this.sending.set(true);
    this.error.set(null);

    try {
      /*
       * Reply to an existing contact message.
       */
      if (mode === 'reply') {
        const selected = this.selectedMessage();

        if (!selected) {
          throw new Error('No message is selected.');
        }

        await this.contactService.sendReply({
          messageId: selected.id,
          to,
          subject,
          message,
        });
      } else if (mode === 'new' || mode === 'forward') {
        /*
         * New email or forwarded email.
         *
         * Exactly one Firebase request is made.
         */
        await this.contactService.sendNewMessage({
          to,
          subject,
          message,
          type: mode === 'forward' ? 'forward' : 'new',
        });
      }

    /*
 * Close the composer.
 */
this.composeMode.set('none');

/*
 * Close any underlying message-view modal too.
 */
this.selectedMessage.set(null);

/*
 * Clear compose fields.
 */
this.composeTo.set('');
this.composeSubject.set('');
this.composeMessage.set('');

/*
 * Clear any previous error.
 */
this.error.set(null);

      /*
       * Clear any previous error.
       */
      this.error.set(null);

      /*
       * Clear the selected message when the
       * composer was opened from a message.
       */
      this.selectedMessage.set(null);

      /*
       * Show success notification.
       */
      if (mode === 'reply') {
        this.showSuccessToast('Reply sent successfully.');
      } else if (mode === 'forward') {
        this.showSuccessToast('Message forwarded successfully.');
      } else {
        this.showSuccessToast('Message sent successfully.');
      }
    } catch (error) {
      console.error('Failed to send email:', error);

      /*
       * Keep the composer open when sending fails.
       */
      this.error.set('Unable to send the email. Please try again.');
    } finally {
      /*
       * Re-enable the composer after the
       * Firebase request has completed.
       */
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
   * Update the local message status.
   */
  private updateLocalStatus(messageId: string, status: ContactMessageStatus): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              status,
            }
          : message,
      ),
    );

    this.selectedMessage.update((message) =>
      message?.id === messageId
        ? {
            ...message,
            status,
          }
        : message,
    );
  }

  /**
   * Format Firestore timestamp.
   */
  formatDate(message: ContactMessage): string {
    if (message.createdAt && typeof message.createdAt.toDate === 'function') {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(message.createdAt.toDate());
    }

    return 'Unknown date';
  }
}
