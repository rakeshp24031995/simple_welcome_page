import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check for specific owner role only (not admin)
  if (authService.hasRole('owner')) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // Redirect admin to admin dashboard
    if (authService.isAdmin()) {
      router.navigate(['/admin']);
    } else if (authService.hasRole('owner')) {
      router.navigate(['/owner-dashboard']);
    } else {
      router.navigate(['/dashboard']);
    }
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    if (authService.hasRole('owner')) {
      router.navigate(['/owner-dashboard']);
    } else {
      router.navigate(['/dashboard']);
    }
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users to their dashboard
  if (authService.isAdmin()) {
    router.navigate(['/admin']);
  } else if (authService.hasRole('owner')) {
    router.navigate(['/owner-dashboard']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};