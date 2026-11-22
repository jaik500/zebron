import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/**
 * How to install Zebron where the browser has no install prompt:
 * Safari on iPhone and iPad (Add to Home Screen), or any other browser.
 */
@Component({
  selector: 'app-install-instructions-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <img src="/icons/icon-192.png" alt="" class="h-8 w-8" />
      {{ 'Install the Zebron app' | t }}
    </h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-600">
        {{ 'Zebron opens from your Home Screen in its own window, and documents you keep on this device can be read with no connection.' | t }}
      </p>
      @if (data.ios) {
        <ol class="mt-4 space-y-3 text-sm text-slate-800">
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007979] text-xs font-bold text-white">1</span>
            <span>
              {{ 'Open zebron.org in Safari and tap the Share button' | t }}
              <mat-icon class="!h-5 !w-5 align-middle !text-[20px] text-[#007979]" aria-hidden="true">ios_share</mat-icon>
              {{ '(at the bottom of the screen on iPhone, at the top on iPad).' | t }}
            </span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007979] text-xs font-bold text-white">2</span>
            <span>{{ 'Scroll down and tap Add to Home Screen.' | t }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007979] text-xs font-bold text-white">3</span>
            <span>{{ 'Tap Add. Zebron appears on your Home Screen.' | t }}</span>
          </li>
        </ol>
      } @else {
        <p class="mt-4 text-sm text-slate-800">
          {{ 'Open your browser menu and choose Install Zebron, Install app or Add to Home screen. Chrome, Edge and Samsung Internet support installing; in other browsers, add a bookmark instead.' | t }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>{{ 'Got it' | t }}</button>
    </mat-dialog-actions>
  `,
})
export class InstallInstructionsDialogComponent {
  protected readonly data = inject<{ ios: boolean }>(MAT_DIALOG_DATA);
}
