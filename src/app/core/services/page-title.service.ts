import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, ResolveEnd, Router } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';
 
/**
 * Default title shown by the global Zebron header.
 */
export const DEFAULT_PAGE_TITLE = 'Zebron';
 
@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
 
  private readonly titleState = signal(DEFAULT_PAGE_TITLE);

  private readonly i18n = inject(I18nService);

  private readonly router = inject(Router);

  private readonly documentTitle = inject(Title);

  constructor() {
    /*
     * Every navigation starts from the destination route's title
     * (data.title, without the "Admin | " / "Zebron | " prefix), before
     * the new page is created. Pages that call setTitle() still override
     * it, and pages that don't no longer keep the previous page's title.
     */
    this.router.events.subscribe((event) => {
      if (!(event instanceof ResolveEnd)) {
        return;
      }

      const routeTitle = this.routeTitle(event.state.root);

      this.titleState.set(routeTitle ? this.headerTitle(routeTitle) : DEFAULT_PAGE_TITLE);

      if (routeTitle) {
        this.documentTitle.setTitle(this.i18n.t(routeTitle));
      }
    });
  }

  /** Title from the deepest route that declares data.title. */
  private routeTitle(snapshot: ActivatedRouteSnapshot): string | null {
    let route: ActivatedRouteSnapshot | null = snapshot;
    let title: string | null = null;

    while (route) {
      const value = route.data?.['title'];
      if (typeof value === 'string' && value.trim()) {
        title = value.trim();
      }
      route = route.firstChild;
    }

    return title;
  }

  /** "Admin | Test Center Topics" -> "Test Center Topics". */
  private headerTitle(routeTitle: string): string {
    return routeTitle.replace(/^(admin|zebron)\s*\|\s*/i, '').trim() || DEFAULT_PAGE_TITLE;
  }

  /**
   * Read-only page title for consumers such as the global header,
   * in the selected language (titles are set in English).
   */
  readonly title = computed(() => this.i18n.t(this.titleState()));
 
  /**
   * Set the title displayed in the global header.
   * A blank title falls back to the default.
   */
  setTitle(title: string): void {
    this.titleState.set(title.trim() || DEFAULT_PAGE_TITLE);
  }
 
  /**
   * Reset the global header title to the default.
   */
  reset(): void {
    this.titleState.set(DEFAULT_PAGE_TITLE);
  }
}
 