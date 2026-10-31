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

import { ContactStore } from '../../../contact/stores/contact.store';
import { AuthService } from '../../../../core/services/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
type MailboxFilter = 'inbox' | 'all' | 'unread' | 'read' | 'archived';

type ComposeMode = 'none' | 'reply' | 'forward' | 'unread';

@Component({
  selector: 'app-contact-mailbox',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->

    <div class="contact-mailbox-page min-h-screen bg-slate-50 pt-16">
      <!-- =======================================================
           HEADER (one compact row)
           ======================================================= -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:px-6 lg:px-8">
          <div class="min-w-0 flex-1 sm:flex-none">
            <h1 class="truncate text-lg font-semibold">Mailbox</h1>
            <p class="hidden truncate text-xs text-white/80 lg:block">Messages sent through the Zebron contact form</p>
          </div>

          <!-- Search (full width on phones, on its own line) -->
          <mat-form-field appearance="outline" class="zb-field zb-search order-last w-full sm:order-none sm:mx-auto sm:max-w-md">
            <mat-label>Search mailbox</mat-label>
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input
              matInput
              id="mailbox-search"
              type="search"
              [value]="searchQuery()"
              (input)="setSearch($any($event.target).value)"
              placeholder="Search sender, subject or message"
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
            routerLink="/admin/contact/sent"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white sm:w-auto sm:px-3"
            [attr.aria-label]="'Sent'"
            title="Sent"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">send</mat-icon>
            <span class="hidden sm:inline">Sent</span>
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
            [matMenuTriggerFor]="mailboxMenu"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="More mailbox options"
            title="More"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
          </button>

          <mat-menu #mailboxMenu="matMenu" xPosition="before">
            <button mat-menu-item type="button" (click)="generateContactMessagesPdf()" [disabled]="filteredMessages().length === 0">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>Export to PDF</span>
            </button>
            <a mat-menu-item routerLink="/admin">
              <mat-icon>dashboard</mat-icon>
              <span>Admin dashboard</span>
            </a>
            <mat-divider></mat-divider>
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <!-- =======================================================
           MAIN
           ======================================================= -->
      <main class="px-3 py-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          @if (error()) {
            <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
              {{ error() }}
            </div>
          }

          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <!-- Toolbar: folders + search -->
            <div class="flex min-h-11 items-center gap-2 border-b border-slate-200 px-2 py-1.5 sm:px-3">
              <!-- Select all (visible rows) -->
              <label class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-100" title="Select all">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                  [checked]="allVisibleChecked()"
                  [indeterminate]="someVisibleChecked()"
                  [disabled]="visibleMessages().length === 0"
                  (change)="toggleAllVisible()"
                  aria-label="Select all messages"
                />
              </label>

              @if (checkedMessages().length > 0) {
                <!-- Bulk actions -->
                <div class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="toolbar" aria-label="Selected messages">
                  <span class="mr-1 shrink-0 text-sm font-semibold text-slate-900">{{ checkedMessages().length }} selected</span>
                  @if (checkedAllArchived()) {
                    <button type="button" (click)="bulkMoveToInbox()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                      <span class="hidden sm:inline">Move to inbox</span>
                    </button>
                  } @else {
                    <button type="button" (click)="bulkArchive()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                      <span class="hidden sm:inline">Archive</span>
                    </button>
                  }
                  <button type="button" (click)="bulkMarkRead()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">drafts</mat-icon>
                    <span class="hidden sm:inline">Mark read</span>
                  </button>
                  <button type="button" (click)="bulkDelete()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 hover:!bg-red-50 hover:!text-red-600">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                    <span class="hidden sm:inline">Delete</span>
                  </button>
                  <button type="button" (click)="clearSelection()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 ml-auto" title="Clear selection">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
                    <span class="hidden sm:inline">Clear</span>
                  </button>
                </div>
              } @else {
              <nav class="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1" aria-label="Mailbox folders">
                @for (folder of folders(); track folder.key) {
                  <button
                    type="button"
                    (click)="setFilter(folder.key)"
                    [attr.aria-pressed]="filter() === folder.key"
                    [class]="filter() === folder.key
                      ? 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#007979]/10 px-3 text-sm font-semibold text-[#006666]'
                      : 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'"
                  >
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">{{ folder.icon }}</mat-icon>
                    {{ folder.label }}
                    @if (folder.count > 0) {
                      <span
                        [class]="folder.key === 'unread'
                          ? 'rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white'
                          : 'rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold leading-[18px] text-slate-600'"
                      >
                        {{ folder.count }}
                      </span>
                    }
                  </button>
                }
              </nav>
              }
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
                <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">{{ searchQuery() ? 'search_off' : 'inbox' }}</mat-icon>
                <p class="mt-2 text-sm font-semibold text-slate-900">
                  {{ searchQuery() ? 'No messages match your search' : filter() === 'unread' || filter() === 'inbox' ? 'You\\u0027re all caught up' : 'No messages here' }}
                </p>
                @if (searchQuery()) {
                  <button type="button" (click)="setSearch('')" class="mt-2 text-sm font-medium text-[#007979] hover:underline">Clear search</button>
                }
              </div>
            } @else {
              <ul class="divide-y divide-slate-100">
                @for (message of visibleMessages(); track message.id) {
                  <li
                    class="group relative flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 hover:shadow-[inset_3px_0_0_#007979] sm:px-4"
                    [ngClass]="{ 'bg-teal-50/40': message.status === 'unread' && !isChecked(message), '!bg-[#007979]/10': isChecked(message) }"
                    (click)="openMessage(message)"
                  >
                    <!-- Select -->
                    <label class="-my-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-200/60" (click)="$event.stopPropagation()">
                      <input
                        type="checkbox"
                        class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                        [checked]="isChecked(message)"
                        (change)="toggleChecked(message)"
                        [attr.aria-label]="'Select message from ' + (message.name || message.email)"
                      />
                    </label>

                    <!-- Unread marker -->
                    <span
                      class="h-2 w-2 shrink-0 rounded-full"
                      [ngClass]="{ 'bg-[#007979]': message.status === 'unread' }"
                      [attr.aria-label]="message.status === 'unread' ? 'New' : null"
                    ></span>

                    <!-- Desktop: one line. Mobile: sender + date, then subject. -->
                    <div class="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                      <div class="flex items-center justify-between gap-2 sm:w-52 sm:shrink-0">
                        <p
                          class="truncate text-sm"
                          [class]="message.status === 'unread' ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm text-slate-700'"
                          [title]="message.email"
                        >
                          {{ message.name || message.email }}
                        </p>
                        <span class="shrink-0 text-xs text-slate-500 sm:hidden">{{ shortDate(message) }}</span>
                      </div>

                      <p class="mt-0.5 flex min-w-0 flex-1 items-center gap-2 sm:mt-0">
                        <span
                          [class]="message.status === 'unread' ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm text-slate-600'"
                        >
                          {{ message.subject || '(No subject)' }}
                        </span>
                        @if (message.status === 'archived' && filter() !== 'archived') {
                          <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium leading-[18px] text-slate-500">Archived</span>
                        }
                      </p>
                    </div>

                    <!-- Date (desktop), swapped for quick actions on hover -->
                    <span
                      class="hidden w-20 shrink-0 text-right text-xs sm:block sm:group-hover:invisible sm:group-focus-within:invisible"
                      [class]="message.status === 'unread' ? 'hidden w-20 shrink-0 text-right text-xs font-semibold text-slate-900 sm:block sm:group-hover:invisible sm:group-focus-within:invisible' : 'hidden w-20 shrink-0 text-right text-xs text-slate-500 sm:block sm:group-hover:invisible sm:group-focus-within:invisible'"
                      [title]="formatDate(message)"
                    >
                      {{ shortDate(message) }}
                    </span>

                    <div
                      class="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg bg-slate-50 pl-2 sm:group-hover:flex sm:group-focus-within:flex"
                      (click)="$event.stopPropagation()"
                    >
                      <button type="button" (click)="replyToMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Reply" title="Reply">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
                      </button>
                      @if (message.status === 'archived') {
                        <button type="button" (click)="unarchiveMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Move to inbox" title="Move to inbox">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                        </button>
                      } @else {
                        <button type="button" (click)="archiveMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Archive" title="Archive">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                        </button>
                      }
                      <button type="button" (click)="deleteMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete" title="Delete">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                      </button>
                      <button
                        type="button"
                        [matMenuTriggerFor]="messageMenu"
                        [matMenuTriggerData]="{ message: message }"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        aria-label="More actions"
                        title="More"
                      >
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">more_vert</mat-icon>
                      </button>
                    </div>

                    <!-- Mobile: actions menu -->
                    <button
                      type="button"
                      [matMenuTriggerFor]="messageMenu"
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

              <!-- Footer -->
              <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                <span>
                  {{ visibleMessages().length }} of {{ filteredMessages().length }}
                  {{ filteredMessages().length === 1 ? 'message' : 'messages' }}
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
          <mat-icon>forward</mat-icon>
          <span>Forward</span>
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

    @if (selectedMessage(); as msg) {
      <div
        class="contact-message-overlay fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        (click)="closeMessage()"
      >
        <section
          class="contact-print-modal flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-message-subject"
          (click)="$event.stopPropagation()"
        >
          <!-- Toolbar -->
          <div class="flex items-center gap-1 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-3 py-2 sm:px-5">
            <button type="button" (click)="closeMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Back to mailbox" title="Back to mailbox">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">arrow_back</mat-icon>
            </button>

            <span class="mx-1 h-5 w-px bg-white/30" aria-hidden="true"></span>

            @if (msg.status === 'archived') {
              <button type="button" (click)="unarchiveMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Move to inbox" title="Move to inbox">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
              </button>
            } @else {
              <button type="button" (click)="archiveMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Archive" title="Archive">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
              </button>
            }
            <button type="button" (click)="deleteMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:!bg-white/15 hover:!text-white" aria-label="Delete" title="Delete">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
            </button>

            <div class="ml-auto flex items-center gap-1">
              <button type="button" (click)="printContactMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Print message" title="Print">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">print</mat-icon>
              </button>
              <button type="button" (click)="closeMessage()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Close message" title="Close">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Scrollable message -->
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="px-5 pb-8 pt-6 sm:px-10">
              <!-- Subject -->
              <div class="flex flex-wrap items-start gap-x-3 gap-y-2">
                <h2 id="contact-message-subject" class="min-w-0 flex-1 break-words text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                  {{ msg.subject || '(No subject)' }}
                </h2>
                <span
                  [class]="msg.status === 'unread' ? 'mt-1 shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700' : msg.status === 'archived' ? 'mt-1 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600' : 'mt-1 shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700'"
                >
                  {{ msg.status === 'unread' ? 'New' : msg.status }}
                </span>
              </div>

              <!-- Sender -->
              <div class="mt-6 flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007979] text-base font-semibold text-white" aria-hidden="true">
                  {{ (msg.name || msg.email || '?').charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <p class="min-w-0 truncate text-sm text-slate-900">
                      <span class="font-semibold">{{ msg.name || msg.email }}</span>
                      @if (msg.name && msg.name !== msg.email) {
                        <span class="text-slate-500">&lt;{{ msg.email }}&gt;</span>
                      }
                    </p>
                    <p class="shrink-0 text-xs text-slate-500">{{ formatDate(msg) }}</p>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-500">to Zebron</p>
                </div>
              </div>

              <!-- Body -->
              <div class="mt-6 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800 sm:pl-[52px]">{{ msg.message }}</div>

            </div>
          </div>
          <!-- Footer actions -->
          <div class="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <button type="button" (click)="replyToMessage(msg)" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]/40 bg-[#007979] text-white shadow-sm hover:bg-[#006666]">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
              Reply
            </button>
            <button type="button" (click)="forwardMessage(msg)" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]/40 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
              Forward
            </button>
            <button type="button" (click)="closeMessage()" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]/40 ml-auto text-slate-600 hover:bg-slate-100">
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
        class="fixed inset-0 z-[60] flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        (click)="closeComposer()"
      >
        <section
          class="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Composer header -->
          <div
            class="flex items-center
                   justify-between
                   gap-3
                   bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]
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
            class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6"
            (submit)="$event.preventDefault(); sendComposedMessage()"
          >
            <!-- To -->
            <div>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>To</mat-label>
                <input matInput
                id="compose-to"
                type="email"
                [value]="composeTo()"
                (input)="composeTo.set($any($event.target).value)"
                placeholder="recipient@example.com"
                required
                [disabled]="sending()"
              />
              </mat-form-field>
            </div>

            <!-- Subject -->
            <div>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Subject</mat-label>
                <input matInput
                id="compose-subject"
                type="text"
                [value]="composeSubject()"
                (input)="composeSubject.set($any($event.target).value)"
                placeholder="Message subject"
                required
                [disabled]="sending()"
              />
              </mat-form-field>
            </div>

            <!-- Message -->
            <div>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Message</mat-label>
                <textarea matInput
                id="compose-message"
                rows="14"
                [value]="composeMessage()"
                (input)="composeMessage.set($any($event.target).value)"
                placeholder="Write your message..."
                required
                [disabled]="sending()"
              ></textarea>
              </mat-form-field>
            </div>

            <!-- Actions -->
            <div
              class="mt-auto grid grid-cols-2
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
  private readonly contactStore = inject(ContactStore);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  /**
   * All messages.
   */
  readonly messages = this.contactStore.messages;

  /**
   * Search text.
   */
  readonly searchQuery = signal('');

  /**
   * Current mailbox filter.
   */
  readonly filter = signal<MailboxFilter>('inbox');

  /**
   * Currently opened message.
   */
  readonly selectedMessage = this.contactStore.selectedMessage;
  /**
   * Loading state.
   */
  readonly loading = this.contactStore.loading;

  /**
   * Error message.
   */
  readonly error = this.contactStore.error;

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

  readonly uiError = signal<string | null>(null);
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
  /** Folder tabs with their counts. */
  readonly folders = computed(() => [
    { key: 'inbox' as MailboxFilter, label: 'Inbox', icon: 'inbox', count: this.messages().length - this.archivedCount() },
    { key: 'unread' as MailboxFilter, label: 'New', icon: 'mark_email_unread', count: this.newCount() },
    { key: 'read' as MailboxFilter, label: 'Read', icon: 'drafts', count: this.readCount() },
    { key: 'archived' as MailboxFilter, label: 'Archived', icon: 'archive', count: this.archivedCount() },
    { key: 'all' as MailboxFilter, label: 'All mail', icon: 'all_inbox', count: this.messages().length },
  ]);

  /** Rows shown; "Show more" adds another page. */
  private readonly pageSize = 25;

  readonly visibleCount = signal(25);

  readonly filteredMessages = computed(() => {
    const currentFilter = this.filter();

    const search = this.searchQuery().trim().toLowerCase();

    return this.messages().filter((message) => {
      /**
       * Firestore uses "unread" for newly received
       * messages. The mailbox therefore uses "unread"
       * as its New state.
       */
      const matchesStatus =
        currentFilter === 'all' ||
        (currentFilter === 'inbox' ? message.status !== 'archived' : message.status === currentFilter);

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

  readonly visibleMessages = computed(() => this.filteredMessages().slice(0, this.visibleCount()));

  ngOnInit(): void {
    this.contactStore.startMessageListener();
  }

  showMore(): void {
    this.visibleCount.update((count) => count + this.pageSize);
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleCount.set(this.pageSize);
    this.clearSelection();
  }

  /** "3:45 PM" today, "Oct 29" this year, "Oct 29, 2025" otherwise. */
  shortDate(message: ContactMessage): string {
    if (!message.createdAt || typeof message.createdAt.toDate !== 'function') {
      return '';
    }
    const date = message.createdAt.toDate();
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
   * Manual refresh. The real-time listener remains active.
   */
  async loadMessages(): Promise<void> {
    await this.contactStore.loadMessages();
  }

  /**
   * Clean up the Firestore listener and toast timer.
   */
  ngOnDestroy(): void {
    this.contactStore.stopMessageListener();

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
    this.visibleCount.set(this.pageSize);
    this.clearSelection();
  }

  // ===========================================================
  // Multi-select (checkboxes) and bulk actions
  // ===========================================================

  /** IDs of the checked messages. */
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  /** Checked messages that are still in the current view. */
  readonly checkedMessages = computed(() => {
    const ids = this.selectedIds();
    return this.visibleMessages().filter((message) => ids.has(message.id));
  });

  readonly allVisibleChecked = computed(
    () => this.visibleMessages().length > 0 && this.checkedMessages().length === this.visibleMessages().length,
  );

  readonly someVisibleChecked = computed(
    () => this.checkedMessages().length > 0 && !this.allVisibleChecked(),
  );

  /** Every checked message is archived (bulk action becomes "Move to inbox"). */
  readonly checkedAllArchived = computed(
    () => this.checkedMessages().length > 0 && this.checkedMessages().every((message) => message.status === 'archived'),
  );

  readonly bulkBusy = signal(false);

  isChecked(message: ContactMessage): boolean {
    return this.selectedIds().has(message.id);
  }

  toggleChecked(message: ContactMessage, event?: Event): void {
    event?.stopPropagation();
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }
      return next;
    });
  }

  toggleAllVisible(): void {
    this.selectedIds.set(
      this.allVisibleChecked() ? new Set() : new Set(this.visibleMessages().map((message) => message.id)),
    );
  }

  clearSelection(): void {
    if (this.selectedIds().size) {
      this.selectedIds.set(new Set());
    }
  }

  private async runBulk(action: (message: ContactMessage) => Promise<void>, done: string): Promise<void> {
    const messages = this.checkedMessages();
    if (!messages.length || this.bulkBusy()) {
      return;
    }
    this.bulkBusy.set(true);
    try {
      const results = await Promise.allSettled(messages.map((message) => action(message)));
      const failed = results.filter((result) => result.status === 'rejected').length;
      this.clearSelection();
      this.showSuccessToast(
        failed ? `${messages.length - failed} ${done}, ${failed} failed.` : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'} ${done}.`,
      );
    } finally {
      this.bulkBusy.set(false);
    }
  }

  bulkArchive(): Promise<void> {
    return this.runBulk((message) => this.contactStore.archiveMessage(message.id), 'archived');
  }

  bulkMoveToInbox(): Promise<void> {
    return this.runBulk((message) => this.contactStore.unarchiveMessage(message.id), 'moved to the inbox');
  }

  bulkMarkRead(): Promise<void> {
    return this.runBulk(
      (message) => (message.status === 'unread' ? this.contactStore.markAsRead(message.id) : Promise.resolve()),
      'marked as read',
    );
  }

  async bulkDelete(): Promise<void> {
    const count = this.checkedMessages().length;
    if (!count || !window.confirm(`Delete ${count} ${count === 1 ? 'message' : 'messages'}? This cannot be undone.`)) {
      return;
    }
    await this.runBulk((message) => this.contactStore.deleteMessage(message.id), 'deleted');
  }

  /**
   * Open a message.
   *
   * New messages become read when opened.
   */
  async openMessage(message: ContactMessage): Promise<void> {
    this.contactStore.setSelectedMessage(message);

    if (message.status !== 'unread') {
      return;
    }

    await this.markAsRead(message);
  }

  /**
   * Close message modal.
   */
  closeMessage(): void {
    this.contactStore.clearSelectedMessage();
  }

  /**
   * Mark message as read.
   */
  async markAsRead(message: ContactMessage): Promise<void> {
    try {
      await this.contactStore.markAsRead(message.id);
    } catch (error) {
      console.error('Failed to mark message as read:', error);

      // Store already owns the backend state.
      // Keep the component error UI here.
      // We cannot set the Store's error signal directly.
    }
  }

  /**
   * Archive a message.
   */
  async archiveMessage(message: ContactMessage): Promise<void> {
    try {
      await this.contactStore.archiveMessage(message.id);

      this.closeMessage();
    } catch (error) {
      console.error('Failed to archive message:', error);
    }
  }

  /**
   * Restore an archived message.
   */
  async unarchiveMessage(message: ContactMessage): Promise<void> {
    try {
      await this.contactStore.unarchiveMessage(message.id);

      this.closeMessage();
    } catch (error) {
      console.error('Failed to restore message:', error);
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
      await this.contactStore.deleteMessage(message.id);

      this.closeMessage();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }

  /**
   * Reply to a message.
   */
  replyToMessage(message: ContactMessage): void {
    this.contactStore.setSelectedMessage(message);

    this.closeMessage();

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
    this.contactStore.setSelectedMessage(message);

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
    this.uiError.set(
      'Hold is not enabled yet. The mailbox status model currently supports new, read, and archived.',
    );
  }

  /**
   * Create a new message.
   */
  newMessage(): void {
    this.contactStore.clearSelectedMessage();

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
      this.uiError.set('Recipient, subject, and message are required.');

      return;
    }

    this.sending.set(true);
    this.uiError.set(null);

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

        await this.contactStore.sendReply({
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
        await this.contactStore.sendNewMessage({
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

      this.uiError.set('Unable to send the email. Please try again.');
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
      this.uiError.set('There are no displayed records to export.');
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
  /**
   * Print just the open message: subject, sender, date and body, laid
   * out as a clean page in a hidden frame (the rest of the app is not
   * printed).
   */
  printContactMessage(): void {
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

    const status = message.status === 'unread' ? 'New' : message.status === 'archived' ? 'Archived' : 'Read';
    const printed = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const rows = [
      ['From', message.name && message.name !== message.email ? `${message.name} <${message.email}>` : message.email],
      ['To', 'Zebron'],
      ['Date', this.formatDate(message)],
      ['Status', status],
    ]
      .map(([label, value]) => `<tr><th>${label}</th><td>${escape(value)}</td></tr>`)
      .join('');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(message.subject || 'Message')}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
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
  <div class="band"><strong>ZEBRON</strong><span>Contact message</span></div>
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

    const cleanUp = () => setTimeout(() => frame.remove(), 500);
    frameWindow.addEventListener('afterprint', cleanUp, { once: true });

    // Let the frame lay out before printing.
    setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      // Fallback for browsers that don't fire afterprint on frames.
      setTimeout(() => frame.isConnected && frame.remove(), 60_000);
    }, 50);
  }

  /**
   * Close the message view modal.
   */
  closeMessageModal(): void {
    this.contactStore.clearSelectedMessage();
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

      this.uiError.set('Unable to log out. Please try again.');
    }
  }
}
