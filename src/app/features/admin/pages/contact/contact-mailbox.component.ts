import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { jsPDF } from 'jspdf';
import { Router } from '@angular/router';

import {
  ContactMessage,
  ContactMessageStatus,
} from '../../../../core/models/contact-message.model';

import { ContactMessageService } from '../../../../core/services/contact-message.service';
import { ContactService } from '../../../../core/services/contact.service';
import { AuthService } from '../../../../core/services/auth.service';

type MailboxFilter = 'all' | 'unread' | 'read' | 'archived';

type ComposeMode = 'none' | 'reply' | 'forward' | 'unread';

@Component({
  selector: 'app-contact-mailbox',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->

    <div class="contact-mailbox-page min-h-screen bg-gray-50">
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
              class="truncate text-3xl font-bold
                     tracking-tight sm:text-2xl"
            >
              Zebron Mailbox
            </h1>

            <p
              class="mt-1 text-md text-white/80
                     sm:text-md"
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
              class="hidden min-h-10
         items-center justify-center
         rounded-lg border
         border-white/30
         bg-white/5 px-3 py-2
         text-sm font-medium
         text-white
         transition
         hover:bg-white/10
         disabled:cursor-not-allowed
         disabled:opacity-50
         sm:inline-flex"
              aria-label="Refresh mailbox"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]" [class.animate-spin]="loading()">
                refresh
              </mat-icon>

              <span class="ml-1">
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

              <a mat-menu-item routerLink="/admin/contact/sent">
                <mat-icon>send</mat-icon>
                <span>Sent</span>
              </a>
              <!-- Generate PDF -->
              <button
                mat-menu-item
                type="button"
                (click)="generateContactMessagesPdf()"
                [disabled]="filteredMessages().length === 0"
              >
                <mat-icon>picture_as_pdf</mat-icon>

                <span> Generate PDF </span>
              </button>

              <mat-divider></mat-divider>

              <!-- Divider -->
              <div class="border-t border-gray-100"></div>

              <button mat-menu-item type="button" (click)="loadMessages()">
                <mat-icon>refresh</mat-icon>
                <span>Refresh</span>
              </button>
              <div class="my-1 border-t border-gray-100"></div>
              <!-- Logout -->
              <button
                type="button"
                (click)="logout()"
                class="flex w-full
         items-center gap-3
         px-4 py-2.5
         text-left text-sm
         font-medium
         text-red-600
         transition
         hover:bg-red-50"
              >
                <mat-icon
                  class="!m-0 !h-5
           !w-5 !text-[20px]"
                >
                  logout
                </mat-icon>

                <span>Logout</span>
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
            class="mb-3 grid grid-cols-4
         gap-2 sm:gap-3"
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
                  All
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
                class="mt-1 text-3xl font-bold
                       leading-none text-gray-900"
              >
                {{ messages().length }}
              </p>
            </button>

            <!-- New -->
            <button
              type="button"
              (click)="setFilter('unread')"
              class="rounded-xl border
                     border-gray-200 bg-white
                     px-4 py-4 text-left
                     shadow-sm transition
                     hover:shadow-md"
              [class.ring-2]="filter() === 'unread'"
              [class.ring-blue-500/20]="filter() === 'unread'"
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
         bg-[#007979]/30
         shadow-sm
         md:bg-white"
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
                        [class.bg-blue-50]="message.status === 'unread'"
                      >
                        <!-- Sender -->
                        <td class="px-5 py-2 align-middle">
                          <div class="min-w-0">
                            <div
                              class="flex items-center
                                     gap-2"
                            >
                              @if (message.status === 'unread') {
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
                                   text-left
                                   cursor-pointer"
                          >
                            <p
                              class="break-words
                                     text-sm
                                     font-semibold
                                     leading-5
                                     text-gray-900
                                     hover:text-blue-600"
                              [class.font-bold]="message.status === 'unread'"
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
                            [class.bg-blue-100]="message.status === 'unread'"
                            [class.text-blue-700]="message.status === 'unread'"
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
                    [class.border-blue-200]="message.status === 'unread'"
                    [class.bg-blue-50]="message.status === 'unread'"
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
                        [class.bg-blue-100]="message.status === 'unread'"
                        [class.text-blue-700]="message.status === 'unread'"
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
        class="contact-message-overlay fixed inset-0 z-50
               flex items-end justify-center
               bg-black/50 p-0 sm:items-center sm:p-4"
        (click)="closeMessage()"
      >
        <section
          class="contact-print-modal max-h-[92dvh] w-full
                 max-w-xl overflow-y-auto
                 rounded-t-2xl bg-white shadow-2xl
                 sm:max-h-[90vh] sm:rounded-xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal header -->
<!-- View modal header -->
<div
  class="border-b
         bg-[#032D42]
         px-4 py-2
         sm:px-6"
>
  <div
    class="flex items-start
           justify-between
           gap-3"
  >

    <!-- Subject + Date -->
    <div class="min-w-0 flex-1">

      <!-- Subject -->
      <h2
        class="break-words
               text-base
               font-bold
               leading-5
               text-white
               sm:text-lg
               sm:leading-6
               pl-2"
      >
        {{ selectedMessage()!.subject }}
      </h2>

      <!-- Date line -->
      <div
        class="relative
               mt-1
               h-7
               w-full"
      >

        <!-- Date -->
        <p
          class="absolute
       left-2
       top-1/2
       -translate-y-1/2
       text-[10px]
       font-medium
       leading-4
       text-[#F7F4ED]
       sm:left-4
       sm:text-xs"
        >
          {{ formatDate(selectedMessage()!) }}
        </p>

        <!-- Print icon centered on date line -->
        <button
          type="button"
          (click)="printContactMessage()"
          class="absolute
                 left-1/2
                 top-1/2
                 inline-flex
                 h-7
                 w-7
                 -translate-x-1/2
                 -translate-y-1/2
                 items-center
                 justify-center
                 rounded-md
                 text-[#F7F4ED]
                 transition
                 hover:bg-white/10
                 hover:text-white
                 focus:outline-none
                 focus:ring-2
                 focus:ring-white/30"
          aria-label="Print message"
          title="Print message"
        >
          <mat-icon
            class="!m-0
                   !h-4
                   !w-4
                   !text-[17px]"
          >
            print
          </mat-icon>
        </button>

      </div>
    </div>

    <!-- Close -->
    <button
      type="button"
      (click)="closeMessage()"
      class="inline-flex
             h-8
             w-8
             shrink-0
             items-center
             justify-center
             rounded-md
             text-gray-300
             transition
             hover:bg-white/10
             hover:text-white
             focus:outline-none
             focus:ring-2
             focus:ring-white/30"
      aria-label="Close message"
    >
      <mat-icon
        class="!m-0
               !h-5
               !w-5"
      >
        close
      </mat-icon>
    </button>

  </div>
</div>

          <!-- Sender -->
          <div
            class="border-b
                   bg-gray-50
                   px-4 py-1
                   sm:px-6"
          >
            <div
              class="space-y-1.5
         rounded-lg
         bg-gray-50
         px-3 py-1
         sm:space-y-1
         sm:px-4 sm:py-1"
            >
              <!-- From -->
              <div
                class="flex items-center
           gap-2"
              >
                <span
                  class="w-12 shrink-0
             text-[13px]
             font-semibold
             text-gray-500
             sm:w-14
             sm:text-md"
                >
                  From
                </span>

                <span
                  class="min-w-0 truncate
             text-md
             font-medium
             text-gray-900
             sm:text-md"
                >
                  {{ selectedMessage()!.name }}
                </span>
              </div>

              <!-- Email -->
              <div
                class="flex items-center
           gap-2"
              >
                <span
                  class="w-12 shrink-0
             text-[13px]
             font-semibold
             text-gray-500
             sm:w-14
             sm:text-md"
                >
                  Email
                </span>

                <span
                  class="min-w-0 truncate
             text-md
             text-gray-700
             sm:text-md"
                >
                  {{ selectedMessage()!.email }}
                </span>
              </div>

              <!-- Subject -->
              <div
                class="flex items-center
           gap-2"
              >
                <span
                  class="w-12 shrink-0
             text-[13px]
             font-semibold
             text-gray-500
             sm:w-14
             sm:text-md"
                >
                  Subject
                </span>

                <span
                  class="min-w-0 truncate
             text-xs
             font-medium
             text-gray-900
             sm:text-sm"
                >
                  {{ selectedMessage()!.subject }}
                </span>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div class="max-h-[45dvh] overflow-y-auto px-4 py-5 sm:max-h-none sm:px-6">
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
          <!-- Modal actions -->
          <div
            class="flex w-full items-center
         gap-1.5 border-t
         px-3 py-3
         sm:gap-2 sm:px-6
         bg-[#2A835F]/80"
          >
            <!-- Reply -->
            <button
              type="button"
              (click)="replyToMessage(selectedMessage()!)"
              class="inline-flex min-w-0 flex-1
           h-9 items-center justify-center
           gap-1 rounded-md
           bg-[#032D42]
           px-2
           text-[11px] font-semibold
           text-white
           transition
           hover:bg-[#064B68]
           sm:flex-none sm:px-3
           sm:text-xs"
            >
              <mat-icon
                class="!m-0 !h-4 !w-4
             !text-[16px]"
              >
                reply
              </mat-icon>

              <span>Reply</span>
            </button>

            <!-- Forward -->
            <button
              type="button"
              (click)="forwardMessage(selectedMessage()!)"
              class="inline-flex min-w-0 flex-1
           h-9 items-center justify-center
           gap-1 rounded-md
           border border-gray-200
           bg-white
           px-2
           text-[11px] font-semibold
           text-gray-700
           transition
           hover:bg-gray-50
           sm:flex-none sm:px-3
           sm:text-xs"
            >
              <mat-icon
                class="!m-0 !h-4 !w-4
             !text-[16px]"
              >
                send
              </mat-icon>

              <span>Forward</span>
            </button>

         

            <!-- Delete -->
            <button
              type="button"
              (click)="deleteMessage(selectedMessage()!)"
              class="inline-flex min-w-0 flex-1
           h-9 items-center justify-center
           gap-1 rounded-md
           bg-red-50
           px-2
           text-[11px] font-semibold
           text-red-700
           transition
           hover:bg-red-100
           sm:ml-auto
           sm:flex-none sm:px-3
           sm:text-xs"
            >
              <mat-icon
                class="!m-0 !h-4 !w-4
             !text-[16px]"
              >
                delete
              </mat-icon>

              <span>Delete</span>
            </button>

            <!-- Close -->
            <button
              type="button"
              (click)="closeMessageModal()"
              class="inline-flex min-w-0 flex-1
           h-9 items-center justify-center
           gap-1 rounded-md
           border border-gray-300
           bg-white
           px-2
           text-[11px] font-semibold
           text-gray-700
           transition
           hover:bg-gray-50
           sm:flex-none sm:px-3
           sm:text-xs"
            >
              <mat-icon
                class="!m-0 !h-4 !w-4
             !text-[16px]"
              >
                close
              </mat-icon>

              <span>Close</span>
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
               flex items-end justify-center
               bg-black/50 p-0 sm:items-center sm:p-4"
        (click)="closeComposer()"
      >
        <section
          class="max-h-[94dvh] w-full max-w-xl
                 overflow-y-auto rounded-t-2xl bg-white
                 shadow-2xl sm:max-h-[92vh] sm:rounded-xl"
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
              class="grid grid-cols-2
                     gap-2 border-t pt-4
                     sm:flex sm:justify-end"
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

      @media print {
        @page {
          size: auto;
          margin: 12mm;
        }

        body * {
          visibility: hidden !important;
        }

        .contact-print-modal,
        .contact-print-modal * {
          visibility: visible !important;
        }

        .contact-message-overlay {
          position: static !important;
          display: block !important;
          padding: 0 !important;
          background: transparent !important;
        }

        .contact-print-modal {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          max-width: none !important;
          max-height: none !important;
          overflow: visible !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .contact-print-modal button {
          display: none !important;
        }
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
export class ContactMailboxComponent implements OnInit, OnDestroy {
  private readonly contactService = inject(ContactService);

  private readonly contactMessageService = inject(ContactMessageService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

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
   * Unsubscribe function for the real-time Firestore mailbox listener.
   */
  private unsubscribeMessages: (() => void) | null = null;

  /**
   * Number of new messages.
   */
  readonly newCount = computed(
    () => this.messages().filter((message) => message.status === 'unread').length,
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

  const search =
    this.searchQuery()
      .trim()
      .toLowerCase();

  return this.messages().filter((message) => {
    /**
     * Firestore uses "unread" for newly received
     * messages. The mailbox therefore uses "unread"
     * as its New state.
     */
    const matchesStatus =
      currentFilter === 'all' ||
      message.status === currentFilter;

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
    this.startMessageListener();
  }

  /**
   * Start the real-time Firestore mailbox listener.
   */
  private startMessageListener(): void {
  this.loading.set(true);
  this.error.set(null);

  // Remove any previous listener before creating a new one.
  this.unsubscribeMessages?.();

  this.unsubscribeMessages =
    this.contactMessageService.listenToContactMessages(
      (messages) => {
        /**
         * Normalize legacy "new" records to the mailbox's
         * current "unread" status.
         *
         * This is important because older contact-form
         * messages may have been stored as:
         *
         *   status: "new"
         *
         * while inbound Resend emails are stored as:
         *
         *   status: "unread"
         *
         * The mailbox uses "unread" as its canonical
         * new-message state.
         */
        const normalizedMessages =
          messages.map((message) => ({
            ...message,

            status:
              message.status === 'unread'
                ? 'unread'
                : message.status,
          }));

        this.messages.set(
          normalizedMessages as ContactMessage[],
        );

        this.loading.set(false);
      },

      (error) => {
        console.error(
          'Contact mailbox listener failed:',
          error,
        );

        this.loading.set(false);

        this.error.set(
          'Unable to load contact messages. Please try again.',
        );
      },
    );
}

  /**
   * Manual refresh. The real-time listener remains active.
   */
  async loadMessages(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
     const messages =
  await this.contactMessageService.getAllContactMessages();

/**
 * Normalize legacy "new" messages to "unread".
 */
const normalizedMessages =
  messages.map((message) => ({
    ...message,

    status:
      message.status === 'unread'
        ? 'unread'
        : message.status,
  }));

this.messages.set(
  normalizedMessages as ContactMessage[],
);
    } catch (error) {
      console.error('Failed to load contact messages:', error);
      this.error.set('Unable to load contact messages. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clean up the Firestore listener and toast timer.
   */
  ngOnDestroy(): void {
    this.unsubscribeMessages?.();
    this.unsubscribeMessages = null;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
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

    if (message.status !== 'unread') {
      return;
    }

    await this.markAsRead(message);
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

    // Close the message view before opening the composer.
    this.closeMessage();
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

    // Close the message view before opening the composer.
    this.closeMessage();
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

    this.composeMode.set('unread');

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

    this.composeMode.set('none');

    this.composeTo.set('');
    this.composeSubject.set('');
    this.composeMessage.set('');
  }

  /**
   * Send reply, forward, or new message.
   *
   * Reply uses the existing contact-reply backend function.
   * New and Forward use the administrator new-message function.
   */
  async sendComposedMessage(): Promise<void> {
    const to = this.composeTo().trim();

    const subject = this.composeSubject().trim();

    const message = this.composeMessage().trim();

    /*
     * Validate the compose form before
     * calling Firebase Functions.
     */
    if (!to || !subject || !message) {
      this.error.set('Recipient, subject, and message are required.');

      return;
    }

    this.sending.set(true);
    this.error.set(null);

    try {
      const mode = this.composeMode();

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

        this.showSuccessToast('Reply sent successfully.');
      } else if (mode === 'unread' || mode === 'forward') {
        /*
         * New email and Forward both use
         * the administrator new-message
         * backend function.
         *
         * Forwarding has already been prepared
         * by forwardMessage(), including the
         * Fwd: subject and forwarded content.
         */
        await this.contactService.sendNewMessage({
          to,
          subject,
          message,
          type: mode === 'forward' ? 'forward' : 'new',
        });
        this.showSuccessToast(
          mode === 'forward' ? 'Message forwarded successfully.' : 'Message sent successfully.',
        );
      } else {
        /*
         * No active compose mode.
         */
        return;
      }

      /*
       * Release the sending lock before cleanup.
       * closeComposer() intentionally does nothing while
       * sending is true.
       */
      this.sending.set(false);

      /*
       * Close and reset the composer after
       * a successful send.
       */
      this.closeComposer();

      /*
       * Refresh the mailbox so the current view remains
       * immediately synchronized after sending.
       */
      await this.loadMessages();
    } catch (error) {
      console.error('Failed to send email:', error);

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

  /**
   * Generate a PDF containing the records currently displayed
   * in the mailbox.
   *
   * The PDF follows the current search and status filters because
   * it uses filteredMessages().
   */
  generateContactMessagesPdf(): void {
    const records = this.filteredMessages();

    if (records.length === 0) {
      this.error.set('There are no displayed records to export.');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 12;
    const usableWidth = pageWidth - margin * 2;

    /*
     * Header
     */
    pdf.setFillColor(3, 45, 66);
    pdf.rect(0, 0, pageWidth, 24, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');

    pdf.text('Zebron Contact Mailbox', margin, 10);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    pdf.text(
      `Generated: ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date())}`,
      margin,
      17,
    );

    /*
     * Summary
     */
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');

    pdf.text(`Records displayed: ${records.length}`, margin, 32);

    /*
     * Table configuration.
     */
    const columns = [
      {
        title: '#',
        width: 10,
      },
      {
        title: 'Sender',
        width: 42,
      },
      {
        title: 'Email',
        width: 55,
      },
      {
        title: 'Subject',
        width: 70,
      },
      {
        title: 'Date',
        width: 42,
      },
      {
        title: 'Status',
        width: 25,
      },
    ];

    /*
     * Make sure the column widths fit the page.
     */
    const totalColumnWidth = columns.reduce((total, column) => total + column.width, 0);

    const widthScale = usableWidth / totalColumnWidth;

    columns.forEach((column) => {
      column.width *= widthScale;
    });

    let y = 40;

    const rowHeight = 9;
    const headerHeight = 10;

    /*
     * Draw table header.
     */
    const drawTableHeader = (): void => {
      let x = margin;

      pdf.setFillColor(238, 243, 245);
      pdf.rect(margin, y - 7, usableWidth, headerHeight, 'F');

      pdf.setTextColor(3, 45, 66);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');

      for (const column of columns) {
        pdf.text(column.title, x + 2, y);

        x += column.width;
      }

      y += rowHeight;
    };

    drawTableHeader();

    /*
     * Draw each record.
     */
    records.forEach((message, index) => {
      /*
       * Start a new page when necessary.
       */
      if (y > pageHeight - 18) {
        pdf.addPage();

        y = 18;

        drawTableHeader();
      }

      const date = this.formatDate(message);

      const row = [
        String(index + 1),
        message.name || '',
        message.email || '',
        message.subject || '',
        date,
        message.status || '',
      ];

      /*
       * Alternate row background.
       */
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);

        pdf.rect(margin, y - 6, usableWidth, rowHeight, 'F');
      }

      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');

      let x = margin;

      row.forEach((value, columnIndex) => {
        const column = columns[columnIndex];

        /*
         * Limit text to the available column width.
         */
        const maxWidth = column.width - 4;

        const lines = pdf.splitTextToSize(value, maxWidth);

        const displayText = lines.length > 0 ? lines[0] : '';

        pdf.text(displayText, x + 2, y);

        x += column.width;
      });

      y += rowHeight;
    });

    /*
     * Footer on every page.
     */
    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);

      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');

      pdf.text(`Zebron Contact Mailbox • Page ${page} of ${pageCount}`, margin, pageHeight - 7);
    }

    /*
     * Create a safe filename.
     */
    const datePart = new Date().toISOString().slice(0, 10);

    pdf.save(`zebron-contact-mailbox-${datePart}.pdf`);
  }

  /**
   * Print the currently viewed contact message.
   */
  printContactMessage(): void {
    window.print();
  }

  /**
   * Close the message view modal.
   */
  closeMessageModal(): void {
    this.selectedMessage.set(null);
  }

  /**
   * Sign the administrator out and return to
   * the login page.
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();

      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Failed to log out:', error);

      this.error.set('Unable to log out. Please try again.');
    }
  }
}
