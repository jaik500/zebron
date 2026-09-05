import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';



import { Timestamp } from 'firebase/firestore';

import {
  BusinessComplianceCategory,
  BusinessComplianceJurisdiction,
  BusinessComplianceRequirement,
  BusinessComplianceStatus,
} from '../../models/business-compliance.model';

export interface BusinessComplianceDialogData {
  requirement?: BusinessComplianceRequirement;
}

@Component({
  selector: 'app-business-compliance-dialog',
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
    MatCheckboxModule,
  ],

  template: `
    <!-- ============================================================
         DIALOG HEADER
         ============================================================ -->

    <!-- ============================================================
     ZEBRON DIALOG HEADER
     ============================================================ -->

    <div
      class="flex items-center justify-between
         bg-[#032D42]
         px-6 py-4
         text-white"
    >
      <div>
        <div
          class="text-xs font-semibold uppercase
             tracking-wider text-[#7ED6D1]"
        >
          Zebron Business Operations
        </div>

        <h2 class="mt-1 m-0 text-xl font-semibold text-white">
          {{ data.requirement ? 'Edit Compliance Requirement' : 'Add Compliance Requirement' }}
        </h2>
      </div>

      <!-- Close button -->
      <button
        mat-icon-button
        type="button"
        aria-label="Close"
        matTooltip="Close"
        (click)="cancel()"
        class="!text-white hover:!bg-white/10"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- ============================================================
         DIALOG CONTENT
         ============================================================ -->

    <mat-dialog-content class="!px-6 !py-4">
      <form [formGroup]="form" class="grid grid-cols-1 gap-3">
        <!-- Requirement Name -->
        <mat-form-field appearance="outline" class="!mb-0">
          <mat-label>Requirement Name</mat-label>

          <input matInput formControlName="name" placeholder="e.g. Maryland Annual Report" />

          @if (form.controls.name.touched && form.controls.name.hasError('required')) {
            <mat-error> Requirement name is required. </mat-error>
          }
        </mat-form-field>

        <!-- Category / Jurisdiction / Status -->
        <div
          class="grid grid-cols-1 gap-3
             sm:grid-cols-3"
        >
          <!-- Category -->
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>

            <mat-select formControlName="category">
              @for (category of categories; track category.value) {
                <mat-option [value]="category.value">
                  {{ category.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Jurisdiction -->
          <mat-form-field appearance="outline">
            <mat-label>Jurisdiction</mat-label>

            <mat-select formControlName="jurisdiction">
              @for (jurisdiction of jurisdictions; track jurisdiction.value) {
                <mat-option [value]="jurisdiction.value">
                  {{ jurisdiction.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Status -->
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>

            <mat-select formControlName="status">
              @for (status of statuses; track status.value) {
                <mat-option [value]="status.value">
                  {{ status.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Authority -->
        <mat-form-field appearance="outline">
          <mat-label>Authority</mat-label>

          <input
            matInput
            formControlName="authority"
            placeholder="e.g. Maryland Department of Assessments and Taxation"
          />
        </mat-form-field>

        <!-- Due Date / Renewal Date / Completed Date -->
        <div
          class="grid grid-cols-1 gap-3
             sm:grid-cols-3"
        >
          <!-- Due Date -->
          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>

            <input matInput [matDatepicker]="dueDatePicker" formControlName="dueDate" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="dueDatePicker" />

            <mat-datepicker #dueDatePicker />
          </mat-form-field>

          <!-- Renewal Date -->
          <mat-form-field appearance="outline">
            <mat-label>Renewal Date</mat-label>

            <input matInput [matDatepicker]="renewalDatePicker" formControlName="renewalDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="renewalDatePicker" />

            <mat-datepicker #renewalDatePicker />
          </mat-form-field>

          <!-- Completed Date -->
          <mat-form-field appearance="outline">
            <mat-label>Completed Date</mat-label>

            <input matInput [matDatepicker]="completedDatePicker" formControlName="completedDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="completedDatePicker" />

            <mat-datepicker #completedDatePicker />
          </mat-form-field>
        </div>

     

        <!-- Notes -->
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>

          <textarea
            matInput
            rows="2"
            formControlName="notes"
            placeholder="Additional compliance notes..."
          ></textarea>
        </mat-form-field>

           <!-- Automatic Monitoring -->
        <div
          class="rounded-lg
             border border-[#007979]/20
             bg-[#007979]/5
             px-4 py-2"
        >
          <mat-checkbox formControlName="automaticMonitoring">
            <span class="text-sm font-medium text-gray-900">
              Enable automatic status monitoring
            </span>
          </mat-checkbox>

          <p class="ml-8 -mt-1 text-xs text-gray-500">
            Automatically evaluates this requirement each day using its due or renewal
            date.
          </p>
        </div>

      </form>
    </mat-dialog-content>

    <!-- ============================================================
         ACTIONS
         ============================================================ -->

    <mat-dialog-actions align="end" class="!border-t !border-gray-200 !px-6 !py-2">
      <button mat-button type="button" (click)="cancel()">Cancel</button>

      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="form.invalid"
        (click)="save()"
      >
        <mat-icon>save</mat-icon>

        <span class="ml-1">
          {{ data.requirement ? 'Update Requirement' : 'Save Requirement' }}
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
        min-width: 500px;
        max-height: 70vh;
      }

      @media (max-width: 600px) {
        mat-dialog-content {
          min-width: 0;
        }
      }
    `,
  ],
})
export class BusinessComplianceDialogComponent {
  // ============================================================
  // DEPENDENCIES
  // ============================================================

