import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';
import { CourseCover, CourseLevel } from './course.model';
import { ExamQuestion } from './course.service';

/**
 * Certifications: an ordered path of courses ending in a certification
 * exam (see functions/src/certifications.ts).
 *
 *   certifications/{id}                          Zebron
 *   organizations/{orgId}/certifications/{id}    an organization
 *   users/{uid}/certifications/{key}             the learner's enrollment (server-written)
 *
 * The key is the certification id for Zebron certifications and
 * "<orgId>__<id>" for an organization's.
 */
export interface CertificationCourseRef {
  courseId: string;
  organizationId: string | null;
  title: string;
}

export interface CertificationDefinition {
  id: string;
  organizationId: string | null;
  key: string;
  title: string;
  credentialName: string;
  summary: string;
  description: string;
  preparesFor: string[];
  level: CourseLevel;
  cover: CourseCover;
  providerName: string;
  courses: CertificationCourseRef[];
  exam: {
    questionsPerCourse: number;
    passMark: number;
    timeLimitMinutes: number | null;
    maxAttempts: number;
    cooldownDays: number;
  };
  validityYears: number;
}

export interface CertificationEnrollment {
  key: string;
  enrolledAt: Date | null;
  /** progressId → when that step was counted. */
  stepPasses: Record<string, Date>;
  exam: {
    attempts: number;
    lockedUntil: Date | null;
    bestScore: number | null;
    lastScore: number | null;
    openAttemptId: string | null;
  };
  credential: { code: string; issuedAt: Date | null; expiresAt: Date | null; score: number | null } | null;
}

export type CertificationStage = 'not-enrolled' | 'in-progress' | 'exam-ready' | 'waiting' | 'certified' | 'expired';

export interface CertificationSession {
  attemptId: string;
  deadline: string | null;
  questions: ExamQuestion[];
  passMark: number;
  attemptsUsed: number;
  maxAttempts: number;
}

export interface CertificationResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  late: boolean;
  passMark: number;
  attemptsUsed: number;
  maxAttempts: number;
  lockedUntil: number | null;
  certificateCode: string | null;
  expiresAt: number | null;
  sections: { name: string; correct: number; total: number }[];
  missed: string[];
}

export function certificationKey(organizationId: string | null, id: string): string {
  return organizationId ? `${organizationId}__${id}` : id;
}

/** The course progress id used for a step (same as courseProgress / courseExams ids). */
export function stepKey(course: CertificationCourseRef): string {
  return course.organizationId ? `${course.organizationId}__${course.courseId}` : course.courseId;
}

/** Where the learner stands. */
export function certificationStage(
  definition: CertificationDefinition,
  enrollment: CertificationEnrollment | null,
  now = Date.now(),
): CertificationStage {
  if (!enrollment) {
    return 'not-enrolled';
  }
  const expires = enrollment.credential?.expiresAt?.getTime() ?? null;
  if (enrollment.credential && expires && expires > now) {
    return 'certified';
  }
  const allDone = definition.courses.every((course) => enrollment.stepPasses[stepKey(course)]);
  if (!allDone) {
    return 'in-progress';
  }
  if (enrollment.credential && expires && expires <= now) {
    return enrollment.exam.lockedUntil && enrollment.exam.lockedUntil.getTime() > now ? 'waiting' : 'expired';
  }
  return enrollment.exam.lockedUntil && enrollment.exam.lockedUntil.getTime() > now ? 'waiting' : 'exam-ready';
}

@Injectable({ providedIn: 'root' })
export class CertificationService {
  /** Zebron's certifications, plus the organization's on organization pages. */
  async listDefinitions(organizationId: string | null): Promise<CertificationDefinition[]> {
    const [platform, own] = await Promise.all([
      getDocs(query(collection(firestore, 'certifications'), where('status', '==', 'published'))),
      organizationId
        ? getDocs(query(collection(firestore, 'organizations', organizationId, 'certifications'), where('status', '==', 'published'))).catch(() => null)
        : Promise.resolve(null),
    ]);

    return [
      ...(own?.docs ?? []).map((document) => toDefinition(document.id, organizationId, document.data())),
      ...platform.docs.map((document) => toDefinition(document.id, null, document.data())),
    ];
  }

  /** One certification by key (id, or "<orgId>__<id>"). */
  async getDefinition(key: string): Promise<CertificationDefinition | null> {
    const separator = key.indexOf('__');
    const organizationId = separator > 0 ? key.slice(0, separator) : null;
    const id = separator > 0 ? key.slice(separator + 2) : key;
    const snapshot = await getDoc(
      organizationId ? doc(firestore, 'organizations', organizationId, 'certifications', id) : doc(firestore, 'certifications', id),
    );
    return snapshot.exists() ? toDefinition(id, organizationId, snapshot.data()) : null;
  }

