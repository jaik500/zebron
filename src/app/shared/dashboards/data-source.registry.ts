import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';

import { PartnerPermission, PartnerRole } from '../../core/services/partner-access.service';

/**
 * Data sources: how a widget gets its numbers, always through an app's own
 * service and with the viewer's own rights (never by reading Firestore here).
 *
 * Each app registers its sources in its own folder; the engine never imports
 * app code. Cost rules (Knowledge Center: Shared Dashboard Engine):
 *   1. Totals never come from reading every document: use a count query or
 *      the organizations/{id}/stats/{appId} summary.
 *   4. `realtime` only with a stated reason (polls).
 *   A source that would read more than 50 documents per open needs a summary.
 */

/** Who is looking, where. */
export interface DashboardContext {
  organizationId: string;
  /** The dashboard's app ('organization' for a cross-app overview). */
  appId: string;
  userId: string | null;
  role: PartnerRole | null;
  isPlatformAdmin: boolean;
  /** Base route of the organization's pages, e.g. /partner/org/abc. */
  basePath: string;
  /** Is this app switched on for the organization? (The page fills it from the organization store.) */
  isAppActive(appId: string): boolean;
  /** PartnerAccessService.can(), so shared code stays free of app imports. */
  can(permission: PartnerPermission): boolean;
  /** Bumped by the page to make widgets reload (after "Refresh" or a save). */
  revision?: number;
}

/** Shared by every kind: when the figure was computed, and why it can't be shown yet. */
interface DataMeta {
  /** For summaries: when they were last computed. */
  asOf?: Date | null;
  /** Shown instead of the figure, e.g. 'Figures appear after tonight's update.' */
  pending?: string;
}

export interface NumberData extends DataMeta {
  kind: 'number';
  value: number;
  /** e.g. '%', 'members'. */
  unit?: string;
  /** 'money': shown as US dollars (Business Operations), no unit. */
  format?: 'money';
  caption?: string;
  link?: string;
}

export interface ListData extends DataMeta {
  kind: 'list';
  items: { title: string; subtitle?: string; link?: string; icon?: string }[];
  /** "See all" link. */
  link?: string;
}

export interface ProgressData extends DataMeta {
  kind: 'progress';
  value: number;
  target: number;
  caption?: string;
  link?: string;
}

export interface SeriesData extends DataMeta {
  kind: 'series';
  points: { label: string; value: number }[];
  unit?: string;
  /** Time series: draw the latest point (e.g. this week) darker. */
  highlightLast?: boolean;
  /** 'money': values shown as US dollars. */
  format?: 'money';
}

export type WidgetData = NumberData | ListData | ProgressData | SeriesData;
export type DataShape = WidgetData['kind'];

export interface DataSourceDefinition {
  /** Unique, e.g. 'virtualClassroom.upcomingSessions'. */
  key: string;
  name: string;
  /** Must be active for the organization (checked by the widget shell). */
  appId: string;
  shape: DataShape;
  /** Hide widgets using this source from people without the permission. */
  permission?: PartnerPermission;
  /** Cost rule 4: only with a reason, e.g. 'Votes arrive during a live session'. */
  realtime?: { reason: string };
  /**
   * Fetch the data. Runs in an injection context, so `inject(SomeService)`
   * works at the top of the function (before the first await).
   */
  load(context: DashboardContext, config: Record<string, unknown>): Promise<WidgetData>;
}

/** Loaded data is kept for this long per browser tab, so moving around doesn't re-read. */
const CACHE_MS = 5 * 60_000;

@Injectable({ providedIn: 'root' })
export class DashboardDataSourceRegistry {
  private readonly injector = inject(EnvironmentInjector);
  private readonly sources = new Map<string, DataSourceDefinition>();
  private readonly cache = new Map<string, { at: number; data: Promise<WidgetData> }>();

  register(...definitions: DataSourceDefinition[]): void {
    for (const definition of definitions) {
      this.sources.set(definition.key, definition);
    }
  }

  get(key: string): DataSourceDefinition | undefined {
    return this.sources.get(key);
  }

  all(): DataSourceDefinition[] {
    return [...this.sources.values()];
  }

  /** Load through the source, sharing one request per key, organization and settings for 5 minutes. */
  load(key: string, context: DashboardContext, config: Record<string, unknown>, force = false): Promise<WidgetData> {
    const source = this.sources.get(key);
    if (!source) {
      return Promise.reject(new Error(`Unknown data source: ${key}`));
    }

    const cacheKey = [key, context.organizationId, context.userId ?? '', stableJson(config)].join('|');
    const cached = this.cache.get(cacheKey);
    if (!force && cached && Date.now() - cached.at < CACHE_MS) {
      return cached.data;
    }

    const data = runInInjectionContext(this.injector, () => source.load(context, config));
    this.cache.set(cacheKey, { at: Date.now(), data });
    // A failed load is not cached.
    data.catch(() => this.cache.delete(cacheKey));
    return data;
  }

  /** Forget cached data (after an edit that changes it). */
  clear(): void {
    this.cache.clear();
  }
}

function stableJson(value: Record<string, unknown>): string {
  return JSON.stringify(Object.keys(value).sort().map((key) => [key, value[key]]));
}
