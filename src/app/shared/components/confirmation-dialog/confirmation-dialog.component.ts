import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

/**
 * Configuration passed into the confirmation dialog.
 */
export interface ConfirmationDialogData {
  /**
   * Dialog title.
   */
  title: string;

  /**
   * Main confirmation message.
   */
  message: string;

  /**
   * Optional additional warning.
   */
  warning?: string;

  /**
   * Icon displayed in the dialog header.
   */
  icon?: string;

  /**
   * Text for the confirmation button.
   */
  confirmText?: string;

  /**
   * Text for the cancel button.
   */
  cancelText?: string;

  /**
   * Whether the confirmation button should
   * visually represent a destructive operation.
   */
  destructive?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',

  standalone: true,

  imports: [MatDialogModule, MatButtonModule, MatIconModule],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="w-full
             overflow-hidden
             rounded-2xl
             bg-white"
    >
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <div
        class="flex
               items-start
               gap-4
               border-b
               border-gray-200
               px-6
               py-5"
      >
        <div
          class="flex
                 h-11
                 w-11
                 shrink-0
                 items-center
                 justify-center
                 rounded-full
                 bg-[#032D42]/10
                 text-[#032D42]"
        >
          <mat-icon>
            {{ data.icon || 'help_outline' }}
          </mat-icon>
        </div>

        <div class="min-w-0">
          <h2
            mat-dialog-title
            class="!m-0
                   !p-0
                   text-lg
                   font-semibold
                   text-[#032D42]"
          >
            {{ data.title }}
          </h2>
        </div>
      </div>

      <!-- =========================================================
           CONTENT
           ========================================================= -->

      <mat-dialog-content
        class="!m-0
               !px-6
               !py-5"
      >
        <p
          class="text-sm
                 leading-6
                 text-gray-700"
        >
          {{ data.message }}
        </p>

        @if (data.warning) {
          <div
            class="mt-4
                   flex
                   gap-3
                   rounded-xl
                   border
                   border-amber-200
                   bg-amber-50
                   p-4
                   text-sm
                   text-amber-900"
          >
            <mat-icon
              class="shrink-0
                     text-amber-600"
            >
              warning
            </mat-icon>

            <p class="leading-6">
              {{ data.warning }}
            </p>
          </div>
        }
      </mat-dialog-content>

      <!-- =========================================================
           ACTIONS
           ========================================================= -->

      <mat-dialog-actions
        align="end"
        class="!m-0
               !border-t
               !border-gray-200
               !px-6
               !py-4"
      >
        <button mat-button type="button" (click)="cancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>

        <button
          mat-flat-button
          type="button"
          (click)="confirm()"
          [class.!bg-red-600]="data.destructive"
          [class.!bg-[#032D42]]="!data.destructive"
          class="!text-white"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ConfirmationDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmationDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    protected readonly data: ConfirmationDialogData,
  ) {}

  /**
   * Confirm the operation.
   */
  protected confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Cancel the operation.
   */
  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
