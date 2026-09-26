import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  TestQuestion,
  TestQuestionDifficulty,
  TestQuestionStatus,
} from '../models/test-question.model';

@Injectable({
  providedIn: 'root',
})
export class TestQuestionService {
  private readonly questionsCollection =
    collection(firestore, 'testQuestions');

  async getAllQuestionsForCourse(
    organizationId: string,
    courseId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('courseId', '==', courseId),
      ),
    );

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }) as TestQuestion)
      .sort((a, b) => this.toMillis(a.createdAt) - this.toMillis(b.createdAt));
  }

  async getAllQuestionsForTopic(
    organizationId: string,
    topicId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);

    if (!topicId?.trim()) {
      return [];
    }

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('topicId', '==', topicId),
      ),
    );

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }) as TestQuestion)
      .sort((a, b) => this.toMillis(a.createdAt) - this.toMillis(b.createdAt));
  }

  async getQuestionById(
    organizationId: string,
    questionId: string,
  ): Promise<TestQuestion | null> {
    this.requireOrganizationId(organizationId);

    if (!questionId?.trim()) {
      return null;
    }

    const snapshot = await getDoc(
      doc(firestore, 'testQuestions', questionId),
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    if (data['organizationId'] !== organizationId) {
      return null;
    }

    return {
      id: snapshot.id,
      ...data,
    } as TestQuestion;
  }

  async getPublishedQuestionsForCourse(
    organizationId: string,
    courseId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('courseId', '==', courseId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'asc'),
      ),
    );

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }) as TestQuestion);
  }

  async getPublishedQuestions(
    organizationId: string,
    courseId: string,
    topicIds: string[] = [],
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const constraints: QueryConstraint[] = [
      where('organizationId', '==', organizationId),
      where('courseId', '==', courseId),
      where('status', '==', 'published'),
    ];

    if (topicIds.length === 1) {
      constraints.push(where('topicId', '==', topicIds[0]));
    }

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        ...constraints,
        orderBy('createdAt', 'asc'),
      ),
    );

    let questions = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }) as TestQuestion);

    if (topicIds.length > 1) {
      const selectedTopics = new Set(topicIds);
      questions = questions.filter((question) =>
        selectedTopics.has(question.topicId),
      );
    }

    return questions;
  }

  async getQuestionsForTest(
    organizationId: string,
    courseId: string,
    topicIds: string[],
    difficulty: TestQuestionDifficulty | 'mixed',
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(courseId);

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('courseId', '==', courseId),
      ),
    );

    const selectedTopics = new Set(topicIds);

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }) as TestQuestion)
      .filter((question) => question.status === 'published')
      .filter(
        (question) =>
          topicIds.length === 0 || selectedTopics.has(question.topicId),
      )
      .filter(
        (question) =>
          difficulty === 'mixed' || question.difficulty === difficulty,
      )
      .sort((a, b) => this.toMillis(a.createdAt) - this.toMillis(b.createdAt));
  }

  async getPublishedQuestionCount(
    organizationId: string,
    courseId: string,
    topicIds: string[] = [],
  ): Promise<number> {
    return (
      await this.getPublishedQuestions(
        organizationId,
        courseId,
        topicIds,
      )
    ).length;
  }

  async createQuestion(
    organizationId: string,
    question: Omit<TestQuestion, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    this.requireOrganizationId(organizationId);
    this.requireCourseId(question.courseId);

    if (!question.topicId?.trim()) {
      throw new Error('A Test Center topic is required.');
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

    const reference = await addDoc(
      this.questionsCollection,
      {
        ...question,
        organizationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );

    return reference.id;
  }

  async updateQuestion(
    organizationId: string,
    questionId: string,
    changes: Partial<
      Omit<
        TestQuestion,
        'id' | 'organizationId' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing = await this.getQuestionById(
      organizationId,
      questionId,
    );

    if (!existing) {
      throw new Error(
        'Test Center question was not found in the current organization.',
      );
    }

    if (changes.courseId) {
      await this.verifyCourseOwnership(
        organizationId,
        changes.courseId,
      );
    }

    if (changes.topicId) {
      await this.verifyTopicOwnership(
        organizationId,
        changes.topicId,
        changes.courseId ?? existing.courseId,
      );
    }

    const updatePayload: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };

    delete updatePayload['organizationId'];
    delete updatePayload['id'];

    await updateDoc(
      doc(firestore, 'testQuestions', questionId),
      updatePayload,
    );
  }

  async deleteQuestion(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing = await this.getQuestionById(
      organizationId,
      questionId,
    );

    if (!existing) {
      throw new Error(
        'Test Center question was not found in the current organization.',
      );
    }

    await deleteDoc(
      doc(firestore, 'testQuestions', questionId),
    );
  }

  async submitQuestionForReview(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    await this.transitionQuestion(
      organizationId,
      questionId,
      'staff_submitted',
      ['draft', 'rejected'],
    );
  }

  async startQuestionReview(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    await this.transitionQuestion(
      organizationId,
      questionId,
      'manager_review',
      ['staff_submitted'],
    );
  }

  async returnQuestion(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    await this.transitionQuestion(
      organizationId,
      questionId,
      'rejected',
      ['manager_review'],
    );
  }

  async approveQuestion(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    await this.transitionQuestion(
      organizationId,
      questionId,
      'approved',
      ['manager_review'],
    );
  }

  async publishQuestion(
    organizationId: string,
    questionId: string,
  ): Promise<void> {
    await this.transitionQuestion(
      organizationId,
      questionId,
      'published',
      ['approved'],
    );
  }

  private async transitionQuestion(
    organizationId: string,
    questionId: string,
    nextStatus: TestQuestionStatus,
    allowedCurrentStatuses: TestQuestionStatus[],
  ): Promise<void> {
    const existing = await this.getQuestionById(
      organizationId,
      questionId,
    );

    if (!existing) {
      throw new Error(
        'Test Center question was not found in the current organization.',
      );
    }

    if (!allowedCurrentStatuses.includes(existing.status)) {
      throw new Error(
        `Question cannot move from ${existing.status} to ${nextStatus}.`,
      );
    }

    await updateDoc(
      doc(firestore, 'testQuestions', questionId),
      {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }

  private async verifyCourseOwnership(
    organizationId: string,
    courseId: string,
  ): Promise<void> {
    const snapshot = await getDoc(
      doc(firestore, 'testCourses', courseId),
    );

    if (
      !snapshot.exists() ||
      snapshot.data()['organizationId'] !== organizationId
    ) {
      throw new Error(
        'The selected course does not belong to the current organization.',
      );
    }
  }

  private async verifyTopicOwnership(
    organizationId: string,
    topicId: string,
    courseId: string,
  ): Promise<void> {
    const snapshot = await getDoc(
      doc(firestore, 'testTopics', topicId),
    );

    if (!snapshot.exists()) {
      throw new Error('The selected topic could not be found.');
    }

    const data = snapshot.data();

    if (
      data['organizationId'] !== organizationId ||
      data['courseId'] !== courseId
    ) {
      throw new Error(
        'The selected topic does not belong to the current organization and course.',
      );
    }
  }

  private requireOrganizationId(organizationId: string): void {
    if (!organizationId?.trim()) {
      throw new Error(
        'An organization is required for Test Center operations.',
      );
    }
  }

  private requireCourseId(courseId: string): void {
    if (!courseId?.trim()) {
      throw new Error('A Test Center course is required.');
    }
  }

  private toMillis(value: unknown): number {
    if (
      value &&
      typeof value === 'object' &&
      'toMillis' in value &&
      typeof (value as { toMillis: () => number }).toMillis === 'function'
    ) {
      return (value as { toMillis: () => number }).toMillis();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  }

  async getQuestionCountForCourse(
  organizationId: string,
  courseId: string,
): Promise<number> {
  if (!organizationId.trim()) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  if (!courseId.trim()) {
    throw new Error(
      'Course ID is required.',
    );
  }

  const questionsQuery = query(
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

  const snapshot =
    await getCountFromServer(
      questionsQuery,
    );

  return snapshot.data().count;
}

async getQuestionCountForTopic(
  organizationId: string,
  courseId: string,
  topicId: string,
): Promise<number> {
  if (!organizationId.trim()) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  if (!courseId.trim()) {
    throw new Error(
      'Course ID is required.',
    );
  }

  if (!topicId.trim()) {
    throw new Error(
      'Topic ID is required.',
    );
  }

  const questionsQuery = query(
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
      'topicId',
      '==',
      topicId,
    ),
  );

  const snapshot =
    await getCountFromServer(
      questionsQuery,
    );

  return snapshot.data().count;
}
}
