import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpRequest, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry(1), // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              errorMessage = 'You are not authorized to access this resource';
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'You do not have permission to access this resource';
              break;
            case 404:
              errorMessage = 'The requested resource was not found';
              break;
            case 500:
              errorMessage = 'Internal server error. Please try again later';
              break;
            case 503:
              errorMessage = 'Service temporarily unavailable. Please try again later';
              break;
            default:
              errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
        }

        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: request.url,
          method: request.method
        });

        return throwError(() => errorMessage);
      })
    );
  }
}