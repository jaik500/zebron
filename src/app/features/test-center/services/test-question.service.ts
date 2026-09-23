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

import { firestore } from '../../../core/services/firebase-config';

import {
  TestQuestion,
  TestQuestionDifficulty,
} from '../models/test-question.model';

@Injectable({
  providedIn: 'root',
})
export class TestQuestionService {
  // ============================================================
  // FIRESTORE COLLECTION
  // ============================================================

  private readonly questionsCollection =
    collection(
      firestore,
      'testQuestions',
    );

  // ============================================================
  // GET ALL QUESTIONS FOR COURSE
  // ============================================================

  async getAllQuestionsForCourse(
    organizationId: string,
    courseId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const q = query(
      this.questionsCollection,

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
          }) as TestQuestion,
      )
      .sort(
        (a, b) =>
          this.toMillis(a.createdAt) -
          this.toMillis(b.createdAt),
      );
  }

  // ============================================================
  // GET ALL QUESTIONS FOR TOPIC
  // ============================================================

  async getAllQuestionsForTopic(
    organizationId: string,
    topicId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);

    if (!topicId?.trim()) {
      return [];
    }

    const q = query(
      this.questionsCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'topicId',
        '==',
        topicId,
      ),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(
        (document) =>
          ({
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

  // ============================================================
  // GET QUESTION BY ID
  // ============================================================

  async getQuestionById(
    organizationId: string,
    questionId: string,
  ): Promise<TestQuestion | null> {
    this.requireOrganizationId(organizationId);

    if (!questionId?.trim()) {
      return null;
    }

    const snapshot = await getDoc(
      doc(
        firestore,
        'testQuestions',
        questionId,
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
    } as TestQuestion;
  }

  // ============================================================
  // GET PUBLISHED QUESTIONS FOR COURSE
  // ============================================================

  async getPublishedQuestionsForCourse(
    organizationId: string,
    courseId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const q = query(
      this.questionsCollection,

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
        'status',
        '==',
        'published',
      ),

      orderBy(
        'createdAt',
        'asc',
      ),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as TestQuestion,
    );
  }

  // ============================================================
  // GET PUBLISHED QUESTIONS
  // ============================================================

  async getPublishedQuestions(
    organizationId: string,
    courseId: string,
    topicIds: string[] = [],
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const constraints = [
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
        'status',
        '==',
        'published',
      ),
    ];

    // ----------------------------------------------------------
    // Single topic
    // ----------------------------------------------------------

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

    const snapshot = await getDocs(q);

    let questions =
      snapshot.docs.map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestQuestion,
      );

    // ----------------------------------------------------------
    // Multiple topics
    // ----------------------------------------------------------

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

  // ============================================================
  // GET QUESTIONS FOR TEST
  // ============================================================

  async getQuestionsForTest(
    organizationId: string,
    courseId: string,
    topicIds: string[],
    difficulty:
      | TestQuestionDifficulty
      | 'mixed',
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const q = query(
      this.questionsCollection,

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

    const selectedTopics =
      new Set(topicIds);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestQuestion,
      )
      .filter(
        (question) =>
          question.status ===
          'published',
      )
      .filter(
        (question) =>
          topicIds.length === 0 ||
          selectedTopics.has(
            question.topicId,
          ),
      )
      .filter(
        (question) =>
          difficulty === 'mixed' ||
          question.difficulty ===
            difficulty,
      )
      .sort(
        (a, b) =>
          this.toMillis(a.createdAt) -
          this.toMillis(b.createdAt),
      );
  }

  // ============================================================
  // GET PUBLISHED QUESTION COUNT
  // ============================================================

  async getPublishedQuestionCount(
    organizationId: string,
    courseId: string,
    topicIds: string[] = [],
  ): Promise<number> {
    const questions =
      await this.getPublishedQuestions(
        organizationId,
        courseId,
        topicIds,
      );

    return questions.length;
  }

  // ============================================================
  // CREATE QUESTION
  // ============================================================

  async createQuestion(
    organizationId: string,
    question: Omit<
      TestQuestion,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(
      question.courseId,
    );

    if (!question.topicId?.trim()) {
      throw new Error(
        'A Test Center topic is required.',
      );
    }

    await this.verifyCourseOwnership(
      organizationId,
      question.courseId,
    );

    await this.verifyTopicOwnership(
      organizationId,
      question.topicId,
      question.courseId,
    );

    const reference =
      await addDoc(
        this.questionsCollection,
        {
          organizationId,

          courseId:
            question.courseId,

          topicId:
            question.topicId,

          subtopicId:
            question.subtopicId ?? null,

          question:
            question.question?.trim() ?? '',

          type:
            question.type,

          options:
            question.options ?? [],

          correctAnswer:
            question.correctAnswer,

          explanation:
            question.explanation?.trim() ||
            null,

          hint:
            question.hint?.trim() ||
            null,

          difficulty:
            question.difficulty,

          tags:
            question.tags ?? [],

          sourceType:
            question.sourceType,

          sourceReference:
            question.sourceReference?.trim() ||
            null,

          status:
            question.status,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

    return reference.id;
  }

  // ============================================================
  // UPDATE QUESTION
  // ============================================================

  async updateQuestion(
    organizationId: string,
    questionId: string,
    changes: Partial<
      Omit<
        TestQuestion,
        | 'id'
        | 'organizationId'
        | 'createdAt'
        | 'updatedAt'
      >
    >,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing =
      await this.getQuestionById(
        organizationId,
        questionId,
      );

    if (!existing) {
      throw new Error(
        'Test Center question was not found in the current organization.',
      );
    }

    const updatePayload: Record<
      string,
      unknown
    > = {
      ...changes,
      updatedAt:
        serverTimestamp(),
    };

    delete updatePayload[
      'organizationId'
    ];

    delete updatePayload['id'];

    // ----------------------------------------------------------
    // Prevent cross-course/topic reassignment through a
    // tenant-unaware update.
    // ----------------------------------------------------------

    if (
      changes.courseId &&
      changes.courseId !==
        existing.courseId
    ) {
      await this.verifyCourseOwnership(
        organizationId,
        changes.courseId,
      );
    }

    if (
      changes.topicId &&
      changes.topicId !==
        existing.topicId
    ) {
      const courseId =
        changes.courseId ??
        existing.courseId;

      await this.verifyTopicOwnership(
        organizationId,
        changes.topicId,
        courseId,
      );
    }

    await updateDoc(
      doc(
        firestore,
        'testQuestions',
        questionId,
      ),
      updatePayload,
    );
  }

  // ============================================================
  // DELETE QUESTION
  // ============================================================

  async deleteQuestion(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing =
      await this.getQuestionById(
        organizationId,
        questionId,
      );

    if (!existing) {
      throw new Error(
        'Test Center question was not found in the current organization.',
      );
    }

    await deleteDoc(
      doc(
        firestore,
        'testQuestions',
        questionId,
      ),
    );
  }

  // ============================================================
  // VERIFY COURSE OWNERSHIP
  // ============================================================

  private async verifyCourseOwnership(
    organizationId: string,
    courseId: string,
  ): Promise<void> {
    const snapshot =
      await getDoc(
        doc(
          firestore,
          'testCourses',
          courseId,
        ),
      );

    if (
      !snapshot.exists() ||
      snapshot.data()[
        'organizationId'
      ] !== organizationId
    ) {
      throw new Error(
        'The selected course does not belong to the current organization.',
      );
    }
  }

  // ============================================================
  // VERIFY TOPIC OWNERSHIP
  // ============================================================

  private async verifyTopicOwnership(
    organizationId: string,
    topicId: string,
    courseId: string,
  ): Promise<void> {
    const snapshot =
      await getDoc(
        doc(
          firestore,
          'testTopics',
          topicId,
        ),
      );

    if (!snapshot.exists()) {
      throw new Error(
        'The selected topic could not be found.',
      );
    }

    const data =
      snapshot.data();

    if (
      data['organizationId'] !==
        organizationId ||
      data['courseId'] !==
        courseId
    ) {
      throw new Error(
        'The selected topic does not belong to the current organization and course.',
      );
    }
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

  private toMillis(
    value: unknown,
  ): number {
    if (
      value &&
      typeof value === 'object' &&
      'toMillis' in value &&
      typeof (
        value as {
          toMillis: () => number;
        }
      ).toMillis === 'function'
    ) {
      return (
        value as {
          toMillis: () => number;
        }
      ).toMillis();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  }
}