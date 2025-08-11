import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole, Department } from '../../../core/models/enums';

interface DashboardCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  route?: string;
  description?: string;
}

interface RecentActivity {
  id: number;
  title: string;
  description: string;
  timestamp: Date;
  type: 'report' | 'approval' | 'comment';
  status?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="welcome-section">
        <div class="welcome-header">
          <img src="assets/randwater-logo.png" alt="Rand Water Logo" class="dashboard-logo" />
          <div class="welcome-text">
            <h1>Welcome back, {{ currentUser()?.firstName }}!</h1>
            <p class="welcome-subtitle">
              {{ getRoleDisplayName(currentUser()?.role) }} • {{ getDepartmentDisplayName(currentUser()?.department) }}
            </p>
            <p class="company-subtitle">Rand Water - Project Controls Reporting System</p>
          </div>
        </div>
      </div>

      <!-- Dashboard Cards Grid -->
      <div class="cards-grid">
        @for (card of dashboardCards(); track card.title) {
          <mat-card class="dashboard-card" [ngClass]="'card-' + card.color">
            <mat-card-content>
              <div class="card-header">
                <div class="card-info">
                  <h3>{{ card.title }}</h3>
                  <p class="card-value">{{ card.value }}</p>
                  @if (card.description) {
                    <p class="card-description">{{ card.description }}</p>
                  }
                </div>
                <mat-icon class="card-icon">{{ card.icon }}</mat-icon>
              </div>
              @if (card.route) {
                <div class="card-actions">
                  <button mat-button [routerLink]="card.route" color="primary">
                    View Details
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div class="content-grid">
        <!-- Quick Actions -->
        <mat-card class="quick-actions-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bolt</mat-icon>
              Quick Actions
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="actions-grid">
              @for (action of quickActions(); track action.title) {
                <button 
                  mat-raised-button 
                  [color]="action.color"
                  [routerLink]="action.route"
                  class="action-button"
                >
                  <mat-icon>{{ action.icon }}</mat-icon>
                  {{ action.title }}
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recent Activity -->
        <mat-card class="recent-activity-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Recent Activity
            </mat-card-title>
            <button mat-icon-button routerLink="/activity">
              <mat-icon>more_horiz</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (recentActivities().length > 0) {
              <div class="activity-list">
                @for (activity of recentActivities(); track activity.id) {
                  <div class="activity-item">
                    <div class="activity-icon">
                      <mat-icon [ngClass]="'icon-' + activity.type">
                        {{ getActivityIcon(activity.type) }}
                      </mat-icon>
                    </div>
                    <div class="activity-content">
                      <h4>{{ activity.title }}</h4>
                      <p>{{ activity.description }}</p>
                      <div class="activity-meta">
                        <span class="timestamp">{{ formatTimestamp(activity.timestamp) }}</span>
                        @if (activity.status) {
                          <mat-chip class="status-chip">{{ activity.status }}</mat-chip>
                        }
                      </div>
                    </div>
                  </div>
                  @if (!$last) {
                    <mat-divider></mat-divider>
                  }
                }
              </div>
            } @else {
              <div class="no-activity">
                <mat-icon>inbox</mat-icon>
                <p>No recent activity</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Department Summary (for Line Managers and Executives) -->
      @if (showDepartmentSummary()) {
        <mat-card class="department-summary-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>business</mat-icon>
              Department Summary
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-stats">
              <div class="stat-item">
                <h3>Active Reports</h3>
                <div class="stat-bar">
                  <mat-progress-bar mode="determinate" [value]="75"></mat-progress-bar>
                  <span>15/20</span>
                </div>
              </div>
              <div class="stat-item">
                <h3>Pending Reviews</h3>
                <div class="stat-bar">
                  <mat-progress-bar mode="determinate" [value]="60" color="warn"></mat-progress-bar>
                  <span>6/10</span>
                </div>
              </div>
              <div class="stat-item">
                <h3>Team Members</h3>
                <div class="stat-bar">
                  <mat-progress-bar mode="determinate" [value]="100" color="accent"></mat-progress-bar>
                  <span>12</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .welcome-section {
      margin-bottom: 32px;
      background: linear-gradient(135deg, #2E86AB 0%, #1976d2 100%);
      color: white;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(46, 134, 171, 0.3);
    }

    .welcome-header {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .dashboard-logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      flex-shrink: 0;
    }

    .welcome-text {
      flex: 1;
    }

    .welcome-section h1 {
      font-size: 2.2rem;
      font-weight: 400;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .welcome-subtitle {
      font-size: 1.1rem;
      margin: 0 0 8px 0;
      opacity: 0.9;
    }

    .company-subtitle {
      font-size: 0.95rem;
      margin: 0;
      opacity: 0.8;
      font-weight: 300;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .dashboard-card {
      height: 140px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .dashboard-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      height: 100%;
    }

    .card-info h3 {
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: #666;
    }

    .card-value {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 4px 0;
      color: #333;
    }

    .card-description {
      font-size: 0.75rem;
      color: #888;
      margin: 0;
    }

    .card-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      opacity: 0.7;
    }

    .card-actions {
      margin-top: 16px;
    }

    .card-actions button {
      font-size: 0.875rem;
    }

    .card-primary .card-icon { color: #2E86AB; }
    .card-accent .card-icon { color: #1976d2; }
    .card-warn .card-icon { color: #f44336; }
    .card-success .card-icon { color: #00897b; }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .quick-actions-card mat-card-title,
    .recent-activity-card mat-card-title,
    .department-summary-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      height: auto;
      min-height: 80px;
      font-size: 0.875rem;
    }

    .action-button mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
    }

    .activity-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
    }

    .activity-icon mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .icon-report { color: #1976d2; }
    .icon-approval { color: #4caf50; }
    .icon-comment { color: #ff9800; }

    .activity-content {
      flex: 1;
    }

    .activity-content h4 {
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0 0 4px 0;
      color: #333;
    }

    .activity-content p {
      font-size: 0.875rem;
      color: #666;
      margin: 0 0 8px 0;
    }

    .activity-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #888;
    }

    .status-chip {
      font-size: 0.75rem;
      height: 20px;
    }

    .no-activity {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-activity mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #ddd;
      margin-bottom: 16px;
    }

    .department-summary-card {
      grid-column: 1 / -1;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .stat-item h3 {
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: #666;
    }

    .stat-bar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-bar mat-progress-bar {
      flex: 1;
    }

    .stat-bar span {
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
      min-width: 40px;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
      
      .cards-grid {
        grid-template-columns: 1fr;
      }
      
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
      
      .summary-stats {
        grid-template-columns: 1fr;
      }

      .welcome-header {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .welcome-section {
        padding: 24px 20px;
      }

      .welcome-section h1 {
        font-size: 1.8rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);

  currentUser = computed(() => this.authService.currentUser());
  
  // Sample data - would be replaced with real API calls
  private sampleActivities: RecentActivity[] = [
    {
      id: 1,
      title: 'Monthly Progress Report',
      description: 'Submitted monthly progress report for QS department',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'report',
      status: 'Pending Review'
    },
    {
      id: 2,
      title: 'Budget Analysis Report',
      description: 'Approved budget analysis report from John Smith',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      type: 'approval',
      status: 'Approved'
    },
    {
      id: 3,
      title: 'Project Timeline Update',
      description: 'Added comment on project timeline discrepancies',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'comment'
    }
  ];

  recentActivities = signal<RecentActivity[]>(this.sampleActivities);

  dashboardCards = computed(() => {
    const userRole = this.currentUser()?.role;
    const baseCards: DashboardCard[] = [
      {
        title: 'My Reports',
        value: 8,
        icon: 'description',
        color: 'primary',
        route: '/reports/my-reports',
        description: '3 pending review'
      },
      {
        title: 'Tasks Due',
        value: 4,
        icon: 'task_alt',
        color: 'warn',
        route: '/tasks',
        description: '2 overdue'
      }
    ];

    if (userRole === UserRole.LineManager || userRole === UserRole.Executive) {
      baseCards.push({
        title: 'Pending Reviews',
        value: 6,
        icon: 'rate_review',
        color: 'accent',
        route: '/reports/review',
        description: 'Require your approval'
      });
    }

    if (userRole === UserRole.Executive) {
      baseCards.push({
        title: 'Team Members',
        value: 24,
        icon: 'people',
        color: 'success',
        route: '/users/all',
        description: 'Active users'
      });
    }

    return baseCards;
  });

  quickActions = computed(() => {
    const userRole = this.currentUser()?.role;
    const baseActions = [
      {
        title: 'Create Report',
        icon: 'add_circle',
        route: '/reports/create',
        color: 'primary'
      },
      {
        title: 'View Reports',
        icon: 'folder_open',
        route: '/reports/my-reports',
        color: 'default'
      }
    ];

    if (userRole === UserRole.LineManager || userRole === UserRole.Executive) {
      baseActions.push({
        title: 'Review Reports',
        icon: 'rate_review',
        route: '/reports/review',
        color: 'accent'
      });
    }

    if (userRole === UserRole.Executive) {
      baseActions.push({
        title: 'Analytics',
        icon: 'analytics',
        route: '/analytics',
        color: 'warn'
      });
    }

    return baseActions;
  });

  showDepartmentSummary = computed(() => {
    const userRole = this.currentUser()?.role;
    return userRole === UserRole.LineManager || userRole === UserRole.Executive;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // In a real application, this would make API calls to load:
    // - Recent activities
    // - Report counts
    // - Pending reviews
    // - Department statistics
    console.log('Loading dashboard data for user:', this.currentUser());
  }

  getRoleDisplayName(role?: UserRole): string {
    switch (role) {
      case UserRole.GeneralStaff:
        return 'General Staff';
      case UserRole.LineManager:
        return 'Line Manager';
      case UserRole.Executive:
        return 'Executive';
      default:
        return '';
    }
  }

  getDepartmentDisplayName(department?: Department): string {
    switch (department) {
      case Department.ProjectSupport:
        return 'Project Support';
      case Department.DocManagement:
        return 'Document Management';
      case Department.QS:
        return 'QS';
      case Department.ContractsManagement:
        return 'Contracts Management';
      case Department.BusinessAssurance:
        return 'Business Assurance';
      default:
        return '';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'report':
        return 'description';
      case 'approval':
        return 'check_circle';
      case 'comment':
        return 'comment';
      default:
        return 'info';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }
}
