export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'owner' | 'admin';
  phoneNumber?: string;
  createdAt: Date;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
}