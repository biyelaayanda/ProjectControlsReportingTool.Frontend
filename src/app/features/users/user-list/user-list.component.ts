import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';

import { UserManagementService, UserDto } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FormsModule
  ],
  template: `
    <div class="user-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>All Users</mat-card-title>
          <mat-card-subtitle>Complete list of system users</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Search Bar -->
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search users</mat-label>
              <input matInput [(ngModel)]="searchTerm" (ngModelChange)="filterUsers()" placeholder="Search by name or email">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Loading Spinner -->
          <div class="loading-container" *ngIf="loading()">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Loading users...</p>
          </div>

          <!-- Users Table -->
          <div class="table-container" *ngIf="!loading()">
            <table mat-table [dataSource]="filteredUsers()" class="users-table">
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <div class="user-name">{{ user.fullName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [color]="getRoleColor(user.role)">
                    {{ user.roleName }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Department Column -->
              <ng-container matColumnDef="department">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let user">{{ user.departmentName }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [color]="user.isActive ? 'primary' : 'warn'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Job Title Column -->
              <ng-container matColumnDef="jobTitle">
                <th mat-header-cell *matHeaderCellDef>Job Title</th>
                <td mat-cell *matCellDef="let user">{{ user.jobTitle || 'N/A' }}</td>
              </ng-container>

              <!-- Last Login Column -->
              <ng-container matColumnDef="lastLogin">
                <th mat-header-cell *matHeaderCellDef>Last Login</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.lastLoginDate | date:'short' }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- No Results -->
          <div class="no-results" *ngIf="!loading() && filteredUsers().length === 0">
            <mat-icon>people_outline</mat-icon>
            <h3>No users found</h3>
            <p>Try adjusting your search criteria</p>
          </div>

          <!-- Stats Summary -->
          <div class="stats-summary" *ngIf="!loading() && allUsers().length > 0">
            <div class="stat">
              <span class="stat-value">{{ allUsers().length }}</span>
              <span class="stat-label">Total Users</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getActiveUsersCount() }}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getInactiveUsersCount() }}</span>
              <span class="stat-label">Inactive</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .search-bar {
      margin-bottom: 24px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      min-width: 700px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 500;
    }

    .user-email {
      font-size: 0.875rem;
      color: #666;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .stats-summary {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 32px;
      padding: 24px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    mat-chip {
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .user-list-container {
        padding: 16px;
      }

      .stats-summary {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserManagementService);

  // Signals for reactive state management
  allUsers = signal<UserDto[]>([]);
  filteredUsers = signal<UserDto[]>([]);
  loading = signal(false);

  // Search functionality
  searchTerm = '';

  // Table configuration
  displayedColumns = ['name', 'role', 'department', 'status', 'jobTitle', 'lastLogin'];

  ngOnInit() {
    this.loadUsers();
  }

  private async loadUsers() {
    this.loading.set(true);
    try {
      const users = await this.userService.getAllUsers().toPromise();
      if (users) {
        this.allUsers.set(users);
        this.filteredUsers.set(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterUsers() {
    const users = this.allUsers();
    if (!this.searchTerm.trim()) {
      this.filteredUsers.set(users);
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.roleName.toLowerCase().includes(searchLower) ||
      user.departmentName.toLowerCase().includes(searchLower)
    );
    
    this.filteredUsers.set(filtered);
  }

  getRoleColor(role: number): string {
    switch (role) {
      case 1: return 'primary';  // General Staff
      case 2: return 'accent';   // Line Manager
      case 3: return 'warn';     // GM
      default: return 'primary';
    }
  }

  getActiveUsersCount(): number {
    return this.allUsers().filter(user => user.isActive).length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers().filter(user => !user.isActive).length;
  }
}
