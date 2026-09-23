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
  // ============================================================
  // FIRESTORE COLLECTION
  // ============================================================

  private readonly topicsCollection =
    collection(
      firestore,
      'testTopics',
    );

  // ============================================================
  // GET ACTIVE TOPICS
  // ============================================================

  /**
   * Returns active topics for a course within an organization.
   */
  async getActiveTopics(
    organizationId: string,
    courseId: string,
  ): Promise<TestTopic[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const q = query(
      this.topicsCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'courseId',
        '==',
        courseId,
      ),

      where(
        'active',
        '==',
        true,
      ),
    );

    const snapshot = await getDocs(q);

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
  // GET ALL TOPICS
  // ============================================================

  /**
   * Returns active and inactive topics for a course within
   * the organization.
   */
  async getAllTopics(
    organizationId: string,
    courseId: string,
  ): Promise<TestTopic[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const q = query(
      this.topicsCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'courseId',
        '==',
        courseId,
      ),
    );

    const snapshot = await getDocs(q);

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
  // GET TOPIC BY ID
  // ============================================================

  async getTopicById(
    organizationId: string,
    topicId: string,
  ): Promise<TestTopic | null> {
    this.requireOrganizationId(organizationId);

    if (!topicId?.trim()) {
      return null;
    }

    const snapshot = await import(
      'firebase/firestore'
    ).then(({ getDoc }) =>
      getDoc(
        doc(
          firestore,
          'testTopics',
          topicId,
        ),
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    if (
      data['organizationId'] !== organizationId
    ) {
      return null;
    }

    return {
      id: snapshot.id,
      ...data,
    } as TestTopic;
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
    this.requireOrganizationId(organizationId);
    this.requireCourseId(topic.courseId);

    if (!topic.name?.trim()) {
      throw new Error(
        'Topic name is required.',
      );
    }

    if (!topic.slug?.trim()) {
      throw new Error(
        'Topic slug is required.',
      );
    }

    // ----------------------------------------------------------
    // Verify the course belongs to this organization
    // ----------------------------------------------------------

    const courseQuery = query(
      collection(
        firestore,
        'testCourses',
      ),

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        '__name__',
        '==',
        topic.courseId,
      ),
    );

    const courseSnapshot =
      await getDocs(courseQuery);

    if (courseSnapshot.empty) {
      throw new Error(
        'The selected Test Center course does not belong to the current organization.',
      );
    }

    // ----------------------------------------------------------
    // Prevent duplicate topic slugs within a course
    // ----------------------------------------------------------

    const duplicateQuery = query(
      this.topicsCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'courseId',
        '==',
        topic.courseId,
      ),

      where(
        'slug',
        '==',
        topic.slug.trim(),
      ),
    );

    const duplicateSnapshot =
      await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      throw new Error(
        `A topic with the slug "${topic.slug}" already exists in this course.`,
      );
    }

    const reference = await addDoc(
      this.topicsCollection,
      {
        organizationId,

        courseId:
          topic.courseId,

        name:
          topic.name.trim(),

        slug:
          topic.slug.trim(),

        description:
          topic.description?.trim() || null,

        sortOrder:
          topic.sortOrder ?? 0,

        questionCount:
          topic.questionCount ?? 0,

        active:
          topic.active === true,

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
        | 'id'
        | 'organizationId'
        | 'courseId'
        | 'createdAt'
        | 'updatedAt'
      >
    >,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing =
      await this.getTopicById(
        organizationId,
        topicId,
      );

    if (!existing) {
      throw new Error(
        'Test Center topic was not found in the current organization.',
      );
    }

    const updatePayload: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };

    delete updatePayload['organizationId'];
    delete updatePayload['courseId'];
    delete updatePayload['id'];

    await updateDoc(
      doc(
        firestore,
        'testTopics',
        topicId,
      ),
      updatePayload,
    );
  }

  // ============================================================
  // DELETE TOPIC
  // ============================================================

  /**
   * Deletes a topic only when it belongs to the organization.
   *
   * The caller should ensure questions are handled before
   * deleting a topic.
   */
  async deleteTopic(
    organizationId: string,
    topicId: string,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing =
      await this.getTopicById(
        organizationId,
        topicId,
      );

    if (!existing) {
      throw new Error(
        'Test Center topic was not found in the current organization.',
      );
    }

    await deleteDoc(
      doc(
        firestore,
        'testTopics',
        topicId,
      ),
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private requireOrganizationId(
    organizationId: string,
  ): void {
    if (!organizationId?.trim()) {
      throw new Error(
        'An organization is required for Test Center operations.',
      );
    }
  }

  private requireCourseId(
    courseId: string,
  ): void {
    if (!courseId?.trim()) {
      throw new Error(
        'A Test Center course is required.',
      );
    }
  }
}