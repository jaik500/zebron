import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
} from 'firebase/firestore';

import { SystemHealthCheck, SystemHealthSummary } from '../models/system-health.model';
import { LoggerService } from './logger.service';
import { AuditService } from './audit.service';

@Injectable({
  providedIn: 'root',
})
export class SystemHealthService {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly logger =
    inject(LoggerService);

  private readonly auditService =
    inject(AuditService);


  // =========================================================
  // STATE
  // =========================================================

  private readonly checksState =
    signal<SystemHealthCheck[]>([]);

  private readonly checkingState =
    signal(false);

  private readonly lastCheckedState =
    signal<Timestamp | undefined>(undefined);


  // =========================================================
  // PUBLIC STATE
  // =========================================================

  readonly checks =
    this.checksState.asReadonly();

  readonly checking =
    this.checkingState.asReadonly();

  readonly lastChecked =
    this.lastCheckedState.asReadonly();


  // =========================================================
  // OVERALL STATUS
  // =========================================================

  readonly overallStatus =
    computed((): SystemHealthSummary['status'] => {

      const checks =
        this.checksState();

      if (!checks.length) {
        return 'unknown';
      }

      if (
        checks.some(
          check => check.status === 'unhealthy',
        )
      ) {
        return 'unhealthy';
      }

      if (
        checks.some(
          check => check.status === 'degraded',
        )
      ) {
        return 'degraded';
      }

      if (
        checks.some(
          check => check.status === 'unknown',
        )
      ) {
        return 'unknown';
      }

      return 'healthy';
    });


  readonly overallMessage =
    computed(() => {

      switch (this.overallStatus()) {

        case 'healthy':
          return 'All monitored systems are operating normally.';

        case 'degraded':
          return 'One or more systems require attention.';

        case 'unhealthy':
          return 'One or more critical systems are unavailable.';

        default:
          return 'System health has not been evaluated yet.';
      }
    });


  // =========================================================
  // RUN HEALTH CHECK
  // =========================================================

  async runHealthCheck(): Promise<SystemHealthSummary> {

    if (this.checking()) {
      return {
        status: this.overallStatus(),
        message: this.overallMessage(),
        checks: this.checks(),
        checkedAt: this.lastChecked(),
      };
    }

    const operationId =
      this.logger.createOperationId();

    const startedAt =
      performance.now();

    this.checkingState.set(true);

    this.logger.info(
      'SystemHealthService',
      'System health check started.',
      {
        operationId,
      },
    );

    try {

      const checks =
        await Promise.all([
          this.checkFirestore(),
          this.checkFeatureConfigurations(),
          this.checkSystemSettings(),
          this.checkAuditLogs(),
        ]);

      this.checksState.set(checks);

      const checkedAt =
        Timestamp.now();

      this.lastCheckedState.set(
        checkedAt,
      );

      const status =
        this.calculateStatus(checks);

      const duration =
        Math.round(
          performance.now() - startedAt,
        );

      this.logger.info(
        'SystemHealthService',
        'System health check completed.',
        {
          operationId,
          status,
          checkCount: checks.length,
          durationMs: duration,
        },
      );

      await this.writeHealthRecord(
        operationId,
        status,
        checks,
        checkedAt,
      );

      return {
        status,
        message: this.getStatusMessage(status),
        checks,
        checkedAt,
      };

    } catch (error) {

      this.logger.error(
        'SystemHealthService',
        'System health check failed.',
        {
          operationId,
          error: this.getErrorMessage(error),
        },
      );

      const failedCheck: SystemHealthCheck = {
        id: 'system-health',
        key: 'system-health',
        name: 'System Health',
        description:
          'Overall system health evaluation.',
        status: 'unhealthy',
        message:
          this.getErrorMessage(error),
        checkedAt: Timestamp.now(),
      };

      this.checksState.set([
        failedCheck,
      ]);

      this.lastCheckedState.set(
        Timestamp.now(),
      );

      return {
        status: 'unhealthy',
        message:
          'The system health check could not be completed.',
        checks: [
          failedCheck,
        ],
        checkedAt:
          this.lastChecked(),
      };

    } finally {

      this.checkingState.set(false);
    }
  }


  // =========================================================
  // FIRESTORE
  // =========================================================

  private async checkFirestore():
    Promise<SystemHealthCheck> {

    const startedAt =
      performance.now();

    try {

      const db =
        getFirestore();

      const healthRef =
        doc(
          db,
          'systemHealth',
          'connectivity',
        );

      await getDoc(
        healthRef,
      );

      return {
        id: 'firestore',
        key: 'firestore',
        name: 'Firestore',
        description:
          'Firebase Firestore connectivity.',
        status: 'healthy',
        message:
          'Firestore is reachable.',
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };

    } catch (error) {

      return {
        id: 'firestore',
        key: 'firestore',
        name: 'Firestore',
        description:
          'Firebase Firestore connectivity.',
        status: 'unhealthy',
        message:
          this.getErrorMessage(error),
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };
    }
  }


