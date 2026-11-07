import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';
import { PartnerRole } from '../../core/services/partner-access.service';
import {
  DASHBOARD_LIMITS,
  Dashboard,
  DashboardTemplate,
  DashboardWidget,
  MAX_WIDGETS,
  MIN_EDIT_ROLE,
  dashboardFromData,
  newWidgetId,
  roleRank,
} from './dashboard.model';

/** Someone else saved the dashboard after you opened it. */
export class DashboardConflictError extends Error {
  constructor() {
    super('Someone else saved this dashboard after you opened it. Reload to see their changes.');
    this.name = 'DashboardConflictError';
  }
}

export interface NewDashboardInput {
  name: string;
  description?: string;
  appId: string;
  template?: DashboardTemplate | null;
  viewMinRole?: PartnerRole;
  editMinRole?: PartnerRole;
}

/**
 * Dashboards of an organization: organizations/{organizationId}/dashboards.
 *
 * Reads are one-off (cost rule: listeners only for polls). Each dashboard is
 * one document, so opening one costs a single read for its layout.
 * `viewMinRank` / `editMinRank` are stored beside the role names so the
 * rules can check a list query (`viewMinRank <= my rank`).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dashboards(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'dashboards');
  }

  /** Dashboards this person may see, ordered: defaults first, then by name. */
  async list(organizationId: string, role: PartnerRole | null, isPlatformAdmin: boolean): Promise<Dashboard[]> {
    const rank = isPlatformAdmin ? 5 : roleRank(role);
    if (!rank) return [];

    const snapshot = await getDocs(
      // One range filter only, so no composite index is needed (the rules allow only shared dashboards).
      query(this.dashboards(organizationId), where('viewMinRank', '<=', rank)),
    );

    return snapshot.docs
      .map((document) => dashboardFromData(document.id, organizationId, document.data()))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
  }

  async get(organizationId: string, dashboardId: string): Promise<Dashboard | null> {
    const snapshot = await getDoc(doc(this.dashboards(organizationId), dashboardId));
    return snapshot.exists() ? dashboardFromData(snapshot.id, organizationId, snapshot.data() ?? {}) : null;
  }

  /** Create a dashboard, from a template or empty. Returns its id. */
  async create(organizationId: string, input: NewDashboardInput, userId: string): Promise<string> {
    const ref = doc(this.dashboards(organizationId));
    const widgets: DashboardWidget[] = (input.template?.widgets ?? [])
      .slice(0, MAX_WIDGETS)
      .map((widget) => ({ ...widget, id: newWidgetId(), config: { ...widget.config } }));
    const viewMinRole = input.viewMinRole ?? 'org_member';
    const editMinRole = editRoleAtLeastManager(input.editMinRole ?? MIN_EDIT_ROLE);

    await setDoc(ref, {
      organizationId,
      name: input.name.trim().slice(0, DASHBOARD_LIMITS.nameLength),
      description: (input.description ?? '').trim().slice(0, DASHBOARD_LIMITS.descriptionLength),
      appId: input.appId,
      scope: 'shared',
      ownerId: userId,
      viewMinRole,
      viewMinRank: roleRank(viewMinRole),
      editMinRole,
      editMinRank: roleRank(editMinRole),
      isDefault: false,
      widgets: widgets.map(widgetData),
      templateId: input.template?.id ?? '',
      templateVersion: input.template?.version ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return ref.id;
  }

  /**
   * Save the whole dashboard. Refused with DashboardConflictError when
   * someone else saved after `openedAt` (the updatedAt you loaded).
   */
  async save(dashboard: Dashboard, userId: string, openedAt: Date | null): Promise<void> {
    const ref = doc(this.dashboards(dashboard.organizationId), dashboard.id);
    const viewMinRole = dashboard.viewMinRole;
    const editMinRole = editRoleAtLeastManager(dashboard.editMinRole);

    await runTransaction(firestore, async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists()) {
        throw new Error('This dashboard no longer exists.');
      }

      const data = current.data() ?? {};
      const savedAt = (data['updatedAt'] as Timestamp | null | undefined)?.toMillis?.() ?? null;
      if (openedAt && savedAt !== null && savedAt !== openedAt.getTime()) {
        throw new DashboardConflictError();
      }

      transaction.set(ref, {
        organizationId: dashboard.organizationId,
        name: dashboard.name.trim().slice(0, DASHBOARD_LIMITS.nameLength),
        description: dashboard.description.trim().slice(0, DASHBOARD_LIMITS.descriptionLength),
        appId: data['appId'] ?? dashboard.appId,
        scope: 'shared',
        ownerId: data['ownerId'] ?? dashboard.ownerId,
        viewMinRole,
        viewMinRank: roleRank(viewMinRole),
        editMinRole,
        editMinRank: roleRank(editMinRole),
        isDefault: data['isDefault'] === true,
        widgets: dashboard.widgets.slice(0, MAX_WIDGETS).map(widgetData),
        templateId: data['templateId'] ?? dashboard.templateId,
        templateVersion: data['templateVersion'] ?? dashboard.templateVersion,
        createdAt: data['createdAt'] ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    });
  }

  remove(organizationId: string, dashboardId: string): Promise<void> {
    return deleteDoc(doc(this.dashboards(organizationId), dashboardId));
  }

  /** Make this the app's default (admins and owners); the previous default stops being one. */
  async setDefault(dashboard: Dashboard, others: Dashboard[], userId: string): Promise<void> {
    const batch = writeBatch(firestore);
    for (const other of others) {
      if (other.id !== dashboard.id && other.appId === dashboard.appId && other.isDefault) {
        batch.update(doc(this.dashboards(other.organizationId), other.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      }
    }
    batch.update(doc(this.dashboards(dashboard.organizationId), dashboard.id), {
      isDefault: true,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
    await batch.commit();
  }
}

function widgetData(widget: DashboardWidget): Record<string, unknown> {
  return {
    id: widget.id,
    type: widget.type,
    size: widget.size,
    title: widget.title.trim().slice(0, DASHBOARD_LIMITS.widgetTitleLength),
    config: widget.config,
  };
}

/** Shared dashboards are edited by managers and above. */
function editRoleAtLeastManager(role: PartnerRole): PartnerRole {
  return roleRank(role) >= roleRank(MIN_EDIT_ROLE) ? role : MIN_EDIT_ROLE;
}
