import { Injectable } from '@angular/core';

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../models/organization-onboarding.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationOnboardingService {
  private readonly collectionName =
    'organizationOnboarding';

  async getOnboarding(
    organizationId: string,
  ): Promise<OrganizationOnboarding | null> {
    const onboardingRef = doc(
      firestore,
      this.collectionName,
      organizationId,
    );

    const snapshot = await getDoc(onboardingRef);

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
    const onboardingRef = doc(
      firestore,
      this.collectionName,
      organizationId,
    );

    const allSteps = Array.from(
      new Set([
        ...completedSteps,
        step,
      ]),
    );

    const isComplete = nextStep === null;

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
}