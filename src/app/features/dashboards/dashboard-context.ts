import { Signal, computed, inject } from '@angular/core';

import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { AuthService } from '../../core/services/auth.service';
import { PartnerAccessService, PartnerPermission } from '../../core/services/partner-access.service';
import { DashboardContext } from '../../shared/dashboards/data-source.registry';
import { OrganizationContextStore } from '../organizations/stores/organization-context.store';

/**
 * The context dashboard widgets run in: who is looking, in which
 * organization, which apps are switched on and what they may do.
 * Used by the dashboards page and the partner dashboard. Call it in an
 * injection context (a field initialiser or constructor).
 */
export function injectDashboardContext(
  organizationId: () => string,
  appId: () => string,
  revision: () => number = () => 0,
): Signal<DashboardContext> {
  const auth = inject(AuthService);
  const access = inject(PartnerAccessService);
  const organizationStore = inject(OrganizationContextStore);
  const applications = inject(ApplicationRegistryService);

  /**
   * Same rule as the partner dashboard's app cards: a parent app (Learning)
   * has no entitlement of its own and is active while any capability is.
   */
  const isAppActive = (id: string): boolean => {
    const capabilities = applications.getEnabledApplications().filter((application) => application.parent === id);
    return capabilities.length > 0
      ? capabilities.some((application) => organizationStore.hasActiveApplication(application.id))
      : organizationStore.hasActiveApplication(id);
  };

  return computed<DashboardContext>(() => ({
    organizationId: organizationId(),
    appId: appId(),
    userId: auth.firebaseUser()?.uid ?? null,
    role: access.role(),
    isPlatformAdmin: access.isPlatformAdmin(),
    basePath: `/partner/org/${encodeURIComponent(organizationId())}`,
    isAppActive,
    can: (permission: PartnerPermission) => access.can(permission),
    revision: revision(),
  }));
}
