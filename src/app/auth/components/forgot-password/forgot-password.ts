import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AdaptiveOtpService } from '../../services/adaptive-otp.service';
import { AuthService } from '../../services/auth.service';
import { OtpInput } from '../../../shared/components/otp-input/otp-input';
import { environment } from '../../../../environments/environment';

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

  // Environment access for template
  get isPhoneBypassEnabled(): boolean {
    return environment.bypassPhoneVerification || false;
  }

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
      title: 'Reset Password',
      description: 'We will send a password reset link to your registered email'
    }
  ];

  constructor(
    private fb: FormBuilder,
    protected otpService: AdaptiveOtpService,
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

    console.log('📱 Starting forgot password flow for phone:', this.phoneControl?.value);
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const phoneNumber = this.phoneControl?.value;
    this.phoneNumber = phoneNumber;

    try {
      // First check if phone number is registered
      console.log('🔍 Checking if phone number is registered:', phoneNumber);
      const isRegistered = await this.otpService.isPhoneNumberVerified(phoneNumber);
      console.log('📞 Phone verification result:', isRegistered);
      
      if (!isRegistered) {
        console.warn('❌ Phone number not found:', phoneNumber);
        this.errorMessage = 'Phone number not found. Please check the number or register for a new account.';
        this.isLoading = false;
        return;
      }

      // Send OTP
      console.log('📤 Sending password reset OTP to:', phoneNumber);
      const subscription = this.otpService.sendPasswordResetOTP(phoneNumber).subscribe({
        next: (success) => {
          console.log('✅ Password reset OTP sent successfully:', success);
          if (success) {
            this.currentStep = 'otp';
            this.successMessage = `OTP sent to +91-${phoneNumber}`;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to send password reset OTP:', error);
          this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
          this.isLoading = false;
        }
      });

      this.subscriptions.add(subscription);
    } catch (error) {
      console.error('❌ Error in forgot password flow:', error);
      this.errorMessage = 'An error occurred. Please try again.';
      this.isLoading = false;
    }
  }

  onOtpChange(otp: string): void {
    // Clear error messages when user starts typing OTP
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onOtpComplete(otp: string): void {
    if (this.isLoading) return;

    console.log('🔢 Password reset OTP complete called with:', otp);
    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.otpService.verifyPasswordResetOTP(otp).subscribe({
      next: (result) => {
        console.log('✅ Password reset OTP verification result:', result);
        if (result.success) {
          console.log('🚀 OTP verified, moving to password step');
          this.currentStep = 'password';
          this.successMessage = 'Phone number verified successfully';
        } else {
          console.error('❌ OTP verification failed:', result);
          this.errorMessage = 'OTP verification failed. Please try again.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Password reset OTP verification error:', error);
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
    if (this.isLoading) return;

    console.log('🔒 Starting password reset email for phone:', this.phoneNumber);
    this.isLoading = true;
    this.errorMessage = '';

    // No need for new password since we're using email-based reset
    const subscription = this.authService.resetPasswordWithPhone(this.phoneNumber, '').subscribe({
      next: (success) => {
        console.log('✅ Password reset email result:', success);
        if (success) {
          console.log('🎉 Password reset email sent, redirecting to login');
          this.successMessage = 'Password reset email sent! Please check your email and follow the instructions to reset your password.';
          setTimeout(() => {
            this.router.navigate(['/login'], { 
              queryParams: { message: 'Password reset email sent. Please check your email to complete the process.' }
            });
          }, 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Password reset email failed:', error);
        this.errorMessage = error.message || error || 'Failed to send password reset email. Please try again.';
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