import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from './auth/services/auth.service';
import { User } from './auth/models/user.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    RouterModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'CleanCut - Premium Indian Barbershop';
  currentUser$: Observable<User | null>;
  showUserMenu = false;
  isHomePage = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Track route changes to determine if we're on home page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isHomePage = event.url === '/' || event.url === '';
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.showUserMenu = false; // Close menu immediately
    
    // Optional: Add confirmation dialog for better UX
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout().subscribe(() => {
        // Navigate to home page and scroll to top
        this.router.navigate(['/']).then(() => {
          window.scrollTo(0, 0);
        });
      });
    }
  }
}