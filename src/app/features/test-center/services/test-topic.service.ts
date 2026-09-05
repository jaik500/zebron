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

  // =====================================================
  // FIRESTORE COLLECTION
  // =====================================================

  private readonly topicsCollection =
    collection(
      firestore,
      'testTopics',
    );


  // =====================================================
  // GET ACTIVE TOPICS FOR A COURSE
  // =====================================================

  /**
   * Returns all active topics belonging to a
   * specific Test Center course.
   *
   * Topics are filtered and sorted in memory so
   * additional composite Firestore indexes are
   * not required.
   */
  async getActiveTopics(
    courseId: string,
  ): Promise<TestTopic[]> {

    const q = query(
      this.topicsCollection,

      where(
        'courseId',
        '==',
        courseId,
      ),
    );


    const snapshot =
      await getDocs(q);


    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestTopic,
      )
      .filter(
        (topic) =>
          topic.active === true,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder,
      );
  }


  // =====================================================
  // GET ALL TOPICS FOR A COURSE
  // =====================================================

  /**
   * Returns all topics for a course, including
   * inactive topics.
   */
  async getAllTopics(
    courseId: string,
  ): Promise<TestTopic[]> {

    const q = query(
      this.topicsCollection,

      where(
        'courseId',
        '==',
        courseId,
      ),
    );


    const snapshot =
      await getDocs(q);


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


  // =====================================================
  // CREATE TOPIC
  // =====================================================

  /**
   * Creates a new Test Center topic.
   *
   * The caller supplies the course ID and topic
   * information. Firestore generates the document ID.
   */
  async createTopic(
    topic: Omit<
      TestTopic,
      'id' |
      'createdAt' |
      'updatedAt'
    >,
  ): Promise<string> {

    const reference =
      await addDoc(
        this.topicsCollection,
        {
          ...topic,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );


    return reference.id;
  }


  // =====================================================
  // UPDATE TOPIC
  // =====================================================

  /**
   * Updates an existing Test Center topic.
   */
  async updateTopic(
    topicId: string,
    changes: Partial<
      Omit<
        TestTopic,
        'id' |
        'createdAt' |
        'updatedAt'
      >
    >,
  ): Promise<void> {

    const topicReference =
      doc(
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


  // =====================================================
  // DELETE TOPIC
  // =====================================================

  /**
   * Deletes a Test Center topic.
   *
   * Question cleanup should be handled separately once
   * the question administration workflow is implemented.
   */
  async deleteTopic(
    topicId: string,
  ): Promise<void> {

    const topicReference =
      doc(
        firestore,
        'testTopics',
        topicId,
      );


    await deleteDoc(
      topicReference,
    );
  }
}