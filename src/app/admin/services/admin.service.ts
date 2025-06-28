import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CreateOwnerData, AdminStats, UserManagement } from '../models/admin.model';
import { User } from '../../auth/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private usersSubject = new BehaviorSubject<UserManagement[]>([]);
  public users$ = this.usersSubject.asObservable();

  private readonly USERS_STORAGE_KEY = 'cleancut_all_users';

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    const stored = localStorage.getItem(this.USERS_STORAGE_KEY);
    if (stored) {
      try {
        const users = JSON.parse(stored);
        this.usersSubject.next(users);
      } catch (error) {
        console.error('Error loading users:', error);
        this.initializeDefaultUsers();
      }
    } else {
      this.initializeDefaultUsers();
    }
  }

  private initializeDefaultUsers(): void {
    const defaultUsers: UserManagement[] = [
      {
        id: 'admin-001',
        email: 'admin@cleancut.com',
        displayName: 'System Administrator',
        role: 'admin',
        phoneNumber: '+91 98765 43210',
        createdAt: new Date('2024-01-01'),
        isActive: true,
        lastLogin: new Date()
      },
      {
        id: 'owner-123',
        email: 'owner@cleancut.com',
        displayName: 'Shop Owner',
        role: 'owner',
        phoneNumber: '+91 98765 43211',
        createdAt: new Date('2024-01-15'),
        isActive: true,
        lastLogin: new Date()
      }
    ];
    
    this.saveUsers(defaultUsers);
  }

  private saveUsers(users: UserManagement[]): void {
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
  }

  createOwner(ownerData: CreateOwnerData): Observable<UserManagement> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentUsers = this.usersSubject.value;
        
        // Check if email already exists
        if (currentUsers.some(user => user.email === ownerData.email)) {
          observer.error('Email already exists');
          return;
        }

        const newOwner: UserManagement = {
          id: 'owner-' + Date.now(),
          email: ownerData.email,
          displayName: ownerData.displayName,
          role: 'owner',
          phoneNumber: ownerData.phoneNumber,
          createdAt: new Date(),
          isActive: true
        };

        const updatedUsers = [...currentUsers, newOwner];
        this.saveUsers(updatedUsers);

        observer.next(newOwner);
        observer.complete();
      }, 1000);
    });
  }

  getAllUsers(): Observable<UserManagement[]> {
    return this.users$;
  }

  getUsersByRole(role: 'customer' | 'owner' | 'admin'): Observable<UserManagement[]> {
    return new Observable(observer => {
      const users = this.usersSubject.value.filter(user => user.role === role);
      observer.next(users);
      observer.complete();
    });
  }

  toggleUserStatus(userId: string): Observable<boolean> {
    return new Observable(observer => {
      const currentUsers = this.usersSubject.value;
      const userIndex = currentUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        observer.error('User not found');
        return;
      }

      const updatedUsers = [...currentUsers];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive: !updatedUsers[userIndex].isActive
      };

      this.saveUsers(updatedUsers);
      observer.next(true);
      observer.complete();
    });
  }

  deleteUser(userId: string): Observable<boolean> {
    return new Observable(observer => {
      const currentUsers = this.usersSubject.value;
      const updatedUsers = currentUsers.filter(user => user.id !== userId);
      
      this.saveUsers(updatedUsers);
      observer.next(true);
      observer.complete();
    });
  }

  getAdminStats(): Observable<AdminStats> {
    return new Observable(observer => {
      const users = this.usersSubject.value;
      const bookingsData = JSON.parse(localStorage.getItem('cleancut_bookings') || '[]');
      
      const stats: AdminStats = {
        totalUsers: users.length,
        totalOwners: users.filter(u => u.role === 'owner').length,
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalBookings: bookingsData.length,
        totalRevenue: this.calculateTotalRevenue(bookingsData),
        monthlyStats: {
          bookings: this.getMonthlyBookings(bookingsData),
          revenue: this.getMonthlyRevenue(bookingsData),
          newUsers: this.getMonthlyUsers(users)
        }
      };

      observer.next(stats);
      observer.complete();
    });
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

  private getMonthlyUsers(users: UserManagement[]): number {
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