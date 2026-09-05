import {
  Component,
  Inject,
  inject,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCheckboxModule,
} from '@angular/material/checkbox';

import {
  MatDatepickerModule,
} from '@angular/material/datepicker';

import {
  MatFormFieldModule,
} from '@angular/material/form-field';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatInputModule,
} from '@angular/material/input';

import {
  MatNativeDateModule,
} from '@angular/material/core';

import {
  MatSelectModule,
} from '@angular/material/select';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  BusinessTransaction,
  BusinessTransactionType,
} from '../../models/business-transaction.model';


export interface BusinessTransactionDialogData {
  transaction?: BusinessTransaction;
}


@Component({
  selector: 'app-business-transaction-dialog',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
  ],

  template: `
    <!-- ============================================================
         ZEBRON HEADER
         ============================================================ -->

    <div
      class="
        flex
        items-center
        justify-between
        bg-[#032D42]
        px-5
        py-4
        text-white
      "
    >

      <!-- Header content -->

      <div class="min-w-0">

        <div
          class="
            text-[11px]
            font-semibold
            uppercase
            tracking-wider
            text-[#7ED6D1]
          "
        >
          Zebron Business Operations
        </div>

        <h2
          class="
            mt-1
            m-0
            text-xl
            font-semibold
            text-white
          "
        >
          {{
            isEditMode
              ? 'Edit Transaction'
              : 'Add Transaction'
          }}
        </h2>

      </div>


      <!-- ==========================================================
           CLOSE BUTTON
           ========================================================== -->

      <button
        mat-icon-button
        type="button"
        aria-label="Close"
        matTooltip="Close"
        (click)="cancel()"
        class="
          !ml-4
          !shrink-0
          !text-white
          hover:!bg-white/10
        "
      >
        <mat-icon>
          close
        </mat-icon>
      </button>

    </div>


    <!-- ============================================================
         ZEBRON ACCENT BAR
         ============================================================ -->

    <div class="h-1 bg-[#007979]"></div>


    <!-- ============================================================
         FORM CONTENT
         ============================================================ -->

    <mat-dialog-content
      class="!px-5 !py-4"
    >

      <form
        [formGroup]="form"
        class="
          grid
          grid-cols-1
          gap-3
        "
      >

        <!-- ========================================================
             TYPE / DATE / AMOUNT
             ======================================================== -->

        <div
          class="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-3
          "
        >

          <!-- Transaction Type -->

          <mat-form-field appearance="outline">
            <mat-label>
              Transaction Type
            </mat-label>

            <mat-select
              formControlName="type"
            >

              <mat-option value="revenue">
                Revenue
              </mat-option>

              <mat-option value="expense">
                Expense
              </mat-option>

            </mat-select>
          </mat-form-field>


          <!-- Date -->

          <mat-form-field appearance="outline">

            <mat-label>
              Date
            </mat-label>

            <input
              matInput
              [matDatepicker]="picker"
              formControlName="date"
              readonly
            />

            <mat-datepicker-toggle
              matIconSuffix
              [for]="picker"
            />

            <mat-datepicker
              #picker
            />

          </mat-form-field>


          <!-- Amount -->

          <mat-form-field appearance="outline">

            <mat-label>
              Amount
            </mat-label>

            <span
              matTextPrefix
              class="mr-1"
            >
              $
            </span>

            <input
              matInput
              type="number"
              min="0.01"
              step="0.01"
              formControlName="amount"
            />

          </mat-form-field>

        </div>


        <!-- ========================================================
             CATEGORY / PAYMENT METHOD
             ======================================================== -->

        <div
          class="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >

          <!-- Category -->

          <mat-form-field appearance="outline">

            <mat-label>
              Category
            </mat-label>

            <mat-select
              formControlName="categoryId"
            >

              @for (
                category of availableCategories;
                track category.id
              ) {

                <mat-option
                  [value]="category.id"
                >
                  {{ category.name }}
                </mat-option>

              }

            </mat-select>

          </mat-form-field>


          <!-- Payment Method -->

          <mat-form-field appearance="outline">

            <mat-label>
              Payment Method
            </mat-label>

            <mat-select
              formControlName="paymentMethod"
            >

              @for (
                method of paymentMethods;
                track method
              ) {

                <mat-option
                  [value]="method"
                >
                  {{ method }}
                </mat-option>

              }

            </mat-select>

          </mat-form-field>

        </div>


        <!-- ========================================================
             CUSTOMER / VENDOR
             ======================================================== -->

        <div
          class="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >

          <!-- Customer / Payer -->

          @if (
            form.controls.type.value === 'revenue'
          ) {

            <mat-form-field appearance="outline">

              <mat-label>
                Customer / Payer
              </mat-label>

              <input
                matInput
                formControlName="customerId"
                placeholder="Customer or payer"
              />

            </mat-form-field>

          }


          <!-- Vendor / Payee -->

          @if (
            form.controls.type.value === 'expense'
          ) {

            <mat-form-field appearance="outline">

              <mat-label>
                Vendor / Payee
              </mat-label>

              <input
                matInput
                formControlName="vendorId"
                placeholder="Vendor or payee"
              />

            </mat-form-field>

          }


          <!-- Reference Number -->

          <mat-form-field appearance="outline">

            <mat-label>
              Reference Number
            </mat-label>

            <input
              matInput
              formControlName="referenceNumber"
              placeholder="Invoice, receipt, check, etc."
            />

          </mat-form-field>

        </div>


        <!-- ========================================================
             DESCRIPTION
             ======================================================== -->

        <mat-form-field appearance="outline">

          <mat-label>
            Description
          </mat-label>

          <input
            matInput
            formControlName="description"
            placeholder="Transaction description"
          />

        </mat-form-field>


        <!-- ========================================================
             NOTES
             ======================================================== -->

        <mat-form-field appearance="outline">

          <mat-label>
            Notes
          </mat-label>

          <textarea
            matInput
            rows="2"
            formControlName="notes"
            placeholder="Additional transaction notes..."
          ></textarea>

        </mat-form-field>


        <!-- ========================================================
             OPTIONS
             ======================================================== -->

        <div
          class="
            rounded-lg
            border
            border-[#007979]/20
            bg-[#007979]/5
            px-4
            py-2
          "
        >

          <div
            class="
              flex
              flex-wrap
              items-center
              gap-x-6
              gap-y-1
            "
          >

            <!-- Recurring -->

            <mat-checkbox
              formControlName="recurring"
            >
              <span class="text-sm">
                Recurring transaction
              </span>
            </mat-checkbox>


            <!-- Tax Deductible -->

            @if (
              form.controls.type.value === 'expense'
            ) {

              <mat-checkbox
                formControlName="taxDeductible"
              >
                <span class="text-sm">
                  Potentially tax deductible
                </span>
              </mat-checkbox>

            }

          </div>

        </div>

      </form>

    </mat-dialog-content>


    <!-- ============================================================
         FOOTER ACTIONS
         ============================================================ -->

    <mat-dialog-actions
      align="end"
      class="
        !border-t
        !border-gray-200
        !px-5
        !py-2
      "
    >

      <button
        mat-button
        type="button"
        (click)="cancel()"
      >
        Cancel
      </button>


      <button
        mat-flat-button
        type="button"
        [disabled]="form.invalid"
        (click)="save()"
      >

        <mat-icon>
          save
        </mat-icon>

        <span class="ml-1">
          {{
            isEditMode
              ? 'Update'
              : 'Save'
          }}
        </span>

      </button>

    </mat-dialog-actions>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      mat-dialog-content {
        min-width: 700px;
        max-height: 70vh;
      }

      mat-form-field {
        width: 100%;
      }

      @media (max-width: 750px) {
        mat-dialog-content {
          min-width: 0;
        }
      }
    `,
  ],
})


