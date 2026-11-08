import { ConfigurationApplication } from '../models/configuration-application.model';
import { catalogApplications, controlDetails } from './application-catalog';

/**
 * Applications in the Control Center's Settings filter. Built from the
 * application registry (see application-catalog.ts); do not list
 * applications here.
 */
export const CONFIGURATION_APPLICATIONS: ConfigurationApplication[] = catalogApplications().map(
  (application) => ({
    key: application.key,
    name: application.name,
    description: application.description,
    icon: application.icon ?? 'apps',
    enabled: application.enabled,
    keywords: controlDetails(application.key).keywords ?? [application.key, application.name.toLowerCase()],
  }),
);
