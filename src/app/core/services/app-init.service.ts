import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(private authService: AuthService) {}

  async initializeApp(): Promise<void> {
    try {
      // Create admin user if it doesn't exist
      await this.authService.createAdminUser();
      console.log('App initialization completed');
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  }
}