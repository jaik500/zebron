import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatTabsModule } from '@angular/material/tabs';

import { LoggerService } from '../../../../core/services/logger.service';

import { ConfigurationOverviewComponent } from './tabs/overview/configuration-overview.component';

import { ConfigurationApplicationsComponent } from './tabs/applications/configuration-applications.component';

import { ConfigurationSettingsComponent } from './tabs/settings/configuration-settings.component';

import { Router } from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';

import { MatDividerModule } from '@angular/material/divider';

import { NavigationService } from '../../../../core/services/navigation.service';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { ConfigurationSystemHealthComponent } from './tabs/system-health/configuration-system-health.component';

@Component({
  selector: 'app-configuration',

  standalone: true,

  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,

    ConfigurationOverviewComponent,
    ConfigurationApplicationsComponent,
    ConfigurationSettingsComponent,
    ConfigurationSystemHealthComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="min-h-screen bg-gray-50 mt-16 ">
        
         <header class=" bg-[#2a835f] shadow-sm">
         <div
  class="mx-auto flex min-h-10 max-w-7xl items-center px-4 pb-0 sm:px-6 lg:px-8"
>
            <!-- ========================================================
         LEFT: CONTROL CENTER BRANDING
         ======================================================== -->
            <div class="flex min-w-0 items-center gap-1">
              <!-- Settings Icon -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center
               rounded-xl  text-white/45"
              >
                <mat-icon class="!text-[22px]"> settings </mat-icon>
              </div>

              <!-- Title / Subtitle -->
              <div class="min-w-0">

                <p
                  class=" truncate text-md font-medium text-white/80
                 sm:block "
                >
                  System configuration and administration
                </p>
              </div>
            </div>

            <!-- ========================================================
         RIGHT: SYSTEM STATUS 
         ======================================================== -->
            <div class="ml-auto flex shrink-0 items-center gap-2">
              <!-- System Operational -->
              <div
                class="flex items-center gap-2 rounded-full
               border border-[#5FB8B8] bg-white/60
               px-2.5 py-1.5 sm:px-3"
                aria-label="System Operational"
              >
                <!-- Status indicator -->
                <span
                  class="h-3 w-3 shrink-0 rounded-full bg-green-600
                 shadow-[0_0_0_2px_rgba(255,255,255,0.35)]"
                ></span>

                <!-- Hide text on small screens -->
                <span class="hidden text-xs font-semibold text-[#164E55] sm:inline">
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </header>

      <main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <mat-tab-group animationDuration="0ms" class="configuration-tabs">
          <!-- =================================================
               OVERVIEW
               ================================================= -->

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon> dashboard </mat-icon>

              <span class="ml-2"> Overview </span>
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
              <mat-icon> apps </mat-icon>

              <span class="ml-2"> Applications </span>
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
              <mat-icon> tune </mat-icon>

              <span class="ml-2"> Settings </span>
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
              <mat-icon> terminal </mat-icon>

              <span class="ml-2"> Diagnostics </span>
            </ng-template>

            <div class="pt-6">
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
                  Centralized application logging, diagnostics, operation tracking, and
                  troubleshooting tools will be available here.
                </p>
              </section>
            </div>
          </mat-tab>

          <!-- =================================================
               AUDIT
               ================================================= -->

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon> history </mat-icon>

              <span class="ml-2"> Audit </span>
            </ng-template>

            <div class="pt-6">
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
                  Configuration changes, administrative actions, system operations, and
                  accountability records will appear here.
                </p>
              </section>
            </div>
          </mat-tab>

          <!-- =================================================
               SECURITY
               ================================================= -->

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon> security </mat-icon>

              <span class="ml-2"> Security </span>
            </ng-template>

            <div class="pt-6">
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
                  Security configuration, access controls, policy validation, and security
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
              <mat-icon> build </mat-icon>

              <span class="ml-2"> Maintenance </span>
            </ng-template>

            <div class="pt-6">
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
                  Scheduled maintenance, application maintenance mode, cache operations, and other
                  platform maintenance tools will be managed here.
                </p>
              </section>
            </div>
          </mat-tab>

          <!-- =================================================
               RECOVERY
               ================================================= -->

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon> restore </mat-icon>

              <span class="ml-2"> Recovery </span>
            </ng-template>

            <div class="pt-6">
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
                  Scoped recovery operations, configuration restoration, rollback tools, and
                  operational recovery workflows will be managed here.
                </p>
              </section>
            </div>
          </mat-tab>

          <!-- =================================================
               SYSTEM HEALTH
               ================================================= -->

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon> monitor_heart </mat-icon>

              <span class="ml-2"> System Health </span>
            </ng-template>

            <div class="pt-6">
               <app-configuration-system-health />
            </div>
          </mat-tab>
        </mat-tab-group>
     
      </main>
    </div>

  `,
})
export class ConfigurationComponent {
  private readonly router = inject(Router);

  protected readonly navigationService = inject(NavigationService);

  private readonly authService = inject(AuthService);

  private readonly logger = inject(LoggerService);

  private readonly pageTitleService =
    inject(PageTitleService);

  protected navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  constructor() {
    this.logger.info('ConfigurationComponent', 'Control Center initialized.');
  this.pageTitleService.setTitle('Control Center');
}

  protected async signOut(): Promise<void> {
    await this.authService.logout();

    await this.router.navigateByUrl('/');
  }
}
