import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { ConfigurationOverviewComponent } from './tabs/overview/configuration-overview.component';
import { ConfigurationApplicationsComponent } from './tabs/applications/configuration-applications.component';
import { ConfigurationSettingsComponent } from './tabs/settings/configuration-settings.component';

import { LoggerService } from '../../../../core//services/logger.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    MatIconModule,
    MatTabsModule,
    ConfigurationOverviewComponent,
    ConfigurationApplicationsComponent,
    ConfigurationSettingsComponent,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- ======================================================
           HEADER
      ======================================================= -->

      <div class="border-b bg-white">

        <div
          class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >

          <div
            class="flex flex-col gap-4
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >

            <div>

              <div
                class="mb-2 flex items-center gap-2
                       text-sm font-medium text-slate-500"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px]"
                >
                  admin_panel_settings
                </mat-icon>

                <span>
                  Admin Center
                </span>

                <span>
                  /
                </span>

                <span>
                  Configuration
                </span>
              </div>

              <h1
                class="text-2xl font-bold tracking-tight
                       text-slate-900 sm:text-3xl"
              >
                Configuration &amp; Control Center
              </h1>

              <p
                class="mt-2 max-w-3xl text-sm
                       leading-6 text-slate-600"
              >
                Configure, monitor, troubleshoot, and
                manage Zebron platform functionality
                from one centralized control surface.
              </p>

            </div>

          </div>

        </div>

      </div>


      <!-- ======================================================
           CONTENT
      ======================================================= -->

      <main
        class="mx-auto max-w-7xl px-4 py-6
               sm:px-6 lg:px-8"
      >

        <div
          class="overflow-hidden rounded-2xl
                 border border-slate-200
                 bg-white shadow-sm"
        >

          <mat-tab-group
            animationDuration="150ms"
            dynamicHeight
          >

            <!-- OVERVIEW -->

            <mat-tab>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  dashboard
                </mat-icon>

                Overview

              </ng-template>

              <div class="p-5 sm:p-6">

                <app-configuration-overview />

              </div>

            </mat-tab>


            <!-- APPLICATIONS -->

            <mat-tab>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  apps
                </mat-icon>

                Applications

              </ng-template>

              <div class="p-5 sm:p-6">

                <app-configuration-applications />

              </div>

            </mat-tab>


            <!-- SETTINGS -->

            <mat-tab>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  tune
                </mat-icon>

                Settings

              </ng-template>

              <div class="p-5 sm:p-6">

                <app-configuration-settings />

              </div>

            </mat-tab>


            <!-- FUTURE TABS -->

            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  bug_report
                </mat-icon>

                Diagnostics

              </ng-template>

            </mat-tab>


            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  history
                </mat-icon>

                Audit

              </ng-template>

            </mat-tab>


            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  security
                </mat-icon>

                Security

              </ng-template>

            </mat-tab>


            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  build
                </mat-icon>

                Maintenance

              </ng-template>

            </mat-tab>


            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  settings_backup_restore
                </mat-icon>

                Recovery

              </ng-template>

            </mat-tab>


            <mat-tab disabled>

              <ng-template mat-tab-label>

                <mat-icon
                  class="mr-2 !h-5 !w-5 !text-[20px]"
                >
                  monitor_heart
                </mat-icon>

                System Health

              </ng-template>

            </mat-tab>

          </mat-tab-group>

        </div>

      </main>

    </div>
  `,
})
export class ConfigurationComponent {

  private readonly logger =
    inject(LoggerService);

  constructor() {
    this.logger.info(
      'ConfigurationComponent',
      'Configuration Control Center initialized.',
    );
  }
}