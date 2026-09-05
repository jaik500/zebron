import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HotToastService } from '@ngxpert/hot-toast';

import { BusinessStore } from '../../store/business.store';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { BusinessTransactionDialogComponent } from '../../components/transaction-dialog/business-transaction-dialog.component';

import { Timestamp } from 'firebase/firestore';

import { BusinessTransaction } from '../../models/business-transaction.model';

import { AuthService } from '../../../../core/services/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { BusinessActivityDialogComponent } from '../../components/activity-dialog/business-activity-dialog.component';

import { BusinessActivity } from '../../models/business-activity.model';

import { BusinessComplianceRequirement } from '../../models/business-compliance.model';

import { BusinessComplianceDialogComponent } from '../../components/compliance-dialog/business-compliance-dialog.component';

import { CollapsibleRecord } from '../../../../shared/components/collapsible-record/collapsible-record';

import { BusinessDocumentsComponent } from '../business-documents/business-documents.component';

import { BusinessReportsComponent } from '../business-reports/business-reports.component';

@Component({
  selector: 'app-business-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    // Angular CDK Drag & Drop
    CdkDropList,

    // Angular Material
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,

    // Shared Zebron components
    CollapsibleRecord,
    BusinessDocumentsComponent,
    BusinessReportsComponent,
  ],

  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->

    <main class="min-h-screen bg-gray-50">
      <!-- =======================================================
           HEADER
           ======================================================= -->

      <header class="bg-[#032D42] text-white">
        <div
          class="mx-auto max-w-7xl
                 px-4 py-2
                 sm:px-6
                 lg:px-8"
        >
          <div
            class="flex flex-col
                   gap-4
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >
            <div>
              <p
                class="text-xs
                       font-semibold
                       uppercase
                       tracking-wider
                       text-[#7ED6D1]"
              >
                Administration
              </p>

              <h1
                class="mt-1
                       text-2xl
                       font-bold
                       sm:text-3xl"
              >
                Business Operations
              </h1>

              <p
                class="mt-2
                       max-w-2xl
                       text-sm
                       text-gray-200"
              >
                Manage Zebron's business activities, finances, compliance records, and supporting
                documents.
              </p>
            </div>

            <a routerLink="/admin" mat-stroked-button class="!border-white !text-white">
              <mat-icon> arrow_back </mat-icon>

              Admin Dashboard
            </a>
          </div>
        </div>
      </header>

      <!-- =======================================================
           CONTENT
           ======================================================= -->

      <div
        class="mx-auto max-w-7xl
               px-4 py-4
               sm:px-6
               lg:px-8"
      >
        <!-- =====================================================
             LOADING
             ===================================================== -->

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" class="mb-6" />
        }

        <!-- =====================================================
             ERROR
             ===================================================== -->

        @if (store.error()) {
          <mat-card
            class="mb-6
                   !border
                   !border-red-200
                   !bg-red-50"
          >
            <mat-card-content>
              <div
                class="flex
                       items-center
                       gap-3
                       text-red-700"
              >
                <mat-icon> error_outline </mat-icon>

                <span>
                  {{ store.error() }}
                </span>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- =====================================================
             SUMMARY CARDS
             ===================================================== -->

        <section
          class="mb-6
                 grid
                 grid-cols-1
                 gap-4
                 sm:grid-cols-2
                 lg:grid-cols-4"
        >
          <!-- Revenue -->

          <mat-card>
            <mat-card-content>
              <div
                class="flex
                       items-center
                       justify-between"
              >
                <div>
                  <p class="text-sm text-gray-500">Total Revenue</p>

                  <p
                    class="mt-1
                           text-2xl
                           font-bold
                           text-[#032D42]"
                  >
                    {{ store.totalRevenue() | currency: 'USD' }}
                  </p>
                </div>

                <mat-icon
                  class="!text-2xl
                         !text-[#007979]"
                >
                  trending_up
                </mat-icon>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Expenses -->

          <mat-card>
            <mat-card-content>
              <div
                class="flex
                       items-center
                       justify-between"
              >
                <div>
                  <p class="text-sm text-gray-500">Total Expenses</p>

                  <p
                    class="mt-1
                           text-2xl
                           font-bold
                           text-[#032D42]"
                  >
                    {{ store.totalExpenses() | currency: 'USD' }}
                  </p>
                </div>

                <mat-icon
                  class="!text-2xl
                         !text-orange-600"
                >
                  trending_down
                </mat-icon>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Net -->

          <mat-card>
            <mat-card-content>
              <div
                class="flex
                       items-center
                       justify-between"
              >
                <div>
                  <p class="text-sm text-gray-500">Net Income</p>

                  <p
                    class="mt-1
                           text-2xl
                           font-bold
                           text-[#032D42]"
                  >
                    {{ store.netIncome() | currency: 'USD' }}
                  </p>
                </div>

                <mat-icon
                  class="!text-2xl
                         !text-[#007979]"
                >
                  account_balance
                </mat-icon>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Compliance -->

          <mat-card>
            <mat-card-content>
              <div
                class="flex
                       items-center
                       justify-between"
              >
                <div>
                  <p class="text-sm text-gray-500">Current Compliance</p>

                  <p
                    class="mt-1
                           text-2xl
                           font-bold
                           text-[#032D42]"
                  >
                    {{ complianceCurrentCount() }}
                  </p>
                </div>

                <mat-icon
                  class="!text-2xl
                         !text-[#007979]"
                >
                  verified_user
                </mat-icon>
              </div>
            </mat-card-content>
          </mat-card>
        </section>

        <!-- =====================================================
             BUSINESS TABS
             ===================================================== -->

        <mat-card>
          <mat-card-content class="!p-0">
            <mat-tab-group animationDuration="200ms">
              <!-- =================================================
                   OVERVIEW
                   ================================================= -->

              <!-- =================================================
                   OVERVIEW
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2">dashboard</mat-icon>
                  Overview
                </ng-template>

                <div class="p-4 sm:p-6">
                  <!-- =================================================
                       FINANCIAL KPIs
                       ================================================= -->

                  <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <!-- Revenue -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-content>
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Revenue
                            </p>

                            <p class="mt-1 text-2xl font-bold text-[#032D42]">
                              {{ store.totalRevenue() | currency: 'USD' }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500">Total recorded revenue</p>
                          </div>

                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"
                          >
                            <mat-icon class="!text-emerald-600"> trending_up </mat-icon>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Expenses -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-content>
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Expenses
                            </p>

                            <p class="mt-1 text-2xl font-bold text-[#032D42]">
                              {{ store.totalExpenses() | currency: 'USD' }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500">Total recorded expenses</p>
                          </div>

                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50"
                          >
                            <mat-icon class="!text-orange-600"> trending_down </mat-icon>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Net Income -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-content>
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Net Income
                            </p>

                            <p
                              class="mt-1 text-2xl font-bold"
                              [class.text-emerald-700]="isProfitable()"
                              [class.text-red-700]="!isProfitable()"
                            >
                              {{ store.netIncome() | currency: 'USD' }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500">Revenue less expenses</p>
                          </div>

                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            [class.bg-emerald-50]="isProfitable()"
                            [class.bg-red-50]="!isProfitable()"
                          >
                            <mat-icon
                              [class.!text-emerald-600]="isProfitable()"
                              [class.!text-red-600]="!isProfitable()"
                            >
                              account_balance
                            </mat-icon>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Compliance -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-content>
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Compliance
                            </p>

                            <p class="mt-1 text-2xl font-bold text-[#032D42]">
                              {{ complianceHealthPercentage() }}%
                            </p>

                            <p class="mt-1 text-xs text-gray-500">
                              {{ complianceCurrentCount() }} of {{ complianceTotalCount() }} current
                            </p>
                          </div>

                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50"
                          >
                            <mat-icon class="!text-[#007979]"> verified_user </mat-icon>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </section>

                  <!-- =================================================
                       FINANCIAL + COMPLIANCE HEALTH
                       ================================================= -->

                  <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <!-- Financial Health -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Financial Health </mat-card-title>

                        <mat-card-subtitle> Current business financial position </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        <div class="space-y-4">
                          <div>
                            <div class="mb-1 flex items-center justify-between text-sm">
                              <span class="text-gray-600"> Revenue </span>

                              <strong class="text-gray-800">
                                {{ store.totalRevenue() | currency: 'USD' }}
                              </strong>
                            </div>

                            <mat-progress-bar
                              mode="determinate"
                              [value]="store.totalRevenue() > 0 ? 100 : 0"
                            />
                          </div>

                          <div>
                            <div class="mb-1 flex items-center justify-between text-sm">
                              <span class="text-gray-600"> Expenses </span>

                              <strong class="text-gray-800">
                                {{ store.totalExpenses() | currency: 'USD' }}
                              </strong>
                            </div>

                            <mat-progress-bar
                              mode="determinate"
                              [value]="
                                store.totalRevenue() > 0
                                  ? (store.totalExpenses() / store.totalRevenue()) * 100
                                  : 0
                              "
                            />
                          </div>

                          <div
                            class="flex items-center justify-between border-t border-gray-100 pt-4"
                          >
                            <div>
                              <p class="text-sm font-semibold text-gray-700">Net Income</p>

                              <p class="mt-0.5 text-xs text-gray-500">Current recorded position</p>
                            </div>

                            <strong
                              class="text-lg"
                              [class.text-emerald-700]="isProfitable()"
                              [class.text-red-700]="!isProfitable()"
                            >
                              {{ store.netIncome() | currency: 'USD' }}
                            </strong>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Compliance Health -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Compliance Health </mat-card-title>

                        <mat-card-subtitle> Items requiring attention </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        <div class="mb-4 flex items-center justify-between">
                          <div>
                            <p class="text-3xl font-bold text-[#032D42]">
                              {{ complianceHealthPercentage() }}%
                            </p>

                            <p class="text-xs text-gray-500">Current compliance rate</p>
                          </div>

                          <div class="text-right">
                            <p class="text-sm font-semibold text-red-600">
                              {{ store.overdueCompliance() }}
                            </p>

                            <p class="text-xs text-gray-500">Overdue</p>
                          </div>
                        </div>

                        <mat-progress-bar
                          mode="determinate"
                          [value]="complianceHealthPercentage()"
                        />

                        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div class="rounded-lg bg-emerald-50 p-3">
                            <p class="text-lg font-bold text-emerald-700">
                              {{ complianceCurrentCount() }}
                            </p>

                            <p class="text-[11px] text-gray-600">Current</p>
                          </div>

                          <div class="rounded-lg bg-amber-50 p-3">
                            <p class="text-lg font-bold text-amber-700">
                              {{ store.upcomingCompliance() }}
                            </p>

                            <p class="text-[11px] text-gray-600">Upcoming</p>
                          </div>

                          <div class="rounded-lg bg-red-50 p-3">
                            <p class="text-lg font-bold text-red-700">
                              {{ store.overdueCompliance() }}
                            </p>

                            <p class="text-[11px] text-gray-600">Overdue</p>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </section>

                  <!-- =================================================
                       QUICK ACTIONS
                       ================================================= -->

                  <section class="mt-4">
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Quick Actions </mat-card-title>

                        <mat-card-subtitle> Common business operations </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            mat-stroked-button
                            type="button"
                            class="!justify-start"
                            (click)="openAddTransaction()"
                          >
                            <mat-icon>add_card</mat-icon>
                            Add Transaction
                          </button>

                          <button
                            mat-stroked-button
                            type="button"
                            class="!justify-start"
                            (click)="openAddActivity()"
                          >
                            <mat-icon>business_center</mat-icon>
                            Add Activity
                          </button>

                          <button
                            mat-stroked-button
                            type="button"
                            class="!justify-start"
                            (click)="openAddCompliance()"
                          >
                            <mat-icon>verified_user</mat-icon>
                            Add Compliance Requirement
                          </button>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </section>

                  <!-- ============================================================
     FINANCIAL TREND
     ============================================================ -->

                  <mat-card class="!rounded-xl !border !border-slate-200 !shadow-sm">
                    <mat-card-header class="!px-5 !pt-5">
                      <div class="flex w-full items-start justify-between gap-4">
                        <div>
                          <mat-card-title class="!text-base !font-semibold !text-slate-900">
                            Financial Trend
                          </mat-card-title>

                          <mat-card-subtitle class="!mt-1 !text-xs !text-slate-500">
                            Revenue, expenses, and net income over the last six months.
                          </mat-card-subtitle>
                        </div>

                        <div class="hidden items-center gap-4 sm:flex">
                          <div class="flex items-center gap-1.5">
                            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <span class="text-[11px] text-slate-500">Revenue</span>
                          </div>

                          <div class="flex items-center gap-1.5">
                            <span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                            <span class="text-[11px] text-slate-500">Expenses</span>
                          </div>

                          <div class="flex items-center gap-1.5">
                            <span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                            <span class="text-[11px] text-slate-500">Net Income</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-header>

                    <mat-card-content class="!px-5 !pb-5 !pt-5">
                      @if (financialTrend().length > 0) {
                        <div class="space-y-5">
                          @for (month of financialTrend(); track month.key) {
                            <div>
                              <!-- Month header -->
                              <div class="mb-2 flex items-center justify-between gap-3">
                                <span class="w-10 text-xs font-semibold text-slate-700">
                                  {{ month.label }}
                                </span>

                                <div class="flex flex-1 items-center justify-end gap-3">
                                  <span
                                    class="text-[11px] font-medium text-emerald-700"
                                    [matTooltip]="'Revenue: ' + formatCurrency(month.revenue)"
                                  >
                                    {{ formatCurrency(month.revenue) }}
                                  </span>

                                  <span
                                    class="text-[11px] font-medium text-amber-700"
                                    [matTooltip]="'Expenses: ' + formatCurrency(month.expenses)"
                                  >
                                    {{ formatCurrency(month.expenses) }}
                                  </span>

                                  <span
                                    class="min-w-[90px] text-right text-[11px] font-semibold"
                                    [class.text-blue-700]="month.netIncome >= 0"
                                    [class.text-red-700]="month.netIncome < 0"
                                    [matTooltip]="'Net Income: ' + formatCurrency(month.netIncome)"
                                  >
                                    {{ formatCurrency(month.netIncome) }}
                                  </span>
                                </div>
                              </div>

                              <!-- Revenue -->
                              <div class="mb-1 flex items-center gap-2">
                                <span class="w-10 text-[10px] text-slate-400"> Rev </span>

                                <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    class="h-full rounded-full bg-emerald-500 transition-all"
                                    [style.width.%]="financialTrendWidth(month.revenue)"
                                  ></div>
                                </div>
                              </div>

                              <!-- Expenses -->
                              <div class="mb-1 flex items-center gap-2">
                                <span class="w-10 text-[10px] text-slate-400"> Exp </span>

                                <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    class="h-full rounded-full bg-amber-500 transition-all"
                                    [style.width.%]="financialTrendWidth(month.expenses)"
                                  ></div>
                                </div>
                              </div>

                              <!-- Net Income -->
                              <div class="flex items-center gap-2">
                                <span class="w-10 text-[10px] text-slate-400"> Net </span>

                                <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  @if (month.netIncome >= 0) {
                                    <div
                                      class="h-full rounded-full bg-blue-500 transition-all"
                                      [style.width.%]="financialTrendWidth(month.netIncome)"
                                    ></div>
                                  } @else {
                                    <div
                                      class="h-full rounded-full bg-red-500 transition-all"
                                      [style.width.%]="financialTrendWidth(-month.netIncome)"
                                    ></div>
                                  }
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="flex flex-col items-center justify-center py-10 text-center">
                          <mat-icon class="!mb-2 !h-10 !w-10 !text-[40px] !text-slate-300">
                            show_chart
                          </mat-icon>

                          <p class="text-sm font-medium text-slate-700">No financial data yet</p>

                          <p class="mt-1 max-w-sm text-xs text-slate-500">
                            Add revenue or expense transactions to start tracking your financial
                            trend.
                          </p>

                          <button
                            mat-stroked-button
                            type="button"
                            class="!mt-4"
                            (click)="openAddTransaction()"
                          >
                            <mat-icon class="mr-1">add</mat-icon>
                            Add Transaction
                          </button>
                        </div>
                      }
                    </mat-card-content>
                  </mat-card>

                  <!-- ============================================================
     MONTH-OVER-MONTH COMPARISON
     ============================================================ -->

                  <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <!-- Header -->
                    <div
                      class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 class="text-base font-semibold text-slate-900">Month-over-Month</h3>

                        <p class="text-xs text-slate-500">
                          Comparing
                          {{ monthComparison().currentMonthLabel }}
                          with
                          {{ monthComparison().previousMonthLabel }}
                        </p>
                      </div>

                      <div class="flex items-center gap-1 text-xs text-slate-500">
                        <mat-icon class="!h-4 !w-4 !text-[16px]"> compare_arrows </mat-icon>

                        <span>Current vs previous month</span>
                      </div>
                    </div>

                    <!-- Comparison Cards -->
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <!-- Revenue -->
                      <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Revenue
                            </p>

                            <p class="mt-1 text-xl font-semibold text-slate-900">
                              {{ formatCurrency(monthComparison().current.revenue) }}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                              Previous:
                              {{ formatCurrency(monthComparison().previous.revenue) }}
                            </p>
                          </div>

                          <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100"
                          >
                            <mat-icon class="!h-5 !w-5 !text-[20px] text-emerald-600">
                              trending_up
                            </mat-icon>
                          </div>
                        </div>

                        <div class="mt-3 flex items-center gap-1.5">
                          <span
                            class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            [class.bg-emerald-50]="
                              comparisonIsPositive(monthComparison().revenueChange, 'revenue')
                            "
                            [class.text-emerald-700]="
                              comparisonIsPositive(monthComparison().revenueChange, 'revenue')
                            "
                            [class.bg-red-50]="
                              !comparisonIsPositive(monthComparison().revenueChange, 'revenue')
                            "
                            [class.text-red-700]="
                              !comparisonIsPositive(monthComparison().revenueChange, 'revenue')
                            "
                          >
                            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">
                              {{ comparisonIcon(monthComparison().revenueChange) }}
                            </mat-icon>

                            {{ comparisonChangeLabel(monthComparison().revenueChange) }}
                          </span>

                          <span class="text-xs text-slate-500"> vs previous month </span>
                        </div>
                      </div>

                      <!-- Expenses -->
                      <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Expenses
                            </p>

                            <p class="mt-1 text-xl font-semibold text-slate-900">
                              {{ formatCurrency(monthComparison().current.expenses) }}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                              Previous:
                              {{ formatCurrency(monthComparison().previous.expenses) }}
                            </p>
                          </div>

                          <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100"
                          >
                            <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600">
                              payments
                            </mat-icon>
                          </div>
                        </div>

                        <div class="mt-3 flex items-center gap-1.5">
                          <span
                            class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            [class.bg-emerald-50]="
                              comparisonIsPositive(monthComparison().expensesChange, 'expenses')
                            "
                            [class.text-emerald-700]="
                              comparisonIsPositive(monthComparison().expensesChange, 'expenses')
                            "
                            [class.bg-red-50]="
                              !comparisonIsPositive(monthComparison().expensesChange, 'expenses')
                            "
                            [class.text-red-700]="
                              !comparisonIsPositive(monthComparison().expensesChange, 'expenses')
                            "
                          >
                            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">
                              {{ comparisonIcon(monthComparison().expensesChange) }}
                            </mat-icon>

                            {{ comparisonChangeLabel(monthComparison().expensesChange) }}
                          </span>

                          <span class="text-xs text-slate-500"> vs previous month </span>
                        </div>
                      </div>

                      <!-- Net Income -->
                      <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Net Income
                            </p>

                            <p
                              class="mt-1 text-xl font-semibold"
                              [class.text-emerald-600]="monthComparison().current.netIncome >= 0"
                              [class.text-red-600]="monthComparison().current.netIncome < 0"
                            >
                              {{ formatCurrency(monthComparison().current.netIncome) }}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                              Previous:
                              {{ formatCurrency(monthComparison().previous.netIncome) }}
                            </p>
                          </div>

                          <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            [class.bg-emerald-100]="monthComparison().current.netIncome >= 0"
                            [class.bg-red-100]="monthComparison().current.netIncome < 0"
                          >
                            <mat-icon
                              class="!h-5 !w-5 !text-[20px]"
                              [class.text-emerald-600]="monthComparison().current.netIncome >= 0"
                              [class.text-red-600]="monthComparison().current.netIncome < 0"
                            >
                              account_balance
                            </mat-icon>
                          </div>
                        </div>

                        <div class="mt-3 flex items-center gap-1.5">
                          <span
                            class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            [class.bg-emerald-50]="
                              comparisonIsPositive(monthComparison().netIncomeChange, 'netIncome')
                            "
                            [class.text-emerald-700]="
                              comparisonIsPositive(monthComparison().netIncomeChange, 'netIncome')
                            "
                            [class.bg-red-50]="
                              !comparisonIsPositive(monthComparison().netIncomeChange, 'netIncome')
                            "
                            [class.text-red-700]="
                              !comparisonIsPositive(monthComparison().netIncomeChange, 'netIncome')
                            "
                          >
                            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">
                              {{ comparisonIcon(monthComparison().netIncomeChange) }}
                            </mat-icon>

                            {{ comparisonChangeLabel(monthComparison().netIncomeChange) }}
                          </span>

                          <span class="text-xs text-slate-500"> vs previous month </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- =================================================
                       RECENT OPERATIONS
                       ================================================= -->

                  <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <!-- Recent Transactions -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <div class="flex w-full items-start justify-between gap-4">
                          <div>
                            <mat-card-title> Recent Transactions </mat-card-title>

                            <mat-card-subtitle> Latest financial activity </mat-card-subtitle>
                          </div>

                          <span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {{ store.transactionCount() }}
                          </span>
                        </div>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        @if (recentTransactions().length > 0) {
                          <div class="divide-y divide-gray-100">
                            @for (transaction of recentTransactions(); track transaction.id) {
                              <div class="flex items-center justify-between gap-3 py-3">
                                <div class="min-w-0">
                                  <p class="truncate text-sm font-medium text-gray-800">
                                    {{ transaction.description || 'Transaction' }}
                                  </p>

                                  <p class="mt-0.5 text-xs text-gray-500">
                                    {{ transaction.date.toDate() | date: 'MMM d, yyyy' }}
                                    ·
                                    {{ transaction.categoryId || 'Uncategorized' }}
                                  </p>
                                </div>

                                <span
                                  class="shrink-0 text-sm font-semibold"
                                  [class.text-emerald-700]="transaction.type === 'revenue'"
                                  [class.text-orange-700]="transaction.type === 'expense'"
                                >
                                  {{ transaction.type === 'expense' ? '-' : '+' }}
                                  {{ transaction.amount | currency: 'USD' }}
                                </span>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="py-8 text-center">
                            <mat-icon class="!text-4xl !text-gray-300"> receipt_long </mat-icon>

                            <p class="mt-2 text-sm text-gray-500">No transactions recorded yet.</p>
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>

                    <!-- Compliance Attention -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Compliance Attention </mat-card-title>

                        <mat-card-subtitle> Requirements that may need action </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        @if (priorityCompliance().length > 0) {
                          <div class="divide-y divide-gray-100">
                            @for (item of priorityCompliance(); track item.id) {
                              <div class="flex items-center justify-between gap-3 py-3">
                                <div class="min-w-0">
                                  <p class="truncate text-sm font-medium text-gray-800">
                                    {{ item.name }}
                                  </p>

                                  @if (item.authority) {
                                    <p class="mt-0.5 truncate text-xs text-gray-500">
                                      {{ item.authority }}
                                    </p>
                                  }
                                </div>

                                <span
                                  class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                                  [class.bg-red-50]="
                                    item.status === 'overdue' || item.status === 'expired'
                                  "
                                  [class.text-red-700]="
                                    item.status === 'overdue' || item.status === 'expired'
                                  "
                                  [class.bg-amber-50]="item.status === 'action_required'"
                                  [class.text-amber-700]="item.status === 'action_required'"
                                >
                                  {{ item.status | titlecase }}
                                </span>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="py-8 text-center">
                            <mat-icon class="!text-4xl !text-emerald-500"> verified </mat-icon>

                            <p class="mt-2 text-sm font-medium text-gray-700">
                              No compliance items require immediate attention.
                            </p>

                            <p class="mt-1 text-xs text-gray-500">
                              Your current compliance records look good.
                            </p>
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>
                  </section>

                  <!-- =================================================
                       ACTIVITY + DOCUMENTS
                       ================================================= -->

                  <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <!-- Recent Activities -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Recent Activities </mat-card-title>

                        <mat-card-subtitle> Latest business operations </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        @if (recentActivities().length > 0) {
                          <div class="divide-y divide-gray-100">
                            @for (activity of recentActivities(); track activity.id) {
                              <div class="py-3">
                                <div class="flex items-center justify-between gap-3">
                                  <p class="truncate text-sm font-medium text-gray-800">
                                    {{ activity.name }}
                                  </p>

                                  <mat-chip>
                                    {{ activity.status | titlecase }}
                                  </mat-chip>
                                </div>

                                <p class="mt-1 text-xs text-gray-500">
                                  {{ activity.category | titlecase }}
                                </p>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="py-8 text-center">
                            <mat-icon class="!text-4xl !text-gray-300"> business_center </mat-icon>

                            <p class="mt-2 text-sm text-gray-500">
                              No business activities recorded yet.
                            </p>
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>

                    <!-- Recent Documents -->
                    <mat-card class="!border !shadow-none">
                      <mat-card-header>
                        <mat-card-title> Recent Documents </mat-card-title>

                        <mat-card-subtitle> Latest uploaded business documents </mat-card-subtitle>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        @if (recentDocuments().length > 0) {
                          <div class="divide-y divide-gray-100">
                            @for (document of recentDocuments(); track document.id) {
                              <div class="flex items-center gap-3 py-3">
                                <div
                                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100"
                                >
                                  <mat-icon class="!text-[#032D42]"> description </mat-icon>
                                </div>

                                <div class="min-w-0 flex-1">
                                  <p
                                    class="truncate text-sm font-medium text-gray-800"
                                    [matTooltip]="document.fileName"
                                  >
                                    {{ document.fileName }}
                                  </p>

                                  <p class="mt-0.5 text-xs text-gray-500">
                                    {{ document.category | titlecase }}
                                    ·
                                    {{ document.uploadedAt.toDate() | date: 'MMM d, yyyy' }}
                                  </p>
                                </div>

                                @if (document.verified) {
                                  <mat-icon
                                    class="!text-emerald-600"
                                    matTooltip="Verified document"
                                  >
                                    verified
                                  </mat-icon>
                                }
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="py-8 text-center">
                            <mat-icon class="!text-4xl !text-gray-300"> folder </mat-icon>

                            <p class="mt-2 text-sm text-gray-500">
                              No business documents uploaded yet.
                            </p>
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>
                  </section>
                </div>
              </mat-tab>
              <!-- =================================================
                   TRANSACTIONS
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> receipt_long </mat-icon>

                  Transactions
                </ng-template>

                <div class="p-4 sm:p-6">
                  <div
                    class="mb-6
                           flex
                           flex-col
                           gap-4
                           lg:flex-row
                           lg:items-end
                           lg:justify-between"
                  >
                    <div>
                      <h2
                        class="text-xl
                               font-semibold
                               text-[#032D42]"
                      >
                        Transaction Ledger
                      </h2>

                      <p class="mt-1 text-sm text-gray-500">
                        {{ store.transactionCount() }}
                        transactions
                      </p>
                    </div>

                    <div
                      class="flex
                             flex-col
                             gap-3
                             sm:flex-row
                             sm:items-center"
                    >
                      <mat-form-field appearance="outline" class="w-full sm:w-72">
                        <mat-label> Search transactions </mat-label>

                        <mat-icon matPrefix> search </mat-icon>

                        <input
                          matInput
                          type="text"
                          placeholder="Description, vendor, reference..."
                          (input)="store.setTransactionSearch($any($event.target).value)"
                        />

                        @if (store.transactionSearch()) {
                          <button
                            mat-icon-button
                            matSuffix
                            type="button"
                            aria-label="Clear search"
                            (click)="store.setTransactionSearch('')"
                          >
                            <mat-icon> close </mat-icon>
                          </button>
                        }
                      </mat-form-field>

                      <div
                        class="flex
                               rounded-xl
                               border
                               border-gray-200
                               bg-white
                               p-1"
                      >
                        <button
                          mat-button
                          type="button"
                          [class.!bg-[#007979]]="store.transactionType() === 'all'"
                          [class.!text-white]="store.transactionType() === 'all'"
                          (click)="store.setTransactionType('all')"
                        >
                          All
                        </button>

                        <button
                          mat-button
                          type="button"
                          [class.!bg-[#007979]]="store.transactionType() === 'revenue'"
                          [class.!text-white]="store.transactionType() === 'revenue'"
                          (click)="store.setTransactionType('revenue')"
                        >
                          Revenue
                        </button>

                        <button
                          mat-button
                          type="button"
                          [class.!bg-[#007979]]="store.transactionType() === 'expense'"
                          [class.!text-white]="store.transactionType() === 'expense'"
                          (click)="store.setTransactionType('expense')"
                        >
                          Expenses
                        </button>
                      </div>

                      <button
                        mat-flat-button
                        color="primary"
                        type="button"
                        (click)="openAddTransaction()"
                      >
                        <mat-icon> add </mat-icon>

                        Add Transaction
                      </button>
                    </div>
                  </div>

                  @if (store.filteredTransactions().length === 0) {
                    <div
                      class="rounded-xl
                             border
                             border-dashed
                             p-8
                             text-center"
                    >
                      <mat-icon
                        class="!text-4xl
                               !text-gray-400"
                      >
                        receipt_long
                      </mat-icon>

                      <h3
                        class="mt-3
                               font-semibold
                               text-gray-700"
                      >
                        No transactions yet
                      </h3>

                      <p
                        class="mt-1
                               text-sm
                               text-gray-500"
                      >
                        Revenue and expenses will appear here.
                      </p>
                    </div>
                  } @else {
                    <div class="overflow-x-auto">
                      <table mat-table [dataSource]="store.filteredTransactions()" class="w-full">
                        <ng-container matColumnDef="date">
                          <th mat-header-cell *matHeaderCellDef>Date</th>

                          <td mat-cell *matCellDef="let transaction">
                            {{ transaction.date?.toDate() | date: 'mediumDate' }}
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="type">
                          <th mat-header-cell *matHeaderCellDef>Type</th>

                          <td mat-cell *matCellDef="let transaction">
                            <mat-chip
                              [class.!bg-green-100]="transaction.type === 'revenue'"
                              [class.!text-green-700]="transaction.type === 'revenue'"
                              [class.!bg-orange-100]="transaction.type === 'expense'"
                              [class.!text-orange-700]="transaction.type === 'expense'"
                            >
                              <mat-icon class="mr-1 !text-base">
                                {{
                                  transaction.type === 'revenue' ? 'trending_up' : 'trending_down'
                                }}
                              </mat-icon>

                              {{ transaction.type | titlecase }}
                            </mat-chip>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="description">
                          <th mat-header-cell *matHeaderCellDef>Description</th>

                          <td mat-cell *matCellDef="let transaction">
                            <div class="min-w-40">
                              <p class="font-medium text-gray-800">
                                {{ transaction.description || '—' }}
                              </p>

                              @if (transaction.referenceNumber) {
                                <p class="text-xs text-gray-500">
                                  Ref: {{ transaction.referenceNumber }}
                                </p>
                              }
                            </div>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="category">
                          <th mat-header-cell *matHeaderCellDef>Category</th>

                          <td mat-cell *matCellDef="let transaction">
                            {{ transaction.categoryId || '—' }}
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="payment">
                          <th mat-header-cell *matHeaderCellDef>Payment</th>

                          <td mat-cell *matCellDef="let transaction">
                            {{ transaction.paymentMethod || '—' }}
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="status">
                          <th mat-header-cell *matHeaderCellDef>Status</th>

                          <td mat-cell *matCellDef="let transaction">
                            <mat-chip>
                              {{ transaction.status | titlecase }}
                            </mat-chip>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="amount">
                          <th mat-header-cell *matHeaderCellDef class="text-right">Amount</th>

                          <td mat-cell *matCellDef="let transaction" class="text-right">
                            <span
                              class="font-semibold"
                              [class.text-green-700]="transaction.type === 'revenue'"
                              [class.text-orange-700]="transaction.type === 'expense'"
                            >
                              {{ transaction.type === 'expense' ? '-' : '+'
                              }}{{ transaction.amount | currency: 'USD' }}
                            </span>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="actions">
                          <th mat-header-cell *matHeaderCellDef>Actions</th>

                          <td mat-cell *matCellDef="let transaction">
                            <button
                              mat-icon-button
                              matTooltip="Edit transaction"
                              type="button"
                              (click)="openEditTransaction(transaction)"
                            >
                              <mat-icon> edit </mat-icon>
                            </button>

                            <button
                              mat-icon-button
                              matTooltip="Delete transaction"
                              type="button"
                              (click)="deleteTransaction(transaction)"
                            >
                              <mat-icon> delete </mat-icon>
                            </button>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="transactionColumns"></tr>

                        <tr mat-row *matRowDef="let row; columns: transactionColumns"></tr>
                      </table>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- =================================================
                   ACTIVITIES
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> business_center </mat-icon>

                  Activities
                </ng-template>

                <div class="p-4 sm:p-6">
                  <!-- Activity Header -->

                  <div
                    class="mb-5
                           flex
                           flex-col
                           gap-4
                           sm:flex-row
                           sm:items-center
                           sm:justify-between"
                  >
                    <div>
                      <h2
                        class="text-xl
                               font-semibold
                               text-[#032D42]"
                      >
                        Business Activities
                      </h2>

                      <p class="mt-1 text-sm text-gray-500">
                        Track ongoing and planned business operations.
                      </p>
                    </div>

                    <div
                      class="flex
                             flex-col
                             gap-3
                             sm:flex-row
                             sm:items-center"
                    >
                      <!-- Activity Search -->
                      <mat-form-field appearance="outline" class="w-full sm:w-80">
                        <mat-label>Search activities</mat-label>

                        <mat-icon matPrefix>search</mat-icon>

                        <input
                          matInput
                          type="text"
                          placeholder="Name, category, status..."
                          [value]="activitySearch()"
                          (input)="setActivitySearch($any($event.target).value)"
                        />

                        @if (activitySearch()) {
                          <button
                            mat-icon-button
                            matSuffix
                            type="button"
                            aria-label="Clear activity search"
                            matTooltip="Clear search"
                            (click)="clearActivitySearch()"
                          >
                            <mat-icon>close</mat-icon>
                          </button>
                        }
                      </mat-form-field>

                      <button
                        mat-flat-button
                        color="primary"
                        type="button"
                        class="shrink-0"
                        (click)="openAddActivity()"
                      >
                        <mat-icon>add</mat-icon>

                        Add Activity
                      </button>
                    </div>
                  </div>

                  @if (filteredActivities().length > 0) {
                    <!-- =================================================
                         REUSABLE ACTIVITY RECORDS
                         =================================================

                         The draggable record component owns cdkDrag.
                         Angular CDK moves its placeholder to the exact
                         insertion position while dragging. The placeholder
                         is styled by CollapsibleRecord as the insertion cue.
                         ================================================= -->

                    <div
                      cdkDropList
                      class="
                        grid
                        grid-cols-1
                        gap-4
                        md:grid-cols-2
                        lg:grid-cols-3
                      "
                      [cdkDropListData]="filteredActivities()"
                      (cdkDropListDropped)="dropActivity($event)"
                    >
                      @for (activity of filteredActivities(); track activity.id) {
                        <app-collapsible-record
                          [title]="activity.name"
                          [subtitle]="activity.category | titlecase"
                          [showDragHandle]="true"
                          [dragData]="activity"
                          [dropTargetActive]="activeDropTargetKey() === 'activity:' + activity.id"
                          [expanded]="false"
                          (dragEntered)="setDropTarget('activity', activity.id)"
                          (dragExited)="clearDropTarget('activity', activity.id)"
                          (edit)="openEditActivity(activity)"
                          (remove)="deleteActivity(activity)"
                        >
                          <!-- Status -->

                          <div record-header-meta>
                            <mat-chip>
                              {{ activity.status | titlecase }}
                            </mat-chip>
                          </div>

                          <!-- Description -->

                          @if (activity.description) {
                            <div class="mb-4">
                              <p
                                class="text-xs
                                       font-medium
                                       uppercase
                                       tracking-wide
                                       text-gray-400"
                              >
                                Description
                              </p>

                              <p
                                class="mt-1
                                       text-sm
                                       leading-6
                                       text-gray-700"
                              >
                                {{ activity.description }}
                              </p>
                            </div>
                          }

                          <!-- Dates -->

                          <div
                            class="grid
                                   grid-cols-1
                                   gap-4
                                   sm:grid-cols-2"
                          >
                            @if (activity.startDate) {
                              <div>
                                <p
                                  class="text-xs
                                         font-medium
                                         uppercase
                                         tracking-wide
                                         text-gray-400"
                                >
                                  Start Date
                                </p>

                                <p
                                  class="mt-1
                                         text-sm
                                         text-gray-700"
                                >
                                  {{ activity.startDate.toDate() | date: 'MMM d, yyyy' }}
                                </p>
                              </div>
                            }

                            @if (activity.endDate) {
                              <div>
                                <p
                                  class="text-xs
                                         font-medium
                                         uppercase
                                         tracking-wide
                                         text-gray-400"
                                >
                                  End Date
                                </p>

                                <p
                                  class="mt-1
                                         text-sm
                                         text-gray-700"
                                >
                                  {{ activity.endDate.toDate() | date: 'MMM d, yyyy' }}
                                </p>
                              </div>
                            }
                          </div>
                        </app-collapsible-record>
                      }
                    </div>
                  } @else {
                    <!-- Empty State -->

                    <mat-card class="rounded-2xl">
                      <mat-card-content class="py-12 text-center">
                        <mat-icon
                          class="!text-5xl
                                 !text-gray-400"
                        >
                          business_center
                        </mat-icon>

                        <h3
                          class="mt-4
                                 text-lg
                                 font-semibold"
                        >
                          {{
                            activitySearch() ? 'No matching activities' : 'No business activities'
                          }}
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          @if (activitySearch()) {
                            No business activities match "{{ activitySearch() }}".
                          } @else {
                            Add your first business activity to begin tracking operations.
                          }
                        </p>

                        <button
                          mat-flat-button
                          color="primary"
                          class="mt-5"
                          type="button"
                          (click)="openAddActivity()"
                        >
                          <mat-icon> add </mat-icon>

                          Add Activity
                        </button>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </mat-tab>

              <!-- =================================================
                   COMPLIANCE
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> verified_user </mat-icon>

                  Compliance
                </ng-template>

                <div class="p-4 sm:p-6">
                  <!-- Compliance Header -->

                  <div
                    class="mb-5
                           flex
                           flex-col
                           gap-4
                           lg:flex-row
                           lg:items-end
                           lg:justify-between"
                  >
                    <div>
                      <h2
                        class="text-xl
                               font-semibold
                               text-[#032D42]"
                      >
                        Business Compliance
                      </h2>

                      <p class="mt-1 text-sm text-gray-500">
                        Track statutory, tax, licensing, and other compliance requirements.
                      </p>
                    </div>

                    <div
                      class="flex
                             w-full
                             flex-col
                             gap-3
                             sm:flex-row
                             sm:items-center
                             lg:w-auto"
                    >
                      <!-- Compliance Search -->

                      <mat-form-field appearance="outline" class="w-full sm:w-80">
                        <mat-label>Search compliance</mat-label>

                        <mat-icon matPrefix>search</mat-icon>

                        <input
                          matInput
                          type="text"
                          placeholder="Name, category, authority..."
                          [value]="complianceSearch()"
                          (input)="setComplianceSearch($any($event.target).value)"
                        />

                        @if (complianceSearch()) {
                          <button
                            mat-icon-button
                            matSuffix
                            type="button"
                            aria-label="Clear compliance search"
                            matTooltip="Clear search"
                            (click)="clearComplianceSearch()"
                          >
                            <mat-icon>close</mat-icon>
                          </button>
                        }
                      </mat-form-field>

                      <button
                        mat-flat-button
                        color="primary"
                        type="button"
                        class="shrink-0"
                        (click)="openAddCompliance()"
                      >
                        <mat-icon>add</mat-icon>

                        Add Requirement
                      </button>
                    </div>
                  </div>

                  @if (filteredComplianceItems().length > 0) {
                    <!-- =================================================
                         REUSABLE COMPLIANCE RECORDS
                         =================================================

                         The draggable record component owns cdkDrag.
                         Angular CDK moves its placeholder to the exact
                         insertion position while dragging. The placeholder
                         is styled by CollapsibleRecord as the insertion cue.
                         ================================================= -->

                    <div
                      cdkDropList
                      class="
                        grid
                        grid-cols-1
                        gap-4
                        md:grid-cols-2
                        lg:grid-cols-3
                      "
                      [cdkDropListData]="filteredComplianceItems()"
                      (cdkDropListDropped)="dropCompliance($event)"
                    >
                      @for (item of filteredComplianceItems(); track item.id) {
                        <app-collapsible-record
                          [title]="item.name"
                          [showDragHandle]="true"
                          [dragData]="item"
                          [dropTargetActive]="activeDropTargetKey() === 'compliance:' + item.id"
                          [expanded]="false"
                          (dragEntered)="setDropTarget('compliance', item.id)"
                          (dragExited)="clearDropTarget('compliance', item.id)"
                          (edit)="openEditCompliance(item)"
                          (remove)="deleteCompliance(item)"
                        >
                          <!-- Status -->

                          <div record-header-meta>
                            <mat-chip>
                              {{ item.status | titlecase }}
                            </mat-chip>
                          </div>

                          <!-- Authority -->

                          @if (item.authority) {
                            <div class="mb-4">
                              <p
                                class="text-xs
                                       font-medium
                                       uppercase
                                       tracking-wide
                                       text-gray-400"
                              >
                                Authority
                              </p>

                              <p
                                class="mt-1
                                       text-sm
                                       text-gray-700"
                              >
                                {{ item.authority }}
                              </p>
                            </div>
                          }

                          <!-- Compliance Dates -->

                          <div
                            class="grid
                                   grid-cols-1
                                   gap-4
                                   sm:grid-cols-2"
                          >
                            @if (item.dueDate) {
                              <div>
                                <p
                                  class="text-xs
                                         font-medium
                                         uppercase
                                         tracking-wide
                                         text-gray-400"
                                >
                                  Due Date
                                </p>

                                <p
                                  class="mt-1
                                         text-sm
                                         text-gray-700"
                                >
                                  {{ item.dueDate.toDate() | date: 'MMM d, yyyy' }}
                                </p>
                              </div>
                            }

                            @if (item.renewalDate) {
                              <div>
                                <p
                                  class="text-xs
                                         font-medium
                                         uppercase
                                         tracking-wide
                                         text-gray-400"
                                >
                                  Renewal Date
                                </p>

                                <p
                                  class="mt-1
                                         text-sm
                                         text-gray-700"
                                >
                                  {{ item.renewalDate.toDate() | date: 'MMM d, yyyy' }}
                                </p>
                              </div>
                            }

                            @if (item.completedDate) {
                              <div>
                                <p
                                  class="text-xs
                                         font-medium
                                         uppercase
                                         tracking-wide
                                         text-gray-400"
                                >
                                  Completed Date
                                </p>

                                <p
                                  class="mt-1
                                         text-sm
                                         text-gray-700"
                                >
                                  {{ item.completedDate.toDate() | date: 'MMM d, yyyy' }}
                                </p>
                              </div>
                            }

                            <!-- Automatic Monitoring -->

                            <div>
                              <p
                                class="text-xs
                                       font-medium
                                       uppercase
                                       tracking-wide
                                       text-gray-400"
                              >
                                Automatic Monitoring
                              </p>

                              <p class="mt-1 text-sm">
                                @if (item.automaticMonitoring) {
                                  <span
                                    class="font-medium
                                           text-[#007979]"
                                  >
                                    Enabled
                                  </span>
                                } @else {
                                  <span class="text-gray-500"> Disabled </span>
                                }
                              </p>
                            </div>
                          </div>

                          <!-- Notes -->

                          @if (item.notes) {
                            <div class="mt-4">
                              <p
                                class="text-xs
                                       font-medium
                                       uppercase
                                       tracking-wide
                                       text-gray-400"
                              >
                                Notes
                              </p>

                              <p
                                class="mt-1
                                       text-sm
                                       leading-6
                                       text-gray-600"
                              >
                                {{ item.notes }}
                              </p>
                            </div>
                          }
                        </app-collapsible-record>
                      }
                    </div>
                  } @else {
                    <!-- Empty / No Search Results State -->

                    <mat-card class="rounded-2xl">
                      <mat-card-content class="py-12 text-center">
                        <mat-icon
                          class="!text-5xl
                                 !text-gray-400"
                        >
                          {{ complianceSearch() ? 'search_off' : 'verified' }}
                        </mat-icon>

                        <h3
                          class="mt-4
                                 text-lg
                                 font-semibold"
                        >
                          {{
                            complianceSearch()
                              ? 'No matching requirements'
                              : 'No compliance requirements'
                          }}
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          @if (complianceSearch()) {
                            No compliance requirements match "{{ complianceSearch() }}".
                          } @else {
                            Add your first compliance requirement to begin tracking deadlines.
                          }
                        </p>

                        @if (complianceSearch()) {
                          <button
                            mat-button
                            color="primary"
                            class="mt-5"
                            type="button"
                            (click)="clearComplianceSearch()"
                          >
                            Clear Search
                          </button>
                        } @else {
                          <button
                            mat-flat-button
                            color="primary"
                            class="mt-5"
                            type="button"
                            (click)="openAddCompliance()"
                          >
                            <mat-icon>add</mat-icon>

                            Add Requirement
                          </button>
                        }
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </mat-tab>

              <!-- =================================================
     DOCUMENTS
     ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> folder </mat-icon>

                  Documents
                </ng-template>

                <div class="p-4 sm:p-6">
                  <app-business-documents />
                </div>
              </mat-tab>

              <!-- =================================================
                   REPORTS
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> assessment </mat-icon>

                  Reports
                </ng-template>

                <div class="p-4 sm:p-6">
                  <app-business-reports />
                </div>
              </mat-tab>
              <!-- =================================================
                   SETTINGS
                   ================================================= -->

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> settings </mat-icon>

                  Settings
                </ng-template>

                <div class="p-4 sm:p-6">
                  <h2
                    class="text-xl
                           font-semibold
                           text-[#032D42]"
                  >
                    Business Settings
                  </h2>

                  <p
                    class="mt-1
                           text-sm
                           text-gray-500"
                  >
                    Business identity and operational configuration.
                  </p>

                  @if (store.selectedBusiness(); as business) {
                    <mat-card class="mt-6 rounded-2xl">
                      <mat-card-header>
                        <div class="w-full">
                          <mat-card-title
                            class="text-2xl
                                   font-semibold"
                          >
                            Business Profile
                          </mat-card-title>

                          <mat-card-subtitle>
                            Legal and operational business information
                          </mat-card-subtitle>
                        </div>

                        <div class="flex justify-end">
                          <a
                            routerLink="/admin/business/profile"
                            matIconButton
                            matTooltip="Edit Business Profile"
                          >
                            <mat-icon> edit </mat-icon>
                          </a>

                          <a
                            href="https://console.cloud.google.com/cloudscheduler?project=zebron-2b49f"
                            target="_blank"
                            rel="noopener"
                            matIconButton
                            matTooltip="Open Google Cloud Scheduler"
                          >
                            <mat-icon> open_in_new </mat-icon>
                          </a>
                        </div>
                      </mat-card-header>

                      <hr
                        class="border-gray-500
                               border-t-1
                               border-b-0"
                      />

                      <mat-card-content class="pt-6">
                        <div
                          class="grid
                                 grid-cols-1
                                 gap-6
                                 md:grid-cols-2"
                        >
                          <div>
                            <p class="text-sm text-gray-500">Legal Name</p>

                            <p class="font-medium">
                              {{ business.legalName }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">Trade Name</p>

                            <p class="font-medium">
                              {{ business.tradeName || '—' }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">Entity Type</p>

                            <p class="font-medium">
                              {{ business.entityType }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">State of Formation</p>

                            <p class="font-medium">
                              {{ business.stateOfFormation || '—' }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">Industry</p>

                            <p class="font-medium">
                              {{ business.industry || '—' }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">NAICS Code</p>

                            <p class="font-medium">
                              {{ business.naicsCode || '—' }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">Registration Number</p>

                            <p class="font-medium">
                              {{ business.registrationNumber || '—' }}
                            </p>
                          </div>

                          <div>
                            <p class="text-sm text-gray-500">Status</p>

                            <mat-chip>
                              {{ business.status | titlecase }}
                            </mat-chip>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  } @else {
                    <mat-card class="mt-6 rounded-2xl">
                      <mat-card-content class="py-10 text-center">
                        <mat-icon
                          class="text-5xl
                                 text-gray-400"
                        >
                          business
                        </mat-icon>

                        <h3
                          class="mt-4
                                 text-lg
                                 font-semibold"
                        >
                          Business profile not configured
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          Configure the legal and operational identity of your business.
                        </p>

                        <a
                          routerLink="/admin/business/profile"
                          mat-flat-button
                          color="primary"
                          class="mt-5"
                        >
                          <mat-icon> edit </mat-icon>

                          Configure Business Profile
                        </a>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      mat-card {
        border-radius: 16px;
      }

      ::ng-deep .mat-mdc-tab-labels {
        overflow-x: auto;
      }

      ::ng-deep .mat-mdc-tab {
        min-width: 120px;
      }

      /* ============================================================
         DRAG & DROP
         ============================================================ */

      /*
       * The reusable CollapsibleRecord component owns cdkDrag.
       *
       * This dashboard owns only the cdkDropList containers.
       * Do not add transform transitions here because Angular CDK
       * controls the draggable record's transform while dragging.
       */
      .cdk-drop-list-dragging {
        cursor: grabbing;
      }
    `,
  ],
})
export class BusinessDashboardComponent implements OnInit {
  // ============================================================
  // STORE
  // ============================================================

  protected readonly store = inject(BusinessStore);

  // ============================================================
  // DASHBOARD CARD ORDER
  // ============================================================

  /**
   * Stores the user's current visual order for business activities.
   *
   * We store IDs rather than entire objects so that the underlying
   * BusinessStore remains the source of truth for the actual records.
   */
  private readonly activityOrder = signal<string[]>([]);

  /**
   * Stores the user's current visual order for compliance records.
   */
  private readonly complianceOrder = signal<string[]>([]);

  /**
   * Storage key prefix for Business Operations dashboard ordering.
   *
   * The business ID is included so different businesses keep
   * independent ordering preferences on the same browser.
   */
  private readonly dashboardOrderStoragePrefix = 'zebron.business-dashboard.order';

  /**
   * Restores the saved Activity and Compliance ordering.
   *
   * The ordering is a dashboard preference, not business-record data,
   * so it is kept separate from the Activity and Compliance models.
   */
  private loadSavedDashboardOrder(): void {
    const business = this.store.selectedBusiness();

    if (!business || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(`${this.dashboardOrderStoragePrefix}.${business.id}`);

      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw) as {
        activities?: unknown;
        compliance?: unknown;
      };

      if (Array.isArray(saved.activities)) {
        this.activityOrder.set(
          saved.activities.filter((id): id is string => typeof id === 'string'),
        );
      }

      if (Array.isArray(saved.compliance)) {
        this.complianceOrder.set(
          saved.compliance.filter((id): id is string => typeof id === 'string'),
        );
      }
    } catch (error) {
      console.warn('Unable to restore Business Operations dashboard order:', error);
    }
  }

  /**
   * Saves both ordering arrays after a successful drag/drop operation.
   */
  private persistDashboardOrder(activities: string[], compliance: string[]): void {
    const business = this.store.selectedBusiness();

    if (!business || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        `${this.dashboardOrderStoragePrefix}.${business.id}`,
        JSON.stringify({
          activities,
          compliance,
        }),
      );
    } catch (error) {
      console.warn('Unable to save Business Operations dashboard order:', error);
    }
  }

  /**
   * Identifies the Activity or Compliance record currently being
   * hovered by the dragged pointer.
   *
   * The prefix keeps Activity and Compliance IDs isolated even if
   * two records happen to use the same ID.
   */
  protected readonly activeDropTargetKey = signal<string | null>(null);

  /**
   * Activities displayed according to the user's current
   * dashboard ordering.
   *
   * New activities that are not yet in the ordering are appended
   * automatically.
   */
  protected readonly orderedActivities = computed(() => {
    return this.orderRecords(this.store.activities(), this.activityOrder());
  });

  /**
   * Compliance records displayed according to the user's
   * current dashboard ordering.
   */
  protected readonly orderedComplianceItems = computed(() => {
    return this.orderRecords(this.store.complianceItems(), this.complianceOrder());
  });

  /**
   * Search text for the Activities section.
   *
   * Filtering is performed against the records already loaded by the
   * BusinessStore, so typing in the search box does not create another
   * Firestore request.
   */
  protected readonly activitySearch = signal('');

  /**
   * Activity records displayed after applying the search filter.
   *
   * The user's saved dashboard order is preserved because filtering is
   * applied after orderedActivities() has been calculated.
   */
  protected readonly filteredActivities = computed(() => {
    const search = this.activitySearch().trim().toLowerCase();

    if (!search) {
      return this.orderedActivities();
    }

    return this.orderedActivities().filter((activity) =>
      [activity.name, activity.category, activity.status, activity.description]
        .filter((value): value is string => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(search)),
    );
  });

  protected setActivitySearch(value: string): void {
    this.activitySearch.set(value);
  }

  protected clearActivitySearch(): void {
    this.activitySearch.set('');
  }

  /**
   * Search text for the Compliance section.
   *
   * Filtering is performed against the records already loaded by the
   * BusinessStore, so typing in the search box does not create another
   * Firestore request.
   */
  protected readonly complianceSearch = signal('');

  /**
   * Compliance records displayed after applying the search filter.
   *
   * The user's saved dashboard order is preserved because filtering is
   * applied after orderedComplianceItems() has been calculated.
   */
  protected readonly filteredComplianceItems = computed(() => {
    const search = this.complianceSearch().trim().toLowerCase();

    if (!search) {
      return this.orderedComplianceItems();
    }

    return this.orderedComplianceItems().filter((item) =>
      [item.name, item.category, item.jurisdiction, item.authority, item.status, item.notes]
        .filter((value): value is string => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(search)),
    );
  });

  protected setComplianceSearch(value: string): void {
    this.complianceSearch.set(value);
  }

  protected clearComplianceSearch(): void {
    this.complianceSearch.set('');
  }

  // ============================================================
  // TOAST
  // ============================================================

  private readonly toast = inject(HotToastService);

  private readonly authService = inject(AuthService);

  // ============================================================
  // TABLE
  // ============================================================

  protected readonly transactionColumns = [
    'date',
    'type',
    'description',
    'category',
    'payment',
    'status',
    'amount',
    'actions',
  ];

  // ============================================================
  // DIALOG
  // ============================================================

  private readonly dialog = inject(MatDialog);

  // ============================================================
  // REPORT DEFINITIONS
  // ============================================================

  protected readonly reports = [
    {
      title: 'Profit & Loss',
      icon: 'account_balance',
      description: 'Revenue, expenses, and net income.',
    },

    {
      title: 'Revenue',
      icon: 'trending_up',
      description: 'Revenue by period and category.',
    },

    {
      title: 'Expenses',
      icon: 'trending_down',
      description: 'Expenses by period and category.',
    },

    {
      title: 'Cash Flow',
      icon: 'show_chart',
      description: 'Monthly business cash flow.',
    },
  ];

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    /*
     * Load the dashboard data first.
     */

    try {
      await this.store.loadBusinessData();

      // Restore the user's dashboard order after the selected
      // business and its records have been loaded.
      this.loadSavedDashboardOrder();
    } catch (error) {
      console.error('Unable to load business dashboard:', error);

      this.toast.error('Unable to load business operations data.');

      return;
    }

    /*
     * Refresh compliance statuses after the data has loaded.
     *
     * This gives the dashboard an immediate status check rather
     * than waiting for the daily scheduled Cloud Function.
     */

    try {
      await this.store.refreshComplianceStatuses();
    } catch (error) {
      console.error('Unable to refresh compliance statuses:', error);

      this.toast.error('Compliance statuses could not be refreshed.');
    }
  }

  // ============================================================
  // CURRENT COMPLIANCE
  // ============================================================

  protected complianceCurrentCount(): number {
    return this.store.complianceItems().filter((item) => item.status === 'current').length;
  }

  // ============================================================
  // OVERVIEW DASHBOARD
  // ============================================================

  protected readonly isProfitable = computed(() => {
    return this.store.netIncome() >= 0;
  });

  protected readonly complianceTotalCount = computed(() => {
    return this.store.complianceItems().length;
  });

  protected readonly complianceHealthPercentage = computed(() => {
    const total = this.complianceTotalCount();

    if (total === 0) {
      return 100;
    }

    return Math.round((this.complianceCurrentCount() / total) * 100);
  });

  protected readonly recentTransactions = computed(() => {
    return [...this.store.transactions()]
      .filter((transaction) => transaction.status !== 'void')
      .sort((a, b) => {
        const aTime = a.date?.toMillis?.() ?? 0;
        const bTime = b.date?.toMillis?.() ?? 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  });

  protected readonly priorityCompliance = computed(() => {
    return this.store
      .complianceItems()
      .filter(
        (item) =>
          item.status === 'overdue' ||
          item.status === 'expired' ||
          item.status === 'action_required',
      )
      .slice(0, 5);
  });

  protected readonly recentActivities = computed(() => {
    return [...this.store.activities()]
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  });

  protected readonly recentDocuments = computed(() => {
    return [...this.store.documents()]
      .sort((a, b) => {
        const aTime = a.uploadedAt?.toMillis?.() ?? 0;
        const bTime = b.uploadedAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  });

  // ============================================================
  // FINANCIAL TREND
  // ============================================================

  protected readonly financialTrend = computed(() => {
    const transactions = this.store
      .transactions()
      .filter((transaction) => transaction.status !== 'void');

    const months: {
      key: string;
      label: string;
      revenue: number;
      expenses: number;
      netIncome: number;
    }[] = [];

    const now = new Date();

    // Show the last 6 calendar months, including the current month.
    for (let index = 5; index >= 0; index--) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const label = date.toLocaleDateString('en-US', {
        month: 'short',
      });

      months.push({
        key,
        label,
        revenue: 0,
        expenses: 0,
        netIncome: 0,
      });
    }

    for (const transaction of transactions) {
      const date = transaction.date.toDate();

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const month = months.find((item) => item.key === key);

      if (!month) {
        continue;
      }

      if (transaction.type === 'revenue') {
        month.revenue += Number(transaction.amount) || 0;
      }

      if (transaction.type === 'expense') {
        month.expenses += Number(transaction.amount) || 0;
      }
    }

    for (const month of months) {
      month.netIncome = month.revenue - month.expenses;
    }

    return months;
  });

  protected readonly financialTrendMaximum = computed(() => {
    let maximum = 0;

    for (const month of this.financialTrend()) {
      if (month.revenue > maximum) {
        maximum = month.revenue;
      }

      if (month.expenses > maximum) {
        maximum = month.expenses;
      }

      const absoluteNet = month.netIncome < 0 ? -month.netIncome : month.netIncome;

      if (absoluteNet > maximum) {
        maximum = absoluteNet;
      }
    }

    return maximum > 0 ? maximum : 1;
  });

  protected financialTrendWidth(value: number): number {
    const maximum = this.financialTrendMaximum();

    if (maximum <= 0 || value <= 0) {
      return 0;
    }

    const percentage = (value / maximum) * 100;

    return percentage > 100 ? 100 : percentage;
  }

  // ============================================================
  // MONTH-OVER-MONTH COMPARISON
  // ============================================================

  protected readonly monthComparison = computed(() => {
    const transactions = this.store
      .transactions()
      .filter((transaction) => transaction.status !== 'void');

    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let currentRevenue = 0;
    let currentExpenses = 0;

    let previousRevenue = 0;
    let previousExpenses = 0;

    for (const transaction of transactions) {
      const transactionDate = transaction.date.toDate();
      const amount = Number(transaction.amount) || 0;

      if (transactionDate >= currentMonthStart && transactionDate < nextMonthStart) {
        if (transaction.type === 'revenue') {
          currentRevenue += amount;
        }

        if (transaction.type === 'expense') {
          currentExpenses += amount;
        }
      }

      if (transactionDate >= previousMonthStart && transactionDate < currentMonthStart) {
        if (transaction.type === 'revenue') {
          previousRevenue += amount;
        }

        if (transaction.type === 'expense') {
          previousExpenses += amount;
        }
      }
    }

    const currentNetIncome = currentRevenue - currentExpenses;

    const previousNetIncome = previousRevenue - previousExpenses;

    return {
      current: {
        revenue: currentRevenue,
        expenses: currentExpenses,
        netIncome: currentNetIncome,
      },

      previous: {
        revenue: previousRevenue,
        expenses: previousExpenses,
        netIncome: previousNetIncome,
      },

      revenueChange: this.calculatePercentageChange(previousRevenue, currentRevenue),

      expensesChange: this.calculatePercentageChange(previousExpenses, currentExpenses),

      netIncomeChange: this.calculatePercentageChange(previousNetIncome, currentNetIncome),

      currentMonthLabel: currentMonthStart.toLocaleDateString('en-US', { month: 'long' }),

      previousMonthLabel: previousMonthStart.toLocaleDateString('en-US', { month: 'long' }),
    };
  });

  protected calculatePercentageChange(
  previous: number,
  current: number,
): number | null {
  // No change when both periods are zero.
  if (previous === 0 && current === 0) {
    return 0;
  }

  // No meaningful percentage can be calculated when
  // the previous period was zero and the current period
  // has a value. Return null so the UI can display "New".
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

  protected comparisonChangeLabel(
  value: number | null,
): string {
  if (value === null) {
    return 'New';
  }

  if (value === 0) {
    return '0%';
  }

  const rounded =
    Math.round(Math.abs(value) * 10) / 10;

  return value > 0
    ? `+${rounded}%`
    : `−${rounded}%`;
}

  protected comparisonIsPositive(
  value: number | null,
  metric: 'revenue' | 'expenses' | 'netIncome',
): boolean {
  // "New" activity is treated as positive.
  if (value === null) {
    return true;
  }

  if (value === 0) {
    return true;
  }

  // Revenue and net income:
  // increase = positive
  if (
    metric === 'revenue' ||
    metric === 'netIncome'
  ) {
    return value > 0;
  }

  // Expenses:
  // decrease = positive
  return value < 0;
}

 protected comparisonIcon(
  value: number | null,
): string {
  if (value === null) {
    return 'auto_awesome';
  }

  if (value > 0) {
    return 'trending_up';
  }

  if (value < 0) {
    return 'trending_down';
  }

  return 'remove';
}

  // ============================================================
  // CURRENCY
  // ============================================================

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  async openAddTransaction(): Promise<void> {
    const business = this.store.selectedBusiness();

    if (!business) {
      this.toast.error('No business is currently selected.');

      return;
    }

    const dialogRef = this.dialog.open(BusinessTransactionDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: {},
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    const user = this.authService.user();

    if (!user) {
      this.toast.error('You must be signed in.');

      return;
    }

    try {
      await this.store.createTransaction({
        businessId: business.id,

        type: result.type,

        date: Timestamp.fromDate(result.date),

        amount: Number(result.amount),

        categoryId: result.categoryId,

        description: result.description || undefined,

        customerId: result.customerId || undefined,

        vendorId: result.vendorId || undefined,

        paymentMethod: result.paymentMethod || undefined,

        referenceNumber: result.referenceNumber || undefined,

        status: 'completed',

        recurring: result.recurring,

        taxDeductible: result.taxDeductible,

        notes: result.notes || undefined,

        createdBy: user.id,
      });

      this.toast.success('Transaction added successfully.');
    } catch (error) {
      console.error('Unable to create transaction:', error);

      this.toast.error('Unable to save the transaction.');
    }
  }

  async openEditTransaction(transaction: BusinessTransaction): Promise<void> {
    const dialogRef = this.dialog.open(BusinessTransactionDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: {
        transaction,
      },
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    try {
      await this.store.updateTransaction(
        transaction.id,

        {
          type: result.type,

          date: Timestamp.fromDate(result.date),

          amount: Number(result.amount),

          categoryId: result.categoryId,

          description: result.description || undefined,

          customerId: result.customerId || undefined,

          vendorId: result.vendorId || undefined,

          paymentMethod: result.paymentMethod || undefined,

          referenceNumber: result.referenceNumber || undefined,

          recurring: result.recurring,

          taxDeductible: result.taxDeductible,

          notes: result.notes || undefined,
        },
      );

      this.toast.success('Transaction updated successfully.');
    } catch (error) {
      console.error('Unable to update transaction:', error);

      this.toast.error('Unable to update the transaction.');
    }
  }

  async deleteTransaction(transaction: BusinessTransaction): Promise<void> {
    const confirmed = window.confirm(
      `Delete this ${transaction.type} transaction for ${this.formatCurrency(transaction.amount)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.store.deleteTransaction(transaction.id);

      this.toast.success('Transaction deleted successfully.');
    } catch (error) {
      console.error('Unable to delete transaction:', error);

      this.toast.error('Unable to delete the transaction.');
    }
  }

  // ============================================================
  // DASHBOARD ORDERING
  // ============================================================

  /**
   * Orders a collection according to a stored list of IDs.
   *
   * Records that do not yet exist in the saved order are appended
   * automatically. This allows newly created Activities or
   * Compliance records to appear without requiring additional
   * synchronization logic.
   */
  private orderRecords<T extends { id: string }>(records: T[], order: string[]): T[] {
    const recordMap = new Map(records.map((record) => [record.id, record]));

    const ordered = order.map((id) => recordMap.get(id)).filter((record): record is T => !!record);

    const orderedIds = new Set(order);

    const newRecords = records.filter((record) => !orderedIds.has(record.id));

    return [...ordered, ...newRecords];
  }

  /**
   * Marks a record as the current visual drop target.
   */
  protected setDropTarget(type: 'activity' | 'compliance', id: string): void {
    this.activeDropTargetKey.set(`${type}:${id}`);
  }

  /**
   * Clears a record's visual drop-target state when the dragged
   * pointer leaves it. The key check prevents an older exit event
   * from clearing a newer target after the pointer moves quickly.
   */
  protected clearDropTarget(type: 'activity' | 'compliance', id: string): void {
    const key = `${type}:${id}`;

    if (this.activeDropTargetKey() === key) {
      this.activeDropTargetKey.set(null);
    }
  }

  /**
   * Clears the visual target after a successful drop.
   */
  private clearActiveDropTarget(): void {
    this.activeDropTargetKey.set(null);
  }

  /**
   * Handles reordering of Business Activity cards.
   */
  protected dropActivity(event: CdkDragDrop<BusinessActivity[]>): void {
    /*
     * When no search is active, CDK indexes map directly to the complete
     * Activity collection, so the normal move operation is sufficient.
     */
    if (!this.activitySearch().trim()) {
      const currentOrder = [...this.orderedActivities().map((item) => item.id)];

      moveItemInArray(currentOrder, event.previousIndex, event.currentIndex);

      this.activityOrder.set(currentOrder);

      this.persistDashboardOrder(currentOrder, this.complianceOrder());

      this.clearActiveDropTarget();

      return;
    }

    /*
     * When a search is active, CDK indexes belong to the filtered
     * collection rather than the complete Activity collection. Rebuild
     * the full order so filtering never corrupts the saved ordering.
     */
    const visibleItems = this.filteredActivities();
    const draggedItem = event.item.data as BusinessActivity | undefined;

    const draggedId = draggedItem?.id ?? visibleItems[event.previousIndex]?.id;

    if (!draggedId) {
      this.clearActiveDropTarget();
      return;
    }

    const fullOrder = [...this.orderedActivities().map((item) => item.id)];
    const withoutDragged = fullOrder.filter((id) => id !== draggedId);

    const visibleIdsAfterRemoval = visibleItems
      .map((item) => item.id)
      .filter((id) => id !== draggedId);

    const targetVisibleId = visibleIdsAfterRemoval[event.currentIndex];

    let insertionIndex: number;

    if (targetVisibleId) {
      insertionIndex = withoutDragged.indexOf(targetVisibleId);

      if (insertionIndex < 0) {
        insertionIndex = withoutDragged.length;
      }
    } else {
      const lastVisibleId = visibleIdsAfterRemoval[visibleIdsAfterRemoval.length - 1];

      if (lastVisibleId) {
        insertionIndex = withoutDragged.indexOf(lastVisibleId) + 1;
      } else {
        insertionIndex = withoutDragged.length;
      }
    }

    withoutDragged.splice(insertionIndex, 0, draggedId);

    this.activityOrder.set(withoutDragged);

    this.persistDashboardOrder(withoutDragged, this.complianceOrder());

    this.clearActiveDropTarget();
  }

  /**
   * Handles reordering of Compliance cards.
   */
  protected dropCompliance(event: CdkDragDrop<BusinessComplianceRequirement[]>): void {
    /*
     * When no search is active, CDK indexes map directly to the complete
     * Compliance collection, so the normal move operation is sufficient.
     */
    if (!this.complianceSearch().trim()) {
      const currentOrder = [...this.orderedComplianceItems().map((item) => item.id)];

      moveItemInArray(currentOrder, event.previousIndex, event.currentIndex);

      this.complianceOrder.set(currentOrder);

      this.persistDashboardOrder(this.activityOrder(), currentOrder);

      this.clearActiveDropTarget();

      return;
    }

    /*
     * When a search is active, the CDK indexes belong to the filtered
     * collection rather than the complete Compliance collection.
     *
     * Rebuild the full order using the dragged record and the visible
     * filtered records so searching never corrupts the saved ordering.
     */
    const visibleItems = this.filteredComplianceItems();
    const draggedItem = event.item.data as BusinessComplianceRequirement | undefined;

    const draggedId = draggedItem?.id ?? visibleItems[event.previousIndex]?.id;

    if (!draggedId) {
      this.clearActiveDropTarget();
      return;
    }

    const fullOrder = [...this.orderedComplianceItems().map((item) => item.id)];

    const withoutDragged = fullOrder.filter((id) => id !== draggedId);

    const visibleIdsAfterRemoval = visibleItems
      .map((item) => item.id)
      .filter((id) => id !== draggedId);

    /*
     * The current CDK index identifies the visible item at the target
     * position. Insert immediately before it. If the item was moved to
     * the end of the filtered list, place it after the last visible item.
     */
    const targetVisibleId = visibleIdsAfterRemoval[event.currentIndex];

    let insertionIndex: number;

    if (targetVisibleId) {
      insertionIndex = withoutDragged.indexOf(targetVisibleId);

      if (insertionIndex < 0) {
        insertionIndex = withoutDragged.length;
      }
    } else {
      const lastVisibleId = visibleIdsAfterRemoval[visibleIdsAfterRemoval.length - 1];

      if (lastVisibleId) {
        insertionIndex = withoutDragged.indexOf(lastVisibleId) + 1;
      } else {
        insertionIndex = withoutDragged.length;
      }
    }

    withoutDragged.splice(insertionIndex, 0, draggedId);

    this.complianceOrder.set(withoutDragged);

    this.persistDashboardOrder(this.activityOrder(), withoutDragged);

    this.clearActiveDropTarget();
  }

  // ============================================================
  // ACTIVITIES
  // ============================================================

  async openAddActivity(): Promise<void> {
    const business = this.store.selectedBusiness();

    if (!business) {
      this.toast.error('No business is currently selected.');

      return;
    }

    const dialogRef = this.dialog.open(BusinessActivityDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {},
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    try {
      await this.store.createActivity({
        businessId: business.id,

        name: result.name,

        category: result.category,

        description: result.description,

        startDate: result.startDate,

        endDate: result.endDate,

        status: result.status,
      });

      this.toast.success('Business activity created successfully.');
    } catch (error) {
      console.error('Unable to create business activity:', error);

      this.toast.error('Unable to create business activity.');
    }
  }

  async openEditActivity(activity: BusinessActivity): Promise<void> {
    const dialogRef = this.dialog.open(BusinessActivityDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        activity,
      },
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    try {
      await this.store.updateActivity(
        activity.id,

        {
          name: result.name,

          category: result.category,

          description: result.description,

          startDate: result.startDate,

          endDate: result.endDate,

          status: result.status,
        },
      );

      this.toast.success('Business activity updated successfully.');
    } catch (error) {
      console.error('Unable to update business activity:', error);

      this.toast.error('Unable to update business activity.');
    }
  }

  async deleteActivity(activity: BusinessActivity): Promise<void> {
    const confirmed = window.confirm(`Delete "${activity.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.store.deleteActivity(activity.id);

      this.toast.success('Business activity deleted.');
    } catch (error) {
      console.error('Unable to delete business activity:', error);

      this.toast.error('Unable to delete business activity.');
    }
  }

  // ============================================================
  // COMPLIANCE
  // ============================================================

  async openAddCompliance(): Promise<void> {
    const business = this.store.selectedBusiness();

    if (!business) {
      this.toast.error('No business is currently selected.');

      return;
    }

    const dialogRef = this.dialog.open(BusinessComplianceDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {},
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    try {
      await this.store.createComplianceRequirement({
        businessId: business.id,

        name: result.name,

        category: result.category,

        jurisdiction: result.jurisdiction,

        authority: result.authority || undefined,

        /*
         * The Compliance Dialog already converts
         * Date → Firestore Timestamp.
         */

        dueDate: result.dueDate,

        renewalDate: result.renewalDate,

        status: result.status,

        completedDate: result.completedDate,

        notes: result.notes || undefined,

        /*
         * Persist automatic monitoring.
         */

        automaticMonitoring: result.automaticMonitoring,
      });

      this.toast.success('Compliance requirement created successfully.');
    } catch (error) {
      console.error('Unable to create compliance requirement:', error);

      this.toast.error('Unable to save the compliance requirement.');
    }
  }

  async openEditCompliance(requirement: BusinessComplianceRequirement): Promise<void> {
    const dialogRef = this.dialog.open(BusinessComplianceDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        requirement,
      },
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (!result) {
      return;
    }

    try {
      await this.store.updateComplianceRequirement(
        requirement.id,

        {
          name: result.name,

          category: result.category,

          jurisdiction: result.jurisdiction,

          authority: result.authority || undefined,

          /*
           * Already Firestore Timestamps.
           */

          dueDate: result.dueDate,

          renewalDate: result.renewalDate,

          status: result.status,

          completedDate: result.completedDate,

          notes: result.notes || undefined,

          automaticMonitoring: result.automaticMonitoring,
        },
      );

      this.toast.success('Compliance requirement updated successfully.');
    } catch (error) {
      console.error('Unable to update compliance requirement:', error);

      this.toast.error('Unable to save the compliance requirement.');
    }
  }

  async deleteCompliance(requirement: BusinessComplianceRequirement): Promise<void> {
    const confirmed = window.confirm(`Delete "${requirement.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.store.deleteComplianceRequirement(requirement.id);

      this.toast.success('Compliance requirement deleted.');
    } catch (error) {
      console.error('Unable to delete compliance requirement:', error);

      this.toast.error('Unable to delete compliance requirement.');
    }
  }

  // ============================================================
  // TEMPORARY ACTIONS
  // ============================================================

  protected reportComingSoon(reportName: string): void {
    this.toast.info(`${reportName} reporting will be added next.`);
  }
}
