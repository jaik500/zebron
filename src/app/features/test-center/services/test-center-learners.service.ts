import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  collection,
  
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

import {
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap
} from 'rxjs';

import {
  LearnerAssessmentSummary,
  LearnerCourseProgress,
  LearnerDashboard,
  TestCenterLearner,
  timestampToDate
} from '../models/test-center-learner.model';

import { TestResult } from '../models/test-result.model';

interface OrganizationMembershipRecord {
  id: string;
  userId: string;
  organizationId: string;
  role?: string;
  active?: boolean;
}

interface UserProfileRecord {
  uid?: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  photoUrl?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TestCenterLearnersService {
  private readonly firestore = inject(Firestore);

  /**
   * Returns active members of one organization.
   *
   * Firestore rules must independently authorize the query.
   */
  getLearners(
    organizationId: string
  ): Observable<TestCenterLearner[]> {
    if (!organizationId) {
      return of([]);
    }

    const membershipsQuery = query(
      collection(
        this.firestore,
        'organizationMemberships'
      ),
      where('organizationId', '==', organizationId),
      where('active', '==', true)
    );

    return from(getDocs(membershipsQuery)).pipe(
      switchMap(snapshot => {
        const memberships = snapshot.docs.map(
          membership => ({
            id: membership.id,
            ...membership.data()
          }) as OrganizationMembershipRecord
        );

        return combineLatest(
          memberships.map(membership =>
            this.buildLearner(
              membership,
              organizationId
            )
          )
        );
      })
    );
  }

  /**
   * Loads a learner's dashboard within the specified organization.
   */
  getLearnerDashboard(
    organizationId: string,
    userId: string
  ): Observable<LearnerDashboard | null> {
    if (!organizationId || !userId) {
      return of(null);
    }

    const membershipQuery = query(
      collection(
        this.firestore,
        'organizationMemberships'
      ),
      where('organizationId', '==', organizationId),
      where('userId', '==', userId),
      where('active', '==', true)
    );

    return from(getDocs(membershipQuery)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          return of(null);
        }

        const membership = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as OrganizationMembershipRecord;

        return this.buildDashboard(
          membership,
          organizationId
        );
      })
    );
  }

  private buildLearner(
    membership: OrganizationMembershipRecord,
    organizationId: string
  ): Observable<TestCenterLearner> {
    return combineLatest([
      from(
        getDoc(
          doc(
            this.firestore,
            'users',
            membership.userId
          )
        )
      ),
      this.getResults(
        organizationId,
        membership.userId
      )
    ]).pipe(
      map(([userSnapshot, results]) => {
        const user = userSnapshot.exists()
          ? userSnapshot.data() as UserProfileRecord
          : {};

        return this.createLearner(
          membership,
          user,
          results
        );
      })
    );
  }

  private buildDashboard(
    membership: OrganizationMembershipRecord,
    organizationId: string
  ): Observable<LearnerDashboard | null> {
    return this.buildLearner(
      membership,
      organizationId
    ).pipe(
      switchMap(learner =>
        this.getResults(
          organizationId,
          membership.userId
        ).pipe(
          map(results => {
            const assessments =
              results.map(result =>
                this.toAssessmentSummary(result)
              ).sort((a, b) =>
                (b.completedAt?.getTime() ?? 0) -
                (a.completedAt?.getTime() ?? 0)
              );

            const averageScore =
              this.calculateAverageScore(results);

            const lastActivityAt =
              assessments[0]?.completedAt ?? null;

            const courses =
              this.buildCourseProgress(results);

            return {
              learner,
              courses,
              assessments,
              totalAssessments: assessments.length,
              averageScore,
              completedCourses: learner.completedQuizIds.length,
              lastActivityAt
            };
          })
        )
      )
    );
  }

  private getResults(
    organizationId: string,
    userId: string
  ): Observable<TestResult[]> {
    const resultsQuery = query(
      collection(
        this.firestore,
        'quizResults'
      ),
      where('organizationId', '==', organizationId),
      where('userId', '==', userId)
    );

    return from(getDocs(resultsQuery)).pipe(
      map(snapshot =>
        snapshot.docs.map(result => ({ id: result.id, ...result.data() } as TestResult))
      )
    );
  }

  private createLearner(
    membership: OrganizationMembershipRecord,
    user: UserProfileRecord,
    results: TestResult[]
  ): TestCenterLearner {
    const name = [
      user.firstName,
      user.lastName
    ].filter(Boolean).join(' ') ||
      user.displayName ||
      user.name ||
      user.email ||
      'Unnamed learner';

    const scores = results
      .map(result => result.scorePercentage)
      .filter(score => Number.isFinite(score));

    const latestResult = [...results].sort(
      (a, b) =>
        (timestampToDate(b.completedAt)?.getTime() ?? 0) -
        (timestampToDate(a.completedAt)?.getTime() ?? 0)
    )[0];

    return {
      id: membership.userId,
      userId: membership.userId,
      organizationId: membership.organizationId,
      name,
      email: user.email ?? '',
      photoURL:
        user.photoURL ??
        user.photoUrl ??
        null,
      role: membership.role ?? 'org_member',
      active: membership.active ?? true,

      // Membership and results alone do not establish course enrollment.
      enrolledQuizIds: [],
      enrolledCourseNames: [],
      completedQuizIds: [],

      assessmentCount: results.length,

      averageScore: scores.length
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) /
            scores.length
          )
        : null,

      latestScore:
        latestResult?.scorePercentage ?? null,

      lastAssessmentAt: latestResult
        ? timestampToDate(latestResult.completedAt)
        : null,

      status: membership.active
        ? results.length
          ? 'active'
          : 'not-started'
        : 'inactive'
    };
  }

  private toAssessmentSummary(
    result: TestResult
  ): LearnerAssessmentSummary {
    return {
      id: result.id,
      attemptId: result.attemptId,
      quizId: result.quizId,
      quizName: result.quizName,
      scorePercentage: result.scorePercentage,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      unansweredQuestions: result.unansweredQuestions,
      totalQuestions: result.totalQuestions,
      completedAt: timestampToDate(result.completedAt),
      mode: result.mode
    };
  }

  private calculateAverageScore(
    results: TestResult[]
  ): number | null {
    if (!results.length) {
      return null;
    }

    const scores = results
      .map(result => result.scorePercentage)
      .filter(score => Number.isFinite(score));

    if (!scores.length) {
      return null;
    }

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length
    );
  }

  private buildCourseProgress(
    results: TestResult[]
  ): LearnerCourseProgress[] {
    const grouped = new Map<string, TestResult[]>();

    for (const result of results) {
      const existing = grouped.get(result.quizId) ?? [];

      existing.push(result);

      grouped.set(result.quizId, existing);
    }

    return Array.from(grouped.entries()).map(
      ([quizId, courseResults]) => {
        const sorted = [...courseResults].sort(
          (a, b) =>
            (timestampToDate(b.completedAt)?.getTime() ?? 0) -
            (timestampToDate(a.completedAt)?.getTime() ?? 0)
        );

        const scores = courseResults.map(
          result => result.scorePercentage
        );

        const averageScore = scores.length
          ? Math.round(
              scores.reduce((sum, score) => sum + score, 0) /
              scores.length
            )
          : null;

        return {
          quizId,
          quizName: sorted[0].quizName,
          status: 'in-progress',
          assessmentCount: courseResults.length,
          averageScore,
          latestScore: sorted[0].scorePercentage,
          lastActivityAt:
            timestampToDate(sorted[0].completedAt)
        };
      }
    );
  }
}