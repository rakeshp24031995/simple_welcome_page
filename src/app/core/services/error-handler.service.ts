import { Injectable, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private router: Router) {}

  handleError(error: any): void {
    console.error('Global error occurred:', error);

    // Extract meaningful error message
    let userMessage = 'An unexpected error occurred';
    
    if (error?.message) {
      // Firebase Auth errors
      if (error.message.includes('Firebase')) {
        userMessage = this.getFirebaseErrorMessage(error.message);
      }
      // Network errors
      else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network connection error. Please check your internet connection.';
      }
      // Permission errors
      else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        userMessage = 'You do not have permission to perform this action.';
      }
      else {
        userMessage = error.message;
      }
    }

    // Show error to user (you could use a toast service here)
    this.showErrorToUser(userMessage);

    // Report error to logging service (if you have one)
    this.reportError(error);
  }

  private getFirebaseErrorMessage(firebaseError: string): string {
    if (firebaseError.includes('auth/user-not-found')) {
      return 'No account found with this email address.';
    }
    if (firebaseError.includes('auth/wrong-password')) {
      return 'Invalid password. Please try again.';
    }
    if (firebaseError.includes('auth/email-already-in-use')) {
      return 'This email is already registered. Please use a different email.';
    }
    if (firebaseError.includes('auth/weak-password')) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    if (firebaseError.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (firebaseError.includes('auth/network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (firebaseError.includes('permission-denied')) {
      return 'You do not have permission to access this data.';
    }
    
    return 'Authentication error. Please try again.';
  }

  private showErrorToUser(message: string): void {
    // In a real app, you might use a toast service or modal
    // For now, we'll just log it (the components will handle showing errors)
    console.warn('User-facing error:', message);
  }

  private reportError(error: any): void {
    // In a real app, you might send errors to a logging service like Sentry
    const errorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('Error report:', errorReport);
    
    // You could send this to your logging service:
    // this.loggingService.logError(errorReport);
  }
}