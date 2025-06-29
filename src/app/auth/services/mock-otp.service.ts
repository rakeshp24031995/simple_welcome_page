import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface MockOTPSession {
  phoneNumber: string;
  otp: string;
  timestamp: number;
  attempts: number;
}

export interface MockOTPVerificationResult {
  success: boolean;
  message: string;
  user?: any;
}

/**
 * Mock OTP Service for development/testing when Firebase phone auth is not configured
 * This should ONLY be used in development environment
 */
@Injectable({
  providedIn: 'root'
})
export class MockOtpService {
  private currentMockSession = new BehaviorSubject<MockOTPSession | null>(null);
  public mockSession$ = this.currentMockSession.asObservable();

  // Development settings
  private readonly MOCK_OTP = '123456'; // Fixed OTP for testing
  private readonly MAX_ATTEMPTS = 3;
  private readonly COOLDOWN_PERIOD = 300000; // 5 minutes
  private readonly OTP_EXPIRY = 300000; // 5 minutes

  constructor() {
    console.warn('🚨 Using Mock OTP Service - FOR DEVELOPMENT ONLY!');
  }

  /**
   * Mock send OTP - simulates Firebase behavior
   */
  sendOTP(phoneNumber: string): Observable<boolean> {
    return new Observable(observer => {
      console.log('🔐 [MOCK] Starting OTP send process...', { phoneNumber });
      
      // Simulate rate limiting
      const currentSession = this.currentMockSession.getValue();
      if (currentSession && this.isRateLimited(currentSession)) {
        console.warn('⚠️ [MOCK] Rate limited:', currentSession);
        observer.error({
          code: 'rate-limited',
          message: 'Too many attempts. Please wait before requesting another OTP.'
        });
        return;
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('📱 [MOCK] Formatted phone number:', formattedPhone);
      
      // Simulate API delay
      setTimeout(() => {
        const session: MockOTPSession = {
          phoneNumber: formattedPhone,
          otp: this.MOCK_OTP,
          timestamp: Date.now(),
          attempts: currentSession ? currentSession.attempts + 1 : 1
        };
        
        this.currentMockSession.next(session);
        console.log(`✅ [MOCK] OTP sent successfully! Use: ${this.MOCK_OTP}`, session);
        
        observer.next(true);
        observer.complete();
      }, 1000); // 1 second delay to simulate real API
    });
  }

  /**
   * Mock verify OTP
   */
  verifyOTP(code: string): Observable<MockOTPVerificationResult> {
    return new Observable(observer => {
      console.log('🔍 [MOCK] Verifying OTP:', code);
      
      const session = this.currentMockSession.getValue();
      
      if (!session) {
        observer.error({
          code: 'no-session',
          message: 'No OTP session found. Please request a new OTP.'
        });
        return;
      }

      if (this.isOTPExpired(session)) {
        this.clearOTPSession();
        observer.error({
          code: 'otp-expired',
          message: 'OTP has expired. Please request a new one.'
        });
        return;
      }

      // Simulate verification delay
      setTimeout(() => {
        if (code === session.otp) {
          this.clearOTPSession();
          console.log('✅ [MOCK] OTP verified successfully!');
          observer.next({
            success: true,
            message: 'Phone number verified successfully',
            user: { phoneNumber: session.phoneNumber, verified: true }
          });
          observer.complete();
        } else {
          console.error('❌ [MOCK] Invalid OTP provided:', code, 'Expected:', session.otp);
          observer.error({
            code: 'invalid-verification-code',
            message: `Invalid OTP. Expected: ${session.otp} (Development mode)`
          });
        }
      }, 500); // 0.5 second delay
    });
  }

  /**
   * Mock resend OTP
   */
  resendOTP(): Observable<boolean> {
    const session = this.currentMockSession.getValue();
    if (!session) {
      return throwError(() => ({
        code: 'no-session',
        message: 'No active session to resend OTP.'
      }));
    }
    
    console.log('🔄 [MOCK] Resending OTP...');
    return this.sendOTP(session.phoneNumber);
  }

  /**
   * Clear current OTP session
   */
  clearOTPSession(): void {
    console.log('🧹 [MOCK] Clearing OTP session');
    this.currentMockSession.next(null);
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    
    return phoneNumber;
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(session: MockOTPSession): boolean {
    const timeSinceLastAttempt = Date.now() - session.timestamp;
    return session.attempts >= this.MAX_ATTEMPTS && timeSinceLastAttempt < this.COOLDOWN_PERIOD;
  }

  /**
   * Check if OTP is expired
   */
  private isOTPExpired(session: MockOTPSession): boolean {
    return Date.now() - session.timestamp > this.OTP_EXPIRY;
  }

  /**
   * Get remaining time for cooldown
   */
  getRemainingCooldownTime(): number {
    const session = this.currentMockSession.getValue();
    if (!session || !this.isRateLimited(session)) {
      return 0;
    }
    
    const elapsed = Date.now() - session.timestamp;
    return Math.max(0, this.COOLDOWN_PERIOD - elapsed);
  }

  /**
   * Initialize reCAPTCHA (mock - does nothing)
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): void {
    console.log('🤖 [MOCK] Initializing reCAPTCHA (simulated):', containerId);
  }

  /**
   * Check if phone number is already verified (mock)
   */
  async isPhoneNumberVerified(phoneNumber: string): Promise<boolean> {
    console.log('📞 [MOCK] Checking if phone verified:', phoneNumber);
    // For demo, return false so users can always test registration
    return false;
  }

  /**
   * Send OTP for password reset (mock)
   */
  sendPasswordResetOTP(phoneNumber: string): Observable<boolean> {
    console.log('🔑 [MOCK] Sending password reset OTP');
    return this.sendOTP(phoneNumber);
  }

  /**
   * Verify OTP for password reset (mock)
   */
  verifyPasswordResetOTP(code: string): Observable<MockOTPVerificationResult> {
    console.log('🔐 [MOCK] Verifying password reset OTP');
    return this.verifyOTP(code);
  }
}