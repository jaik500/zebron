import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  TestQuestion,
  TestQuestionDifficulty,
} from '../models/test-question.model';

@Injectable({
  providedIn: 'root',
})
export class TestQuestionService {

  private readonly questionsCollection =
    collection(
      firestore,
      'testQuestions',
    );


  /**
   * Get all questions for a course.
   *
   * Used primarily by Test Center administration.
   *
   * Unlike the practice/test methods below, this method
   * returns questions regardless of publication status.
   */
  async getAllQuestionsForCourse(
    courseId: string,
  ): Promise<TestQuestion[]> {

    const q = query(
      this.questionsCollection,

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
        (document) => ({
          id: document.id,
          ...document.data(),
        }) as TestQuestion,
      )
      .sort(
        (a, b) =>
          this.toMillis(a.createdAt) -
          this.toMillis(b.createdAt),
      );
  }


  /**
   * Get all questions for a specific topic.
   *
   * Used by Question Administration when a topic
   * is selected.
   */
  async getAllQuestionsForTopic(
    topicId: string,
  ): Promise<TestQuestion[]> {

    const q = query(
      this.questionsCollection,

      where(
        'topicId',
        '==',
        topicId,
      ),
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs
      .map(
        (document) => ({
          id: document.id,
          ...document.data(),
        }) as TestQuestion,
      )
      .sort(
        (a, b) =>
          this.toMillis(a.createdAt) -
          this.toMillis(b.createdAt),
      );
  }


  /**
   * Create a new question.
   *
   * createdAt and updatedAt are managed by Firestore.
   */
  async createQuestion(
    question: Omit<
      TestQuestion,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {

    const reference =
      await addDoc(
        this.questionsCollection,
        {
          ...question,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

    return reference.id;
  }


  /**
   * Update an existing question.
   */
  async updateQuestion(
    questionId: string,

    changes: Partial<
      Omit<
        TestQuestion,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {

    const questionReference =
      doc(
        firestore,
        'testQuestions',
        questionId,
      );

    await updateDoc(
      questionReference,
      {
        ...changes,

        updatedAt:
          serverTimestamp(),
      },
    );
  }


  /**
   * Delete an existing question.
   */
  async deleteQuestion(
    questionId: string,
  ): Promise<void> {

    const questionReference =
      doc(
        firestore,
        'testQuestions',
        questionId,
      );

    await deleteDoc(
      questionReference,
    );
  }


  /**
   * Get all published questions
   * for a specific course.
   *
   * This is primarily useful for administrative
   * or course-level question-bank operations.
   */
  async getPublishedQuestionsForCourse(
    courseId: string,
  ): Promise<TestQuestion[]> {

    const q = query(
      this.questionsCollection,

      where(
        'courseId',
        '==',
        courseId,
      ),

      where(
        'status',
        '==',
        'published',
      ),

      orderBy(
        'createdAt',
        'asc',
      ),
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      }) as TestQuestion,
    );
  }


  /**
   * Get published questions for a course
   * and a set of selected topics.
   *
   * When topicIds is empty, all published
   * questions for the course are returned.
   */
  async getPublishedQuestions(
    courseId: string,
    topicIds: string[] = [],
  ): Promise<TestQuestion[]> {

    const constraints = [
      where(
        'courseId',
        '==',
        courseId,
      ),

      where(
        'status',
        '==',
        'published',
      ),
    ];

    if (topicIds.length === 1) {

      constraints.push(
        where(
          'topicId',
          '==',
          topicIds[0],
        ),
      );
    }

    const q = query(
      this.questionsCollection,
      ...constraints,
      orderBy(
        'createdAt',
        'asc',
      ),
    );

    const snapshot =
      await getDocs(q);

    let questions =
      snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        }) as TestQuestion,
      );

    /**
     * Firestore does not support an arbitrary
     * array of topic IDs with a normal equality
     * query.
     *
     * Therefore, when multiple topics are selected,
     * filter the course questions in memory.
     */
    if (topicIds.length > 1) {

      const selectedTopics =
        new Set(topicIds);

      questions =
        questions.filter(
          (question) =>
            selectedTopics.has(
              question.topicId,
            ),
        );
    }

    return questions;
  }

  


 /**
 * Get published questions matching:
 * - course
 * - selected topics
 * - difficulty
 *
 * 'mixed' means all published difficulties.
 *
 * Topic filtering is performed in memory so multiple
 * selected topics work consistently without requiring
 * a Firestore "in" query or additional composite indexes.
 */
async getQuestionsForTest(
  courseId: string,
  topicIds: string[],
  difficulty:
    | TestQuestionDifficulty
    | 'mixed',
): Promise<TestQuestion[]> {
  if (!courseId || topicIds.length === 0) {
    return [];
  }

  const q = query(
    this.questionsCollection,
    where('courseId', '==', courseId),
  );

  const snapshot = await getDocs(q);

  const selectedTopicIds = new Set(topicIds);

  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as TestQuestion,
    )
    .filter((question) => {
      const matchesStatus =
        question.status === 'published';

      const matchesTopic =
        selectedTopicIds.has(question.topicId);

      const matchesDifficulty =
        difficulty === 'mixed' ||
        question.difficulty === difficulty;

      return (
        matchesStatus &&
        matchesTopic &&
        matchesDifficulty
      );
    });
}

/**
 * Get the number of published questions available
 * for the selected topics in a course.
 */
async getPublishedQuestionCount(
  courseId: string,
  topicIds: string[],
): Promise<number> {
  if (!courseId || topicIds.length === 0) {
    return 0;
  }

  const q = query(
    this.questionsCollection,
    where('courseId', '==', courseId),
  );

  const snapshot = await getDocs(q);

  const selectedTopicIds = new Set(topicIds);

  return snapshot.docs.filter((document) => {
    const data = document.data() as TestQuestion;

    return (
      data.status === 'published' &&
      selectedTopicIds.has(data.topicId)
    );
  }).length;
}


  /**
   * Convert Firestore Timestamp values safely
   * for client-side sorting.
   */
  private toMillis(
    timestamp: TestQuestion['createdAt'],
  ): number {

    if (
      timestamp &&
      typeof (timestamp as any).toMillis === 'function'
    ) {
      return (timestamp as any).toMillis();
    }

    return 0;
  }
}