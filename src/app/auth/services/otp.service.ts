import { Injectable } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { FirebaseService } from '../../core/services/firebase.service';
import { 
  Auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential
} from 'firebase/auth';

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  user?: any;
}

export interface OTPSession {
  phoneNumber: string;
  confirmationResult: ConfirmationResult | null;
  timestamp: number;
  attempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class OtpService {
  private auth: Auth;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private currentOtpSession = new BehaviorSubject<OTPSession | null>(null);
  public otpSession$ = this.currentOtpSession.asObservable();

  // Rate limiting
  private readonly MAX_ATTEMPTS = 3;
  private readonly COOLDOWN_PERIOD = 300000; // 5 minutes in milliseconds
  private readonly OTP_EXPIRY = 300000; // 5 minutes

  constructor(private firebaseService: FirebaseService) {
    this.auth = this.firebaseService.getAuth();
  }

  /**
   * Initialize reCAPTCHA verifier
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): void {
    try {
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
      }

      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          this.recaptchaVerifier = null;
        }
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    }
  }

  /**
   * Send OTP to phone number
   */
  sendOTP(phoneNumber: string): Observable<boolean> {
    return new Observable(observer => {
      // Check rate limiting
      const currentSession = this.currentOtpSession.getValue();
      if (currentSession && this.isRateLimited(currentSession)) {
        observer.error({
          code: 'rate-limited',
          message: 'Too many attempts. Please wait before requesting another OTP.'
        });
        return;
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      if (!this.recaptchaVerifier) {
        observer.error({
          code: 'recaptcha-error',
          message: 'Failed to initialize reCAPTCHA. Please refresh the page.'
        });
        return;
      }

      signInWithPhoneNumber(this.auth, formattedPhone, this.recaptchaVerifier)
        .then((confirmationResult) => {
          const session: OTPSession = {
            phoneNumber: formattedPhone,
            confirmationResult,
            timestamp: Date.now(),
            attempts: currentSession ? currentSession.attempts + 1 : 1
          };
          
          this.currentOtpSession.next(session);
          observer.next(true);
          observer.complete();
        })
        .catch((error) => {
          console.error('Error sending OTP:', error);
          let errorMessage = 'Failed to send OTP. Please try again.';
          
          switch (error.code) {
            case 'auth/invalid-phone-number':
              errorMessage = 'Invalid phone number format.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many requests. Please try again later.';
              break;
            case 'auth/captcha-check-failed':
              errorMessage = 'reCAPTCHA verification failed. Please try again.';
              break;
          }
          
          observer.error({
            code: error.code,
            message: errorMessage
          });
        });
    });
  }

  /**
   * Verify OTP code
   */
  verifyOTP(code: string): Observable<OTPVerificationResult> {
    return new Observable(observer => {
      const session = this.currentOtpSession.getValue();
      
      if (!session || !session.confirmationResult) {
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

      session.confirmationResult.confirm(code)
        .then((result) => {
          this.clearOTPSession();
          observer.next({
            success: true,
            message: 'Phone number verified successfully',
            user: result.user
          });
          observer.complete();
        })
        .catch((error) => {
          console.error('Error verifying OTP:', error);
          let errorMessage = 'Invalid OTP. Please try again.';
          
          switch (error.code) {
            case 'auth/invalid-verification-code':
              errorMessage = 'Invalid verification code.';
              break;
            case 'auth/code-expired':
              errorMessage = 'Verification code has expired.';
              break;
          }
          
          observer.error({
            code: error.code,
            message: errorMessage
          });
        });
    });
  }

  /**
   * Resend OTP
   */
  resendOTP(): Observable<boolean> {
    const session = this.currentOtpSession.getValue();
    if (!session) {
      return throwError(() => ({
        code: 'no-session',
        message: 'No active session to resend OTP.'
      }));
    }
    
    return this.sendOTP(session.phoneNumber);
  }

  /**
   * Clear current OTP session
   */
  clearOTPSession(): void {
    this.currentOtpSession.next(null);
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Indian numbers)
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    
    return phoneNumber; // Return as-is if already formatted
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(session: OTPSession): boolean {
    const timeSinceLastAttempt = Date.now() - session.timestamp;
    return session.attempts >= this.MAX_ATTEMPTS && timeSinceLastAttempt < this.COOLDOWN_PERIOD;
  }

  /**
   * Check if OTP is expired
   */
  private isOTPExpired(session: OTPSession): boolean {
    return Date.now() - session.timestamp > this.OTP_EXPIRY;
  }

  /**
   * Get remaining time for cooldown
   */
  getRemainingCooldownTime(): number {
    const session = this.currentOtpSession.getValue();
    if (!session || !this.isRateLimited(session)) {
      return 0;
    }
    
    const elapsed = Date.now() - session.timestamp;
    return Math.max(0, this.COOLDOWN_PERIOD - elapsed);
  }

  /**
   * Check if phone number is already verified for existing user
   */
  async isPhoneNumberVerified(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      // Query Firestore to check if phone number exists and is verified
      const users = await this.firebaseService.queryDocuments('users', 'phoneNumber', '==', formattedPhone);
      return users.length > 0;
    } catch (error) {
      console.error('Error checking phone verification:', error);
      return false;
    }
  }

  /**
   * Send OTP for password reset
   */
  sendPasswordResetOTP(phoneNumber: string): Observable<boolean> {
    return this.sendOTP(phoneNumber);
  }

  /**
   * Verify OTP for password reset
   */
  verifyPasswordResetOTP(code: string): Observable<OTPVerificationResult> {
    return this.verifyOTP(code);
  }
}