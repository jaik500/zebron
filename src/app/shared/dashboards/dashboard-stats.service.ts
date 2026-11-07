import { Injectable } from '@angular/core';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

/**
 * Org-wide summaries for dashboards: organizations/{organizationId}/stats/{appId}.
 *
 * Written only by Cloud Functions (functions/src/dashboard-stats.ts): nightly,
 * and on request by managers. Reading one costs a single document read,
 * whatever the organization's size (cost rule 1). Managers and above can read
 * them, the same people who can open Team progress.
 */

export interface LearningStats {
  members: number;
  coursesPublished: number;
  /** Members with at least one course started in this organization's courses. */
  learnersStarted: number;
  /** Members with course activity in the last 7 days. */
  activeLast7Days: number;
  coursesStarted: number;
  coursesCompleted: number;
  /** coursesCompleted / coursesStarted, 0–100. */
  completionPercent: number;
  certificates: number;
  assignments: number;
  assignmentsCompleted: number;
  overdueAssignments: number;
  /** Completed courses per week, oldest first (8 weeks; label = Monday, YYYY-MM-DD). */
  completionsByWeek: { label: string; value: number }[];
  /** Completed courses per course, most first (top 8). */
  completionsByCourse: { label: string; value: number }[];
  updatedAt: Date | null;
}

/** Business Operations figures (organizations/{id}/stats/business), US dollars. */
export interface BusinessStats {
  revenueThisMonth: number;
  expensesThisMonth: number;
  /** Revenue minus expenses this month; can be negative. */
  netThisMonth: number;
  /** Completed transactions per month, oldest first (6 months; label = YYYY-MM). */
  revenueByMonth: { label: string; value: number }[];
  expensesByMonth: { label: string; value: number }[];
  /** Compliance requirements per status (Current, Upcoming, Action required, Overdue, Expired). */
  complianceByStatus: { label: string; value: number }[];
  /** Action required, overdue or expired. */
  complianceNeedsAttention: number;
  /** Due in the next 30 days. */
  complianceDueSoon: number;
  complianceTotal: number;
  updatedAt: Date | null;
}

/** Summaries that can be refreshed on request. */
export type StatsAppId = 'learning' | 'business';

/** Stats this old or older can be refreshed on request. */
export const STATS_REFRESH_AFTER_MS = 10 * 60_000;

@Injectable({ providedIn: 'root' })
export class DashboardStatsService {
  private readonly cache = new Map<string, Promise<LearningStats | null>>();
  private readonly businessCache = new Map<string, Promise<BusinessStats | null>>();

  /** The learning summary, or null when it hasn't been computed yet. One read per browser tab. */
  learning(organizationId: string, force = false): Promise<LearningStats | null> {
    const key = `${organizationId}|learning`;
    if (!force && this.cache.has(key)) return this.cache.get(key)!;

    const loaded = getDoc(doc(firestore, 'organizations', organizationId, 'stats', 'learning')).then((snapshot) =>
      snapshot.exists() ? learningFromData(snapshot.data() ?? {}) : null,
    );
    this.cache.set(key, loaded);
    loaded.catch(() => this.cache.delete(key));
    return loaded;
  }

  /** The Business Operations summary, or null when it hasn't been computed yet. One read per browser tab. */
  business(organizationId: string, force = false): Promise<BusinessStats | null> {
    if (!force && this.businessCache.has(organizationId)) return this.businessCache.get(organizationId)!;

    const loaded = getDoc(doc(firestore, 'organizations', organizationId, 'stats', 'business')).then((snapshot) =>
      snapshot.exists() ? businessFromData(snapshot.data() ?? {}) : null,
    );
    this.businessCache.set(organizationId, loaded);
    loaded.catch(() => this.businessCache.delete(organizationId));
    return loaded;
  }

  /** Recompute now (managers and above; the server skips it if the summary is under 10 minutes old). */
  async refresh(organizationId: string, appId: StatsAppId): Promise<void> {
    const callable = httpsCallable<{ organizationId: string; appId: string }, { refreshed: boolean }>(
      firebaseFunctions,
      'refreshOrganizationStats',
    );
    await callable({ organizationId, appId });
    if (appId === 'business') {
      await this.business(organizationId, true);
    } else {
      await this.learning(organizationId, true);
    }
  }

  async refreshLearning(organizationId: string): Promise<LearningStats | null> {
    await this.refresh(organizationId, 'learning');
    return this.learning(organizationId);
  }
}

function series(value: unknown): { label: string; value: number }[] {
  return Array.isArray(value)
    ? value
        .map((item) => (item ?? {}) as Record<string, unknown>)
        .filter((item) => typeof item['label'] === 'string')
        .map((item) => ({ label: String(item['label']), value: Math.max(0, Number(item['value']) || 0) }))
        .slice(0, 12)
    : [];
}

function businessFromData(data: Record<string, unknown>): BusinessStats {
  const money = (key: string) => {
    const value = Number(data[key]);
    return Number.isFinite(value) ? value : 0;
  };
  const count = (key: string) => Math.max(0, Number(data[key]) || 0);
  return {
    revenueThisMonth: Math.max(0, money('revenueThisMonth')),
    expensesThisMonth: Math.max(0, money('expensesThisMonth')),
    netThisMonth: money('netThisMonth'),
    revenueByMonth: series(data['revenueByMonth']),
    expensesByMonth: series(data['expensesByMonth']),
    complianceByStatus: series(data['complianceByStatus']),
    complianceNeedsAttention: count('complianceNeedsAttention'),
    complianceDueSoon: count('complianceDueSoon'),
    complianceTotal: count('complianceTotal'),
    updatedAt: (data['updatedAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
  };
}

function learningFromData(data: Record<string, unknown>): LearningStats {
  const number = (key: string) => Math.max(0, Number(data[key]) || 0);
  return {
    members: number('members'),
    coursesPublished: number('coursesPublished'),
    learnersStarted: number('learnersStarted'),
    activeLast7Days: number('activeLast7Days'),
    coursesStarted: number('coursesStarted'),
    coursesCompleted: number('coursesCompleted'),
    completionPercent: Math.min(100, number('completionPercent')),
    certificates: number('certificates'),
    assignments: number('assignments'),
    assignmentsCompleted: number('assignmentsCompleted'),
    overdueAssignments: number('overdueAssignments'),
    completionsByWeek: series(data['completionsByWeek']),
    completionsByCourse: series(data['completionsByCourse']),
    updatedAt: (data['updatedAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
  };
}
