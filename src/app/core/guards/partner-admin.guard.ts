import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PartnerOrganizationContextService } from '../services/partner-organization-context.service';

export const partnerAdminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const context = inject(
    PartnerOrganizationContextService,
  );
  const router = inject(Router);

  /*
   * Platform administrators have unrestricted platform access.
   */
  if (authService.isAdmin) {
    return true;
  }

  /*
   * partnerOrganizationGuard is responsible for establishing
   * and validating the organization context before this guard
   * runs.
   */
  const role = context.organizationRole();

  return role === 'org_owner' ||
    role === 'org_admin'
    ? true
    : router.createUrlTree(['/partner']);
};