  async getEnrollment(userId: string, key: string): Promise<CertificationEnrollment | null> {
    const snapshot = await getDoc(doc(firestore, 'users', userId, 'certifications', key));
    return snapshot.exists() ? toEnrollment(key, snapshot.data()) : null;
  }

  async myEnrollments(userId: string): Promise<Map<string, CertificationEnrollment>> {
    const snapshot = await getDocs(collection(firestore, 'users', userId, 'certifications'));
    return new Map(snapshot.docs.map((document) => [document.id, toEnrollment(document.id, document.data())]));
  }

  /** Enroll, or re-count the steps when already enrolled. */
  async enroll(definition: CertificationDefinition): Promise<void> {
    const call = httpsCallable<{ certificationId: string; organizationId: string | null }, unknown>(firebaseFunctions, 'enrollInCertification');
    await call({ certificationId: definition.id, organizationId: definition.organizationId });
  }

  async startExam(definition: CertificationDefinition): Promise<CertificationSession> {
    const call = httpsCallable<{ certificationId: string; organizationId: string | null }, CertificationSession>(
      firebaseFunctions,
      'startCertificationExam',
    );
    return (await call({ certificationId: definition.id, organizationId: definition.organizationId })).data;
  }

  async submitExam(definition: CertificationDefinition, attemptId: string, answers: Record<string, string>): Promise<CertificationResult> {
    const call = httpsCallable<
      { certificationId: string; organizationId: string | null; attemptId: string; answers: Record<string, string> },
      CertificationResult
    >(firebaseFunctions, 'submitCertificationExam');
    return (await call({ certificationId: definition.id, organizationId: definition.organizationId, attemptId, answers })).data;
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function date(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toDefinition(id: string, organizationId: string | null, data: Record<string, unknown>): CertificationDefinition {
  const exam = (data['exam'] ?? {}) as Record<string, unknown>;
  const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

  return {
    id,
    organizationId,
    key: certificationKey(organizationId, id),
    title: str(data['title']) || id,
    credentialName: str(data['credentialName']) || str(data['title']) || id,
    summary: str(data['summary']),
    description: str(data['description']),
    preparesFor: Array.isArray(data['preparesFor']) ? data['preparesFor'].map(String) : [],
    level: (str(data['level']) || 'all') as CourseLevel,
    cover: (str(data['cover']) || 'navy') as CourseCover,
    providerName: str(data['providerName']) || 'Zebron',
    courses: (Array.isArray(data['courses']) ? data['courses'] : []).map((item: Record<string, unknown>) => ({
      courseId: str(item['courseId']),
      organizationId: str(item['organizationId']) || null,
      title: str(item['title']),
    })),
    exam: {
      questionsPerCourse: num(exam['questionsPerCourse'], 5),
      passMark: num(exam['passMark'], 75),
      timeLimitMinutes: typeof exam['timeLimitMinutes'] === 'number' ? (exam['timeLimitMinutes'] as number) : null,
      maxAttempts: num(exam['maxAttempts'], 3),
      cooldownDays: num(exam['cooldownDays'], 7),
    },
    validityYears: num(data['validityYears'], 3),
  };
}

function toEnrollment(key: string, data: Record<string, unknown>): CertificationEnrollment {
  const passes = (data['stepPasses'] ?? {}) as Record<string, unknown>;
  const exam = (data['exam'] ?? {}) as Record<string, unknown>;
  const credential = data['credential'] as Record<string, unknown> | null | undefined;

  return {
    key,
    enrolledAt: date(data['enrolledAt']),
    stepPasses: Object.fromEntries(
      Object.entries(passes)
        .map(([course, value]) => [course, date(value)] as const)
        .filter((entry): entry is readonly [string, Date] => entry[1] !== null),
    ),
    exam: {
      attempts: typeof exam['attempts'] === 'number' ? (exam['attempts'] as number) : 0,
      lockedUntil: date(exam['lockedUntil']),
      bestScore: typeof exam['bestScore'] === 'number' ? (exam['bestScore'] as number) : null,
      lastScore: typeof exam['lastScore'] === 'number' ? (exam['lastScore'] as number) : null,
      openAttemptId: str(exam['openAttemptId']) || null,
    },
    credential:
      credential && str(credential['code'])
        ? {
            code: str(credential['code']),
            issuedAt: date(credential['issuedAt']),
            expiresAt: date(credential['expiresAt']),
            score: typeof credential['score'] === 'number' ? (credential['score'] as number) : null,
          }
        : null,
  };
}
