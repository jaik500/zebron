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
    collection(firestore, 'quizQuestions');

  async getAllQuestionsForCourse(
    organizationId: string,
    quizId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(quizId);

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('quizId', '==', quizId),
      ),
    );

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as TestQuestion))
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
      .map((document) => ({ id: document.id, ...document.data() } as TestQuestion))
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
      doc(firestore, 'quizQuestions', questionId),
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    if (data['organizationId'] !== organizationId) {
      return null;
    }

    return ({ id: snapshot.id, ...data } as TestQuestion);
  }

  async getPublishedQuestionsForCourse(
    organizationId: string,
    quizId: string,
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(quizId);

    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('organizationId', '==', organizationId),
        where('quizId', '==', quizId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'asc'),
      ),
    );

    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as TestQuestion));
  }

  async getPublishedQuestions(
    organizationId: string,
    quizId: string,
    topicIds: string[] = [],
  ): Promise<TestQuestion[]> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(quizId);

    const constraints: QueryConstraint[] = [
      where('organizationId', '==', organizationId),
      where('quizId', '==', quizId),
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

    let questions = snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as TestQuestion));

    if (topicIds.length > 1) {
      const selectedTopics = new Set(topicIds);
      questions = questions.filter((question) =>
        selectedTopics.has(question.topicId),
      );
    }

    return questions;
  }


/**
 * Load published questions for a test.
 *
 * Platform courses use platform-owned questions with
 * organizationId === null.
 *
 * Organization courses use questions owned by the active
 * organization. The Firestore rules remain responsible for
 * enforcing access to both types of content.
 */
