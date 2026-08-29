import { InjectionToken } from '@angular/core';
import { Job } from '../models/job.model';

export interface JobRepository {
  getJob(id: string): Promise<Job | null>;

  getJobs(): Promise<Job[]>;

  getActiveJobs(): Promise<Job[]>;

  createJob(
    job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string>;

  updateJob(
    id: string,
    changes: Partial<
      Omit<Job, 'id' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<void>;

  deleteJob(id: string): Promise<void>;
}

/**
 * Dependency-injection token for the job repository.
 *
 * Application services depend on this abstraction rather
 * than directly depending on Firestore.
 */
export const JOB_REPOSITORY =
  new InjectionToken<JobRepository>(
    'JOB_REPOSITORY',
  );