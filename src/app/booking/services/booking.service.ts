import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Booking, BookingSlot, BookingForm } from '../models/booking.model';
import { AuthService } from '../../auth/services/auth.service';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {
    this.loadBookings();
  }

  private loadBookings(): void {
    from(this.firebaseService.getCollection('bookings', 'createdAt')).subscribe({
      next: (bookings) => {
        const processedBookings = bookings.map(booking => ({
          ...booking,
          createdAt: this.firebaseService.convertTimestamp(booking.createdAt),
          updatedAt: this.firebaseService.convertTimestamp(booking.updatedAt)
        }));
        this.bookingsSubject.next(processedBookings);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.bookingsSubject.next([]);
      }
    });
  }

  createBooking(bookingData: BookingForm): Observable<Booking> {
    return new Observable(observer => {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        observer.error('User not authenticated');
        return;
      }

      const booking: Omit<Booking, 'id'> = {
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

      from(this.firebaseService.addDocument('bookings', booking)).subscribe({
        next: (docId) => {
          const newBooking: Booking = { ...booking, id: docId };
          this.loadBookings(); // Refresh the bookings list
          observer.next(newBooking);
          observer.complete();
        },
        error: (error) => {
          console.error('Error creating booking:', error);
          
          let errorMessage = 'Failed to create booking. Please try again.';
          
          if (error.code) {
            switch (error.code) {
              case 'permission-denied':
                errorMessage = 'You do not have permission to create bookings. Please contact support.';
                break;
              case 'network-request-failed':
                errorMessage = 'Network error. Please check your connection and try again.';
                break;
              case 'unavailable':
                errorMessage = 'Booking service is temporarily unavailable. Please try again later.';
                break;
              default:
                errorMessage = `Booking failed: ${error.message || 'Unknown error'}`;
            }
          }
          
          observer.error(errorMessage);
        }
      });
    });
  }

  getAvailableSlots(date: string): Observable<BookingSlot[]> {
    return new Observable(observer => {
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00',
        '14:00', '15:00', '16:00', '17:00', '18:00'
      ];

      // Get bookings for the specific date
      from(this.firebaseService.getCollectionWhere('bookings', 'date', '==', date)).subscribe({
        next: (dayBookings) => {
          const bookedSlots = dayBookings
            .filter(booking => booking.status !== 'cancelled')
            .map(booking => booking.time);

          const availableSlots: BookingSlot[] = timeSlots.map(time => ({
            date,
            time,
            available: !bookedSlots.includes(time)
          }));

          observer.next(availableSlots);
          observer.complete();
        },
        error: (error) => {
          console.error('Error getting available slots:', error);
          // Return all slots as available if there's an error
          const availableSlots: BookingSlot[] = timeSlots.map(time => ({
            date,
            time,
            available: true
          }));
          observer.next(availableSlots);
          observer.complete();
        }
      });
    });
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return from(this.firebaseService.getCollectionWhere('bookings', 'userId', '==', userId)).pipe(
      map(bookings => {
        return bookings
          .map(booking => ({
            ...booking,
            createdAt: this.firebaseService.convertTimestamp(booking.createdAt),
            updatedAt: this.firebaseService.convertTimestamp(booking.updatedAt)
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }),
      catchError(error => {
        console.error('Error getting user bookings:', error);
        return of([]);
      })
    );
  }

  getAllBookings(): Observable<Booking[]> {
    return from(this.firebaseService.getCollection('bookings', 'createdAt')).pipe(
      map(bookings => {
        return bookings.map(booking => ({
          ...booking,
          createdAt: this.firebaseService.convertTimestamp(booking.createdAt),
          updatedAt: this.firebaseService.convertTimestamp(booking.updatedAt)
        }));
      }),
      catchError(error => {
        console.error('Error getting all bookings:', error);
        return of([]);
      })
    );
  }

  updateBookingStatus(bookingId: string, status: Booking['status']): Observable<Booking> {
    return from(this.firebaseService.updateDocument('bookings', bookingId, { 
      status,
      updatedAt: new Date()
    })).pipe(
      switchMap(() => this.firebaseService.getDocument('bookings', bookingId)),
      map(booking => ({
        ...booking,
        createdAt: this.firebaseService.convertTimestamp(booking.createdAt),
        updatedAt: this.firebaseService.convertTimestamp(booking.updatedAt)
      })),
      catchError(error => {
        console.error('Error updating booking status:', error);
        throw error;
      })
    );
  }

  cancelBooking(bookingId: string): Observable<boolean> {
    return this.updateBookingStatus(bookingId, 'cancelled').pipe(
      map(() => {
        this.loadBookings(); // Refresh the bookings list
        return true;
      }),
      catchError(error => {
        console.error('Error cancelling booking:', error);
        throw error;
      })
    );
  }

  getBookingStats(): Observable<any> {
    return this.getAllBookings().pipe(
      map(bookings => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const stats = {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          thisMonth: bookings.filter(b => {
            const bookingDate = new Date(b.createdAt);
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear;
          }).length
        };

        return stats;
      }),
      catchError(error => {
        console.error('Error getting booking stats:', error);
        return of({
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          thisMonth: 0
        });
      })
    );
  }
}