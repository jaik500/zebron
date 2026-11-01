import { Injectable } from '@angular/core';

import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  getCountFromServer,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

import {
  Course,
  CourseContext,
  CourseExamRecord,
  CourseFinalExam,
  CourseCover,
  CourseLevel,
  CourseModule,
  CourseProgress,
  Lesson,
  LessonBlock,
} from './course.model';

const CATALOG_LIMIT = 100;

const COVERS: CourseCover[] = ['teal', 'navy', 'sunrise', 'violet', 'sky', 'slate'];
const LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'all'];

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Firestore access for courses and course progress. Catalog queries filter
 * on status == "published", which the security rules require.
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private courses(organizationId: string | null): CollectionReference {
    return organizationId
      ? collection(firestore, 'organizations', organizationId, 'courses')
      : collection(firestore, 'courses');
  }

  private progress(userId: string): CollectionReference {
    return collection(firestore, 'users', userId, 'courseProgress');
  }

  private toCourse(id: string, organizationId: string | null, data: Record<string, unknown>): Course {
    const modules: CourseModule[] = (Array.isArray(data['modules']) ? data['modules'] : []).map(
      (module: Record<string, unknown>, moduleIndex: number) => ({
        id: text(module['id'], `module-${moduleIndex + 1}`),
        title: text(module['title']),
        lessons: (Array.isArray(module['lessons']) ? module['lessons'] : []).map(
          (lesson: Record<string, unknown>) => ({
            id: text(lesson['id']),
            title: text(lesson['title']),
            minutes: numberOr(lesson['minutes'], 5),
            hasCheck: lesson['hasCheck'] === true,
          }),
        ),
      }),
    );

    const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
    const cover = text(data['cover']) as CourseCover;
    const level = text(data['level']) as CourseLevel;

    return {
      id,
      organizationId,
      title: text(data['title'], 'Untitled course'),
      summary: text(data['summary']),
      description: text(data['description']),
      topic: text(data['topic']),
      level: LEVELS.includes(level) ? level : 'all',
      cover: COVERS.includes(cover) ? cover : 'teal',
      outcomes: strings(data['outcomes']),
      skills: strings(data['skills']),
      modules,
      lessonCount,
      finalExam: this.toFinalExam(data['finalExam']),
      estimatedMinutes: numberOr(
        data['estimatedMinutes'],
        modules.flatMap((module) => module.lessons).reduce((total, lesson) => total + lesson.minutes, 0),
      ),
      status: (text(data['status']) as Course['status']) || 'draft',
      authorName: text(data['authorName']),
      providerName: text(data['providerName'], organizationId ? '' : 'Zebron'),
      publishedAt: (data['publishedAt'] as Timestamp | null) ?? null,
      updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
      review: this.toReview(data['review']),
    };
  }

  private toReview(value: unknown): Course['review'] {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const review = value as Record<string, unknown>;
    const textOrNull = (key: string) => (typeof review[key] === 'string' && review[key] ? String(review[key]) : null);

    return {
      submittedBy: textOrNull('submittedBy'),
      submittedByName: textOrNull('submittedByName'),
      submittedAt: (review['submittedAt'] as Timestamp | null) ?? null,
      note: textOrNull('note'),
      reviewedBy: textOrNull('reviewedBy'),
      reviewedByName: textOrNull('reviewedByName'),
      reviewedAt: (review['reviewedAt'] as Timestamp | null) ?? null,
    };
  }

  private toFinalExam(value: unknown): CourseFinalExam | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const exam = value as Record<string, unknown>;
    const quizId = text(exam['quizId']);
    const minutes = numberOr(exam['timeLimitMinutes'], 0);
    const attempts = numberOr(exam['maxAttempts'], 0);

    return quizId
      ? {
          quizId,
          quizName: text(exam['quizName']),
          questionCount: Math.max(1, Math.round(numberOr(exam['questionCount'], 20))),
          passMark: Math.max(1, Math.min(100, Math.round(numberOr(exam['passMark'], 70)))),
          timeLimitMinutes: minutes > 0 ? minutes : null,
          maxAttempts: attempts > 0 ? attempts : null,
        }
      : null;
  }

  /** Parse a stored lesson (also used by the builder). */
  toLesson(id: string, data: Record<string, unknown>): Lesson {
    const blocks = (Array.isArray(data['blocks']) ? data['blocks'] : [])
      .map((block: Record<string, unknown>): LessonBlock | null => {
        switch (block['type']) {
          case 'text':
          case 'tip':
            return { type: block['type'] === 'tip' ? 'tip' : 'text', text: text(block['text']) };
          case 'video':
            return {
              type: 'video',
              url: text(block['url']),
              caption: text(block['caption']),
              start: Math.max(0, Math.floor(numberOr(block['start'], 0))),
            };
          case 'audio':
            return { type: 'audio', url: text(block['url']), caption: text(block['caption']) };
          case 'document':
            return { type: 'document', url: text(block['url']), title: text(block['title']), caption: text(block['caption']) };
          case 'image':
            return { type: 'image', url: text(block['url']), alt: text(block['alt']), caption: text(block['caption']) };
          case 'check': {
            const options = strings(block['options']);
            const answer = numberOr(block['answer'], -1);
            return options.length > 1 && answer >= 0 && answer < options.length
              ? { type: 'check', question: text(block['question']), options, answer, explanation: text(block['explanation']) }
              : null;
          }
          default:
            return null;
        }
      })
      .filter((block): block is LessonBlock => block !== null);

    return {
      id,
      moduleId: text(data['moduleId']),
      title: text(data['title']),
      order: numberOr(data['order'], 0),
      minutes: numberOr(data['minutes'], 5),
      blocks,
    };
  }

  // ============================================================
  // CATALOG
  // ============================================================

  /** Published courses in one place (Zebron's or one organization's). */
  async listPublished(organizationId: string | null): Promise<Course[]> {
    const snapshot = await getDocs(
      query(this.courses(organizationId), where('status', '==', 'published'), limit(CATALOG_LIMIT)),
    );

    return snapshot.docs
      .map((document) => this.toCourse(document.id, organizationId, document.data()))
      .sort((a, b) => (b.publishedAt?.toMillis() ?? 0) - (a.publishedAt?.toMillis() ?? 0));
  }

  /**
   * The catalog for a context: Zebron courses, plus the organization's
   * own courses (listed first) on organization pages.
   */
  async listCatalog(context: CourseContext): Promise<Course[]> {
    const [organizationCourses, platformCourses] = await Promise.all([
      context.organizationId ? this.listPublished(context.organizationId) : Promise.resolve([]),
      this.listPublished(null),
    ]);

    return [...organizationCourses, ...platformCourses];
  }

  /**
   * A course by id. On organization pages the organization's own course
   * wins; otherwise the Zebron course with that id.
   */
  async getCourse(context: CourseContext, courseId: string): Promise<Course | null> {
    if (context.organizationId) {
      const organizationCourse = await this.readCourse(context.organizationId, courseId);
      if (organizationCourse) {
        return organizationCourse;
      }
    }

    return this.readCourse(null, courseId);
  }

  private async readCourse(organizationId: string | null, courseId: string): Promise<Course | null> {
    try {
      const snapshot = await getDoc(doc(this.courses(organizationId), courseId));
      return snapshot.exists() ? this.toCourse(snapshot.id, organizationId, snapshot.data()) : null;
    } catch (error) {
      // An unpublished or missing course reads as "denied": treat it as not found.
      if ((error as { code?: string })?.code === 'permission-denied') {
        return null;
      }
      throw error;
    }
  }

  async getLesson(course: Pick<Course, 'id' | 'organizationId'>, lessonId: string): Promise<Lesson | null> {
    const snapshot = await getDoc(doc(this.courses(course.organizationId), course.id, 'lessons', lessonId));
    return snapshot.exists() ? this.toLesson(snapshot.id, snapshot.data()) : null;
  }

  async listLessons(course: Pick<Course, 'id' | 'organizationId'>): Promise<Lesson[]> {
    const snapshot = await getDocs(
      query(collection(this.courses(course.organizationId), course.id, 'lessons'), orderBy('order', 'asc')),
    );
    return snapshot.docs.map((document) => this.toLesson(document.id, document.data()));
  }

  // ============================================================
  // AUTHORING (Zebron admins; organization managers)
  // ============================================================

  /** Every course in one place, drafts included, most recently changed first. */
  async listAll(organizationId: string | null): Promise<Course[]> {
    const snapshot = await getDocs(query(this.courses(organizationId), limit(CATALOG_LIMIT)));

    return snapshot.docs
      .map((document) => this.toCourse(document.id, organizationId, document.data()))
      .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }

  /** Organization courses waiting for a manager's review. */
  async countInReview(organizationId: string): Promise<number> {
    const snapshot = await getCountFromServer(query(this.courses(organizationId), where('status', '==', 'in_review')));
    return snapshot.data().count;
  }

  /** A course for editing, whatever its status. */
  async getForEditing(organizationId: string | null, courseId: string): Promise<{ course: Course; lessons: Lesson[] } | null> {
    const snapshot = await getDoc(doc(this.courses(organizationId), courseId));
    if (!snapshot.exists()) {
      return null;
    }

    const course = this.toCourse(snapshot.id, organizationId, snapshot.data());
    return { course, lessons: await this.listLessons(course) };
  }

  async courseExists(organizationId: string | null, courseId: string): Promise<boolean> {
    return (await getDoc(doc(this.courses(organizationId), courseId))).exists();
  }

  /**
   * Write a course and its lessons in one batch: the course document
   * (details and outline), every lesson given, and deletes for removed ones.
   */
  async saveCourse(
    organizationId: string | null,
    courseId: string,
    course: Record<string, unknown>,
    lessons: { id: string; data: Record<string, unknown> }[],
    removedLessonIds: string[],
    options: {
      isNew: boolean;
      publishing: boolean;
      review?: {
        submit?: { by: string; name: string };
        decision?: { by: string; name: string; note: string | null };
      };
    },
  ): Promise<void> {
    const batch = writeBatch(firestore);
    const courseRef = doc(this.courses(organizationId), courseId);

    batch.set(
      courseRef,
      {
        ...course,
        organizationId,
        updatedAt: serverTimestamp(),
        ...(options.isNew ? { createdAt: serverTimestamp() } : {}),
        ...(options.publishing ? { publishedAt: serverTimestamp() } : {}),
        // Review: staff submit; a manager publishes or sends back with a note.
        ...(options.review?.submit
          ? {
              review: {
                submittedBy: options.review.submit.by,
                submittedByName: options.review.submit.name,
                submittedAt: serverTimestamp(),
                note: null,
                reviewedBy: null,
                reviewedByName: null,
                reviewedAt: null,
              },
            }
          : {}),
        ...(options.review?.decision
          ? {
              review: {
                note: options.review.decision.note,
                reviewedBy: options.review.decision.by,
                reviewedByName: options.review.decision.name,
                reviewedAt: serverTimestamp(),
              },
            }
          : {}),
      },
      { merge: true },
    );

    for (const lesson of lessons) {
      batch.set(doc(courseRef, 'lessons', lesson.id), { ...lesson.data, updatedAt: serverTimestamp() });
    }

    for (const lessonId of removedLessonIds) {
      batch.delete(doc(courseRef, 'lessons', lessonId));
    }

    await batch.commit();
  }

  /** Delete a course and all of its lessons. */
  async deleteCourse(organizationId: string | null, courseId: string): Promise<void> {
    const courseRef = doc(this.courses(organizationId), courseId);
    const lessons = await getDocs(collection(courseRef, 'lessons'));
    const batch = writeBatch(firestore);

    lessons.docs.forEach((lesson) => batch.delete(lesson.ref));
    batch.delete(courseRef);
    await batch.commit();
  }

  // ============================================================
  // PROGRESS (users/{uid}/courseProgress)
  // ============================================================

  private toProgress(id: string, data: Record<string, unknown>): CourseProgress {
    const cover = text(data['cover']) as CourseCover;
    const scores = (data['checkScores'] ?? {}) as Record<string, unknown>;
    const activity = (data['activity'] ?? {}) as Record<string, unknown>;

    return {
      id,
      userId: text(data['userId']),
      courseId: text(data['courseId']),
      organizationId: (data['organizationId'] as string | null) ?? null,
      courseTitle: text(data['courseTitle']),
      cover: COVERS.includes(cover) ? cover : 'teal',
      lessonCount: numberOr(data['lessonCount'], 0),
      finalExam: data['finalExam'] === true,
      completedLessonIds: strings(data['completedLessonIds']),
      lastLessonId: (data['lastLessonId'] as string | null) ?? null,
      percent: numberOr(data['percent'], 0),
      status: data['status'] === 'completed' ? 'completed' : 'in_progress',
      checkScores: Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, numberOr(value, 0)])),
      activity: Object.fromEntries(Object.entries(activity).map(([key, value]) => [key, numberOr(value, 0)])),
      learnerName: text(data['learnerName']),
      certificateCode: (data['certificateCode'] as string | null) ?? null,
      skills: strings(data['skills']),
      startedAt: (data['startedAt'] as Timestamp | null) ?? null,
      updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
      completedAt: (data['completedAt'] as Timestamp | null) ?? null,
    };
  }

  async listProgress(userId: string): Promise<CourseProgress[]> {
    const snapshot = await getDocs(this.progress(userId));
    return snapshot.docs
      .map((document) => this.toProgress(document.id, document.data()))
      .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }

  async getProgress(userId: string, id: string): Promise<CourseProgress | null> {
    const snapshot = await getDoc(doc(this.progress(userId), id));
    return snapshot.exists() ? this.toProgress(snapshot.id, snapshot.data()) : null;
  }

  /**
   * Save a learner's whole progress record (a full write, so trimmed
   * activity days really go away). startedAt is set on the first save and
   * completedAt when the course is first completed.
   */
  async saveProgress(progress: CourseProgress, justCompleted: boolean): Promise<void> {
    await setDoc(doc(this.progress(progress.userId), progress.id), {
      userId: progress.userId,
      courseId: progress.courseId,
      organizationId: progress.organizationId,
      courseTitle: progress.courseTitle,
      cover: progress.cover,
      lessonCount: progress.lessonCount,
      finalExam: progress.finalExam,
      completedLessonIds: progress.completedLessonIds,
      lastLessonId: progress.lastLessonId,
      percent: progress.percent,
      status: progress.status,
      checkScores: progress.checkScores,
      activity: progress.activity,
      learnerName: progress.learnerName,
      certificateCode: progress.certificateCode,
      skills: progress.skills,
      startedAt: progress.startedAt ?? serverTimestamp(),
      completedAt: justCompleted ? serverTimestamp() : progress.completedAt,
      updatedAt: serverTimestamp(),
    });
  }

  // ============================================================
  // FINAL EXAMS (graded by Cloud Functions)
  // ============================================================

  private toExamRecord(id: string, data: Record<string, unknown>): CourseExamRecord {
    const score = (value: unknown) => (typeof value === 'number' ? value : null);
    return {
      id,
      attempts: numberOr(data['attempts'], 0),
      bestScore: score(data['bestScore']),
      lastScore: score(data['lastScore']),
      passed: data['passed'] === true,
      passScore: score(data['passScore']),
      passedAt: (data['passedAt'] as Timestamp | null) ?? null,
      certificateCode: (data['certificateCode'] as string | null) ?? null,
      openAttemptId: (data['openAttemptId'] as string | null) ?? null,
    };
  }

  async listExamRecords(userId: string): Promise<CourseExamRecord[]> {
    const snapshot = await getDocs(collection(firestore, 'users', userId, 'courseExams'));
    return snapshot.docs.map((document) => this.toExamRecord(document.id, document.data()));
  }

  async startExam(organizationId: string | null, courseId: string): Promise<ExamSession> {
    const call = httpsCallable<{ organizationId: string | null; courseId: string }, ExamSession>(firebaseFunctions, 'startCourseExam');
    return (await call({ organizationId, courseId })).data;
  }

  async submitExam(
    organizationId: string | null,
    courseId: string,
    attemptId: string,
    answers: Record<string, string>,
  ): Promise<ExamResult> {
    const call = httpsCallable<
      { organizationId: string | null; courseId: string; attemptId: string; answers: Record<string, string> },
      ExamResult
    >(firebaseFunctions, 'submitCourseExam');
    return (await call({ organizationId, courseId, attemptId, answers })).data;
  }
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: string;
  options: { id: string; text: string }[];
}

/** What startCourseExam returns: the questions without their answers. */
export interface ExamSession {
  attemptId: string;
  quizName: string;
  /** ISO time, or null without a time limit. */
  deadline: string | null;
  questions: ExamQuestion[];
  passMark: number;
  maxAttempts: number | null;
  attemptsUsed: number;
  bestScore: number | null;
  passed: boolean;
}

/** What submitCourseExam returns. */
export interface ExamResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  late: boolean;
  passMark: number;
  attemptsUsed: number;
  maxAttempts: number | null;
  certificateCode: string | null;
  topics: { name: string; correct: number; total: number }[];
  /** Questions answered wrongly (shown after a fail, without the answers). */
  missed: string[];
}