export class BusinessTransactionDialogComponent {

  // ============================================================
  // MODE
  // ============================================================

  readonly isEditMode: boolean;


  // ============================================================
  // DEPENDENCIES
  // ============================================================

  readonly fb =
    inject(FormBuilder);


  // ============================================================
  // PAYMENT METHODS
  // ============================================================

  readonly paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'Cash',
    'Check',
    'ACH',
    'PayPal',
    'Other',
  ];


  // ============================================================
  // TRANSACTION CATEGORIES
  // ============================================================

  readonly categories = [

    {
      id: 'consulting',
      name: 'Consulting',
      type: 'revenue',
    },

    {
      id: 'training',
      name: 'Training',
      type: 'revenue',
    },

    {
      id: 'courses',
      name: 'Courses',
      type: 'revenue',
    },

    {
      id: 'memberships',
      name: 'Memberships',
      type: 'revenue',
    },

    {
      id: 'donations',
      name: 'Donations',
      type: 'revenue',
    },

    {
      id: 'grants',
      name: 'Grants',
      type: 'revenue',
    },

    {
      id: 'sponsorships',
      name: 'Sponsorships',
      type: 'revenue',
    },

    {
      id: 'services',
      name: 'Services',
      type: 'revenue',
    },

    {
      id: 'software',
      name: 'Software',
      type: 'expense',
    },

    {
      id: 'hosting',
      name: 'Hosting',
      type: 'expense',
    },

    {
      id: 'domain',
      name: 'Domain',
      type: 'expense',
    },

    {
      id: 'advertising',
      name: 'Advertising',
      type: 'expense',
    },

    {
      id: 'marketing',
      name: 'Marketing',
      type: 'expense',
    },

    {
      id: 'equipment',
      name: 'Equipment',
      type: 'expense',
    },

    {
      id: 'office',
      name: 'Office',
      type: 'expense',
    },

    {
      id: 'professional-services',
      name: 'Professional Services',
      type: 'expense',
    },

    {
      id: 'legal',
      name: 'Legal',
      type: 'expense',
    },

    {
      id: 'accounting',
      name: 'Accounting',
      type: 'expense',
    },

    {
      id: 'insurance',
      name: 'Insurance',
      type: 'expense',
    },

    {
      id: 'travel',
      name: 'Travel',
      type: 'expense',
    },

    {
      id: 'education',
      name: 'Education',
      type: 'expense',
    },

    {
      id: 'contractors',
      name: 'Contractors',
      type: 'expense',
    },

    {
      id: 'bank-fees',
      name: 'Bank Fees',
      type: 'expense',
    },

    {
      id: 'government-fees',
      name: 'Government Fees',
      type: 'expense',
    },

    {
      id: 'taxes',
      name: 'Taxes',
      type: 'expense',
    },

    {
      id: 'other',
      name: 'Other',
      type: 'expense',
    },

  ];


  // ============================================================
  // FORM
  // ============================================================

  readonly form =
    this.fb.nonNullable.group({

      type: [
        'expense' as BusinessTransactionType,
        Validators.required,
      ],

      date: [
        new Date(),
        Validators.required,
      ],

      amount: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
        ],
      ],

      categoryId: [
        '',
        Validators.required,
      ],

      customerId: [
        '',
      ],

      vendorId: [
        '',
      ],

      paymentMethod: [
        '',
      ],

      referenceNumber: [
        '',
      ],

      description: [
        '',
      ],

      recurring: [
        false,
      ],

      taxDeductible: [
        false,
      ],

      notes: [
        '',
      ],

    });


  // ============================================================
  // AVAILABLE CATEGORIES
  // ============================================================

  get availableCategories() {

    const type =
      this.form.controls.type.value;

    return this.categories.filter(
      (category) =>
        category.type === type,
    );
  }


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(

    private readonly dialogRef:
      MatDialogRef<BusinessTransactionDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    private readonly data:
      BusinessTransactionDialogData,

  ) {

    this.isEditMode =
      !!data.transaction;


    if (data.transaction) {

      const transaction =
        data.transaction;

      this.form.patchValue({

        type:
          transaction.type,

        date:
          transaction.date.toDate(),

        amount:
          transaction.amount,

        categoryId:
          transaction.categoryId,

        customerId:
          transaction.customerId ?? '',

        vendorId:
          transaction.vendorId ?? '',

        paymentMethod:
          transaction.paymentMethod ?? '',

        referenceNumber:
          transaction.referenceNumber ?? '',

        description:
          transaction.description ?? '',

        recurring:
          transaction.recurring ?? false,

        taxDeductible:
          transaction.taxDeductible ?? false,

        notes:
          transaction.notes ?? '',

      });

    }

  }


  // ============================================================
  // SAVE
  // ============================================================

  save(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }


    const value =
      this.form.getRawValue();


    this.dialogRef.close({

      ...value,

      date:
        value.date,

      amount:
        Number(value.amount),

      ...(this.isEditMode
        ? {
            id:
              this.data.transaction!.id,
          }
        : {}),

    });

  }


  // ============================================================
  // CLOSE
  // ============================================================

  cancel(): void {

    this.dialogRef.close();

  }

}