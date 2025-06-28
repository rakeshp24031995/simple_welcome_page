import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../booking/services/booking.service';
import { Booking } from '../../../booking/models/booking.model';

@Component({
  selector: 'app-owner-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css'
})
export class OwnerDashboard implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  isLoading = true;
  lastUpdated = new Date();
  
  stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    thisMonth: 0
  };

  statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  currentStatusFilter = 'all';
  selectedDate = '';

  private readonly services = {
    haircut: { name: 'Classic Haircut', price: '₹300' },
    beard: { name: 'Beard Trim & Shape', price: '₹200' },
    shave: { name: 'Hot Towel Shave', price: '₹250' },
    champi: { name: 'Champi (Head Massage)', price: '₹150' },
    package: { name: 'Complete Grooming Package', price: '₹600' }
  };

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.bookingService.getBookingStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  setStatusFilter(status: string): void {
    this.currentStatusFilter = status;
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.bookings];

    // Apply status filter
    if (this.currentStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === this.currentStatusFilter);
    }

    // Apply date filter
    if (this.selectedDate) {
      filtered = filtered.filter(booking => booking.date === this.selectedDate);
    }

    this.filteredBookings = filtered;
  }

  refreshData(): void {
    this.loadBookings();
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
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  confirmBooking(booking: Booking): void {
    if (confirm(`Confirm appointment for ${booking.customerName} on ${booking.date} at ${this.formatTime(booking.time)}?`)) {
      this.updateBookingStatus(booking.id, 'confirmed');
    }
  }

  completeBooking(booking: Booking): void {
    if (confirm(`Mark appointment for ${booking.customerName} as completed?`)) {
      this.updateBookingStatus(booking.id, 'completed');
    }
  }

  cancelBooking(booking: Booking): void {
    if (confirm(`Cancel appointment for ${booking.customerName} on ${booking.date}?`)) {
      this.updateBookingStatus(booking.id, 'cancelled');
    }
  }

  private updateBookingStatus(bookingId: string, status: Booking['status']): void {
    this.bookingService.updateBookingStatus(bookingId, status).subscribe({
      next: () => {
        this.loadBookings(); // Refresh the data
      },
      error: (error) => {
        console.error('Error updating booking status:', error);
        alert('Failed to update booking status. Please try again.');
      }
    });
  }
}