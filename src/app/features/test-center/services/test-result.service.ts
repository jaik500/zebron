
import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { TestResult } from '../models/test-result.model';
import { TestAttempt } from '../models/test-attempt.model';
import { QuizScope } from '../models/quiz.model';

export interface SaveTestResultInput {
  result: TestResult;
  scope: QuizScope;
  topicIds: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TestResultService {
  /**
   * Persist a completed attempt and its detailed result atomically.
   *
   * An organization ID of null represents a platform-level attempt
   * that is not associated with an organization.
   *
   * Authorization is enforced by Firestore rules, not by this
   * client-side service alone.
   */
  async saveCompletedTest(
    input: SaveTestResultInput,
  ): Promise<void> {
    const { result, scope, topicIds } = input;

    if (!result.userId?.trim()) {
      throw new Error('A signed-in learner is required to save a result.');
    }

    if (!result.quizId?.trim()) {
      throw new Error('A course is required to save a result.');
    }

    if (!result.attemptId?.trim() || !result.id?.trim()) {
      throw new Error('The test attempt and result require valid IDs.');
    }

    if (scope === 'organization' && !result.organizationId) {
      throw new Error(
        'An organization is required for an organization-owned course.',
      );
    }

    if (scope === 'platform' && result.organizationId !== null) {
      throw new Error(
        'A platform course must not be assigned a fabricated organization ID.',
      );
    }

    const batch = writeBatch(firestore);

    const attemptRef = doc(
      collection(firestore, 'quizAttempts'),
      result.attemptId,
    );

    const resultRef = doc(
      collection(firestore, 'quizResults'),
      result.id,
    );

    const attempt: Omit<TestAttempt, 'startedAt' | 'completedAt'> & {
      scope: QuizScope;
      quizName: string;
      startedAt: ReturnType<typeof serverTimestamp>;
      completedAt: ReturnType<typeof serverTimestamp>;
    } = {
      id: result.attemptId,
      organizationId: result.organizationId,
      userId: result.userId,
      quizId: result.quizId,
      topicIds: [...topicIds],
      questionCount: result.totalQuestions,
      correctCount: result.correctAnswers,
      score: result.scorePercentage,
      mode: result.mode,
      scope,
      quizName: result.quizName,
      startedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    };

    batch.set(attemptRef, attempt);

    batch.set(resultRef, {
      ...result,
      scope,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  }
}

