import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { PwaService } from '../../../core/services/pwa.service';

/**
 * Small notices for the whole app (root component):
 * - a new version is ready (Reload), or the cached app must reload;
 * - the device is offline (with a link to My documents, which works offline).
 *
 * Phones: under the header. Larger screens: bottom left (the help
 * assistant's button is bottom right).
 */
@Component({
  selector: 'app-status',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-3 top-[72px] z-40 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:top-auto sm:items-start" aria-live="polite">
      @if ((pwa.needsReload() || pwa.updateReady()) && !updateClosed()) {
        <div class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#032D42] py-2 pl-4 pr-2 text-sm text-white shadow-lg" role="status">
          <mat-icon class="shrink-0 text-amber-300" aria-hidden="true">system_update</mat-icon>
          <span>{{ (pwa.needsReload() ? 'Zebron needs to reload to keep working.' : 'A new version of Zebron is ready.') | t }}</span>
          <button type="button" class="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#032D42] hover:bg-teal-50" (click)="pwa.reload()">
            {{ 'Reload' | t }}
          </button>
          <button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" [attr.aria-label]="'Close' | t" [title]="'Close' | t" (click)="updateClosed.set(true)">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
          </button>
        </div>
      }
      @if (!connectivity.online() && !offlineDismissed()) {
        <div class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 py-2 pl-4 pr-2 text-sm text-amber-950 shadow-lg" role="status">
          <mat-icon class="shrink-0 text-amber-700" aria-hidden="true">cloud_off</mat-icon>
          <span>
            {{ "You're offline. Some pages need a connection." | t }}
            <a routerLink="/courses/documents" class="font-semibold underline">{{ 'Read kept documents' | t }}</a>
          </span>
          <button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-amber-100" [attr.aria-label]="'Close' | t" (click)="offlineDismissed.set(true)">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class AppStatusComponent {
  protected readonly pwa = inject(PwaService);
  protected readonly connectivity = inject(ConnectivityService);

  /** Closed: the new version is then used the next time Zebron opens. */
  protected readonly updateClosed = signal(false);

  /** Closed for this time offline; shown again the next time the connection drops. */
  protected readonly offlineDismissed = signal(false);

  constructor() {
    this.pwa.start();
    effect(() => {
      if (this.connectivity.online()) this.offlineDismissed.set(false);
    });
  }
}