  readonly fb = inject(FormBuilder);

  private readonly dialogRef = inject(MatDialogRef<BusinessComplianceDialogComponent>);

  // ============================================================
  // CATEGORY OPTIONS
  // ============================================================

  readonly categories: {
    value: BusinessComplianceCategory;
    label: string;
  }[] = [
    {
      value: 'statutory',
      label: 'Statutory',
    },

    {
      value: 'tax',
      label: 'Tax',
    },

    {
      value: 'license',
      label: 'License',
    },

    {
      value: 'permit',
      label: 'Permit',
    },

    {
      value: 'employment',
      label: 'Employment',
    },

    {
      value: 'insurance',
      label: 'Insurance',
    },

    {
      value: 'governance',
      label: 'Governance',
    },

    {
      value: 'other',
      label: 'Other',
    },
  ];

  // ============================================================
  // JURISDICTION OPTIONS
  // ============================================================

  readonly jurisdictions: {
    value: BusinessComplianceJurisdiction;
    label: string;
  }[] = [
    {
      value: 'federal',
      label: 'Federal',
    },

    {
      value: 'state',
      label: 'State',
    },

    {
      value: 'county',
      label: 'County',
    },

    {
      value: 'city',
      label: 'City',
    },

    {
      value: 'other',
      label: 'Other',
    },
  ];

  // ============================================================
  // STATUS OPTIONS
  // ============================================================

  readonly statuses: {
    value: BusinessComplianceStatus;
    label: string;
  }[] = [
    {
      value: 'current',
      label: 'Current',
    },

    {
      value: 'upcoming',
      label: 'Upcoming',
    },

    {
      value: 'action_required',
      label: 'Action Required',
    },

    {
      value: 'overdue',
      label: 'Overdue',
    },

    {
      value: 'expired',
      label: 'Expired',
    },

    {
      value: 'not_applicable',
      label: 'Not Applicable',
    },
  ];

  // ============================================================
  // FORM
  // ============================================================

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],

    category: ['statutory' as BusinessComplianceCategory, Validators.required],

    jurisdiction: ['state' as BusinessComplianceJurisdiction, Validators.required],

    authority: [''],

    dueDate: [null as Date | null],

    renewalDate: [null as Date | null],

    status: ['upcoming' as BusinessComplianceStatus, Validators.required],

    completedDate: [null as Date | null],

    automaticMonitoring: [true],

    notes: [''],
  });

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: BusinessComplianceDialogData,
  ) {
    if (data.requirement) {
      this.populateForm(data.requirement);
    }
  }

  // ============================================================
  // POPULATE EDIT FORM
  // ============================================================

  private populateForm(requirement: BusinessComplianceRequirement): void {
    this.form.patchValue({
      name: requirement.name,

      category: requirement.category,

      jurisdiction: requirement.jurisdiction,

      authority: requirement.authority ?? '',

      dueDate: requirement.dueDate ? requirement.dueDate.toDate() : null,

      renewalDate: requirement.renewalDate ? requirement.renewalDate.toDate() : null,

      status: requirement.status,

      completedDate: requirement.completedDate ? requirement.completedDate.toDate() : null,

      /*
       * Existing records created before automatic monitoring
       * was introduced default to true.
       */
      automaticMonitoring: requirement.automaticMonitoring ?? true,

      notes: requirement.notes ?? '',
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

    const value = this.form.getRawValue();

    const result: Partial<BusinessComplianceRequirement> = {
      ...(this.data.requirement
        ? {
            id: this.data.requirement.id,
          }
        : {}),

      name: value.name.trim(),

      category: value.category,

      jurisdiction: value.jurisdiction,

      authority: value.authority.trim() || undefined,

      dueDate: value.dueDate ? Timestamp.fromDate(value.dueDate) : undefined,

      renewalDate: value.renewalDate ? Timestamp.fromDate(value.renewalDate) : undefined,

      status: value.status,

      completedDate: value.completedDate ? Timestamp.fromDate(value.completedDate) : undefined,

      /*
       * This value is passed to the dashboard/store and
       * ultimately persisted to Firestore.
       */
      automaticMonitoring: value.automaticMonitoring,

      notes: value.notes.trim() || undefined,
    };

    this.dialogRef.close(result);
  }

  // ============================================================
  // CLOSE / CANCEL
  // ============================================================

  cancel(): void {
    this.dialogRef.close();
  }
}
