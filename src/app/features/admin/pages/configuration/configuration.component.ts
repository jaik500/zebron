
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { LoggerService } from '../../../../core/services/logger.service';

// Overview and Security are live versions kept in admin/shared.
import { ControlCenterOverviewComponent as ConfigurationOverviewComponent } from '../../shared/control-center-overview.component';
import { ConfigurationApplicationsComponent } from './tabs/applications/configuration-applications.component';
import { ConfigurationSettingsComponent } from './tabs/settings/configuration-settings.component';

import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { NavigationService } from '../../../../core/services/navigation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { SystemHealthService } from '../../../../core/services/system-health.service';

interface SystemStatusBadge {
  tone: 'operational' | 'unstable' | 'maintenance' | 'checking';
  label: string;
  textColor: string;
}

import { SecurityChecksComponent as ConfigurationSecurityComponent } from '../../shared/security-checks.component';
import { ConfigurationMaintenanceComponent } from './tabs/maintenance/configuration-maintenance.component';
import { ConfigurationOperationalMonitoringComponent } from './tabs/operational-monitoring/configuration-operational-monitoring.component';

/** Tab addresses, in tab order: /admin/configuration/<tab>. */
const TABS = [
  'overview',
  'applications',
  'settings',
  'operational-monitoring',
  'security',
  'maintenance',
] as const;

/** Older or alternative addresses that open an existing tab. */
const TAB_ALIASES: Record<string, (typeof TABS)[number]> = {
  monitoring: 'operational-monitoring',
  audit: 'operational-monitoring',
  'system-health': 'operational-monitoring',
  health: 'operational-monitoring',
  recovery: 'maintenance',
  links: 'maintenance',
};

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

    ConfigurationSecurityComponent,
    ConfigurationMaintenanceComponent,
    ConfigurationOperationalMonitoringComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] shadow-sm">
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
                     rounded-xl text-white/45"
            >
              <mat-icon class="!text-[22px]">
                settings
              </mat-icon>
            </div>

            <!-- Title / Subtitle -->
            <div class="min-w-0">
              <p
                class="truncate text-md font-medium text-white/80 sm:block"
              >
                System configuration and administration
              </p>
            </div>
          </div>

          <!-- ========================================================
               RIGHT: SYSTEM STATUS
               ======================================================== -->
          <div class="ml-auto flex shrink-0 items-center gap-2">
            <!-- System status: red in maintenance, orange when health
                 checks find a problem, green when operational. -->
            <div
              class="flex items-center gap-2 rounded-full
                     border border-[#5FB8B8] bg-white/60
                     px-2.5 py-1.5 sm:px-3"
              role="status"
              [attr.aria-label]="systemStatus().label"
              [title]="systemStatus().label"
            >
              <!-- Status indicator -->
              <span
                class="h-3 w-3 shrink-0 rounded-full
                       shadow-[0_0_0_2px_rgba(255,255,255,0.35)]"
                [class.bg-green-600]="systemStatus().tone === 'operational'"
                [class.bg-orange-500]="systemStatus().tone === 'unstable'"
                [class.bg-red-600]="systemStatus().tone === 'maintenance'"
                [class.bg-slate-400]="systemStatus().tone === 'checking'"
                [class.animate-pulse]="systemStatus().tone === 'checking'"
              ></span>

              <!-- Hide text on small screens -->
              <span
                class="hidden text-xs font-semibold sm:inline"
                [style.color]="systemStatus().textColor"
              >
                {{ systemStatus().label }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main
        class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
      >
        <mat-tab-group
          animationDuration="0ms"
          class="configuration-tabs"
          [selectedIndex]="selectedIndex()"
          (selectedIndexChange)="selectTab($event)"
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
     OPERATIONAL MONITORING
     ================================================= -->

<mat-tab>
  <ng-template mat-tab-label>
    <mat-icon>
      monitor_heart
    </mat-icon>

    <span class="ml-2">
      Operational Monitoring
    </span>
  </ng-template>

  <div class="pt-6">
    <app-configuration-operational-monitoring />
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

            <div class="pt-6">
              <app-configuration-security />
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

            <div class="pt-6">
              <app-configuration-maintenance />
            </div>
          </mat-tab>

        </mat-tab-group>
      </main>
    </div>
  `,
})
export class ConfigurationComponent {
  private readonly router = inject(Router);

  private readonly tabParam = toSignal(
    inject(ActivatedRoute).paramMap,
  );

  /** The tab named in the address; Overview when none or unknown. */
  protected readonly selectedIndex = computed(() => {
    const raw = this.tabParam()?.get('tab') ?? 'overview';
    const tab = TAB_ALIASES[raw] ?? raw;
    const index = (TABS as readonly string[]).indexOf(tab);
    return index >= 0 ? index : 0;
  });

  /** Keeps the address in step with the open tab, so tabs can be linked and bookmarked. */
  protected selectTab(index: number): void {
    const tab = TABS[index] ?? 'overview';
    void this.router.navigate(['/admin/configuration', tab], { replaceUrl: true });
  }

  private readonly settingsService =
    inject(SettingsService);

  private readonly systemHealthService =
    inject(SystemHealthService);

  /**
   * Header status badge. Maintenance mode wins (red); otherwise the
   * latest health check decides: problems are orange, healthy is green.
   */
  protected readonly systemStatus = computed((): SystemStatusBadge => {
    if (this.settingsService.isEnabled('system.maintenance.enabled')) {
      return { tone: 'maintenance', label: 'Maintenance Active', textColor: '#B91C1C' };
    }

    const health = this.systemHealthService.overallStatus();

    if (health === 'degraded' || health === 'unhealthy') {
      return { tone: 'unstable', label: 'System Unstable', textColor: '#C2410C' };
    }

    if (this.systemHealthService.checking() && !this.systemHealthService.lastChecked()) {
      return { tone: 'checking', label: 'Checking Status', textColor: '#164E55' };
    }

    return { tone: 'operational', label: 'System Operational', textColor: '#164E55' };
  });

  protected readonly navigationService =
    inject(NavigationService);

  private readonly authService =
    inject(AuthService);

  private readonly logger =
    inject(LoggerService);

  private readonly pageTitleService =
    inject(PageTitleService);

  protected navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  constructor() {
    this.logger.info(
      'ConfigurationComponent',
      'Control Center initialized.',
    );

    this.pageTitleService.setTitle(
      'Control Center',
    );

    // Current maintenance setting and one health check per session, so
    // the header badge reflects the real state. A check run from
    // Operational Monitoring updates the badge too (same service).
    void this.settingsService.ensureLoaded();

    if (!this.systemHealthService.lastChecked() && !this.systemHealthService.checking()) {
      void this.systemHealthService.runHealthCheck().catch(() => undefined);
    }
  }

  protected async signOut(): Promise<void> {
    await this.authService.logout();

    await this.router.navigateByUrl('/');
  }
}
