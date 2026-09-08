import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {

  /**
   * Default title shown by the global Zebron header.
   */
  private readonly titleState = signal('Zebron');

  /**
   * Read-only page title for consumers such as the global header.
   */
  readonly title = this.titleState.asReadonly();

  /**
   * Set the title displayed in the global header.
   */
  setTitle(title: string): void {
    const normalizedTitle = title.trim();

    this.titleState.set(
      normalizedTitle || 'Zebron',
    );
  }

  /**
   * Reset the global header title.
   */
  reset(): void {
    this.titleState.set('Zebron');
  }
}