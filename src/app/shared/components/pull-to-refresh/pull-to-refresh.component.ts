import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { PwaService } from '../../../core/services/pwa.service';

/** How far (px, after damping) the page must be pulled to refresh. */
export const PULL_THRESHOLD = 72;
/** The pull feels heavier than the finger: the indicator moves this much per px. */
const DAMPING = 0.5;
const MAX_PULL = 110;

/**
 * Pull to refresh for the installed app on phones and tablets.
 *
 * Browsers already refresh when the page is pulled down (Chrome, Safari), but
 * the installed app doesn't, so this adds it there only: with the page at the
 * very top, pull down until the circle's arrow turns and the label says
 * "Release to refresh", then let go. PwaService.reload() reloads (and applies
 * a waiting update).
 *
 * The system's own overscroll is turned off in the app (overscroll-behavior-y:
 * contain on <html>), so only one refresh can happen.
 *
 * Not started from text fields, menus and dialogs, anything marked
 * [data-no-pull-refresh], or inside a box that is itself scrolled down.
 */
@Component({
  selector: 'app-pull-to-refresh',
  imports: [MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pwa.standalone() && (pull() > 0 || refreshing())) {
      <div class="zb-pull pointer-events-none fixed inset-x-0 z-[45] flex justify-center" [style.transform]="'translateY(' + offset() + 'px)'" aria-hidden="true">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#007979] shadow-[0_2px_10px_rgb(0_0_0/0.25)]"
          [style.opacity]="refreshing() ? 1 : 0.4 + progress() * 0.6"
        >
          <mat-icon [class.zb-pull__spin]="refreshing()" [style.transform]="refreshing() ? null : 'rotate(' + progress() * 270 + 'deg)'">refresh</mat-icon>
        </span>
      </div>
      <p class="sr-only" role="status">{{ (refreshing() ? 'Refreshing...' : ready() ? 'Release to refresh' : 'Pull down to refresh') | t }}</p>
    }
  `,
  styles: `
    .zb-pull { top: calc(env(safe-area-inset-top, 0px) + 64px); }
    .zb-pull__spin { animation: zb-pull-spin 0.8s linear infinite; }
    @keyframes zb-pull-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .zb-pull__spin { animation: none; } }
  `,
})
export class PullToRefreshComponent {
  protected readonly pwa = inject(PwaService);

  /** How far the page is pulled (px, damped). */
  protected readonly pull = signal(0);
  protected readonly refreshing = signal(false);
  protected readonly progress = computed(() => Math.min(1, this.pull() / PULL_THRESHOLD));
  protected readonly ready = computed(() => this.pull() >= PULL_THRESHOLD);
  /** The circle starts tucked under the top bar and comes down with the pull. */
  protected readonly offset = computed(() => (this.refreshing() ? PULL_THRESHOLD * 0.6 : Math.min(this.pull(), MAX_PULL) * 0.6 - 44));

  private startY: number | null = null;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    // In the app, turn off the system's own overscroll (bounce or glow, and any built-in
    // pull to refresh), so only this one responds.
    effect(() => {
      document.documentElement.style.overscrollBehaviorY = this.pwa.standalone() ? 'contain' : '';
    });

    afterNextRender(() => {
      document.addEventListener('touchstart', this.onStart, { passive: true });
      document.addEventListener('touchmove', this.onMove, { passive: true });
      document.addEventListener('touchend', this.onEnd, { passive: true });
      document.addEventListener('touchcancel', this.onCancel, { passive: true });
    });
    destroyRef.onDestroy(() => {
      document.removeEventListener('touchstart', this.onStart);
      document.removeEventListener('touchmove', this.onMove);
      document.removeEventListener('touchend', this.onEnd);
      document.removeEventListener('touchcancel', this.onCancel);
    });
  }

  private readonly onStart = (event: TouchEvent): void => {
    this.startY = null;
    if (!this.pwa.standalone() || this.refreshing() || event.touches.length !== 1) return;
    if (window.scrollY > 0 || !canStartPull(event.target)) return;
    this.startY = event.touches[0].clientY;
  };

  private readonly onMove = (event: TouchEvent): void => {
    if (this.startY === null) return;
    // The page scrolled meanwhile (or a second finger joined): not a pull.
    if (window.scrollY > 0 || event.touches.length !== 1) {
      this.onCancel();
      return;
    }
    const distance = (event.touches[0].clientY - this.startY) * DAMPING;
    this.pull.set(Math.max(0, Math.min(distance, MAX_PULL)));
  };

  private readonly onEnd = (): void => {
    if (this.startY === null) return;
    const refresh = this.ready();
    this.startY = null;
    this.pull.set(0);
    if (refresh) {
      this.refreshing.set(true);
      void this.pwa.reload();
    }
  };

  private readonly onCancel = (): void => {
    this.startY = null;
    this.pull.set(0);
  };
}

/** A pull may start here: not in a field, menu, dialog or opted-out area, nor in a box scrolled down. */
function canStartPull(target: EventTarget | null): boolean {
  let element = target instanceof Element ? target : null;
  if (!element) return true;
  if (element.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .cdk-overlay-container, [role="dialog"], [aria-modal="true"], [data-no-pull-refresh], .cm-editor')) {
    return false;
  }
  // Inside a scrolling box (a side panel, a list) that isn't at its top: that box scrolls instead.
  for (; element && element !== document.body; element = element.parentElement) {
    if (element.scrollTop > 0) {
      const overflow = getComputedStyle(element).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return false;
    }
  }
  return true;
}
