import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InstallInstructionsDialogComponent } from '../../shared/components/app-status/install-instructions-dialog.component';

/** Chrome / Edge / Samsung Internet "install this site" event (not in TypeScript's DOM types). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** How often an open Zebron checks for a new version. */
const UPDATE_CHECK_MS = 6 * 60 * 60 * 1000;
/** A check also runs when Zebron comes back to the screen after this long. */
const RETURN_CHECK_MS = 30 * 60 * 1000;

/**
 * Zebron as an installable app (PWA).
 *
 * - **Install:** keeps the browser's install prompt (Chrome, Edge, Samsung
 *   Internet, Android) for the "Install the Zebron app" menu item; on
 *   iPhone and iPad, where Safari has no prompt, the item shows how to add
 *   Zebron to the Home Screen.
 * - **Updates:** the Angular service worker (ngsw-config.json) serves the
 *   app from the device, so a new deployment reaches people only after it
 *   has downloaded in the background. `updateReady` then shows "A new
 *   version is ready" with a Reload button (app-status.component.ts).
 *   Zebron checks on start, every 6 hours, and when it comes back to the
 *   screen after 30 minutes.
 *
 * The service worker is registered in app.config.ts (production builds
 * only), so in `ng serve` updates and offline start are off.
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly swUpdate = inject(SwUpdate);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private readonly promptEvent = signal<BeforeInstallPromptEvent | null>(null);
  private readonly standaloneState = signal(false);
  private started = false;
  private lastCheck = 0;

  /** Zebron is running as an installed app (its own window, no browser bar). */
  readonly standalone = this.standaloneState.asReadonly();

  /** iPhone or iPad (Safari has no install prompt there; Add to Home Screen instead). */
  readonly ios = signal(false);

  /** Show "Install the Zebron app": not installed, and the browser can install it. */
  readonly canInstall = computed(() => !this.standaloneState() && (!!this.promptEvent() || this.ios()));

  /** A new version has downloaded and is ready to use after a reload. */
  readonly updateReady = signal(false);

  /** The cached version is broken (rare): Zebron must reload from the network. */
  readonly needsReload = signal(false);

  /** Start listening (called once from the root component, in the browser). */
  start(): void {
    if (!this.browser || this.started) return;
    this.started = true;

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () =>
      this.standaloneState.set(
        standaloneQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    updateStandalone();
    standaloneQuery.addEventListener?.('change', updateStandalone);

    const userAgent = navigator.userAgent;
    this.ios.set(/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1));

    window.addEventListener('beforeinstallprompt', (event) => {
      // Keep the prompt for the menu item instead of the browser's own mini bar.
      event.preventDefault();
      this.promptEvent.set(event as BeforeInstallPromptEvent);
    });
    window.addEventListener('appinstalled', () => {
      this.promptEvent.set(null);
      updateStandalone();
    });

    this.watchUpdates();
  }

  /** Install Zebron (the browser's prompt), or show how on iPhone and iPad. */
  async install(): Promise<void> {
    const event = this.promptEvent();
    if (event) {
      try {
        await event.prompt();
        await event.userChoice;
      } finally {
        // A prompt can be used once; the browser fires a new event when it can ask again.
        this.promptEvent.set(null);
      }
      return;
    }
    this.dialog.open(InstallInstructionsDialogComponent, { width: '420px', data: { ios: this.ios() } });
  }

  /** Use the new version now. */
  async reload(): Promise<void> {
    try {
      if (this.swUpdate.isEnabled && this.updateReady()) await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }

  private watchUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updateReady.set(true));

    this.swUpdate.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.needsReload.set(true));

    void this.checkForUpdate();
    const timer = window.setInterval(() => void this.checkForUpdate(), UPDATE_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - this.lastCheck > RETURN_CHECK_MS) {
        void this.checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  private async checkForUpdate(): Promise<void> {
    if (!navigator.onLine) return;
    this.lastCheck = Date.now();
    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // Offline or the server is busy: the next check tries again.
    }
  }
}
