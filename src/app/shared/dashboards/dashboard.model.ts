import { Timestamp } from 'firebase/firestore';

import { PARTNER_ROLE_RANK, PartnerPermission, PartnerRole } from '../../core/services/partner-access.service';

/**
 * Shared Dashboard Engine: one dashboard model for every Zebron app.
 *
 *   organizations/{organizationId}/dashboards/{dashboardId}   layout + widget settings (never data)
 *   organizations/{organizationId}/stats/{appId}              small summaries written by Cloud Functions
 *
 * Widgets load their data through each app's own services, with the
 * viewer's own rights, so sharing a dashboard never shares data.
 * See the Knowledge Center article "Shared Dashboard Engine: architecture".
 */

/** Width on a 12-column grid: s = 3, m = 6, w = 9, f = 12. Phones stack every widget full width. */
export type WidgetSize = 's' | 'm' | 'w' | 'f';

export const WIDGET_SIZES: Record<WidgetSize, { label: string; columns: number }> = {
  s: { label: 'Small', columns: 3 },
  m: { label: 'Medium', columns: 6 },
  w: { label: 'Wide', columns: 9 },
  f: { label: 'Full width', columns: 12 },
};

/** Cost rule 3: at most 12 widgets per dashboard. */
export const MAX_WIDGETS = 12;

export const DASHBOARD_LIMITS = {
  nameLength: 80,
  descriptionLength: 300,
  widgetTitleLength: 80,
} as const;

/** Lowest role that may edit a shared dashboard. */
export const MIN_EDIT_ROLE: PartnerRole = 'org_manager';

export interface DashboardWidget {
  /** Unique within the dashboard. */
  id: string;
  /** Key into the widget registry. */
  type: string;
  size: WidgetSize;
  /** Optional heading; the widget's own name is shown when empty. */
  title: string;
  /** Settings from the widget's settings form. */
  config: Record<string, unknown>;
}

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  /** An application id from the catalogue, or 'organization' for a cross-app overview. */
  appId: string;
  /** Personal dashboards come later; only 'shared' is accepted today. */
  scope: 'shared';
  ownerId: string;
  viewMinRole: PartnerRole;
  editMinRole: PartnerRole;
  /** The dashboard shown first for its app (admins and owners set it). */
  isDefault: boolean;
  widgets: DashboardWidget[];
  templateId: string;
  templateVersion: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  updatedBy: string;
}

/** A built-in starter dashboard for an app, kept in code (see dashboard-templates.ts). */
export interface DashboardTemplate {
  id: string;
  version: number;
  name: string;
  description: string;
  appId: string;
  /** Offered only when this app is active for the organization. */
  requiresApp?: string;
  /** Offered only to people with this permission. */
  permission?: PartnerPermission;
  widgets: Omit<DashboardWidget, 'id'>[];
}

export const ORGANIZATION_APP_ID = 'organization';

export function roleRank(role: PartnerRole | null | undefined): number {
  return role ? PARTNER_ROLE_RANK[role] ?? 0 : 0;
}

export function isPartnerRole(value: unknown): value is PartnerRole {
  return typeof value === 'string' && value in PARTNER_ROLE_RANK;
}

/** Who sees / edits. Firestore rules enforce the same; this only tidies the UI. */
export function canViewDashboard(dashboard: Dashboard, role: PartnerRole | null, isPlatformAdmin: boolean): boolean {
  return isPlatformAdmin || roleRank(role) >= roleRank(dashboard.viewMinRole);
}

export function canEditDashboard(dashboard: Dashboard, role: PartnerRole | null, isPlatformAdmin: boolean): boolean {
  return isPlatformAdmin || roleRank(role) >= Math.max(roleRank(dashboard.editMinRole), roleRank(MIN_EDIT_ROLE));
}

export function newWidgetId(): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (value) => value.toString(36).padStart(2, '0')).join('');
  return `w_${random}`.slice(0, 16);
}

export function isWidgetSize(value: unknown): value is WidgetSize {
  return value === 's' || value === 'm' || value === 'w' || value === 'f';
}

/** Problems that stop a dashboard being saved (empty = ready). */
export function dashboardProblems(dashboard: Pick<Dashboard, 'name' | 'widgets'>): string[] {
  const problems: string[] = [];
  if (!dashboard.name.trim()) problems.push('Give the dashboard a name.');
  if (dashboard.widgets.length > MAX_WIDGETS) problems.push(`A dashboard can hold up to ${MAX_WIDGETS} widgets.`);
  return problems;
}

/** Map a Firestore document to a Dashboard (missing fields get safe defaults). */
export function dashboardFromData(id: string, organizationId: string, data: Record<string, unknown>): Dashboard {
  const widgets = Array.isArray(data['widgets'])
    ? (data['widgets'] as unknown[])
        .map((raw): DashboardWidget | null => {
          const value = (raw ?? {}) as Record<string, unknown>;
          const widgetId = text(value['id']);
          const type = text(value['type']);
          if (!widgetId || !type) return null;
          return {
            id: widgetId,
            type,
            size: isWidgetSize(value['size']) ? value['size'] : 'm',
            title: text(value['title']),
            config: value['config'] && typeof value['config'] === 'object' ? { ...(value['config'] as Record<string, unknown>) } : {},
          };
        })
        .filter((widget): widget is DashboardWidget => !!widget)
        .slice(0, MAX_WIDGETS)
    : [];

  return {
    id,
    organizationId,
    name: text(data['name']) || 'Dashboard',
    description: text(data['description']),
    appId: text(data['appId']) || ORGANIZATION_APP_ID,
    scope: 'shared',
    ownerId: text(data['ownerId']),
    viewMinRole: isPartnerRole(data['viewMinRole']) ? data['viewMinRole'] : 'org_member',
    editMinRole: isPartnerRole(data['editMinRole']) ? data['editMinRole'] : MIN_EDIT_ROLE,
    isDefault: data['isDefault'] === true,
    widgets,
    templateId: text(data['templateId']),
    templateVersion: Number(data['templateVersion'] ?? 0) || 0,
    createdAt: (data['createdAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
    updatedAt: (data['updatedAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
    updatedBy: text(data['updatedBy']),
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
