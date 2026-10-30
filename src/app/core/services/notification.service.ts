import { Injectable, inject } from '@angular/core';

import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../i18n/i18n.service';

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

  /** Messages are written in English and shown in the selected language. */
  private readonly i18n = inject(I18nService);

  /**
   * Display a success notification.
   */
  success(message: string): void {
    this.toast.success(this.i18n.t(message));
  }

  /**
   * Display an informational notification.
   */
  info(message: string): void {
    this.toast.info(this.i18n.t(message));
  }

  /**
   * Display a warning notification.
   */
  warning(message: string): void {
    this.toast.warning(this.i18n.t(message));
  }

  /**
   * Display an error notification.
   */
  error(message: string): void {
    this.toast.error(this.i18n.t(message));
  }
}