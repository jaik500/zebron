import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the current authentication/profile load to finish.
  while (authService.isLoading()) {
    await new Promise((resolve) =>
      setTimeout(resolve, 50)
    );
  }

  console.log('ADMIN GUARD RUNNING');
  console.log('Current user:', authService.user());
  console.log('Is admin:', authService.isAdmin);

  // Only administrators can access the admin area.
  if (authService.isAdmin) {
    return true;
  }

  return router.createUrlTree(['/resources']);
};
