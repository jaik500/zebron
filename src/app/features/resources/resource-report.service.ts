import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

/**
 * "Report a problem" on a resource page (resourceReports collection).
 *
 * Anyone can send a report, signed in or not; it starts "open". Only
 * platform administrators read reports and mark them resolved or
 * dismissed (Admin → Resources → Reported problems, and the panel in
 * the resource form). Reports are written by the reportResourceProblem
 * and closeResourceReport functions (functions/src/resource-reports.ts);
 * firestore.rules lets platform administrators read them.
 */

export type ResourceReportReason = 'closed' | 'phone' | 'address' | 'hours' | 'link' | 'eligibility' | 'other';
export type ResourceReportStatus = 'open' | 'resolved' | 'dismissed';

export const REPORT_REASONS: Array<{ value: ResourceReportReason; label: string }> = [
  { value: 'closed', label: 'It has closed or no longer offers this' },
  { value: 'phone', label: 'The phone number or email is wrong' },
  { value: 'address', label: 'The address is wrong' },
  { value: 'hours', label: 'The hours are wrong' },
  { value: 'link', label: 'A link does not work' },
  { value: 'eligibility', label: 'Who can use it is wrong' },
  { value: 'other', label: 'Something else' },
];

export const REPORT_DETAILS_MAX = 1000;

export interface ResourceReport {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceSlug: string;
  reason: ResourceReportReason;
  details: string;
  contactEmail: string;
  reportedBy: string | null;
  status: ResourceReportStatus;
  createdAt: Date | null;
}

export function reportReasonLabel(reason: ResourceReportReason): string {
  return REPORT_REASONS.find((item) => item.value === reason)?.label ?? 'Something else';
}

@Injectable({ providedIn: 'root' })
export class ResourceReportService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Open reports, newest first. Filled while an admin page is watching. */
  readonly openReports = signal<ResourceReport[]>([]);

  /** Open report count per resource ID. */
  readonly openCountsByResource = computed(() => {
    const counts = new Map<string, number>();
    for (const report of this.openReports()) {
      counts.set(report.resourceId, (counts.get(report.resourceId) ?? 0) + 1);
    }
    return counts;
  });

  private watchers = 0;
  private unsubscribe: (() => void) | null = null;

  /**
   * Sends a report from the public resource page. The function fills in
   * the resource's name, the sender and the time, and allows at most 10
   * reports per visitor per hour.
   */
  async submit(input: {
    resourceId: string;
    reason: ResourceReportReason;
    details: string;
    contactEmail: string;
  }): Promise<void> {
    await httpsCallable(firebaseFunctions, 'reportResourceProblem')({
      resourceId: input.resourceId,
      reason: input.reason,
      details: input.details.trim().slice(0, REPORT_DETAILS_MAX),
      contactEmail: input.contactEmail.trim().slice(0, 200),
    });
  }

  /**
   * Keeps openReports live (platform administrators only) until the
   * caller is destroyed. Several pages can watch at once.
   */
  watch(destroyRef: DestroyRef): void {
    if (!this.isBrowser) {
      return;
    }
    this.watchers += 1;
    if (!this.unsubscribe) {
      this.unsubscribe = onSnapshot(
        query(collection(firestore, 'resourceReports'), where('status', '==', 'open')),
        (snapshot) => {
          const reports = snapshot.docs.map((document) => toReport(document.id, document.data()));
          reports.sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now()));
          this.openReports.set(reports);
        },
        () => this.openReports.set([]),
      );
    }
    destroyRef.onDestroy(() => {
      this.watchers -= 1;
      if (this.watchers <= 0 && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
        this.watchers = 0;
      }
    });
  }

  /** Marks a report resolved (fixed) or dismissed (not a real problem). */
  async close(reportId: string, status: Exclude<ResourceReportStatus, 'open'>): Promise<void> {
    await httpsCallable(firebaseFunctions, 'closeResourceReport')({ reportId, status });
  }
}

function toReport(id: string, data: Record<string, unknown>): ResourceReport {
  const created = data['createdAt'];
  return {
    id,
    resourceId: String(data['resourceId'] ?? ''),
    resourceName: String(data['resourceName'] ?? ''),
    resourceSlug: String(data['resourceSlug'] ?? ''),
    reason: (data['reason'] as ResourceReportReason) ?? 'other',
    details: String(data['details'] ?? ''),
    contactEmail: String(data['contactEmail'] ?? ''),
    reportedBy: (data['reportedBy'] as string | null) ?? null,
    status: (data['status'] as ResourceReportStatus) ?? 'open',
    createdAt: created instanceof Timestamp ? created.toDate() : null,
  };
}
