import { Injectable, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

/**
 * Centralized confirmation service.
 *
 * Use this service whenever an administrative or destructive
 * operation requires user confirmation.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {

  private readonly dialog = inject(MatDialog);

  /**
   * Open a confirmation dialog.
   *
   * Returns:
   *   true  -> user confirmed
   *   false -> user cancelled / closed dialog
   */
  confirm(
    data: ConfirmationDialogData,
  ): Promise<boolean> {

    const dialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        width: 'min(520px, calc(100vw - 32px))',
        maxWidth: '100vw',
        disableClose: true,
        autoFocus: false,
        data,
      },
    );

    return new Promise<boolean>((resolve) => {

      dialogRef.afterClosed().subscribe((result) => {
        resolve(result === true);
      });

    });
  }
}