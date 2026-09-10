import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MaintenanceService } from '../../../../../../core/services/maintenance.service';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../../../core/services/confirmation.service';

@Component({
  selector: 'app-configuration-maintenance',
  standalone: true,

  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <section class="space-y-4">
      <!-- =====================================================
           HEADER
           ===================================================== -->

      <div>
        <h2
          class="
            text-xl
            font-semibold
            text-[#032D42]
          "
        >
          Maintenance
        </h2>

        <p
          class="
            mt-1
            text-sm
            text-gray-500
          "
        >
          Control system-wide maintenance mode and maintenance messaging.
        </p>
      </div>

      <!-- SUMMARY -->

     <div
  class="grid grid-cols-3 gap-2
         sm:grid-cols-3
         lg:grid-cols-8
         text-center"
>
  <!-- RESEND EMAIL -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://resend.com/emails"
        target="_blank"
        class="text-sm"
      >
        Resend
      </a>
    </mat-card-content>
  </mat-card>

  <!-- CLOUDFLARE -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://dash.cloudflare.com/login"
        target="_blank"
        class="text-sm"
      >
        Cloudflare
      </a>
    </mat-card-content>
  </mat-card>

  <!-- FIREBASE -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://console.firebase.google.com/project/zebron-2b49f/firestore/databases"
        target="_blank"
        class="text-sm"
      >
        Firebase
      </a>
    </mat-card-content>
  </mat-card>

  <!-- STRIPE -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://dashboard.stripe.com/acct_1U9QlQIpzrAXcYjT/test/dashboard"
        target="_blank"
        class="text-sm"
      >
        Stripe
      </a>
    </mat-card-content>
  </mat-card>

  <!-- GOOGLE CONSOLE -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:zebron.org&utm_source=wnc_756200&utm_medium=gamma&utm_campaign=wnc_756200&utm_content=msg_843500&hl=en-GB#deeplink=pagesimpressions"
        target="_blank"
        class="text-sm"
      >
        Google Console
      </a>
    </mat-card-content>
  </mat-card>

  <!-- GOOGLE SEARCH -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://www.google.com/"
        target="_blank"
        class="text-sm"
      >
        Google Search
      </a>
    </mat-card-content>
  </mat-card>

  <!-- PLACEHOLDER -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://www.google.com/"
        target="_blank"
        class="text-sm"
      >
        Placeholder
      </a>
    </mat-card-content>
  </mat-card>

  <!-- PLACEHOLDER -->

  <mat-card appearance="outlined" class="!rounded-xl">
    <mat-card-content class="!p-2">
      <a
        href="https://www.google.com/"
        target="_blank"
        class="text-sm"
      >
        Placeholder
      </a>
    </mat-card-content>
  </mat-card>
</div>

      <!-- =====================================================
           STATUS
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
              [class.bg-red-100]="maintenanceService.enabled()"
              [class.text-red-700]="maintenanceService.enabled()"
              [class.bg-green-100]="!maintenanceService.enabled()"
              [class.text-green-700]="!maintenanceService.enabled()"
            >
              <mat-icon>
                {{ maintenanceService.enabled() ? 'build' : 'check_circle' }}
              </mat-icon>
            </div>

            <div class="min-w-0 flex-1">
              <p
                class="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-gray-500
                "
              >
                System Status
              </p>

              <h3
                class="
                  mt-0.5
                  text-lg
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ maintenanceService.statusLabel() }}
              </h3>

              <p
                class="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                @if (maintenanceService.enabled()) {
                  Maintenance mode is currently active.
                } @else {
                  Zebron is currently operating normally.
                }
              </p>
            </div>

            <span
              class="
                shrink-0
                rounded-full
                px-3
                py-1
                text-xs
                font-semibold
              "
              [class.bg-red-100]="maintenanceService.enabled()"
              [class.text-red-700]="maintenanceService.enabled()"
              [class.bg-green-100]="!maintenanceService.enabled()"
              [class.text-green-700]="!maintenanceService.enabled()"
            >
              {{ maintenanceService.enabled() ? 'ACTIVE' : 'OPERATIONAL' }}
            </span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- =====================================================
           MAINTENANCE CONFIGURATION
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >
        <mat-card-header class="!px-5 !py-4">
          <div
            mat-card-avatar
            class="
              !flex
              !h-10
              !w-10
              !items-center
              !justify-center
              !rounded-lg
              !bg-[#032D42]/10
              !text-[#032D42]
            "
          >
            <mat-icon> construction </mat-icon>
          </div>

          <mat-card-title
            class="
              !text-base
              !font-semibold
              !text-[#032D42]
            "
          >
            Maintenance Configuration
          </mat-card-title>

          <mat-card-subtitle class="!mt-0.5 !text-xs">
            Configure the message displayed during maintenance.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content
          class="
            !border-t
            !px-5
            !py-5
          "
        >
          <mat-form-field appearance="outline" class="w-full">
            <mat-label> Maintenance Message </mat-label>

            <textarea
              matInput
              rows="4"
              maxlength="500"
              [(ngModel)]="message"
              [disabled]="maintenanceService.saving()"
            ></textarea>

            <mat-hint align="end"> {{ message().length }}/500 </mat-hint>
          </mat-form-field>

          <div
            class="
              mt-4
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
            @if (maintenanceService.enabled()) {
              <button
                mat-stroked-button
                type="button"
                [disabled]="maintenanceService.saving()"
                (click)="disableMaintenance()"
              >
                @if (maintenanceService.saving()) {
                  <mat-spinner diameter="18" class="mr-2" />

                  Updating...
                } @else {
                  <ng-container>
                    <mat-icon> check_circle </mat-icon>
                  </ng-container>
                  Disable Maintenance
                }
              </button>
            } @else {
              <button
                mat-flat-button
                type="button"
                class="
                  !bg-[#032D42]
                  !text-white
                "
                [disabled]="maintenanceService.saving()"
                (click)="enableMaintenance()"
              >
                @if (maintenanceService.saving()) {
                  <mat-spinner diameter="18" class="mr-2" />

                  Activating...
                } @else {
                  <ng-container>
                    <mat-icon> build </mat-icon>
                  </ng-container>
                  Enable Maintenance
                }
              </button>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- =====================================================
           SAFETY NOTICE
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !border-amber-200
          !bg-amber-50
          !shadow-none
        "
      >
        <mat-card-content class="!p-5">
          <div
            class="
              flex
              items-start
              gap-3
            "
          >
            <mat-icon class="!shrink-0 !text-amber-700"> warning </mat-icon>

            <div>
              <h3
                class="
                  text-sm
                  font-semibold
                  text-amber-900
                "
              >
                Maintenance mode affects the entire platform
              </h3>

              <p
                class="
                  mt-1
                  text-sm
                  leading-5
                  text-amber-800
                "
              >
                Only enable maintenance mode when planned operational work requires it.
                Administrative access should remain available for recovery and operational
                management.
              </p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  `,
})
export class ConfigurationMaintenanceComponent {
  // =========================================================
  // SERVICES
  // =========================================================

  protected readonly maintenanceService = inject(MaintenanceService);

  private readonly notificationService = inject(NotificationService);

  private readonly confirmationService = inject(ConfirmationService);

  // =========================================================
  // FORM
  // =========================================================

  protected readonly message = signal(
    'Zebron is temporarily unavailable while scheduled maintenance is being performed.',
  );

  constructor() {
    this.message.set(this.maintenanceService.getMessage());
  }

  // =========================================================
  // ENABLE
  // =========================================================

  protected async enableMaintenance(): Promise<void> {
    const normalizedMessage = this.message().trim();

    if (!normalizedMessage) {
      this.notificationService.error('A maintenance message is required.');

      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Enable Maintenance Mode',

      message: 'This will place the Zebron platform into maintenance mode. Continue?',

      confirmText: 'Enable Maintenance',

      cancelText: 'Cancel',

      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await this.maintenanceService.enable(normalizedMessage);

      this.notificationService.success('Maintenance mode enabled.');
    } catch (error) {
      this.notificationService.error(this.getErrorMessage(error));
    }
  }

  // =========================================================
  // DISABLE
  // =========================================================

  protected async disableMaintenance(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Disable Maintenance Mode',

      message: 'Zebron will return to normal operating mode. Continue?',

      confirmText: 'Disable Maintenance',

      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      await this.maintenanceService.disable();

      this.notificationService.success('Maintenance mode disabled.');
    } catch (error) {
      this.notificationService.error(this.getErrorMessage(error));
    }
  }

  // =========================================================
  // ERROR
  // =========================================================

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
