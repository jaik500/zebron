import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  ScheduledTask,
  ScheduledTaskSourceType,
} from '../models/scheduled-task.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  /**
   * Central scheduler collection.
   *
   * All scheduled operations across Zebron
   * are stored here.
   */
  private readonly scheduledTasksCollection = collection(
    firestore,
    'scheduledTasks',
  );

  /**
   * Get all scheduled tasks.
   */
  async getScheduledTasks(): Promise<ScheduledTask[]> {
    const tasksQuery = query(
      this.scheduledTasksCollection,
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(tasksQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ScheduledTask,
    );
  }

  /**
   * Get one scheduled task.
   */
  async getScheduledTask(
    taskId: string,
  ): Promise<ScheduledTask | null> {
    const reference = doc(
      firestore,
      'scheduledTasks',
      taskId,
    );

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ScheduledTask;
  }

  /**
   * Find the scheduler task associated with
   * a specific source record.
   */
  async getTaskForSource(
    sourceType: ScheduledTaskSourceType,
    sourceId: string,
  ): Promise<ScheduledTask | null> {
    const tasksQuery = query(
      this.scheduledTasksCollection,
      where('sourceType', '==', sourceType),
      where('sourceId', '==', sourceId),
    );

    const snapshot = await getDocs(tasksQuery);

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];

    return {
      id: document.id,
      ...document.data(),
    } as ScheduledTask;
  }

  /**
   * Create a scheduled task.
   *
   * Undefined properties are removed before writing
   * because Firestore rejects undefined values.
   */
  async createScheduledTask(
    task: Omit<
      ScheduledTask,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const cleanTask = Object.fromEntries(
      Object.entries(task).filter(
        ([, value]) => value !== undefined,
      ),
    );

    const reference = await addDoc(
      this.scheduledTasksCollection,
      {
        ...cleanTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );

    return reference.id;
  }

  /**
   * Update a scheduled task.
   */
  async updateScheduledTask(
    taskId: string,
    changes: Partial<ScheduledTask>,
  ): Promise<void> {
    const cleanChanges = Object.fromEntries(
      Object.entries(changes).filter(
        ([, value]) => value !== undefined,
      ),
    );

    const reference = doc(
      firestore,
      'scheduledTasks',
      taskId,
    );

    await updateDoc(reference, {
      ...cleanChanges,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Enable or disable a scheduled task.
   */
  async setTaskEnabled(
    taskId: string,
    enabled: boolean,
  ): Promise<void> {
    await this.updateScheduledTask(
      taskId,
      {
        enabled,
      },
    );
  }

  /**
   * Delete a scheduled task.
   */
  async deleteScheduledTask(
    taskId: string,
  ): Promise<void> {
    const reference = doc(
      firestore,
      'scheduledTasks',
      taskId,
    );

    await deleteDoc(reference);
  }

  /**
   * Create or update a task for a source record.
   *
   * This is the primary method that reusable forms
   * should use.
   */
  async configureTask(
    task: Omit<
      ScheduledTask,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const existingTask =
      await this.getTaskForSource(
        task.sourceType,
        task.sourceId,
      );

    if (existingTask) {
      await this.updateScheduledTask(
        existingTask.id,
        task,
      );

      return existingTask.id;
    }

    return this.createScheduledTask(task);
  }

  /**
   * Enable a task for a source record.
   *
   * If the task already exists, it is re-enabled.
   */
  async enableForSource(
    sourceType: ScheduledTaskSourceType,
    sourceId: string,
    action: ScheduledTask['action'],
    createdBy: string,
    options?: {
      businessId?: string;
      runAt?: Timestamp;
      daysBefore?: number;
      repeat?: boolean;
    },
  ): Promise<string> {
    const existingTask =
      await this.getTaskForSource(
        sourceType,
        sourceId,
      );

    const taskData = {
      enabled: true,

      sourceType,
      sourceId,

      action,

      businessId: options?.businessId,

      runAt: options?.runAt,

      daysBefore: options?.daysBefore,

      repeat: options?.repeat ?? true,

      lastRunAt: undefined,

      lastError: undefined,

      runCount:
        existingTask?.runCount ?? 0,

      createdBy,
    };

    if (existingTask) {
      await this.updateScheduledTask(
        existingTask.id,
        taskData,
      );

      return existingTask.id;
    }

    return this.createScheduledTask(
      taskData,
    );
  }

  /**
   * Disable a task for a source record.
   *
   * We keep the record rather than deleting it.
   * This preserves scheduler history and allows
   * the user to turn it back on later.
   */
  async disableForSource(
    sourceType: ScheduledTaskSourceType,
    sourceId: string,
  ): Promise<void> {
    const existingTask =
      await this.getTaskForSource(
        sourceType,
        sourceId,
      );

    if (!existingTask) {
      return;
    }

    await this.updateScheduledTask(
      existingTask.id,
      {
        enabled: false,
      },
    );
  }
}