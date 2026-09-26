import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import {
  TaxPayConfiguration,
  TaxBracket,
} from '../../../../core/models/tax-pay-configuration.model';

import { TaxPayAdministrationService } from '../../../../core/services/tax-pay-administration.service';

import { TaxPayConfigurationSeedService } from '../../../../core/services/tax-pay-configuration-seed.service';

import { LoggerService } from '../../../../core/services/logger.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tax-pay-admin',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="w-full
             max-w-7xl
             mx-auto
             space-y-6
             p-4
             md:p-6 mt-10"
    >
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <section
        class="overflow-hidden
               rounded-2xl
               border border-slate-200
               bg-white
               shadow-sm"
      >
        <div
          class="flex flex-col
                 gap-4
                 bg-[#2a835f]
                 p-6
                 text-white
                 md:flex-row
                 md:items-center
                 md:justify-between"
        >
          <div
            class="flex items-start
                   gap-4"
          >
            <div class="group relative flex flex-col items-center">
  <div
    class="
      flex h-12 w-12 shrink-0
      items-center justify-center
      rounded-xl bg-white/15
      transition
      hover:bg-white/25
      cursor-pointer
    "
    routerLink="/tax-calculator"
  >
    <mat-icon>calculate</mat-icon>
  </div>

  <span
    class="
      pointer-events-none
      absolute
      top-full
      mt-2
      whitespace-nowrap
      rounded-md
      bg-gray-900
      px-2
      py-1
      text-xs
      text-white
      opacity-0
      transition-opacity
      duration-200
      group-hover:opacity-100
      z-50
    "
  >
    Go to Tax Calculator
  </span>
</div>

            <div>

              <p
                class="mt-1
                       max-w-2xl
                       text-sm
                       leading-6
                       text-white/80"
              >
                Manage tax-year configurations, federal and state rules, payroll rates,
                self-employment rules, local taxes, and pay frequencies.
              </p>
            </div>
          </div>

          <div
            class="inline-flex
                   items-center
                   gap-2
                   self-start
                   rounded-full
                   bg-white/15
                   px-3
                   py-2
                   text-sm"
          >
            <span
              class="h-2
                     w-2
                     rounded-full
                     bg-green-300"
            ></span>

            <span>
              {{ activeYear() || 'No active year' }}
            </span>
          </div>
        </div>
      </section>

      <!-- =========================================================
           LOADING
           ========================================================= -->

      @if (loading()) {
        <section
          class="flex
                 items-center
                 justify-center
                 gap-3
                 rounded-2xl
                 border border-slate-200
                 bg-white
                 p-10
                 shadow-sm"
        >
          <mat-spinner diameter="28" />

          <span
            class="text-sm
                   text-slate-500"
          >
            Loading tax configurations...
          </span>
        </section>
      }

      <!-- =========================================================
           ERROR
           ========================================================= -->

      @if (error()) {
        <section
          class="rounded-2xl
                 border border-red-200
                 bg-red-50
                 p-5"
        >
          <div
            class="flex
                   items-start
                   gap-3"
          >
            <mat-icon class="!text-red-600"> error_outline </mat-icon>

            <div>
              <p
                class="font-semibold
                       text-red-800"
              >
                Unable to load tax configuration
              </p>

              <p
                class="mt-1
                       text-sm
                       text-red-700"
              >
                {{ error() }}
              </p>
            </div>
          </div>
        </section>
      }

      @if (!loading()) {
        <mat-tab-group
          animationDuration="0ms"
          class="overflow-hidden
                 rounded-2xl
                 border border-slate-200
                 bg-white
                 shadow-sm"
        >
          <!-- =====================================================
               OVERVIEW
               ===================================================== -->

          <mat-tab label="Overview">
            <div
              class="space-y-6
                     p-6"
            >
              <div
                class="grid
                       grid-cols-1
                       gap-4
                       md:grid-cols-3"
              >
                <div
                  class="rounded-xl
                         border border-slate-200
                         p-5"
                >
                  <p
                    class="text-sm
                           text-slate-500"
                  >
                    Configured Tax Years
                  </p>

                  <p
                    class="mt-2
                           text-3xl
                           font-semibold
                           text-slate-900"
                  >
                    {{ configurations().length }}
                  </p>
                </div>

                <div
                  class="rounded-xl
                         border border-slate-200
                         p-5"
                >
                  <p
                    class="text-sm
                           text-slate-500"
                  >
                    Active Tax Year
                  </p>

                  <p
                    class="mt-2
                           text-3xl
                           font-semibold
                           text-slate-900"
                  >
                    {{ activeYear() || '—' }}
                  </p>
                </div>

                <div
                  class="rounded-xl
                         border border-slate-200
                         p-5"
                >
                  <p
                    class="text-sm
                           text-slate-500"
                  >
                    Local Tax Records
                  </p>

                  <p
                    class="mt-2
                           text-3xl
                           font-semibold
                           text-slate-900"
                  >
                    {{ localTaxCount() }}
                  </p>
                </div>
              </div>

              @if (activeConfiguration(); as configuration) {
                <div
                  class="rounded-xl
                         border border-green-200
                         bg-green-50
                         p-5"
                >
                  <div
                    class="flex
                           items-start
                           gap-3"
                  >
                    <mat-icon class="!text-green-600"> check_circle </mat-icon>

                    <div>
                      <p
                        class="font-semibold
                               text-green-900"
                      >
                        Active tax configuration:
                        {{ configuration.taxYear }}
                      </p>

                      <p
                        class="mt-1
                               text-sm
                               leading-6
                               text-green-800"
                      >
                        This configuration is currently marked active and can be consumed by the Tax
                        & Pay calculation layer.
                      </p>
                    </div>
                  </div>
                </div>
              } @else {
                <div
                  class="rounded-xl
                         border border-amber-200
                         bg-amber-50
                         p-5"
                >
                  <div
                    class="flex
                           items-start
                           gap-3"
                  >
                    <mat-icon class="!text-amber-600"> warning </mat-icon>

                    <div>
                      <p
                        class="font-semibold
                               text-amber-900"
                      >
                        No active tax configuration
                      </p>

                      <p
                        class="mt-1
                               text-sm
                               text-amber-800"
                      >
                        Create or activate a tax-year configuration before using the configurable
                        tax engine.
                      </p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               TAX YEARS
               ===================================================== -->

          <mat-tab label="Tax Years">
            <div
              class="space-y-5
                     p-6"
            >
              <div
                class="flex flex-col
                       gap-3
                       md:flex-row
                       md:items-center
                       md:justify-between"
              >
                <div>
                  <h2
                    class="text-lg
                           font-semibold
                           text-slate-900"
                  >
                    Tax Year Configurations
                  </h2>

                  <p
                    class="mt-1
                           text-sm
                           text-slate-500"
                  >
                    Select a tax year to edit its configuration.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    mat-stroked-button
                    type="button"
                    class="!h-10 !min-h-10 !rounded-full"
                    (click)="refresh()"
                    [disabled]="loading() || isInitializing()"
                  >
                    <mat-icon class="!m-0"> refresh </mat-icon>

                    <span class="ml-1"> Refresh </span>
                  </button>

                  <button
                    mat-flat-button
                    type="button"
                    class="!h-10 !min-h-10 !rounded-full"
                    (click)="initialize2026Configuration()"
                    [disabled]="isInitializing() || saving()"
                  >
                    @if (isInitializing()) {
                      <mat-spinner diameter="18" class="!m-0" />
                    } @else {
                      <mat-icon class="!m-0"> add_circle </mat-icon>
                    }

                    <span class="ml-1">
                      {{ isInitializing() ? 'Initializing...' : 'Initialize 2026' }}
                    </span>
                  </button>
                </div>
              </div>

              @if (initializationMessage()) {
                <div
                  class="rounded-xl
                         border border-green-200
                         bg-green-50
                         p-4"
                  role="status"
                >
                  <div class="flex items-start gap-3">
                    <mat-icon class="!text-green-600"> check_circle </mat-icon>

                    <p
                      class="text-sm
                             font-medium
                             text-green-800"
                    >
                      {{ initializationMessage() }}
                    </p>
                  </div>
                </div>
              }

              @if (initializationError()) {
                <div
                  class="rounded-xl
                         border border-red-200
                         bg-red-50
                         p-4"
                  role="alert"
                >
                  <div class="flex items-start gap-3">
                    <mat-icon class="!text-red-600"> error_outline </mat-icon>

                    <div>
                      <p
                        class="font-semibold
                               text-red-800"
                      >
                        Unable to initialize tax configuration
                      </p>

                      <p
                        class="mt-1
                               text-sm
                               text-red-700"
                      >
                        {{ initializationError() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              @if (configurations().length === 0) {
                <div
                  class="rounded-xl
                         border border-dashed
                         border-slate-300
                         p-10
                         text-center"
                >
                  <mat-icon
                    class="!h-12
                           !w-12
                           !text-5xl
                           !text-slate-400"
                  >
                    event_busy
                  </mat-icon>

                  <p
                    class="mt-4
                           font-semibold
                           text-slate-900"
                  >
                    No tax years configured
                  </p>

                  <p
                    class="mt-1
                           text-sm
                           text-slate-500"
                  >
                    A tax configuration must be created before it can be managed.
                  </p>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table
                    class="w-full
                           min-w-[650px]
                           border-collapse"
                  >
                    <thead>
                      <tr
                        class="border-b
                               border-slate-200
                               text-left"
                      >
                        <th
                          class="px-4
                                 py-3
                                 text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wide
                                 text-slate-500"
                        >
                          Tax Year
                        </th>

                        <th
                          class="px-4
                                 py-3
                                 text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wide
                                 text-slate-500"
                        >
                          State
                        </th>

                        <th
                          class="px-4
                                 py-3
                                 text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wide
                                 text-slate-500"
                        >
                          Local Taxes
                        </th>

                        <th
                          class="px-4
                                 py-3
                                 text-xs
                                 font-semibold
                                 uppercase
                                 tracking-wide
                                 text-slate-500"
                        >
                          Status
                        </th>

                        <th
                          class="px-4
                                 py-3"
                        ></th>
                      </tr>
                    </thead>

                    <tbody>
                      @for (configuration of configurations(); track configuration.id) {
                        <tr
                          class="border-b
                                 border-slate-100
                                 hover:bg-slate-50"
                        >
                          <td
                            class="px-4
                                   py-4
                                   font-semibold
                                   text-slate-900"
                          >
                            {{ configuration.taxYear }}
                          </td>

                          <td
                            class="px-4
                                   py-4
                                   text-sm
                                   text-slate-600"
                          >
                            {{ configuration.state.stateName }}
                            ({{ configuration.state.stateCode }})
                          </td>

                          <td
                            class="px-4
                                   py-4
                                   text-sm
                                   text-slate-600"
                          >
                            {{ configuration.localTaxes.length }}
                          </td>

                          <td
                            class="px-4
                                   py-4"
                          >
                            @if (configuration.active) {
                              <span
                                class="inline-flex
                                       items-center
                                       gap-2
                                       rounded-full
                                       bg-green-100
                                       px-3
                                       py-1
                                       text-xs
                                       font-semibold
                                       text-green-800"
                              >
                                <span
                                  class="h-2
                                         w-2
                                         rounded-full
                                         bg-green-500"
                                ></span>

                                Active
                              </span>
                            } @else {
                              <span
                                class="inline-flex
                                       rounded-full
                                       bg-slate-100
                                       px-3
                                       py-1
                                       text-xs
                                       font-semibold
                                       text-slate-600"
                              >
                                Inactive
                              </span>
                            }
                          </td>

                          <td
                            class="px-4
                                   py-4
                                   text-right"
                          >
                            <button
                              mat-stroked-button
                              type="button"
                              (click)="selectConfiguration(configuration)"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               FEDERAL
               ===================================================== -->

          <mat-tab label="Federal">
            <div
              class="space-y-6
                     p-6"
            >
              <div>
                <h2
                  class="text-lg
                         font-semibold
                         text-slate-900"
                >
                  Federal Tax Configuration
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-slate-500"
                >
                  Configure federal deductions, brackets, and credits for the selected tax year.
                </p>
              </div>

              @if (selectedConfiguration(); as configuration) {
                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         md:grid-cols-3"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> Standard Deduction — Single </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.federal.standardDeductionSingle"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Standard Deduction — Married Jointly </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.federal.standardDeductionMarriedJointly"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Standard Deduction — Head of Household </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.federal.standardDeductionHeadOfHousehold"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         md:grid-cols-2"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> Child Tax Credit </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.federal.childTaxCredit"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Additional Child Tax Credit </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.federal.additionalChildTaxCredit"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="flex
                         justify-end"
                >
                  <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                    @if (saving()) {
                      <mat-spinner diameter="18" />
                    } @else {
                      <mat-icon> save </mat-icon>
                    }

                    <span class="ml-2"> Save Federal Configuration </span>
                  </button>
                </div>
              } @else {
                <ng-container *ngTemplateOutlet="selectYearMessage" />
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               STATE & LOCAL
               ===================================================== -->

          <mat-tab label="State & Local">
            <div
              class="space-y-6
                     p-6"
            >
              <div>
                <h2
                  class="text-lg
                         font-semibold
                         text-slate-900"
                >
                  State & Local Taxes
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-slate-500"
                >
                  Manage state brackets and county/local tax configuration.
                </p>
              </div>

              @if (selectedConfiguration(); as configuration) {
                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         md:grid-cols-3"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> State Code </mat-label>

                    <input matInput maxlength="2" [(ngModel)]="configuration.state.stateCode" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> State Name </mat-label>

                    <input matInput [(ngModel)]="configuration.state.stateName" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Personal Exemption </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.state.personalExemption"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="flex
                         items-center
                         justify-between
                         rounded-xl
                         border
                         border-slate-200
                         p-4"
                >
                  <div>
                    <p
                      class="font-medium
                             text-slate-900"
                    >
                      Local Tax Support
                    </p>

                    <p
                      class="mt-1
                             text-sm
                             text-slate-500"
                    >
                      Enable county/local tax calculations for this state.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    class="h-5 w-5"
                    [(ngModel)]="configuration.state.localTaxSupported"
                  />
                </div>

                <div
                  class="flex
                         justify-end"
                >
                  <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                    <mat-icon> save </mat-icon>

                    Save State Configuration
                  </button>
                </div>
              } @else {
                <ng-container *ngTemplateOutlet="selectYearMessage" />
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               W2 / FICA
               ===================================================== -->

          <mat-tab label="W-2 / FICA">
            <div
              class="space-y-6
                     p-6"
            >
              <div>
                <h2
                  class="text-lg
                         font-semibold
                         text-slate-900"
                >
                  W-2 & FICA
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-slate-500"
                >
                  Configure Social Security and Medicare parameters used by W-2 calculations.
                </p>
              </div>

              @if (selectedConfiguration(); as configuration) {
                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         md:grid-cols-2"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> Social Security Rate </mat-label>

                    <input
                      matInput
                      type="number"
                      step="0.0001"
                      [(ngModel)]="configuration.fica.socialSecurityRate"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Social Security Wage Base </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.fica.socialSecurityWageBase"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Medicare Rate </mat-label>

                    <input
                      matInput
                      type="number"
                      step="0.0001"
                      [(ngModel)]="configuration.fica.medicareRate"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Additional Medicare Rate </mat-label>

                    <input
                      matInput
                      type="number"
                      step="0.0001"
                      [(ngModel)]="configuration.fica.additionalMedicareRate"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Additional Medicare Threshold — Single </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.fica.additionalMedicareThresholdSingle"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Additional Medicare Threshold — Married </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.fica.additionalMedicareThresholdMarriedJointly"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="flex
                         justify-end"
                >
                  <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                    <mat-icon> save </mat-icon>

                    Save FICA Configuration
                  </button>
                </div>
              } @else {
                <ng-container *ngTemplateOutlet="selectYearMessage" />
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               1099
               ===================================================== -->

          <mat-tab label="1099 / Self-Employment">
            <div
              class="space-y-6
                     p-6"
            >
              <div>
                <h2
                  class="text-lg
                         font-semibold
                         text-slate-900"
                >
                  1099 & Self-Employment
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-slate-500"
                >
                  Configure self-employment tax parameters used for contractor calculations.
                </p>
              </div>

              @if (selectedConfiguration(); as configuration) {
                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         md:grid-cols-3"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> Self-Employment Tax Rate </mat-label>

                    <input
                      matInput
                      type="number"
                      step="0.0001"
                      [(ngModel)]="configuration.selfEmployment.selfEmploymentTaxRate"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Social Security Wage Base </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.selfEmployment.socialSecurityWageBase"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> SE Tax Deduction Rate </mat-label>

                    <input
                      matInput
                      type="number"
                      step="0.0001"
                      [(ngModel)]="configuration.selfEmployment.seTaxDeductionRate"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="flex
                         justify-end"
                >
                  <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                    <mat-icon> save </mat-icon>

                    Save 1099 Configuration
                  </button>
                </div>
              } @else {
                <ng-container *ngTemplateOutlet="selectYearMessage" />
              }
            </div>
          </mat-tab>

          <!-- =====================================================
               PAY FREQUENCIES
               ===================================================== -->

          <mat-tab label="Pay Frequencies">
            <div
              class="space-y-6
                     p-6"
            >
              <div>
                <h2
                  class="text-lg
                         font-semibold
                         text-slate-900"
                >
                  Pay Frequency Configuration
                </h2>

                <p
                  class="mt-1
                         text-sm
                         text-slate-500"
                >
                  Configure the number of pay periods used when converting annual income to periodic
                  estimates.
                </p>
              </div>

              @if (selectedConfiguration(); as configuration) {
                <div
                  class="grid
                         grid-cols-1
                         gap-5
                         sm:grid-cols-2
                         lg:grid-cols-3"
                >
                  <mat-form-field appearance="outline">
                    <mat-label> Weekly </mat-label>

                    <input matInput type="number" [(ngModel)]="configuration.payFrequency.weekly" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Biweekly </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.payFrequency.biweekly"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Semimonthly </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.payFrequency.semimonthly"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Monthly </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.payFrequency.monthly"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Quarterly </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.payFrequency.quarterly"
                    />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label> Annually </mat-label>

                    <input
                      matInput
                      type="number"
                      [(ngModel)]="configuration.payFrequency.annually"
                    />
                  </mat-form-field>
                </div>

                <div
                  class="flex
                         justify-end"
                >
                  <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                    <mat-icon> save </mat-icon>

                    Save Pay Frequencies
                  </button>
                </div>
              } @else {
                <ng-container *ngTemplateOutlet="selectYearMessage" />
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }

      <!-- =========================================================
           SELECTED CONFIGURATION
           ========================================================= -->

      @if (selectedConfiguration(); as configuration) {
        <section
          class="rounded-2xl
                 border border-slate-200
                 bg-white
                 p-6
                 shadow-sm"
        >
          <div
            class="flex flex-col
                   gap-4
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >
            <div>
              <p
                class="text-sm
                       text-slate-500"
              >
                Editing configuration
              </p>

              <h3
                class="mt-1
                       text-xl
                       font-semibold
                       text-slate-900"
              >
                Tax Year {{ configuration.taxYear }}
              </h3>
            </div>

            <div
              class="flex
         flex-wrap
         gap-2"
            >
              @if (configuration.active) {
                <button
                  mat-stroked-button
                  type="button"
                  (click)="deactivateSelected()"
                  [disabled]="saving()"
                >
                  <mat-icon> pause_circle </mat-icon>

                  Deactivate
                </button>
              } @else {
                <button
                  mat-stroked-button
                  type="button"
                  (click)="activateSelected()"
                  [disabled]="saving()"
                >
                  <mat-icon> check_circle </mat-icon>

                  Set Active
                </button>
              }

              <button mat-flat-button type="button" (click)="save()" [disabled]="saving()">
                <mat-icon> save </mat-icon>

                Save Configuration
              </button>

              @if (!configuration.active) {
                <button
                  mat-stroked-button
                  type="button"
                  class="!text-red-600"
                  (click)="deleteSelected()"
                  [disabled]="saving()"
                >
                  <mat-icon> delete </mat-icon>

                  Delete
                </button>
              }
            </div>
          </div>
        </section>
      }
    </div>

    <!-- ===========================================================
         SELECT YEAR MESSAGE
         =========================================================== -->

    <ng-template #selectYearMessage>
      <div
        class="rounded-xl
               border border-dashed
               border-slate-300
               p-10
               text-center"
      >
        <mat-icon
          class="!text-4xl
                 !text-slate-400"
        >
          calendar_month
        </mat-icon>

        <p
          class="mt-3
                 font-semibold
                 text-slate-900"
        >
          Select a tax year
        </p>

        <p
          class="mt-1
                 text-sm
                 text-slate-500"
        >
          Select a configuration from the Tax Years tab before editing its settings.
        </p>
      </div>
    </ng-template>
  `,

  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      :host ::ng-deep .mat-mdc-tab-body-content {
        overflow-x: hidden;
      }

      :host ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }

      :host ::ng-deep .mat-mdc-button,
      :host ::ng-deep .mat-mdc-unelevated-button,
      :host ::ng-deep .mat-mdc-outlined-button {
        align-items: center;
      }

      :host ::ng-deep .mat-mdc-button .mat-icon,
      :host ::ng-deep .mat-mdc-unelevated-button .mat-icon,
      :host ::ng-deep .mat-mdc-outlined-button .mat-icon {
        margin: 0;
      }

      :host ::ng-deep .mat-mdc-button .mat-mdc-progress-spinner,
      :host ::ng-deep .mat-mdc-unelevated-button .mat-mdc-progress-spinner {
        margin: 0;
      }
    `,
  ],
})
export class TaxPayAdminComponent implements OnInit {
  private readonly administrationService = inject(TaxPayAdministrationService);

  private readonly seedService = inject(TaxPayConfigurationSeedService);

  private readonly logger = inject(LoggerService);

  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly isInitializing = signal(false);

  protected readonly initializationMessage = signal<string | null>(null);

  protected readonly initializationError = signal<string | null>(null);

  protected readonly configurations = signal<TaxPayConfiguration[]>([]);

  protected readonly selectedConfiguration = signal<TaxPayConfiguration | null>(null);

  protected readonly activeConfiguration = computed(
    () => this.configurations().find((configuration) => configuration.active) ?? null,
  );

  protected readonly activeYear = computed(() => this.activeConfiguration()?.taxYear ?? null);

  protected readonly localTaxCount = computed(() =>
    this.configurations().reduce(
      (total, configuration) => total + configuration.localTaxes.length,
      0,
    ),
  );

  /**
     * Page title service.
     */
    private readonly pageTitleService = inject(PageTitleService);

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Tax & Pay Administration');
    await this.load();
  }

  protected async refresh(): Promise<void> {
    await this.load();
  }

  protected selectConfiguration(configuration: TaxPayConfiguration): void {
    this.selectedConfiguration.set(this.cloneConfiguration(configuration));
  }

  protected async save(): Promise<void> {
    const configuration = this.selectedConfiguration();

    if (!configuration) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      configuration.updatedAt = new Date().toISOString();

      await this.administrationService.save(configuration);

      await this.load();

      const refreshed = this.configurations().find((item) => item.id === configuration.id);

      if (refreshed) {
        this.selectedConfiguration.set(this.cloneConfiguration(refreshed));
      }
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async activateSelected(): Promise<void> {
    const selected = this.selectedConfiguration();

    if (!selected) {
      return;
    }

    if (selected.active) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.administrationService.setActive(selected.taxYear);

      await this.load();

      const refreshed = this.configurations().find((item) => item.id === selected.id);

      if (refreshed) {
        this.selectedConfiguration.set(this.cloneConfiguration(refreshed));
      }
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const configurations = await this.administrationService.list();

      this.configurations.set(configurations);

      const selected = this.selectedConfiguration();

      if (selected) {
        const refreshed = configurations.find((configuration) => configuration.id === selected.id);

        this.selectedConfiguration.set(refreshed ? this.cloneConfiguration(refreshed) : null);
      }
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async initialize2026Configuration(): Promise<void> {
    if (this.isInitializing()) {
      return;
    }

    this.isInitializing.set(true);
    this.initializationMessage.set(null);
    this.initializationError.set(null);
    this.error.set(null);

    try {
      const configuration = await this.seedService.seedAndActivate2026();

      this.initializationMessage.set(
        configuration.taxYear === 2026
          ? '2026 tax configuration was created and activated successfully.'
          : 'Tax configuration was initialized successfully.',
      );

      await this.load();

      const refreshed = this.configurations().find((item) => item.id === configuration.id);

      this.selectedConfiguration.set(refreshed ? this.cloneConfiguration(refreshed) : null);
    } catch (error) {
      const message = this.getErrorMessage(error);

      this.initializationError.set(message);

      this.logger.error(
        'TaxPayAdminComponent',
        'Unable to initialize 2026 tax configuration.',
        error,
      );
    } finally {
      this.isInitializing.set(false);
    }
  }

  protected async deactivateSelected(): Promise<void> {
    const selected = this.selectedConfiguration();

    if (!selected || !selected.active) {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate the ${selected.taxYear} tax configuration?\n\n` +
        `The public tax calculator will no longer have an active ` +
        `configuration until another tax year is activated.`,
    );

    if (!confirmed) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.administrationService.deactivate(selected.taxYear);

      await this.load();

      const refreshed = this.configurations().find((item) => item.id === selected.id);

      this.selectedConfiguration.set(refreshed ? this.cloneConfiguration(refreshed) : null);
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteSelected(): Promise<void> {
    const selected = this.selectedConfiguration();

    if (!selected) {
      return;
    }

    if (selected.active) {
      this.error.set('Deactivate the configuration before deleting it.');

      return;
    }

    const confirmed = window.confirm(
      `Delete the ${selected.taxYear} tax configuration?\n\n` + `This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.administrationService.delete(selected.taxYear);

      this.selectedConfiguration.set(null);

      await this.load();

      this.initializationMessage.set(`${selected.taxYear} tax configuration was deleted.`);
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private cloneConfiguration(configuration: TaxPayConfiguration): TaxPayConfiguration {
    return structuredClone(configuration);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred.';
  }
}
