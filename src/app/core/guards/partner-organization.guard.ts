import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PartnerOrganizationContextService } from '../services/partner-organization-context.service';

export const partnerOrganizationGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const context = inject(
    PartnerOrganizationContextService,
  );
  const router = inject(Router);

  /*
   * The organization ID must come from the organization-scoped
   * route. Never allow the context to silently select a different
   * organization for an organization-scoped route.
   */
  const organizationId =
    route.paramMap.get('organizationId')?.trim();

  if (!organizationId) {
    return router.createUrlTree(['/partner']);
  }

  /*
   * Platform administrators can access any organization.
   *
   * We still initialize the context with the route organization
   * so the Partner Portal operates against the organization that
   * was explicitly requested in the URL.
   */
  try {
    await context.initialize(organizationId);

    /*
     * initialize() validates organization membership for
     * organization-scoped users and permits platform admins.
     */
    if (context.organizationId() !== organizationId) {
      /*
       * This protects against a context mismatch where the
       * requested organization was not actually selected.
       */
      return router.createUrlTree(['/partner']);
    }

    /*
     * Platform administrators and active organization members
     * are allowed through this tenant boundary.
     */
    if (authService.isAdmin) {
      return true;
    }

    if (context.organizationId() === organizationId) {
      return true;
    }

    return router.createUrlTree(['/partner']);
  } catch {
    return router.createUrlTree(['/partner']);
  }
};