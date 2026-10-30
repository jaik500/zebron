import { Injectable, computed, inject, signal } from '@angular/core';

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
 