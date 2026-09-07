import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatTabsModule,
} from '@angular/material/tabs';

import {
  LoggerService,
} from '../../../../core/services/logger.service';

import {
  ConfigurationOverviewComponent,
} from './tabs/overview/configuration-overview.component';

import {
  ConfigurationApplicationsComponent,
} from './tabs/applications/configuration-applications.component';

import {
  ConfigurationSettingsComponent,
} from './tabs/settings/configuration-settings.component';


@Component({
  selector:
    'app-configuration',

  standalone: true,

  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,

    ConfigurationOverviewComponent,
    ConfigurationApplicationsComponent,
    ConfigurationSettingsComponent,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="min-h-screen bg-slate-50"
    >

      <!-- =====================================================
           CONTROL CENTER HEADER
           ===================================================== -->

      <header
        class="border-b bg-white"
      >

        <div
          class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >

          <div
            class="flex flex-col gap-4
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >

            <div>

              <div
                class="flex items-center gap-3"
              >

                <div
                  class="flex h-11 w-11
                         items-center justify-center
                         rounded-xl
                         bg-slate-900"
                >

                  <mat-icon
                    class="!text-white"
                  >
                    settings
                  </mat-icon>

                </div>

                <div>

                  <h1
                    class="text-2xl font-bold
                           tracking-tight
                           text-slate-900"
                  >
                    Control Center
                  </h1>

                  <p
                    class="mt-1 text-sm
                           text-slate-500"
                  >
                    Configure, monitor, and manage
                    the Zebron platform.
                  </p>

                </div>

              </div>

            </div>


            <!-- SYSTEM STATUS -->

            <div
              class="flex items-center gap-2
                     rounded-full
                     border
                     border-emerald-200
                     bg-emerald-50
                     px-4 py-2"
            >

              <span
                class="h-2.5 w-2.5
                       rounded-full
                       bg-emerald-500"
              ></span>

              <span
                class="text-sm
                       font-medium
                       text-emerald-700"
              >
                System Operational
              </span>

            </div>

          </div>

        </div>

      </header>


      <!-- =====================================================
           CONTROL CENTER NAVIGATION
           ===================================================== -->

      <main
        class="mx-auto max-w-7xl
               px-4 py-6
               sm:px-6
               lg:px-8"
      >

        <mat-tab-group
          animationDuration="0ms"
          class="configuration-tabs"
        >

          <!-- =================================================
               OVERVIEW
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                dashboard
              </mat-icon>

              <span class="ml-2">
                Overview
              </span>

            </ng-template>

            <div class="pt-6">

              <app-configuration-overview />

            </div>

          </mat-tab>


          <!-- =================================================
               APPLICATIONS
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                apps
              </mat-icon>

              <span class="ml-2">
                Applications
              </span>

            </ng-template>

            <div class="pt-6">

              <app-configuration-applications />

            </div>

          </mat-tab>


          <!-- =================================================
               SETTINGS
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                tune
              </mat-icon>

              <span class="ml-2">
                Settings
              </span>

            </ng-template>

            <div class="pt-6">

              <app-configuration-settings />

            </div>

          </mat-tab>


          <!-- =================================================
               LOGGING & DIAGNOSTICS
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                terminal
              </mat-icon>

              <span class="ml-2">
                Diagnostics
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  terminal
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  Logging & Diagnostics
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Centralized application logging,
                  diagnostics, operation tracking,
                  and troubleshooting tools will
                  be available here.
                </p>

              </section>

            </div>

          </mat-tab>


          <!-- =================================================
               AUDIT
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                history
              </mat-icon>

              <span class="ml-2">
                Audit
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  history
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  Audit Trail
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Configuration changes,
                  administrative actions,
                  system operations, and
                  accountability records will
                  appear here.
                </p>

              </section>

            </div>

          </mat-tab>


          <!-- =================================================
               SECURITY
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                security
              </mat-icon>

              <span class="ml-2">
                Security
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  security
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  Security Controls
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Security configuration,
                  access controls, policy
                  validation, and security
                  diagnostics will be managed here.
                </p>

              </section>

            </div>

          </mat-tab>


          <!-- =================================================
               MAINTENANCE
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                build
              </mat-icon>

              <span class="ml-2">
                Maintenance
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  build
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  Maintenance
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Scheduled maintenance,
                  application maintenance mode,
                  cache operations, and other
                  platform maintenance tools will
                  be managed here.
                </p>

              </section>

            </div>

          </mat-tab>


          <!-- =================================================
               RECOVERY
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                restore
              </mat-icon>

              <span class="ml-2">
                Recovery
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  restore
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  Recovery
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Scoped recovery operations,
                  configuration restoration,
                  rollback tools, and operational
                  recovery workflows will be managed
                  here.
                </p>

              </section>

            </div>

          </mat-tab>


          <!-- =================================================
               SYSTEM HEALTH
               ================================================= -->

          <mat-tab>

            <ng-template mat-tab-label>

              <mat-icon>
                monitor_heart
              </mat-icon>

              <span class="ml-2">
                System Health
              </span>

            </ng-template>

            <div
              class="pt-6"
            >

              <section
                class="rounded-2xl
                       border
                       bg-white
                       p-8
                       text-center"
              >

                <mat-icon
                  class="!h-12 !w-12
                         !text-5xl
                         !text-slate-400"
                >
                  monitor_heart
                </mat-icon>

                <h2
                  class="mt-4
                         text-xl
                         font-semibold
                         text-slate-900"
                >
                  System Health
                </h2>

                <p
                  class="mx-auto mt-2
                         max-w-xl
                         text-sm
                         leading-6
                         text-slate-500"
                >
                  Application availability,
                  Firebase connectivity,
                  configuration status,
                  service health, and platform
                  diagnostics will be displayed here.
                </p>

              </section>

            </div>

          </mat-tab>

        </mat-tab-group>

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
      'Control Center initialized.',
    );

  }
}