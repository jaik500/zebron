import { Injectable, signal } from '@angular/core';
 
/**
 * Default title shown by the global Zebron header.
 */
export const DEFAULT_PAGE_TITLE = 'Zebron';
 
@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
 
  private readonly titleState = signal(DEFAULT_PAGE_TITLE);
 
  /**
   * Read-only page title for consumers such as the global header.
   */
  readonly title = this.titleState.asReadonly();
 
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
 