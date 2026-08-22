import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protect routes that require an authenticated
 * Firebase user.
 *
 * This guard is intentionally different from
 * adminGuard. It allows any authenticated Zebron
 * user to access the route.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait until AuthService has finished resolving
  // the current Firebase authentication state.
  while (authService.isLoading()) {
    await new Promise((resolve) =>
      setTimeout(resolve, 50)
    );
  }

  console.log('========== AUTH GUARD ==========');
  console.log(
    'Firebase user:',
    authService.firebaseUser()
  );
  console.log(
    'Firestore profile:',
    authService.user()
  );
  console.log(
    'Auth loading:',
    authService.isLoading()
  );
  console.log('================================');

  // Authentication is based on Firebase Auth.
  if (authService.firebaseUser()) {
    console.log(
      'AUTH GUARD: ACCESS GRANTED'
    );

    return true;
  }

  console.log(
    'AUTH GUARD: ACCESS DENIED'
  );

  return router.createUrlTree(['/login']);
};