import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ApplicationAccessService } from '../services/application-access.service';

/**
 * Application Access Guard
 *
 * Validates that:
 * 1. The user is authenticated.
 * 2. The organization ID is present in the route.
 * 3. The application exists and is enabled.
 * 4. The application is active for the organization.
 * 5. The user has the required application permissions.
 *
 * This guard complements partnerOrganizationGuard:
 * - partnerOrganizationGuard establishes organization context.
 * - applicationAccessGuard validates application entitlement
 *   and user permissions.
 */
export const applicationAccessGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const applicationAccess = inject(ApplicationAccessService);
  const router = inject(Router);

  // Wait for Firebase authentication to finish restoring.
  while (authService.isLoading()) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 50),
    );
  }

  // Require an authenticated user.
  const user = authService.firebaseUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Read the organization ID from the organization-scoped route.
  const organizationId =
    route.paramMap.get('organizationId')?.trim();

  if (!organizationId) {
    return router.createUrlTree(['/partner']);
  }

  // Application ID must be explicitly declared in route metadata.
  const applicationId = route.data?.['applicationId'];

  if (
    typeof applicationId !== 'string' ||
    !applicationId.trim()
  ) {
    console.error(
      'Application access denied: missing applicationId route metadata.',
    );

    return router.createUrlTree([
      '/partner/org',
      organizationId,
      'dashboard',
    ]);
  }

  try {
    const result = await applicationAccess.checkAccess(
      user.uid,
      organizationId,
      applicationId.trim(),
    );

    if (!result.allowed) {
      console.warn('Application access denied.', {
        organizationId,
        applicationId,
        reason: result.reason,
      });

      return router.createUrlTree([
        '/partner/org',
        organizationId,
        'dashboard',
      ]);
    }

    return true;
  } catch (error) {
    console.error(
      'Application access validation failed.',
      {
        organizationId,
        applicationId,
        error,
      },
    );

    // Fail closed: do not grant access when validation fails.
    return router.createUrlTree([
      '/partner/org',
      organizationId,
      'dashboard',
    ]);
  }
};