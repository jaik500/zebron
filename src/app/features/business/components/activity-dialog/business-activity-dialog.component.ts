import {
  CommonModule,
} from '@angular/common';

import {
  Component,
  Inject,
  inject,
} from '@angular/core';

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
  Timestamp,
} from 'firebase/firestore';

import {
  BusinessActivity,
  BusinessActivityStatus,
} from '../../models/business-activity.model';


export interface BusinessActivityDialogData {
  activity?: BusinessActivity;
}


@Component({
  selector: 'app-business-activity-dialog',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
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
            data.activity
              ? 'Edit Business Activity'
              : 'Add Business Activity'
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
             ACTIVITY NAME
             ======================================================== -->

        <mat-form-field
          appearance="outline"
          class="!mb-0"
        >
          <mat-label>
            Activity Name
          </mat-label>

          <input
            matInput
            formControlName="name"
            placeholder="e.g. ServiceNow Consulting"
          />

          @if (
            form.controls.name.touched &&
            form.controls.name.hasError('required')
          ) {
            <mat-error>
              Activity name is required.
            </mat-error>
          }
        </mat-form-field>


        <!-- ========================================================
             CATEGORY / STATUS
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

          <mat-form-field
            appearance="outline"
          >
            <mat-label>
              Category
            </mat-label>

            <mat-select
              formControlName="category"
            >
              @for (
                category of categories;
                track category
              ) {
                <mat-option
                  [value]="category"
                >
                  {{ category }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>


          <!-- Status -->

          <mat-form-field
            appearance="outline"
          >
            <mat-label>
              Status
            </mat-label>

            <mat-select
              formControlName="status"
            >

              <mat-option value="planned">
                Planned
              </mat-option>

              <mat-option value="active">
                Active
              </mat-option>

              <mat-option value="inactive">
                Inactive
              </mat-option>

            </mat-select>
          </mat-form-field>

        </div>


        <!-- ========================================================
             DESCRIPTION
             ======================================================== -->

        <mat-form-field
          appearance="outline"
        >
          <mat-label>
            Description
          </mat-label>

          <textarea
            matInput
            rows="2"
            formControlName="description"
            placeholder="Describe the business activity..."
          ></textarea>
        </mat-form-field>


        <!-- ========================================================
             DATES
             ======================================================== -->

        <div
          class="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >

          <!-- Start Date -->

          <mat-form-field
            appearance="outline"
          >
            <mat-label>
              Start Date
            </mat-label>

            <input
              matInput
              [matDatepicker]="startPicker"
              formControlName="startDate"
              readonly
            />

            <mat-datepicker-toggle
              matIconSuffix
              [for]="startPicker"
            />

            <mat-datepicker
              #startPicker
            />

          </mat-form-field>


          <!-- End Date -->

          <mat-form-field
            appearance="outline"
          >
            <mat-label>
              End Date
            </mat-label>

            <input
              matInput
              [matDatepicker]="endPicker"
              formControlName="endDate"
              readonly
            />

            <mat-datepicker-toggle
              matIconSuffix
              [for]="endPicker"
            />

            <mat-datepicker
              #endPicker
            />

          </mat-form-field>

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
        color="primary"
        type="button"
        [disabled]="form.invalid"
        (click)="save()"
      >

        <mat-icon>
          save
        </mat-icon>

        <span class="ml-1">
          {{
            data.activity
              ? 'Update Activity'
              : 'Save Activity'
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
        min-width: 560px;
        max-height: 65vh;
      }

      mat-form-field {
        width: 100%;
      }

      @media (max-width: 700px) {
        mat-dialog-content {
          min-width: 0;
        }
      }
    `,
  ],
})


export class BusinessActivityDialogComponent {

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  readonly fb =
    inject(FormBuilder);

  private readonly dialogRef =
    inject(
      MatDialogRef<BusinessActivityDialogComponent>,
    );


  // ============================================================
  // CATEGORY OPTIONS
  // ============================================================

  readonly categories = [
    'Consulting',
    'Training',
    'Education',
    'Community',
    'Marketing',
    'Product Development',
    'Partnership',
    'Operations',
    'Research',
    'Other',
  ];


  // ============================================================
  // FORM
  // ============================================================

  readonly form =
    this.fb.nonNullable.group({

      name: [
        '',
        Validators.required,
      ],

      category: [
        'Operations',
        Validators.required,
      ],

      description: [
        '',
      ],

      startDate: [
        null as Date | null,
      ],

      endDate: [
        null as Date | null,
      ],

      status: [
        'planned' as BusinessActivityStatus,
        Validators.required,
      ],

    });


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: BusinessActivityDialogData,
  ) {

    if (data.activity) {
      this.populateForm(
        data.activity,
      );
    }

  }


  // ============================================================
  // POPULATE EDIT FORM
  // ============================================================

  private populateForm(
    activity: BusinessActivity,
  ): void {

    this.form.patchValue({

      name:
        activity.name,

      category:
        activity.category,

      description:
        activity.description ?? '',

      startDate:
        activity.startDate
          ? activity.startDate.toDate()
          : null,

      endDate:
        activity.endDate
          ? activity.endDate.toDate()
          : null,

      status:
        activity.status,

    });

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


    const result:
      Partial<BusinessActivity> = {

      ...(this.data.activity
        ? {
            id:
              this.data.activity.id,
          }
        : {}),

      name:
        value.name.trim(),

      category:
        value.category,

      description:
        value.description.trim() ||
        undefined,

      startDate:
        value.startDate
          ? Timestamp.fromDate(
              value.startDate,
            )
          : undefined,

      endDate:
        value.endDate
          ? Timestamp.fromDate(
              value.endDate,
            )
          : undefined,

      status:
        value.status,

    };


    this.dialogRef.close(
      result,
    );
  }


  // ============================================================
  // CLOSE
  // ============================================================

  cancel(): void {

    this.dialogRef.close();

  }

}