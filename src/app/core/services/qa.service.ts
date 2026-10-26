
import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { AuthService } from './auth.service';
import { firestore } from './firebase-config';

import {
  QaResultStatus,
  QaSubmission,
  QaTask,
  QaTaskStatus,
} from '../models/qa.model';

/**
 * Platform Support users are the authorized QA testers.
 *
 * QA eligibility is derived from the canonical platformRole field
 * on the corresponding users/{uid} profile.
 */
export interface QaTester {
  id: string;
  active: boolean;
  displayName?: string;
  email?: string;
  platformRole: 'platform-support';
}

interface UserProfile {
  displayName?: unknown;
  email?: unknown;
  platformRole?: unknown;
}

export interface CreateQaTaskInput {
  title: string;
  description: string;
  application: string;
  instructions: string;
  expectedResult: string;
  assignedTesterIds: string[];
}

export type UpdateQaTaskInput = Partial<CreateQaTaskInput> & {
  status?: QaTaskStatus;
};

@Injectable({
  providedIn: 'root',
})
export class QaService {
  private readonly auth = inject(AuthService);

  private readonly tasksCollection = collection(
    firestore,
    'qaTasks',
  );

  private readonly submissionsCollection = collection(
    firestore,
    'qaSubmissions',
  );

  private readonly usersCollection = collection(
    firestore,
    'users',
  );

  /**
   * Creates a QA task.
   *
   * Firestore rules must independently enforce platform-admin
   * authorization and validate the submitted fields.
   */
  async createTask(input: CreateQaTaskInput): Promise<string> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    const normalizedInput = this.normalizeTaskInput(input);

    const task = {
      ...normalizedInput,
      status: 'open' as QaTaskStatus,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const reference = await addDoc(
      this.tasksCollection,
      task,
    );

    return reference.id;
  }

