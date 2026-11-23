import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, afterNextRender, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { BackNavigationService } from '../../../core/services/back-navigation.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { PwaService } from '../../../core/services/pwa.service';

/** The bar slides away this long after scrolling stops (or the last touch on it). */
export const NAV_BAR_HIDE_MS = 5000;

/**
 * Navigation bar for the installed app on phones and tablets: Back, Forward,
 * Home, Refresh and a ⋯ menu (language, and installing the app where that is
 * possible). The installed app has no browser buttons, so this replaces them.
 *
 * - Only in the installed app (PwaService.standalone) and below `lg`; in a
 *   browser the browser's own buttons are used, on computers the top bar's
 *   back arrow.
 * - Slides up when the page scrolls and slides away NAV_BAR_HIDE_MS after
 *   scrolling stops. Touching or focusing the bar, or an open menu, keeps it.
 * - Stays hidden while a text field has focus (the on-screen keyboard is up).
 * - Runs edge to edge along the bottom of the screen (like the top bar).
 * - While it shows, --zb-app-nav-offset on <html> is its height, so
 *   floating buttons (the Help assistant) move up out of its way.
 */
@Component({
  selector: 'app-nav-bar',
  imports: [MatIconModule, MatMenuModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pwa.standalone()) {
      <nav
        class="zb-app-nav fixed inset-x-0 bottom-0 z-40 flex items-start justify-around bg-[#0b3443] text-white shadow-[0_-2px_10px_rgb(0_0_0/0.2)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden"
        [class.zb-app-nav--hidden]="!shown()"
        [attr.aria-label]="'App navigation' | t"
        [attr.aria-hidden]="shown() ? null : 'true'"
        (pointerdown)="keepOpen()"
        (focusin)="keepOpen()"
      >
        <button type="button" class="zb-app-nav__button" [disabled]="!back.canGoBack()" [attr.tabindex]="shown() ? null : -1" (click)="goBack()" [attr.aria-label]="'Back' | t" [title]="'Back' | t">
          <mat-icon aria-hidden="true">chevron_left</mat-icon>
        </button>
        <button type="button" class="zb-app-nav__button" [disabled]="!back.canGoForward()" [attr.tabindex]="shown() ? null : -1" (click)="goForward()" [attr.aria-label]="'Forward' | t" [title]="'Forward' | t">
          <mat-icon aria-hidden="true">chevron_right</mat-icon>
        </button>
        <button type="button" class="zb-app-nav__button" [attr.tabindex]="shown() ? null : -1" (click)="goHome()" [attr.aria-label]="'Home' | t" [title]="'Home' | t">
          <mat-icon aria-hidden="true">home</mat-icon>
        </button>
        <button type="button" class="zb-app-nav__button" [attr.tabindex]="shown() ? null : -1" (click)="refresh()" [attr.aria-label]="'Refresh' | t" [title]="'Refresh' | t">
          <mat-icon aria-hidden="true">refresh</mat-icon>
        </button>
        <button
          type="button"
          class="zb-app-nav__button"
          [attr.tabindex]="shown() ? null : -1"
          [matMenuTriggerFor]="moreMenu"
          (menuOpened)="menuOpen.set(true)"
          (menuClosed)="menuClosed()"
          [attr.aria-label]="'More' | t"
          [title]="'More' | t"
        >
          <mat-icon aria-hidden="true">more_horiz</mat-icon>
        </button>
      </nav>

      <mat-menu #moreMenu="matMenu" xPosition="before" yPosition="above" class="!min-w-[230px] !rounded-xl">
        @if (pwa.canInstall()) {
          <button mat-menu-item type="button" (click)="pwa.install()">
            <mat-icon aria-hidden="true">install_mobile</mat-icon>
            <span>{{ 'Install the Zebron app' | t }}</span>
          </button>
        }
        <div class="flex items-center gap-2 border-b border-gray-100 px-4 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base">translate</mat-icon>
          {{ 'Language' | t }}
        </div>
        @for (language of localization.languages(); track language.code) {
          @let selected = language.code === localization.language();
          <button mat-menu-item type="button" [disabled]="!language.enabled" [attr.aria-current]="selected ? 'true' : null" (click)="chooseLanguage(language.code)">
            <span class="flex w-full items-center gap-2">
              <span class="min-w-0 flex-1" [class]="selected ? 'font-semibold text-[#007979]' : 'text-gray-900'">{{ language.nativeName }}</span>
              @if (!language.enabled) {
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{{ 'Soon' | t }}</span>
              } @else if (selected) {
                <mat-icon aria-hidden="true" class="!m-0 !text-[#007979]">check</mat-icon>
              }
            </span>
          </button>
        }
      </mat-menu>
    }
  `,
  styles: `
    /* Edge to edge and down to the bottom of the screen, like the top bar; the
       buttons stay above the iPhone home bar (safe area). */
    .zb-app-nav {
      height: calc(40px + env(safe-area-inset-bottom, 0px));
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .zb-app-nav--hidden {
      transform: translateY(100%);
      pointer-events: none;
    }
    .zb-app-nav__button {
      display: inline-flex; height: 40px; width: 52px; align-items: center; justify-content: center; border-radius: 12px;
    }
    .zb-app-nav__button .mat-icon { height: 24px; width: 24px; font-size: 24px; }
    .zb-app-nav__button:active:not(:disabled) { background: rgb(255 255 255 / 0.12); }
    .zb-app-nav__button:disabled { opacity: 0.35; }
    .zb-app-nav__button:focus-visible { outline: 2px solid rgb(255 255 255 / 0.7); outline-offset: -2px; }
  `,
})
export class AppNavBarComponent {
  protected readonly pwa = inject(PwaService);
  protected readonly back = inject(BackNavigationService);
  protected readonly localization = inject(LocalizationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly shown = signal(false);
  protected readonly menuOpen = signal(false);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    // Lift floating buttons above the bar while it shows (phones and tablets only).
    effect(() => {
      const lift = this.shown() && window.matchMedia('(max-width: 1023.98px)').matches;
      document.documentElement.style.setProperty('--zb-app-nav-offset', lift ? 'calc(40px + env(safe-area-inset-bottom, 0px))' : '0px');
    });

    afterNextRender(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      document.addEventListener('focusin', this.onFocusChange);
    });
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('focusin', this.onFocusChange);
      this.clearTimer();
      document.documentElement.style.removeProperty('--zb-app-nav-offset');
    });
  }

  private readonly onScroll = (): void => {
    if (!this.pwa.standalone() || typingInField()) return;
    this.show();
  };

  /** A text field got focus: the keyboard covers the bottom, so get out of the way. */
  private readonly onFocusChange = (): void => {
    if (typingInField()) this.hide();
  };

  private show(): void {
    this.shown.set(true);
    this.restartTimer();
  }

  private hide(): void {
    if (this.menuOpen()) return;
    this.clearTimer();
    this.shown.set(false);
  }

  /** Touching or focusing the bar keeps it for another NAV_BAR_HIDE_MS. */
  protected keepOpen(): void {
    if (this.shown()) this.restartTimer();
  }

  protected menuClosed(): void {
    this.menuOpen.set(false);
    this.restartTimer();
  }

  private restartTimer(): void {
    this.clearTimer();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.menuOpen()) return;
      this.shown.set(false);
    }, NAV_BAR_HIDE_MS);
  }

  private clearTimer(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  protected goBack(): void {
    this.back.back();
    this.restartTimer();
  }

  protected goForward(): void {
    this.back.forward();
    this.restartTimer();
  }

  /** Home: My learning when signed in, otherwise the home page. */
  protected goHome(): void {
    void this.router.navigateByUrl(this.auth.firebaseUser() ? '/courses' : '/');
    this.restartTimer();
  }

  protected refresh(): void {
    void this.pwa.reload();
  }

  protected chooseLanguage(code: string): void {
    if (this.localization.isLanguageEnabled(code)) this.localization.setLanguage(code);
  }
}

/** A text field (or other editable element) has focus. */
function typingInField(): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return true;
  if (active instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file', 'image'].includes(active.type);
  }
  return false;
}
