import { Timestamp } from 'firebase/firestore';

export type HealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'unknown';

export interface SystemHealthCheck {
  id: string;
  key: string;
  name: string;
  description: string;
  status: HealthStatus;
  message: string;
  responseTimeMs?: number;
  checkedAt?: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface SystemHealthSummary {
  status: HealthStatus;
  message: string;
  checks: SystemHealthCheck[];
  checkedAt?: Timestamp;
}