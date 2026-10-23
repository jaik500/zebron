import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { OrganizationContextStore } from '../../features/organizations/stores/organization-context.store';

/**

* Protects legacy/global Test Center routes.
*
* Test Center is an organization-scoped application. Users must be
* authenticated and have an active Test Center entitlement for their
* selected organization.
*
* Organization-specific routes must continue using
* partnerOrganizationGuard and applicationAccessGuard.
  */
  export const testCenterOrganizationGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const organizationStore = inject(OrganizationContextStore);
  const router = inject(Router);

// Authentication is required.
if (!authService.firebaseUser) {
return router.createUrlTree(['/login']);
}

const organizationId = organizationStore.selectedOrganizationId();

// No organization is selected.
if (!organizationId) {
return router.createUrlTree(['/partner']);
}

// Do not grant access while entitlement loading is in progress.
// The guard must not mistake an incomplete lookup for a denial
// or redirect prematurely.
if (organizationStore.applicationsLoading()) {
return router.createUrlTree([
'/partner/org',
organizationId,
'dashboard',
]);
}

// Fail closed if entitlement loading failed.
if (organizationStore.applicationsError()) {
return router.createUrlTree([
'/partner/org',
organizationId,
'dashboard',
]);
}

// Only an active entitlement grants access.
if (!organizationStore.hasActiveApplication('test-center')) {
return router.createUrlTree([
'/partner/org',
organizationId,
'dashboard',
]);
}

// Redirect to the canonical organization-scoped application route.
return router.createUrlTree([
'/partner/org',
organizationId,
'test-center',
]);
};
