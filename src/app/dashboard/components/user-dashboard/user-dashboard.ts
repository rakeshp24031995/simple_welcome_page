import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { BookingService } from '../../../booking/services/booking.service';
import { User } from '../../../auth/models/user.model';
import { Booking } from '../../../booking/models/booking.model';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css'
})
export class UserDashboard implements OnInit {
  currentUser: User | null = null;
  recentBookings: Booking[] = [];
  upcomingBookings: Booking[] = [];
  completedBookings: Booking[] = [];
  isLoading = true;
  dashboardStats = {
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  };

  constructor(
    private authService: AuthService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserBookings();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadUserBookings(): void {
    if (!this.currentUser?.uid) {
      this.isLoading = false;
      return;
    }

    this.bookingService.getUserBookings(this.currentUser.uid).subscribe({
      next: (bookings) => {
        this.processBookings(bookings);
        this.calculateStats(bookings);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    });
  }

  private processBookings(bookings: Booking[]): void {
    const now = new Date();
    
    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Get recent bookings (last 5)
    this.recentBookings = bookings.slice(0, 5);
    
    // Filter upcoming bookings
    this.upcomingBookings = bookings.filter(booking => 
      new Date(booking.date) >= now && 
      (booking.status === 'confirmed' || booking.status === 'pending')
    );
    
    // Filter completed bookings
    this.completedBookings = bookings.filter(booking => 
      booking.status === 'completed' || 
      (booking.status === 'confirmed' && new Date(booking.date) < now)
    );
  }

  private calculateStats(bookings: Booking[]): void {
    this.dashboardStats = {
      totalBookings: bookings.length,
      upcomingBookings: this.upcomingBookings.length,
      completedBookings: this.completedBookings.length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
    };
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}