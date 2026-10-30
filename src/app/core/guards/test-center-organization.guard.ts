import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { OrganizationContextStore } from '../../features/organizations/stores/organization-context.store';

/**
 * Entry point for /test-center.
 *
 * Test Center has two modes:
 *
 * - Platform Test Center (/test-center/...): public Zebron courses,
 *   open to every signed-in user, including people who don't belong
 *   to any organization.
 * - Organization Test Center (/partner/org/:id/learn/test-center):
 *   the organization's own courses, for members whose organization
 *   has an active Test Center entitlement.
 *
 * Decision:
 * 1. Not signed in -> /login.
 * 2. No organization selected -> platform Test Center.
 * 3. Organization still loading its applications -> its dashboard
 *    (never guess while the lookup is incomplete).
 * 4. Organization has Test Center -> its learner Test Center.
 * 5. Otherwise (no entitlement, or the lookup failed) -> platform
 *    Test Center. Platform courses are public, so this exposes
 *    nothing organization-specific.
 */
export const testCenterOrganizationGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const organizationStore = inject(OrganizationContextStore);
  const router = inject(Router);

  if (!currentFirebaseUser(authService)) {
    return router.createUrlTree(['/login']);
  }

  const organizationId = organizationStore.selectedOrganizationId();

  if (!organizationId) {
    return true;
  }

  if (organizationStore.applicationsLoading()) {
    return router.createUrlTree([
      '/partner/org',
      organizationId,
      'dashboard',
    ]);
  }

  if (
    !organizationStore.applicationsError() &&
    organizationStore.hasActiveApplication('test-center')
  ) {
    return router.createUrlTree([
      '/partner/org',
      organizationId,
      'learn',
      'test-center',
    ]);
  }

  return true;
};

/**
 * AuthService.firebaseUser is a signal; read it, while still
 * accepting a plain value (as used by the unit tests' mock).
 */
function currentFirebaseUser(authService: AuthService): unknown {
  const value = (authService as unknown as { firebaseUser: unknown }).firebaseUser;

  return typeof value === 'function' ? (value as () => unknown)() : value;
}
