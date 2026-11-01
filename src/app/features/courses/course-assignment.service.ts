import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

/**
 * Course assignments: a manager asks people to take a course, or one
 * lesson of it, optionally by a due date.
 *
 *   organizations/{id}/courseAssignments/{uid}__{courseId}            whole course
 *   organizations/{id}/courseAssignments/{uid}__{courseId}__{lessonId} one lesson
 *
 * Progress itself stays in users/{uid}/courseProgress: an assignment is
 * done when the course is complete (final exam passed, when it has one)
 * or, for a lesson, when that lesson is done. A lesson on its own never
 * earns an exam or a certificate.
 */
export interface CourseAssignment {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  cover: string;
  lessonId: string | null;
  lessonTitle: string | null;
  dueAt: Date | null;
  required: boolean;
  note: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: Date | null;
}

export interface AssignmentDraft {
  userId: string;
  userName: string;
}

export interface AssignmentTarget {
  courseId: string;
  courseTitle: string;
  cover: string;
  lessonId: string | null;
  lessonTitle: string | null;
  dueAt: Date | null;
  required: boolean;
  note: string;
}

/** One row of the team progress report (see getTeamLearningProgress). */
export interface TeamAssignmentRow {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  lessonId: string | null;
  lessonTitle: string | null;
  dueAt: number | null;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  percent: number;
  completedAt: number | null;
}

export interface TeamMemberRow {
  userId: string;
  name: string;
  email: string | null;
  role: string;
  coursesStarted: number;
  coursesCompleted: number;
  certificates: number;
  examsPassed: number;
  lastActivity: number | null;
  assigned: number;
  assignedDone: number;
  overdue: number;
}

export interface TeamLearningProgress {
  members: TeamMemberRow[];
  assignments: TeamAssignmentRow[];
  courses: { id: string; title: string }[];
  generatedAt: number;
}

export function assignmentId(userId: string, courseId: string, lessonId: string | null): string {
  return lessonId ? `${userId}__${courseId}__${lessonId}` : `${userId}__${courseId}`;
}

/** Overdue: a due date in the past and not done yet. */
export function isOverdue(dueAt: Date | number | null, done: boolean, now = Date.now()): boolean {
  if (done || dueAt === null) {
    return false;
  }
  const time = typeof dueAt === 'number' ? dueAt : dueAt.getTime();
  return time < now;
}

/** A date input value (YYYY-MM-DD) as the end of that day, local time. */
export function dueDateFromInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 0) : null;
}

@Injectable({ providedIn: 'root' })
export class CourseAssignmentService {
  private assignments(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'courseAssignments');
  }

  /** Everyone assigned this course or one of its lessons (staff and above). */
  async listForCourse(organizationId: string, courseId: string): Promise<CourseAssignment[]> {
    const snapshot = await getDocs(query(this.assignments(organizationId), where('courseId', '==', courseId), limit(1000)));
    return snapshot.docs.map((document) => toAssignment(document.id, organizationId, document.data())).sort(byName);
  }

  /** The signed-in learner's own assignments. */
  async listMine(organizationId: string, userId: string): Promise<CourseAssignment[]> {
    const snapshot = await getDocs(query(this.assignments(organizationId), where('userId', '==', userId), limit(200)));
    return snapshot.docs.map((document) => toAssignment(document.id, organizationId, document.data()));
  }

  /** Assign (or update) the same course or lesson for several people at once (managers and above). */
  async assign(
    organizationId: string,
    people: AssignmentDraft[],
    target: AssignmentTarget,
    assignedBy: { uid: string; name: string },
  ): Promise<void> {
    // A batch holds at most 500 writes.
    for (let index = 0; index < people.length; index += 400) {
      const batch = writeBatch(firestore);

      for (const person of people.slice(index, index + 400)) {
        batch.set(doc(this.assignments(organizationId), assignmentId(person.userId, target.courseId, target.lessonId)), {
          organizationId,
          userId: person.userId,
          userName: person.userName.trim().slice(0, 120),
          courseId: target.courseId,
          courseTitle: target.courseTitle.trim().slice(0, 200),
          cover: target.cover.slice(0, 20),
          lessonId: target.lessonId,
          lessonTitle: target.lessonTitle ? target.lessonTitle.trim().slice(0, 200) : null,
          dueAt: target.dueAt ? Timestamp.fromDate(target.dueAt) : null,
          required: target.required,
          note: target.note.trim().slice(0, 500),
          assignedBy: assignedBy.uid,
          assignedByName: assignedBy.name.trim().slice(0, 120),
          assignedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  }

  remove(organizationId: string, id: string): Promise<void> {
    return deleteDoc(doc(this.assignments(organizationId), id));
  }

  /** Team progress for managers: assignments, completions and certificates. */
  async teamProgress(organizationId: string): Promise<TeamLearningProgress> {
    const callable = httpsCallable<{ organizationId: string }, TeamLearningProgress>(firebaseFunctions, 'getTeamLearningProgress');
    return (await callable({ organizationId })).data;
  }
}

function toAssignment(id: string, organizationId: string, data: Record<string, unknown>): CourseAssignment {
  const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);
  const str = (value: unknown) => (typeof value === 'string' ? value : '');

  return {
    id,
    organizationId,
    userId: str(data['userId']),
    userName: str(data['userName']),
    courseId: str(data['courseId']),
    courseTitle: str(data['courseTitle']),
    cover: str(data['cover']) || 'teal',
    lessonId: str(data['lessonId']) || null,
    lessonTitle: str(data['lessonTitle']) || null,
    dueAt: date(data['dueAt']),
    required: data['required'] === true,
    note: str(data['note']),
    assignedBy: str(data['assignedBy']),
    assignedByName: str(data['assignedByName']),
    assignedAt: date(data['assignedAt']),
  };
}

function byName(a: CourseAssignment, b: CourseAssignment): number {
  return a.userName.localeCompare(b.userName) || (a.lessonTitle ?? '').localeCompare(b.lessonTitle ?? '');
}
