import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

/**
 * Likes and content reports for Knowledge Center articles.
 *
 * - Likes: knowledgeLikes/{articleKey}_{uid}, one per person per article.
 * - Reports: knowledgeReports/{uid}_{articleKey}, one per person per
 *   article; reviewed by the organization's staff (organization articles)
 *   or Zebron platform administrators (Zebron articles).
 *
 * organizationId is null for Zebron articles, so every query can filter
 * on it and the Firestore rules can check membership.
 */

export type KnowledgeFeedbackSource = 'organization' | 'zebron';

export interface KnowledgeArticleRef {
  source: KnowledgeFeedbackSource;
  /** The organization that owns the article (organization source only). */
  organizationId: string | null;
  articleId: string;
}

export type KnowledgeReportReason =
  | 'incorrect'
  | 'outdated'
  | 'inappropriate'
  | 'spam'
  | 'broken'
  | 'other';

export const KNOWLEDGE_REPORT_REASONS: ReadonlyArray<{ value: KnowledgeReportReason; label: string }> = [
  { value: 'incorrect', label: 'Incorrect or misleading information' },
  { value: 'outdated', label: 'Out of date' },
  { value: 'inappropriate', label: 'Offensive or inappropriate' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'broken', label: 'Broken links or formatting' },
  { value: 'other', label: 'Something else' },
];

export interface KnowledgeReport {
  id: string;
  articleKey: string;
  articleId: string;
  articleTitle: string;
  source: KnowledgeFeedbackSource;
  organizationId: string | null;
  reason: KnowledgeReportReason;
  details: string;
  reporterId: string;
  reporterName: string;
  status: 'open' | 'resolved';
}

@Injectable({ providedIn: 'root' })
export class KnowledgeFeedbackService {
  /** Stable key for an article across both sources. */
  articleKey(ref: KnowledgeArticleRef): string {
    return ref.source === 'organization'
      ? `org_${ref.organizationId}_${ref.articleId}`
      : `zebron_${ref.articleId}`;
  }

  private ownerOf(ref: KnowledgeArticleRef): string | null {
    return ref.source === 'organization' ? ref.organizationId : null;
  }

  // ===========================================================
  // Likes
  // ===========================================================

  async likeCount(ref: KnowledgeArticleRef): Promise<number> {
    const snapshot = await getCountFromServer(
      query(
        collection(firestore, 'knowledgeLikes'),
        where('articleKey', '==', this.articleKey(ref)),
        where('organizationId', '==', this.ownerOf(ref)),
      ),
    );
    return snapshot.data().count;
  }

  async hasLiked(ref: KnowledgeArticleRef, uid: string): Promise<boolean> {
    const snapshot = await getDoc(doc(firestore, 'knowledgeLikes', `${this.articleKey(ref)}_${uid}`));
    return snapshot.exists();
  }

  async like(ref: KnowledgeArticleRef, uid: string): Promise<void> {
    await setDoc(doc(firestore, 'knowledgeLikes', `${this.articleKey(ref)}_${uid}`), {
      articleKey: this.articleKey(ref),
      articleId: ref.articleId,
      source: ref.source,
      organizationId: this.ownerOf(ref),
      userId: uid,
      createdAt: serverTimestamp(),
    });
  }

  async unlike(ref: KnowledgeArticleRef, uid: string): Promise<void> {
    await deleteDoc(doc(firestore, 'knowledgeLikes', `${this.articleKey(ref)}_${uid}`));
  }

  // ===========================================================
  // Reports
  // ===========================================================

  async hasReported(ref: KnowledgeArticleRef, uid: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(firestore, 'knowledgeReports', `${uid}_${this.articleKey(ref)}`));
      return snapshot.exists();
    } catch {
      return false;
    }
  }

  async report(
    ref: KnowledgeArticleRef,
    input: { uid: string; reporterName: string; articleTitle: string; reason: KnowledgeReportReason; details: string },
  ): Promise<void> {
    await setDoc(doc(firestore, 'knowledgeReports', `${input.uid}_${this.articleKey(ref)}`), {
      articleKey: this.articleKey(ref),
      articleId: ref.articleId,
      articleTitle: input.articleTitle.slice(0, 200),
      source: ref.source,
      organizationId: this.ownerOf(ref),
      reason: input.reason,
      details: input.details.trim().slice(0, 1000),
      reporterId: input.uid,
      reporterName: input.reporterName.slice(0, 120),
      status: 'open',
      createdAt: serverTimestamp(),
    });
  }

  /** Open reports for an organization's articles, or Zebron's (null). */
  async openReports(organizationId: string | null): Promise<KnowledgeReport[]> {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'knowledgeReports'),
        where('organizationId', '==', organizationId),
        where('status', '==', 'open'),
      ),
    );
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        articleKey: String(data['articleKey'] ?? ''),
        articleId: String(data['articleId'] ?? ''),
        articleTitle: String(data['articleTitle'] ?? ''),
        source: data['source'] === 'organization' ? 'organization' : 'zebron',
        organizationId: typeof data['organizationId'] === 'string' ? data['organizationId'] : null,
        reason: (data['reason'] ?? 'other') as KnowledgeReportReason,
        details: String(data['details'] ?? ''),
        reporterId: String(data['reporterId'] ?? ''),
        reporterName: String(data['reporterName'] ?? ''),
        status: data['status'] === 'resolved' ? 'resolved' : 'open',
      } satisfies KnowledgeReport;
    });
  }

  async resolveReport(reportId: string, uid: string): Promise<void> {
    await updateDoc(doc(firestore, 'knowledgeReports', reportId), {
      status: 'resolved',
      resolvedBy: uid,
      resolvedAt: serverTimestamp(),
    });
  }

  reasonLabel(reason: KnowledgeReportReason): string {
    return KNOWLEDGE_REPORT_REASONS.find((item) => item.value === reason)?.label ?? 'Something else';
  }
}
