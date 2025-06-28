import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CreateOwnerData, AdminStats, UserManagement } from '../models/admin.model';
import { User } from '../../auth/models/user.model';
import { FirebaseService } from '../../core/services/firebase.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private usersSubject = new BehaviorSubject<UserManagement[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    this.loadUsers();
  }

  private loadUsers(): void {
    from(this.firebaseService.getCollection('users', 'createdAt')).subscribe({
      next: (users) => {
        const processedUsers = users.map(user => ({
          ...user,
          createdAt: this.firebaseService.convertTimestamp(user.createdAt),
          lastLogin: user.lastLogin ? this.firebaseService.convertTimestamp(user.lastLogin) : undefined
        }));
        this.usersSubject.next(processedUsers);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.usersSubject.next([]);
      }
    });
  }

  createOwner(ownerData: CreateOwnerData): Observable<UserManagement> {
    return from(this.authService.createOwnerUser(ownerData)).pipe(
      map(user => {
        this.loadUsers(); // Refresh the users list
        return {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
          isActive: true
        };
      }),
      catchError(error => {
        console.error('Error creating owner:', error);
        let errorMessage = 'Failed to create owner';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email is already registered';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        }
        
        throw errorMessage;
      })
    );
  }

  getAllUsers(): Observable<UserManagement[]> {
    return from(this.firebaseService.getCollection('users', 'createdAt')).pipe(
      map(users => {
        return users.map(user => ({
          ...user,
          createdAt: this.firebaseService.convertTimestamp(user.createdAt),
          lastLogin: user.lastLogin ? this.firebaseService.convertTimestamp(user.lastLogin) : undefined
        }));
      }),
      catchError(error => {
        console.error('Error getting all users:', error);
        return of([]);
      })
    );
  }

  getUsersByRole(role: 'customer' | 'owner' | 'admin'): Observable<UserManagement[]> {
    return from(this.firebaseService.getCollectionWhere('users', 'role', '==', role)).pipe(
      map(users => {
        return users.map(user => ({
          ...user,
          createdAt: this.firebaseService.convertTimestamp(user.createdAt),
          lastLogin: user.lastLogin ? this.firebaseService.convertTimestamp(user.lastLogin) : undefined
        }));
      }),
      catchError(error => {
        console.error('Error getting users by role:', error);
        return of([]);
      })
    );
  }

  toggleUserStatus(userId: string): Observable<boolean> {
    return from(this.firebaseService.getDocument('users', userId)).pipe(
      switchMap(user => {
        const newStatus = !user.isActive;
        return from(this.firebaseService.updateDocument('users', userId, { 
          isActive: newStatus,
          updatedAt: new Date()
        }));
      }),
      map(() => {
        this.loadUsers(); // Refresh the users list
        return true;
      }),
      catchError(error => {
        console.error('Error toggling user status:', error);
        throw error;
      })
    );
  }

  deleteUser(userId: string): Observable<boolean> {
    return from(this.firebaseService.deleteDocument('users', userId)).pipe(
      map(() => {
        this.loadUsers(); // Refresh the users list
        return true;
      }),
      catchError(error => {
        console.error('Error deleting user:', error);
        throw error;
      })
    );
  }

  getAdminStats(): Observable<AdminStats> {
    return from(Promise.all([
      this.firebaseService.getCollection('users'),
      this.firebaseService.getCollection('bookings')
    ])).pipe(
      map(([users, bookings]) => {
        const processedBookings = bookings.map(booking => ({
          ...booking,
          createdAt: this.firebaseService.convertTimestamp(booking.createdAt)
        }));

        const processedUsers = users.map(user => ({
          ...user,
          createdAt: this.firebaseService.convertTimestamp(user.createdAt)
        }));

        const stats: AdminStats = {
          totalUsers: processedUsers.length,
          totalOwners: processedUsers.filter(u => u.role === 'owner').length,
          totalCustomers: processedUsers.filter(u => u.role === 'customer').length,
          totalBookings: processedBookings.length,
          totalRevenue: this.calculateTotalRevenue(processedBookings),
          monthlyStats: {
            bookings: this.getMonthlyBookings(processedBookings),
            revenue: this.getMonthlyRevenue(processedBookings),
            newUsers: this.getMonthlyUsers(processedUsers)
          }
        };

        return stats;
      }),
      catchError(error => {
        console.error('Error getting admin stats:', error);
        return of({
          totalUsers: 0,
          totalOwners: 0,
          totalCustomers: 0,
          totalBookings: 0,
          totalRevenue: 0,
          monthlyStats: {
            bookings: 0,
            revenue: 0,
            newUsers: 0
          }
        });
      })
    );
  }

  private calculateTotalRevenue(bookings: any[]): number {
    const serviceRates = {
      haircut: 300,
      beard: 200,
      shave: 250,
      champi: 150,
      package: 600
    };

    return bookings
      .filter(booking => booking.status === 'completed')
      .reduce((total, booking) => {
        const rate = serviceRates[booking.service as keyof typeof serviceRates] || 0;
        return total + rate;
      }, 0);
  }

  private getMonthlyBookings(bookings: any[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear;
    }).length;
  }

  private getMonthlyRevenue(bookings: any[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const serviceRates = {
      haircut: 300,
      beard: 200,
      shave: 250,
      champi: 150,
      package: 600
    };

    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return booking.status === 'completed' &&
               bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear;
      })
      .reduce((total, booking) => {
        const rate = serviceRates[booking.service as keyof typeof serviceRates] || 0;
        return total + rate;
      }, 0);
  }

  private getMonthlyUsers(users: any[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth && 
             userDate.getFullYear() === currentYear;
    }).length;
  }
}