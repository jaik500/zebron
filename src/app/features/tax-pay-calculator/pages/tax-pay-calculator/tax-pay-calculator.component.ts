import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  ContractorIncome,
  TaxCalculatorInput,
  TaxProfile,
  W2Income,
} from '../../models/tax-calculator-input.model';

import {
  Deduction,
  FilingStatus,
  PayFrequency,
  W2PayType,
  WorkerType,
} from '../../models/tax-calculator-types.model';

import { TaxCalculatorResult } from '../../models/tax-calculator-result.model';

import { DEFAULT_TAX_PROFILE, DEFAULT_TAX_YEAR } from '../../data/tax-constants';

import { CountyOption, US_COUNTIES_BY_STATE } from '../../data/us-counties.data';

import { TaxCalculatorService } from '../../services/tax-calculator.service';

@Component({
  selector: 'app-tax-pay-calculator',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <main class="min-h-screen bg-slate-50 px-4 py-6 md:px-6 mt-10">
      <div class="mx-auto max-w-6xl">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-900 md:text-3xl">Tax & Pay Calculator</h1>

          <p class="mt-1 text-sm text-slate-600">
            Estimate your take-home pay or contractor income after taxes and deductions.
          </p>
        </div>

        <!-- Worker Type -->
        <mat-card class="mb-5 !rounded-2xl">
          <div class="p-5">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-900">How do you earn income?</h2>

              <p class="text-sm text-slate-500">
                Select the income type that best describes your situation.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <!-- W-2 -->
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition"
                [class.border-blue-600]="workerType() === 'w2'"
                [class.bg-blue-50]="workerType() === 'w2'"
                [class.border-slate-200]="workerType() !== 'w2'"
                [class.bg-white]="workerType() !== 'w2'"
                (click)="setWorkerType('w2')"
              >
                <div class="flex items-start gap-3">
                  <mat-icon>badge</mat-icon>

                  <div>
                    <div class="font-semibold text-slate-900">W-2 Employee</div>

                    <div class="mt-1 text-xs text-slate-500">Salary or hourly employee</div>
                  </div>
                </div>
              </button>

              <!-- 1099 -->
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition"
                [class.border-blue-600]="workerType() === '1099'"
                [class.bg-blue-50]="workerType() === '1099'"
                [class.border-slate-200]="workerType() !== '1099'"
                [class.bg-white]="workerType() !== '1099'"
                (click)="setWorkerType('1099')"
              >
                <div class="flex items-start gap-3">
                  <mat-icon>business_center</mat-icon>

                  <div>
                    <div class="font-semibold text-slate-900">1099 Contractor</div>

                    <div class="mt-1 text-xs text-slate-500">Freelance or self-employed income</div>
                  </div>
                </div>
              </button>

              <!-- Mixed -->
              <button
                type="button"
                class="rounded-xl border p-4 text-left transition"
                [class.border-blue-600]="workerType() === 'mixed'"
                [class.bg-blue-50]="workerType() === 'mixed'"
                [class.border-slate-200]="workerType() !== 'mixed'"
                [class.bg-white]="workerType() !== 'mixed'"
                (click)="setWorkerType('mixed')"
              >
                <div class="flex items-start gap-3">
                  <mat-icon>account_balance_wallet</mat-icon>

                  <div>
                    <div class="font-semibold text-slate-900">W-2 + 1099</div>

                    <div class="mt-1 text-xs text-slate-500">Employee and contractor income</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </mat-card>

        <!-- Main Form -->
        <div class="grid gap-5 lg:grid-cols-2">
          <!-- Income -->
          <mat-card class="!rounded-2xl">
            <div class="p-5">
              <div class="mb-5">
                <h2 class="text-lg font-semibold text-slate-900">Income</h2>

                <p class="text-sm text-slate-500">Enter your income information.</p>
              </div>

              <!-- W-2 Income -->
              @if (workerType() === 'w2' || workerType() === 'mixed') {
                <div class="mb-6 rounded-xl bg-slate-50 p-4">
                  <h3 class="mb-4 font-semibold text-slate-800">W-2 Income</h3>

                  <mat-form-field appearance="outline" class="tax-field">
                    <mat-label>How are you paid?</mat-label>

                    <mat-select
                      [ngModel]="w2Income().payType"
                      (ngModelChange)="updateW2PayType($event)"
                    >
                      <mat-option value="salary"> Salary </mat-option>

                      <mat-option value="hourly"> Hourly </mat-option>
                    </mat-select>
                  </mat-form-field>

                  @if (w2Income().payType === 'salary') {
                    <mat-form-field appearance="outline" class="tax-field">
                      <mat-label>Annual salary</mat-label>

                      <input
                        matInput
                        type="number"
                        min="0"
                        [ngModel]="w2Income().annualSalary"
                        (ngModelChange)="updateW2Field('annualSalary', $event)"
                      />

                      <span matTextPrefix>$&nbsp;</span>
                    </mat-form-field>
                  } @else {
                    <div class="grid gap-4 sm:grid-cols-2">
                      <mat-form-field appearance="outline" class="tax-field">
                        <mat-label>Hourly rate</mat-label>

                        <input
                          matInput
                          type="number"
                          min="0"
                          [ngModel]="w2Income().hourlyRate"
                          (ngModelChange)="updateW2Field('hourlyRate', $event)"
                        />

                        <span matTextPrefix>$&nbsp;</span>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="tax-field">
                        <mat-label>Regular hours</mat-label>

                        <input
                          matInput
                          type="number"
                          min="0"
                          [ngModel]="w2Income().regularHours"
                          (ngModelChange)="updateW2Field('regularHours', $event)"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="tax-field">
                        <mat-label>Overtime hours</mat-label>

                        <input
                          matInput
                          type="number"
                          min="0"
                          [ngModel]="w2Income().overtimeHours"
                          (ngModelChange)="updateW2Field('overtimeHours', $event)"
                        />
                      </mat-form-field>
                    </div>
                  }

                  <div class="grid gap-4 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="tax-field">
                      <mat-label>Bonus</mat-label>

                      <input
                        matInput
                        type="number"
                        min="0"
                        [ngModel]="w2Income().bonus"
                        (ngModelChange)="updateW2Field('bonus', $event)"
                      />

                      <span matTextPrefix>$&nbsp;</span>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="tax-field">
                      <mat-label>Commission</mat-label>

                      <input
                        matInput
                        type="number"
                        min="0"
                        [ngModel]="w2Income().commission"
                        (ngModelChange)="updateW2Field('commission', $event)"
                      />

                      <span matTextPrefix>$&nbsp;</span>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="tax-field">
                    <mat-label>Pay frequency</mat-label>

                    <mat-select
                      [ngModel]="w2Income().payFrequency"
                      (ngModelChange)="updateW2Field('payFrequency', $event)"
                    >
                      <mat-option value="weekly"> Weekly </mat-option>

                      <mat-option value="biweekly"> Biweekly </mat-option>

                      <mat-option value="semimonthly"> Semimonthly </mat-option>

                      <mat-option value="monthly"> Monthly </mat-option>

                      <mat-option value="annually"> Annually </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              }

              <!-- 1099 Income -->
              @if (workerType() === '1099' || workerType() === 'mixed') {
                <div class="rounded-xl bg-slate-50 p-4">
                  <h3 class="mb-4 font-semibold text-slate-800">1099 Contractor Income</h3>

                  <mat-form-field appearance="outline" class="tax-field">
                    <mat-label>Gross contract income</mat-label>

                    <input
                      matInput
                      type="number"
                      min="0"
                      [ngModel]="contractorIncome().grossIncome"
                      (ngModelChange)="updateContractorField('grossIncome', $event)"
                    />

                    <span matTextPrefix>$&nbsp;</span>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="tax-field">
                    <mat-label>Estimated tax payments</mat-label>

                    <input
                      matInput
                      type="number"
                      min="0"
                      [ngModel]="contractorIncome().estimatedTaxPayments"
                      (ngModelChange)="updateContractorField('estimatedTaxPayments', $event)"
                    />

                    <span matTextPrefix>$&nbsp;</span>
                  </mat-form-field>

                  <mat-expansion-panel class="!bg-white !shadow-none">
                    <mat-expansion-panel-header>
                      <mat-panel-title> Business expenses </mat-panel-title>
                    </mat-expansion-panel-header>

                    @if (businessExpenses().length === 0) {
                      <p class="mb-3 text-sm text-slate-500">
                        Add expenses such as software, equipment, mileage, or office expenses.
                      </p>
                    } @else {
                      <div class="space-y-3">
                        @for (expense of businessExpenses(); track expense.id) {
                          <div class="flex items-center gap-2">
                            <mat-form-field appearance="outline" class="tax-field flex-1">
                              <mat-label>
                                {{ expense.name || 'Expense' }}
                              </mat-label>

                              <input
                                matInput
                                type="number"
                                min="0"
                                [ngModel]="expense.amount"
                                (ngModelChange)="updateExpense(expense.id, $event)"
                              />
                            </mat-form-field>

                            <button
                              mat-icon-button
                              type="button"
                              aria-label="Remove expense"
                              (click)="removeExpense(expense.id)"
                            >
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        }
                      </div>
                    }

                    <button mat-stroked-button type="button" (click)="addExpense()">
                      <mat-icon>add</mat-icon>
                      Add Expense
                    </button>
                  </mat-expansion-panel>
                </div>
              }
            </div>
          </mat-card>

          <!-- Tax Profile -->
          <mat-card class="!rounded-2xl">
            <div class="p-5">
              <div class="mb-5">
                <h2 class="text-lg font-semibold text-slate-900">Tax Profile</h2>

                <p class="text-sm text-slate-500">Tell us about your tax situation.</p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <!-- Tax Year -->
                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label>Tax year</mat-label>

                  <mat-select
                    [ngModel]="taxProfile().taxYear"
                    (ngModelChange)="updateTaxProfile('taxYear', $event)"
                  >
                    <mat-option [value]="2026"> 2026 </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Filing Status -->
                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label>Filing status</mat-label>

                  <mat-select
                    [ngModel]="taxProfile().filingStatus"
                    (ngModelChange)="updateTaxProfile('filingStatus', $event)"
                  >
                    <mat-option value="single"> Single </mat-option>

                    <mat-option value="married-filing-jointly"> Married filing jointly </mat-option>

                    <mat-option value="married-filing-separately">
                      Married filing separately
                    </mat-option>

                    <mat-option value="head-of-household"> Head of household </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- State -->
                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label>State</mat-label>

                  <mat-select
                    [ngModel]="taxProfile().state"
                    (ngModelChange)="updateTaxProfile('state', $event)"
                  >
                    <mat-option value=""> Select state </mat-option>

                    @for (state of stateOptions; track state.code) {
                      <mat-option [value]="state.code">
                        {{ state.name }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- County -->
                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label>County</mat-label>

                  <mat-select
                    [ngModel]="taxProfile().county"
                    (ngModelChange)="updateTaxProfile('county', $event)"
                    [disabled]="availableCounties().length === 0"
                  >
                    <mat-option value=""> Select county </mat-option>

                    @for (county of availableCounties(); track county.fips) {
                      <mat-option [value]="county.fips">
                        {{ county.label }}
                      </mat-option>
                    }
                  </mat-select>

                  <mat-hint> County or county-equivalent jurisdiction </mat-hint>
                </mat-form-field>

                <!-- Dependents -->
                <mat-form-field
  appearance="outline"
  class="w-full"
>
  <mat-label>Dependents</mat-label>

  <input
    matInput
    type="number"
    min="0"
    [ngModel]="taxProfile().dependents"
    (ngModelChange)="updateTaxProfile('dependents', $event)"
  />
</mat-form-field>

@if (taxProfile().state === 'MD') {

  <div class="sm:col-span-2">

    <mat-expansion-panel
      class="!bg-slate-50 !shadow-none"
    >

      <mat-expansion-panel-header>
        <mat-panel-title>
          Maryland tax details
        </mat-panel-title>
      </mat-expansion-panel-header>

      <div class="space-y-4 pt-2">

        <!-- Taxpayer -->
        <div>
          <h3 class="text-sm font-semibold text-slate-800">
            Taxpayer
          </h3>

          <div class="mt-3 space-y-2">

            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
                [ngModel]="taxProfile().taxpayerAge65OrOlder"
                (ngModelChange)="updateTaxProfile(
                  'taxpayerAge65OrOlder',
                  $event
                )"
              />

              <span class="text-sm text-slate-700">
                Age 65 or older
              </span>
            </label>

            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
                [ngModel]="taxProfile().taxpayerBlind"
                (ngModelChange)="updateTaxProfile(
                  'taxpayerBlind',
                  $event
                )"
              />

              <span class="text-sm text-slate-700">
                Legally blind
              </span>
            </label>

          </div>
        </div>

        <!-- Spouse -->
        @if (
          taxProfile().filingStatus ===
          'married-filing-jointly'
        ) {

          <div class="border-t border-slate-200 pt-4">

            <h3 class="text-sm font-semibold text-slate-800">
              Spouse
            </h3>

            <div class="mt-3 space-y-2">

              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300"
                  [ngModel]="taxProfile().spouseAge65OrOlder"
                  (ngModelChange)="updateTaxProfile(
                    'spouseAge65OrOlder',
                    $event
                  )"
                />

                <span class="text-sm text-slate-700">
                  Age 65 or older
                </span>
              </label>

              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300"
                  [ngModel]="taxProfile().spouseBlind"
                  (ngModelChange)="updateTaxProfile(
                    'spouseBlind',
                    $event
                  )"
                />

                <span class="text-sm text-slate-700">
                  Legally blind
                </span>
              </label>

            </div>

          </div>

        }

        <p class="border-t border-slate-200 pt-4 text-xs text-slate-500">
          These options are used to estimate Maryland personal
          exemptions. Actual tax liability may vary based on
          your complete Maryland tax return.
        </p>

      </div>

    </mat-expansion-panel>

  </div>

}
              </div>

              <!-- Additional Withholding -->
              <mat-expansion-panel class="!bg-slate-50 !shadow-none">
                <mat-expansion-panel-header>
                  <mat-panel-title> Additional withholding </mat-panel-title>
                </mat-expansion-panel-header>

                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label> Additional federal withholding </mat-label>

                  <input
                    matInput
                    type="number"
                    min="0"
                    [ngModel]="taxProfile().additionalFederalWithholding"
                    (ngModelChange)="updateTaxProfile('additionalFederalWithholding', $event)"
                  />

                  <span matTextPrefix>$&nbsp;</span>
                </mat-form-field>

                <mat-form-field appearance="outline" class="tax-field">
                  <mat-label> Additional state withholding </mat-label>

                  <input
                    matInput
                    type="number"
                    min="0"
                    [ngModel]="taxProfile().additionalStateWithholding"
                    (ngModelChange)="updateTaxProfile('additionalStateWithholding', $event)"
                  />

                  <span matTextPrefix>$&nbsp;</span>
                </mat-form-field>
              </mat-expansion-panel>
            </div>
          </mat-card>
        </div>

        <!-- Deductions -->
        <mat-card class="mt-5 !rounded-2xl">
          <div class="p-5">
            <div
              class="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Deductions</h2>

                <p class="text-sm text-slate-500">Add pre-tax or post-tax deductions.</p>
              </div>

              <button mat-stroked-button type="button" (click)="addDeduction()">
                <mat-icon>add</mat-icon>
                Add Deduction
              </button>
            </div>

            @if (deductions().length === 0) {
              <div
                class="
                  mt-4
                  rounded-xl
                  bg-slate-50
                  p-4
                  text-sm
                  text-slate-500
                "
              >
                No deductions added.
              </div>
            } @else {
              <div
                class="
                  mt-5
                  grid
                  gap-4
                  md:grid-cols-2
                "
              >
                @for (deduction of deductions(); track deduction.id) {
                  <div
                    class="
                      rounded-xl
                      border
                      border-slate-200
                      p-4
                    "
                  >
                    <div
                      class="
                        grid
                        gap-3
                        sm:grid-cols-2
                      "
                    >
                      <mat-form-field appearance="outline" class="tax-field">
                        <mat-label>Name</mat-label>

                        <input
                          matInput
                          [ngModel]="deduction.name"
                          (ngModelChange)="updateDeduction(deduction.id, 'name', $event)"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="tax-field">
                        <mat-label>Amount</mat-label>

                        <input
                          matInput
                          type="number"
                          min="0"
                          [ngModel]="deduction.amount"
                          (ngModelChange)="updateDeduction(deduction.id, 'amount', $event)"
                        />

                        <span matTextPrefix>$&nbsp;</span>
                      </mat-form-field>
                    </div>

                    <div
                      class="
                        flex
                        items-center
                        justify-between
                      "
                    >
                      <mat-form-field appearance="outline" class="tax-field flex-1">
                        <mat-label>Type</mat-label>

                        <mat-select
                          [ngModel]="deduction.type"
                          (ngModelChange)="updateDeduction(deduction.id, 'type', $event)"
                        >
                          <mat-option value="pre-tax"> Pre-tax </mat-option>

                          <mat-option value="post-tax"> Post-tax </mat-option>
                        </mat-select>
                      </mat-form-field>

                      <button
                        mat-icon-button
                        type="button"
                        aria-label="Remove deduction"
                        (click)="removeDeduction(deduction.id)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </mat-card>

        <!-- Actions -->
        <div
          class="
            mt-5
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >
          <button mat-stroked-button type="button" (click)="reset()">Reset</button>

          <button mat-flat-button color="primary" type="button" (click)="calculate()">
            <mat-icon>calculate</mat-icon>
            Calculate Take-Home Pay
          </button>
        </div>

        <!-- Results -->
        @if (result(); as calculation) {
          <mat-card class="mt-6 !rounded-2xl">
            <div class="p-5 md:p-7">
              <div class="text-center">
                <p
                  class="
                    text-sm
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >
                  {{ resultTitle() }}
                </p>

                <div
                  class="
                    mt-2
                    text-4xl
                    font-bold
                    text-slate-900
                  "
                >
                  {{ calculation.netIncome | currency }}
                </div>

                <p
                  class="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Estimated annual amount
                </p>
              </div>

              <div
                class="
                  mt-7
                  grid
                  gap-3
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                <div
                  class="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <div class="text-xs text-slate-500">Gross Income</div>

                  <div class="mt-1 text-lg font-semibold">
                    {{ calculation.grossIncome | currency }}
                  </div>
                </div>

                <div
                  class="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <div class="text-xs text-slate-500">Total Taxes</div>

                  <div class="mt-1 text-lg font-semibold">
                    {{ calculation.totalTaxes | currency }}
                  </div>
                </div>

                <div
                  class="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <div class="text-xs text-slate-500">Deductions</div>

                  <div class="mt-1 text-lg font-semibold">
                    {{ calculation.totalDeductions | currency }}
                  </div>
                </div>

                <div
                  class="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <div class="text-xs text-slate-500">Effective Tax Rate</div>

                  <div class="mt-1 text-lg font-semibold">
                    {{ calculation.effectiveTaxRate | percent: '1.1-1' }}
                  </div>
                </div>
              </div>

              <!-- Tax Breakdown -->
              <div class="mt-7 border-t pt-5">
                <h3 class="mb-4 text-lg font-semibold">Tax Breakdown</h3>

                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span> Federal income tax </span>

                    <span class="font-medium">
                      {{ calculation.federalIncomeTax | currency }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span> Social Security </span>

                    <span class="font-medium">
                      {{ calculation.socialSecurityTax | currency }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span> Medicare </span>

                    <span class="font-medium">
                      {{ calculation.medicareTax | currency }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span> Self-employment tax </span>

                    <span class="font-medium">
                      {{ calculation.selfEmploymentTax | currency }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span> State tax </span>

                    <span class="font-medium">
                      {{ calculation.stateTax | currency }}
                    </span>
                  </div>

                  <div class="flex justify-between">
                    <span> Local tax </span>

                    <span class="font-medium">
                      {{ calculation.localTax | currency }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Pay Period Estimates -->
              <div class="mt-7 border-t pt-5">
                <h3 class="mb-4 text-lg font-semibold">Pay Period Estimates</h3>

                <div
                  class="
                    grid
                    gap-3
                    sm:grid-cols-2
                    lg:grid-cols-4
                  "
                >
                  <div class="rounded-xl border p-4">
                    <div class="text-xs text-slate-500">Weekly</div>

                    <div class="mt-1 text-lg font-semibold">
                      {{ calculation.weekly.netIncome | currency }}
                    </div>
                  </div>

                  <div class="rounded-xl border p-4">
                    <div class="text-xs text-slate-500">Biweekly</div>

                    <div class="mt-1 text-lg font-semibold">
                      {{ calculation.biweekly.netIncome | currency }}
                    </div>
                  </div>

                  <div class="rounded-xl border p-4">
                    <div class="text-xs text-slate-500">Semimonthly</div>

                    <div class="mt-1 text-lg font-semibold">
                      {{ calculation.semimonthly.netIncome | currency }}
                    </div>
                  </div>

                  <div class="rounded-xl border p-4">
                    <div class="text-xs text-slate-500">Monthly</div>

                    <div class="mt-1 text-lg font-semibold">
                      {{ calculation.monthly.netIncome | currency }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="
                  mt-6
                  rounded-xl
                  bg-amber-50
                  p-4
                  text-sm
                  text-amber-800
                "
              >
                This is an estimate. Actual taxes and take-home pay can vary based on applicable
                federal, state, local, payroll, deduction, and individual tax rules.
              </div>
            </div>
          </mat-card>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .tax-field {
        display: block;
        width: 100%;
        min-width: 0;
        margin-bottom: 16px;
      }

      mat-form-field {
        box-sizing: border-box;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxPayCalculatorComponent {
  private readonly taxCalculatorService = inject(TaxCalculatorService);

  /*
   * Worker type
   */
  protected readonly workerType = signal<WorkerType>('w2');

  /*
   * W-2 income
   */
  protected readonly w2Income = signal<W2Income>({
    payType: 'salary',
    annualSalary: 0,
    hourlyRate: 0,
    regularHours: 40,
    overtimeHours: 0,
    bonus: 0,
    commission: 0,
    payFrequency: 'biweekly',
  });

  /*
   * 1099 income
   */
  protected readonly contractorIncome = signal<ContractorIncome>({
    grossIncome: 0,
    businessExpenses: [],
    estimatedTaxPayments: 0,
  });

  /*
   * 
  file
   *
   * localJurisdiction is used for the
   * Census county FIPS value.
   */
  protected readonly taxProfile = signal<TaxProfile>({
    ...DEFAULT_TAX_PROFILE,
  });

  /*
   * Deductions
   */
  protected readonly deductions = signal<Deduction[]>([]);

  /*
   * Calculation result
   */
  protected readonly result = signal<TaxCalculatorResult | null>(null);

  /*
   * Business expenses
   */
  protected readonly businessExpenses = computed(() => this.contractorIncome().businessExpenses);

  /*
   * Counties for the currently
   * selected state.
   *
   * US_COUNTIES_BY_STATE uses
   * Census USPS state abbreviations:
   *
   * MD
   * VA
   * DC
   * etc.
   */
  protected readonly availableCounties = computed<CountyOption[]>(() => {
    const state = this.taxProfile().state;

    return US_COUNTIES_BY_STATE[state] ?? [];
  });

  /*
   * All state / state-equivalent
   * options represented by the
   * 2026 Census county file.
   *
   * The Census 2026 national files
   * cover the 50 states, DC, and
   * Puerto Rico.
   */
  protected readonly stateOptions = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'PR', name: 'Puerto Rico' },
  ] as const;

  /*
   * Result title
   */
  protected readonly resultTitle = computed(() => {
    switch (this.workerType()) {
      case '1099':
        return 'Estimated Net Contractor Income';

      case 'mixed':
        return 'Estimated Overall Take-Home';

      case 'w2':
      default:
        return 'Estimated Take-Home Pay';
    }
  });

  /*
   * Worker type
   */
  protected setWorkerType(workerType: WorkerType): void {
    this.workerType.set(workerType);
    this.result.set(null);
  }

  /*
   * W-2 pay type
   */
  protected updateW2PayType(payType: W2PayType): void {
    this.w2Income.update((current) => ({
      ...current,
      payType,
    }));

    this.result.set(null);
  }

  /*
   * W-2 fields
   */
  protected updateW2Field(field: keyof W2Income, value: unknown): void {
    this.w2Income.update((current) => ({
      ...current,
      [field]: typeof value === 'number' ? Math.max(value, 0) : value,
    }));

    this.result.set(null);
  }

  /*
   * Contractor fields
   */
  protected updateContractorField(field: keyof ContractorIncome, value: unknown): void {
    this.contractorIncome.update((current) => ({
      ...current,
      [field]: typeof value === 'number' ? Math.max(value, 0) : value,
    }));

    this.result.set(null);
  }

  /*
   * Tax profile fields
   *
   * When State changes, the previously
   * selected county is cleared because
   * it belongs to the old state.
   */
  protected updateTaxProfile(field: keyof TaxProfile, value: unknown): void {
    this.taxProfile.update((current) => {
      const updated = {
        ...current,
        [field]: typeof value === 'number' ? Math.max(value, 0) : value,
      };

      if (field === 'state') {
  updated.county = '';
}

      return updated;
    });

    this.result.set(null);
  }

  /*
   * Add contractor expense
   */
  protected addExpense(): void {
    this.contractorIncome.update((current) => ({
      ...current,

      businessExpenses: [
        ...current.businessExpenses,

        {
          id: crypto.randomUUID(),
          name: 'Business Expense',
          amount: 0,
        },
      ],
    }));

    this.result.set(null);
  }

  /*
   * Update contractor expense
   */
  protected updateExpense(id: string, amount: number): void {
    this.contractorIncome.update((current) => ({
      ...current,

      businessExpenses: current.businessExpenses.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              amount: Math.max(amount, 0),
            }
          : expense,
      ),
    }));

    this.result.set(null);
  }

  /*
   * Remove contractor expense
   */
  protected removeExpense(id: string): void {
    this.contractorIncome.update((current) => ({
      ...current,

      businessExpenses: current.businessExpenses.filter((expense) => expense.id !== id),
    }));

    this.result.set(null);
  }

  /*
   * Add deduction
   */
  protected addDeduction(): void {
    this.deductions.update((current) => [
      ...current,

      {
        id: crypto.randomUUID(),
        name: 'Deduction',
        amount: 0,
        type: 'pre-tax',
        frequency: 'annually',
      },
    ]);

    this.result.set(null);
  }

  /*
   * Update deduction
   */
  protected updateDeduction(id: string, field: keyof Deduction, value: unknown): void {
    this.deductions.update((current) =>
      current.map((deduction) =>
        deduction.id === id
          ? {
              ...deduction,

              [field]: typeof value === 'number' ? Math.max(value, 0) : value,
            }
          : deduction,
      ),
    );

    this.result.set(null);
  }

  /*
   * Remove deduction
   */
  protected removeDeduction(id: string): void {
    this.deductions.update((current) => current.filter((deduction) => deduction.id !== id));

    this.result.set(null);
  }

  /*
   * Calculate
   */
  protected calculate(): void {
    const deductions = this.deductions();

    const input: TaxCalculatorInput = {
      workerType: this.workerType(),

      taxProfile: this.taxProfile(),

      w2Income: this.workerType() === '1099' ? undefined : this.w2Income(),

      contractorIncome: this.workerType() === 'w2' ? undefined : this.contractorIncome(),

      preTaxDeductions: deductions.filter((deduction) => deduction.type === 'pre-tax'),

      postTaxDeductions: deductions.filter((deduction) => deduction.type === 'post-tax'),
    };

    const calculation = this.taxCalculatorService.calculate(input);

    this.result.set(calculation);
  }

  /*
   * Reset
   */
  protected reset(): void {
    this.workerType.set('w2');

    this.w2Income.set({
      payType: 'salary',
      annualSalary: 0,
      hourlyRate: 0,
      regularHours: 40,
      overtimeHours: 0,
      bonus: 0,
      commission: 0,
      payFrequency: 'biweekly',
    });

    this.contractorIncome.set({
      grossIncome: 0,
      businessExpenses: [],
      estimatedTaxPayments: 0,
    });

    this.taxProfile.set({
      ...DEFAULT_TAX_PROFILE,
      taxYear: DEFAULT_TAX_YEAR,
    });

    this.deductions.set([]);

    this.result.set(null);
  }
}
