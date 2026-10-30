import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { AuthService } from '../../../core/services/auth.service';
import { firestore } from '../../../core/services/firebase-config';
import { PartnerAccessService } from '../../../core/services/partner-access.service';
import { CommunityPost } from '../models/community-post.model';
import { CommunityScopeService } from './community-scope.service';

export type CommunityReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'misinformation'
  | 'other';

export const COMMUNITY_REPORT_REASONS: { value: CommunityReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'False or misleading' },
  { value: 'other', label: 'Something else' },
];

export interface CommunityReport {
  id: string;
  postId: string;
  postTitle?: string;
  organizationId: string | null;
  reason: CommunityReportReason;
  details?: string;
  reporterId: string;
  reporterName?: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt?: Timestamp;
  resolvedBy?: string;
  resolution?: string;
}

/**
 * Community reports.
 *
 * Anyone who can see a post can report it once
 * (communityReports/{uid}_{postId}). Reports go to the moderators of
 * the post's community: managers, admins and owners of the
 * organization, or Zebron platform administrators for the public
 * Community. Firestore rules enforce all of this.
 */
@Injectable({ providedIn: 'root' })
export class CommunityModerationService {
  private readonly scope = inject(CommunityScopeService);
  private readonly auth = inject(AuthService);
  private readonly access = inject(PartnerAccessService);

  /**
   * Whether the signed-in user moderates the current Community:
   * platform administrators everywhere; managers, admins and owners
   * in their organization's community.
   */
  canModerate(): boolean {
    if (this.auth.isAdmin) return true;
    return this.scope.organizationId() !== null && this.access.can('community.moderate');
  }

  async report(
    post: CommunityPost,
    reporter: { id: string; name?: string },
    reason: CommunityReportReason,
    details = '',
  ): Promise<void> {
    await setDoc(doc(firestore, 'communityReports', `${reporter.id}_${post.id}`), {
      postId: post.id,
      postTitle: (post.title ?? '').slice(0, 200),
      organizationId: post.organizationId ?? null,
      reason,
      details: details.trim().slice(0, 1000),
      reporterId: reporter.id,
      reporterName: (reporter.name ?? '').slice(0, 120),
      status: 'open',
      createdAt: serverTimestamp(),
    });
  }

  /** Open reports for the current community (moderators only). */
  async getOpenReports(): Promise<CommunityReport[]> {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'communityReports'),
        where('organizationId', '==', this.scope.organizationId()),
        where('status', '==', 'open'),
      ),
    );

    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as CommunityReport)
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }

  async resolve(reportId: string, moderatorId: string, outcome: 'resolved' | 'dismissed', resolution: string): Promise<void> {
    await updateDoc(doc(firestore, 'communityReports', reportId), {
      status: outcome,
      resolvedBy: moderatorId,
      resolvedAt: serverTimestamp(),
      resolution: resolution.slice(0, 200),
    });
  }
}
