import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SystemHealthService } from '../../../../../../core/services/system-health.service';

@Component({
  selector: 'app-configuration-system-health',
  standalone: true,

  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],

  changeDetection: ChangeDetectionStrategy.OnPush,

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
            System Health
          </h2>

          <p
            class="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Monitor the operational status of core Zebron services.
          </p>
        </div>

        <button
          mat-flat-button
          type="button"
          class="
            !bg-[#032D42]
            !text-white
          "
          [disabled]="healthService.checking()"
          (click)="runHealthCheck()"
        >
          @if (healthService.checking()) {
            <mat-spinner diameter="18" class="mr-2" />

            Checking...
          } @else {
            <ng-container>
              <mat-icon> refresh </mat-icon>
            </ng-container>
            Run Health Check
          }
        </button>
      </div>

      <!-- =====================================================
           OVERALL STATUS
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >
        <mat-card-content class="!p-5">
          <div
            class="
              flex
              items-center
              gap-4
            "
          >
            <!-- Status icon -->

            <div
              class="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-full
              "
              [class.bg-green-100]="healthService.overallStatus() === 'healthy'"
              [class.text-green-700]="healthService.overallStatus() === 'healthy'"
              [class.bg-amber-100]="healthService.overallStatus() === 'degraded'"
              [class.text-amber-700]="healthService.overallStatus() === 'degraded'"
              [class.bg-red-100]="healthService.overallStatus() === 'unhealthy'"
              [class.text-red-700]="healthService.overallStatus() === 'unhealthy'"
              [class.bg-gray-100]="healthService.overallStatus() === 'unknown'"
              [class.text-gray-600]="healthService.overallStatus() === 'unknown'"
            >
              <mat-icon>
                {{
                  healthService.overallStatus() === 'healthy'
                    ? 'check_circle'
                    : healthService.overallStatus() === 'degraded'
                      ? 'warning'
                      : healthService.overallStatus() === 'unhealthy'
                        ? 'error'
                        : 'help'
                }}
              </mat-icon>
            </div>

            <!-- Status text -->

            <div class="min-w-0">
              <div
                class="
                  text-sm
                  font-medium
                  text-gray-500
                "
              >
                Overall Status
              </div>

              <div
                class="
                  mt-0.5
                  text-lg
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ statusLabel() }}
              </div>

              <p
                class="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                {{ healthService.overallMessage() }}
              </p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- =====================================================
           HEALTH CHECKS
           ===================================================== -->

      <div
        class="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
        "
      >
        @for (check of healthService.checks(); track check.key) {
          <mat-card
            class="
              !rounded-2xl
              !border
              !shadow-none
            "
          >
            <mat-card-content class="!p-5">
              <div
                class="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div
                  class="
                    flex
                    min-w-0
                    items-start
                    gap-3
                  "
                >
                  <div
                    class="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#032D42]/10
                      text-[#032D42]
                    "
                  >
                    <mat-icon>
                      {{ iconFor(check.key) }}
                    </mat-icon>
                  </div>

                  <div class="min-w-0">
                    <h3
                      class="
                        truncate
                        text-sm
                        font-semibold
                        text-[#032D42]
                      "
                    >
                      {{ check.name }}
                    </h3>

                    <p
                      class="
                        mt-0.5
                        text-xs
                        text-gray-500
                      "
                    >
                      {{ check.description }}
                    </p>
                  </div>
                </div>

                <!-- Status -->

                <span
                  class="
                    shrink-0
                    rounded-full
                    px-2.5
                    py-1
                    text-[11px]
                    font-semibold
                  "
                  [class.bg-green-100]="check.status === 'healthy'"
                  [class.text-green-700]="check.status === 'healthy'"
                  [class.bg-amber-100]="check.status === 'degraded'"
                  [class.text-amber-700]="check.status === 'degraded'"
                  [class.bg-red-100]="check.status === 'unhealthy'"
                  [class.text-red-700]="check.status === 'unhealthy'"
                  [class.bg-gray-100]="check.status === 'unknown'"
                  [class.text-gray-600]="check.status === 'unknown'"
                >
                  {{ check.status }}
                </span>
              </div>

              <p
                class="
                  mt-4
                  text-sm
                  leading-5
                  text-gray-600
                "
              >
                {{ check.message }}
              </p>

              @if (check.responseTimeMs !== undefined) {
                <div
                  class="
                    mt-3
                    text-[11px]
                    text-gray-400
                  "
                >
                  Response time:
                  {{ check.responseTimeMs }} ms
                </div>
              }
            </mat-card-content>
          </mat-card>
        } @empty {
          <mat-card
            class="
              md:col-span-2
              !rounded-2xl
              !border
              !shadow-none
            "
          >
            <mat-card-content
              class="
                !p-8
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
                monitor_heart
              </mat-icon>

              <h3
                class="
                  mt-3
                  text-base
                  font-semibold
                  text-[#032D42]
                "
              >
                No health checks have been run
              </h3>

              <p
                class="
                  mx-auto
                  mt-1
                  max-w-md
                  text-sm
                  text-gray-500
                "
              >
                Run a health check to evaluate the current status of Zebron's core services.
              </p>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- =====================================================
           LAST CHECKED
           ===================================================== -->

      @if (healthService.lastChecked(); as checkedAt) {
        <p
          class="
            text-right
            text-xs
            text-gray-400
          "
        >
          Last checked:
          {{ formatDate(checkedAt.toDate()) }}
        </p>
      }
    </section>
  `,
})
export class ConfigurationSystemHealthComponent {
  protected readonly healthService = inject(SystemHealthService);

  // =========================================================
  // HEALTH CHECK
  // =========================================================

  protected async runHealthCheck(): Promise<void> {
    await this.healthService.runHealthCheck();
  }

  // =========================================================
  // STATUS LABEL
  // =========================================================

  protected statusLabel(): string {
    switch (this.healthService.overallStatus()) {
      case 'healthy':
        return 'Operational';

      case 'degraded':
        return 'Degraded';

      case 'unhealthy':
        return 'Unavailable';

      default:
        return 'Not Checked';
    }
  }

  // =========================================================
  // ICON
  // =========================================================

  protected iconFor(key: string): string {
    switch (key) {
      case 'firestore':
        return 'database';

      case 'feature-configurations':
        return 'apps';

      case 'system-settings':
        return 'tune';

      case 'audit-logging':
        return 'history';

      default:
        return 'monitor_heart';
    }
  }

  // =========================================================
  // DATE
  // =========================================================

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
