import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BookingSlot } from '../../models/booking.model';

@Component({
  selector: 'app-book-appointment',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './book-appointment.html',
  styleUrl: './book-appointment.css'
})
export class BookAppointment implements OnInit {
  bookingForm: FormGroup;
  availableSlots: BookingSlot[] = [];
  loadingSlots = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  minDate = '';
  maxDate = '';
  selectedDate = '';
  selectedTime = '';
  selectedService = '';

  private readonly services = {
    haircut: { name: 'Classic Haircut', price: '₹300' },
    beard: { name: 'Beard Trim & Shape', price: '₹200' },
    shave: { name: 'Hot Towel Shave', price: '₹250' },
    champi: { name: 'Champi (Head Massage)', price: '₹150' },
    package: { name: 'Complete Grooming Package', price: '₹600' }
  };

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {
    this.bookingForm = this.fb.group({
      service: ['', [Validators.required]],
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      notes: ['']
    });

    // Set date constraints
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2); // 2 months in advance
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Subscribe to form changes
    this.bookingForm.get('service')?.valueChanges.subscribe(value => {
      this.selectedService = value;
    });

    this.bookingForm.get('date')?.valueChanges.subscribe(value => {
      this.selectedDate = value;
    });

    this.bookingForm.get('time')?.valueChanges.subscribe(value => {
      this.selectedTime = value;
    });
  }

  onDateChange(): void {
    const selectedDate = this.bookingForm.get('date')?.value;
    if (selectedDate) {
      this.loadAvailableSlots(selectedDate);
      // Reset time selection when date changes
      this.bookingForm.get('time')?.setValue('');
      this.selectedTime = '';
    }
  }

  loadAvailableSlots(date: string): void {
    this.loadingSlots = true;
    this.bookingService.getAvailableSlots(date).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.loadingSlots = false;
      },
      error: (error) => {
        console.error('Error loading slots:', error);
        this.loadingSlots = false;
      }
    });
  }

  selectTimeSlot(time: string): void {
    const slot = this.availableSlots.find(s => s.time === time);
    if (slot && slot.available) {
      this.bookingForm.get('time')?.setValue(time);
      this.selectedTime = time;
    }
  }

  getTimeSlotClass(slot: BookingSlot): string {
    const baseClasses = 'text-sm';
    const isSelected = slot.time === this.selectedTime;
    
    if (!slot.available) {
      return `${baseClasses} bg-gray-200 text-gray-500 cursor-not-allowed`;
    }
    
    if (isSelected) {
      return `${baseClasses} bg-gold text-dark border-2 border-gold`;
    }
    
    return `${baseClasses} bg-white border-2 border-gray-300 text-gray-700 hover:border-gold hover:bg-gold hover:text-dark`;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  getServiceName(serviceKey: string): string {
    return this.services[serviceKey as keyof typeof this.services]?.name || serviceKey;
  }

  getServicePrice(serviceKey: string): string {
    return this.services[serviceKey as keyof typeof this.services]?.price || '';
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.bookingService.createBooking(this.bookingForm.value).subscribe({
        next: (booking) => {
          this.isSubmitting = false;
          this.successMessage = 'Appointment booked successfully! We will confirm your booking shortly.';
          
          // Redirect to my-bookings after success
          setTimeout(() => {
            this.router.navigate(['/my-bookings']);
          }, 2000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error || 'An error occurred while booking your appointment. Please try again.';
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
    }
  }
}