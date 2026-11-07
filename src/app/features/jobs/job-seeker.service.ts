import { Injectable, computed, effect, inject, signal } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';
import { AuthService } from '../../core/services/auth.service';
import {
  EmploymentType,
  Job,
  JOB_ALERT_IDS,
  JobAlert,
  SavedJob,
  WorkArrangement,
} from '../../core/models/job.model';

/** What a person fills in to create or change an alert. */
export interface JobAlertInput {
  keywords: string;
  state: string;
  workArrangement: WorkArrangement | '';
  employmentType: EmploymentType | '';
  active: boolean;
}

/**
 * A job seeker's own lists on the public job board:
 * - saved jobs: users/{uid}/savedJobs/{jobId}
 * - job alerts (daily email, at most 5): users/{uid}/jobAlerts/alert-1 … alert-5
 *
 * Loaded once per signed-in person and kept in signals, so every Save
 * button on the page shows the same state without extra reads.
 */
@Injectable({ providedIn: 'root' })
export class JobSeekerService {
  private readonly auth = inject(AuthService);

  private readonly savedState = signal<SavedJob[]>([]);
  private readonly alertState = signal<JobAlert[]>([]);
  private readonly loadedFor = signal<string | null>(null);

  readonly saved = this.savedState.asReadonly();
  readonly alerts = this.alertState.asReadonly();
  readonly loading = signal(false);

  /** The signed-in person's id, or null for visitors. */
  readonly userId = computed(() => this.auth.firebaseUser()?.uid ?? null);

  readonly savedIds = computed(() => new Set(this.savedState().map((item) => item.jobId)));

  /** True when another alert can be added. */
  readonly canAddAlert = computed(() => this.alertState().length < JOB_ALERT_IDS.length);

  constructor() {
    // Load the lists when someone signs in; forget them when they sign out.
    effect(() => {
      const uid = this.userId();
      if (!uid) {
        this.savedState.set([]);
        this.alertState.set([]);
        this.loadedFor.set(null);
        return;
      }
      if (this.loadedFor() !== uid) {
        void this.load(uid);
      }
    });
  }

  isSaved(jobId: string | undefined): boolean {
    return !!jobId && this.savedIds().has(jobId);
  }

  async load(uid: string): Promise<void> {
    this.loadedFor.set(uid);
    this.loading.set(true);
    try {
      const [saved, alerts] = await Promise.all([
        getDocs(collection(firestore, 'users', uid, 'savedJobs')),
        getDocs(collection(firestore, 'users', uid, 'jobAlerts')),
      ]);
      this.savedState.set(
        saved.docs
          .map((item) => ({ ...(item.data() as SavedJob), jobId: item.id }))
          .sort((a, b) => (b.savedAt?.toMillis() ?? 0) - (a.savedAt?.toMillis() ?? 0)),
      );
      this.alertState.set(
        alerts.docs
          .map((item) => ({ ...(item.data() as JobAlert), id: item.id }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Save or unsave a job. Returns the new state. */
  async toggleSaved(job: Pick<Job, 'id' | 'title' | 'organizationName'>): Promise<boolean> {
    const uid = this.userId();
    if (!uid || !job.id) {
      throw new Error('Sign in to save jobs.');
    }

    const ref = doc(firestore, 'users', uid, 'savedJobs', job.id);

    if (this.isSaved(job.id)) {
      await deleteDoc(ref);
      this.savedState.update((items) => items.filter((item) => item.jobId !== job.id));
      return false;
    }

    const entry = {
      jobId: job.id,
      title: (job.title ?? '').slice(0, 200),
      organizationName: (job.organizationName ?? '').slice(0, 200),
    };
    await setDoc(ref, { ...entry, savedAt: serverTimestamp() });
    this.savedState.update((items) => [{ ...entry, savedAt: Timestamp.now() }, ...items]);
    return true;
  }

  /** Create an alert (in the first free slot) or change one. */
  async saveAlert(input: JobAlertInput, id?: string): Promise<void> {
    const uid = this.userId();
    if (!uid) {
      throw new Error('Sign in to set job alerts.');
    }

    const values = {
      keywords: input.keywords.trim().slice(0, 100),
      state: input.state.trim().toUpperCase().slice(0, 2),
      workArrangement: input.workArrangement,
      employmentType: input.employmentType,
      active: input.active,
    };

    if (id) {
      await updateDoc(doc(firestore, 'users', uid, 'jobAlerts', id), values);
      this.alertState.update((items) => items.map((item) => (item.id === id ? { ...item, ...values } : item)));
      return;
    }

    const used = new Set(this.alertState().map((item) => item.id));
    const free = JOB_ALERT_IDS.find((slot) => !used.has(slot));
    if (!free) {
      throw new Error(`You can have up to ${JOB_ALERT_IDS.length} job alerts.`);
    }

    await setDoc(doc(firestore, 'users', uid, 'jobAlerts', free), { id: free, ...values, createdAt: serverTimestamp() });
    this.alertState.update((items) =>
      [...items, { id: free, ...values, createdAt: Timestamp.now(), lastSentAt: null }].sort((a, b) => a.id.localeCompare(b.id)),
    );
  }

  async deleteAlert(id: string): Promise<void> {
    const uid = this.userId();
    if (!uid) {
      return;
    }
    await deleteDoc(doc(firestore, 'users', uid, 'jobAlerts', id));
    this.alertState.update((items) => items.filter((item) => item.id !== id));
  }
}
