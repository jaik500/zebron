import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { Job } from '../models/job.model';

@Injectable({
  providedIn: 'root',
})
export class JobService {

  private readonly jobsCollection =
    collection(firestore, 'jobs');

  /**
   * Create a new job.
   *
   * createdBy is supplied by the caller so the
   * authenticated administrator can be recorded.
   */
  async createJob(
    job: Omit<
      Job,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    const docRef = await addDoc(
      this.jobsCollection,
      {
        ...job,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

    return docRef.id;
  }

  /**
   * Get a single job by document ID.
   */
  async getJob(
    id: string,
  ): Promise<Job | null> {

    const jobRef = doc(
      firestore,
      'jobs',
      id,
    );

    const snapshot =
      await getDoc(jobRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Job, 'id'>),
    };
  }

  /**
   * Get all jobs.
   *
   * Ordered by creation date so the newest
   * jobs appear first.
   */
  async getJobs(): Promise<Job[]> {

    const jobsQuery = query(
      this.jobsCollection,
      orderBy(
        'createdAt',
        'desc',
      ),
    );

    const snapshot =
      await getDocs(jobsQuery);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<Job, 'id'>),
      }),
    );
  }

  /**
   * Get only active jobs.
   *
   * This is the query the public Job Finder
   * will eventually use.
   */
  async getActiveJobs(): Promise<Job[]> {

    const jobsQuery = query(
      this.jobsCollection,
      where(
        'status',
        '==',
        'active',
      ),
      orderBy(
        'createdAt',
        'desc',
      ),
    );

    const snapshot =
      await getDocs(jobsQuery);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<Job, 'id'>),
      }),
    );
  }

  /**
   * Update an existing job.
   */
  async updateJob(
    id: string,
    changes: Partial<Job>,
  ): Promise<void> {

    const jobRef = doc(
      firestore,
      'jobs',
      id,
    );

    await updateDoc(
      jobRef,
      {
        ...changes,

        updatedAt:
          serverTimestamp(),
      },
    );
  }

  /**
   * Delete a job.
   */
  async deleteJob(
    id: string,
  ): Promise<void> {

    const jobRef = doc(
      firestore,
      'jobs',
      id,
    );

    await deleteDoc(jobRef);
  }
}
