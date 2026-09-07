import { Injectable, inject } from '@angular/core';

import { HotToastService } from '@ngxpert/hot-toast';

/**
 * Centralized application notification service.
 *
 * Components should use this service instead of injecting
 * HotToastService directly.
 *
 * This keeps notification behavior consistent across Zebron
 * and gives us one place to change the notification provider
 * later if needed.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  private readonly toast = inject(HotToastService);

  /**
   * Display a success notification.
   */
  success(message: string): void {
    this.toast.success(message);
  }

  /**
   * Display an informational notification.
   */
  info(message: string): void {
    this.toast.info(message);
  }

  /**
   * Display a warning notification.
   */
  warning(message: string): void {
    this.toast.warning(message);
  }

  /**
   * Display an error notification.
   */
  error(message: string): void {
    this.toast.error(message);
  }
}