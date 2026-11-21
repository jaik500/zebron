import { Injectable } from '@angular/core';

import {
  Timestamp,
  average,
  collection,
  count,
  deleteDoc,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

/**
 * Reviews of Zebron shown on the home page (siteReviews/{uid}).
 *
 * One review per person (the document ID is their user ID). A review is
 * public only once a platform administrator approves it; every edit by
 * the author sends it back for approval (firestore.rules).
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface SiteReview {
  id: string;
  userId: string;
  displayName: string;
  /** Optional line under the name, e.g. "Bootcamp graduate". */
  about: string;
  /** 1 to 5 stars. */
  rating: number;
  text: string;
  status: ReviewStatus;
  /** Why a review was not published (shown to its author). */
  moderatorNote: string;
  reviewedAt: Timestamp | null;
  reviewedBy: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ReviewInput {
  displayName: string;
  about: string;
  rating: number;
  text: string;
}

export interface ReviewSummary {
  count: number;
  /** Average stars, or null when there are no approved reviews. */
  average: number | null;
}

/** Limits, kept in step with firestore.rules (siteReviews). */
export const REVIEW_LIMITS = { name: 60, about: 80, textMin: 20, textMax: 800, note: 300 } as const;

const COLLECTION = 'siteReviews';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly reviews = collection(firestore, COLLECTION);

  // ------------------------------------------------------------------
  // Public
  // ------------------------------------------------------------------

  /**
   * Approved reviews, most recently approved first.
   *
   * The sorted query needs the composite index (status + reviewedAt) in
   * firestore.indexes.json. While that index is missing or still building
   * (Firestore answers "failed-precondition"), the approved reviews are
   * read without sorting and sorted here, so the home page still shows them.
   */
  async listApproved(max = 30): Promise<SiteReview[]> {
    try {
      const snapshot = await getDocs(
        query(this.reviews, where('status', '==', 'approved'), orderBy('reviewedAt', 'desc'), limit(max)),
      );
      return snapshot.docs.map((document) => toReview(document.id, document.data()));
    } catch (error) {
      if ((error as { code?: string } | null)?.code !== 'failed-precondition') throw error;
      console.warn(
        '[Zebron] Reviews: the Firestore index for siteReviews (status, reviewedAt) is missing or still building. ' +
          'Deploy it with: firebase deploy --only firestore:indexes',
      );
      const snapshot = await getDocs(query(this.reviews, where('status', '==', 'approved'), limit(200)));
      return snapshot.docs
        .map((document) => toReview(document.id, document.data()))
        .sort((a, b) => (b.reviewedAt?.toMillis() ?? 0) - (a.reviewedAt?.toMillis() ?? 0))
        .slice(0, max);
    }
  }

  /** Number of approved reviews and their average rating (counted on the server). */
  async summary(): Promise<ReviewSummary> {
    const snapshot = await getAggregateFromServer(query(this.reviews, where('status', '==', 'approved')), {
      count: count(),
      average: average('rating'),
    });
    const data = snapshot.data();
    return { count: data.count, average: data.count ? data.average : null };
  }

  // ------------------------------------------------------------------
  // The signed-in person's own review
  // ------------------------------------------------------------------

  async getMine(uid: string): Promise<SiteReview | null> {
    const snapshot = await getDoc(doc(this.reviews, uid));
    return snapshot.exists() ? toReview(snapshot.id, snapshot.data()) : null;
  }

  /** Write or rewrite the person's review. It always waits for approval again. */
  async save(uid: string, input: ReviewInput, existing: SiteReview | null): Promise<void> {
    await setDoc(doc(this.reviews, uid), {
      userId: uid,
      displayName: input.displayName.trim().slice(0, REVIEW_LIMITS.name),
      about: input.about.trim().slice(0, REVIEW_LIMITS.about),
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      text: input.text.trim().slice(0, REVIEW_LIMITS.textMax),
      status: 'pending',
      moderatorNote: '',
      reviewedAt: null,
      reviewedBy: null,
      // The rules keep the original date on edits.
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteMine(uid: string): Promise<void> {
    await deleteDoc(doc(this.reviews, uid));
  }

  // ------------------------------------------------------------------
  // Platform administrators (Admin → Reviews)
  // ------------------------------------------------------------------

  async listAll(max = 500): Promise<SiteReview[]> {
    const snapshot = await getDocs(query(this.reviews, orderBy('createdAt', 'desc'), limit(max)));
    return snapshot.docs.map((document) => toReview(document.id, document.data()));
  }

  /** Approve, reject (with a note for the author) or move back to pending. */
  async decide(id: string, status: ReviewStatus, note: string, adminUid: string): Promise<void> {
    await updateDoc(doc(this.reviews, id), {
      status,
      moderatorNote: note.trim().slice(0, REVIEW_LIMITS.note),
      reviewedAt: serverTimestamp(),
      reviewedBy: adminUid,
      updatedAt: serverTimestamp(),
    });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.reviews, id));
  }
}

function toReview(id: string, data: Record<string, unknown>): SiteReview {
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const status = data['status'];
  const stamp = (value: unknown) => (value instanceof Timestamp ? value : null);
  return {
    id,
    userId: text(data['userId']) || id,
    displayName: text(data['displayName']),
    about: text(data['about']),
    rating: typeof data['rating'] === 'number' ? Math.min(5, Math.max(1, data['rating'] as number)) : 5,
    text: text(data['text']),
    status: status === 'approved' || status === 'rejected' ? status : 'pending',
    moderatorNote: text(data['moderatorNote']),
    reviewedAt: stamp(data['reviewedAt']),
    reviewedBy: typeof data['reviewedBy'] === 'string' ? (data['reviewedBy'] as string) : null,
    createdAt: stamp(data['createdAt']),
    updatedAt: stamp(data['updatedAt']),
  };
}
