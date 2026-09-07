import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatChipsModule } from '@angular/material/chips';

import { MatDividerModule } from '@angular/material/divider';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import {
  FeatureAvailability,
  FeatureConfig,
} from '../../../../../../core/models/feature-config.model';

import {
  FeatureConfigService,
} from '../../../../../../core/services/feature-config.service';

import {
  LoggerService,
} from '../../../../../../core/services/logger.service';

import {
  NotificationService,
} from '../../../../../../core/services/notification.service';

import {
  ConfirmationService,
} from '../../../../../../core/services/confirmation.service';


@Component({
  selector: 'app-configuration-applications',

  standalone: true,

  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <section class="space-y-6">

      <!-- =========================================================
           PAGE HEADER
           ========================================================= -->

      <div
        class="flex
               flex-col
               gap-3
               sm:flex-row
               sm:items-end
               sm:justify-between"
      >

        <div>

          <p
            class="text-xs
                   font-semibold
                   uppercase
                   tracking-[0.15em]
                   text-[#007979]"
          >
            Application Management
          </p>

          <h2
            class="mt-1
                   text-2xl
                   font-bold
                   tracking-tight
                   text-[#032D42]"
          >
            Applications
          </h2>

          <p
            class="mt-2
                   max-w-3xl
                   text-sm
                   leading-6
                   text-gray-600"
          >
            Control application availability, maintenance status,
            and navigation visibility from one centralized control
            surface.
          </p>

        </div>


        <!-- Application count -->

        <div
          class="flex
                 items-center
                 gap-2
                 self-start
                 rounded-xl
                 border
                 border-gray-200
                 bg-white
                 px-4
                 py-2
                 text-sm
                 shadow-sm
                 sm:self-auto"
        >

          <mat-icon
            class="text-[#007979]"
          >
            apps
          </mat-icon>

          <span class="font-medium text-gray-700">
            {{ features().length }}
            {{ features().length === 1 ? 'application' : 'applications' }}
          </span>

        </div>

      </div>


      <!-- =========================================================
           SYSTEM NOTICE
           ========================================================= -->

      <div
        class="flex
               gap-3
               rounded-xl
               border
               border-blue-200
               bg-blue-50
               p-4"
      >

        <mat-icon
          class="shrink-0
                 text-blue-600"
        >
          admin_panel_settings
        </mat-icon>

        <div>

          <p
            class="text-sm
                   font-semibold
                   text-blue-900"
          >
            Centralized application control
          </p>

          <p
            class="mt-1
                   text-sm
                   leading-6
                   text-blue-800"
          >
            Availability changes are persisted through the
            centralized feature configuration service and are
            recorded for administrative auditing.
          </p>

        </div>

      </div>


      <!-- =========================================================
           APPLICATION LIST
           ========================================================= -->

      @if (features().length === 0) {

        <mat-card
          appearance="outlined"
          class="!rounded-2xl"
        >

          <mat-card-content
            class="flex
                   flex-col
                   items-center
                   justify-center
                   px-6
                   py-12
                   text-center"
          >

            <mat-icon
              class="!h-12
                     !w-12
                     !text-5xl
                     text-gray-400"
            >
              apps
            </mat-icon>

            <h3
              class="mt-4
                     text-lg
                     font-semibold
                     text-gray-800"
            >
              No applications configured
            </h3>

            <p
              class="mt-2
                     max-w-md
                     text-sm
                     leading-6
                     text-gray-500"
            >
              No application definitions are currently available
              in the feature configuration registry.
            </p>

          </mat-card-content>

        </mat-card>

      } @else {

        <div
          class="grid
                 grid-cols-1
                 gap-5
                 xl:grid-cols-2"
        >

          @for (
            feature of features();
            track feature.key
          ) {

            <mat-card
              appearance="outlined"
              class="!rounded-2xl
                     !border-gray-200
                     transition
                     hover:shadow-md"
            >

              <!-- =================================================
                   CARD HEADER
                   ================================================= -->

              <mat-card-header
                class="!px-5
                       !pt-5"
              >

                <div
                  mat-card-avatar
                  class="!flex
                         !items-center
                         !justify-center
                         !rounded-xl
                         !bg-[#032D42]/10
                         !text-[#032D42]"
                >

                  <mat-icon>
                    {{ feature.icon || 'apps' }}
                  </mat-icon>

                </div>


                <mat-card-title
                  class="!text-lg
                         !font-semibold
                         !text-[#032D42]"
                >
                  {{ feature.name }}
                </mat-card-title>


                <mat-card-subtitle
                  class="!mt-1
                         !text-xs
                         !text-gray-500"
                >
                  {{ feature.key }}
                </mat-card-subtitle>

              </mat-card-header>


              <!-- =================================================
                   CARD CONTENT
                   ================================================= -->

              <mat-card-content
                class="!px-5
                       !pb-5
                       !pt-4"
              >

                <!-- Description -->

                <p
                  class="min-h-[48px]
                         text-sm
                         leading-6
                         text-gray-600"
                >
                  {{
                    feature.description ||
                    'No application description has been configured.'
                  }}
                </p>


                <!-- Status / metadata -->

                <div
                  class="mt-4
                         flex
                         flex-wrap
                         items-center
                         gap-2"
                >

                  <span
                    class="inline-flex
                           items-center
                           gap-1.5
                           rounded-full
                           px-3
                           py-1
                           text-xs
                           font-semibold"
                    [class.bg-emerald-100]="
                      feature.availability === 'enabled'
                    "
                    [class.text-emerald-800]="
                      feature.availability === 'enabled'
                    "
                    [class.bg-amber-100]="
                      feature.availability === 'maintenance'
                    "
                    [class.text-amber-800]="
                      feature.availability === 'maintenance'
                    "
                    [class.bg-red-100]="
                      feature.availability === 'disabled'
                    "
                    [class.text-red-800]="
                      feature.availability === 'disabled'
                    "
                  >

                    <span
                      class="h-1.5
                             w-1.5
                             rounded-full
                             bg-current"
                    ></span>

                    {{ availabilityLabel(feature.availability) }}

                  </span>


                  @if (feature.core) {

                    <span
                      class="inline-flex
                             items-center
                             gap-1
                             rounded-full
                             bg-[#032D42]
                             px-3
                             py-1
                             text-xs
                             font-semibold
                             text-white"
                    >

                      <mat-icon
                        class="!h-4
                               !w-4
                               !text-base"
                      >
                        lock
                      </mat-icon>

                      Protected

                    </span>

                  }


                  @if (feature.version) {

                    <span
                      class="rounded-full
                             bg-gray-100
                             px-3
                             py-1
                             text-xs
                             font-medium
                             text-gray-600"
                    >
                      v{{ feature.version }}
                    </span>

                  }

                </div>


                <mat-divider
                  class="!my-5"
                ></mat-divider>


                <!-- =================================================
                     CONFIGURATION DETAILS
                     ================================================= -->

                <div
                  class="grid
                         grid-cols-1
                         gap-4
                         sm:grid-cols-2"
                >

                  <!-- Navigation -->

                  <div>

                    <p
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-500"
                    >
                      Navigation
                    </p>

                    <div
                      class="mt-2
                             flex
                             items-center
                             gap-2"
                    >

                      <mat-icon
                        class="!h-5
                               !w-5
                               !text-xl"
                        [class.text-emerald-600]="
                          feature.visibleInNavigation
                        "
                        [class.text-gray-400]="
                          !feature.visibleInNavigation
                        "
                      >
                        {{
                          feature.visibleInNavigation
                            ? 'visibility'
                            : 'visibility_off'
                        }}
                      </mat-icon>

                      <span
                        class="text-sm
                               font-medium
                               text-gray-700"
                      >
                        {{
                          feature.visibleInNavigation
                            ? 'Visible'
                            : 'Hidden'
                        }}
                      </span>

                    </div>

                  </div>


                  <!-- New users -->

                  <div>

                    <p
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-500"
                    >
                      New Users
                    </p>

                    <div
                      class="mt-2
                             flex
                             items-center
                             gap-2"
                    >

                      <mat-icon
                        class="!h-5
                               !w-5
                               !text-xl"
                        [class.text-emerald-600]="
                          feature.allowNewUsers
                        "
                        [class.text-gray-400]="
                          !feature.allowNewUsers
                        "
                      >
                        {{
                          feature.allowNewUsers
                            ? 'person_add'
                            : 'person_off'
                        }}
                      </mat-icon>

                      <span
                        class="text-sm
                               font-medium
                               text-gray-700"
                      >
                        {{
                          feature.allowNewUsers
                            ? 'Allowed'
                            : 'Restricted'
                        }}
                      </span>

                    </div>

                  </div>

                </div>


                <!-- Dependencies -->

                @if (feature.dependencies.length > 0) {

                  <div class="mt-5">

                    <p
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-500"
                    >
                      Dependencies
                    </p>

                    <div
                      class="mt-2
                             flex
                             flex-wrap
                             gap-2"
                    >

                      @for (
                        dependency of feature.dependencies;
                        track dependency
                      ) {

                        <span
                          class="rounded-md
                                 border
                                 border-gray-200
                                 bg-gray-50
                                 px-2.5
                                 py-1
                                 font-mono
                                 text-xs
                                 text-gray-600"
                        >
                          {{ dependency }}
                        </span>

                      }

                    </div>

                  </div>

                }

              </mat-card-content>


              <!-- =================================================
                   CARD ACTIONS
                   ================================================= -->

              <mat-card-actions
                class="!flex
                       !flex-col
                       !items-stretch
                       !gap-3
                       !border-t
                       !border-gray-100
                       !px-5
                       !py-4
                       sm:!flex-row
                       sm:!items-center
                       sm:!justify-between"
              >

                <!-- Availability controls -->

                <div
                  class="flex
                         flex-wrap
                         gap-2"
                >

                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="
                      feature.core ||
                      isSaving(feature.key) ||
                      feature.availability === 'enabled'
                    "
                    (click)="
                      changeAvailability(
                        feature,
                        'enabled'
                      )
                    "
                    matTooltip="Enable this application"
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
                      isSaving(feature.key) ||
                      feature.availability === 'maintenance'
                    "
                    (click)="
                      changeAvailability(
                        feature,
                        'maintenance'
                      )
                    "
                    matTooltip="Place this application into maintenance mode"
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
                      isSaving(feature.key) ||
                      feature.availability === 'disabled'
                    "
                    (click)="
                      changeAvailability(
                        feature,
                        'disabled'
                      )
                    "
                    matTooltip="Disable this application"
                  >
                    <mat-icon>
                      block
                    </mat-icon>

                    Disable
                  </button>

                </div>


                <!-- Navigation control -->

                <button
                  mat-button
                  type="button"
                  [disabled]="
                    feature.core ||
                    isSaving(feature.key)
                  "
                  (click)="
                    toggleNavigationVisibility(feature)
                  "
                >

                  @if (isSaving(feature.key)) {

                    <mat-spinner
                      diameter="18"
                    ></mat-spinner>

                  } @else {

                    <mat-icon>
                      {{
                        feature.visibleInNavigation
                          ? 'visibility_off'
                          : 'visibility'
                      }}
                    </mat-icon>

                  }

                  {{
                    feature.visibleInNavigation
                      ? 'Hide from navigation'
                      : 'Show in navigation'
                  }}

                </button>

              </mat-card-actions>


              <!-- =================================================
                   SAVING INDICATOR
                   ================================================= -->

              @if (isSaving(feature.key)) {

                <div
                  class="flex
                         items-center
                         gap-2
                         border-t
                         border-gray-100
                         bg-gray-50
                         px-5
                         py-2.5
                         text-xs
                         text-gray-500"
                >

                  <mat-spinner
                    diameter="16"
                  ></mat-spinner>

                  Applying configuration change...

                </div>

              }

            </mat-card>

          }

        </div>

      }

    </section>
  `,
})
export class ConfigurationApplicationsComponent {

  private readonly featureConfigService =
    inject(FeatureConfigService);

  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly notificationService =
    inject(NotificationService);

  private readonly logger =
    inject(LoggerService);


  /**
   * Feature registry exposed to the template.
   *
   * FeatureConfigService remains the source of truth.
   */
  protected readonly features =
    this.featureConfigService.features;


  /**
   * Feature keys currently being modified.
   *
   * A Set is used so multiple independent cards can
   * theoretically be updated without blocking the
   * entire Applications screen.
   */
  private readonly savingKeys =
    signal<Set<string>>(new Set());


  /**
   * Return whether a feature is currently being modified.
   */
  protected isSaving(key: string): boolean {

    return this.savingKeys().has(key);

  }


  /**
   * Return a human-readable availability label.
   */
  protected availabilityLabel(
    availability: FeatureAvailability,
  ): string {

    switch (availability) {

      case 'enabled':
        return 'Enabled';

      case 'maintenance':
        return 'Maintenance';

      case 'disabled':
        return 'Disabled';

      default:
        return 'Unknown';

    }

  }


  /**
   * Change application availability.
   *
   * Availability changes are high-impact administrative
   * operations, so confirmation is required.
   */
  protected async changeAvailability(
    feature: FeatureConfig,
    availability: FeatureAvailability,
  ): Promise<void> {

    if (feature.core) {

      this.notificationService.warning(
        `${feature.name} is a protected core application.`,
      );

      return;

    }


    if (
      feature.availability === availability
    ) {

      return;

    }


    const operationLabel =
      this.availabilityActionLabel(
        availability,
      );


    const confirmed =
      await this.confirmationService.confirm({
        title: `${operationLabel} application?`,

        message:
          `You are about to ${operationLabel.toLowerCase()} ` +
          `${feature.name}. This change will affect the application's ` +
          `runtime availability.`,

        warning:
          availability === 'disabled'
            ? 'The application data will be preserved, but users will no longer be able to access the feature while it is disabled.'
            : availability === 'maintenance'
              ? 'Users will be redirected to the feature unavailable page while the application is in maintenance mode.'
              : 'Confirm that the application is ready to accept user traffic.',

        icon:
          availability === 'disabled'
            ? 'block'
            : availability === 'maintenance'
              ? 'build'
              : 'check_circle',

        confirmText: operationLabel,

        cancelText: 'Cancel',

        destructive:
          availability === 'disabled',
      });


    if (!confirmed) {

      this.logger.info(
        'ConfigurationApplicationsComponent',
        'Application availability change cancelled.',
        {
          featureKey: feature.key,
          requestedAvailability: availability,
        },
      );

      return;

    }


    this.setSaving(
      feature.key,
      true,
    );


    const operationId =
      this.logger.createOperationId();


    this.logger.info(
      'ConfigurationApplicationsComponent',
      'Starting application availability change.',
      {
        operationId,
        featureKey: feature.key,
        previousAvailability: feature.availability,
        requestedAvailability: availability,
      },
    );


    try {

      await this.featureConfigService.setAvailability(
        feature.key,
        availability,
      );


      this.notificationService.success(
        `${feature.name} is now ${this.availabilityLabel(
          availability,
        ).toLowerCase()}.`,
      );


      this.logger.info(
        'ConfigurationApplicationsComponent',
        'Application availability change completed.',
        {
          operationId,
          featureKey: feature.key,
          availability,
        },
      );

    } catch (error) {

    this.logger.error(
  'ConfigurationApplicationsComponent',
  'Application availability change failed.',
  {
    operationId,
    featureKey: feature.key,
    requestedAvailability: availability,
    error: this.getErrorMessage(error),
  },
);

      this.notificationService.error(
        `Unable to update ${feature.name}. ` +
        `The previous configuration has been preserved.`,
      );

    } finally {

      this.setSaving(
        feature.key,
        false,
      );

    }

  }


  /**
   * Toggle whether an application appears in navigation.
   */
  protected async toggleNavigationVisibility(
    feature: FeatureConfig,
  ): Promise<void> {

    if (feature.core) {

      this.notificationService.warning(
        `${feature.name} is a protected core application.`,
      );

      return;

    }


    const visible =
      !feature.visibleInNavigation;


    this.setSaving(
      feature.key,
      true,
    );


    const operationId =
      this.logger.createOperationId();


    try {

      await this.featureConfigService.setNavigationVisibility(
        feature.key,
        visible,
      );


      this.notificationService.success(
        visible
          ? `${feature.name} is now visible in navigation.`
          : `${feature.name} is now hidden from navigation.`,
      );


      this.logger.info(
        'ConfigurationApplicationsComponent',
        'Application navigation visibility changed.',
        {
          operationId,
          featureKey: feature.key,
          visibleInNavigation: visible,
        },
      );

    } catch (error) {

     this.logger.error(
  'ConfigurationApplicationsComponent',
  'Application navigation visibility change failed.',
  {
    operationId,
    featureKey: feature.key,
    visibleInNavigation: visible,
    error: this.getErrorMessage(error),
  },
);


      this.notificationService.error(
        `Unable to update navigation visibility for ${feature.name}.`,
      );

    } finally {

      this.setSaving(
        feature.key,
        false,
      );

    }

  }


  /**
   * Convert availability to an administrator-friendly
   * action label.
   */
  private availabilityActionLabel(
    availability: FeatureAvailability,
  ): string {

    switch (availability) {

      case 'enabled':
        return 'Enable';

      case 'maintenance':
        return 'Place in maintenance';

      case 'disabled':
        return 'Disable';

      default:
        return 'Update';

    }

  }


  /**
   * Mark a feature as being modified.
   */
  private setSaving(
    key: string,
    saving: boolean,
  ): void {

    this.savingKeys.update(
      (current) => {

        const next =
          new Set(current);

        if (saving) {
          next.add(key);
        } else {
          next.delete(key);
        }

        return next;

      },
    );

  }

  /**
 * Safely convert an unknown caught error into a loggable string.
 *
 * JavaScript catch variables are typed as unknown, so we should
 * never assume that the thrown value is an Error.
 */
private getErrorMessage(error: unknown): string {

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

}