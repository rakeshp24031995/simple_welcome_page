import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-my-bookings',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  private _filterStatus: string = 'all';
  isLoading = true;

  private readonly services = {
    haircut: { name: 'Classic Haircut', price: '₹300' },
    beard: { name: 'Beard Trim & Shape', price: '₹200' },
    shave: { name: 'Hot Towel Shave', price: '₹250' },
    champi: { name: 'Champi (Head Massage)', price: '₹150' },
    package: { name: 'Complete Grooming Package', price: '₹600' }
  };

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.bookingService.getUserBookings(user.uid).subscribe({
        next: (bookings) => {
          this.bookings = bookings;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.isLoading = false;
        }
      });
    }
  }

  applyFilter(): void {
    if (this._filterStatus === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(booking => booking.status === this._filterStatus);
    }
  }

  set filterStatus(status: string) {
    this._filterStatus = status;
    this.applyFilter();
  }

  get filterStatus(): string {
    return this._filterStatus;
  }

  getTotalCount(): number {
    return this.bookings.length;
  }

  getStatusCount(status: string): number {
    return this.bookings.filter(booking => booking.status === status).length;
  }

  getServiceName(serviceKey: string): string {
    return this.services[serviceKey as keyof typeof this.services]?.name || serviceKey;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold';
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'confirmed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  rescheduleBooking(booking: Booking): void {
    // For now, redirect to book appointment page
    // In a real app, you would open a reschedule modal or navigate to a reschedule page
    this.router.navigate(['/book-appointment'], { 
      queryParams: { reschedule: booking.id } 
    });
  }

  cancelBooking(booking: Booking): void {
    if (confirm(`Are you sure you want to cancel your ${this.getServiceName(booking.service)} appointment on ${booking.date}?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.loadBookings(); // Refresh the list
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          alert('Failed to cancel booking. Please try again.');
        }
      });
    }
  }

  bookAgain(booking: Booking): void {
    // Navigate to book appointment page with pre-filled service
    this.router.navigate(['/book-appointment'], { 
      queryParams: { service: booking.service } 
    });
  }
}