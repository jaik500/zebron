import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  AuditLog,
  AuditOutcome,
} from '../../../../../../core/models/audit-log.model';

import {
  AuditService,
} from '../../../../../../core/services/audit.service';

import {
  LoggerService,
} from '../../../../../../core/services/logger.service';

@Component({
  selector: 'app-configuration-audit',
  standalone: true,

  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <section class="space-y-4">

      <!-- =====================================================
           HEADER
           ===================================================== -->

      <div
        class="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h2
            class="
              text-xl
              font-semibold
              text-[#032D42]
            "
          >
            Audit Trail
          </h2>

          <p
            class="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Review administrative and system activity.
          </p>

        </div>

        <button
          mat-stroked-button
          type="button"
          [disabled]="loading()"
          (click)="loadAuditLogs()"
        >

          @if (loading()) {

            <mat-spinner
              diameter="18"
              class="mr-2"
            />

            Loading...

          } @else {
<ng-container>
            <mat-icon>
              refresh
            </mat-icon>
          </ng-container>
            Refresh

          }

        </button>

      </div>


      <!-- =====================================================
           SUMMARY
           ===================================================== -->

      <div
        class="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-3
        "
      >

        <mat-card
          class="
            !rounded-2xl
            !border
            !shadow-none
          "
        >

          <mat-card-content class="!p-4">

            <div
              class="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  class="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Total Events
                </p>

                <p
                  class="
                    mt-1
                    text-2xl
                    font-bold
                    text-[#032D42]
                  "
                >
                  {{ logs().length }}
                </p>

              </div>

              <mat-icon
                class="!text-[#032D42]"
              >
                history
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>


        <mat-card
          class="
            !rounded-2xl
            !border
            !shadow-none
          "
        >

          <mat-card-content class="!p-4">

            <div
              class="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  class="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Successful
                </p>

                <p
                  class="
                    mt-1
                    text-2xl
                    font-bold
                    text-green-700
                  "
                >
                  {{ successCount() }}
                </p>

              </div>

              <mat-icon
                class="!text-green-600"
              >
                check_circle
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>


        <mat-card
          class="
            !rounded-2xl
            !border
            !shadow-none
          "
        >

          <mat-card-content class="!p-4">

            <div
              class="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  class="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Attention
                </p>

                <p
                  class="
                    mt-1
                    text-2xl
                    font-bold
                    text-red-600
                  "
                >
                  {{ attentionCount() }}
                </p>

              </div>

              <mat-icon
                class="!text-red-600"
              >
                warning
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>

      </div>


      <!-- =====================================================
           AUDIT EVENTS
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >

        <mat-card-content class="!p-0">

          @if (loading()) {

            <div
              class="
                flex
                min-h-48
                items-center
                justify-center
              "
            >

              <mat-spinner diameter="36" />

            </div>

          } @else if (logs().length === 0) {

            <div
              class="
                flex
                min-h-56
                flex-col
                items-center
                justify-center
                px-6
                text-center
              "
            >

              <mat-icon
                class="
                  !h-12
                  !w-12
                  !text-5xl
                  !text-gray-300
                "
              >
                history
              </mat-icon>

              <h3
                class="
                  mt-3
                  text-base
                  font-semibold
                  text-[#032D42]
                "
              >
                No audit events found
              </h3>

              <p
                class="
                  mt-1
                  max-w-md
                  text-sm
                  text-gray-500
                "
              >
                Administrative actions will appear here
                as they occur.
              </p>

            </div>

          } @else {

            <div
              class="
                divide-y
                divide-gray-100
              "
            >

              @for (
                log of logs();
                track log.id
              ) {

                <div
                  class="
                    px-4
                    py-4
                    transition
                    hover:bg-gray-50
                    sm:px-5
                  "
                >

                  <div
                    class="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <!-- Event icon -->

                    <div
                      class="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                      "
                      [class.bg-green-100]="
                        log.outcome === 'success'
                      "
                      [class.text-green-700]="
                        log.outcome === 'success'
                      "
                      [class.bg-red-100]="
                        log.outcome === 'failure' ||
                        log.outcome === 'denied'
                      "
                      [class.text-red-700]="
                        log.outcome === 'failure' ||
                        log.outcome === 'denied'
                      "
                      [class.bg-gray-100]="
                        log.outcome === 'cancelled'
                      "
                      [class.text-gray-600]="
                        log.outcome === 'cancelled'
                      "
                    >

                      <mat-icon>
                        {{ outcomeIcon(log.outcome) }}
                      </mat-icon>

                    </div>


                    <!-- Event -->

                    <div class="min-w-0 flex-1">

                      <div
                        class="
                          flex
                          flex-col
                          gap-1
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                        "
                      >

                        <div
                          class="
                            truncate
                            text-sm
                            font-semibold
                            text-[#032D42]
                          "
                        >
                          {{ log.action }}
                        </div>

                        <span
                          class="
                            shrink-0
                            self-start
                            rounded-full
                            px-2
                            py-1
                            text-[10px]
                            font-semibold
                            uppercase
                          "
                          [class.bg-green-100]="
                            log.outcome === 'success'
                          "
                          [class.text-green-700]="
                            log.outcome === 'success'
                          "
                          [class.bg-red-100]="
                            log.outcome === 'failure' ||
                            log.outcome === 'denied'
                          "
                          [class.text-red-700]="
                            log.outcome === 'failure' ||
                            log.outcome === 'denied'
                          "
                          [class.bg-gray-100]="
                            log.outcome === 'cancelled'
                          "
                          [class.text-gray-600]="
                            log.outcome === 'cancelled'
                          "
                        >
                          {{ log.outcome }}
                        </span>

                      </div>


                      <div
                        class="
                          mt-1
                          flex
                          flex-wrap
                          gap-x-3
                          gap-y-1
                          text-xs
                          text-gray-500
                        "
                      >

                        <span>
                          {{ log.entityType }}
                        </span>

                        @if (log.entityId) {

                          <span>
                            ID: {{ log.entityId }}
                          </span>

                        }

                        <span>
                          {{ log.actorType }}
                        </span>

                        @if (log.actorId) {

                          <span>
                            Actor: {{ log.actorId }}
                          </span>

                        }

                      </div>


                      @if (log.reason) {

                        <p
                          class="
                            mt-2
                            text-sm
                            text-gray-600
                          "
                        >
                          {{ log.reason }}
                        </p>

                      }


                      @if (log.createdAt) {

                        <p
                          class="
                            mt-2
                            text-[11px]
                            text-gray-400
                          "
                        >
                          {{ formatDate(log.createdAt.toDate()) }}
                        </p>

                      }

                    </div>

                  </div>

                </div>

              }

            </div>

          }

        </mat-card-content>

      </mat-card>

    </section>
  `,
})
export class ConfigurationAuditComponent {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly auditService =
    inject(AuditService);

  private readonly logger =
    inject(LoggerService);


  // =========================================================
  // STATE
  // =========================================================

  protected readonly logs =
    signal<AuditLog[]>([]);

  protected readonly loading =
    signal(false);


  // =========================================================
  // SUMMARY
  // =========================================================

  protected readonly successCount =
    computed(() =>
      this.logs()
        .filter(
          log =>
            log.outcome === 'success',
        )
        .length,
    );


  protected readonly attentionCount =
    computed(() =>
      this.logs()
        .filter(
          log =>
            log.outcome === 'failure' ||
            log.outcome === 'denied',
        )
        .length,
    );


  // =========================================================
  // LOAD
  // =========================================================

  async loadAuditLogs(): Promise<void> {

    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    const operationId =
      this.logger.createOperationId();

    this.logger.info(
      'ConfigurationAuditComponent',
      'Loading audit events.',
      {
        operationId,
      },
    );

    try {

      /*
       * IMPORTANT:
       *
       * Use the existing AuditService read method here.
       *
       * The current Control Center architecture already
       * centralizes audit creation in AuditService. The exact
       * read method should remain owned by that service as well.
       */
      const result =
        await this.auditService.getRecentLogs(100);

      this.logs.set(result);

    } catch (error) {

      this.logger.error(
        'ConfigurationAuditComponent',
        'Unable to load audit events.',
        {
          operationId,
          error:
            this.getErrorMessage(error),
        },
      );

    } finally {

      this.loading.set(false);
    }
  }


  // =========================================================
  // ICON
  // =========================================================

  protected outcomeIcon(
    outcome: AuditOutcome,
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
        return 'history';
    }
  }


  // =========================================================
  // DATE
  // =========================================================

  protected formatDate(
    date: Date,
  ): string {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(date);
  }


  // =========================================================
  // ERROR
  // =========================================================

  private getErrorMessage(
    error: unknown,
  ): string {

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}