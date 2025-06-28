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

  if (authService.isOwner()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    router.navigate(['/profile']);
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
    if (authService.isOwner()) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/profile']);
    }
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Guest Guard - isAuthenticated:', authService.isAuthenticated());
  console.log('Guest Guard - currentUser:', authService.getCurrentUser());

  if (!authService.isAuthenticated()) {
    console.log('Guest Guard - allowing access to:', state.url);
    return true;
  }

  console.log('Guest Guard - redirecting authenticated user');
  // Redirect authenticated users to their dashboard
  if (authService.isAdmin()) {
    router.navigate(['/admin']);
  } else if (authService.isOwner()) {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/profile']);
  }
  return false;
};