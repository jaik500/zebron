import { inject } from '@angular/core';

import { DashboardDataSourceRegistry, DataShape, DataSourceDefinition } from '../../shared/dashboards/data-source.registry';
import { DashboardWidgetRegistry, WidgetDefinition } from '../../shared/dashboards/widget.registry';
import { BUSINESS_DATA_SOURCES } from '../business/dashboard-sources';
import { COMMUNITY_DATA_SOURCES } from '../community/dashboard-sources';
import { LEARNING_DATA_SOURCES } from '../courses/dashboard-sources';
import { LIVE_DATA_SOURCES } from '../live/dashboard-sources';
import { PLATFORM_DATA_SOURCES } from './platform-sources';

/**
 * Registers every dashboard widget and data source. Call it (inside an
 * injection context) before showing a dashboard; repeat calls do nothing.
 *
 * Adding an app to dashboards: write its sources next to its own code
 * (features/<app>/dashboard-sources.ts) and add them to ALL_SOURCES.
 */
const ALL_SOURCES: DataSourceDefinition[] = [
  ...PLATFORM_DATA_SOURCES,
  ...LEARNING_DATA_SOURCES,
  ...LIVE_DATA_SOURCES,
  ...COMMUNITY_DATA_SOURCES,
  ...BUSINESS_DATA_SOURCES,
];

const LIMIT_SETTING = { key: 'limit', label: 'Items to show', kind: 'number' as const, defaultValue: 5, max: 8 };

function sourceOptions(shape: DataShape, exclude: string[] = []): { value: string; label: string }[] {
  return ALL_SOURCES.filter((source) => source.shape === shape && !exclude.includes(source.key)).map((source) => ({
    value: source.key,
    label: source.name,
  }));
}

function pick(key: string, fallback: string): (config: Record<string, unknown>) => string {
  return (config) => (typeof config[key] === 'string' && config[key] ? (config[key] as string) : fallback);
}

export const DASHBOARD_WIDGETS: WidgetDefinition[] = [
  {
    type: 'kpi',
    name: 'Key figure',
    description: 'One number with a short caption, such as course completion or overdue assignments.',
    icon: 'insights',
    apps: ['*'],
    sizes: ['s', 'm'],
    defaultSize: 's',
    dataSource: pick('metric', 'me.coursesCompleted'),
    settings: [
      { key: 'metric', label: 'Figure', kind: 'select', options: sourceOptions('number'), defaultValue: 'me.coursesCompleted' },
    ],
    component: () => import('../../shared/dashboards/widgets/kpi-widget.component').then((m) => m.KpiWidgetComponent),
  },
  {
    type: 'list',
    name: 'List',
    description: 'A short list with links, such as upcoming live sessions or the latest community posts.',
    icon: 'list',
    apps: ['*'],
    sizes: ['s', 'm', 'w', 'f'],
    defaultSize: 'm',
    dataSource: pick('source', 'virtualClassroom.upcomingSessions'),
    settings: [
      { key: 'source', label: 'Show', kind: 'select', options: sourceOptions('list', ['platform.apps']), defaultValue: 'virtualClassroom.upcomingSessions' },
      LIMIT_SETTING,
    ],
    component: () => import('../../shared/dashboards/widgets/list-widget.component').then((m) => m.ListWidgetComponent),
  },
  {
    type: 'progress',
    name: 'Progress',
    description: 'Progress against a target, such as assignments completed.',
    icon: 'donut_large',
    apps: ['*'],
    sizes: ['s', 'm', 'w'],
    defaultSize: 'm',
    dataSource: pick('metric', 'me.assignmentProgress'),
    settings: [
      { key: 'metric', label: 'Measure', kind: 'select', options: sourceOptions('progress'), defaultValue: 'me.assignmentProgress' },
    ],
    component: () => import('../../shared/dashboards/widgets/progress-widget.component').then((m) => m.ProgressWidgetComponent),
  },
  {
    type: 'bar-chart',
    name: 'Bar chart',
    description: 'Columns or bars, such as courses completed per week or assignments by status.',
    icon: 'bar_chart',
    apps: ['*'],
    sizes: ['m', 'w', 'f'],
    defaultSize: 'm',
    dataSource: pick('source', 'learning.completionsByWeek'),
    settings: [
      { key: 'source', label: 'Show', kind: 'select', options: sourceOptions('series'), defaultValue: 'learning.completionsByWeek' },
    ],
    component: () => import('../../shared/dashboards/widgets/bar-chart-widget.component').then((m) => m.BarChartWidgetComponent),
  },
  {
    type: 'apps',
    name: 'App shortcuts',
    description: 'Your organization’s apps, like the cards on the partner dashboard.',
    icon: 'apps',
    apps: ['*'],
    sizes: ['m', 'w', 'f'],
    defaultSize: 'f',
    dataSource: 'platform.apps',
    settings: [],
    component: () => import('../../shared/dashboards/widgets/app-shortcuts-widget.component').then((m) => m.AppShortcutsWidgetComponent),
  },
  {
    type: 'note',
    name: 'Note',
    description: 'Text you write: a welcome, an announcement or instructions.',
    icon: 'sticky_note_2',
    apps: ['*'],
    sizes: ['s', 'm', 'w', 'f'],
    defaultSize: 'm',
    settings: [{ key: 'text', label: 'Text', kind: 'textarea', max: 1000, hint: 'Up to 1,000 characters.' }],
    component: () => import('../../shared/dashboards/widgets/note-widget.component').then((m) => m.NoteWidgetComponent),
  },
  {
    type: 'live-polls',
    name: 'Live polls',
    description: 'Polls of the live session that’s on now. Hosts run them here; learners vote.',
    icon: 'poll',
    apps: ['*'],
    sizes: ['m', 'w', 'f'],
    defaultSize: 'm',
    requiresApp: 'virtual-classroom',
    settings: [],
    component: () => import('../live/live-polls-widget.component').then((m) => m.LivePollsWidgetComponent),
  },
];

/**
 * Register widgets and data sources once per app instance (server rendering
 * makes a new instance per request, so the registry itself is checked).
 * Must run in an injection context.
 */
export function setUpDashboards(): void {
  const widgets = inject(DashboardWidgetRegistry);
  if (widgets.get('kpi')) return;
  inject(DashboardDataSourceRegistry).register(...ALL_SOURCES);
  widgets.register(...DASHBOARD_WIDGETS);
}
