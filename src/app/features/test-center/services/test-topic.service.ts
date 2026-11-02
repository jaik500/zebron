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
    'quizTopics',
  );

  // ============================================================
  // VALIDATION
  // ============================================================

  /**
   * Topics are owned by an organization, or by Zebron when the owner is null.
   * An empty string is never a valid owner.
   */
  private requireOrganizationId(
    organizationId: string | null,
  ): void {
    if (organizationId !== null && !organizationId.trim()) {
      throw new Error(
        'An organization is required for Test Center topics.',
      );
    }
  }

  /** Query constraints for one owner: an organization, or Zebron (null). */
  private ownerConstraints(organizationId: string | null) {
    return organizationId === null
      ? [where('scope', '==', 'platform'), where('organizationId', '==', null)]
      : [where('organizationId', '==', organizationId)];
  }

  private requireQuizId(
    quizId: string,
  ): void {
    if (!quizId.trim()) {
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
  quizId: string,
): Promise<TestTopic[]> {
  this.requireQuizId(quizId);

  if (organizationId === null) {
    const platformQuery = query(
      this.topicsCollection,
      where('scope', '==', 'platform'),
      where('organizationId', '==', null),
      where('quizId', '==', quizId),
      where('active', '==', true), // added
    );

    const snapshot = await getDocs(platformQuery);

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as TestTopic))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  this.requireOrganizationId(organizationId);

  const organizationQuery = query(
    this.topicsCollection,
    where('organizationId', '==', organizationId),
    where('quizId', '==', quizId),
    where('active', '==', true), // added
  );

  const snapshot = await getDocs(organizationQuery);

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() } as TestTopic))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}



  // ============================================================
  // GET ALL TOPICS
  // ============================================================

  async getAllTopics(
    organizationId: string | null,
    quizId: string,
  ): Promise<TestTopic[]> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(quizId);

    const topicsQuery = query(
      this.topicsCollection,
      ...this.ownerConstraints(organizationId),
      where('quizId', '==', quizId),
      where('active', '==', true),
    );

    const snapshot = await getDocs(
      topicsQuery,
    );

    return snapshot.docs
      .map(
        (document) =>
          ({ id: document.id, ...document.data() } as TestTopic),
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder,
      );
  }

  // ============================================================
  // TOPICS FOR MANAGEMENT (inactive included)
  // ============================================================

  /**
   * Every topic of a quiz, inactive ones included, for the Structure pages.
   * Pass null for a Zebron quiz (platform admins). Rules allow Test Center
   * admins to read inactive topics; question writers use getAllTopics (active).
   */
  async getTopicsForManagement(
    organizationId: string | null,
    quizId: string,
  ): Promise<TestTopic[]> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(quizId);

    const snapshot = await getDocs(
      query(
        this.topicsCollection,
        ...this.ownerConstraints(organizationId),
        where('quizId', '==', quizId),
      ),
    );

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as TestTopic))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ============================================================
  // CREATE TOPIC
  // ============================================================

  async createTopic(
    organizationId: string | null,
    topic: Omit<
      TestTopic,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    this.requireOrganizationId(
      organizationId,
    );

    this.requireQuizId(
      topic.quizId,
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
        // Zebron topics carry scope 'platform'; organization topics keep their existing shape.
        ...(organizationId === null ? { scope: 'platform' } : {}),
        organizationId,
        quizId: topic.quizId,
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
    organizationId: string | null,
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
      'quizTopics',
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
    organizationId: string | null,
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
      'quizTopics',
      topicId,
    );

    await deleteDoc(
      topicReference,
    );
  }
}