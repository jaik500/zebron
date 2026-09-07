import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  FeatureAvailability,
  FeatureConfig,
} from '../../../../../../core/models/feature-config.model';

import { FeatureConfigService } from '../../../../../../core/services/feature-config.service';

import { LoggerService } from '../../../../../../core/services/logger.service';

import { NotificationService } from '../../../../../../core/services/notification.service';

import { ConfirmationService } from '../../../../../../core/services/confirmation.service';

@Component({
  selector: 'app-configuration-applications',

  standalone: true,

  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <section class="space-y-6">
      <!-- =========================================================
           PAGE HEADER
           ========================================================= -->

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Applications</h2>

          <p class="text-sm text-slate-500">
            Manage application availability and navigation visibility.
          </p>
        </div>

        <!-- =======================================================
             SEARCH + APPLICATION COUNT
             ======================================================= -->

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <!-- Application search -->

          <mat-form-field appearance="outline" class="w-full sm:w-72" subscriptSizing="dynamic">
            <mat-label> Search applications </mat-label>

            <input
              matInput
              type="search"
              placeholder="Search by name or key"
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
            />

            <mat-icon matPrefix> search </mat-icon>

            @if (searchTerm()) {
              <button
                mat-icon-button
                matSuffix
                type="button"
                aria-label="Clear search"
                matTooltip="Clear search"
                (click)="clearSearch()"
              >
                <mat-icon> close </mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Application count -->

          <div
            class="flex h-10 shrink-0 items-center whitespace-nowrap rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-700"
          >
            {{ filteredFeatures().length }}

            {{ filteredFeatures().length === 1 ? 'application' : 'applications' }}
          </div>
        </div>
      </div>

      <!-- =========================================================
           SYSTEM NOTICE
           ========================================================= -->

      <div
        class="
          flex
          gap-3
          rounded-xl
          border
          border-blue-200
          bg-blue-50
          p-4
        "
      >
        <mat-icon
          class="
            shrink-0
            text-blue-600
          "
        >
          admin_panel_settings
        </mat-icon>

        <div>
          <p
            class="
              text-sm
              font-semibold
              text-blue-900
            "
          >
            Centralized application control
          </p>

          <p
            class="
              mt-1
              text-sm
              leading-6
              text-blue-800
            "
          >
            Availability changes are persisted through the centralized feature configuration service
            and are recorded for administrative auditing.
          </p>
        </div>
      </div>

      <!-- =========================================================
           APPLICATION LIST
           ========================================================= -->

      @if (features().length === 0) {
        <!-- No applications configured -->

        <mat-card appearance="outlined" class="!rounded-2xl">
          <mat-card-content
            class="
              flex
              flex-col
              items-center
              justify-center
              px-6
              py-12
              text-center
            "
          >
            <mat-icon
              class="
                !h-12
                !w-12
                !text-5xl
                text-gray-400
              "
            >
              apps
            </mat-icon>

            <h3
              class="
                mt-4
                text-lg
                font-semibold
                text-gray-800
              "
            >
              No applications configured
            </h3>

            <p
              class="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
              "
            >
              No application definitions are currently available in the feature configuration
              registry.
            </p>
          </mat-card-content>
        </mat-card>
      } @else if (filteredFeatures().length === 0) {
        <!-- No search results -->

        <mat-card appearance="outlined" class="!rounded-2xl">
          <mat-card-content
            class="
              flex
              flex-col
              items-center
              justify-center
              px-6
              py-12
              text-center
            "
          >
            <mat-icon
              class="
                !h-12
                !w-12
                !text-5xl
                text-gray-400
              "
            >
              search_off
            </mat-icon>

            <h3
              class="
                mt-4
                text-lg
                font-semibold
                text-gray-800
              "
            >
              No applications found
            </h3>

            <p
              class="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
              "
            >
              No applications match
              <span class="font-semibold"> "{{ searchTerm() }}" </span>.
            </p>

            <button mat-stroked-button type="button" class="mt-5" (click)="clearSearch()">
              <mat-icon> close </mat-icon>

              Clear search
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Application grid -->

        <div
          class="
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-2
          "
        >
          @for (feature of filteredFeatures(); track feature.key) {
            <mat-card
              appearance="outlined"
              class="
    !rounded-xl
    !border-gray-200
    transition
    hover:shadow-md
  "
            >
              <!-- =========================================================
       CARD HEADER
       ========================================================= -->
              <mat-card-header
                class="
    !px-4
    !py-3
  "
              >
                <!-- Application icon -->

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
                  <mat-icon>
                    {{ feature.icon || 'apps' }}
                  </mat-icon>
                </div>

                <!-- Application name / key -->

                <mat-card-title
                  class="
      !text-base
      !font-semibold
      !text-[#032D42]
    "
                >
                  {{ feature.name }}
                </mat-card-title>

                <mat-card-subtitle
                  class="
      !mt-0.5
      !text-[11px]
      !text-gray-500
    "
                >
                  {{ feature.key }}
                </mat-card-subtitle>

                <!-- =========================================================
       STATUS + security + EXPAND/COLLAPSE
       ========================================================= -->

                <div
                  class="
      !ml-auto
      flex
      shrink-0
      items-center
      gap-1
    "
                >
                  <!-- Status -->

                  <span
                    class="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        font-semibold
      "
                    [class.bg-emerald-100]="feature.availability === 'enabled'"
                    [class.text-emerald-800]="feature.availability === 'enabled'"
                    [class.bg-amber-100]="feature.availability === 'maintenance'"
                    [class.text-amber-800]="feature.availability === 'maintenance'"
                    [class.bg-red-100]="feature.availability === 'disabled'"
                    [class.text-red-800]="feature.availability === 'disabled'"
                  >
                    <span
                      class="
          h-3
          w-3
          rounded-full
          bg-current
        "
                    ></span>
                  </span>

                  <!-- security level -->

                  @if (feature.core) {
                    <span
                      class="
              inline-flex
              items-center
              rounded-full
              text-[#032D42]
            "
                    >
                      <mat-icon class="!h-5 !w-5 !text-sm"> lock </mat-icon>
                    </span>
                  }

                  <!-- Expand / Collapse -->

                  <button
                    mat-icon-button
                    type="button"
                    class="
        !ml-0.5
        !h-9
        !w-9
        !text-[#032D42]
      "
                    [attr.aria-label]="
                      isCollapsed(feature.key)
                        ? 'Show application details'
                        : 'Hide application details'
                    "
                    [matTooltip]="isCollapsed(feature.key) ? 'Show details' : 'Hide details'"
                    (click)="toggleCard(feature.key)"
                  >
                    <mat-icon>
                      {{ isCollapsed(feature.key) ? 'keyboard_arrow_down' : 'keyboard_arrow_up' }}
                    </mat-icon>
                  </button>
                </div>
              </mat-card-header>

              <!-- =========================================================
       EXPANDED CONTENT
       ========================================================= -->

              @if (!isCollapsed(feature.key)) {
                <mat-card-content
                  class="
        !px-4
        !pb-3
        !pt-1
      "
                >
                  <!-- Description -->

                  <p
                    class="
          text-sm
          leading-5
          text-gray-600
        "
                  >
                    {{ feature.description || 'No application description has been configured.' }}
                  </p>

                  <!-- Status -->

                  <div
                    class="
          mt-3
          flex
          flex-wrap
          items-center
          gap-1.5
        "
                  >
                    <span
                      class="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            px-2.5
            py-1
            text-[11px]
            font-semibold
          "
                      [class.bg-emerald-100]="feature.availability === 'enabled'"
                      [class.text-emerald-800]="feature.availability === 'enabled'"
                      [class.bg-amber-100]="feature.availability === 'maintenance'"
                      [class.text-amber-800]="feature.availability === 'maintenance'"
                      [class.bg-red-100]="feature.availability === 'disabled'"
                      [class.text-red-800]="feature.availability === 'disabled'"
                    >
                      <span
                        class="
              h-1.5
              w-1.5
              rounded-full
              bg-current
            "
                      ></span>

                      {{ availabilityLabel(feature.availability) }}
                    </span>

                    @if (feature.core) {
                      <span
                        class="
              inline-flex
              items-center
              gap-1
              rounded-full
              bg-[#032D42]
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-white
            "
                      >
                        <mat-icon class="!h-3.5 !w-3.5 !text-sm"> lock </mat-icon>

                        Protected
                      </span>
                    }

                    @if (feature.version) {
                      <span
                        class="
              rounded-full
              bg-gray-100
              px-2.5
              py-1
              text-[11px]
              font-medium
              text-gray-600
            "
                      >
                        v{{ feature.version }}
                      </span>
                    }
                  </div>

                  <mat-divider class="!my-3"></mat-divider>

                  <!-- Configuration summary -->

                  <div
                    class="
          grid
          grid-cols-2
          gap-3
        "
                  >
                    <!-- Navigation -->

                    <div>
                      <p
                        class="
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-gray-400
            "
                      >
                        Navigation
                      </p>

                      <div
                        class="
              mt-1
              flex
              items-center
              gap-1.5
            "
                      >
                        <mat-icon
                          class="
                !h-4
                !w-4
                !text-base
              "
                          [class.text-emerald-600]="feature.visibleInNavigation"
                          [class.text-gray-400]="!feature.visibleInNavigation"
                        >
                          {{ feature.visibleInNavigation ? 'visibility' : 'visibility_off' }}
                        </mat-icon>

                        <span
                          class="
                text-xs
                font-medium
                text-gray-700
              "
                        >
                          {{ feature.visibleInNavigation ? 'Visible' : 'Hidden' }}
                        </span>
                      </div>
                    </div>

                    <!-- New Users -->

                    <div>
                      <p
                        class="
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-gray-400
            "
                      >
                        New Users
                      </p>

                      <div
                        class="
              mt-1
              flex
              items-center
              gap-1.5
            "
                      >
                        <mat-icon
                          class="
                !h-4
                !w-4
                !text-base
              "
                          [class.text-emerald-600]="feature.allowNewUsers"
                          [class.text-gray-400]="!feature.allowNewUsers"
                        >
                          {{ feature.allowNewUsers ? 'person_add' : 'person_off' }}
                        </mat-icon>

                        <span
                          class="
                text-xs
                font-medium
                text-gray-700
              "
                        >
                          {{ feature.allowNewUsers ? 'Allowed' : 'Restricted' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Dependencies -->

                  @if (feature.dependencies.length > 0) {
                    <div class="mt-3">
                      <p
                        class="
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-gray-400
            "
                      >
                        Dependencies
                      </p>

                      <div
                        class="
              mt-1.5
              flex
              flex-wrap
              gap-1.5
            "
                      >
                        @for (dependency of feature.dependencies; track dependency) {
                          <span
                            class="
                  rounded
                  border
                  border-gray-200
                  bg-gray-50
                  px-2
                  py-0.5
                  font-mono
                  text-[10px]
                  text-gray-600
                "
                          >
                            {{ dependency }}
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Applications that currently depend on this application -->

@if (getEnabledDependents(feature.key).length > 0) {

  <div
    class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
  >

    <div class="flex items-start gap-2">

      <mat-icon
        class="!h-4 !w-4 !text-base text-amber-700"
      >
        account_tree
      </mat-icon>

      <div class="min-w-0">

        <p
          class="text-[10px] font-semibold uppercase tracking-wide text-amber-800"
        >
          Used by
        </p>

        <p class="mt-0.5 text-xs leading-5 text-amber-900">
          This application cannot be disabled while these applications
          are enabled.
        </p>

        <div class="mt-1.5 flex flex-wrap gap-1.5">

          @for (
            dependent of getEnabledDependents(feature.key);
            track dependent.key
          ) {

            <span
              class="rounded border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-medium text-amber-800"
            >
              {{ dependent.name }}
            </span>

          }

        </div>

      </div>

    </div>

  </div>

}
                </mat-card-content>

                <!-- =========================================================
         CARD ACTIONS
         ========================================================= -->

                <mat-card-actions
                  class="
        !flex
        !flex-wrap
        !items-center
        !gap-2
        !border-t
        !border-gray-100
        !px-4
        !py-2.5
      "
                >
                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="
                      feature.core || isSaving(feature.key) || feature.availability === 'enabled'
                    "
                    (click)="changeAvailability(feature, 'enabled')"
                    matTooltip="Enable this application"
                  >
                    <mat-icon> check_circle </mat-icon>

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
                    (click)="changeAvailability(feature, 'maintenance')"
                    matTooltip="Place this application into maintenance mode"
                  >
                    <mat-icon> build </mat-icon>

                    Maintenance
                  </button>

                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="
                      feature.core ||
                      isSaving(feature.key) ||
                      feature.availability === 'disabled' ||
                      getEnabledDependents(feature.key).length > 0
                    "
                    (click)="changeAvailability(feature, 'disabled')"
                    [matTooltip]="
                      getEnabledDependents(feature.key).length > 0
                        ? 'Cannot disable while enabled applications depend on this application'
                        : 'Disable this application'
                    "
                  >
                    <mat-icon> block </mat-icon>

                    Disable
                  </button>

                  <button
                    mat-button
                    type="button"
                    class="!ml-auto"
                    [disabled]="feature.core || isSaving(feature.key)"
                    (click)="toggleNavigationVisibility(feature)"
                  >
                    @if (isSaving(feature.key)) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <mat-icon>
                        {{ feature.visibleInNavigation ? 'visibility_off' : 'visibility' }}
                      </mat-icon>
                    }

                    {{ feature.visibleInNavigation ? 'Hide navigation' : 'Show navigation' }}
                  </button>
                </mat-card-actions>

                <!-- Saving indicator -->

                @if (isSaving(feature.key)) {
                  <div
                    class="
          flex
          items-center
          gap-2
          border-t
          border-gray-100
          bg-gray-50
          px-4
          py-2
          text-[11px]
          text-gray-500
        "
                  >
                    <mat-spinner diameter="14"></mat-spinner>

                    Applying configuration change...
                  </div>
                }
              }
            </mat-card>
          }
        </div>
      }
    </section>
  `,
})
export class ConfigurationApplicationsComponent {
  // ============================================================
  // SERVICES
  // ============================================================

  private readonly featureConfigService = inject(FeatureConfigService);

  private readonly confirmationService = inject(ConfirmationService);

  private readonly notificationService = inject(NotificationService);

  private readonly logger = inject(LoggerService);

  // ============================================================
  // SEARCH
  // ============================================================

  /**
   * Current application search term.
   *
   * Filtering is performed locally against the feature
   * configuration registry. No additional Firestore request
   * is required when the administrator searches.
   */
  readonly searchTerm = signal('');

  /**
   * Feature registry exposed to the template.
   *
   * FeatureConfigService remains the source of truth.
   */
  protected readonly features = this.featureConfigService.features;

  /**
   * Applications matching the current search term.
   *
   * Searches:
   * - Application name
   * - Feature key
   * - Description
   */
  readonly filteredFeatures = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.features();
    }

    return this.features().filter((feature) =>
      [feature.name, feature.key, feature.description ?? ''].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  });

  /**
   * Handle application search input.
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  /**
   * Clear the application search.
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  // ============================================================
  // SAVING STATE
  // ============================================================

  /**
   * Feature keys currently being modified.
   *
   * A Set is used so multiple independent cards can
   * theoretically be updated without blocking the
   * entire Applications screen.
   */
  private readonly savingKeys = signal<Set<string>>(new Set());

  /**
   * Return whether a feature is currently being modified.
   */
  protected isSaving(key: string): boolean {
    return this.savingKeys().has(key);
  }

  /**
   * Tracks application cards that have been manually expanded.
   *
   * Cards are collapsed by default.
   */
  readonly expandedKeys = signal<Set<string>>(new Set());

  protected isCollapsed(key: string): boolean {
    return !this.expandedKeys().has(key);
  }

  /**
   * Return the applications that are currently enabled and depend on
   * the supplied application.
   *
   * FeatureConfigService remains the source of truth for dependency
   * relationships and availability state.
   */
  protected getEnabledDependents(key: string): FeatureConfig[] {
    return this.featureConfigService.getEnabledDependents(key);
  }

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  /**
   * Return a human-readable availability label.
   */
  protected availabilityLabel(availability: FeatureAvailability): string {
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
   * Convert availability to an administrator-friendly
   * action label.
   */
  private availabilityActionLabel(availability: FeatureAvailability): string {
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

  // ============================================================
  // AVAILABILITY
  // ============================================================

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
    // Core applications cannot be disabled or
    // placed into maintenance.

    if (feature.core) {
      this.notificationService.warning(`${feature.name} is a protected core application.`);

      return;
    }

    // Nothing to change.

    if (feature.availability === availability) {
      return;
    }

    const operationLabel = this.availabilityActionLabel(availability);

    // ----------------------------------------------------------
    // Confirmation
    // ----------------------------------------------------------

    const confirmed = await this.confirmationService.confirm({
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

      destructive: availability === 'disabled',
    });

    // Administrator cancelled.

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

    // ----------------------------------------------------------
    // Saving state
    // ----------------------------------------------------------

    this.setSaving(feature.key, true);

    const operationId = this.logger.createOperationId();

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
      await this.featureConfigService.setAvailability(feature.key, availability);

      this.notificationService.success(
        `${feature.name} is now ${this.availabilityLabel(availability).toLowerCase()}.`,
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
        `Unable to update ${feature.name}. ` + `The previous configuration has been preserved.`,
      );
    } finally {
      this.setSaving(feature.key, false);
    }
  }

  // ============================================================
  // NAVIGATION VISIBILITY
  // ============================================================

  /**
   * Toggle whether an application appears in navigation.
   */
  protected async toggleNavigationVisibility(feature: FeatureConfig): Promise<void> {
    // Core applications cannot be hidden.

    if (feature.core) {
      this.notificationService.warning(`${feature.name} is a protected core application.`);

      return;
    }

    const visible = !feature.visibleInNavigation;

    this.setSaving(feature.key, true);

    const operationId = this.logger.createOperationId();

    this.logger.info(
      'ConfigurationApplicationsComponent',
      'Starting application navigation visibility change.',
      {
        operationId,
        featureKey: feature.key,
        previousVisibleInNavigation: feature.visibleInNavigation,
        requestedVisibleInNavigation: visible,
      },
    );

    try {
      await this.featureConfigService.setNavigationVisibility(feature.key, visible);

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

      this.notificationService.error(`Unable to update navigation visibility for ${feature.name}.`);
    } finally {
      this.setSaving(feature.key, false);
    }
  }

  // ============================================================
  // SAVING STATE MANAGEMENT
  // ============================================================

  /**
   * Mark a feature as being modified.
   */
  private setSaving(key: string, saving: boolean): void {
    this.savingKeys.update((current) => {
      const next = new Set(current);

      if (saving) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  }

  /**
   * Toggle the expanded/collapsed state of an application card.
   */
  protected toggleCard(key: string): void {
    this.expandedKeys.update((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /**
   * Safely convert an unknown caught error into
   * a loggable string.
   *
   * JavaScript catch variables are typed as unknown,
   * so we should never assume that the thrown value
   * is an Error.
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
