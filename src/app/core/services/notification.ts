import { Injectable, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

/**
 * Centralizes application notifications.
 *
 * Use this service for consistent success and error messages
 * when records are created, updated, or deleted.
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
   * Display an error notification.
   */
  error(message: string): void {
    this.toast.error(message);
  }

  /**
   * Record was created successfully.
   */
  created(recordName: string): void {
    this.success(`${recordName} created successfully.`);
  }

  /**
   * Record was updated successfully.
   */
  updated(recordName: string): void {
    this.success(`${recordName} updated successfully.`);
  }

  /**
   * Record was deleted successfully.
   */
  deleted(recordName: string): void {
    this.success(`${recordName} deleted successfully.`);
  }

  /**
   * Record could not be saved.
   */
  saveError(recordName: string, error?: unknown): void {
    const message =
      error instanceof Error
        ? error.message
        : 'Please try again.';

    this.error(`Unable to save ${recordName.toLowerCase()}: ${message}`);
  }

  /**
   * Record could not be deleted.
   */
  deleteError(recordName: string, error?: unknown): void {
    const message =
      error instanceof Error
        ? error.message
        : 'Please try again.';

    this.error(
      `Unable to delete ${recordName.toLowerCase()}: ${message}`,
    );
  }
}