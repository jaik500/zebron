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

import { firestore } from '../../services/firebase-config';

import {
  Job,
} from '../../models/job.model';

import {
  JobRepository,
} from '../job.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreJobRepository
  implements JobRepository {

  private readonly jobsCollection =
    collection(
      firestore,
      'jobs',
    );


  async getJob(
    id: string,
  ): Promise<Job | null> {

    const jobRef =
      doc(
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


  async getJobs(): Promise<Job[]> {

    const jobsQuery =
      query(
        this.jobsCollection,
        orderBy(
          'createdAt',
          'desc',
        ),
      );


    const snapshot =
      await getDocs(
        jobsQuery,
      );


    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<Job, 'id'>),
      }),
    );

  }


  async getActiveJobs(): Promise<Job[]> {

    const jobsQuery =
      query(
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
      await getDocs(
        jobsQuery,
      );


    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<Job, 'id'>),
      }),
    );

  }


  async createJob(
    job: Omit<
      Job,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    const document =
      await addDoc(
        this.jobsCollection,
        {
          ...job,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );


    return document.id;

  }


  async updateJob(
    id: string,

    changes: Partial<
      Omit<
        Job,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    const jobRef =
      doc(
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


  async deleteJob(
    id: string,
  ): Promise<void> {

    const jobRef =
      doc(
        firestore,
        'jobs',
        id,
      );


    await deleteDoc(
      jobRef,
    );

  }

}