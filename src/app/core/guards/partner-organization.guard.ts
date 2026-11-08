import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import { httpsCallable } from 'firebase/functions';

import { AuthService } from '../services/auth.service';
import { firebaseFunctions } from '../services/firebase-config';
import { PartnerOrganizationContextService } from '../services/partner-organization-context.service';

/**
 * Protects organization-scoped Partner routes.
 *
 * Initializes and validates the requested organization's context
 * before granting access.
 */
export const partnerOrganizationGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const context = inject(PartnerOrganizationContextService);
  const router = inject(Router);

  // Wait for Firebase authentication initialization.
  while (authService.isLoading()) {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  // Require an authenticated Firebase user.
  if (!authService.firebaseUser()) {
    return router.createUrlTree(['/login']);
  }

  const organizationId = route.paramMap.get('organizationId')?.trim();

  console.log('========== PARTNER ORGANIZATION GUARD ==========');
  console.log('Requested organization:', organizationId);

  if (!organizationId) {
    console.error('PARTNER ORGANIZATION GUARD: MISSING ORGANIZATION ID');
    return router.createUrlTree(['/partner']);
  }

  try {
    // Initialize context for the requested organization.
    await context.initialize(organizationId);

    const actualOrganizationId = context.organizationId();
    const role = context.organizationRole();

    console.log('Organization context initialized:', {
      requestedOrganizationId: organizationId,
      actualOrganizationId,
      role,
      isPlatformAdmin: context.isPlatformAdmin(),
    });

    // Prevent access if the context belongs to another organization.
    if (actualOrganizationId !== organizationId) {
      console.error('PARTNER ORGANIZATION GUARD: CONTEXT MISMATCH');

      if (!context.isPlatformAdmin() && (await isUnavailableOrganization(organizationId))) {
        return router.createUrlTree(['/organization-unavailable', organizationId]);
      }

      return router.createUrlTree(['/partner']);
    }

    // Platform administrators may access organization-scoped routes.
    if (context.isPlatformAdmin()) {
      console.log('PARTNER ORGANIZATION GUARD: PLATFORM ADMIN ACCESS GRANTED');
      return true;
    }

    // Enforce organization-admin access only when requested by route data.
    if (route.data?.['organizationAdminOnly'] === true) {
      if (role !== 'org_owner' && role !== 'org_admin') {
        console.error('PARTNER ORGANIZATION GUARD: ADMIN ACCESS DENIED', {
          organizationId,
          role,
        });

        return router.createUrlTree(['/partner']);
      }
    }

    console.log('PARTNER ORGANIZATION GUARD: ACCESS GRANTED', {
      organizationId,
      role,
    });

    return true;
  } catch (error) {
    console.error('PARTNER ORGANIZATION GUARD: INITIALIZATION FAILED', {
      organizationId,
      error,
      contextOrganizationId: context.organizationId(),
      contextRole: context.organizationRole(),
      contextError: context.error(),
    });

    // Members cannot read a suspended or archived organization, so the
    // context fails to load. Ask the server why and show a clear page.
    if (!context.isPlatformAdmin() && (await isUnavailableOrganization(organizationId))) {
      return router.createUrlTree(['/organization-unavailable', organizationId]);
    }

    return router.createUrlTree(['/partner']);
  }
};

/** True when the caller is a member and the organization is not active. */
async function isUnavailableOrganization(organizationId: string): Promise<boolean> {
  try {
    const call = httpsCallable<{ organizationId: string }, { status: string }>(
      firebaseFunctions,
      'getOrganizationAccessStatus',
    );
    const { status } = (await call({ organizationId })).data;
    return status !== 'active' && status !== 'onboarding';
  } catch {
    return false;
  }
}