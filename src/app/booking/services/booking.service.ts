import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Booking, BookingSlot, BookingForm } from '../models/booking.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingsSubject.asObservable();

  private readonly STORAGE_KEY = 'cleancut_bookings';

  constructor(private authService: AuthService) {
    this.loadBookings();
  }

  private loadBookings(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const bookings = JSON.parse(stored);
        this.bookingsSubject.next(bookings);
      } catch (error) {
        console.error('Error loading bookings:', error);
      }
    }
  }

  private saveBookings(bookings: Booking[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookings));
    this.bookingsSubject.next(bookings);
  }

  createBooking(bookingData: BookingForm): Observable<Booking> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          observer.error('User not authenticated');
          return;
        }

        const booking: Booking = {
          id: 'booking-' + Date.now(),
          userId: currentUser.uid,
          customerName: currentUser.displayName,
          customerPhone: currentUser.phoneNumber || '',
          customerEmail: currentUser.email,
          service: bookingData.service,
          date: bookingData.date,
          time: bookingData.time,
          status: 'pending',
          notes: bookingData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const currentBookings = this.bookingsSubject.value;
        const updatedBookings = [...currentBookings, booking];
        this.saveBookings(updatedBookings);

        observer.next(booking);
        observer.complete();
      }, 1000);
    });
  }

  getAvailableSlots(date: string): Observable<BookingSlot[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const timeSlots = [
          '09:00', '10:00', '11:00', '12:00',
          '14:00', '15:00', '16:00', '17:00', '18:00'
        ];

        const bookedSlots = this.bookingsSubject.value
          .filter(booking => booking.date === date && booking.status !== 'cancelled')
          .map(booking => booking.time);

        const availableSlots: BookingSlot[] = timeSlots.map(time => ({
          date,
          time,
          available: !bookedSlots.includes(time)
        }));

        observer.next(availableSlots);
        observer.complete();
      }, 500);
    });
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return new Observable(observer => {
      const userBookings = this.bookingsSubject.value
        .filter(booking => booking.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      observer.next(userBookings);
      observer.complete();
    });
  }

  getAllBookings(): Observable<Booking[]> {
    return this.bookings$;
  }

  updateBookingStatus(bookingId: string, status: Booking['status']): Observable<Booking> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentBookings = this.bookingsSubject.value;
        const bookingIndex = currentBookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex === -1) {
          observer.error('Booking not found');
          return;
        }

        const updatedBooking = {
          ...currentBookings[bookingIndex],
          status,
          updatedAt: new Date()
        };

        const updatedBookings = [...currentBookings];
        updatedBookings[bookingIndex] = updatedBooking;
        
        this.saveBookings(updatedBookings);
        observer.next(updatedBooking);
        observer.complete();
      }, 500);
    });
  }

  cancelBooking(bookingId: string): Observable<boolean> {
    return new Observable(observer => {
      this.updateBookingStatus(bookingId, 'cancelled').subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getBookingStats(): Observable<any> {
    return new Observable(observer => {
      const bookings = this.bookingsSubject.value;
      const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        thisMonth: bookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear();
        }).length
      };
      
      observer.next(stats);
      observer.complete();
    });
  }
}