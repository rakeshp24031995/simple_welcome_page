import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { OtpService } from '../../services/otp.service';
import { OtpInput } from '../../../shared/components/otp-input/otp-input';

interface RegistrationStep {
  step: 'form' | 'otp' | 'success';
  title: string;
  description: string;
}

@Component({
  selector: 'app-register-with-otp',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, OtpInput],
  templateUrl: './register-with-otp.html',
  styleUrl: './register.css'
})
export class RegisterWithOtp implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  
  currentStep: RegistrationStep['step'] = 'form';
  registrationData: any = null;
  
  private subscriptions = new Subscription();

  steps: RegistrationStep[] = [
    {
      step: 'form',
      title: 'Create Account',
      description: 'Fill in your details to get started'
    },
    {
      step: 'otp',
      title: 'Verify Phone',
      description: 'Enter the OTP sent to your mobile number'
    },
    {
      step: 'success',
      title: 'Welcome!',
      description: 'Your account has been created successfully'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private otpService: OtpService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
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

  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get currentStepData(): RegistrationStep {
    return this.steps.find(step => step.step === this.currentStep) || this.steps[0];
  }

  get displayNameControl() {
    return this.registerForm.get('displayName');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get phoneControl() {
    return this.registerForm.get('phoneNumber');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get agreeToTermsControl() {
    return this.registerForm.get('agreeToTerms');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = this.registerForm.value;
      this.registrationData = {
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      };

      // First check if phone number is already registered
      const isPhoneRegistered = await this.otpService.isPhoneNumberVerified(formData.phoneNumber);
      
      if (isPhoneRegistered) {
        this.errorMessage = 'This phone number is already registered. Please use a different number or try signing in.';
        this.isLoading = false;
        return;
      }

      // Send OTP for verification
      const subscription = this.otpService.sendOTP(formData.phoneNumber).subscribe({
        next: (success) => {
          if (success) {
            this.currentStep = 'otp';
            this.successMessage = `OTP sent to +91-${formData.phoneNumber}`;
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

    const subscription = this.otpService.verifyOTP(otp).subscribe({
      next: (result) => {
        if (result.success) {
          // Phone verified, now create account
          this.createAccount();
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Invalid OTP. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  private createAccount(): void {
    const subscription = this.authService.registerWithOTP(this.registrationData, true).subscribe({
      next: (user) => {
        this.currentStep = 'success';
        this.successMessage = 'Account created successfully!';
        this.isLoading = false;
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to create account. Please try again.';
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
          this.successMessage = `New OTP sent to +91-${this.registrationData.phoneNumber}`;
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

  goBack(): void {
    switch (this.currentStep) {
      case 'otp':
        this.currentStep = 'form';
        this.otpService.clearOTPSession();
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