import { CommonModule } from '@angular/common';

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatMenuModule } from '@angular/material/menu';

import { MatNativeDateModule } from '@angular/material/core';

import { BusinessTransaction } from '../../models/business-transaction.model';

import { BusinessStore } from '../../store/business.store';

import { Timestamp } from 'firebase/firestore';

import { BusinessReportExportService } from '../../services/business-report-export.service';
import { Business } from '../../models/business.model';

// ============================================================
// TYPES
// ============================================================

/**
 * Available reporting periods.
 */
type ReportPeriod = 'all' | 'month' | 'last-month' | 'quarter' | 'year' | 'custom';

/**
 * Reporting-period menu option.
 */
interface ReportPeriodOption {
  value: ReportPeriod;
  label: string;
}

/**
 * Category-level financial report.
 */
interface CategoryReport {
  name: string;
  type: 'revenue' | 'expense';
  amount: number;
  percentage: number;
}

/**
 * Financial trend entry.
 *
 * Short periods are grouped by day.
 * Longer periods are grouped by month.
 */
interface FinancialTrend {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-business-reports',

  standalone: true,

  imports: [
    CommonModule,

    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="space-y-5">
      <!-- ======================================================
           HEADER
           ====================================================== -->

      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <!-- Title -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Reports</h2>

          <p class="text-sm text-slate-500">Business performance and operational insights.</p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Reporting period -->
          <button mat-stroked-button type="button" [matMenuTriggerFor]="periodMenu">
            <mat-icon class="mr-1.5"> calendar_month </mat-icon>

            {{ selectedPeriodLabel() }}

            <mat-icon class="ml-1 !mr-0"> expand_more </mat-icon>
          </button>

          <!-- Reporting period menu -->
          <mat-menu #periodMenu="matMenu">
            @for (option of periodOptions; track option.value) {
              <button mat-menu-item type="button" (click)="setPeriod(option.value)">
                <mat-icon>
                  {{
                    selectedPeriod() === option.value
                      ? 'radio_button_checked'
                      : 'radio_button_unchecked'
                  }}
                </mat-icon>

                <span>
                  {{ option.label }}
                </span>
              </button>
            }
          </mat-menu>

          <!-- Export -->
         <button
  mat-flat-button
  [matMenuTriggerFor]="exportMenu"
>
  <mat-icon class="mr-2">download</mat-icon>
  Export Report
</button>

<mat-menu #exportMenu="matMenu">

  <button
  mat-menu-item
  type="button"
  [disabled]="!!exporting()"
  (click)="exportReport('pdf')"
>
  <mat-icon>picture_as_pdf</mat-icon>

  @if (exporting() === 'pdf') {
    <span>Generating PDF...</span>
  } @else {
    <span>Export PDF</span>
  }
</button>

  <button
  mat-menu-item
  type="button"
  [disabled]="!!exporting()"
  (click)="exportReport('excel')"
>
  <mat-icon>table_view</mat-icon>

  @if (exporting() === 'excel') {
    <span>Generating Excel...</span>
  } @else {
    <span>Export Excel</span>
  }
</button>

</mat-menu>
        </div>
      </div>

      <!-- ======================================================
           CUSTOM DATE RANGE
           ====================================================== -->

      @if (selectedPeriod() === 'custom') {
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="mb-3 flex items-center gap-2">
            <mat-icon class="text-slate-500"> date_range </mat-icon>

            <div>
              <h3 class="text-sm font-semibold text-slate-800">Custom Reporting Range</h3>

              <p class="text-xs text-slate-500">
                Select the dates you want included in the report.
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <!-- Start date -->
            <mat-form-field appearance="outline" class="w-full sm:w-52" subscriptSizing="dynamic">
              <mat-label> Start date </mat-label>

              <input
                matInput
                [matDatepicker]="startPicker"
                [value]="customStartDate()"
                (dateChange)="onStartDateChange($event.value)"
              />

              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>

              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <!-- Arrow -->
            <mat-icon class="hidden text-slate-400 sm:block"> arrow_forward </mat-icon>

            <!-- End date -->
            <mat-form-field appearance="outline" class="w-full sm:w-52" subscriptSizing="dynamic">
              <mat-label> End date </mat-label>

              <input
                matInput
                [matDatepicker]="endPicker"
                [min]="customStartDate()"
                [value]="customEndDate()"
                (dateChange)="onEndDateChange($event.value)"
              />

              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>

              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <!-- Clear -->
            @if (customStartDate() || customEndDate()) {
              <button mat-button type="button" (click)="clearCustomRange()">
                <mat-icon class="mr-1"> clear </mat-icon>

                Clear
              </button>
            }
          </div>

          <!-- Validation -->
          @if (customStartDate() && customEndDate() && customStartDate()! > customEndDate()!) {
            <div class="mt-2 flex items-center gap-2 text-xs text-red-600">
              <mat-icon class="!h-4 !w-4 !text-[16px]"> error </mat-icon>

              Start date must be before the end date.
            </div>
          }
        </div>
      }

      <!-- ======================================================
           ACTIVE REPORTING PERIOD
           ====================================================== -->

      <div
        class="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      >
        <mat-icon class="text-slate-500"> date_range </mat-icon>

        <span class="text-sm text-slate-600"> Reporting period: </span>

        <span class="text-sm font-medium text-slate-900">
          {{ selectedPeriodLabel() }}
        </span>

        @if (periodStart() && periodEnd()) {
          <span class="text-xs text-slate-500">
            {{ formatDate(periodStart()!) }}
            –
            {{ formatDate(periodEnd()!) }}
          </span>
        }

        @if (selectedPeriod() === 'custom' && (!periodStart() || !periodEnd())) {
          <span class="text-xs text-amber-600"> Select a start and end date. </span>
        }
      </div>

      <!-- ======================================================
           FINANCIAL SUMMARY
           ====================================================== -->

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <!-- Revenue -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Revenue</p>

                <p class="mt-1 text-2xl font-semibold text-slate-900">
                  {{ formatCurrency(totalRevenue()) }}
                </p>
              </div>

              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <mat-icon class="text-emerald-600"> trending_up </mat-icon>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Expenses -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Expenses</p>

                <p class="mt-1 text-2xl font-semibold text-slate-900">
                  {{ formatCurrency(totalExpenses()) }}
                </p>
              </div>

              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <mat-icon class="text-red-600"> trending_down </mat-icon>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Net Income -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Net Income</p>

                <p
                  class="mt-1 text-2xl font-semibold"
                  [class.text-emerald-600]="netIncome() >= 0"
                  [class.text-red-600]="netIncome() < 0"
                >
                  {{ formatCurrency(netIncome()) }}
                </p>
              </div>

              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <mat-icon class="text-slate-600"> account_balance </mat-icon>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Transactions -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Transactions
                </p>

                <p class="mt-1 text-2xl font-semibold text-slate-900">
                  {{ filteredTransactions().length }}
                </p>
              </div>

              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <mat-icon class="text-blue-600"> receipt_long </mat-icon>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ======================================================
           FINANCIAL OVERVIEW / BUSINESS HEALTH
           ====================================================== -->

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Financial Overview -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-5">
            <div class="mb-4">
              <h3 class="font-semibold text-slate-900">Financial Overview</h3>

              <p class="text-sm text-slate-500">
                Financial position for the selected reporting period.
              </p>
            </div>

            <div class="space-y-3">
              <!-- Revenue -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600"> Revenue </span>

                <span class="text-sm font-semibold text-emerald-600">
                  {{ formatCurrency(totalRevenue()) }}
                </span>
              </div>

              <!-- Expenses -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600"> Expenses </span>

                <span class="text-sm font-semibold text-red-600">
                  {{ formatCurrency(totalExpenses()) }}
                </span>
              </div>

              <!-- Net income -->
              <div class="border-t border-slate-200 pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-slate-700"> Net Income </span>

                  <span
                    class="text-base font-semibold"
                    [class.text-emerald-600]="netIncome() >= 0"
                    [class.text-red-600]="netIncome() < 0"
                  >
                    {{ formatCurrency(netIncome()) }}
                  </span>
                </div>
              </div>

              <!-- Profit margin -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600"> Profit Margin </span>

                <span
                  class="text-sm font-semibold"
                  [class.text-emerald-600]="profitMargin() >= 0"
                  [class.text-red-600]="profitMargin() < 0"
                >
                  {{ profitMargin() | number: '1.1-1' }}%
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Business Health -->
        <mat-card appearance="outlined" class="!rounded-xl">
          <mat-card-content class="!p-5">
            <div class="mb-4">
              <h3 class="font-semibold text-slate-900">Business Health</h3>

              <p class="text-sm text-slate-500">Operational status across the business.</p>
            </div>

            <div class="space-y-2.5">
              <!-- Compliance -->
              <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-slate-500"> verified_user </mat-icon>

                  <span class="text-sm text-slate-700"> Compliance </span>
                </div>

                @if (store.overdueCompliance() > 0) {
                  <span class="text-sm font-semibold text-red-600">
                    {{ store.overdueCompliance() }}
                    overdue
                  </span>
                } @else if (store.actionRequiredCompliance() > 0) {
                  <span class="text-sm font-semibold text-amber-600">
                    {{ store.actionRequiredCompliance() }}
                    action required
                  </span>
                } @else {
                  <span class="text-sm font-semibold text-emerald-600"> Current </span>
                }
              </div>

              <!-- Upcoming compliance -->
              <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-slate-500"> event </mat-icon>

                  <span class="text-sm text-slate-700"> Upcoming Compliance </span>
                </div>

                <span class="text-sm font-semibold text-slate-800">
                  {{ store.upcomingCompliance() }}
                </span>
              </div>

              <!-- Documents -->
              <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-slate-500"> folder </mat-icon>

                  <span class="text-sm text-slate-700"> Documents </span>
                </div>

                <span class="text-sm font-semibold text-slate-800">
                  {{ store.documents().length }}
                </span>
              </div>

              <!-- Activities -->
              <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-slate-500"> checklist </mat-icon>

                  <span class="text-sm text-slate-700"> Activities </span>
                </div>

                <span class="text-sm font-semibold text-slate-800">
                  {{ store.activities().length }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ======================================================
           FINANCIAL TREND
           ====================================================== -->

      <mat-card appearance="outlined" class="!rounded-xl">
        <mat-card-content class="!p-5">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="font-semibold text-slate-900">Financial Trend</h3>

              <p class="text-sm text-slate-500">Revenue, expenses, and net income over time.</p>
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center gap-4 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span class="text-slate-500"> Revenue </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>

                <span class="text-slate-500"> Expenses </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>

                <span class="text-slate-500"> Net </span>
              </div>
            </div>
          </div>

          @if (financialTrend().length > 0) {
            <div class="space-y-5">
              @for (period of financialTrend(); track period.key) {
                <div>
                  <!-- Period heading -->
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs font-medium text-slate-600">
                      {{ period.label }}
                    </span>

                    <span
                      class="text-xs font-semibold"
                      [class.text-emerald-600]="period.netIncome >= 0"
                      [class.text-red-600]="period.netIncome < 0"
                    >
                      Net:
                      {{ formatCurrency(period.netIncome) }}
                    </span>
                  </div>

                  <!-- Revenue -->
                  <div class="mb-1.5 flex items-center gap-2">
                    <span class="w-16 shrink-0 text-right text-[10px] text-slate-400">
                      Revenue
                    </span>

                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-emerald-500 transition-all"
                        [style.width.%]="getTrendWidth(period.revenue, trendMaximum())"
                      ></div>
                    </div>

                    <span class="w-24 shrink-0 text-right text-[11px] font-medium text-slate-600">
                      {{ formatCurrency(period.revenue) }}
                    </span>
                  </div>

                  <!-- Expenses -->
                  <div class="mb-1.5 flex items-center gap-2">
                    <span class="w-16 shrink-0 text-right text-[10px] text-slate-400">
                      Expenses
                    </span>

                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-red-500 transition-all"
                        [style.width.%]="getTrendWidth(period.expenses, trendMaximum())"
                      ></div>
                    </div>

                    <span class="w-24 shrink-0 text-right text-[11px] font-medium text-slate-600">
                      {{ formatCurrency(period.expenses) }}
                    </span>
                  </div>

                  <!-- Net income -->
                  <div class="flex items-center gap-2">
                    <span class="w-16 shrink-0 text-right text-[10px] text-slate-400"> Net </span>

                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-blue-500 transition-all"
                        [style.width.%]="
                          getTrendWidth(
                            period.netIncome < 0 ? -period.netIncome : period.netIncome,
                            trendMaximum()
                          )
                        "
                      ></div>
                    </div>

                    <span
                      class="w-24 shrink-0 text-right text-[11px] font-medium"
                      [class.text-emerald-600]="period.netIncome >= 0"
                      [class.text-red-600]="period.netIncome < 0"
                    >
                      {{ formatCurrency(period.netIncome) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="py-10 text-center">
              <mat-icon class="text-3xl text-slate-400"> show_chart </mat-icon>

              <p class="mt-2 text-sm text-slate-500">
                No financial activity is available for this period.
              </p>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- ======================================================
           TRANSACTION BREAKDOWN
           ====================================================== -->

      <mat-card appearance="outlined" class="!rounded-xl">
        <mat-card-content class="!p-5">
          <div class="mb-4">
            <h3 class="font-semibold text-slate-900">Transaction Breakdown</h3>

            <p class="text-sm text-slate-500">
              Revenue and expense activity for the selected period.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Revenue -->
            <div class="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Revenue Transactions
                  </p>

                  <p class="mt-1 text-2xl font-semibold text-emerald-800">
                    {{ revenueTransactionCount() }}
                  </p>
                </div>

                <mat-icon class="text-emerald-600"> arrow_upward </mat-icon>
              </div>
            </div>

            <!-- Expenses -->
            <div class="rounded-lg border border-red-100 bg-red-50 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-red-700">
                    Expense Transactions
                  </p>

                  <p class="mt-1 text-2xl font-semibold text-red-800">
                    {{ expenseTransactionCount() }}
                  </p>
                </div>

                <mat-icon class="text-red-600"> arrow_downward </mat-icon>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ======================================================
           CATEGORY BREAKDOWN
           ====================================================== -->

      <mat-card appearance="outlined" class="!rounded-xl">
        <mat-card-content class="!p-5">
          <div class="mb-4">
            <h3 class="font-semibold text-slate-900">Category Breakdown</h3>

            <p class="text-sm text-slate-500">Revenue and expenses grouped by category.</p>
          </div>

          @if (categoryBreakdown().length > 0) {
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <!-- Revenue categories -->
              <div>
                <h4 class="mb-2 text-sm font-medium text-emerald-700">Revenue Categories</h4>

                <div class="divide-y divide-slate-100">
                  @for (category of revenueCategories(); track category.name) {
                    <div class="flex items-center justify-between py-2.5">
                      <span class="text-sm text-slate-700">
                        {{ category.name }}
                      </span>

                      <div class="text-right">
                        <p class="text-sm font-semibold text-emerald-600">
                          {{ formatCurrency(category.amount) }}
                        </p>

                        <p class="text-[11px] text-slate-400">
                          {{ category.percentage | number: '1.0-1' }}%
                        </p>
                      </div>
                    </div>
                  }

                  @if (revenueCategories().length === 0) {
                    <p class="py-3 text-sm text-slate-400">No revenue categories.</p>
                  }
                </div>
              </div>

              <!-- Expense categories -->
              <div>
                <h4 class="mb-2 text-sm font-medium text-red-700">Expense Categories</h4>

                <div class="divide-y divide-slate-100">
                  @for (category of expenseCategories(); track category.name) {
                    <div class="flex items-center justify-between py-2.5">
                      <span class="text-sm text-slate-700">
                        {{ category.name }}
                      </span>

                      <div class="text-right">
                        <p class="text-sm font-semibold text-red-600">
                          {{ formatCurrency(category.amount) }}
                        </p>

                        <p class="text-[11px] text-slate-400">
                          {{ category.percentage | number: '1.0-1' }}%
                        </p>
                      </div>
                    </div>
                  }

                  @if (expenseCategories().length === 0) {
                    <p class="py-3 text-sm text-slate-400">No expense categories.</p>
                  }
                </div>
              </div>
            </div>
          } @else {
            <div class="py-8 text-center">
              <mat-icon class="text-3xl text-slate-400"> receipt_long </mat-icon>

              <p class="mt-2 text-sm text-slate-500">
                No transactions available for this reporting period.
              </p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,

  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BusinessReportsComponent {
  // ==========================================================
  // STORE
  // ==========================================================

  readonly store = inject(BusinessStore);

  private readonly reportExportService =
  inject(BusinessReportExportService);

  // ==========================================================
  // REPORT PERIOD
  // ==========================================================

  /**
   * Currently selected reporting period.
   *
   * All Time is the default because it preserves the
   * behavior of the original Reports dashboard.
   */
  readonly selectedPeriod = signal<ReportPeriod>('all');

  /**
   * Custom reporting range.
   */
  readonly customStartDate = signal<Date | null>(null);

  readonly customEndDate = signal<Date | null>(null);

  readonly exporting = signal<'pdf' | 'excel' | null>(null);

  /**
   * Reporting period options.
   */
  readonly periodOptions: ReportPeriodOption[] = [
    {
      value: 'all',
      label: 'All Time',
    },

    {
      value: 'month',
      label: 'This Month',
    },

    {
      value: 'last-month',
      label: 'Last Month',
    },

    {
      value: 'quarter',
      label: 'This Quarter',
    },

    {
      value: 'year',
      label: 'This Year',
    },

    {
      value: 'custom',
      label: 'Custom Range',
    },
  ];

  /**
   * Friendly label for the selected period.
   */
  readonly selectedPeriodLabel = computed(() => {
    return (
      this.periodOptions.find((option) => option.value === this.selectedPeriod())?.label ??
      'All Time'
    );
  });

  /**
   * Change the selected reporting period.
   */
  setPeriod(period: ReportPeriod): void {
    this.selectedPeriod.set(period);
  }

  // ==========================================================
  // CUSTOM DATE HANDLERS
  // ==========================================================

  /**
   * Handle the start-date picker.
   */
  onStartDateChange(date: Date | null): void {
    this.customStartDate.set(date ? this.startOfDay(date) : null);

    /*
     * If the new start date is after the current
     * end date, clear the end date so the user
     * can select a valid range again.
     */
    const end = this.customEndDate();

    if (date && end && this.startOfDay(date) > end) {
      this.customEndDate.set(null);
    }
  }

  /**
   * Handle the end-date picker.
   */
  onEndDateChange(date: Date | null): void {
    this.customEndDate.set(date ? this.endOfDay(date) : null);
  }

  /**
   * Clear the custom date range and return
   * the report to All Time.
   */
  clearCustomRange(): void {
    this.customStartDate.set(null);

    this.customEndDate.set(null);

    this.selectedPeriod.set('all');
  }

  // ==========================================================
  // REPORT DATE RANGE
  // ==========================================================

  /**
   * Start date for the currently selected report.
   */
  readonly periodStart = computed<Date | null>(() => {
    const now = new Date();

    switch (this.selectedPeriod()) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);

      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);

      case 'quarter': {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

        return new Date(now.getFullYear(), quarterStartMonth, 1);
      }

      case 'year':
        return new Date(now.getFullYear(), 0, 1);

      case 'custom':
        return this.customStartDate();

      case 'all':

      default:
        return null;
    }
  });

  /**
   * End date for the currently selected report.
   */
  readonly periodEnd = computed<Date | null>(() => {
    const now = new Date();

    switch (this.selectedPeriod()) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      case 'quarter': {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

        return new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      }

      case 'year':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      case 'custom': {
        const date = this.customEndDate();

        if (!date) {
          return null;
        }

        return this.endOfDay(date);
      }

      case 'all':

      default:
        return null;
    }
  });

  // ==========================================================
  // FILTERED TRANSACTIONS
  // ==========================================================

  /**
   * Transactions included in the current report.
   *
   * Void transactions are excluded from reporting.
   */
  readonly filteredTransactions = computed(() => {
    const period = this.selectedPeriod();
    const start = this.periodStart();
    const end = this.periodEnd();

    // Custom range requires both dates and a valid date order.
    if (period === 'custom') {
      if (!start || !end || start > end) {
        return [];
      }
    }

    return this.store
      .transactions()
      .filter((transaction) => transaction.status !== 'void')
      .filter((transaction) => {
        // Non-custom periods always have a calculated range.
        if (!start || !end) {
          return true;
        }

        const transactionDate = this.getTransactionDate(transaction);

        if (!transactionDate) {
          return false;
        }

        return transactionDate >= start && transactionDate <= end;
      });
  });

  // ==========================================================
  // FINANCIAL TOTALS
  // ==========================================================

  /**
   * Revenue for the selected reporting period.
   */
  readonly totalRevenue = computed(() => {
    return this.filteredTransactions()
      .filter((transaction) => transaction.type === 'revenue')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  });

  /**
   * Expenses for the selected reporting period.
   */
  readonly totalExpenses = computed(() => {
    return this.filteredTransactions()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  });

  /**
   * Net income.
   */
  readonly netIncome = computed(() => this.totalRevenue() - this.totalExpenses());

  /**
   * Profit margin.
   */
  readonly profitMargin = computed(() => {
    const revenue = this.totalRevenue();

    if (revenue === 0) {
      return 0;
    }

    return (this.netIncome() / revenue) * 100;
  });

  // ==========================================================
  // TRANSACTION COUNTS
  // ==========================================================

  /**
   * Number of revenue transactions.
   */
  readonly revenueTransactionCount = computed(() => {
    return this.filteredTransactions().filter((transaction) => transaction.type === 'revenue')
      .length;
  });

  /**
   * Number of expense transactions.
   */
  readonly expenseTransactionCount = computed(() => {
    return this.filteredTransactions().filter((transaction) => transaction.type === 'expense')
      .length;
  });

  // ==========================================================
  // FINANCIAL TREND
  // ==========================================================

  /**
   * Financial activity grouped by day or month.
   */
  readonly financialTrend = computed<FinancialTrend[]>(() => {
    const transactions = this.filteredTransactions();

    const start = this.periodStart();

    const end = this.periodEnd();

    /*
     * Determine the length of the selected range.
     */
    const rangeDays =
      start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;

    /*
     * Short reporting periods are grouped daily.
     *
     * Longer periods are grouped monthly.
     */
    const groupByDay =
      this.selectedPeriod() === 'month' ||
      this.selectedPeriod() === 'last-month' ||
      (this.selectedPeriod() === 'custom' && rangeDays !== null && rangeDays <= 31);

    const groups = new Map<string, FinancialTrend>();

    for (const transaction of transactions) {
      const date = this.getTransactionDate(transaction);

      if (!date) {
        continue;
      }

      let key: string;

      let label: string;

      if (groupByDay) {
        key = [
          date.getFullYear(),

          String(date.getMonth() + 1).padStart(2, '0'),

          String(date.getDate()).padStart(2, '0'),
        ].join('-');

        label = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        }).format(date);
      } else {
        key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0')].join('-');

        label = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          year: 'numeric',
        }).format(date);
      }

      const existing = groups.get(key);

      if (existing) {
        if (transaction.type === 'revenue') {
          existing.revenue += Number(transaction.amount);
        } else if (transaction.type === 'expense') {
          existing.expenses += Number(transaction.amount);
        }
      } else {
        groups.set(key, {
          key,

          label,

          revenue: transaction.type === 'revenue' ? Number(transaction.amount) : 0,

          expenses: transaction.type === 'expense' ? Number(transaction.amount) : 0,

          netIncome: 0,
        });
      }
    }

    /*
     * Calculate net income after grouping.
     */
    return Array.from(groups.values())
      .map((period) => ({
        ...period,

        netIncome: period.revenue - period.expenses,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  });

  /**
   * Largest financial value used to normalize
   * the trend bars.
   */
  readonly trendMaximum = computed(() => {
    let maximum = 0;

    for (const period of this.financialTrend()) {
      const absoluteNetIncome = period.netIncome < 0 ? -period.netIncome : period.netIncome;

      maximum = maximum < period.revenue ? period.revenue : maximum;

      maximum = maximum < period.expenses ? period.expenses : maximum;

      maximum = maximum < absoluteNetIncome ? absoluteNetIncome : maximum;
    }

    return maximum;
  });

  /**
   * Convert an amount to a percentage
   * used by the trend bars.
   */
  getTrendWidth(amount: number, maximum: number): number {
    if (maximum <= 0 || amount <= 0) {
      return 0;
    }

    return Math.min(100, (amount / maximum) * 100);
  }

  // ==========================================================
  // CATEGORY BREAKDOWN
  // ==========================================================

  /**
   * Group transactions by category and type.
   */
  readonly categoryBreakdown = computed<CategoryReport[]>(() => {
    const totals = new Map<
      string,
      {
        name: string;
        type: 'revenue' | 'expense';
        amount: number;
      }
    >();

    for (const transaction of this.filteredTransactions()) {
      const name = transaction.categoryId?.trim() || 'Uncategorized';

      const key = `${transaction.type}:${name}`;

      const existing = totals.get(key);

      if (existing) {
        existing.amount += Number(transaction.amount);
      } else {
        totals.set(key, {
          name,

          type: transaction.type,

          amount: Number(transaction.amount),
        });
      }
    }

    let revenueTotal = 0;

    let expenseTotal = 0;

    for (const item of totals.values()) {
      if (item.type === 'revenue') {
        revenueTotal += item.amount;
      } else {
        expenseTotal += item.amount;
      }
    }

    return Array.from(totals.values())
      .map((item) => {
        const total = item.type === 'revenue' ? revenueTotal : expenseTotal;

        return {
          name: item.name,

          type: item.type,

          amount: item.amount,

          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  });

  /**
   * Revenue-only categories.
   */
  readonly revenueCategories = computed(() =>
    this.categoryBreakdown().filter((category) => category.type === 'revenue'),
  );

  /**
   * Expense-only categories.
   */
  readonly expenseCategories = computed(() =>
    this.categoryBreakdown().filter((category) => category.type === 'expense'),
  );

  // ==========================================================
  // TRANSACTION DATE
  // ==========================================================

  /**
   * Convert the transaction's Firestore date
   * into a JavaScript Date.
   *
   * `date` is the authoritative transaction date
   * used by the Business Operations transaction system.
   */
  private getTransactionDate(transaction: BusinessTransaction): Date | null {
    if (!transaction.date) {
      return null;
    }

    return transaction.date.toDate();
  }

  // ==========================================================
  // DATE HELPERS
  // ==========================================================

  /**
   * Return the beginning of a calendar day.
   */
  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  /**
   * Return the end of a calendar day.
   */
  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  // ==========================================================
  // FORMATTING
  // ==========================================================

  /**
   * Format a financial amount as USD.
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format a report date.
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  // ==========================================================
  // EXPORT
  // ==========================================================

  /**
   * Export the currently selected report.
   *
   * The actual PDF/Excel generation will be added
   * after the reporting calculations are finalized.
   */
  async exportReport(
  format: 'pdf' | 'excel'
): Promise<void> {
  const business = this.store.selectedBusiness();

  if (!business) {
    return;
  }

  const report = {
    businessName:
  (business as Business & { businessName?: string }).businessName
  ?? business.id,
    periodLabel: this.selectedPeriodLabel(),

    revenue: this.totalRevenue(),
    expenses: this.totalExpenses(),
    netIncome: this.netIncome(),
    transactionCount: this.filteredTransactions().length,

    revenueTransactionCount: this.revenueTransactionCount(),
    expenseTransactionCount: this.expenseTransactionCount(),

    overdueCompliance:
      this.store.overdueCompliance(),

    actionRequiredCompliance:
      this.store.actionRequiredCompliance(),

    upcomingCompliance:
      this.store.upcomingCompliance(),

    documentCount:
      this.store.documents().length,

    activityCount:
      this.store.activities().length,

    financialTrend:
      this.financialTrend(),

    categoryBreakdown:
      this.categoryBreakdown(),

    transactions:
      this.filteredTransactions().map(transaction => ({
        date:
          this.getTransactionDate(transaction)
            ?.toLocaleDateString() ?? '',

        type: transaction.type,

        category:
          transaction.categoryId?.trim() ||
          'Uncategorized',

        amount:
          Number(transaction.amount),

        status:
          transaction.status,
      })),
  };

  if (format === 'pdf') {
    this.reportExportService.exportPdf(report);
    return;
  }

  this.reportExportService.exportExcel(report);
}
}
