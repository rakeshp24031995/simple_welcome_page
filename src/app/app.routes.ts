import { Routes } from '@angular/router';
import { authGuard, ownerGuard, guestGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/components/register/register').then(m => m.Register)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile').then(m => m.Profile)
  },
  {
    path: 'book-appointment',
    canActivate: [authGuard],
    loadComponent: () => import('./booking/components/book-appointment/book-appointment').then(m => m.BookAppointment)
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./booking/components/my-bookings/my-bookings').then(m => m.MyBookings)
  },
  {
    path: 'dashboard',
    canActivate: [ownerGuard],
    loadComponent: () => import('./dashboard/components/owner-dashboard/owner-dashboard').then(m => m.OwnerDashboard)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
