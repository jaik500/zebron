import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import { FeatureConfigService } from '../services/feature-config.service';

/**
 * Route-level guard for Zebron application availability.
 *
 * Route configuration:
 *
 * data: {
 *   featureKey: 'community',
 * }
 *
 * Availability:
 * - enabled     -> route is allowed
 * - maintenance -> route is blocked
 * - disabled    -> route is blocked
 *
 * Authentication/authorization should remain separate.
 * For example:
 *
 * canActivate: [authGuard, featureGuard]
 */
export const featureGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const featureConfigService =
    inject(FeatureConfigService);

  const router = inject(Router);

  const featureKey =
    route.data['featureKey'] as string | undefined;

  if (!featureKey?.trim()) {
    console.error(
      '[Zebron] Feature guard is missing featureKey route data.',
    );

    return router.createUrlTree(['/']);
  }

  const key = featureKey.trim();

  /*
   * Allow the application when its configuration
   * explicitly says it is available.
   */
  if (featureConfigService.isAvailable(key)) {
    return true;
  }

  /*
   * Route is unavailable because the application
   * is disabled or in maintenance.
   */
  return router.createUrlTree(
    ['/feature-unavailable'],
    {
      queryParams: {
        feature: key,
      },
    },
  );
};