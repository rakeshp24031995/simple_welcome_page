import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User, LoginCredentials, RegisterData } from '../models/user.model';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.initializeAuthListener();
  }

  private initializeAuthListener(): void {
    this.firebaseService.authState$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await this.firebaseService.getDocument('users', firebaseUser.uid);
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userProfile.displayName || firebaseUser.displayName || '',
            role: userProfile.role || 'customer',
            phoneNumber: userProfile.phoneNumber,
            createdAt: this.firebaseService.convertTimestamp(userProfile.createdAt),
            isEmailVerified: firebaseUser.emailVerified
          };
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error loading user profile:', error);
          this.currentUserSubject.next(null);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.isLoadingSubject.next(true);
    
    return from(this.firebaseService.signInWithEmail(credentials.email, credentials.password)).pipe(
      switchMap(async (firebaseUser) => {
        try {
          // Get user profile from Firestore
          const userProfile = await this.firebaseService.getDocument('users', firebaseUser.uid);
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userProfile.displayName || firebaseUser.displayName || '',
            role: userProfile.role || 'customer',
            phoneNumber: userProfile.phoneNumber,
            createdAt: this.firebaseService.convertTimestamp(userProfile.createdAt),
            isEmailVerified: firebaseUser.emailVerified
          };
          
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
          return user;
        } catch (error) {
          this.isLoadingSubject.next(false);
          throw error;
        }
      }),
      catchError((error) => {
        this.isLoadingSubject.next(false);
        let errorMessage = 'Login failed';
        
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Invalid password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          default:
            errorMessage = error.message || 'Login failed';
        }
        
        return throwError(() => errorMessage);
      })
    );
  }

  register(userData: RegisterData): Observable<User> {
    this.isLoadingSubject.next(true);
    
    return from(this.firebaseService.createUserWithEmail(userData.email, userData.password, userData.displayName)).pipe(
      switchMap(async (firebaseUser) => {
        try {
          // Create user profile in Firestore
          const userProfile = {
            displayName: userData.displayName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            role: 'customer' as const,
            isActive: true
          };
          
          await this.firebaseService.createDocument('users', firebaseUser.uid, userProfile);
          
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userData.displayName,
            role: 'customer',
            phoneNumber: userData.phoneNumber,
            createdAt: new Date(),
            isEmailVerified: firebaseUser.emailVerified
          };
          
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
          return user;
        } catch (error) {
          this.isLoadingSubject.next(false);
          throw error;
        }
      }),
      catchError((error) => {
        this.isLoadingSubject.next(false);
        let errorMessage = 'Registration failed';
        
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
          default:
            errorMessage = error.message || 'Registration failed';
        }
        
        return throwError(() => errorMessage);
      })
    );
  }

  logout(): Observable<boolean> {
    return from(this.firebaseService.signOutUser()).pipe(
      map(() => {
        this.currentUserSubject.next(null);
        return true;
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        return of(false);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isOwner(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'owner' || user?.role === 'admin';
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAdminAccess(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  hasOwnerAccess(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'owner' || user?.role === 'admin';
  }

  // Create admin user (should be called during app initialization)
  async createAdminUser(): Promise<void> {
    try {
      const adminEmail = 'admin@cleancutlounge.com';
      const adminPassword = 'admin123';
      
      console.log('Checking for existing admin user...');
      
      // Check if admin already exists in Firestore
      try {
        const existingUsers = await this.firebaseService.getCollectionWhere('users', 'email', '==', adminEmail);
        if (existingUsers.length > 0) {
          console.log('Admin user already exists in Firestore');
          return;
        }
      } catch (firestoreError) {
        console.warn('Could not check existing users, continuing with creation:', firestoreError);
      }

      // Try to create Firebase auth user
      try {
        console.log('Creating admin user in Firebase Auth...');
        const firebaseUser = await this.firebaseService.createUserWithEmail(adminEmail, adminPassword, 'System Administrator');
        
        // Create admin profile in Firestore
        const adminProfile = {
          displayName: 'System Administrator',
          email: adminEmail,
          phoneNumber: '+91 9738352239',
          role: 'admin' as const,
          isActive: true,
          createdAt: new Date()
        };
        
        console.log('Creating admin profile in Firestore...');
        await this.firebaseService.createDocument('users', firebaseUser.uid, adminProfile);
        console.log('Admin user created successfully');
      } catch (authError: any) {
        // If user already exists in Firebase Auth, that's fine
        if (authError.code === 'auth/email-already-in-use') {
          console.log('Admin user already exists in Firebase Auth');
          
          // Try to get the user and update Firestore profile if needed
          try {
            const userCredential = await this.firebaseService.signInWithEmail(adminEmail, adminPassword);
            const adminProfile = {
              displayName: 'System Administrator',
              email: adminEmail,
              phoneNumber: '+91 9738352239',
              role: 'admin' as const,
              isActive: true,
              updatedAt: new Date()
            };
            await this.firebaseService.updateDocument('users', userCredential.uid, adminProfile);
            console.log('Admin profile updated in Firestore');
            
            // Sign out after updating profile
            await this.firebaseService.signOutUser();
          } catch (updateError) {
            console.warn('Could not update admin profile:', updateError);
          }
          return;
        }
        throw authError;
      }
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      // Don't throw error to prevent app initialization failure
    }
  }

  // Create owner user (can be called by admin)
  async createOwnerUser(ownerData: { email: string; password: string; displayName: string; phoneNumber: string }): Promise<User> {
    try {
      // Create Firebase auth user
      const firebaseUser = await this.firebaseService.createUserWithEmail(ownerData.email, ownerData.password, ownerData.displayName);
      
      // Create owner profile in Firestore
      const ownerProfile = {
        displayName: ownerData.displayName,
        email: ownerData.email,
        phoneNumber: ownerData.phoneNumber,
        role: 'owner' as const,
        isActive: true
      };
      
      await this.firebaseService.createDocument('users', firebaseUser.uid, ownerProfile);
      
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: ownerData.displayName,
        role: 'owner',
        phoneNumber: ownerData.phoneNumber,
        createdAt: new Date(),
        isEmailVerified: firebaseUser.emailVerified
      };
      
      return user;
    } catch (error) {
      throw error;
    }
  }
}