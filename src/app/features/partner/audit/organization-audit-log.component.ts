import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  AuditEntityType,
  AuditLogEntry,
  AuditSeverity,
  AuditSource,
  OrganizationAuditService,
} from './organization-audit.service';

const SOURCE_LABELS: Record<AuditSource, { label: string; classes: string; icon: string }> = {
  organization: { label: 'Organization', classes: 'bg-teal-50 text-teal-800', icon: 'groups' },
  platform: { label: 'Zebron', classes: 'bg-indigo-50 text-indigo-800', icon: 'shield_person' },
  system: { label: 'System', classes: 'bg-gray-100 text-gray-700', icon: 'settings_suggest' },
};

const SEVERITY_CLASSES: Record<AuditSeverity, string> = {
  info: 'bg-gray-300',
  notice: 'bg-amber-400',
  critical: 'bg-red-500',
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  organization: 'Organization',
  membership: 'Members & roles',
  invitation: 'Invitations',
  application: 'Applications',
  contract: 'Contract',
  service_request: 'Requests to Zebron',
  announcement: 'Dashboard banners',
  email_sent: 'Emails sent',
  email_received: 'Emails received',
  settings: 'Settings',
  onboarding: 'Onboarding',
  test_program: 'Test Center programs',
  test_course: 'Test Center courses',
  test_topic: 'Test Center topics',
  test_question: 'Test Center questions',
};

const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Owner',
  org_admin: 'Admin',
  org_manager: 'Manager',
  org_staff: 'Staff',
  org_member: 'Member',
  platform_admin: 'Zebron admin',
};

/**
 * Audit log for an organization: every change to its data, whether made
 * by its own people, by Zebron, or automatically. Read-only, recorded by
 * the backend. Shown to admins and owners on the Administration page.
 */
