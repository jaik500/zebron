import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';

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

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  BusinessDocument,
  BusinessDocumentCategory,
} from '../../models/business-document.model';


// ============================================================
// DIALOG DATA
// ============================================================

export interface BusinessDocumentDialogData {
  businessId: string;
  document?: BusinessDocument;
}


// ============================================================
// DIALOG RESULT
// ============================================================

export interface BusinessDocumentDialogResult {
  name: string;
  category: BusinessDocumentCategory;
  description?: string;
  expiresAt?: Date;
  verified: boolean;
  notes?: string;
  file?: File;
}


// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-business-document-dialog',
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

    <!-- ======================================================
         HEADER
         ====================================================== -->

    <div class="bg-[#032D42] px-4 py-3 text-white">

      <div class="flex items-center justify-between gap-3">

        <div class="min-w-0">

          <p
            class="text-[10px]
                   font-semibold
                   uppercase
                   tracking-wider
                   text-[#7ED6D1]"
          >
            Zebron Business Operations
          </p>

          <h2 class="mt-0.5 text-lg font-semibold">
            {{ isEditMode ? 'Edit Document' : 'Upload Document' }}
          </h2>

        </div>

        <button
          mat-icon-button
          type="button"
          aria-label="Close"
          matTooltip="Close"
          class="!h-9 !w-9 !text-white hover:!bg-white/10"
          (click)="cancel()"
        >
          <mat-icon>close</mat-icon>
        </button>

      </div>

    </div>


    <!-- Accent bar -->

    <div class="h-0.5 bg-[#007979]"></div>


    <!-- ======================================================
         CONTENT
         ====================================================== -->

    <mat-dialog-content class="!px-4 !py-4">

      <form
        [formGroup]="form"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >


        <!-- ==================================================
             DOCUMENT NAME
             ================================================== -->

        <mat-form-field
          appearance="outline"
          class="sm:col-span-1"
        >

          <mat-label>Document Name</mat-label>

          <input
            matInput
            formControlName="name"
            placeholder="e.g. Articles of Organization"
          />

          @if (form.controls.name.hasError('required')) {

            <mat-error>
              Document name is required.
            </mat-error>

          }

        </mat-form-field>


        <!-- ==================================================
             CATEGORY
             ================================================== -->

        <mat-form-field
          appearance="outline"
          class="sm:col-span-1"
        >

          <mat-label>Category</mat-label>

          <mat-select formControlName="category">

            @for (
              category of categories;
              track category.value
            ) {

              <mat-option [value]="category.value">
                {{ category.label }}
              </mat-option>

            }

          </mat-select>

        </mat-form-field>


        <!-- ==================================================
             FILE
             ================================================== -->

        @if (!isEditMode) {

          <div class="sm:col-span-2">

            <div
              class="flex
                     items-center
                     gap-3
                     rounded-lg
                     border
                     border-dashed
                     border-gray-300
                     bg-gray-50
                     px-3
                     py-2.5"
            >

              <input
                #fileInput
                type="file"
                class="hidden"
                (change)="onFileSelected($event)"
              />

              <!-- Icon -->

              <div
                class="flex
                       h-9
                       w-9
                       shrink-0
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#007979]/10
                       text-[#007979]"
              >

                <mat-icon class="!text-[20px]">
                  upload_file
                </mat-icon>

              </div>


              <!-- File information -->

              <div class="min-w-0 flex-1">

                @if (selectedFile) {

                  <p
                    class="truncate
                           text-sm
                           font-medium
                           text-[#032D42]"
                    [matTooltip]="selectedFile.name"
                  >
                    {{ selectedFile.name }}
                  </p>

                  <p class="text-[11px] text-gray-500">
                    {{ formatFileSize(selectedFile.size) }}
                  </p>

                } @else {

                  <p class="text-sm font-medium text-[#032D42]">
                    Select a document
                  </p>

                  <p class="text-[11px] text-gray-500">
                    PDF, Word, Excel, images, or other business records
                  </p>

                }

              </div>


              <!-- Choose file -->

              <button
                mat-stroked-button
                type="button"
                class="!min-h-9 !px-3"
                (click)="fileInput.click()"
              >

                <mat-icon class="!mr-1 !text-[18px]">
                  folder_open
                </mat-icon>

                <span class="text-xs">
                  Choose File
                </span>

              </button>

            </div>


            @if (fileRequiredError) {

              <p class="mt-1 text-xs text-red-600">
                Please select a file to upload.
              </p>

            }

          </div>

        } @else {

          <!-- EDIT MODE FILE -->

          <div
            class="flex
                   items-center
                   gap-3
                   rounded-lg
                   bg-gray-50
                   px-3
                   py-2.5
                   sm:col-span-2"
          >

            <div
              class="flex
                     h-9
                     w-9
                     shrink-0
                     items-center
                     justify-center
                     rounded-lg
                     bg-[#007979]/10
                     text-[#007979]"
            >

              <mat-icon class="!text-[20px]">
                description
              </mat-icon>

            </div>


            <div class="min-w-0 flex-1">

              <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Current File
              </p>

              <p
                class="truncate text-sm font-medium text-[#032D42]"
                [matTooltip]="data.document?.fileName || ''"
              >
                {{ data.document?.fileName }}
              </p>

              @if (selectedFile) {

                <p
                  class="truncate text-[11px] text-[#007979]"
                  [matTooltip]="selectedFile.name"
                >
                  Replacement: {{ selectedFile.name }}
                </p>

              }

            </div>


            <input
              #replacementInput
              type="file"
              class="hidden"
              (change)="onFileSelected($event)"
            />

            <button
              mat-stroked-button
              type="button"
              class="!min-h-9 !px-3"
              (click)="replacementInput.click()"
            >

              <mat-icon class="!mr-1 !text-[18px]">
                swap_horiz
              </mat-icon>

              <span class="text-xs">
                Replace
              </span>

            </button>

          </div>

        }


        <!-- ==================================================
             DESCRIPTION
             ================================================== -->

        <mat-form-field
          appearance="outline"
          class="sm:col-span-2"
        >

          <mat-label>Description</mat-label>

          <textarea
            matInput
            rows="2"
            formControlName="description"
            placeholder="Brief description..."
          ></textarea>

        </mat-form-field>


        <!-- ==================================================
             EXPIRATION DATE
             ================================================== -->

        <mat-form-field appearance="outline">

          <mat-label>Expiration Date</mat-label>

          <input
            matInput
            [matDatepicker]="picker"
            formControlName="expiresAt"
            readonly
          />

          <mat-datepicker-toggle
            matIconSuffix
            [for]="picker"
          />

          <mat-datepicker #picker />

        </mat-form-field>


        <!-- ==================================================
             VERIFICATION
             ================================================== -->

        <div
          class="flex
                 min-h-[56px]
                 items-center
                 rounded-lg
                 border
                 border-gray-200
                 px-3"
        >

          <mat-checkbox formControlName="verified">

            <span class="text-sm">
              Document has been verified
            </span>

          </mat-checkbox>

        </div>


        <!-- ==================================================
             NOTES
             ================================================== -->

        <mat-form-field
          appearance="outline"
          class="sm:col-span-2"
        >

          <mat-label>Notes</mat-label>

          <textarea
            matInput
            rows="2"
            formControlName="notes"
            placeholder="Additional document notes..."
          ></textarea>

        </mat-form-field>

      </form>

    </mat-dialog-content>


    <!-- ======================================================
         ACTIONS
         ====================================================== -->

    <mat-dialog-actions
      align="end"
      class="!border-t
             !border-gray-200
             !px-4
             !py-2.5"
    >

      <button
        mat-button
        type="button"
        class="!text-sm"
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

        <mat-icon class="!mr-1 !text-[18px]">
          {{ isEditMode ? 'save' : 'cloud_upload' }}
        </mat-icon>

        <span class="text-sm">
          {{
            isEditMode
              ? 'Save Changes'
              : 'Upload Document'
          }}
        </span>

      </button>

    </mat-dialog-actions>

  `,

  styles: `

    :host {
      display: block;
    }

    /*
     * Compact dialog sizing.
     *
     * The previous dialog used a 700px minimum width.
     * This keeps the dialog comfortable without making it
     * unnecessarily wide.
     */

    mat-dialog-content {
      width: min(100%, 600px);
      max-height: 70vh;
      box-sizing: border-box;
    }

    mat-form-field {
      width: 100%;
    }

    /*
     * Reduce Material form-field vertical footprint.
     */

    :host ::ng-deep
    .mat-mdc-form-field-subscript-wrapper {
      min-height: 18px;
    }

    :host ::ng-deep
    .mat-mdc-text-field-wrapper {
      padding-top: 0;
      padding-bottom: 0;
    }

    /*
     * Mobile layout.
     */

    @media (max-width: 640px) {

      mat-dialog-content {
        width: 100%;
        max-height: 68vh;
      }

    }

  `,
})
export class BusinessDocumentDialogComponent {


  // ============================================================
  // FORM
  // ============================================================

  private readonly fb =
    inject(FormBuilder);


  // ============================================================
  // MODE
  // ============================================================

  readonly isEditMode: boolean;


  // ============================================================
  // CATEGORIES
  // ============================================================

  readonly categories: Array<{
    value: BusinessDocumentCategory;
    label: string;
  }> = [

    {
      value: 'business-registration',
      label: 'Business Registration',
    },

    {
      value: 'operating-agreement',
      label: 'Operating Agreement',
    },

    {
      value: 'ein',
      label: 'EIN Documentation',
    },

    {
      value: 'annual-report',
      label: 'Annual Report',
    },

    {
      value: 'bank-statement',
      label: 'Bank Statement',
    },

    {
      value: 'invoice',
      label: 'Invoice',
    },

    {
      value: 'receipt',
      label: 'Receipt',
    },

    {
      value: 'tax',
      label: 'Tax Document',
    },

    {
      value: 'license-permit',
      label: 'License / Permit',
    },

    {
      value: 'contract',
      label: 'Contract',
    },

    {
      value: 'government-correspondence',
      label: 'Government Correspondence',
    },

    {
      value: 'insurance',
      label: 'Insurance',
    },

    {
      value: 'financial',
      label: 'Financial',
    },

    {
      value: 'compliance',
      label: 'Compliance',
    },

    {
      value: 'other',
      label: 'Other',
    },

  ];


  // ============================================================
  // REACTIVE FORM
  // ============================================================

  readonly form =
    this.fb.nonNullable.group({

      name: [
        '',
        Validators.required,
      ],

      category: [
        'other' as BusinessDocumentCategory,
        Validators.required,
      ],

      description: [
        '',
      ],

      expiresAt: [
        null as Date | null,
      ],

      verified: [
        false,
      ],

      notes: [
        '',
      ],

    });


  // ============================================================
  // FILE STATE
  // ============================================================

  selectedFile: File | null = null;

  fileRequiredError = false;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(

    private readonly dialogRef:
      MatDialogRef<
        BusinessDocumentDialogComponent,
        BusinessDocumentDialogResult | undefined
      >,

    @Inject(MAT_DIALOG_DATA)
    readonly data:
      BusinessDocumentDialogData,

  ) {

    this.isEditMode =
      !!data.document;


    // Populate form when editing.

    if (data.document) {

      this.form.patchValue({

        name:
          data.document.name,

        category:
          data.document.category,

        description:
          data.document.description ?? '',

        expiresAt:
          data.document.expiresAt?.toDate() ?? null,

        verified:
          data.document.verified,

        notes:
          data.document.notes ?? '',

      });

    }

  }


  // ============================================================
  // FILE SELECTION
  // ============================================================

  onFileSelected(
    event: Event,
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.selectedFile =
      input.files?.[0] ?? null;


    this.fileRequiredError =
      false;

  }


  // ============================================================
  // FILE SIZE
  // ============================================================

  formatFileSize(
    size: number,
  ): string {

    if (size < 1024) {

      return `${size} B`;

    }


    if (size < 1024 * 1024) {

      return `${(size / 1024).toFixed(1)} KB`;

    }


    return `${(size / (1024 * 1024)).toFixed(1)} MB`;

  }


  // ============================================================
  // SAVE
  // ============================================================

  save(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }


    /*
     * A file is required when creating a document.
     *
     * When editing, the existing file can remain unchanged.
     */

    if (
      !this.isEditMode &&
      !this.selectedFile
    ) {

      this.fileRequiredError =
        true;

      return;

    }


    const value =
      this.form.getRawValue();


    this.dialogRef.close({

      name:
        value.name.trim(),

      category:
        value.category,

      description:
        value.description.trim() ||
        undefined,

      expiresAt:
        value.expiresAt ??
        undefined,

      verified:
        value.verified,

      notes:
        value.notes.trim() ||
        undefined,

      file:
        this.selectedFile ??
        undefined,

    });

  }


  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {

    this.dialogRef.close();

  }

}