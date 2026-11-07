import { Timestamp } from 'firebase/firestore';

export type JobStatus = 'draft' | 'active' | 'closed';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';

export type WorkArrangement = 'on-site' | 'hybrid' | 'remote';

export interface JobCompensation {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'hour' | 'year';
}

export interface Job {
  id?: string;

  title: string;
  companyId?: string;
  organizationId: string;
  organizationName: string;

  description: string;

  employmentType: EmploymentType;
  workArrangement: WorkArrangement;

  categoryId?: string;
  categoryName?: string;

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  compensation?: JobCompensation;

  skills: string[];
  tags: string[];

  applicationUrl: string;

  applicationDeadline?: Timestamp | null;

  /** Site the listing was copied from, for example "Indeed" or "USAJOBS". */
  sourceName?: string;

  /** When the employer posted it on the source site. */
  postedAt?: Timestamp | null;

  /**
   * When the listing closes on its own (see jobExpiresAt): 5 days after
   * the application deadline, or 60 days after it was posted when there
   * is no deadline. expireJobListings (functions/src/job-board.ts) closes
   * it on the day; the board also hides it as soon as this passes.
   */
  expiresAt?: Timestamp | null;

  /** Why a closed listing was closed. */
  closedReason?: 'expired' | 'manual' | null;

  status: JobStatus;

  featured: boolean;

  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Expiry (keep in step with functions/src/job-board.ts)
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days a listing stays up after its application deadline. */
export const JOB_DAYS_AFTER_DEADLINE = 5;

/** Days a listing with no deadline stays up after it was posted. */
export const JOB_DAYS_WITHOUT_DEADLINE = 60;

/** Milliseconds of a Firestore timestamp, a Date, or null. */
function millis(value: unknown): number | null {
  if (value && typeof (value as Timestamp).toMillis === 'function') {
    return (value as Timestamp).toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return null;
}

/**
 * When a listing closes on its own, in milliseconds: 5 days after the
 * application deadline, else 60 days after it was posted (or created).
 * Null when none of those dates is known yet.
 */
export function jobExpiresAtMillis(job: Pick<Job, 'applicationDeadline' | 'postedAt' | 'createdAt'>): number | null {
  const deadline = millis(job.applicationDeadline);
  if (deadline !== null) {
    return deadline + JOB_DAYS_AFTER_DEADLINE * DAY_MS;
  }
  const posted = millis(job.postedAt) ?? millis(job.createdAt);
  return posted === null ? null : posted + JOB_DAYS_WITHOUT_DEADLINE * DAY_MS;
}

/** The expiry as a timestamp, for saving on the listing. */
export function jobExpiresAt(job: Pick<Job, 'applicationDeadline' | 'postedAt' | 'createdAt'>, now = Date.now()): Timestamp {
  return Timestamp.fromMillis(jobExpiresAtMillis(job) ?? now + JOB_DAYS_WITHOUT_DEADLINE * DAY_MS);
}

/** True when an active listing has passed its expiry and should not be shown. */
export function isJobExpired(job: Job, now = Date.now()): boolean {
  const expires = millis(job.expiresAt) ?? jobExpiresAtMillis(job);
  return expires !== null && now >= expires;
}

/** True when the listing is open to applicants right now. */
export function isJobOpen(job: Job, now = Date.now()): boolean {
  return job.status === 'active' && !isJobExpired(job, now);
}

// ============================================================
// Job seeker lists (users/{uid}/savedJobs, users/{uid}/jobAlerts)
// ============================================================

/** A job someone saved. A copy of the title and employer keeps the list readable after the job closes. */
export interface SavedJob {
  jobId: string;
  title: string;
  organizationName: string;
  savedAt?: Timestamp | null;
}

/** Alert ids are fixed, so each person has at most this many alerts. */
export const JOB_ALERT_IDS = ['alert-1', 'alert-2', 'alert-3', 'alert-4', 'alert-5'] as const;

/** A daily email of new listings matching these filters. Empty filters match everything. */
export interface JobAlert {
  id: string;
  keywords: string;
  state: string;
  workArrangement: WorkArrangement | '';
  employmentType: EmploymentType | '';
  active: boolean;
  createdAt?: Timestamp | null;
  lastSentAt?: Timestamp | null;
}
