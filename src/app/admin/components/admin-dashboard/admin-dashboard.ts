import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AdminStats, UserManagement, CreateOwnerData } from '../../models/admin.model';
import { User } from '../../../auth/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  adminStats: AdminStats = {
    totalUsers: 0,
    totalOwners: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyStats: {
      bookings: 0,
      revenue: 0,
      newUsers: 0
    }
  };

  allUsers: UserManagement[] = [];
  filteredUsers: UserManagement[] = [];
  userFilter = 'all';
  isLoadingUsers = true;
  lastUpdated = new Date();

  // Create Owner Modal
  showCreateOwnerModal = false;
  createOwnerForm: FormGroup;
  isCreatingOwner = false;
  createOwnerError = '';
  createOwnerSuccess = '';

  currentUser: User | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.createOwnerForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[\d\s\-\(\)]{10,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAdminData();
  }

  loadAdminData(): void {
    // Load admin stats
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.adminStats = stats;
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
      }
    });

    // Load all users
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.applyUserFilter();
        this.isLoadingUsers = false;
        this.lastUpdated = new Date();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoadingUsers = false;
      }
    });
  }

  applyUserFilter(): void {
    if (this.userFilter === 'all') {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(user => user.role === this.userFilter);
    }
  }

  refreshData(): void {
    this.loadAdminData();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  toggleUserStatus(user: UserManagement): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${user.displayName}?`)) {
      this.adminService.toggleUserStatus(user.id).subscribe({
        next: () => {
          this.loadUsers(); // Refresh the user list
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
          alert('Failed to update user status. Please try again.');
        }
      });
    }
  }

  deleteUser(user: UserManagement): void {
    if (confirm(`Are you sure you want to permanently delete ${user.displayName}? This action cannot be undone.`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers(); // Refresh the user list
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  viewAllUsers(): void {
    this.userFilter = 'all';
    this.applyUserFilter();
  }

  viewOwners(): void {
    this.userFilter = 'owner';
    this.applyUserFilter();
  }

  exportData(): void {
    // Implement data export functionality
    const dataToExport = {
      stats: this.adminStats,
      users: this.allUsers,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `cleancut-admin-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  onCreateOwner(): void {
    if (this.createOwnerForm.valid) {
      this.isCreatingOwner = true;
      this.createOwnerError = '';
      this.createOwnerSuccess = '';

      const ownerData: CreateOwnerData = this.createOwnerForm.value;

      this.adminService.createOwner(ownerData).subscribe({
        next: (newOwner) => {
          this.isCreatingOwner = false;
          this.createOwnerSuccess = `Owner ${newOwner.displayName} created successfully!`;
          this.createOwnerForm.reset();
          this.loadUsers(); // Refresh the user list
          
          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeCreateOwnerModal();
          }, 2000);
        },
        error: (error) => {
          this.isCreatingOwner = false;
          this.createOwnerError = error || 'Failed to create owner. Please try again.';
        }
      });
    }
  }

  closeCreateOwnerModal(): void {
    this.showCreateOwnerModal = false;
    this.createOwnerForm.reset();
    this.createOwnerError = '';
    this.createOwnerSuccess = '';
    this.isCreatingOwner = false;
  }
}