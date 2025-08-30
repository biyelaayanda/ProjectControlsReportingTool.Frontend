import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

import { ReportsService } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, ReportStatus } from '../../../core/models/enums';

interface ReportStats {
  totalReports: number;
  myReports: number;
  pendingReviews: number;
  draftReports: number;
  publishedReports: number;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  template: `
    <div class="reports-dashboard">
      <div class="dashboard-header">
        <h2>Reports Dashboard</h2>
        <p class="dashboard-subtitle">
          @if (isGeneralStaff()) {
            Overview of your reports and workflow status
          } @else if (isLineManager()) {
            Overview of your team's reports requiring your attention
          } @else if (isGM()) {
            GM overview of all organizational reports
          }
        </p>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading dashboard...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <!-- My Reports Card -->
          @if (isGeneralStaff() || isLineManager()) {
            <mat-card class="stat-card my-reports">
              <mat-card-content>
                <div class="stat-content">
                  <div class="stat-icon">
                    <mat-icon>assignment</mat-icon>
                  </div>
                  <div class="stat-details">
                    <div class="stat-number">{{ stats()?.myReports || 0 }}</div>
                    <div class="stat-label">My Reports</div>
                  </div>
                </div>
                <button mat-button color="primary" (click)="viewMyReports()">
                  View All
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          }

          <!-- Pending Reviews Card -->
          @if (isLineManager() || isGM()) {
            <mat-card class="stat-card pending-reviews">
              <mat-card-content>
                <div class="stat-content">
                  <div class="stat-icon">
                    <mat-icon [matBadge]="stats()?.pendingReviews || 0" matBadgeColor="warn">rate_review</mat-icon>
                  </div>
                  <div class="stat-details">
                    <div class="stat-number">{{ stats()?.pendingReviews || 0 }}</div>
                    <div class="stat-label">Pending Reviews</div>
                  </div>
                </div>
                <button mat-button color="accent" (click)="viewPendingReviews()" [disabled]="!stats()?.pendingReviews">
                  Review Now
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          }

          <!-- Draft Reports Card -->
          <mat-card class="stat-card draft-reports">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>draft</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-number">{{ stats()?.draftReports || 0 }}</div>
                  <div class="stat-label">Draft Reports</div>
                </div>
              </div>
              <button mat-button (click)="viewDraftReports()" [disabled]="!stats()?.draftReports">
                Continue Editing
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Total Reports Card -->
          @if (isGM()) {
            <mat-card class="stat-card total-reports">
              <mat-card-content>
                <div class="stat-content">
                  <div class="stat-icon">
                    <mat-icon>assessment</mat-icon>
                  </div>
                  <div class="stat-details">
                    <div class="stat-number">{{ stats()?.totalReports || 0 }}</div>
                    <div class="stat-label">Total Reports</div>
                  </div>
                </div>
                <button mat-button (click)="viewAllReports()">
                  View All
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          }

          <!-- Completed Reports Card -->
          <mat-card class="stat-card completed-reports">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>verified</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-number">{{ stats()?.publishedReports || 0 }}</div>
                  <div class="stat-label">Completed Reports</div>
                </div>
              </div>
              <button mat-button color="primary" (click)="viewCompletedReports()">
                View Archive
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <button mat-raised-button color="primary" (click)="createNewReport()">
              <mat-icon>add</mat-icon>
              Create New Report
            </button>
            
            @if (isLineManager() || isGM()) {
              <button mat-raised-button color="accent" (click)="viewPendingReviews()" [disabled]="!stats()?.pendingReviews">
                <mat-icon>rate_review</mat-icon>
                Review Reports ({{ stats()?.pendingReviews || 0 }})
              </button>
            }
            
            <button mat-raised-button (click)="viewAllReports()">
              <mat-icon>list</mat-icon>
              View All Reports
            </button>
            
            @if (isGM()) {
              <button mat-raised-button (click)="generateReport()">
                <mat-icon>analytics</mat-icon>
                Generate Analytics
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-dashboard {
      padding: 20px;
    }

    .dashboard-header {
      margin-bottom: 24px;
    }

    .dashboard-header h2 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 1.8rem;
    }

    .dashboard-subtitle {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .stat-icon {
      margin-right: 16px;
    }

    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .stat-details {
      flex: 1;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      margin-top: 4px;
    }

    .stat-card button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Card-specific colors */
    .my-reports .stat-icon mat-icon { color: #4caf50; }
    .pending-reviews .stat-icon mat-icon { color: #ff9800; }
    .draft-reports .stat-icon mat-icon { color: #9e9e9e; }
    .total-reports .stat-icon mat-icon { color: #2196f3; }
    .completed-reports .stat-icon mat-icon { color: #4caf50; }

    .my-reports .stat-number { color: #4caf50; }
    .pending-reviews .stat-number { color: #ff9800; }
    .draft-reports .stat-number { color: #9e9e9e; }
    .total-reports .stat-number { color: #2196f3; }
    .completed-reports .stat-number { color: #4caf50; }

    .quick-actions {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
    }

    .quick-actions h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
    }

    @media (max-width: 768px) {
      .reports-dashboard {
        padding: 12px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .stat-number {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ReportsDashboardComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  stats = signal<ReportStats | null>(null);

  // Computed
  currentUser = computed(() => this.authService.currentUser());
  isGeneralStaff = computed(() => this.currentUser()?.role === UserRole.GeneralStaff);
  isLineManager = computed(() => this.currentUser()?.role === UserRole.LineManager);
  isGM = computed(() => this.currentUser()?.role === UserRole.GM);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.reportsService.getReportStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Navigation methods
  createNewReport() {
    this.router.navigate(['/reports'], { queryParams: { action: 'create' } });
  }

  viewMyReports() {
    this.router.navigate(['/reports'], { queryParams: { filter: 'my-reports' } });
  }

  viewPendingReviews() {
    this.router.navigate(['/reports'], { queryParams: { filter: 'pending-reviews' } });
  }

  viewDraftReports() {
    this.router.navigate(['/reports'], { queryParams: { status: ReportStatus.Draft } });
  }

  viewCompletedReports() {
    this.router.navigate(['/reports'], { queryParams: { status: ReportStatus.Completed } });
  }

  viewAllReports() {
    this.router.navigate(['/reports']);
  }

  generateReport() {
    // TODO: Implement analytics/reporting functionality
    console.log('Generate analytics report');
  }
}