@Component({
  selector: 'app-organization-audit-log',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-t border-gray-100 p-5 sm:p-6">
      <!-- Filters -->
      <div class="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-5">
        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
          <mat-label>Made by</mat-label>
          <mat-select [value]="source()" (selectionChange)="source.set($event.value); reload()">
            <mat-option value="all">Everyone</mat-option>
            <mat-option value="organization">Organization</mat-option>
            <mat-option value="platform">Zebron</mat-option>
            <mat-option value="system">System</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
          <mat-label>Area</mat-label>
          <mat-select [value]="entityType()" (selectionChange)="entityType.set($event.value); reload()">
            <mat-option value="all">All areas</mat-option>
            @for (area of areas; track area.key) {
              <mat-option [value]="area.key">{{ area.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
          <mat-label>From</mat-label>
          <input matInput type="date" [ngModel]="fromDate()" (ngModelChange)="fromDate.set($event); reload()" name="fromDate" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
          <mat-label>To</mat-label>
          <input matInput type="date" [ngModel]="toDate()" (ngModelChange)="toDate.set($event); reload()" name="toDate" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
          <mat-label>Importance</mat-label>
          <mat-select [value]="severity()" (selectionChange)="severity.set($event.value)">
            <mat-option value="all">All</mat-option>
            <mat-option value="critical">Critical only</mat-option>
            <mat-option value="notice">Notice and critical</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <mat-form-field appearance="outline" class="zb-field zb-field--dense zb-field--flush min-w-0 flex-1" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Search loaded entries</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="search.set($event)" name="auditSearch" />
        </mat-form-field>

        <button mat-icon-button type="button" aria-label="Refresh" title="Refresh" [disabled]="loading()" (click)="reload()">
          <mat-icon>refresh</mat-icon>
        </button>

        <button mat-stroked-button type="button" [disabled]="visible().length === 0" (click)="exportCsv()">
          <mat-icon>download</mat-icon>
          Export CSV
        </button>
      </div>

      @if (error()) {
        <p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
      }

      <!-- Entries -->
      @if (loading() && entries().length === 0) {
        <p class="mt-5 text-sm text-gray-500">Loading audit log…</p>
      } @else if (visible().length === 0) {
        <div class="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No audit entries match these filters.
        </div>
      } @else {
        <ul class="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200">
          @for (entry of visible(); track entry.id) {
            <li>
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                [attr.aria-expanded]="expandedId() === entry.id"
                (click)="expandedId.set(expandedId() === entry.id ? null : entry.id)"
              >
                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" [class]="severityClass(entry.severity)" [title]="entry.severity"></span>

                <span class="min-w-0 flex-1">
                  <span class="block break-words text-sm font-medium text-gray-900">{{ entry.summary }}</span>
                  <span class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold" [class]="sourceInfo(entry.source).classes">
                      <mat-icon class="!h-3.5 !w-3.5 !text-sm">{{ sourceInfo(entry.source).icon }}</mat-icon>
                      {{ sourceInfo(entry.source).label }}
                    </span>
                    <span>{{ entry.actorName || entry.actorEmail || (entry.actorType === 'system' ? 'Zebron system' : 'Unknown user') }}</span>
                    @if (entry.actorRole) {
                      <span class="rounded bg-gray-100 px-1.5 text-[11px] text-gray-600">{{ roleLabel(entry.actorRole) }}</span>
                    }
                    <span>· {{ areaLabel(entry.entityType) }}</span>
                  </span>
                </span>

                <span class="shrink-0 text-right text-xs text-gray-500">
                  {{ entry.occurredAt | date: 'MMM d, y' }}<br />
                  {{ entry.occurredAt | date: 'h:mm:ss a' }}
                </span>
              </button>

              @if (expandedId() === entry.id) {
                <div class="border-t border-gray-100 bg-gray-50 px-4 py-4 text-sm">
                  <dl class="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div><dt class="text-xs text-gray-500">When</dt><dd class="text-gray-900">{{ entry.occurredAt | date: 'full' }}</dd></div>
                    <div><dt class="text-xs text-gray-500">Action</dt><dd class="capitalize text-gray-900">{{ entry.action }} · {{ areaLabel(entry.entityType) }}</dd></div>
                    <div>
                      <dt class="text-xs text-gray-500">Who</dt>
                      <dd class="break-all text-gray-900">
                        {{ entry.actorName || '—' }}
                        @if (entry.actorEmail) { &lt;{{ entry.actorEmail }}&gt; }
                      </dd>
                    </div>
                    <div><dt class="text-xs text-gray-500">User ID</dt><dd class="break-all font-mono text-xs text-gray-700">{{ entry.actorId || '—' }}</dd></div>
                    <div><dt class="text-xs text-gray-500">Record</dt><dd class="break-all font-mono text-xs text-gray-700">{{ entry.entityPath }}</dd></div>
                    <div><dt class="text-xs text-gray-500">Event ID</dt><dd class="break-all font-mono text-xs text-gray-700">{{ entry.eventId }}</dd></div>
                  </dl>

                  @if (entry.changes.length > 0) {
                    <div class="mt-4 overflow-x-auto">
                      <table class="w-full min-w-[32rem] text-left text-xs">
                        <thead>
                          <tr class="border-b border-gray-200 text-gray-500">
                            <th class="py-1.5 pr-3 font-semibold">Field</th>
                            <th class="py-1.5 pr-3 font-semibold">Before</th>
                            <th class="py-1.5 font-semibold">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (change of entry.changes; track change.field) {
                            <tr class="border-b border-gray-100 align-top">
                              <td class="py-1.5 pr-3 font-mono text-gray-700">{{ change.field }}</td>
                              <td class="max-w-[16rem] break-words py-1.5 pr-3 text-red-800">{{ display(change.before) }}</td>
                              <td class="max-w-[16rem] break-words py-1.5 text-emerald-800">{{ display(change.after) }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>

        @if (hasMore()) {
          <div class="mt-4 text-center">
            <button mat-stroked-button type="button" [disabled]="loading()" (click)="loadMore()">
              {{ loading() ? 'Loading…' : 'Load older entries' }}
            </button>
          </div>
        }

        <p class="mt-3 text-xs text-gray-500">
          Entries are recorded automatically and cannot be edited or deleted. They are kept for two years.
        </p>
      }
    </div>
  `,
})
export class OrganizationAuditLogComponent implements OnInit {
  readonly organizationId = input.required<string>();

  private readonly audit = inject(OrganizationAuditService);

  protected readonly areas = (Object.keys(AUDIT_ENTITY_LABELS) as AuditEntityType[]).map((key) => ({
    key,
    label: AUDIT_ENTITY_LABELS[key],
  }));

  protected readonly entries = signal<AuditLogEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasMore = signal(false);
  protected readonly error = signal('');
  protected readonly expandedId = signal<string | null>(null);

  protected readonly source = signal<AuditSource | 'all'>('all');
  protected readonly entityType = signal<AuditEntityType | 'all'>('all');
  protected readonly severity = signal<'all' | 'notice' | 'critical'>('all');
  protected readonly fromDate = signal('');
  protected readonly toDate = signal('');
  protected readonly search = signal('');

  private cursor: unknown = null;

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const level = this.severity();

    return this.entries().filter((entry) => {
      if (level === 'critical' && entry.severity !== 'critical') {
        return false;
      }

      if (level === 'notice' && entry.severity === 'info') {
        return false;
      }

      return (
        !term ||
        [entry.summary, entry.actorName ?? '', entry.actorEmail ?? '', entry.entityLabel, entry.changedFields.join(' ')]
          .some((value) => value.toLowerCase().includes(term))
      );
    });
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected async reload(): Promise<void> {
    this.cursor = null;
    this.entries.set([]);
    this.expandedId.set(null);
    await this.fetch();
  }

  protected async loadMore(): Promise<void> {
    await this.fetch();
  }

  private async fetch(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const page = await this.audit.getPage(this.organizationId(), {
        source: this.source(),
        entityType: this.entityType(),
        from: this.fromDate() ? new Date(`${this.fromDate()}T00:00:00`) : null,
        to: this.toDate() ? new Date(`${this.toDate()}T23:59:59.999`) : null,
        after: this.cursor,
      });

      this.entries.update((current) => [...current, ...page.entries]);
      this.cursor = page.cursor;
      this.hasMore.set(page.hasMore);
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

      this.error.set(
        code.includes('permission-denied')
          ? 'The audit log could not be loaded: access was refused. Deploy the Firestore rules, or ask an admin or owner.'
          : code.includes('failed-precondition')
            ? 'The audit log index is still being built. Try again in a few minutes.'
            : error instanceof Error
              ? error.message
              : 'The audit log could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected exportCsv(): void {
    const header = ['Time', 'Source', 'Who', 'Email', 'Role', 'Area', 'Action', 'Record', 'Summary', 'Changed fields', 'Severity', 'Event ID'];
    const rows = this.visible().map((entry) => [
      entry.occurredAt?.toISOString() ?? '',
      this.sourceInfo(entry.source).label,
      entry.actorName ?? '',
      entry.actorEmail ?? '',
      entry.actorRole ? this.roleLabel(entry.actorRole) : '',
      this.areaLabel(entry.entityType),
      entry.action,
      entry.entityPath,
      entry.summary,
      entry.changes.map((change) => `${change.field}: ${this.display(change.before)} -> ${this.display(change.after)}`).join(' | '),
      entry.severity,
      entry.eventId,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  protected sourceInfo(source: AuditSource) {
    return SOURCE_LABELS[source] ?? SOURCE_LABELS.system;
  }

  protected severityClass(severity: AuditSeverity): string {
    return SEVERITY_CLASSES[severity] ?? SEVERITY_CLASSES.info;
  }

  protected areaLabel(type: string): string {
    return AUDIT_ENTITY_LABELS[type as AuditEntityType] ?? type;
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
