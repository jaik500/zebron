import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestTopic } from '../models/test-topic.model';

@Injectable({
  providedIn: 'root',
})
export class TestTopicService {
  private readonly topicsCollection = collection(
    firestore,
    'testTopics',
  );

  // ============================================================
  // VALIDATION
  // ============================================================

  private requireOrganizationId(
    organizationId: string,
  ): void {
    if (!organizationId.trim()) {
      throw new Error(
        'An organization is required for Test Center topics.',
      );
    }
  }

  private requireCourseId(
    courseId: string,
  ): void {
    if (!courseId.trim()) {
      throw new Error(
        'A course is required for Test Center topics.',
      );
    }
  }

  // ============================================================
  // GET ACTIVE TOPICS
  // ============================================================


/**
 * Gets active topics for a course.
 *
 * Platform courses use organizationId = null.
 * Organization courses require an organization ID.
 */
async getActiveTopics(
  organizationId: string | null,
  courseId: string,
): Promise<TestTopic[]> {
  this.requireCourseId(courseId);

  if (organizationId === null) {
    const platformQuery = query(
      this.topicsCollection,
      where('scope', '==', 'platform'),
      where('organizationId', '==', null),
      where('courseId', '==', courseId),
      where('active', '==', true), // added
    );

    const snapshot = await getDocs(platformQuery);

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as TestTopic)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  this.requireOrganizationId(organizationId);

  const organizationQuery = query(
    this.topicsCollection,
    where('organizationId', '==', organizationId),
    where('courseId', '==', courseId),
    where('active', '==', true), // added
  );

  const snapshot = await getDocs(organizationQuery);

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as TestTopic)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}



  // ============================================================
  // GET ALL TOPICS
  // ============================================================

  async getAllTopics(
    organizationId: string,
    courseId: string,
  ): Promise<TestTopic[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

   const topicsQuery = query(
  this.topicsCollection,
  where('organizationId', '==', organizationId),
  where('courseId', '==', courseId),
  where('active', '==', true),
);

    const snapshot = await getDocs(
      topicsQuery,
    );

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestTopic,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder,
      );
  }

  // ============================================================
  // CREATE TOPIC
  // ============================================================

  async createTopic(
    organizationId: string,
    topic: Omit<
      TestTopic,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    this.requireOrganizationId(
      organizationId,
    );

    this.requireCourseId(
      topic.courseId,
    );

    if (
      topic.organizationId !==
      organizationId
    ) {
      throw new Error(
        'Topic organization does not match the active organization.',
      );
    }

    const reference = await addDoc(
      this.topicsCollection,
      {
        organizationId,
        courseId: topic.courseId,
        name: topic.name.trim(),
        slug: topic.slug.trim(),
        description:
          topic.description?.trim() || '',
        sortOrder: Number(topic.sortOrder),
        questionCount: 0,
        active: topic.active === true,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      },
    );

    return reference.id;
  }

  // ============================================================
  // UPDATE TOPIC
  // ============================================================

  async updateTopic(
    organizationId: string,
    topicId: string,
    changes: Partial<
      Omit<
        TestTopic,
        'id' |
        'organizationId' |
        'createdAt' |
        'updatedAt'
      >
    >,
  ): Promise<void> {
    this.requireOrganizationId(
      organizationId,
    );

    if (!topicId.trim()) {
      throw new Error(
        'Topic ID is required.',
      );
    }

    const topicReference = doc(
      firestore,
      'testTopics',
      topicId,
    );

    await updateDoc(
      topicReference,
      {
        ...changes,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  // ============================================================
  // DELETE TOPIC
  // ============================================================

  async deleteTopic(
    organizationId: string,
    topicId: string,
  ): Promise<void> {
    this.requireOrganizationId(
      organizationId,
    );

    if (!topicId.trim()) {
      throw new Error(
        'Topic ID is required.',
      );
    }

    const topicReference = doc(
      firestore,
      'testTopics',
      topicId,
    );

    await deleteDoc(
      topicReference,
    );
  }
}