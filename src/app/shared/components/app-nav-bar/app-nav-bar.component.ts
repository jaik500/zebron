import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, afterNextRender, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { BackNavigationService } from '../../../core/services/back-navigation.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { PwaService } from '../../../core/services/pwa.service';

/** The bar slides away this long after scrolling stops (or the last touch on it). */
export const NAV_BAR_HIDE_MS = 5000;

/**
 * Navigation bar for phones and tablets: Back, Forward, Home, Refresh and a ⋯
 * menu (language, and installing the app where that is possible).
 *
 * - Below `lg`, in the installed app and in phone and tablet browsers alike;
 *   on computers the top bar's back arrow is used instead.
 * - Slides up whenever anything scrolls, up or down (the page or a scrolling
 *   panel inside it: the scroll listener is on the document, in the capture
 *   phase), and slides away NAV_BAR_HIDE_MS after scrolling stops. Touching or focusing the bar, or an open menu, keeps it.
 * - Stays hidden while a text field has focus (the on-screen keyboard is up).
 * - Runs edge to edge along the bottom of the screen (like the top bar).
 * - Light frosted glass: mostly see-through (about 35% opaque) with a blur and
 *   two faint cloud patches, dark icons with labels, Home in a teal pill.
 *   Nearly solid where the blur isn't supported or the person asked for
 *   reduced transparency, so the icons stay readable.
 * - While it shows, --zb-app-nav-offset on <html> is its height, so
 *   floating buttons (the Help assistant) move up out of its way.
 */
