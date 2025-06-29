import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage = '';
  isLoading = false;
  returnUrl = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (user) => {
          this.isLoading = false;
          
          // Redirect based on user role
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (user.role === 'owner') {
            this.router.navigate(['/owner-dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          
          // User-friendly error messages
          if (error.includes('user-not-found')) {
            this.errorMessage = 'No account found with this email address.';
          } else if (error.includes('wrong-password') || error.includes('invalid-credential')) {
            this.errorMessage = 'Invalid email or password.';
          } else if (error.includes('too-many-requests')) {
            this.errorMessage = 'Too many failed attempts. Please try again later.';
          } else if (error.includes('network-request-failed')) {
            this.errorMessage = 'Network error. Please check your connection.';
          } else {
            this.errorMessage = error || 'Unable to sign in. Please try again.';
          }
        }
      });
    }
  }

}