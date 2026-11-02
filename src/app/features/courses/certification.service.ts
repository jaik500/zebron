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

/** Exam prep: the vendor exam this certification prepares for (taken with the vendor, not on Zebron). */
export interface CertificationVendor {
  name: string;
  exam: string;
  code: string;
  format: string;
  bookingUrl: string;
  objectivesNote: string;
  disclaimer: string;
}

export interface CertificationDomain {
  code: string;
  name: string;
  weight: number;
}

/** One exam objective and the lessons that teach it. */
export interface CertificationObjective {
  code: string;
  domain: string;
  text: string;
  refs: { course: string; topic: string; title: string }[];
}

export interface CertificationDefinition {
  id: string;
  /** "zebron": ends in a Zebron credential. "exam-prep": prepares for a vendor exam; ends in "ready". */
  kind: 'zebron' | 'exam-prep';
  vendor: CertificationVendor | null;
  domains: CertificationDomain[];
  objectives: CertificationObjective[];
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
    questionCount: number;
    scale: { min: number; max: number; pass: number } | null;
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
  /** Exam prep: set when the practice exam is passed. */
  readiness: { readyAt: Date | null; score: number | null; scaled: number | null } | null;
}

/** 'prepared' (exam prep only): the practice exam is passed; book the real exam with the vendor. */
export type CertificationStage = 'not-enrolled' | 'in-progress' | 'exam-ready' | 'waiting' | 'certified' | 'expired' | 'prepared';

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
  scaledScore: number | null;
  scale: { min: number; max: number; pass: number } | null;
  examReady: boolean;
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
  if (definition.kind === 'exam-prep' && enrollment.readiness) {
    return 'prepared';
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

  const vendor = (data['vendor'] ?? null) as Record<string, unknown> | null;
  const scale = (exam['scale'] ?? null) as Record<string, unknown> | null;

  return {
    id,
    kind: data['kind'] === 'exam-prep' ? 'exam-prep' : 'zebron',
    vendor: vendor
      ? {
          name: str(vendor['name']),
          exam: str(vendor['exam']),
          code: str(vendor['code']),
          format: str(vendor['format']),
          bookingUrl: /^https:\/\//.test(str(vendor['bookingUrl'])) ? str(vendor['bookingUrl']) : '',
          objectivesNote: str(vendor['objectivesNote']),
          disclaimer: str(vendor['disclaimer']),
        }
      : null,
    domains: (Array.isArray(data['domains']) ? data['domains'] : []).map((item: Record<string, unknown>) => ({
      code: str(item['code']),
      name: str(item['name']),
      weight: num(item['weight'], 0),
    })),
    objectives: (Array.isArray(data['objectives']) ? data['objectives'] : []).map((item: Record<string, unknown>) => ({
      code: str(item['code']),
      domain: str(item['domain']),
      text: str(item['text']),
      refs: (Array.isArray(item['refs']) ? item['refs'] : []).map((ref: Record<string, unknown>) => ({ course: str(ref['course']), topic: str(ref['topic']), title: str(ref['title']) || str(ref['topic']) })),
    })),
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
      questionCount: num(exam['questionCount'], 0),
      scale: scale && typeof scale['min'] === 'number' && typeof scale['max'] === 'number'
        ? { min: scale['min'] as number, max: scale['max'] as number, pass: num(scale['pass'], scale['max'] as number) }
        : null,
    },
    validityYears: num(data['validityYears'], 3),
  };
}

function toEnrollment(key: string, data: Record<string, unknown>): CertificationEnrollment {
  const passes = (data['stepPasses'] ?? {}) as Record<string, unknown>;
  const exam = (data['exam'] ?? {}) as Record<string, unknown>;
  const credential = data['credential'] as Record<string, unknown> | null | undefined;
  const readiness = data['readiness'] as Record<string, unknown> | null | undefined;

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
    readiness: readiness
      ? {
          readyAt: date(readiness['readyAt']),
          score: typeof readiness['score'] === 'number' ? (readiness['score'] as number) : null,
          scaled: typeof readiness['scaled'] === 'number' ? (readiness['scaled'] as number) : null,
        }
      : null,
  };
}
