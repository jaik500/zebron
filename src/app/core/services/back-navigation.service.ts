import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

import { RoutePattern, isMainPage, isSkippedPage, parentUrl, routePatterns } from '../navigation/back-navigation';

/** What a page can change about the back arrow (`useBackButton`). */
export interface BackButtonOptions {
  /** The page has its own back control (for example the document reader). */
  hidden?: boolean;
  /** Where back goes when there is no earlier Zebron page (default: the page above). */
  fallbackUrl?: string;
}

/**
 * The back arrow in the top bar (zebron-header.component.ts).
 *
 * - **Shown** on computers (lg and up; on phones and tablets the browser's
 *   buttons or, in the installed app, app-nav-bar go back), whenever there is an earlier Zebron page to return to. With none (the
 *   first page of a visit) it shows only below main pages, to go up. Pages
 *   with their own back control hide it (`useBackButton({ hidden: true })`).
 * - **Forward** (the app's navigation bar, app-nav-bar.component.ts) goes
 *   to a page you went back from, until you open a new page.
 * - **Back** returns to the previous Zebron page in this visit. With none
 *   (opened from a shortcut, link or notification), or when that page is
 *   sign-in, it goes to the page above (core/navigation/back-navigation.ts)
 *   or the page's `fallbackUrl`. It never leaves Zebron.
 */
@Injectable({ providedIn: 'root' })
export class BackNavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Zebron addresses visited in this visit, oldest first (in step with the browser history). */
  private readonly history: string[] = [];
  /** Pages gone back from, newest last (for Forward in the app's navigation bar). */
  private readonly forwardPages: string[] = [];
  private trigger: 'imperative' | 'popstate' | 'hashchange' = 'imperative';
  private replacing = false;
  private patterns: RoutePattern[] | null = null;

  private readonly url = signal('/');
  /** There is an earlier Zebron page (not sign-in) to go back to. */
  private readonly hasPrevious = signal(false);
  private readonly overrides = signal<ReadonlyArray<{ id: number; options: BackButtonOptions }>>([]);
  private nextId = 0;

  /** The page's own settings (the most recent page to set them wins). */
  private readonly options = computed<BackButtonOptions>(() => this.overrides().at(-1)?.options ?? {});

  /** Show the arrow in the top bar. */
  readonly visible = computed(() => !this.options().hidden && (this.hasPrevious() || !isMainPage(this.url())));

  /** Back can go somewhere (the app's navigation bar; ignores pages that hide the top-bar arrow). */
  readonly canGoBack = computed(() => this.hasPrevious() || !isMainPage(this.url()));

  private readonly forwardCount = signal(0);
  /** There is a page to go forward to (after going back). */
  readonly canGoForward = computed(() => this.forwardCount() > 0);

  constructor() {
    if (!this.browser) return;

    // Created after the first page finished loading: start from it.
    if (this.router.navigated) {
      this.history.push(this.router.url);
      this.url.set(this.router.url);
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.trigger = event.navigationTrigger ?? 'imperative';
        this.replacing = !!this.router.currentNavigation()?.extras.replaceUrl;
      } else if (event instanceof NavigationEnd) {
        this.record(event.urlAfterRedirects);
        this.url.set(event.urlAfterRedirects);
        const previous = this.history.at(-2);
        this.hasPrevious.set(!!previous && !isSkippedPage(previous));
      }
    });
  }

  /** Go back (see the class description). */
  back(): void {
    const previous = this.history.at(-2);
    if (previous && !isSkippedPage(previous)) {
      this.location.back();
      return;
    }
    const current = this.url();
    const target = this.options().fallbackUrl ?? parentUrl(current, this.routePatterns());
    // Replace, so the page left behind isn't "forward" of where back went.
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }

  /** Go forward again after going back (like a browser's Forward button). */
  forward(): void {
    if (this.forwardPages.length) this.location.forward();
  }

  /** Used by `useBackButton`; returns a function that removes the setting. */
  register(options: BackButtonOptions): () => void {
    const id = ++this.nextId;
    this.overrides.update((list) => [...list, { id, options }]);
    return () => this.overrides.update((list) => list.filter((item) => item.id !== id));
  }

  private record(url: string): void {
    if (this.trigger === 'popstate') {
      // Browser back or forward: back if it matches the page before, forward if it matches the page gone back from.
      if (this.history.at(-2) === url) {
        const left = this.history.pop();
        if (left) this.forwardPages.push(left);
      } else if (this.history.at(-1) !== url) {
        if (this.forwardPages.at(-1) === url) this.forwardPages.pop();
        else this.forwardPages.length = 0;
        this.history.push(url);
      }
      this.forwardCount.set(this.forwardPages.length);
      return;
    }
    if (this.replacing && this.history.length) this.history[this.history.length - 1] = url;
    else if (this.history.at(-1) !== url) {
      this.history.push(url);
      // A new page: nothing to go forward to any more (as in a browser).
      this.forwardPages.length = 0;
    }
    this.forwardCount.set(this.forwardPages.length);
  }

  private routePatterns(): RoutePattern[] {
    return (this.patterns ??= routePatterns(this.router.config));
  }
}

/**
 * For a page that changes the back arrow, in its constructor:
 * `useBackButton({ hidden: true })` (it has its own back control) or
 * `useBackButton({ fallbackUrl: '/courses' })`. Undone when the page closes.
 */
export function useBackButton(options: BackButtonOptions): void {
  const remove = inject(BackNavigationService).register(options);
  inject(DestroyRef).onDestroy(remove);
}