@Component({
  selector: 'app-nav-bar',
  imports: [MatIconModule, MatMenuModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <nav
        class="zb-app-nav fixed inset-x-0 bottom-0 z-40 flex items-start justify-around transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden"
        [class.zb-app-nav--hidden]="!shown()"
        [attr.aria-label]="'App navigation' | t"
        [attr.aria-hidden]="shown() ? null : 'true'"
        (pointerdown)="keepOpen()"
        (focusin)="keepOpen()"
      >
        <button type="button" class="zb-app-nav__button" [disabled]="!back.canGoBack()" [attr.tabindex]="shown() ? null : -1" (click)="goBack()" [attr.aria-label]="'Back' | t" [title]="'Back' | t">
          <mat-icon aria-hidden="true">chevron_left</mat-icon>
          <span class="zb-app-nav__label" aria-hidden="true">{{ 'Back' | t }}</span>
        </button>
        <button type="button" class="zb-app-nav__button" [disabled]="!back.canGoForward()" [attr.tabindex]="shown() ? null : -1" (click)="goForward()" [attr.aria-label]="'Forward' | t" [title]="'Forward' | t">
          <mat-icon aria-hidden="true">chevron_right</mat-icon>
          <span class="zb-app-nav__label" aria-hidden="true">{{ 'Forward' | t }}</span>
        </button>
        <button type="button" class="zb-app-nav__button zb-app-nav__button--home" [attr.tabindex]="shown() ? null : -1" (click)="goHome()" [attr.aria-label]="'Home' | t" [title]="'Home' | t">
          <span class="zb-app-nav__pill"><mat-icon aria-hidden="true">home</mat-icon></span>
          <span class="zb-app-nav__label" aria-hidden="true">{{ 'Home' | t }}</span>
        </button>
        <button type="button" class="zb-app-nav__button" [attr.tabindex]="shown() ? null : -1" (click)="refresh()" [attr.aria-label]="'Refresh' | t" [title]="'Refresh' | t">
          <mat-icon aria-hidden="true">refresh</mat-icon>
          <span class="zb-app-nav__label" aria-hidden="true">{{ 'Refresh' | t }}</span>
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
          <span class="zb-app-nav__label" aria-hidden="true">{{ 'More' | t }}</span>
        </button>
      </nav>

      <mat-menu #moreMenu="matMenu" xPosition="before" yPosition="above" class="!min-w-[230px] !rounded-xl">
        @if (pwa.canInstall()) {
          <button mat-menu-item type="button" (click)="pwa.install()">
            <mat-icon aria-hidden="true">install_mobile</mat-icon>
            <span>{{ 'Install the Zebron app' | t }}</span>
          </button>
        }
        <!-- Language: a dropdown inside the menu. -->
        <button
          mat-menu-item
          type="button"
          [attr.aria-expanded]="languageOpen()"
          (click)="$event.stopPropagation(); languageOpen.set(!languageOpen())"
        >
          <mat-icon aria-hidden="true">translate</mat-icon>
          <span class="flex w-full items-center gap-2">
            <span>{{ 'Language' | t }}</span>
            <span class="ml-auto font-semibold text-[#007979]">{{ localization.currentLanguage().nativeName }}</span>
            <mat-icon aria-hidden="true" class="!m-0 text-gray-500">{{ languageOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </span>
        </button>
        @if (languageOpen()) {
          <div class="bg-gray-50" role="group" [attr.aria-label]="'Language' | t">
            @for (language of localization.languages(); track language.code) {
              @let selected = language.code === localization.language();
              <button mat-menu-item type="button" class="!pl-14" [disabled]="!language.enabled" [attr.aria-current]="selected ? 'true' : null" (click)="chooseLanguage(language.code)">
                <span class="flex w-full items-center gap-2">
                  <span class="min-w-0 flex-1" [class]="selected ? 'font-semibold text-[#007979]' : 'text-gray-900'">{{ language.nativeName }}</span>
                  @if (!language.enabled) {
                    <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{{ 'Soon' | t }}</span>
                  } @else if (selected) {
                    <mat-icon aria-hidden="true" class="!m-0 !text-[#007979]">check</mat-icon>
                  }
                </span>
              </button>
            }
          </div>
        }
      </mat-menu>
  `,
  styles: `
    /* Edge to edge and down to the bottom of the screen, like the top bar; the
       buttons stay above the iPhone home bar (safe area). Light frosted glass:
       about 35% opaque so the page shows through, blurred so icons stay legible. */
    .zb-app-nav {
      height: calc(76px + env(safe-area-inset-bottom, 0px));
      padding: 6px 0 env(safe-area-inset-bottom, 0px);
      color: #0b3b48;
      background:
        radial-gradient(40% 70% at 22% 40%, rgb(255 255 255 / 0.3), transparent 70%),
        radial-gradient(45% 75% at 74% 60%, rgb(255 255 255 / 0.25), transparent 70%),
        rgb(232 244 244 / 0.35);
      -webkit-backdrop-filter: blur(18px) saturate(1.5);
      backdrop-filter: blur(18px) saturate(1.5);
      border-top: 1px solid rgb(255 255 255 / 0.55);
    }
    /* No blur, or the person asked for less transparency: nearly solid. */
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .zb-app-nav { background: rgb(232 244 244 / 0.96); }
    }
    @media (prefers-reduced-transparency: reduce) {
      .zb-app-nav { background: rgb(232 244 244 / 0.96); }
    }
    .zb-app-nav--hidden {
      transform: translateY(100%);
      pointer-events: none;
    }
    .zb-app-nav__button {
      display: inline-flex; flex-direction: column; gap: 3px; height: 64px; min-width: 60px; padding: 0 4px;
      align-items: center; justify-content: center; border-radius: 14px;
      text-shadow: 0 0 6px rgb(255 255 255 / 0.8);
    }
    .zb-app-nav__button .mat-icon { height: 26px; width: 26px; font-size: 26px; }
    .zb-app-nav__label { font-size: 11px; font-weight: 600; line-height: 1; }
    .zb-app-nav__pill { display: inline-flex; align-items: center; justify-content: center; padding: 1px 14px; border-radius: 9999px; background: rgb(0 121 121 / 0.16); }
    .zb-app-nav__button--home { color: #007979; }
    .zb-app-nav__button:active:not(:disabled) { background: rgb(0 121 121 / 0.12); }
    .zb-app-nav__button:disabled { opacity: 0.35; }
    .zb-app-nav__button:focus-visible { outline: 2px solid #007979; outline-offset: -2px; }
  `,
})
export class AppNavBarComponent {
  protected readonly pwa = inject(PwaService);
  protected readonly back = inject(BackNavigationService);
  protected readonly localization = inject(LocalizationService);
  private readonly router = inject(Router);

  protected readonly shown = signal(false);
  protected readonly menuOpen = signal(false);
  /** The language list inside the ⋯ menu is open. */
  protected readonly languageOpen = signal(false);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    // Lift floating buttons above the bar while it shows (phones and tablets only).
    effect(() => {
      const lift = this.shown() && window.matchMedia('(max-width: 1023.98px)').matches;
      document.documentElement.style.setProperty('--zb-app-nav-offset', lift ? 'calc(76px + env(safe-area-inset-bottom, 0px))' : '0px');
    });

    afterNextRender(() => {
      // Capture phase: scroll events don't bubble, so this also catches
      // scrolling inside panels, not only the page.
      document.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
      document.addEventListener('focusin', this.onFocusChange);
    });
    destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', this.onScroll, { capture: true });
      document.removeEventListener('focusin', this.onFocusChange);
      this.clearTimer();
      document.documentElement.style.removeProperty('--zb-app-nav-offset');
    });
  }

  private readonly onScroll = (): void => {
    if (typingInField()) return;
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
    this.languageOpen.set(false);
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

  /** Home: the Zebron home page. */
  protected goHome(): void {
    void this.router.navigateByUrl('/');
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
