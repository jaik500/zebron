import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

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
               px-4 py-6
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
                  class="!text-3xl
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
                  class="!text-3xl
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
                  class="!text-3xl
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
                  class="!text-3xl
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

              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2"> dashboard </mat-icon>

                  Overview
                </ng-template>

                <div class="p-4 sm:p-6">
                  <div
                    class="grid
                           grid-cols-1
                           gap-6
                           lg:grid-cols-2"
                  >
                    <!-- Financial Summary -->

                    <mat-card
                      class="!border
                             !shadow-none"
                    >
                      <mat-card-header>
                        <mat-card-title> Financial Summary </mat-card-title>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        <div class="space-y-4">
                          <div
                            class="flex
                                   justify-between"
                          >
                            <span class="text-gray-600"> Revenue </span>

                            <strong>
                              {{ store.totalRevenue() | currency: 'USD' }}
                            </strong>
                          </div>

                          <div
                            class="flex
                                   justify-between"
                          >
                            <span class="text-gray-600"> Expenses </span>

                            <strong>
                              {{ store.totalExpenses() | currency: 'USD' }}
                            </strong>
                          </div>

                          <div
                            class="flex
                                   justify-between
                                   border-t
                                   pt-4"
                          >
                            <span class="font-semibold"> Net Income </span>

                            <strong class="text-[#007979]">
                              {{ store.netIncome() | currency: 'USD' }}
                            </strong>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Compliance Summary -->

                    <mat-card
                      class="!border
                             !shadow-none"
                    >
                      <mat-card-header>
                        <mat-card-title> Compliance Summary </mat-card-title>
                      </mat-card-header>

                      <mat-card-content class="mt-4">
                        <div
                          class="grid
                                 grid-cols-3
                                 gap-3"
                        >
                          <div
                            class="rounded-xl
                                   bg-green-50
                                   p-4
                                   text-center"
                          >
                            <p
                              class="text-2xl
                                     font-bold
                                     text-green-700"
                            >
                              {{ complianceCurrentCount() }}
                            </p>

                            <p
                              class="mt-1
                                     text-xs
                                     text-gray-600"
                            >
                              Current
                            </p>
                          </div>

                          <div
                            class="rounded-xl
                                   bg-yellow-50
                                   p-4
                                   text-center"
                          >
                            <p
                              class="text-2xl
                                     font-bold
                                     text-yellow-700"
                            >
                              {{ store.upcomingCompliance() }}
                            </p>

                            <p
                              class="mt-1
                                     text-xs
                                     text-gray-600"
                            >
                              Upcoming
                            </p>
                          </div>

                          <div
                            class="rounded-xl
                                   bg-red-50
                                   p-4
                                   text-center"
                          >
                            <p
                              class="text-2xl
                                     font-bold
                                     text-red-700"
                            >
                              {{ store.overdueCompliance() }}
                            </p>

                            <p
                              class="mt-1
                                     text-xs
                                     text-gray-600"
                            >
                              Overdue
                            </p>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
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

                    <button
                      mat-flat-button
                      color="primary"
                      type="button"
                      (click)="openAddActivity()"
                    >
                      <mat-icon> add </mat-icon>

                      Add Activity
                    </button>
                  </div>

                  @if (store.activities().length > 0) {
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
                      [cdkDropListData]="orderedActivities()"
                      (cdkDropListDropped)="dropActivity($event)"
                    >
                      @for (activity of orderedActivities(); track activity.id) {
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
                          No business activities
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          Add your first business activity to begin tracking operations.
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
                        Business Compliance
                      </h2>

                      <p class="mt-1 text-sm text-gray-500">
                        Track statutory, tax, licensing, and other compliance requirements.
                      </p>
                    </div>

                    <button
                      mat-flat-button
                      color="primary"
                      type="button"
                      (click)="openAddCompliance()"
                    >
                      <mat-icon> add </mat-icon>

                      Add Requirement
                    </button>
                  </div>

                  @if (store.complianceItems().length > 0) {
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
                      [cdkDropListData]="orderedComplianceItems()"
                      (cdkDropListDropped)="dropCompliance($event)"
                    >
                      @for (item of orderedComplianceItems(); track item.id) {
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
                    <!-- Empty State -->

                    <mat-card class="rounded-2xl">
                      <mat-card-content class="py-12 text-center">
                        <mat-icon
                          class="!text-5xl
                                 !text-gray-400"
                        >
                          verified
                        </mat-icon>

                        <h3
                          class="mt-4
                                 text-lg
                                 font-semibold"
                        >
                          No compliance requirements
                        </h3>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          Add your first compliance requirement to begin tracking deadlines.
                        </p>

                        <button
                          mat-flat-button
                          color="primary"
                          class="mt-5"
                          type="button"
                          (click)="openAddCompliance()"
                        >
                          <mat-icon> add </mat-icon>

                          Add Requirement
                        </button>
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
                  <div
                    class="flex
                           items-center
                           justify-between"
                  >
                    <div>
                      <h2
                        class="text-xl
                               font-semibold
                               text-[#032D42]"
                      >
                        Business Documents
                      </h2>

                      <p
                        class="text-sm
                               text-gray-500"
                      >
                        Legal, financial, compliance, and business records.
                      </p>
                    </div>

                    <button
                      mat-flat-button
                      color="primary"
                      type="button"
                      (click)="documentComingSoon()"
                    >
                      <mat-icon> upload_file </mat-icon>

                      Upload Document
                    </button>
                  </div>

                  <div class="mt-6">
                    @if (store.documents().length === 0) {
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
                          folder_open
                        </mat-icon>

                        <p
                          class="mt-3
                                 font-semibold
                                 text-gray-700"
                        >
                          No documents
                        </p>

                        <p
                          class="mt-1
                                 text-sm
                                 text-gray-500"
                        >
                          Business documents will be stored here.
                        </p>
                      </div>
                    } @else {
                      <div
                        class="grid
                               grid-cols-1
                               gap-4
                               md:grid-cols-2
                               lg:grid-cols-3"
                      >
                        @for (document of store.documents(); track document.id) {
                          <mat-card
                            class="!border
                                   !shadow-none"
                          >
                            <mat-card-content>
                              <div class="flex gap-3">
                                <mat-icon
                                  class="!text-3xl
                                         !text-[#007979]"
                                >
                                  description
                                </mat-icon>

                                <div>
                                  <h3 class="font-semibold">
                                    {{ document.name }}
                                  </h3>

                                  <p
                                    class="text-sm
                                           text-gray-500"
                                  >
                                    {{ document.category }}
                                  </p>
                                </div>
                              </div>
                            </mat-card-content>
                          </mat-card>
                        }
                      </div>
                    }
                  </div>
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
                  <h2
                    class="text-xl
                           font-semibold
                           text-[#032D42]"
                  >
                    Business Reports
                  </h2>

                  <p
                    class="mt-1
                           text-sm
                           text-gray-500"
                  >
                    Financial and operational reporting will be managed from this section.
                  </p>

                  <div
                    class="mt-6
                           grid
                           grid-cols-1
                           gap-4
                           sm:grid-cols-2
                           lg:grid-cols-4"
                  >
                    @for (report of reports; track report.title) {
                      <mat-card
                        class="!border
                               !shadow-none"
                      >
                        <mat-card-content>
                          <mat-icon
                            class="!text-3xl
                                   !text-[#007979]"
                          >
                            {{ report.icon }}
                          </mat-icon>

                          <h3
                            class="mt-3
                                   font-semibold
                                   text-[#032D42]"
                          >
                            {{ report.title }}
                          </h3>

                          <p
                            class="mt-1
                                   text-sm
                                   text-gray-500"
                          >
                            {{ report.description }}
                          </p>

                          <button
                            mat-button
                            class="mt-3
                                   !px-0
                                   !text-[#007979]"
                            type="button"
                            (click)="reportComingSoon(report.title)"
                          >
                            View Report
                          </button>
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
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
  private readonly dashboardOrderStoragePrefix =
    'zebron.business-dashboard.order';

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
      const raw = localStorage.getItem(
        `${this.dashboardOrderStoragePrefix}.${business.id}`,
      );

      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw) as {
        activities?: unknown;
        compliance?: unknown;
      };

      if (Array.isArray(saved.activities)) {
        this.activityOrder.set(
          saved.activities.filter(
            (id): id is string => typeof id === 'string',
          ),
        );
      }

      if (Array.isArray(saved.compliance)) {
        this.complianceOrder.set(
          saved.compliance.filter(
            (id): id is string => typeof id === 'string',
          ),
        );
      }
    } catch (error) {
      console.warn(
        'Unable to restore Business Operations dashboard order:',
        error,
      );
    }
  }

  /**
   * Saves both ordering arrays after a successful drag/drop operation.
   */
  private persistDashboardOrder(
    activities: string[],
    compliance: string[],
  ): void {
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
      console.warn(
        'Unable to save Business Operations dashboard order:',
        error,
      );
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
    const currentOrder = [...this.orderedActivities().map((item) => item.id)];

    moveItemInArray(currentOrder, event.previousIndex, event.currentIndex);

    this.activityOrder.set(currentOrder);

    this.persistDashboardOrder(
      currentOrder,
      this.complianceOrder(),
    );

    this.clearActiveDropTarget();
  }

  /**
   * Handles reordering of Compliance cards.
   */
  protected dropCompliance(event: CdkDragDrop<BusinessComplianceRequirement[]>): void {
    const currentOrder = [...this.orderedComplianceItems().map((item) => item.id)];

    moveItemInArray(currentOrder, event.previousIndex, event.currentIndex);

    this.complianceOrder.set(currentOrder);

    this.persistDashboardOrder(
      this.activityOrder(),
      currentOrder,
    );

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

  protected documentComingSoon(): void {
    this.toast.info('Document upload will be added next.');
  }

  protected reportComingSoon(reportName: string): void {
    this.toast.info(`${reportName} reporting will be added next.`);
  }
}
