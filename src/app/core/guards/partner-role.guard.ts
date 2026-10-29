import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import {
  PARTNER_ROLE_RANK,
  PartnerAccessService,
  PartnerRole,
} from '../services/partner-access.service';
import { PartnerOrganizationContextService } from '../services/partner-organization-context.service';

/**
 * Requires a minimum organization role for a partner route.
 *
 * Declare the role in route data:
 *
 *   data: { minimumOrganizationRole: 'org_staff' }
 *
 * The role may be declared on the route itself or on any parent.
 * Platform administrators always pass. Users below the required
 * role are sent back to their organization dashboard.
 *
 * Use after partnerOrganizationGuard. The context is initialized
 * here as well (the call is de-duplicated) because guards in the
 * same array are not guaranteed to finish in order.
 */
export const partnerRoleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const context = inject(PartnerOrganizationContextService);
  const access = inject(PartnerAccessService);
  const router = inject(Router);

  while (authService.isLoading()) {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  if (!authService.firebaseUser()) {
    return router.createUrlTree(['/login']);
  }

  const organizationId = findParam(route, 'organizationId');

  if (!organizationId) {
    return router.createUrlTree(['/partner']);
  }

  const requiredRole = findMinimumRole(route);

  // Nothing declared: fail closed rather than silently allowing.
  if (!requiredRole) {
    console.error(
      'partnerRoleGuard: route has no valid minimumOrganizationRole.',
    );

    return router.createUrlTree(['/partner/org', organizationId, 'dashboard']);
  }

  try {
    await context.initialize(organizationId);
  } catch {
    return router.createUrlTree(['/partner']);
  }

  if (context.organizationId() !== organizationId) {
    return router.createUrlTree(['/partner']);
  }

  if (access.hasMinimumRole(requiredRole)) {
    return true;
  }

  return router.createUrlTree(['/partner/org', organizationId, 'dashboard']);
};

function findParam(
  route: ActivatedRouteSnapshot,
  name: string,
): string | null {
  for (
    let current: ActivatedRouteSnapshot | null = route;
    current;
    current = current.parent
  ) {
    const value = current.paramMap.get(name)?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function findMinimumRole(
  route: ActivatedRouteSnapshot,
): PartnerRole | null {
  for (
    let current: ActivatedRouteSnapshot | null = route;
    current;
    current = current.parent
  ) {
    const value = current.data?.['minimumOrganizationRole'];

    if (typeof value === 'string' && value in PARTNER_ROLE_RANK) {
      return value as PartnerRole;
    }
  }

  return null;
}
