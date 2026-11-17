import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  collection,
  deleteDoc,
  doc,
  FirestoreError,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { AuthService } from '../../core/services/auth.service';
import { firestore } from '../../core/services/firebase-config';

/**
 * The signed-in person's learning updates (users/{uid}/notifications),
 * written by Cloud Functions (functions/src/learner-notifications.ts):
 * courses assigned, assignments published, work reviewed, due dates.
 * One live listener while signed in feeds the header bell and the
 * /notifications page.
 */

export type LearnerNotificationKind =
  | 'course_assigned'
  | 'assignment_published'
  | 'work_reviewed'
  | 'project_reviewed'
  | 'due_soon'
  | 'overdue';

export interface LearnerNotification {
  id: string;
  kind: LearnerNotificationKind;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: Date | null;
}

export const NOTIFICATION_KINDS: Record<LearnerNotificationKind, { icon: string; classes: string }> = {
  course_assigned: { icon: 'school', classes: 'bg-teal-50 text-[#007979]' },
  assignment_published: { icon: 'assignment', classes: 'bg-sky-50 text-sky-700' },
  work_reviewed: { icon: 'rate_review', classes: 'bg-violet-50 text-violet-700' },
  project_reviewed: { icon: 'verified', classes: 'bg-emerald-50 text-emerald-700' },
  due_soon: { icon: 'schedule', classes: 'bg-amber-50 text-amber-700' },
  overdue: { icon: 'warning', classes: 'bg-rose-50 text-rose-700' },
};

/** Newest updates kept in the list; older ones are still in Firestore. */
const LIST_SIZE = 40;

function toNotification(id: string, data: Record<string, unknown>): LearnerNotification {
  const kind = data['kind'] as LearnerNotificationKind;
  const link = typeof data['link'] === 'string' ? data['link'] : '';
  return {
    id,
    kind: kind in NOTIFICATION_KINDS ? kind : 'course_assigned',
    title: typeof data['title'] === 'string' ? data['title'] : '',
    body: typeof data['body'] === 'string' ? data['body'] : '',
    // In-app paths only.
    link: link.startsWith('/') && !link.startsWith('//') ? link : '/notifications',
    read: data['read'] === true,
    createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : null,
  };
}

@Injectable({ providedIn: 'root' })
export class LearnerNotificationService {
  private readonly auth = inject(AuthService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly items = signal<LearnerNotification[]>([]);
  readonly loaded = signal(false);
  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);

  private readonly uid = computed(() => this.auth.firebaseUser()?.uid ?? null);
  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (!this.browser) return;
    effect(() => {
      const uid = this.uid();
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.items.set([]);
      this.loaded.set(false);
      if (!uid) return;
      this.unsubscribe = onSnapshot(
        query(collection(firestore, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(LIST_SIZE)),
        (snapshot: QuerySnapshot) => {
          this.items.set(snapshot.docs.map((item) => toNotification(item.id, item.data())));
          this.loaded.set(true);
        },
        (error: FirestoreError) => {
          console.warn('[Notifications] Could not load updates', error);
          this.loaded.set(true);
        },
      );
    });
  }

  async markRead(item: LearnerNotification): Promise<void> {
    const uid = this.uid();
    if (!uid || item.read) return;
    await updateDoc(doc(firestore, 'users', uid, 'notifications', item.id), { read: true });
  }

  async markAllRead(): Promise<void> {
    const uid = this.uid();
    const unread = this.items().filter((item) => !item.read);
    if (!uid || !unread.length) return;
    const batch = writeBatch(firestore);
    unread.forEach((item) => batch.update(doc(firestore, 'users', uid, 'notifications', item.id), { read: true }));
    await batch.commit();
  }

  async remove(item: LearnerNotification): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await deleteDoc(doc(firestore, 'users', uid, 'notifications', item.id));
  }

  /** The daily learning summary email: on unless the learner turned it off. */
  async emailsEnabled(): Promise<boolean> {
    const uid = this.uid();
    if (!uid) return false;
    const snapshot = await getDoc(doc(firestore, 'users', uid, 'preferences', 'notifications'));
    return snapshot.data()?.['learningEmails'] !== false;
  }

  async setEmailsEnabled(enabled: boolean): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'preferences', 'notifications'), { learningEmails: enabled, updatedAt: serverTimestamp() });
  }
}
