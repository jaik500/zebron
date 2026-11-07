import { Injectable, InputSignal, Type } from '@angular/core';

import { PartnerPermission } from '../../core/services/partner-access.service';
import { DashboardContext, WidgetData } from './data-source.registry';
import { DashboardWidget, WidgetSize } from './dashboard.model';

/**
 * Widgets: what can be placed on a dashboard. A widget only draws; the
 * shared card (widget-card.component.ts) loads its data, shows loading,
 * empty and no-access states, and applies the phone layout rules.
 */

/** One field in a widget's settings panel. */
export interface WidgetSetting {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  max?: number;
  hint?: string;
}

/** Inputs every widget component receives. */
export interface DashboardWidgetComponent {
  widget: InputSignal<DashboardWidget>;
  context: InputSignal<DashboardContext>;
  /** null for widgets without a data source. */
  data: InputSignal<WidgetData | null>;
}

export interface WidgetDefinition {
  /** Stored in the dashboard's widgets list, e.g. 'kpi'. */
  type: string;
  name: string;
  description: string;
  /** Material icon for the add-widget panel. */
  icon: string;
  /** Apps whose dashboards can hold it; '*' = any. */
  apps: string[];
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  /**
   * Data source key, or a function of the widget's settings (a KPI widget
   * shows whichever figure was picked). Omit for static widgets.
   */
  dataSource?: string | ((config: Record<string, unknown>) => string | null);
  settings: WidgetSetting[];
  /** For widgets that load their own data: the app that must be active (e.g. 'virtual-classroom'). */
  requiresApp?: string;
  /** Hidden from people without it (Firestore rules remain the boundary). */
  permission?: PartnerPermission;
  /** Lazy-loaded so a dashboard only downloads the widgets it shows. */
  component: () => Promise<Type<unknown>>;
}

/** Apps that are always available (not provisioned per organization). */
export const ALWAYS_ON = new Set(['platform', 'organization', 'core']);

@Injectable({ providedIn: 'root' })
export class DashboardWidgetRegistry {
  private readonly widgets = new Map<string, WidgetDefinition>();

  register(...definitions: WidgetDefinition[]): void {
    for (const definition of definitions) {
      this.widgets.set(definition.type, definition);
    }
  }

  get(type: string): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }

  all(): WidgetDefinition[] {
    return [...this.widgets.values()];
  }

  /** Widgets that can go on a dashboard of this app. */
  availableFor(appId: string): WidgetDefinition[] {
    return this.all().filter((widget) => widget.apps.includes('*') || widget.apps.includes(appId));
  }

  /** Data source key for a placed widget, if it has one. */
  dataSourceOf(widget: DashboardWidget): string | null {
    const source = this.widgets.get(widget.type)?.dataSource;
    if (!source) return null;
    return typeof source === 'function' ? source(widget.config) : source;
  }

  /**
   * Whether a placed widget is usable by this viewer: its widget and data
   * source exist, they have the permissions, and the app is switched on.
   * View mode hides the rest; edit mode shows them with their reason.
   */
  isUsable(widget: DashboardWidget, context: DashboardContext, sources: { get(key: string): { appId: string; permission?: PartnerPermission } | undefined }): boolean {
    const definition = this.widgets.get(widget.type);
    if (!definition) return false;
    if (definition.permission && !context.can(definition.permission)) return false;
    if (definition.requiresApp && !ALWAYS_ON.has(definition.requiresApp) && !context.isAppActive(definition.requiresApp)) return false;
    const key = this.dataSourceOf(widget);
    if (!key) return true;
    const source = sources.get(key);
    if (!source) return false;
    if (source.permission && !context.can(source.permission)) return false;
    return ALWAYS_ON.has(source.appId) || context.isAppActive(source.appId);
  }

  /** Settings with their defaults filled in. */
  configWithDefaults(type: string, config: Record<string, unknown>): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    for (const setting of this.widgets.get(type)?.settings ?? []) {
      if (setting.defaultValue !== undefined) merged[setting.key] = setting.defaultValue;
    }
    return { ...merged, ...config };
  }
}
