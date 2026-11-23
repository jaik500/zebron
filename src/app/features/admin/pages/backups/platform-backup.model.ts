import { Timestamp } from 'firebase/firestore';

/**
 * A platform backup as stored in platformBackups/{id} by
 * functions/src/platform-backups.ts. Shared by Admin → Backups and the
 * Backups tile on Configuration → Overview.
 */
export type BackupStatus = 'queued' | 'running' | 'complete' | 'partial' | 'failed';
export type ExportState = 'not-started' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

export interface PlatformBackup {
  id: string;
  status: BackupStatus;
  trigger: 'manual' | 'scheduled';
  requestedBy: { uid: string; email: string | null } | null;
  keep: boolean;
  createdAt: Date | null;
  durationSeconds: number | null;
  records: { total: number; complete: boolean; collections: Record<string, number> } | null;
  users: number | null;
  files: { count: number; bytes: number } | null;
  totalBytes: number | null;
  problems: string[];
  firestoreExport: { state: ExportState; documents?: number; error?: string; outputUri?: string };
}

/** Stuck after this long without finishing (the worker times out at 9 minutes). */
export const STUCK_AFTER_MS = 30 * 60 * 1000;

/** A backup older than this means the weekly schedule has missed a run. */
export const OVERDUE_AFTER_MS = 8 * 24 * 60 * 60 * 1000;

export function isStuckBackup(backup: PlatformBackup): boolean {
  return (backup.status === 'queued' || backup.status === 'running')
    && !!backup.createdAt && Date.now() - backup.createdAt.getTime() > STUCK_AFTER_MS;
}

export function toBackup(id: string, data: Record<string, unknown>): PlatformBackup {
  const created = data['createdAt'];
  return {
    id,
    status: (data['status'] as BackupStatus) ?? 'queued',
    trigger: data['trigger'] === 'scheduled' ? 'scheduled' : 'manual',
    requestedBy: (data['requestedBy'] as PlatformBackup['requestedBy']) ?? null,
    keep: data['bookmark_border'] === true,
    createdAt: created instanceof Timestamp ? created.toDate() : null,
    durationSeconds: typeof data['durationSeconds'] === 'number' ? data['durationSeconds'] : null,
    records: (data['records'] as PlatformBackup['records']) ?? null,
    users: typeof data['users'] === 'number' ? data['users'] : null,
    files: (data['files'] as PlatformBackup['files']) ?? null,
    totalBytes: typeof data['totalBytes'] === 'number' ? data['totalBytes'] : null,
    problems: Array.isArray(data['problems']) ? (data['problems'] as string[]) : [],
    firestoreExport: (data['firestoreExport'] as PlatformBackup['firestoreExport']) ?? { state: 'not-started' },
  };
}
