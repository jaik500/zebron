import { inject } from '@angular/core';

import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { DataSourceDefinition, ListData } from '../../shared/dashboards/data-source.registry';

/**
 * Platform data sources: the organization's active apps, the same cards as
 * today's partner dashboard. No Firestore reads: the catalogue is in code
 * and app activation comes from the organization store via the context.
 */
export const PLATFORM_DATA_SOURCES: DataSourceDefinition[] = [
  {
    key: 'platform.apps',
    name: 'Your organization’s apps',
    appId: 'platform',
    shape: 'list',
    async load(context): Promise<ListData> {
      const registry = inject(ApplicationRegistryService);
      const apps = registry
        .getEnabledApplications()
        .filter((application) => application.requiresOrganization && application.route.includes(':organizationId'))
        // Capabilities (Courses, Test Center) open through their parent; the mailbox lives under Administration.
        .filter((application) => !application.parent && application.id !== 'mailbox')
        .filter((application) => context.isAppActive(application.id));

      return {
        kind: 'list',
        items: apps.map((application) => ({
          title: application.name,
          subtitle: application.description,
          link: application.route.replace(':organizationId', encodeURIComponent(context.organizationId)),
          icon: application.icon ?? 'apps',
        })),
      };
    },
  },
];