  /**
   * Returns QA tasks assigned to the current user.
   *
   * Firestore rules must verify access to each matching task.
   */
  async getMyTasks(): Promise<QaTask[]> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    const taskQuery = query(
      this.tasksCollection,
      where('assignedTesterIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100),
    );

    const snapshot = await getDocs(taskQuery);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }) as QaTask);
  }

  /**
   * Returns all QA tasks for authorized QA administrators.
   *
   * Firestore rules must enforce authorization.
   */
  async getAllTasks(): Promise<QaTask[]> {
    const taskQuery = query(
      this.tasksCollection,
      orderBy('createdAt', 'desc'),
      limit(200),
    );

    const snapshot = await getDocs(taskQuery);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }) as QaTask);
  }

  /**
   * Updates an existing QA task.
   *
   * Only editable task fields are accepted. The original createdBy
   * and createdAt fields are never overwritten.
   *
   * Firestore rules must independently restrict updates to
   * authorized platform administrators.
   */
  async updateTask(
    taskId: string,
    updates: UpdateQaTaskInput,
  ): Promise<void> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      throw new Error('A QA task ID is required.');
    }

    const taskReference = doc(
      this.tasksCollection,
      normalizedTaskId,
    );

    const taskSnapshot = await getDoc(taskReference);

    if (!taskSnapshot.exists()) {
      throw new Error('The QA task does not exist.');
    }

    const editableFields: Record<string, unknown> = {};

    if (updates.title !== undefined) {
      const title = updates.title.trim();

      if (!title) {
        throw new Error('A task title is required.');
      }

      editableFields['title'] = title;
    }

    if (updates.description !== undefined) {
      editableFields['description'] = updates.description.trim();
    }

    if (updates.application !== undefined) {
      const application = updates.application.trim();

      if (!application) {
        throw new Error('An application is required.');
      }

      editableFields['application'] = application;
    }

    if (updates.instructions !== undefined) {
      editableFields['instructions'] = updates.instructions.trim();
    }

    if (updates.expectedResult !== undefined) {
      editableFields['expectedResult'] =
        updates.expectedResult.trim();
    }

    if (updates.assignedTesterIds !== undefined) {
      editableFields['assignedTesterIds'] =
        this.normalizeTesterIds(updates.assignedTesterIds);
    }

    if (updates.status !== undefined) {
      const allowedStatuses: QaTaskStatus[] = [
        'open',
        'in_progress',
        'submitted',
        'closed',
      ];

      if (!allowedStatuses.includes(updates.status)) {
        throw new Error('Invalid QA task status.');
      }

      editableFields['status'] = updates.status;
    }

    if (Object.keys(editableFields).length === 0) {
      throw new Error('No task changes were provided.');
    }

    await updateDoc(taskReference, {
      ...editableFields,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Updates only the status of a QA task.
   */
  async updateTaskStatus(
    taskId: string,
    status: QaTaskStatus,
  ): Promise<void> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      throw new Error('A QA task ID is required.');
    }

    const allowedStatuses: QaTaskStatus[] = [
      'open',
      'in_progress',
      'submitted',
      'closed',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid QA task status.');
    }

    const taskReference = doc(
      this.tasksCollection,
      normalizedTaskId,
    );

    const taskSnapshot = await getDoc(taskReference);

    if (!taskSnapshot.exists()) {
      throw new Error('The QA task does not exist.');
    }

    await updateDoc(taskReference, {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Permanently deletes a QA task.
   *
   * Firestore rules must independently enforce platform-admin
   * authorization. Deleting a task does not automatically delete
   * its related qaSubmissions documents.
   */
  async deleteTask(taskId: string): Promise<void> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      throw new Error('A QA task ID is required.');
    }

    const taskReference = doc(
      this.tasksCollection,
      normalizedTaskId,
    );

    const taskSnapshot = await getDoc(taskReference);

    if (!taskSnapshot.exists()) {
      throw new Error('The QA task no longer exists.');
    }

    await deleteDoc(taskReference);
  }

  /**
   * Submits a result for a task assigned to the current user.
   *
   * Client checks improve feedback but do not replace Firestore
   * Security Rules.
   */
  async submitResult(
    taskId: string,
    result: QaResultStatus,
    feedback: string,
  ): Promise<string> {
    const user = this.auth.firebaseUser();

    if (!user) {
      throw new Error('You must be signed in.');
    }

    if (!['pass', 'fail', 'blocked'].includes(result)) {
      throw new Error('Invalid QA result.');
    }

    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      throw new Error('A QA task is required.');
    }

    const taskReference = doc(
      this.tasksCollection,
      normalizedTaskId,
    );

    const taskSnapshot = await getDoc(taskReference);

    if (!taskSnapshot.exists()) {
      throw new Error('The QA task does not exist.');
    }

    const task = taskSnapshot.data() as Omit<QaTask, 'id'>;

    if (!task.assignedTesterIds?.includes(user.uid)) {
      throw new Error('You are not assigned to this QA task.');
    }

    if (task.status === 'closed') {
      throw new Error('This QA task is closed.');
    }

    const reference = await addDoc(
      this.submissionsCollection,
      {
        taskId: normalizedTaskId,
        testerId: user.uid,
        result,
        feedback: feedback.trim(),
        createdAt: serverTimestamp(),
      },
    );

    return reference.id;
  }

  /**
   * Retrieves submissions for authorized QA administrators.
   *
   * Firestore rules must enforce authorization.
   */
  async getAllSubmissions(): Promise<QaSubmission[]> {
    const submissionQuery = query(
      this.submissionsCollection,
      orderBy('createdAt', 'desc'),
      limit(500),
    );

    const snapshot = await getDocs(submissionQuery);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }) as QaSubmission);
  }

  /**
   * Returns users whose canonical platformRole is platform-support.
   *
   * This query requires an appropriate Firestore read policy.
   * Do not weaken general user-profile access to make this query work.
   * If necessary, expose a restricted tester directory through a
   * callable Cloud Function.
   */
  async getActiveTesters(): Promise<QaTester[]> {
    const testerQuery = query(
      this.usersCollection,
      where('platformRole', '==', 'platform-support'),
      limit(200),
    );

    const snapshot = await getDocs(testerQuery);

    return snapshot.docs.map((item) => {
      const data = item.data() as UserProfile;

      return {
        id: item.id,
        active: true,
        platformRole: 'platform-support',
        displayName:
          typeof data.displayName === 'string'
            ? data.displayName
            : undefined,
        email:
          typeof data.email === 'string'
            ? data.email
            : undefined,
      };
    });
  }

  /**
   * Compatibility alias used by existing User Management code.
   */
  async getAllTesters(): Promise<QaTester[]> {
    return this.getActiveTesters();
  }

  /**
   * Normalizes and validates editable task fields.
   */
  private normalizeTaskInput(
    input: CreateQaTaskInput,
  ): CreateQaTaskInput {
    const title = input.title.trim();
    const application = input.application.trim();

    if (!title) {
      throw new Error('A task title is required.');
    }

    if (!application) {
      throw new Error('An application is required.');
    }

    return {
      title,
      description: input.description.trim(),
      application,
      instructions: input.instructions.trim(),
      expectedResult: input.expectedResult.trim(),
      assignedTesterIds: this.normalizeTesterIds(
        input.assignedTesterIds,
      ),
    };
  }

  /**
   * Removes empty and duplicate tester IDs.
   */
  private normalizeTesterIds(ids: string[]): string[] {
    if (!Array.isArray(ids)) {
      throw new Error('Assigned testers must be a list.');
    }

    return [
      ...new Set(
        ids
          .filter(
            (id): id is string =>
              typeof id === 'string' && id.trim().length > 0,
          )
          .map((id) => id.trim()),
      ),
    ];
  }
}

