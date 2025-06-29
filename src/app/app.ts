import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from './auth/services/auth.service';
import { User } from './auth/models/user.model';
import { AppInitService } from './core/services/app-init.service';

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
  protected title = 'Clean Cut Lounge - Premium Indian Barbershop';
  currentUser$: Observable<User | null>;
  showUserMenu = false;
  showMobileMenu = false;
  isHomePage = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private appInitService: AppInitService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      await this.appInitService.initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  ngOnInit(): void {
    // Track route changes to determine if we're on home page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isHomePage = event.url === '/' || event.url === '';
      // Close mobile menu on route change
      this.closeMobileMenu();
      this.closeUserMenu();
    });
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation(); // Prevent document click handler
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close menus if clicking outside
    if (this.showUserMenu) {
      this.showUserMenu = false;
    }
    if (this.showMobileMenu) {
      this.showMobileMenu = false;
    }
  }

  logout(event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent any parent click handlers
    }
    
    this.showUserMenu = false; // Close menu immediately
    
    // Add confirmation dialog for better UX
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