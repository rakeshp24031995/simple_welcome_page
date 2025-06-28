export interface CreateOwnerData {
  email: string;
  displayName: string;
  phoneNumber: string;
  password: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyStats: {
    bookings: number;
    revenue: number;
    newUsers: number;
  };
}

export interface UserManagement {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'owner' | 'admin';
  phoneNumber?: string;
  createdAt: Date;
  isActive: boolean;
  lastLogin?: Date;
}