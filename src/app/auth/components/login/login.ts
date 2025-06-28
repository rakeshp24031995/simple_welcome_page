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
  creatingAdmin = false;

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
          if (user.role === 'owner' || user.role === 'admin') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error || 'An error occurred during login';
        }
      });
    }
  }

  async createAdminUser(): Promise<void> {
    this.creatingAdmin = true;
    this.errorMessage = '';

    try {
      await this.authService.createAdminUser();
      this.errorMessage = 'Admin user created successfully! You can now login.';
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to create admin user';
    } finally {
      this.creatingAdmin = false;
    }
  }
}