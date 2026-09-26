
import { Injectable, inject } from '@angular/core';

import {
  CreateOperationalEventInput,
  OperationalEvent,
  OperationalEventQuery,
  OperationalEventSeverity,
  OperationalEventSource,
  OperationalEventType,
  OperationalEventStatus,
  UpdateOperationalEventInput,
} from '../models/operational-event.model';

import { OperationalEventRepository } from '../repositories/operational-event.repository';

import { LoggerService } from './logger.service';

/**
 * Central application service for operational monitoring.
 *
 * Application features should report operational events through
 * this service rather than directly writing to Firestore.
 *
 * This keeps operational monitoring centralized and allows the
 * infrastructure implementation to change later.
 */
@Injectable({
  providedIn: 'root',
})
export class OperationalMonitoringService {
  private readonly repository = inject(
    OperationalEventRepository,
  );

  private readonly logger = inject(
    LoggerService,
  );

  /**
   * Record a new operational event.
   */
  async record(
    input: CreateOperationalEventInput,
  ): Promise<OperationalEvent> {
    try {
      return await this.repository.create(input);
    } catch (error) {
      /**
       * Monitoring must never become the reason that the
       * primary application operation fails.
       */
      this.logger.error(
        'OperationalMonitoringService',
        'Failed to record operational event.',
        error,
      );

      throw error;
    }
  }

  /**
   * Record a standard application error.
   */
  async recordError(
    title: string,
    error: unknown,
    options: {
      feature?: string;
      service?: string;
      operation?: string;
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<OperationalEvent> {
    const normalizedError = this.normalizeError(error);

    return this.record({
      type: 'error',
      severity: 'error',
      source: 'application',
      title,
      description: normalizedError.message,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
      feature: options.feature,
      service: options.service,
      operation: options.operation,
      userId: options.userId,
      correlationId: options.correlationId,
      metadata: options.metadata,
    });
  }

  /**
   * Record a failed operation.
   */
  async recordFailedOperation(
    title: string,
    error: unknown,
    options: {
      feature?: string;
      service?: string;
      operation?: string;
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<OperationalEvent> {
    const normalizedError = this.normalizeError(error);

    return this.record({
      type: 'failed-operation',
      severity: 'error',
      source: 'application',
      title,
      description: normalizedError.message,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
      feature: options.feature,
      service: options.service,
      operation: options.operation,
      userId: options.userId,
      correlationId: options.correlationId,
      metadata: options.metadata,
    });
  }

  /**
   * Record an infrastructure event.
   */
  async recordInfrastructureEvent(
    title: string,
    description: string,
    options: {
      severity?: OperationalEventSeverity;
      source?: OperationalEventSource;
      service?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<OperationalEvent> {
    return this.record({
      type: 'infrastructure',
      severity: options.severity ?? 'warning',
      source: options.source ?? 'system',
      title,
      description,
      service: options.service,
      metadata: options.metadata,
    });
  }

  /**
   * Record a background-job failure.
   */
  async recordBackgroundJobFailure(
    title: string,
    error: unknown,
    options: {
      service?: string;
      operation?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<OperationalEvent> {
    const normalizedError = this.normalizeError(error);

    return this.record({
      type: 'background-job',
      severity: 'error',
      source: 'scheduler',
      title,
      description: normalizedError.message,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
      service: options.service,
      operation: options.operation,
      metadata: options.metadata,
    });
  }

  /**
   * Record a user-reported problem.
   */
  async recordUserReport(
    title: string,
    description: string,
    options: {
      userId?: string;
      feature?: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<OperationalEvent> {
    return this.record({
      type: 'user-report',
      severity: 'warning',
      source: 'user',
      title,
      description,
      userId: options.userId,
      feature: options.feature,
      correlationId: options.correlationId,
      metadata: options.metadata,
    });
  }

  /**
   * Retrieve an operational event.
   */
  async getById(
    id: string,
  ): Promise<OperationalEvent | null> {
    return this.repository.getById(id);
  }

  /**
   * Query operational events.
   */
  async query(
    query: OperationalEventQuery = {},
  ): Promise<OperationalEvent[]> {
    return this.repository.query(query);
  }

  /**
   * Update an operational event.
   */
  async update(
    id: string,
    input: UpdateOperationalEventInput,
  ): Promise<OperationalEvent> {
    return this.repository.update(id, input);
  }

  /**
   * Acknowledge an event.
   */
  async acknowledge(
    id: string,
    userId: string,
  ): Promise<OperationalEvent> {
    return this.repository.update(id, {
      status: 'acknowledged',
      acknowledgedBy: userId,
    });
  }

  /**
   * Mark an event as investigating.
   */
  async investigate(
    id: string,
  ): Promise<OperationalEvent> {
    return this.repository.update(id, {
      status: 'investigating',
    });
  }

  /**
   * Resolve an event.
   */
  async resolve(
    id: string,
    userId: string,
  ): Promise<OperationalEvent> {
    return this.repository.update(id, {
      status: 'resolved',
      resolvedBy: userId,
    });
  }

  /**
   * Close an event.
   */
  async close(
    id: string,
  ): Promise<OperationalEvent> {
    return this.repository.update(id, {
      status: 'closed',
    });
  }

  /**
   * Normalize unknown JavaScript errors into a safe
   * provider-agnostic representation.
   */
  private normalizeError(
    error: unknown,
  ): {
    code?: string;
    message: string;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    if (
      typeof error === 'object' &&
      error !== null
    ) {
      const candidate = error as {
        code?: unknown;
        message?: unknown;
      };

      return {
        code:
          typeof candidate.code === 'string'
            ? candidate.code
            : undefined,

        message:
          typeof candidate.message === 'string'
            ? candidate.message
            : 'An unknown error occurred.',
      };
    }

    return {
      message:
        typeof error === 'string'
          ? error
          : 'An unknown error occurred.',
    };
  }
}
