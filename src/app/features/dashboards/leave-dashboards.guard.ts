import { CanDeactivateFn } from '@angular/router';

import type { DashboardsPageComponent } from './dashboards-page.component';

/** Ask before leaving the dashboard builder with unsaved changes. */
export const leaveDashboardsGuard: CanDeactivateFn<DashboardsPageComponent> = (component) =>
  component?.canLeave?.() ?? true;
