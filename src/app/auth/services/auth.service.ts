import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { User, LoginCredentials, RegisterData } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem('cleancut_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        localStorage.removeItem('cleancut_user');
      }
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.isLoadingSubject.next(true);
    
    // Simulate API call - replace with actual Firebase/backend call
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.email === 'owner@cleancut.com' && credentials.password === 'password') {
          const user: User = {
            uid: 'owner-123',
            email: credentials.email,
            displayName: 'Shop Owner',
            role: 'owner',
            createdAt: new Date(),
            isEmailVerified: true
          };
          
          localStorage.setItem('cleancut_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
          observer.next(user);
          observer.complete();
        } else if (credentials.email.includes('@') && credentials.password.length >= 6) {
          const user: User = {
            uid: 'user-' + Date.now(),
            email: credentials.email,
            displayName: credentials.email.split('@')[0],
            role: 'customer',
            createdAt: new Date(),
            isEmailVerified: true
          };
          
          localStorage.setItem('cleancut_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
          observer.next(user);
          observer.complete();
        } else {
          this.isLoadingSubject.next(false);
          observer.error('Invalid email or password');
        }
      }, 1500);
    });
  }

  register(userData: RegisterData): Observable<User> {
    this.isLoadingSubject.next(true);
    
    // Simulate API call - replace with actual Firebase/backend call
    return new Observable(observer => {
      setTimeout(() => {
        if (userData.email.includes('@') && userData.password.length >= 6) {
          const user: User = {
            uid: 'user-' + Date.now(),
            email: userData.email,
            displayName: userData.displayName,
            role: 'customer',
            phoneNumber: userData.phoneNumber,
            createdAt: new Date(),
            isEmailVerified: false
          };
          
          localStorage.setItem('cleancut_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
          observer.next(user);
          observer.complete();
        } else {
          this.isLoadingSubject.next(false);
          observer.error('Invalid registration data');
        }
      }, 1500);
    });
  }

  logout(): Observable<boolean> {
    localStorage.removeItem('cleancut_user');
    this.currentUserSubject.next(null);
    return of(true);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isOwner(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'owner' || user?.role === 'admin';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}