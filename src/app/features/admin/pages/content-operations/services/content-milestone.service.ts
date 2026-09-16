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
} from 'firebase/firestore';

import { firestore } from '../../../../../core/services/firebase-config';

import {
  ContentMilestone,
  ContentMilestoneCategory,
  ContentMilestoneStatus,
  DevelopmentStatus,
  TestingStatus,
  CaptureStatus,
  ContentStatus,
} from '../models/content-milestones.model';

@Injectable({
  providedIn: 'root',
})
export class ContentMilestoneService {
  /**
   * Firestore collection used to store content/development milestones.
   */
  private readonly collectionName = 'contentMilestones';

  /**
   * Reference to the Firestore collection.
   */
  private readonly milestoneCollection = collection(
    firestore,
    this.collectionName,
  );

  /**
   * Create a new content milestone.
   */
  async createMilestone(
    milestone: Omit<
      ContentMilestone,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const docRef = await addDoc(this.milestoneCollection, {
      ...milestone,

      category: milestone.category ?? 'content',
      status: milestone.status ?? 'planned',

      developmentStatus:
        milestone.developmentStatus ?? 'not-started',

      testingStatus:
        milestone.testingStatus ?? 'not-started',

      captureStatus:
        milestone.captureStatus ?? 'not-started',

      contentStatus:
        milestone.contentStatus ?? 'not-started',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Get all milestones ordered by creation date.
   */
  async getMilestones(): Promise<ContentMilestone[]> {
    const milestoneQuery = query(
      this.milestoneCollection,
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(milestoneQuery);

    return snapshot.docs.map(
      (milestoneDoc) =>
        ({
          id: milestoneDoc.id,
          ...milestoneDoc.data(),
        }) as ContentMilestone,
    );
  }

  /**
   * Get a single milestone by ID.
   */
  async getMilestone(
    id: string,
  ): Promise<ContentMilestone | null> {
    const milestoneDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    if (!milestoneDoc.exists()) {
      return null;
    }

    return {
      id: milestoneDoc.id,
      ...milestoneDoc.data(),
    } as ContentMilestone;
  }

  /**
   * Update an existing milestone.
   */
  async updateMilestone(
    id: string,
    changes: Partial<
      Omit<
        ContentMilestone,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        ...changes,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Delete a milestone.
   */
  async deleteMilestone(
    id: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );
  }

  /**
   * Update only the milestone status.
   */
  async updateStatus(
    id: string,
    status: ContentMilestoneStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        status,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update development progress.
   */
  async updateDevelopmentStatus(
    id: string,
    developmentStatus: DevelopmentStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        developmentStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update testing progress.
   */
  async updateTestingStatus(
    id: string,
    testingStatus: TestingStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        testingStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update capture status.
   */
  async updateCaptureStatus(
    id: string,
    captureStatus: CaptureStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        captureStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update content production status.
   */
  async updateContentStatus(
    id: string,
    contentStatus: ContentStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        contentStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update multiple progress fields at once.
   *
   * Useful when a milestone moves through the development
   * lifecycle and several statuses need to change together.
   */
  async updateProgress(
    id: string,
    changes: {
      developmentStatus?: DevelopmentStatus;
      testingStatus?: TestingStatus;
      captureStatus?: CaptureStatus;
      contentStatus?: ContentStatus;
    },
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        ...changes,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Check whether a milestone exists.
   */
  async milestoneExists(
    id: string,
  ): Promise<boolean> {
    const milestoneDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    return milestoneDoc.exists();
  }
}