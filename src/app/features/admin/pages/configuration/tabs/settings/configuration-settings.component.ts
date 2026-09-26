import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';

import {
  ConfigurationFeature,
  ConfigurationFeatureType,
} from '../../models/configuration-feature.model';

import { CONFIGURATION_FEATURES } from '../../configuration-feature.registry';

import {
  CONFIGURATION_APPLICATIONS,
} from '../../../../../../core/registries/configuration-application.registry';

@Component({
  selector: 'app-configuration-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- ============================================================
           SETTINGS HEADER
           ============================================================ -->

      <section
        class="
          rounded-2xl
          border border-slate-200
          bg-white
          p-5
          shadow-sm
        "
      >
        <div>
          <h2
            class="
              text-xl
              font-semibold
              text-slate-900
            "
          >
            Settings
          </h2>

          <p
            class="
              mt-1
              text-sm
              leading-6
              text-slate-500
            "
          >
            Manage application-specific configuration
            and platform settings from one place.
          </p>
        </div>

        <!-- ==========================================================
             SEARCH / FILTERS
             ========================================================== -->

        <div
          class="
            mt-6
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-[minmax(0,1fr)_16rem_14rem]
          "
        >

          <!-- Search -->
          <div>
            <label
              for="settings-search"
              class="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Search settings
            </label>

            <div class="relative">

              <mat-icon
                class="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              >
                search
              </mat-icon>

              <input
                id="settings-search"
                type="search"
                autocomplete="off"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  py-2.5
                  pl-10
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#2a835f]
                  focus:ring-2
                  focus:ring-[#2a835f]/20
                "
                placeholder="Search settings..."
                [value]="searchTerm()"
                (input)="
                  searchTerm.set(
                    $any($event.target).value
                  )
                "
              />

            </div>
          </div>

          <!-- Application -->
          <div>
            <label
              for="settings-application"
              class="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Application
            </label>

            <select
              id="settings-application"
              class="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                outline-none
                focus:border-[#2a835f]
                focus:ring-2
                focus:ring-[#2a835f]/20
              "
              [value]="selectedApplication()"
              (change)="
                selectedApplication.set(
                  $any($event.target).value
                )
              "
            >
              <option value="all">
                All Applications
              </option>

              @for (
                application of applications();
                track application.key
              ) {
                <option
                  [value]="application.key"
                >
                  {{ application.name }}
                </option>
              }
            </select>
          </div>

          <!-- Setting Type -->
          <div>
            <label
              for="settings-type"
              class="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Setting Type
            </label>

            <select
              id="settings-type"
              class="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                outline-none
                focus:border-[#2a835f]
                focus:ring-2
                focus:ring-[#2a835f]/20
              "
              [value]="selectedType()"
              (change)="
                selectedType.set(
                  $any($event.target).value
                )
              "
            >
              <option value="all">
                All Settings
              </option>

              <option value="settings">
                Settings
              </option>

              <option value="security">
                Security
              </option>

              <option value="maintenance">
                Maintenance
              </option>
            </select>
          </div>

        </div>

        <!-- Filter summary -->
        @if (hasFilters()) {
          <div
            class="
              mt-4
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              border-t
              border-slate-100
              pt-4
            "
          >

            <p class="text-sm text-slate-500">
              Showing
              <span
                class="
                  font-semibold
                  text-slate-800
                "
              >
                {{ filteredFeatures().length }}
              </span>

              {{
                filteredFeatures().length === 1
                  ? 'setting'
                  : 'settings'
              }}
            </p>

            <button
              mat-button
              type="button"
              (click)="clearFilters()"
            >
              <mat-icon>
                clear
              </mat-icon>

              Clear filters
            </button>

          </div>
        }

      </section>


      <!-- ============================================================
           NO RESULTS
           ============================================================ -->

      @if (filteredFeatures().length === 0) {

        <section
          class="
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-slate-50
            p-12
            text-center
          "
        >

          <mat-icon
            class="
              !h-12
              !w-12
              !text-5xl
              text-slate-400
            "
          >
            search_off
          </mat-icon>

          <h3
            class="
              mt-4
              text-lg
              font-semibold
              text-slate-800
            "
          >
            No settings found
          </h3>

          <p
            class="
              mx-auto
              mt-2
              max-w-md
              text-sm
              leading-6
              text-slate-500
            "
          >
            No settings match the current search
            or filter criteria.
          </p>

          @if (hasFilters()) {
            <button
              mat-stroked-button
              type="button"
              class="mt-5"
              (click)="clearFilters()"
            >
              <mat-icon>
                filter_alt_off
              </mat-icon>

              Clear filters
            </button>
          }

        </section>

      } @else {

        <!-- ============================================================
             SETTINGS BY APPLICATION
             ============================================================ -->

        <div class="space-y-8">

          @for (
            group of groupedFeatures();
            track group.key
          ) {

            <section>

              <!-- Application heading -->
              <div
                class="
                  mb-4
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div
                  class="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    class="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#2a835f]/10
                    "
                  >
                    <mat-icon
                      class="text-[#2a835f]"
                    >
                      apps
                    </mat-icon>
                  </div>

                  <div>
                    <h3
                      class="
                        text-lg
                        font-semibold
                        text-slate-900
                      "
                    >
                      {{ group.name }}
                    </h3>

                    <p
                      class="
                        text-sm
                        text-slate-500
                      "
                    >
                      {{ group.features.length }}
                      {{
                        group.features.length === 1
                          ? 'setting'
                          : 'settings'
                      }}
                    </p>
                  </div>

                </div>

                <span
                  class="
                    hidden
                    rounded-full
                    bg-slate-100
                    px-3
                    py-1
                    text-xs
                    font-medium
                    text-slate-600
                    sm:inline-flex
                  "
                >
                  {{ group.key }}
                </span>

              </div>


              <!-- Settings cards -->
              <div
                class="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >

                @for (
                  feature of group.features;
                  track feature.key
                ) {

                  <button
                    type="button"
                    class="
                      group
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      text-left
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:border-slate-300
                      hover:shadow-md
                      disabled:cursor-not-allowed
                      disabled:opacity-70
                    "
                    [disabled]="!feature.route"
                    (click)="openSetting(feature)"
                  >

                    <div
                      class="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >

                      <div
                        class="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-100
                        "
                      >
                        <mat-icon
                          class="text-slate-700"
                        >
                          {{ feature.icon }}
                        </mat-icon>
                      </div>

                      <span
                        class="
                          rounded-full
                          bg-slate-100
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                          text-slate-600
                        "
                      >
                        {{
                          featureTypeLabel(
                            feature.type
                          )
                        }}
                      </span>

                    </div>


                    <h4
                      class="
                        mt-4
                        text-base
                        font-semibold
                        text-slate-900
                        transition-colors
                        group-hover:text-[#2a835f]
                      "
                    >
                      {{ feature.name }}
                    </h4>


                    <p
                      class="
                        mt-2
                        text-sm
                        leading-6
                        text-slate-500
                      "
                    >
                      {{ feature.description }}
                    </p>


                    <div
                      class="
                        mt-4
                        flex
                        items-center
                        gap-1
                        text-sm
                        font-medium
                        text-slate-600
                      "
                    >

                      @if (feature.route) {

                        Configure

                        <mat-icon
                          class="
                            !h-4
                            !w-4
                            !text-base
                            transition-transform
                            group-hover:translate-x-1
                          "
                        >
                          arrow_forward
                        </mat-icon>

                      } @else {

                        Coming soon

                      }

                    </div>

                  </button>

                }

              </div>

            </section>

          }

        </div>

      }

    </div>
  `,
})
export class ConfigurationSettingsComponent {

  // ================================================================
  // DEPENDENCIES
  // ================================================================

  private readonly router = inject(Router);


  // ================================================================
  // CONFIGURATION FEATURES
  //
  // Settings is intentionally limited to configuration-oriented
  // feature types. Operational Monitoring, Knowledge Center,
  // Applications, and other Control Center capabilities remain
  // separate tabs/capabilities.
  // ================================================================

  protected readonly configurationFeatures =
    CONFIGURATION_FEATURES.filter(
      (feature) =>
        feature.type === 'settings' ||
        feature.type === 'security' ||
        feature.type === 'maintenance',
    );


  // ================================================================
  // CANONICAL APPLICATION LIST
  //
  // The application registry is the source of truth for the
  // application selector. This prevents the Settings tab from
  // creating its own independent application list.
  // ================================================================

  protected readonly applications = computed(() =>
    CONFIGURATION_APPLICATIONS
      .filter(
        (application) =>
          application.enabled,
      )
      .map((application) => ({
        key: application.key,
        name: application.name,
      })),
  );


  // ================================================================
  // FILTER STATE
  // ================================================================

  protected readonly searchTerm =
    signal('');

  protected readonly selectedApplication =
    signal('all');

  protected readonly selectedType =
    signal<
      ConfigurationFeatureType | 'all'
    >('all');


  // ================================================================
  // FILTERED FEATURES
  // ================================================================

  protected readonly filteredFeatures =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const application =
        this.selectedApplication();

      const type =
        this.selectedType();

      return this.configurationFeatures.filter(
        (feature) => {

          // ----------------------------------------------------------
          // Application filter
          // ----------------------------------------------------------

          const matchesApplication =
            application === 'all' ||
            feature.applicationKey ===
              application;

          if (!matchesApplication) {
            return false;
          }


          // ----------------------------------------------------------
          // Type filter
          // ----------------------------------------------------------

          const matchesType =
            type === 'all' ||
            feature.type === type;

          if (!matchesType) {
            return false;
          }


          // ----------------------------------------------------------
          // Search filter
          // ----------------------------------------------------------

          if (!search) {
            return true;
          }

          const searchableText = [
            feature.applicationName,
            feature.applicationKey,
            feature.name,
            feature.description,
            feature.type,
            ...feature.keywords,
          ]
            .join(' ')
            .toLowerCase();

          return searchableText.includes(
            search,
          );
        },
      );
    });


  // ================================================================
  // GROUP SETTINGS BY APPLICATION
  // ================================================================

  protected readonly groupedFeatures =
    computed(() => {

      const groups =
        new Map<
          string,
          {
            key: string;
            name: string;
            features: ConfigurationFeature[];
          }
        >();

      for (
        const feature of
        this.filteredFeatures()
      ) {

        const existing =
          groups.get(
            feature.applicationKey,
          );

        if (existing) {

          existing.features.push(
            feature,
          );

          continue;
        }

        groups.set(
          feature.applicationKey,
          {
            key:
              feature.applicationKey,

            name:
              feature.applicationName,

            features: [
              feature,
            ],
          },
        );
      }

      return Array.from(
        groups.values(),
      );
    });


  // ================================================================
  // FILTER STATE
  // ================================================================

  protected readonly hasFilters =
    computed(() =>
      Boolean(
        this.searchTerm().trim(),
      ) ||
      this.selectedApplication() !==
        'all' ||
      this.selectedType() !==
        'all',
    );


  // ================================================================
  // NAVIGATION
  // ================================================================

  protected openSetting(
    feature: ConfigurationFeature,
  ): void {

    if (!feature.route) {
      return;
    }

    void this.router.navigateByUrl(
      feature.route,
    );
  }


  // ================================================================
  // DISPLAY HELPERS
  // ================================================================

  protected featureTypeLabel(
    type: ConfigurationFeatureType,
  ): string {

    return type
      .replace(/-/g, ' ')
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      );
  }


  // ================================================================
  // RESET FILTERS
  // ================================================================

  protected clearFilters(): void {

    this.searchTerm.set('');

    this.selectedApplication.set(
      'all',
    );

    this.selectedType.set(
      'all',
    );
  }
}