import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';

import { UserManagementService, UserDto, UserFilterDto, UserAnalyticsDto } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="user-management-container">
      <!-- Header with Analytics Cards -->
      <div class="analytics-header" *ngIf="analytics()">
        <h1>User Management Dashboard</h1>
        <div class="analytics-cards">
          <mat-card class="analytics-card">
            <mat-card-content>
              <div class="metric">
                <span class="metric-value">{{ analytics()!.totalUsers }}</span>
                <span class="metric-label">Total Users</span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="analytics-card">
            <mat-card-content>
              <div class="metric">
                <span class="metric-value">{{ analytics()!.activeUsers }}</span>
                <span class="metric-label">Active Users</span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="analytics-card">
            <mat-card-content>
              <div class="metric">
                <span class="metric-value">{{ analytics()!.newUsersThisMonth }}</span>
                <span class="metric-label">New This Month</span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="analytics-card">
            <mat-card-content>
              <div class="metric">
                <span class="metric-value">{{ analytics()!.recentLogins }}</span>
                <span class="metric-label">Recent Logins</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Main Content -->
      <mat-card class="main-content">
        <!-- Filters and Search -->
        <mat-card-header>
          <mat-card-title>
            <div class="header-actions">
              <span>Users ({{ totalUsers() }})</span>
              <div class="actions">
                <button mat-raised-button color="primary" (click)="openBulkOperations()" 
                        [disabled]="selection.selected.length === 0"
                        [matBadge]="selection.selected.length" 
                        [matBadgeHidden]="selection.selected.length === 0">
                  <mat-icon>settings</mat-icon>
                  Bulk Operations
                </button>
                <button mat-raised-button color="accent" (click)="refreshData()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Filter Form -->
          <form [formGroup]="filterForm" class="filter-form">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <input matInput formControlName="searchTerm" placeholder="Search by name or email">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="null">All Roles</mat-option>
                <mat-option [value]="1">General Staff</mat-option>
                <mat-option [value]="2">Line Manager</mat-option>
                <mat-option [value]="3">GM</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="department">
                <mat-option [value]="null">All Departments</mat-option>
                <mat-option [value]="1">Project Support</mat-option>
                <mat-option [value]="2">Doc Management</mat-option>
                <mat-option [value]="3">QS</mat-option>
                <mat-option [value]="4">Contracts Management</mat-option>
                <mat-option [value]="5">Business Assurance</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="isActive">
                <mat-option [value]="null">All Status</mat-option>
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button type="button" (click)="applyFilters()">
              <mat-icon>filter_list</mat-icon>
              Apply Filters
            </button>

            <button mat-button type="button" (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          </form>

          <!-- Loading Spinner -->
          <div class="loading-container" *ngIf="loading()">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Loading users...</p>
          </div>

          <!-- Users Table -->
          <div class="table-container" *ngIf="!loading()">
            <table mat-table [dataSource]="users()" class="users-table">
              <!-- Checkbox Column -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox (change)="$event ? masterToggle() : null"
                               [checked]="selection.hasValue() && isAllSelected()"
                               [indeterminate]="selection.hasValue() && !isAllSelected()">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let user">
                  <mat-checkbox (click)="$event.stopPropagation()"
                               (change)="$event ? selection.toggle(user) : null"
                               [checked]="selection.isSelected(user)">
                  </mat-checkbox>
                </td>
              </ng-container>

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

              <!-- Last Login Column -->
              <ng-container matColumnDef="lastLogin">
                <th mat-header-cell *matHeaderCellDef>Last Login</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.lastLoginDate | date:'short' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="editUser(user)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="resetPassword(user)">
                      <mat-icon>lock_reset</mat-icon>
                      <span>Reset Password</span>
                    </button>
                    <button mat-menu-item (click)="toggleUserStatus(user)" 
                            [class.warn-action]="user.isActive">
                      <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                      <span>{{ user.isActive ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Paginator -->
            <mat-paginator 
              [length]="totalUsers()"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>

          <!-- No Results -->
          <div class="no-results" *ngIf="!loading() && users().length === 0">
            <mat-icon>people_outline</mat-icon>
            <h3>No users found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .analytics-header h1 {
      margin: 0 0 24px 0;
      color: #1976d2;
      font-weight: 300;
    }

    .analytics-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .analytics-card {
      text-align: center;
    }

    .metric {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 600;
      color: #1976d2;
    }

    .metric-label {
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .main-content {
      margin-top: 0;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .filter-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      align-items: end;
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
      min-width: 800px;
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

    .warn-action {
      color: #f44336 !important;
    }

    mat-chip {
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .user-management-container {
        padding: 16px;
      }

      .analytics-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-form {
        grid-template-columns: 1fr;
      }

      .header-actions {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .actions {
        justify-content: center;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserManagementService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // Signals for reactive state management
  users = signal<UserDto[]>([]);
  loading = signal(false);
  totalUsers = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  analytics = signal<UserAnalyticsDto | null>(null);

  // Selection model for bulk operations
  selection = new SelectionModel<UserDto>(true, []);

  // Table configuration
  displayedColumns = ['select', 'name', 'role', 'department', 'status', 'lastLogin', 'actions'];

  // Filter form
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      role: [null],
      department: [null],
      isActive: [null]
    });
  }

  ngOnInit() {
    this.loadAnalytics();
    this.loadUsers();
    
    // Auto-apply filters on form changes with debounce
    this.filterForm.valueChanges.subscribe(() => {
      setTimeout(() => this.applyFilters(), 300);
    });
  }

  private async loadAnalytics() {
    try {
      const analytics = await this.userService.getUserAnalytics().toPromise();
      this.analytics.set(analytics!);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  private async loadUsers() {
    this.loading.set(true);
    try {
      const filter: UserFilterDto = {
        ...this.filterForm.value,
        pageNumber: this.currentPage() + 1,
        pageSize: this.pageSize(),
        sortBy: 'fullName',
        sortDescending: false
      };

      const result = await this.userService.getFilteredUsers(filter).toPromise();
      if (result) {
        this.users.set(result.items);
        this.totalUsers.set(result.totalCount);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    this.currentPage.set(0);
    this.selection.clear();
    this.loadUsers();
  }

  clearFilters() {
    this.filterForm.reset();
    this.currentPage.set(0);
    this.selection.clear();
    this.loadUsers();
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  refreshData() {
    this.selection.clear();
    this.loadUsers();
    this.loadAnalytics();
  }

  // Selection methods
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.users().length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.users().forEach(user => this.selection.select(user));
  }

  // User actions
  editUser(user: UserDto) {
    this.snackBar.open('Edit user functionality coming soon', 'Close', { duration: 3000 });
  }

  async resetPassword(user: UserDto) {
    if (confirm(`Reset password for ${user.fullName}?`)) {
      try {
        await this.userService.resetUserPassword(user.id).toPromise();
        this.snackBar.open('Password reset email sent', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error resetting password:', error);
        this.snackBar.open('Error resetting password', 'Close', { duration: 3000 });
      }
    }
  }

  async toggleUserStatus(user: UserDto) {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (confirm(`${action} ${user.fullName}?`)) {
      try {
        if (user.isActive) {
          await this.userService.deactivateUser(user.id).toPromise();
        } else {
          // For activation, we'd need to update the user with isActive: true
          const updateData = {
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            phoneNumber: user.phoneNumber,
            jobTitle: user.jobTitle,
            isActive: true
          };
          await this.userService.adminUpdateUser(user.id, updateData).toPromise();
        }
        
        this.loadUsers();
        this.loadAnalytics();
        this.snackBar.open(`User ${action}d successfully`, 'Close', { duration: 3000 });
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        this.snackBar.open(`Error ${action}ing user`, 'Close', { duration: 3000 });
      }
    }
  }

  openBulkOperations() {
    this.snackBar.open('Bulk operations functionality coming soon', 'Close', { duration: 3000 });
  }

  getRoleColor(role: number): string {
    switch (role) {
      case 1: return 'primary';  // General Staff
      case 2: return 'accent';   // Line Manager
      case 3: return 'warn';     // GM
      default: return 'primary';
    }
  }
}
