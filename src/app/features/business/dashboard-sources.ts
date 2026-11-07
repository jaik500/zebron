import { inject } from '@angular/core';

import { BusinessStats, DashboardStatsService } from '../../shared/dashboards/dashboard-stats.service';
import { DashboardContext, DataSourceDefinition, NumberData, SeriesData } from '../../shared/dashboards/data-source.registry';

/**
 * Business Operations data sources for dashboards.
 *
 * Every figure comes from organizations/{id}/stats/business (one read),
 * written nightly and on request by functions/src/dashboard-stats.ts:
 * completed transactions only, every business of the organization, US
 * dollars. Managers and above (permission business.manage), the same
 * people who can open Business Operations.
 */

const APP = 'business-operations';
const PENDING = 'Figures appear after tonight’s update.';

const businessPath = (context: DashboardContext) => `${context.basePath}/business-operations`;

/** '2026-11' → 'Nov' (the month the figure belongs to, UTC). */
function monthLabel(label: string): string {
  const date = new Date(`${label}-01T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? label
    : date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
}

function statsNumber(
  key: string,
  name: string,
  pick: (stats: BusinessStats) => Omit<NumberData, 'kind'>,
): DataSourceDefinition {
  return {
    key,
    name,
    appId: APP,
    shape: 'number',
    permission: 'business.manage',
    async load(context) {
      const stats = await inject(DashboardStatsService).business(context.organizationId);
      if (!stats) return { kind: 'number', value: 0, pending: PENDING };
      return { kind: 'number', link: businessPath(context), asOf: stats.updatedAt, ...pick(stats) };
    },
  };
}

function statsSeries(
  key: string,
  name: string,
  pick: (stats: BusinessStats) => Omit<SeriesData, 'kind'>,
): DataSourceDefinition {
  return {
    key,
    name,
    appId: APP,
    shape: 'series',
    permission: 'business.manage',
    async load(context) {
      const stats = await inject(DashboardStatsService).business(context.organizationId);
      if (!stats) return { kind: 'series', points: [], pending: PENDING };
      return { kind: 'series', asOf: stats.updatedAt, ...pick(stats) };
    },
  };
}

const byMonth = (points: { label: string; value: number }[]) =>
  points.map((point) => ({ label: monthLabel(point.label), value: point.value }));

export const BUSINESS_DATA_SOURCES: DataSourceDefinition[] = [
  statsNumber('business.revenueThisMonth', 'Revenue this month', (stats) => ({
    value: stats.revenueThisMonth,
    format: 'money',
    caption: 'completed revenue transactions',
  })),
  statsNumber('business.expensesThisMonth', 'Expenses this month', (stats) => ({
    value: stats.expensesThisMonth,
    format: 'money',
    caption: 'completed expense transactions',
  })),
  statsNumber('business.netThisMonth', 'Net this month', (stats) => ({
    value: stats.netThisMonth,
    format: 'money',
    caption: stats.netThisMonth < 0 ? 'more spent than earned' : 'revenue minus expenses',
  })),
  statsNumber('business.complianceAttention', 'Compliance needing attention', (stats) => ({
    value: stats.complianceNeedsAttention,
    caption: `${stats.complianceDueSoon} due in the next 30 days, of ${stats.complianceTotal}`,
  })),

  statsSeries('business.revenueByMonth', 'Revenue by month', (stats) => ({
    points: byMonth(stats.revenueByMonth),
    format: 'money',
    highlightLast: true,
  })),
  statsSeries('business.expensesByMonth', 'Expenses by month', (stats) => ({
    points: byMonth(stats.expensesByMonth),
    format: 'money',
    highlightLast: true,
  })),
  statsSeries('business.complianceByStatus', 'Compliance by status', (stats) => ({
    points: stats.complianceByStatus,
    unit: 'requirements',
  })),
];
