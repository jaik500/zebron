import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { FeatureConfigService } from '../../../../../../core/services/feature-config.service';
import { SettingsService } from '../../../../../../core/services/settings.service';

@Component({
  selector:
    'app-configuration-overview',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- HEADER -->

      <div>

        <h2
          class="text-xl font-semibold text-slate-900"
        >
          Platform Overview
        </h2>

        <p
          class="mt-1 text-sm text-slate-600"
        >
          A high-level view of Zebron's
          configurable platform capabilities.
        </p>

      </div>


      <!-- SUMMARY -->

      <div
        class="grid grid-cols-1 gap-4
               sm:grid-cols-2
               lg:grid-cols-4"
      >

        <!-- APPLICATIONS -->

        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-content>

            <div
              class="flex items-center
                     justify-between"
            >

              <div>

                <p
                  class="text-sm font-medium
                         text-slate-500"
                >
                  Applications
                </p>

                <p
                  class="mt-1 text-3xl
                         font-bold text-slate-900"
                >
                  {{ applicationCount() }}
                </p>

              </div>

              <mat-icon
                class="!h-10 !w-10 !text-[40px]
                       text-slate-400"
              >
                apps
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>


        <!-- ENABLED -->

        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-content>

            <div
              class="flex items-center
                     justify-between"
            >

              <div>

                <p
                  class="text-sm font-medium
                         text-slate-500"
                >
                  Enabled
                </p>

                <p
                  class="mt-1 text-3xl
                         font-bold text-emerald-600"
                >
                  {{ enabledCount() }}
                </p>

              </div>

              <mat-icon
                class="!h-10 !w-10 !text-[40px]
                       text-emerald-500"
              >
                check_circle
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>


        <!-- MAINTENANCE -->

        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-content>

            <div
              class="flex items-center
                     justify-between"
            >

              <div>

                <p
                  class="text-sm font-medium
                         text-slate-500"
                >
                  Maintenance
                </p>

                <p
                  class="mt-1 text-3xl
                         font-bold text-amber-600"
                >
                  {{ maintenanceCount() }}
                </p>

              </div>

              <mat-icon
                class="!h-10 !w-10 !text-[40px]
                       text-amber-500"
              >
                build
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>


        <!-- SETTINGS -->

        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-content>

            <div
              class="flex items-center
                     justify-between"
            >

              <div>

                <p
                  class="text-sm font-medium
                         text-slate-500"
                >
                  Settings
                </p>

                <p
                  class="mt-1 text-3xl
                         font-bold text-slate-900"
                >
                  {{ settingCount() }}
                </p>

              </div>

              <mat-icon
                class="!h-10 !w-10 !text-[40px]
                       text-slate-400"
              >
                tune
              </mat-icon>

            </div>

          </mat-card-content>

        </mat-card>

      </div>


      <!-- INFORMATION -->

      <div
        class="grid grid-cols-1 gap-6
               lg:grid-cols-2"
      >

        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-header>

            <mat-card-title>
              Configuration Architecture
            </mat-card-title>

          </mat-card-header>

          <mat-card-content>

            <div
              class="mt-4 space-y-3
                     text-sm text-slate-600"
            >

              <div
                class="flex gap-3"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px]"
                >
                  apps
                </mat-icon>

                <span>
                  Applications control overall
                  feature availability.
                </span>
              </div>

              <div
                class="flex gap-3"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px]"
                >
                  tune
                </mat-icon>

                <span>
                  Settings control configurable
                  application behavior.
                </span>
              </div>

              <div
                class="flex gap-3"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px]"
                >
                  history
                </mat-icon>

                <span>
                  Administrative changes are
                  recorded in the audit trail.
                </span>
              </div>

              <div
                class="flex gap-3"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px]"
                >
                  bug_report
                </mat-icon>

                <span>
                  Runtime diagnostics use the
                  centralized logging service.
                </span>
              </div>

            </div>

          </mat-card-content>

        </mat-card>


        <mat-card
          appearance="outlined"
          class="!rounded-xl"
        >

          <mat-card-header>

            <mat-card-title>
              Configuration Principles
            </mat-card-title>

          </mat-card-header>

          <mat-card-content>

            <ul
              class="mt-4 space-y-3
                     text-sm text-slate-600"
            >

              <li>
                • Configuration changes never
                delete application data.
              </li>

              <li>
                • Core platform services remain
                protected.
              </li>

              <li>
                • Configuration changes are
                administrator-controlled.
              </li>

              <li>
                • Meaningful changes generate
                audit records.
              </li>

              <li>
                • Runtime failures are logged
                centrally.
              </li>

            </ul>

          </mat-card-content>

        </mat-card>

      </div>

    </div>
  `,
})
export class ConfigurationOverviewComponent {

  private readonly featureConfig =
    inject(
      FeatureConfigService,
    );

  private readonly settings =
    inject(
      SettingsService,
    );

  readonly applicationCount =
    computed(
      () =>
        this.featureConfig
          .features()
          .length,
    );

  readonly enabledCount =
    computed(
      () =>
        this.featureConfig
          .features()
          .filter(
            (feature) =>
              feature.availability ===
              'enabled',
          )
          .length,
    );

  readonly maintenanceCount =
    computed(
      () =>
        this.featureConfig
          .features()
          .filter(
            (feature) =>
              feature.availability ===
              'maintenance',
          )
          .length,
    );

  readonly settingCount =
    computed(
      () =>
        this.settings
          .settings()
          .length,
    );
}