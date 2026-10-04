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

  /*
   * Firebase Auth may still be restoring the persisted
   * authentication session during a hard browser refresh.
   */
  while (authService.isLoading()) {
    await new Promise((resolve) =>
      setTimeout(resolve, 50),
    );
  }

  console.log(
    '========== PARTNER ORGANIZATION GUARD ==========',
  );

  console.log(
    'Requested organization:',
    organizationId,
  );

  if (!organizationId) {
    console.error(
      'PARTNER ORGANIZATION GUARD: NO ORGANIZATION ID',
    );

    return router.createUrlTree(['/partner']);
  }

  try {
    /*
     * Establish the requested organization context before
     * performing any organization-level authorization.
     */
    await context.initialize(
      organizationId,
    );

    console.log(
      'PARTNER ORGANIZATION GUARD: CONTEXT INITIALIZED',
      {
        requestedOrganizationId:
          organizationId,

        contextOrganizationId:
          context.organizationId(),

        organizationRole:
          context.organizationRole(),

        isPlatformAdmin:
          context.isPlatformAdmin(),

        memberships:
          context.memberships(),

        organizations:
          context.organizations(),

        contextError:
          context.error(),
      },
    );

    /*
     * The requested organization must be the organization
     * actually established in the context.
     */
    if (
      context.organizationId() !==
      organizationId
    ) {
      console.error(
        'PARTNER ORGANIZATION GUARD: CONTEXT MISMATCH',
        {
          requestedOrganizationId:
            organizationId,

          actualContextOrganizationId:
            context.organizationId(),
        },
      );

      return router.createUrlTree([
        '/partner',
      ]);
    }

    /*
     * Platform administrators have unrestricted
     * organization-scoped access.
     */
    if (authService.isAdmin) {
      console.log(
        'PARTNER ORGANIZATION GUARD: PLATFORM ADMIN ACCESS GRANTED',
      );

      return true;
    }

    /*
     * Some organization-scoped routes require an
     * organization owner/admin.
     *
     * This check is intentionally performed here,
     * AFTER the organization context has been initialized.
     */
    const organizationAdminOnly =
      route.data?.['organizationAdminOnly'] === true;

    if (organizationAdminOnly) {
      const role =
        context.organizationRole();

      if (
        role !== 'org_owner' &&
        role !== 'org_admin'
      ) {
        console.error(
          'PARTNER ORGANIZATION GUARD: ORGANIZATION ADMIN ACCESS DENIED',
          {
            organizationId,
            role,
          },
        );

        return router.createUrlTree([
          '/partner',
        ]);
      }

      console.log(
        'PARTNER ORGANIZATION GUARD: ORGANIZATION ADMIN ACCESS GRANTED',
        {
          organizationId,
          role,
        },
      );
    }

    console.log(
      'PARTNER ORGANIZATION GUARD: ORGANIZATION ACCESS GRANTED',
      {
        organizationId,
        role:
          context.organizationRole(),
      },
    );

    return true;
  } catch (error) {
    console.error(
      '========== PARTNER ORGANIZATION GUARD FAILED ==========',
    );

    console.error(
      'Error:',
      error,
    );

    console.error(
      'Organization ID:',
      organizationId,
    );

    console.error(
      'Context organization ID:',
      context.organizationId(),
    );

    console.error(
      'Context role:',
      context.organizationRole(),
    );

    console.error(
      'Context error:',
      context.error(),
    );

    console.error(
      'Is platform admin:',
      context.isPlatformAdmin(),
    );

    console.error(
      'Memberships:',
      context.memberships(),
    );

    console.error(
      'Organizations:',
      context.organizations(),
    );

    console.error(
      'Firebase user:',
      authService.firebaseUser(),
    );

    console.error(
      'Auth profile:',
      authService.user(),
    );

    console.error(
      'Auth loading:',
      authService.isLoading(),
    );

    return router.createUrlTree([
      '/partner',
    ]);
  }
};