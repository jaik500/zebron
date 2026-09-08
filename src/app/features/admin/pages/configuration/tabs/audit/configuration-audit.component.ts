import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Timestamp } from 'firebase/firestore';

import { AuditLog } from '../../../../../../core/models/audit-log.model';
import { AuditService } from '../../../../../../core/services/audit.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

@Component({
  selector: 'app-configuration-audit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">

      <!-- ======================================================
           HEADER
      ======================================================= -->

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 class="text-xl font-semibold text-[#032D42]">
            Audit Trail
          </h2>

          <p class="mt-1 text-sm text-gray-600">
            Review administrative and system activity recorded by Zebron.
          </p>
        </div>

        <button
          mat-stroked-button
          type="button"
          (click)="loadLogs()"
          [disabled]="loading()"
        >
          <mat-icon class="mr-1">
            refresh
          </mat-icon>

          {{ loading() ? 'Refreshing...' : 'Refresh' }}
        </button>

      </div>


      <!-- ======================================================
           SUMMARY
      ======================================================= -->

      <div class="grid gap-4 sm:grid-cols-3">

        <!-- Total -->

        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div class="flex items-center gap-3">

            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <mat-icon class="text-gray-600">
                history
              </mat-icon>
            </div>

            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Events
              </p>

              <p class="mt-1 text-2xl font-bold text-[#032D42]">
                {{ logs().length }}
              </p>
            </div>

          </div>

        </div>


        <!-- Successful -->

        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div class="flex items-center gap-3">

            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <mat-icon class="text-green-600">
                check_circle
              </mat-icon>
            </div>

            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                Successful
              </p>

              <p class="mt-1 text-2xl font-bold text-green-700">
                {{ successCount() }}
              </p>
            </div>

          </div>

        </div>


        <!-- Attention -->

        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div class="flex items-center gap-3">

            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <mat-icon class="text-amber-600">
                warning
              </mat-icon>
            </div>

            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                Attention
              </p>

              <p class="mt-1 text-2xl font-bold text-amber-700">
                {{ attentionCount() }}
              </p>
            </div>

          </div>

        </div>

      </div>


      <!-- ======================================================
           ERROR
      ======================================================= -->

      @if (error()) {

        <div
          class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div class="flex items-start gap-3">

            <mat-icon class="shrink-0 text-red-600">
              error
            </mat-icon>

            <div>
              <p class="font-semibold">
                Unable to load audit records
              </p>

              <p class="mt-1">
                {{ error() }}
              </p>
            </div>

          </div>
        </div>

      }


      <!-- ======================================================
           LOADING
      ======================================================= -->

      @if (loading()) {

        <div class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

          <mat-icon class="animate-spin text-gray-500">
            sync
          </mat-icon>

          <p class="mt-3 text-sm text-gray-500">
            Loading audit records...
          </p>

        </div>

      }


      <!-- ======================================================
           EMPTY
      ======================================================= -->

      @if (!loading() && !error() && logs().length === 0) {

        <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">

          <mat-icon class="text-4xl text-gray-400">
            history
          </mat-icon>

          <p class="mt-3 text-sm font-medium text-gray-700">
            No audit records found.
          </p>

          <p class="mt-1 text-xs text-gray-500">
            Administrative and system activity will appear here as it is recorded.
          </p>

        </div>

      }


      <!-- ======================================================
           AUDIT RECORDS
      ======================================================= -->

      @if (!loading() && logs().length > 0) {

        <div class="space-y-4">

          @for (log of logs(); track log.id) {

            <article
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >

              <!-- Record header -->

              <div class="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div class="flex items-center gap-3">

                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    [class]="getOutcomeIconContainerClasses(log.outcome)"
                  >
                    <mat-icon>
                      {{ getOutcomeIcon(log.outcome) }}
                    </mat-icon>
                  </div>

                  <div class="min-w-0">

                    <p class="font-semibold text-[#032D42]">
                      {{ formatAction(log.action) }}
                    </p>

                    <p class="mt-0.5 text-xs text-gray-500">
                      {{ log.entityType }}
                      @if (log.entityId) {
                        <span>
                          · {{ log.entityId }}
                        </span>
                      }
                    </p>

                  </div>

                </div>


                <!-- Result -->

                <span
                  class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
                  [class]="getOutcomeClasses(log.outcome)"
                >
                  {{ log.outcome | titlecase }}
                </span>

              </div>


              <!-- Record details -->

              <div class="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">

                <!-- USER -->

                <div>

                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    User
                  </p>

                  <p class="mt-1 text-sm font-semibold text-[#032D42]">
                    {{ log.actorName || 'Unknown user' }}
                  </p>

                  @if (log.actorEmail) {

                    <p class="mt-0.5 break-all text-xs text-gray-500">
                      {{ log.actorEmail }}
                    </p>

                  }

                  @if (log.actorId) {

                    <p class="mt-1 break-all text-[11px] text-gray-400">
                      ID: {{ log.actorId }}
                    </p>

                  }

                </div>


                <!-- ACTION -->

                <div>

                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </p>

                  <p class="mt-1 text-sm text-gray-700">
                    {{ formatAction(log.action) }}
                  </p>

                </div>


                <!-- DATE & TIME -->

                <div>

                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Date & Time
                  </p>

                  <p class="mt-1 text-sm font-semibold text-[#032D42]">
                    {{ formatDateTime(log.createdAt) }}
                  </p>

                </div>


                <!-- SOURCE -->

                <div>

                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Source
                  </p>

                  <p class="mt-1 text-sm text-gray-700">
                    {{ log.source | titlecase }}
                  </p>

                  <p class="mt-0.5 text-xs text-gray-500">
                    {{ log.actorType | titlecase }}
                  </p>

                </div>

              </div>


              <!-- Reason -->

              @if (log.reason) {

                <div class="border-t border-gray-100 px-5 py-4">

                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Reason
                  </p>

                  <p class="mt-1 text-sm text-gray-700">
                    {{ log.reason }}
                  </p>

                </div>

              }


              <!-- Metadata -->

              @if (hasMetadata(log)) {

                <details class="border-t border-gray-100">

                  <summary class="cursor-pointer px-5 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    View metadata
                  </summary>

                  <pre class="overflow-x-auto bg-gray-50 px-5 py-4 text-xs text-gray-600">{{ formatMetadata(log.metadata) }}</pre>

                </details>

              }

            </article>

          }

        </div>

      }

    </section>
  `,
})
export class ConfigurationAuditComponent implements OnInit {

  private readonly auditService = inject(AuditService);
  private readonly logger = inject(LoggerService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly successCount = signal(0);
  protected readonly attentionCount = signal(0);


  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    this.loadLogs();
  }


  // ============================================================
  // LOAD
  // ============================================================

  protected async loadLogs(): Promise<void> {

    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {

      const records =
        await this.auditService.getRecentLogs(100);

      this.logs.set(records);

      this.successCount.set(
        records.filter(
          (record) => record.outcome === 'success',
        ).length,
      );

      this.attentionCount.set(
        records.filter(
          (record) =>
            record.outcome !== 'success',
        ).length,
      );

    } catch (error) {

      this.logger.error(
        'ConfigurationAuditComponent',
        'Failed to load audit records.',
        error,
      );

      this.error.set(
        this.getErrorMessage(error),
      );

    } finally {

      this.loading.set(false);

    }

  }


  // ============================================================
  // FORMATTING
  // ============================================================

  protected formatDateTime(
    timestamp: Timestamp | null | undefined,
  ): string {

    if (!timestamp) {
      return 'Pending';
    }

    return timestamp.toDate().toLocaleString(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'medium',
      },
    );

  }


  protected formatAction(action: string): string {

    if (!action) {
      return 'Unknown action';
    }

    return action
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      );

  }


  protected hasMetadata(
    log: AuditLog,
  ): boolean {

    return !!log.metadata &&
      Object.keys(log.metadata).length > 0;

  }


  protected formatMetadata(
    metadata: Record<string, unknown> | undefined,
  ): string {

    if (!metadata) {
      return '';
    }

    try {

      return JSON.stringify(
        metadata,
        null,
        2,
      );

    } catch {

      return '[Unable to display metadata]';

    }

  }


  // ============================================================
  // OUTCOME DISPLAY
  // ============================================================

  protected getOutcomeIcon(
    outcome: AuditLog['outcome'],
  ): string {

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


  protected getOutcomeClasses(
    outcome: AuditLog['outcome'],
  ): string {

    switch (outcome) {

      case 'success':
        return 'bg-green-100 text-green-700';

      case 'failure':
        return 'bg-red-100 text-red-700';

      case 'denied':
        return 'bg-orange-100 text-orange-700';

      case 'cancelled':
        return 'bg-gray-100 text-gray-700';

      default:
        return 'bg-gray-100 text-gray-700';

    }

  }


  protected getOutcomeIconContainerClasses(
    outcome: AuditLog['outcome'],
  ): string {

    switch (outcome) {

      case 'success':
        return 'bg-green-100 text-green-600';

      case 'failure':
        return 'bg-red-100 text-red-600';

      case 'denied':
        return 'bg-orange-100 text-orange-600';

      case 'cancelled':
        return 'bg-gray-100 text-gray-600';

      default:
        return 'bg-gray-100 text-gray-600';

    }

  }


  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private getErrorMessage(
    error: unknown,
  ): string {

    if (error instanceof Error) {
      return error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {

      const message =
        (error as { message?: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

    }

    return 'An unexpected error occurred while loading the audit trail.';

  }

}