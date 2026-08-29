import { Injectable, inject } from '@angular/core';

import { Job } from '../models/job.model';

import {
  JOB_REPOSITORY,
  JobRepository,
} from '../repositories/job.repository';
import { FirestoreJobRepository } from '../repositories/firestore/firestore-job.repository';

@Injectable({
  providedIn: 'root',
})
export class JobService {

  /**
   * Repository responsible for job persistence.
   *
   * The service does not know how jobs are stored.
   * Today the implementation is Firestore, but the
   * repository contract allows us to change the
   * persistence technology later without changing
   * components or stores.
   */
 private readonly jobRepository =
  inject<JobRepository>(
    JOB_REPOSITORY,
  );


  /**
   * Get a single job by document ID.
   */
  async getJob(
    id: string,
  ): Promise<Job | null> {

    return this.jobRepository.getJob(id);

  }


  /**
   * Get all jobs for administrative use.
   */
  async getJobs(): Promise<Job[]> {

    return this.jobRepository.getJobs();

  }


  /**
   * Get only publicly available jobs.
   *
   * The repository is responsible for the
   * Firestore query.
   */
  async getActiveJobs(): Promise<Job[]> {

    return this.jobRepository.getActiveJobs();

  }


  /**
   * Create a new job.
   */
  async createJob(
    job: Omit<
      Job,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    return this.jobRepository.createJob(
      job,
    );

  }


  /**
   * Update an existing job.
   */
  async updateJob(
    id: string,

    changes: Partial<
      Omit<
        Job,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    return this.jobRepository.updateJob(
      id,
      changes,
    );

  }


  /**
   * Delete a job.
   */
  async deleteJob(
    id: string,
  ): Promise<void> {

    return this.jobRepository.deleteJob(
      id,
    );

  }

}