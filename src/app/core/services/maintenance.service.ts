import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {

  // ============================================================
  // SERVICES
  // ============================================================

  private readonly authService =
    inject(AuthService);

  private readonly settingsService =
    inject(SettingsService);

  private readonly auditService =
    inject(AuditService);

  private readonly logger =
    inject(LoggerService);


  // ============================================================
  // STATE
  // ============================================================

  private readonly enabledState =
    signal(false);

  private readonly messageState =
    signal(
      'Zebron is temporarily unavailable while scheduled maintenance is being performed.',
    );

  private readonly savingState =
    signal(false);


  // ============================================================
  // PUBLIC STATE
  // ============================================================

  readonly enabled =
    this.enabledState.asReadonly();

  readonly message =
    this.messageState.asReadonly();

  readonly saving =
    this.savingState.asReadonly();


  readonly statusLabel =
    computed(() =>
      this.enabled()
        ? 'Maintenance Active'
        : 'Operational',
    );


  // ============================================================
  // INITIALIZE
  // ============================================================

  constructor() {
    this.loadState();
  }


 // ============================================================
// LOAD
// ============================================================

loadState(): void {

  const enabled =
    this.settingsService.get(
      'system.maintenance.enabled',
      false,
    );

  const message =
    this.settingsService.get(
      'system.maintenance.message',
      'Zebron is temporarily unavailable while scheduled maintenance is being performed.',
    );


  // SettingsService returns a SystemSettingValue union,
  // so explicitly verify the expected type before using it.

  this.enabledState.set(
    typeof enabled === 'boolean'
      ? enabled
      : false,
  );


  if (
    typeof message === 'string' &&
    message.trim()
  ) {

    this.messageState.set(
      message.trim(),
    );
  }
}

  // ============================================================
  // ENABLE
  // ============================================================

  async enable(
    message: string,
  ): Promise<void> {

    this.ensureAdmin();

    if (this.saving()) {
      return;
    }

    const normalizedMessage =
      message.trim();

    if (!normalizedMessage) {
      throw new Error(
        'A maintenance message is required.',
      );
    }

    const operationId =
      this.logger.createOperationId();

    this.savingState.set(true);

    const previousState = {
      enabled:
        this.enabled(),
      message:
        this.message(),
    };

    this.logger.warn(
      'MaintenanceService',
      'Maintenance mode activation requested.',
      {
        operationId,
      },
    );

    try {

      await this.settingsService.set(
        'system.maintenance.message',
        normalizedMessage,
      );

      await this.settingsService.set(
        'system.maintenance.enabled',
        true,
      );

      this.enabledState.set(true);
      this.messageState.set(
        normalizedMessage,
      );

      await this.auditService.log({
        action:
          'maintenance.enabled',

        entityType:
          'systemMaintenance',

        entityId:
          'system',

        outcome:
          'success',

        reason:
          normalizedMessage,

        metadata: {
          operationId,
        },

        before:
          previousState,

        after: {
          enabled: true,
          message:
            normalizedMessage,
        },
      });

      this.logger.warn(
        'MaintenanceService',
        'Maintenance mode activated.',
        {
          operationId,
        },
      );

    } catch (error) {

      this.logger.error(
        'MaintenanceService',
        'Failed to activate maintenance mode.',
        error,
        {
          operationId,
        },
      );

      await this.auditService.log({
        action:
          'maintenance.enabled',

        entityType:
          'systemMaintenance',

        entityId:
          'system',

        outcome:
          'failure',

        reason:
          this.getErrorMessage(error),

        metadata: {
          operationId,
        },
      });

      throw error;

    } finally {

      this.savingState.set(false);
    }
  }


  // ============================================================
  // DISABLE
  // ============================================================

  async disable(): Promise<void> {

    this.ensureAdmin();

    if (this.saving()) {
      return;
    }

    const operationId =
      this.logger.createOperationId();

    this.savingState.set(true);

    const previousState = {
      enabled:
        this.enabled(),
      message:
        this.message(),
    };

    this.logger.info(
      'MaintenanceService',
      'Maintenance mode deactivation requested.',
      {
        operationId,
      },
    );

    try {

      await this.settingsService.set(
        'system.maintenance.enabled',
        false,
      );

      this.enabledState.set(false);

      await this.auditService.log({
        action:
          'maintenance.disabled',

        entityType:
          'systemMaintenance',

        entityId:
          'system',

        outcome:
          'success',

        reason:
          'Maintenance mode disabled.',

        metadata: {
          operationId,
        },

        before:
          previousState,

        after: {
          enabled: false,
          message:
            this.message(),
        },
      });

      this.logger.info(
        'MaintenanceService',
        'Maintenance mode disabled.',
        {
          operationId,
        },
      );

    } catch (error) {

      this.logger.error(
        'MaintenanceService',
        'Failed to disable maintenance mode.',
        error,
        {
          operationId,
        },
      );

      await this.auditService.log({
        action:
          'maintenance.disabled',

        entityType:
          'systemMaintenance',

        entityId:
          'system',

        outcome:
          'failure',

        reason:
          this.getErrorMessage(error),

        metadata: {
          operationId,
        },
      });

      throw error;

    } finally {

      this.savingState.set(false);
    }
  }


  // ============================================================
  // ADMIN
  // ============================================================

  private ensureAdmin(): void {

    if (!this.authService.isAdmin) {
      throw new Error(
        'Administrator privileges are required.',
      );
    }
  }


  getMessage(): string {
  return this.message();
}


  // ============================================================
  // ERROR
  // ============================================================

  private getErrorMessage(
    error: unknown,
  ): string {

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}