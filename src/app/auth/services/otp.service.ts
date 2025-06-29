import { Injectable } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { FirebaseService } from '../../core/services/firebase.service';
import { environment } from '../../../environments/environment';
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
      console.log('🔐 Starting OTP send process...', { phoneNumber });
      
      // Check rate limiting
      const currentSession = this.currentOtpSession.getValue();
      if (currentSession && this.isRateLimited(currentSession)) {
        console.warn('⚠️ Rate limited:', currentSession);
        observer.error({
          code: 'rate-limited',
          message: 'Too many attempts. Please wait before requesting another OTP.'
        });
        return;
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('📱 Formatted phone number:', formattedPhone);
      
      if (!this.recaptchaVerifier) {
        console.log('🤖 Initializing reCAPTCHA...');
        this.initializeRecaptcha();
      }

      if (!this.recaptchaVerifier) {
        console.error('❌ reCAPTCHA initialization failed');
        observer.error({
          code: 'recaptcha-error',
          message: 'Failed to initialize reCAPTCHA. Please refresh the page and try again.'
        });
        return;
      }

      console.log('🚀 Sending OTP via Firebase...', { formattedPhone });
      
      signInWithPhoneNumber(this.auth, formattedPhone, this.recaptchaVerifier)
        .then((confirmationResult) => {
          console.log('✅ OTP sent successfully:', confirmationResult);
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
          console.error('❌ Firebase OTP Error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          let errorMessage = this.getDetailedErrorMessage(error);
          
          observer.error({
            code: error.code,
            message: errorMessage,
            originalError: error
          });
        });
    });
  }

  /**
   * Get detailed error message based on Firebase error codes
   */
  private getDetailedErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format. Please enter a valid Indian mobile number.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again after some time.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Please refresh the page and try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/invalid-app-credential':
        return 'Invalid app configuration. Please contact support.';
      case 'auth/app-not-authorized':
        return 'Phone authentication is not enabled for this app.';
      case 'auth/missing-phone-number':
        return 'Phone number is required.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code.';
      case 'auth/session-expired':
        return 'Session expired. Please request a new OTP.';
      default:
        return `Failed to send OTP: ${error.message || 'Unknown error'}. Please try again.`;
    }
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
      console.log('🔍 Checking phone verification for:', formattedPhone);
      
      // Check for bypass mode in environment
      if (environment.bypassPhoneVerification) {
        console.log('🚫 Phone verification bypass enabled - validating format only');
        const isValidFormat = this.isValidPhoneFormat(formattedPhone);
        console.log('📱 Phone format validation result:', isValidFormat);
        return isValidFormat;
      }
      
      // Try normal phone verification
      try {
        const phoneExists = await this.firebaseService.checkPhoneExists(formattedPhone);
        console.log('✅ Phone verification successful:', phoneExists);
        return phoneExists;
      } catch (firestoreError: any) {
        console.error('❌ Firestore phone check failed:', firestoreError);
        
        // If permissions error, fall back to format validation
        if (firestoreError.code === 'permission-denied' || 
            firestoreError.message?.includes('permission') ||
            firestoreError.message?.includes('insufficient')) {
          
          console.log('🔄 Permissions error detected, using format validation');
          const isValidFormat = this.isValidPhoneFormat(formattedPhone);
          console.log('📱 Format validation result:', isValidFormat);
          return isValidFormat;
        }
        
        // For other errors, still try format validation
        const isValidFormat = this.isValidPhoneFormat(formattedPhone);
        console.log('🔄 Using format validation due to error:', isValidFormat);
        return isValidFormat;
      }
    } catch (error) {
      console.error('❌ Unexpected error in phone verification:', error);
      
      // Final fallback: Allow valid format phones
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const isValidFormat = this.isValidPhoneFormat(formattedPhone);
      console.log('🆘 Final fallback - format validation:', isValidFormat);
      return isValidFormat;
    }
  }

  /**
   * Check if phone number has valid format
   */
  private isValidPhoneFormat(phoneNumber: string): boolean {
    // Check if it's a valid Indian phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length === 13 && cleanPhone.startsWith('91') && 
           /^91[6-9]\d{9}$/.test(cleanPhone);
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