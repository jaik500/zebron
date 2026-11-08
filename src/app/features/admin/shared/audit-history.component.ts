import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Timestamp } from 'firebase/firestore';

import { AuditLog } from '../../../core/models/audit-log.model';
import { AuditService } from '../../../core/services/audit.service';
import { LoggerService } from '../../../core/services/logger.service';

const VISIBLE_KEY = 'zebron.admin.auditHistory.visible';
const PAGE_SIZE = 15;

/**
 * Compact audit trail for the Control Center: one line per record,
 * click a line for its details. The whole list can be hidden; the
 * choice is remembered in this browser.
 */
@Component({
  selector: 'app-configuration-audit',
  standalone: true,
  imports: [TitleCasePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border border-gray-200 bg-white">
      <!-- Header -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div class="mr-auto min-w-0">
          <h2 class="text-base font-semibold text-[#032D42]">Audit Trail</h2>
          <p class="text-xs text-gray-500">Administrative and system activity.</p>
        </div>

        <div class="flex items-center gap-1.5 text-xs" aria-label="Summary">
          <span class="chip bg-gray-100 text-gray-700" matTooltip="Records loaded">
            <mat-icon class="chip-icon">history</mat-icon>{{ logs().length }}
          </span>
          <span class="chip bg-green-50 text-green-700" matTooltip="Successful">
            <mat-icon class="chip-icon">check_circle</mat-icon>{{ successCount() }}
          </span>
          <span class="chip bg-amber-50 text-amber-700" matTooltip="Need attention">
            <mat-icon class="chip-icon">warning</mat-icon>{{ attentionCount() }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            mat-icon-button
            type="button"
            [disabled]="loading()"
            (click)="loadLogs()"
            matTooltip="Refresh"
            aria-label="Refresh audit trail"
          >
            <mat-icon [class.animate-spin]="loading()">refresh</mat-icon>
          </button>

          <button
            mat-stroked-button
            type="button"
            class="!h-8 !text-xs"
            [attr.aria-expanded]="visible()"
            aria-controls="audit-history-list"
            (click)="toggleVisible()"
          >
            <mat-icon class="!text-base">{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
            {{ visible() ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>

      @if (visible()) {
        <div id="audit-history-list" class="border-t border-gray-100">
          @if (error()) {
            <div class="flex items-start gap-2 px-4 py-3 text-sm text-red-700" role="alert">
              <mat-icon class="!text-lg text-red-600">error</mat-icon>
              <span><strong>Unable to load audit records.</strong> {{ error() }}</span>
            </div>
          } @else if (loading() && logs().length === 0) {
            <p class="px-4 py-6 text-center text-sm text-gray-500">Loading audit records…</p>
          } @else if (logs().length === 0) {
            <p class="px-4 py-6 text-center text-sm text-gray-500">No audit records yet.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (log of shownLogs(); track log.id) {
                <li>
                  <button
                    type="button"
                    class="row"
                    [attr.aria-expanded]="openId() === log.id"
                    (click)="toggleOpen(log.id)"
                  >
                    <mat-icon class="!h-4 !w-4 shrink-0 !text-base" [class]="iconColor(log.outcome)">
                      {{ outcomeIcon(log.outcome) }}
                    </mat-icon>

                    <span class="min-w-0 flex-1 truncate">
                      <span class="font-medium text-[#032D42]">{{ formatAction(log.action) }}</span>
                      <span class="text-gray-500">
                        · {{ log.actorName || log.actorEmail || 'Unknown user' }}
                      </span>
                    </span>

                    <span class="hidden shrink-0 text-gray-400 sm:inline">{{ log.entityType }}</span>

                    <span
                      class="shrink-0 tabular-nums text-gray-500"
                      [title]="formatDateTime(log.createdAt)"
                    >
                      {{ shortTime(log.createdAt) }}
                    </span>

                    @if (log.outcome !== 'success') {
                      <span class="pill" [class]="outcomeClasses(log.outcome)">
                        {{ log.outcome | titlecase }}
                      </span>
                    }

                    <mat-icon class="!h-4 !w-4 shrink-0 !text-base text-gray-400">
                      {{ openId() === log.id ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </button>

                  @if (openId() === log.id) {
                    <dl class="grid gap-x-6 gap-y-2 bg-gray-50 px-4 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt class="label">User</dt>
                        <dd class="text-gray-800">{{ log.actorName || 'Unknown user' }}</dd>
                        @if (log.actorEmail) {
                          <dd class="break-all text-gray-500">{{ log.actorEmail }}</dd>
                        }
                        @if (log.actorId) {
                          <dd class="break-all text-gray-400">ID: {{ log.actorId }}</dd>
                        }
                      </div>
                      <div>
                        <dt class="label">Record</dt>
                        <dd class="text-gray-800">{{ log.entityType }}</dd>
                        @if (log.entityId) {
                          <dd class="break-all text-gray-500">{{ log.entityId }}</dd>
                        }
                      </div>
                      <div>
                        <dt class="label">Date & time</dt>
                        <dd class="text-gray-800">{{ formatDateTime(log.createdAt) }}</dd>
                      </div>
                      <div>
                        <dt class="label">Source</dt>
                        <dd class="text-gray-800">
                          {{ log.source | titlecase }} · {{ log.actorType | titlecase }}
                        </dd>
                        <dd>
                          <span class="pill" [class]="outcomeClasses(log.outcome)">
                            {{ log.outcome | titlecase }}
                          </span>
                        </dd>
                      </div>
                      @if (log.reason) {
                        <div class="sm:col-span-2 lg:col-span-4">
                          <dt class="label">Reason</dt>
                          <dd class="text-gray-800">{{ log.reason }}</dd>
                        </div>
                      }
                      @if (hasMetadata(log)) {
                        <div class="sm:col-span-2 lg:col-span-4">
                          <dt class="label">Details</dt>
                          <dd>
                            <pre class="max-h-48 overflow-auto rounded bg-white p-2 text-[11px] text-gray-600">{{ formatMetadata(log.metadata) }}</pre>
                          </dd>
                        </div>
                      }
                    </dl>
                  }
                </li>
              }
            </ul>

            @if (logs().length > shownCount()) {
              <div class="border-t border-gray-100 px-4 py-2 text-center">
                <button mat-button type="button" class="!text-xs" (click)="showMore()">
                  Show more ({{ logs().length - shownCount() }} left)
                </button>
              </div>
            }
          }
        </div>
      }
    </section>
  `,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 9999px;
      padding: 0.125rem 0.5rem;
      font-weight: 600;
    }
    .chip-icon {
      width: 0.875rem;
      height: 0.875rem;
      font-size: 0.875rem;
    }
    .row {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.625rem;
      padding: 0.45rem 1rem;
      font-size: 0.8125rem;
      line-height: 1.25rem;
      text-align: left;
    }
    .row:hover {
      background: #f9fafb;
    }
    .row:focus-visible {
      outline: 2px solid #2a835f;
      outline-offset: -2px;
    }
    .pill {
      display: inline-flex;
      flex-shrink: 0;
      border-radius: 9999px;
      padding: 0 0.45rem;
      font-size: 0.6875rem;
      font-weight: 600;
      line-height: 1.125rem;
    }
    .label {
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6b7280;
    }
  `,
})
export class AuditHistoryComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly logger = inject(LoggerService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visible = signal(readVisible());
  protected readonly openId = signal<string | null>(null);
  protected readonly shownCount = signal(PAGE_SIZE);

  protected readonly shownLogs = computed(() => this.logs().slice(0, this.shownCount()));
  protected readonly successCount = computed(
    () => this.logs().filter((log) => log.outcome === 'success').length,
  );
  protected readonly attentionCount = computed(
    () => this.logs().filter((log) => log.outcome !== 'success').length,
  );

  ngOnInit(): void {
    void this.loadLogs();
  }

  protected async loadLogs(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      this.logs.set(await this.auditService.getRecentLogs(100));
      this.shownCount.set(PAGE_SIZE);
    } catch (error) {
      this.logger.error('AuditHistoryComponent', 'Failed to load audit records.', error);
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleVisible(): void {
    const next = !this.visible();
    this.visible.set(next);
    try {
      localStorage.setItem(VISIBLE_KEY, next ? '1' : '0');
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }

  protected toggleOpen(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  protected showMore(): void {
    this.shownCount.update((count) => count + PAGE_SIZE);
  }

  protected formatAction(action: string): string {
    if (!action) return 'Unknown action';
    return action
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  protected formatDateTime(timestamp: Timestamp | null | undefined): string {
    if (!timestamp) return 'Pending';
    return timestamp.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
  }

  /** "2:41 PM" today, "Nov 7, 2:41 PM" this year, otherwise "Nov 7, 2025". */
  protected shortTime(timestamp: Timestamp | null | undefined): string {
    if (!timestamp) return 'Pending';
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  protected hasMetadata(log: AuditLog): boolean {
    return !!log.metadata && Object.keys(log.metadata).length > 0;
  }

  protected formatMetadata(metadata: Record<string, unknown> | undefined): string {
    if (!metadata) return '';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return '[Unable to display details]';
    }
  }

  protected outcomeIcon(outcome: AuditLog['outcome']): string {
    switch (outcome) {
      case 'success':
        return 'check_circle';
      case 'failure':
        return 'error';
      case 'denied':
        return 'block';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  }

  protected iconColor(outcome: AuditLog['outcome']): string {
    switch (outcome) {
      case 'success':
        return 'text-green-600';
      case 'failure':
        return 'text-red-600';
      case 'denied':
        return 'text-orange-600';
      default:
        return 'text-gray-500';
    }
  }

  protected outcomeClasses(outcome: AuditLog['outcome']): string {
    switch (outcome) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failure':
        return 'bg-red-100 text-red-700';
      case 'denied':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}

function readVisible(): boolean {
  try {
    return localStorage.getItem(VISIBLE_KEY) !== '0';
  } catch {
    return true;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'An unexpected error occurred while loading the audit trail.';
}
