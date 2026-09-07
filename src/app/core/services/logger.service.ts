import {
  Injectable,
  isDevMode,
  signal,
} from '@angular/core';

import {
  LogContext,
  LogEntry,
  LogLevel,
} from '../models/logger.model';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {

  private readonly minimumLevel =
    signal<LogLevel>(
      isDevMode()
        ? 'debug'
        : 'info',
    );

  readonly level =
    this.minimumLevel.asReadonly();

  // ============================================================
  // CONFIGURATION
  // ============================================================

  setMinimumLevel(
    level: LogLevel,
  ): void {
    this.minimumLevel.set(level);

    this.info(
      'LoggerService',
      'Minimum log level changed.',
      {
        level,
      },
    );
  }

  // ============================================================
  // LOGGING
  // ============================================================

  debug(
    scope: string,
    message: string,
    context?: LogContext,
  ): void {
    this.write(
      'debug',
      scope,
      message,
      context,
    );
  }

  info(
    scope: string,
    message: string,
    context?: LogContext,
  ): void {
    this.write(
      'info',
      scope,
      message,
      context,
    );
  }

  warn(
    scope: string,
    message: string,
    context?: LogContext,
  ): void {
    this.write(
      'warn',
      scope,
      message,
      context,
    );
  }

  error(
    scope: string,
    message: string,
    error?: unknown,
    context?: LogContext,
  ): void {
    this.write(
      'error',
      scope,
      message,
      {
        ...(context ?? {}),
        error:
          this.normalizeError(
            error,
          ),
      },
    );
  }

  // ============================================================
  // OPERATION ID
  // ============================================================

  createOperationId(): string {
    try {
      if (
        typeof globalThis.crypto !==
          'undefined' &&
        typeof globalThis.crypto
          .randomUUID ===
          'function'
      ) {
        return globalThis.crypto.randomUUID();
      }
    } catch {
      // Use fallback below.
    }

    return [
      Date.now().toString(36),
      Math.random()
        .toString(36)
        .substring(2, 10),
    ].join('-');
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private write(
    level: LogLevel,
    scope: string,
    message: string,
    context?: LogContext,
  ): void {
    if (
      !this.shouldLog(level)
    ) {
      return;
    }

    const entry: LogEntry = {
      timestamp:
        new Date().toISOString(),

      level,

      scope:
        scope.trim() ||
        'Application',

      message:
        message.trim(),

      context:
        context
          ? this.sanitize(
              context,
            ) as LogContext
          : undefined,
    };

    switch (level) {
      case 'debug':
        console.debug(
          '[Zebron]',
          entry,
        );
        break;

      case 'info':
        console.info(
          '[Zebron]',
          entry,
        );
        break;

      case 'warn':
        console.warn(
          '[Zebron]',
          entry,
        );
        break;

      case 'error':
        console.error(
          '[Zebron]',
          entry,
        );
        break;
    }
  }

  private shouldLog(
    level: LogLevel,
  ): boolean {
    const weights: Record<
      LogLevel,
      number
    > = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return (
      weights[level] >=
      weights[
        this.minimumLevel()
      ]
    );
  }

  // ============================================================
  // ERROR NORMALIZATION
  // ============================================================

  private normalizeError(
    error: unknown,
  ): unknown {
    if (!error) {
      return undefined;
    }

    if (
      error instanceof Error
    ) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return this.sanitize(error);
  }

  // ============================================================
  // SECURITY
  // ============================================================

  private sanitize(
    value: unknown,
    depth = 0,
  ): unknown {

    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    if (depth > 5) {
      return '[max-depth]';
    }

    if (
      typeof value ===
      'string'
    ) {
      return value.length > 2000
        ? `${value.substring(
            0,
            2000,
          )}...[truncated]`
        : value;
    }

    if (
      typeof value ===
        'number' ||
      typeof value ===
        'boolean'
    ) {
      return value;
    }

    if (
      value instanceof Date
    ) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(
        (item) =>
          this.sanitize(
            item,
            depth + 1,
          ),
      );
    }

    if (
      typeof value ===
      'object'
    ) {
      const result: Record<
        string,
        unknown
      > = {};

      for (
        const [
          key,
          item,
        ] of Object.entries(
          value as Record<
            string,
            unknown
          >,
        )
      ) {
        if (
          this.isSensitiveKey(
            key,
          )
        ) {
          result[key] =
            '[REDACTED]';

          continue;
        }

        result[key] =
          this.sanitize(
            item,
            depth + 1,
          );
      }

      return result;
    }

    return String(value);
  }

  private isSensitiveKey(
    key: string,
  ): boolean {
    const normalized =
      key
        .toLowerCase()
        .replace(
          /[_-]/g,
          '',
        );

    return [
      'password',
      'passwd',
      'token',
      'accesstoken',
      'refreshtoken',
      'idtoken',
      'secret',
      'apikey',
      'authorization',
      'cookie',
      'credential',
      'privatekey',
    ].some(
      (sensitive) =>
        normalized.includes(
          sensitive,
        ),
    );
  }
}