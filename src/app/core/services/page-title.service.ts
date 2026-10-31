import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, ResolveEnd, Router } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';
import { PartnerOrganizationContextService } from './partner-organization-context.service';
 
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

  private readonly organizationContext = inject(PartnerOrganizationContextService);

  /**
   * Organization pages (data.organizationHeader) show the organization's
   * name in the global header; the page itself names the app or task.
   */
  private readonly organizationHeaderId = signal<string | null>(null);

  private readonly organizationHeaderName = computed(() => {
    const id = this.organizationHeaderId();
    if (!id) {
      return null;
    }
    const selected = this.organizationContext.organization();
    const organization =
      this.organizationContext.organizations().find((item) => item.id === id) ??
      (selected?.id === id ? selected : null);
    return organization?.name ?? null;
  });

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
      const header = this.routeData<string>(event.state.root, 'header');

      this.titleState.set(header ?? (routeTitle ? this.headerTitle(routeTitle) : DEFAULT_PAGE_TITLE));
      this.organizationHeaderId.set(
        this.routeData<boolean>(event.state.root, 'organizationHeader')
          ? this.routeParam(event.state.root, 'organizationId')
          : null,
      );

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

  /** Deepest route value of data[key] (string values must be non-blank). */
  private routeData<T>(snapshot: ActivatedRouteSnapshot, key: string): T | null {
    let route: ActivatedRouteSnapshot | null = snapshot;
    let value: T | null = null;

    while (route) {
      const candidate = route.data?.[key];
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        value = candidate as T;
      }
      route = route.firstChild;
    }

    return value;
  }

  private routeParam(snapshot: ActivatedRouteSnapshot, name: string): string | null {
    let route: ActivatedRouteSnapshot | null = snapshot;
    let value: string | null = null;

    while (route) {
      value = route.paramMap.get(name) ?? value;
      route = route.firstChild;
    }

    return value;
  }

  /** "Admin | Test Center Topics" -> "Test Center Topics". */
  private headerTitle(routeTitle: string): string {
    return routeTitle.replace(/^(admin|zebron)\s*\|\s*/i, '').trim() || DEFAULT_PAGE_TITLE;
  }

  /**
   * Read-only page title for consumers such as the global header,
   * in the selected language (titles are set in English).
   */
  readonly title = computed(() =>
    this.organizationHeaderId()
      ? (this.organizationHeaderName() ?? this.i18n.t('Partner Portal'))
      : this.i18n.t(this.titleState()),
  );
 
  /**
   * Set the title displayed in the global header.
   * A blank title falls back to the default.
   */
  setTitle(title: string): void {
    this.organizationHeaderId.set(null);
    this.titleState.set(title.trim() || DEFAULT_PAGE_TITLE);
  }

  /**
   * Set only the browser tab title (for example an article's title),
   * leaving the global header on the app's name.
   */
  setDocumentTitle(title: string): void {
    if (title.trim()) {
      this.documentTitle.setTitle(`${title.trim()} | Zebron`);
    }
  }
 
  /**
   * Reset the global header title to the default.
   */
  reset(): void {
    this.organizationHeaderId.set(null);
    this.titleState.set(DEFAULT_PAGE_TITLE);
  }
}
 