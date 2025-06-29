import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { OtpService } from '../../services/otp.service';
import { AuthService } from '../../services/auth.service';
import { OtpInput } from '../../../shared/components/otp-input/otp-input';

interface ResetStep {
  step: 'phone' | 'otp' | 'password';
  title: string;
  description: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, OtpInput],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword implements OnInit, OnDestroy {
  phoneForm: FormGroup;
  passwordForm: FormGroup;
  
  currentStep: ResetStep['step'] = 'phone';
  phoneNumber: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  private subscriptions = new Subscription();

  steps: ResetStep[] = [
    {
      step: 'phone',
      title: 'Reset Password',
      description: 'Enter your registered mobile number to receive OTP'
    },
    {
      step: 'otp',
      title: 'Verify OTP',
      description: 'Enter the 6-digit code sent to your mobile number'
    },
    {
      step: 'password',
      title: 'New Password',
      description: 'Create a new password for your account'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private otpService: OtpService,
    private authService: AuthService,
    private router: Router
  ) {
    this.phoneForm = this.fb.group({
      phoneNumber: ['', [
        Validators.required, 
        Validators.pattern(/^[6-9]\d{9}$/)
      ]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Initialize reCAPTCHA
    setTimeout(() => {
      this.otpService.initializeRecaptcha('recaptcha-container');
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.otpService.clearOTPSession();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password?.value === confirmPassword?.value ? null : { passwordMismatch: true };
  }

  get currentStepData(): ResetStep {
    return this.steps.find(step => step.step === this.currentStep) || this.steps[0];
  }

  // Helper methods for template
  getStepIndex(step: string): number {
    return this.steps.findIndex(s => s.step === step);
  }

  getCurrentStepIndex(): number {
    return this.steps.findIndex(s => s.step === this.currentStep);
  }

  getStepClasses(step: ResetStep, index: number): string {
    const currentIndex = this.getCurrentStepIndex();
    if (this.currentStep === step.step) {
      return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gold text-dark';
    } else if (currentIndex > index) {
      return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 text-white';
    } else {
      return 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500';
    }
  }

  getConnectorClasses(index: number): string {
    const currentIndex = this.getCurrentStepIndex();
    return currentIndex > index ? 'w-8 h-0.5 mx-2 bg-green-500' : 'w-8 h-0.5 mx-2 bg-gray-200';
  }

  isStepCompleted(index: number): boolean {
    return this.getCurrentStepIndex() > index;
  }

  get phoneControl() {
    return this.phoneForm.get('phoneNumber');
  }

  get passwordControl() {
    return this.passwordForm.get('password');
  }

  get confirmPasswordControl() {
    return this.passwordForm.get('confirmPassword');
  }

  async onPhoneSubmit(): Promise<void> {
    if (this.phoneForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const phoneNumber = this.phoneControl?.value;
    this.phoneNumber = phoneNumber;

    try {
      // First check if phone number is registered
      const isRegistered = await this.otpService.isPhoneNumberVerified(phoneNumber);
      
      if (!isRegistered) {
        this.errorMessage = 'Phone number not found. Please check the number or register for a new account.';
        this.isLoading = false;
        return;
      }

      // Send OTP
      const subscription = this.otpService.sendPasswordResetOTP(phoneNumber).subscribe({
        next: (success) => {
          if (success) {
            this.currentStep = 'otp';
            this.successMessage = `OTP sent to +91-${phoneNumber}`;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
          this.isLoading = false;
        }
      });

      this.subscriptions.add(subscription);
    } catch (error) {
      this.errorMessage = 'An error occurred. Please try again.';
      this.isLoading = false;
    }
  }

  onOtpComplete(otp: string): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.otpService.verifyPasswordResetOTP(otp).subscribe({
      next: (result) => {
        if (result.success) {
          this.currentStep = 'password';
          this.successMessage = 'Phone number verified successfully';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Invalid OTP. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  onResendOtp(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.otpService.resendOTP().subscribe({
      next: (success) => {
        if (success) {
          this.successMessage = `New OTP sent to +91-${this.phoneNumber}`;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to resend OTP. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const newPassword = this.passwordControl?.value;

    const subscription = this.authService.resetPasswordWithPhone(this.phoneNumber, newPassword).subscribe({
      next: (success) => {
        if (success) {
          this.successMessage = 'Password reset successfully!';
          setTimeout(() => {
            this.router.navigate(['/login'], { 
              queryParams: { message: 'Password reset successfully. Please login with your new password.' }
            });
          }, 2000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  goBack(): void {
    switch (this.currentStep) {
      case 'otp':
        this.currentStep = 'phone';
        this.otpService.clearOTPSession();
        break;
      case 'password':
        this.currentStep = 'otp';
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}