  // =========================================================
  // FEATURE CONFIGURATION
  // =========================================================

  private async checkFeatureConfigurations():
    Promise<SystemHealthCheck> {

    const startedAt =
      performance.now();

    try {

      const db =
        getFirestore();

      const ref =
        collection(
          db,
          'featureConfigurations',
        );

      const result =
        await getDocs(
          query(
            ref,
            limit(1),
          ),
        );

      return {
        id: 'feature-configurations',
        key: 'feature-configurations',
        name: 'Feature Configuration',
        description:
          'Application availability configuration.',
        status: 'healthy',
        message:
          result.empty
            ? 'No persisted feature configurations found; defaults may be in use.'
            : 'Feature configuration is accessible.',
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };

    } catch (error) {

      return {
        id: 'feature-configurations',
        key: 'feature-configurations',
        name: 'Feature Configuration',
        description:
          'Application availability configuration.',
        status: 'unhealthy',
        message:
          this.getErrorMessage(error),
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };
    }
  }


  // =========================================================
  // SYSTEM SETTINGS
  // =========================================================

  private async checkSystemSettings():
    Promise<SystemHealthCheck> {

    const startedAt =
      performance.now();

    try {

      const db =
        getFirestore();

      const ref =
        collection(
          db,
          'systemSettings',
        );

      const result =
        await getDocs(
          query(
            ref,
            limit(1),
          ),
        );

      return {
        id: 'system-settings',
        key: 'system-settings',
        name: 'System Settings',
        description:
          'Centralized system configuration.',
        status: 'healthy',
        message:
          result.empty
            ? 'No persisted settings found; defaults may be in use.'
            : 'System settings are accessible.',
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };

    } catch (error) {

      return {
        id: 'system-settings',
        key: 'system-settings',
        name: 'System Settings',
        description:
          'Centralized system configuration.',
        status: 'unhealthy',
        message:
          this.getErrorMessage(error),
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };
    }
  }


  // =========================================================
  // AUDIT LOGGING
  // =========================================================

  private async checkAuditLogs():
    Promise<SystemHealthCheck> {

    const startedAt =
      performance.now();

    try {

      const db =
        getFirestore();

      const ref =
        collection(
          db,
          'auditLogs',
        );

      await getDocs(
        query(
          ref,
          limit(1),
        ),
      );

      return {
        id: 'audit-logging',
        key: 'audit-logging',
        name: 'Audit Logging',
        description:
          'Administrative audit trail availability.',
        status: 'healthy',
        message:
          'Audit log collection is accessible.',
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };

    } catch (error) {

      return {
        id: 'audit-logging',
        key: 'audit-logging',
        name: 'Audit Logging',
        description:
          'Administrative audit trail availability.',
        status: 'unhealthy',
        message:
          this.getErrorMessage(error),
        responseTimeMs:
          Math.round(
            performance.now() - startedAt,
          ),
        checkedAt:
          Timestamp.now(),
      };
    }
  }


  // =========================================================
  // PERSIST HEALTH RESULT
  // =========================================================

  private async writeHealthRecord(
    operationId: string,
    status: SystemHealthCheck['status'],
    checks: SystemHealthCheck[],
    checkedAt: Timestamp,
  ): Promise<void> {

    try {

      await this.auditService.log({
        action:
          'system.health.check',
        entityType:
          'systemHealth',
        entityId:
          operationId,
        outcome:
          status === 'healthy'
            ? 'success'
            : 'failure',
        reason:
          'System health check completed.',
        metadata: {
          status,
          checkCount:
            checks.length,
        },
      });

    } catch (error) {

      this.logger.warn(
        'SystemHealthService',
        'Unable to write health audit record.',
        {
          operationId,
          error:
            this.getErrorMessage(error),
        },
      );
    }
  }


  // =========================================================
  // STATUS
  // =========================================================

  private calculateStatus(
    checks: SystemHealthCheck[],
  ): SystemHealthCheck['status'] {

    if (
      checks.some(
        check =>
          check.status === 'unhealthy',
      )
    ) {
      return 'unhealthy';
    }

    if (
      checks.some(
        check =>
          check.status === 'degraded',
      )
    ) {
      return 'degraded';
    }

    if (
      checks.some(
        check =>
          check.status === 'unknown',
      )
    ) {
      return 'unknown';
    }

    return 'healthy';
  }


  private getStatusMessage(
    status: SystemHealthCheck['status'],
  ): string {

    switch (status) {

      case 'healthy':
        return 'All monitored systems are operating normally.';

      case 'degraded':
        return 'One or more systems require attention.';

      case 'unhealthy':
        return 'One or more critical systems are unavailable.';

      default:
        return 'System health could not be determined.';
    }
  }


  // =========================================================
  // ERROR HANDLING
  // =========================================================

  private getErrorMessage(
    error: unknown,
  ): string {

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}