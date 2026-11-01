import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
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
import { ActivatedRoute, Router } from '@angular/router';

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
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { MailComposerComponent, MailReaderComponent } from './shared/mail-popups';
import {
  PLATFORM_GENERAL_MAILBOX,
  PLATFORM_MAILBOX_NAMES,
  PlatformMailbox,
  PlatformMailboxService,
  SUGGESTED_PLATFORM_MAILBOXES,
  platformMailboxAddress,
} from '../../../../core/services/platform-mailbox.service';

/** The create / edit form in "Manage mailboxes". */
interface PlatformMailboxForm {
  isNew: boolean;
  id: string;
  name: string;
  description: string;
  forwardTo: string;
  active: boolean;
}
type MailboxFilter = 'inbox' | 'all' | 'unread' | 'read' | 'archived';

type ComposeMode = 'none' | 'reply' | 'forward' | 'unread';

@Component({
  selector: 'app-contact-mailbox',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, MailReaderComponent, MailComposerComponent, MatIconModule, MatMenuModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
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
            <h1 class="truncate text-lg font-semibold">{{ 'Mailbox' | t }}</h1>
            <button
              type="button"
              [matMenuTriggerFor]="mailboxSwitcher"
              class="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold text-white transition hover:bg-white/25"
              [attr.aria-label]="'Switch mailbox' | t"
            >
              <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ currentMailboxId() === generalMailboxId ? 'inbox' : 'groups' }}</mat-icon>
              <span class="truncate">{{ (currentPlatformMailbox()?.name ?? 'General') | t }}</span>
              <span class="hidden font-normal text-white/80 md:inline">· {{ mailboxAddress(currentMailboxId()) }}</span>
              @if (otherMailboxesUnread() > 0) {
                <span class="rounded-full bg-white px-1.5 text-[10px] font-bold leading-4 text-[#006666]" [title]="'Unread in your other mailboxes' | t">{{ otherMailboxesUnread() }}</span>
              }
              <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">expand_more</mat-icon>
            </button>

            <mat-menu #mailboxSwitcher="matMenu">
              <p class="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Mailboxes' | t }}</p>
              @for (box of openMailboxes(); track box.id) {
                <button mat-menu-item type="button" (click)="switchMailbox(box.id)" [attr.aria-current]="box.id === currentMailboxId() ? 'true' : null">
                  <mat-icon>{{ box.id === generalMailboxId ? 'inbox' : 'groups' }}</mat-icon>
                  <span>{{ box.name | t }}</span>
                  @if (unreadByMailbox()[box.id]) {
                    <span class="ml-2 rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white">{{ unreadByMailbox()[box.id] }}</span>
                  }
                  @if (box.id === currentMailboxId()) {
                    <mat-icon class="!ml-2 !mr-0">check</mat-icon>
                  }
                </button>
              }
              <mat-divider></mat-divider>
              <button mat-menu-item type="button" (click)="openManage()">
                <mat-icon>settings</mat-icon>
                <span>{{ 'Manage mailboxes' | t }}</span>
              </button>
            </mat-menu>
          </div>

          <!-- Search (full width on phones, on its own line) -->
          <mat-form-field
            appearance="outline"
            class="zb-field zb-search order-last w-full sm:order-none sm:mx-auto sm:max-w-md"
            [ngClass]="{ 'max-sm:!hidden': !mobileSearchOpen() }"
          >
            <mat-label>{{ 'Search mailbox' | t }}</mat-label>
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input
              matInput
              id="mailbox-search"
              type="search"
              [value]="searchQuery()"
              (input)="setSearch($any($event.target).value)"
              [placeholder]="'Search sender, subject or message' | t"
              autocomplete="off"
            />
            @if (searchQuery()) {
              <button matSuffix mat-icon-button type="button" (click)="setSearch('')" [attr.aria-label]="'Clear search' | t" [title]="'Clear search' | t">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Phones: show or hide the search bar -->
          <button
            type="button"
            (click)="toggleMobileSearch()"
            [attr.aria-expanded]="mobileSearchOpen()"
            aria-controls="mailbox-search"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white sm:hidden"
            [ngClass]="{ 'bg-white/15 !text-white': mobileSearchOpen() }"
            [attr.aria-label]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
            [title]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">{{ mobileSearchOpen() ? 'search_off' : 'search' }}</mat-icon>
          </button>

          <button
            type="button"
            (click)="newMessage()"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#006666] shadow-sm transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">edit</mat-icon>
            <span class="hidden sm:inline">{{ 'Compose' | t }}</span>
          </button>

          <a
            routerLink="/admin/contact/sent"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white sm:w-auto sm:px-3"
            [attr.aria-label]="'Sent' | t"
            [title]="'Sent' | t"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">send</mat-icon>
            <span class="hidden sm:inline">{{ 'Sent' | t }}</span>
          </a>

          <button
            type="button"
            (click)="loadMessages()"
            [disabled]="loading()"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            [attr.aria-label]="'Refresh' | t"
            [title]="'Refresh' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]" [class.animate-spin]="loading()">refresh</mat-icon>
          </button>

          <button
            type="button"
            [matMenuTriggerFor]="mailboxMenu"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'More mailbox options' | t"
            [title]="'More' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
          </button>

          <mat-menu #mailboxMenu="matMenu" xPosition="before">
            <button mat-menu-item type="button" [matMenuTriggerFor]="viewMenu">
              <mat-icon>{{ layout() === 'split' ? 'vertical_split' : 'view_list' }}</mat-icon>
              <span class="flex flex-col leading-tight">
                <span>{{ 'View' | t }}</span>
                <span class="text-xs text-slate-500">{{ (layout() === 'split' ? 'Reading pane' : 'List with bulk actions') | t }}</span>
              </span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item type="button" (click)="openManage()">
              <mat-icon>groups</mat-icon>
              <span>{{ 'Manage mailboxes' | t }}</span>
            </button>
            <button mat-menu-item type="button" (click)="generateContactMessagesPdf()" [disabled]="filteredMessages().length === 0">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>{{ 'Export to PDF' | t }}</span>
            </button>
            <a mat-menu-item routerLink="/admin">
              <mat-icon>dashboard</mat-icon>
              <span>{{ 'Admin dashboard' | t }}</span>
            </a>
            <mat-divider></mat-divider>
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>{{ 'Sign out' | t }}</span>
            </button>
          </mat-menu>

          <!-- Submenu: view (remembered in this browser) -->
          <mat-menu #viewMenu="matMenu">
            <button mat-menu-item type="button" (click)="setLayout('split')" [attr.aria-checked]="layout() === 'split'" role="menuitemradio">
              <mat-icon>vertical_split</mat-icon>
              <span>{{ 'Reading pane' | t }}</span>
              @if (layout() === 'split') {
                <mat-icon class="!ml-3 !mr-0">check</mat-icon>
              }
            </button>
            <button mat-menu-item type="button" (click)="setLayout('list')" [attr.aria-checked]="layout() === 'list'" role="menuitemradio">
              <mat-icon>view_list</mat-icon>
              <span>{{ 'List with bulk actions' | t }}</span>
              @if (layout() === 'list') {
                <mat-icon class="!ml-3 !mr-0">check</mat-icon>
              }
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
              {{ error() | t }}
            </div>
          }

          @if (layout() === 'split') {
            <!-- =====================================================
                 READING PANE VIEW
                 ===================================================== -->
            <nav class="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1" [attr.aria-label]="'Mailbox folders' | t">
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
                  {{ folder.label | t }}
                  @if (folder.count > 0) {
                    <span [class]="folder.key === 'unread' ? 'rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white' : 'rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold leading-[18px] text-slate-600'">{{ folder.count }}</span>
                  }
                </button>
              }
            </nav>

            <div class="grid gap-4 lg:h-[calc(100vh-12.5rem)] lg:min-h-[30rem] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <!-- LIST -->
              <section class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" [ngClass]="{ 'max-lg:hidden': paneMessage() }">
                <!-- Pane header: select all, folder, counts, actions for the selected messages -->
                <div class="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/80 py-1.5 pl-2 pr-1">
                  <label class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-200/60" [title]="'Select all' | t">
                    <input
                      type="checkbox"
                      class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                      [checked]="allVisibleChecked()"
                      [indeterminate]="someVisibleChecked()"
                      [disabled]="visibleMessages().length === 0"
                      (change)="toggleAllVisible()"
                      [attr.aria-label]="'Select all messages' | t"
                    />
                  </label>
                  <h2 class="min-w-0 truncate text-sm font-semibold text-slate-900">{{ (searchQuery() ? 'Search results' : currentFolderLabel()) | t }}</h2>
                  <span class="ml-auto shrink-0 text-xs text-slate-500" aria-live="polite">
                    @if (checkedMessages().length > 0) {
                      <span class="font-semibold text-slate-900">{{ '{0} selected' | t: [checkedMessages().length] }}</span>
                    } @else {
                      {{ (filteredMessages().length === 1 ? '{0} email' : '{0} emails') | t: [filteredMessages().length] }}
                    }
                  </span>
                  <button
                    type="button"
                    [matMenuTriggerFor]="paneMenu"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/60 hover:text-slate-900"
                    [attr.aria-label]="'Actions for selected emails' | t"
                    [title]="'More' | t"
                  >
                    <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
                  </button>
                  <mat-menu #paneMenu="matMenu" xPosition="before">
                    <button mat-menu-item type="button" (click)="allVisibleChecked() ? clearSelection() : toggleAllVisible()" [disabled]="visibleMessages().length === 0">
                      <mat-icon>{{ allVisibleChecked() ? 'check_box_outline_blank' : 'select_all' }}</mat-icon>
                      <span>{{ (allVisibleChecked() ? 'Clear selection' : 'Select all') | t }}</span>
                    </button>
                    @if (checkedMessages().length === 0) {
                      <p class="max-w-56 px-4 pb-2 pt-1 text-xs text-slate-500">{{ 'Tick emails to archive or delete several at once.' | t }}</p>
                    }
                    <mat-divider></mat-divider>
                    <button mat-menu-item type="button" (click)="bulkMarkRead()" [disabled]="checkedMessages().length === 0 || bulkBusy()">
                      <mat-icon>drafts</mat-icon>
                      <span>{{ 'Mark read' | t }}</span>
                    </button>
                    @if (checkedAllArchived()) {
                      <button mat-menu-item type="button" (click)="bulkMoveToInbox()" [disabled]="checkedMessages().length === 0 || bulkBusy()">
                        <mat-icon>unarchive</mat-icon>
                        <span>{{ 'Move to inbox' | t }}</span>
                      </button>
                    } @else {
                      <button mat-menu-item type="button" (click)="bulkArchive()" [disabled]="checkedMessages().length === 0 || bulkBusy()">
                        <mat-icon>archive</mat-icon>
                        <span>{{ 'Archive' | t }}</span>
                      </button>
                    }
                    <mat-divider></mat-divider>
                    <button mat-menu-item type="button" class="!text-red-600" (click)="bulkDelete()" [disabled]="checkedMessages().length === 0 || bulkBusy()">
                      <mat-icon class="!text-red-600">delete</mat-icon>
                      <span>{{ 'Delete' | t }}</span>
                    </button>
                  </mat-menu>
                </div>

                @if (loading() && messages().length === 0) {
                  <div class="divide-y divide-slate-100" aria-busy="true">
                    @for (row of [1, 2, 3, 4, 5]; track row) {
                      <div class="space-y-2 px-4 py-3">
                        <div class="h-3 w-32 animate-pulse rounded bg-slate-200"></div>
                        <div class="h-3 w-3/4 animate-pulse rounded bg-slate-100"></div>
                      </div>
                    }
                  </div>
                } @else if (filteredMessages().length === 0) {
                  <div class="px-6 py-12 text-center">
                    <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">{{ searchQuery() ? 'search_off' : 'inbox' }}</mat-icon>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ (searchQuery() ? 'No messages match your search' : 'No messages here') | t }}</p>
                  </div>
                } @else {
                  <ul class="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                    @for (message of visibleMessages(); track message.id) {
                      <li
                        class="flex items-start transition hover:bg-slate-50"
                        [ngClass]="{ '!bg-[#007979]/10 shadow-[inset_3px_0_0_#007979]': paneMessage()?.id === message.id || isChecked(message), 'bg-teal-50/40': message.status === 'unread' && paneMessage()?.id !== message.id && !isChecked(message) }"
                      >
                        <label class="flex h-11 w-10 shrink-0 cursor-pointer items-center justify-center pl-2">
                          <input
                            type="checkbox"
                            class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                            [checked]="isChecked(message)"
                            (change)="toggleChecked(message)"
                            [attr.aria-label]="'Select message from {0}' | t: [message.name || message.email]"
                          />
                        </label>
                        <button type="button" class="block min-w-0 flex-1 py-3 pl-1 pr-4 text-left" (click)="openMessage(message)" [attr.aria-current]="paneMessage()?.id === message.id ? 'true' : null">
                          <div class="flex items-center justify-between gap-2">
                            <span class="flex min-w-0 items-center gap-1.5">
                              @if (message.status === 'unread') {
                                <span class="h-2 w-2 shrink-0 rounded-full bg-[#007979]" [attr.aria-label]="'Unread' | t"></span>
                              }
                              <span [class]="message.status === 'unread' ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm font-medium text-slate-700'">{{ message.name || message.email }}</span>
                            </span>
                            <span class="shrink-0 text-xs text-slate-500">{{ shortDate(message) }}</span>
                          </div>
                          <p [class]="message.status === 'unread' ? 'mt-0.5 truncate text-sm font-semibold text-slate-800' : 'mt-0.5 truncate text-sm text-slate-600'">{{ message.subject || ('(No subject)' | t) }}</p>
                          <p class="mt-0.5 truncate text-xs text-slate-500">{{ message.message }}</p>
                        </button>
                      </li>
                    }
                  </ul>
                  @if (visibleMessages().length < filteredMessages().length) {
                    <button type="button" (click)="showMore()" class="shrink-0 border-t border-slate-200 px-4 py-2 text-xs font-semibold text-[#007979] hover:bg-[#007979]/10">
                      {{ 'Show more' | t }}
                    </button>
                  }
                }
              </section>

              <!-- MESSAGE -->
              <section class="flex min-h-[20rem] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:min-h-0" [ngClass]="{ 'max-lg:hidden': !paneMessage() }">
                @if (paneMessage(); as msg) {
                  <div class="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-1.5 sm:px-3">
                    <button type="button" class="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:hidden" (click)="closeMessage()">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">arrow_back</mat-icon>
                      {{ 'Back' | t }}
                    </button>
                    <div class="ml-auto flex flex-wrap items-center gap-1">
                      <button type="button" (click)="replyToMessage(msg)" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006666]">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
                        {{ 'Reply' | t }}
                      </button>
                      <button type="button" (click)="forwardMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Forward' | t" [title]="'Forward' | t">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
                      </button>
                      @if (msg.status === 'archived') {
                        <button type="button" (click)="unarchiveMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Move to inbox' | t" [title]="'Move to inbox' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                        </button>
                      } @else {
                        <button type="button" (click)="archiveMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Archive' | t" [title]="'Archive' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                        </button>
                      }
                      <button type="button" (click)="deleteMessage(msg)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                      </button>
                    </div>
                  </div>

                  <article class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    <h2 class="break-words text-xl font-semibold leading-snug text-slate-900">{{ msg.subject || ('(No subject)' | t) }}</h2>
                    <div class="mt-4 flex items-start gap-3">
                      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007979] text-base font-semibold text-white" aria-hidden="true">
                        {{ (msg.name || msg.email || 'Z').charAt(0).toUpperCase() }}
                      </span>
                      <div class="min-w-0 flex-1 text-sm">
                        <div class="flex flex-wrap items-baseline justify-between gap-x-4">
                          <p class="min-w-0 break-all text-slate-900">
                            <span class="font-semibold">{{ msg.name || msg.email }}</span>
                            @if (msg.name && msg.email && msg.name !== msg.email) {
                              <span class="text-slate-500"> &lt;{{ msg.email }}&gt;</span>
                            }
                          </p>
                          <p class="shrink-0 text-xs text-slate-500">{{ formatDate(msg) }}</p>
                        </div>
                        <p class="mt-0.5 break-all text-xs text-slate-500">{{ 'to {0}' | t: [messageTo(msg)] }}</p>
                      </div>
                    </div>
                    <!-- What was written: never translated. -->
                    <div class="mt-5 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{{ msg.message }}</div>
                  </article>
                } @else {
                  <div class="flex h-full min-h-60 flex-col items-center justify-center p-8 text-center">
                    <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">mail</mat-icon>
                    <p class="mt-2 text-sm text-slate-500">{{ 'Select a message to read it.' | t }}</p>
                  </div>
                }
              </section>
            </div>
          } @else {
          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <!-- Toolbar: folders + search -->
            <div class="flex min-h-11 items-center gap-1 border-b border-slate-200 px-1 py-1.5 sm:gap-2 sm:px-2">
              <!-- Select all (visible rows) -->
              <label class="flex h-8 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-100 sm:w-8" [title]="'Select all' | t">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                  [checked]="allVisibleChecked()"
                  [indeterminate]="someVisibleChecked()"
                  [disabled]="visibleMessages().length === 0"
                  (change)="toggleAllVisible()"
                  [attr.aria-label]="'Select all messages' | t"
                />
              </label>

              @if (checkedMessages().length > 0) {
                <!-- Bulk actions -->
                <div class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="toolbar" [attr.aria-label]="'Selected messages' | t">
                  <span class="mr-1 shrink-0 text-sm font-semibold text-slate-900">{{ '{0} selected' | t: [checkedMessages().length] }}</span>
                  @if (checkedAllArchived()) {
                    <button type="button" (click)="bulkMoveToInbox()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                      <span class="hidden sm:inline">{{ 'Move to inbox' | t }}</span>
                    </button>
                  } @else {
                    <button type="button" (click)="bulkArchive()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                      <span class="hidden sm:inline">{{ 'Archive' | t }}</span>
                    </button>
                  }
                  <button type="button" (click)="bulkMarkRead()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">drafts</mat-icon>
                    <span class="hidden sm:inline">{{ 'Mark read' | t }}</span>
                  </button>
                  <button type="button" (click)="bulkDelete()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 hover:!bg-red-50 hover:!text-red-600">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                    <span class="hidden sm:inline">{{ 'Delete' | t }}</span>
                  </button>
                  <button type="button" (click)="clearSelection()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 ml-auto" [title]="'Clear selection' | t">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
                    <span class="hidden sm:inline">{{ 'Clear' | t }}</span>
                  </button>
                </div>
              } @else {
              <nav class="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1" [attr.aria-label]="'Mailbox folders' | t">
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
                    {{ folder.label | t }}
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
                  {{ (searchQuery() ? 'No messages match your search' : filter() === 'unread' || filter() === 'inbox' ? 'You\\u0027re all caught up' : 'No messages here') | t }}
                </p>
                @if (searchQuery()) {
                  <button type="button" (click)="setSearch('')" class="mt-2 text-sm font-medium text-[#007979] hover:underline">{{ 'Clear search' | t }}</button>
                }
              </div>
            } @else {
              <ul class="divide-y divide-slate-100">
                @for (message of visibleMessages(); track message.id) {
                  <li
                    class="group relative flex cursor-pointer items-center gap-2.5 px-1 py-2.5 sm:gap-2 transition hover:bg-slate-50 hover:shadow-[inset_3px_0_0_#007979] sm:px-2"
                    [ngClass]="{ 'bg-teal-50/40': message.status === 'unread' && !isChecked(message), '!bg-[#007979]/10': isChecked(message) }"
                    (click)="openMessage(message)"
                  >
                    <!-- Select -->
                    <label class="-my-1 flex h-8 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-200/60 sm:w-8" (click)="$event.stopPropagation()">
                      <input
                        type="checkbox"
                        class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                        [checked]="isChecked(message)"
                        (change)="toggleChecked(message)"
                        [attr.aria-label]="'Select message from {0}' | t: [message.name || message.email]"
                      />
                    </label>

                    <!-- Unread marker -->
                    <span
                      class="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      [ngClass]="{ 'bg-[#007979]': message.status === 'unread', 'max-sm:hidden': message.status !== 'unread' }"
                      [attr.aria-label]="message.status === 'unread' ? ('New' | t) : null"
                    ></span>

                    <!-- Desktop: one line. Mobile: sender + date, then subject. -->
                    <div class="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                      <div class="flex items-center justify-between gap-2 sm:w-48 sm:shrink-0">
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
                          {{ message.subject || ('(No subject)' | t) }}
                        </span>
                        @if (message.status === 'archived' && filter() !== 'archived') {
                          <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium leading-[18px] text-slate-500">{{ 'Archived' | t }}</span>
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
                      <button type="button" (click)="replyToMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Reply' | t" [title]="'Reply' | t">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
                      </button>
                      @if (message.status === 'archived') {
                        <button type="button" (click)="unarchiveMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Move to inbox' | t" [title]="'Move to inbox' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                        </button>
                      } @else {
                        <button type="button" (click)="archiveMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Archive' | t" [title]="'Archive' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                        </button>
                      }
                      <button type="button" (click)="deleteMessage(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                      </button>
                      <button
                        type="button"
                        [matMenuTriggerFor]="messageMenu"
                        [matMenuTriggerData]="{ message: message }"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        [attr.aria-label]="'More actions' | t"
                        [title]="'More' | t"
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
                      [attr.aria-label]="'More actions' | t"
                    >
                      <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
                    </button>
                  </li>
                }
              </ul>

              <!-- Footer -->
              <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                <span>
                  {{ (filteredMessages().length === 1 ? '{0} of {1} message' : '{0} of {1} messages') | t: [visibleMessages().length, filteredMessages().length] }}
                </span>
                @if (visibleMessages().length < filteredMessages().length) {
                  <button type="button" (click)="showMore()" class="rounded-md px-2 py-1 font-semibold text-[#007979] hover:bg-[#007979]/10">
                    {{ 'Show more' | t }}
                  </button>
                }
              </div>
            }
          </section>
          }
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
          <span>{{ 'View' | t }}</span>
        </button>

        <!-- Reply -->
        <button mat-menu-item type="button" (click)="replyToMessage(message)">
          <mat-icon>reply</mat-icon>
          <span>{{ 'Reply' | t }}</span>
        </button>

        <!-- Forward -->
        <button mat-menu-item type="button" (click)="forwardMessage(message)">
          <mat-icon>forward</mat-icon>
          <span>{{ 'Forward' | t }}</span>
        </button>

        <!-- Archive / Restore -->
        @if (message.status === 'archived') {
          <button mat-menu-item type="button" (click)="unarchiveMessage(message)">
            <mat-icon>unarchive</mat-icon>
            <span>{{ 'Restore' | t }}</span>
          </button>
        } @else {
          <button mat-menu-item type="button" (click)="archiveMessage(message)">
            <mat-icon>archive</mat-icon>
            <span>{{ 'Archive' | t }}</span>
          </button>
        }

        <mat-divider></mat-divider>

        <!-- Delete -->
        <button mat-menu-item type="button" (click)="deleteMessage(message)" class="!text-red-600">
          <mat-icon class="!text-red-600"> delete </mat-icon>

          <span>{{ 'Delete' | t }}</span>
        </button>
      </ng-template>
    </mat-menu>

    <!-- =========================================================
         MESSAGE DETAIL MODAL
         ========================================================= -->

    @if (layout() === 'list' && selectedMessage(); as msg) {
      <app-mail-reader
        [subject]="msg.subject || ''"
        [fromName]="msg.name || ''"
        [fromEmail]="msg.email || ''"
        [to]="messageTo(msg)"
        [date]="formatDate(msg)"
        [body]="msg.message || ''"
        [badge]="msg.status === 'unread' ? 'New' : msg.status === 'archived' ? 'Archived' : 'Read'"
        [badgeTone]="msg.status === 'unread' ? 'new' : msg.status === 'archived' ? 'archived' : 'read'"
        printLabel="Contact message"
        [showReply]="true"
        [showArchive]="true"
        [archived]="msg.status === 'archived'"
        (closed)="closeMessage()"
        (reply)="replyToMessage(msg)"
        (forward)="forwardMessage(msg)"
        (archive)="archiveMessage(msg)"
        (unarchive)="unarchiveMessage(msg)"
        (delete)="deleteMessage(msg)"
      />
    }

    <!-- =========================================================
         COMPOSER
         ========================================================= -->

    @if (composeMode() !== 'none') {
      <app-mail-composer
        [heading]="composeMode() === 'reply' ? 'Reply' : composeMode() === 'forward' ? 'Forward message' : 'New email'"
        [submitLabel]="composeMode() === 'forward' ? 'Forward' : 'Send'"
        [sending]="sending()"
        [error]="uiError()"
        [(to)]="composeTo"
        [(subject)]="composeSubject"
        [(message)]="composeMessage"
        (send)="sendComposedMessage()"
        (cancelled)="closeComposer()"
      />
    }

    <!-- =========================================================
         MANAGE MAILBOXES
         ========================================================= -->
    @if (managing()) {
      <div
        class="fixed inset-0 z-[60] flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        (click)="closeManage()"
      >
        <section
          class="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-mailboxes-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-4 py-3 sm:px-6">
            <div class="min-w-0">
              <h2 id="platform-mailboxes-title" class="truncate text-lg font-semibold text-white">
                {{ (mailboxForm() ? (mailboxForm()!.isNew ? 'New mailbox' : 'Edit mailbox') : 'Zebron mailboxes') | t }}
              </h2>
              <p class="truncate text-xs text-white/80">{{ 'Each address on zebron.org gets its own inbox. Anything else goes to General.' | t }}</p>
            </div>
            <button
              type="button"
              (click)="closeManage()"
              [disabled]="savingMailbox()"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
              [attr.aria-label]="'Close' | t"
              [title]="'Close' | t"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">close</mat-icon>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            @if (manageError()) {
              <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ manageError() | t }}</div>
            }

            @if (mailboxForm(); as form) {
              @if (form.isNew) {
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>{{ 'Address' | t }}</mat-label>
                  <mat-select [value]="form.id" (selectionChange)="patchForm({ id: $event.value })">
                    @for (name of availableNames(); track name) {
                      <mat-option [value]="name">{{ name }}&#64;zebron.org</mat-option>
                    }
                  </mat-select>
                  <mat-hint>{{ 'Only names kept for Zebron can be used, so they never clash with an organization.' | t }}</mat-hint>
                </mat-form-field>
              } @else {
                <p class="mb-3 text-sm text-slate-600">{{ 'Address' | t }}: <strong class="text-slate-900">{{ mailboxAddress(form.id) }}</strong></p>
              }

              <mat-form-field appearance="outline" class="zb-field mt-2">
                <mat-label>{{ 'Mailbox name' | t }}</mat-label>
                <input matInput maxlength="60" [value]="form.name" (input)="patchForm({ name: $any($event.target).value })" [disabled]="savingMailbox()" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>{{ 'Description (optional)' | t }}</mat-label>
                <input matInput maxlength="200" [value]="form.description" (input)="patchForm({ description: $any($event.target).value })" [disabled]="savingMailbox()" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>{{ 'Forward a copy to (optional)' | t }}</mat-label>
                <input matInput type="email" maxlength="254" [value]="form.forwardTo" (input)="patchForm({ forwardTo: $any($event.target).value })" [disabled]="savingMailbox()" placeholder="name@example.com" />
                <mat-hint>{{ 'Leave empty for no copies. Each copy counts as one more email against the free plan.' | t }}</mat-hint>
              </mat-form-field>

              @if (form.id !== generalMailboxId) {
                <label class="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                  <input type="checkbox" class="mt-0.5 h-4 w-4 cursor-pointer accent-[#007979]" [checked]="form.active" (change)="patchForm({ active: !form.active })" [disabled]="savingMailbox()" />
                  <span class="text-sm">
                    <span class="font-semibold text-slate-900">{{ 'Mailbox is on' | t }}</span>
                    <span class="block text-slate-500">{{ 'When off, email sent to it goes to General.' | t }}</span>
                  </span>
                </label>
              }
            } @else {
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-slate-600">{{ (platformMailboxes().length === 1 ? '{0} mailbox' : '{0} mailboxes') | t: [platformMailboxes().length] }}</p>
                <div class="flex flex-wrap gap-2">
                  @if (missingSuggestions().length > 0) {
                    <button type="button" (click)="addSuggested()" [disabled]="savingMailbox()" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">playlist_add</mat-icon>
                      {{ 'Add {0}' | t: [missingSuggestionNames()] }}
                    </button>
                  }
                  <button type="button" (click)="newMailbox()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006666]">
                    <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">add</mat-icon>
                    {{ 'New mailbox' | t }}
                  </button>
                </div>
              </div>

              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                @for (box of platformMailboxes(); track box.id) {
                  <li class="flex items-center gap-3 px-3 py-3">
                    <span [class]="box.active ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]' : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400'">
                      <mat-icon>{{ box.id === generalMailboxId ? 'inbox' : 'groups' }}</mat-icon>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span class="truncate">{{ box.name | t }}</span>
                        @if (!box.active) {
                          <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">{{ 'Off' | t }}</span>
                        }
                      </p>
                      <p class="truncate text-xs text-slate-500">
                        {{ mailboxAddress(box.id) }}
                        @if (box.id === generalMailboxId) {
                          · {{ 'contact form and everything else' | t }}
                        }
                        · {{ box.forwardTo ? ('copies to {0}' | t: [box.forwardTo]) : ('no copies' | t) }}
                      </p>
                    </div>
                    <button type="button" (click)="editMailbox(box)" class="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">edit</mat-icon>
                      {{ 'Edit' | t }}
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            @if (mailboxForm(); as form) {
              @if (!form.isNew && form.id !== generalMailboxId) {
                <button type="button" (click)="deleteMailbox()" [disabled]="savingMailbox()" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                  {{ 'Delete mailbox' | t }}
                </button>
              }
              <button type="button" (click)="mailboxForm.set(null); manageError.set('')" [disabled]="savingMailbox()" class="ml-auto h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                {{ 'Cancel' | t }}
              </button>
              <button type="button" (click)="saveMailbox()" [disabled]="savingMailbox()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#006666] disabled:opacity-50">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]" [class.animate-spin]="savingMailbox()">{{ savingMailbox() ? 'refresh' : 'save' }}</mat-icon>
                {{ (savingMailbox() ? 'Saving...' : 'Save') | t }}
              </button>
            } @else {
              <button type="button" (click)="closeManage()" class="ml-auto h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {{ 'Close' | t }}
              </button>
            }
          </div>
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

        {{ toastMessage() | t }}
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
export class ContactMailboxComponent implements OnInit, OnDestroy {
  private readonly contactStore = inject(ContactStore);

  private readonly i18n = inject(I18nService);

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

  /** The message being replied to (the reader is closed while composing). */
  private replyTarget: ContactMessage | null = null;
  /**
   * Number of new messages.
   */
  readonly newCount = computed(
    () => this.mailboxMessages().filter((message) => message.status === 'unread').length,
  );

  /**
   * Number of read messages.
   */
  readonly readCount = computed(
    () => this.mailboxMessages().filter((message) => message.status === 'read').length,
  );

  /**
   * Number of archived messages.
   */
  readonly archivedCount = computed(
    () => this.mailboxMessages().filter((message) => message.status === 'archived').length,
  );

  /**
   * Apply status and search filters.
   */
  /** Folder tabs with their counts. */
  readonly folders = computed(() => [
    { key: 'inbox' as MailboxFilter, label: 'Inbox', icon: 'inbox', count: this.mailboxMessages().length - this.archivedCount() },
    { key: 'unread' as MailboxFilter, label: 'New', icon: 'mark_email_unread', count: this.newCount() },
    { key: 'read' as MailboxFilter, label: 'Read', icon: 'drafts', count: this.readCount() },
    { key: 'archived' as MailboxFilter, label: 'Archived', icon: 'archive', count: this.archivedCount() },
    { key: 'all' as MailboxFilter, label: 'All mail', icon: 'all_inbox', count: this.mailboxMessages().length },
  ]);

  /** Rows shown; "Show more" adds another page. */
  private readonly pageSize = 25;

  readonly visibleCount = signal(25);

  readonly filteredMessages = computed(() => {
    const currentFilter = this.filter();

    const search = this.searchQuery().trim().toLowerCase();

    return this.mailboxMessages().filter((message) => {
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

  // ===========================================================
  // View: list (bulk actions, reader window) or reading pane
  // ===========================================================

  /** The server renders the list; the browser then applies the saved choice. */
  readonly layout = signal<'split' | 'list'>('list');

  private readonly layoutInit = afterNextRender(() => {
    try {
      if (localStorage.getItem('zebron.platformMailbox.layout') === 'split') {
        this.layout.set('split');
      }
    } catch {
      // Storage blocked: keep the list.
    }
  });

  setLayout(layout: 'split' | 'list'): void {
    this.layout.set(layout);
    this.closeMessage();
    this.clearSelection();
    try {
      localStorage.setItem('zebron.platformMailbox.layout', layout);
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  }

  /** The open message, kept up to date with the list (status changes). */
  readonly paneMessage = computed(() => {
    const selected = this.selectedMessage();
    return selected ? this.messages().find((message) => message.id === selected.id) ?? selected : null;
  });

  readonly currentFolderLabel = computed(
    () => this.folders().find((folder) => folder.key === this.filter())?.label ?? 'Inbox',
  );

  ngOnInit(): void {
    this.contactStore.startMessageListener();
    void this.loadPlatformMailboxes();
  }

  // ===========================================================
  // Zebron mailboxes (General, Support, Billing, Partnerships...)
  // ===========================================================

  private readonly platformMailboxService = inject(PlatformMailboxService);
  private readonly route = inject(ActivatedRoute);

  readonly generalMailboxId = PLATFORM_GENERAL_MAILBOX;

  readonly platformMailboxes = signal<PlatformMailbox[]>([]);

  /** The open mailbox; ?box=support in the link. */
  readonly currentMailboxId = signal<string>(PLATFORM_GENERAL_MAILBOX);

  /** Mailboxes that are on (General always is). */
  readonly openMailboxes = computed(() => {
    const boxes = this.platformMailboxes().filter((box) => box.active);
    return boxes.length ? boxes : [{ id: PLATFORM_GENERAL_MAILBOX, name: 'General' } as PlatformMailbox];
  });

  readonly currentPlatformMailbox = computed(
    () => this.openMailboxes().find((box) => box.id === this.currentMailboxId()) ?? null,
  );

  /** Mailbox of a message: older messages and turned-off mailboxes show in General. */
  mailboxOf(message: ContactMessage): string {
    const id = message.mailboxId || PLATFORM_GENERAL_MAILBOX;
    return this.openMailboxes().some((box) => box.id === id) ? id : PLATFORM_GENERAL_MAILBOX;
  }

  /** Messages in the open mailbox. */
  readonly mailboxMessages = computed(() =>
    this.messages().filter((message) => this.mailboxOf(message) === this.currentMailboxId()),
  );

  readonly unreadByMailbox = computed(() => {
    const counts: Record<string, number> = {};
    for (const message of this.messages()) {
      if (message.status === 'unread') {
        const id = this.mailboxOf(message);
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  });

  readonly otherMailboxesUnread = computed(() =>
    Object.entries(this.unreadByMailbox())
      .filter(([id]) => id !== this.currentMailboxId())
      .reduce((total, [, count]) => total + count, 0),
  );

  mailboxAddress(id: string): string {
    return platformMailboxAddress(id);
  }

  /** "to" line in the reader: the address the email was sent to. */
  messageTo(message: ContactMessage): string {
    return message.to?.length ? message.to.join(', ') : platformMailboxAddress(this.mailboxOf(message));
  }

  private async loadPlatformMailboxes(): Promise<void> {
    try {
      this.platformMailboxes.set(await this.platformMailboxService.list());
    } catch (error) {
      // Rules not deployed yet: General only.
      console.warn('[Mailbox] Zebron mailboxes unavailable.', error);
    }

    const requested = this.route.snapshot.queryParamMap.get('box');
    if (requested && this.openMailboxes().some((box) => box.id === requested)) {
      this.currentMailboxId.set(requested);
    }
  }

  switchMailbox(id: string): void {
    if (id === this.currentMailboxId()) {
      return;
    }
    this.currentMailboxId.set(id);
    this.setFilter('inbox');
    this.setSearch('');
    void this.router.navigate([], {
      queryParams: { box: id === PLATFORM_GENERAL_MAILBOX ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // Manage mailboxes
  readonly managing = signal(false);
  readonly mailboxForm = signal<PlatformMailboxForm | null>(null);
  readonly manageError = signal('');
  readonly savingMailbox = signal(false);

  /** Names not used yet by a mailbox. */
  readonly availableNames = computed(() => {
    const used = new Set(this.platformMailboxes().map((box) => box.id));
    return PLATFORM_MAILBOX_NAMES.filter((name) => !used.has(name));
  });

  readonly missingSuggestions = computed(() => {
    const used = new Set(this.platformMailboxes().map((box) => box.id));
    return SUGGESTED_PLATFORM_MAILBOXES.filter((box) => !used.has(box.id));
  });

  readonly missingSuggestionNames = computed(() => this.missingSuggestions().map((box) => box.name).join(', '));

  openManage(): void {
    this.manageError.set('');
    this.mailboxForm.set(null);
    this.managing.set(true);
  }

  closeManage(): void {
    if (!this.savingMailbox()) {
      this.managing.set(false);
      this.mailboxForm.set(null);
    }
  }

  newMailbox(): void {
    const first = this.availableNames()[0] ?? '';
    this.manageError.set('');
    this.mailboxForm.set({ isNew: true, id: first, name: '', description: '', forwardTo: '', active: true });
  }

  editMailbox(box: PlatformMailbox): void {
    this.manageError.set('');
    this.mailboxForm.set({
      isNew: !box.configured,
      id: box.id,
      name: box.name,
      description: box.description,
      forwardTo: box.forwardTo,
      active: box.active,
    });
  }

  patchForm(changes: Partial<PlatformMailboxForm>): void {
    const form = this.mailboxForm();
    if (form) {
      this.mailboxForm.set({ ...form, ...changes });
    }
  }

  async saveMailbox(): Promise<void> {
    const form = this.mailboxForm();
    const uid = this.authService.firebaseUser()?.uid;

    if (!form || !uid || this.savingMailbox()) {
      return;
    }

    if (!form.id || (form.id !== PLATFORM_GENERAL_MAILBOX && !PLATFORM_MAILBOX_NAMES.includes(form.id))) {
      this.manageError.set('Choose an address.');
      return;
    }

    if (!form.name.trim()) {
      this.manageError.set('Give the mailbox a name.');
      return;
    }

    const forwardTo = form.forwardTo.trim();
    if (forwardTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardTo)) {
      this.manageError.set('Enter a valid email address for copies, or leave it empty.');
      return;
    }

    this.savingMailbox.set(true);
    this.manageError.set('');

    try {
      await this.platformMailboxService.save(
        { id: form.id, name: form.name, description: form.description, forwardTo, active: form.active },
        uid,
        form.isNew,
      );
      await this.loadPlatformMailboxes();
      this.mailboxForm.set(null);
      this.showSuccessToast(form.isNew ? 'Mailbox created' : 'Mailbox saved');
    } catch (error) {
      console.error('Failed to save mailbox:', error);
      this.manageError.set('Unable to save the mailbox. Please try again.');
    } finally {
      this.savingMailbox.set(false);
    }
  }

  /** Adds the suggested Support, Billing and Partnerships mailboxes. */
  async addSuggested(): Promise<void> {
    const uid = this.authService.firebaseUser()?.uid;
    if (!uid || this.savingMailbox()) {
      return;
    }

    this.savingMailbox.set(true);
    this.manageError.set('');

    try {
      for (const box of this.missingSuggestions()) {
        await this.platformMailboxService.save({ ...box, forwardTo: '', active: true }, uid, true);
      }
      await this.loadPlatformMailboxes();
      this.showSuccessToast('Mailboxes added');
    } catch (error) {
      console.error('Failed to add mailboxes:', error);
      this.manageError.set('Unable to save the mailbox. Please try again.');
    } finally {
      this.savingMailbox.set(false);
    }
  }

  /** Its messages stay and show in General. */
  async deleteMailbox(): Promise<void> {
    const form = this.mailboxForm();

    if (!form || form.isNew || form.id === PLATFORM_GENERAL_MAILBOX || this.savingMailbox()) {
      return;
    }

    if (!window.confirm(this.i18n.t('Delete the {0} mailbox? Its messages move to General, and email sent to its address will go there too.', [form.name]))) {
      return;
    }

    this.savingMailbox.set(true);

    try {
      await this.platformMailboxService.remove(form.id);
      await this.loadPlatformMailboxes();
      this.mailboxForm.set(null);
      if (this.currentMailboxId() === form.id) {
        this.switchMailbox(PLATFORM_GENERAL_MAILBOX);
      }
      this.showSuccessToast('Mailbox deleted');
    } catch (error) {
      console.error('Failed to delete mailbox:', error);
      this.manageError.set('Unable to delete the mailbox. Please try again.');
    } finally {
      this.savingMailbox.set(false);
    }
  }

  showMore(): void {
    this.visibleCount.update((count) => count + this.pageSize);
  }

  /** Phones: the search bar is hidden until the search button is tapped. */
  readonly mobileSearchOpen = signal(false);

  toggleMobileSearch(): void {
    const open = !this.mobileSearchOpen();
    this.mobileSearchOpen.set(open);
    if (open) {
      // Focus the field once it is shown.
      setTimeout(() => document.getElementById('mailbox-search')?.focus());
    } else if (this.searchQuery()) {
      // Hiding the bar also clears the search, so no hidden filter stays on.
      this.setSearch('');
    }
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

  private async runBulk(action: (message: ContactMessage) => Promise<void>, done: [one: string, many: string]): Promise<void> {
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
        failed
          ? this.i18n.t('{0} done, {1} failed.', [messages.length - failed, failed])
          : this.i18n.t(messages.length === 1 ? done[0] : done[1], [messages.length]),
      );
    } finally {
      this.bulkBusy.set(false);
    }
  }

  bulkArchive(): Promise<void> {
    return this.runBulk((message) => this.contactStore.archiveMessage(message.id), ['{0} message archived.', '{0} messages archived.']);
  }

  bulkMoveToInbox(): Promise<void> {
    return this.runBulk((message) => this.contactStore.unarchiveMessage(message.id), ['{0} message moved to the inbox.', '{0} messages moved to the inbox.']);
  }

  bulkMarkRead(): Promise<void> {
    return this.runBulk(
      (message) => (message.status === 'unread' ? this.contactStore.markAsRead(message.id) : Promise.resolve()),
      ['{0} message marked as read.', '{0} messages marked as read.'],
    );
  }

  async bulkDelete(): Promise<void> {
    const count = this.checkedMessages().length;
    if (!count || !window.confirm(this.i18n.t(count === 1 ? 'Delete {0} message? This cannot be undone.' : 'Delete {0} messages? This cannot be undone.', [count]))) {
      return;
    }
    await this.runBulk((message) => this.contactStore.deleteMessage(message.id), ['{0} message deleted.', '{0} messages deleted.']);
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
      this.i18n.t('Delete the message from {0}? This action cannot be undone.', [message.name || message.email]),
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
    // Keep the message being replied to: the reader closes below.
    this.replyTarget = message;
    this.uiError.set(null);

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
    this.uiError.set(null);
    this.replyTarget = null;

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
    this.uiError.set(null);
    this.replyTarget = null;

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
    this.replyTarget = null;
    this.uiError.set(null);

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
        const selected = this.replyTarget;

        if (!selected) {
          throw new Error('No message is selected.');
        }

        await this.contactStore.sendReply({
          messageId: selected.id,
          to,
          subject,
          message,
          mailboxId: this.mailboxOf(selected),
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
          mailboxId: this.currentMailboxId(),
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
