import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OtpService, OTPVerificationResult } from './otp.service';
import { MockOtpService, MockOTPVerificationResult } from './mock-otp.service';

/**
 * Adaptive OTP Service that switches between real Firebase OTP and Mock OTP
 * based on environment configuration and runtime conditions
 */
@Injectable({
  providedIn: 'root'
})
export class AdaptiveOtpService {
  private useMockService: boolean;

  constructor(
    private realOtpService: OtpService,
    private mockOtpService: MockOtpService
  ) {
    this.useMockService = environment.useMockOTP || false;
    
    if (this.useMockService) {
      console.warn('🚨 Using Mock OTP Service for development');
    } else {
      console.log('✅ Using Firebase OTP Service for production');
    }
  }

  /**
   * Initialize reCAPTCHA (delegates to appropriate service)
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): void {
    if (this.useMockService) {
      this.mockOtpService.initializeRecaptcha(containerId);
    } else {
      this.realOtpService.initializeRecaptcha(containerId);
    }
  }

  /**
   * Send OTP with automatic fallback
   */
  sendOTP(phoneNumber: string): Observable<boolean> {
    if (this.useMockService) {
      return this.mockOtpService.sendOTP(phoneNumber);
    }

    // Try real service first, fallback to mock on specific errors
    return new Observable(observer => {
      this.realOtpService.sendOTP(phoneNumber).subscribe({
        next: (success) => {
          observer.next(success);
          observer.complete();
        },
        error: (error) => {
          console.warn('⚠️ Real OTP failed, checking if we should fallback to mock...', error);
          
          // Fallback to mock for specific Firebase configuration errors
          if (this.shouldFallbackToMock(error)) {
            console.log('🔄 Falling back to Mock OTP Service');
            this.useMockService = true;
            this.mockOtpService.sendOTP(phoneNumber).subscribe({
              next: (success) => observer.next(success),
              error: (mockError) => observer.error(mockError),
              complete: () => observer.complete()
            });
          } else {
            observer.error(error);
          }
        }
      });
    });
  }

  /**
   * Verify OTP
   */
  verifyOTP(code: string): Observable<OTPVerificationResult | MockOTPVerificationResult> {
    if (this.useMockService) {
      return this.mockOtpService.verifyOTP(code);
    } else {
      return this.realOtpService.verifyOTP(code);
    }
  }

  /**
   * Resend OTP
   */
  resendOTP(): Observable<boolean> {
    if (this.useMockService) {
      return this.mockOtpService.resendOTP();
    } else {
      return this.realOtpService.resendOTP();
    }
  }

  /**
   * Clear OTP session
   */
  clearOTPSession(): void {
    if (this.useMockService) {
      this.mockOtpService.clearOTPSession();
    } else {
      this.realOtpService.clearOTPSession();
    }
  }

  /**
   * Check if phone number is already verified
   */
  async isPhoneNumberVerified(phoneNumber: string): Promise<boolean> {
    if (this.useMockService) {
      return this.mockOtpService.isPhoneNumberVerified(phoneNumber);
    } else {
      return this.realOtpService.isPhoneNumberVerified(phoneNumber);
    }
  }

  /**
   * Send OTP for password reset
   */
  sendPasswordResetOTP(phoneNumber: string): Observable<boolean> {
    if (this.useMockService) {
      return this.mockOtpService.sendPasswordResetOTP(phoneNumber);
    } else {
      return this.realOtpService.sendPasswordResetOTP(phoneNumber);
    }
  }

  /**
   * Verify OTP for password reset
   */
  verifyPasswordResetOTP(code: string): Observable<OTPVerificationResult | MockOTPVerificationResult> {
    if (this.useMockService) {
      return this.mockOtpService.verifyPasswordResetOTP(code);
    } else {
      return this.realOtpService.verifyPasswordResetOTP(code);
    }
  }

  /**
   * Get remaining cooldown time
   */
  getRemainingCooldownTime(): number {
    if (this.useMockService) {
      return this.mockOtpService.getRemainingCooldownTime();
    } else {
      return this.realOtpService.getRemainingCooldownTime();
    }
  }

  /**
   * Check if we should fallback to mock service based on error
   */
  private shouldFallbackToMock(error: any): boolean {
    const fallbackCodes = [
      'auth/app-not-authorized',
      'auth/invalid-app-credential', 
      'auth/captcha-check-failed',
      'auth/quota-exceeded',
      'recaptcha-error'
    ];

    return fallbackCodes.includes(error.code) || 
           error.message?.includes('not enabled') ||
           error.message?.includes('reCAPTCHA');
  }

  /**
   * Force switch to mock service (for testing)
   */
  switchToMockService(): void {
    console.log('🔧 Manually switching to Mock OTP Service');
    this.useMockService = true;
    this.clearOTPSession();
  }

  /**
   * Force switch to real service (for production)
   */
  switchToRealService(): void {
    console.log('🔧 Manually switching to Real OTP Service');
    this.useMockService = false;
    this.clearOTPSession();
  }

  /**
   * Get current service type
   */
  getCurrentServiceType(): 'mock' | 'real' {
    return this.useMockService ? 'mock' : 'real';
  }

  /**
   * Get service status info
   */
  getServiceInfo(): { type: string; description: string } {
    if (this.useMockService) {
      return {
        type: 'mock',
        description: 'Using Mock OTP Service (Development Mode)'
      };
    } else {
      return {
        type: 'real', 
        description: 'Using Firebase OTP Service (Production Mode)'
      };
    }
  }
}