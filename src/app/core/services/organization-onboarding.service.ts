import { Injectable } from '@angular/core';

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';

import {
  firestore,
  firebaseFunctions,
} from './firebase-config';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../models/organization-onboarding.model';

export type OrganizationOnboardingFirstQuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export interface OrganizationOnboardingFirstQuestionOption {
  id: string;
  text: string;
}

export interface OrganizationOnboardingFirstQuestionInput {
  question: string;
  options: OrganizationOnboardingFirstQuestionOption[];
  correctAnswer: string;
  difficulty: OrganizationOnboardingFirstQuestionDifficulty;
  explanation?: string;
}

export interface OrganizationOnboardingFirstQuestionResponse {
  success: boolean;

  organizationId: string;

  question: {
    id: string;
    organizationId: string;
    courseId: string;
    topicId: string;
    question: string;
    type: 'multiple-choice';
    options: OrganizationOnboardingFirstQuestionOption[];
    correctAnswer: string;
    difficulty: OrganizationOnboardingFirstQuestionDifficulty;
    explanation?: string | null;
    tags: string[];
    sourceType: 'original';
    status: 'published';
  };

  onboarding: {
    firstQuestionId: string;
    currentStep: OrganizationOnboardingStep;
    completedSteps: OrganizationOnboardingStep[];
    status: 'completed';
  };
}

interface CompleteOrganizationFirstQuestionRequest {
  organizationId: string;
  question: string;
  options: OrganizationOnboardingFirstQuestionOption[];
  correctAnswer: string;
  difficulty: OrganizationOnboardingFirstQuestionDifficulty;
  explanation?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationOnboardingService {
  private readonly collectionName =
    'organizationOnboarding';

  private readonly functions =
    firebaseFunctions;

  async getOnboarding(
    organizationId: string,
  ): Promise<OrganizationOnboarding | null> {
    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    const onboardingRef = doc(
      firestore,
      this.collectionName,
      normalizedOrganizationId,
    );

    const snapshot = await getDoc(
      onboardingRef,
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as OrganizationOnboarding;
  }

  async completeStep(
    organizationId: string,
    step: OrganizationOnboardingStep,
    nextStep: OrganizationOnboardingStep | null,
    completedSteps: OrganizationOnboardingStep[],
  ): Promise<void> {
    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    const onboardingRef = doc(
      firestore,
      this.collectionName,
      normalizedOrganizationId,
    );

    const allSteps = Array.from(
      new Set([
        ...completedSteps,
        step,
      ]),
    );

    const isComplete =
      nextStep === null;

    await updateDoc(
      onboardingRef,
      {
        completedSteps: allSteps,

        currentStep:
          nextStep ?? step,

        status:
          isComplete
            ? 'completed'
            : 'in_progress',

        completedAt:
          isComplete
            ? serverTimestamp()
            : null,

        updatedAt:
          serverTimestamp(),
      },
    );
  }

  async completeOrganizationFirstQuestion(
    organizationId: string,
    question: OrganizationOnboardingFirstQuestionInput,
  ): Promise<OrganizationOnboardingFirstQuestionResponse> {
    const normalizedOrganizationId =
      organizationId?.trim();

    if (!normalizedOrganizationId) {
      throw new Error(
        'Organization ID is required.',
      );
    }

    this.validateFirstQuestion(
      question,
    );

    const callable = httpsCallable<
      CompleteOrganizationFirstQuestionRequest,
      OrganizationOnboardingFirstQuestionResponse
    >(
      this.functions,
      'completeOrganizationFirstQuestion',
    );

    const result = await callable({
      organizationId:
        normalizedOrganizationId,

      question:
        question.question.trim(),

      options:
        question.options.map(
          (option) => ({
            id: option.id.trim(),
            text: option.text.trim(),
          }),
        ),

      correctAnswer:
        question.correctAnswer.trim(),

      difficulty:
        question.difficulty,

      explanation:
        question.explanation?.trim() ||
        undefined,
    });

    return result.data;
  }

  private validateFirstQuestion(
    question: OrganizationOnboardingFirstQuestionInput,
  ): void {
    if (!question) {
      throw new Error(
        'First question information is required.',
      );
    }

    if (!question.question?.trim()) {
      throw new Error(
        'Question text is required.',
      );
    }

    if (
      question.question.trim().length >
      5000
    ) {
      throw new Error(
        'Question text cannot exceed 5000 characters.',
      );
    }

    if (
      !Array.isArray(question.options)
    ) {
      throw new Error(
        'Question options are required.',
      );
    }

    if (
      question.options.length !== 4
    ) {
      throw new Error(
        'Exactly four answer options are required.',
      );
    }

    const optionIds =
      new Set<string>();

    for (
      const option of question.options
    ) {
      if (!option?.id?.trim()) {
        throw new Error(
          'Each answer option must have an ID.',
        );
      }

      const normalizedId =
        option.id.trim();

      if (
        optionIds.has(normalizedId)
      ) {
        throw new Error(
          'Answer option IDs must be unique.',
        );
      }

      optionIds.add(normalizedId);

      if (!option.text?.trim()) {
        throw new Error(
          'All answer options must contain text.',
        );
      }

      if (
        option.text.trim().length >
        1000
      ) {
        throw new Error(
          'Answer option text cannot exceed 1000 characters.',
        );
      }
    }

    if (
      !question.correctAnswer?.trim()
    ) {
      throw new Error(
        'A correct answer is required.',
      );
    }

    const normalizedCorrectAnswer =
      question.correctAnswer.trim();

    if (
      !optionIds.has(
        normalizedCorrectAnswer,
      )
    ) {
      throw new Error(
        'The correct answer must match one of the answer options.',
      );
    }

    if (
      question.difficulty !== 'easy' &&
      question.difficulty !== 'medium' &&
      question.difficulty !== 'hard'
    ) {
      throw new Error(
        'Question difficulty is invalid.',
      );
    }

    if (
      question.explanation &&
      question.explanation.trim()
        .length > 5000
    ) {
      throw new Error(
        'Question explanation cannot exceed 5000 characters.',
      );
    }
  }
}
