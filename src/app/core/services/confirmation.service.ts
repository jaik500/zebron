import { Injectable, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
  ConfirmationDialogResult,
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
    return this.open(data).then((result) =>
      result === true || (typeof result === 'object' && result !== null && result.confirmed === true),
    );
  }

  /**
   * A confirmation with a checkbox (data.optionLabel), such as
   * "Don't ask me again". Resolves with the answer and the checkbox.
   * Cancelling or closing the dialog never reports the checkbox as ticked.
   */
  async confirmWithOption(
    data: ConfirmationDialogData & { optionLabel: string },
  ): Promise<ConfirmationDialogResult> {
    const result = await this.open(data);
    if (typeof result === 'object' && result !== null) {
      return { confirmed: result.confirmed === true, option: result.confirmed === true && result.option === true };
    }
    return { confirmed: result === true, option: false };
  }

  private open(
    data: ConfirmationDialogData,
  ): Promise<boolean | ConfirmationDialogResult | undefined> {

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

    return new Promise<boolean | ConfirmationDialogResult | undefined>((resolve) => {

      dialogRef.afterClosed().subscribe((result) => {
        resolve(result as boolean | ConfirmationDialogResult | undefined);
      });

    });
  }
}