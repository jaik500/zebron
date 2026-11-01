import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { httpsCallable } from 'firebase/functions';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AuthService } from '../../../core/services/auth.service';
import { firebaseFunctions } from '../../../core/services/firebase-config';
import { PageTitleService } from '../../../core/services/page-title.service';
import { PartnerAccessService } from '../../../core/services/partner-access.service';
import { MailComposerComponent, MailReaderComponent } from '../../admin/pages/contact/shared/mail-popups';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import {
  InboundMailboxMessage,
  MAILBOX_KEY_PATTERN,
  MAIN_MAILBOX_ID,
  OrganizationMailbox,
  OrganizationMailboxService,
  RESERVED_MAILBOX_KEYS,
  SentMailboxMessage,
  departmentMailboxAddress,
  organizationMailboxAddress,
} from './organization-mailbox.service';

type Folder = 'inbox' | 'sent' | 'archived';

/**
 * Two ways to read the mailbox, chosen per person and remembered in this browser:
 * - split: list on the left, the open message on the right (reading pane).
 * - list:  the platform mailbox design: one full-width list with checkboxes
 *          and bulk actions; messages open in a reader window.
 */
type Layout = 'split' | 'list';

const LAYOUT_STORAGE_KEY = 'zebron.organizationMailbox.layout';

interface DirectoryEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
  /** Present once the member directory function is redeployed. */
  role?: string | null;
  active?: boolean;
}

/** Roles that can be assigned to a departmental mailbox. */
const MAILBOX_STAFF_ROLES = ['org_staff', 'org_manager', 'org_admin', 'org_owner'];

/** A mailbox this person can open: the main one or a departmental one. */
interface MailboxChoice {
  id: string;
  name: string;
  address: string | null;
  description: string;
}

/** The create / edit form in "Manage mailboxes". */
interface MailboxForm {
  isNew: boolean;
  key: string;
  /** Once the key is typed by hand, the name stops suggesting it. */
  keyEdited: boolean;
  name: string;
  description: string;
  memberIds: string[];
  active: boolean;
}

type Selected =
  | { kind: 'received'; message: InboundMailboxMessage }
  | { kind: 'sent'; message: SentMailboxMessage };

interface ListItem {
  id: string;
  /** Sender for received mail; recipients for sent mail. */
  who: string;
  /** Sent mail shows "To: ..." */
  outgoing: boolean;
  subject: string;
  preview: string;
  date: Date | null;
  unread: boolean;
  archived: boolean;
  badge: string;
  received: InboundMailboxMessage | null;
  sent: SentMailboxMessage | null;
}

/**
 * Organization mailbox for managers, admins and owners.
 *
 * - Inbox / Archived: email sent to <slug>@zebron.org, or <key>.<slug>@zebron.org
 *   for a departmental mailbox.
 * - Sent: email sent from here, as "<Organization> via Zebron".
 * - Compose, reply and forward; replies come back to this Inbox.
 *
 * Route: /partner/org/:organizationId/mailbox (manager and above).
 */
