import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';
import { BookingService } from '../booking/services/booking.service';
import { User } from '../auth/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  isUpdating = false;
  userStats = {
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private bookingService: BookingService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[\+]?[\d\s\-\(\)]{10,}$/)]]
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.profileForm.patchValue({
        displayName: this.user.displayName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber || ''
      });
      
      this.loadUserStats();
    }
  }

  loadUserStats(): void {
    if (this.user) {
      this.bookingService.getUserBookings(this.user.uid).subscribe(bookings => {
        this.userStats = {
          totalBookings: bookings.length,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length
        };
      });
    }
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid) {
      this.isUpdating = true;
      
      // Simulate profile update
      setTimeout(() => {
        this.isUpdating = false;
        // In a real app, you would update the user profile via API
        console.log('Profile updated:', this.profileForm.value);
      }, 1000);
    }
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}