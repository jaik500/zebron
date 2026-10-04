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

  console.log(
    '========== PARTNER ADMIN GUARD =========='
  );

  console.log(
    'Firebase user:',
    authService.firebaseUser(),
  );

  console.log(
    'Auth profile:',
    authService.user(),
  );

  console.log(
    'Is platform admin:',
    authService.isAdmin,
  );

  console.log(
    'Context organization ID:',
    context.organizationId(),
  );

  console.log(
    'Context organization role:',
    context.organizationRole(),
  );

  console.log(
    'Context memberships:',
    context.memberships(),
  );

  console.log(
    'Context error:',
    context.error(),
  );

  /*
   * Platform administrators have unrestricted
   * organization-scoped access.
   */
  if (authService.isAdmin) {
    console.log(
      'PARTNER ADMIN GUARD: PLATFORM ADMIN ACCESS GRANTED'
    );

    return true;
  }

  /*
   * partnerOrganizationGuard is responsible for establishing
   * and validating the organization context before this guard
   * runs.
   */
  const role = context.organizationRole();

  if (
    role === 'org_owner' ||
    role === 'org_admin'
  ) {
    console.log(
      'PARTNER ADMIN GUARD: ORGANIZATION ADMIN ACCESS GRANTED',
      {
        role,
      },
    );

    return true;
  }

  console.error(
    'PARTNER ADMIN GUARD: ACCESS DENIED',
    {
      role,
      organizationId:
        context.organizationId(),
    },
  );

  return router.createUrlTree([
    '/partner',
  ]);
};