@Component({
  selector: 'app-organization-mailbox',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    NgClass,
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MailReaderComponent,
    MailComposerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 pt-16">
      <!-- =======================================================
           HEADER (one compact row, same as the platform mailbox)
           ======================================================= -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'settings']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Administration' | t"
            [title]="'Administration' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">arrow_back</mat-icon>
          </a>

          <div class="min-w-0 flex-1 sm:flex-none">
            <h1 class="truncate text-lg font-semibold">
              {{ 'Mailbox' | t }}
            </h1>
            <div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <!-- The open mailbox (switch it from the ⋮ menu) -->
              @if (currentMailbox(); as box) {
                <span class="inline-flex items-center gap-1 font-semibold text-white">
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ box.id === mainMailboxId ? 'inbox' : 'groups' }}</mat-icon>
                  {{ box.name | t }}
                </span>
              }

              @if (address(); as mailboxAddress) {
                <button
                  type="button"
                  class="inline-flex max-w-full items-center gap-1 rounded text-white/80 hover:text-white"
                  [title]="'Copy address' | t"
                  (click)="copyAddress(mailboxAddress)"
                >
                  <span class="truncate">{{ mailboxAddress }}</span>
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                </button>
              }
            </div>
          </div>

          <!-- Search (full width on phones, on its own line) -->
          <mat-form-field
            appearance="outline"
            class="zb-field zb-search order-last w-full sm:order-none sm:mx-auto sm:max-w-md"
            subscriptSizing="dynamic"
            [ngClass]="{ 'max-sm:!hidden': !mobileSearchOpen() }"
          >
            <mat-label>{{ 'Search mailbox' | t }}</mat-label>
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input
              matInput
              id="organization-mailbox-search"
              type="search"
              [value]="search()"
              (input)="setSearch($any($event.target).value)"
              [placeholder]="'Search sender, subject or message' | t"
              autocomplete="off"
            />
            @if (search()) {
              <button matSuffix mat-icon-button type="button" (click)="setSearch('')" [attr.aria-label]="'Clear search' | t" [title]="'Clear search' | t">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Phones: show or hide the search bar -->
          <button
            type="button"
            (click)="mobileSearchOpen.set(!mobileSearchOpen())"
            [attr.aria-expanded]="mobileSearchOpen()"
            aria-controls="organization-mailbox-search"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white sm:hidden"
            [ngClass]="{ 'bg-white/15 !text-white': mobileSearchOpen() }"
            [attr.aria-label]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
            [title]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">{{ mobileSearchOpen() ? 'search_off' : 'search' }}</mat-icon>
          </button>

          <button
            type="button"
            (click)="compose()"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#006666] shadow-sm transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">edit</mat-icon>
            <span class="hidden sm:inline">{{ 'Compose' | t }}</span>
          </button>

          <button
            type="button"
            (click)="load()"
            [disabled]="loading()"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            [attr.aria-label]="'Refresh' | t"
            [title]="'Refresh' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]" [class.animate-spin]="loading()">refresh</mat-icon>
          </button>

          <!-- ⋮ menu: mailbox, view and administration -->
          <button
            type="button"
            [matMenuTriggerFor]="mailboxMenu"
            class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Mailbox options' | t"
            [title]="'More' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">more_vert</mat-icon>
            @if (otherMailboxesUnread() > 0) {
              <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-[#00706f]" [title]="'Unread in your other mailboxes' | t"></span>
            }
          </button>

          <mat-menu #mailboxMenu="matMenu" xPosition="before">
            @if (accessibleMailboxes().length > 1 || canManageMailboxes()) {
              <button mat-menu-item type="button" [matMenuTriggerFor]="mailboxSwitcher">
                <mat-icon>{{ mailboxId() === mainMailboxId ? 'inbox' : 'groups' }}</mat-icon>
                <span class="flex flex-col leading-tight">
                  <span>{{ 'Mailbox' | t }}</span>
                  <span class="text-xs text-slate-500">
                    {{ (currentMailbox()?.name ?? 'Mailbox') | t }}
                    @if (otherMailboxesUnread() > 0) {
                      · {{ '{0} unread elsewhere' | t: [otherMailboxesUnread()] }}
                    }
                  </span>
                </span>
              </button>
            }
            <button mat-menu-item type="button" [matMenuTriggerFor]="viewMenu">
              <mat-icon>{{ layout() === 'split' ? 'vertical_split' : 'view_list' }}</mat-icon>
              <span class="flex flex-col leading-tight">
                <span>{{ 'View' | t }}</span>
                <span class="text-xs text-slate-500">{{ (layout() === 'split' ? 'Reading pane' : 'List with bulk actions') | t }}</span>
              </span>
            </button>
            <mat-divider></mat-divider>
            @if (canManageMailboxes()) {
              <button mat-menu-item type="button" (click)="openManage()">
                <mat-icon>settings</mat-icon>
                <span>{{ 'Manage mailboxes' | t }}</span>
              </button>
            }
            <a mat-menu-item [routerLink]="['/partner/org', organizationId, 'settings']">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>{{ 'Administration' | t }}</span>
            </a>
          </mat-menu>

          <!-- Submenu: switch mailbox -->
          <mat-menu #mailboxSwitcher="matMenu">
            @for (box of accessibleMailboxes(); track box.id) {
              <button mat-menu-item type="button" (click)="switchMailbox(box.id)" [attr.aria-current]="box.id === mailboxId() ? 'true' : null">
                <mat-icon>{{ box.id === mainMailboxId ? 'inbox' : 'groups' }}</mat-icon>
                <span>{{ box.name | t }}</span>
                @if (mailboxUnread()[box.id]) {
                  <span class="ml-2 rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white">{{ mailboxUnread()[box.id] }}</span>
                }
                @if (box.id === mailboxId()) {
                  <mat-icon class="!ml-2 !mr-0">check</mat-icon>
                }
              </button>
            }
          </mat-menu>

          <!-- Submenu: view -->
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

      <main class="px-3 py-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          @if (error()) {
            <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
              {{ error() | t }}
            </div>
          }

          <!-- Folders (shared by both views) -->
          <ng-template #folderTabs>
            <nav class="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1" [attr.aria-label]="'Mailbox folders' | t">
              @for (item of folders(); track item.key) {
                <button
                  type="button"
                  (click)="openFolder(item.key)"
                  [attr.aria-pressed]="folder() === item.key"
                  [class]="folder() === item.key
                    ? 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#007979]/10 px-3 text-sm font-semibold text-[#006666]'
                    : 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'"
                >
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">{{ item.icon }}</mat-icon>
                  {{ item.label | t }}
                  @if (item.count > 0) {
                    <span
                      [class]="item.key === 'inbox'
                        ? 'rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white'
                        : 'rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold leading-[18px] text-slate-600'"
                    >
                      {{ item.count }}
                    </span>
                  }
                </button>
              }
            </nav>
          </ng-template>

          <!-- Empty folder (shared by both views) -->
          <ng-template #emptyState>
            <div class="px-6 py-12 text-center">
              <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">{{ search() ? 'search_off' : folder() === 'sent' ? 'send' : 'inbox' }}</mat-icon>
              <p class="mt-2 text-sm font-semibold text-slate-900">
                {{ (search() ? 'No messages match your search' : folder() === 'sent' ? 'Nothing sent yet' : folder() === 'archived' ? 'No archived messages' : 'All caught up') | t }}
              </p>
              @if (search()) {
                <button type="button" (click)="setSearch('')" class="mt-2 text-sm font-medium text-[#007979] hover:underline">{{ 'Clear search' | t }}</button>
              } @else if (folder() === 'inbox' && address()) {
                <p class="mt-1 text-sm text-slate-500">{{ 'Email sent to {0} appears here.' | t: [address()] }}</p>
              }
            </div>
          </ng-template>

          <!-- Loading rows (shared by both views) -->
          <ng-template #loadingRows>
            <div class="divide-y divide-slate-100" aria-busy="true">
              @for (row of [1, 2, 3, 4, 5]; track row) {
                <div class="space-y-2 px-4 py-3">
                  <div class="h-3 w-32 animate-pulse rounded bg-slate-200"></div>
                  <div class="h-3 w-3/4 animate-pulse rounded bg-slate-100"></div>
                </div>
              }
            </div>
          </ng-template>

          @if (noAccess()) {
            <section class="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">lock</mat-icon>
              <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'No mailbox for you yet' | t }}</h2>
              <p class="mt-1 text-sm text-slate-600">{{ 'An owner or admin can add you to a departmental mailbox such as Admissions or HR.' | t }}</p>
            </section>
          } @else if (layout() === 'split') {
            <!-- =====================================================
                 READING PANE VIEW
                 ===================================================== -->
            <div class="mb-3 flex items-center">
              <ng-container [ngTemplateOutlet]="folderTabs" />
            </div>

            <div class="grid gap-4 lg:h-[calc(100vh-12.5rem)] lg:min-h-[30rem] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <!-- LIST -->
              <section
                class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                [ngClass]="{ 'max-lg:hidden': selected() }"
              >
                <!-- Pane header: select all, folder, counts and actions for the selected emails -->
                <div class="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/80 py-1.5 pl-2 pr-1">
                  <label class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-200/60" [title]="'Select all' | t">
                    <input
                      type="checkbox"
                      class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                      [checked]="paneAllChecked()"
                      [indeterminate]="paneSomeChecked()"
                      [disabled]="listItems().length === 0"
                      (change)="togglePaneAll()"
                      [attr.aria-label]="'Select all messages' | t"
                    />
                  </label>
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] text-[#007979]" aria-hidden="true">{{ currentFolder().icon }}</mat-icon>
                  <h2 class="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {{ (search() ? 'Search results' : currentFolder().label) | t }}
                  </h2>
                  <span class="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
                    @if (checkedCount() > 0) {
                      <span class="font-semibold text-slate-900">{{ '{0} selected' | t: [checkedCount()] }}</span>
                    } @else if (!loading() || listItems().length > 0) {
                      {{ (listItems().length === 1 ? '{0} email' : '{0} emails') | t: [listItems().length] }}
                      @if (listUnread() > 0) {
                        <span class="rounded-full bg-[#007979] px-1.5 text-[11px] font-semibold leading-[18px] text-white">{{ '{0} unread' | t: [listUnread()] }}</span>
                      }
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
                    @if (paneAllChecked()) {
                      <button mat-menu-item type="button" (click)="clearChecked()">
                        <mat-icon>check_box_outline_blank</mat-icon>
                        <span>{{ 'Clear selection' | t }}</span>
                      </button>
                    } @else {
                      <button mat-menu-item type="button" (click)="togglePaneAll()" [disabled]="listItems().length === 0">
                        <mat-icon>select_all</mat-icon>
                        <span>{{ 'Select all' | t }}</span>
                      </button>
                    }
                    @if (checkedCount() === 0) {
                      <p class="max-w-56 px-4 pb-2 pt-1 text-xs text-slate-500">{{ 'Tick emails to archive or delete several at once.' | t }}</p>
                    }
                    <mat-divider></mat-divider>
                    @switch (folder()) {
                      @case ('inbox') {
                        <button mat-menu-item type="button" (click)="bulk('read')" [disabled]="checkedCount() === 0 || bulkBusy()">
                          <mat-icon>drafts</mat-icon>
                          <span>{{ 'Mark read' | t }}</span>
                        </button>
                        <button mat-menu-item type="button" (click)="bulk('unread')" [disabled]="checkedCount() === 0 || bulkBusy()">
                          <mat-icon>mark_email_unread</mat-icon>
                          <span>{{ 'Mark unread' | t }}</span>
                        </button>
                        <button mat-menu-item type="button" (click)="bulk('archive')" [disabled]="checkedCount() === 0 || bulkBusy()">
                          <mat-icon>archive</mat-icon>
                          <span>{{ 'Archive' | t }}</span>
                        </button>
                      }
                      @case ('archived') {
                        <button mat-menu-item type="button" (click)="bulk('restore')" [disabled]="checkedCount() === 0 || bulkBusy()">
                          <mat-icon>unarchive</mat-icon>
                          <span>{{ 'Move to inbox' | t }}</span>
                        </button>
                      }
                    }
                    @if (folder() !== 'sent') {
                      <mat-divider></mat-divider>
                    }
                    <button mat-menu-item type="button" class="!text-red-600" (click)="bulkDelete()" [disabled]="checkedCount() === 0 || bulkBusy()">
                      <mat-icon class="!text-red-600">delete</mat-icon>
                      <span>{{ 'Delete' | t }}</span>
                    </button>
                  </mat-menu>
                </div>

                @if (loading() && listItems().length === 0) {
                  <ng-container [ngTemplateOutlet]="loadingRows" />
                } @else if (listItems().length === 0) {
                  <ng-container [ngTemplateOutlet]="emptyState" />
                } @else {
                  <ul class="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                    @for (item of listItems(); track item.id) {
                      <li
                        class="flex items-start transition hover:bg-slate-50"
                        [ngClass]="{ '!bg-[#007979]/10 shadow-[inset_3px_0_0_#007979]': selectedId() === item.id || isChecked(item.id), 'bg-teal-50/40': item.unread && selectedId() !== item.id && !isChecked(item.id) }"
                      >
                        <label class="flex h-11 w-10 shrink-0 cursor-pointer items-center justify-center pl-2">
                          <input
                            type="checkbox"
                            class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                            [checked]="isChecked(item.id)"
                            (change)="toggleChecked(item.id)"
                            [attr.aria-label]="(item.outgoing ? 'Select email to {0}' : 'Select message from {0}') | t: [item.who]"
                          />
                        </label>
                        <button
                          type="button"
                          class="block min-w-0 flex-1 py-3 pl-1 pr-4 text-left"
                          [attr.aria-current]="selectedId() === item.id ? 'true' : null"
                          (click)="select(item.id)"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <span class="flex min-w-0 items-center gap-1.5">
                              @if (item.unread) {
                                <span class="h-2 w-2 shrink-0 rounded-full bg-[#007979]" [attr.aria-label]="'Unread' | t"></span>
                              }
                              <span class="truncate text-sm" [class]="item.unread ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm font-medium text-slate-700'">
                                {{ item.outgoing ? ('To: {0}' | t: [item.who]) : item.who }}
                              </span>
                            </span>
                            <span class="shrink-0 text-xs text-slate-500">{{ item.date ? (item.date | date: 'MMM d') : '' }}</span>
                          </div>
                          <p class="mt-0.5 truncate text-sm" [class]="item.unread ? 'mt-0.5 truncate text-sm font-semibold text-slate-800' : 'mt-0.5 truncate text-sm text-slate-600'">
                            {{ item.subject || ('(No subject)' | t) }}
                          </p>
                          <p class="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            @if (item.badge) {
                              <span class="shrink-0 rounded bg-slate-100 px-1 text-[10px] font-semibold uppercase text-slate-600">{{ item.badge | t }}</span>
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
                class="flex min-h-[20rem] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:min-h-0"
                [ngClass]="{ 'max-lg:hidden': !selected() }"
              >
                @if (selected(); as current) {
                  <div class="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-1.5 sm:px-3">
                    <button type="button" class="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:hidden" (click)="selectedId.set(null)">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">arrow_back</mat-icon>
                      {{ 'Back' | t }}
                    </button>

                    <div class="ml-auto flex flex-wrap items-center gap-1">
                      @if (current.kind === 'received') {
                        <button type="button" (click)="reply(current.message)" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006666]">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
                          {{ 'Reply' | t }}
                        </button>
                        <button type="button" (click)="forwardReceived(current.message)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Forward' | t" [title]="'Forward' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
                        </button>
                        @if (!current.message.archived) {
                          <button type="button" (click)="markUnread(current.message)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Mark as unread' | t" [title]="'Mark as unread' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">mark_email_unread</mat-icon>
                          </button>
                          <button type="button" (click)="archive(current.message)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Archive' | t" [title]="'Archive' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                          </button>
                        } @else {
                          <button type="button" (click)="restore(current.message)" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                            {{ 'Move to inbox' | t }}
                          </button>
                        }
                        <button type="button" (click)="deleteReceived(current.message)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                        </button>
                      } @else {
                        <button type="button" (click)="forwardSent(current.message)" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward_to_inbox</mat-icon>
                          {{ 'Send again' | t }}
                        </button>
                        <button type="button" (click)="deleteSent(current.message)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                        </button>
                      }
                    </div>
                  </div>

                  <article class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    <h2 class="break-words text-xl font-semibold leading-snug text-slate-900">{{ current.message.subject || ('(No subject)' | t) }}</h2>

                    @if (current.kind === 'received') {
                      <div class="mt-4 flex items-start gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007979] text-base font-semibold text-white" aria-hidden="true">
                          {{ initial(current.message.name || current.message.email) }}
                        </span>
                        <div class="min-w-0 flex-1 text-sm">
                          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
                            <p class="min-w-0 break-all text-slate-900">
                              <span class="font-semibold">{{ current.message.name || current.message.email }}</span>
                              @if (current.message.name && current.message.name !== current.message.email) {
                                <span class="text-slate-500"> &lt;{{ current.message.email }}&gt;</span>
                              }
                            </p>
                            <p class="shrink-0 text-xs text-slate-500">{{ toDate(current.message.receivedAt) | date: 'medium' }}</p>
                          </div>
                          <p class="mt-0.5 break-all text-xs text-slate-500">{{ 'to {0}' | t: [current.message.to.join(', ')] }}</p>
                          @if (current.message.cc.length) {
                            <p class="break-all text-xs text-slate-500">{{ 'Cc: {0}' | t: [current.message.cc.join(', ')] }}</p>
                          }
                        </div>
                      </div>

                      @if (current.message.repliedAt) {
                        <p class="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <mat-icon class="!h-4 !w-4 !text-base">reply</mat-icon>
                          {{ 'Replied {0}' | t: [(toDate(current.message.repliedAt) | date: 'medium')] }}
                        </p>
                      }

                      @if (current.message.html) {
                        <div class="mt-4 flex gap-1" role="group" [attr.aria-label]="'Message format' | t">
                          <button type="button" (click)="showFormatted.set(true)" [attr.aria-pressed]="showFormatted()" [class]="showFormatted() ? 'h-7 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-900' : 'h-7 rounded-md px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50'">{{ 'Formatted' | t }}</button>
                          <button type="button" (click)="showFormatted.set(false)" [attr.aria-pressed]="!showFormatted()" [class]="showFormatted() ? 'h-7 rounded-md px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50' : 'h-7 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-900'">{{ 'Plain text' | t }}</button>
                        </div>
                      }

                      @if (showFormatted() && current.message.html) {
                        <!-- Sandboxed: no scripts, no access to this app. -->
                        <iframe
                          [title]="'Email content' | t"
                          sandbox=""
                          referrerpolicy="no-referrer"
                          class="mt-3 h-[60vh] w-full rounded-lg border border-slate-200 bg-white"
                          [srcdoc]="current.message.html"
                        ></iframe>
                      } @else {
                        <div class="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{{ plainText(current.message) }}</div>
                      }

                      <ng-container [ngTemplateOutlet]="attachmentList" [ngTemplateOutletContext]="{ $implicit: current.message }" />
                    } @else {
                      <div class="mt-4 flex items-start gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-base font-semibold text-white" aria-hidden="true">
                          {{ initial(senderName()) }}
                        </span>
                        <div class="min-w-0 flex-1 text-sm">
                          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
                            <p class="min-w-0 font-semibold text-slate-900">{{ senderLabel() }}</p>
                            <p class="shrink-0 text-xs text-slate-500">{{ toDate(current.message.createdAt) | date: 'medium' }}</p>
                          </div>
                          <p class="mt-0.5 break-all text-xs text-slate-500">{{ 'to {0}' | t: [current.message.to.join(', ')] }}</p>
                          @if (current.message.cc.length) {
                            <p class="break-all text-xs text-slate-500">{{ 'Cc: {0}' | t: [current.message.cc.join(', ')] }}</p>
                          }
                          <p class="text-xs text-slate-500">{{ 'Sent by {0}' | t: [current.message.createdByName || current.message.createdByEmail || ('Unknown' | t)] }}</p>
                        </div>
                      </div>

                      <span class="mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold" [class]="sentStatusClass(current.message.status)">
                        {{ sentStatusLabel(current.message.status) | t }}
                      </span>

                      <!-- What was written: never translated. -->
                      <div class="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{{ current.message.message }}</div>
                    }
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
            <!-- =====================================================
                 LIST VIEW (the platform mailbox design)
                 ===================================================== -->
            <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div class="flex min-h-11 items-center gap-1 border-b border-slate-200 px-1 py-1.5 sm:gap-2 sm:px-2">
                @if (folder() !== 'sent') {
                  <label class="flex h-8 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-100 sm:w-8" [title]="'Select all' | t">
                    <input
                      type="checkbox"
                      class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                      [checked]="allVisibleChecked()"
                      [indeterminate]="someVisibleChecked()"
                      [disabled]="visibleItems().length === 0"
                      (change)="toggleAllVisible()"
                      [attr.aria-label]="'Select all messages' | t"
                    />
                  </label>
                }

                @if (checkedMessages().length > 0) {
                  <div class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="toolbar" [attr.aria-label]="'Selected messages' | t">
                    <span class="mr-1 shrink-0 text-sm font-semibold text-slate-900">{{ '{0} selected' | t: [checkedMessages().length] }}</span>
                    @if (folder() === 'archived') {
                      <button type="button" (click)="bulk('restore')" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                        <span class="hidden sm:inline">{{ 'Move to inbox' | t }}</span>
                      </button>
                    } @else {
                      <button type="button" (click)="bulk('archive')" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                        <span class="hidden sm:inline">{{ 'Archive' | t }}</span>
                      </button>
                      <button type="button" (click)="bulk('read')" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">drafts</mat-icon>
                        <span class="hidden sm:inline">{{ 'Mark read' | t }}</span>
                      </button>
                      <button type="button" (click)="bulk('unread')" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                        <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">mark_email_unread</mat-icon>
                        <span class="hidden sm:inline">{{ 'Mark unread' | t }}</span>
                      </button>
                    }
                    <button type="button" (click)="bulkDelete()" [disabled]="bulkBusy()" class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:!bg-red-50 hover:!text-red-600 disabled:opacity-50">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                      <span class="hidden sm:inline">{{ 'Delete' | t }}</span>
                    </button>
                    <button type="button" (click)="clearChecked()" class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" [title]="'Clear selection' | t">
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
                      <span class="hidden sm:inline">{{ 'Clear' | t }}</span>
                    </button>
                  </div>
                } @else {
                  <ng-container [ngTemplateOutlet]="folderTabs" />
                }
              </div>

              @if (loading() && listItems().length === 0) {
                <ng-container [ngTemplateOutlet]="loadingRows" />
              } @else if (listItems().length === 0) {
                <ng-container [ngTemplateOutlet]="emptyState" />
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (item of visibleItems(); track item.id) {
                    <li
                      class="group relative flex cursor-pointer items-center gap-2.5 px-1 py-2.5 transition hover:bg-slate-50 hover:shadow-[inset_3px_0_0_#007979] sm:gap-2 sm:px-2"
                      [ngClass]="{ 'bg-teal-50/40': item.unread && !isChecked(item.id), '!bg-[#007979]/10': isChecked(item.id) }"
                      (click)="select(item.id)"
                    >
                      @if (item.received) {
                        <label class="-my-1 flex h-8 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-slate-200/60 sm:w-8" (click)="$event.stopPropagation()">
                          <input
                            type="checkbox"
                            class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#007979]"
                            [checked]="isChecked(item.id)"
                            (change)="toggleChecked(item.id)"
                            [attr.aria-label]="'Select message from {0}' | t: [item.who]"
                          />
                        </label>
                      } @else {
                        <span class="flex h-8 w-5 shrink-0 items-center justify-center text-slate-400 sm:w-8" aria-hidden="true">
                          <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">send</mat-icon>
                        </span>
                      }

                      <span
                        class="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        [ngClass]="{ 'bg-[#007979]': item.unread, 'max-sm:hidden': !item.unread }"
                        [attr.aria-label]="item.unread ? ('New' | t) : null"
                      ></span>

                      <!-- Desktop: one line. Mobile: sender + date, then subject. -->
                      <div class="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                        <div class="flex items-center justify-between gap-2 sm:w-48 sm:shrink-0">
                          <p [class]="item.unread ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm text-slate-700'">
                            {{ item.outgoing ? ('To: {0}' | t: [item.who]) : item.who }}
                          </p>
                          <span class="shrink-0 text-xs text-slate-500 sm:hidden">{{ item.date ? (item.date | date: 'MMM d') : '' }}</span>
                        </div>

                        <p class="mt-0.5 flex min-w-0 flex-1 items-center gap-2 sm:mt-0">
                          <span [class]="item.unread ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm text-slate-600'">
                            {{ item.subject || ('(No subject)' | t) }}
                          </span>
                          <span class="hidden min-w-0 truncate text-sm text-slate-400 md:inline">— {{ item.preview }}</span>
                          @if (item.badge) {
                            <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium leading-[18px] text-slate-500">{{ item.badge | t }}</span>
                          }
                        </p>
                      </div>

                      <!-- Date (desktop), swapped for quick actions on hover -->
                      <span
                        [class]="item.unread
                          ? 'hidden w-20 shrink-0 text-right text-xs font-semibold text-slate-900 sm:block sm:group-hover:invisible sm:group-focus-within:invisible'
                          : 'hidden w-20 shrink-0 text-right text-xs text-slate-500 sm:block sm:group-hover:invisible sm:group-focus-within:invisible'"
                        [title]="item.date ? (item.date | date: 'medium') : ''"
                      >
                        {{ item.date ? (item.date | date: 'MMM d') : '' }}
                      </span>

                      <div
                        class="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg bg-slate-50 pl-2 sm:group-hover:flex sm:group-focus-within:flex"
                        (click)="$event.stopPropagation()"
                      >
                        @if (item.received; as message) {
                          <button type="button" (click)="reply(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Reply' | t" [title]="'Reply' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
                          </button>
                          @if (message.archived) {
                            <button type="button" (click)="restore(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Move to inbox' | t" [title]="'Move to inbox' | t">
                              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
                            </button>
                          } @else {
                            <button type="button" (click)="archive(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Archive' | t" [title]="'Archive' | t">
                              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
                            </button>
                          }
                          <button type="button" (click)="deleteReceived(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                          </button>
                        }
                        @if (item.sent; as message) {
                          <button type="button" (click)="forwardSent(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900" [attr.aria-label]="'Send again' | t" [title]="'Send again' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward_to_inbox</mat-icon>
                          </button>
                          <button type="button" (click)="deleteSent(message)" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
                            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                          </button>
                        }
                      </div>
                    </li>
                  }
                </ul>

                <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                  <span>
                    {{ (listItems().length === 1 ? '{0} of {1} message' : '{0} of {1} messages') | t: [visibleItems().length, listItems().length] }}
                  </span>
                  @if (visibleItems().length < listItems().length) {
                    <button type="button" (click)="visibleCount.set(visibleCount() + pageSize)" class="rounded-md px-2 py-1 font-semibold text-[#007979] hover:bg-[#007979]/10">
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

    <!-- Attachments (both views) -->
    <ng-template #attachmentList let-message>
      @if (message.attachments.length) {
        <div class="mt-5 border-t border-slate-100 pt-4">
          <p class="text-xs font-medium text-slate-500">{{ 'Attachments' | t }}</p>
          <ul class="mt-2 flex flex-wrap gap-2">
            @for (file of message.attachments; track $index) {
              <li class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <mat-icon class="!h-4 !w-4 !text-base">attach_file</mat-icon>
                {{ file.filename || ('Attachment' | t) }}
              </li>
            }
          </ul>
          <p class="mt-2 text-xs text-slate-500">{{ 'Attachments are listed but not stored. Ask the sender to share files by link.' | t }}</p>
        </div>
      }
    </ng-template>

    <!-- =========================================================
         READER WINDOW (list view)
         ========================================================= -->
    @if (layout() === 'list' && !composing()) {
      @if (selected(); as current) {
        @if (current.kind === 'received') {
          <app-mail-reader
            [subject]="current.message.subject"
            [fromName]="current.message.name"
            [fromEmail]="current.message.email"
            [to]="current.message.to.join(', ')"
            [date]="(toDate(current.message.receivedAt) | date: 'medium') ?? ''"
            [body]="plainText(current.message)"
            [html]="current.message.html"
            [badge]="current.message.archived ? 'Archived' : current.message.repliedAt ? 'Replied' : null"
            [badgeTone]="current.message.archived ? 'archived' : 'read'"
            printLabel="Organization mailbox"
            [showReply]="true"
            [showArchive]="true"
            [archived]="current.message.archived"
            [showDelete]="true"
            [showMarkUnread]="!current.message.archived"
            (closed)="selectedId.set(null)"
            (reply)="reply(current.message)"
            (forward)="forwardReceived(current.message)"
            (archive)="archive(current.message)"
            (unarchive)="restore(current.message)"
            (markUnread)="markUnread(current.message)"
            (delete)="deleteReceived(current.message)"
          >
            @if (current.message.cc.length) {
              <p class="mt-4 break-all text-xs text-slate-500">{{ 'Cc: {0}' | t: [current.message.cc.join(', ')] }}</p>
            }
            <ng-container [ngTemplateOutlet]="attachmentList" [ngTemplateOutletContext]="{ $implicit: current.message }" />
          </app-mail-reader>
        } @else {
          <app-mail-reader
            [subject]="current.message.subject"
            [fromName]="senderLabel()"
            [fromEmail]="address() ?? ''"
            [to]="current.message.to.join(', ')"
            [date]="(toDate(current.message.createdAt) | date: 'medium') ?? ''"
            [body]="current.message.message"
            [badge]="sentStatusLabel(current.message.status)"
            [badgeTone]="current.message.status === 'sent' ? 'read' : current.message.status === 'failed' ? 'new' : 'neutral'"
            printLabel="Organization mailbox"
            [showDelete]="true"
            forwardLabel="Send again"
            forwardIcon="forward_to_inbox"
            (closed)="selectedId.set(null)"
            (forward)="forwardSent(current.message)"
            (delete)="deleteSent(current.message)"
          >
            @if (current.message.cc.length) {
              <p class="mt-4 break-all text-xs text-slate-500">{{ 'Cc: {0}' | t: [current.message.cc.join(', ')] }}</p>
            }
            <p class="mt-1 text-xs text-slate-500">{{ 'Sent by {0}' | t: [current.message.createdByName || current.message.createdByEmail || ('Unknown' | t)] }}</p>
          </app-mail-reader>
        }
      }
    }

    <!-- =========================================================
         COMPOSER (both views)
         ========================================================= -->
    @if (composing()) {
      <app-mail-composer
        [heading]="composeHeading()"
        [subtitle]="'Sent as {0}' | t: [senderLabel()]"
        submitLabel="Send"
        [sending]="sending()"
        [error]="composeError()"
        [showCc]="true"
        [(to)]="composeTo"
        [(cc)]="composeCc"
        [(subject)]="composeSubject"
        [(message)]="composeMessage"
        (send)="send()"
        (cancelled)="discard()"
      >
        <p mailComposerNote class="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
          @if (address()) {
            {{ 'Replies come back to this mailbox.' | t }}
          }
          {{ 'Up to 10 recipients per email. Separate addresses with commas.' | t }}
          {{ '"The {0} Team" is added at the end automatically.' | t: [senderName()] }}
        </p>

        <div mailComposerRecipients>
          @if (directoryWithEmail().length) {
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>{{ 'Add a member' | t }}</mat-label>
              <mat-icon matPrefix aria-hidden="true">person_add</mat-icon>
              <mat-select [value]="memberPick()" (selectionChange)="addRecipient($event.value)">
                @for (member of directoryWithEmail(); track member.userId) {
                  <mat-option [value]="member.email">
                    {{ member.displayName ? member.displayName + ' · ' + member.email : member.email }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>
      </app-mail-composer>
    }

    <!-- =========================================================
         MANAGE MAILBOXES (owners and admins)
         ========================================================= -->
    @if (managing()) {
      <div
        class="fixed inset-0 z-[60] flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
        (click)="closeManage()"
      >
        <section
          class="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-mailboxes-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-4 py-3 sm:px-6">
            <div class="min-w-0">
              <h2 id="manage-mailboxes-title" class="truncate text-lg font-semibold text-white">
                {{ (mailboxForm() ? (mailboxForm()!.isNew ? 'New mailbox' : 'Edit mailbox') : 'Departmental mailboxes') | t }}
              </h2>
              <p class="truncate text-xs text-white/80">{{ 'Shared inboxes such as Admissions or HR. Assigned staff, owners and admins can open them.' | t }}</p>
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
              <!-- ---------- Create / edit ---------- -->
              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>{{ 'Mailbox name' | t }}</mat-label>
                <input
                  matInput
                  maxlength="60"
                  [value]="form.name"
                  (input)="setFormName($any($event.target).value)"
                  [placeholder]="'Admissions' | t"
                  [disabled]="savingMailbox()"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>{{ 'Address' | t }}</mat-label>
                <input
                  matInput
                  maxlength="40"
                  autocomplete="off"
                  [value]="form.key"
                  (input)="setFormKey($any($event.target).value)"
                  [disabled]="!form.isNew || savingMailbox()"
                  [placeholder]="'admissions' | t"
                />
                <mat-hint>
                  @if (formAddress(); as preview) {
                    {{ preview }}
                  } @else {
                    {{ 'Lowercase letters, numbers and hyphens.' | t }}
                  }
                  @if (!form.isNew) {
                    · {{ 'The address cannot be changed.' | t }}
                  }
                </mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field mt-2">
                <mat-label>{{ 'Description (optional)' | t }}</mat-label>
                <input
                  matInput
                  maxlength="200"
                  [value]="form.description"
                  (input)="patchForm({ description: $any($event.target).value })"
                  [disabled]="savingMailbox()"
                />
              </mat-form-field>

              <label class="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 cursor-pointer accent-[#007979]"
                  [checked]="form.active"
                  (change)="patchForm({ active: !form.active })"
                  [disabled]="savingMailbox()"
                />
                <span class="text-sm">
                  <span class="font-semibold text-slate-900">{{ 'Mailbox is on' | t }}</span>
                  <span class="block text-slate-500">{{ 'When off, email sent to it goes to the main mailbox and staff cannot open it.' | t }}</span>
                </span>
              </label>

              <div class="rounded-lg border border-slate-200">
                <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
                  <h3 class="text-sm font-semibold text-slate-900">{{ 'Assigned staff' | t }}</h3>
                  <span class="text-xs text-slate-500">{{ '{0} selected' | t: [form.memberIds.length] }}</span>
                  <input
                    type="search"
                    class="ml-auto h-8 w-full rounded-md border border-slate-300 px-2 text-sm sm:w-56"
                    [value]="staffSearch()"
                    (input)="staffSearch.set($any($event.target).value)"
                    [placeholder]="'Find staff' | t"
                    [attr.aria-label]="'Find staff' | t"
                  />
                </div>
                <ul class="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                  @for (member of staffChoices(); track member.userId) {
                    <li>
                      <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          class="h-4 w-4 cursor-pointer accent-[#007979]"
                          [checked]="form.memberIds.includes(member.userId)"
                          (change)="toggleFormMember(member.userId)"
                          [disabled]="savingMailbox()"
                        />
                        <span class="min-w-0 flex-1 text-sm">
                          <span class="block truncate font-medium text-slate-900">{{ member.displayName || member.email || member.userId }}</span>
                          @if (member.email && member.displayName) {
                            <span class="block truncate text-xs text-slate-500">{{ member.email }}</span>
                          }
                        </span>
                        @if (member.role) {
                          <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] text-slate-600">{{ roleLabel(member.role) | t }}</span>
                        }
                      </label>
                    </li>
                  } @empty {
                    <li class="px-3 py-4 text-sm text-slate-500">{{ 'No staff found. Staff, managers, admins and owners can be assigned.' | t }}</li>
                  }
                </ul>
              </div>
              <p class="mt-2 text-xs text-slate-500">{{ 'Owners and admins can always open every mailbox. Staff lose access automatically when they leave the organization.' | t }}</p>
            } @else {
              <!-- ---------- List ---------- -->
              <div class="mb-3 flex items-center justify-between gap-2">
                <p class="text-sm text-slate-600">{{ (mailboxes().length === 1 ? '{0} mailbox' : '{0} mailboxes') | t: [mailboxes().length] }}</p>
                <button
                  type="button"
                  (click)="newMailbox()"
                  class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006666]"
                >
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">add</mat-icon>
                  {{ 'New mailbox' | t }}
                </button>
              </div>

              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li class="flex items-center gap-3 px-3 py-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]"><mat-icon>inbox</mat-icon></span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ 'Main mailbox' | t }}</p>
                    <p class="truncate text-xs text-slate-500">{{ mainAddress() }} · {{ 'Managers, admins and owners' | t }}</p>
                  </div>
                </li>
                @for (box of mailboxes(); track box.id) {
                  <li class="flex items-center gap-3 px-3 py-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" [class]="box.active ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]' : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400'"><mat-icon>groups</mat-icon></span>
                    <div class="min-w-0 flex-1">
                      <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span class="truncate">{{ box.name }}</span>
                        @if (!box.active) {
                          <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">{{ 'Off' | t }}</span>
                        }
                      </p>
                      <p class="truncate text-xs text-slate-500">
                        {{ departmentAddress(box.key) }} · {{ (box.memberIds.length === 1 ? '{0} staff member' : '{0} staff members') | t: [box.memberIds.length] }}
                      </p>
                    </div>
                    <button
                      type="button"
                      (click)="editMailbox(box)"
                      class="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">edit</mat-icon>
                      {{ 'Edit' | t }}
                    </button>
                  </li>
                } @empty {
                  <li class="px-3 py-6 text-center text-sm text-slate-500">{{ 'No departmental mailboxes yet. Create one for Admissions, HR, Support or Finance.' | t }}</li>
                }
              </ul>
            }
          </div>

          <div class="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            @if (mailboxForm(); as form) {
              @if (!form.isNew) {
                <button
                  type="button"
                  (click)="deleteMailbox()"
                  [disabled]="savingMailbox()"
                  class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
                  {{ 'Delete mailbox' | t }}
                </button>
              }
              <button type="button" (click)="mailboxForm.set(null); manageError.set('')" [disabled]="savingMailbox()" class="ml-auto h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                {{ 'Cancel' | t }}
              </button>
              <button
                type="button"
                (click)="saveMailbox()"
                [disabled]="savingMailbox()"
                class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#006666] disabled:opacity-50"
              >
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
         TOAST
         ========================================================= -->
    @if (toast()) {
      <div
        class="fixed bottom-4 left-3 right-3 z-[100] flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl sm:left-auto sm:right-6"
        role="status"
        aria-live="polite"
      >
        <mat-icon class="!h-5 !w-5 !text-[20px]">check_circle</mat-icon>
        {{ toast() | t }}
      </div>
    }
  `,
})
export class OrganizationMailboxComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mailbox = inject(OrganizationMailboxService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly access = inject(PartnerAccessService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  /** The server always renders the reading pane; the browser then applies the saved choice. */
  protected readonly layout = signal<Layout>('split');

  protected readonly folder = signal<Folder>('inbox');
  protected readonly received = signal<InboundMailboxMessage[]>([]);
  protected readonly sentMessages = signal<SentMailboxMessage[]>([]);
  protected readonly directory = signal<DirectoryEntry[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly mobileSearchOpen = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly copied = signal(false);
  /** Formatted (HTML) view is the default when the email has one. */
  protected readonly showFormatted = signal(true);
  protected readonly toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Composer
  protected readonly composing = signal(false);
  protected readonly composeHeading = signal('New email');
  protected readonly composeTo = signal('');
  protected readonly composeCc = signal('');
  protected readonly composeSubject = signal('');
  protected readonly composeMessage = signal('');
  protected readonly composeError = signal<string | null>(null);
  protected readonly sending = signal(false);
  private inReplyToMessageId: string | null = null;
  /** "Add a member" picker; cleared after each pick. */
  protected readonly memberPick = signal<string | null>(null);

  // List view: paging and bulk selection
  protected readonly pageSize = 25;
  protected readonly visibleCount = signal(this.pageSize);
  protected readonly checked = signal<ReadonlySet<string>>(new Set());
  protected readonly bulkBusy = signal(false);

  // ------------------------------------------------------------
  // Mailboxes: the main one (managers and above) and departmental ones
  // ------------------------------------------------------------

  protected readonly mainMailboxId = MAIN_MAILBOX_ID;
  protected readonly mailboxId = signal<string>(MAIN_MAILBOX_ID);
  protected readonly mailboxes = signal<OrganizationMailbox[]>([]);
  protected readonly mailboxesLoaded = signal(false);
  protected readonly mailboxUnread = signal<Record<string, number>>({});

  private readonly slug = computed(() => this.organizationStore.selectedOrganization()?.slug ?? null);

  protected readonly mainAddress = computed(() => organizationMailboxAddress(this.slug()));

  /** Owners and admins create mailboxes and assign staff. */
  protected readonly canManageMailboxes = computed(() => this.access.isAdmin());

  /** Mailboxes this person can open, main first. */
  protected readonly accessibleMailboxes = computed<MailboxChoice[]>(() => {
    const uid = this.auth.firebaseUser()?.uid ?? '';
    const choices: MailboxChoice[] = [];

    if (this.access.isManagerOrAbove()) {
      choices.push({ id: MAIN_MAILBOX_ID, name: 'Main mailbox', address: this.mainAddress(), description: '' });
    }

    for (const box of this.mailboxes()) {
      const allowed = this.access.isAdmin() || (this.access.isStaffOrAbove() && box.memberIds.includes(uid));

      if (box.active && allowed) {
        choices.push({ id: box.id, name: box.name, address: this.departmentAddress(box.key), description: box.description });
      }
    }

    return choices;
  });

  protected readonly currentMailbox = computed(
    () => this.accessibleMailboxes().find((box) => box.id === this.mailboxId()) ?? null,
  );

  /** Nothing to open: shown once the mailboxes have loaded. */
  protected readonly noAccess = computed(() => this.mailboxesLoaded() && this.accessibleMailboxes().length === 0);

  /** Unread email waiting in the other mailboxes (shown on the switcher). */
  protected readonly otherMailboxesUnread = computed(() =>
    Object.entries(this.mailboxUnread())
      .filter(([id]) => id !== this.mailboxId())
      .reduce((total, [, count]) => total + count, 0),
  );

  protected readonly address = computed(() => this.currentMailbox()?.address ?? null);

  protected readonly senderName = computed(() => {
    const organization = this.organizationStore.selectedOrganization()?.name?.trim() || 'Zebron';
    const box = this.currentMailbox();
    // "Acme Academy Admissions" for a departmental mailbox.
    return box && box.id !== MAIN_MAILBOX_ID ? `${organization} ${box.name}` : organization;
  });

  // Manage mailboxes
  protected readonly managing = signal(false);
  protected readonly mailboxForm = signal<MailboxForm | null>(null);
  protected readonly manageError = signal('');
  protected readonly savingMailbox = signal(false);
  protected readonly staffSearch = signal('');

  protected readonly formAddress = computed(() => {
    const form = this.mailboxForm();
    return form && MAILBOX_KEY_PATTERN.test(form.key) ? this.departmentAddress(form.key) : null;
  });

  /** Active staff and above, filtered by the search box. */
  protected readonly staffChoices = computed(() => {
    const term = this.staffSearch().trim().toLowerCase();
    const selected = new Set(this.mailboxForm()?.memberIds ?? []);

    return this.directory()
      .filter((member) => member.active !== false && (!member.role || MAILBOX_STAFF_ROLES.includes(member.role)))
      .filter(
        (member) =>
          !term ||
          selected.has(member.userId) ||
          (member.displayName ?? '').toLowerCase().includes(term) ||
          (member.email ?? '').toLowerCase().includes(term),
      )
      .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  });

  /** The organization's name once its context has loaded. */
  protected readonly organizationName = computed(
    () => this.organizationStore.selectedOrganization()?.name?.trim() ?? '',
  );

  /**
   * The top header bar already shows the organization's name (route data
   * organizationHeader); the browser tab reads "<Organization> · Mailbox".
   */
  private readonly documentTitle = effect(() => {
    const name = this.organizationName();
    const mailbox = this.i18n.t('Mailbox');
    this.pageTitleService.setDocumentTitle(name ? `${name} · ${mailbox}` : mailbox);
  });

  protected readonly senderLabel = computed(() => `${this.senderName()} via Zebron`);

  protected readonly unreadCount = computed(
    () => this.received().filter((message) => message.status === 'new' && !message.archived).length,
  );

  protected readonly folders = computed(() => [
    { key: 'inbox' as Folder, label: 'Inbox', icon: 'inbox', count: this.unreadCount() },
    { key: 'sent' as Folder, label: 'Sent', icon: 'send', count: 0 },
    {
      key: 'archived' as Folder,
      label: 'Archived',
      icon: 'archive',
      count: this.received().filter((message) => message.archived).length,
    },
  ]);

  /** The open folder, for the list pane header. */
  protected readonly currentFolder = computed(
    () => this.folders().find((item) => item.key === this.folder()) ?? this.folders()[0],
  );

  /** Unread emails among those listed (inbox and search results). */
  protected readonly listUnread = computed(() => this.listItems().filter((item) => item.unread).length);

  protected readonly directoryWithEmail = computed(() =>
    this.directory()
      .filter((member) => member.email)
      .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')),
  );

  protected readonly listItems = computed<ListItem[]>(() => {
    const term = this.search().trim().toLowerCase();
    const matches = (...values: string[]) =>
      !term || values.some((value) => value.toLowerCase().includes(term));

    if (this.folder() === 'sent') {
      return this.sentMessages()
        .filter((message) => matches(message.subject, message.message, ...message.to, ...message.cc))
        .map((message) => ({
          id: message.id,
          who: message.to.join(', '),
          outgoing: true,
          subject: message.subject,
          preview: message.message.slice(0, 140),
          date: this.toDate(message.createdAt),
          unread: false,
          archived: false,
          badge: message.status === 'failed' ? 'Failed' : message.status === 'sending' ? 'Sending' : message.inReplyToMessageId ? 'Reply' : '',
          received: null,
          sent: message,
        }));
    }

    const archived = this.folder() === 'archived';

    return this.received()
      .filter((message) => message.archived === archived)
      .filter((message) => matches(message.name, message.email, message.subject, this.plainText(message)))
      .map((message) => ({
        id: message.id,
        who: message.name || message.email,
        outgoing: false,
        subject: message.subject,
        preview: this.plainText(message).slice(0, 140),
        date: this.toDate(message.receivedAt),
        unread: message.status === 'new',
        archived: message.archived,
        badge: message.repliedAt ? 'Replied' : '',
        received: message,
        sent: null,
      }));
  });

  protected readonly visibleItems = computed(() => this.listItems().slice(0, this.visibleCount()));

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

  /** Checked messages that are still in the current folder. */
  protected readonly checkedMessages = computed(() => {
    const ids = this.checked();
    return this.listItems()
      .map((item) => item.received)
      .filter((message): message is InboundMailboxMessage => !!message && ids.has(message.id));
  });

  protected readonly allVisibleChecked = computed(() => {
    const visible = this.visibleItems().filter((item) => item.received);
    return visible.length > 0 && visible.every((item) => this.checked().has(item.id));
  });

  protected readonly someVisibleChecked = computed(
    () => !this.allVisibleChecked() && this.visibleItems().some((item) => this.checked().has(item.id)),
  );

  /** Reading pane: checked emails among everything listed (received and sent). */
  protected readonly checkedCount = computed(
    () => this.listItems().filter((item) => this.checked().has(item.id)).length,
  );

  protected readonly paneAllChecked = computed(
    () => this.listItems().length > 0 && this.listItems().every((item) => this.checked().has(item.id)),
  );

  protected readonly paneSomeChecked = computed(() => !this.paneAllChecked() && this.checkedCount() > 0);

  /** Checked sent emails still in the list. */
  private readonly checkedSent = computed(() => {
    const ids = this.checked();
    return this.listItems()
      .map((item) => item.sent)
      .filter((message): message is SentMailboxMessage => !!message && ids.has(message.id));
  });

  constructor() {
    afterNextRender(() => this.layout.set(readLayout()));
  }

  async ngOnInit(): Promise<void> {

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // The store exposes context errors; the mailbox still loads below.
    }

    void this.loadDirectory();
    await this.loadMailboxes();

    // Open the mailbox in the link (?box=admissions), else the first one this person can open.
    const requested = this.route.snapshot.queryParamMap.get('box') ?? '';
    const choices = this.accessibleMailboxes();
    const start = choices.find((box) => box.id === requested) ?? choices[0];

    if (!start) {
      this.loading.set(false);
      return;
    }

    this.mailboxId.set(start.id);
    await this.load();
    void this.loadUnreadCounts();
  }

  /** Departmental mailboxes (staff and above can list them). */
  private async loadMailboxes(): Promise<void> {
    try {
      this.mailboxes.set(await this.mailbox.listMailboxes(this.organizationId));
    } catch (error) {
      // Rules not deployed yet, or a member below staff: only the main mailbox.
      console.warn('[Mailbox] Departmental mailboxes unavailable.', error);
      this.mailboxes.set([]);
    } finally {
      this.mailboxesLoaded.set(true);
    }
  }

  /** Unread counts for the switcher (one small count query per mailbox). */
  private async loadUnreadCounts(): Promise<void> {
    const counts: Record<string, number> = {};

    await Promise.all(
      this.accessibleMailboxes().map(async (box) => {
        try {
          counts[box.id] = await this.mailbox.countUnread(this.organizationId, box.id);
        } catch {
          counts[box.id] = 0;
        }
      }),
    );

    this.mailboxUnread.set(counts);
  }

  protected async switchMailbox(id: string): Promise<void> {
    if (id === this.mailboxId()) {
      return;
    }

    this.mailboxId.set(id);
    this.folder.set('inbox');
    this.selectedId.set(null);
    this.search.set('');
    this.visibleCount.set(this.pageSize);
    this.clearChecked();
    this.received.set([]);
    this.sentMessages.set([]);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { box: id === MAIN_MAILBOX_ID ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    await this.load();
    void this.loadUnreadCounts();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const box = this.mailboxId();
      const [received, sent] = await Promise.all([
        this.mailbox.getReceived(this.organizationId, box),
        this.mailbox.getSent(this.organizationId, box),
      ]);

      // Ignore a slow answer for a mailbox that is no longer open.
      if (box !== this.mailboxId()) {
        return;
      }

      this.received.set(received);
      this.sentMessages.set(sent);
    } catch (error) {
      this.error.set(
        this.isPermissionDenied(error)
          ? "The mailbox couldn't be loaded: the database refused access. If mailboxes were just added, deploy the Firestore rules. Otherwise, ask an owner or admin to add you to this mailbox."
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

  // ------------------------------------------------------------
  // View
  // ------------------------------------------------------------

  protected setLayout(layout: Layout): void {
    this.layout.set(layout);
    this.selectedId.set(null);
    this.clearChecked();

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  }

  protected openFolder(folder: Folder): void {
    this.folder.set(folder);
    this.selectedId.set(null);
    this.visibleCount.set(this.pageSize);
    this.clearChecked();
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.visibleCount.set(this.pageSize);
    this.clearChecked();
  }

  protected async select(id: string): Promise<void> {
    this.selectedId.set(id);
    this.showFormatted.set(true);

    const message = this.received().find((item) => item.id === id);

    if (this.folder() !== 'sent' && message && message.status === 'new') {
      this.updateLocal(id, { status: 'read', read: true });

      try {
        await this.mailbox.markRead(this.organizationId, id, this.mailboxId());
      } catch (error) {
        console.warn('[Mailbox] Could not mark as read.', error);
      }
    }
  }

  // ------------------------------------------------------------
  // Message state
  // ------------------------------------------------------------

  protected async markUnread(message: InboundMailboxMessage): Promise<void> {
    this.selectedId.set(null);
    await this.changeState(message, { status: 'new', read: false, archived: false }, () =>
      this.mailbox.markUnread(this.organizationId, message.id, this.mailboxId()),
    );
  }

  protected async archive(message: InboundMailboxMessage): Promise<void> {
    this.selectedId.set(null);
    if (await this.changeState(message, { status: 'archived', read: true, archived: true }, () =>
      this.mailbox.archive(this.organizationId, message.id, this.mailboxId()),
    )) {
      this.showToast('Message archived');
    }
  }

  protected async restore(message: InboundMailboxMessage): Promise<void> {
    this.selectedId.set(null);
    if (await this.changeState(message, { status: 'read', read: true, archived: false }, () =>
      this.mailbox.restore(this.organizationId, message.id, this.mailboxId()),
    )) {
      this.showToast('Moved to inbox');
    }
  }

  /** Permanently deletes a received email after confirming. */
  protected async deleteReceived(message: InboundMailboxMessage): Promise<void> {
    if (!this.confirm(this.i18n.t('Delete the message from {0}? This action cannot be undone.', [message.name || message.email]))) {
      return;
    }

    try {
      await this.mailbox.deleteReceived(this.organizationId, message.id, this.mailboxId());
      this.removeLocal([message.id]);
      this.showToast('Message deleted');
    } catch (error) {
      this.error.set(this.messageOf(error));
    }
  }

  /** Permanently deletes a sent email from the mailbox after confirming. */
  protected async deleteSent(message: SentMailboxMessage): Promise<void> {
    if (!this.confirm(this.i18n.t('Delete this sent email? This action cannot be undone.'))) {
      return;
    }

    try {
      await this.mailbox.deleteSent(this.organizationId, message.id, this.mailboxId());
      this.sentMessages.update((messages) => messages.filter((item) => item.id !== message.id));
      if (this.selectedId() === message.id) {
        this.selectedId.set(null);
      }
      this.showToast('Message deleted');
    } catch (error) {
      this.error.set(this.messageOf(error));
    }
  }

  // ------------------------------------------------------------
  // Bulk actions (list view)
  // ------------------------------------------------------------

  protected isChecked(id: string): boolean {
    return this.checked().has(id);
  }

  protected toggleChecked(id: string): void {
    const next = new Set(this.checked());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.checked.set(next);
  }

  protected toggleAllVisible(): void {
    const ids = this.visibleItems().filter((item) => item.received).map((item) => item.id);
    this.checked.set(this.allVisibleChecked() ? new Set() : new Set(ids));
  }

  protected togglePaneAll(): void {
    this.checked.set(this.paneAllChecked() ? new Set() : new Set(this.listItems().map((item) => item.id)));
  }

  protected clearChecked(): void {
    this.checked.set(new Set());
  }

  /** Deletes every checked email in the current folder (received or sent). */
  protected async bulkDelete(): Promise<void> {
    const received = this.checkedMessages();
    const sent = this.checkedSent();
    const count = received.length + sent.length;

    if (
      count === 0 ||
      this.bulkBusy() ||
      !this.confirm(
        this.i18n.t(count === 1 ? 'Delete {0} message? This cannot be undone.' : 'Delete {0} messages? This cannot be undone.', [count]),
      )
    ) {
      return;
    }

    this.bulkBusy.set(true);
    const deletedReceived: string[] = [];
    const deletedSent = new Set<string>();

    for (const message of received) {
      try {
        await this.mailbox.deleteReceived(this.organizationId, message.id, this.mailboxId());
        deletedReceived.push(message.id);
      } catch (error) {
        this.error.set(this.messageOf(error));
      }
    }

    for (const message of sent) {
      try {
        await this.mailbox.deleteSent(this.organizationId, message.id, this.mailboxId());
        deletedSent.add(message.id);
      } catch (error) {
        this.error.set(this.messageOf(error));
      }
    }

    this.removeLocal(deletedReceived);
    if (deletedSent.size) {
      this.sentMessages.update((messages) => messages.filter((item) => !deletedSent.has(item.id)));
      const open = this.selectedId();
      if (open && deletedSent.has(open)) {
        this.selectedId.set(null);
      }
    }
    this.bulkBusy.set(false);
    this.clearChecked();

    const deleted = deletedReceived.length + deletedSent.size;
    if (deleted > 0) {
      this.showToast(this.i18n.t(deleted === 1 ? '{0} message deleted.' : '{0} messages deleted.', [deleted]));
    }
  }

  protected async bulk(action: 'archive' | 'restore' | 'read' | 'unread'): Promise<void> {
    const messages = this.checkedMessages();

    if (messages.length === 0 || this.bulkBusy()) {
      return;
    }

    const plan = {
      archive: {
        state: { status: 'archived', read: true, archived: true },
        write: (id: string) => this.mailbox.archive(this.organizationId, id, this.mailboxId()),
        done: ['Message archived', '{0} messages archived'],
      },
      restore: {
        state: { status: 'read', read: true, archived: false },
        write: (id: string) => this.mailbox.restore(this.organizationId, id, this.mailboxId()),
        done: ['Moved to inbox', '{0} messages moved to inbox'],
      },
      read: {
        state: { status: 'read', read: true, archived: false },
        write: (id: string) => this.mailbox.markRead(this.organizationId, id, this.mailboxId()),
        done: ['Marked as read', '{0} messages marked as read'],
      },
      unread: {
        state: { status: 'new', read: false, archived: false },
        write: (id: string) => this.mailbox.markUnread(this.organizationId, id, this.mailboxId()),
        done: ['Marked as unread', '{0} messages marked as unread'],
      },
    }[action] as {
      state: Pick<InboundMailboxMessage, 'status' | 'read' | 'archived'>;
      write: (id: string) => Promise<void>;
      done: [string, string];
    };

    this.bulkBusy.set(true);
    let succeeded = 0;

    for (const message of messages) {
      if (await this.changeState(message, plan.state, () => plan.write(message.id))) {
        succeeded++;
      }
    }

    this.bulkBusy.set(false);
    this.clearChecked();

    if (succeeded > 0) {
      this.showToast(succeeded === 1 ? plan.done[0] : this.i18n.t(plan.done[1], [succeeded]));
    }
  }

  // ------------------------------------------------------------
  // Compose
  // ------------------------------------------------------------

  protected compose(): void {
    this.openComposer('New email', { to: '', cc: '', subject: '', message: '', inReplyTo: null });
  }

  protected reply(message: InboundMailboxMessage): void {
    this.openComposer('Reply', {
      to: message.email,
      cc: '',
      subject: /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject || this.i18n.t('(No subject)')}`,
      message: `\n\n\n${this.quote(message)}`,
      inReplyTo: message.id,
    });
  }

  protected forwardReceived(message: InboundMailboxMessage): void {
    this.openComposer('Forward message', {
      to: '',
      cc: '',
      subject: /^fwd?:/i.test(message.subject) ? message.subject : `Fwd: ${message.subject || this.i18n.t('(No subject)')}`,
      message: `\n\n\n${this.quote(message)}`,
      inReplyTo: null,
    });
  }

  protected forwardSent(message: SentMailboxMessage): void {
    this.openComposer('New email', {
      to: message.to.join(', '),
      cc: message.cc.join(', '),
      subject: message.subject,
      message: message.message,
      inReplyTo: null,
    });
  }

  protected addRecipient(email: string | null): void {
    if (!email) {
      return;
    }

    const existing = splitAddresses(this.composeTo());

    if (!existing.includes(email.toLowerCase())) {
      this.composeTo.set([...existing, email.toLowerCase()].join(', '));
    }

    // Show the picker empty again, ready for the next member.
    this.memberPick.set(email);
    setTimeout(() => this.memberPick.set(null));
  }

  protected discard(): void {
    this.composing.set(false);
    this.composeError.set(null);
  }

  protected async send(): Promise<void> {
    const to = splitAddresses(this.composeTo());
    const cc = splitAddresses(this.composeCc());
    const subject = this.composeSubject().trim();
    const message = this.composeMessage().trim();

    if (to.length === 0 || !subject || !message) {
      this.composeError.set('Add at least one recipient, a subject and a message.');
      return;
    }

    if (to.length + cc.length > 10) {
      this.composeError.set('Up to 10 recipients per email.');
      return;
    }

    this.sending.set(true);
    this.composeError.set(null);

    try {
      await this.mailbox.send({
        organizationId: this.organizationId,
        mailboxId: this.mailboxId(),
        to,
        cc,
        subject,
        message,
        inReplyToMessageId: this.inReplyToMessageId,
      });

      this.composing.set(false);
      this.showToast(this.inReplyToMessageId ? 'Reply sent' : 'Email sent');
      this.folder.set('sent');
      this.selectedId.set(null);
      this.clearChecked();
      await this.load();
    } catch (error) {
      this.composeError.set(this.messageOf(error));
    } finally {
      this.sending.set(false);
    }
  }

  private openComposer(
    heading: string,
    draft: { to: string; cc: string; subject: string; message: string; inReplyTo: string | null },
  ): void {
    this.composeHeading.set(heading);
    this.composeTo.set(draft.to);
    this.composeCc.set(draft.cc);
    this.composeSubject.set(draft.subject);
    this.composeMessage.set(draft.message);
    this.inReplyToMessageId = draft.inReplyTo;
    this.composeError.set(null);
    this.memberPick.set(null);
    this.composing.set(true);
  }

  private quote(message: InboundMailboxMessage): string {
    const date = this.toDate(message.receivedAt);
    const when = date ? date.toLocaleString() : this.i18n.t('an earlier date');
    const quoted = this.plainText(message)
      .slice(0, 3000)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');

    return `${this.i18n.t('On {0}, {1} wrote:', [when, message.name || message.email])}\n${quoted}`;
  }

  // ------------------------------------------------------------
  // Manage mailboxes (owners and admins)
  // ------------------------------------------------------------

  protected openManage(): void {
    this.manageError.set('');
    this.mailboxForm.set(null);
    this.managing.set(true);
  }

  protected closeManage(): void {
    if (!this.savingMailbox()) {
      this.managing.set(false);
      this.mailboxForm.set(null);
    }
  }

  protected newMailbox(): void {
    this.manageError.set('');
    this.staffSearch.set('');
    this.mailboxForm.set({ isNew: true, key: '', keyEdited: false, name: '', description: '', memberIds: [], active: true });
  }

  protected editMailbox(box: OrganizationMailbox): void {
    this.manageError.set('');
    this.staffSearch.set('');
    this.mailboxForm.set({
      isNew: false,
      key: box.key,
      keyEdited: true,
      name: box.name,
      description: box.description,
      memberIds: [...box.memberIds],
      active: box.active,
    });
  }

  protected patchForm(changes: Partial<MailboxForm>): void {
    const form = this.mailboxForm();
    if (form) {
      this.mailboxForm.set({ ...form, ...changes });
    }
  }

  /** The name suggests the address until the address is typed by hand. */
  protected setFormName(name: string): void {
    const form = this.mailboxForm();
    if (!form) {
      return;
    }
    this.patchForm(form.isNew && !form.keyEdited ? { name, key: toMailboxKey(name) } : { name });
  }

  protected setFormKey(value: string): void {
    this.patchForm({ key: value.trim().toLowerCase(), keyEdited: true });
  }

  protected toggleFormMember(userId: string): void {
    const form = this.mailboxForm();
    if (!form) {
      return;
    }
    const members = form.memberIds.includes(userId)
      ? form.memberIds.filter((id) => id !== userId)
      : [...form.memberIds, userId];
    this.patchForm({ memberIds: members });
  }

  protected async saveMailbox(): Promise<void> {
    const form = this.mailboxForm();
    const uid = this.auth.firebaseUser()?.uid;

    if (!form || !uid || this.savingMailbox()) {
      return;
    }

    if (!form.name.trim()) {
      this.manageError.set('Give the mailbox a name.');
      return;
    }

    if (!MAILBOX_KEY_PATTERN.test(form.key) || RESERVED_MAILBOX_KEYS.includes(form.key)) {
      this.manageError.set('Choose an address using lowercase letters, numbers and hyphens, for example admissions.');
      return;
    }

    if (form.isNew && this.mailboxes().some((box) => box.key === form.key)) {
      this.manageError.set('Another mailbox already uses this address.');
      return;
    }

    if (form.memberIds.length > 50) {
      this.manageError.set('A mailbox can have up to 50 staff members.');
      return;
    }

    this.savingMailbox.set(true);
    this.manageError.set('');

    try {
      await this.mailbox.saveMailbox(
        this.organizationId,
        { key: form.key, name: form.name, description: form.description, memberIds: form.memberIds, active: form.active },
        uid,
        form.isNew,
      );
      await this.loadMailboxes();
      this.mailboxForm.set(null);
      this.showToast(form.isNew ? 'Mailbox created' : 'Mailbox saved');
      void this.loadUnreadCounts();
    } catch (error) {
      this.manageError.set(this.messageOf(error));
    } finally {
      this.savingMailbox.set(false);
    }
  }

  /** Only an empty mailbox can be deleted; otherwise turn it off. */
  protected async deleteMailbox(): Promise<void> {
    const form = this.mailboxForm();

    if (!form || form.isNew || this.savingMailbox()) {
      return;
    }

    this.savingMailbox.set(true);
    this.manageError.set('');

    try {
      const count = await this.mailbox.countMailboxMessages(this.organizationId, form.key);

      if (count > 0) {
        this.manageError.set(
          this.i18n.t('This mailbox still holds {0} emails. Delete them first, or turn the mailbox off instead.', [count]),
        );
        return;
      }

      if (!this.confirm(this.i18n.t('Delete the {0} mailbox? Email sent to its address will go to the main mailbox.', [form.name]))) {
        return;
      }

      await this.mailbox.deleteMailbox(this.organizationId, form.key);
      await this.loadMailboxes();
      this.mailboxForm.set(null);
      this.showToast('Mailbox deleted');

      if (this.mailboxId() === form.key) {
        const next = this.accessibleMailboxes()[0];
        if (next) {
          await this.switchMailbox(next.id);
        }
      }
    } catch (error) {
      this.manageError.set(this.messageOf(error));
    } finally {
      this.savingMailbox.set(false);
    }
  }

  protected departmentAddress(key: string): string | null {
    return departmentMailboxAddress(this.slug(), key);
  }

  protected roleLabel(role: string): string {
    return (
      { org_owner: 'Owner', org_admin: 'Admin', org_manager: 'Manager', org_staff: 'Staff', org_member: 'Member' } as Record<string, string>
    )[role] ?? role;
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

  protected initial(value: string): string {
    return (value || 'Z').trim().charAt(0).toUpperCase();
  }

  protected sentStatusLabel(status: SentMailboxMessage['status']): string {
    return status === 'sent' ? 'Sent' : status === 'failed' ? 'Failed to send' : 'Sending';
  }

  protected sentStatusClass(status: SentMailboxMessage['status']): string {
    const tone =
      status === 'sent'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'failed'
          ? 'bg-red-50 text-red-700'
          : 'bg-slate-100 text-slate-600';
    return `mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`;
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

  private showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => this.toast.set(null), 2600);
  }

  /** Optimistic update; returns whether the write succeeded. */
  private async changeState(
    message: InboundMailboxMessage,
    state: Pick<InboundMailboxMessage, 'status' | 'read' | 'archived'>,
    write: () => Promise<void>,
  ): Promise<boolean> {
    const previous = { status: message.status, read: message.read, archived: message.archived };

    this.updateLocal(message.id, state);

    try {
      await write();
      return true;
    } catch (error) {
      this.updateLocal(message.id, previous);
      this.error.set(this.messageOf(error));
      return false;
    }
  }

  private removeLocal(ids: string[]): void {
    const removed = new Set(ids);
    this.received.update((messages) => messages.filter((message) => !removed.has(message.id)));
    const open = this.selectedId();
    if (open && removed.has(open)) {
      this.selectedId.set(null);
    }
  }

  /** Browser confirmation; never shown during server rendering. */
  private confirm(question: string): boolean {
    return typeof window !== 'undefined' && window.confirm(question);
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
      return 'You do not have permission to do that in this mailbox.';
    }

    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}

/** "Human Resources" -> "human-resources" (a suggested mailbox address). */
function toMailboxKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

function readLayout(): Layout {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LAYOUT_STORAGE_KEY) === 'list' ? 'list' : 'split';
  } catch {
    return 'split';
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