async getQuestionsForTest(
  organizationId: string | null,
  quizId: string,
  topicIds: string[],
  difficulty: TestQuestionDifficulty | 'mixed',
  scope: 'platform' | 'organization' = 'organization',
): Promise<TestQuestion[]> {
  this.requireQuizId(quizId);

  if (scope === 'organization') {
    this.requireOrganizationId(organizationId ?? '');
  }

  if (scope === 'platform' && organizationId !== null) {
    throw new Error(
      'Platform-owned questions must be queried without an organization owner ID.',
    );
  }

  const ownershipConstraints: QueryConstraint[] =
    scope === 'platform'
      ? [
          where('scope', '==', 'platform'),
          where('organizationId', '==', null),
        ]
      : [
          where('organizationId', '==', organizationId),
        ];

  const snapshot = await getDocs(
  query(
    this.questionsCollection,
    ...ownershipConstraints,
    where('quizId', '==', quizId),
    where('status', '==', 'published'), // added
  ),
);

  const selectedTopics = new Set(topicIds);

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() } as TestQuestion))
    .filter((question) => question.status === 'published')
    .filter(
      (question) =>
        topicIds.length === 0 || selectedTopics.has(question.topicId),
    )
    .filter(
      (question) =>
        difficulty === 'mixed' || question.difficulty === difficulty,
    )
    .sort(
      (a, b) =>
        this.toMillis(a.createdAt) - this.toMillis(b.createdAt),
    );
}



  async getPublishedQuestionCount(
  organizationId: string | null,
  quizId: string,
  topicIds: string[] = [],
  scope: 'platform' | 'organization' = 'organization',
): Promise<number> {
  return (
    await this.getQuestionsForTest(
      organizationId,
      quizId,
      topicIds,
      'mixed',
      scope,
    )
  ).length;
}

  async createQuestion(
    organizationId: string,
    question: Omit<TestQuestion, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    this.requireOrganizationId(organizationId);
    this.requireQuizId(question.quizId);

    if (!question.topicId?.trim()) {
      throw new Error('A Test Center topic is required.');
    }

    await this.verifyCourseOwnership(
      organizationId,
      question.quizId,
    );

    await this.verifyTopicOwnership(
      organizationId,
      question.topicId,
      question.quizId,
    );

    // Log the exact identifiers and status being submitted so a Firestore
    // permission failure can be traced to the write rather than the ownership
    // checks above. Do not log question text, answer options, or other content.
    console.log('[TestQuestionService] Creating question', {
      organizationId,
      quizId: question.quizId,
      topicId: question.topicId,
      status: question.status,
      type: question.type,
    });

    try {
      const reference = await addDoc(
        this.questionsCollection,
        {
          ...question,
          organizationId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      console.log('[TestQuestionService] Question created successfully', {
        questionId: reference.id,
        organizationId,
        quizId: question.quizId,
        topicId: question.topicId,
        status: question.status,
      });

      return reference.id;
    } catch (error) {
      console.error(
        '[TestQuestionService] Question creation failed',
        {
          organizationId,
          quizId: question.quizId,
          topicId: question.topicId,
          status: question.status,
          error,
        },
      );

      // Preserve the Firebase error so the calling component can display it
      // and the browser console retains the original failure details.
      throw error;
    }
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

    if (changes.quizId) {
      await this.verifyCourseOwnership(
        organizationId,
        changes.quizId,
      );
    }

    if (changes.topicId) {
      await this.verifyTopicOwnership(
        organizationId,
        changes.topicId,
        changes.quizId ?? existing.quizId,
      );
    }

    const updatePayload: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };

    delete updatePayload['organizationId'];
    delete updatePayload['id'];

    await updateDoc(
      doc(firestore, 'quizQuestions', questionId),
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
      doc(firestore, 'quizQuestions', questionId),
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
      doc(firestore, 'quizQuestions', questionId),
      {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      },
    );
  }


private async verifyCourseOwnership(
  organizationId: string,
  quizId: string,
): Promise<void> {
  console.log('[TestQuestionService] Verifying course ownership', {
    organizationId,
    quizId,
  });

  let snapshot;

  try {
    snapshot = await getDoc(
      doc(firestore, 'quizzes', quizId),
    );
  } catch (error) {
    console.error(
      '[TestQuestionService] Course ownership read failed',
      {
        organizationId,
        quizId,
        error,
      },
    );

    throw error;
  }

  if (!snapshot.exists()) {
    throw new Error(
      'The selected course does not exist or is not accessible.',
    );
  }

  const data = snapshot.data();

  console.log('[TestQuestionService] Course ownership result', {
    documentId: snapshot.id,
    organizationId: data['organizationId'],
    scope: data['scope'],
    accessType: data['accessType'],
    active: data['active'],
  });

  if (data['organizationId'] !== organizationId) {
    throw new Error(
      'The selected course does not belong to the current organization.',
    );
  }
}

private async verifyTopicOwnership(
  organizationId: string,
  topicId: string,
  quizId: string,
): Promise<void> {
  console.log('[TestQuestionService] Verifying topic ownership', {
    organizationId,
    topicId,
    quizId,
  });

  let snapshot;

  try {
    snapshot = await getDoc(
      doc(firestore, 'quizTopics', topicId),
    );
  } catch (error) {
    console.error(
      '[TestQuestionService] Topic ownership read failed',
      {
        organizationId,
        topicId,
        quizId,
        error,
      },
    );

    throw error;
  }

  if (!snapshot.exists()) {
    throw new Error(
      'The selected topic does not exist or is not accessible.',
    );
  }

  const data = snapshot.data();

  console.log('[TestQuestionService] Topic ownership result', {
    documentId: snapshot.id,
    organizationId: data['organizationId'],
    quizId: data['quizId'],
    active: data['active'],
  });

  if (
    data['organizationId'] !== organizationId ||
    data['quizId'] !== quizId
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

  private requireQuizId(quizId: string): void {
    if (!quizId?.trim()) {
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
  quizId: string,
): Promise<number> {
  if (!organizationId.trim()) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  if (!quizId.trim()) {
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
      'quizId',
      '==',
      quizId,
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
  quizId: string,
  topicId: string,
): Promise<number> {
  if (!organizationId.trim()) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  if (!quizId.trim()) {
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
      'quizId',
      '==',
      quizId,
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
