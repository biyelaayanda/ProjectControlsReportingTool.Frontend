import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { SuperAdminService, SystemHealthReport, UserDto } from '../../core/services/super-admin.service';
import { AuthService } from '../../core/services/auth.service';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: UserDto[];
  systemHealth: SystemHealthReport | null;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    RouterModule
  ],
  template: `
    <div class="super-admin-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>
          <mat-icon>admin_panel_settings</mat-icon>
          Super Admin Dashboard
        </h1>
        <p class="subtitle">System Administration & User Management</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading()" class="dashboard-content">
        
        <!-- Quick Stats -->
        <div class="stats-grid">
          <mat-card class="stat-card users-total">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">group</mat-icon>
                <div class="stat-info">
                  <h3>{{ dashboardStats()?.totalUsers || 0 }}</h3>
                  <p>Total Users</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card users-active">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">person</mat-icon>
                <div class="stat-info">
                  <h3>{{ dashboardStats()?.activeUsers || 0 }}</h3>
                  <p>Active Users</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card users-inactive">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">person_off</mat-icon>
                <div class="stat-info">
                  <h3>{{ dashboardStats()?.inactiveUsers || 0 }}</h3>
                  <p>Inactive Users</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card system-health" [ngClass]="getHealthStatusClass()">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">{{ getHealthIcon() }}</mat-icon>
                <div class="stat-info">
                  <h3>{{ dashboardStats()?.systemHealth?.systemStatus || 'Unknown' }}</h3>
                  <p>System Health</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>flash_on</mat-icon>
                Quick Actions
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="actions-grid">
                <button mat-raised-button color="primary" routerLink="/super-admin/users/create">
                  <mat-icon>person_add</mat-icon>
                  Create User
                </button>
                
                <button mat-raised-button color="accent" routerLink="/super-admin/users">
                  <mat-icon>group</mat-icon>
                  Manage Users
                </button>
                
                <button mat-raised-button routerLink="/super-admin/users/bulk">
                  <mat-icon>upload</mat-icon>
                  Bulk Operations
                </button>
                
                <button mat-raised-button routerLink="/super-admin/audit">
                  <mat-icon>assessment</mat-icon>
                  Audit Reports
                </button>
                
                <button mat-raised-button routerLink="/super-admin/system">
                  <mat-icon>settings</mat-icon>
                  System Settings
                </button>
                
                <button mat-raised-button routerLink="/super-admin/help-desk">
                  <mat-icon>support_agent</mat-icon>
                  Help Desk
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Two Column Layout -->
        <div class="two-column-layout">
          
          <!-- Recent Users -->
          <mat-card class="recent-users-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>schedule</mat-icon>
                Recently Created Users
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="recentUsers().length === 0" class="no-data">
                <mat-icon>info</mat-icon>
                <p>No recent users found</p>
              </div>
              
              <div *ngFor="let user of recentUsers()" class="user-item">
                <div class="user-info">
                  <div class="user-name">{{ user.fullName }}</div>
                  <div class="user-details">
                    <mat-chip class="role-chip">{{ user.roleName }}</mat-chip>
                    <span class="department">{{ user.departmentName }}</span>
                  </div>
                </div>
                <div class="user-status">
                  <mat-chip [color]="user.isActive ? 'primary' : 'warn'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </div>
              </div>
              
              <div class="view-all">
                <button mat-button color="primary" routerLink="/super-admin/users">
                  View All Users
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- System Health Details -->
          <mat-card class="system-health-card" *ngIf="dashboardStats()?.systemHealth">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>monitor_heart</mat-icon>
                System Health Details
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="health-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime:</span>
                  <span class="metric-value">{{ formatUptime(dashboardStats()!.systemHealth!.systemUptime) }}</span>
                </div>
                
                <div class="metric">
                  <span class="metric-label">Response Time:</span>
                  <span class="metric-value">{{ dashboardStats()!.systemHealth!.averageResponseTime }}ms</span>
                </div>
                
                <div class="metric">
                  <span class="metric-label">Error Rate:</span>
                  <span class="metric-value">{{ (dashboardStats()!.systemHealth!.errorRate * 100).toFixed(2) }}%</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="feature-health">
                <h4>Feature Health</h4>
                <div *ngFor="let feature of dashboardStats()!.systemHealth!.features" class="feature-item">
                  <span class="feature-name">{{ feature.name }}</span>
                  <mat-chip [ngClass]="'health-' + feature.status.toLowerCase()">
                    {{ feature.status }}
                  </mat-chip>
                </div>
              </div>

              <div class="view-details">
                <button mat-button color="primary" routerLink="/super-admin/system/health">
                  View Detailed Health Report
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .super-admin-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
      
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 2rem;
        font-weight: 500;
        margin: 0;
        color: #1976d2;
        
        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
      }
      
      .subtitle {
        font-size: 1.1rem;
        color: #666;
        margin: 8px 0 0 0;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          font-size: 2.5rem;
          width: 2.5rem;
        height: 2.5rem;
          color: white;
        }
        
        .stat-info {
          h3 {
            font-size: 2rem;
            margin: 0;
            font-weight: 600;
          }
          
          p {
            margin: 4px 0 0 0;
            font-size: 0.9rem;
            opacity: 0.8;
          }
        }
      }
      
      &.users-total {
        background: linear-gradient(135deg, #1976d2, #42a5f5);
        color: white;
      }
      
      &.users-active {
        background: linear-gradient(135deg, #388e3c, #66bb6a);
        color: white;
      }
      
      &.users-inactive {
        background: linear-gradient(135deg, #f57c00, #ffb74d);
        color: white;
      }
      
      &.system-health {
        color: white;
        
        &.health-healthy {
          background: linear-gradient(135deg, #388e3c, #66bb6a);
        }
        
        &.health-warning {
          background: linear-gradient(135deg, #f57c00, #ffb74d);
        }
        
        &.health-critical {
          background: linear-gradient(135deg, #d32f2f, #f44336);
        }
      }
    }

    .quick-actions-section {
      margin-bottom: 32px;
      
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;
        
        button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }

    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      
      @media (max-width: 968px) {
        grid-template-columns: 1fr;
      }
    }

    .recent-users-card, .system-health-card {
      height: fit-content;
    }

    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .user-info {
        .user-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .user-details {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .role-chip {
            font-size: 0.75rem;
          }
          
          .department {
            font-size: 0.8rem;
            color: #666;
          }
        }
      }
    }

    .no-data {
      text-align: center;
      padding: 32px;
      color: #666;
      
      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
      }
    }

    .view-all, .view-details {
      text-align: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .health-metrics {
      .metric {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .metric-label {
          font-weight: 500;
        }
        
        .metric-value {
          color: #666;
        }
      }
    }

    .feature-health {
      margin-top: 16px;
      
      h4 {
        margin: 0 0 12px 0;
        font-weight: 500;
      }
      
      .feature-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .feature-name {
          font-size: 0.9rem;
        }
        
        .health-healthy {
          background-color: #4caf50;
          color: white;
        }
        
        .health-warning {
          background-color: #ff9800;
          color: white;
        }
        
        .health-critical {
          background-color: #f44336;
          color: white;
        }
      }
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  private superAdminService = inject(SuperAdminService);
  private authService = inject(AuthService);

  // Signals
  loading = signal(true);
  dashboardStats = signal<DashboardStats | null>(null);
  
  // Computed values
  recentUsers = computed(() => this.dashboardStats()?.recentUsers || []);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.loading.set(true);
      
      // Load multiple data sources in parallel
      const [usersResult, systemHealth] = await Promise.allSettled([
        this.superAdminService.getUsers({ pageSize: 5, sortBy: 'createdAt', sortDirection: 'desc' }).toPromise(),
        this.superAdminService.getSystemHealth().toPromise()
      ]);

      // Process users data
      const users = usersResult.status === 'fulfilled' ? usersResult.value : null;
      const health = systemHealth.status === 'fulfilled' ? systemHealth.value : null;

      const stats: DashboardStats = {
        totalUsers: users?.totalCount || 0,
        activeUsers: users?.items.filter((u: UserDto) => u.isActive).length || 0,
        inactiveUsers: users?.items.filter((u: UserDto) => !u.isActive).length || 0,
        recentUsers: users?.items || [],
        systemHealth: health || null
      };

      this.dashboardStats.set(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getHealthStatusClass(): string {
    const status = this.dashboardStats()?.systemHealth?.systemStatus;
    return status ? `health-${status.toLowerCase()}` : '';
  }

  getHealthIcon(): string {
    const status = this.dashboardStats()?.systemHealth?.systemStatus;
    switch (status) {
      case 'Healthy': return 'check_circle';
      case 'Warning': return 'warning';
      case 'Critical': return 'error';
      default: return 'help';
    }
  }

  formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
