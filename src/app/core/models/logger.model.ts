export type LogLevel =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  context?: LogContext;
}