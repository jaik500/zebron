import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FeatureConfig } from '../../../../../../core/models/feature-config.model';

import { FeatureConfigService } from '../../../../../../core/services/feature-config.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

@Component({
  selector:
    'app-configuration-applications',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
          Applications
        </h2>

        <p
          class="mt-1 text-sm text-slate-600"
        >
          Control application availability and
          navigation visibility without deleting
          application data.
        </p>

      </div>


      <!-- LOADING -->

      @if (loading()) {

        <div
          class="flex items-center
                 justify-center py-16"
        >

          <mat-spinner
            diameter="40"
          />

        </div>

      }


      <!-- ERROR -->

      @if (error()) {

        <div
          class="rounded-xl border
                 border-red-200
                 bg-red-50 p-4"
        >

          <div
            class="flex items-start gap-3"
          >

            <mat-icon
              class="text-red-600"
            >
              error
            </mat-icon>

            <div>

              <p
                class="font-medium
                       text-red-900"
              >
                Unable to load configuration
              </p>

              <p
                class="mt-1 text-sm
                       text-red-700"
              >
                {{ error() }}
              </p>

            </div>

          </div>

        </div>

      }


      <!-- APPLICATION LIST -->

      @if (!loading()) {

        <div
          class="grid grid-cols-1
                 gap-4"
        >

          @for (
            feature of features();
            track feature.key
          ) {

            <mat-card
              appearance="outlined"
              class="!rounded-xl"
            >

              <mat-card-content>

                <div
                  class="flex flex-col gap-5
                         lg:flex-row
                         lg:items-center
                         lg:justify-between"
                >

                  <!-- APPLICATION INFO -->

                  <div
                    class="flex items-start gap-4"
                  >

                    <div
                      class="flex h-12 w-12
                             shrink-0
                             items-center
                             justify-center
                             rounded-xl
                             bg-slate-100"
                    >

                      <mat-icon>
                        {{ feature.icon || 'apps' }}
                      </mat-icon>

                    </div>

                    <div>

                      <div
                        class="flex flex-wrap
                               items-center gap-2"
                      >

                        <h3
                          class="text-base
                                 font-semibold
                                 text-slate-900"
                        >
                          {{ feature.name }}
                        </h3>

                        @if (feature.core) {

                          <span
                            class="rounded-full
                                   bg-slate-100
                                   px-2 py-0.5
                                   text-xs
                                   font-medium
                                   text-slate-600"
                          >
                            Core
                          </span>

                        }

                      </div>

                      <p
                        class="mt-1 max-w-2xl
                               text-sm
                               text-slate-600"
                      >
                        {{ feature.description }}
                      </p>

                      <div
                        class="mt-3 flex flex-wrap
                               gap-2"
                      >

                        <!-- STATUS -->

                        <span
                          class="inline-flex
                                 items-center gap-1.5
                                 rounded-full
                                 px-2.5 py-1
                                 text-xs font-medium"
                          [class.bg-emerald-100]="
                            feature.availability ===
                            'enabled'
                          "
                          [class.text-emerald-700]="
                            feature.availability ===
                            'enabled'
                          "
                          [class.bg-amber-100]="
                            feature.availability ===
                            'maintenance'
                          "
                          [class.text-amber-700]="
                            feature.availability ===
                            'maintenance'
                          "
                          [class.bg-red-100]="
                            feature.availability ===
                            'disabled'
                          "
                          [class.text-red-700]="
                            feature.availability ===
                            'disabled'
                          "
                        >

                          <span
                            class="h-1.5 w-1.5
                                   rounded-full
                                   bg-current"
                          ></span>

                          {{ statusLabel(
                            feature.availability
                          ) }}

                        </span>


                        <!-- NAVIGATION -->

                        <span
                          class="rounded-full
                                 bg-slate-100
                                 px-2.5 py-1
                                 text-xs
                                 font-medium
                                 text-slate-600"
                        >

                          Navigation:
                          {{
                            feature.visibleInNavigation
                              ? 'Visible'
                              : 'Hidden'
                          }}

                        </span>

                      </div>

                    </div>

                  </div>


                  <!-- CONTROLS -->

                  <div
                    class="flex flex-wrap
                           items-center gap-2"
                  >

                    @if (
                      feature.availability ===
                      'enabled'
                    ) {

                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="
                          feature.core ||
                          savingKey() === feature.key
                        "
                        (click)="
                          changeAvailability(
                            feature,
                            'maintenance'
                          )
                        "
                      >

                        <mat-icon>
                          build
                        </mat-icon>

                        Maintenance

                      </button>

                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="
                          feature.core ||
                          savingKey() === feature.key
                        "
                        (click)="
                          changeAvailability(
                            feature,
                            'disabled'
                          )
                        "
                      >

                        <mat-icon>
                          power_settings_new
                        </mat-icon>

                        Disable

                      </button>

                    }


                    @if (
                      feature.availability ===
                      'maintenance'
                    ) {

                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="
                          savingKey() === feature.key
                        "
                        (click)="
                          changeAvailability(
                            feature,
                            'enabled'
                          )
                        "
                      >

                        <mat-icon>
                          check_circle
                        </mat-icon>

                        Enable

                      </button>

                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="
                          feature.core ||
                          savingKey() === feature.key
                        "
                        (click)="
                          changeAvailability(
                            feature,
                            'disabled'
                          )
                        "
                      >

                        <mat-icon>
                          power_settings_new
                        </mat-icon>

                        Disable

                      </button>

                    }


                    @if (
                      feature.availability ===
                      'disabled'
                    ) {

                      <button
                        mat-flat-button
                        type="button"
                        [disabled]="
                          savingKey() === feature.key
                        "
                        (click)="
                          changeAvailability(
                            feature,
                            'enabled'
                          )
                        "
                      >

                        <mat-icon>
                          check_circle
                        </mat-icon>

                        Enable

                      </button>

                    }


                    <!-- NAVIGATION -->

                    <button
                      mat-icon-button
                      type="button"
                      [disabled]="
                        savingKey() === feature.key
                      "
                      [attr.aria-label]="
                        feature.visibleInNavigation
                          ? 'Hide from navigation'
                          : 'Show in navigation'
                      "
                      (click)="
                        toggleNavigation(feature)
                      "
                    >

                      <mat-icon>
                        {{
                          feature.visibleInNavigation
                            ? 'visibility'
                            : 'visibility_off'
                        }}
                      </mat-icon>

                    </button>

                  </div>

                </div>


                <!-- SAVING -->

                @if (
                  savingKey() === feature.key
                ) {

                  <div
                    class="mt-4 flex items-center
                           gap-2 text-sm
                           text-slate-500"
                  >

                    <mat-spinner
                      diameter="18"
                    />

                    Saving configuration...

                  </div>

                }

              </mat-card-content>

            </mat-card>

          }

        </div>

      }

    </div>
  `,
})
export class ConfigurationApplicationsComponent
  implements OnInit {

  private readonly featureConfig =
    inject(
      FeatureConfigService,
    );

  private readonly logger =
    inject(LoggerService);

  readonly features =
    this.featureConfig.features;

  readonly loading =
    signal(true);

  readonly savingKey =
    signal<string | null>(null);

  readonly error =
    signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.featureConfig.load();
    } catch (error) {
      this.logger.error(
        'ConfigurationApplicationsComponent',
        'Failed to load applications.',
        error,
      );

      this.error.set(
        'The application configuration could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async changeAvailability(
    feature: FeatureConfig,
    availability:
      'enabled' |
      'disabled' |
      'maintenance',
  ): Promise<void> {

    this.savingKey.set(
      feature.key,
    );

    this.error.set(null);

    try {

      await this.featureConfig
        .setAvailability(
          feature.key,
          availability,
        );

    } catch (error) {

      this.logger.error(
        'ConfigurationApplicationsComponent',
        'Failed to change application availability.',
        error,
        {
          featureKey:
            feature.key,
          availability,
        },
      );

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to update application configuration.',
      );

    } finally {
      this.savingKey.set(
        null,
      );
    }
  }

  async toggleNavigation(
    feature: FeatureConfig,
  ): Promise<void> {

    this.savingKey.set(
      feature.key,
    );

    this.error.set(null);

    try {

      await this.featureConfig
        .setNavigationVisibility(
          feature.key,
          !feature.visibleInNavigation,
        );

    } catch (error) {

      this.logger.error(
        'ConfigurationApplicationsComponent',
        'Failed to change navigation visibility.',
        error,
        {
          featureKey:
            feature.key,
        },
      );

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to update navigation configuration.',
      );

    } finally {
      this.savingKey.set(
        null,
      );
    }
  }

  statusLabel(
    status:
      'enabled' |
      'disabled' |
      'maintenance',
  ): string {

    switch (status) {

      case 'enabled':
        return 'Enabled';

      case 'disabled':
        return 'Disabled';

      case 'maintenance':
        return 'Maintenance';

      default:
        return status;
    }
  }
}